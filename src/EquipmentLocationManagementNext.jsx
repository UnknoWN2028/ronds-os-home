import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconArrowDown,
  IconArrowUp,
  IconBox,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
  IconCircleCheck,
  IconClipboard,
  IconClipboardPlus,
  IconClipboardText,
  IconCopy,
  IconDeviceCctv,
  IconDeviceFloppy,
  IconDownload,
  IconEdit,
  IconEye,
  IconExternalLink,
  IconFileImport,
  IconFocus2,
  IconFolder,
  IconFolderOpen,
  IconHierarchy3,
  IconHistory,
  IconLayoutList,
  IconMap2,
  IconMapPin,
  IconPhotoUp,
  IconPhoto,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconScissors,
  IconTrash,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import boilerRoomPlan from "./assets/equipment-space-boiler-room-v3.png";
import conveyorCorridorPlan from "./assets/equipment-space-conveyor-corridor-v1.png";
import transferStationPlan from "./assets/equipment-space-transfer-station-v1.png";
import crusherHousePlan from "./assets/equipment-space-crusher-house-v1.png";
import turbineHallPlan from "./assets/equipment-space-turbine-hall-v1.png";
import absorberRoomPlan from "./assets/equipment-space-absorber-room-v1.png";
import electricalRoomPlan from "./assets/equipment-space-electrical-room-v1.png";
import boilerCctvPreview from "./assets/equipment-location-boiler-cctv-v1.png";
import corridorCctvPreview from "./assets/monitor-belt-misalignment.png";
import intrusionEvidence from "./assets/monitor-east-entrance-intrusion.png";
import smokeEvidence from "./assets/monitor-corridor-smoke.png";
import equipmentEvidence from "./assets/monitor-idler-anomaly.png";
import { EquipmentLocationAdministration } from "./EquipmentLocationAdministration.jsx";
import { EquipmentLocationFunctionPanel } from "./EquipmentLocationFunctionPanel.jsx";
import { getCollectionStationCameraPoints } from "./RH830StationManagement.jsx";
import "./equipment-location-next.css";

const STATUS = {
  normal: { label: "正常", color: "#23e6ad" },
  warning: { label: "预警", color: "#ffbc42" },
  alarm: { label: "报警", color: "#ff5c6f" },
  offline: { label: "离线", color: "#6c7f9b" },
};

const FUNCTION_ACTIONS = [
  { id: "analysis", label: "诊断分析", icon: IconActivityHeartbeat },
  { id: "defect", label: "添加缺陷", icon: IconClipboardPlus },
  { id: "records", label: "诊断记录", icon: IconClipboardText },
  { id: "history", label: "设备履历", icon: IconHistory },
  { id: "photos", label: "设备图片", icon: IconPhoto },
];

const metricSeed = (pointId, metric) => [...`${pointId}-${metric}`]
  .reduce((total, character) => total + character.charCodeAt(0), 0);

const getLiveMetricResult = (point, metric, tick) => {
  const seed = metricSeed(point.id, metric);
  const wave = Math.sin((tick + seed % 11) / 2.4);
  const updatedAt = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  const base = { metric, updatedAt, tone: point.status === "alarm" ? "alarm" : "normal" };

  if (/温|热/.test(metric)) {
    const value = (68 + (seed % 170) / 10 + wave * 0.6).toFixed(1);
    return { ...base, type: "value", value, unit: "℃", detail: `较上一时刻 ${wave >= 0 ? "+" : ""}${(wave * 0.4).toFixed(1)}℃`, range: "阈值 95.0℃" };
  }
  if (/仪表|读数|液位|压力/.test(metric)) {
    const value = (-42 + wave * 1.8).toFixed(1);
    return { ...base, type: "image", image: boilerCctvPreview, value: `${value} Pa`, detail: "炉膛负压", confidence: `${(97.2 + (seed % 12) / 10).toFixed(1)}%` };
  }
  if (/人员|闯入|入侵/.test(metric)) {
    return { ...base, type: "image", image: intrusionEvidence, value: "0 人", detail: "未检测到人员闯入", confidence: "98.7%" };
  }
  if (/烟|火/.test(metric)) {
    return { ...base, type: "image", image: smokeEvidence, value: "正常", detail: "未检测到烟火异常", confidence: "97.9%" };
  }
  if (/跑偏|滴漏|异物|积料/.test(metric)) {
    const offset = (1.8 + (seed % 14) / 10 + Math.abs(wave) * 0.3).toFixed(1);
    return { ...base, type: "image", image: corridorCctvPreview, value: `${offset} cm`, detail: "当前偏移量", confidence: "96.8%" };
  }
  if (/设备|状态|异响|声纹/.test(metric)) {
    const value = (42.1 + (seed % 21) / 10 + wave * 0.2).toFixed(1);
    return { ...base, type: "image", image: equipmentEvidence, value: `${value} dB`, detail: "运行声压级正常", confidence: "95.6%" };
  }
  return { ...base, type: "value", value: (76 + (seed % 80) / 10 + wave * 0.3).toFixed(1), unit: "%", detail: "当前指标置信度", range: "状态正常" };
};

const METRICS = [
  "火焰检测",
  "炉膛温度异常",
  "冒烟检测",
  "人员闯入",
  "设备温升异常",
  "异响检测",
  "仪表读数识别",
  "通道占用",
];

const TREE = [
  {
    id: "plant",
    name: "华东电厂",
    type: "plant",
    children: [
      { id: "boiler-room", name: "锅炉房", type: "environment" },
      { id: "boiler-roof", name: "炉顶设备层", type: "environment" },
      { id: "air-preheater-room", name: "空预器设备间", type: "environment" },
      { id: "boiler-aux-room", name: "锅炉辅机间", type: "environment" },
      { id: "turbine-body", name: "汽轮机房", type: "environment" },
      { id: "pump", name: "给水泵房", type: "environment" },
      { id: "belt-corridor", name: "皮带机廊道", type: "environment" },
      { id: "transfer", name: "转运站", type: "environment" },
      { id: "crusher", name: "碎煤机室", type: "environment" },
      { id: "absorber", name: "吸收塔设备间", type: "environment" },
      { id: "electrical-room", name: "电气设备间", type: "environment" },
    ],
  },
];

const LEGACY_INITIAL_POINTS = [
  {
    id: "G1-01",
    cameraId: "CAM-GL-01",
    name: "炉膛出口监控点",
    environmentId: "boiler-room",
    environment: "锅炉房",
    device: "HIKVISION DS-2CD4A26FWD-IZS",
    preset: "预置位 1 · 炉膛出口正视",
    status: "normal",
    x: 48,
    y: 51,
    metrics: ["火焰检测", "炉膛温度异常", "冒烟检测"],
    note: "重点核查炉膛出口火焰形态与温度变化",
  },
  {
    id: "G1-02",
    cameraId: "CAM-GL-02",
    name: "西侧入口监控点",
    environmentId: "boiler-room",
    environment: "锅炉房",
    device: "HIKVISION DS-2CD2T47EWD-L",
    preset: "预置位 2 · 西侧入口",
    status: "alarm",
    x: 18,
    y: 39,
    metrics: ["人员闯入", "通道占用"],
    note: "人员闯入时联动现场巡检任务",
  },
  {
    id: "G1-03",
    cameraId: "CAM-GL-01",
    name: "炉前主视角",
    environmentId: "boiler-room",
    environment: "锅炉房",
    device: "HIKVISION DS-2CD7A47G0",
    preset: "预置位 3 · 炉前全景",
    status: "normal",
    x: 68,
    y: 50,
    metrics: ["人员闯入", "火焰检测"],
    note: "",
  },
  {
    id: "G1-04",
    cameraId: "CAM-GL-03",
    name: "炉前东侧温升点",
    environmentId: "boiler-room",
    environment: "锅炉房",
    device: "HIKVISION DS-2TD2637B",
    preset: "预置位 4 · 东侧设备",
    status: "warning",
    x: 78,
    y: 58,
    metrics: ["设备温升异常"],
    note: "温升预警后核查设备表面温度",
  },
  {
    id: "G1-05",
    cameraId: "CAM-GL-03",
    name: "烟风道顶部监控点",
    environmentId: "air-preheater-room",
    environment: "空预器设备间",
    device: "HIKVISION DS-2CD7A47G0",
    preset: "预置位 5 · 烟风道顶部",
    status: "warning",
    x: 57,
    y: 28,
    metrics: ["冒烟检测"],
    note: "",
  },
  {
    id: "G1-06",
    cameraId: "CAM-GL-04",
    name: "锅炉辅机巡检点",
    environmentId: "boiler-aux-room",
    environment: "锅炉辅机间",
    device: "HIKVISION DS-2CD4A26FWD-IZS",
    preset: "预置位 6 · 辅机全景",
    status: "normal",
    x: 43,
    y: 77,
    metrics: ["异响检测", "设备温升异常"],
    note: "",
  },
  {
    id: "C1-01",
    cameraId: "CAM-SM-01",
    name: "皮带机头监控点",
    environmentId: "belt-corridor",
    environment: "皮带机廊道",
    device: "HIKVISION DS-2CD7A47G0",
    preset: "预置位 1 · 皮带机头",
    status: "normal",
    x: 15,
    y: 51,
    metrics: ["设备温升异常", "冒烟检测"],
    note: "核查驱动滚筒、落煤口与皮带运行状态",
  },
  {
    id: "C1-02",
    cameraId: "CAM-SM-01",
    name: "廊道中段跑偏点",
    environmentId: "belt-corridor",
    environment: "皮带机廊道",
    device: "HIKVISION DS-2CD4A26FWD-IZS",
    preset: "预置位 2 · 廊道中段",
    status: "warning",
    x: 50,
    y: 51,
    metrics: ["通道占用", "冒烟检测"],
    note: "核查皮带跑偏、托辊异常与通道占用",
  },
  {
    id: "C1-03",
    cameraId: "CAM-SM-02",
    name: "皮带机尾监控点",
    environmentId: "belt-corridor",
    environment: "皮带机廊道",
    device: "HIKVISION DS-2CD2T47EWD-L",
    preset: "预置位 3 · 皮带机尾",
    status: "normal",
    x: 84,
    y: 51,
    metrics: ["人员闯入", "冒烟检测"],
    note: "核查机尾积煤与人员闯入",
  },
];

