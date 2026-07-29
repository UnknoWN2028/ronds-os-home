import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconArrowDown,
  IconArrowUp,
  IconBox,
  IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconColumns3,
  IconDatabase,
  IconDeviceCctv,
  IconDownload,
  IconEdit,
  IconFileImport,
  IconHistory,
  IconLink,
  IconListDetails,
  IconMap2,
  IconMapPin,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconTrash,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import floorPlanAsset from "./assets/equipment-location-floorplan.png";
import "./equipment-location-admin.css";

const POSITION_ROWS = [
  { id: "EL-BLR-01", spaceId: "boiler-room", name: "锅炉房", type: "设备空间", area: "锅炉区域", category: "锅炉本体", level: "A级", monitoring: "音视频在线监测", owner: "张工", status: "运行中", points: 4 },
  { id: "EL-BLR-02", spaceId: "boiler-roof", name: "炉顶设备层", type: "设备空间", area: "锅炉区域", category: "受热面设备", level: "A级", monitoring: "红外热成像", owner: "周工", status: "待配置", points: 0 },
  { id: "EL-BLR-03", spaceId: "air-preheater-room", name: "空预器设备间", type: "设备空间", area: "锅炉区域", category: "烟风系统", level: "A级", monitoring: "音视频在线监测", owner: "李工", status: "运行中", points: 1 },
  { id: "EL-BLR-04", spaceId: "boiler-aux-room", name: "锅炉辅机间", type: "设备空间", area: "锅炉区域", category: "锅炉辅机", level: "B级", monitoring: "音视频在线监测", owner: "王工", status: "运行中", points: 1 },
  { id: "EL-TUR-01", spaceId: "turbine-body", name: "汽轮机本体", type: "设备空间", area: "汽机区域", category: "汽轮发电机组", level: "A级", monitoring: "音视频在线监测", owner: "陈工", status: "待配置", points: 0 },
  { id: "EL-TUR-02", spaceId: "pump", name: "给水泵区域", type: "设备空间", area: "汽机区域", category: "给水系统", level: "A级", monitoring: "声学巡检", owner: "陈工", status: "待配置", points: 0 },
  { id: "EL-COA-01", spaceId: "belt-corridor", name: "皮带机廊道", type: "设备空间", area: "输煤区域", category: "输煤系统", level: "A级", monitoring: "音视频在线监测", owner: "赵工", status: "运行中", points: 3 },
  { id: "EL-COA-02", spaceId: "transfer", name: "转运站", type: "设备空间", area: "输煤区域", category: "输煤系统", level: "A级", monitoring: "音视频在线监测", owner: "赵工", status: "待配置", points: 0 },
  { id: "EL-COA-03", spaceId: "crusher", name: "碎煤机室", type: "设备空间", area: "输煤区域", category: "输煤系统", level: "B级", monitoring: "音视频在线监测", owner: "孙工", status: "待配置", points: 0 },
  { id: "EL-DES-01", spaceId: "absorber", name: "吸收塔区域", type: "设备空间", area: "脱硫区域", category: "脱硫系统", level: "A级", monitoring: "音视频在线监测", owner: "胡工", status: "待配置", points: 0 },
];

const ARCHIVE_SECTIONS = [
  { id: "ledger", label: "关联台账", count: 2 },
  { id: "alarms", label: "报警记录", count: 12 },
  { id: "defects", label: "缺陷记录", count: 3 },
  { id: "inspection", label: "巡检记录", count: 26 },
  { id: "changes", label: "位置履历", count: 8 },
];

const ARCHIVE_ROWS = {
  ledger: [
    ["AV-BOILER-001", "锅炉房全景云台摄像机", "HIKVISION DS-2DC4223IW-DE", "在用", "2026-05-18"],
    ["AV-THERMAL-006", "锅炉东侧红外热成像仪", "HIKVISION DS-2TD2637B", "在用", "2026-06-03"],
  ],
  alarms: [
    ["ALM-20260728-021", "人员闯入", "西侧入口监控点", "紧急", "2026-07-28 09:42:18"],
    ["ALM-20260728-018", "设备温升异常", "炉前东侧温升点", "预警", "2026-07-28 08:16:04"],
    ["ALM-20260727-106", "烟风道积灰识别", "烟风道顶部监控点", "预警", "2026-07-27 21:07:33"],
  ],
  defects: [
    ["DF-202607-018", "锅炉西侧入口门禁损坏", "待处理", "设备主管", "2026-07-28"],
    ["DF-202607-011", "炉前东侧保温层局部温升", "处理中", "锅炉检修班", "2026-07-26"],
    ["DF-202607-006", "空预器出口观察窗积灰", "已闭环", "运行三值", "2026-07-23"],
  ],
  inspection: [
    ["INSP-20260728-31", "锅炉房日常音视频巡检", "4/4 测点完成", "正常", "2026-07-28 10:10"],
    ["INSP-20260728-12", "炉前燃烧状态专项巡检", "3/3 指标完成", "发现异常", "2026-07-28 08:20"],
    ["INSP-20260727-42", "锅炉辅机夜间巡检", "2/2 测点完成", "正常", "2026-07-27 23:40"],
  ],
  changes: [
    ["CHG-20260724-09", "调整 G1-04 空间定位", "张工", "平台版本 V12", "2026-07-24 15:26"],
    ["CHG-20260722-03", "新增炉前东侧温升点", "李工", "平台版本 V11", "2026-07-22 11:08"],
    ["CHG-20260718-02", "替换锅炉房 2D 空间底图", "周工", "平台版本 V10", "2026-07-18 16:32"],
  ],
};

const MODEL_OPTIONS = [
  { id: "TM-BOILER-01", name: "火电锅炉房音视频空间模型", version: "V3.2", nodes: 14, fields: 28, status: "平台推荐" },
  { id: "TM-COAL-02", name: "输煤廊道音视频空间模型", version: "V2.4", nodes: 11, fields: 22, status: "可引用" },
  { id: "TM-TURBINE-01", name: "汽轮机房音视频空间模型", version: "V1.8", nodes: 9, fields: 19, status: "可引用" },
];

