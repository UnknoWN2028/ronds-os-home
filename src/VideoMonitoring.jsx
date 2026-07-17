import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAperture,
  IconAlertTriangle,
  IconArrowsMove,
  IconBellRinging,
  IconBulb,
  IconBuildingFactory2,
  IconCamera,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCirclePercentage,
  IconClock,
  IconColumns3,
  IconColumns,
  IconDeviceCctv,
  IconDotsVertical,
  IconDroplet,
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
import warehouseCamera1 from "./assets/warehouse-camera-1.jpg";
import warehouseCamera2 from "./assets/warehouse-camera-2.jpg";
import conveyorBelt from "./assets/conveyor-belt.jpg";
import "./video-monitoring.css";

const DEVICE_TREE = [
  {
    id: "root",
    label: "【FC】YS242LTHJ",
    type: "site",
    children: [
      {
        id: "lys",
        label: "【FC001】LYS",
        type: "factory",
        children: [
          { id: "08300831", label: "08300831", type: "camera", status: "offline", image: warehouseCamera2 },
        ],
      },
      {
        id: "alarm",
        label: "【FC003】alarmTest",
        type: "factory",
        children: [
          { id: "08300040", label: "08300040", type: "camera", status: "offline", image: conveyorBelt },
          { id: "bluetooth-a", label: "嵌入式测试蓝牙", type: "camera", status: "online", image: warehouseCamera1 },
        ],
      },
      {
        id: "wjz",
        label: "【FC005】wjz_test",
        type: "factory",
        children: [
          {
            id: "corridor",
            label: "【FC005006】测试廊道",
            type: "folder",
            children: [
              { id: "08300040-b", label: "08300040-备用", type: "camera", status: "offline", image: conveyorBelt },
            ],
          },
        ],
      },
      {
        id: "belt",
        label: "【FC020】LZX皮带机廊道测试",
        type: "factory",
        children: [
          {
            id: "corridor-1",
            label: "【FC020001】1号廊道",
            type: "folder",
            children: [
              { id: "bluetooth-b", label: "嵌入式测试蓝牙-2", type: "camera", status: "online", image: warehouseCamera1 },
              { id: "08300002", label: "08300002", type: "camera", status: "offline", image: conveyorBelt },
              { id: "08309999", label: "08309999", type: "camera", status: "offline", image: warehouseCamera2 },
              { id: "a-building", label: "A栋楼顶11111", type: "camera", status: "offline", image: warehouseCamera1 },
            ],
          },
          { id: "08300097", label: "08300097", type: "camera", status: "online", image: warehouseCamera1 },
          { id: "08300098", label: "08300098", type: "camera", status: "online", image: warehouseCamera2 },
          { id: "08307701", label: "08307701", type: "camera", status: "offline", image: conveyorBelt },
          { id: "embedded", label: "12嵌入式1111", type: "camera", status: "online", image: warehouseCamera2 },
        ],
      },
      { id: "third-party", label: "第三方摄像头-01", type: "camera", status: "third-party", image: warehouseCamera1 },
    ],
  },
];

const INITIAL_ALARMS = [
  { id: 1, title: "机头300米处-皮带状态监测", level: "2级", status: "pending", time: "2026-07-17 15:35:07", image: conveyorBelt, attachments: [{ type: "image", src: conveyorBelt }, { type: "image", src: warehouseCamera2 }] },
  { id: 2, title: "环境人员闯入", level: "1级", status: "pending", time: "2026-07-17 15:34:56", image: warehouseCamera1, attachments: [{ type: "video", src: warehouseCamera1 }] },
  { id: 3, title: "物料不对中", level: "2级", status: "pending", time: "2026-07-17 15:33:41", image: warehouseCamera2 },
  { id: 4, title: "重锤处-皮带状态监测告警", level: "3级", status: "pending", time: "2026-07-17 15:31:16", image: conveyorBelt },
  { id: 5, title: "XX廊道安全状态/火情识别", level: "4级", status: "closed", time: "2026-07-17 15:26:48", image: warehouseCamera1 },
  { id: 6, title: "皮带跑偏", level: "2级", status: "defect", time: "2026-07-17 15:22:08", image: warehouseCamera2 },
  { id: 7, title: "滚筒表面异常", level: "3级", status: "closed", time: "2026-07-17 15:18:25", image: conveyorBelt },
  { id: 8, title: "托辊异响", level: "2级", status: "defect", time: "2026-07-17 15:12:32", image: warehouseCamera1 },
];