const ENVIRONMENT_NAMES = {
  "boiler-room": "锅炉房",
  "boiler-roof": "炉顶设备层",
  "air-preheater-room": "空预器设备间",
  "boiler-aux-room": "锅炉辅机间",
  "turbine-body": "汽轮机房",
  pump: "给水泵房",
  "belt-corridor": "皮带机廊道",
  transfer: "转运站",
  crusher: "碎煤机室",
  absorber: "吸收塔设备间",
  "electrical-room": "电气设备间",
};

const SPACE_CATALOG_SCOPES = {
  "boiler-room": "锅炉区域",
  "boiler-roof": "锅炉区域",
  "air-preheater-room": "锅炉区域",
  "boiler-aux-room": "锅炉区域",
  "turbine-body": "汽机区域",
  pump: "汽机区域",
  "belt-corridor": "输煤区域",
  transfer: "输煤区域",
  crusher: "输煤区域",
  absorber: "脱硫区域",
  "electrical-room": "电气区域",
};

const COLLECTION_STATION_POINT_DIRECTORY = getCollectionStationCameraPoints();

const POINT_POSITION_SLOTS = [
  { x: 30, y: 38 },
  { x: 48, y: 51 },
  { x: 68, y: 50 },
  { x: 78, y: 58 },
  { x: 42, y: 68 },
  { x: 60, y: 72 },
  { x: 24, y: 58 },
];

const resolvePointSpace = (source) => {
  const label = `${source.stationName}${source.cameraName}${source.pointName}`;
  if (source.region === "锅炉区域") {
    if (/炉顶|汽包/.test(label)) return "boiler-roof";
    if (/空预器/.test(label)) return "air-preheater-room";
    if (/磨煤机|送风机/.test(label)) return "boiler-aux-room";
    return "boiler-room";
  }
  if (source.region === "输煤区域") return /通廊/.test(label) ? "belt-corridor" : "transfer";
  if (source.region === "汽机区域") return "turbine-body";
  if (source.region === "脱硫区域") return "absorber";
  if (source.region === "电气区域") return "electrical-room";
  return "boiler-room";
};

const createSyncedLocationPoints = (existingPoints = []) => {
  const slotIndexBySpace = {};
  return COLLECTION_STATION_POINT_DIRECTORY.map((source) => {
    const existing = existingPoints.find((point) => (point.sourcePointId || point.id) === source.pointId);
    const environmentId = existing?.environmentId || resolvePointSpace(source);
    const slotIndex = slotIndexBySpace[environmentId] || 0;
    slotIndexBySpace[environmentId] = slotIndex + 1;
    const slot = POINT_POSITION_SLOTS[slotIndex % POINT_POSITION_SLOTS.length];
    return {
      id: source.pointId,
      sourcePointId: source.pointId,
      sourceCameraId: source.cameraId,
      sourceStationCode: source.stationCode,
      sourceStationName: source.stationName,
      cameraId: source.cameraId,
      name: source.pointName,
      environmentId,
      environment: ENVIRONMENT_NAMES[environmentId] || environmentId,
      device: `${source.cameraName} · ${source.model}`,
      cameraName: source.cameraName,
      cameraModel: source.model,
      cameraIp: source.ip,
      cameraProtocol: source.protocol,
      preset: source.preset,
      status: source.status === "离线" ? "offline" : source.status === "告警" ? "alarm" : "normal",
      x: Number.isFinite(existing?.x) ? existing.x : slot.x,
      y: Number.isFinite(existing?.y) ? existing.y : slot.y,
      metrics: [...source.algorithms],
      note: existing?.note || `来自采集站管理 · ${source.stationCode} / ${source.stationName}`,
      syncedFromCollectionStation: true,
    };
  });
};

const INITIAL_POINTS = createSyncedLocationPoints();

const LOCATION_DRAFT_KEY = "ronds-equipment-location-draft-v4-collection-station-points";
const LEFT_SIDEBAR_WIDTH_KEY = "ronds-equipment-location-left-sidebar-width-v1";
const LEFT_SIDEBAR_COLLAPSED_KEY = "ronds-equipment-location-left-sidebar-collapsed-v1";
const LEFT_SIDEBAR_MIN_WIDTH = 246;
const LEFT_SIDEBAR_DEFAULT_WIDTH = 320;
const LEFT_SIDEBAR_MAX_WIDTH = 460;
const LEFT_SIDEBAR_COLLAPSED_WIDTH = 46;

const INITIAL_SPACE_PLANS = {
  "boiler-room": { source: boilerRoomPlan, name: "锅炉房俯视设备布置图.png" },
  "belt-corridor": { source: conveyorCorridorPlan, name: "皮带机廊道设备空间图.png" },
  transfer: { source: transferStationPlan, name: "转运站设备平面布置图.png" },
  crusher: { source: crusherHousePlan, name: "碎煤机室设备平面布置图.png" },
  "turbine-body": { source: turbineHallPlan, name: "汽轮机房设备平面布置图.png" },
  absorber: { source: absorberRoomPlan, name: "吸收塔设备间平面布置图.png" },
  "electrical-room": { source: electricalRoomPlan, name: "电气设备间平面布置图.png" },
};

const CAMERA_CATALOG = [
  {
    id: "CAM-GL-01",
    name: "锅炉房炉前云台摄像头",
    model: "HIKVISION DS-2CD4A26FWD-IZS",
    ip: "10.18.11.21",
    status: "normal",
    presets: ["预置位 1 · 炉膛出口正视", "预置位 3 · 炉前全景", "预置位 6 · 燃烧器层"],
  },
  {
    id: "CAM-GL-02",
    name: "锅炉房西门固定摄像头",
    model: "HIKVISION DS-2CD2T47EWD-L",
    ip: "10.18.11.22",
    status: "alarm",
    presets: ["预置位 2 · 西门入口", "预置位 5 · 炉左通道"],
  },
  {
    id: "CAM-GL-03",
    name: "锅炉房红外热成像摄像头",
    model: "HIKVISION DS-2TD2637B",
    ip: "10.18.11.23",
    status: "normal",
    presets: ["预置位 4 · 东侧设备", "预置位 4 · 炉前热成像", "预置位 5 · 烟风道顶部", "预置位 5 · 送风机轴承", "预置位 7 · 炉顶全景"],
  },
  {
    id: "CAM-GL-04",
    name: "锅炉辅机全景摄像头",
    model: "HIKVISION DS-2CD4A26FWD-IZS",
    ip: "10.18.11.24",
    status: "normal",
    presets: ["预置位 6 · 辅机全景", "预置位 1 · 引风机层", "预置位 3 · 空预器出口"],
  },
  {
    id: "CAM-SM-01",
    name: "皮带机廊道云台摄像头",
    model: "HIKVISION DS-2CD7A47G0",
    ip: "10.18.21.31",
    status: "normal",
    presets: ["预置位 1 · 皮带机头", "预置位 2 · 廊道中段", "预置位 3 · 廊道中段", "预置位 5 · 张紧装置"],
  },
  {
    id: "CAM-SM-02",
    name: "皮带机尾固定摄像头",
    model: "HIKVISION DS-2CD2T47EWD-L",
    ip: "10.18.21.32",
    status: "normal",
    presets: ["预置位 3 · 皮带机尾", "预置位 2 · 廊道机尾"],
  },
  {
    id: "CAM-QJ-01",
    name: "汽轮机声学摄像头",
    model: "HIKVISION DS-2CD4A26FWD-IZS",
    ip: "10.18.31.41",
    status: "normal",
    presets: ["预置位 6 · 辅机全景", "预置位 1 · 轴承座"],
  },
];

const AUDIO_VIDEO_POINT_CATALOG = [
  {
    id: "G1-07",
    cameraId: "CAM-GL-03",
    name: "炉顶红外巡检点",
    device: "HIKVISION DS-2TD2637B",
    preset: "预置位 7 · 炉顶全景",
    status: "normal",
    recommendedMetrics: ["设备温升异常", "冒烟检测"],
    note: "核查炉顶受热面、管道保温与异常温升",
  },
  {
    id: "C1-04",
    cameraId: "CAM-SM-01",
    name: "转运站落料口巡检点",
    device: "HIKVISION DS-2CD7A47G0",
    preset: "预置位 1 · 皮带机头",
    status: "normal",
    recommendedMetrics: ["冒烟检测", "人员闯入"],
    note: "核查落料偏载、扬尘与人员闯入",
  },
  {
    id: "T1-01",
    cameraId: "CAM-QJ-01",
    name: "汽轮机轴承箱声学巡检点",
    device: "HIKVISION DS-2CD4A26FWD-IZS",
    preset: "预置位 6 · 辅机全景",
    status: "normal",
    recommendedMetrics: ["异响检测", "设备温升异常"],
    note: "核查轴承箱异响与表面温升",
  },
];

