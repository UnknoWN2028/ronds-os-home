import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconCircleCheck,
  IconClipboardPlus,
  IconClipboardText,
  IconDownload,
  IconEye,
  IconFileDescription,
  IconHistory,
  IconPhoto,
  IconPhotoUp,
  IconPaperclip,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTool,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import boilerPreview from "./assets/equipment-location-boiler-cctv-v1.png";
import corridorPreview from "./assets/monitor-belt-misalignment.png";
import "./equipment-location-function-panel.css";
import "./equipment-location-defect.css";

const RECORDS = [
  { id: "DG-20260728-021", time: "2026-07-28 09:42:18", point: "G1-02 西侧入口监控点", metric: "人员闯入", level: "紧急", conclusion: "非授权人员进入锅炉西侧检修通道", status: "待处置" },
  { id: "DG-20260728-018", time: "2026-07-28 08:16:04", point: "G1-04 炉前东侧温升点", metric: "设备温升异常", level: "预警", conclusion: "保温层局部最高温度 86.4℃", status: "已转缺陷" },
  { id: "DG-20260727-106", time: "2026-07-27 21:07:33", point: "G1-01 炉膛出口监控点", metric: "烟风道积灰识别", level: "预警", conclusion: "观察窗积灰面积约 18%", status: "已关闭" },
];

const HISTORY_TYPES = ["全部履历", "巡检记录", "报警处置", "缺陷记录", "检修维护", "配置变更"];

const HISTORY = [
  {
    id: "HL-20260729-018",
    date: "2026-07-29",
    time: "18:42:21",
    type: "巡检记录",
    tone: "normal",
    title: "完成锅炉本体音视频联合巡检",
    equipment: "1号锅炉炉前东侧可见光/红外双光谱摄像机",
    point: "炉前东侧保温层温升测点",
    level: "正常",
    conclusion: "设备表面最高温度 63.8℃，未超过 75℃ 预警阈值；火焰、烟雾与人员闯入指标均正常。",
    operator: "运行三值 · AI 巡检",
    metrics: ["最高温度 63.8℃", "异常声压级 61.2 dB", "烟火识别 正常"],
    evidence: [
      { type: "红外抓拍", name: "炉前东侧_20260729_184221.jpg", source: boilerPreview },
      { type: "巡检视频", name: "巡检片段 · 00:18", source: corridorPreview },
    ],
  },
  {
    id: "HL-20260728-021",
    date: "2026-07-28",
    time: "09:51:06",
    type: "缺陷记录",
    tone: "alarm",
    title: "人员闯入报警转缺陷并完成处置",
    equipment: "1号锅炉西侧检修通道固定摄像机",
    point: "锅炉西侧入口人员闯入测点",
    level: "已闭环",
    conclusion: "确认西侧检修门门禁闭锁失效，已创建缺陷 DF-202607-018；检修班完成闭锁机构更换并复核通过。",
    operator: "张工 · 锅炉检修班",
    metrics: ["人员闯入 96.8%", "处置用时 01:26:18", "复核结果 通过"],
    evidence: [
      { type: "报警抓拍", name: "西侧入口_人员闯入.jpg", source: corridorPreview },
      { type: "缺陷报告", name: "DF-202607-018_闭环报告.pdf" },
    ],
  },
  {
    id: "HL-20260727-106",
    date: "2026-07-27",
    time: "21:07:33",
    type: "报警处置",
    tone: "warning",
    title: "烟风道观察窗积灰预警人工复核",
    equipment: "1号锅炉炉膛出口云台摄像机",
    point: "炉膛出口烟风道积灰识别测点",
    level: "预警",
    conclusion: "观察窗积灰面积约 18%，连续三次巡检趋势稳定；已列入下次停炉清灰计划，当前无需停机处置。",
    operator: "王工 · 锅炉专工",
    metrics: ["积灰面积 18%", "趋势 +1.6%", "识别置信度 92.4%"],
    evidence: [{ type: "复核抓拍", name: "炉膛出口_积灰复核.jpg", source: boilerPreview }],
  },
  {
    id: "HL-20260724-044",
    date: "2026-07-24",
    time: "15:26:40",
    type: "配置变更",
    tone: "info",
    title: "调整炉前东侧测点空间位置",
    equipment: "1号锅炉炉前东侧可见光/红外双光谱摄像机",
    point: "炉前东侧保温层温升测点",
    level: "已生效",
    conclusion: "测点位置由 X 75.5% / Y 60.8% 调整为 X 78.0% / Y 62.0%，采集站、预置位与算法指标保持不变。",
    operator: "李工 · 热控班",
    metrics: ["坐标 X 78.0%", "坐标 Y 62.0%", "平台版本 V10.4"],
    evidence: [],
  },
  {
    id: "HL-20260718-009",
    date: "2026-07-18",
    time: "16:32:15",
    type: "检修维护",
    tone: "normal",
    title: "红外镜头清洁与测温校准",
    equipment: "1号锅炉炉前东侧可见光/红外双光谱摄像机",
    point: "炉前东侧保温层温升测点",
    level: "正常",
    conclusion: "完成镜头清洁、黑体标定与取景复核；校准偏差由 +2.1℃ 修正至 +0.3℃。",
    operator: "赵工 · 热控班",
    metrics: ["校准偏差 +0.3℃", "镜头状态 清洁", "视频流 在线"],
    evidence: [{ type: "维护报告", name: "红外测温校准记录_20260718.pdf" }],
  },
  {
    id: "HL-20260711-036",
    date: "2026-07-11",
    time: "10:18:52",
    type: "巡检记录",
    tone: "warning",
    title: "燃烧器层异常声纹专项巡检",
    equipment: "1号锅炉燃烧器层拾音摄像机",
    point: "B层燃烧器异常声纹测点",
    level: "关注",
    conclusion: "2号角燃烧器声压级短时升至 78.6 dB，未出现连续冲击声；建议运行班加强下一轮复听。",
    operator: "运行二值 · AI 巡检",
    metrics: ["声压级 78.6 dB", "冲击声 未检出", "趋势 +3.2 dB"],
    evidence: [{ type: "音频片段", name: "B层燃烧器_异常声纹_00:12.wav" }],
  },
];