const STATUS_COPY = {
  pending: "待处理",
  closed: "已关闭",
  defect: "已转缺陷",
};

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

function cameraIdsFor(node) {
  if (!node.children) return node.type === "camera" ? [node.id] : [];
  return node.children.flatMap(cameraIdsFor);
}

function branchMatches(node, query) {
  if (!query) return true;
  if (node.label.toLowerCase().includes(query)) return true;
  return node.children?.some((child) => branchMatches(child, query)) ?? false;
}

function PanelTitle({ children }) {
  return (
    <div className="monitor-panel-title">
      <IconChevronRight size={17} />
      <strong>{children}</strong>
    </div>
  );
}

function DeviceIcon({ item }) {
  if (item.type === "site") return <IconBuildingFactory2 size={18} />;
  if (item.type === "folder") return <IconFolder size={18} />;
  if (item.type === "factory") return <IconDeviceCctv size={18} />;
  return <IconCamera size={18} />;
}

function DevicePanel({ selected, onToggle }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set(BRANCH_IDS));
  const normalizedQuery = query.trim().toLowerCase();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const stats = useMemo(() => ({
    total: CAMERA_NODES.length,
    online: CAMERA_NODES.filter((item) => item.status === "online").length,
    offline: CAMERA_NODES.filter((item) => item.status === "offline").length,
    thirdParty: CAMERA_NODES.filter((item) => item.status === "third-party").length,
  }), []);

  const toggleExpanded = (id) => {
    setExpanded((items) => {
      const next = new Set(items);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNodes = (nodes, level = 0) => nodes
    .filter((node) => branchMatches(node, normalizedQuery))
    .map((node) => {
      const childIds = cameraIdsFor(node);
      const selectedCount = childIds.filter((id) => selectedSet.has(id)).length;
      const checked = childIds.length > 0 && selectedCount === childIds.length;
      const mixed = selectedCount > 0 && selectedCount < childIds.length;
      const isBranch = Boolean(node.children);
      const isExpanded = normalizedQuery ? true : expanded.has(node.id);
      const statusCopy = node.status === "online" ? "在线" : node.status === "offline" ? "离线" : "第三方";

      return (
        <div className="device-tree-group" key={node.id}>
          <div
            className="device-row"
            style={{ "--tree-level": level }}
            role="treeitem"
            aria-expanded={isBranch ? isExpanded : undefined}
            aria-checked={mixed ? "mixed" : checked}
          >
            {isBranch ? (
              <button className="tree-expand" onClick={() => toggleExpanded(node.id)} aria-label={`${isExpanded ? "收起" : "展开"}${node.label}`}>
                <IconChevronRight size={15} />
              </button>
            ) : <span className="tree-expand-placeholder" />}
            <button
              className={`device-check ${checked ? "checked" : ""} ${mixed ? "mixed" : ""}`}
              onClick={() => onToggle(childIds)}
              aria-label={`${checked ? "取消选择" : "选择"}${node.label}`}
            >
              {mixed ? "−" : checked ? "✓" : ""}
            </button>
            <span className={`device-type status-${node.status ?? "group"}`} title={node.status ? statusCopy : undefined}>
              <DeviceIcon item={node} />
            </span>
            <button className="device-label" onClick={() => isBranch ? toggleExpanded(node.id) : onToggle(childIds)} title={node.label}>
              {node.label}
            </button>
          </div>
          {isBranch && isExpanded && <div role="group">{renderNodes(node.children, level + 1)}</div>}
        </div>
      );
    });

  const hasMatches = DEVICE_TREE.some((node) => branchMatches(node, normalizedQuery));

  return (
    <section className="monitor-panel device-panel">
      <PanelTitle>监控设备</PanelTitle>
      <div className="device-stats">
        <span>总数：<b>{stats.total}</b></span>
        <span>在线：<b className="online">{stats.online}</b></span>
        <span>离线：<b className="offline">{stats.offline}</b></span>
        <span>第三方：<b>{stats.thirdParty}</b></span>
      </div>
      <label className="device-search">
        <IconSearch size={19} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="关键字搜索" />
      </label>
      <div className="device-tree" role="tree" aria-label="监控设备树">
        {hasMatches ? renderNodes(DEVICE_TREE) : <div className="device-empty">未找到匹配设备</div>}
      </div>
    </section>
  );
}

function VideoTile({ camera, active, onSelect }) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);

  if (!camera) return <div className="video-tile empty-tile"><span>等待选择设备</span></div>;

  const enterFullscreen = (event) => {
    event.stopPropagation();
    event.currentTarget.closest(".video-tile")?.requestFullscreen?.();
  };

  return (
    <article
      className={`video-tile has-image ${active ? "selected" : ""} ${paused ? "paused" : ""}`}
      onClick={() => onSelect(camera.id)}
      aria-label={`${camera.label}监控画面`}
    >
      <span className="camera-id">{camera.label}</span>
      <img src={camera.image} alt={`${camera.label} 监控画面`} />
      <span className="video-timestamp">2026-07-17 15:35:{String(camera.id.length * 3).padStart(2, "0")}</span>
      {camera.status === "offline" && <span className="stream-state">离线录像</span>}
      {paused && <div className="paused-cover"><IconPlayerPlay size={42} /><span>已暂停</span></div>}
      <div className="video-controls">
        <button onClick={(event) => { event.stopPropagation(); setPaused((value) => !value); }} aria-label={paused ? "播放" : "暂停"}>
          {paused ? <IconPlayerPlay size={19} /> : <IconPlayerPause size={19} />}
        </button>
        <span>{paused ? "0:00" : "直播"}</span>
        <span className="control-spacer" />
        <button onClick={(event) => { event.stopPropagation(); setMuted((value) => !value); }} aria-label={muted ? "取消静音" : "静音"}>
          {muted ? <IconVolumeOff size={19} /> : <IconVolume size={19} />}
        </button>
        <button onClick={enterFullscreen} aria-label="全屏"><IconMaximize size={18} /></button>
        <button onClick={(event) => { event.stopPropagation(); setMoreOpen((value) => !value); }} aria-label="更多操作" aria-expanded={moreOpen}>
          <IconDotsVertical size={18} />
        </button>
      </div>
      {moreOpen && (
        <div className="video-more-menu" onClick={(event) => event.stopPropagation()}>
          <button onClick={() => setMoreOpen(false)}>抓拍当前画面</button>
          <button onClick={() => { setPaused(false); setMoreOpen(false); }}>重新连接视频</button>
        </div>
      )}
    </article>
  );
}