function collectIds(node) {
  if (!node.children) return [node.id];
  return node.children.flatMap(collectIds);
}

function findTreeNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children ? findTreeNode(node.children, id) : null;
    if (found) return found;
  }
  return null;
}

function findTreeParentId(nodes, id, parentId = "") {
  for (const node of nodes) {
    if (node.id === id) return parentId;
    if (node.children) {
      const found = findTreeParentId(node.children, id, node.id);
      if (found) return found;
    }
  }
  return "";
}

function updateTreeNode(nodes, id, updater) {
  return nodes.map((node) => node.id === id
    ? updater(node)
    : node.children
      ? { ...node, children: updateTreeNode(node.children, id, updater) }
      : node);
}

function removeTreeNode(nodes, id) {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => node.children ? { ...node, children: removeTreeNode(node.children, id) } : node);
}

function appendTreeNode(nodes, parentId, child) {
  return nodes.map((node) => {
    if (node.id === parentId) return { ...node, children: [...(node.children || []), child] };
    return node.children ? { ...node, children: appendTreeNode(node.children, parentId, child) } : node;
  });
}

function moveTreeNode(nodes, id, offset) {
  const index = nodes.findIndex((node) => node.id === id);
  if (index >= 0) {
    const target = index + offset;
    if (target < 0 || target >= nodes.length) return nodes;
    const next = [...nodes];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }
  return nodes.map((node) => node.children ? { ...node, children: moveTreeNode(node.children, id, offset) } : node);
}

function cloneTreeBranch(node, suffix) {
  return {
    ...node,
    id: `${node.id}-copy-${suffix}`,
    name: `${node.name} 副本`,
    children: node.children?.map((child) => cloneTreeBranch(child, suffix)),
  };
}

