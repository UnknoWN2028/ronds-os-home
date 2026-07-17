import { useMemo, useState } from "react";
import {
  IconActivity,
  IconAlertTriangle,
  IconAntennaBars5,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconEdit,
  IconMapPin,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconServerBolt,
  IconTrash,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import "./collection-station.css";

const initialStations = [
  { id: 1, name: "原料区采集站", code: "CS-YL-001", area: "原料车间", address: "1号料仓东侧", devices: 18, protocol: "OPC UA", ip: "10.10.12.21", status: "在线", enabled: true, updatedAt: "2026-07-17 15:26:18", owner: "张伟" },
  { id: 2, name: "1号皮带采集站", code: "CS-PD-002", area: "输送廊道", address: "1号廊道中段", devices: 12, protocol: "Modbus TCP", ip: "10.10.12.35", status: "在线", enabled: true, updatedAt: "2026-07-17 15:25:46", owner: "李强" },
  { id: 3, name: "2号皮带采集站", code: "CS-PD-003", area: "输送廊道", address: "2号廊道北端", devices: 16, protocol: "MQTT", ip: "10.10.12.42", status: "离线", enabled: true, updatedAt: "2026-07-17 14:58:03", owner: "王琳" },
  { id: 4, name: "破碎机房采集站", code: "CS-PS-004", area: "破碎车间", address: "控制柜A03", devices: 9, protocol: "Modbus TCP", ip: "10.10.13.18", status: "告警", enabled: true, updatedAt: "2026-07-17 15:21:12", owner: "赵鹏" },
  { id: 5, name: "配电室采集站", code: "CS-PD-005", area: "动力中心", address: "高压配电室", devices: 24, protocol: "IEC 104", ip: "10.10.14.11", status: "在线", enabled: true, updatedAt: "2026-07-17 15:26:02", owner: "周敏" },
  { id: 6, name: "环保监测采集站", code: "CS-HB-006", area: "环保设施区", address: "除尘站二层", devices: 8, protocol: "MQTT", ip: "10.10.15.27", status: "在线", enabled: true, updatedAt: "2026-07-17 15:24:39", owner: "陈浩" },
  { id: 7, name: "成品仓采集站", code: "CS-CP-007", area: "成品仓库", address: "仓库西门", devices: 11, protocol: "OPC UA", ip: "10.10.16.16", status: "离线", enabled: true, updatedAt: "2026-07-17 13:42:07", owner: "刘洋" },
  { id: 8, name: "备用采集站", code: "CS-BY-008", area: "设备间", address: "备件库一层", devices: 0, protocol: "Modbus TCP", ip: "10.10.16.28", status: "已停用", enabled: false, updatedAt: "2026-07-15 09:12:35", owner: "孙悦" },
];

const blankStation = {
  name: "",
  code: "",
  area: "",
  address: "",
  devices: 0,
  protocol: "Modbus TCP",
  ip: "",
  status: "在线",
  enabled: true,
  owner: "",
};

function StatusTag({ status }) {
  const kind = status === "在线" ? "online" : status === "告警" ? "warning" : status === "已停用" ? "disabled" : "offline";
  return <span className={`station-status ${kind}`}><i />{status}</span>;
}

function StationDialog({ station, onClose, onSave }) {
  const [form, setForm] = useState(station ? { ...station } : { ...blankStation });
  const [errors, setErrors] = useState({});
  const editing = Boolean(station);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "请输入采集站名称";
    if (!form.code.trim()) nextErrors.code = "请输入采集站编码";
    if (!form.area.trim()) nextErrors.area = "请输入所属区域";
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(form.ip.trim())) nextErrors.ip = "请输入有效的 IP 地址";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSave({ ...form, devices: Number(form.devices) || 0 });
  };

  return (
    <div className="station-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="station-dialog" onSubmit={submit} aria-label={editing ? "编辑采集站" : "新增采集站"}>
        <header>
          <div>
            <span className="station-dialog-icon"><IconAntennaBars5 size={22} /></span>
            <div><h2>{editing ? "编辑采集站" : "新增采集站"}</h2><p>配置采集站基础信息与接入参数</p></div>
          </div>
          <button type="button" className="station-icon-button" onClick={onClose} aria-label="关闭"><IconX size={20} /></button>
        </header>

        <div className="station-form-grid">
          <label>
            <span>采集站名称 <b>*</b></span>
            <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：原料区采集站" />
            {errors.name && <em>{errors.name}</em>}
          </label>
          <label>
            <span>采集站编码 <b>*</b></span>
            <input value={form.code} onChange={(event) => update("code", event.target.value)} placeholder="例如：CS-YL-009" />
            {errors.code && <em>{errors.code}</em>}
          </label>
          <label>
            <span>所属区域 <b>*</b></span>
            <input value={form.area} onChange={(event) => update("area", event.target.value)} placeholder="请选择或输入区域" />
            {errors.area && <em>{errors.area}</em>}
          </label>
          <label>
            <span>安装位置</span>
            <input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="请输入安装位置" />
          </label>
          <label>
            <span>通信协议</span>
            <select value={form.protocol} onChange={(event) => update("protocol", event.target.value)}>
              <option>Modbus TCP</option><option>OPC UA</option><option>MQTT</option><option>IEC 104</option>
            </select>
          </label>
          <label>
            <span>IP 地址 <b>*</b></span>
            <input value={form.ip} onChange={(event) => update("ip", event.target.value)} placeholder="例如：10.10.12.21" />
            {errors.ip && <em>{errors.ip}</em>}
          </label>
          <label>
            <span>负责人</span>
            <input value={form.owner} onChange={(event) => update("owner", event.target.value)} placeholder="请输入负责人" />
          </label>
          <label>
            <span>接入设备数</span>
            <input type="number" min="0" value={form.devices} onChange={(event) => update("devices", event.target.value)} />
          </label>
        </div>

        <footer>
          <button type="button" className="station-button secondary" onClick={onClose}>取消</button>
          <button type="submit" className="station-button primary">{editing ? "保存修改" : "确认新增"}</button>
        </footer>
      </form>
    </div>
  );
}

