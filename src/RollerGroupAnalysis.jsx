import { useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCalendar,
  IconChartLine,
  IconCheck,
  IconChevronRight,
  IconFilter,
  IconMapPin,
  IconPhoto,
  IconPhotoOff,
  IconRefresh,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import conveyorImage from "./assets/conveyor-belt.jpg";
import "./roller-group-analysis.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (value) => String(value).padStart(2, "0");
const formatDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function routeParams() {
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.indexOf("?");
  if (hashQuery >= 0) new URLSearchParams(window.location.hash.slice(hashQuery + 1)).forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });
  return params;
}

function appHref(path) {
  const base = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
  return base ? `${base}/#${path}` : path;
}

function initialContext() {
  const params = routeParams();
  const alarmTime = new Date(String(params.get("alarmTime") || "2026-07-20T13:06:12").replace(" ", "T"));
  const safeAlarm = Number.isFinite(alarmTime.getTime()) ? alarmTime : new Date("2026-07-20T13:06:12");
  const requestedDays = Number.parseInt(params.get("days") || "15", 10);
  const days = Number.isFinite(requestedDays) ? Math.min(30, Math.max(1, requestedDays)) : 15;
  return {
    device: params.get("device") || "310A皮带",
    location: params.get("location") || "11#左托辊",
    metric: params.get("metric") || "缺辊",
    alarmTime: safeAlarm,
    days,
    startDate: formatDate(new Date(safeAlarm.getTime() - (days - 1) * DAY_MS)),
    endDate: formatDate(safeAlarm),
  };
}

const rollerSeed = [
  ["11#左托辊", "视觉测点", 96, 4],
  ["12#左托辊", "视觉测点", 91, 3],
  ["17#右托辊", "视觉测点", 88, 2],
  ["18#右托辊", "视觉测点", 82, 2],
  ["13#右托辊", "声学测点", 89, 3],
];

function makeSamples(context, location) {
  const latest = context.alarmTime;
  const offsets = [14, 10, 6, 3, 0];
  const values = location === "13#右托辊" ? [0, 0, 1, 1, 1] : [0, 1, 0, 1, 1];
  return offsets.map((offset, index) => {
    const date = new Date(latest.getTime() - offset * DAY_MS);
    return {
      index,
      time: `${formatDate(date)} ${index === 4 ? `${pad(latest.getHours())}:${pad(latest.getMinutes())}:${pad(latest.getSeconds())}` : ["20:01:18", "10:18:32", "15:42:09", "09:36:44"][index]}`,
      alarm: Boolean(values[index]),
      attachment: index !== 2,
      value: values[index] ? context.metric : "运行正常",
    };
  });
}