function TreeNode({ node, depth, expanded, points, selectedId, onToggle, onSelect, onPointSelect }) {
  const isOpen = expanded.has(node.id);
  const descendants = new Set(collectIds(node));
  const count = points.filter((point) => descendants.has(point.environmentId)).length;
  const environmentPoints = node.type === "environment"
    ? points.filter((point) => point.environmentId === node.id)
    : [];
  const hasChildren = Boolean(node.children?.length || environmentPoints.length);
  const Icon = node.type === "environment" ? IconMap2 : isOpen ? IconFolderOpen : IconFolder;

  return (
    <div className="eln-tree-branch">
      <button
        type="button"
        className={`eln-tree-row ${selectedId === node.id ? "selected" : ""}`}
        style={{ "--depth": depth }}
        onClick={() => {
          onSelect(node);
          if (node.type !== "environment" && hasChildren && !isOpen) onToggle(node.id);
        }}
      >
        <span className="eln-tree-chevron" onClick={(event) => { event.stopPropagation(); if (hasChildren) onToggle(node.id); }}>
          {hasChildren ? <IconChevronRight size={14} className={isOpen ? "open" : ""} /> : null}
        </span>
        <Icon size={16} />
        <span>{node.name}</span>
        {count > 0 && <em>{count}</em>}
      </button>
      {isOpen && (
        <>
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              points={points}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onPointSelect={onPointSelect}
            />
          ))}
          {environmentPoints.map((point) => (
            <button
              key={point.id}
              type="button"
              className={`eln-point-row ${selectedId === point.id ? "selected" : ""}`}
              style={{ "--depth": depth + 1, "--state": STATUS[point.status].color }}
              onClick={() => onPointSelect(point)}
            >
              <span />
              <IconFocus2 size={15} />
              <span title={point.name}>{point.name}</span>
              <i />
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function Dialog({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div className="eln-dialog-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`eln-dialog ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <span><strong>{title}</strong><small>{subtitle}</small></span>
          <button type="button" onClick={onClose} aria-label="关闭"><IconX size={18} /></button>
        </header>
        <div className="eln-dialog-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
}

export function EquipmentLocationManagementNext() {
  const requestParams = new URLSearchParams(window.location.search);
  const requestedSpace = requestParams.get("space");
  const requestedPoint = INITIAL_POINTS.find((point) => point.id === requestParams.get("point"));
  const initialSpaceId = requestedPoint?.environmentId || (ENVIRONMENT_NAMES[requestedSpace] ? requestedSpace : "boiler-room");
  const initialFunctionAction = FUNCTION_ACTIONS.some((item) => item.id === requestParams.get("panel"))
    ? requestParams.get("panel")
    : "";
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [treeData, setTreeData] = useState(TREE);
  const [customEnvironmentNames, setCustomEnvironmentNames] = useState({});
  const [treeClipboard, setTreeClipboard] = useState(null);
  const [treeDialog, setTreeDialog] = useState("");
  const [treeForm, setTreeForm] = useState({ name: "", parentId: "", mode: "manual", count: 1, model: "TM-BOILER-01" });
  const [selectedId, setSelectedId] = useState(requestedPoint?.id || initialSpaceId);
  const [scopeId, setScopeId] = useState(initialSpaceId);
  const [expanded, setExpanded] = useState(new Set(["plant", "boiler-room", initialSpaceId]));
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [draft, setDraft] = useState(() => requestedPoint
    ? { ...requestedPoint, metrics: [...requestedPoint.metrics] }
    : null);
  const [pageDirty, setPageDirty] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(() => Boolean(window.localStorage.getItem(LOCATION_DRAFT_KEY)));
  const [feedback, setFeedback] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoPoint, setVideoPoint] = useState(null);
  const [videoUpdatedAt, setVideoUpdatedAt] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(Boolean(requestedPoint));
  const [functionAction, setFunctionAction] = useState(initialFunctionAction);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(
    () => window.localStorage.getItem(LEFT_SIDEBAR_COLLAPSED_KEY) === "true",
  );
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    const savedWidth = Number(window.localStorage.getItem(LEFT_SIDEBAR_WIDTH_KEY));
    return Number.isFinite(savedWidth) && savedWidth > 0
      ? Math.min(LEFT_SIDEBAR_MAX_WIDTH, Math.max(LEFT_SIDEBAR_MIN_WIDTH, savedWidth))
      : LEFT_SIDEBAR_DEFAULT_WIDTH;
  });
  const [leftSidebarResizing, setLeftSidebarResizing] = useState(false);
  const [liveMetricTick, setLiveMetricTick] = useState(0);
  const [liveMetricUpdatedAt, setLiveMetricUpdatedAt] = useState(() => new Date().toLocaleTimeString("zh-CN", { hour12: false }));
  const [spacePlans, setSpacePlans] = useState(INITIAL_SPACE_PLANS);
  const [positionEditMode, setPositionEditMode] = useState(false);
  const [draggingPointId, setDraggingPointId] = useState("");
  const uploadRef = useRef(null);
  const positionEditSnapshotRef = useRef(null);
  const pointDragRef = useRef(null);
  const ignoreMarkerClickRef = useRef("");
  const workspaceRef = useRef(null);
  const leftSidebarResizeRef = useRef(null);

  const selectedPoint = points.find((point) => point.id === selectedId) || null;
  const selectedNode = findTreeNode(treeData, selectedId);
  const selectedContextNode = selectedNode || findTreeNode(treeData, scopeId) || treeData[0];
  const organizationSelected = Boolean(selectedNode && selectedNode.type !== "environment");
  const selectedContextIds = new Set(collectIds(selectedContextNode));
  const selectedContextPoints = points.filter((point) => selectedContextIds.has(point.environmentId));
  const formDirty = selectedPoint && JSON.stringify(selectedPoint) !== JSON.stringify(draft);
  const scopeNode = findTreeNode(treeData, scopeId) || treeData[0];
  const scopeIds = new Set(collectIds(scopeNode));
  const scopePoints = points.filter((point) => scopeIds.has(point.environmentId));
  const currentPlan = spacePlans[scopeId] || null;
  const floorPlan = currentPlan?.source || "";
  const floorPlanName = currentPlan?.name || "当前设备空间尚未上传底图";
  const locatedCount = scopePoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).length;
  const unlocatedCount = scopePoints.length - locatedCount;
  const incompleteMetricCount = scopePoints.filter((point) => !point.metrics.length).length;
  const configurationIssues = [
    !currentPlan ? "缺少平面图" : "",
    !scopePoints.length ? "暂无采集站测点" : "",
    unlocatedCount ? `${unlocatedCount} 个测点待定位` : "",
    incompleteMetricCount ? `${incompleteMetricCount} 个测点缺少指标` : "",
  ].filter(Boolean);
  const configurationReady = configurationIssues.length === 0;
  const cameraOptions = useMemo(() => {
    const merged = CAMERA_CATALOG.map((camera) => ({ ...camera, presets: [...camera.presets] }));
    points.forEach((point) => {
      const cameraId = point.cameraId || point.sourceCameraId;
      if (!cameraId || merged.some((camera) => camera.id === cameraId)) return;
      merged.push({
        id: cameraId,
        name: point.cameraName || cameraId,
        model: point.cameraModel || point.device,
        ip: point.cameraIp || "—",
        status: point.status,
        presets: [point.preset],
      });
    });
    return merged;
  }, [points]);
  const selectedCamera = draft
    ? cameraOptions.find((camera) => camera.id === (draft.cameraId || draft.sourceCameraId)) || null
    : null;
  const cameraLinkedPoints = draft?.cameraId
    ? [
      draft,
      ...points.filter((point) => point.id !== draft.id && (point.cameraId || point.sourceCameraId) === draft.cameraId),
    ]
    : [];
  const syncCollectionStationPoints = () => {
    const synced = createSyncedLocationPoints(points);
    setPoints(synced);
    if (selectedPoint) {
      const refreshed = synced.find((point) => point.id === selectedPoint.id);
      setDraft(refreshed ? { ...refreshed, metrics: [...refreshed.metrics] } : null);
      if (!refreshed) {
        setSelectedId(scopeId);
        setInspectorOpen(false);
      }
    }
    setFeedback(`已与采集站管理同步 ${synced.length} 个测点；位置坐标保持不变`);
  };
  const enterPositionEditMode = () => {
    positionEditSnapshotRef.current = {
      points: points.map((point) => ({ ...point, metrics: [...point.metrics] })),
      pageDirty,
    };
    setPositionEditMode(true);
    setInspectorOpen(false);
    setLocating(false);
    setMeasuring(false);
    setDraggingPointId("");
    setFeedback("已进入测点位置修改");
  };

  const savePositionEditMode = () => {
    setPageDirty(true);
    setPositionEditMode(false);
    setLocating(false);
    setMeasuring(false);
    setDraggingPointId("");
    pointDragRef.current = null;
    ignoreMarkerClickRef.current = "";
    positionEditSnapshotRef.current = null;
    setFeedback("测点位置已保存到页面草稿");
  };

  const cancelPositionEditMode = () => {
    const snapshot = positionEditSnapshotRef.current;
    if (snapshot) {
      setPoints(snapshot.points);
      setPageDirty(snapshot.pageDirty);
      const restoredPoint = snapshot.points.find((point) => point.id === selectedId);
      setDraft(restoredPoint ? { ...restoredPoint, metrics: [...restoredPoint.metrics] } : null);
    }
    setPositionEditMode(false);
    setLocating(false);
    setMeasuring(false);
    setDraggingPointId("");
    pointDragRef.current = null;
    ignoreMarkerClickRef.current = "";
    positionEditSnapshotRef.current = null;
    setFeedback("已取消编辑并恢复进入前的测点位置");
  };

  const clearSelectedPointPosition = () => {
    if (!selectedPoint) {
      setFeedback("请先选择需要清除位置的测点");
      return;
    }
    setPoints((current) => current.map((point) => point.id === selectedPoint.id ? { ...point, x: null, y: null } : point));
    setDraft((current) => current?.id === selectedPoint.id ? { ...current, x: null, y: null } : current);
    setLocating(true);
    setFeedback(`${selectedPoint.id} 的位置已清除，请点击平面图重新定位`);
  };

  const updateDraggedPoint = (event, point) => {
    const drag = pointDragRef.current;
    if (!drag || drag.pointId !== point.id || drag.pointerId !== event.pointerId) return null;
    const canvas = event.currentTarget.closest(".eln-canvas");
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, drag.startX + ((event.clientX - drag.startClientX) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, drag.startY + ((event.clientY - drag.startClientY) / rect.height) * 100));
    const moved = drag.moved || Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) >= 3;
    if (!moved) return null;
    const position = { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    pointDragRef.current = { ...drag, lastX: position.x, lastY: position.y, moved: true };
    setPoints((current) => current.map((item) => item.id === point.id ? { ...item, ...position } : item));
    setDraft((current) => current?.id === point.id
      ? { ...current, ...position }
      : { ...point, ...position, metrics: [...point.metrics] });
    return position;
  };

  const startPointDrag = (event, point) => {
    if (!positionEditMode || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic QA events do not establish browser pointer capture.
    }
    pointDragRef.current = {
      pointId: point.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: point.x,
      startY: point.y,
      lastX: point.x,
      lastY: point.y,
      moved: false,
    };
    setSelectedId(point.id);
    setDraft({ ...point, metrics: [...point.metrics] });
    setLocating(false);
    setMeasuring(false);
    setDraggingPointId(point.id);
  };

  const finishPointDrag = (event, point) => {
    const drag = pointDragRef.current;
    if (!drag || drag.pointId !== point.id || drag.pointerId !== event.pointerId) return;
    const latestPosition = updateDraggedPoint(event, point) || { x: drag.lastX, y: drag.lastY };
    if (drag.moved || pointDragRef.current?.moved) {
      setPoints((current) => current.map((item) => item.id === point.id ? { ...item, ...latestPosition } : item));
      setDraft((current) => current?.id === point.id ? { ...current, ...latestPosition } : current);
      ignoreMarkerClickRef.current = point.id;
      setFeedback(`${point.name} 已拖动到 X ${latestPosition.x}% / Y ${latestPosition.y}%`);
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
    pointDragRef.current = null;
    setDraggingPointId("");
  };

  const filteredTree = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return null;
    const nodes = [];
    const visit = (items) => items.forEach((item) => {
      if (item.name.toLowerCase().includes(keyword)) nodes.push(item);
      if (item.children) visit(item.children);
    });
    visit(treeData);
    const matchedPoints = points.filter((point) => `${point.id}${point.name}${point.environment}`.toLowerCase().includes(keyword));
    return { nodes, points: matchedPoints };
  }, [points, search, treeData]);

  useEffect(() => {
    document.documentElement.classList.add("equipment-location-next-active");
    return () => document.documentElement.classList.remove("equipment-location-next-active");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LEFT_SIDEBAR_WIDTH_KEY, String(Math.round(leftSidebarWidth)));
  }, [leftSidebarWidth]);

  useEffect(() => {
    window.localStorage.setItem(LEFT_SIDEBAR_COLLAPSED_KEY, String(leftSidebarCollapsed));
  }, [leftSidebarCollapsed]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(""), 3200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!pageDirty && !formDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [formDirty, pageDirty]);

  useEffect(() => {
    if (!pageDirty) return;
    try {
      const safePlans = Object.fromEntries(Object.entries(spacePlans).map(([id, plan]) => [id, plan.source?.startsWith("data:") ? { name: plan.name, source: "" } : plan]));
      window.localStorage.setItem(LOCATION_DRAFT_KEY, JSON.stringify({ points, treeData, customEnvironmentNames, spacePlans: safePlans, savedAt: new Date().toISOString() }));
      setHasRecovery(true);
    } catch {
      setFeedback("页面草稿过大，底图未能写入本地恢复；请先导出 JSON 配置");
    }
  }, [customEnvironmentNames, pageDirty, points, spacePlans, treeData]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (treeDialog) setTreeDialog("");
      else if (videoOpen) setVideoOpen(false);
      else if (previewOpen) setPreviewOpen(false);
      else if (fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, previewOpen, treeDialog, videoOpen]);

  useEffect(() => {
    if (!inspectorOpen || !draft?.metrics?.length) return undefined;
    setLiveMetricUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    const timer = window.setInterval(() => {
      setLiveMetricTick((current) => current + 1);
      setLiveMetricUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [draft?.id, draft?.metrics?.length, inspectorOpen]);

  const clampLeftSidebarWidth = (width) => (
    Math.min(LEFT_SIDEBAR_MAX_WIDTH, Math.max(LEFT_SIDEBAR_MIN_WIDTH, width))
  );

  const beginLeftSidebarResize = (event) => {
    if (leftSidebarCollapsed || event.button !== 0) return;
    event.preventDefault();
    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    leftSidebarResizeRef.current = {
      pointerId: event.pointerId,
      workspaceLeft: workspaceRect?.left ?? 0,
      latestWidth: leftSidebarWidth,
    };
    setLeftSidebarResizing(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic QA pointer events do not establish browser pointer capture.
    }
  };

  const updateLeftSidebarResize = (event) => {
    const resize = leftSidebarResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const nextWidth = clampLeftSidebarWidth(event.clientX - resize.workspaceLeft);
    resize.latestWidth = nextWidth;
    setLeftSidebarWidth(nextWidth);
  };

  const finishLeftSidebarResize = (event) => {
    const resize = leftSidebarResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    setLeftSidebarResizing(false);
    leftSidebarResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setFeedback(`设备空间栏宽度已调整为 ${Math.round(resize.latestWidth)}px`);
  };

  const resizeLeftSidebarWithKeyboard = (event) => {
    let nextWidth = leftSidebarWidth;
    if (event.key === "ArrowLeft") nextWidth -= 8;
    else if (event.key === "ArrowRight") nextWidth += 8;
    else if (event.key === "Home") nextWidth = LEFT_SIDEBAR_MIN_WIDTH;
    else if (event.key === "End") nextWidth = LEFT_SIDEBAR_MAX_WIDTH;
    else return;
    event.preventDefault();
    setLeftSidebarWidth(clampLeftSidebarWidth(nextWidth));
  };

  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed((current) => {
      const next = !current;
      setFeedback(next ? "设备空间树已收起，空间结构操作栏保持可用" : "设备空间树已展开");
      return next;
    });
  };

  const selectPoint = (point) => {
    if (positionEditMode) {
      setSelectedId(point.id);
      setDraft({ ...point, metrics: [...point.metrics] });
      setInspectorOpen(false);
      setLocating(false);
      setMeasuring(false);
      return;
    }
    if (formDirty && !window.confirm("当前测点修改尚未应用，是否放弃并切换？")) return;
    setSelectedId(point.id);
    setScopeId(point.environmentId);
    setDraft({ ...point, metrics: [...point.metrics] });
    setActiveTab("overview");
    setInspectorOpen(true);
    setLocating(false);
    setMeasuring(false);
  };

  const openCollectionStationPoint = (point) => {
    if (!point?.sourceStationCode || !point?.sourcePointId) {
      setFeedback("当前测点缺少采集站关联信息，暂时无法跳转");
      return;
    }
    if (pageDirty && !window.confirm("当前设备位置存在未保存修改，仍要前往采集站管理吗？")) return;
    const params = new URLSearchParams({
      station: point.sourceStationCode,
      camera: point.sourceCameraId || point.cameraId || "",
      point: point.sourcePointId,
      from: "equipment-location",
    });
    window.history.pushState({}, "", `/collection-stations?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const selectNode = (node) => {
    if (positionEditMode) {
      setFeedback("请先保存或取消测点位置编辑");
      return;
    }
    if (formDirty && !window.confirm("当前测点修改尚未应用，是否放弃并切换？")) return;
    setSelectedId(node.id);
    setDraft(null);
    setInspectorOpen(false);
    setLocating(false);
    setMeasuring(false);
    if (node.type === "environment") {
      setScopeId(node.id);
      setActiveTab("overview");
    } else {
      setActiveTab("positions");
    }
  };

  const savePlatform = () => {
    if (formDirty) {
      setFeedback("请先应用右侧测点修改");
      return;
    }
    setPageDirty(false);
    window.localStorage.removeItem(LOCATION_DRAFT_KEY);
    setHasRecovery(false);
    setFeedback("设备位置配置已保存为平台版本");
  };

  const restoreLocalDraft = () => {
    try {
      const recovery = JSON.parse(window.localStorage.getItem(LOCATION_DRAFT_KEY));
      if (recovery.points) setPoints(createSyncedLocationPoints(recovery.points));
      if (recovery.treeData) setTreeData(recovery.treeData);
      if (recovery.customEnvironmentNames) setCustomEnvironmentNames(recovery.customEnvironmentNames);
      if (recovery.spacePlans) setSpacePlans((current) => ({ ...current, ...recovery.spacePlans }));
      setPageDirty(true);
      setFeedback(`已恢复 ${new Date(recovery.savedAt).toLocaleString("zh-CN")} 的本地草稿`);
    } catch {
      setFeedback("本地草稿损坏，无法恢复；可使用导出的 JSON 配置重新导入");
    }
  };

  const undoAllPageChanges = () => {
    if (!window.confirm("确定撤销设备位置管理当前页面的全部未保存修改？")) return;
    setPoints(INITIAL_POINTS);
    setTreeData(TREE);
    setCustomEnvironmentNames({});
    setSpacePlans(INITIAL_SPACE_PLANS);
    setPageDirty(false);
    window.localStorage.removeItem(LOCATION_DRAFT_KEY);
    setHasRecovery(false);
    setFeedback("已撤销全部页面草稿修改");
  };

  const handleMapClick = (event) => {
    if (!locating || !draft) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(4, Math.min(96, ((event.clientY - rect.top) / rect.height) * 100));
    const nextDraft = {
      ...draft,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    };
    setDraft(nextDraft);
    if (positionEditMode) {
      setPoints((current) => current.map((point) => point.id === nextDraft.id ? { ...nextDraft, metrics: [...nextDraft.metrics] } : point));
    }
    setLocating(false);
    setFeedback(positionEditMode ? `${draft.name} 已重新定位` : `${draft.name} 已重新定位，请应用到页面草稿`);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback("请选择 PNG、JPG、WEBP 或 SVG 平面图");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSpacePlans((current) => ({ ...current, [scopeId]: { source: String(reader.result), name: file.name } }));
      setPageDirty(true);
      setFeedback(`${scopeNode.name}的设备空间图已写入页面草稿`);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const openVideoPreview = (point) => {
    const camera = point
      ? cameraOptions.find((item) => item.id === (point.cameraId || point.sourceCameraId))
      : null;
    if (!point || point.status === "offline" || camera?.status === "offline") {
      setFeedback("当前关联摄像头离线，无法打开实时预览");
      return;
    }
    setVideoPoint({
      ...point,
      device: camera ? `${camera.id} · ${camera.name} · ${camera.model}` : point.device,
    });
    setVideoUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    setVideoOpen(true);
  };

  const openTreeAdd = () => {
    const target = selectedNode && selectedNode.type !== "environment"
      ? selectedNode
      : findTreeNode(treeData, findTreeParentId(treeData, selectedNode?.id || scopeId));
    if (!target) {
      setFeedback("请选择电厂节点后新增设备空间");
      return;
    }
    setTreeForm({ name: "新建设备空间", parentId: target.id, mode: "manual", count: 1, model: "TM-BOILER-01" });
    setTreeDialog("add");
  };

  const openTreeRename = () => {
    const target = selectedNode || findTreeNode(treeData, scopeId);
    if (!target || target.id === "plant") {
      setFeedback("根节点名称由平台组织配置维护");
      return;
    }
    setTreeForm({ name: target.name, parentId: findTreeParentId(treeData, target.id), mode: "manual", count: 1, model: "TM-BOILER-01" });
    setTreeDialog("rename");
  };

  const commitTreeDialog = () => {
    const name = treeForm.name.trim();
    if (!name) {
      setFeedback("设备空间名称不能为空");
      return;
    }
    if (treeDialog === "add") {
      const parent = findTreeNode(treeData, treeForm.parentId);
      const requestedCount = treeForm.mode === "batch" ? Math.max(1, Math.min(50, Number(treeForm.count) || 1)) : 1;
      const baseName = treeForm.mode === "model"
        ? treeForm.model === "TM-COAL-02" ? "输煤廊道模型空间" : treeForm.model === "TM-TURBINE-01" ? "汽轮机房模型空间" : "锅炉房模型空间"
        : name;
      const nextNodes = Array.from({ length: requestedCount }, (_, index) => ({
        id: `space-${Date.now()}-${index}`,
        name: requestedCount > 1 ? `${baseName}-${String(index + 1).padStart(2, "0")}` : baseName,
        type: "environment",
        source: treeForm.mode,
        model: treeForm.mode === "model" ? treeForm.model : undefined,
      }));
      setTreeData((current) => nextNodes.reduce((result, node) => appendTreeNode(result, treeForm.parentId, node), current));
      setCustomEnvironmentNames((current) => ({
        ...current,
        ...Object.fromEntries(nextNodes.map((node) => [node.id, node.name])),
      }));
      setExpanded((current) => new Set([...current, treeForm.parentId]));
      setTreeDialog("");
      setPageDirty(true);
      setFeedback(treeForm.mode === "model" ? `${baseName}已从设备模型创建，测点映射待核对` : `${nextNodes.length} 个设备空间已新增，均使用独立底图`);
      window.setTimeout(() => selectNode(nextNodes[0]), 0);
      return;
    }
    const target = selectedNode || findTreeNode(treeData, scopeId);
    if (!target) return;
    setTreeData((current) => updateTreeNode(current, target.id, (node) => ({ ...node, name })));
    if (target.type === "environment") {
      setCustomEnvironmentNames((current) => ({ ...current, [target.id]: name }));
    }
    setTreeDialog("");
    setFeedback(`${target.name}已重命名为${name}`);
  };

  const copyTreeNode = (mode) => {
    const target = selectedNode || findTreeNode(treeData, scopeId);
    if (!target || target.id === "plant") {
      setFeedback("根节点不支持复制或剪切");
      return;
    }
    setTreeClipboard({ mode, node: target, parentId: findTreeParentId(treeData, target.id) });
    setFeedback(`${target.name}已${mode === "cut" ? "剪切" : "复制"}，请选择目标组织后粘贴`);
  };

  const pasteTreeNode = () => {
    if (!treeClipboard) {
      setFeedback("剪贴板为空，请先复制或剪切节点");
      return;
    }
    const target = selectedNode;
    if (!target || target.type === "environment") {
      setFeedback("请选择电厂节点作为粘贴目标");
      return;
    }
    if (new Set(collectIds(treeClipboard.node)).has(target.id)) {
      setFeedback("不能粘贴到当前节点自身或其下级");
      return;
    }
    if (treeClipboard.mode === "cut") {
      setTreeData((current) => appendTreeNode(removeTreeNode(current, treeClipboard.node.id), target.id, treeClipboard.node));
      setTreeClipboard(null);
      setFeedback(`${treeClipboard.node.name}已移动到${target.name}`);
    } else {
      const clone = cloneTreeBranch(treeClipboard.node, Date.now());
      setTreeData((current) => appendTreeNode(current, target.id, clone));
      setFeedback(`${treeClipboard.node.name}已复制到${target.name}`);
    }
    setExpanded((current) => new Set([...current, target.id]));
  };

  const deleteTreeNode = () => {
    const target = selectedNode || findTreeNode(treeData, scopeId);
    if (!target || target.id === "plant") {
      setFeedback("根节点不支持删除");
      return;
    }
    const descendantIds = new Set(collectIds(target));
    const dependencies = points.filter((point) => descendantIds.has(point.environmentId));
    if (dependencies.length) {
      setFeedback(`${target.name}下存在 ${dependencies.length} 个采集站同步测点，不能直接删除该空间`);
      return;
    }
    if (!window.confirm(`确定删除“${target.name}”及其空下级节点？`)) return;
    const parentId = findTreeParentId(treeData, target.id);
    setTreeData((current) => removeTreeNode(current, target.id));
    const parent = findTreeNode(treeData, parentId);
    if (parent) {
      setSelectedId(parent.id);
      setActiveTab("positions");
    }
    setFeedback(`${target.name}已删除`);
  };

  const downloadConfig = () => {
    const payload = {
      version: "2.1-equipment-spaces",
      exportedAt: new Date().toISOString(),
      spaces: Object.fromEntries(Object.entries(spacePlans).map(([id, plan]) => [id, { name: plan.name }])),
      points,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "设备位置配置.json";
    link.click();
    URL.revokeObjectURL(url);
    setFeedback("设备位置配置已导出");
  };

  return (
    <div className={`equipment-location-next ${fullscreen ? "is-fullscreen" : ""}`}>
      <header className="eln-header">
        <div className="eln-title">
          <span className="eln-title-icon"><IconBox size={20} /></span>
          <span><strong>设备位置管理</strong><small>THERMAL POWER · AUDIO &amp; VIDEO INSPECTION</small></span>
        </div>
        <div className="eln-header-actions">
          <span className={`eln-sync ${formDirty || pageDirty ? "dirty" : ""}`}>
            <i />{formDirty ? "测点修改未应用" : pageDirty ? "页面草稿待保存" : "配置已同步"}
          </span>
          {hasRecovery && !pageDirty && <button type="button" onClick={restoreLocalDraft}><IconHistory size={16} />恢复草稿</button>}
          {(pageDirty || formDirty) && <button type="button" onClick={undoAllPageChanges}><IconRefresh size={16} />撤销全部</button>}
          <button type="button" onClick={() => setPreviewOpen(true)}><IconEye size={16} />位置详情</button>
          <button type="button" onClick={downloadConfig}><IconDownload size={16} />导出</button>
          <button type="button" className="primary" disabled={!pageDirty || formDirty || positionEditMode} onClick={savePlatform}><IconCheck size={16} />保存配置</button>
        </div>
      </header>

      <nav className="eln-tabs" aria-label="设备位置管理视图">
        {organizationSelected ? (
          <>
            <button type="button" className={activeTab === "positions" ? "active" : ""} onClick={() => { setActiveTab("positions"); setInspectorOpen(false); }}>
              <IconLayoutList size={17} />设备位置列表
            </button>
            <button type="button" className={activeTab === "position" ? "active" : ""} onClick={() => { setActiveTab("position"); setInspectorOpen(false); }}>
              <IconMapPin size={17} />位置信息
            </button>
          </>
        ) : (
          <>
            <button type="button" className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
              <IconMap2 size={17} />设备空间图
            </button>
            <button type="button" className={activeTab === "position" ? "active" : ""} onClick={() => {
              if (positionEditMode) return setFeedback("请先保存或取消测点位置编辑");
              setActiveTab("position");
              setInspectorOpen(false);
            }}>
              <IconMapPin size={17} />位置信息
            </button>
            <button type="button" className={activeTab === "binding" ? "active" : ""} onClick={() => {
              if (positionEditMode) return setFeedback("请先保存或取消测点位置编辑");
              setActiveTab("binding");
              setInspectorOpen(false);
            }}>
              <IconLayoutList size={17} />测点清单
            </button>
          </>
        )}
        <span className="eln-context-line">
          <b>{selectedContextNode.name}</b>
          {organizationSelected ? (
            <em>{selectedContextPoints.length} 个下级测点</em>
          ) : (
            <>
              <em>{scopePoints.length} 个测点 · {locatedCount} 个已定位</em>
              <em className={configurationReady ? "ready" : "blocked"}>{configurationReady ? "配置可用" : configurationIssues[0]}</em>
            </>
          )}
        </span>
      </nav>

      <main
        ref={workspaceRef}
        className={`eln-workspace ${rightRailCollapsed ? "right-collapsed" : ""} ${leftSidebarCollapsed ? "left-collapsed" : ""} ${leftSidebarResizing ? "left-resizing" : ""}`}
        style={{ "--eln-left-width": `${leftSidebarCollapsed ? LEFT_SIDEBAR_COLLAPSED_WIDTH : leftSidebarWidth}px` }}
      >
        <aside className={`eln-left ${leftSidebarCollapsed ? "left-collapsed" : ""}`} aria-label="设备空间侧栏">
          <nav className="eln-rail" aria-label="设备空间树维护工具">
            <button type="button" title="新增设备空间" onClick={openTreeAdd}><IconPlus size={17} /></button>
            <button type="button" title="剪切节点" onClick={() => copyTreeNode("cut")}><IconScissors size={17} /></button>
            <button type="button" title="复制节点" onClick={() => copyTreeNode("copy")}><IconCopy size={17} /></button>
            <button type="button" title="粘贴到当前组织" className={treeClipboard ? "ready" : ""} onClick={pasteTreeNode}><IconClipboard size={17} /></button>
            <button type="button" title="编辑节点" onClick={openTreeRename}><IconEdit size={17} /></button>
            <button type="button" title="节点上移" onClick={() => {
              const target = selectedNode || findTreeNode(treeData, scopeId);
              if (!target || target.id === "plant") return setFeedback("当前节点不能上移");
              setTreeData((current) => moveTreeNode(current, target.id, -1));
              setFeedback(`${target.name}已上移`);
            }}><IconArrowUp size={17} /></button>
            <button type="button" title="节点下移" onClick={() => {
              const target = selectedNode || findTreeNode(treeData, scopeId);
              if (!target || target.id === "plant") return setFeedback("当前节点不能下移");
              setTreeData((current) => moveTreeNode(current, target.id, 1));
              setFeedback(`${target.name}已下移`);
            }}><IconArrowDown size={17} /></button>
            <button type="button" title="删除空节点" className="danger" onClick={deleteTreeNode}><IconTrash size={17} /></button>
            <button
              type="button"
              className="eln-left-toggle"
              data-qa="equipment-location-left-toggle"
              onClick={toggleLeftSidebar}
              aria-label={leftSidebarCollapsed ? "展开设备空间树" : "收起设备空间树"}
              aria-controls="equipment-location-space-tree"
              aria-expanded={!leftSidebarCollapsed}
              title={leftSidebarCollapsed ? "展开设备空间树" : "收起设备空间树"}
            >
              {leftSidebarCollapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
            </button>
          </nav>
          <section id="equipment-location-space-tree" className="eln-tree" aria-hidden={leftSidebarCollapsed ? "true" : undefined}>
            <label className="eln-search">
              <IconSearch size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="名称 / 编码" />
              {search && <button type="button" onClick={() => setSearch("")}><IconX size={14} /></button>}
            </label>
            <div className="eln-tree-body">
              {filteredTree ? (
                <div className="eln-search-results">
                  <small>匹配结果 {filteredTree.nodes.length + filteredTree.points.length}</small>
                  {filteredTree.nodes.map((node) => (
                    <button type="button" key={node.id} onClick={() => { selectNode(node); setSearch(""); }}>
                      <IconFolderOpen size={16} /><span>{node.name}<small>{node.type === "environment" ? "设备环境" : "组织范围"}</small></span>
                    </button>
                  ))}
                  {filteredTree.points.map((point) => (
                    <button type="button" key={point.id} onClick={() => { selectPoint(point); setSearch(""); }}>
                      <IconFocus2 size={16} color={STATUS[point.status].color} /><span>{point.name}<small>{point.environment}</small></span>
                    </button>
                  ))}
                  {!filteredTree.nodes.length && !filteredTree.points.length && <p>未找到匹配项</p>}
                </div>
              ) : treeData.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  points={points}
                  selectedId={selectedId}
                  onToggle={(id) => setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  })}
                  onSelect={selectNode}
                  onPointSelect={selectPoint}
                />
              ))}
            </div>
            <footer>{Object.entries(STATUS).map(([key, value]) => <span key={key}><i style={{ "--state": value.color }} />{value.label}</span>)}</footer>
          </section>
        </aside>
        {!leftSidebarCollapsed && (
          <div
            className="eln-left-resizer"
            data-qa="equipment-location-left-resizer"
            role="separator"
            tabIndex={0}
            aria-label="调整设备空间栏宽度"
            aria-orientation="vertical"
            aria-controls="equipment-location-space-tree"
            aria-valuemin={LEFT_SIDEBAR_MIN_WIDTH}
            aria-valuemax={LEFT_SIDEBAR_MAX_WIDTH}
            aria-valuenow={Math.round(leftSidebarWidth)}
            aria-valuetext={`${Math.round(leftSidebarWidth)} 像素`}
            title="左右拖动调整宽度；双击恢复默认宽度"
            onPointerDown={beginLeftSidebarResize}
            onPointerMove={updateLeftSidebarResize}
            onPointerUp={finishLeftSidebarResize}
            onPointerCancel={finishLeftSidebarResize}
            onLostPointerCapture={() => {
              leftSidebarResizeRef.current = null;
              setLeftSidebarResizing(false);
            }}
            onDoubleClick={() => {
              setLeftSidebarWidth(LEFT_SIDEBAR_DEFAULT_WIDTH);
              setFeedback("设备空间栏已恢复默认宽度");
            }}
            onKeyDown={resizeLeftSidebarWithKeyboard}
          />
        )}

        {activeTab === "binding" ? (
          <section className="eln-relations">
            <header>
              <span><strong>{scopeNode.name} · 测点清单</strong><small>查看测点信息与空间定位</small></span>
              <button type="button" className="primary" onClick={syncCollectionStationPoints}><IconRefresh size={16} />刷新同步</button>
            </header>
            <div className="eln-sync-source">
              <span><IconCircleCheck size={16} /><b>测点来源</b>采集站管理</span>
              <em>{scopePoints.length} 个测点 · {locatedCount} 个已定位</em>
            </div>
            <div className="eln-relation-table">
              <div className="eln-relation-head"><span>测点</span><span>采集站</span><span>关联摄像头 / 预置位</span><span>巡检指标</span><span>空间定位</span><span>操作</span></div>
              {scopePoints.map((point) => {
                const camera = cameraOptions.find((item) => item.id === (point.cameraId || point.sourceCameraId));
                return (
                  <div className={`eln-relation-row ${point.status === "alarm" ? "alarm" : ""}`} key={point.id}>
                  <span><i style={{ "--state": STATUS[point.status].color }} /><b>{point.name}</b><small>{point.preset}</small></span>
                  <span><b>{point.sourceStationName}</b><small>{point.sourceStationCode}</small></span>
                  <span><b>{camera ? `${camera.id} · ${camera.name}` : point.device}</b><small>{point.preset}</small></span>
                  <span>{point.metrics.slice(0, 2).map((metric) => <em key={metric}>{metric}</em>)}</span>
                  <span className={Number.isFinite(point.x) ? "located" : "missing"}>{Number.isFinite(point.x) ? `${point.x}% / ${point.y}%` : "待定位"}</span>
                  <span><button type="button" onClick={() => { selectPoint(point); setActiveTab("overview"); }}>查看位置</button></span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : ["positions", "position"].includes(activeTab) ? (
          <EquipmentLocationAdministration
            view={activeTab}
            scopeName={selectedContextNode.name}
            onFeedback={setFeedback}
            onOpenSpace={(spaceId) => {
              const node = findTreeNode(treeData, spaceId);
              if (node) selectNode(node);
            }}
          />
        ) : (
          <>
            <section className="eln-map-panel">
              <div className={`eln-map-viewport ${locating ? "locating" : ""} ${measuring ? "measuring" : ""} ${positionEditMode ? "position-edit" : ""}`}>
                <input ref={uploadRef} hidden type="file" accept="image/*" onChange={handleUpload} />
                <header className="eln-map-commandbar">
                  <span><strong>{scopeNode.name}</strong><small>{floorPlanName}</small></span>
                  <div>
                    <em className={configurationReady ? "ready" : "blocked"}><i />{configurationReady ? "配置可用" : configurationIssues[0]}</em>
                    <button type="button" onClick={syncCollectionStationPoints}><IconRefresh size={15} />同步测点</button>
                    <button type="button" className="primary" onClick={enterPositionEditMode} disabled={positionEditMode}><IconEdit size={15} />编辑位置</button>
                  </div>
                </header>
                {positionEditMode && (
                  <nav className="eln-canvas-rail editing" aria-label="测点位置编辑工具">
                    <button type="button" title="保存测点位置" onClick={savePositionEditMode}><IconDeviceFloppy size={23} /></button>
                    <button type="button" title="清除选中测点位置" onClick={clearSelectedPointPosition}><IconScissors size={23} /></button>
                    <button type="button" title="取消编辑" onClick={cancelPositionEditMode}><IconX size={27} /></button>
                  </nav>
                )}
                {locating && <div className="eln-locate-tip"><IconMapPin size={16} />点击平面图放置 {draft?.name}<button onClick={() => setLocating(false)}>取消</button></div>}
                <div
                  className="eln-canvas-wrap"
                  style={{
                    "--zoom": zoom / 100,
                    "--canvas-vh": `${(177.78 * zoom / 100).toFixed(2)}vh`,
                    "--canvas-offset": `${Math.round(448 * zoom / 100)}px`,
                  }}
                >
                  {floorPlan ? (
                    <div className="eln-canvas" onClick={handleMapClick}>
                      <img src={floorPlan} alt={`${scopeNode.name} 2D 设备空间图`} />
                      {scopePoints.filter((point) => Number.isFinite(point.x)).map((point) => {
                        const rendered = point.id === draft?.id ? draft : point;
                        return (
                          <button
                            type="button"
                            key={point.id}
                            className={`eln-marker ${selectedId === point.id ? "selected" : ""} ${positionEditMode ? "editing" : ""} ${draggingPointId === point.id ? "dragging" : ""}`}
                            style={{ left: `${rendered.x}%`, top: `${rendered.y}%`, "--state": STATUS[point.status].color }}
                            data-source-station={point.sourceStationCode || ""}
                            data-source-camera={point.sourceCameraId || ""}
                            data-point-id={point.id}
                            data-marker-type="measurement-point"
                            data-camera-id={point.cameraId || point.sourceCameraId || ""}
                            aria-grabbed={draggingPointId === point.id}
                            title={positionEditMode ? `${point.name} · 按住拖动，或点击后在图面重新定位` : point.name}
                            onPointerDown={(event) => startPointDrag(event, point)}
                            onPointerMove={(event) => updateDraggedPoint(event, point)}
                            onPointerUp={(event) => finishPointDrag(event, point)}
                            onPointerCancel={(event) => finishPointDrag(event, point)}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (ignoreMarkerClickRef.current === point.id) {
                                ignoreMarkerClickRef.current = "";
                                return;
                              }
                              selectPoint(point);
                              if (positionEditMode) {
                                setDraft({ ...point, metrics: [...point.metrics] });
                                setLocating(true);
                                setFeedback(`已选择 ${point.name}，点击图面重新定位`);
                              }
                            }}
                          >
                            <span><IconFocus2 size={16} /></span><b>{point.name}</b>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="eln-space-empty">
                      <IconPhotoUp size={30} />
                      <strong>{scopeNode.name}尚未配置设备空间图</strong>
                      <span>每个设备空间维护独立底图，不继承其他空间图。</span>
                      <button type="button" onClick={() => uploadRef.current?.click()}><IconPhotoUp size={15} />上传该空间底图</button>
                    </div>
                  )}
                </div>
                <footer className="eln-map-status">
                  <span><b>{zoom}%</b>{scopeNode.name}</span>
                  <span><i className="normal" />{locatedCount} 个已定位<i className="alarm" />{scopePoints.filter((point) => point.status === "alarm").length} 个报警</span>
                  <small>{locating ? "定位模式 · 点击图面完成放置" : positionEditMode ? "编辑模式 · 按住拖动测点，或点击后重新定位" : measuring ? "测量模式 · 点击两个位置计算相对距离" : "点击标记编辑 · Ctrl/⌘ + 滚轮缩放"}</small>
                </footer>
              </div>
            </section>

            <aside className={`eln-inspector ${inspectorOpen ? "open" : ""} ${selectedPoint && draft ? "has-point" : ""}`}>
              <button type="button" className="eln-inspector-close" onClick={() => setInspectorOpen(false)} aria-label="收起位置信息"><IconX size={17} /></button>
              {selectedPoint && draft ? (
                <>
                  <header className="eln-point-head">
                    <span className="eln-point-icon" style={{ "--state": STATUS[draft.status].color }}><IconFocus2 size={22} /></span>
                    <span><strong>{draft.name}</strong><small>{draft.environment} · {draft.preset}</small></span>
                    <em style={{ "--state": STATUS[draft.status].color }}><i />{STATUS[draft.status].label}</em>
                  </header>
                  <div className="eln-inspector-scroll">
                    <section className="eln-form-section">
                      <header>
                        <span><strong>测点信息</strong><small>当前设备与取景上下文</small></span>
                        <button type="button" className="eln-station-link" onClick={() => openCollectionStationPoint(draft)}>
                          <IconExternalLink size={14} />前往采集站管理
                        </button>
                      </header>
                      <article className="eln-source-summary">
                        <header>
                          <span className="eln-source-camera-icon"><IconDeviceCctv size={18} /></span>
                          <span>
                            <strong>{draft.cameraName || "未关联摄像头"}</strong>
                            <small>{draft.cameraModel || "暂无设备型号"}</small>
                          </span>
                          <em className={selectedCamera?.status === "offline" ? "offline" : ""}>
                            <i />{selectedCamera?.status === "offline" ? "离线" : "在线"}
                          </em>
                        </header>
                        <dl>
                          <div><dt>采集站</dt><dd>{draft.sourceStationName || draft.sourceStationCode}</dd></div>
                          <div><dt>设备空间</dt><dd>{draft.environment}</dd></div>
                          <div><dt>预置位</dt><dd>{draft.preset}</dd></div>
                          <div><dt>网络接入</dt><dd>{draft.cameraIp} · {draft.cameraProtocol}</dd></div>
                        </dl>
                      </article>
                      <details className="eln-camera-linkage">
                        <summary>
                          <span><IconHierarchy3 size={15} /><b>同机测点</b><small>共用当前摄像头</small></span>
                          <em>{cameraLinkedPoints.length} 个</em>
                          <IconChevronRight size={15} />
                        </summary>
                        <div>{cameraLinkedPoints.map((point) => (
                          <button
                            type="button"
                            key={point.id}
                            className={point.id === draft.id ? "current" : ""}
                            onClick={() => {
                              if (point.id === draft.id) return;
                              const target = points.find((item) => item.id === point.id);
                              if (target) selectPoint(target);
                            }}
                          ><IconFocus2 size={12} />{point.name}</button>
                        ))}</div>
                      </details>
                    </section>
                    <section className="eln-form-section">
                      <header><span><strong>巡检指标</strong><small>{draft.metrics.length} 项 · 实时更新</small></span><em className="eln-live-metric-time"><i />{liveMetricUpdatedAt}</em></header>
                      <div className="eln-live-metrics">
                        {draft.metrics.length
                          ? draft.metrics.map((metric) => {
                            const result = getLiveMetricResult(draft, metric, liveMetricTick);
                            return (
                              <article className={`eln-live-metric ${result.type} ${result.tone}`} key={metric}>
                                <header><strong>{metric}</strong><span><i />实时</span></header>
                                {result.type === "image" ? (
                                  <div className="eln-live-metric-media">
                                    <img src={result.image} alt={`${draft.name} · ${metric}最新抓拍`} />
                                    <span><b>{result.value}</b><small>{result.detail}</small><em>置信度 {result.confidence}</em></span>
                                  </div>
                                ) : (
                                  <div className="eln-live-metric-value">
                                    <span><b>{result.value}</b><em>{result.unit}</em></span>
                                    <small>{result.detail}</small>
                                    <i>{result.range}</i>
                                  </div>
                                )}
                                <footer><span>{draft.cameraName}</span><time>{liveMetricUpdatedAt}</time></footer>
                              </article>
                            );
                          })
                          : <p>当前测点尚未在采集站管理中配置算法指标</p>}
                      </div>
                    </section>
                  </div>
                  <footer className="eln-inspector-actions">
                    <button type="button" onClick={() => openVideoPreview(draft)}><IconEye size={15} />实时视频</button>
                    <button type="button" className="primary" onClick={() => {
                      enterPositionEditMode();
                      setSelectedId(draft.id);
                      setDraft({ ...draft, metrics: [...draft.metrics] });
                    }}><IconEdit size={15} />编辑位置</button>
                  </footer>
                </>
              ) : (
                <div className="eln-environment-summary">
                  <header><span><IconMap2 size={21} /></span><div><strong>{scopeNode.name}</strong><small>独立设备空间</small></div></header>
                  <section><strong>空间关系概览</strong><dl><div><dt>测点总数</dt><dd>{scopePoints.length}</dd></div><div><dt>已定位</dt><dd>{locatedCount}</dd></div><div><dt>巡检指标</dt><dd>{new Set(scopePoints.flatMap((point) => point.metrics)).size}</dd></div><div><dt>报警测点</dt><dd className="alarm">{scopePoints.filter((point) => point.status === "alarm").length}</dd></div></dl></section>
                  <section><strong>配置状态</strong>{scopePoints.map((point) => <button type="button" key={point.id} onClick={() => selectPoint(point)}><i style={{ "--state": STATUS[point.status].color }} /><span>{point.name}<small>{point.metrics.length} 项指标 · {Number.isFinite(point.x) ? "已定位" : "待定位"}</small></span><IconChevronRight size={15} /></button>)}</section>
                  <footer><button type="button" onClick={syncCollectionStationPoints}><IconRefresh size={16} />刷新采集站测点</button><button type="button" className="primary" onClick={() => setPreviewOpen(true)}><IconEye size={16} />位置详情预览</button></footer>
                </div>
              )}
            </aside>
          </>
        )}

        <aside className={`eln-right-rail ${rightRailCollapsed ? "collapsed" : ""}`} aria-label="设备功能舱">
          <nav className="eln-right-menu">
            {FUNCTION_ACTIONS.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                className={functionAction === id ? "active" : ""}
                onClick={() => setFunctionAction((current) => current === id ? "" : id)}
                aria-pressed={functionAction === id}
              >
                <Icon size={25} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="eln-right-conceal"
            onClick={() => setRightRailCollapsed((current) => !current)}
            aria-label={rightRailCollapsed ? "展开设备功能舱" : "收起设备功能舱"}
            aria-expanded={!rightRailCollapsed}
          >
            <span>{rightRailCollapsed ? "REVEAL" : "CONCEAL"}</span>
            <IconChevronLeft size={15} />
          </button>
        </aside>

        <EquipmentLocationFunctionPanel
          action={functionAction}
          scopeName={scopeNode.name}
          point={draft || selectedPoint}
          onClose={() => setFunctionAction("")}
          onFeedback={setFeedback}
        />
      </main>

      {treeDialog && (
        <Dialog
          title={treeDialog === "add" ? "新增设备空间" : "编辑设备树节点"}
          subtitle={treeDialog === "add" ? "在当前组织下创建设备空间，创建后独立维护底图与测点" : "修改节点名称不会改变已保存的位置编码"}
          onClose={() => setTreeDialog("")}
          footer={<><button type="button" onClick={() => setTreeDialog("")}>取消</button><button type="button" className="primary" onClick={commitTreeDialog}><IconCheck size={16} />{treeDialog === "add" ? "创建并配置" : "保存名称"}</button></>}
        >
          {treeDialog === "add" && <div className="eln-bind-summary"><IconFolderOpen size={22} /><span><strong>{findTreeNode(treeData, treeForm.parentId)?.name}</strong><small>目标父级 · 新空间将在此节点下创建</small></span><em>可创建</em></div>}
          {treeDialog === "add" && <nav className="eln-create-modes"><button type="button" className={treeForm.mode === "manual" ? "active" : ""} onClick={() => setTreeForm({ ...treeForm, mode: "manual", count: 1 })}><IconPlus size={15} /><span><strong>手动创建</strong><small>创建单个设备空间</small></span></button><button type="button" className={treeForm.mode === "batch" ? "active" : ""} onClick={() => setTreeForm({ ...treeForm, mode: "batch", count: 3 })}><IconFileImport size={15} /><span><strong>批量创建</strong><small>按名称连续生成</small></span></button><button type="button" className={treeForm.mode === "model" ? "active" : ""} onClick={() => setTreeForm({ ...treeForm, mode: "model", count: 1 })}><IconBox size={15} /><span><strong>从设备模型创建</strong><small>生成结构与测点映射</small></span></button></nav>}
          {treeDialog === "add" && treeForm.mode === "model" ? <label className="eln-dialog-field"><span>设备模型</span><select value={treeForm.model} onChange={(event) => setTreeForm({ ...treeForm, model: event.target.value })}><option value="TM-BOILER-01">TM-BOILER-01 · 火电锅炉房音视频空间模型</option><option value="TM-COAL-02">TM-COAL-02 · 输煤廊道音视频空间模型</option><option value="TM-TURBINE-01">TM-TURBINE-01 · 汽轮机房音视频空间模型</option></select></label> : <label className="eln-dialog-field"><span>{treeDialog === "add" ? "设备空间名称" : "节点名称"}</span><input className="eln-dialog-input" value={treeForm.name} onChange={(event) => setTreeForm({ ...treeForm, name: event.target.value })} autoFocus /></label>}
          {treeDialog === "add" && treeForm.mode === "batch" && <label className="eln-dialog-field"><span>生成数量（1–50）</span><input className="eln-dialog-input" type="number" min="1" max="50" value={treeForm.count} onChange={(event) => setTreeForm({ ...treeForm, count: event.target.value })} /></label>}
          <p className="eln-dialog-note"><IconAlertTriangle size={15} />{treeDialog === "add" ? "新空间不会继承其他空间底图；创建后上传平面图，系统将自动同步采集站测点。" : "如节点下已有测点，名称修改会保留采集站来源与空间定位。"}</p>
        </Dialog>
      )}

      {previewOpen && (
        <Dialog title={`${scopeNode.name} · 位置详情`} subtitle="空间与指标关系验收视图" onClose={() => setPreviewOpen(false)} wide footer={<button type="button" className="primary" onClick={() => setPreviewOpen(false)}>关闭预览</button>}>
          <div className="eln-preview">
            <div className="eln-preview-map">{floorPlan ? <><img src={floorPlan} alt={`${scopeNode.name}设备空间图`} />{scopePoints.filter((point) => Number.isFinite(point.x)).map((point) => <span key={point.id} style={{ left: `${point.x}%`, top: `${point.y}%`, "--state": STATUS[point.status].color }}><IconFocus2 size={13} />{point.name}</span>)}</> : <div className="eln-space-empty"><IconPhotoUp size={30} /><strong>该设备空间尚未上传底图</strong></div>}</div>
            <aside>{scopePoints.map((point) => {
              const camera = cameraOptions.find((item) => item.id === (point.cameraId || point.sourceCameraId));
              return <div key={point.id}><i style={{ "--state": STATUS[point.status].color }} /><span><strong>{point.name}</strong><small>{camera ? `关联 ${camera.name}` : "未关联摄像头"}</small><em>{point.metrics.join(" / ")}</em></span></div>;
            })}</aside>
          </div>
        </Dialog>
      )}

      {videoOpen && videoPoint && (
        <Dialog
          title={videoPoint.name}
          subtitle={`${videoPoint.device} · ${videoPoint.preset}`}
          onClose={() => setVideoOpen(false)}
          wide
          footer={<><button type="button" onClick={() => setVideoOpen(false)}>关闭</button><button type="button" className="primary" onClick={() => {
            setVideoUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
            setFeedback(`${videoPoint.name}实时画面已刷新`);
          }}><IconRefresh size={15} />刷新画面</button></>}
        >
          <div className="eln-video-preview">
            <div className="eln-video-frame">
              <img src={videoPoint.environmentId === "belt-corridor" ? corridorCctvPreview : boilerCctvPreview} alt={`${videoPoint.name}火电厂实时视频预览`} />
              <span className="eln-live"><i />LIVE</span>
              <span className="eln-video-time">{videoUpdatedAt}</span>
            </div>
            <div className="eln-video-meta">
              <span><small>设备空间</small><strong>{videoPoint.environment}</strong></span>
              <span><small>巡检指标</small><strong>{videoPoint.metrics.join(" / ")}</strong></span>
              <span><small>视频状态</small><strong className="online">在线 · 1080P</strong></span>
            </div>
          </div>
        </Dialog>
      )}

      {feedback && <div className="eln-toast" role="status"><IconCircleCheck size={18} /><span>{feedback}</span><button type="button" onClick={() => setFeedback("")}><IconX size={15} /></button></div>}
    </div>
  );
}