function PanelHeader({ icon: Icon, title, subtitle, onClose, maximized = false, onToggleMaximize }) {
  return (
    <header className="elf-head">
      <span><Icon size={22} /></span>
      <div><strong>{title}</strong><small>{subtitle}</small></div>
      {onToggleMaximize && (
        <button type="button" onClick={onToggleMaximize} aria-label={maximized ? "退出全屏" : "全屏编辑"}>
          {maximized ? <IconArrowsMinimize size={17} /> : <IconArrowsMaximize size={17} />}
        </button>
      )}
      <button type="button" onClick={onClose} aria-label="关闭功能面板"><IconX size={17} /></button>
    </header>
  );
}

export function EquipmentLocationFunctionPanel({ action, scopeName, point, onClose, onFeedback }) {
  const [analysis, setAnalysis] = useState({ range: "近24小时", metric: point?.metrics?.[0] || "人员闯入", threshold: "平台阈值", conclusion: "" });
  const [defect, setDefect] = useState({
    name: point ? `${point.name}音视频巡检异常` : `${scopeName}音视频巡检异常`,
    level: point?.status === "alarm" ? "严重" : "一般",
    faultPart: "监控视场及对应设备",
    faultType: "运行状态异常",
    phenomenon: point ? `${point.name}巡检结果异常，现场状态与正常工况不一致。` : `${scopeName}音视频巡检发现异常，待现场复核。`,
    conclusion: point?.status === "alarm"
      ? "算法连续识别到异常状态，已关联当前测点最新抓拍与诊断记录。"
      : "音视频巡检结果超出当前监测指标正常范围，建议结合现场工况复核。",
    advice: "建议检修班组核对现场设备状态，复测对应监测指标；确认异常后按缺陷等级安排处置并回传结果。",
    owner: "锅炉检修班",
    deadline: "2026-07-30T18:00",
  });
  const [defectMaximized, setDefectMaximized] = useState(false);
  const [defectAttachments, setDefectAttachments] = useState([
    { id: "EV-01", name: "最新巡检抓拍.png", size: "2.4 MB", source: boilerPreview, origin: "系统自动关联" },
  ]);
  const [recordFilter, setRecordFilter] = useState("全部状态");
  const [historyRecords, setHistoryRecords] = useState(HISTORY);
  const [historyType, setHistoryType] = useState("全部履历");
  const [historyKeyword, setHistoryKeyword] = useState("");
  const [historyStart, setHistoryStart] = useState("2026-06-29");
  const [historyEnd, setHistoryEnd] = useState("2026-07-29");
  const [expandedHistoryId, setExpandedHistoryId] = useState(HISTORY[0].id);
  const [historyEditorOpen, setHistoryEditorOpen] = useState(
    () => new URLSearchParams(window.location.search).get("historyEditor") === "1",
  );
  const [maintenanceDraft, setMaintenanceDraft] = useState({
    type: "检修维护",
    title: "",
    owner: "锅炉检修班",
    conclusion: "",
  });
  const [photoTab, setPhotoTab] = useState("model");
  const [photos, setPhotos] = useState([
    { id: "PIC-01", type: "model", name: "锅炉房设备空间图", source: boilerPreview, time: "2026-07-28 08:20" },
    { id: "PIC-02", type: "onsite", name: "锅炉西侧入口现场图", source: corridorPreview, time: "2026-07-28 09:42" },
  ]);
  const uploadRef = useRef(null);
  const defectUploadRef = useRef(null);

  const filteredRecords = useMemo(() => RECORDS.filter((item) => recordFilter === "全部状态" || item.status === recordFilter), [recordFilter]);
  const filteredHistory = useMemo(() => {
    const keyword = historyKeyword.trim().toLowerCase();
    return historyRecords.filter((item) => {
      const matchesType = historyType === "全部履历" || item.type === historyType;
      const matchesDate = (!historyStart || item.date >= historyStart) && (!historyEnd || item.date <= historyEnd);
      const matchesKeyword = !keyword || [
        item.id,
        item.title,
        item.equipment,
        item.point,
        item.conclusion,
        item.operator,
      ].some((value) => value.toLowerCase().includes(keyword));
      return matchesType && matchesDate && matchesKeyword;
    });
  }, [historyEnd, historyKeyword, historyRecords, historyStart, historyType]);

  useEffect(() => {
    if (action !== "defect") return;
    const subject = point?.name || scopeName;
    setDefect((current) => ({
      ...current,
      name: `${subject}音视频巡检异常`,
      level: point?.status === "alarm" ? "严重" : current.level,
      phenomenon: `${subject}巡检结果异常，现场状态与正常工况不一致。`,
    }));
  }, [action, point?.id, scopeName]);

  const resetHistoryFilters = () => {
    setHistoryType("全部履历");
    setHistoryKeyword("");
    setHistoryStart("2026-06-29");
    setHistoryEnd("2026-07-29");
    onFeedback("设备履历筛选条件已重置");
  };

  const addMaintenanceRecord = () => {
    if (!maintenanceDraft.title.trim() || !maintenanceDraft.conclusion.trim()) return;
    const now = new Date();
    const date = now.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll("/", "-");
    const time = now.toLocaleTimeString("zh-CN", { hour12: false });
    const record = {
      id: `HL-${date.replaceAll("-", "")}-${String(historyRecords.length + 1).padStart(3, "0")}`,
      date,
      time,
      type: maintenanceDraft.type,
      tone: "info",
      title: maintenanceDraft.title.trim(),
      equipment: point?.device || "1号锅炉音视频巡检设备",
      point: point?.name || `${scopeName}巡检测点`,
      level: "待复核",
      conclusion: maintenanceDraft.conclusion.trim(),
      operator: `${maintenanceDraft.owner} · 当前用户`,
      metrics: ["记录来源 人工新增", "状态 页面草稿", "证据 待补充"],
      evidence: [],
    };
    setHistoryRecords((current) => [record, ...current]);
    setExpandedHistoryId(record.id);
    setHistoryEditorOpen(false);
    setMaintenanceDraft({ type: "检修维护", title: "", owner: "锅炉检修班", conclusion: "" });
    onFeedback(`${record.id} 已加入设备履历`);
  };

  if (!action) return null;

  if (action === "analysis") {
    return (
      <aside className="elf-panel">
        <PanelHeader icon={IconActivityHeartbeat} title="诊断分析" subtitle={`${scopeName} · 当前空间音视频指标诊断`} onClose={onClose} />
        <div className="elf-body">
          <section className="elf-context"><IconCamera size={20} /><span><strong>{point?.name || scopeName}</strong><small>{point?.device || "当前空间全部音视频设备"}</small></span><em>在线</em></section>
          <div className="elf-form-grid">
            <label><span>分析范围</span><select value={analysis.range} onChange={(event) => setAnalysis({ ...analysis, range: event.target.value })}><option>近1小时</option><option>近24小时</option><option>近7天</option><option>近30天</option></select></label>
            <label><span>诊断指标</span><select value={analysis.metric} onChange={(event) => setAnalysis({ ...analysis, metric: event.target.value })}>{["人员闯入", "火焰检测", "设备温升异常", "烟风道积灰识别", "异常声纹"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>阈值策略</span><select value={analysis.threshold} onChange={(event) => setAnalysis({ ...analysis, threshold: event.target.value })}><option>平台阈值</option><option>设备模型阈值</option><option>自定义阈值</option></select></label>
            <label><span>证据范围</span><select defaultValue="图像 + 视频 + 音频"><option>图像 + 视频 + 音频</option><option>仅图像</option><option>仅音频</option></select></label>
          </div>
          <section className="elf-analysis-result">
            <header><span><IconActivityHeartbeat size={17} />分析结论</span><button type="button" onClick={() => onFeedback("诊断数据已刷新")}><IconRefresh size={14} />刷新数据</button></header>
            <dl><div><dt>样本数</dt><dd>1,248</dd></div><div><dt>异常片段</dt><dd className="warning">3</dd></div><div><dt>最高置信度</dt><dd>96.8%</dd></div></dl>
            <textarea value={analysis.conclusion} onChange={(event) => setAnalysis({ ...analysis, conclusion: event.target.value })} placeholder="补充诊断结论；为空时使用算法自动结论" />
            <p><IconAlertTriangle size={15} />09:42:18 西侧入口检测到人员闯入，已关联现场图像和 12 秒视频证据。</p>
          </section>
        </div>
        <footer className="elf-actions"><button type="button" onClick={() => onFeedback("诊断报告已导出")}><IconDownload size={15} />导出报告</button><button type="button" className="primary" onClick={() => onFeedback(`${analysis.metric}诊断任务已生成`)}><IconCheck size={15} />生成诊断</button></footer>
      </aside>
    );
  }

  if (action === "defect") {
    const pointName = point?.name || `${scopeName}炉前主视角测点`;
    const cameraName = point?.cameraName || point?.device || "1号锅炉炉前可见光摄像机";
    const devicePath = `华东电厂 / ${scopeName} / ${pointName}`;
    const submitDisabled = !defect.name.trim() || !defect.conclusion.trim();

    return (
      <aside className={`elf-panel elf-defect-panel ${defectMaximized ? "maximized" : ""}`} aria-label="添加缺陷">
        <PanelHeader
          icon={IconClipboardPlus}
          title="添加缺陷"
          subtitle={`${scopeName} · 火电厂音视频巡检缺陷登记`}
          onClose={onClose}
          maximized={defectMaximized}
          onToggleMaximize={() => setDefectMaximized((current) => !current)}
        />
        <div className="elf-body elf-defect-body">
          <section className="elf-defect-context">
            <div><IconCamera size={22} /><span><strong>{pointName}</strong><small>{cameraName}</small></span></div>
            <dl>
              <div><dt>设备空间</dt><dd>{scopeName}</dd></div>
              <div><dt>测点状态</dt><dd className={point?.status === "alarm" ? "alarm" : ""}>{point?.status === "alarm" ? "报警" : "在线"}</dd></div>
              <div><dt>诊断记录</dt><dd>DG-20260728-021</dd></div>
              <div><dt>数据来源</dt><dd>采集站目录</dd></div>
            </dl>
          </section>

          <div className="elf-defect-grid">
            <label>
              <span><b>*</b> 缺陷名称（描述）</span>
              <input value={defect.name} onChange={(event) => setDefect({ ...defect, name: event.target.value })} placeholder="请输入缺陷名称" />
            </label>
            <label>
              <span>设备部件</span>
              <div className="elf-defect-readonly"><strong>{pointName}</strong><small>{cameraName}</small><em>已带入</em></div>
            </label>
            <label>
              <span>设备路径</span>
              <div className="elf-defect-readonly path" title={devicePath}>{devicePath}</div>
            </label>

            <label>
              <span>缺陷等级</span>
              <select value={defect.level} onChange={(event) => setDefect({ ...defect, level: event.target.value })}>
                <option>一般</option><option>严重</option><option>紧急</option>
              </select>
            </label>
            <label>
              <span>故障部件</span>
              <select value={defect.faultPart} onChange={(event) => setDefect({ ...defect, faultPart: event.target.value })}>
                <option>监控视场及对应设备</option><option>锅炉本体</option><option>烟风系统</option><option>检修通道</option><option>摄像机与云台</option>
              </select>
            </label>
            <label>
              <span>故障类型</span>
              <select value={defect.faultType} onChange={(event) => setDefect({ ...defect, faultType: event.target.value })}>
                <option>运行状态异常</option><option>温升异常</option><option>人员安全隐患</option><option>烟火滴漏</option><option>音视频设备故障</option>
              </select>
            </label>

            <label className="wide">
              <span>现象描述</span>
              <textarea value={defect.phenomenon} onChange={(event) => setDefect({ ...defect, phenomenon: event.target.value })} placeholder="描述现场现象、发生位置和工况" />
            </label>
            <label className="wide">
              <span><b>*</b> 诊断结论</span>
              <textarea value={defect.conclusion} onChange={(event) => setDefect({ ...defect, conclusion: event.target.value })} placeholder="填写人工复核后的诊断结论" />
            </label>
            <label className="wide">
              <span>检维修建议</span>
              <textarea value={defect.advice} onChange={(event) => setDefect({ ...defect, advice: event.target.value })} placeholder="填写隔离、复测、检修和验收建议" />
            </label>
          </div>

          <section className="elf-defect-dispatch">
            <label><span>责任班组</span><select value={defect.owner} onChange={(event) => setDefect({ ...defect, owner: event.target.value })}><option>锅炉检修班</option><option>运行三值</option><option>热控班</option><option>安全监察部</option></select></label>
            <label><span>计划完成时间</span><input type="datetime-local" value={defect.deadline} onChange={(event) => setDefect({ ...defect, deadline: event.target.value })} /></label>
          </section>

          <section className="elf-defect-upload">
            <header>
              <span><IconPaperclip size={17} /><strong>上传附件</strong><small>自动保留当前诊断抓拍，可补充现场照片、视频或文档</small></span>
              <input
                ref={defectUploadRef}
                hidden
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                multiple
                onChange={(event) => {
                  const files = [...(event.target.files || [])];
                  if (!files.length) return;
                  setDefectAttachments((current) => [
                    ...current,
                    ...files.map((file) => ({
                      id: `DEFECT-${Date.now()}-${file.name}`,
                      name: file.name,
                      size: `${Math.max(.1, file.size / 1024 / 1024).toFixed(1)} MB`,
                      source: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
                      origin: "人工上传",
                    })),
                  ]);
                  onFeedback(`已添加 ${files.length} 个缺陷附件`);
                  event.target.value = "";
                }}
              />
              <button type="button" onClick={() => defectUploadRef.current?.click()}><IconUpload size={15} />上传附件</button>
            </header>
            <div className="elf-defect-attachments">
              {defectAttachments.map((item) => (
                <article key={item.id}>
                  {item.source ? <img src={item.source} alt={item.name} /> : <span className="elf-file-icon"><IconFileDescription size={22} /></span>}
                  <span><strong>{item.name}</strong><small>{item.origin} · {item.size}</small></span>
                  <button type="button" onClick={() => setDefectAttachments((current) => current.filter((attachment) => attachment.id !== item.id))} aria-label={`删除${item.name}`}><IconTrash size={15} /></button>
                </article>
              ))}
              <button type="button" className="elf-defect-add-file" onClick={() => defectUploadRef.current?.click()}><IconUpload size={20} /><span>继续添加</span></button>
            </div>
          </section>
        </div>
        <footer className="elf-actions elf-defect-actions">
          <span><i /> 当前测点、设备路径与诊断证据将随缺陷一并保存</span>
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" className="primary" disabled={submitDisabled} onClick={() => { onFeedback(`缺陷 DF-20260729-${Math.floor(Math.random() * 80 + 20)} 已创建并分派给${defect.owner}`); onClose(); }}><IconCheck size={15} />提交缺陷</button>
        </footer>
      </aside>
    );
  }

  if (action === "records") {
    return (
      <aside className="elf-panel">
        <PanelHeader icon={IconClipboardText} title="诊断记录" subtitle={`${scopeName} · 算法诊断与人工复核记录`} onClose={onClose} />
        <div className="elf-body flush">
          <div className="elf-filter"><label><IconSearch size={14} /><input placeholder="记录编号 / 测点 / 指标" /></label><select value={recordFilter} onChange={(event) => setRecordFilter(event.target.value)}><option>全部状态</option><option>待处置</option><option>已转缺陷</option><option>已关闭</option></select></div>
          <div className="elf-record-list">{filteredRecords.map((item) => <button type="button" key={item.id} onClick={() => onFeedback(`${item.id}诊断详情已展开`)}><header><b>{item.id}</b><em className={item.level === "紧急" ? "alarm" : "warning"}>{item.level}</em></header><strong>{item.metric} · {item.point}</strong><p>{item.conclusion}</p><footer><span>{item.time}</span><span>{item.status}</span></footer></button>)}</div>
        </div>
        <footer className="elf-actions"><span>{filteredRecords.length} 条记录</span><button type="button" onClick={() => onFeedback("诊断记录已导出")}><IconDownload size={15} />导出</button></footer>
      </aside>
    );
  }

  if (action === "history") {
    return (
      <aside className="elf-panel elf-history-panel">
        <header className="elf-head elf-history-head">
          <span><IconHistory size={22} /></span>
          <div>
            <strong>设备履历</strong>
            <small>{point?.device || scopeName} · 火电音视频巡检全生命周期记录</small>
          </div>
          <div className="elf-history-head-actions">
            <button type="button" className="primary" onClick={() => setHistoryEditorOpen(true)}><IconPlus size={15} />添加</button>
            <button type="button" onClick={onClose} aria-label="收起设备履历"><IconX size={17} /></button>
          </div>
        </header>
        <div className="elf-body elf-history-body">
          <section className="elf-history-context">
            <div className="elf-history-device">
              <span><IconCamera size={21} /></span>
              <div>
                <strong>{point?.device || "1号锅炉音视频巡检设备"}</strong>
                <small>{point?.name || scopeName} · {point?.sourceStationName || "锅炉区域采集站"}</small>
              </div>
              <em><i />在线</em>
            </div>
            <dl>
              <div><dt>履历总数</dt><dd>{historyRecords.length + 80}</dd></div>
              <div><dt>近30天巡检</dt><dd>18</dd></div>
              <div><dt>缺陷闭环</dt><dd className="success">6</dd></div>
              <div><dt>待复核</dt><dd className="warning">1</dd></div>
            </dl>
          </section>

          <section className="elf-history-filter" aria-label="设备履历筛选">
            <nav>
              {HISTORY_TYPES.map((type) => (
                <button type="button" key={type} className={historyType === type ? "active" : ""} onClick={() => setHistoryType(type)}>
                  {type}
                </button>
              ))}
            </nav>
            <div className="elf-history-query">
              <label className="search"><IconSearch size={15} /><input value={historyKeyword} onChange={(event) => setHistoryKeyword(event.target.value)} placeholder="搜索记录编号、测点、设备或内容" /></label>
              <label className="date"><IconCalendar size={15} /><input type="date" value={historyStart} onChange={(event) => setHistoryStart(event.target.value)} /><span>至</span><input type="date" value={historyEnd} onChange={(event) => setHistoryEnd(event.target.value)} /></label>
              <button type="button" className="query" onClick={() => onFeedback(`已查询到 ${filteredHistory.length} 条设备履历`)}><IconSearch size={15} />查询</button>
              <button type="button" className="reset" onClick={resetHistoryFilters}><IconRefresh size={15} />重置</button>
            </div>
          </section>

          <div className="elf-timeline">
            {filteredHistory.length ? filteredHistory.map((item) => {
              const expanded = expandedHistoryId === item.id;
              return (
                <article className={`${item.tone} ${expanded ? "expanded" : ""}`} key={item.id}>
                  <div className="elf-history-when"><strong>{item.date}</strong><time>{item.time}</time><span>{item.type}</span></div>
                  <i className="elf-history-dot" />
                  <section className="elf-history-entry">
                    <header>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.id} · {item.operator}</small>
                      </div>
                      <span className={`elf-history-level ${item.tone}`}>{item.level}</span>
                    </header>
                    <div className="elf-history-subject">
                      <span><small>设备</small><strong>{item.equipment}</strong></span>
                      <span><small>测点</small><strong>{item.point}</strong></span>
                    </div>
                    <p>{item.conclusion}</p>
                    <div className="elf-history-metrics">
                      {item.metrics.map((metric) => <span key={metric}><i />{metric}</span>)}
                    </div>
                    {expanded && (
                      <div className="elf-history-evidence">
                        <header><strong>关联证据与记录</strong><small>{item.evidence.length ? `${item.evidence.length} 项` : "本次记录无媒体附件"}</small></header>
                        {item.evidence.length ? (
                          <div>
                            {item.evidence.map((evidence) => (
                              <button type="button" key={`${item.id}-${evidence.name}`} onClick={() => onFeedback(`${evidence.name} 预览已打开`)}>
                                {evidence.source
                                  ? <img src={evidence.source} alt={`${item.point} ${evidence.type}`} />
                                  : <span className="elf-history-file"><IconFileDescription size={22} /></span>}
                                <span><strong>{evidence.name}</strong><small>{evidence.type} · 点击预览</small></span>
                                <IconEye size={16} />
                              </button>
                            ))}
                          </div>
                        ) : <p>配置变更已由平台审计日志留痕，不额外生成音视频附件。</p>}
                      </div>
                    )}
                    <footer>
                      <span><IconCircleCheck size={14} />数据来源已校验</span>
                      <button type="button" onClick={() => setExpandedHistoryId(expanded ? "" : item.id)}>
                        {expanded ? "收起详情" : "查看详情"}<IconChevronDown size={14} />
                      </button>
                    </footer>
                  </section>
                </article>
              );
            }) : (
              <div className="elf-history-empty">
                <IconHistory size={30} />
                <strong>当前条件下没有设备履历</strong>
                <span>可调整履历类型、时间范围或关键词后重新查询。</span>
                <button type="button" onClick={resetHistoryFilters}>重置筛选</button>
              </div>
            )}
          </div>

          {historyEditorOpen && (
            <div
              className="elf-history-compose-layer"
              role="presentation"
              onKeyDown={(event) => { if (event.key === "Escape") setHistoryEditorOpen(false); }}
              onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryEditorOpen(false); }}
            >
              <section className="elf-history-compose" role="dialog" aria-modal="true" aria-label="新增设备维护记录">
                <header><span><IconTool size={19} /><strong>新增设备履历</strong><small>人工补充检修、维护或配置记录</small></span><button type="button" onClick={() => setHistoryEditorOpen(false)} aria-label="关闭新增设备履历"><IconX size={16} /></button></header>
                <div>
                  <label><span>履历类型</span><select value={maintenanceDraft.type} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, type: event.target.value })}><option>检修维护</option><option>配置变更</option><option>巡检记录</option></select></label>
                  <label><span>责任班组</span><select value={maintenanceDraft.owner} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, owner: event.target.value })}><option>锅炉检修班</option><option>热控班</option><option>运行三值</option><option>安全监察部</option></select></label>
                  <label className="wide"><span>记录标题 *</span><input autoFocus value={maintenanceDraft.title} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, title: event.target.value })} placeholder="例如：炉前红外镜头清洁与测温校准" /></label>
                  <label className="wide"><span>处理结果 *</span><textarea value={maintenanceDraft.conclusion} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, conclusion: event.target.value })} placeholder="填写本次维护内容、检查结果和后续建议" /></label>
                </div>
                <footer><button type="button" onClick={() => setHistoryEditorOpen(false)}>取消</button><button type="button" className="primary" disabled={!maintenanceDraft.title.trim() || !maintenanceDraft.conclusion.trim()} onClick={addMaintenanceRecord}><IconCheck size={15} />保存履历</button></footer>
              </section>
            </div>
          )}
        </div>
        <footer className="elf-actions elf-history-actions">
          <span>当前显示 {filteredHistory.length} 条 · 时间范围 {historyStart || "不限"} 至 {historyEnd || "不限"}</span>
          <button type="button" onClick={() => onFeedback(`已导出 ${filteredHistory.length} 条设备履历`)}><IconDownload size={15} />导出履历</button>
        </footer>
      </aside>
    );
  }

  return (
    <aside className="elf-panel">
      <PanelHeader icon={IconPhoto} title="设备图片" subtitle={`${scopeName} · 设备模型图与现场拍照`} onClose={onClose} />
      <div className="elf-body flush">
        <nav className="elf-photo-tabs"><button type="button" className={photoTab === "model" ? "active" : ""} onClick={() => setPhotoTab("model")}>设备模型图</button><button type="button" className={photoTab === "onsite" ? "active" : ""} onClick={() => setPhotoTab("onsite")}>现场拍照</button></nav>
        <div className="elf-photo-actions"><span>{photos.filter((item) => item.type === photoTab).length} 张图片</span><input ref={uploadRef} hidden type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const source = URL.createObjectURL(file); setPhotos((current) => [...current, { id: `PIC-${Date.now()}`, type: photoTab, name: file.name, source, time: new Date().toLocaleString("zh-CN") }]); onFeedback(`${file.name}已上传`); }} /><button type="button" onClick={() => uploadRef.current?.click()}><IconPhotoUp size={15} />上传图片</button></div>
        <div className="elf-photo-grid">{photos.filter((item) => item.type === photoTab).map((item) => <figure key={item.id}><img src={item.source} alt={item.name} /><figcaption><span><strong>{item.name}</strong><small>{item.time}</small></span><button type="button" onClick={() => onFeedback(`${item.name}已设为当前空间背景图`)}>{photoTab === "model" ? "设为背景图" : "查看原图"}</button></figcaption></figure>)}</div>
      </div>
    </aside>
  );
}
