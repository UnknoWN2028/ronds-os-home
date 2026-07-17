import { useMemo, useState } from "react";
import {
  IconActivityHeartbeat,
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconCalendar,
  IconChartDots,
  IconChartHistogram,
  IconChartLine,
  IconChevronDown,
  IconChevronRight,
  IconDeviceCctv,
  IconFilter,
  IconFolder,
  IconMaximize,
  IconMicrophone,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconSearch,
  IconSparkles,
  IconVolume,
  IconWaveSine,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import conveyorImage from "./assets/conveyor-belt.jpg";
import "./audio-video-analysis.css";

const resources = [
  { id: "belt-head", group: "输送区域", name: "1#皮带机头", code: "AV-01", online: true },
  { id: "belt-middle", group: "输送区域", name: "1#皮带中段", code: "AV-02", online: true },
  { id: "belt-tail", group: "输送区域", name: "1#皮带机尾", code: "AV-03", online: true },
  { id: "crusher", group: "破碎车间", name: "破碎机入口", code: "AV-06", online: true },
  { id: "warehouse", group: "仓储区域", name: "原料仓东侧", code: "AV-09", online: false },
];

const metricOptions = ["声压级", "异响概率", "画面清晰度", "皮带跑偏"];
const modes = [
  { id: "joint", label: "联合分析", icon: IconSparkles },
  { id: "video", label: "视频分析", icon: IconDeviceCctv },
  { id: "audio", label: "音频分析", icon: IconMicrophone },
];

const baseSeries = {
  sound: [67, 66, 68, 69, 72, 71, 70, 73, 78, 74, 72, 73, 75, 76, 82, 77, 74, 73],
  anomaly: [8, 7, 9, 11, 10, 12, 15, 13, 19, 17, 14, 16, 18, 20, 36, 22, 17, 15],
  clarity: [96, 96, 95, 95, 94, 94, 95, 94, 92, 93, 94, 93, 92, 91, 88, 91, 92, 93],
  offset: [2.1, 2.4, 2.3, 2.6, 2.8, 2.5, 2.9, 3.1, 3.5, 3.2, 3, 3.4, 3.8, 4.1, 6.8, 4.9, 3.7, 3.1],
};

function TrendChart({ title, subtitle, value, unit, data, color = "#3578f6", alertIndex = 14, min, max }) {
  const width = 760;
  const height = 150;
  const padding = { left: 46, right: 18, top: 17, bottom: 28 };
  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const range = Math.max(1, hi - lo);
  const points = data.map((item, index) => ({
    x: padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right),
    y: padding.top + ((hi - item) / range) * (height - padding.top - padding.bottom),
    value: item,
  }));
  const alertPoint = points[alertIndex];
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <article className="analysis-trend-card">
      <header>
        <div><strong>{title}</strong><span>{subtitle}</span></div>
        <div className="trend-current"><b>{value}</b><span>{unit}</span></div>
      </header>
      <div className="trend-chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}趋势图`} preserveAspectRatio="none">
          {[0, 1, 2, 3].map((line) => {
            const y = padding.top + (line / 3) * (height - padding.top - padding.bottom);
            const label = (hi - (line / 3) * range).toFixed(unit === "%" ? 0 : 1);
            return <g key={line}><line className="chart-grid-line" x1={padding.left} y1={y} x2={width - padding.right} y2={y} /><text className="chart-axis-label" x="3" y={y + 4}>{label}</text></g>;
          })}
          <line className="chart-alert-guide" x1={alertPoint.x} y1={padding.top} x2={alertPoint.x} y2={height - padding.bottom} />
          <polyline className="chart-series" points={polyline} style={{ stroke: color }} />
          {points.map((point, index) => (
            <circle key={index} className={index === alertIndex ? "chart-dot alert" : "chart-dot"} cx={point.x} cy={point.y} r={index === alertIndex ? 4.4 : 3.3} style={{ fill: index === alertIndex ? "#f04e4e" : color }}>
              <title>{`01-${String(index + 1).padStart(2, "0")} 12:00 · ${point.value}${unit}`}</title>
            </circle>
          ))}
          <text className="chart-time-label" x={padding.left} y={height - 7}>07-17 08:00</text>
          <text className="chart-time-label" x={width / 2 - 32} y={height - 7}>07-17 12:00</text>
          <text className="chart-time-label" x={width - 90} y={height - 7}>07-17 16:00</text>
        </svg>
        <div className="trend-alert-note" style={{ left: `${Math.min(74, (alertPoint.x / width) * 100)}%` }}><b>15:12 异常</b><span>已关联视频片段</span></div>
      </div>
    </article>
  );
}