const SPACE_PROFILES = {
  "boiler-room": {
    code: "SP-GL-001",
    floor: "1号锅炉主厂房 · 0m 层",
    area: "1,860 ㎡",
    access: "西侧检修门 / 南侧主通道",
    specialty: "锅炉专业",
    description: "覆盖锅炉本体、烟风管道、燃烧器层、检修平台和紧邻检修通道。",
  },
  "belt-corridor": {
    code: "SP-SM-011",
    floor: "1号输煤皮带 · 栈桥层",
    area: "960 ㎡",
    access: "东侧转运站 / 西侧检修入口",
    specialty: "输煤专业",
    description: "覆盖皮带机、托辊组、拉绳开关和廊道两侧连续检修通道。",
  },
  transfer: {
    code: "SP-SM-021",
    floor: "2号转运站 · 12.6m 层",
    area: "420 ㎡",
    access: "北侧皮带廊道 / 南侧楼梯间",
    specialty: "输煤专业",
    description: "覆盖落煤管、导料槽、除尘设施和站内检修通道。",
  },
  crusher: {
    code: "SP-SM-031",
    floor: "碎煤机室 · 0m 层",
    area: "580 ㎡",
    access: "东侧设备门 / 西侧巡检通道",
    specialty: "输煤专业",
    description: "覆盖碎煤机本体、驱动端、落煤口和周边检修通道。",
  },
};

const POINT_STATUS = {
  normal: { label: "正常", tone: "normal" },
  warning: { label: "预警", tone: "warning" },
  alarm: { label: "报警", tone: "alarm" },
  offline: { label: "离线", tone: "offline" },
};

const INITIAL_PARTS = [
  { id: "PART-01", name: "锅炉本体", type: "设备分区", camera: "G1-01 炉膛出口监控点", metric: "火焰检测 / 炉膛温度异常" },
  { id: "PART-02", name: "炉前作业区", type: "作业分区", camera: "G1-03 炉前主视角", metric: "人员闯入 / 火焰检测" },
  { id: "PART-03", name: "烟道侧区", type: "设备分区", camera: "G1-02 西侧入口监控点", metric: "人员闯入 / 通道占用" },
  { id: "PART-04", name: "检修通道", type: "通道分区", camera: "G1-04 炉前东侧温升点", metric: "设备温升异常" },
];

const INITIAL_SECTIONS = [
  { id: "SEC-01", name: "锅炉本体正视截面", horizontal: "G1-01 炉膛出口", vertical: "G1-03 炉前主视角", direction: "正向", fov: "62°" },
  { id: "SEC-02", name: "炉前东侧热成像截面", horizontal: "G1-04 东侧温升点", vertical: "G1-01 炉膛出口", direction: "逆向", fov: "42°" },
];

function ActionButton({ children, primary = false, danger = false, ...props }) {
  return <button type="button" className={`${primary ? "primary" : ""} ${danger ? "danger" : ""}`} {...props}>{children}</button>;
}

function ViewHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <header className="ela-view-head">
      <span className="ela-view-icon"><Icon size={21} /></span>
      <span><strong>{title}</strong><small>{subtitle}</small></span>
      <div>{children}</div>
    </header>
  );
}

function Status({ children }) {
  const tone = children.includes("运行") || children.includes("在用") || children.includes("正常") || children.includes("闭环") ? "normal"
    : children.includes("待") || children.includes("预警") ? "warning" : "alarm";
  return <em className={`ela-status ${tone}`}><i />{children}</em>;
}

function AdminOverlay({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="ela-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={title}>
        <header><span><strong>{title}</strong><small>{subtitle}</small></span><button type="button" onClick={onClose}><IconX size={17} /></button></header>
        <div className="ela-overlay-body">{children}</div>
        <footer>{footer}</footer>
      </section>
    </div>
  );
}