function VideoWall({ devices, activeCameraId, onActiveCameraChange }) {
  const [playing, setPlaying] = useState(false);
  const [layout, setLayout] = useState("quad");
  const [page, setPage] = useState(1);
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [quality, setQuality] = useState("高清");
  const pageSize = layout === "single" ? 1 : layout === "nine" ? 9 : 4;
  const totalPages = Math.max(1, Math.ceil(devices.length / pageSize));
  const visibleDevices = devices.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage((value) => Math.min(value, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!devices.some((device) => device.id === activeCameraId)) onActiveCameraChange(devices[0]?.id ?? null, false);
  }, [devices, activeCameraId, onActiveCameraChange]);

  useEffect(() => {
    if (!playing || totalPages < 2) return undefined;
    const timer = window.setInterval(() => setPage((value) => value >= totalPages ? 1 : value + 1), Math.max(1, intervalSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [playing, totalPages, intervalSeconds]);

  const changeLayout = (nextLayout) => {
    setLayout(nextLayout);
    setPage(1);
  };

  const maximizeWall = (event) => {
    event.currentTarget.closest(".video-wall-wrap")?.requestFullscreen?.();
  };

  return (
    <section className="video-wall-wrap">
      <div className={`video-wall ${layout}`}>
        {Array.from({ length: pageSize }, (_, index) => (
          <VideoTile
            key={visibleDevices[index]?.id ?? `empty-${index}`}
            camera={visibleDevices[index]}
            active={visibleDevices[index]?.id === activeCameraId}
            onSelect={(id) => onActiveCameraChange(id, true)}
          />
        ))}
      </div>
      <div className="video-toolbar">
        <button className="toolbar-icon-button" onClick={maximizeWall} aria-label="最大化实时视频" title="最大化实时视频"><IconMaximize size={20} /></button>
        <button className="quality-button" onClick={() => setQuality((value) => value === "高清" ? "流畅" : "高清")} aria-label="切换视频流畅度">{quality}</button>
        <span className="toolbar-divider" />
        <span className="interval-label">轮播间隔:</span>
        <input type="number" min="1" max="60" value={intervalSeconds} onChange={(event) => setIntervalSeconds(Number(event.target.value) || 1)} aria-label="轮播间隔秒数" />
        <span className="interval-unit">秒</span>
        <button className="start-button" onClick={() => setPlaying((value) => !value)} disabled={totalPages < 2}>
          {playing ? <IconPlayerPause size={17} /> : <IconPlayerPlay size={17} />}
          {playing ? "暂停" : "开始"}
        </button>
        <span className="selected-count">共{devices.length}项</span>
        <div className="pagination" aria-label="视频分页">
          <button onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="上一页" disabled={page === 1}><IconChevronLeft size={18} /></button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
            <button key={item} className={page === item ? "current" : ""} onClick={() => setPage(item)} aria-current={page === item ? "page" : undefined}>{item}</button>
          ))}
          <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="下一页" disabled={page === totalPages}><IconChevronRight size={18} /></button>
        </div>
        <div className="layout-controls" aria-label="分屏切换">
          <button className={layout === "single" ? "active" : ""} onClick={() => changeLayout("single")} aria-label="单画面"><IconSquare size={21} /></button>
          <button className={layout === "quad" ? "active" : ""} onClick={() => changeLayout("quad")} aria-label="四画面"><IconLayoutGrid size={21} /></button>
          <button className={layout === "nine" ? "active" : ""} onClick={() => changeLayout("nine")} aria-label="九画面"><IconColumns3 size={21} /></button>
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

function SummaryPanel({ alarms, onFilter }) {
  const metrics = alarmMetrics(alarms);
  return (
    <section className="monitor-panel summary-panel">
      <PanelTitle>今日监控报警看护</PanelTitle>
      <div className="summary-content">
        <button className="completion-ring" onClick={() => onFilter("all")} aria-label={`处理完成率${metrics.completion}%`}>
          <IconCirclePercentage size={94} stroke={1.4} />
          <strong>{metrics.completion}%</strong>
          <span>处理完成率</span>
        </button>
        <div className="summary-grid">
          <button onClick={() => onFilter("all")}><b>今日新增</b><span><em>{metrics.added}</em> 条</span><IconBellRinging size={27} /></button>
          <button onClick={() => onFilter("processed")}><b>今日处理</b><span><em>{metrics.processed}</em> 条</span><IconBellRinging size={27} /></button>
          <button onClick={() => onFilter("defect")}><b>今日转缺陷</b><span><em>{metrics.defects}</em> 条</span><IconAlertTriangle size={27} /></button>
          <button onClick={() => onFilter("pending")}><b>待处理报警</b><span><em>{metrics.pending}</em> 条</span><IconBellRinging size={27} /></button>
        </div>
      </div>
    </section>
  );
}

function AlarmPanel({ alarms, filter, onFilter, onSelect }) {
  const listRef = useRef(null);
  const scrollPausedRef = useRef(false);
  const pendingCount = alarms.filter((alarm) => alarm.status === "pending").length;
  const visibleAlarms = useMemo(() => {
    const filtered = filter === "pending" ? alarms.filter((alarm) => alarm.status === "pending")
      : filter === "processed" ? alarms.filter((alarm) => alarm.status !== "pending")
        : filter === "defect" ? alarms.filter((alarm) => alarm.status === "defect") : alarms;
    return [...filtered].sort((a, b) => {
      if ((a.status === "pending") !== (b.status === "pending")) return a.status === "pending" ? -1 : 1;
      return b.time.localeCompare(a.time);
    });
  }, [alarms, filter]);

  const scrollOne = (direction = 1) => {
    const list = listRef.current;
    const firstCard = list?.querySelector(".alarm-card");
    if (!list || !firstCard) return;
    const step = firstCard.offsetHeight + 10;
    const maxScroll = Math.max(0, list.scrollHeight - list.clientHeight);
    let nextTop = list.scrollTop + step * direction;
    if (direction > 0 && nextTop >= maxScroll - 2) nextTop = 0;
    if (direction < 0 && nextTop < 0) nextTop = maxScroll;
    const startTop = list.scrollTop;
    list.scrollTo({ top: nextTop, behavior: "smooth" });
    window.setTimeout(() => {
      if (Math.abs(list.scrollTop - startTop) < 1 && nextTop !== startTop) {
        list.style.scrollBehavior = "auto";
        list.scrollTop = nextTop;
        list.style.removeProperty("scroll-behavior");
      }
    }, 450);
  };

  useEffect(() => {
    if (visibleAlarms.length < 5) return undefined;
    const timer = window.setInterval(() => {
      if (!scrollPausedRef.current) {
        scrollOne(1);
      }
    }, 2600);
    return () => window.clearInterval(timer);
  }, [visibleAlarms.length]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [filter]);

  return (
    <section className="monitor-panel alarm-panel">
      <PanelTitle>最近监控报警</PanelTitle>
      <div className="alarm-filter">
        <span>{filter === "processed" ? "今日处理" : filter === "defect" ? "已转缺陷" : "报警列表"}</span>
        <button className={filter === "pending" ? "active" : ""} onClick={() => onFilter("pending")}>待处理 {pendingCount}</button>
        <button className={filter === "all" ? "active" : ""} onClick={() => onFilter("all")}>全部 {alarms.length}</button>
      </div>
      <div
        className="alarm-list"
        ref={listRef}
        onMouseEnter={() => { scrollPausedRef.current = true; }}
        onMouseLeave={() => { scrollPausedRef.current = false; }}
        onWheel={(event) => {
          event.preventDefault();
          scrollOne(event.deltaY >= 0 ? 1 : -1);
        }}
        aria-label="最近监控报警，悬停暂停轮播"
      >
        {visibleAlarms.map((alarm) => (
          <button className="alarm-card" key={alarm.id} onClick={() => onSelect(alarm)}>
            <img src={alarm.image} alt={`${alarm.title}报警画面缩略图`} />
            <span className="alarm-copy">
              <span className="alarm-heading">
                <strong>{alarm.title}</strong>
                <i>{alarm.level}</i>
                <em className={`status-${alarm.status}`}>{STATUS_COPY[alarm.status]}</em>
              </span>
              <span><IconMapPin size={15} />YS242LTHJ/LZX皮带机廊道测试/1号廊道</span>
              <span><IconClock size={15} />{alarm.time}</span>
            </span>
          </button>
        ))}
        {!visibleAlarms.length && <div className="alarm-empty">暂无符合条件的报警</div>}
      </div>
    </section>
  );
}

function PtzPanel({ camera }) {
  const [recording, setRecording] = useState(false);
  const [values, setValues] = useState({ zoom: 0, focus: 0, aperture: 0 });
  const [message, setMessage] = useState("等待控制指令");
  const unsupported = !camera || camera.status === "third-party";
  const unavailable = !camera || camera.status === "offline";
  const disabled = unsupported || unavailable;
  const disabledReason = unsupported ? "当前物设备不支持该功能" : unavailable ? "当前设备离线" : undefined;

  const runAction = (action) => {
    if (!disabled) setMessage(`${action}指令已发送`);
  };

  const adjust = (key, amount) => {
    if (disabled) return;
    setValues((items) => ({ ...items, [key]: Math.max(-5, Math.min(5, items[key] + amount)) }));
    setMessage(`${key === "zoom" ? "调焦" : key === "focus" ? "聚焦" : "光圈"}已调整`);
  };

  return (
    <section className="monitor-panel ptz-panel">
      <PanelTitle>云台控制 · {camera?.label ?? "未选择设备"}</PanelTitle>
      <div className="ptz-content">
        <div className="ptz-direction" aria-label="云台方向控制">
          <button className="up" disabled={disabled} title={disabledReason} onClick={() => runAction("向上")} aria-label="云台向上"><IconChevronDown size={20} /></button>
          <button className="left" disabled={disabled} title={disabledReason} onClick={() => runAction("向左")} aria-label="云台向左"><IconChevronLeft size={20} /></button>
          <span><IconArrowsMove size={24} /></span>
          <button className="right" disabled={disabled} title={disabledReason} onClick={() => runAction("向右")} aria-label="云台向右"><IconChevronRight size={20} /></button>
          <button className="down" disabled={disabled} title={disabledReason} onClick={() => runAction("向下")} aria-label="云台向下"><IconChevronDown size={20} /></button>
        </div>
        <div className="ptz-adjustments">
          {[
            ["zoom", "调焦", IconFocus2],
            ["focus", "聚焦", IconFocus2],
            ["aperture", "光圈", IconAperture],
          ].map(([key, label, ControlIcon]) => (
            <div className="ptz-adjust" key={key}>
              <span><ControlIcon size={17} />{label}</span>
              <button disabled={disabled} title={disabledReason} onClick={() => adjust(key, -1)} aria-label={`${label}减`}>−</button>
              <output>{values[key]}</output>
              <button disabled={disabled} title={disabledReason} onClick={() => adjust(key, 1)} aria-label={`${label}加`}>+</button>
            </div>
          ))}
        </div>
        <div className="ptz-actions">
          <button disabled={disabled} title={disabledReason} onClick={() => runAction("对讲")}><IconMessageCircle size={17} />对讲</button>
          <button disabled={disabled} title={disabledReason} onClick={() => runAction("补光灯")}><IconBulb size={17} />补光灯</button>
          <button disabled={disabled} title={disabledReason} onClick={() => runAction("雨刷")}><IconDroplet size={17} />雨刷</button>
          <button disabled={disabled} title={disabledReason} onClick={() => { setRecording((value) => !value); setMessage(recording ? "录像已停止" : "录像已开始"); }}>
            <IconVideo size={17} />{recording ? "停止录制" : "开始录制"}
          </button>
          <button disabled={disabled} title={disabledReason} onClick={() => runAction("重启")}><IconRefresh size={17} />重启</button>
        </div>
        <p className="ptz-message" role="status">{disabledReason ?? message}</p>
      </div>
    </section>
  );
}

function playbackRecords(camera) {
  if (!camera) return [];
  return Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    name: `${camera.label}-录像-${String(index + 1).padStart(2, "0")}`,
    start: `2026-07-17 ${String(15 - Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}:00`,
    duration: 120 + index * 35,
    mode: index % 3 === 0 ? "手动录制" : "自动录制",
  }));
}

