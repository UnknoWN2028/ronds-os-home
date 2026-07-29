import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconActivityHeartbeat,
  IconArrowBackUp,
  IconArrowsMaximize,
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconCircleDashed,
  IconCirclePlus,
  IconClipboardCheck,
  IconDeviceCctv,
  IconDownload,
  IconEye,
  IconFileImport,
  IconFocus2,
  IconFolder,
  IconFolderOpen,
  IconLayersSubtract,
  IconLayoutList,
  IconMap2,
  IconMapPin,
  IconMinus,
  IconPhotoUp,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconRulerMeasure,
  IconSearch,
  IconSettings,
  IconTrash,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import defaultFloorPlan from "./assets/equipment-location-floorplan.png";
import boilerCctvPreview from "./assets/equipment-location-boiler-cctv-v1.png";
import "./equipment-location.css";

const STATUS_META = {
  normal: { label: "正常", color: "#18a966" },
  warning: { label: "告警", color: "#f59d0c" },
  alarm: { label: "异常", color: "#e54b4b" },
  offline: { label: "离线", color: "#98a2b3" },
};

const LIVE_STATUS_CYCLES = {
  "G1-01": ["normal", "normal", "normal", "normal"],
  "G1-02": ["alarm", "alarm", "warning", "alarm"],
  "G1-03": ["normal", "normal", "normal", "normal"],
  "G1-04": ["warning", "warning", "normal", "warning"],
  "G1-05": ["warning", "normal", "warning", "warning"],
  "G1-06": ["normal", "normal", "normal", "normal"],
  "G1-07": ["offline", "offline", "warning", "offline"],
};

const POINT_CAMERA_VIEWS = {
  "G1-01": { pan: 18, tilt: -8, zoom: 1.4, fov: 56 },
  "G1-02": { pan: -34, tilt: -5, zoom: 1.2, fov: 68 },
  "G1-03": { pan: 118, tilt: -10, zoom: 1.3, fov: 62 },
  "G1-04": { pan: 152, tilt: -14, zoom: 2, fov: 42 },
  "G1-05": { pan: 72, tilt: -18, zoom: 1.8, fov: 48 },
  "G1-06": { pan: -58, tilt: -6, zoom: 1, fov: 72 },
  "G1-07": { pan: -8, tilt: -4, zoom: 1.4, fov: 60 },
};

const INITIAL_REGIONS = [
  { id: "region-boiler-body", environmentId: "boiler-body", name: "锅炉本体", color: "#3b82f6", x: 35, y: 37, width: 32, height: 36 },
  { id: "region-furnace-front", environmentId: "furnace-front", name: "炉前区域", color: "#2dad67", x: 68, y: 37, width: 20, height: 35 },
  { id: "region-flue", environmentId: "flue", name: "烟风道区域", color: "#7b8797", x: 38, y: 12, width: 33, height: 20 },
  { id: "region-boiler-aux", environmentId: "boiler-aux", name: "锅炉辅机区", color: "#d99216", x: 36, y: 74, width: 31, height: 21 },
];

const ENVIRONMENTS = [
  {
    id: "boiler",
    name: "锅炉区域",
    color: "#3b82f6",
    children: [
      { id: "boiler-body", name: "锅炉本体", type: "environment" },
      { id: "furnace-front", name: "炉前区域", type: "environment" },
      { id: "flue", name: "烟风道区域", type: "environment" },
      { id: "boiler-aux", name: "锅炉辅机区", type: "environment" },
    ],
  },
  {
    id: "turbine",
    name: "汽机区域",
    color: "#f59e0b",
    children: [
      { id: "turbine-body", name: "汽轮机本体", type: "environment" },
      { id: "condenser", name: "凝汽器区域", type: "environment" },
      { id: "pump", name: "给水泵区域", type: "environment" },
      { id: "turbine-aux", name: "汽机辅机区", type: "environment" },
    ],
  },
  {
    id: "conveyor",
    name: "输煤区域",
    color: "#16a765",
    children: [
      { id: "coal-yard", name: "煤场区域", type: "environment" },
      { id: "belt-corridor", name: "皮带通廊", type: "environment" },
      { id: "transfer", name: "转运站", type: "environment" },
      { id: "crusher", name: "碎煤机室", type: "environment" },
    ],
  },
];

const INITIAL_POINTS = [
  {
    id: "G1-01",
    name: "炉膛出口监控点",
    environmentId: "boiler-body",
    environment: "锅炉区域 / 锅炉本体",
    camera: "HIKVISION DS-2CD4A26FWD-IZS",
    preset: "预置位1 炉膛出口正视",
    status: "normal",
    x: 46,
    y: 49,
    note: "重点核查炉膛出口火焰形态与温度变化",
    metrics: ["火焰检测", "炉膛温度异常", "冒烟检测"],
  },
  {
    id: "G1-02",
    name: "西侧入口监控点",
    environmentId: "flue",
    environment: "锅炉区域 / 烟风道区域",
    camera: "HIKVISION DS-2CD2T47EWD-L",
    preset: "预置位2 西侧入口",
    status: "alarm",
    x: 18,
    y: 39,
    note: "人员闯入时联动现场巡检任务",
    metrics: ["人员闯入", "通道占用"],
  },
  {
    id: "G1-03",
    name: "炉前主视角",
    environmentId: "furnace-front",
    environment: "锅炉区域 / 炉前区域",
    camera: "DAHUA IPC-HFW5442E-ZE",
    preset: "预置位1 炉前全景",
    status: "normal",
    x: 67,
    y: 49,
    note: "",
    metrics: ["人员闯入", "火焰检测"],
  },
  {
    id: "G1-04",
    name: "炉前东侧温升点",
    environmentId: "furnace-front",
    environment: "锅炉区域 / 炉前区域",
    camera: "HIKVISION DS-2TD2637B",
    preset: "预置位3 东侧设备",
    status: "warning",
    x: 76,
    y: 55,
    note: "温升告警后重点核查东侧设备表面温度",
    metrics: ["表面温度", "设备温升异常"],
  },
  {
    id: "G1-05",
    name: "烟风道顶部监控点",
    environmentId: "flue",
    environment: "锅炉区域 / 烟风道区域",
    camera: "HIKVISION DS-2CD7A47G0",
    preset: "预置位1 烟风道顶部",
    status: "warning",
    x: 55,
    y: 27,
    note: "",
    metrics: ["冒烟检测", "积灰识别"],
  },
  {
    id: "G1-06",
    name: "锅炉辅机巡检点",
    environmentId: "boiler-aux",
    environment: "锅炉区域 / 锅炉辅机区",
    camera: "DAHUA IPC-HDBW5442R",
    preset: "预置位2 辅机全景",
    status: "normal",
    x: 42,
    y: 76,
    note: "",
    metrics: ["设备运行状态", "异响检测"],
  },
];

const METRICS = [
  { name: "火焰检测", group: "视觉算法" },
  { name: "炉膛温度异常", group: "温度算法" },
  { name: "冒烟检测", group: "视觉算法" },
  { name: "人员闯入", group: "视觉算法" },
  { name: "通道占用", group: "视觉算法" },
  { name: "表面温度", group: "温度算法" },
  { name: "设备温升异常", group: "温度算法" },
  { name: "积灰识别", group: "视觉算法" },
  { name: "设备运行状态", group: "状态识别" },
  { name: "异响检测", group: "音频算法" },
];

const METRIC_RUNTIME_META = {
  normal: { label: "正常", color: "#168a58" },
  warning: { label: "预警", color: "#d98200" },
  alarm: { label: "报警", color: "#d94747" },
  offline: { label: "离线", color: "#8d98a8" },
  pending: { label: "待采集", color: "#7b8797" },
};

const POINT_METRIC_RUNTIME = {
  "G1-01": {
    火焰检测: "normal",
    炉膛温度异常: "normal",
    冒烟检测: "normal",
  },
  "G1-02": {
    人员闯入: "alarm",
    通道占用: "normal",
  },
  "G1-03": {
    人员闯入: "normal",
    火焰检测: "normal",
  },
  "G1-04": {
    表面温度: "warning",
    设备温升异常: "warning",
  },
  "G1-05": {
    冒烟检测: "normal",
    积灰识别: "warning",
  },
  "G1-06": {
    设备运行状态: "normal",
    异响检测: "normal",
  },
};

const AUDIO_VIDEO_DEVICES = [
  { model: "HIKVISION DS-2CD4A26FWD-IZS", presets: ["预置位1 炉膛出口正视", "预置位1 炉前全景"] },
  { model: "HIKVISION DS-2CD2T47EWD-L", presets: ["预置位2 西侧入口"] },
  { model: "HIKVISION DS-2CD7A47G0", presets: ["预置位1 烟风道顶部"] },
  { model: "HIKVISION DS-2TD2637B", presets: ["预置位1 炉膛出口正视", "预置位2 西侧入口"] },
  { model: "DAHUA IPC-HFW5442E-ZE", presets: ["预置位3 东侧设备"] },
  { model: "DAHUA IPC-HDBW5442R", presets: ["预置位2 辅机全景"] },
];

const PAGE_DRAFT_STORAGE_KEY = "ronds-equipment-location-page-draft";
const PAGE_DRAFT_VERSION = "1.0";
const MAX_PERSISTED_PLAN_BYTES = 2_600_000;

const ENVIRONMENT_OPTIONS = ENVIRONMENTS.flatMap((group) => group.children.map((environment) => ({
  id: environment.id,
  name: environment.name,
  path: `${group.name} / ${environment.name}`,
})));

const SEARCHABLE_ENVIRONMENTS = [
  {
    id: "plant",
    name: "华东电厂",
    type: "plant",
    kindLabel: "电厂",
    path: "华东电厂",
    color: "#5b7fa6",
    children: [{
      id: "production",
      name: "生产区域",
      type: "region",
      color: "#4a9a74",
      children: ENVIRONMENTS,
    }],
  },
  {
    id: "production",
    name: "生产区域",
    type: "region",
    kindLabel: "区域",
    path: "华东电厂 / 生产区域",
    color: "#4a9a74",
    children: ENVIRONMENTS,
  },
  ...ENVIRONMENTS.flatMap((group) => [
    {
      ...group,
      type: "area",
      kindLabel: "区域",
      path: `华东电厂 / 生产区域 / ${group.name}`,
    },
    ...group.children.map((environment) => ({
      ...environment,
      kindLabel: "设备环境",
      path: `华东电厂 / 生产区域 / ${group.name} / ${environment.name}`,
      color: group.color,
    })),
  ]),
];

const AUDIO_VIDEO_POINT_CATALOG = [
  ...INITIAL_POINTS.map((point) => ({
    id: point.id,
    name: point.name,
    camera: point.camera,
    preset: point.preset,
    status: point.status,
    recommendedMetrics: point.metrics,
  })),
  {
    id: "G1-07",
    name: "炉膛燃烧声学测点",
    camera: "HIKVISION DS-2CD4A26FWD-IZS",
    preset: "预置位1 炉膛出口正视",
    status: "normal",
    recommendedMetrics: ["火焰检测", "异响检测"],
  },
  {
    id: "G1-08",
    name: "给水泵音视频测点",
    camera: "DAHUA IPC-HFW5442E-ZE",
    preset: "预置位3 东侧设备",
    status: "normal",
    recommendedMetrics: ["设备运行状态", "异响检测"],
  },
  {
    id: "G1-09",
    name: "烟道温升巡检测点",
    camera: "HIKVISION DS-2TD2637B",
    preset: "预置位2 西侧入口",
    status: "offline",
    recommendedMetrics: ["表面温度", "设备温升异常", "冒烟检测"],
  },
];

function pointStatus(point) {
  return STATUS_META[point.status] || STATUS_META.offline;
}

function metricRuntimeStatus(point, metricName) {
  const key = point?.status === "offline"
    ? "offline"
    : POINT_METRIC_RUNTIME[point?.id]?.[metricName] || "pending";
  return { key, ...METRIC_RUNTIME_META[key] };
}

function descendantEnvironmentIds(item) {
  if (!item.children?.length) return [item.id];
  return item.children.flatMap(descendantEnvironmentIds);
}

function aggregateTreeStatus(item, points) {
  const ids = new Set(descendantEnvironmentIds(item));
  const statuses = points.filter((point) => ids.has(point.environmentId)).map((point) => point.status);
  if (!statuses.length) return null;
  if (statuses.includes("alarm")) return STATUS_META.alarm;
  if (statuses.includes("warning")) return STATUS_META.warning;
  if (statuses.every((status) => status === "offline")) return STATUS_META.offline;
  return STATUS_META.normal;
}

function normalizePoints(points) {
  return points.map((point) => {
    const { enabled, routeOrder, dwell, ...locationPoint } = point;
    const fallbackView = POINT_CAMERA_VIEWS[point.id] || { pan: 0, tilt: 0, zoom: 1, fov: 60 };
    const rawView = point.cameraView && typeof point.cameraView === "object" ? point.cameraView : {};
    return {
      ...locationPoint,
      metrics: Array.isArray(point.metrics) ? point.metrics : [],
      cameraView: {
        pan: Number.isFinite(Number(rawView.pan)) ? Math.max(-180, Math.min(180, Number(rawView.pan))) : fallbackView.pan,
        tilt: Number.isFinite(Number(rawView.tilt)) ? Math.max(-45, Math.min(45, Number(rawView.tilt))) : fallbackView.tilt,
        zoom: Number.isFinite(Number(rawView.zoom)) ? Math.max(1, Math.min(20, Number(rawView.zoom))) : fallbackView.zoom,
        fov: Number.isFinite(Number(rawView.fov)) ? Math.max(20, Math.min(120, Number(rawView.fov))) : fallbackView.fov,
      },
    };
  });
}

function normalizeRegions(regions) {
  const source = Array.isArray(regions) && regions.length ? regions : INITIAL_REGIONS;
  return source
    .filter((region) => region && ENVIRONMENT_OPTIONS.some((environment) => environment.id === region.environmentId))
    .map((region, index) => ({
      id: String(region.id || `region-${region.environmentId}-${index + 1}`),
      environmentId: String(region.environmentId),
      name: String(region.name || ENVIRONMENT_OPTIONS.find((item) => item.id === region.environmentId)?.name || "未命名区域"),
      color: /^#[0-9a-f]{6}$/i.test(String(region.color || "")) ? String(region.color) : "#3b82f6",
      x: Math.max(0, Math.min(97, Number(region.x) || 0)),
      y: Math.max(0, Math.min(97, Number(region.y) || 0)),
      width: Math.max(3, Math.min(100 - (Number(region.x) || 0), Number(region.width) || 20)),
      height: Math.max(3, Math.min(100 - (Number(region.y) || 0), Number(region.height) || 20)),
    }));
}