export function EquipmentLocationAdministration({
  view,
  scopeName,
  onFeedback,
  onOpenSpace,
}) {
  const [rows, setRows] = useState(POSITION_ROWS);
  const [filters, setFilters] = useState({ keyword: "", area: "全部区域", monitoring: "全部监测方式", status: "全部状态" });
  const [editingId, setEditingId] = useState("");
  const [quickEdit, setQuickEdit] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({ category: "不修改", level: "不修改", monitoring: "不修改", owner: "" });
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({ area: true, category: true, level: true, monitoring: true, owner: true, status: true });
  const importRef = useRef(null);
  const [positionInfo, setPositionInfo] = useState({
    code: "EL-BLR-01",
    name: scopeName || "锅炉房",
    area: "锅炉区域",
    category: "锅炉本体",
    tag: "核心生产空间 / 音视频巡检",
    importance: "A级",
    owner: "张工",
    specialty: "锅炉专业",
    monitoring: "音视频在线监测",
    longitude: "121.642815",
    latitude: "29.907226",
    description: "1号锅炉主厂房零米至炉顶设备层，覆盖炉膛、燃烧器、烟风道和辅机巡检范围。",
  });
  const [savedPositionInfo, setSavedPositionInfo] = useState(positionInfo);
  const [archiveSection, setArchiveSection] = useState("ledger");
  const [archiveRecords, setArchiveRecords] = useState(ARCHIVE_ROWS);
  const [archiveMode, setArchiveMode] = useState("archive");
  const [archiveSettingsOpen, setArchiveSettingsOpen] = useState(false);
  const [archiveModules, setArchiveModules] = useState({ ledger: true, alarms: true, defects: true, inspection: true, changes: true, materials: true });
  const [assetDialog, setAssetDialog] = useState("");
  const [assetForm, setAssetForm] = useState({ code: "AV-BOILER-NEW", name: "锅炉房新增音视频设备", model: "HIKVISION DS-2DC4223IW-DE", reason: "" });
  const [materials, setMaterials] = useState([
    { id: "MAT-AV-001", name: "海康球机透明护罩", spec: "DS-1602ZJ 配套", qty: 2, unit: "个", status: "在库" },
    { id: "MAT-AV-002", name: "红外热成像仪防护箱", spec: "IP66 / 304不锈钢", qty: 1, unit: "套", status: "在用" },
    { id: "MAT-AV-003", name: "工业拾音器", spec: "20Hz–20kHz / PoE", qty: 4, unit: "只", status: "在用" },
  ]);
  const [archivePage, setArchivePage] = useState(1);
  const [modelId, setModelId] = useState(MODEL_OPTIONS[0].id);
  const [modelDirty, setModelDirty] = useState(false);
  const [modelTab, setModelTab] = useState("visual");
  const [modelBound, setModelBound] = useState(true);
  const [modelDialog, setModelDialog] = useState("");
  const [pointMappings, setPointMappings] = useState([
    { model: "M-P01 炉膛出口视觉点", actual: "G1-01 炉膛出口监控点", status: "已绑定" },
    { model: "M-P02 西侧入口安防点", actual: "G1-02 西侧入口监控点", status: "已绑定" },
    { model: "M-P03 炉前主视角", actual: "G1-03 炉前主视角", status: "已绑定" },
    { model: "M-P04 东侧热成像点", actual: "G1-04 炉前东侧温升点", status: "已绑定" },
  ]);
  const [partsDialog, setPartsDialog] = useState("");
  const [parts, setParts] = useState(INITIAL_PARTS);
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [detailView, setDetailView] = useState("position");
  const effectiveView = view === "position" ? detailView : view;
  const detailNav = view === "position" ? <nav className="ela-detail-tabs" aria-label="设备位置资料视图">{[
    ["position", "位置信息"],
    ["archive", "位置档案"],
    ["model", "设备模型"],
    ["parts", "设备部件"],
    ["sections", "截面设置"],
  ].map(([id, label]) => <button type="button" className={detailView === id ? "active" : ""} key={id} onClick={() => setDetailView(id)}>{label}</button>)}</nav> : null;

  const filteredRows = useMemo(() => rows.filter((row) => {
    const keyword = filters.keyword.trim().toLowerCase();
    const keywordMatch = !keyword || `${row.id}${row.name}${row.area}${row.category}${row.owner}`.toLowerCase().includes(keyword);
    return keywordMatch
      && (filters.area === "全部区域" || row.area === filters.area)
      && (filters.monitoring === "全部监测方式" || row.monitoring === filters.monitoring)
      && (filters.status === "全部状态" || row.status === filters.status);
  }), [filters, rows]);

  const updateRow = (id, patch) => setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  const toggleRow = (id) => setSelectedRows((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const exportRows = () => {
    const columns = ["位置编码", "位置名称", "区域", "设备分类", "重要等级", "监测方式", "主管人", "配置状态", "测点数"];
    const content = [columns, ...filteredRows.map((row) => [row.id, row.name, row.area, row.category, row.level, row.monitoring, row.owner, row.status, row.points])]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "火电设备位置清单.csv";
    link.click();
    URL.revokeObjectURL(url);
    onFeedback(`已导出 ${filteredRows.length} 条设备位置数据`);
  };
  const importRows = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
      const imported = lines.slice(1, 6).map((line, index) => {
        const cells = line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim());
        return { id: cells[0] || `EL-IMP-${Date.now()}-${index}`, spaceId: "", name: cells[1] || `导入设备空间 ${index + 1}`, type: "设备空间", area: cells[2] || "锅炉区域", category: cells[3] || "待选择", level: cells[4] || "B级", monitoring: cells[5] || "音视频在线监测", owner: cells[6] || "待分配", status: "待配置", points: 0 };
      });
      if (!imported.length) {
        onFeedback("导入文件没有可识别的数据行");
        return;
      }
      setRows((current) => [...imported, ...current.filter((row) => !imported.some((item) => item.id === row.id))]);
      onFeedback(`已导入 ${imported.length} 条设备位置草稿`);
    };
    reader.readAsText(file);
    event.target.value = "";
  };
  const movePart = (index, offset) => setParts((current) => {
    const target = index + offset;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  if (effectiveView === "positions") {
    const activeColumnKeys = ["area", "category", "level", "monitoring", "owner", "status"].filter((key) => visibleColumns[key]);
    const columnWidths = {
      area: "105px",
      category: "120px",
      level: "76px",
      monitoring: "150px",
      owner: "88px",
      status: "96px",
    };
    const gridTemplateColumns = ["34px", "minmax(170px, 1.2fr)", ...activeColumnKeys.map((key) => columnWidths[key]), "142px"].join(" ");
    const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedRows.has(row.id));
    return (
      <>
      <section className="eln-admin">
        <ViewHeader icon={IconListDetails} title="设备位置列表" subtitle="当前组织范围内的主设备空间与音视频监测配置">
          <ActionButton onClick={() => {
            const next = { id: `EL-NEW-${String(rows.length + 1).padStart(2, "0")}`, spaceId: "", name: "新建设备空间", type: "设备空间", area: "锅炉区域", category: "待选择", level: "B级", monitoring: "音视频在线监测", owner: "待分配", status: "待配置", points: 0 };
            setRows((current) => [next, ...current]);
            setEditingId(next.id);
            setQuickEdit(true);
            onFeedback("已新建设备位置草稿，请完成行内编辑");
          }}><IconPlus size={15} />新建设备位置</ActionButton>
          <input ref={importRef} hidden type="file" accept=".csv,text/csv" onChange={importRows} />
          <ActionButton onClick={() => importRef.current?.click()}><IconFileImport size={15} />批量导入</ActionButton>
          <ActionButton onClick={exportRows}><IconDownload size={15} />导出</ActionButton>
          <ActionButton disabled={!selectedRows.size} onClick={() => setBatchOpen(true)}><IconSettings size={15} />批量修改{selectedRows.size ? ` ${selectedRows.size}` : ""}</ActionButton>
          <ActionButton onClick={() => setColumnsOpen(true)}><IconColumns3 size={15} />字段设置</ActionButton>
          <ActionButton primary={quickEdit} onClick={() => setQuickEdit((value) => !value)}><IconEdit size={15} />快速编辑</ActionButton>
        </ViewHeader>
        <div className="ela-filter">
          <label className="ela-search"><IconSearch size={15} /><input value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} placeholder="位置名称 / 编码 / 分类 / 主管人" />{filters.keyword && <button type="button" onClick={() => setFilters({ ...filters, keyword: "" })}><IconX size={13} /></button>}</label>
          <select value={filters.area} onChange={(event) => setFilters({ ...filters, area: event.target.value })}>{["全部区域", "锅炉区域", "汽机区域", "输煤区域", "脱硫区域"].map((item) => <option key={item}>{item}</option>)}</select>
          <select value={filters.monitoring} onChange={(event) => setFilters({ ...filters, monitoring: event.target.value })}>{["全部监测方式", "音视频在线监测", "红外热成像", "声学巡检"].map((item) => <option key={item}>{item}</option>)}</select>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>{["全部状态", "运行中", "待配置"].map((item) => <option key={item}>{item}</option>)}</select>
          <button type="button" onClick={() => setFilters({ keyword: "", area: "全部区域", monitoring: "全部监测方式", status: "全部状态" })}><IconRefresh size={14} />重置</button>
          <span>{filteredRows.length} / {rows.length} 条</span>
        </div>
        <div className="ela-table-wrap">
          <div className="ela-position-table">
            <div className="ela-position-head" style={{ gridTemplateColumns }}><span><input type="checkbox" aria-label="选择全部当前结果" checked={allVisibleSelected} onChange={() => setSelectedRows((current) => {
              const next = new Set(current);
              if (allVisibleSelected) filteredRows.forEach((row) => next.delete(row.id)); else filteredRows.forEach((row) => next.add(row.id));
              return next;
            })} /></span><span>位置编码 / 名称</span>{visibleColumns.area && <span>区域</span>}{visibleColumns.category && <span>设备分类</span>}{visibleColumns.level && <span>重要等级</span>}{visibleColumns.monitoring && <span>监测方式</span>}{visibleColumns.owner && <span>主管人</span>}{visibleColumns.status && <span>配置状态</span>}<span>操作</span></div>
            {filteredRows.map((row) => {
              const editing = quickEdit && editingId === row.id;
              return (
                <div className={`ela-position-row ${row.status === "待配置" ? "blocked" : ""} ${selectedRows.has(row.id) ? "selected" : ""}`} style={{ gridTemplateColumns }} key={row.id} onDoubleClick={() => { setQuickEdit(true); setEditingId(row.id); }}>
                  <span><input type="checkbox" aria-label={`选择${row.name}`} checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)} /></span>
                  <span><b>{row.id}</b>{editing ? <input value={row.name} onChange={(event) => updateRow(row.id, { name: event.target.value })} /> : <small>{row.name}</small>}</span>
                  {visibleColumns.area && <span>{row.area}</span>}
                  {visibleColumns.category && <span>{editing ? <input value={row.category} onChange={(event) => updateRow(row.id, { category: event.target.value })} /> : row.category}</span>}
                  {visibleColumns.level && <span>{editing ? <select value={row.level} onChange={(event) => updateRow(row.id, { level: event.target.value })}><option>A级</option><option>B级</option><option>C级</option></select> : row.level}</span>}
                  {visibleColumns.monitoring && <span>{row.monitoring}<small>{row.points} 个测点</small></span>}
                  {visibleColumns.owner && <span>{editing ? <input value={row.owner} onChange={(event) => updateRow(row.id, { owner: event.target.value })} /> : row.owner}</span>}
                  {visibleColumns.status && <span><Status>{row.status}</Status></span>}
                  <span>{editing ? <button type="button" onClick={() => { setEditingId(""); onFeedback(`${row.name}位置资料已写入页面草稿`); }}><IconCheck size={14} />完成</button> : <><button type="button" onClick={() => { setQuickEdit(true); setEditingId(row.id); }}><IconEdit size={14} />编辑</button>{row.spaceId && <button type="button" onClick={() => onOpenSpace(row.spaceId)}><IconMap2 size={14} />空间图</button>}</>}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {batchOpen && <AdminOverlay title="批量修改设备位置" subtitle={`已选择 ${selectedRows.size} 条设备位置；“不修改”字段保持原值`} onClose={() => setBatchOpen(false)} footer={<><ActionButton onClick={() => setBatchOpen(false)}>取消</ActionButton><ActionButton primary onClick={() => {
        setRows((current) => current.map((row) => {
          if (!selectedRows.has(row.id)) return row;
          return {
            ...row,
            category: batchForm.category === "不修改" ? row.category : batchForm.category,
            level: batchForm.level === "不修改" ? row.level : batchForm.level,
            monitoring: batchForm.monitoring === "不修改" ? row.monitoring : batchForm.monitoring,
            owner: batchForm.owner.trim() || row.owner,
          };
        }));
        setBatchOpen(false);
        onFeedback(`${selectedRows.size} 条设备位置已写入批量修改草稿`);
      }}><IconCheck size={15} />应用修改</ActionButton></>}>
        <div className="ela-overlay-form"><label><span>设备分类</span><select value={batchForm.category} onChange={(event) => setBatchForm({ ...batchForm, category: event.target.value })}><option>不修改</option><option>锅炉本体</option><option>烟风系统</option><option>输煤系统</option><option>汽轮发电机组</option><option>脱硫系统</option></select></label><label><span>重要等级</span><select value={batchForm.level} onChange={(event) => setBatchForm({ ...batchForm, level: event.target.value })}><option>不修改</option><option>A级</option><option>B级</option><option>C级</option></select></label><label><span>监测方式</span><select value={batchForm.monitoring} onChange={(event) => setBatchForm({ ...batchForm, monitoring: event.target.value })}><option>不修改</option><option>音视频在线监测</option><option>红外热成像</option><option>声学巡检</option></select></label><label><span>主管人（留空不修改）</span><input value={batchForm.owner} onChange={(event) => setBatchForm({ ...batchForm, owner: event.target.value })} placeholder="输入主管人" /></label></div>
      </AdminOverlay>}
      {columnsOpen && <AdminOverlay title="列表字段设置" subtitle="控制设备位置列表当前视图的显示字段" onClose={() => setColumnsOpen(false)} footer={<><ActionButton onClick={() => setVisibleColumns({ area: true, category: true, level: true, monitoring: true, owner: true, status: true })}>恢复默认</ActionButton><ActionButton primary onClick={() => { setColumnsOpen(false); onFeedback("列表字段设置已应用"); }}><IconCheck size={15} />应用</ActionButton></>}>
        <div className="ela-column-settings">{Object.entries({ area: "所属区域", category: "设备分类", level: "重要等级", monitoring: "监测方式", owner: "主管人", status: "配置状态" }).map(([key, label]) => <label key={key}><input type="checkbox" checked={visibleColumns[key]} onChange={() => setVisibleColumns({ ...visibleColumns, [key]: !visibleColumns[key] })} /><span><strong>{label}</strong><small>显示在设备位置列表中</small></span></label>)}</div>
      </AdminOverlay>}
      </>
    );
  }

  if (effectiveView === "position") {
    const dirty = JSON.stringify(positionInfo) !== JSON.stringify(savedPositionInfo);
    const field = (label, key, options) => (
      <label><span>{label}</span>{options ? <select value={positionInfo[key]} onChange={(event) => setPositionInfo({ ...positionInfo, [key]: event.target.value })}>{options.map((item) => <option key={item}>{item}</option>)}</select> : <input value={positionInfo[key]} onChange={(event) => setPositionInfo({ ...positionInfo, [key]: event.target.value })} />}</label>
    );
    return (
      <section className="eln-admin">
        <ViewHeader icon={IconMapPin} title="位置信息" subtitle={`${scopeName || positionInfo.name} · 基本属性、分类属性与音视频监测上下文`}>
          <span className={`ela-dirty ${dirty ? "dirty" : ""}`}><i />{dirty ? "有未保存修改" : "信息已同步"}</span>
          <ActionButton disabled={!dirty} onClick={() => setPositionInfo(savedPositionInfo)}>取消</ActionButton>
          <ActionButton primary disabled={!dirty || !positionInfo.code || !positionInfo.name} onClick={() => { setSavedPositionInfo(positionInfo); onFeedback("设备位置信息已保存"); }}><IconCheck size={15} />保存</ActionButton>
        </ViewHeader>
        {detailNav}
        <div className="ela-form-scroll">
          <section className="ela-form-section">
            <header><IconMapPin size={17} /><span><strong>设备位置基本信息</strong><small>位置编码在当前平台范围内唯一</small></span></header>
            <div className="ela-form-grid">
              {field("位置编码 *", "code")}
              {field("位置名称 *", "name")}
              {field("所属区域", "area", ["锅炉区域", "汽机区域", "输煤区域", "脱硫区域", "电气区域"])}
              {field("设备分类", "category", ["锅炉本体", "烟风系统", "输煤系统", "汽轮发电机组", "脱硫系统"])}
              {field("重要等级", "importance", ["A级", "B级", "C级"])}
              {field("主管人", "owner")}
              {field("专业", "specialty", ["锅炉专业", "汽机专业", "输煤专业", "热控专业", "电气专业"])}
              {field("监测方式", "monitoring", ["音视频在线监测", "红外热成像", "声学巡检", "第三方视频监测"])}
              {field("经度", "longitude")}
              {field("纬度", "latitude")}
              <label className="wide"><span>设备标签</span><input value={positionInfo.tag} onChange={(event) => setPositionInfo({ ...positionInfo, tag: event.target.value })} /></label>
              <label className="wide"><span>位置说明</span><textarea value={positionInfo.description} onChange={(event) => setPositionInfo({ ...positionInfo, description: event.target.value })} /></label>
            </div>
          </section>
          <section className="ela-form-section">
            <header><IconDeviceCctv size={17} /><span><strong>音视频巡检关系</strong><small>只读汇总，具体绑定在“测点绑定”页维护</small></span></header>
            <div className="ela-relation-summary">
              <div><small>设备空间图</small><strong>锅炉房设备空间图.png</strong><Status>运行中</Status></div>
              <div><small>已接入设备</small><strong>4 台海康音视频设备</strong><span>3 台可见光 · 1 台红外</span></div>
              <div><small>巡检测点</small><strong>4 个测点 / 4 个已定位</strong><span>8 项算法指标</span></div>
              <div><small>平台版本</small><strong>V12 · 2026-07-28</strong><span>页面草稿与平台版本一致</span></div>
            </div>
          </section>
        </div>
      </section>
    );
  }

  if (effectiveView === "archive") {
    const sections = [...ARCHIVE_SECTIONS, { id: "materials", label: "设备物料清单", count: materials.length }];
    const archiveRows = archiveSection === "materials" ? [] : (archiveRecords[archiveSection] || []);
    const downloadArchive = () => {
      const payload = archiveSection === "materials" ? materials : archiveRows;
      const content = archiveSection === "materials"
        ? [["物料编码", "物料名称", "规格型号", "数量", "单位", "状态"], ...payload.map((item) => [item.id, item.name, item.spec, item.qty, item.unit, item.status])]
        : [["记录编号", "名称/内容", "对象/状态", "处理人/结果", "时间"], ...payload];
      const url = URL.createObjectURL(new Blob([`\uFEFF${content.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `【${scopeName}】位置档案-${archiveSection}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      onFeedback(`${scopeName}档案已导出`);
    };
    return (
      <>
      <section className="eln-admin">
        <ViewHeader icon={IconHistory} title="设备位置档案" subtitle={`${scopeName} · 位置、台账、报警、缺陷和巡检履历统一归档`}>
          <ActionButton onClick={() => onFeedback(`${scopeName}档案数据已刷新`)}><IconRefresh size={15} />刷新</ActionButton>
          <span className="ela-mode-switch"><button type="button" className={archiveMode === "archive" ? "active" : ""} onClick={() => setArchiveMode("archive")}>档案模式</button><button type="button" className={archiveMode === "list" ? "active" : ""} onClick={() => setArchiveMode("list")}>列表模式</button></span>
          <ActionButton onClick={() => setArchiveSettingsOpen(true)}><IconSettings size={15} />档案设置</ActionButton>
          <ActionButton onClick={downloadArchive}><IconDownload size={15} />导出档案</ActionButton>
        </ViewHeader>
        {detailNav}
        <nav className="ela-subtabs">{sections.filter((section) => archiveModules[section.id]).map((section) => <button type="button" className={archiveSection === section.id ? "active" : ""} key={section.id} onClick={() => { setArchiveSection(section.id); setArchivePage(1); }}>{section.label}<em>{section.count}</em></button>)}</nav>
        <div className="ela-archive-summary">
          <span><IconBox size={18} /><b>{scopeName}</b><small>EL-BLR-01</small></span>
          <span><small>运行状态</small><Status>运行中</Status></span>
          <span><small>音视频测点</small><b>4 个</b></span>
          <span><small>待处理报警</small><b className="alarm">1</b></span>
          <span><small>未闭环缺陷</small><b className="warning">2</b></span>
          <span><small>最近巡检</small><b>10:10</b></span>
        </div>
        <div className="ela-table-wrap archive">
          {archiveMode === "archive" && <div className="ela-archive-card-head"><span><strong>{sections.find((item) => item.id === archiveSection)?.label}</strong><small>当前模块以档案卡方式展示，可切换列表模式查看紧凑明细</small></span><div>{archiveSection === "ledger" && <><button type="button" onClick={() => setAssetDialog("add")}>添加在用资产</button><button type="button" onClick={() => setAssetDialog("replace")}>更换资产</button></>}{archiveSection === "materials" && <button type="button" onClick={() => setAssetDialog("material")}>添加物料</button>}</div></div>}
          {archiveSection === "materials" ? <div className={`ela-material-table ${archiveMode}`}>
            <div className="ela-material-head"><span>物料编码</span><span>物料名称</span><span>规格型号</span><span>数量</span><span>单位</span><span>状态</span><span>操作</span></div>
            {materials.slice((archivePage - 1) * 10, archivePage * 10).map((item) => <div className="ela-material-row" key={item.id}><span>{item.id}</span><span>{item.name}</span><span>{item.spec}</span><span><input type="number" min="0" value={item.qty} onChange={(event) => setMaterials((current) => current.map((row) => row.id === item.id ? { ...row, qty: Number(event.target.value) } : row))} /></span><span>{item.unit}</span><span><Status>{item.status}</Status></span><span><button type="button" onClick={() => onFeedback(`${item.name}物料详情已打开`)}>查看</button><button type="button" className="danger" onClick={() => setMaterials((current) => current.filter((row) => row.id !== item.id))}>删除</button></span></div>)}
          </div> : <div className={`ela-archive-table ${archiveMode}`}>
            <div className="ela-archive-head"><span>记录编号</span><span>名称 / 内容</span><span>对象 / 状态</span><span>处理人 / 结果</span><span>时间</span><span>操作</span></div>
            {archiveRows.slice((archivePage - 1) * 10, archivePage * 10).map((row) => <div className="ela-archive-row" key={row[0]}>{row.map((cell, index) => <span key={`${row[0]}-${index}`}>{index === 2 && (cell.includes("待") || cell.includes("预警") || cell.includes("紧急")) ? <Status>{cell}</Status> : cell}</span>)}<span><button type="button" onClick={() => onFeedback(`${row[0]} 详情已打开`)}>查看详情<IconChevronRight size={13} /></button></span></div>)}
          </div>}
          <footer className="ela-pagination"><span>每页 10 条 · 共 {archiveSection === "materials" ? materials.length : archiveRows.length} 条</span><button type="button" disabled={archivePage === 1} onClick={() => setArchivePage((value) => Math.max(1, value - 1))}>上一页</button><em>{archivePage}</em><button type="button" disabled={(archiveSection === "materials" ? materials.length : archiveRows.length) <= archivePage * 10} onClick={() => setArchivePage((value) => value + 1)}>下一页</button></footer>
        </div>
      </section>
      {archiveSettingsOpen && <AdminOverlay title="档案设置" subtitle="控制档案模块显示，并保持当前设备位置的模块顺序" onClose={() => setArchiveSettingsOpen(false)} footer={<><ActionButton onClick={() => setArchiveModules({ ledger: true, alarms: true, defects: true, inspection: true, changes: true, materials: true })}>恢复默认</ActionButton><ActionButton primary onClick={() => { if (!archiveModules[archiveSection]) setArchiveSection("ledger"); setArchiveSettingsOpen(false); onFeedback("档案模块设置已保存"); }}><IconCheck size={15} />保存设置</ActionButton></>}>
        <div className="ela-column-settings">{sections.map((section) => <label key={section.id}><input type="checkbox" checked={archiveModules[section.id]} onChange={() => setArchiveModules({ ...archiveModules, [section.id]: !archiveModules[section.id] })} /><span><strong>{section.label}</strong><small>{section.count} 条关联数据</small></span></label>)}</div>
      </AdminOverlay>}
      {assetDialog && <AdminOverlay title={assetDialog === "replace" ? "更换在用资产" : assetDialog === "material" ? "添加设备物料" : "添加在用资产"} subtitle={assetDialog === "material" ? "新增物料会进入当前设备位置的物料清单" : "资产操作会同步写入位置履历"} onClose={() => setAssetDialog("")} footer={<><ActionButton onClick={() => setAssetDialog("")}>取消</ActionButton><ActionButton primary onClick={() => {
        if (assetDialog === "material") {
          setMaterials((current) => [...current, { id: assetForm.code, name: assetForm.name, spec: assetForm.model, qty: 1, unit: "件", status: "在库" }]);
          setArchiveSection("materials");
        } else {
          const next = [assetForm.code, assetForm.name, assetForm.model, "在用", new Date().toISOString().slice(0, 10)];
          setArchiveRecords((current) => ({ ...current, ledger: assetDialog === "replace" ? [next, ...current.ledger.map((row, index) => index === 0 ? [...row.slice(0, 3), "已更换", row[4]] : row)] : [next, ...current.ledger] }));
          setArchiveSection("ledger");
        }
        onFeedback(assetDialog === "replace" ? "资产更换完成，原资产已转入履历" : assetDialog === "material" ? "设备物料已添加" : "在用资产已添加");
        setAssetDialog("");
      }}><IconCheck size={15} />确认</ActionButton></>}>
        <div className="ela-overlay-form"><label><span>{assetDialog === "material" ? "物料编码" : "资产编码"} *</span><input value={assetForm.code} onChange={(event) => setAssetForm({ ...assetForm, code: event.target.value })} /></label><label><span>{assetDialog === "material" ? "物料名称" : "资产名称"} *</span><input value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} /></label><label className="wide"><span>规格型号</span><input value={assetForm.model} onChange={(event) => setAssetForm({ ...assetForm, model: event.target.value })} /></label>{assetDialog === "replace" && <label className="wide"><span>更换原因 *</span><input value={assetForm.reason} onChange={(event) => setAssetForm({ ...assetForm, reason: event.target.value })} placeholder="填写原资产故障或更换原因" /></label>}</div>
      </AdminOverlay>}
      </>
    );
  }

  if (effectiveView === "model") {
    const currentModel = MODEL_OPTIONS.find((model) => model.id === modelId);
    return (
      <>
      <section className="eln-admin">
        <ViewHeader icon={IconDatabase} title="设备模型" subtitle={`${scopeName} · 绑定空间模板、设备分类属性与音视频巡检参数`}>
          <span className={`ela-dirty ${modelDirty ? "dirty" : ""}`}><i />{!modelBound ? "未绑定模型" : modelDirty ? "模型变更待保存" : "模型已绑定"}</span>
          {modelBound && <><ActionButton onClick={() => setModelDialog("select")}>重新选择</ActionButton><ActionButton onClick={() => setModelDialog("import")}><IconFileImport size={15} />导入实例</ActionButton><ActionButton danger onClick={() => setModelDialog("unbind")}>解除应用</ActionButton><ActionButton primary disabled={!modelDirty} onClick={() => { setModelDirty(false); onFeedback(`${currentModel.name}已绑定到${scopeName}`); }}><IconCheck size={15} />保存模型</ActionButton></>}
        </ViewHeader>
        {detailNav}
        {!modelBound ? <div className="ela-model-empty"><IconDatabase size={44} /><strong>未绑定设备模型</strong><p>绑定模型后可查看空间结构、分类属性、测点模型以及音视频巡检参数。</p><div><ActionButton onClick={() => setModelDialog("import")}><IconFileImport size={15} />导入实例化模型</ActionButton><ActionButton primary onClick={() => setModelDialog("select")}><IconLink size={15} />选择设备模型</ActionButton></div></div> : <div className="ela-model-layout">
          <aside>
            <label><IconSearch size={14} /><input placeholder="搜索模型名称 / 编码" /></label>
            {MODEL_OPTIONS.map((model) => <button type="button" className={modelId === model.id ? "active" : ""} key={model.id} onClick={() => { setModelId(model.id); setModelDirty(true); }}><IconDatabase size={18} /><span><strong>{model.name}</strong><small>{model.id} · {model.version}</small></span><em>{model.status}</em></button>)}
          </aside>
          <div className="ela-model-detail">
            <header><span><IconDatabase size={24} /></span><div><strong>{currentModel.name}</strong><small>{currentModel.id} · {currentModel.version}</small></div><Status>{modelDirty ? "待配置" : "运行中"}</Status></header>
            <nav className="ela-model-tabs"><button type="button" className={modelTab === "visual" ? "active" : ""} onClick={() => setModelTab("visual")}>可视化</button><button type="button" className={modelTab === "data" ? "active" : ""} onClick={() => setModelTab("data")}>数据模型</button><button type="button" className={modelTab === "mapping" ? "active" : ""} onClick={() => setModelTab("mapping")}>测点模型映射</button></nav>
            {modelTab === "visual" && <div className="ela-model-visual"><div><img src={floorPlanAsset} alt={`${scopeName}模型可视化`} /><button type="button" style={{ left: "48%", top: "52%" }}>锅炉本体</button><button type="button" style={{ left: "72%", top: "45%" }}>炉前作业区</button><button type="button" style={{ left: "34%", top: "39%" }}>烟道侧区</button></div><aside><strong>模型结构</strong>{["锅炉房", "锅炉本体", "炉前作业区", "烟道侧区", "检修通道"].map((item, index) => <button type="button" key={item} onDoubleClick={() => onFeedback(`${item}参数编辑已打开`)}><IconChevronRight size={13} /><span>{item}<small>{index ? "部件 / 空间分区" : "主设备空间"}</small></span></button>)}</aside></div>}
            {modelTab === "data" && <div className="ela-model-data"><dl><div><dt>模型节点</dt><dd>{currentModel.nodes}</dd></div><div><dt>属性字段</dt><dd>{currentModel.fields}</dd></div><div><dt>音视频设备类型</dt><dd>4</dd></div><div><dt>巡检指标模板</dt><dd>8</dd></div></dl><section><strong>模型分类特征属性</strong><div className="ela-parameter-grid"><label>空间类型<input defaultValue="封闭式锅炉房" onChange={() => setModelDirty(true)} /></label><label>防爆等级<select defaultValue="常规区域" onChange={() => setModelDirty(true)}><option>常规区域</option><option>防爆区域</option></select></label><label>默认画面比例<select defaultValue="16:9" onChange={() => setModelDirty(true)}><option>16:9</option><option>4:3</option></select></label><label>默认视场角<input defaultValue="60°" onChange={() => setModelDirty(true)} /></label><label>视频接入协议<input defaultValue="海康 SDK / RTSP" onChange={() => setModelDirty(true)} /></label><label>巡检专业<input defaultValue="锅炉专业" onChange={() => setModelDirty(true)} /></label></div></section><footer><IconCircleCheck size={16} /><span>参数编辑写入当前设备模型草稿，保存后形成新的平台模型应用版本。</span></footer></div>}
            {modelTab === "mapping" && <div className="ela-model-mapping"><header><span><strong>测点模型映射</strong><small>设备树音视频测点与模型测点必须一一对应</small></span><button type="button" onClick={() => { setPointMappings((current) => current.map((item) => ({ ...item, status: "已绑定" }))); setModelDirty(true); }}>自动匹配</button></header><div className="ela-mapping-head"><span>模型测点</span><span>实际音视频测点</span><span>绑定状态</span><span>操作</span></div>{pointMappings.map((item, index) => <div className="ela-mapping-row" key={item.model}><span>{item.model}</span><span><select value={item.actual} onChange={(event) => { setPointMappings((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, actual: event.target.value, status: event.target.value ? "已绑定" : "待绑定" } : row)); setModelDirty(true); }}><option value="">请选择测点</option><option>G1-01 炉膛出口监控点</option><option>G1-02 西侧入口监控点</option><option>G1-03 炉前主视角</option><option>G1-04 炉前东侧温升点</option></select></span><span><Status>{item.status}</Status></span><span><button type="button" onClick={() => { setPointMappings((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, actual: "", status: "待绑定" } : row)); setModelDirty(true); }}>解除</button></span></div>)}</div>}
          </div>
        </div>}
      </section>
      {modelDialog && <AdminOverlay title={modelDialog === "import" ? "导入实例化模型" : modelDialog === "unbind" ? "解除设备模型应用" : "选择设备模型"} subtitle={modelDialog === "unbind" ? "解除后测点映射和模型应用将一并删除" : "模型分类与当前设备空间类型必须兼容"} onClose={() => setModelDialog("")} footer={<><ActionButton onClick={() => setModelDialog("")}>取消</ActionButton><ActionButton danger={modelDialog === "unbind"} primary={modelDialog !== "unbind"} onClick={() => {
        if (modelDialog === "unbind") {
          setModelBound(false);
          setModelDirty(false);
          onFeedback("设备模型应用已解除");
        } else {
          setModelBound(true);
          setModelDirty(true);
          onFeedback(modelDialog === "import" ? "实例化模型已导入到页面草稿" : `${currentModel.name}已选择，请检查测点映射`);
        }
        setModelDialog("");
      }}><IconCheck size={15} />{modelDialog === "unbind" ? "确认解除" : "确认选择"}</ActionButton></>}>
        {modelDialog === "unbind" ? <p className="ela-danger-note"><IconAlertTriangle size={18} />当前 4 条测点模型映射将被删除；设备空间图和音视频测点本身不会删除。</p> : <div className="ela-model-selector">{MODEL_OPTIONS.map((model) => <label key={model.id} className={modelId === model.id ? "selected" : ""}><input type="radio" name="model-choice" checked={modelId === model.id} onChange={() => setModelId(model.id)} /><IconDatabase size={20} /><span><strong>{model.name}</strong><small>{model.id} · {model.version} · {model.nodes} 个节点</small></span><em>{model.status}</em></label>)}</div>}
      </AdminOverlay>}
      </>
    );
  }

  if (effectiveView === "parts") {
    return (
      <>
      <section className="eln-admin">
        <ViewHeader icon={IconBox} title="设备部件" subtitle={`${scopeName} · 空间分区、关联测点与巡检指标结构`}>
          <ActionButton onClick={() => setPartsDialog("reference")}><IconLink size={15} />引用</ActionButton>
          <ActionButton onClick={() => setPartsDialog("apply")}><IconSettings size={15} />应用</ActionButton>
          <ActionButton primary onClick={() => setParts((current) => [...current, { id: `PART-${String(current.length + 1).padStart(2, "0")}`, name: "新建设备分区", type: "设备分区", camera: "待关联", metric: "待配置" }])}><IconPlus size={15} />添加部件</ActionButton>
        </ViewHeader>
        {detailNav}
        <div className="ela-parts-overview"><span><IconBox size={19} /><b>{scopeName}</b><small>4 个空间部件 · 4 个已关联测点</small></span><p><IconAlertTriangle size={15} />部件用于组织空间与音视频测点，不改变采集站侧的实时云台或算法参数。</p></div>
        <div className="ela-table-wrap">
          <div className="ela-parts-table">
            <div className="ela-parts-head"><span>顺序</span><span>部件编码 / 名称</span><span>部件类型</span><span>关联音视频测点</span><span>巡检指标</span><span>操作</span></div>
            {parts.map((part, index) => <div className="ela-parts-row" key={part.id}><span>{index + 1}</span><span><b>{part.id}</b><input value={part.name} onChange={(event) => setParts((current) => current.map((item) => item.id === part.id ? { ...item, name: event.target.value } : item))} /></span><span>{part.type}</span><span>{part.camera}</span><span>{part.metric}</span><span><button type="button" disabled={index === 0} onClick={() => movePart(index, -1)} title="上移"><IconArrowUp size={14} /></button><button type="button" disabled={index === parts.length - 1} onClick={() => movePart(index, 1)} title="下移"><IconArrowDown size={14} /></button><button type="button" onClick={() => onFeedback(`${part.name}关联配置已打开`)} title="编辑"><IconEdit size={14} /></button><button type="button" className="danger" onClick={() => setParts((current) => current.filter((item) => item.id !== part.id))} title="删除"><IconTrash size={14} /></button></span></div>)}
          </div>
        </div>
        <footer className="ela-sticky-actions"><span>{parts.length} 个部件 · 修改写入页面草稿</span><ActionButton onClick={() => setParts(INITIAL_PARTS)}>撤销</ActionButton><ActionButton primary onClick={() => onFeedback("设备部件结构已保存到页面草稿")}><IconCheck size={15} />保存部件</ActionButton></footer>
      </section>
      {partsDialog && <AdminOverlay title={partsDialog === "reference" ? "引用同类型设备部件" : "应用到同类型设备"} subtitle={partsDialog === "reference" ? "引用会覆盖当前页面草稿，保存前可以撤销" : "将当前部件、测点关联和指标结构应用到目标设备"} onClose={() => setPartsDialog("")} footer={<><ActionButton onClick={() => setPartsDialog("")}>取消</ActionButton><ActionButton primary onClick={() => { if (partsDialog === "reference") setParts(INITIAL_PARTS.map((item) => ({ ...item, name: item.name.replace("锅炉", "2号锅炉") }))); onFeedback(partsDialog === "reference" ? "已引用2号锅炉房部件结构到页面草稿" : "当前部件结构已应用到2个同类型设备空间"); setPartsDialog(""); }}><IconCheck size={15} />确认{partsDialog === "reference" ? "引用" : "应用"}</ActionButton></>}>
        <div className="ela-target-list">{["2号锅炉房", "3号锅炉房", "锅炉房仿真训练区"].map((name, index) => <label key={name}><input type={partsDialog === "reference" ? "radio" : "checkbox"} name="parts-target" defaultChecked={index === 0 || (partsDialog === "apply" && index === 1)} /><IconBox size={18} /><span><strong>{name}</strong><small>锅炉本体 · {index + 3} 个音视频测点 · 模型 TM-BOILER-01</small></span><Status>{index === 2 ? "待配置" : "运行中"}</Status></label>)}</div>
      </AdminOverlay>}
      </>
    );
  }

  if (effectiveView === "sections") {
    const invalidSections = sections.filter((section) => !section.horizontal || !section.vertical || section.horizontal === "待选择" || section.vertical === "待选择" || section.horizontal === section.vertical);
    return (
      <section className="eln-admin">
        <ViewHeader icon={IconMap2} title="截面设置" subtitle={`${scopeName} · 组合摄像机水平/垂直参考视角，形成可验收空间截面`}>
          <ActionButton primary onClick={() => setSections((current) => [...current, { id: `SEC-${String(current.length + 1).padStart(2, "0")}`, name: "新建音视频截面", horizontal: "待选择", vertical: "待选择", direction: "正向", fov: "60°" }])}><IconPlus size={15} />添加截面</ActionButton>
        </ViewHeader>
        {detailNav}
        <div className="ela-section-intro"><IconMap2 size={22} /><span><strong>空间截面用于位置验收和巡检详情展示</strong><small>水平与垂直参考点不可重复；这里配置的是空间关系，不直接控制摄像机。</small></span></div>
        <div className="ela-table-wrap">
          <div className="ela-sections-table">
            <div className="ela-sections-head"><span>截面编码</span><span>截面名称</span><span>水平参考视角</span><span>垂直参考视角</span><span>观察方向</span><span>视场角</span><span>操作</span></div>
            {sections.map((section) => {
              const invalid = !section.horizontal || !section.vertical || section.horizontal === "待选择" || section.vertical === "待选择" || section.horizontal === section.vertical;
              return <div className={`ela-sections-row ${invalid ? "invalid" : ""}`} key={section.id}><span>{section.id}</span><span><input value={section.name} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, name: event.target.value } : item))} /></span><span><select value={section.horizontal} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, horizontal: event.target.value } : item))}><option>G1-01 炉膛出口</option><option>G1-03 炉前主视角</option><option>G1-04 东侧温升点</option><option>待选择</option></select></span><span><select value={section.vertical} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, vertical: event.target.value } : item))}><option>G1-03 炉前主视角</option><option>G1-01 炉膛出口</option><option>G1-04 东侧温升点</option><option>待选择</option></select></span><span><select value={section.direction} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, direction: event.target.value } : item))}><option>正向</option><option>逆向</option></select></span><span><input value={section.fov} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, fov: event.target.value } : item))} /></span><span><button type="button" disabled={invalid} onClick={() => onFeedback(`${section.name}预览已打开`)}><IconMap2 size={14} />预览</button><button type="button" className="danger" onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}><IconTrash size={14} /></button></span></div>;
            })}
          </div>
        </div>
        <footer className="ela-sticky-actions"><span className={invalidSections.length ? "warning" : ""}>{sections.length} 个截面 · {invalidSections.length ? `${invalidSections.length} 个视角组合待修正` : "视角组合校验通过"}</span><ActionButton onClick={() => setSections(INITIAL_SECTIONS)}>撤销</ActionButton><ActionButton primary disabled={Boolean(invalidSections.length)} onClick={() => onFeedback("空间截面设置已保存到页面草稿")}><IconCheck size={15} />保存截面</ActionButton></footer>
      </section>
    );
  }

  return null;
}