function PlaybackPanel({ camera }) {
  const [source, setSource] = useState("upper");
  const [sortKey, setSortKey] = useState("start");
  const [ascending, setAscending] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modeFilter, setModeFilter] = useState("all");
  const [showDuration, setShowDuration] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const dualSource = camera?.status !== "third-party";
  const records = useMemo(() => playbackRecords(camera), [camera]);
  const filteredRecords = records.filter((record) => modeFilter === "all" || record.mode === modeFilter);
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const comparison = sortKey === "duration" ? a.duration - b.duration : a.start.localeCompare(b.start);
    return ascending ? comparison : -comparison;
  });
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const visibleRecords = sortedRecords.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [camera?.id, source, modeFilter]);

  const changeSort = (key) => {
    if (sortKey === key) setAscending((value) => !value);
    else {
      setSortKey(key);
      setAscending(false);
    }
  };

  return (
    <section className="monitor-panel playback-panel">
      <PanelTitle>视频回放</PanelTitle>
      <div className="playback-toolbar">
        {dualSource && (
          <div className="playback-tabs" role="tablist" aria-label="视频来源">
            <button className={source === "upper" ? "active" : ""} onClick={() => setSource("upper")} role="tab" aria-selected={source === "upper"}>上位机</button>
            <button className={source === "lower" ? "active" : ""} onClick={() => setSource("lower")} role="tab" aria-selected={source === "lower"}>下位机</button>
          </div>
        )}
        <span className="playback-camera">{camera?.label ?? "未选择设备"}</span>
        {source === "upper" && <button className="playback-tool" onClick={() => setFilterOpen((value) => !value)} aria-expanded={filterOpen}><IconFilter size={16} />筛选</button>}
        {source === "upper" && <button className={`playback-tool ${showDuration ? "active" : ""}`} onClick={() => setShowDuration((value) => !value)}><IconColumns size={16} />列设置</button>}
      </div>
      {filterOpen && source === "upper" && (
        <div className="playback-filter">
          <label>录制方式
            <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)}>
              <option value="all">全部</option>
              <option value="自动录制">自动录制</option>
              <option value="手动录制">手动录制</option>
            </select>
          </label>
        </div>
      )}
      <div className="playback-table-wrap">
        <table className="playback-table">
          <thead><tr>
            <th>序号</th>
            <th>名称</th>
            {source === "upper" && <th><button onClick={() => changeSort("start")}>开始时间 {sortKey === "start" ? ascending ? "↑" : "↓" : ""}</button></th>}
            {source === "upper" && showDuration && <th><button onClick={() => changeSort("duration")}>时长 {sortKey === "duration" ? ascending ? "↑" : "↓" : ""}</button></th>}
            {source === "upper" && <th>录制方式</th>}
            <th>操作</th>
          </tr></thead>
          <tbody>
            {visibleRecords.map((record) => <tr key={`${source}-${record.id}`}>
              <td>{record.id}</td>
              <td title={record.name}>{record.name}</td>
              {source === "upper" && <td>{record.start}</td>}
              {source === "upper" && showDuration && <td>{Math.floor(record.duration / 60)}分{record.duration % 60}秒</td>}
              {source === "upper" && <td>{record.mode}</td>}
              <td><button aria-label={`播放${record.name}`}><IconPlayerPlay size={15} /></button></td>
            </tr>)}
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
  );
}

