import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconAperture,
  IconAlertTriangle,
  IconArrowsMove,
  IconBulb,
  IconBuildingFactory2,
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconClock,
  IconColumns3,
  IconColumns,
  IconDeviceCctv,
  IconDotsVertical,
  IconDroplet,
  IconExternalLink,
  IconFilter,
  IconFocus2,
  IconFolder,
  IconLayoutGrid,
  IconLoader2,
  IconMapPin,
  IconMaximize,
  IconMessageCircle,
  IconPlayerPause,
  IconPlayerPlay,
  IconSearch,
  IconSquare,
  IconRefresh,
  IconVideo,
  IconVolume,
  IconVolumeOff,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import monitorBeltMisalignment from "./assets/monitor-belt-misalignment.png";
import monitorCorridorSmoke from "./assets/monitor-corridor-smoke.png";
import monitorCounterweightAnomaly from "./assets/monitor-counterweight-anomaly.png";
import monitorEastEntranceIntrusion from "./assets/monitor-east-entrance-intrusion.png";
import monitorIdlerAnomaly from "./assets/monitor-idler-anomaly.png";
import monitorMaterialOffCenter from "./assets/monitor-material-off-center.png";
import { createOperationDefectId, LINKED_OPERATION, operationHref, resolveOperation, resolveOperationByVideoAlarm, routeParams, useOperations } from "./operations-context.jsx";
import "./video-monitoring.css";

const DEVICE_TREE = [
  {
    id: "root",
    label: "【TPP】示范火电厂",
    type: "site",
    children: [
      {
        id: "lys",
        label: "【TPP001】1号锅炉区域",
        type: "factory",
        children: [
          { id: "08300831", label: "炉膛出口监控相机", type: "camera", status: "offline", image: monitorCorridorSmoke },
        ],
      },
      {
        id: "alarm",
        label: "【TPP003】2号转运站",
        type: "factory",
        children: [
          { id: "08300040", label: "落料口煤流监控相机", type: "camera", status: "online", image: monitorMaterialOffCenter },
          { id: "bluetooth-a", label: "东侧入口人员监控相机", type: "camera", status: "online", image: monitorEastEntranceIntrusion },
        ],
      },
      {
        id: "wjz",
        label: "【TPP005】1号汽机区域",
        type: "factory",
        children: [
          {
            id: "corridor",
            label: "【TPP005006】1号汽机房",
            type: "folder",
            children: [
              { id: "08300040-b", label: "汽轮机轴承监控相机", type: "camera", status: "online", image: monitorBeltMisalignment },
            ],
          },
        ],
      },
      {
        id: "belt",
        label: "【TPP020】输煤系统",
        type: "factory",
        children: [
          {
            id: "corridor-1",
            label: "【TPP020001】1号输煤廊道",
            type: "folder",
            children: [
              { id: "bluetooth-b", label: "托辊组声学监测单元", type: "camera", status: "online", image: monitorBeltMisalignment },
              { id: "08300002", label: "中段托辊监控相机", type: "camera", status: "online", image: monitorIdlerAnomaly },
              { id: "08309999", label: "煤流偏载监控相机", type: "camera", status: "online", image: monitorMaterialOffCenter },
              { id: "a-building", label: "廊道烟火监控相机", type: "camera", status: "online", image: monitorCorridorSmoke },
            ],
          },
          { id: "08300097", label: "310A机头煤流监控相机", type: "camera", status: "online", image: monitorMaterialOffCenter },
          { id: "08300098", label: "310A重锤区监控相机", type: "camera", status: "online", image: monitorCounterweightAnomaly },
          { id: "08307701", label: "310A机尾纵撕监控相机", type: "camera", status: "offline", image: monitorIdlerAnomaly },
          { id: "embedded", label: "310A机头落料监控相机", type: "camera", status: "online", image: monitorMaterialOffCenter },
        ],
      },
      { id: "third-party", label: "厂区周界摄像机-01", type: "camera", status: "third-party", image: monitorEastEntranceIntrusion },
    ],
  },
];

