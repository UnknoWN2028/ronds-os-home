import { useEffect, useMemo, useState } from "react";
import {
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconCalendar,
  IconChartDots,
  IconChartLine,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceCctv,
  IconFileExport,
  IconFilter,
  IconFilterOff,
  IconFlag,
  IconFolder,
  IconHelpCircle,
  IconInfoCircle,
  IconListDetails,
  IconMaximize,
  IconMicrophone,
  IconPaperclip,
  IconPhoto,
  IconPlayerPause,
  IconPlayerPlay,
  IconPointer,
  IconRefresh,
  IconScreenshot,
  IconSearch,
  IconSettings,
  IconStar,
  IconStarFilled,
  IconVideo,
  IconWaveSine,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import conveyorImage from "./assets/conveyor-belt.jpg";
import warehouseImage1 from "./assets/warehouse-camera-1.jpg";
import warehouseImage2 from "./assets/warehouse-camera-2.jpg";
import "./audio-video-analysis.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (value, size = 2) => String(value).padStart(size, "0");
const formatDateInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const today = new Date();
const defaultEndDate = formatDateInput(today);
const defaultStartDate = formatDateInput(new Date(today.getTime() - 14 * DAY_MS));

const metrics = [
  { id: "deviation", label: "皮带跑偏", group: "视觉算法", kind: "observation", yLabels: ["4级", "3级", "2级", "1级", "正常"], min: 0, max: 4 },
  { id: "alignment", label: "物料不对中", group: "视觉算法", kind: "observation", yLabels: ["物料不对中", "运行正常"], min: 0, max: 1 },
  { id: "helmet", label: "安全帽状态", group: "视觉算法", kind: "observation", yLabels: ["未带安全帽", "正常"], min: 0, max: 1 },
  { id: "decibel", label: "分贝指标", group: "音频算法", kind: "numeric", unit: "dB", yLabels: ["80", "60", "40", "20"], min: 20, max: 80 },
];

const baseSeries = {
  deviation: [1.8, 2.2, 1.2, 3.4, 1.2, 2.2, 1.2, 2.2, 1.2, 2.2, 3.4, 3.4, 3.4, 1.2, 1.2, 3.4],
  alignment: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  helmet: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  decibel: [42, 68, 45, 64, 66, 62, 58, 61, 63, 59, 67, 69, 65, 48, 76, 54],
};

const attachmentIndexes = [1, 3, 9, 14];
const alarmIndexes = [3, 14];

const contextActions = [
  [IconPointer, "关闭动态游标"],
  [IconFlag, "标注"],
  [IconChartLine, "游标"],
  [IconScreenshot, "截单个图形"],
  [IconMaximize, "截整个图形"],
  [IconSettings, "界面设置"],
  [IconAlertTriangle, "添加报警线"],
  [IconFilterOff, "设置误信号"],
  [IconFilter, "误信号筛选"],
  [IconWaveSine, "关联波形分析"],
  [IconFileExport, "导出图形"],
];

function sampleTime(index, endDate) {
  return `${endDate} ${pad(8 + Math.floor(index / 2))}:${index % 2 ? "26" : "00"}:18.${pad(111 + index * 37, 3)}`;
}

function displayValue(metric, value) {
  if (metric.id === "deviation") return value === 0 ? "正常" : `${Math.round(value)}级`;
  if (metric.id === "alignment") return value >= 1 ? "物料不对中" : "运行正常";
  if (metric.id === "helmet") return value >= 1 ? "未带安全帽" : "正常";
  return `${value.toFixed(1)} ${metric.unit}`;
}

function getAttachment(metricId, index) {
  if (!attachmentIndexes.includes(index)) return null;
  if (metricId === "decibel") return { type: "waveform", count: 1 };
  if (index === 9) return { type: "video", count: 2 };
  return { type: "image", count: 2 };
}

function getAlarmText(index) {
  if (index === 3) return { title: "故障描述", detail: "皮带跑偏量超过20cm，报警待处理" };
  if (index === 14) return { title: "报警处理结果", detail: "现场查验正常，已调整皮带张紧轮" };
  return null;
}

function ToolRail() {
  return (
    <div className="plot-tool-rail" aria-label="图表工具">
      <button className="active" aria-label="趋势游标"><IconChartLine size={18} /></button>
      <button aria-label="图表定位"><IconMaximize size={17} /></button>
    </div>
  );
}

function DiagnosticPlot({ metric, data, selectedSample, onSelectSample, collapsed, onCollapse, onOpenContextMenu, endDate, chartHeight = 178 }) {
  const width = 820;
  const height = chartHeight;
  const chartPad = { left: 70, right: 18, top: 20, bottom: 26 };
  const span = Math.max(1, metric.max - metric.min);
  const points = data.map((value, index) => ({
    x: chartPad.left + index * ((width - chartPad.left - chartPad.right) / (data.length - 1)),
    y: chartPad.top + ((metric.max - value) / span) * (height - chartPad.top - chartPad.bottom),
    value,
  }));
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  const selectedIndex = selectedSample.metricId === metric.id ? selectedSample.index : data.length - 1;
  const selectedPoint = points[selectedIndex];
  const selectedAlarm = getAlarmText(selectedIndex);
  const guide = points[Math.min(13, points.length - 1)];
  const headlineTime = sampleTime(selectedIndex, endDate);
  const headlineValue = displayValue(metric, selectedPoint.value);

  return (
    <section className={`diagnostic-plot ${collapsed ? "collapsed" : ""}`} onContextMenu={(event) => { event.preventDefault(); onOpenContextMenu(event, metric.id); }}>
      <header>
        <span>XX选煤厂 / XX / 新皮带机设备 / 输送区域 / 皮带本体 / 100m转弯处皮带状态</span>
        <b>{metric.label}</b>
        <span>{headlineTime}</span>
        <em>{headlineValue}</em>
        <button className="plot-collapse" onClick={onCollapse} aria-label={collapsed ? `展开${metric.label}` : `收缩${metric.label}`}><IconChevronDown size={15} /></button>
      </header>
      {!collapsed && (
        <div className="plot-body">
          <ToolRail />
          <div className="plot-canvas">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${metric.label}分析趋势`}>
              {metric.yLabels.map((label, index) => {
                const y = chartPad.top + index * ((height - chartPad.top - chartPad.bottom) / (metric.yLabels.length - 1));
                return <g key={label}><line className="plot-grid" x1={chartPad.left} y1={y} x2={width - chartPad.right} y2={y} /><text className="plot-y-label" x="7" y={y + 4}>{label}</text></g>;
              })}
              <line className="plot-guide" x1={guide.x} y1={chartPad.top} x2={guide.x} y2={height - chartPad.bottom} />
              <polyline className="plot-line" points={pointString} />
              {points.map((point, index) => {
                const hasAttachment = attachmentIndexes.includes(index);
                const hasAlarm = alarmIndexes.includes(index);
                const isSelected = selectedSample.metricId === metric.id && selectedSample.index === index;
                return (
                  <circle
                    key={index}
                    className={`plot-point ${hasAlarm ? "alarm" : hasAttachment ? "attached" : "empty"} ${isSelected ? "selected" : ""}`}
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 5.3 : 4.3}
                    onClick={() => onSelectSample({ metricId: metric.id, index })}
                  >
                    <title>{`${sampleTime(index, endDate)} · ${displayValue(metric, point.value)} · ${hasAttachment ? "有附件" : "无附件"}`}</title>
                  </circle>
                );
              })}
              <text className="plot-x-label" x={chartPad.left} y={height - 6}>{sampleTime(0, endDate).slice(5)}</text>
              <text className="plot-x-label" x={width * 0.39} y={height - 6}>{sampleTime(7, endDate).slice(5)}</text>
              <text className="plot-x-label" x={width * 0.73} y={height - 6}>{sampleTime(14, endDate).slice(5)}</text>
            </svg>
            {selectedSample.metricId === metric.id && (
              <div className="plot-tooltip" style={{ left: `${Math.min(70, (selectedPoint.x / width) * 100)}%`, top: `${Math.max(5, (selectedPoint.y / height) * 100 - 10)}%` }}>
                <b>{headlineTime}</b>
                <span>当前点位值：{headlineValue}</span>
                {selectedAlarm && <><strong>{selectedAlarm.title}</strong><span>{selectedAlarm.detail}</span></>}
              </div>
            )}
            <div className="plot-event-note">{sampleTime(13, endDate).slice(0, 19)}<br />报警依据：跑偏20cm</div>
          </div>
        </div>
      )}
    </section>
  );
}

function TreeLeaf({ children, selected, type = "video", onClick }) {
  return <button className={`analysis-tree-leaf ${selected ? "selected" : ""}`} onClick={onClick}><span className="tree-corner" />{type === "audio" ? <IconMicrophone size={14} /> : <IconDeviceCctv size={14} />}<span>{children}</span></button>;
}

function ResourceTree({ selected, onSelect, query }) {
  const searchItems = [["belt", "皮带状态", "video"], ["500a", "500m皮带纵撕状态", "video"], ["100", "100m转弯处皮带状态", "video"], ["500b", "500m转弯处皮带状态", "video"], ["line-test", "产线测试", "audio"], ["alarm", "880报警皮带机1", "audio"]];
  const term = query.trim().toLowerCase();
  if (term) {
    const matches = searchItems.filter(([, label]) => label.toLowerCase().includes(term));
    return <div className="source-tree source-search-results"><div className="source-search-heading">搜索结果（{matches.length}）</div>{matches.map(([id, label, type]) => <TreeLeaf key={id} type={type} selected={selected === id} onClick={() => onSelect(id)}>{label}</TreeLeaf>)}{!matches.length && <div className="source-search-empty">未找到匹配测点</div>}</div>;
  }
  return (
    <div className="source-tree">
      <details open><summary><IconFolder size={15} />廊道展示</summary><TreeLeaf type="audio">产线测试</TreeLeaf></details>
      <details open>
        <summary><IconFolder size={15} />新皮带机设备</summary>
        <details open className="level-two"><summary><IconFolder size={15} />机头区域</summary></details>
        <details open className="level-two"><summary><IconFolder size={15} />重锤/拉紧滚筒区域</summary></details>
        <details open className="level-two">
          <summary><IconFolder size={15} />输送区域</summary>
          <details open className="level-three"><summary><IconFolder size={15} />上托辊组</summary><TreeLeaf>上排托辊状态</TreeLeaf></details>
          <details className="level-three"><summary><IconFolder size={15} />下托辊组</summary></details>
          <details open className="level-three">
            <summary><IconFolder size={15} />皮带本体</summary>
            <TreeLeaf selected={selected === "belt"} onClick={() => onSelect("belt")}>皮带状态</TreeLeaf>
            <TreeLeaf selected={selected === "500a"} onClick={() => onSelect("500a")}>500m皮带纵撕状态</TreeLeaf>
            <TreeLeaf selected={selected === "100"} onClick={() => onSelect("100")}>100m转弯处皮带状态</TreeLeaf>
            <TreeLeaf selected={selected === "500b"} onClick={() => onSelect("500b")}>500m转弯处皮带状态</TreeLeaf>
          </details>
          <details className="level-three"><summary><IconFolder size={15} />翻转滚筒</summary></details>
          <details className="level-three"><summary><IconFolder size={15} />犁煤器</summary></details>
        </details>
        <details className="level-two"><summary><IconFolder size={15} />机尾</summary></details>
        <details className="level-two"><summary><IconFolder size={15} />LYS</summary></details>
        <TreeLeaf type="audio">880报警皮带机1</TreeLeaf>
      </details>
    </div>
  );
}

function AttachmentPane({ collapsed, onToggle, attachment, selectedSample, endDate }) {
  const [assetIndex, setAssetIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const images = [warehouseImage1, warehouseImage2];

  useEffect(() => { setAssetIndex(0); setPlaying(false); }, [selectedSample.metricId, selectedSample.index]);

  return (
    <aside className={`source-attachment-pane ${collapsed ? "collapsed" : ""}`}>
      <button className="attachment-toggle" onClick={onToggle} aria-label={collapsed ? "展开现场附件" : "收缩现场附件"}><IconPaperclip size={16} />{!collapsed && <span>现场附件</span>}{collapsed ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}</button>
      {!collapsed && (
        <div className="attachment-content">
          <header><strong>现场附件</strong><span>{sampleTime(selectedSample.index, endDate)}</span></header>
          {!attachment && <div className="attachment-empty"><IconPaperclip size={26} /><span>暂无附件</span></div>}
          {attachment?.type === "image" && <div className="attachment-viewer"><img src={images[assetIndex % images.length]} alt="现场关联图像" /><span className="attachment-kind"><IconPhoto size={14} />现场图像</span><button className="attachment-zoom" onClick={(event) => event.currentTarget.parentElement.querySelector("img")?.requestFullscreen?.()}><IconMaximize size={15} /></button></div>}
          {attachment?.type === "video" && <div className="attachment-viewer"><img src={conveyorImage} alt="现场关联视频画面" /><span className="attachment-kind"><IconVideo size={14} />现场视频</span><button className="attachment-play" onClick={() => setPlaying((value) => !value)}>{playing ? <IconPlayerPause size={21} /> : <IconPlayerPlay size={21} />}</button></div>}
          {attachment?.type === "waveform" && <div className="attachment-waveform"><IconWaveSine size={58} /><div className="waveform-bars">{[28, 52, 38, 74, 46, 83, 31, 62, 44, 72, 36, 58].map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}</div><button onClick={() => setPlaying((value) => !value)}>{playing ? <IconPlayerPause size={21} /> : <IconPlayerPlay size={21} />}</button><span>异音波形</span></div>}
          {attachment && attachment.count > 1 && <footer><button onClick={() => setAssetIndex((value) => (value - 1 + attachment.count) % attachment.count)}><IconChevronLeft size={16} /></button><span>{assetIndex + 1} / {attachment.count}</span><button onClick={() => setAssetIndex((value) => (value + 1) % attachment.count)}><IconChevronRight size={16} /></button></footer>}
        </div>
      )}
    </aside>
  );
}

function ContextMenu({ menu, onAction }) {
  if (!menu) return null;
  return <div className="analysis-context-menu" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>{contextActions.map(([Icon, label]) => <button key={label} onClick={() => onAction(label)}><Icon size={15} /><span>{label}</span></button>)}</div>;
}

function WaveformModal({ open, onClose }) {
  const [playing, setPlaying] = useState(false);
  if (!open) return null;
  return (
    <div className="waveform-modal-backdrop" onMouseDown={onClose}>
      <section className="waveform-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><IconWaveSine size={19} /><strong>关联波形分析</strong><span>2026-07-17 15:26:18.333</span></div><button onClick={onClose}><IconX size={18} /></button></header>
        <div className="waveform-modal-chart"><svg viewBox="0 0 760 240" preserveAspectRatio="none"><polyline points="0,122 20,115 40,130 60,92 80,150 100,118 120,70 140,166 160,111 180,126 200,46 220,181 240,101 260,132 280,62 300,158 320,107 340,124 360,90 380,144 400,116 420,41 440,186 460,102 480,135 500,75 520,156 540,109 560,128 580,84 600,149 620,113 640,55 660,173 680,104 700,138 720,91 740,128 760,116" /></svg><button onClick={() => setPlaying((value) => !value)}>{playing ? <IconPlayerPause size={24} /> : <IconPlayerPlay size={24} />}</button></div>
        <footer><span>采样率 44.1 kHz</span><span>时长 00:08.240</span><span>峰值 82.6 dB</span></footer>
      </section>
    </div>
  );
}

export function AudioVideoAnalysis() {
  const [selectedPoint, setSelectedPoint] = useState("100");
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [activeMetrics, setActiveMetrics] = useState(metrics.map((metric) => metric.id));
  const [run, setRun] = useState(0);
  const [toast, setToast] = useState("");
  const [toastError, setToastError] = useState(false);
  const [selectedSample, setSelectedSample] = useState({ metricId: "deviation", index: 3 });
  const [attachmentCollapsed, setAttachmentCollapsed] = useState(false);
  const [collapsedPlots, setCollapsedPlots] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [waveformOpen, setWaveformOpen] = useState(false);
  const [favoriteTool, setFavoriteTool] = useState(true);
  const [operationWidth, setOperationWidth] = useState(260);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const shiftedSeries = useMemo(() => Object.fromEntries(Object.entries(baseSeries).map(([key, values]) => [key, values.map((value, index) => Number((value + (run && index % 7 === 0 ? key === "decibel" ? 1 : 0.1 : 0)).toFixed(1)))])), [run]);
  const activeDefinitions = metrics.filter((metric) => activeMetrics.includes(metric.id));
  const expandedCount = activeDefinitions.filter((metric) => !collapsedPlots.includes(metric.id)).length;
  const selectedAttachment = getAttachment(selectedSample.metricId, selectedSample.index);
  const selectedMetric = metrics.find((metric) => metric.id === selectedSample.metricId) || activeDefinitions[0] || metrics[0];
  const operationRows = (shiftedSeries[selectedMetric.id] || []).map((value, index) => ({
    index,
    time: sampleTime(index, endDate),
    value: displayValue(selectedMetric, value),
    attachment: getAttachment(selectedMetric.id, index),
    alarm: alarmIndexes.includes(index),
  })).reverse().slice(0, 8);

  const flash = (message, isError = false) => {
    setToast(message); setToastError(isError);
    window.setTimeout(() => setToast(""), 2400);
  };

  const toggleMetric = (id) => setActiveMetrics((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const analyze = () => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    const days = Math.floor((end - start) / DAY_MS) + 1;
    if (!Number.isFinite(days) || days < 1) return flash("结束时间不能早于开始时间", true);
    if (days > 30) return flash("时间范围最大允许选择30天", true);
    if (!activeMetrics.length) return flash("请至少选择一个指标", true);
    setRun((value) => value + 1);
    flash(`查询完成，已加载${days}天趋势数据`);
  };

  const handleContextAction = (label) => {
    if (label === "关联波形分析") {
      if (selectedAttachment?.type === "waveform") setWaveformOpen(true);
      else flash("当前时刻无关联波形", true);
    } else flash(`${label}操作已执行`);
    setContextMenu(null);
  };

  const beginOperationResize = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = operationWidth;
    const move = (moveEvent) => setOperationWidth(Math.min(380, Math.max(224, startWidth + startX - moveEvent.clientX)));
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      document.body.classList.remove("analysis-resizing");
    };
    document.body.classList.add("analysis-resizing");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  return (
    <div className="analysis-page analysis-framework-layout" style={{ "--operation-width": `${operationWidth}px` }}>
      <aside className="analysis-resource-pane exact-tree-pane">
        <label className="source-tree-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名称/编码" /><IconSearch size={16} /><IconFilter size={15} /></label>
        <div className="source-tree-scroll"><ResourceTree selected={selectedPoint} onSelect={setSelectedPoint} query={query} /></div>
      </aside>

      <main className="analysis-main exact-analysis-main">
        <div className="source-tool-strip framework-tool-strip" aria-label="音视频分析工具">
          <span className="expert-tab">音视频分析</span>
          <div className="framework-tool-tabs">
            <button className="active" onClick={() => flash("当前已是音视频通用分析")}><IconDeviceCctv size={16} />音视频通用分析</button>
          </div>
          <button className={`favorite-tool ${favoriteTool ? "active" : ""}`} onClick={() => setFavoriteTool((value) => !value)} aria-label={favoriteTool ? "取消常用工具" : "设为常用工具"}>{favoriteTool ? <IconStarFilled size={16} /> : <IconStar size={16} />}常用</button>
          <button className="tool-help" onClick={() => flash("当前模块仅提供音视频分析能力")} aria-label="工具适配说明"><IconHelpCircle size={17} /></button>
        </div>
        <div className="chart-operation-strip">
          <span>音视频通用分析</span>
          <button title="单游标"><IconPointer size={15} />单游标</button>
          <button title="恢复缩放"><IconRefresh size={15} />恢复缩放</button>
          <button title="全屏"><IconMaximize size={15} /></button>
        </div>
        <div className="source-selected-path">XX选煤厂 / XX / 新皮带机设备 / 输送区域 / 皮带本体 / 100m转弯处皮带状态</div>
        <div className="source-analysis-body">
          <AttachmentPane collapsed={attachmentCollapsed} onToggle={() => setAttachmentCollapsed((value) => !value)} attachment={selectedAttachment} selectedSample={selectedSample} endDate={endDate} />
          <div className={`source-plots-scroll plots-expanded-${expandedCount}`}>
            {activeDefinitions.map((metric) => <DiagnosticPlot key={metric.id} metric={metric} data={shiftedSeries[metric.id]} selectedSample={selectedSample} onSelectSample={(sample) => { setSelectedSample(sample); setAttachmentCollapsed(false); }} collapsed={collapsedPlots.includes(metric.id)} onCollapse={() => setCollapsedPlots((current) => current.includes(metric.id) ? current.filter((item) => item !== metric.id) : [...current, metric.id])} onOpenContextMenu={(event) => setContextMenu({ x: Math.min(event.clientX, window.innerWidth - 190), y: Math.min(event.clientY, window.innerHeight - 390), metricId: metric.id })} endDate={endDate} chartHeight={expandedCount === 1 ? 600 : expandedCount === 2 ? 300 : 178} />)}
            {!activeMetrics.length && <div className="source-empty-metrics"><IconChartDots size={28} /><span>请选择至少一个分析指标</span></div>}
          </div>
        </div>
      </main>

      <aside className="analysis-operation-pane">
        <div className="operation-resize-handle" role="separator" aria-label="拖拽调整分析条件栏宽度" aria-orientation="vertical" aria-valuemin="224" aria-valuemax="380" aria-valuenow={operationWidth} onPointerDown={beginOperationResize} onDoubleClick={() => setOperationWidth(260)} title="拖拽调整宽度，双击恢复默认" />
        <header className="operation-pane-title"><div><IconAdjustmentsHorizontal size={17} /><strong>分析条件</strong></div><button onClick={() => flash("已恢复默认分析条件")} aria-label="分析条件帮助"><IconInfoCircle size={16} /></button></header>
        <div className="operation-pane-scroll">
          <section className="operation-section">
            <div className="operation-section-title"><span>查询范围</span><small>默认近15天，最多30天</small></div>
            <label className="operation-field"><span>开始日期</span><div className="operation-date"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><IconCalendar size={15} /></div></label>
            <label className="operation-field"><span>结束日期</span><div className="operation-date"><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /><IconCalendar size={15} /></div></label>
          </section>
          <section className="operation-section">
            <div className="operation-section-title"><span>节点选择</span></div>
            <div className="selected-node-card"><IconDeviceCctv size={17} /><div><strong>100m转弯处皮带状态</strong><span>音视频测点 · 已自动适配</span></div><IconChevronRight size={15} /></div>
          </section>
          <section className="operation-section metric-operation-section">
            <div className="operation-section-title"><span>指标选择</span><small>{activeMetrics.length}/{metrics.length}</small></div>
            <div className="operation-metric-groups">
              {["视觉算法", "音频算法"].map((group) => <div className="operation-metric-group" key={group}><strong>{group}</strong>{metrics.filter((metric) => metric.group === group).map((metric) => <label key={metric.id}><input type="checkbox" checked={activeMetrics.includes(metric.id)} onChange={() => toggleMetric(metric.id)} /><span>{metric.label}</span></label>)}</div>)}
            </div>
          </section>
          <section className="operation-section operation-data-section">
            <div className="operation-section-title"><span><IconListDetails size={14} />数据列表</span><small>最新8条</small></div>
            <div className="operation-data-table">
              <header><span>采样时间</span><span>值</span><span>状态</span></header>
              {operationRows.map((row) => <button key={row.index} className={selectedSample.index === row.index && selectedSample.metricId === selectedMetric.id ? "selected" : ""} onClick={() => { setSelectedSample({ metricId: selectedMetric.id, index: row.index }); setAttachmentCollapsed(false); }}><span>{row.time.slice(5, 19)}</span><span>{row.value}</span><i className={row.alarm ? "alarm" : row.attachment ? "attached" : "empty"} title={row.alarm ? "有报警" : row.attachment ? "有附件" : "无附件"} /></button>)}
            </div>
          </section>
        </div>
        <footer className="operation-actions"><button className="source-reset-button" onClick={() => { setStartDate(defaultStartDate); setEndDate(defaultEndDate); setActiveMetrics(metrics.map((metric) => metric.id)); setRun(0); }}><IconRefresh size={16} />重置</button><button className="source-analyze-button" onClick={analyze}><IconChartLine size={16} />确定</button></footer>
      </aside>
      <ContextMenu menu={contextMenu} onAction={handleContextAction} />
      <WaveformModal open={waveformOpen} onClose={() => setWaveformOpen(false)} />
      {toast && <div className={`analysis-toast ${toastError ? "error" : ""}`}><IconChartLine size={17} />{toast}</div>}
    </div>
  );
}