function AlarmDialog({ alarm, onClose, onUpdate }) {
  const [attachmentIndex, setAttachmentIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  useEffect(() => {
    setAttachmentIndex(0);
    setVideoPlaying(false);
  }, [alarm?.id]);
  if (!alarm) return null;
  const attachments = alarm.attachments ?? [{ type: "image", src: alarm.image }];
  const attachment = attachments[attachmentIndex];
  return (
    <div className="monitor-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="monitor-dialog" role="dialog" aria-modal="true" aria-labelledby="alarm-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><strong id="alarm-dialog-title">报警事件详情</strong><span>#{alarm.id}</span></div>
          <button onClick={onClose} aria-label="关闭报警详情"><IconX size={20} /></button>
        </header>
        <div className="alarm-attachment-viewer">
          <img src={attachment.src} alt={`${alarm.title}${attachment.type === "video" ? "视频" : "图片"}附件`} />
          {attachment.type === "video" && (
            <button className="attachment-play" onClick={() => setVideoPlaying((value) => !value)} aria-label={videoPlaying ? "暂停视频附件" : "播放视频附件"}>
              {videoPlaying ? <IconPlayerPause size={36} /> : <IconPlayerPlay size={36} />}
              <span>{videoPlaying ? "正在播放模拟视频" : "播放视频附件"}</span>
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
          <div><dt>故障类型</dt><dd>{alarm.title}</dd></div>
          <div><dt>报警等级</dt><dd>{alarm.level}</dd></div>
          <div><dt>处理状态</dt><dd>{STATUS_COPY[alarm.status]}</dd></div>
          <div><dt>报警时间</dt><dd>{alarm.time}</dd></div>
          <div><dt>报警设备</dt><dd>YS242LTHJ / LZX皮带机廊道测试 / 1号廊道</dd></div>
        </dl>
        <footer>
          <button className="secondary" onClick={onClose}>定位到报警列表</button>
          <button className="secondary" onClick={onClose}>取消</button>
          <button onClick={() => onUpdate(alarm.id, "defect")}>转为缺陷</button>
          <button onClick={() => onUpdate(alarm.id, "closed")}>关闭报警</button>
        </footer>
      </section>
    </div>
  );
}

export function VideoMonitoring({ embedded = false }) {
  const [selected, setSelected] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("ronds-monitor-devices") ?? "null");
      if (Array.isArray(saved)) return saved.filter((id) => CAMERA_MAP.has(id));
    } catch {
      // Ignore invalid stored data and use the default selection.
    }
    return CAMERA_NODES.map((item) => item.id);
  });
  const [alarms, setAlarms] = useState(INITIAL_ALARMS);
  const [alarmFilter, setAlarmFilter] = useState("pending");
  const [detailAlarmId, setDetailAlarmId] = useState(null);
  const [activeCameraId, setActiveCameraId] = useState(CAMERA_NODES[0]?.id ?? null);
  const [rightColumnOpen, setRightColumnOpen] = useState(() => {
    const saved = window.localStorage.getItem("ronds-monitor-right-open");
    if (saved !== null) return saved === "true";
    return window.innerWidth >= 1600;
  });
  const [rightMode, setRightMode] = useState("alarms");
  const selectedDevices = selected.map((id) => CAMERA_MAP.get(id)).filter(Boolean);
  const activeCamera = CAMERA_MAP.get(activeCameraId) ?? selectedDevices[0] ?? null;
  const detailAlarm = alarms.find((alarm) => alarm.id === detailAlarmId) ?? null;

  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-devices", JSON.stringify(selected));
  }, [selected]);

  useEffect(() => {
    window.localStorage.setItem("ronds-monitor-right-open", String(rightColumnOpen));
  }, [rightColumnOpen]);

  const toggleDevices = (ids) => {
    setSelected((items) => {
      const selectedSet = new Set(items);
      const shouldRemove = ids.every((id) => selectedSet.has(id));
      if (shouldRemove) return items.filter((id) => !ids.includes(id));
      return [...items, ...ids.filter((id) => !selectedSet.has(id))];
    });
  };

  const updateAlarm = (id, status) => {
    setAlarms((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    setDetailAlarmId(null);
  };

  const openRightColumn = () => {
    setRightColumnOpen(true);
  };

  const toggleRightColumn = () => {
    if (rightColumnOpen) {
      setRightColumnOpen(false);
    } else {
      openRightColumn();
    }
  };

  const selectCamera = (id, openControls = true) => {
    setActiveCameraId(id);
    if (openControls && id) {
      setRightMode("camera");
      openRightColumn();
    }
  };

  return (
    <div className={`monitor-page ${embedded ? "embedded" : ""}`}>
      {!embedded && (
        <header className="monitor-tabs">
          <a className="monitor-tab" href="/">集团驾驶舱 <IconX size={15} /></a>
          <span className="monitor-tab active">智慧视频监控 <IconX size={15} /></span>
          <button className="monitor-top-collapse" aria-label="收起顶部"><IconChevronDown size={20} /></button>
        </header>
      )}
      <div className={`monitor-layout ${rightColumnOpen ? "" : "right-collapsed"}`}>
        <DevicePanel selected={selected} onToggle={toggleDevices} />
        <VideoWall devices={selectedDevices} activeCameraId={activeCameraId} onActiveCameraChange={selectCamera} />
        <button
          className="right-column-toggle"
          onClick={toggleRightColumn}
          aria-label={rightColumnOpen ? "收起右侧栏" : "展开右侧栏"}
          title={rightColumnOpen ? "收起右侧栏" : "展开右侧栏"}
        >
          {rightColumnOpen ? <IconChevronRight size={19} /> : <IconChevronLeft size={19} />}
        </button>
        {rightColumnOpen && (
          <aside className={`monitor-right mode-${rightMode}`}>
            <div className="right-mode-tabs" role="tablist" aria-label="右侧功能">
              <button className={rightMode === "alarms" ? "active" : ""} onClick={() => setRightMode("alarms")} role="tab" aria-selected={rightMode === "alarms"}>报警看护</button>
              <button className={rightMode === "camera" ? "active" : ""} onClick={() => setRightMode("camera")} role="tab" aria-selected={rightMode === "camera"}>云台与回放</button>
            </div>
            {rightMode === "alarms" ? (
              <>
                <SummaryPanel alarms={alarms} onFilter={setAlarmFilter} />
                <AlarmPanel alarms={alarms} filter={alarmFilter} onFilter={setAlarmFilter} onSelect={(alarm) => setDetailAlarmId(alarm.id)} />
              </>
            ) : (
              <>
                <PtzPanel camera={activeCamera} />
                <PlaybackPanel camera={activeCamera} />
              </>
            )}
          </aside>
        )}
      </div>
      <AlarmDialog alarm={detailAlarm} onClose={() => setDetailAlarmId(null)} onUpdate={updateAlarm} />
    </div>
  );
}