export function CollectionStationManagement() {
  const [stations, setStations] = useState(initialStations);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [areaFilter, setAreaFilter] = useState("全部区域");
  const [page, setPage] = useState(1);
  const [dialogStation, setDialogStation] = useState(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const pageSize = 5;

  const areas = useMemo(() => [...new Set(stations.map((station) => station.area))], [stations]);
  const filtered = useMemo(() => stations.filter((station) => {
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || [station.name, station.code, station.area, station.address, station.ip, station.owner].some((value) => String(value).toLowerCase().includes(term));
    const matchesStatus = statusFilter === "全部状态" || station.status === statusFilter;
    const matchesArea = areaFilter === "全部区域" || station.area === areaFilter;
    return matchesQuery && matchesStatus && matchesArea;
  }), [stations, query, statusFilter, areaFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const online = stations.filter((station) => station.status === "在线").length;
  const warning = stations.filter((station) => station.status === "告警").length;
  const devices = stations.reduce((sum, station) => sum + station.devices, 0);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("全部状态");
    setAreaFilter("全部区域");
    setPage(1);
  };

  const saveStation = (station) => {
    if (dialogStation) {
      setStations((current) => current.map((item) => item.id === dialogStation.id ? { ...item, ...station, updatedAt: "2026-07-17 15:32:10" } : item));
      flash("采集站信息已更新");
    } else {
      setStations((current) => [{ ...station, id: Date.now(), updatedAt: "2026-07-17 15:32:10" }, ...current]);
      flash("采集站新增成功");
    }
    setDialogOpen(false);
  };

  const toggleStation = (station) => {
    setStations((current) => current.map((item) => item.id === station.id
      ? { ...item, enabled: !item.enabled, status: item.enabled ? "已停用" : "在线" }
      : item));
    flash(station.enabled ? "采集站已停用" : "采集站已启用");
  };

  const removeStation = (station) => {
    if (window.confirm(`确认删除“${station.name}”吗？此操作不会影响已归档数据。`)) {
      setStations((current) => current.filter((item) => item.id !== station.id));
      flash("采集站已删除");
    }
  };

  return (
    <div className="station-page">
      <section className="station-heading">
        <div><h1>采集站管理</h1><p>统一管理现场采集站、通信状态与设备接入配置</p></div>
        <button className="station-button primary" onClick={() => { setDialogStation(undefined); setDialogOpen(true); }}><IconPlus size={18} />新增采集站</button>
      </section>

      <section className="station-metrics" aria-label="采集站概览">
        <article><span className="metric-icon blue"><IconAntennaBars5 size={23} /></span><div><p>采集站总数</p><strong>{stations.length}</strong><small>座</small></div></article>
        <article><span className="metric-icon green"><IconCircleCheck size={23} /></span><div><p>在线采集站</p><strong>{online}</strong><small>座</small></div></article>
        <article><span className="metric-icon amber"><IconAlertTriangle size={23} /></span><div><p>异常采集站</p><strong>{stations.filter((station) => station.status === "离线").length + warning}</strong><small>座</small></div></article>
        <article><span className="metric-icon violet"><IconServerBolt size={23} /></span><div><p>接入设备</p><strong>{devices}</strong><small>台</small></div></article>
      </section>

      <section className="station-list-card">
        <header className="station-toolbar">
          <div className="station-search"><IconSearch size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="搜索名称、编码、IP 或负责人" /></div>
          <select aria-label="筛选状态" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option>全部状态</option><option>在线</option><option>离线</option><option>告警</option><option>已停用</option></select>
          <select aria-label="筛选区域" value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }}><option>全部区域</option>{areas.map((area) => <option key={area}>{area}</option>)}</select>
          <button className="station-button secondary compact" onClick={resetFilters}><IconRefresh size={17} />重置</button>
          <span className="station-toolbar-count">共 <b>{filtered.length}</b> 个采集站</span>
        </header>

        <div className="station-table-wrap">
          <table className="station-table">
            <thead><tr><th>采集站</th><th>所属区域 / 位置</th><th>接入信息</th><th>设备数</th><th>运行状态</th><th>最近采集时间</th><th>负责人</th><th>操作</th></tr></thead>
            <tbody>
              {rows.map((station) => (
                <tr key={station.id}>
                  <td><div className="station-name-cell"><span><IconAntennaBars5 size={20} /></span><div><strong>{station.name}</strong><small>{station.code}</small></div></div></td>
                  <td><strong className="station-area">{station.area}</strong><small className="station-location"><IconMapPin size={13} />{station.address}</small></td>
                  <td><strong className="station-ip">{station.ip}</strong><small>{station.protocol}</small></td>
                  <td><b className="device-count">{station.devices}</b><small> 台设备</small></td>
                  <td><StatusTag status={station.status} /></td>
                  <td><span className="station-time">{station.updatedAt}</span></td>
                  <td>{station.owner}</td>
                  <td><div className="station-actions"><button onClick={() => { setDialogStation(station); setDialogOpen(true); }} title="编辑"><IconEdit size={17} /></button><button className={station.enabled ? "pause" : "enable"} onClick={() => toggleStation(station)}>{station.enabled ? "停用" : "启用"}</button><button className="delete" onClick={() => removeStation(station)} title="删除"><IconTrash size={17} /></button></div></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="8"><div className="station-empty"><IconSearch size={28} /><strong>没有找到匹配的采集站</strong><span>请调整筛选条件后重试</span></div></td></tr>}
            </tbody>
          </table>
        </div>

        <footer className="station-pagination">
          <span>显示 {filtered.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filtered.length)} 条，共 {filtered.length} 条</span>
          <div><button disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><IconChevronLeft size={17} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => <button key={item} className={safePage === item ? "current" : ""} onClick={() => setPage(item)}>{item}</button>)}<button disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><IconChevronRight size={17} /></button></div>
        </footer>
      </section>

      {dialogOpen && <StationDialog station={dialogStation} onClose={() => setDialogOpen(false)} onSave={saveStation} />}
      {notice && <div className="station-toast"><IconActivity size={18} />{notice}</div>}
    </div>
  );
}