const INITIAL_ALARMS = [
  {
    id: 1,
    linkedEventId: LINKED_OPERATION.id,
    diagnosisCaseId: LINKED_OPERATION.diagnosisCaseId,
    stationCode: LINKED_OPERATION.stationCode,
    analysisPoint: LINKED_OPERATION.analysisPoint,
    analysisMetric: LINKED_OPERATION.analysisMetric,
    title: LINKED_OPERATION.title,
    level: "2级",
    status: "pending",
    time: LINKED_OPERATION.time,
    ageMinutes: 6,
    slaMinutes: 9,
    owner: "待认领",
    cameraId: LINKED_OPERATION.cameraId,
    deviceName: `${LINKED_OPERATION.device} · ${LINKED_OPERATION.location}`,
    devicePath: LINKED_OPERATION.devicePath,
    image: monitorMaterialOffCenter,
    attachments: [{ type: "image", src: monitorMaterialOffCenter }, { type: "image", src: monitorBeltMisalignment }],
  },
  {
    id: 2,
    title: "非授权人员闯入",
    level: "1级",
    status: "pending",
    time: "2026-07-20 14:29:56",
    ageMinutes: 8,
    slaMinutes: 2,
    owner: "待认领",
    cameraId: "bluetooth-a",
    deviceName: "2号转运站 · 东侧入口",
    devicePath: "示范火电厂 / 输煤系统 / 2号转运站 / 东侧入口 / 人员监控相机",
    image: monitorEastEntranceIntrusion,
    attachments: [{ type: "video", src: monitorEastEntranceIntrusion }],
  },
  {
    id: 3,
    title: "煤流不对中",
    level: "2级",
    status: "pending",
    time: "2026-07-20 14:27:41",
    ageMinutes: 10,
    slaMinutes: 5,
    owner: "王工",
    cameraId: "08300097",
    deviceName: "310A输煤皮带机 · 机头落料段",
    devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头落料段 / 煤流监控相机",
    image: monitorMaterialOffCenter,
  },
  {
    id: 4,
    title: "重锤处皮带状态异常",
    level: "3级",
    status: "pending",
    time: "2026-07-20 14:24:16",
    ageMinutes: 14,
    slaMinutes: 16,
    owner: "待认领",
    cameraId: "08300098",
    deviceName: "310A输煤皮带机 · 重锤张紧区",
    devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 重锤张紧区 / 重锤区监控相机",
    image: monitorCounterweightAnomaly,
  },
  { id: 5, title: "输煤廊道烟火识别", level: "4级", status: "closed", time: "2026-07-20 14:18:48", ageMinutes: 19, slaMinutes: 0, owner: "李工", cameraId: "a-building", deviceName: "1号输煤廊道 · 中段顶部", devicePath: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段顶部 / 烟火监控相机", image: monitorCorridorSmoke },
  { id: 6, title: "皮带跑偏", level: "2级", status: "defect", time: "2026-07-20 14:12:08", ageMinutes: 26, slaMinutes: 0, owner: "王工", cameraId: "08300097", deviceName: "310A输煤皮带机 · 机头落料段", devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头落料段 / 跑偏监控相机", image: monitorBeltMisalignment },
  { id: 7, title: "滚筒表面异常", level: "3级", status: "closed", time: "2026-07-20 14:08:25", ageMinutes: 30, slaMinutes: 0, owner: "赵工", cameraId: "08300098", deviceName: "310A输煤皮带机 · 驱动滚筒", devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 驱动滚筒 / 滚筒监控相机", image: monitorIdlerAnomaly },
  { id: 8, title: "托辊异响", level: "2级", status: "defect", time: "2026-07-20 14:02:32", ageMinutes: 36, slaMinutes: 0, owner: "李工", cameraId: "bluetooth-b", deviceName: "1号输煤廊道 · 中段托辊组", devicePath: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段托辊组 / 声学监测单元", image: monitorIdlerAnomaly },
  { id: 9, title: "100m转弯处皮带跑偏", level: "3级", status: "pending", time: "2026-07-18 19:51:22", ageMinutes: 42, slaMinutes: 3, owner: "待认领", cameraId: "bluetooth-b", deviceName: "310B输煤皮带机 · 100m转弯处", devicePath: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 100m转弯处 / 转弯段巡检相机", image: monitorBeltMisalignment, attachments: [{ type: "image", src: monitorBeltMisalignment }] },
  { id: 10, title: "100m转弯处未佩戴安全帽", level: "2级", status: "pending", time: "2026-07-18 18:45:06", ageMinutes: 47, slaMinutes: 5, owner: "待认领", cameraId: "bluetooth-b", deviceName: "310B输煤皮带机 · 100m转弯处", devicePath: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 100m转弯处 / 转弯段巡检相机", image: monitorEastEntranceIntrusion, attachments: [{ type: "image", src: monitorEastEntranceIntrusion }] },
].map((alarm) => {
  const operation = resolveOperationByVideoAlarm(alarm.id);
  if (!operation) return alarm;
  return {
    ...alarm,
    linkedEventId: operation.id,
    diagnosisCaseId: operation.diagnosisCaseId,
    stationCode: operation.stationCode,
    analysisPoint: operation.analysisPoint,
    analysisMetric: operation.analysisMetric,
    title: operation.title,
    status: operation.initialStatus || alarm.status,
    time: operation.time,
    cameraId: operation.cameraId,
    deviceName: `${operation.device} · ${operation.location}`,
    devicePath: operation.devicePath,
    defectId: operation.initialDefectId || alarm.defectId,
    actionNote: operation.initialActionNote || alarm.actionNote,
  };
});

const STATUS_COPY = {
  pending: "待处理",
  closed: "已关闭",
  defect: "已转缺陷",
};

const LEVEL_META = {
  "1级": { rank: 1, label: "紧急" },
  "2级": { rank: 2, label: "重要" },
  "3级": { rank: 3, label: "一般" },
  "4级": { rank: 4, label: "提示" },
};

function formatMonitorTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function flattenNodes(nodes, result = []) {
  nodes.forEach((node) => {
    result.push(node);
    if (node.children) flattenNodes(node.children, result);
  });
  return result;
}

const ALL_NODES = flattenNodes(DEVICE_TREE);
const CAMERA_NODES = ALL_NODES.filter((node) => node.type === "camera");
const CAMERA_MAP = new Map(CAMERA_NODES.map((node) => [node.id, node]));
const BRANCH_IDS = ALL_NODES.filter((node) => node.children).map((node) => node.id);
const DEFAULT_SELECTED_IDS = ["bluetooth-a", "bluetooth-b", "08300097", "08300098"];
const OFFLINE_LAST_FRAME_TIMES = {
  "08300831": "2026-07-20 13:48:12",
  "08307701": "2026-07-20 13:57:22",
};

function cameraIdsFor(node) {
  if (!node.children) return node.type === "camera" ? [node.id] : [];
  return node.children.flatMap(cameraIdsFor);
}

function branchMatches(node, query) {
  if (!query) return true;
  if (node.label.toLowerCase().includes(query)) return true;
  return node.children?.some((child) => branchMatches(child, query)) ?? false;
}

function branchMatchesStatus(node, statusFilter, selectedSet) {
  if (statusFilter === "all") return true;
  if (node.children) return node.children.some((child) => branchMatchesStatus(child, statusFilter, selectedSet));
  if (statusFilter === "selected") return selectedSet.has(node.id);
  return node.status === statusFilter;
}

function PanelTitle({ children, collapsed = false, onToggleCollapse, collapseLabel = "模块" }) {
  return (
    <div className="monitor-panel-title">
      <IconChevronRight className="panel-title-mark" size={17} />
      <strong>{children}</strong>
      {onToggleCollapse && (
        <button
          className="panel-collapse-button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "展开" : "收起"}${collapseLabel}`}
          title={`${collapsed ? "展开" : "收起"}${collapseLabel}`}
        >
          <IconChevronDown className={collapsed ? "is-collapsed" : ""} size={17} />
        </button>
      )}
    </div>
  );
}

function DeviceIcon({ item }) {
  if (item.type === "site") return <IconBuildingFactory2 size={18} />;
  if (item.type === "folder") return <IconFolder size={18} />;
  if (item.type === "factory") return <IconDeviceCctv size={18} />;
  return <IconCamera size={18} />;
}

function DevicePanel({ selected, onToggle, activeCameraId, onActivate, onCollapse, hidden = false }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState(() => new Set(BRANCH_IDS));
  const normalizedQuery = query.trim().toLowerCase();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const stats = useMemo(() => ({
    total: CAMERA_NODES.length,
    online: CAMERA_NODES.filter((item) => item.status === "online").length,
    offline: CAMERA_NODES.filter((item) => item.status === "offline").length,
  }), []);

  const toggleExpanded = (id) => {
    setExpanded((items) => {
      const next = new Set(items);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNodes = (nodes, level = 0, ancestorQueryMatch = false) => nodes
    .filter((node) => {
      const selfMatches = node.label.toLowerCase().includes(normalizedQuery);
      return (ancestorQueryMatch || selfMatches || branchMatches(node, normalizedQuery)) && branchMatchesStatus(node, statusFilter, selectedSet);
    })
    .map((node) => {
      const childIds = cameraIdsFor(node);
      const selfMatches = !normalizedQuery || ancestorQueryMatch || node.label.toLowerCase().includes(normalizedQuery);
      const visibleChildIds = childIds.filter((id) => {
        const camera = CAMERA_MAP.get(id);
        if (!camera || !branchMatchesStatus(camera, statusFilter, selectedSet)) return false;
        return selfMatches || camera.label.toLowerCase().includes(normalizedQuery);
      });
      const toggleIds = normalizedQuery || statusFilter !== "all" ? visibleChildIds : childIds;
      const selectedCount = toggleIds.filter((id) => selectedSet.has(id)).length;
      const checked = toggleIds.length > 0 && selectedCount === toggleIds.length;
      const mixed = selectedCount > 0 && selectedCount < toggleIds.length;
      const isBranch = Boolean(node.children);
      const isExpanded = normalizedQuery ? true : expanded.has(node.id);
      const statusCopy = node.status === "online" ? "在线" : node.status === "offline" ? "离线" : "第三方";

      return (
        <div className="device-tree-group" key={node.id}>
          <div
            className={`device-row ${node.id === activeCameraId ? "is-active" : ""}`}
            style={{ "--tree-level": level }}
          >
            {isBranch ? (
              <button className="tree-expand" onClick={() => toggleExpanded(node.id)} aria-expanded={isExpanded} aria-label={`${isExpanded ? "收起" : "展开"}${node.label}`}>
                <IconChevronRight size={15} />
              </button>
            ) : <span className="tree-expand-placeholder" />}
            <button
              className={`device-check ${checked ? "checked" : ""} ${mixed ? "mixed" : ""}`}
              onClick={() => onToggle(toggleIds)}
              disabled={!toggleIds.length}
              aria-label={`${checked ? "取消选择" : "选择"}${node.label}`}
              aria-checked={mixed ? "mixed" : checked}
              role="checkbox"
            >
              {mixed ? <span aria-hidden="true">−</span> : checked ? <IconCheck aria-hidden="true" /> : ""}
            </button>
            <span className={`device-type status-${node.status ?? "group"}`} title={node.status ? statusCopy : undefined}>
              <DeviceIcon item={node} />
            </span>
            <button className="device-label" onClick={() => isBranch ? toggleExpanded(node.id) : onActivate(node.id)} title={node.label}>
              {node.label}
            </button>
          </div>
          {isBranch && isExpanded && <div role="group">{renderNodes(node.children, level + 1, selfMatches)}</div>}
        </div>
      );
    });

  const hasMatches = DEVICE_TREE.some((node) => branchMatches(node, normalizedQuery) && branchMatchesStatus(node, statusFilter, selectedSet));

  return (
    <section className="monitor-panel device-panel" hidden={hidden}>
      <PanelTitle onToggleCollapse={onCollapse} collapseLabel="监控设备栏">监控设备</PanelTitle>
      <div className="device-stats" aria-label="按设备状态筛选">
        <button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")} aria-pressed={statusFilter === "all"}><small>全部</small><b>{stats.total}</b></button>
        <button className={statusFilter === "online" ? "active" : ""} onClick={() => setStatusFilter("online")} aria-pressed={statusFilter === "online"}><small>在线</small><b className="online">{stats.online}</b></button>
        <button className={statusFilter === "offline" ? "active" : ""} onClick={() => setStatusFilter("offline")} aria-pressed={statusFilter === "offline"}><small>离线</small><b className="offline">{stats.offline}</b></button>
        <button className={statusFilter === "selected" ? "active" : ""} onClick={() => setStatusFilter("selected")} aria-pressed={statusFilter === "selected"}><small>已选</small><b className="selected">{selected.length}</b></button>
      </div>
      <div className="device-search">
        <IconSearch size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }}
          placeholder="搜索设备名称或编号"
          aria-label="搜索监控设备"
        />
        {query && <button onClick={() => setQuery("")} aria-label="清空设备搜索" title="清空搜索"><IconX size={15} /></button>}
      </div>
      <div className="device-tree" role="group" aria-label="监控设备分组列表">
        {hasMatches ? renderNodes(DEVICE_TREE) : <div className="device-empty">当前条件下没有设备</div>}
      </div>
    </section>
  );
}

function VideoTile({ camera, active, onSelect, onFeedback, onOpenPlayback, muted, onToggleAudio, alarmCount = 0, highestLevel = null, liveTime }) {
  const [paused, setPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [streamRecovered, setStreamRecovered] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const tileRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const moreButtonRef = useRef(null);
  const menuRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const snapshotTimerRef = useRef(null);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const focusTimer = window.setTimeout(() => firstMenuItemRef.current?.focus(), 0);
    const closeMenu = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && tileRef.current?.contains(event.target)) return;
      setMoreOpen(false);
      if (event.type === "keydown") window.requestAnimationFrame(() => moreButtonRef.current?.focus());
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [moreOpen]);

  useEffect(() => () => {
    window.clearTimeout(reconnectTimerRef.current);
    window.clearTimeout(snapshotTimerRef.current);
  }, []);

  useEffect(() => {
    setStreamRecovered(false);
    setReconnecting(false);
  }, [camera?.id]);

  if (!camera) return (
    <div className="video-tile empty-tile">
      <IconCamera size={28} stroke={1.5} />
      <strong>暂无监控画面</strong>
      <span>从左侧设备树勾选摄像头</span>
    </div>
  );

  const enterFullscreen = async (event) => {
    event.stopPropagation();
    const tile = event.currentTarget.closest(".video-tile");
    if (!tile?.requestFullscreen) {
      onFeedback("当前浏览器不支持画面全屏", "warning");
      return;
    }
    try {
      await tile.requestFullscreen();
    } catch {
      onFeedback("浏览器未允许进入画面全屏", "warning");
    }
  };

  const closeMoreMenu = (returnFocus = true) => {
    setMoreOpen(false);
    if (returnFocus) window.requestAnimationFrame(() => moreButtonRef.current?.focus());
  };

  const captureFrame = () => {
    closeMoreMenu();
    const source = tileRef.current?.querySelector("img");
    if (!source?.complete || !source.naturalWidth) {
      onFeedback(`${camera.label} 当前画面尚未加载完成`, "warning");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(source, 0, 0);
      context.fillStyle = "rgba(3, 14, 28, 0.72)";
      context.fillRect(0, canvas.height - 54, canvas.width, 54);
      context.fillStyle = "#ffffff";
      context.font = "24px sans-serif";
      context.fillText(`${camera.label}  ${pausedAt ?? liveTime}`, 24, canvas.height - 20);
      canvas.toBlob((blob) => {
        if (!blob) {
          onFeedback(`${camera.label} 抓拍生成失败，请重试`, "warning");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${camera.id}-${(pausedAt ?? liveTime).replaceAll(":", "-").replace(" ", "_")}.jpg`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setSnapshotSaved(true);
        window.clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = window.setTimeout(() => setSnapshotSaved(false), 1600);
        onFeedback(`${camera.label} 抓拍已保存`);
      }, "image/jpeg", 0.9);
    } catch {
      onFeedback(`${camera.label} 抓拍生成失败，请重试`, "warning");
    }
  };

  const reconnectStream = () => {
    closeMoreMenu();
    setReconnecting(true);
    onFeedback(`正在重新连接 ${camera.label}`, "info");
    window.clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = window.setTimeout(() => {
      setReconnecting(false);
      if (camera.status === "offline") {
        setStreamRecovered(true);
        onFeedback(`${camera.label} 视频流已临时恢复，设备状态等待下一次心跳同步`, "success");
      } else {
        onFeedback(`${camera.label} 视频流已刷新`, "success");
      }
    }, 1200);
  };

  const togglePaused = (event) => {
    event.stopPropagation();
    const next = !paused;
    setPaused(next);
    setPausedAt(next ? liveTime : null);
    onFeedback(`${camera.label} 已${next ? "暂停在当前帧" : "恢复实时播放"}`, "info");
  };

  const toggleAudio = (event) => {
    event.stopPropagation();
    onToggleAudio(camera.id);
    onFeedback(`${camera.label} 已${muted ? "开启声音，其他画面自动静音" : "静音"}`, "info");
  };

  const handleMenuKeyDown = (event) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    if (!items.length) return;
    const currentIndex = Math.max(0, items.indexOf(document.activeElement));
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? items.length - 1
        : event.key === "ArrowDown" ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex].focus();
  };

  const effectiveStatus = streamRecovered ? "online" : camera.status;
  const displayTime = effectiveStatus === "offline" ? (OFFLINE_LAST_FRAME_TIMES[camera.id] ?? "2026-07-20 13:30:00") : pausedAt ?? liveTime;

  return (
    <article
      ref={tileRef}
      className={`video-tile has-image status-${effectiveStatus} ${active ? "selected" : ""} ${paused ? "paused" : ""} ${reconnecting ? "reconnecting" : ""}`}
      aria-label={`${camera.label}监控画面容器`}
    >
      <span className="camera-id"><i aria-hidden="true" />{camera.label}</span>
      <img src={camera.image} alt={`${camera.label} 监控画面`} />
      <button className="video-select-target" onClick={() => onSelect(camera.id)} aria-pressed={active} aria-label={`选择 ${camera.label} 作为当前控制画面`} />
      {alarmCount > 0 && (
        <span className={`tile-alarm-badge level-${highestLevel?.replace("级", "") ?? "2"}`}>
          <IconAlertTriangle size={14} />{alarmCount} 条待处理
        </span>
      )}
      {effectiveStatus === "offline" && <span className="stream-state">离线录像</span>}
      {streamRecovered && <span className="stream-state recovered">临时恢复</span>}
      <span className="video-timestamp">{displayTime}</span>
      {snapshotSaved && <span className="snapshot-saved" role="status"><IconCheck size={14} />抓拍已保存</span>}
      {reconnecting ? (
        <div className="offline-hint reconnecting-hint"><IconLoader2 className="loading-spinner" size={24} /><span>正在重连</span><small>正在重新建立视频连接</small></div>
      ) : effectiveStatus === "offline" && (
        <div className="offline-hint"><IconAlertTriangle size={24} /><span>信号中断</span><small>最后帧 {displayTime.slice(-8)}</small><span className="offline-actions"><button onClick={(event) => { event.stopPropagation(); reconnectStream(); }}>立即重连</button><button onClick={(event) => { event.stopPropagation(); onOpenPlayback(camera.id); }}>查看录像</button></span></div>
      )}
      {active && <span className="active-camera-indicator">当前控制</span>}
      {paused && <div className="paused-cover"><IconPlayerPlay size={42} /><span>已暂停</span></div>}
      <div className="video-controls">
        <button disabled={effectiveStatus === "offline"} title={effectiveStatus === "offline" ? "设备离线，无法控制直播" : undefined} onClick={togglePaused} aria-label={paused ? "播放" : "暂停"}>
          {paused ? <IconPlayerPlay size={19} /> : <IconPlayerPause size={19} />}
        </button>
        <span className="live-mode"><i aria-hidden="true" />{effectiveStatus === "offline" ? "最后画面" : paused ? "已暂停" : streamRecovered ? "已恢复" : "实时"}</span>
        <span className="control-spacer" />
        <button disabled={effectiveStatus === "offline"} title={effectiveStatus === "offline" ? "设备离线，无法控制音频" : undefined} onClick={toggleAudio} aria-label={muted ? "取消静音" : "静音"}>
          {muted ? <IconVolumeOff size={19} /> : <IconVolume size={19} />}
        </button>
        <button onClick={enterFullscreen} aria-label="全屏"><IconMaximize size={18} /></button>
        <button ref={moreButtonRef} onClick={(event) => { event.stopPropagation(); setMoreOpen((value) => !value); }} aria-label="更多操作" aria-haspopup="menu" aria-expanded={moreOpen}>
          <IconDotsVertical size={18} />
        </button>
      </div>
      {moreOpen && (
        <div ref={menuRef} className="video-more-menu" role="menu" aria-label={`${camera.label}更多操作`} onKeyDown={handleMenuKeyDown} onClick={(event) => event.stopPropagation()}>
          <button ref={firstMenuItemRef} role="menuitem" onClick={captureFrame}>抓拍当前画面</button>
          <button role="menuitem" onClick={reconnectStream} disabled={reconnecting}>{effectiveStatus === "offline" ? "重试连接" : "刷新视频流"}</button>
        </div>
      )}
    </article>
  );
}

function VideoWall({
  devices,
  activeCameraId,
  onActiveCameraChange,
  onFeedback,
  pendingAlarms,
  riskFocus,
  onToggleRiskFocus,
  focusMode,
  onToggleFocusMode,
  focusRequest,
  onOpenPlayback,
  suspended = false,
}) {
  const [playing, setPlaying] = useState(false);
  const [layout, setLayout] = useState("quad");
  const [page, setPage] = useState(1);
  const [intervalSeconds, setIntervalSeconds] = useState("10");
  const [quality, setQuality] = useState("高清");
  const [liveTime, setLiveTime] = useState(() => formatMonitorTime());
  const [audibleCameraId, setAudibleCameraId] = useState(null);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const lastValidIntervalRef = useRef(10);
  const pageSize = layout === "single" ? 1 : layout === "nine" ? 9 : 4;
  const totalPages = Math.max(1, Math.ceil(devices.length / pageSize));
  const visibleDevices = devices.slice((page - 1) * pageSize, page * pageSize);
  const onlineCount = devices.filter((device) => device.status === "online").length;
  const urgentCount = pendingAlarms.filter((alarm) => alarm.level === "1级").length;
  const alarmMetaByCamera = useMemo(() => {
    const grouped = new Map();
    pendingAlarms.forEach((alarm) => {
      const current = grouped.get(alarm.cameraId) ?? { count: 0, highestLevel: alarm.level };
      current.count += 1;
      if ((LEVEL_META[alarm.level]?.rank ?? 99) < (LEVEL_META[current.highestLevel]?.rank ?? 99)) current.highestLevel = alarm.level;
      grouped.set(alarm.cameraId, current);
    });
    return grouped;
  }, [pendingAlarms]);

  useEffect(() => {
    const timer = window.setInterval(() => setLiveTime(formatMonitorTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    setPage((value) => Math.min(value, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const activeIndex = devices.findIndex((device) => device.id === activeCameraId);
    if (activeIndex < 0) {
      onActiveCameraChange(devices[0]?.id ?? null, false);
      return;
    }
    setPage(Math.floor(activeIndex / pageSize) + 1);
  }, [devices, activeCameraId, onActiveCameraChange, pageSize]);

  useEffect(() => {
    if (!playing || devices.length < 2 || suspended || !pageVisible) return undefined;
    const timer = window.setInterval(() => {
      if (totalPages > 1) {
        const nextPage = page >= totalPages ? 1 : page + 1;
        const nextCameraId = devices[(nextPage - 1) * pageSize]?.id ?? devices[0]?.id ?? null;
        setPage(nextPage);
        onActiveCameraChange(nextCameraId, false);
      } else {
        const currentIndex = devices.findIndex((device) => device.id === activeCameraId);
        onActiveCameraChange(devices[(currentIndex + 1 + devices.length) % devices.length]?.id ?? null, false);
      }
    }, Math.max(1, Number(intervalSeconds) || lastValidIntervalRef.current) * 1000);
    return () => window.clearInterval(timer);
  }, [playing, totalPages, intervalSeconds, devices, activeCameraId, onActiveCameraChange, pageSize, page, suspended, pageVisible]);

  useEffect(() => {
    if (audibleCameraId && !devices.some((device) => device.id === audibleCameraId)) setAudibleCameraId(null);
  }, [devices, audibleCameraId]);

  useEffect(() => {
    if (!focusRequest?.cameraId) return;
    setPlaying(false);
    setLayout("single");
    onActiveCameraChange(focusRequest.cameraId, false);
  }, [focusRequest?.token]);

  const changeLayout = (nextLayout) => {
    setLayout(nextLayout);
    if (playing) setPlaying(false);
    onFeedback(`已切换为${nextLayout === "single" ? "单画面" : nextLayout === "quad" ? "四画面" : "九画面"}${playing ? "，轮巡已暂停" : ""}`, "info");
  };

  const maximizeWall = async (event) => {
    const wall = event.currentTarget.closest(".video-wall-wrap");
    if (!wall?.requestFullscreen) {
      onFeedback("当前浏览器不支持视频墙全屏", "warning");
      return;
    }
    try {
      await wall.requestFullscreen();
    } catch {
      onFeedback("浏览器未允许进入视频墙全屏", "warning");
    }
  };

  const goToPage = (nextPage) => {
    const normalizedPage = Math.max(1, Math.min(totalPages, nextPage));
    setPage(normalizedPage);
    onActiveCameraChange(devices[(normalizedPage - 1) * pageSize]?.id ?? devices[0]?.id ?? null, false);
  };

  const commitInterval = () => {
    const normalized = Math.max(1, Math.min(60, Number(intervalSeconds) || lastValidIntervalRef.current));
    lastValidIntervalRef.current = normalized;
    setIntervalSeconds(String(normalized));
    onFeedback(`轮巡间隔已设置为 ${normalized} 秒`, "info");
  };

  const toggleTour = () => {
    const next = !playing;
    setPlaying(next);
    onFeedback(next ? `轮巡已开始，每 ${lastValidIntervalRef.current} 秒切换` : "轮巡已暂停", "info");
  };

  const toggleAudioFor = (cameraId) => {
    setAudibleCameraId((current) => current === cameraId ? null : cameraId);
  };

  const tourSuspended = playing && (suspended || !pageVisible);

  return (
    <section className="video-wall-wrap" data-stream-quality={quality === "高清" ? "hd" : "smooth"}>
      <header className="monitor-commandbar">
        <div className="commandbar-title">
          <IconDeviceCctv size={20} />
          <strong>实时值守</strong>
          <span className="live-health"><i aria-hidden="true" />视频服务正常</span>
        </div>
        <div className="commandbar-status">
          <button className={riskFocus ? "risk-focus active" : "risk-focus"} onClick={onToggleRiskFocus} disabled={!pendingAlarms.length} aria-pressed={riskFocus}>
            <IconAlertTriangle size={16} />待处理 {pendingAlarms.length}
          </button>
          {urgentCount > 0 && <span className="urgent-status">紧急 {urgentCount}</span>}
          <span className="last-update">更新 {liveTime.slice(-8)}</span>
        </div>
        {onToggleFocusMode && (
          <button className={focusMode ? "focus-mode active" : "focus-mode"} onClick={onToggleFocusMode} aria-pressed={focusMode}>
            <IconFocus2 size={17} />{focusMode ? "退出专注" : "专注监控"}
          </button>
        )}
      </header>
      <div className={`video-wall ${layout}`}>
        {Array.from({ length: pageSize }, (_, index) => (
          <VideoTile
            key={visibleDevices[index]?.id ?? `empty-${index}`}
            camera={visibleDevices[index]}
            active={visibleDevices[index]?.id === activeCameraId}
            onSelect={(id) => onActiveCameraChange(id, false)}
            onFeedback={onFeedback}
            onOpenPlayback={onOpenPlayback}
            muted={audibleCameraId !== visibleDevices[index]?.id}
            onToggleAudio={toggleAudioFor}
            alarmCount={alarmMetaByCamera.get(visibleDevices[index]?.id)?.count ?? 0}
            highestLevel={alarmMetaByCamera.get(visibleDevices[index]?.id)?.highestLevel ?? null}
            liveTime={liveTime}
          />
        ))}
      </div>
      <div className="video-toolbar">
        <button className="toolbar-icon-button" onClick={maximizeWall} aria-label="最大化实时视频" title="最大化实时视频"><IconMaximize size={20} /></button>
        <button className="quality-button" onClick={() => { const next = quality === "高清" ? "流畅" : "高清"; setQuality(next); onFeedback(`视频墙已切换为${next}模式`, "info"); }} aria-label="切换视频流畅度">{quality}</button>
        <span className="toolbar-divider" />
        <label className="tour-control">轮巡
          <input
            type="number"
            min="1"
            max="60"
            value={intervalSeconds}
            onChange={(event) => { if (/^\d*$/.test(event.target.value)) setIntervalSeconds(event.target.value); }}
            onBlur={commitInterval}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setIntervalSeconds(String(lastValidIntervalRef.current));
                event.currentTarget.blur();
              }
            }}
            aria-label="轮巡间隔秒数"
          />
          <span>秒</span>
        </label>
        <button className={`start-button ${tourSuspended ? "is-suspended" : ""}`} onClick={toggleTour} disabled={devices.length < 2} title={devices.length < 2 ? "至少选择两路设备后才能轮巡" : tourSuspended ? "当前操作完成后将自动继续轮巡" : undefined} aria-pressed={playing}>
          {playing ? <IconPlayerPause size={17} /> : <IconPlayerPlay size={17} />}
          {tourSuspended ? "轮巡暂挂" : playing ? "暂停轮巡" : "开始轮巡"}
        </button>
        <span className="wall-health"><i aria-hidden="true" />{onlineCount} 路在线</span>
        <span className="selected-count">已选 {devices.length} 路</span>
        <div className="pagination" aria-label="视频分页">
          <button onClick={() => goToPage(page - 1)} aria-label="上一页" disabled={page === 1}><IconChevronLeft size={18} /></button>
          <b>{page}/{totalPages}</b>
          <button onClick={() => goToPage(page + 1)} aria-label="下一页" disabled={page === totalPages}><IconChevronRight size={18} /></button>
        </div>
        <div className="layout-controls" aria-label="分屏切换">
          <button className={layout === "single" ? "active" : ""} onClick={() => changeLayout("single")} aria-label="单画面" title="单画面"><IconSquare size={21} /></button>
          <button className={layout === "quad" ? "active" : ""} onClick={() => changeLayout("quad")} aria-label="四画面" title="四画面"><IconLayoutGrid size={21} /></button>
          <button className={layout === "nine" ? "active" : ""} onClick={() => changeLayout("nine")} aria-label="九画面" title="九画面"><IconColumns3 size={21} /></button>
        </div>
      </div>
    </section>
  );
}

function alarmMetrics(alarms) {
  const added = alarms.length;
  const processed = alarms.filter((alarm) => alarm.status !== "pending").length;
  const defects = alarms.filter((alarm) => alarm.status === "defect").length;
  const pending = alarms.filter((alarm) => alarm.status === "pending").length;
  return { added, processed, defects, pending, completion: added ? Math.round((processed / added) * 100) : 100 };
}

function SummaryPanel({ alarms, onFilter, collapsed = false, onToggleCollapse }) {
  const metrics = alarmMetrics(alarms);
  const pendingAlarms = alarms.filter((alarm) => alarm.status === "pending");
  const urgent = pendingAlarms.filter((alarm) => alarm.level === "1级").length;
  const longestWaitAlarm = pendingAlarms.reduce((current, alarm) => (
    !current || (alarm.ageMinutes ?? 0) > (current.ageMinutes ?? 0) ? alarm : current
  ), null);
  const longestWait = longestWaitAlarm?.ageMinutes ?? 0;
  const waitRisk = longestWaitAlarm?.slaMinutes <= 0 ? "is-overdue" : longestWaitAlarm?.slaMinutes <= 5 ? "is-warning" : "";
  return (
    <section className={`monitor-panel summary-panel ${collapsed ? "module-collapsed" : ""}`}>
      <PanelTitle collapsed={collapsed} onToggleCollapse={onToggleCollapse} collapseLabel="今日监控报警看护">今日监控报警看护</PanelTitle>
      <div className="summary-content">
        <button className="priority-summary" onClick={() => onFilter("pending")} aria-label={`${metrics.pending}条待处理报警，其中${urgent}条紧急，最长等待${longestWait}分钟`}>
          <span className="summary-primary-copy">
            <span className="summary-primary-icon"><IconAlertTriangle size={15} /></span>
            <strong>待处理告警</strong>
          </span>
          <span className="summary-primary-value">
            <strong>{metrics.pending}</strong>
            <small>条</small>
          </span>
          <span className="summary-primary-meta">
            <span className={urgent ? "is-urgent" : "is-safe"}><i aria-hidden="true" />紧急 <b>{urgent}</b></span>
            <span className={waitRisk} title={longestWaitAlarm ? `响应时限剩余 ${longestWaitAlarm.slaMinutes} 分钟` : undefined}><IconClock size={13} />最长等待 <b>{longestWait} 分钟</b></span>
          </span>
        </button>
        <div className="summary-grid">
          <button onClick={() => onFilter("all")}><span>今日新增</span><strong>{metrics.added}<small>条</small></strong></button>
          <button onClick={() => onFilter("processed")}><span>今日处理</span><strong>{metrics.processed}<small>条</small></strong></button>
          <button className={metrics.defects ? "has-risk" : ""} onClick={() => onFilter("defect")}><span>转缺陷</span><strong>{metrics.defects}<small>条</small></strong></button>
          <button onClick={() => onFilter("processed")}><span>处置率</span><strong>{metrics.completion}<small>%</small></strong></button>
        </div>
      </div>
    </section>
  );
}

function AlarmPanel({ alarms, filter, onFilter, onSelect, locatedAlarmId, collapsed = false, onToggleCollapse }) {
  const listRef = useRef(null);
  const pendingCount = alarms.filter((alarm) => alarm.status === "pending").length;
  const visibleAlarms = useMemo(() => {
    const filtered = filter === "pending" ? alarms.filter((alarm) => alarm.status === "pending")
      : filter === "processed" ? alarms.filter((alarm) => alarm.status !== "pending")
        : filter === "defect" ? alarms.filter((alarm) => alarm.status === "defect") : alarms;
    return [...filtered].sort((a, b) => {
      if ((a.status === "pending") !== (b.status === "pending")) return a.status === "pending" ? -1 : 1;
      if (a.status !== "pending") return b.time.localeCompare(a.time);
      if ((LEVEL_META[a.level]?.rank ?? 99) !== (LEVEL_META[b.level]?.rank ?? 99)) return (LEVEL_META[a.level]?.rank ?? 99) - (LEVEL_META[b.level]?.rank ?? 99);
      if ((a.slaMinutes ?? 999) !== (b.slaMinutes ?? 999)) return (a.slaMinutes ?? 999) - (b.slaMinutes ?? 999);
      if ((a.ageMinutes ?? 0) !== (b.ageMinutes ?? 0)) return (b.ageMinutes ?? 0) - (a.ageMinutes ?? 0);
      return b.time.localeCompare(a.time);
    });
  }, [alarms, filter]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [filter]);

  useEffect(() => {
    if (!locatedAlarmId || !listRef.current) return;
    const target = listRef.current.querySelector(`[data-alarm-id="${locatedAlarmId}"]`);
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [locatedAlarmId, visibleAlarms]);

  return (
    <section className={`monitor-panel alarm-panel ${collapsed ? "module-collapsed" : ""}`}>
      <PanelTitle collapsed={collapsed} onToggleCollapse={onToggleCollapse} collapseLabel="最近监控报警">最近监控报警</PanelTitle>
      <div className="alarm-filter">
        <span>{filter === "processed" ? "今日处理" : filter === "defect" ? "已转缺陷" : "报警列表"}</span>
        {filter === "processed" && <button className="active" onClick={() => onFilter("processed")}>已处理 {visibleAlarms.length}</button>}
        {filter === "defect" && <button className="active" onClick={() => onFilter("defect")}>已转缺陷 {visibleAlarms.length}</button>}
        <button className={filter === "pending" ? "active" : ""} onClick={() => onFilter("pending")}>待处理 {pendingCount}</button>
        <button className={filter === "all" ? "active" : ""} onClick={() => onFilter("all")}>全部 {alarms.length}</button>
      </div>
      <div
        className="alarm-list"
        ref={listRef}
        aria-label="最近监控报警，按级别和发生时间排序"
      >
        {visibleAlarms.map((alarm) => (
          <button className={`alarm-card level-${alarm.level.replace("级", "")} ${locatedAlarmId === alarm.id ? "selected" : ""}`} data-alarm-id={alarm.id} key={alarm.id} onClick={() => onSelect(alarm)}>
            <img src={alarm.image} alt={`${alarm.title}报警画面缩略图`} />
            <span className="alarm-copy">
              <span className="alarm-heading">
                <strong>{alarm.title}</strong>
                <i title={`${alarm.level} · ${LEVEL_META[alarm.level]?.label ?? "告警"}`}>{alarm.level} {LEVEL_META[alarm.level]?.label}</i>
                <em className={`status-${alarm.status}`}>{STATUS_COPY[alarm.status]}</em>
              </span>
              <span title={alarm.devicePath}><IconMapPin size={15} />{alarm.deviceName}</span>
              <span className="alarm-card-footer"><span><IconClock size={15} />{alarm.status === "pending" ? `已等待 ${alarm.ageMinutes} 分钟` : alarm.time}</span><span>{alarm.owner}</span></span>
            </span>
          </button>
        ))}
        {!visibleAlarms.length && <div className="alarm-empty">暂无符合条件的报警</div>}
      </div>
    </section>
  );
}

function PtzPanel({ camera, onFeedback, onRecordingSaved, onBusyChange, collapsed = false, onToggleCollapse }) {
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);
  const [values, setValues] = useState({ zoom: 0, focus: 0, aperture: 0 });
  const [switches, setSwitches] = useState({ talk: false, light: false });
  const [direction, setDirection] = useState(null);
  const [wiping, setWiping] = useState(false);
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [message, setMessage] = useState("等待控制指令");
  const directionRef = useRef(null);
  const wiperTimerRef = useRef(null);
  const restartTimerRef = useRef(null);
  const restartTriggerRef = useRef(null);
  const restartCancelRef = useRef(null);
  const ptzStatusRef = useRef(null);
  const previousCameraRef = useRef(camera);
  const recordingSnapshotRef = useRef({ active: false, camera: null, startedAt: null, seconds: 0 });

  const capabilities = useMemo(() => {
    if (!camera) return {};
    if (camera.status === "third-party") return { record: true, ptz: false, optics: false, talk: false, light: false, wiper: false, reboot: false };
    return { record: true, ptz: true, optics: true, talk: true, light: true, wiper: true, reboot: true };
  }, [camera]);
  const unavailable = !camera || camera.status === "offline";
  const busy = Boolean(direction || wiping || restarting);
  recordingSnapshotRef.current = { active: recording, camera, startedAt: recordingStartedAt, seconds: recordingSeconds };

  const reasonFor = (capability) => {
    if (!camera) return "请先选择设备";
    if (camera.status === "offline") return "当前设备离线";
    if (!capabilities[capability]) return "当前设备不支持该功能";
    if (restarting) return "设备正在重启";
    return undefined;
  };

  const isDisabled = (capability) => Boolean(reasonFor(capability));

  const stopMovement = useCallback((reason = "") => {
    if (!directionRef.current) return;
    const stopped = directionRef.current;
    directionRef.current = null;
    setDirection(null);
    setMessage(`云台${stopped}已停止${reason ? `（${reason}）` : ""}`);
  }, []);

  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);

  useEffect(() => {
    const stopForSafety = () => stopMovement(document.visibilityState === "hidden" ? "页面转入后台" : "操作结束");
    window.addEventListener("blur", stopForSafety);
    window.addEventListener("pointerup", stopForSafety);
    window.addEventListener("pointercancel", stopForSafety);
    document.addEventListener("visibilitychange", stopForSafety);
    return () => {
      window.removeEventListener("blur", stopForSafety);
      window.removeEventListener("pointerup", stopForSafety);
      window.removeEventListener("pointercancel", stopForSafety);
      document.removeEventListener("visibilitychange", stopForSafety);
    };
  }, [stopMovement]);

  useEffect(() => {
    const previousCamera = previousCameraRef.current;
    if (previousCamera?.id && previousCamera.id !== camera?.id) {
      stopMovement("已切换设备");
      if (recording && recordingStartedAt) {
        recordingSnapshotRef.current.active = false;
        onRecordingSaved?.({
          id: `manual-${Date.now()}`,
          cameraId: previousCamera.id,
          name: `${previousCamera.label}-手动录像`,
          start: recordingStartedAt,
          duration: Math.max(1, recordingSeconds),
          mode: "手动录制",
        });
        onFeedback?.(`${previousCamera.label} 的手动录像已安全停止并保存`, "warning");
      }
    }
    window.clearTimeout(wiperTimerRef.current);
    window.clearTimeout(restartTimerRef.current);
    previousCameraRef.current = camera;
    setRecording(false);
    setRecordingSeconds(0);
    setRecordingStartedAt(null);
    setValues({ zoom: 0, focus: 0, aperture: 0 });
    setSwitches({ talk: false, light: false });
    setWiping(false);
    setRestartConfirm(false);
    setRestarting(false);
    setMessage(camera ? "等待控制指令" : "未选择设备");
  }, [camera?.id]);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    window.clearTimeout(wiperTimerRef.current);
    window.clearTimeout(restartTimerRef.current);
    const snapshot = recordingSnapshotRef.current;
    if (snapshot.active && snapshot.camera && snapshot.startedAt) {
      snapshot.active = false;
      const record = {
        id: `manual-${Date.now()}`,
        cameraId: snapshot.camera.id,
        name: `${snapshot.camera.label}-手动录像`,
        start: snapshot.startedAt,
        duration: Math.max(1, snapshot.seconds),
        mode: "手动录制",
      };
      onRecordingSaved?.(record);
      onFeedback?.(`${snapshot.camera.label} 的手动录像已安全停止并保存`, "warning");
    }
  }, [onFeedback, onRecordingSaved]);

  const startMovement = (action, event) => {
    if (isDisabled("ptz")) return;
    event.preventDefault();
    directionRef.current = action;
    setDirection(action);
    setMessage(`云台正在${action}，释放后停止`);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const keyboardStep = (action, event) => {
    if (!['Enter', ' '].includes(event.key) || isDisabled("ptz")) return;
    event.preventDefault();
    setMessage(`云台已${action}步进`);
  };

  const adjust = (key, amount) => {
    if (isDisabled("optics")) return;
    const next = Math.max(-5, Math.min(5, values[key] + amount));
    const label = key === "zoom" ? "变倍" : key === "focus" ? "聚焦" : "光圈";
    setValues((items) => ({ ...items, [key]: next }));
    setMessage(`${label}指令已执行`);
  };

  const adjustmentLabel = (key, value) => {
    if (value === 0) return "标准";
    if (key === "zoom") return `${value < 0 ? "广角" : "长焦"}${Math.abs(value)}`;
    if (key === "focus") return `${value < 0 ? "近焦" : "远焦"}${Math.abs(value)}`;
    return `${value < 0 ? "收小" : "开大"}${Math.abs(value)}`;
  };

  const toggleSwitch = (key, label) => {
    if (isDisabled(key)) return;
    const next = !switches[key];
    setSwitches((items) => ({ ...items, [key]: next }));
    setMessage(`${label}已${next ? "开启" : "关闭"}`);
  };

  const runWiper = () => {
    if (isDisabled("wiper") || wiping) return;
    setWiping(true);
    setMessage("雨刷正在执行单次清扫");
    window.clearTimeout(wiperTimerRef.current);
    wiperTimerRef.current = window.setTimeout(() => {
      setWiping(false);
      setMessage("雨刷单次清扫已完成");
    }, 1400);
  };

  const toggleRecording = () => {
    if (isDisabled("record")) return;
    if (!recording) {
      const startedAt = formatMonitorTime();
      recordingSnapshotRef.current = { active: true, camera, startedAt, seconds: 0 };
      setRecordingStartedAt(startedAt);
      setRecordingSeconds(0);
      setRecording(true);
      setMessage("手动录像已开始");
      onFeedback?.(`${camera.label} 手动录像已开始`, "info");
      return;
    }
    const record = {
      id: `manual-${Date.now()}`,
      cameraId: camera.id,
      name: `${camera.label}-手动录像-${formatMonitorTime().slice(-8).replaceAll(":", "")}`,
      start: recordingStartedAt,
      duration: Math.max(1, recordingSeconds),
      mode: "手动录制",
    };
    recordingSnapshotRef.current.active = false;
    setRecording(false);
    setMessage(`录像已停止并保存（${formatPlaybackTime(record.duration)}）`);
    onRecordingSaved?.(record);
    onFeedback?.(`${record.name} 已加入上位机回放`, "success");
  };

  const confirmRestart = () => {
    setRestartConfirm(false);
    setRestarting(true);
    setMessage("重启指令已受理，视频预计中断 2 秒");
    onFeedback?.(`${camera.label} 重启指令已受理`, "warning");
    window.requestAnimationFrame(() => ptzStatusRef.current?.focus());
    window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = window.setTimeout(() => {
      setRestarting(false);
      setMessage("设备已恢复在线，控制通道重新建立");
      onFeedback?.(`${camera.label} 已完成重启并恢复在线`, "success");
    }, 2000);
  };

  const openRestartConfirm = () => {
    setRestartConfirm(true);
    window.requestAnimationFrame(() => restartCancelRef.current?.focus());
  };

  const cancelRestart = () => {
    setRestartConfirm(false);
    window.requestAnimationFrame(() => restartTriggerRef.current?.focus());
  };

  const directionButtonProps = (action) => ({
    disabled: isDisabled("ptz"),
    title: reasonFor("ptz") ?? "按住移动，释放停止",
    onPointerDown: (event) => startMovement(action, event),
    onPointerUp: () => stopMovement(),
    onPointerCancel: () => stopMovement("操作取消"),
    onLostPointerCapture: () => stopMovement(),
    onKeyDown: (event) => keyboardStep(action, event),
    "aria-pressed": direction === action,
  });

  const panelStatus = !camera ? "请先选择设备" : unavailable ? "当前设备离线：实时控制不可用，录像回放仍可查询" : camera.status === "third-party" ? "第三方设备仅支持本地录像与回放" : message;

  return (
    <section className={`monitor-panel ptz-panel ${collapsed ? "module-collapsed" : ""}`}>
      <PanelTitle collapsed={collapsed} onToggleCollapse={onToggleCollapse} collapseLabel="云台控制">云台控制 · {camera?.label ?? "未选择设备"}</PanelTitle>
      <div className="ptz-content">
        <div className="ptz-direction" aria-label="云台方向控制">
          <button className={`up ${direction === "向上" ? "active" : ""}`} {...directionButtonProps("向上")} aria-label="按住云台向上"><IconChevronDown size={20} /></button>
          <button className={`left ${direction === "向左" ? "active" : ""}`} {...directionButtonProps("向左")} aria-label="按住云台向左"><IconChevronLeft size={20} /></button>
          <button className="center" disabled={isDisabled("ptz")} title={reasonFor("ptz")} onClick={() => setMessage("云台已回到默认预置位")} aria-label="云台归位"><IconArrowsMove size={24} /></button>
          <button className={`right ${direction === "向右" ? "active" : ""}`} {...directionButtonProps("向右")} aria-label="按住云台向右"><IconChevronRight size={20} /></button>
          <button className={`down ${direction === "向下" ? "active" : ""}`} {...directionButtonProps("向下")} aria-label="按住云台向下"><IconChevronDown size={20} /></button>
        </div>
        <div className="ptz-adjustments">
          {[
            ["zoom", "变倍", "广角", "长焦", IconFocus2],
            ["focus", "聚焦", "近焦", "远焦", IconFocus2],
            ["aperture", "光圈", "收小", "开大", IconAperture],
          ].map(([key, label, lowLabel, highLabel, ControlIcon]) => (
            <div className="ptz-adjust" key={key}>
              <span><ControlIcon size={17} />{label}</span>
              <button disabled={isDisabled("optics") || values[key] <= -5} title={reasonFor("optics") ?? (values[key] <= -5 ? "已达下限" : lowLabel)} onClick={() => adjust(key, -1)} aria-label={`${label}${lowLabel}`}>−</button>
              <output aria-label={`${label}当前值`}>{adjustmentLabel(key, values[key])}</output>
              <button disabled={isDisabled("optics") || values[key] >= 5} title={reasonFor("optics") ?? (values[key] >= 5 ? "已达上限" : highLabel)} onClick={() => adjust(key, 1)} aria-label={`${label}${highLabel}`}>+</button>
            </div>
          ))}
        </div>
        <div className="ptz-actions">
          <button className={switches.talk ? "active" : ""} aria-pressed={switches.talk} disabled={isDisabled("talk")} title={reasonFor("talk")} onClick={() => toggleSwitch("talk", "对讲")}><IconMessageCircle size={17} />{switches.talk ? "结束对讲" : "对讲"}</button>
          <button className={switches.light ? "active" : ""} aria-pressed={switches.light} disabled={isDisabled("light")} title={reasonFor("light")} onClick={() => toggleSwitch("light", "补光灯")}><IconBulb size={17} />{switches.light ? "关闭补光" : "补光灯"}</button>
          <button className={wiping ? "active" : ""} aria-pressed={wiping} disabled={isDisabled("wiper") || wiping} title={reasonFor("wiper") ?? "执行一次清扫"} onClick={runWiper}><IconDroplet size={17} />{wiping ? "清扫中" : "雨刷一次"}</button>
          <button className={recording ? "active recording" : ""} aria-pressed={recording} disabled={isDisabled("record")} title={reasonFor("record")} onClick={toggleRecording}>
            <IconVideo size={17} />{recording ? `停止 ${formatPlaybackTime(recordingSeconds)}` : "开始录制"}
          </button>
          <button ref={restartTriggerRef} disabled={isDisabled("reboot")} title={reasonFor("reboot")} onClick={openRestartConfirm} aria-expanded={restartConfirm} aria-controls="ptz-restart-confirm"><IconRefresh className={restarting ? "loading-spinner" : ""} size={17} />{restarting ? "重启中" : "重启"}</button>
        </div>
        {restartConfirm && (
          <div id="ptz-restart-confirm" className="ptz-restart-confirm" role="group" aria-label="确认重启设备" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); cancelRestart(); } }}>
            <span><strong>确认重启 {camera.label}？</strong><small>实时画面与控制预计中断约 2 秒。</small></span>
            <button ref={restartCancelRef} className="secondary" onClick={cancelRestart}>取消</button>
            <button onClick={confirmRestart}>确认重启</button>
          </div>
        )}
        <p ref={ptzStatusRef} className="ptz-message" role="status" tabIndex={-1}>{panelStatus}</p>
      </div>
    </section>
  );
}

function playbackRecords(camera, source = "upper") {
  if (!camera) return [];
  const count = source === "upper" ? 9 : 6;
  return Array.from({ length: count }, (_, index) => ({
    id: `${source}-${index + 1}`,
    name: source === "upper" ? `${camera.label}-录像-${String(index + 1).padStart(2, "0")}` : `SD-CH01-${String(index + 1).padStart(2, "0")}`,
    start: `2026-07-20 ${String(15 - Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}:00`,
    duration: source === "upper" ? 120 + index * 35 : 180 + index * 50,
    mode: source === "upper" ? (index % 3 === 0 ? "手动录制" : "自动录制") : "设备录像",
  }));
}

function formatPlaybackTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function PlaybackDialog({ record, camera, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [rate, setRate] = useState(1);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    setPlaying(Boolean(record));
    setPosition(0);
    setRate(1);
  }, [record?.id, camera?.id]);

  useEffect(() => {
    if (!record || !playing) return undefined;
    const timer = window.setInterval(() => {
      setPosition((value) => Math.min(record.duration, value + 0.5 * rate));
    }, 500);
    return () => window.clearInterval(timer);
  }, [record, playing, rate]);

  useEffect(() => {
    if (record && playing && position >= record.duration) setPlaying(false);
  }, [position, record, playing]);

  useEffect(() => {
    if (!record) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector("button")?.focus(), 0);
    const handleKeys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeys);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeys);
      previousFocusRef.current?.focus?.();
    };
  }, [record, onClose]);

  if (!record) return null;

  const cycleRate = () => setRate((value) => value === 1 ? 1.5 : value === 1.5 ? 2 : 1);
  const resumePlayback = () => {
    if (position >= record.duration) setPosition(0);
    setPlaying(true);
  };

  return (
    <div className="playback-dialog-backdrop" onMouseDown={onClose} role="presentation">
      <section ref={dialogRef} className="playback-dialog" role="dialog" aria-modal="true" aria-labelledby="playback-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><strong id="playback-dialog-title">录像回放</strong><span>{record.name}</span></div>
          <button onClick={onClose} aria-label="关闭录像回放"><IconX size={20} /></button>
        </header>
        <div className="playback-viewer">
          <img src={camera?.image} alt={`${camera?.label ?? "摄像头"}录像回放画面`} />
          <span className="playback-viewer-time">{record.start}</span>
          <span className="playback-viewer-camera"><i />{camera?.label ?? "未选择设备"}</span>
          {!playing && <button className="playback-center-control" onClick={resumePlayback} aria-label={position >= record.duration ? "重新播放录像" : "继续播放录像"}><IconPlayerPlay size={36} /></button>}
        </div>
        <div className="playback-dialog-controls">
          <button onClick={() => playing ? setPlaying(false) : resumePlayback()} aria-label={playing ? "暂停录像" : position >= record.duration ? "重新播放录像" : "播放录像"}>{playing ? <IconPlayerPause size={19} /> : <IconPlayerPlay size={19} />}</button>
          <span>{formatPlaybackTime(position)}</span>
          <input type="range" min="0" max={record.duration} step="1" value={position} onChange={(event) => { const next = Number(event.target.value); setPosition(next); if (next >= record.duration) setPlaying(false); }} aria-label="录像播放进度" />
          <span>{formatPlaybackTime(record.duration)}</span>
          <button className="playback-rate" onClick={cycleRate} aria-label="切换播放倍速">{rate}×</button>
        </div>
        <footer>
          <span><IconClock size={15} />{record.start}</span>
          <span><IconVideo size={15} />{record.mode}</span>
          <button onClick={onClose}>退出回放</button>
        </footer>
      </section>
    </div>
  );
}

function PlaybackPanel({ camera, onFeedback, manualRecords = [], onDialogOpenChange, collapsed = false, onToggleCollapse }) {
  const [source, setSource] = useState("upper");
  const [sortKey, setSortKey] = useState("start");
  const [ascending, setAscending] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modeDraft, setModeDraft] = useState("all");
  const [appliedMode, setAppliedMode] = useState("all");
  const [showDuration, setShowDuration] = useState(true);
  const [page, setPage] = useState(1);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [rangeDraft, setRangeDraft] = useState({ start: "2026-07-20T08:00", end: "2026-07-20T23:59" });
  const [appliedRange, setAppliedRange] = useState({ start: "2026-07-20T08:00", end: "2026-07-20T23:59" });
  const [filterError, setFilterError] = useState("");
  const pageSize = 4;
  const dualSource = camera?.status !== "third-party";
  const effectiveSource = dualSource ? source : "lower";
  const records = useMemo(() => {
    const generated = playbackRecords(camera, effectiveSource);
    if (effectiveSource !== "upper" || !camera) return generated;
    return [...manualRecords.filter((record) => record.cameraId === camera.id), ...generated];
  }, [camera, effectiveSource, manualRecords]);
  const filteredRecords = records.filter((record) => {
    const matchesMode = effectiveSource !== "upper" || appliedMode === "all" || record.mode === appliedMode;
    const recordTime = record.start.replace(" ", "T").slice(0, 16);
    return matchesMode && recordTime >= appliedRange.start && recordTime <= appliedRange.end;
  });
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const comparison = sortKey === "duration" ? a.duration - b.duration : a.start.localeCompare(b.start);
    return ascending ? comparison : -comparison;
  });
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const visibleRecords = sortedRecords.slice((page - 1) * pageSize, page * pageSize);
  const closePreview = useCallback(() => setPreviewRecord(null), []);

  useEffect(() => {
    if (!dualSource && source !== "lower") setSource("lower");
  }, [dualSource, source]);

  useEffect(() => {
    setPage(1);
    setPreviewRecord(null);
  }, [camera?.id, effectiveSource, appliedMode]);

  useEffect(() => {
    onDialogOpenChange?.(Boolean(previewRecord));
    return () => onDialogOpenChange?.(false);
  }, [previewRecord, onDialogOpenChange]);

  const changeSort = (key) => {
    if (sortKey === key) setAscending((value) => !value);
    else {
      setSortKey(key);
      setAscending(false);
    }
  };

  const applyFilters = () => {
    if (!rangeDraft.start || !rangeDraft.end) {
      setFilterError("请选择完整的开始和结束时间");
      return;
    }
    if (rangeDraft.start > rangeDraft.end) {
      setFilterError("开始时间不能晚于结束时间");
      return;
    }
    setFilterError("");
    setAppliedRange(rangeDraft);
    setAppliedMode(modeDraft);
    setPage(1);
    onFeedback("录像查询条件已应用", "info");
  };

  const switchSource = (nextSource) => {
    setSource(nextSource);
    setFilterError("");
    onFeedback(`已切换到${nextSource === "upper" ? "上位机" : "下位机"}录像`, "info");
  };

  const handleSourceTabKey = (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const nextSource = source === "upper" ? "lower" : "upper";
    switchSource(nextSource);
    window.requestAnimationFrame(() => document.getElementById(`playback-tab-${nextSource}`)?.focus());
  };

  return (
    <>
      <section className={`monitor-panel playback-panel ${collapsed ? "module-collapsed" : ""}`}>
      <PanelTitle collapsed={collapsed} onToggleCollapse={onToggleCollapse} collapseLabel="视频回放">视频回放</PanelTitle>
      <div className="playback-toolbar">
        <div className="playback-toolbar-main">
          {dualSource && (
            <div className="playback-tabs" role="tablist" aria-label="视频来源">
              <button id="playback-tab-upper" aria-controls="playback-records-panel" className={source === "upper" ? "active" : ""} onClick={() => switchSource("upper")} onKeyDown={handleSourceTabKey} role="tab" aria-selected={source === "upper"} tabIndex={source === "upper" ? 0 : -1}>上位机</button>
              <button id="playback-tab-lower" aria-controls="playback-records-panel" className={source === "lower" ? "active" : ""} onClick={() => switchSource("lower")} onKeyDown={handleSourceTabKey} role="tab" aria-selected={source === "lower"} tabIndex={source === "lower" ? 0 : -1}>下位机</button>
            </div>
          )}
          <span className="playback-camera" title={camera?.label ?? "未选择设备"}>{camera?.label ?? "未选择设备"}</span>
        </div>
        <div className="playback-actions">
          <button className={`playback-tool ${filterOpen ? "active" : ""}`} onClick={() => setFilterOpen((value) => !value)} aria-expanded={filterOpen} aria-controls="playback-filter-panel"><IconFilter size={16} />筛选</button>
          {effectiveSource === "upper" && <button className={`playback-tool ${showDuration ? "active" : ""}`} onClick={() => setShowDuration((value) => !value)} aria-pressed={showDuration} title="显示或隐藏时长列"><IconColumns size={16} />时长列</button>}
        </div>
      </div>
      {filterOpen && (
        <div id="playback-filter-panel" className="playback-filter">
          <label>开始时间<input type="datetime-local" value={rangeDraft.start} onChange={(event) => setRangeDraft((value) => ({ ...value, start: event.target.value }))} /></label>
          <label>结束时间<input type="datetime-local" value={rangeDraft.end} onChange={(event) => setRangeDraft((value) => ({ ...value, end: event.target.value }))} /></label>
          {effectiveSource === "upper" && <label>录制方式
              <select value={modeDraft} onChange={(event) => setModeDraft(event.target.value)}>
                <option value="all">全部</option>
                <option value="自动录制">自动录制</option>
                <option value="手动录制">手动录制</option>
              </select>
            </label>}
          {filterError && <p role="alert">{filterError}</p>}
          <div className="playback-filter-actions"><button onClick={() => { const defaults = { start: "2026-07-20T08:00", end: "2026-07-20T23:59" }; setRangeDraft(defaults); setAppliedRange(defaults); setModeDraft("all"); setAppliedMode("all"); setFilterError(""); setPage(1); onFeedback("录像查询条件已重置", "info"); }}>重置</button><button onClick={applyFilters}>查询</button></div>
        </div>
      )}
      <div id="playback-records-panel" className="playback-table-wrap" role={dualSource ? "tabpanel" : undefined} aria-labelledby={dualSource ? `playback-tab-${source}` : undefined}>
        <table className="playback-table">
          <thead><tr>
            <th>序号</th>
            <th>名称</th>
            {effectiveSource === "upper" && <th aria-sort={sortKey === "start" ? ascending ? "ascending" : "descending" : "none"}><button onClick={() => changeSort("start")}>开始时间 {sortKey === "start" ? ascending ? "↑" : "↓" : ""}</button></th>}
            {effectiveSource === "upper" && showDuration && <th aria-sort={sortKey === "duration" ? ascending ? "ascending" : "descending" : "none"}><button onClick={() => changeSort("duration")}>时长 {sortKey === "duration" ? ascending ? "↑" : "↓" : ""}</button></th>}
            {effectiveSource === "upper" && <th>录制方式</th>}
            <th>操作</th>
          </tr></thead>
          <tbody>
            {visibleRecords.map((record, rowIndex) => <tr className={previewRecord?.id === record.id ? "selected" : ""} key={`${effectiveSource}-${record.id}`}>
              <td>{(page - 1) * pageSize + rowIndex + 1}</td>
              <td title={record.name}>{record.name}</td>
              {effectiveSource === "upper" && <td>{record.start}</td>}
              {effectiveSource === "upper" && showDuration && <td>{Math.floor(record.duration / 60)}分{record.duration % 60}秒</td>}
              {effectiveSource === "upper" && <td>{record.mode}</td>}
              <td><button onClick={() => { setPreviewRecord(record); onFeedback(`${record.name} 已进入回放`, "info"); }} aria-label={`播放${record.name}`}><IconPlayerPlay size={15} /></button></td>
            </tr>)}
            {!visibleRecords.length && <tr><td className="playback-empty" colSpan={effectiveSource === "upper" ? (showDuration ? 6 : 5) : 3}>当前设备在该时间范围内没有录像</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="playback-pagination">
        <span>共{sortedRecords.length}条</span>
        <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} aria-label="回放上一页"><IconChevronLeft size={16} /></button>
        <b>{page}/{totalPages}</b>
        <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} aria-label="回放下一页"><IconChevronRight size={16} /></button>
      </div>
      </section>
      <PlaybackDialog record={previewRecord} camera={camera} onClose={closePreview} />
    </>
  );
}

function AlarmDialog({ alarm, onClose, onUpdate, onLocate, onOpenCamera, onOpenModule }) {
  const [attachmentIndex, setAttachmentIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoPosition, setVideoPosition] = useState(0);
  const [actionMode, setActionMode] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [discardTarget, setDiscardTarget] = useState("close");
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const actionStateRef = useRef({ actionMode: null, actionNote: "", discardConfirm: false, submitting: false });
  actionStateRef.current = { actionMode, actionNote, discardConfirm, submitting };
  useEffect(() => {
    setAttachmentIndex(0);
    setVideoPlaying(false);
    setVideoPosition(0);
    setActionMode(null);
    setActionNote("");
    setSubmitting(false);
    setSubmitError("");
    setDiscardConfirm(false);
    setDiscardTarget("close");
  }, [alarm?.id]);

  useEffect(() => {
    setVideoPlaying(false);
    setVideoPosition(0);
  }, [attachmentIndex]);

  useEffect(() => {
    if (!videoPlaying) return undefined;
    const timer = window.setInterval(() => {
      setVideoPosition((value) => Math.min(15, value + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [videoPlaying]);

  useEffect(() => {
    if (videoPlaying && videoPosition >= 15) setVideoPlaying(false);
  }, [videoPlaying, videoPosition]);

  useEffect(() => {
    if (!alarm) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector("button")?.focus(), 0);
    const handleKeys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        const current = actionStateRef.current;
        if (current.submitting) return;
        if (current.discardConfirm) setDiscardConfirm(false);
        else if (current.actionMode && current.actionNote.trim()) {
          setDiscardTarget("action");
          setDiscardConfirm(true);
        } else if (current.actionMode) {
          setActionMode(null);
          setActionNote("");
          setSubmitError("");
        } else onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeys);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeys);
      previousFocusRef.current?.focus?.();
    };
  }, [alarm, onClose]);
  if (!alarm) return null;
  const linkedOperation = resolveOperation(alarm.linkedEventId);
  const attachments = alarm.attachments ?? [{ type: "image", src: alarm.image }];
  const attachment = attachments[attachmentIndex];

  const requestClose = () => {
    if (submitting) return;
    if (actionMode && actionNote.trim()) {
      setDiscardTarget("close");
      setDiscardConfirm(true);
      return;
    }
    onClose();
  };

  const submitAction = async () => {
    if (!actionNote.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onUpdate(alarm.id, actionMode, actionNote.trim());
    } catch (error) {
      setSubmitting(false);
      setSubmitError(error?.message ?? "提交失败，请稍后重试");
    }
  };

  const toggleAttachmentVideo = () => {
    if (videoPosition >= 15) setVideoPosition(0);
    setVideoPlaying((value) => !value);
  };

  const returnFromAction = () => {
    if (actionNote.trim()) {
      setDiscardTarget("action");
      setDiscardConfirm(true);
      return;
    }
    setActionMode(null);
    setSubmitError("");
  };

  const discardChanges = () => {
    if (discardTarget === "close") {
      onClose();
      return;
    }
    setDiscardConfirm(false);
    setActionMode(null);
    setActionNote("");
    setSubmitError("");
  };

  return (
    <div className="monitor-dialog-backdrop" role="presentation" onMouseDown={requestClose}>
      <section ref={dialogRef} className="monitor-dialog" role="dialog" aria-modal="true" aria-labelledby="alarm-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><strong id="alarm-dialog-title">报警事件详情</strong><span>#{alarm.id}</span></div>
          <button onClick={requestClose} disabled={submitting} aria-label="关闭报警详情"><IconX size={20} /></button>
        </header>
        <div className="alarm-attachment-viewer">
          <img src={attachment.src} alt={`${alarm.title}${attachment.type === "video" ? "视频" : "图片"}附件`} />
          {attachment.type === "video" && (
            <button className="attachment-play" onClick={toggleAttachmentVideo} aria-label={videoPlaying ? "暂停视频附件" : videoPosition >= 15 ? "重新播放视频附件" : "播放视频附件"}>
              {videoPlaying ? <IconPlayerPause size={36} /> : <IconPlayerPlay size={36} />}
              <span>{videoPlaying ? `正在播放 ${formatPlaybackTime(videoPosition)} / 00:15` : videoPosition >= 15 ? "重新播放视频附件" : "播放视频附件"}</span>
            </button>
          )}
          {attachments.length > 1 && (
            <>
              <button className="attachment-nav previous" onClick={() => setAttachmentIndex((value) => value === 0 ? attachments.length - 1 : value - 1)} aria-label="上一个附件"><IconChevronLeft size={22} /></button>
              <button className="attachment-nav next" onClick={() => setAttachmentIndex((value) => (value + 1) % attachments.length)} aria-label="下一个附件"><IconChevronRight size={22} /></button>
              <span className="attachment-count">{attachmentIndex + 1}/{attachments.length}</span>
            </>
          )}
        </div>
        <dl>
          {linkedOperation && <div><dt>事件编号</dt><dd>{linkedOperation.displayId}</dd></div>}
          <div><dt>故障类型</dt><dd>{alarm.title}</dd></div>
          <div><dt>报警等级</dt><dd>{alarm.level} · {LEVEL_META[alarm.level]?.label}</dd></div>
          <div><dt>处理状态</dt><dd>{STATUS_COPY[alarm.status]}</dd></div>
          <div><dt>报警时间</dt><dd>{alarm.time}</dd></div>
          <div><dt>当前负责人</dt><dd>{alarm.owner}</dd></div>
          <div><dt>响应时限</dt><dd>{alarm.status === "pending" ? `已等待 ${alarm.ageMinutes} 分钟 · 剩余 ${alarm.slaMinutes} 分钟` : "已完成处置"}</dd></div>
          {alarm.defectId && <div><dt>缺陷编号</dt><dd>{alarm.defectId}</dd></div>}
          {alarm.actionNote && <div><dt>处置说明</dt><dd>{alarm.actionNote}</dd></div>}
          {linkedOperation && <div><dt>关联采集站</dt><dd>{linkedOperation.stationCode} · {linkedOperation.stationName}</dd></div>}
          {linkedOperation && <div><dt>分析测点</dt><dd>{linkedOperation.analysisPointCode} · {linkedOperation.analysisPointName} / {linkedOperation.analysisMetricName}</dd></div>}
          <div className="alarm-device-row"><dt>报警设备</dt><dd>{alarm.devicePath}</dd></div>
        </dl>
        {actionMode && (
          <div className="alarm-action-confirm">
            <div><strong>{actionMode === "defect" ? "确认转为缺陷" : "确认关闭报警"}</strong><span>{actionMode === "defect" ? "该事件将进入缺陷跟踪流程。" : "关闭后将计入今日已处理。"}</span></div>
            <span className="action-note-field"><textarea autoFocus maxLength={200} value={actionNote} onChange={(event) => { setActionNote(event.target.value); setSubmitError(""); }} placeholder="填写处置原因或现场核实结果（必填）" aria-label="处置说明" /><small>{actionNote.length}/200</small></span>
          </div>
        )}
        {submitError && <p className="dialog-submit-error" role="alert">{submitError}</p>}
        {alarm.linkedEventId && !actionMode && !discardConfirm && (
          <nav className="alarm-linked-actions" aria-label="关联业务模块">
            <span>同一事件：</span>
            <button type="button" onClick={() => onOpenModule("diagnosis", alarm)}>智能诊断<IconExternalLink size={14} /></button>
            <button type="button" onClick={() => onOpenModule("analysis", alarm)}>音视频分析<IconExternalLink size={14} /></button>
            <button type="button" onClick={() => onOpenModule("station", alarm)}>采集站配置<IconExternalLink size={14} /></button>
          </nav>
        )}
        <footer>
          {discardConfirm ? (
            <>
              <span className="discard-copy">当前说明尚未提交，确认放弃？</span>
              <button className="secondary" onClick={() => setDiscardConfirm(false)}>继续填写</button>
              <button className="danger" onClick={discardChanges}>{discardTarget === "close" ? "放弃并关闭" : "放弃本次填写"}</button>
            </>
          ) : actionMode ? (
            <>
              <button className="secondary" onClick={returnFromAction} disabled={submitting}>返回</button>
              <button onClick={submitAction} disabled={!actionNote.trim() || submitting}>{submitting ? <><IconLoader2 className="loading-spinner" size={16} />提交中</> : "确认提交"}</button>
            </>
          ) : (
            <>
              <button className="camera-primary" onClick={() => onOpenCamera(alarm)}><IconCamera size={17} />定位并打开画面</button>
              <button className="secondary" onClick={() => onLocate(alarm.id)}>返回队列定位</button>
              <span className="dialog-action-spacer" />
              <button className="secondary" onClick={() => setActionMode("defect")} disabled={alarm.status !== "pending"}>{alarm.status === "defect" ? "已转为缺陷" : "转为缺陷"}</button>
              <button onClick={() => setActionMode("closed")} disabled={alarm.status !== "pending"}>{alarm.status === "closed" ? "报警已关闭" : "关闭报警"}</button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

function MonitorToast({ feedback, onClose }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(timer);
  }, [feedback.id, onClose]);

  return (
    <div className={`monitor-toast tone-${feedback.tone}`} role="status" aria-live="polite">
      {feedback.tone === "warning" ? <IconAlertTriangle size={19} /> : <IconCircleCheck size={19} />}
      <span>{feedback.text}</span>
      <button onClick={onClose} aria-label="关闭提示"><IconX size={16} /></button>
    </div>
  );
}

export function VideoMonitoring({ embedded = false, shellCollapsed = false, onToggleShellSidebar, onSetShellSidebarCollapsed }) {
  const layoutRef = useRef(null);
  const alarmModePanelRef = useRef(null);
  const cameraModePanelRef = useRef(null);
  const columnResizeRef = useRef(null);
  const rowResizeRef = useRef(null);
  const { events, getEvent, updateEvent } = useOperations();
  const requestedParams = useMemo(() => routeParams(), []);
  const requestedOperation = resolveOperation(requestedParams.get("event"));
  const requestedCamera = requestedOperation?.cameraId || requestedParams.get("camera");
  const requestedCameraId = CAMERA_MAP.has(requestedCamera) ? requestedCamera : "";
  const requestedAlarmId = Number(requestedOperation?.videoAlarmId || requestedParams.get("alarm"));
  const validRequestedAlarmId = INITIAL_ALARMS.some((alarm) => alarm.id === requestedAlarmId) ? requestedAlarmId : null;
  const [selected, setSelected] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("ronds-monitor-devices-v2") ?? "null");
      if (Array.isArray(saved)) {
        const valid = saved.filter((id) => CAMERA_MAP.has(id));
        return requestedCameraId && !valid.includes(requestedCameraId) ? [requestedCameraId, ...valid] : valid;
      }
    } catch {
      // Ignore invalid stored data and use the default selection.
    }
    return requestedCameraId && !DEFAULT_SELECTED_IDS.includes(requestedCameraId) ? [requestedCameraId, ...DEFAULT_SELECTED_IDS] : DEFAULT_SELECTED_IDS;
  });
  const createInitialAlarms = () => INITIAL_ALARMS.map((alarm) => {
    const eventState = alarm.linkedEventId ? getEvent(alarm.linkedEventId) : null;
    return eventState ? { ...alarm, ...eventState, owner: eventState.status === "pending" ? alarm.owner : "超级管理员" } : alarm;
  });
  const [alarms, setAlarms] = useState(createInitialAlarms);
  const alarmsRef = useRef(createInitialAlarms());
  const submittingAlarmIdsRef = useRef(new Set());
  const [alarmFilter, setAlarmFilter] = useState(() => validRequestedAlarmId ? "all" : window.sessionStorage.getItem("ronds-monitor-alarm-filter") ?? "pending");
  const [detailAlarmId, setDetailAlarmId] = useState(validRequestedAlarmId);
  const [locatedAlarmId, setLocatedAlarmId] = useState(validRequestedAlarmId);
  const [riskFocus, setRiskFocus] = useState(false);
  const riskPreviousCameraRef = useRef(null);
  const alarmContextRef = useRef({ filter: "pending" });
  const [focusRequest, setFocusRequest] = useState(null);
  const focusRequestIdRef = useRef(0);
  const [focusMode, setFocusMode] = useState(false);
  const focusPreviousCollapsedRef = useRef(shellCollapsed);
  const [feedback, setFeedback] = useState(null);
  const feedbackIdRef = useRef(0);
  const [activeCameraId, setActiveCameraId] = useState(requestedCameraId || selected[0] || null);
  const [manualRecords, setManualRecords] = useState([]);
  const [playbackDialogOpen, setPlaybackDialogOpen] = useState(false);
  const [ptzBusy, setPtzBusy] = useState(false);
  const [topCollapsed, setTopCollapsed] = useState(false);
  const [leftColumnOpen, setLeftColumnOpen] = useState(() => window.localStorage.getItem("ronds-monitor-left-open-v1") !== "false");
  const [leftColumnWidth, setLeftColumnWidth] = useState(() => {
    const saved = Number(window.localStorage.getItem("ronds-monitor-left-width-v1"));
    return Number.isFinite(saved) && saved >= 190 && saved <= 360 ? saved : 250;
  });
  const [rightColumnOpen, setRightColumnOpen] = useState(() => {
    const saved = window.localStorage.getItem("ronds-monitor-right-open-v3");
    if (saved !== null) return saved === "true";
    return true;
  });
  const [rightColumnWidth, setRightColumnWidth] = useState(() => {
    const saved = Number(window.localStorage.getItem("ronds-monitor-right-width-v1"));
    return Number.isFinite(saved) && saved >= 280 && saved <= 480 ? saved : 360;
  });
  const [rightTopSize, setRightTopSize] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("ronds-monitor-right-split-v1") ?? "null");
      return {
        alarms: Number.isFinite(saved?.alarms) ? saved.alarms : 170,
        camera: Number.isFinite(saved?.camera) ? saved.camera : 285,
      };
    } catch {
      return { alarms: 170, camera: 285 };
    }
  });
  const [collapsedModules, setCollapsedModules] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("ronds-monitor-module-collapse-v1") ?? "null");
      return {
        summary: Boolean(saved?.summary),
        alarms: Boolean(saved?.alarms),
        ptz: Boolean(saved?.ptz),
        playback: Boolean(saved?.playback),
      };
    } catch {
      return { summary: false, alarms: false, ptz: false, playback: false };
    }
  });
  const [resizingLayout, setResizingLayout] = useState("");
  const [rightMode, setRightMode] = useState(() => window.sessionStorage.getItem("ronds-monitor-right-mode") ?? "alarms");
  const selectedDevices = useMemo(() => selected.map((id) => CAMERA_MAP.get(id)).filter(Boolean), [selected]);
  const pendingAlarms = useMemo(() => alarms.filter((alarm) => alarm.status === "pending"), [alarms]);
  const riskDevices = useMemo(() => {
    const ids = [...new Set(pendingAlarms.map((alarm) => alarm.cameraId))];
    return ids.map((id) => CAMERA_MAP.get(id)).filter(Boolean);
  }, [pendingAlarms]);
  const activeSelectedDevice = CAMERA_MAP.get(activeCameraId);
  const normalWallDevices = useMemo(() => {
    if (!activeSelectedDevice || selected.includes(activeSelectedDevice.id)) return selectedDevices;
    return [activeSelectedDevice, ...selectedDevices];
  }, [activeSelectedDevice, selected, selectedDevices]);
  const wallDevices = riskFocus ? riskDevices : normalWallDevices;
  const activeCamera = CAMERA_MAP.get(activeCameraId) ?? wallDevices[0] ?? null;
  const detailAlarm = alarms.find((alarm) => alarm.id === detailAlarmId) ?? null;
  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-devices-v2", JSON.stringify(selected));
  }, [selected]);

  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-left-open-v1", String(leftColumnOpen));
  }, [leftColumnOpen]);

  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-left-width-v1", String(Math.round(leftColumnWidth)));
  }, [leftColumnWidth]);

  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-right-open-v3", String(rightColumnOpen));
  }, [rightColumnOpen]);

  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-right-width-v1", String(Math.round(rightColumnWidth)));
  }, [rightColumnWidth]);

  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-right-split-v1", JSON.stringify(rightTopSize));
  }, [rightTopSize]);

  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-module-collapse-v1", JSON.stringify(collapsedModules));
  }, [collapsedModules]);

  useEffect(() => {
    window.sessionStorage.setItem("ronds-monitor-right-mode", rightMode);
  }, [rightMode]);

  useEffect(() => {
    window.sessionStorage.setItem("ronds-monitor-alarm-filter", alarmFilter);
  }, [alarmFilter]);

  useEffect(() => {
    const sync = (items) => items.map((alarm) => {
      const eventState = alarm.linkedEventId ? events[alarm.linkedEventId] : null;
      return eventState ? {
        ...alarm,
        status: eventState.status,
        actionNote: eventState.actionNote,
        defectId: eventState.defectId,
        handledAt: eventState.updatedAt,
        owner: eventState.status === "pending" ? "待认领" : "超级管理员",
      } : alarm;
    });
    setAlarms((items) => {
      const next = sync(items);
      alarmsRef.current = next;
      return next;
    });
  }, [events]);

  useEffect(() => {
    if (riskFocus && !riskDevices.length) {
      setRiskFocus(false);
      setActiveCameraId(riskPreviousCameraRef.current ?? selected[0] ?? null);
    }
  }, [riskFocus, riskDevices.length]);

  const toggleDevices = (ids) => {
    const selectedSet = new Set(selected);
    const shouldRemove = ids.every((id) => selectedSet.has(id));
    const nextSelected = shouldRemove
      ? selected.filter((id) => !ids.includes(id))
      : [...selected, ...ids.filter((id) => !selectedSet.has(id))];
    setSelected(nextSelected);
    if (shouldRemove && ids.includes(activeCameraId) && !riskFocus) {
      setActiveCameraId(nextSelected[0] ?? null);
    }
  };

  const showFeedback = useCallback((text, tone = "success") => {
    feedbackIdRef.current += 1;
    setFeedback({ id: feedbackIdRef.current, text, tone });
  }, []);

  const closeFeedback = useCallback(() => setFeedback(null), []);
  const closeAlarmDialog = useCallback(() => setDetailAlarmId(null), []);
  const handlePlaybackDialogOpenChange = useCallback((open) => setPlaybackDialogOpen(open), []);
  const handlePtzBusyChange = useCallback((busy) => setPtzBusy(busy), []);
  const handleRecordingSaved = useCallback((record) => {
    setManualRecords((records) => [record, ...records]);
  }, []);

  const updateAlarm = useCallback(async (id, status, note = "") => {
    const current = alarmsRef.current.find((item) => item.id === id);
    if (!current || current.status !== "pending") throw new Error("事件已被其他值班员处理，请刷新队列");
    if (submittingAlarmIdsRef.current.has(id)) throw new Error("该事件正在提交，请勿重复操作");
    submittingAlarmIdsRef.current.add(id);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      const latest = alarmsRef.current.find((item) => item.id === id);
      if (!latest || latest.status !== "pending") throw new Error("事件状态已变化，本次提交未生效");
      const updated = {
        ...latest,
        status,
        owner: "超级管理员",
        actionNote: note,
        handledAt: formatMonitorTime(),
        defectId: status === "defect" ? createOperationDefectId(latest.linkedEventId) : latest.defectId,
      };
      if (latest.linkedEventId) {
        updateEvent(latest.linkedEventId, {
          status,
          actionNote: note,
          defectId: updated.defectId || "",
        }, "video-monitoring");
      }
      const nextAlarms = alarmsRef.current.map((item) => item.id === id ? updated : item);
      alarmsRef.current = nextAlarms;
      setAlarms(nextAlarms);
      setDetailAlarmId(null);
      showFeedback(`${latest.title}已${status === "defect" ? `转为缺陷 ${updated.defectId}` : "关闭"}`);
      return updated;
    } finally {
      submittingAlarmIdsRef.current.delete(id);
    }
  }, [showFeedback, updateEvent]);

  const openLinkedModule = useCallback((target, alarm) => {
    const href = target === "diagnosis"
      ? operationHref("/intelligent-diagnosis", alarm.linkedEventId, { case: alarm.diagnosisCaseId })
      : target === "analysis"
        ? operationHref("/audio-video-analysis", alarm.linkedEventId, { point: alarm.analysisPoint, metric: alarm.analysisMetric, station: alarm.stationCode, camera: alarm.cameraId })
        : operationHref("/collection-stations", alarm.linkedEventId, { station: alarm.stationCode, case: alarm.diagnosisCaseId });
    window.location.href = href;
  }, []);

  const getColumnBounds = (side) => {
    const layoutWidth = layoutRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const contentWidth = Math.max(0, layoutWidth - 20);
    const minimumCenterWidth = 460;
    if (side === "left") {
      const occupiedByRight = rightColumnOpen ? rightColumnWidth + 10 : 0;
      return {
        min: 190,
        max: Math.max(190, Math.min(360, contentWidth - occupiedByRight - 10 - minimumCenterWidth)),
      };
    }
    const occupiedByLeft = leftColumnOpen ? leftColumnWidth + 10 : 0;
    return {
      min: 280,
      max: Math.max(280, Math.min(480, contentWidth - occupiedByLeft - 10 - minimumCenterWidth)),
    };
  };

  const clampColumnWidth = (side, width) => {
    const bounds = getColumnBounds(side);
    return Math.max(bounds.min, Math.min(bounds.max, width));
  };

  const beginColumnResize = (side, event) => {
    event.preventDefault();
    const startWidth = side === "left" ? leftColumnWidth : rightColumnWidth;
    columnResizeRef.current = {
      side,
      startX: event.clientX,
      startWidth,
      latestWidth: startWidth,
      target: event.currentTarget,
      pointerId: event.pointerId,
    };
    setResizingLayout(side);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const continueColumnResize = (event) => {
    const resize = columnResizeRef.current;
    if (!resize) return;
    const delta = resize.side === "left" ? event.clientX - resize.startX : resize.startX - event.clientX;
    const next = clampColumnWidth(resize.side, resize.startWidth + delta);
    resize.latestWidth = next;
    if (resize.side === "left") setLeftColumnWidth(next);
    else setRightColumnWidth(next);
  };

  const finishColumnResize = (event) => {
    const resize = columnResizeRef.current;
    if (!resize) return;
    columnResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setResizingLayout("");
    showFeedback(`${resize.side === "left" ? "监控设备栏" : "右侧工作栏"}宽度已调整为 ${Math.round(resize.latestWidth)}px`, "info");
  };

  const resizeColumnWithKeyboard = (side, event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const bounds = getColumnBounds(side);
    const current = side === "left" ? leftColumnWidth : rightColumnWidth;
    let next = current;
    if (event.key === "Home") next = bounds.min;
    else if (event.key === "End") next = bounds.max;
    else {
      const step = event.shiftKey ? 1 : 12;
      const visualDelta = event.key === "ArrowRight" ? step : -step;
      next = current + (side === "left" ? visualDelta : -visualDelta);
    }
    next = clampColumnWidth(side, next);
    if (side === "left") setLeftColumnWidth(next);
    else setRightColumnWidth(next);
  };

  const resetColumnWidth = (side) => {
    const next = clampColumnWidth(side, side === "left" ? 250 : 360);
    if (side === "left") setLeftColumnWidth(next);
    else setRightColumnWidth(next);
    showFeedback(`${side === "left" ? "监控设备栏" : "右侧工作栏"}已恢复默认宽度`, "info");
  };

  const toggleLeftColumn = () => {
    const next = !leftColumnOpen;
    setLeftColumnOpen(next);
    showFeedback(next ? "监控设备栏已展开" : "监控设备栏已收起，实时画面已扩展", "info");
  };

  const toggleRightColumn = () => {
    const next = !rightColumnOpen;
    setRightColumnOpen(next);
    showFeedback(next ? "右侧工作栏已展开" : "右侧工作栏已收起，实时画面已扩展", "info");
  };

  const toggleModuleCollapsed = (key, label) => {
    const next = !collapsedModules[key];
    setCollapsedModules((items) => ({ ...items, [key]: next }));
    showFeedback(`${label}已${next ? "收起" : "展开"}`, "info");
  };

  const getRightRowBounds = (mode = rightMode) => {
    const panel = mode === "alarms" ? alarmModePanelRef.current : cameraModePanelRef.current;
    const measuredHeight = panel?.getBoundingClientRect().height ?? 0;
    const panelHeight = measuredHeight > 0 ? measuredHeight : 640;
    const topMin = mode === "alarms" ? 145 : 220;
    const bottomMin = mode === "alarms" ? 180 : 190;
    return { min: topMin, max: Math.max(topMin, panelHeight - bottomMin - 10) };
  };

  const clampRightTopSize = (mode, size) => {
    const bounds = getRightRowBounds(mode);
    return Math.max(bounds.min, Math.min(bounds.max, size));
  };

  const beginRightRowResize = (mode, event) => {
    event.preventDefault();
    const startSize = rightTopSize[mode];
    rowResizeRef.current = {
      mode,
      startY: event.clientY,
      startSize,
      latestSize: startSize,
      target: event.currentTarget,
      pointerId: event.pointerId,
    };
    setResizingLayout("rows");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const continueRightRowResize = (event) => {
    const resize = rowResizeRef.current;
    if (!resize) return;
    const next = clampRightTopSize(resize.mode, resize.startSize + event.clientY - resize.startY);
    resize.latestSize = next;
    setRightTopSize((items) => ({ ...items, [resize.mode]: next }));
  };

  const finishRightRowResize = (event) => {
    const resize = rowResizeRef.current;
    if (!resize) return;
    rowResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setResizingLayout("");
    showFeedback(`上下模块分隔位置已调整为 ${Math.round(resize.latestSize)}px`, "info");
  };

  const resizeRightRowsWithKeyboard = (mode, event) => {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const bounds = getRightRowBounds(mode);
    let next = rightTopSize[mode];
    if (event.key === "Home") next = bounds.min;
    else if (event.key === "End") next = bounds.max;
    else {
      const step = event.shiftKey ? 1 : 12;
      next += event.key === "ArrowDown" ? step : -step;
    }
    next = clampRightTopSize(mode, next);
    setRightTopSize((items) => ({ ...items, [mode]: next }));
  };

  const resetRightRows = (mode) => {
    const next = clampRightTopSize(mode, mode === "alarms" ? 170 : 285);
    setRightTopSize((items) => ({ ...items, [mode]: next }));
    showFeedback("上下模块已恢复默认比例", "info");
  };

  useEffect(() => {
    if (!resizingLayout) return undefined;

    const cancelResize = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "keydown") event.preventDefault();
      const shouldRestore = event.type === "keydown";

      const columnResize = columnResizeRef.current;
      if (columnResize) {
        if (shouldRestore) {
          if (columnResize.side === "left") setLeftColumnWidth(columnResize.startWidth);
          else setRightColumnWidth(columnResize.startWidth);
        }
        columnResizeRef.current = null;
        if (columnResize.target?.hasPointerCapture?.(columnResize.pointerId)) {
          columnResize.target.releasePointerCapture(columnResize.pointerId);
        }
      }

      const rowResize = rowResizeRef.current;
      if (rowResize) {
        if (shouldRestore) {
          setRightTopSize((items) => ({ ...items, [rowResize.mode]: rowResize.startSize }));
        }
        rowResizeRef.current = null;
        if (rowResize.target?.hasPointerCapture?.(rowResize.pointerId)) {
          rowResize.target.releasePointerCapture(rowResize.pointerId);
        }
      }

      setResizingLayout("");
      if (event.type === "keydown") showFeedback("已取消本次尺寸调整", "info");
    };

    window.addEventListener("keydown", cancelResize);
    window.addEventListener("blur", cancelResize);
    return () => {
      window.removeEventListener("keydown", cancelResize);
      window.removeEventListener("blur", cancelResize);
    };
  }, [resizingLayout, showFeedback]);

  const selectCamera = useCallback((id, openControls = false) => {
    setActiveCameraId(id);
    if (openControls && id) {
      setRightMode("camera");
      setRightColumnOpen(true);
    }
  }, []);

  const openPlaybackForCamera = useCallback((id) => {
    setActiveCameraId(id);
    setRightMode("camera");
    setRightColumnOpen(true);
    showFeedback(`已打开 ${CAMERA_MAP.get(id)?.label ?? "当前设备"} 的录像查询`, "info");
  }, [showFeedback]);

  const locateAlarm = (id) => {
    setDetailAlarmId(null);
    setLocatedAlarmId(id);
    setAlarmFilter(alarmContextRef.current.filter ?? "pending");
    setRightMode("alarms");
    setRightColumnOpen(true);
    showFeedback(`已在报警列表中定位事件 #${id}`, "info");
  };

  const toggleRiskFocus = () => {
    const next = !riskFocus;
    if (next) {
      riskPreviousCameraRef.current = activeCameraId;
      if (riskDevices[0]) setActiveCameraId(riskDevices[0].id);
    } else {
      setActiveCameraId(riskPreviousCameraRef.current ?? selected[0] ?? null);
    }
    setRiskFocus(next);
    showFeedback(next ? `已聚焦 ${riskDevices.length} 个报警点位` : "已恢复常用监控组", "info");
  };

  const setShellCollapsed = useCallback((next) => {
    if (onSetShellSidebarCollapsed) onSetShellSidebarCollapsed(next);
    else if (onToggleShellSidebar && shellCollapsed !== next) onToggleShellSidebar();
  }, [onSetShellSidebarCollapsed, onToggleShellSidebar, shellCollapsed]);

  const toggleFocusMode = () => {
    const next = !focusMode;
    if (next) {
      focusPreviousCollapsedRef.current = shellCollapsed;
      setShellCollapsed(true);
    } else {
      setShellCollapsed(focusPreviousCollapsedRef.current);
    }
    setFocusMode(next);
    showFeedback(next ? "已进入专注监控，主导航暂时收起" : "已退出专注监控并恢复原导航状态", "info");
  };

  const changeRightMode = (mode) => {
    setRightMode(mode);
    showFeedback(mode === "alarms" ? "已切换到报警看护" : "已切换到云台与录像", "info");
  };

  const handleRightTabKey = (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const nextMode = rightMode === "alarms" ? "camera" : "alarms";
    changeRightMode(nextMode);
    window.requestAnimationFrame(() => document.getElementById(`monitor-tab-${nextMode}`)?.focus());
  };

  const openAlarmDetail = (alarm) => {
    alarmContextRef.current = { filter: alarmFilter };
    setActiveCameraId(alarm.cameraId);
    setLocatedAlarmId(alarm.id);
    setDetailAlarmId(alarm.id);
  };

  const openAlarmCamera = (alarm) => {
    setRiskFocus(false);
    selectCamera(alarm.cameraId, false);
    focusRequestIdRef.current += 1;
    setFocusRequest({ cameraId: alarm.cameraId, token: focusRequestIdRef.current });
    setDetailAlarmId(null);
    setRightMode("alarms");
    setRightColumnOpen(true);
    showFeedback(`已定位 ${alarm.deviceName}，并切换为单画面核实`, "info");
  };

  return (
    <div className={`monitor-page ${embedded ? "embedded" : ""} ${topCollapsed ? "top-collapsed" : ""} ${focusMode ? "focus-mode" : ""} ${resizingLayout ? `layout-resizing resize-${resizingLayout}` : ""}`}>
      {!embedded && (
        <header className="monitor-tabs">
          {!topCollapsed && <a className="monitor-tab" href="/">集团驾驶舱 <IconX size={15} /></a>}
          {!topCollapsed && <span className="monitor-tab active">智慧视频监控 <IconX size={15} /></span>}
          <button className="monitor-top-collapse" onClick={() => setTopCollapsed((value) => !value)} aria-label={topCollapsed ? "展开顶部" : "收起顶部"} title={topCollapsed ? "展开顶部" : "收起顶部"}><IconChevronDown size={20} /></button>
        </header>
      )}
      <div
        ref={layoutRef}
        className={`monitor-layout ${leftColumnOpen ? "" : "left-collapsed"} ${rightColumnOpen ? "" : "right-collapsed"}`}
        style={{
          "--monitor-left-width": `${Math.round(leftColumnWidth)}px`,
          "--monitor-right-width": `${Math.round(rightColumnWidth)}px`,
        }}
      >
        <DevicePanel
          selected={selected}
          onToggle={toggleDevices}
          activeCameraId={activeCameraId}
          onActivate={selectCamera}
          onCollapse={toggleLeftColumn}
          hidden={!leftColumnOpen}
        />
        {leftColumnOpen && (
          <div
            className={`monitor-column-resizer left ${resizingLayout === "left" ? "active" : ""}`}
            role="separator"
            aria-label="调整监控设备栏宽度"
            aria-orientation="vertical"
            aria-valuemin={getColumnBounds("left").min}
            aria-valuemax={getColumnBounds("left").max}
            aria-valuenow={Math.round(leftColumnWidth)}
            tabIndex={0}
            title="拖动调整设备栏宽度；双击恢复默认"
            onPointerDown={(event) => beginColumnResize("left", event)}
            onPointerMove={continueColumnResize}
            onPointerUp={finishColumnResize}
            onPointerCancel={finishColumnResize}
            onLostPointerCapture={finishColumnResize}
            onKeyDown={(event) => resizeColumnWithKeyboard("left", event)}
            onDoubleClick={() => resetColumnWidth("left")}
          />
        )}
        <VideoWall
          devices={wallDevices}
          activeCameraId={activeCameraId}
          onActiveCameraChange={selectCamera}
          onFeedback={showFeedback}
          pendingAlarms={pendingAlarms}
          riskFocus={riskFocus}
          onToggleRiskFocus={toggleRiskFocus}
          focusMode={focusMode}
          onToggleFocusMode={toggleFocusMode}
          focusRequest={focusRequest}
          onOpenPlayback={openPlaybackForCamera}
          suspended={Boolean(detailAlarm) || playbackDialogOpen || ptzBusy || Boolean(resizingLayout)}
        />
        {rightColumnOpen && (
          <div
            className={`monitor-column-resizer right ${resizingLayout === "right" ? "active" : ""}`}
            role="separator"
            aria-label="调整右侧工作栏宽度"
            aria-orientation="vertical"
            aria-valuemin={getColumnBounds("right").min}
            aria-valuemax={getColumnBounds("right").max}
            aria-valuenow={Math.round(rightColumnWidth)}
            tabIndex={0}
            title="拖动调整右侧栏宽度；双击恢复默认"
            onPointerDown={(event) => beginColumnResize("right", event)}
            onPointerMove={continueColumnResize}
            onPointerUp={finishColumnResize}
            onPointerCancel={finishColumnResize}
            onLostPointerCapture={finishColumnResize}
            onKeyDown={(event) => resizeColumnWithKeyboard("right", event)}
            onDoubleClick={() => resetColumnWidth("right")}
          />
        )}
        {!leftColumnOpen && (
          <button className="left-column-toggle" onClick={toggleLeftColumn} aria-label="展开监控设备栏" title="展开监控设备栏">
            <IconChevronRight size={18} /><span>设备</span>
          </button>
        )}
        {!rightColumnOpen && (
          <button className="right-column-toggle" onClick={toggleRightColumn} aria-label="展开右侧工作栏" title="展开右侧工作栏">
            <IconChevronLeft size={19} />
            <span className="toggle-alarm-label">工作栏</span>
            {pendingAlarms.length > 0 && <span className="toggle-alarm-badge">{pendingAlarms.length}</span>}
          </button>
        )}
        <aside className={`monitor-right mode-${rightMode}`} hidden={!rightColumnOpen}>
            <div className="right-mode-header">
              <div className="right-mode-tabs" role="tablist" aria-label="右侧功能">
                <button id="monitor-tab-alarms" aria-controls="monitor-panel-alarms" className={rightMode === "alarms" ? "active" : ""} onClick={() => changeRightMode("alarms")} onKeyDown={handleRightTabKey} role="tab" aria-selected={rightMode === "alarms"} tabIndex={rightMode === "alarms" ? 0 : -1}>报警看护</button>
                <button id="monitor-tab-camera" aria-controls="monitor-panel-camera" className={rightMode === "camera" ? "active" : ""} onClick={() => changeRightMode("camera")} onKeyDown={handleRightTabKey} role="tab" aria-selected={rightMode === "camera"} tabIndex={rightMode === "camera" ? 0 : -1}>云台与回放</button>
              </div>
              <button className="right-panel-collapse" onClick={toggleRightColumn} aria-label="收起右侧工作栏" title="收起右侧工作栏"><IconChevronRight size={18} /></button>
            </div>
            <div
              ref={alarmModePanelRef}
              id="monitor-panel-alarms"
              className={`right-mode-panel ${collapsedModules.summary ? "top-collapsed" : ""} ${collapsedModules.alarms ? "bottom-collapsed" : ""}`}
              style={{ "--right-top-size": `${Math.round(rightTopSize.alarms)}px` }}
              role="tabpanel"
              aria-labelledby="monitor-tab-alarms"
              hidden={rightMode !== "alarms"}
            >
              <SummaryPanel alarms={alarms} onFilter={setAlarmFilter} collapsed={collapsedModules.summary} onToggleCollapse={() => toggleModuleCollapsed("summary", "今日监控报警看护")} />
              <div
                className={`right-row-resizer ${collapsedModules.summary || collapsedModules.alarms ? "disabled" : ""} ${resizingLayout === "rows" ? "active" : ""}`}
                role={collapsedModules.summary || collapsedModules.alarms ? undefined : "separator"}
                aria-label={collapsedModules.summary || collapsedModules.alarms ? undefined : "调整报警摘要与报警列表高度"}
                aria-orientation={collapsedModules.summary || collapsedModules.alarms ? undefined : "horizontal"}
                aria-valuemin={getRightRowBounds("alarms").min}
                aria-valuemax={getRightRowBounds("alarms").max}
                aria-valuenow={Math.round(rightTopSize.alarms)}
                tabIndex={collapsedModules.summary || collapsedModules.alarms ? -1 : 0}
                title={collapsedModules.summary || collapsedModules.alarms ? undefined : "拖动调整上下模块高度；双击恢复默认"}
                onPointerDown={collapsedModules.summary || collapsedModules.alarms ? undefined : (event) => beginRightRowResize("alarms", event)}
                onPointerMove={continueRightRowResize}
                onPointerUp={finishRightRowResize}
                onPointerCancel={finishRightRowResize}
                onLostPointerCapture={finishRightRowResize}
                onKeyDown={(event) => resizeRightRowsWithKeyboard("alarms", event)}
                onDoubleClick={() => resetRightRows("alarms")}
              />
              <AlarmPanel alarms={alarms} filter={alarmFilter} onFilter={setAlarmFilter} locatedAlarmId={locatedAlarmId} onSelect={openAlarmDetail} collapsed={collapsedModules.alarms} onToggleCollapse={() => toggleModuleCollapsed("alarms", "最近监控报警")} />
            </div>
            <div
              ref={cameraModePanelRef}
              id="monitor-panel-camera"
              className={`right-mode-panel ${collapsedModules.ptz ? "top-collapsed" : ""} ${collapsedModules.playback ? "bottom-collapsed" : ""}`}
              style={{ "--right-top-size": `${Math.round(rightTopSize.camera)}px` }}
              role="tabpanel"
              aria-labelledby="monitor-tab-camera"
              hidden={rightMode !== "camera"}
            >
              <PtzPanel camera={activeCamera} onFeedback={showFeedback} onRecordingSaved={handleRecordingSaved} onBusyChange={handlePtzBusyChange} collapsed={collapsedModules.ptz} onToggleCollapse={() => toggleModuleCollapsed("ptz", "云台控制")} />
              <div
                className={`right-row-resizer ${collapsedModules.ptz || collapsedModules.playback ? "disabled" : ""} ${resizingLayout === "rows" ? "active" : ""}`}
                role={collapsedModules.ptz || collapsedModules.playback ? undefined : "separator"}
                aria-label={collapsedModules.ptz || collapsedModules.playback ? undefined : "调整云台控制与视频回放高度"}
                aria-orientation={collapsedModules.ptz || collapsedModules.playback ? undefined : "horizontal"}
                aria-valuemin={getRightRowBounds("camera").min}
                aria-valuemax={getRightRowBounds("camera").max}
                aria-valuenow={Math.round(rightTopSize.camera)}
                tabIndex={collapsedModules.ptz || collapsedModules.playback ? -1 : 0}
                title={collapsedModules.ptz || collapsedModules.playback ? undefined : "拖动调整上下模块高度；双击恢复默认"}
                onPointerDown={collapsedModules.ptz || collapsedModules.playback ? undefined : (event) => beginRightRowResize("camera", event)}
                onPointerMove={continueRightRowResize}
                onPointerUp={finishRightRowResize}
                onPointerCancel={finishRightRowResize}
                onLostPointerCapture={finishRightRowResize}
                onKeyDown={(event) => resizeRightRowsWithKeyboard("camera", event)}
                onDoubleClick={() => resetRightRows("camera")}
              />
              <PlaybackPanel camera={activeCamera} onFeedback={showFeedback} manualRecords={manualRecords} onDialogOpenChange={handlePlaybackDialogOpenChange} collapsed={collapsedModules.playback} onToggleCollapse={() => toggleModuleCollapsed("playback", "视频回放")} />
            </div>
          </aside>
      </div>
      <AlarmDialog alarm={detailAlarm} onClose={closeAlarmDialog} onUpdate={updateAlarm} onLocate={locateAlarm} onOpenCamera={openAlarmCamera} onOpenModule={openLinkedModule} />
      {feedback && <MonitorToast key={feedback.id} feedback={feedback} onClose={closeFeedback} />}
    </div>
  );
}