function ResourceTree({ selected, onSelect, query }) {
  const visible = resources.filter((item) => `${item.name}${item.code}${item.group}`.toLowerCase().includes(query.toLowerCase()));
  const groups = [...new Set(visible.map((item) => item.group))];

  return (
    <div className="analysis-tree" aria-label="音视频测点列表">
      <div className="tree-root"><IconFolder size={17} /><strong>新皮带机设备</strong><span>{visible.length}</span></div>
      {groups.map((group) => (
        <div className="tree-group" key={group}>
          <div className="tree-group-label"><IconChevronDown size={15} /><IconFolder size={16} /><span>{group}</span></div>
          {visible.filter((item) => item.group === group).map((item) => (
            <button className={`tree-resource ${selected === item.id ? "selected" : ""}`} key={item.id} onClick={() => onSelect(item.id)}>
              <IconChevronRight size={14} />
              <span className={`resource-state ${item.online ? "online" : "offline"}`} />
              <IconDeviceCctv size={16} />
              <span><b>{item.name}</b><small>{item.code}</small></span>
            </button>
          ))}
        </div>
      ))}
      {!visible.length && <div className="tree-empty">未找到匹配测点</div>}
    </div>
  );
}

export function AudioVideoAnalysis() {
  const [selected, setSelected] = useState("belt-head");
  const [mode, setMode] = useState("joint");
  const [query, setQuery] = useState("");
  const [metrics, setMetrics] = useState(metricOptions);
  const [playing, setPlaying] = useState(true);
  const [resourceOpen, setResourceOpen] = useState(false);
  const [runId, setRunId] = useState(0);
  const [notice, setNotice] = useState("");
  const resource = resources.find((item) => item.id === selected) ?? resources[0];
  const series = useMemo(() => {
    const shift = (resources.findIndex((item) => item.id === selected) + runId) % 3;
    return Object.fromEntries(Object.entries(baseSeries).map(([key, values]) => [key, values.map((value, index) => Number((value + ((index + shift) % 4 === 0 ? shift * 0.6 : 0)).toFixed(1)))]));
  }, [selected, runId]);

  const toggleMetric = (metric) => setMetrics((current) => current.includes(metric) ? current.filter((item) => item !== metric) : [...current, metric]);
  const runAnalysis = () => {
    setRunId((value) => value + 1);
    setNotice("分析已更新，发现 1 个音视频关联异常");
    window.setTimeout(() => setNotice(""), 2400);
  };

  return (
    <div className="analysis-page">
      <aside className={`analysis-resource-pane ${resourceOpen ? "mobile-open" : ""}`}>
        <header><div><strong>测点资源</strong><span>5 个音视频测点</span></div><button className="resource-close" onClick={() => setResourceOpen(false)} aria-label="关闭测点列表"><IconX size={18} /></button></header>
        <label className="analysis-search"><IconSearch size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名称 / 编码" /><IconFilter size={16} /></label>
        <ResourceTree selected={selected} query={query} onSelect={(id) => { setSelected(id); setResourceOpen(false); }} />
        <footer><span className="resource-state online" />4 在线 <span className="resource-state offline" />1 离线</footer>
      </aside>

      {resourceOpen && <button className="analysis-resource-scrim" aria-label="关闭测点列表" onClick={() => setResourceOpen(false)} />}

      <main className="analysis-main">
        <header className="analysis-tool-strip">
          <button className="resource-trigger" onClick={() => setResourceOpen(true)}><IconFilter size={17} />选择测点</button>
          <strong>专家诊断</strong>
          <div className="analysis-mode-tabs" role="tablist" aria-label="分析模式">
            {modes.map((item) => {
              const ModeIcon = item.icon;
              return <button key={item.id} className={mode === item.id ? "active" : ""} onClick={() => setMode(item.id)} role="tab" aria-selected={mode === item.id}><ModeIcon size={17} />{item.label}</button>;
            })}
          </div>
          <span className="precision-badge"><IconActivityHeartbeat size={16} />精密分析</span>
        </header>

        <section className="analysis-filter-bar">
          <label><span>时间选择</span><div className="date-range"><IconCalendar size={17} /><input type="date" defaultValue="2026-07-10" /><i>—</i><input type="date" defaultValue="2026-07-17" /></div></label>
          <div className="metric-filter"><span>指标选择</span><div>{metricOptions.map((metric) => <button key={metric} className={metrics.includes(metric) ? "selected" : ""} onClick={() => toggleMetric(metric)}>{metric}{metrics.includes(metric) && <IconX size={13} />}</button>)}</div></div>
          <button className="analysis-run" onClick={runAnalysis}><IconChartLine size={17} />开始分析</button>
          <button className="analysis-reset" onClick={() => { setMetrics(metricOptions); setMode("joint"); setRunId(0); }} aria-label="重置分析条件"><IconRefresh size={18} /></button>
        </section>

        <div className="analysis-context-row">
          <span>XX选煤厂</span><IconChevronRight size={14} /><span>输送区域</span><IconChevronRight size={14} /><b>{resource.name}</b>
          <em className={resource.online ? "online" : "offline"}>{resource.online ? "在线" : "离线"}</em>
          <span className="context-time">数据更新：2026-07-17 15:26:18</span>
        </div>

        <section className="analysis-scroll-area">
          <div className="analysis-overview-grid">
            <article className="media-analysis-card">
              <header><div><IconDeviceCctv size={18} /><strong>现场视频</strong><span>1080P · 25 FPS</span></div><button onClick={() => document.querySelector(".analysis-preview")?.requestFullscreen?.()} aria-label="全屏预览"><IconMaximize size={17} /></button></header>
              <div className="analysis-preview">
                <img src={conveyorImage} alt="1号皮带机头现场画面" />
                <div className="preview-status"><i />LIVE</div>
                <div className="preview-detection"><span>皮带区域</span><b>置信度 98.6%</b></div>
                <button className="preview-play" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "暂停预览" : "播放预览"}>{playing ? <IconPlayerPause size={22} /> : <IconPlayerPlay size={22} />}</button>
                <div className="preview-time">2026-07-17 15:26:18</div>
              </div>
            </article>

            <article className="spectrum-card">
              <header><div><IconWaveSine size={18} /><strong>实时声谱</strong><span>44.1 kHz</span></div><div className="volume-indicator"><IconVolume size={16} /><b>73.2</b> dB</div></header>
              <div className="spectrum-bars" aria-label="实时声谱柱状图">
                {Array.from({ length: 34 }, (_, index) => <i key={index} style={{ height: `${20 + ((index * 17 + runId * 7) % 66)}%`, opacity: 0.48 + ((index % 5) * 0.1) }} />)}
                <span className="spectrum-threshold">告警阈值 80 dB</span>
              </div>
              <footer><span>0 Hz</span><span>5 kHz</span><span>10 kHz</span><span>20 kHz</span></footer>
            </article>
          </div>

          <section className="analysis-summary" aria-label="分析摘要">
            <article><span className="summary-icon blue"><IconVolume size={19} /></span><div><small>当前声压</small><strong>73.2 <i>dB</i></strong></div><em className="normal">正常</em></article>
            <article><span className="summary-icon orange"><IconAlertTriangle size={19} /></span><div><small>异响概率</small><strong>36.0 <i>%</i></strong></div><em className="warning">关注</em></article>
            <article><span className="summary-icon teal"><IconChartHistogram size={19} /></span><div><small>画面清晰度</small><strong>88.0 <i>%</i></strong></div><em className="normal">良好</em></article>
            <article><span className="summary-icon violet"><IconAdjustmentsHorizontal size={19} /></span><div><small>皮带跑偏</small><strong>6.8 <i>mm</i></strong></div><em className="warning">轻微</em></article>
          </section>

          <div className="analysis-trends">
            {metrics.includes("声压级") && mode !== "video" && <TrendChart title="声压级趋势" subtitle={`${resource.name} / 麦克风 01`} value="73.2" unit="dB" data={series.sound} min={60} max={85} color="#367cf7" />}
            {metrics.includes("异响概率") && mode !== "video" && <TrendChart title="异响概率" subtitle="轴承异响模型 / 联合诊断" value="36.0" unit="%" data={series.anomaly} min={0} max={40} color="#7b61e8" />}
            {metrics.includes("画面清晰度") && mode !== "audio" && <TrendChart title="画面清晰度" subtitle={`${resource.name} / 摄像机 01`} value="88.0" unit="%" data={series.clarity} min={85} max={100} color="#13a882" />}
            {metrics.includes("皮带跑偏") && mode !== "audio" && <TrendChart title="皮带跑偏量" subtitle="视觉检测 / 皮带边缘模型" value="6.8" unit="mm" data={series.offset} min={0} max={8} color="#ea7c34" />}
          </div>
        </section>
      </main>
      {notice && <div className="analysis-toast"><IconChartDots size={18} />{notice}</div>}
    </div>
  );
}