function validateImportedConfiguration(payload, fileName) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("配置文件内容无效");
  }
  if (!Array.isArray(payload.points) || !payload.points.length) {
    throw new Error("配置文件中没有可导入的音视频测点");
  }
  if (payload.points.length > 500) {
    throw new Error("单次最多导入 500 个测点");
  }

  const validEnvironmentIds = new Set(ENVIRONMENT_OPTIONS.map((item) => item.id));
  const validMetrics = new Set(METRICS.map((item) => item.name));
  const validDevices = new Map(AUDIO_VIDEO_DEVICES.map((device) => [device.model, new Set(device.presets)]));
  const validStatuses = new Set(Object.keys(STATUS_META));
  const seenIds = new Set();
  const importedPoints = payload.points.map((rawPoint, index) => {
    const row = index + 1;
    if (!rawPoint || typeof rawPoint !== "object" || Array.isArray(rawPoint)) {
      throw new Error(`第 ${row} 个测点的数据结构无效`);
    }
    const id = String(rawPoint.id || "").trim();
    const name = String(rawPoint.name || "").trim();
    const camera = String(rawPoint.camera || "").trim();
    const preset = String(rawPoint.preset || "").trim();
    const environmentId = String(rawPoint.environmentId || "").trim();
    if (!id) throw new Error(`第 ${row} 个测点缺少测点编号`);
    if (seenIds.has(id)) throw new Error(`测点编号 ${id} 重复`);
    seenIds.add(id);
    if (!name) throw new Error(`${id} 缺少测点名称`);
    if (!validEnvironmentIds.has(environmentId)) throw new Error(`${id} 的所属环境不存在`);
    if (!camera) throw new Error(`${id} 缺少音视频设备`);
    if (!preset) throw new Error(`${id} 缺少预置位`);
    if (!validDevices.has(camera)) throw new Error(`${id} 绑定的音视频设备未接入`);
    if (!validDevices.get(camera).has(preset)) throw new Error(`${id} 的预置位不属于所选音视频设备`);

    const metrics = Array.isArray(rawPoint.metrics)
      ? [...new Set(rawPoint.metrics.map((metric) => String(metric).trim()).filter(Boolean))]
      : [];
    if (!metrics.length) throw new Error(`${id} 至少需要一个巡检指标`);
    const unknownMetric = metrics.find((metric) => !validMetrics.has(metric));
    if (unknownMetric) throw new Error(`${id} 包含未接入的指标“${unknownMetric}”`);

    const hasX = rawPoint.x !== null && rawPoint.x !== undefined && rawPoint.x !== "";
    const hasY = rawPoint.y !== null && rawPoint.y !== undefined && rawPoint.y !== "";
    if (hasX !== hasY) throw new Error(`${id} 的平面图坐标不完整`);
    const x = hasX ? Number(rawPoint.x) : null;
    const y = hasY ? Number(rawPoint.y) : null;
    if (hasX && (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100)) {
      throw new Error(`${id} 的平面图坐标应在 0–100 之间`);
    }

    const environment = ENVIRONMENT_OPTIONS.find((item) => item.id === environmentId);
    const rawView = rawPoint.cameraView && typeof rawPoint.cameraView === "object" ? rawPoint.cameraView : {};
    const fallbackView = POINT_CAMERA_VIEWS[id] || { pan: 0, tilt: 0, zoom: 1, fov: 60 };
    const cameraView = {
      pan: rawView.pan === undefined ? fallbackView.pan : Number(rawView.pan),
      tilt: rawView.tilt === undefined ? fallbackView.tilt : Number(rawView.tilt),
      zoom: rawView.zoom === undefined ? fallbackView.zoom : Number(rawView.zoom),
      fov: rawView.fov === undefined ? fallbackView.fov : Number(rawView.fov),
    };
    if (!Number.isFinite(cameraView.pan) || cameraView.pan < -180 || cameraView.pan > 180) {
      throw new Error(`${id} 的水平角应在 -180°–180° 之间`);
    }
    if (!Number.isFinite(cameraView.tilt) || cameraView.tilt < -45 || cameraView.tilt > 45) {
      throw new Error(`${id} 的俯仰角应在 -45°–45° 之间`);
    }
    if (!Number.isFinite(cameraView.zoom) || cameraView.zoom < 1 || cameraView.zoom > 20) {
      throw new Error(`${id} 的变焦倍数应在 1×–20× 之间`);
    }
    if (!Number.isFinite(cameraView.fov) || cameraView.fov < 20 || cameraView.fov > 120) {
      throw new Error(`${id} 的视场角应在 20°–120° 之间`);
    }
    return {
      id,
      name,
      environmentId,
      environment: environment.path,
      camera,
      preset,
      status: validStatuses.has(rawPoint.status) ? rawPoint.status : "offline",
      x: hasX ? Number(x.toFixed(2)) : null,
      y: hasY ? Number(y.toFixed(2)) : null,
      note: String(rawPoint.note || "").trim(),
      metrics,
      cameraView,
    };
  });

  return {
    fileName,
    version: String(payload.version || "未标注版本"),
    points: normalizePoints(importedPoints),
    locatedCount: importedPoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).length,
    environmentCount: new Set(importedPoints.map((point) => point.environmentId)).size,
    metricCount: new Set(importedPoints.flatMap((point) => point.metrics)).size,
  };
}

function loadStoredPoints() {
  try {
    const saved = JSON.parse(window.localStorage.getItem("ronds-equipment-location-points"));
    return normalizePoints(Array.isArray(saved) && saved.length ? saved : INITIAL_POINTS);
  } catch {
    return normalizePoints(INITIAL_POINTS);
  }
}

function loadStoredFloorPlan() {
  try {
    return {
      source: window.localStorage.getItem("ronds-equipment-location-floorplan") || defaultFloorPlan,
      name: window.localStorage.getItem("ronds-equipment-location-floorplan-name") || "锅炉区域总貌图.png",
    };
  } catch {
    return { source: defaultFloorPlan, name: "锅炉区域总貌图.png" };
  }
}

function loadStoredRegions() {
  try {
    const saved = JSON.parse(window.localStorage.getItem("ronds-equipment-location-regions"));
    return normalizeRegions(saved);
  } catch {
    return normalizeRegions(INITIAL_REGIONS);
  }
}

function estimateDataUrlBytes(source) {
  if (typeof source !== "string" || !source.startsWith("data:")) return 0;
  const payload = source.slice(source.indexOf(",") + 1);
  return Math.max(0, Math.floor((payload.length * 3) / 4) - (payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0));
}

function loadStoredPageDraft() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PAGE_DRAFT_STORAGE_KEY));
    if (!saved || saved.version !== PAGE_DRAFT_VERSION || !Array.isArray(saved.points)) return null;
    return {
      ...saved,
      points: normalizePoints(saved.points),
      regions: normalizeRegions(saved.regions),
      updatedAt: typeof saved.updatedAt === "string" ? saved.updatedAt : "",
      floorPlanName: String(saved.floorPlanName || "锅炉区域总貌图.png"),
      floorPlanSource: typeof saved.floorPlanSource === "string" ? saved.floorPlanSource : null,
      floorPlanRestorable: saved.floorPlanRestorable !== false,
    };
  } catch {
    return null;
  }
}

function clearStoredPageDraft() {
  try {
    window.localStorage.removeItem(PAGE_DRAFT_STORAGE_KEY);
  } catch {
    // Draft cleanup is best-effort when storage is unavailable.
  }
}