export function RollerGroupAnalysis() {
  const context = useMemo(initialContext, []);
  const rollers = useMemo(() => {
    const rows = rollerSeed.filter(([location]) => location !== context.location);
    return [[context.location, "视觉测点", 96, 4], ...rows].map(([location, pointType, probability, level], index) => ({ id: `roller-${index}`, location, pointType, probability, level }));
  }, [context.location]);
  const [selectedRoller, setSelectedRoller] = useState(rollers[0]);
  const samples = useMemo(() => makeSamples(context, selectedRoller.location), [context, selectedRoller.location]);
  const [selectedIndex, setSelectedIndex] = useState(4);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const selectedSample = samples[selectedIndex];
  const filteredRollers = rollers.filter((item) => item.location.includes(query));
  const pointXs = [82, 238, 394, 550, 706];
  const pointYs = samples.map((sample) => sample.alarm ? 56 : 205);
  const points = pointXs.map((x, index) => `${x},${pointYs[index]}`).join(" ");

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectSample = (index) => {
    setSelectedIndex(index);
    if (!samples[index].attachment) setToast("该时刻未检测到附件");
  };

  const runQuery = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSelectedIndex(4);
      setToast(`已按异常托辊加载 ${context.days} 天分析数据`);
    }, 520);
  };

  return (
    <div className="roller-analysis">
      <header className="ra-header">
        <div><a href={appHref("/intelligent-diagnosis")}><IconArrowLeft size={17} />智能诊断</a><IconChevronRight size={14} /><strong>托辊组分析</strong></div>
        <span><IconMapPin size={15} />{context.device} · 输送区域 / 上托辊组</span>
      </header>

      <div className="ra-workspace">
        <aside className="ra-roller-panel">
          <header><div><strong>异常托辊</strong><small>{rollers.length} 个异常位置</small></div><button title="筛选"><IconFilter size={16} /></button></header>
          <label className="ra-search"><IconSearch size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索托辊位置" /></label>
          <div className="ra-roller-list">
            {filteredRollers.map((item) => <button key={item.id} className={selectedRoller.id === item.id ? "active" : ""} onClick={() => { setSelectedRoller(item); setSelectedIndex(4); }}><span><strong>{item.location}</strong><small>{item.pointType} · {context.metric}</small></span><span><em>{item.level}级1</em><b>{item.probability}%</b></span></button>)}
          </div>
        </aside>

        <main className="ra-analysis-main">
          <section className="ra-chart-card">
            <header><div><IconChartLine size={17} /><span><strong>{selectedRoller.location} · {context.metric}状态</strong><small>查询方式：按异常托辊分析</small></span></div><div><button title="复位" onClick={() => setSelectedIndex(4)}><IconRefresh size={16} /></button><button title="图谱设置"><IconSettings size={16} /></button></div></header>
            <div className="ra-chart-meta"><span>报警时刻 {formatDate(context.alarmTime)} {pad(context.alarmTime.getHours())}:{pad(context.alarmTime.getMinutes())}:{pad(context.alarmTime.getSeconds())}</span><small>{context.startDate} — {context.endDate}</small></div>
            <div className="ra-chart">
              <svg viewBox="0 0 780 252" preserveAspectRatio="none" role="img" aria-label={`${selectedRoller.location}${context.metric}状态趋势`}>
                <line className="ra-grid" x1="82" y1="56" x2="706" y2="56" /><line className="ra-grid" x1="82" y1="205" x2="706" y2="205" />
                <line className="ra-axis" x1="82" y1="35" x2="82" y2="219" /><line className="ra-axis" x1="82" y1="219" x2="706" y2="219" />
                <text x="14" y="61">{context.metric}</text><text x="27" y="210">正常</text>
                <polyline points={points} />
                <line className="ra-cursor" x1={pointXs[selectedIndex]} y1="35" x2={pointXs[selectedIndex]} y2="219" />
                {samples.map((sample, index) => <g key={sample.time} onClick={() => selectSample(index)} tabIndex="0" role="button" aria-label={`${sample.time} ${sample.value}`} onKeyDown={(event) => { if (event.key === "Enter") selectSample(index); }}><circle className="ra-hit" cx={pointXs[index]} cy={pointYs[index]} r="15" /><circle className={`${sample.alarm ? "alarm" : "normal"} ${sample.attachment ? "" : "empty"} ${selectedIndex === index ? "selected" : ""}`} cx={pointXs[index]} cy={pointYs[index]} r="6" /></g>)}
                <text className="ra-time" x="82" y="243">{samples[0].time.slice(5, 16)}</text><text className="ra-time" x="706" y="243" textAnchor="end">{samples[4].time.slice(5, 16)}</text>
              </svg>
              <div className="ra-tooltip" style={{ left: `${(pointXs[selectedIndex] / 780) * 100}%`, top: selectedSample.alarm ? "24%" : "63%" }}><strong>{selectedSample.time}</strong><span>{selectedSample.value}</span><small>{selectedSample.attachment ? "现场附件已同步" : "未检测到附件"}</small></div>
              <div className="ra-legend"><span><i className="alarm" />报警</span><span><i className="normal" />正常</span><span><i className="empty" />无附件</span></div>
            </div>
          </section>

          <section className={`ra-attachment ${selectedSample.attachment ? "" : "empty"}`}>
            <header><div><IconPhoto size={17} /><strong>现场附件</strong></div><span>{selectedSample.time} · {selectedSample.value}</span></header>
            {selectedSample.attachment ? <div className="ra-image"><img src={conveyorImage} alt={`${selectedRoller.location}现场图像`} /><span><i />{selectedRoller.location} · {context.metric}识别</span><b>报警证据与当前游标已同步</b></div> : <div className="ra-no-attachment"><IconPhotoOff size={38} /><strong>未检测到附件</strong><span>该时刻算法未上传现场附件</span></div>}
          </section>
        </main>

        <aside className="ra-condition-panel">
          <header><strong>分析条件</strong><span>默认已带入报警上下文</span></header>
          <section><h2>查询方式</h2><label className="ra-radio"><input type="radio" checked readOnly /><span>按异常托辊分析</span></label></section>
          <section><h2>时间范围 <em>近{context.days}天</em></h2><div className="ra-dates"><label><span>开始日期</span><div><input type="date" value={context.startDate} readOnly /><IconCalendar size={14} /></div></label><label><span>结束日期</span><div><input type="date" value={context.endDate} readOnly /><IconCalendar size={14} /></div></label></div></section>
          <section><h2>异常托辊</h2><div className="ra-selected-node"><IconMapPin size={16} /><span><strong>{selectedRoller.location}</strong><small>{context.device} · 已选中报警托辊</small></span><IconCheck size={16} /></div></section>
          <section><h2>指标选择</h2><label className="ra-checkbox"><input type="checkbox" checked readOnly /><span>{context.metric}状态</span></label><label className="ra-checkbox muted"><input type="checkbox" /><span>托辊温度</span></label></section>
          <section className="ra-data-section"><h2>数据列表 <em>{samples.length}条</em></h2><div>{[...samples].reverse().map((sample) => <button key={sample.time} className={sample.index === selectedIndex ? "active" : ""} onClick={() => selectSample(sample.index)}><time>{sample.time.slice(5)}</time><span>{sample.value}</span><em className={sample.alarm ? "alarm" : sample.attachment ? "attached" : "normal"}>{sample.alarm ? "报警" : sample.attachment ? "附件" : "正常"}</em></button>)}</div></section>
          <footer><button className="ra-confirm" disabled={loading} onClick={runQuery}>{loading ? "查询中…" : "确定"}</button></footer>
        </aside>
      </div>
      {toast && <div className="ra-toast" role="status">{toast.includes("未检测") ? <IconAlertTriangle size={17} /> : <IconCheck size={17} />}<span>{toast}</span></div>}
    </div>
  );
}