function persistPageDraft(points, regions, floorPlan, floorPlanName) {
  const planBytes = estimateDataUrlBytes(floorPlan);
  const floorPlanRestorable = !floorPlan.startsWith("data:") || planBytes <= MAX_PERSISTED_PLAN_BYTES;
  const savedFloorPlan = window.localStorage.getItem("ronds-equipment-location-floorplan");
  const floorPlanSource = floorPlanRestorable && savedFloorPlan !== floorPlan ? floorPlan : null;
  const payload = {
    version: PAGE_DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
    points: normalizePoints(points),
    regions: normalizeRegions(regions),
    floorPlanName,
    floorPlanSource,
    floorPlanRestorable,
  };
  window.localStorage.setItem(PAGE_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  return { floorPlanRestorable, planBytes };
}

function environmentScope(environmentId) {
  if (environmentId === "plant" || environmentId === "production") {
    return {
      id: environmentId,
      name: environmentId === "plant" ? "华东电厂" : "生产区域",
      path: environmentId === "plant" ? "华东电厂" : "华东电厂 / 生产区域",
      ids: ENVIRONMENT_OPTIONS.map((item) => item.id),
    };
  }
  const group = ENVIRONMENTS.find((item) => item.id === environmentId);
  if (group) {
    return {
      id: group.id,
      name: group.name,
      path: `华东电厂 / 生产区域 / ${group.name}`,
      ids: group.children.map((item) => item.id),
    };
  }
  const environment = ENVIRONMENT_OPTIONS.find((item) => item.id === environmentId) || ENVIRONMENT_OPTIONS[0];
  return {
    id: environment.id,
    name: environment.name,
    path: `华东电厂 / 生产区域 / ${environment.path}`,
    ids: [environment.id],
  };
}

function buildConfigurationChecks(points, floorPlan, regions = INITIAL_REGIONS) {
  const unlocated = points.filter((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y));
  const missingMetrics = points.filter((point) => !point.metrics?.length);
  const uncovered = ENVIRONMENT_OPTIONS.filter((environment) => !points.some((point) => point.environmentId === environment.id));
  const offline = points.filter((point) => point.status === "offline");
  const missingRegions = [...new Set(points.map((point) => point.environmentId))]
    .filter((environmentId) => !regions.some((region) => region.environmentId === environmentId));
  return [
    {
      id: "plan",
      label: "区域平面图",
      detail: floorPlan ? "已配置 2D 区域平面图" : "尚未上传区域平面图",
      status: floorPlan ? "pass" : "block",
    },
    {
      id: "points",
      label: "巡检测点",
      detail: points.length ? `已绑定 ${points.length} 个音视频巡检测点` : "尚未绑定音视频巡检测点",
      status: points.length ? "pass" : "block",
    },
    {
      id: "location",
      label: "测点定位",
      detail: unlocated.length ? `${unlocated.length} 个测点尚未在平面图定位：${unlocated.slice(0, 3).map((point) => point.id).join("、")}` : `全部 ${points.length} 个测点已完成定位`,
      status: unlocated.length ? "block" : "pass",
      pointId: unlocated[0]?.id,
    },
    {
      id: "metrics",
      label: "巡检指标",
      detail: missingMetrics.length ? `${missingMetrics.length} 个测点未选择巡检指标` : `全部测点已配置巡检指标，共 ${new Set(points.flatMap((point) => point.metrics || [])).size} 项`,
      status: missingMetrics.length ? "block" : "pass",
      pointId: missingMetrics[0]?.id,
    },
    {
      id: "regions",
      label: "环境区域",
      detail: missingRegions.length
        ? `${missingRegions.length} 个已绑定测点的设备环境尚未设置区域`
        : `已设置 ${regions.length} 个设备环境区域`,
      status: missingRegions.length ? "block" : "pass",
    },
    {
      id: "coverage",
      label: "环境覆盖",
      detail: uncovered.length ? `${uncovered.length} 个设备环境暂无巡检测点，可按建设计划后续补充` : "全部设备环境均已配置巡检测点",
      status: uncovered.length ? "warning" : "pass",
    },
    {
      id: "availability",
      label: "设备可用性",
      detail: offline.length ? `${offline.length} 个音视频设备当前离线，配置可保存但巡检时将跳过` : "已绑定音视频设备当前均可用",
      status: offline.length ? "warning" : "pass",
    },
  ];
}

function TreeRow({ item, level = 0, activeId, onSelect, points, expandedIds, onToggle }) {
  const itemPoints = points.filter((point) => point.environmentId === item.id);
  const hasChildren = item.children?.length || itemPoints.length;
  const isExpanded = expandedIds.has(item.id);
  const aggregateStatus = aggregateTreeStatus(item, points);
  const nodeKind = item.type || (item.id === "plant" ? "plant" : item.id === "production" ? "region" : "area");
  const nodeTitle = item.type === "environment"
    ? `${item.name} · ${itemPoints.length} 个音视频测点`
    : item.name;
  const handleTreeKeyDown = (event) => {
    if (!hasChildren) return;
    if (event.key === "ArrowRight" && !isExpanded) {
      event.preventDefault();
      onToggle(item.id);
    }
    if (event.key === "ArrowLeft" && isExpanded) {
      event.preventDefault();
      onToggle(item.id);
    }
  };
  return (
    <>
      <button
        type="button"
        className={`elm-tree-row kind-${nodeKind} ${activeId === item.id ? "active" : ""}`}
        style={{ "--tree-level": level }}
        onClick={() => onSelect(item)}
        onKeyDown={handleTreeKeyDown}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-level={level + 1}
        title={nodeTitle}
      >
        <span
          className={`elm-tree-chevron ${hasChildren ? "" : "empty"}`}
          onClick={(event) => {
            if (!hasChildren) return;
            event.stopPropagation();
            onToggle(item.id);
          }}
        >
          {hasChildren && (isExpanded ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />)}
        </span>
        {item.children ? (
          isExpanded ? <IconFolderOpen size={17} color={item.color || "#6b86a6"} /> : <IconFolder size={17} color={item.color || "#6b86a6"} />
        ) : (
          <IconMap2 size={16} color={item.color || "#6886aa"} />
        )}
        <span className="elm-tree-name">{item.name}</span>
        {aggregateStatus && (
          <span
            className="elm-tree-health"
            style={{ "--status-color": aggregateStatus.color }}
            title={`范围状态：${aggregateStatus.label}`}
            aria-label={`范围状态：${aggregateStatus.label}`}
          />
        )}
        {item.children && <span className="elm-tree-count" aria-label={`${item.children.length} 个下级`}>{item.children.length}</span>}
      </button>
      {isExpanded && item.children?.map((child) => (
        <TreeRow
          key={child.id}
          item={child}
          level={level + 1}
          activeId={activeId}
          onSelect={onSelect}
          points={points}
          expandedIds={expandedIds}
          onToggle={onToggle}
        />
      ))}
      {isExpanded && !item.children && itemPoints.map((point) => (
        <button
          type="button"
          key={point.id}
          className={`elm-tree-row elm-point-row ${activeId === point.id ? "active" : ""}`}
          style={{ "--tree-level": level + 1 }}
          onClick={() => onSelect({ ...point, type: "point" })}
          aria-level={level + 2}
          title={`${point.id} · ${point.name} · ${pointStatus(point).label}`}
        >
          <span className="elm-tree-chevron empty" />
          <IconDeviceCctv size={16} color={pointStatus(point).color} />
          <span className="elm-tree-name">{point.id}</span>
          <span className="elm-status-dot" style={{ "--status-color": pointStatus(point).color }} />
        </button>
      ))}
    </>
  );
}

function PointEditor({ point, draft, onDraftChange, onApply, onCancel, onDelete, onLocate, onOpenVideo, dirty, pageDraftDirty }) {
  const [showMetricCatalog, setShowMetricCatalog] = useState(false);
  const [showCameraView, setShowCameraView] = useState(false);
  const [showRelationDetails, setShowRelationDetails] = useState(false);

  useEffect(() => {
    setShowMetricCatalog(false);
    setShowCameraView(false);
    setShowRelationDetails(false);
  }, [point?.id]);

  if (!point || !draft) {
    return (
      <div className="elm-empty-inspector">
        <IconMapPin size={38} />
        <strong>选择一个音视频测点</strong>
        <span>可查看基础信息、绑定指标并在平面图上定位。</span>
      </div>
    );
  }

  const toggleMetric = (metric) => {
    const exists = draft.metrics.includes(metric);
    onDraftChange({
      ...draft,
      metrics: exists ? draft.metrics.filter((item) => item !== metric) : [...draft.metrics, metric],
    });
  };
  const selectedDevice = AUDIO_VIDEO_DEVICES.find((device) => device.model === draft.camera) || AUDIO_VIDEO_DEVICES[0];
  const hasValidEnvironment = ENVIRONMENT_OPTIONS.some((environment) => environment.id === draft.environmentId);
  const hasValidDevice = Boolean(draft.camera && selectedDevice.model === draft.camera);
  const hasValidPreset = Boolean(draft.preset && selectedDevice.presets.includes(draft.preset));
  const hasMetrics = draft.metrics.length > 0;
  const hasLocation = Number.isFinite(draft.x) && Number.isFinite(draft.y);
  const recommendedMetrics = AUDIO_VIDEO_POINT_CATALOG.find((item) => item.id === draft.id)?.recommendedMetrics || [];
  const missingRecommendedMetrics = recommendedMetrics.filter((metric) => !draft.metrics.includes(metric));
  const cameraView = draft.cameraView || POINT_CAMERA_VIEWS[draft.id] || { pan: 0, tilt: 0, zoom: 1, fov: 60 };
  const updateCameraView = (field, value) => {
    const limits = {
      pan: [-180, 180],
      tilt: [-45, 45],
      zoom: [1, 20],
      fov: [20, 120],
    };
    const [minimum, maximum] = limits[field];
    const numericValue = Math.max(minimum, Math.min(maximum, Number(value)));
    const nextView = {
      ...cameraView,
      [field]: Number(numericValue.toFixed(field === "zoom" ? 1 : 0)),
    };
    if (field === "zoom") {
      const linkedFov = cameraView.fov * cameraView.zoom / numericValue;
      nextView.fov = Number(Math.max(20, Math.min(120, linkedFov)).toFixed(0));
    } else if (field === "fov") {
      const linkedZoom = cameraView.zoom * cameraView.fov / numericValue;
      nextView.zoom = Number(Math.max(1, Math.min(20, linkedZoom)).toFixed(1));
    }
    onDraftChange({
      ...draft,
      cameraView: nextView,
    });
  };
  const relationChecks = [
    { label: "环境", complete: hasValidEnvironment },
    { label: "设备", complete: hasValidDevice && hasValidPreset },
    { label: "指标", complete: hasMetrics },
    { label: "定位", complete: hasLocation },
  ];
  const missingRelationItems = relationChecks.filter((check) => !check.complete).map((check) => check.label);
  const relationComplete = missingRelationItems.length === 0;
  const relationStage = !relationComplete
    ? "incomplete"
    : dirty
      ? "unapplied"
      : pageDraftDirty
        ? "page-draft"
        : "saved";
  const relationStageCopy = {
    incomplete: {
      title: "空间关系尚未完整",
      detail: `请返回基础信息补充${missingRelationItems.join("、")}后，再应用到页面草稿。`,
    },
    unapplied: {
      title: "当前摘要包含未应用修改",
      detail: "点击底部“应用到草稿”，再由顶部“保存配置”写入平台版本。",
    },
    "page-draft": {
      title: "已应用到页面草稿，尚未保存到平台",
      detail: "可继续核对其他测点，完成后使用顶部“保存配置”统一保存。",
    },
    saved: {
      title: "平台版本关系可用",
      detail: "位置详情将按当前环境展示该测点的设备、预置位与指标关系。",
    },
  }[relationStage];
  const metricAndPositionSections = (
    <>
      <section className="elm-editor-section metric-section">
        <div className="elm-section-title">
          <span>
            <h3>展示指标</h3>
            <small>用于平面图标记与位置详情</small>
          </span>
          <span className="elm-section-actions">
            <em>{draft.metrics.length} 项</em>
            <button
              type="button"
              disabled={!missingRecommendedMetrics.length}
              title={missingRecommendedMetrics.length ? `补充推荐指标：${missingRecommendedMetrics.join("、")}` : "推荐指标已全部配置"}
              onClick={() => onDraftChange({
                ...draft,
                metrics: [...new Set([...draft.metrics, ...recommendedMetrics])],
              })}
            >
              补齐推荐
            </button>
            <button
              type="button"
              disabled={!draft.metrics.length}
              title={draft.metrics.length ? "清空当前测点已选指标" : "当前没有已选指标"}
              onClick={() => onDraftChange({ ...draft, metrics: [] })}
            >
              清空
            </button>
          </span>
        </div>
        <div className="elm-metric-list">
          {METRICS.filter((metric) => showMetricCatalog || draft.metrics.includes(metric.name)).map((metric) => {
            const checked = draft.metrics.includes(metric.name);
            const isAppliedMetric = point.metrics.includes(metric.name);
            const runtimeStatus = checked && isAppliedMetric
              ? metricRuntimeStatus(point, metric.name)
              : { key: "pending", ...METRIC_RUNTIME_META.pending };
            return (
              <label key={metric.name} className={checked ? "checked" : ""}>
                <input type="checkbox" checked={checked} onChange={() => toggleMetric(metric.name)} />
                <span className="elm-checkmark">{checked && <IconCheck size={13} />}</span>
                <span><strong>{metric.name}</strong><small>{metric.group}</small></span>
                <em
                  className={`elm-metric-runtime ${checked ? runtimeStatus.key : "inactive"}`}
                  title={checked ? `当前状态：${runtimeStatus.label}` : "当前指标未启用"}
                  aria-label={checked ? `当前状态：${runtimeStatus.label}` : "当前指标未启用"}
                >
                  <i style={{ "--metric-status-color": checked ? runtimeStatus.color : "#a6afbc" }} />
                  {checked ? runtimeStatus.label : "未启用"}
                </em>
              </label>
            );
          })}
          {!draft.metrics.length && !showMetricCatalog && (
            <div className="elm-metric-empty">至少选择一个指标后才能应用到页面草稿</div>
          )}
        </div>
        <button
          type="button"
          className="elm-add-metric"
          onClick={() => setShowMetricCatalog((value) => !value)}
        >
          {showMetricCatalog ? "收起可选指标" : "+ 添加指标"}
        </button>
      </section>

      <section className="elm-editor-section elm-position-section">
        <div className="elm-section-title">
          <span>
            <h3>位置说明</h3>
            <small>
              {Number.isFinite(draft.x) && Number.isFinite(draft.y)
                ? `已定位 · X ${Math.round(draft.x)}% / Y ${Math.round(draft.y)}%`
                : "尚未在平面图定位"}
            </small>
          </span>
        </div>
        <textarea
          rows="3"
          maxLength={200}
          placeholder="补充位置、朝向或现场识别说明（选填）"
          value={draft.note}
          onChange={(event) => onDraftChange({ ...draft, note: event.target.value })}
        />
        <button type="button" className="elm-locate-button" onClick={onLocate}>
          <IconFocus2 size={16} /> 在平面图上重新定位
        </button>
      </section>
    </>
  );

  return (
    <div className="elm-inspector-content">
      <header className="elm-point-summary">
        <span className="elm-point-icon"><IconDeviceCctv size={25} /></span>
        <span className="elm-point-summary-copy">
          <span className="elm-point-heading">
            <strong>{draft.id}</strong>
            <em className={`status-${draft.status}`} style={{ "--status-color": pointStatus(draft).color }}>
              <span />
              {pointStatus(draft).label}
            </em>
          </span>
          <small>{draft.name}</small>
        </span>
      </header>

      <div className="elm-point-progress" aria-label="当前测点配置完整度">
        {relationChecks.map((check, index) => (
          <span key={check.label} className={check.complete ? "complete" : "incomplete"}>
            <b>{check.complete ? <IconCheck size={12} /> : index + 1}</b>
            <small>{check.label}</small>
          </span>
        ))}
      </div>

      <div className="elm-editor-scroll">
        <section className="elm-editor-section elm-device-section">
          <div className="elm-section-title">
            <span>
              <h3>设备绑定</h3>
              <small>设备与预置位共同确定巡检视角</small>
            </span>
            <button
              type="button"
              className="elm-video-link"
              onClick={() => onOpenVideo(draft)}
              title={draft.status === "offline" ? "查看设备离线原因" : "查看当前预置位实时画面"}
            >
              <IconEye size={15} /> 实时视频
            </button>
          </div>

          <div className="elm-environment-context">
            <IconMapPin size={16} />
            <span><small>所属环境</small><strong>{draft.environment}</strong></span>
          </div>

          <div className="elm-field-stack">
            <label>
              <span>音视频设备</span>
              <select
                title={draft.camera}
                value={draft.camera}
                onChange={(event) => {
                  const device = AUDIO_VIDEO_DEVICES.find((item) => item.model === event.target.value) || AUDIO_VIDEO_DEVICES[0];
                  onDraftChange({ ...draft, camera: device.model, preset: device.presets[0] });
                }}
              >
                {AUDIO_VIDEO_DEVICES.map((device) => <option key={device.model}>{device.model}</option>)}
              </select>
            </label>
            <label>
              <span>预置位</span>
              <select
                title={draft.preset}
                value={draft.preset}
                onChange={(event) => onDraftChange({ ...draft, preset: event.target.value })}
              >
                {selectedDevice.presets.map((preset) => <option key={preset}>{preset}</option>)}
              </select>
            </label>
          </div>

          <div className="elm-camera-state">
            <span>设备连接</span>
            <strong style={{ "--status-color": draft.status === "offline" ? STATUS_META.offline.color : STATUS_META.normal.color }}><i /> {draft.status === "offline" ? "离线" : "正常"}</strong>
            <small>{draft.status === "offline" ? "请前往采集站管理检查接入" : `当前测点：${pointStatus(draft).label}`}</small>
          </div>
        </section>

        {metricAndPositionSections}

        <section className={`elm-editor-section elm-camera-view-section ${showCameraView ? "expanded" : "collapsed"}`}>
          <button
            type="button"
            className="elm-section-disclosure"
            aria-expanded={showCameraView}
            onClick={() => setShowCameraView((value) => !value)}
          >
            <span>
              <IconCamera size={17} />
              <span><strong>空间取景</strong><small>水平 {cameraView.pan}° · 俯仰 {cameraView.tilt}° · {cameraView.zoom}× · 视场 {cameraView.fov}°</small></span>
            </span>
            <IconChevronDown size={17} />
          </button>
          {showCameraView && (
            <>
              <div className="elm-camera-section-actions">
                <small>只配置空间覆盖，不执行实时镜头控制</small>
                <button
                  type="button"
                  onClick={() => onDraftChange({
                    ...draft,
                    cameraView: { ...(POINT_CAMERA_VIEWS[draft.id] || { pan: 0, tilt: 0, zoom: 1, fov: 60 }) },
                  })}
                >
                  恢复预置
                </button>
              </div>
              <div className="elm-camera-compass" aria-label={`当前水平角 ${cameraView.pan} 度，视场角 ${cameraView.fov} 度`}>
                <span className="elm-camera-compass-ring">
                  <i style={{ "--camera-pan": `${cameraView.pan}deg`, "--camera-fov-size": `${Math.max(34, Math.min(88, cameraView.fov * 0.72))}px` }} />
                  <b><IconCamera size={18} /></b>
                  <small className="north">北</small>
                  <small className="east">东</small>
                  <small className="south">南</small>
                  <small className="west">西</small>
                </span>
                <span>
                  <strong>{cameraView.pan > 0 ? "+" : ""}{cameraView.pan}°</strong>
                  <small>俯仰 {cameraView.tilt > 0 ? "+" : ""}{cameraView.tilt}° · 变焦 {cameraView.zoom}× · 视场 {cameraView.fov}°</small>
                </span>
              </div>
              <div className="elm-camera-quick-directions" role="group" aria-label="快捷朝向">
                {[["北", -90], ["东", 0], ["南", 90], ["西", 180]].map(([label, value]) => (
                  <button type="button" key={label} className={cameraView.pan === value ? "active" : ""} onClick={() => updateCameraView("pan", value)}>
                    {label}<small>{value > 0 ? "+" : ""}{value}°</small>
                  </button>
                ))}
              </div>
              <div className="elm-camera-angle-fields">
                {[
                  { key: "pan", label: "水平角", minimum: -180, maximum: 180, step: 1, unit: "°", hint: "平面图覆盖方向" },
                  { key: "tilt", label: "俯仰角", minimum: -45, maximum: 45, step: 1, unit: "°", hint: "向上为正，向下为负" },
                  { key: "zoom", label: "变焦倍数", minimum: 1, maximum: 20, step: 0.1, unit: "×", hint: "放大时视场自动收窄" },
                  { key: "fov", label: "视场角", minimum: 20, maximum: 120, step: 1, unit: "°", hint: "与变焦倍数联动" },
                ].map((field) => (
                  <label key={field.key}>
                    <span><strong>{field.label}</strong><small>{field.hint}</small></span>
                    <input type="range" min={field.minimum} max={field.maximum} step={field.step} value={cameraView[field.key]} onChange={(event) => updateCameraView(field.key, event.target.value)} />
                    <span className="elm-angle-number">
                      <input type="number" min={field.minimum} max={field.maximum} step={field.step} value={cameraView[field.key]} onChange={(event) => updateCameraView(field.key, event.target.value)} />
                      <em>{field.unit}</em>
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="elm-editor-section elm-relation-section elm-relation-compact">
          <button
            type="button"
            className="elm-section-disclosure"
            aria-expanded={showRelationDetails}
            onClick={() => setShowRelationDetails((value) => !value)}
          >
            <span>
              {relationComplete ? <IconCircleCheck size={17} /> : <IconAlertTriangle size={17} />}
              <span><strong>空间绑定关系</strong><small>{relationStageCopy.title}</small></span>
            </span>
            <IconChevronDown size={17} />
          </button>
          <div className="elm-relation-readiness" aria-label="空间关系完整度">
            {relationChecks.map((check) => (
              <span key={check.label} className={check.complete ? "complete" : "incomplete"}>
                {check.complete ? <IconCircleCheck size={15} /> : <IconCircleDashed size={15} />}
                <small>{check.label}</small>
              </span>
            ))}
          </div>
          {showRelationDetails && (
            <dl>
              <div><dt>音视频测点</dt><dd>{draft.id} · {draft.name}</dd></div>
              <div><dt>设备环境</dt><dd title={draft.environment}>{draft.environment || "未配置"}</dd></div>
              <div><dt>接入设备</dt><dd title={draft.camera}>{draft.camera || "未配置"}</dd></div>
              <div><dt>设备预置位</dt><dd title={draft.preset}>{draft.preset || "未配置"}</dd></div>
              <div><dt>摄像机取景</dt><dd>水平 {cameraView.pan}° / 俯仰 {cameraView.tilt}° / 变焦 {cameraView.zoom}× / 视场 {cameraView.fov}°</dd></div>
              <div><dt>展示指标</dt><dd>{draft.metrics.length ? `${draft.metrics.length} 项 · ${draft.metrics.join("、")}` : "未配置"}</dd></div>
              <div><dt>平面图坐标</dt><dd>{hasLocation ? `X ${draft.x}% / Y ${draft.y}%` : "待定位"}</dd></div>
            </dl>
          )}
        </section>
      </div>

      <footer className="elm-editor-actions">
        <button type="button" className="danger" onClick={onDelete} title="从页面草稿移除当前测点"><IconTrash size={16} /> 删除测点</button>
        <span />
        <button type="button" onClick={onCancel} disabled={!dirty} title={dirty ? "撤销当前测点未应用的表单修改" : "当前测点没有未应用修改"}>撤销</button>
        <button type="button" className="primary" onClick={onApply} disabled={!dirty} title={dirty ? "将当前测点修改写入页面草稿" : "当前测点没有未应用修改"}>应用到草稿</button>
      </footer>
    </div>
  );
}

function VideoPreviewDialog({ point, onClose, onFeedback }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const refreshTimerRef = useRef(null);
  const offline = point?.status === "offline";

  useEffect(() => {
    if (!point) return;
    setRefreshing(false);
    setLastUpdated(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [point]);

  if (!point) return null;

  const refreshPreview = () => {
    if (offline || refreshing) return;
    setRefreshing(true);
    refreshTimerRef.current = window.setTimeout(() => {
      setRefreshing(false);
      setLastUpdated(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
      onFeedback(`${point.id} 实时画面已刷新`);
    }, 650);
  };

  return (
    <div className="elm-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="elm-video-dialog" role="dialog" aria-modal="true" aria-labelledby="elm-video-title">
        <header>
          <div>
            <span><IconCamera size={22} /></span>
            <div>
              <strong id="elm-video-title">{point.id} · 实时视频</strong>
              <small>{point.name} · {point.environment}</small>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭实时视频预览"><IconX size={18} /></button>
        </header>
        <div className={`elm-video-stage ${offline ? "offline" : ""}`}>
          {!offline && <img src={boilerCctvPreview} alt={`${point.name}实时视频画面`} />}
          <div className="elm-video-overlay">
            <span className={offline ? "offline" : "live"}><i />{offline ? "设备离线" : "实时"}</span>
            {!offline && <em>{lastUpdated}</em>}
          </div>
          {refreshing && <div className="elm-video-loading"><IconRefresh size={25} /> 正在刷新实时画面</div>}
          {offline && (
            <div className="elm-video-offline">
              <IconDeviceCctv size={36} />
              <strong>无法获取实时画面</strong>
              <span>音视频设备当前离线，请前往采集站管理检查接入与视频流状态。</span>
            </div>
          )}
        </div>
        <div className="elm-video-details">
          <span><small>音视频设备</small><strong title={point.camera}>{point.camera}</strong></span>
          <span><small>预置位</small><strong title={point.preset}>{point.preset}</strong></span>
          <span><small>展示指标</small><strong>{point.metrics.length} 项 · {point.metrics.slice(0, 2).join("、")}</strong></span>
        </div>
        <footer>
          <span>{offline ? "离线状态不支持刷新画面" : `最近刷新：${lastUpdated}`}</span>
          <button
            type="button"
            onClick={refreshPreview}
            disabled={offline || refreshing}
            title={offline ? "设备离线，无法刷新实时画面" : "重新拉取当前预置位画面"}
          >
            <IconRefresh size={16} /> {refreshing ? "刷新中" : "刷新画面"}
          </button>
          <button type="button" className="primary" onClick={onClose}>关闭</button>
        </footer>
      </section>
    </div>
  );
}

function EnvironmentInspector({ scope, points, onBind, onPreview, onValidate }) {
  const located = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).length;
  const metricCount = new Set(points.flatMap((point) => point.metrics || [])).size;
  const exceptionCount = points.filter((point) => point.status === "warning" || point.status === "alarm" || point.status === "offline").length;
  return (
    <div className="elm-environment-inspector">
      <header>
        <span><IconMap2 size={24} /></span>
        <div><strong>{scope.name}</strong><small>{scope.path}</small></div>
      </header>
      <section className="elm-environment-summary">
        <h3>环境配置概览</h3>
        <div>
          <span><strong>{points.length}</strong><small>绑定测点</small></span>
          <span><strong>{located}/{points.length}</strong><small>完成定位</small></span>
          <span><strong>{metricCount}</strong><small>巡检指标</small></span>
          <span className={exceptionCount ? "has-exception" : ""}><strong>{exceptionCount}</strong><small>运行异常</small></span>
        </div>
      </section>
      <section className="elm-environment-readiness">
        <h3>区域可用性</h3>
        <p className="pass"><IconCircleCheck size={17} /><span><strong>2D 平面图已配置</strong><small>可用于设备位置详情展示</small></span></p>
        <p className={points.length ? "pass" : "block"}>{points.length ? <IconCircleCheck size={17} /> : <IconCircleDashed size={17} />}<span><strong>{points.length ? "已绑定音视频测点" : "暂无音视频测点"}</strong><small>{points.length ? `${points.length} 个测点属于当前环境范围` : "绑定测点后才能形成区域位置关系"}</small></span></p>
        <p className={located === points.length && points.length ? "pass" : "warning"}>{located === points.length && points.length ? <IconCircleCheck size={17} /> : <IconCircleDashed size={17} />}<span><strong>{located === points.length && points.length ? "测点定位完整" : "存在未定位测点"}</strong><small>{points.length ? `${located}/${points.length} 已完成空间定位` : "暂无可定位测点"}</small></span></p>
      </section>
      <section className="elm-environment-points">
        <div><h3>当前范围测点</h3><span>{points.length} 个</span></div>
        {points.slice(0, 6).map((point) => (
          <p key={point.id}><i style={{ "--status-color": pointStatus(point).color }} /><span><strong>{point.id}</strong><small>{point.name}</small></span><em>{point.metrics.length} 项指标</em></p>
        ))}
        {!points.length && <div className="elm-environment-empty">当前环境尚未配置巡检测点</div>}
      </section>
      <footer>
        <button type="button" onClick={onValidate}><IconClipboardCheck size={16} /> 配置检查</button>
        <button type="button" onClick={onBind}><IconCirclePlus size={16} /> 绑定测点</button>
        <button type="button" className="primary" onClick={onPreview} disabled={!points.length} title={points.length ? "预览当前环境的位置与指标关系" : "当前环境没有可预览的测点"}><IconEye size={16} /> 预览位置详情</button>
      </footer>
    </div>
  );
}

function ValidationDialog({ open, checks, onClose, onLocate, onPreview }) {
  if (!open) return null;
  const blockers = checks.filter((check) => check.status === "block");
  const warnings = checks.filter((check) => check.status === "warning");
  return (
    <div className="elm-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="elm-validation-dialog" role="dialog" aria-modal="true" aria-labelledby="elm-validation-title">
        <header>
          <div>
            <span className={blockers.length ? "blocked" : "passed"}>{blockers.length ? <IconClipboardCheck size={23} /> : <IconCircleCheck size={23} />}</span>
            <div>
              <strong id="elm-validation-title">{blockers.length ? `配置检查发现 ${blockers.length} 个阻断项` : "配置检查已通过"}</strong>
              <small>{blockers.length ? "处理阻断项后才能保存为可用的设备位置配置" : warnings.length ? `可保存，另有 ${warnings.length} 项建议关注` : "当前配置可用于设备位置详情展示"}</small>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭配置检查"><IconX size={18} /></button>
        </header>
        <div className="elm-validation-list">
          {checks.map((check) => (
            <article key={check.id} className={check.status}>
              <span>{check.status === "pass" ? <IconCircleCheck size={19} /> : check.status === "block" ? <IconAlertTriangle size={19} /> : <IconCircleDashed size={19} />}</span>
              <div><strong>{check.label}</strong><small>{check.detail}</small></div>
              {check.pointId && <button type="button" onClick={() => onLocate(check.pointId)}>去处理</button>}
            </article>
          ))}
        </div>
        <footer>
          <span>{blockers.length ? "配置暂不可保存" : "配置满足保存条件"}</span>
          <button type="button" onClick={onClose}>返回编辑</button>
          <button type="button" className="primary" onClick={onPreview} disabled={Boolean(blockers.length)} title={blockers.length ? "请先处理全部阻断项" : "预览当前可用配置"}><IconEye size={16} /> 预览位置详情</button>
        </footer>
      </section>
    </div>
  );
}

function ConfigImportDialog({ candidate, hasUnsaved, floorPlanName, onCancel, onConfirm }) {
  if (!candidate) return null;
  return (
    <div className="elm-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="elm-import-dialog" role="dialog" aria-modal="true" aria-labelledby="elm-import-title">
        <header>
          <div>
            <span><IconFileImport size={23} /></span>
            <div>
              <strong id="elm-import-title">导入设备位置配置</strong>
              <small>{candidate.fileName} · {candidate.version}</small>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭配置导入预览"><IconX size={18} /></button>
        </header>
        <div className="elm-import-stats">
          <span><strong>{candidate.points.length}</strong><small>绑定测点</small></span>
          <span><strong>{candidate.locatedCount}/{candidate.points.length}</strong><small>空间定位</small></span>
          <span><strong>{candidate.environmentCount}</strong><small>设备环境</small></span>
          <span><strong>{candidate.metricCount}</strong><small>巡检指标</small></span>
        </div>
        <div className="elm-import-body">
          {hasUnsaved && (
            <div className="elm-import-warning">
              <IconAlertTriangle size={18} />
              <span><strong>当前页面存在未保存修改</strong><small>确认导入后将替换当前测点草稿；仍可使用“撤销全部”恢复上次保存版本。</small></span>
            </div>
          )}
          <div className="elm-import-plan-note">
            <IconMap2 size={18} />
            <span><strong>继续使用当前 2D 平面图</strong><small>{floorPlanName} · 配置文件仅导入测点、坐标、设备、预置位和指标关系。</small></span>
          </div>
          <section className="elm-import-preview">
            <header><strong>测点预览</strong><span>已通过结构与业务字段校验</span></header>
            <div>
              {candidate.points.slice(0, 6).map((point) => (
                <article key={point.id}>
                  <span className={`status-${point.status}`}><IconCamera size={16} /></span>
                  <div><strong>{point.id} · {point.name}</strong><small>{point.environment} · {point.metrics.length} 项指标</small></div>
                  <em>{Number.isFinite(point.x) ? "已定位" : "待定位"}</em>
                </article>
              ))}
              {candidate.points.length > 6 && <p>另有 {candidate.points.length - 6} 个测点将在确认后导入</p>}
            </div>
          </section>
        </div>
        <footer>
          <span>导入后作为页面草稿，不会自动保存为平台版本</span>
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" className="primary" onClick={onConfirm}><IconFileImport size={16} /> 导入为页面草稿</button>
        </footer>
      </section>
    </div>
  );
}

function DraftRecoveryDialog({ candidate, savedFloorPlanName, onDiscard, onRestore }) {
  if (!candidate) return null;
  const locatedCount = candidate.points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).length;
  const metricCount = new Set(candidate.points.flatMap((point) => point.metrics || [])).size;
  const updatedAtValue = candidate.updatedAt ? new Date(candidate.updatedAt) : null;
  const updatedAt = updatedAtValue && Number.isFinite(updatedAtValue.getTime())
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(updatedAtValue)
    : "时间未知";
  return (
    <div className="elm-dialog-backdrop">
      <section className="elm-recovery-dialog" role="dialog" aria-modal="true" aria-labelledby="elm-recovery-title">
        <header>
          <span className="elm-modal-icon"><IconArrowBackUp size={20} /></span>
          <span>
            <strong id="elm-recovery-title">发现未保存的页面草稿</strong>
            <small>上次编辑于 {updatedAt}，恢复后仍需点击“保存配置”生成平台版本</small>
          </span>
        </header>
        <div className="elm-recovery-stats">
          <span><strong>{candidate.points.length}</strong><small>绑定测点</small></span>
          <span><strong>{locatedCount}</strong><small>已定位</small></span>
          <span><strong>{metricCount}</strong><small>关联指标</small></span>
        </div>
        <div className="elm-recovery-body">
          <div className="elm-recovery-plan">
            <IconMap2 size={18} />
            <span>
              <strong>{candidate.floorPlanName}</strong>
              <small>
                {candidate.floorPlanRestorable
                  ? "平面图与测点页面草稿可一起恢复"
                  : `平面图文件过大，恢复时保留平台版本底图“${savedFloorPlanName}”`}
              </small>
            </span>
          </div>
          <p>恢复只会载入本地页面草稿，不会覆盖平台已保存版本；你仍可使用“撤销全部”返回平台版本。</p>
        </div>
        <footer>
          <button type="button" onClick={onDiscard}>忽略草稿</button>
          <button type="button" className="primary" onClick={onRestore}><IconArrowBackUp size={16} /> 恢复页面草稿</button>
        </footer>
      </section>
    </div>
  );
}

function RegionPreviewDialog({ open, scope, points, floorPlan, dirty, onClose }) {
  if (!open) return null;
  const locatedPoints = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const metricCount = new Set(points.flatMap((point) => point.metrics || [])).size;
  return (
    <div className="elm-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="elm-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="elm-preview-title">
        <header>
          <div>
            <span><IconMap2 size={23} /></span>
            <div>
              <strong id="elm-preview-title">设备位置详情预览 · {scope.name}</strong>
              <small>{scope.path}{dirty ? " · 基于当前未保存草稿" : " · 基于已保存配置"}</small>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭设备位置详情预览"><IconX size={18} /></button>
        </header>
        <div className="elm-preview-stats">
          <span><strong>{points.length}</strong><small>绑定测点</small></span>
          <span><strong>{metricCount}</strong><small>关联指标</small></span>
          <span><strong>{new Set(points.map((point) => point.camera)).size}</strong><small>音视频设备</small></span>
          <span><strong>{locatedPoints.length}/{points.length}</strong><small>空间定位</small></span>
        </div>
        <div className="elm-preview-body">
          <div className="elm-preview-map">
            <img src={floorPlan} alt={`${scope.name}设备位置平面图`} />
            {locatedPoints.map((point, index) => (
              <span className={`elm-preview-marker status-${point.status}`} key={point.id} style={{ left: `${point.x}%`, top: `${point.y}%`, "--marker-color": pointStatus(point).color }}>
                <b>{index + 1}</b><em>{point.id}</em>
              </span>
            ))}
          </div>
          <aside className="elm-preview-route">
            <div><strong>测点清单</strong><span>位置与指标关系</span></div>
            <ol>
              {points.map((point, index) => (
                <li key={point.id}>
                  <b>{index + 1}</b>
                  <span><strong>{point.id} · {point.name}</strong><small>{point.metrics.join("、")}</small></span>
                  <em>{pointStatus(point).label}</em>
                </li>
              ))}
            </ol>
          </aside>
        </div>
        <footer>
          <span>{points.length ? `当前区域已建立 ${points.length} 个音视频测点的位置关系` : "当前区域暂无已绑定测点"}</span>
          <button type="button" className="primary" onClick={onClose}>返回配置</button>
        </footer>
      </section>
    </div>
  );
}

function BindPointDialog({ open, points, onCancel, onConfirm }) {
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [environmentId, setEnvironmentId] = useState("boiler-body");
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const boundIds = useMemo(() => new Set(points.map((point) => point.id)), [points]);
  const filteredCatalog = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return AUDIO_VIDEO_POINT_CATALOG;
    return AUDIO_VIDEO_POINT_CATALOG.filter((point) => `${point.id}${point.name}${point.camera}`.toLowerCase().includes(value));
  }, [keyword]);
  const selectedCatalogPoint = AUDIO_VIDEO_POINT_CATALOG.find((point) => point.id === selectedId);

  useEffect(() => {
    if (!open) return undefined;
    setKeyword("");
    setSelectedId("");
    setEnvironmentId("boiler-body");
    setSelectedMetrics([]);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (!open) return null;

  const selectCatalogPoint = (point) => {
    if (boundIds.has(point.id)) return;
    setSelectedId(point.id);
    setSelectedMetrics([...point.recommendedMetrics]);
  };

  const toggleMetric = (metric) => {
    setSelectedMetrics((current) => current.includes(metric)
      ? current.filter((item) => item !== metric)
      : [...current, metric]);
  };

  const confirm = () => {
    const environment = ENVIRONMENT_OPTIONS.find((item) => item.id === environmentId);
    if (!selectedCatalogPoint || !environment || !selectedMetrics.length) return;
    onConfirm({
      id: selectedCatalogPoint.id,
      name: selectedCatalogPoint.name,
      environmentId,
      environment: environment.path,
      camera: selectedCatalogPoint.camera,
      preset: selectedCatalogPoint.preset,
      status: selectedCatalogPoint.status,
      x: null,
      y: null,
      note: "",
      metrics: selectedMetrics,
    });
  };

  return (
    <div className="elm-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="elm-bind-dialog" role="dialog" aria-modal="true" aria-labelledby="elm-bind-title">
        <header>
          <div>
            <strong id="elm-bind-title">绑定音视频巡检测点</strong>
            <span>从已接入的音视频测点中选择，并配置设备环境与巡检指标</span>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭绑定测点弹窗"><IconX size={19} /></button>
        </header>

        <div className="elm-bind-body">
          <div className="elm-catalog-panel">
            <label className="elm-dialog-search">
              <IconSearch size={16} />
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索测点编码、名称或设备" autoFocus />
            </label>
            <div className="elm-catalog-list">
              {filteredCatalog.map((point) => {
                const bound = boundIds.has(point.id);
                const active = selectedId === point.id;
                return (
                  <button
                    type="button"
                    key={point.id}
                    disabled={bound}
                    className={active ? "active" : ""}
                    onClick={() => selectCatalogPoint(point)}
                    title={bound ? `${point.id} 已绑定，不能重复选择` : `选择 ${point.id} · ${point.name}`}
                  >
                    <span className={`catalog-icon status-${point.status}`}><IconDeviceCctv size={18} /></span>
                    <span>
                      <strong>{point.id} · {point.name}</strong>
                      <small>{point.camera}</small>
                    </span>
                    <em>{bound ? "已绑定" : pointStatus(point).label}</em>
                  </button>
                );
              })}
              {!filteredCatalog.length && <div className="elm-catalog-empty">没有匹配的音视频测点</div>}
            </div>
          </div>

          <div className="elm-bind-form">
            {selectedCatalogPoint ? (
              <>
                <div className="elm-selected-catalog">
                  <span><IconDeviceCctv size={21} /></span>
                  <div><strong>{selectedCatalogPoint.id}</strong><small>{selectedCatalogPoint.name}</small></div>
                  <em className={`status-${selectedCatalogPoint.status}`}><i />{pointStatus(selectedCatalogPoint).label}</em>
                </div>
                <label>
                  <span>设备环境</span>
                  <select value={environmentId} onChange={(event) => setEnvironmentId(event.target.value)}>
                    {ENVIRONMENT_OPTIONS.map((environment) => <option key={environment.id} value={environment.id}>{environment.path}</option>)}
                  </select>
                </label>
                <label>
                  <span>音视频设备</span>
                  <input value={selectedCatalogPoint.camera} readOnly />
                </label>
                <label>
                  <span>预置位</span>
                  <input value={selectedCatalogPoint.preset} readOnly />
                </label>
                <fieldset>
                  <legend>巡检指标 <b>至少选择 1 项</b></legend>
                  <div className="elm-dialog-metrics">
                    {METRICS.map((metric) => {
                      const checked = selectedMetrics.includes(metric.name);
                      return (
                        <label key={metric.name} className={checked ? "checked" : ""}>
                          <input type="checkbox" checked={checked} onChange={() => toggleMetric(metric.name)} />
                          <span>{checked && <IconCheck size={12} />}</span>
                          <strong>{metric.name}</strong>
                          <small>{metric.group}</small>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="elm-bind-next-note"><IconMapPin size={16} />绑定完成后，将进入平面图定位模式。</div>
              </>
            ) : (
              <div className="elm-bind-placeholder">
                <IconDeviceCctv size={40} />
                <strong>选择待绑定的音视频测点</strong>
                <span>已绑定测点不可重复选择。</span>
              </div>
            )}
          </div>
        </div>

        <footer>
          <span>{selectedCatalogPoint ? `已选择 ${selectedMetrics.length} 项巡检指标` : "尚未选择测点"}</span>
          <button type="button" onClick={onCancel}>取消</button>
          <button
            type="button"
            className="primary"
            disabled={!selectedCatalogPoint || !selectedMetrics.length}
            onClick={confirm}
            title={!selectedCatalogPoint ? "请先选择音视频测点" : !selectedMetrics.length ? "请至少选择一个巡检指标" : "绑定并进入平面图定位"}
          >
            下一步：平面图定位
          </button>
        </footer>
      </section>
    </div>
  );
}

function BindingTable({ points, onSelectPoint, onAddPoint, onExport }) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [environment, setEnvironment] = useState("all");
  const filteredRows = useMemo(() => points.filter((point) => {
    const matchesKeyword = !keyword.trim() || `${point.id}${point.name}${point.camera}${point.environment}`.toLowerCase().includes(keyword.trim().toLowerCase());
    const matchesStatus = status === "all" || point.status === status;
    const matchesEnvironment = environment === "all" || point.environmentId === environment;
    return matchesKeyword && matchesStatus && matchesEnvironment;
  }), [environment, keyword, points, status]);

  return (
    <div className="elm-binding-view">
      <header>
        <div>
          <strong>音视频测点绑定</strong>
          <span>统一维护设备环境、音视频设备、预置位与巡检指标关系</span>
        </div>
        <span className="elm-binding-head-actions">
          <button type="button" onClick={onExport}><IconDownload size={16} /> 导出配置</button>
          <button type="button" className="primary" onClick={onAddPoint}><IconCirclePlus size={17} /> 绑定测点</button>
        </span>
      </header>
      <div className="elm-binding-stats">
        <span><strong>{points.length}</strong> 已绑定测点</span>
        <span><strong>{points.filter((item) => item.status === "alarm" || item.status === "warning").length}</strong> 异常/告警</span>
        <span><strong>{new Set(points.flatMap((item) => item.metrics)).size}</strong> 已应用指标</span>
        <span><strong>{points.filter((item) => Number.isFinite(item.x)).length}</strong> 已完成定位</span>
      </div>
      <div className="elm-binding-filters">
        <label><IconSearch size={15} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索编码、名称、设备或环境" /></label>
        <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
          <option value="all">全部设备环境</option>
          {ENVIRONMENT_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.path}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">全部运行状态</option>
          {Object.entries(STATUS_META).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </select>
        <span>共 {filteredRows.length} 条</span>
        {(keyword || status !== "all" || environment !== "all") && <button type="button" onClick={() => { setKeyword(""); setStatus("all"); setEnvironment("all"); }}>重置</button>}
      </div>
      <div className="elm-binding-table-wrap">
        <table>
          <thead>
            <tr>
              <th>测点编码 / 名称</th>
              <th>设备环境</th>
              <th>音视频设备</th>
              <th>预置位</th>
              <th>绑定指标</th>
              <th>位置状态</th>
              <th>运行状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((point) => (
              <tr key={point.id}>
                <td><strong>{point.id}</strong><small>{point.name}</small></td>
                <td>{point.environment}</td>
                <td className="truncate" title={point.camera}>{point.camera}</td>
                <td>{point.preset.replace(/^预置位\d+\s*/, "")}</td>
                <td><span className="metric-count">{point.metrics.length} 项</span>{point.metrics.slice(0, 2).join("、")}</td>
                <td>{Number.isFinite(point.x) ? <span className="bound-state"><IconMapPin size={14} /> 已定位</span> : <span className="unbound-state"><IconAlertTriangle size={14} /> 待定位</span>}</td>
                <td><span className={`table-status status-${point.status}`}><i />{pointStatus(point).label}</span></td>
                <td><button type="button" onClick={() => onSelectPoint(point)}>编辑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredRows.length && <div className="elm-binding-empty">没有符合筛选条件的测点<button type="button" onClick={() => { setKeyword(""); setStatus("all"); setEnvironment("all"); }}>清除筛选</button></div>}
      </div>
    </div>
  );
}

export function EquipmentLocationManagement() {
  const uploadRef = useRef(null);
  const importRef = useRef(null);
  const mapRef = useRef(null);
  const mapViewportRef = useRef(null);
  const layerMenuRef = useRef(null);
  const storedPlanRef = useRef(loadStoredFloorPlan());
  const [activeTab, setActiveTab] = useState("overview");
  const [points, setPoints] = useState(loadStoredPoints);
  const [regions, setRegions] = useState(loadStoredRegions);
  const [selectedEnvironment, setSelectedEnvironment] = useState("boiler");
  const [activeTreeId, setActiveTreeId] = useState("boiler");
  const [selectedPointId, setSelectedPointId] = useState("G1-01");
  const [draft, setDraft] = useState(() => {
    const first = loadStoredPoints().find((point) => point.id === "G1-01") || loadStoredPoints()[0];
    return first ? { ...first, metrics: [...first.metrics] } : null;
  });
  const [expanded, setExpanded] = useState(() => new Set(["plant", "production", "boiler", "boiler-body", "furnace-front", "flue", "boiler-aux"]));
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(100);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [dynamicMapEnabled, setDynamicMapEnabled] = useState(() => {
    try {
      return window.localStorage.getItem("ronds-equipment-location-dynamic-map") !== "paused";
    } catch {
      return true;
    }
  });
  const [liveTick, setLiveTick] = useState(0);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(() => new Date());
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [mapNavigator, setMapNavigator] = useState({ left: 0, top: 0, width: 100, height: 100 });
  const [locating, setLocating] = useState(false);
  const [mapTool, setMapTool] = useState("pan");
  const [measurement, setMeasurement] = useState(null);
  const [regionEditorOpen, setRegionEditorOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState("region-boiler-body");
  const [regionDrawing, setRegionDrawing] = useState(false);
  const [regionDrawStart, setRegionDrawStart] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [floorPlan, setFloorPlan] = useState(storedPlanRef.current.source);
  const [floorPlanName, setFloorPlanName] = useState(storedPlanRef.current.name);
  const [fullscreen, setFullscreen] = useState(false);
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [configDirty, setConfigDirty] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationChecks, setValidationChecks] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importCandidate, setImportCandidate] = useState(null);
  const [videoPreviewPoint, setVideoPreviewPoint] = useState(null);
  const [recoveryCandidate, setRecoveryCandidate] = useState(loadStoredPageDraft);
  const [draggingPointId, setDraggingPointId] = useState("");
  const draftPersistenceWarningRef = useRef("");
  const [layoutMode, setLayoutMode] = useState(() => {
    try {
      const saved = window.localStorage.getItem("ronds-equipment-location-layout");
      return ["balanced", "canvas", "config"].includes(saved) ? saved : "balanced";
    } catch {
      return "balanced";
    }
  });

  const selectedPoint = points.find((point) => point.id === selectedPointId) || null;
  const dirty = Boolean(selectedPoint && draft && JSON.stringify(selectedPoint) !== JSON.stringify(draft));
  const hasUnsaved = dirty || configDirty;
  const scope = useMemo(() => environmentScope(selectedEnvironment), [selectedEnvironment]);
  const validationPoints = useMemo(() => draft
    ? points.map((point) => point.id === draft.id ? { ...draft, metrics: [...draft.metrics] } : point)
    : points, [draft, points]);
  const scopePoints = useMemo(() => validationPoints.filter((point) => scope.ids.includes(point.environmentId)), [scope, validationPoints]);
  const scopeRegions = useMemo(() => regions.filter((region) => scope.ids.includes(region.environmentId)), [regions, scope]);
  const selectedRegion = regions.find((region) => region.id === selectedRegionId && scope.ids.includes(region.environmentId)) || scopeRegions[0] || null;
  const liveChecks = useMemo(() => buildConfigurationChecks(points, floorPlan, regions), [floorPlan, points, regions]);
  const filteredPoints = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return points;
    return points.filter((point) => `${point.id}${point.name}${point.environment}`.toLowerCase().includes(keyword));
  }, [points, search]);
  const filteredEnvironments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return [];
    return SEARCHABLE_ENVIRONMENTS.filter((item) => `${item.name}${item.path}${item.kindLabel}`.toLowerCase().includes(keyword));
  }, [search]);
  const unboundPointCount = AUDIO_VIDEO_POINT_CATALOG.filter((catalogPoint) => !points.some((point) => point.id === catalogPoint.id)).length;
  const incompletePointCount = points.filter((point) => (
    !point.camera
    || !point.preset
    || !point.metrics?.length
    || !Number.isFinite(point.x)
    || !Number.isFinite(point.y)
  )).length;
  const dynamicMapActive = dynamicMapEnabled
    && activeTab === "overview"
    && mapTool === "pan"
    && !locating
    && !regionEditorOpen
    && !regionDrawing
    && !draggingPointId;
  const liveCycleStep = Math.floor(liveTick / 6);
  const liveStatusByPoint = useMemo(() => Object.fromEntries(points.map((point) => {
    const cycle = LIVE_STATUS_CYCLES[point.id] || [point.status];
    return [point.id, cycle[liveCycleStep % cycle.length] || point.status];
  })), [liveCycleStep, points]);
  const liveScopeCounts = useMemo(() => scopePoints.reduce((counts, point) => {
    const status = liveStatusByPoint[point.id] || point.status;
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {}), [liveStatusByPoint, scopePoints]);
  const liveTimeLabel = liveUpdatedAt.toLocaleTimeString("zh-CN", { hour12: false });

  useEffect(() => {
    const customFeedback = (event) => setFeedback(event.detail);
    window.addEventListener("elm-feedback", customFeedback);
    return () => window.removeEventListener("elm-feedback", customFeedback);
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(""), 2600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    try {
      window.localStorage.setItem("ronds-equipment-location-layout", layoutMode);
    } catch {
      // Layout preference is non-critical when storage is unavailable.
    }
  }, [layoutMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem("ronds-equipment-location-dynamic-map", dynamicMapEnabled ? "live" : "paused");
    } catch {
      // Dynamic view preference is non-critical when storage is unavailable.
    }
  }, [dynamicMapEnabled]);

  useEffect(() => {
    if (!dynamicMapActive) return undefined;
    const timer = window.setInterval(() => {
      setLiveUpdatedAt(new Date());
      setLiveTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [dynamicMapActive]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    let parent = mapViewportRef.current?.parentElement;
    while (parent) {
      if (parent.scrollTop || parent.scrollLeft) {
        parent.scrollTop = 0;
        parent.scrollLeft = 0;
      }
      parent = parent.parentElement;
    }
  }, []);

  useEffect(() => {
    if (!configDirty || recoveryCandidate) return undefined;
    const timer = window.setTimeout(() => {
      try {
        const result = persistPageDraft(points, regions, floorPlan, floorPlanName);
        if (!result.floorPlanRestorable && draftPersistenceWarningRef.current !== floorPlanName) {
          draftPersistenceWarningRef.current = floorPlanName;
          setFeedback("页面草稿已自动保护测点修改；当前平面图文件过大，刷新后无法恢复该底图");
        }
      } catch {
        if (draftPersistenceWarningRef.current !== "storage-error") {
          draftPersistenceWarningRef.current = "storage-error";
          setFeedback("页面草稿自动保护失败：本地存储空间不足，请导出 JSON 备份");
        }
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [configDirty, floorPlan, floorPlanName, points, recoveryCandidate, regions]);

  useEffect(() => {
    const closeFullscreen = (event) => {
      if (event.key !== "Escape") return;
      if (bindDialogOpen) setBindDialogOpen(false);
      else if (validationOpen) setValidationOpen(false);
      else if (previewOpen) setPreviewOpen(false);
      else if (importCandidate) setImportCandidate(null);
      else if (videoPreviewPoint) setVideoPreviewPoint(null);
      else if (layerMenuOpen) setLayerMenuOpen(false);
      else if (regionEditorOpen) {
        setRegionEditorOpen(false);
        setRegionDrawing(false);
        setRegionDrawStart(null);
        setMapTool("pan");
      }
      else if (locating) {
        setLocating(false);
        setMapTool("pan");
      }
      else if (fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", closeFullscreen);
    return () => window.removeEventListener("keydown", closeFullscreen);
  }, [bindDialogOpen, fullscreen, importCandidate, layerMenuOpen, locating, previewOpen, regionEditorOpen, validationOpen, videoPreviewPoint]);

  useEffect(() => {
    if (!layerMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!layerMenuRef.current?.contains(event.target)) setLayerMenuOpen(false);
    };
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => window.removeEventListener("mousedown", closeOnOutsideClick);
  }, [layerMenuOpen]);

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) return undefined;
    const zoomWithWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom((value) => Math.max(60, Math.min(180, value + (event.deltaY < 0 ? 10 : -10))));
    };
    viewport.addEventListener("wheel", zoomWithWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", zoomWithWheel);
  }, [activeTab]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const viewport = mapViewportRef.current;
      if (!viewport) return;
      const width = Math.min(100, (viewport.clientWidth / Math.max(viewport.scrollWidth, 1)) * 100);
      const height = Math.min(100, (viewport.clientHeight / Math.max(viewport.scrollHeight, 1)) * 100);
      setMapNavigator({
        left: (viewport.scrollLeft / Math.max(viewport.scrollWidth, 1)) * 100,
        top: (viewport.scrollTop / Math.max(viewport.scrollHeight, 1)) * 100,
        width,
        height,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, fullscreen, layoutMode, zoom]);

  useEffect(() => {
    const protectUnsaved = (event) => {
      if (!hasUnsaved) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectUnsaved);
    return () => window.removeEventListener("beforeunload", protectUnsaved);
  }, [hasUnsaved]);

  const selectTreeItem = (item) => {
    if (dirty && !window.confirm("当前测点存在未保存修改，是否放弃并切换？")) return;
    if (item.type === "point") {
      const point = points.find((entry) => entry.id === item.id);
      setActiveTreeId(item.id);
      setSelectedPointId(item.id);
      setSelectedEnvironment(point?.environmentId || selectedEnvironment);
      setDraft(point ? { ...point, metrics: [...point.metrics] } : null);
      return;
    }
    setActiveTreeId(item.id);
    setSelectedEnvironment(item.id);
    setSelectedPointId("");
    setDraft(null);
    if (item.children) {
      setExpanded((current) => new Set([...current, item.id]));
    }
  };

  const selectPoint = (point, { preserveScope = false } = {}) => {
    if (dirty && point.id !== selectedPointId && !window.confirm("当前测点存在未保存修改，是否放弃并切换？")) return;
    setActiveTreeId(point.id);
    setSelectedPointId(point.id);
    if (!preserveScope) setSelectedEnvironment(point.environmentId);
    setDraft({ ...point, metrics: [...point.metrics] });
    setActiveTab("overview");
  };

  const applyPointDraft = () => {
    if (!draft || !selectedPoint) return;
    if (!draft.camera.trim()) {
      setFeedback("请选择音视频设备");
      return;
    }
    if (!draft.preset.trim()) {
      setFeedback("请选择设备预置位");
      return;
    }
    if (!draft.metrics.length) {
      setFeedback("请至少选择一个巡检指标");
      return;
    }
    const nextPoints = points.map((point) => point.id === draft.id ? { ...draft, metrics: [...draft.metrics] } : point);
    setPoints(nextPoints);
    setDraft({ ...draft, metrics: [...draft.metrics] });
    setConfigDirty(true);
    setFeedback(`${draft.id} 的修改已应用到页面草稿，请点击顶部“保存配置”提交平台版本`);
  };

  const saveConfiguration = () => {
    if (dirty) {
      setFeedback("请先将当前测点修改应用到页面草稿");
      return;
    }
    const checks = buildConfigurationChecks(points, floorPlan, regions);
    const blockingChecks = checks.filter((check) => check.status === "block");
    if (blockingChecks.length) {
      setConfigDirty(true);
      setValidationChecks(checks);
      setValidationOpen(true);
      setFeedback(`配置检查未通过：请先处理 ${blockingChecks.length} 个阻断项`);
      return;
    }
    const planBytes = estimateDataUrlBytes(floorPlan);
    if (floorPlan.startsWith("data:") && planBytes > MAX_PERSISTED_PLAN_BYTES) {
      setConfigDirty(true);
      setFeedback(`平面图约 ${(planBytes / 1024 / 1024).toFixed(1)}MB，超过本地演示版 2.5MB 保存上限；请压缩后重新上传`);
      return;
    }
    const storageKeys = [
      "ronds-equipment-location-points",
      "ronds-equipment-location-regions",
      "ronds-equipment-location-floorplan",
      "ronds-equipment-location-floorplan-name",
      "ronds-equipment-location-saved-at",
    ];
    const previousStorage = new Map(storageKeys.map((key) => [key, window.localStorage.getItem(key)]));
    try {
      if (floorPlan.startsWith("data:")) {
        window.localStorage.setItem("ronds-equipment-location-floorplan", floorPlan);
      } else {
        window.localStorage.removeItem("ronds-equipment-location-floorplan");
      }
      window.localStorage.setItem("ronds-equipment-location-floorplan-name", floorPlanName);
      window.localStorage.setItem("ronds-equipment-location-points", JSON.stringify(points));
      window.localStorage.setItem("ronds-equipment-location-regions", JSON.stringify(regions));
      window.localStorage.setItem("ronds-equipment-location-saved-at", new Date().toISOString());
    } catch {
      previousStorage.forEach((value, key) => {
        try {
          if (value === null) window.localStorage.removeItem(key);
          else window.localStorage.setItem(key, value);
        } catch {
          // Keep the page draft available even if the browser cannot fully roll back storage.
        }
      });
      setFeedback("平台版本保存失败，本地存储空间不足；页面草稿仍保留，可导出 JSON 备份");
      return;
    }
    clearStoredPageDraft();
    storedPlanRef.current = { source: floorPlan, name: floorPlanName };
    setConfigDirty(false);
    setFeedback("设备位置配置已保存为平台版本");
  };

  const deletePoint = () => {
    if (!selectedPoint || !window.confirm(`确定删除音视频测点 ${selectedPoint.id}？保存配置后生效。`)) return;
    const nextPoints = points.filter((point) => point.id !== selectedPoint.id);
    setPoints(nextPoints);
    setConfigDirty(true);
    const next = nextPoints[0] || null;
    setActiveTreeId(next?.id || selectedEnvironment);
    setSelectedPointId(next?.id || "");
    setDraft(next ? { ...next, metrics: [...next.metrics] } : null);
    setFeedback(`${selectedPoint.id} 已从草稿移除，请保存配置`);
  };

  const bindPoint = (point) => {
    if (points.some((item) => item.id === point.id)) {
      setFeedback(`${point.id} 已绑定，不能重复添加`);
      return;
    }
    setPoints((current) => [...current, point]);
    setBindDialogOpen(false);
    setConfigDirty(true);
    setActiveTreeId(point.id);
    setSelectedPointId(point.id);
    setSelectedEnvironment(point.environmentId);
    setDraft({ ...point, metrics: [...point.metrics] });
    setActiveTab("overview");
    setLocating(true);
    setMapTool("locate");
    setMeasurement(null);
    setExpanded((current) => new Set([...current, point.environmentId]));
    setFeedback(`已绑定 ${point.id}，请在平面图上完成定位`);
  };

  const mapPercentPoint = (event) => {
    if (!mapRef.current) return null;
    const rect = mapRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const ensureRegionForEnvironment = (environmentId) => {
    const existing = regions.find((region) => region.environmentId === environmentId);
    if (existing) {
      setSelectedRegionId(existing.id);
      return existing;
    }
    const environment = ENVIRONMENT_OPTIONS.find((item) => item.id === environmentId);
    if (!environment) return null;
    const offset = regions.length % 5;
    const created = {
      id: `region-${environmentId}-${Date.now()}`,
      environmentId,
      name: environment.name,
      color: ENVIRONMENTS.find((group) => group.children.some((child) => child.id === environmentId))?.color || "#3b82f6",
      x: 12 + offset * 5,
      y: 14 + offset * 4,
      width: 24,
      height: 20,
    };
    setRegions((current) => [...current, created]);
    setSelectedRegionId(created.id);
    setConfigDirty(true);
    setFeedback(`${created.name}区域已添加到页面草稿，请重新框选准确范围`);
    return created;
  };

  const addRegion = (environmentId = selectedRegion?.environmentId || scope.ids[0]) => {
    const environment = ENVIRONMENT_OPTIONS.find((item) => item.id === environmentId);
    if (!environment) return;
    const environmentRegions = regions.filter((region) => region.environmentId === environmentId);
    const offset = regions.length % 6;
    const created = {
      id: `region-${environmentId}-${Date.now()}-${environmentRegions.length + 1}`,
      environmentId,
      name: `${environment.name}分区 ${environmentRegions.length + 1}`,
      color: ENVIRONMENTS.find((group) => group.children.some((child) => child.id === environmentId))?.color || "#3b82f6",
      x: Math.min(70, 12 + offset * 6),
      y: Math.min(68, 14 + offset * 5),
      width: 22,
      height: 18,
    };
    setRegions((current) => [...current, created]);
    setSelectedRegionId(created.id);
    setShowZones(true);
    setRegionEditorOpen(true);
    setRegionDrawing(true);
    setRegionDrawStart(null);
    setMapTool("region");
    setConfigDirty(true);
    setFeedback(`已新增“${created.name}”，请在平面图上拖拽框选范围`);
  };

  const openRegionSettings = () => {
    const environmentId = selectedPoint?.environmentId || (scope.ids.length === 1 ? scope.ids[0] : scope.ids[0]);
    ensureRegionForEnvironment(environmentId);
    setRegionEditorOpen(true);
    setRegionDrawing(false);
    setRegionDrawStart(null);
    setShowZones(true);
    setLocating(false);
    setMeasurement(null);
    setMapTool("region");
    setFeedback("区域设置已打开，可修改参数或在平面图上重新框选");
  };

  const updateSelectedRegion = (patch) => {
    if (!selectedRegion) return;
    setRegions((current) => current.map((region) => {
      if (region.id !== selectedRegion.id) return region;
      const next = { ...region, ...patch };
      const x = Math.max(0, Math.min(97, Number(next.x)));
      const y = Math.max(0, Math.min(97, Number(next.y)));
      return {
        ...next,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        width: Number(Math.max(3, Math.min(100 - x, Number(next.width))).toFixed(2)),
        height: Number(Math.max(3, Math.min(100 - y, Number(next.height))).toFixed(2)),
      };
    }));
    setConfigDirty(true);
  };

  const handleRegionPointerDown = (event) => {
    if (mapTool !== "region" || !regionDrawing || !selectedRegion || event.button !== 0) return;
    const point = mapPercentPoint(event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    setRegionDrawStart(point);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic QA events and older browsers may not expose an active pointer capture.
    }
  };

  const handleRegionPointerMove = (event) => {
    if (!regionDrawStart || !regionDrawing || !selectedRegion) return;
    const point = mapPercentPoint(event);
    if (!point) return;
    event.preventDefault();
    const x = Math.min(regionDrawStart.x, point.x);
    const y = Math.min(regionDrawStart.y, point.y);
    updateSelectedRegion({
      x,
      y,
      width: Math.max(3, Math.abs(point.x - regionDrawStart.x)),
      height: Math.max(3, Math.abs(point.y - regionDrawStart.y)),
    });
  };

  const handleRegionPointerUp = (event) => {
    if (!regionDrawStart || !regionDrawing || !selectedRegion) return;
    event.preventDefault();
    event.stopPropagation();
    setRegionDrawStart(null);
    setRegionDrawing(false);
    setFeedback(`${selectedRegion.name}范围已重新框选并写入页面草稿`);
  };

  const handleMapClick = (event) => {
    if (!mapRef.current) return;
    if (mapTool === "region") return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(4, Math.min(96, ((event.clientY - rect.top) / rect.height) * 100));
    if (locating && draft) {
      setDraft({ ...draft, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
      setLocating(false);
      setMapTool("pan");
      setFeedback(`${draft.id} 已定位，请应用到页面草稿`);
      return;
    }
    if (mapTool !== "measure") return;
    const nextPoint = { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
    if (!measurement || measurement.end) {
      setMeasurement({ start: nextPoint, end: null });
      setFeedback("已设置测量起点，请点击平面图设置终点");
      return;
    }
    const dx = nextPoint.x - measurement.start.x;
    const dy = nextPoint.y - measurement.start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    setMeasurement({ ...measurement, end: nextPoint, distance: Number(distance.toFixed(1)) });
    setFeedback(`测量完成：约占平面图对角尺度的 ${distance.toFixed(1)}%`);
  };

  const updateDraftPosition = (x, y, message) => {
    if (!draft) return;
    const nextX = Math.max(3, Math.min(97, Number(x)));
    const nextY = Math.max(4, Math.min(96, Number(y)));
    setDraft((current) => current ? {
      ...current,
      x: Number(nextX.toFixed(2)),
      y: Number(nextY.toFixed(2)),
    } : current);
    setFeedback(message || `${draft.id} 的位置已调整，请应用到页面草稿`);
  };

  const handleMarkerDrop = (event) => {
    if (!draggingPointId || draggingPointId !== draft?.id || !mapRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    updateDraftPosition(x, y, `${draft.id} 已拖动到新位置，请应用到页面草稿`);
    setDraggingPointId("");
  };

  const nudgeSelectedMarker = (event, point) => {
    if (point.id !== selectedPointId || !draft || !Number.isFinite(draft.x) || !Number.isFinite(draft.y)) return;
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 1 : 0.25;
    updateDraftPosition(
      draft.x + direction[0] * step,
      draft.y + direction[1] * step,
      `${draft.id} 已${event.shiftKey ? "按 1%" : "精细"}微调至 ${Number(draft.x + direction[0] * step).toFixed(2)}%, ${Number(draft.y + direction[1] * step).toFixed(2)}%`,
    );
  };

  const restoreMapView = () => {
    setZoom(100);
    setShowZones(true);
    setShowMarkers(true);
    setMapTool("pan");
    setMeasurement(null);
    setLocating(false);
    setRegionEditorOpen(false);
    setRegionDrawing(false);
    setRegionDrawStart(null);
    setLayerMenuOpen(false);
    setFeedback("已恢复默认视图与全部图层");
  };

  const fitMapToWindow = () => {
    setZoom(100);
    window.requestAnimationFrame(() => {
      mapViewportRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
    setFeedback("平面图已适应当前窗口");
  };

  const syncMapNavigator = (viewport) => {
    if (!viewport) return;
    setMapNavigator({
      left: (viewport.scrollLeft / Math.max(viewport.scrollWidth, 1)) * 100,
      top: (viewport.scrollTop / Math.max(viewport.scrollHeight, 1)) * 100,
      width: Math.min(100, (viewport.clientWidth / Math.max(viewport.scrollWidth, 1)) * 100),
      height: Math.min(100, (viewport.clientHeight / Math.max(viewport.scrollHeight, 1)) * 100),
    });
  };

  const panFromMiniMap = (event) => {
    const viewport = mapViewportRef.current;
    if (!viewport) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratioX = (event.clientX - rect.left) / rect.width;
    const ratioY = (event.clientY - rect.top) / rect.height;
    const left = Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, ratioX * viewport.scrollWidth - viewport.clientWidth / 2));
    const top = Math.max(0, Math.min(viewport.scrollHeight - viewport.clientHeight, ratioY * viewport.scrollHeight - viewport.clientHeight / 2));
    viewport.scrollTo({ left, top, behavior: "smooth" });
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback("仅支持 PNG、JPG、WEBP 等图片格式");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeedback("平面图文件不能超过 10MB");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFloorPlan(String(reader.result));
      setFloorPlanName(file.name);
      setZoom(100);
      setConfigDirty(true);
      const planBytes = estimateDataUrlBytes(String(reader.result));
      setFeedback(planBytes > MAX_PERSISTED_PLAN_BYTES
        ? `平面图已载入，但约 ${(planBytes / 1024 / 1024).toFixed(1)}MB，超过本地演示版保存上限；请压缩后再保存`
        : "平面图已载入，请检查标记位置后保存配置");
    };
    reader.onerror = () => setFeedback("平面图读取失败，请重新选择文件");
    reader.readAsDataURL(file);
  };

  const clearMarkers = () => {
    const locatedCount = scopePoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).length;
    if (!locatedCount) {
      setFeedback(`${scope.name}暂无可清空的测点标记`);
      return;
    }
    if (!window.confirm(`确定清空“${scope.name}”内的 ${locatedCount} 个测点标记？测点绑定信息会保留。`)) return;
    const nextPoints = points.map((point) => scope.ids.includes(point.environmentId)
      ? { ...point, x: null, y: null }
      : point);
    setPoints(nextPoints);
    setConfigDirty(true);
    const selected = nextPoints.find((point) => point.id === selectedPointId);
    if (selected) setDraft({ ...selected, metrics: [...selected.metrics] });
    setFeedback(`已清空${scope.name}内的测点标记，可随时重新定位`);
  };

  const restoreSavedConfiguration = ({ announce = true } = {}) => {
    const savedPoints = loadStoredPoints();
    const savedRegions = loadStoredRegions();
    const savedPlan = loadStoredFloorPlan();
    setPoints(savedPoints);
    setRegions(savedRegions);
    setFloorPlan(savedPlan.source);
    setFloorPlanName(savedPlan.name);
    setZoom(100);
    setMapTool("pan");
    setMeasurement(null);
    setLocating(false);
    setRegionEditorOpen(false);
    setRegionDrawing(false);
    setRegionDrawStart(null);
    setConfigDirty(false);
    clearStoredPageDraft();
    setRecoveryCandidate(null);
    const next = savedPoints.find((point) => point.id === selectedPointId) || savedPoints[0] || null;
    setSelectedPointId(next?.id || "");
    setActiveTreeId(next?.id || selectedEnvironment);
    setDraft(next ? { ...next, metrics: [...next.metrics] } : null);
    if (announce) setFeedback("已恢复到上次保存的配置");
  };

  const restorePageDraft = () => {
    if (!recoveryCandidate) return;
    const restoredPoints = recoveryCandidate.points.map((point) => ({ ...point, metrics: [...point.metrics] }));
    const restoredRegions = normalizeRegions(recoveryCandidate.regions);
    const restoredPlan = recoveryCandidate.floorPlanRestorable && recoveryCandidate.floorPlanSource
      ? recoveryCandidate.floorPlanSource
      : storedPlanRef.current.source;
    const restoredPlanName = recoveryCandidate.floorPlanRestorable
      ? recoveryCandidate.floorPlanName
      : storedPlanRef.current.name;
    const first = restoredPoints.find((point) => point.id === selectedPointId) || restoredPoints[0] || null;
    setPoints(restoredPoints);
    setRegions(restoredRegions);
    setFloorPlan(restoredPlan);
    setFloorPlanName(restoredPlanName);
    setSelectedPointId(first?.id || "");
    setActiveTreeId(first?.id || "plant");
    setSelectedEnvironment(first?.environmentId || "plant");
    setDraft(first ? { ...first, metrics: [...first.metrics] } : null);
    setExpanded((current) => new Set(first ? [...current, first.environmentId] : current));
    setConfigDirty(true);
    setRecoveryCandidate(null);
    setActiveTab("overview");
    setMapTool("pan");
    setLocating(false);
    setMeasurement(null);
    setRegionEditorOpen(false);
    setRegionDrawing(false);
    setRegionDrawStart(null);
    setFeedback(recoveryCandidate.floorPlanRestorable
      ? "页面草稿已恢复，请核对后保存配置"
      : "测点页面草稿已恢复；大尺寸平面图无法恢复，当前保留平台版本底图");
  };

  const discardPageDraft = () => {
    clearStoredPageDraft();
    setRecoveryCandidate(null);
    setFeedback("已忽略本地页面草稿，继续使用平台已保存版本");
  };

  const refreshConfiguration = () => {
    if (hasUnsaved && !window.confirm("当前存在未保存修改。刷新将恢复到上次保存的配置，是否继续？")) return;
    restoreSavedConfiguration({ announce: false });
    setFeedback("设备环境与测点状态已刷新");
  };

  const exportConfiguration = () => {
    if (dirty) {
      setFeedback("请先将当前测点修改应用到页面草稿，再导出配置");
      return;
    }
    const exportPoints = points.map((point) => ({ ...point, metrics: [...point.metrics] }));
    const payload = {
      version: "1.2-location",
      exportedAt: new Date().toISOString(),
      source: hasUnsaved ? "current-draft" : "saved-configuration",
      plant: "华东电厂",
      plan: { name: floorPlanName },
      environments: ENVIRONMENT_OPTIONS,
      regions,
      summary: {
        boundPointCount: exportPoints.length,
        locatedPointCount: exportPoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).length,
        metricCount: new Set(exportPoints.flatMap((point) => point.metrics || [])).size,
      },
      points: exportPoints.map((point) => ({ ...point, coordinateType: "normalized-percent" })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `设备位置配置_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setFeedback(`已导出当前${hasUnsaved ? "草稿" : "已保存"}的位置配置：${exportPoints.length} 个测点`);
  };

  const handleConfigurationImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!file.name.toLowerCase().endsWith(".json")) {
      setFeedback("仅支持导入 JSON 设备位置配置文件");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback("配置文件不能超过 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const candidate = validateImportedConfiguration(JSON.parse(String(reader.result)), file.name);
        setImportCandidate(candidate);
        setFeedback(`已校验 ${candidate.points.length} 个测点，请确认导入范围`);
      } catch (error) {
        setFeedback(`配置导入失败：${error instanceof Error ? error.message : "文件内容无效"}`);
      }
    };
    reader.onerror = () => setFeedback("配置导入失败：无法读取文件");
    reader.readAsText(file, "utf-8");
  };

  const confirmConfigurationImport = () => {
    if (!importCandidate) return;
    const importedPoints = importCandidate.points.map((point) => ({ ...point, metrics: [...point.metrics] }));
    const first = importedPoints[0] || null;
    setPoints(importedPoints);
    setSelectedPointId(first?.id || "");
    setActiveTreeId(first?.id || "plant");
    setSelectedEnvironment(first?.environmentId || "plant");
    setDraft(first ? { ...first, metrics: [...first.metrics] } : null);
    setExpanded((current) => new Set(first ? [...current, first.environmentId] : current));
    setActiveTab("overview");
    setLocating(false);
    setMapTool("pan");
    setMeasurement(null);
    setShowMarkers(true);
    setConfigDirty(true);
    setImportCandidate(null);
    setFeedback(`已导入 ${importedPoints.length} 个测点为页面草稿，请检查平面图位置后保存配置`);
  };

  const runValidation = () => {
    setValidationChecks(liveChecks);
    setValidationOpen(true);
  };

  const handleValidationLocate = (pointId) => {
    const point = validationPoints.find((item) => item.id === pointId);
    if (!point) return;
    setPoints(validationPoints);
    setConfigDirty(true);
    setValidationOpen(false);
    setActiveTreeId(point.id);
    setSelectedPointId(point.id);
    setSelectedEnvironment(point.environmentId);
    setDraft({ ...point, metrics: [...point.metrics] });
    setActiveTab("overview");
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      setLocating(true);
      setMapTool("locate");
      setMeasurement(null);
      setFeedback(`请在平面图上定位 ${point.id}`);
    } else {
      setFeedback(`请完善 ${point.id} 的巡检指标`);
    }
  };

  const switchTab = (nextTab) => {
    if (nextTab === activeTab) return;
    if (dirty && !window.confirm("当前测点存在未保存修改，切换视图将放弃该测点的表单修改，是否继续？")) return;
    if (dirty && selectedPoint) setDraft({ ...selectedPoint, metrics: [...selectedPoint.metrics] });
    setActiveTab(nextTab);
  };

  const toggleExpanded = (id) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tree = {
    id: "plant",
    name: "华东电厂",
    color: "#5b7fa6",
    children: [{
      id: "production",
      name: "生产区域",
      color: "#4a9a74",
      children: ENVIRONMENTS,
    }],
  };
  const feedbackIsWarning = ["请", "不能", "失败", "无效", "仅支持", "超过"].some((keyword) => feedback.includes(keyword));

  return (
    <div className={`equipment-location-manager layout-${layoutMode} ${fullscreen ? "map-fullscreen" : ""}`}>
      <header className="elm-page-head">
        <div className="elm-title-block">
          <h1>设备位置管理</h1>
          <span>维护设备环境与音视频巡检测点的空间位置及指标关系</span>
        </div>
        <div className="elm-head-actions">
          <label className="elm-layout-mode" title="调整设备树、平面图和配置栏的比例">
            <IconLayoutList size={16} />
            <select
              value={layoutMode}
              onChange={(event) => {
                setLayoutMode(event.target.value);
                setFeedback(`已切换为${event.target.options[event.target.selectedIndex].text}`);
              }}
              aria-label="工作区布局比例"
            >
              <option value="balanced">均衡布局</option>
              <option value="canvas">画布优先</option>
              <option value="config">配置优先</option>
            </select>
          </label>
          <span className="elm-save-state" role="status">
            <i className={hasUnsaved ? "dirty" : ""} />
            {dirty ? "测点修改未应用" : configDirty ? "页面草稿待保存" : "配置已同步"}
          </span>
          <input ref={importRef} className="elm-import-input" type="file" accept="application/json,.json" hidden onChange={handleConfigurationImport} />
          <button
            type="button"
            className="elm-head-action elm-validation-action"
            onClick={runValidation}
            title="检查平面图、测点绑定、定位和巡检指标"
          >
            <IconClipboardCheck size={18} /> <span>交付检查</span>
          </button>
          <details className="elm-head-more">
            <summary aria-label="更多页面操作">更多 <IconChevronDown size={15} /></summary>
            <div>
              <button type="button" onClick={() => importRef.current?.click()}><IconFileImport size={17} /> 导入配置</button>
              <button
                type="button"
                onClick={exportConfiguration}
                disabled={dirty}
                title={dirty ? "请先将当前测点修改应用到页面草稿" : "导出当前设备位置配置 JSON"}
              >
                <IconDownload size={17} /> 导出 JSON
              </button>
              <button type="button" onClick={refreshConfiguration}><IconRefresh size={17} /> 刷新平台版本</button>
              {hasUnsaved && <button type="button" onClick={() => restoreSavedConfiguration()}><IconArrowBackUp size={17} /> 撤销全部修改</button>}
            </div>
          </details>
          <button
            type="button"
            className="primary elm-save-action"
            onClick={saveConfiguration}
            disabled={!configDirty || dirty}
            title={dirty ? "请先在右侧应用当前测点修改" : configDirty ? "保存页面草稿为平台版本" : "当前配置已同步"}
          >
            <IconCheck size={18} /> <span>保存配置</span>
          </button>
        </div>
      </header>

      <nav className="elm-tabs" aria-label="设备位置管理视图">
        <button type="button" className={activeTab === "overview" ? "active" : ""} onClick={() => switchTab("overview")}>
          <IconMap2 size={17} /> 环境总貌图
        </button>
        <button type="button" className={activeTab === "binding" ? "active" : ""} onClick={() => switchTab("binding")}>
          <IconLayoutList size={17} /> 测点绑定
          <span>{points.length}/{AUDIO_VIDEO_POINT_CATALOG.length}</span>
        </button>
      </nav>

      <div className="elm-body">
        <aside className="elm-tree-panel">
          <header>
            <div className="elm-tree-title">
              <span>
                <strong>设备环境</strong>
                <small>{ENVIRONMENT_OPTIONS.length} 个环境 · {points.length} 个测点</small>
              </span>
              <button type="button" onClick={() => setBindDialogOpen(true)} title="绑定音视频测点" aria-label="绑定音视频测点"><IconCirclePlus size={18} /></button>
            </div>
            <label className="elm-search">
              <IconSearch size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索区域/环境/测点" />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="清除搜索"><IconX size={14} /></button>}
            </label>
            <div className="elm-delivery-queue" role="status">
              <span>
                <small>配置队列</small>
                <strong>{unboundPointCount + incompletePointCount ? `${unboundPointCount + incompletePointCount} 项待处理` : "当前范围已就绪"}</strong>
              </span>
              <button
                type="button"
                disabled={!unboundPointCount && !incompletePointCount}
                onClick={() => {
                  if (incompletePointCount) runValidation();
                  else setBindDialogOpen(true);
                }}
                title={incompletePointCount ? "定位当前配置阻断项" : unboundPointCount ? "绑定尚未纳入配置的音视频测点" : "当前没有待处理项"}
              >
                {incompletePointCount ? `完善 ${incompletePointCount}` : unboundPointCount ? `待绑定 ${unboundPointCount}` : "已完成"}
                <IconChevronRight size={14} />
              </button>
            </div>
          </header>
          <div className="elm-tree-scroll">
            {search ? (
              <div className="elm-search-results">
                <div className="elm-search-summary">
                  <span>设备环境 {filteredEnvironments.length}</span>
                  <span>音视频测点 {filteredPoints.length}</span>
                </div>
                {filteredEnvironments.length > 0 && (
                  <section aria-label="匹配的设备环境">
                    <h4>设备环境</h4>
                    {filteredEnvironments.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={activeTreeId === item.id ? "active" : ""}
                        onClick={() => {
                          selectTreeItem(item);
                          setSearch("");
                        }}
                        title={item.path}
                      >
                        {item.children
                          ? <IconFolderOpen size={17} color={item.color || "#6b86a6"} />
                          : <IconMap2 size={17} color={item.color || "#6886aa"} />}
                        <span><strong>{item.name}</strong><small>{item.path}</small></span>
                        <em>{item.kindLabel}</em>
                      </button>
                    ))}
                  </section>
                )}
                {filteredPoints.length > 0 && (
                  <section aria-label="匹配的音视频测点">
                    <h4>音视频测点</h4>
                    {filteredPoints.map((point) => (
                      <button
                        type="button"
                        key={point.id}
                        className={selectedPointId === point.id ? "active" : ""}
                        onClick={() => {
                          selectPoint(point);
                          setSearch("");
                        }}
                        title={`${point.environment} / ${point.name}`}
                      >
                        <IconDeviceCctv size={17} color={pointStatus(point).color} />
                        <span><strong>{point.id}</strong><small>{point.name} · {point.environment}</small></span>
                        <i style={{ "--status-color": pointStatus(point).color }} aria-label={pointStatus(point).label} />
                      </button>
                    ))}
                  </section>
                )}
                {!filteredPoints.length && !filteredEnvironments.length && <div className="elm-no-result">未找到匹配的区域、环境或测点<button type="button" onClick={() => setSearch("")}>清除筛选</button></div>}
              </div>
            ) : (
              <div role="tree" aria-label="设备环境与音视频测点">
                <TreeRow
                  item={tree}
                  activeId={activeTreeId}
                  onSelect={selectTreeItem}
                  points={points}
                  expandedIds={expanded}
                  onToggle={toggleExpanded}
                />
              </div>
            )}
          </div>
          <footer className="elm-status-legend">
            {Object.entries(STATUS_META).map(([key, value]) => <span key={key}><i style={{ "--status-color": value.color }} />{value.label}</span>)}
          </footer>
        </aside>

        {activeTab === "binding" ? (
          <BindingTable points={points} onSelectPoint={selectPoint} onAddPoint={() => setBindDialogOpen(true)} onExport={exportConfiguration} />
        ) : (
          <>
            <section className="elm-map-panel">
              <header className="elm-map-toolbar">
                <div className="elm-file-context">
                  <button
                    type="button"
                    className="upload"
                    title={floorPlan ? "替换当前平面图" : "上传平面图"}
                    onClick={() => uploadRef.current?.click()}
                  >
                    <IconPhotoUp size={17} /> {floorPlan ? "替换平面图" : "上传平面图"}
                  </button>
                  <input ref={uploadRef} className="elm-plan-input" type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleUpload} />
                  <span title={floorPlanName}>{floorPlanName}</span>
                </div>
                <div className="elm-map-tools">
                  <div className="elm-tool-group elm-zoom-tools" role="group" aria-label="缩放控制">
                    <button type="button" onClick={() => setZoom((value) => Math.max(60, value - 10))} disabled={zoom <= 60} title={zoom <= 60 ? "已达到最小缩放比例" : "缩小"}><IconMinus size={16} /> 缩小</button>
                    <span className="elm-zoom-value" aria-label={`当前缩放 ${zoom}%`}>{zoom}%</span>
                    <button type="button" onClick={() => setZoom((value) => Math.min(180, value + 10))} disabled={zoom >= 180} title={zoom >= 180 ? "已达到最大缩放比例" : "放大"}><IconPlus size={16} /> 放大</button>
                    <button type="button" onClick={fitMapToWindow} title="适应窗口并回到平面图左上角"><IconFocus2 size={16} /> 适应窗口</button>
                  </div>
                  <div className="elm-tool-group" role="group" aria-label="画布视图">
                    <button type="button" onClick={restoreMapView} title="恢复默认视图">
                      <IconRefresh size={16} /> 恢复视图
                    </button>
                    <button type="button" onClick={() => setFullscreen((value) => !value)} title={fullscreen ? "退出全屏" : "全屏"}>
                      <IconArrowsMaximize size={16} /> {fullscreen ? "退出全屏" : "全屏"}
                    </button>
                  </div>
                  <div className="elm-tool-group" role="group" aria-label="区域配置">
                    <button
                      type="button"
                      className={regionEditorOpen ? "active" : ""}
                      onClick={() => {
                        if (regionEditorOpen) {
                          setRegionEditorOpen(false);
                          setRegionDrawing(false);
                          setRegionDrawStart(null);
                          setMapTool("pan");
                          setFeedback("区域设置已收起，页面草稿中的修改已保留");
                        } else {
                          openRegionSettings();
                        }
                      }}
                      title={regionEditorOpen ? "收起区域设置" : "设置设备环境区域"}
                    >
                      <IconSettings size={16} /> 区域设置
                    </button>
                  </div>
                  <div className="elm-tool-group elm-layer-tools" role="group" aria-label="图层显示" ref={layerMenuRef}>
                    <button
                      type="button"
                      className={`elm-layer-trigger ${layerMenuOpen ? "active" : ""}`}
                      aria-expanded={layerMenuOpen}
                      aria-haspopup="true"
                      onClick={() => setLayerMenuOpen((value) => !value)}
                      title="图层管理"
                    >
                      <IconLayersSubtract size={16} /> 图层
                      <em>{Number(showZones) + Number(showMarkers)}/2</em>
                    </button>
                    {layerMenuOpen && (
                      <div className="elm-layer-menu" role="dialog" aria-label="平面图图层管理">
                        <header>
                          <span><strong>图层管理</strong><small>{scope.name}</small></span>
                          <em>{Number(showZones) + Number(showMarkers) + 1}/3 可见</em>
                        </header>
                        <label className="disabled">
                          <span className="elm-layer-symbol base"><IconMap2 size={16} /></span>
                          <span><strong>2D 平面底图</strong><small>{floorPlanName}</small></span>
                          <input type="checkbox" checked readOnly disabled />
                          <span className="elm-layer-check"><IconCheck size={12} /></span>
                        </label>
                        <label>
                          <span className="elm-layer-symbol zones"><IconLayersSubtract size={16} /></span>
                          <span><strong>设备环境区域</strong><small>{scope.ids.length} 个区域范围</small></span>
                          <input type="checkbox" checked={showZones} onChange={() => setShowZones((value) => !value)} />
                          <span className="elm-layer-check">{showZones && <IconCheck size={12} />}</span>
                        </label>
                        <label>
                          <span className="elm-layer-symbol markers"><IconMapPin size={16} /></span>
                          <span><strong>音视频测点</strong><small>{scopePoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).length} 个已定位</small></span>
                          <input type="checkbox" checked={showMarkers} onChange={() => setShowMarkers((value) => !value)} />
                          <span className="elm-layer-check">{showMarkers && <IconCheck size={12} />}</span>
                        </label>
                        <footer>
                          <small>仅影响当前查看，不修改配置</small>
                          <button type="button" disabled={showZones && showMarkers} title={showZones && showMarkers ? "全部图层已显示" : "显示设备环境区域与测点标记"} onClick={() => { setShowZones(true); setShowMarkers(true); setFeedback("设备环境区域与测点标记已全部显示"); }}>全部显示</button>
                        </footer>
                      </div>
                    )}
                  </div>
                  <div className="elm-tool-group" role="group" aria-label="标记维护">
                    <button
                      type="button"
                      className={mapTool === "locate" ? "active" : ""}
                      disabled={!selectedPoint}
                      title={selectedPoint ? `重新定位 ${selectedPoint.id}` : "请先选择测点"}
                      onClick={() => {
                        if (!selectedPoint) return;
                        setMapTool("locate");
                        setMeasurement(null);
                        setLocating(true);
                        setFeedback(`请在平面图上点击 ${selectedPoint.id} 的新位置`);
                      }}
                    >
                      <IconMapPin size={16} /> 定位
                    </button>
                    <button
                      type="button"
                      className={mapTool === "measure" ? "active" : ""}
                      title="测量平面图相对距离"
                      onClick={() => {
                        const enabled = mapTool !== "measure";
                        setMapTool(enabled ? "measure" : "pan");
                        setLocating(false);
                        setMeasurement(null);
                        setFeedback(enabled ? "测量模式：请点击平面图设置起点" : "已退出测量模式");
                      }}
                    >
                      <IconRulerMeasure size={16} /> 测量
                    </button>
                    <button
                      type="button"
                      className="danger-quiet"
                      disabled={!scopePoints.some((point) => Number.isFinite(point.x) && Number.isFinite(point.y))}
                      onClick={clearMarkers}
                      title={scopePoints.some((point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? `清空${scope.name}内的测点标记` : `${scope.name}暂无已定位标记`}
                    >
                      <IconTrash size={16} /> 清空标记
                    </button>
                  </div>
                </div>
              </header>
              <div
                ref={mapViewportRef}
                className={`elm-map-viewport ${locating ? "locating" : ""} ${regionDrawing ? "region-drawing" : ""} tool-${mapTool}`}
                onScroll={(event) => syncMapNavigator(event.currentTarget)}
              >
                {locating && (
                  <div className="elm-location-tip">
                    <IconMapPin size={17} />
                    点击平面图放置 {draft?.id}
                    <button type="button" onClick={() => { setLocating(false); setMapTool("pan"); }}>取消</button>
                  </div>
                )}
                {!locating && selectedPoint && (
                  <div className="elm-map-selection">
                    <span className="elm-map-selection-icon" style={{ "--selection-color": pointStatus(draft || selectedPoint).color }}>
                      <IconCamera size={17} />
                    </span>
                    <strong title={`${selectedPoint.id} · ${selectedPoint.name}`}>{selectedPoint.id} · {selectedPoint.name}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setLocating(true);
                        setMapTool("locate");
                        setMeasurement(null);
                        setFeedback("请在平面图上点击新的测点位置");
                      }}
                    >
                      <IconFocus2 size={14} /> 定位
                    </button>
                  </div>
                )}
                {regionEditorOpen && selectedRegion && (
                  <aside className="elm-region-editor" aria-label="设备环境区域设置">
                    <header>
                      <span>
                        <strong>区域设置</strong>
                        <small>修改将直接进入页面草稿</small>
                      </span>
                      <div className="elm-region-head-actions">
                        <button
                          type="button"
                          className="add"
                          onClick={() => addRegion(selectedRegion.environmentId)}
                          title={`在${ENVIRONMENT_OPTIONS.find((item) => item.id === selectedRegion.environmentId)?.name || "当前环境"}下新增区域`}
                        >
                          <IconCirclePlus size={15} /> 新增区域
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRegionEditorOpen(false);
                            setRegionDrawing(false);
                            setRegionDrawStart(null);
                            setMapTool("pan");
                          }}
                          aria-label="收起区域设置"
                        >
                          <IconX size={16} />
                        </button>
                      </div>
                    </header>
                    <label>
                      <span>当前区域</span>
                      <select
                        value={selectedRegion.id}
                        onChange={(event) => {
                          setSelectedRegionId(event.target.value);
                          setRegionDrawing(false);
                          setRegionDrawStart(null);
                        }}
                      >
                        {scopeRegions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {ENVIRONMENT_OPTIONS.find((item) => item.id === region.environmentId)?.name || "设备环境"} · {region.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>设备环境</span>
                      <select
                        value={selectedRegion.environmentId}
                        onChange={(event) => updateSelectedRegion({ environmentId: event.target.value })}
                      >
                        {scope.ids.map((environmentId) => {
                          const environment = ENVIRONMENT_OPTIONS.find((item) => item.id === environmentId);
                          return environment ? <option key={environmentId} value={environmentId}>{environment.path}</option> : null;
                        })}
                      </select>
                    </label>
                    <div className="elm-region-name-row">
                      <label>
                        <span>区域名称</span>
                        <input value={selectedRegion.name} maxLength={30} onChange={(event) => updateSelectedRegion({ name: event.target.value })} />
                      </label>
                      <label>
                        <span>标识颜色</span>
                        <input type="color" value={selectedRegion.color} onChange={(event) => updateSelectedRegion({ color: event.target.value })} />
                      </label>
                    </div>
                    <div className="elm-region-coordinate-grid">
                      {[
                        ["x", "左", 0, 97],
                        ["y", "上", 0, 97],
                        ["width", "宽", 3, 100],
                        ["height", "高", 3, 100],
                      ].map(([key, label, minimum, maximum]) => (
                        <label key={key}>
                          <span>{label}</span>
                          <input
                            type="number"
                            min={minimum}
                            max={maximum}
                            step="1"
                            value={Math.round(selectedRegion[key])}
                            onChange={(event) => updateSelectedRegion({ [key]: event.target.value })}
                          />
                          <em>%</em>
                        </label>
                      ))}
                    </div>
                    <div className="elm-region-editor-actions">
                      <button
                        type="button"
                        className={regionDrawing ? "active" : ""}
                        onClick={() => {
                          setRegionDrawing((value) => !value);
                          setRegionDrawStart(null);
                          setFeedback(regionDrawing ? "已取消重新框选" : `请在平面图上拖拽框选“${selectedRegion.name}”范围`);
                        }}
                      >
                        <IconFocus2 size={15} /> {regionDrawing ? "取消框选" : "重新框选"}
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          if (!window.confirm(`确定删除“${selectedRegion.name}”区域？存在该环境测点时会阻止平台保存。`)) return;
                          const remainingRegions = regions.filter((region) => region.id !== selectedRegion.id);
                          const nextRegion = remainingRegions.find((region) => scope.ids.includes(region.environmentId));
                          setRegions(remainingRegions);
                          setSelectedRegionId(nextRegion?.id || "");
                          setConfigDirty(true);
                          setRegionDrawing(false);
                          setRegionDrawStart(null);
                          if (!nextRegion) {
                            setRegionEditorOpen(false);
                            setMapTool("pan");
                          }
                          setFeedback(`${selectedRegion.name}区域已从页面草稿移除`);
                        }}
                      >
                        <IconTrash size={15} /> 删除
                      </button>
                    </div>
                    <p><IconCircleCheck size={15} /> 可通过数值精确调整，也可在图面拖拽重新框选。</p>
                  </aside>
                )}
                <div className="elm-map-stage" style={{ "--map-zoom": zoom / 100 }}>
                  <div
                    className={`elm-map-canvas ${draggingPointId ? "drag-ready" : ""} ${regionEditorOpen ? "region-editing" : ""}`}
                    ref={mapRef}
                    onClick={handleMapClick}
                    onPointerDown={handleRegionPointerDown}
                    onPointerMove={handleRegionPointerMove}
                    onPointerUp={handleRegionPointerUp}
                    onPointerCancel={handleRegionPointerUp}
                    onDragOver={(event) => {
                      if (draggingPointId) event.preventDefault();
                    }}
                    onDrop={handleMarkerDrop}
                  >
                    <img src={floorPlan} alt="锅炉区域 2D 平面总貌图" />
                    {showZones && (
                      <div className={`elm-zone-layer ${regionEditorOpen ? "editing" : ""}`}>
                        {scopeRegions.map((region) => (
                          <button
                            type="button"
                            key={region.id}
                            className={`zone in-scope ${selectedRegion?.id === region.id ? "selected" : ""}`}
                            style={{
                              left: `${region.x}%`,
                              top: `${region.y}%`,
                              width: `${region.width}%`,
                              height: `${region.height}%`,
                              color: region.color,
                            }}
                            onClick={(event) => {
                              if (!regionEditorOpen) return;
                              event.stopPropagation();
                              setSelectedRegionId(region.id);
                              setRegionDrawing(false);
                              setRegionDrawStart(null);
                            }}
                            aria-label={`${region.name}区域，左 ${Math.round(region.x)}%，上 ${Math.round(region.y)}%，宽 ${Math.round(region.width)}%，高 ${Math.round(region.height)}%`}
                          >
                            <b>{region.name}</b>
                            {regionEditorOpen && selectedRegion?.id === region.id && <i aria-hidden="true" />}
                          </button>
                        ))}
                      </div>
                    )}
                    {showMarkers && scopePoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).map((point) => {
                      const markerPoint = point.id === draft?.id ? draft : point;
                      const meta = pointStatus(markerPoint);
                      return (
                        <button
                          key={point.id}
                          type="button"
                          className={`elm-map-marker status-${markerPoint.status} ${selectedPointId === point.id ? "selected" : ""} ${draggingPointId === point.id ? "dragging" : ""}`}
                          style={{ left: `${markerPoint.x}%`, top: `${markerPoint.y}%`, "--marker-color": meta.color }}
                          draggable={selectedPointId === point.id && !locating}
                          onDragStart={(event) => {
                            if (selectedPointId !== point.id || locating) {
                              event.preventDefault();
                              return;
                            }
                            event.stopPropagation();
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", point.id);
                            setDraggingPointId(point.id);
                          }}
                          onDragEnd={() => setDraggingPointId("")}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (locating && draft?.id === point.id) return;
                            selectPoint(point, { preserveScope: true });
                          }}
                          onKeyDown={(event) => nudgeSelectedMarker(event, point)}
                          aria-label={`${point.id} ${point.name} ${meta.label}${selectedPointId === point.id ? "，可拖动或使用方向键微调位置" : ""}`}
                          title={selectedPointId === point.id ? "拖动调整位置；方向键微调 0.25%，Shift + 方向键调整 1%" : `${point.id} · ${point.name}`}
                        >
                          <i
                            className="elm-marker-fov"
                            style={{
                              "--fov-angle": `${markerPoint.cameraView?.pan ?? POINT_CAMERA_VIEWS[point.id]?.pan ?? 0}deg`,
                              "--fov-height": `${Math.max(34, Math.min(92, (markerPoint.cameraView?.fov ?? POINT_CAMERA_VIEWS[point.id]?.fov ?? 60) * 0.78))}px`,
                            }}
                            aria-hidden="true"
                          />
                          <span><IconCamera size={18} /></span>
                          <b>{point.id}</b>
                        </button>
                      );
                    })}
                    {measurement?.start && (
                      <span
                        className="elm-measure-point start"
                        style={{ left: `${measurement.start.x}%`, top: `${measurement.start.y}%` }}
                        aria-label="测量起点"
                      >
                        <IconMapPin size={18} />
                      </span>
                    )}
                    {measurement?.end && (
                      <span
                        className="elm-measure-point end"
                        style={{ left: `${measurement.end.x}%`, top: `${measurement.end.y}%` }}
                        aria-label="测量终点"
                      >
                        <IconMapPin size={18} />
                      </span>
                    )}
                    {!scopePoints.length && (
                      <div className="elm-map-empty">
                        <IconMapPin size={24} />
                        <strong>当前环境暂无巡检测点</strong>
                        <span>绑定音视频测点并完成定位后，将在此形成设备位置关系。</span>
                        <button type="button" onClick={(event) => { event.stopPropagation(); setBindDialogOpen(true); }}><IconCirclePlus size={15} /> 绑定测点</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="elm-map-status">
                  <strong>{zoom}%</strong>
                  <span>{scope.name}</span>
                  <span>{scopePoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)).length} 个已定位测点</span>
                  <small>
                    {mapTool === "measure"
                      ? measurement?.end
                        ? `相对距离 ${measurement.distance}% · 再次点击重新测量`
                        : measurement?.start ? "已设置起点，请点击终点" : "点击平面图设置测量起点"
                      : regionDrawing
                        ? `拖拽框选 ${selectedRegion?.name || "设备环境"}范围`
                      : regionEditorOpen
                        ? "区域设置模式 · 选择区域或使用数值精确调整"
                      : locating
                        ? `点击平面图放置 ${draft?.id}`
                        : selectedPoint ? "拖动选中标记 · 方向键微调 · Ctrl/⌘ + 滚轮缩放" : "Ctrl/⌘ + 滚轮缩放 · 点击标记编辑"}
                  </small>
                </div>
                {zoom > 100 && (
                  <button type="button" className="elm-mini-map" onClick={panFromMiniMap} aria-label="在小地图中移动当前视口" title="点击小地图移动视口">
                    <img src={floorPlan} alt="" />
                    <span
                      style={{
                        left: `${mapNavigator.left}%`,
                        top: `${mapNavigator.top}%`,
                        width: `${mapNavigator.width}%`,
                        height: `${mapNavigator.height}%`,
                      }}
                    />
                  </button>
                )}
              </div>
            </section>

            <aside className="elm-inspector">
              {selectedPoint ? (
                <PointEditor
                  point={selectedPoint}
                  draft={draft}
                  onDraftChange={setDraft}
                  onApply={applyPointDraft}
                  onCancel={() => {
                    setDraft(selectedPoint ? { ...selectedPoint, metrics: [...selectedPoint.metrics] } : null);
                    setLocating(false);
                    setMapTool("pan");
                    setFeedback(`${selectedPoint?.id || "当前测点"}未应用的修改已撤销`);
                  }}
                  onDelete={deletePoint}
                  onOpenVideo={(point) => setVideoPreviewPoint({ ...point, metrics: [...point.metrics] })}
                  pageDraftDirty={configDirty}
                  onLocate={() => {
                    setLocating(true);
                    setMapTool("locate");
                    setMeasurement(null);
                    setFeedback("请在平面图上点击新的测点位置");
                  }}
                  dirty={dirty}
                />
              ) : (
                <EnvironmentInspector
                  scope={scope}
                  points={scopePoints}
                  onBind={() => setBindDialogOpen(true)}
                  onPreview={() => setPreviewOpen(true)}
                  onValidate={runValidation}
                />
              )}
            </aside>
          </>
        )}
      </div>

      <BindPointDialog open={bindDialogOpen} points={points} onCancel={() => setBindDialogOpen(false)} onConfirm={bindPoint} />
      <ValidationDialog
        open={validationOpen}
        checks={validationChecks}
        onClose={() => setValidationOpen(false)}
        onLocate={handleValidationLocate}
        onPreview={() => { setValidationOpen(false); setPreviewOpen(true); }}
      />
      <ConfigImportDialog
        candidate={importCandidate}
        hasUnsaved={hasUnsaved}
        floorPlanName={floorPlanName}
        onCancel={() => setImportCandidate(null)}
        onConfirm={confirmConfigurationImport}
      />
      <DraftRecoveryDialog
        candidate={recoveryCandidate}
        savedFloorPlanName={storedPlanRef.current.name}
        onDiscard={discardPageDraft}
        onRestore={restorePageDraft}
      />
      <VideoPreviewDialog
        point={videoPreviewPoint}
        onClose={() => setVideoPreviewPoint(null)}
        onFeedback={setFeedback}
      />
      <RegionPreviewDialog
        open={previewOpen}
        scope={scope}
        points={scopePoints}
        floorPlan={floorPlan}
        dirty={hasUnsaved}
        onClose={() => setPreviewOpen(false)}
      />

      {feedback && (
        <div className={`elm-toast ${feedbackIsWarning ? "warning" : ""}`} role="status">
          {feedbackIsWarning ? <IconAlertTriangle size={18} /> : <IconCheck size={18} />}
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback("")} aria-label="关闭提示"><IconX size={15} /></button>
        </div>
      )}
    </div>
  );
}
