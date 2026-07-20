import { useMemo, useState } from "react";
import {
  IconActivity, IconAlertTriangle, IconBuildingFactory, IconCamera, IconCheck, IconChevronDown, IconChevronLeft,
  IconChevronRight, IconChevronUp, IconCirclePlus, IconDatabase, IconDeviceFloppy, IconEye,
  IconEyeOff, IconFocusCentered, IconForms, IconInfoCircle, IconLoader2, IconLock, IconLockOpen,
  IconMinus, IconPencil, IconPlayerPlay, IconPlus, IconPower, IconRefresh, IconSearch, IconServer,
  IconSettings, IconTrash, IconUpload, IconVectorBezier2, IconWifi, IconX, IconZoomIn, IconZoomOut,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import visibleLightImage from "./assets/rh830-visible-light.png";
import "./rh830-station.css";

const stations = [
  ["05601128", "原煤仓东侧"], ["05700001", "一号转载点"], ["05700005", "二号转载点"],
  ["05701111", "主井口"], ["05701223", "筛分车间"], ["05701997", "装车站"],
  ["05706271", "矸石仓"], ["06300006", "配煤仓"], ["08300000", "重锤下方"],
  ["08300008", "重锤正上方"], ["08300009", "驱动滚筒"], ["08300011", "800m皮带中部"],
  ["08300013", "800m皮带尾部"], ["08300038", "机头落料口"], ["08300039", "机尾受料点"],
  ["08300066", "清扫器位置"], ["08300097", "张紧装置"], ["08300100", "一号皮带廊"],
  ["08300101", "二号皮带廊"], ["08300102", "三号皮带廊"], ["08300103", "四号皮带廊"],
  ["08300105", "转载站北侧"], ["08300166", "转载站南侧"], ["08300199", "煤流入口"],
  ["08300200", "煤流出口"], ["08300999", "试验采集站"], ["08301111", "备用站"],
  ["08309901", "仓下给煤机"], ["08309980", "巡检机器人"], ["0830HW28", "硬件测试站"],
];
const onlineCodes = new Set(["08300008", "08300038", "08300039"]);

const dataOptions = [
  { id: "device-830", label: "830测试设备", path: "830测试设备", type: "device", children: [
    { id: "point-status", label: "800m皮带机状态", path: "830测试设备/输送区域/800m皮带机状态", type: "point" },
    { id: "point-head", label: "机头可见光", path: "830测试设备/视频测点/机头可见光", type: "point" },
    { id: "point-tail", label: "机尾可见光", path: "830测试设备/视频测点/机尾可见光", type: "point" },
  ] },
  { id: "device-belt", label: "皮带跑偏传感器", path: "皮带跑偏传感器", type: "device", children: [
    { id: "point-offset", label: "横向偏移量", path: "皮带跑偏传感器/运行参数/横向偏移量", type: "point" },
    { id: "point-speed", label: "皮带速度", path: "皮带跑偏传感器/运行参数/皮带速度", type: "point" },
  ] },
];

const functionCatalog = [
  { group: "智能皮带巡检", functions: [
    { id: "damage", name: "皮带损伤检测", color: "#2f6cf6", regions: 2, params: [["图片质量阈值", "0.5", ""], ["报警回传数据上限", "50", "条/天"], ["连续判断时间", "15", "S"]] },
    { id: "deviation", name: "皮带跑偏检测", color: "#f7a12f", regions: 2, params: [["二级跑偏阈值", "0.06", "M"], ["三级跑偏阈值", "0.09", "M"], ["连续判断时间", "30", "S"]] },
    { id: "tear", name: "皮带边缘撕裂", color: "#e20821", regions: 1, params: [["图片质量阈值", "0.5", ""], ["撕裂置信度", "0.72", ""], ["报警间隔", "5", "S"]] },
    { id: "foreign", name: "皮带异物检测", color: "#12a97a", regions: 1, params: [["异物置信度", "0.68", ""], ["最小目标面积", "120", "px²"]] },
  ] },
  { group: "人员安全识别", functions: [
    { id: "helmet", name: "安全帽佩戴检测", color: "#8b5cf6", regions: 0, noAnnotation: true, params: [["安全帽置信度", "0.75", ""], ["连续判断帧数", "5", "帧"]] },
    { id: "intrusion", name: "人员闯入检测", color: "#00a6a6", regions: 1, params: [["人员置信度", "0.70", ""], ["报警间隔", "10", "S"]] },
  ] },
];

const catalogMap = Object.fromEntries(functionCatalog.flatMap((group) => group.functions.map((item) => [item.id, item])));
const findData = (id) => dataOptions.flatMap((item) => [item, ...item.children]).find((item) => item.id === id);
const createFunction = (id, createdAt = Date.now()) => ({ ...catalogMap[id], createdAt, visible: true, description: "" });

const initialBindings = [
  { id: "point-status", data: findData("point-status"), open: true, functions: [createFunction("damage", 1), createFunction("deviation", 2), createFunction("tear", 3)] },
  { id: "device-830", data: findData("device-830"), open: false, functions: [createFunction("foreign", 4)] },
];

const initialSettings = {
  strategy: { soundLevel: "90", debugDate: "2026-07-20", period: "15" },
  video: { resolution: "1920×1080", frameRate: "25", bitrate: "4", stream: "主码流" },
  fill: { enabled: true, mode: "自动", brightness: "70" },
  clean: { enabled: true, cycle: "7", duration: "15" },
  restart: { enabled: true, cycle: "1", hour: "19", minute: "34" },
  algorithm: { imageQuality: "35", alarmLimit: "50", abnormalLimit: "30", normalLimit: "20" },
};

function Toggle({ value, onChange }) {
  return <button type="button" className={`rh-toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)} aria-pressed={value}><span /></button>;
}

function EditableSettings({ title, description, rows, values, onChange }) {
  return <section className="rh-config-panel"><header><div><b>{title}</b><span>{description}</span></div><em>修改后点击右上角“保存”统一提交</em></header><table className="rh-settings"><thead><tr><th>属性</th><th>值</th><th>说明</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key}><td>{row.label}</td><td>{row.type === "toggle" ? <Toggle value={values[row.key]} onChange={(value) => onChange(row.key, value)} /> : row.type === "select" ? <select value={values[row.key]} onChange={(event) => onChange(row.key, event.target.value)}>{row.options.map((option) => <option key={option}>{option}</option>)}</select> : <label className="rh-setting-input"><input type={row.type || "text"} value={values[row.key]} min={row.min} max={row.max} onChange={(event) => onChange(row.key, event.target.value)} />{row.unit && <span>{row.unit}</span>}</label>}</td><td>{row.help}</td></tr>)}</tbody></table></section>;
}

function Modal({ title, children, onCancel, onConfirm, width = "760px", confirmText = "确定" }) {
  return <div className="rh-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section className="rh-modal" style={{ width }} role="dialog" aria-modal="true" aria-label={title}>
      <header><b>{title}</b><button onClick={onCancel} aria-label="关闭"><IconX size={18} /></button></header>
      <div className="rh-modal-body">{children}</div>
      <footer><button className="primary" onClick={onConfirm}>{confirmText}</button><button onClick={onCancel}>取消</button></footer>
    </section>
  </div>;
}

function ParameterModal({ feature, onCancel, onSave }) {
  const [values, setValues] = useState(() => feature.params.map((item) => item[1]));
  return <Modal title={`参数 - ${feature.name}`} onCancel={onCancel} onConfirm={() => onSave(values)} width="820px">
    <div className="rh-param-head"><b>属性</b><b>值</b></div>
    {feature.params.map(([name, , unit], index) => <div className="rh-param-row" key={name}><span>{name}</span><label><input value={values[index]} onChange={(event) => setValues(values.map((value, valueIndex) => valueIndex === index ? event.target.value : value))} /><i>{unit}</i></label></div>)}
  </Modal>;
}

function AnnotationModal({ feature, onCancel, onSave }) {
  const [color, setColor] = useState(feature.color);
  const [regions, setRegions] = useState(() => Array.from({ length: feature.regions }, (_, index) => ({ name: `标注区域${index + 1}`, color: feature.color })));
  const updateColor = (value) => {
    setColor(value);
    setRegions(regions.map((region) => ({ ...region, color: value })));
  };
  return <Modal title={`标注区域 - ${feature.name}`} onCancel={onCancel} onConfirm={() => onSave({ color, regions: regions.length })} width="960px">
    <div className="rh-region-layout">
      <div className="rh-region-stage"><img src={visibleLightImage} alt="标注区域配置画面" />{regions.map((region, index) => <span key={region.name} className={`rh-region-frame frame-${index + 1}`} style={{ borderColor: region.color }}><em>{region.name}</em></span>)}</div>
      <aside><div className="rh-region-title"><b>区域列表</b><button onClick={() => setRegions([...regions, { name: `标注区域${regions.length + 1}`, color }])}><IconPlus size={14} />新增区域</button></div>{regions.map((region, index) => <div className="rh-region-item" key={`${region.name}-${index}`}><input value={region.name} onChange={(event) => setRegions(regions.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /><input type="color" value={region.color} onChange={(event) => { const next = event.target.value; setRegions(regions.map((item, itemIndex) => itemIndex === index ? { ...item, color: next } : item)); setColor(next); }} aria-label={`${region.name}颜色`} /><button onClick={() => setRegions(regions.filter((_, itemIndex) => itemIndex !== index))}><IconTrash size={15} /></button></div>)}<div className="rh-color-setting"><span>默认标注颜色</span><input type="color" value={color} onChange={(event) => updateColor(event.target.value)} /><code>{color.toUpperCase()}</code></div><p><IconInfoCircle size={15} />在图像上拖动控制点可调整区域，本原型展示区域新增、删除和颜色修改。</p></aside>
    </div>
  </Modal>;
}

function ConfirmModal({ title = "操作确认", message, detail = "该操作将立即生效，请确认是否继续。", confirmText = "确认", onCancel, onConfirm }) {
  return <Modal title={title} onCancel={onCancel} onConfirm={onConfirm} width="430px" confirmText={confirmText}><div className="rh-confirm"><IconAlertTriangle size={28} /><div><b>{message}</b><p>{detail}</p></div></div></Modal>;
}

function ConnectionModal({ type, initialValue, onCancel, onSave }) {
  const isNetwork = type === "network";
  const [form, setForm] = useState(initialValue);
  const update = (key, value) => setForm({ ...form, [key]: value });
  return <Modal title={isNetwork ? "设置网络参数" : "代理配置"} onCancel={onCancel} onConfirm={() => onSave(form)} width="620px">
    <div className="rh-form-grid">
      {!isNetwork && <><label><span>启用代理</span><Toggle value={form.enabled} onChange={(value) => update("enabled", value)} /></label><label><span>代理协议</span><select value={form.protocol} onChange={(event) => update("protocol", event.target.value)}><option>HTTP</option><option>HTTPS</option><option>SOCKS5</option></select></label></>}
      <label><span>{isNetwork ? "IP 地址" : "代理地址"}</span><input value={isNetwork ? form.ip : form.host} onChange={(event) => update(isNetwork ? "ip" : "host", event.target.value)} /></label>
      <label><span>{isNetwork ? "子网掩码" : "代理端口"}</span><input value={isNetwork ? form.mask : form.port} onChange={(event) => update(isNetwork ? "mask" : "port", event.target.value)} /></label>
      <label><span>{isNetwork ? "默认网关" : "用户名"}</span><input value={isNetwork ? form.gateway : form.username} onChange={(event) => update(isNetwork ? "gateway" : "username", event.target.value)} /></label>
      <label><span>{isNetwork ? "首选 DNS" : "密码"}</span><input type={isNetwork ? "text" : "password"} value={isNetwork ? form.dns : form.password} onChange={(event) => update(isNetwork ? "dns" : "password", event.target.value)} /></label>
    </div>
  </Modal>;
}

function DeviceModal({ devices, onCancel, onSave }) {
  const options = ["830测试设备", "皮带跑偏传感器", "机头温度传感器", "清扫器状态监测设备"];
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(devices);
  const visible = options.filter((item) => item.includes(query.trim()));
  const toggle = (item) => setSelected(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item]);
  return <Modal title="添加监测设备" onCancel={onCancel} onConfirm={() => onSave(selected)} width="580px"><div className="rh-device-picker"><label><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入设备名称模糊搜索" /><IconSearch size={16} /></label><div>{visible.map((item) => <button key={item} onClick={() => toggle(item)}><span className={`rh-checkbox ${selected.includes(item) ? "checked" : ""}`}>{selected.includes(item) && <IconCheck size={12} />}</span><IconDatabase size={16} /><span>{item}</span><small>{item === "830测试设备" ? "已关联 3 个测点" : "在线"}</small></button>)}</div></div></Modal>;
}

function PreviewDebugModal({ onCancel, onSnapshot }) {
  const [running, setRunning] = useState(false);
  const [frames, setFrames] = useState(0);
  const toggle = () => {
    setRunning(!running);
    if (!running) setFrames((value) => value + 25);
  };
  return <Modal title="预览调试" onCancel={onCancel} onConfirm={onCancel} confirmText="完成" width="1040px"><div className="rh-debug-layout"><div className="rh-debug-image"><img src={visibleLightImage} alt="可见光调试画面" /><span>LIVE</span></div><aside><h4><IconActivity size={17} />实时状态</h4><dl><div><dt>视频流</dt><dd className="ok">正常</dd></div><div><dt>分辨率</dt><dd>1920 × 1080</dd></div><div><dt>帧率</dt><dd>25 FPS</dd></div><div><dt>延迟</dt><dd>86 ms</dd></div><div><dt>已分析帧数</dt><dd>{frames}</dd></div></dl><button className={running ? "stop" : ""} onClick={toggle}>{running ? <IconPower size={16} /> : <IconPlayerPlay size={16} />}{running ? "停止分析" : "开始分析"}</button><button onClick={onSnapshot}><IconCamera size={16} />截取快照</button><p>{running ? "算法正在分析实时画面，检测结果会同步叠加。" : "点击开始分析以验证当前算法和标注区域。"}</p></aside></div></Modal>;
}

function DataSelector({ value, bindings, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visible = dataOptions.map((device) => ({ ...device, children: device.children.filter((point) => !normalized || `${point.label}${point.path}`.toLowerCase().includes(normalized)) })).filter((device) => !normalized || `${device.label}${device.path}`.toLowerCase().includes(normalized) || device.children.length);
  return <div className="rh-select-popover rh-data-popover"><label><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索设备或测点" /><IconSearch size={15} /></label><div className="rh-option-scroll">{visible.map((device) => <div className="rh-data-branch" key={device.id}><button className={value === device.id ? "chosen" : ""} onClick={() => { onSelect(device.id); onClose(); }}><IconDatabase size={14} /><strong>{device.label}</strong>{value === device.id && <IconCheck size={15} />}</button>{device.children.map((point) => <button className={`point ${value === point.id ? "chosen" : ""}`} key={point.id} onClick={() => { onSelect(point.id); onClose(); }}><span>{point.label}</span>{bindings.some((group) => group.id === point.id) && <small>已绑定</small>}{value === point.id && <IconCheck size={15} />}</button>)}</div>)}</div></div>;
}

function FunctionSelector({ selectedIds, lockedIds, onChange, onClose }) {
  const [activeGroup, setActiveGroup] = useState(functionCatalog[0].group);
  const group = functionCatalog.find((item) => item.group === activeGroup);
  const toggle = (id) => {
    if (lockedIds.includes(id)) return;
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };
  return <div className="rh-select-popover rh-function-popover"><div className="rh-cascade-groups">{functionCatalog.map((item) => <button key={item.group} className={activeGroup === item.group ? "active" : ""} onClick={() => setActiveGroup(item.group)}>{item.group}<IconChevronRight size={14} /></button>)}</div><div className="rh-cascade-functions">{group.functions.map((item) => { const locked = lockedIds.includes(item.id); const checked = selectedIds.includes(item.id); return <button key={item.id} className={locked ? "locked" : ""} onClick={() => toggle(item.id)}><span className={`rh-checkbox ${checked ? "checked" : ""}`}>{checked && <IconCheck size={12} />}</span><span>{item.name}</span>{locked && <small>已绑定</small>}</button>; })}<footer><span>已选 {selectedIds.length} 项</span><button onClick={onClose}>完成</button></footer></div></div>;
}

function AlgorithmCard({ feature, count, selected, onSelect, onEditParameters, onEditRegions, onDelete, onToggleVisible, onDescription, onColor }) {
  const params = feature.params.map(([name, value, unit]) => `${name}：${value}${unit}`).join("，");
  return <article className={`rh-algorithm ${selected ? "selected" : ""}`} onClick={onSelect}>
    <div className="rh-algorithm-title"><span>{feature.name}</span><div>{!feature.noAnnotation && <><button title="图像" onClick={(event) => { event.stopPropagation(); onSelect(); }}><IconForms size={15} /></button><button title={feature.visible ? "隐藏标注" : "显示标注"} onClick={(event) => { event.stopPropagation(); onToggleVisible(); }}>{feature.visible ? <IconEye size={16} /> : <IconEyeOff size={16} />}</button></>}{count > 1 && <button className="danger" onClick={(event) => { event.stopPropagation(); onDelete(); }}><IconTrash size={14} />删除功能</button>}</div></div>
    <div className="rh-function-fields"><div><small>参数</small><button className="rh-text-edit" title={params} onClick={(event) => { event.stopPropagation(); onEditParameters(); }}><span>{params}</span><IconPencil size={15} /></button></div>{feature.noAnnotation ? <div className="rh-no-annotation"><IconInfoCircle size={15} />此功能无需标注</div> : <div><small>标注区域</small><button className="rh-text-edit" onClick={(event) => { event.stopPropagation(); onEditRegions(); }}><span>在图像上框选区域（共{feature.regions}项）</span><IconPencil size={15} /></button></div>} {!feature.noAnnotation && <input className="rh-color-input" type="color" value={feature.color} onClick={(event) => event.stopPropagation()} onChange={(event) => onColor(event.target.value)} title="修改标注颜色" />}<div className="rh-location"><small>监测位置描述 <IconInfoCircle size={13} title="测点在当前部件或设备下对应的具体报警位置，若为空，报警位置中则以测点名称为具体位置" /></small><input value={feature.description} onClick={(event) => event.stopPropagation()} onChange={(event) => onDescription(event.target.value)} placeholder="请输入具体报警位置（非必填）" title="测点在当前部件或设备下对应的具体报警位置，若为空，报警位置中则以测点名称为具体位置" /></div></div>
  </article>;
}

function AnnotationWorkspace({ flash, onDirty }) {
  const [bindings, setBindings] = useState(initialBindings);
  const [pendingDataId, setPendingDataId] = useState("point-status");
  const [pendingFunctions, setPendingFunctions] = useState(["damage", "deviation", "tear"]);
  const [dataOpen, setDataOpen] = useState(false);
  const [functionOpen, setFunctionOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState({ groupId: "point-status", functionId: "damage" });
  const [parameterTarget, setParameterTarget] = useState(null);
  const [regionTarget, setRegionTarget] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const selectedData = findData(pendingDataId);
  const existing = bindings.find((group) => group.id === pendingDataId);
  const lockedIds = existing?.functions.map((item) => item.id) || [];

  const chooseData = (id) => {
    const bound = bindings.find((group) => group.id === id);
    setPendingDataId(id);
    setPendingFunctions(bound?.functions.map((item) => item.id) || []);
  };
  const bind = () => {
    if (!pendingDataId || !pendingFunctions.length) return flash("请选择数据ID和监测功能");
    const data = findData(pendingDataId);
    setBindings((current) => {
      const group = current.find((item) => item.id === pendingDataId);
      if (!group) return [...current, { id: pendingDataId, data, open: true, functions: pendingFunctions.map((id, index) => createFunction(id, Date.now() + index)) }];
      const existingIds = group.functions.map((item) => item.id);
      const appended = pendingFunctions.filter((id) => !existingIds.includes(id)).map((id, index) => createFunction(id, Date.now() + index));
      return current.map((item) => item.id === pendingDataId ? { ...item, open: true, functions: [...item.functions, ...appended].sort((a, b) => a.createdAt - b.createdAt) } : item);
    });
    onDirty();
    flash("数据ID与监测功能绑定成功");
  };
  const updateFeature = (groupId, functionId, changes) => { setBindings((current) => current.map((group) => group.id === groupId ? { ...group, functions: group.functions.map((feature) => feature.id === functionId ? { ...feature, ...changes } : feature) } : group)); onDirty(); };
  const targetFeature = (target) => bindings.find((group) => group.id === target?.groupId)?.functions.find((feature) => feature.id === target?.functionId);
  const activeFeature = targetFeature(selectedFeature) || bindings[0]?.functions[0];
  const confirmDelete = () => {
    if (confirm.type === "group") {
      setBindings((current) => current.filter((group) => group.id !== confirm.groupId));
      flash("数据ID及其绑定功能已删除");
    } else {
      setBindings((current) => current.map((group) => group.id === confirm.groupId ? { ...group, functions: group.functions.filter((feature) => feature.id !== confirm.functionId) } : group).filter((group) => group.functions.length));
      flash("监测功能已删除");
    }
    onDirty();
    setConfirm(null);
  };

  return <><div className="rh-annotation-layout"><div className="rh-annotation-main">
    <section className="rh-bind"><div className="rh-bind-field"><span><b>*</b> 数据ID <IconInfoCircle size={14} title="可选择当前已绑定监测设备及下级测点" /></span><button onClick={() => { setDataOpen(!dataOpen); setFunctionOpen(false); }}><span>{selectedData?.path || "请选择设备或测点"}</span><IconChevronDown size={14} /></button>{dataOpen && <DataSelector value={pendingDataId} bindings={bindings} onSelect={chooseData} onClose={() => setDataOpen(false)} />}</div><div className="rh-bind-field"><span><b>*</b> 监测功能</span><button onClick={() => { setFunctionOpen(!functionOpen); setDataOpen(false); }}><span>{pendingFunctions.length ? `已选择 ${pendingFunctions.length} 项` : "请选择监测功能"}</span><IconChevronDown size={14} /></button>{functionOpen && <FunctionSelector selectedIds={pendingFunctions} lockedIds={lockedIds} onChange={setPendingFunctions} onClose={() => setFunctionOpen(false)} />}</div><button className="bind" onClick={bind}><IconPlus size={14} />绑定</button></section>
    <section className="rh-groups">{bindings.map((group) => <article className="rh-group" key={group.id}><header onClick={() => setBindings(bindings.map((item) => item.id === group.id ? { ...item, open: !item.open } : item))}><div><button className="rh-delete-group" title="删除数据ID" onClick={(event) => { event.stopPropagation(); setConfirm({ type: "group", groupId: group.id, message: `确认删除“${group.data.path}”及其全部绑定功能吗？` }); }}><IconTrash size={16} /></button><span>数据ID：</span><a title={group.data.path}>{group.data.path}</a><em>已绑定{group.functions.length}项</em></div><button className="rh-collapse" aria-label={group.open ? "收缩" : "展开"}>{group.open ? <IconChevronDown size={17} /> : <IconChevronRight size={17} />}</button></header>{group.open && <div>{group.functions.map((feature) => <AlgorithmCard key={feature.id} feature={feature} count={group.functions.length} selected={selectedFeature.groupId === group.id && selectedFeature.functionId === feature.id} onSelect={() => setSelectedFeature({ groupId: group.id, functionId: feature.id })} onEditParameters={() => setParameterTarget({ groupId: group.id, functionId: feature.id })} onEditRegions={() => setRegionTarget({ groupId: group.id, functionId: feature.id })} onDelete={() => setConfirm({ type: "feature", groupId: group.id, functionId: feature.id, message: `确认删除监测功能“${feature.name}”吗？` })} onToggleVisible={() => updateFeature(group.id, feature.id, { visible: !feature.visible })} onDescription={(description) => updateFeature(group.id, feature.id, { description })} onColor={(color) => updateFeature(group.id, feature.id, { color })} />)}</div>}</article>)}</section>
  </div><Preview activeFeature={activeFeature} onSnapshot={() => flash("已截取当前可见光快照")} /></div>
  {parameterTarget && <ParameterModal feature={targetFeature(parameterTarget)} onCancel={() => setParameterTarget(null)} onSave={(values) => { const feature = targetFeature(parameterTarget); updateFeature(parameterTarget.groupId, parameterTarget.functionId, { params: feature.params.map((item, index) => [item[0], values[index], item[2]]) }); setParameterTarget(null); flash("参数已保存"); }} />}
  {regionTarget && <AnnotationModal feature={targetFeature(regionTarget)} onCancel={() => setRegionTarget(null)} onSave={({ color, regions }) => { updateFeature(regionTarget.groupId, regionTarget.functionId, { color, regions }); setRegionTarget(null); flash("标注区域已保存"); }} />}
  {confirm && <ConfirmModal message={confirm.message} detail="删除后当前配置将不再展示，请确认是否继续。" confirmText="确认删除" onCancel={() => setConfirm(null)} onConfirm={confirmDelete} />}</>;
}

function Preview({ activeFeature, onSnapshot }) {
  const [zoom, setZoom] = useState(1);
  const [locked, setLocked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return <section className={`rh-preview ${expanded ? "expanded" : ""}`}><header><span>可见光</span>{expanded && <button onClick={() => setExpanded(false)}><IconX size={18} /></button>}</header><div className="rh-preview-tools"><button className="snapshot" onClick={onSnapshot}><IconCamera size={18} />截取快照</button><i /><button className="active" title="全屏预览" onClick={() => setExpanded(!expanded)}><IconForms size={19} /></button><button title="标注区域"><IconVectorBezier2 size={19} /></button><button title="放大" onClick={() => setZoom(Math.min(1.5, zoom + .1))}><IconZoomIn size={19} /></button><button title="缩小" onClick={() => setZoom(Math.max(.8, zoom - .1))}><IconZoomOut size={19} /></button><button title={locked ? "解锁" : "锁定"} onClick={() => setLocked(!locked)}>{locked ? <IconLock size={19} /> : <IconLockOpen size={19} />}</button></div><div className="rh-camera"><img src={visibleLightImage} alt="RH830 可见光实时画面" style={{ transform: `scale(${zoom})` }} />{activeFeature && !activeFeature.noAnnotation && activeFeature.visible && Array.from({ length: Math.max(1, activeFeature.regions) }, (_, index) => <span key={index} className={`rh-frame frame-${index + 1}`} style={{ borderColor: activeFeature.color }}><em>{activeFeature.name}{index + 1}</em></span>)}<div className="rh-tip">当前功能：{activeFeature?.name || "未选择"}<br />点击功能区可切换对应标注</div></div></section>;
}

function Properties({ code, network, onOpenNetwork, flash }) {
  const [active, setActive] = useState("基本信息");
  const [checking, setChecking] = useState(false);
  const [boardOpen, setBoardOpen] = useState(true);
  const check = () => { setChecking(true); window.setTimeout(() => { setChecking(false); flash("设备自检完成，全部项目正常"); }, 700); };
  return <div className="rh-properties"><aside>{["基本信息", "网络信息", "自检信息"].map((item) => <button key={item} className={active === item ? "active" : ""} onClick={() => setActive(item)}>{item}</button>)}</aside><div className="rh-properties-body">{active === "基本信息" && <div className="rh-property-basic"><dl className="rh-property-grid"><div><dt>采集站编码</dt><dd>{code}</dd></div><div><dt>物设备模型</dt><dd>RH830NLP</dd></div><div><dt>物设备模型版本</dt><dd></dd></div><div><dt>算法版本</dt><dd>RH830_20251209_V1.3.2</dd></div><div><dt>架构版本</dt><dd>RH830_MPU_A_V1.0.00.0012</dd></div><div><dt>温补温控库硬件版本</dt><dd></dd></div></dl><button className="rh-board-title" onClick={() => setBoardOpen(!boardOpen)}>{boardOpen ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />}板信息</button>{boardOpen && <table className="rh-board-table"><thead><tr><th>序号</th><th>卡槽</th><th>板类型</th><th>软件版本</th><th>硬件版本</th><th>序列号</th><th>传感器类型</th><th>通道</th></tr></thead><tbody><tr><td>1</td><td></td><td>核心板</td><td>RH830_MPU_A_V1.0.00.0012</td><td>1.000</td><td>{code}</td><td></td><td></td></tr><tr><td>2</td><td></td><td>辅助板</td><td>1.0.10</td><td>1.0.1</td><td>2</td><td></td><td></td></tr></tbody></table>}<dl className="rh-property-grid rh-property-bottom"><div><dt>采集站同步类型</dt><dd></dd></div><div><dt>最大通道数</dt><dd></dd></div></dl></div>}{active === "网络信息" && <div className="rh-property-section"><div className="rh-section-head"><div><b>网络信息</b><span>当前采集站的有线网络参数</span></div><button onClick={onOpenNetwork}><IconWifi size={16} />编辑网络参数</button></div><dl className="rh-property-grid"><div><dt>IP 地址</dt><dd>{network.ip}</dd></div><div><dt>子网掩码</dt><dd>{network.mask}</dd></div><div><dt>默认网关</dt><dd>{network.gateway}</dd></div><div><dt>首选 DNS</dt><dd>{network.dns}</dd></div><div><dt>连接状态</dt><dd className="rh-ok">已连接</dd></div></dl></div>}{active === "自检信息" && <div className="rh-property-section"><div className="rh-section-head"><div><b>自检信息</b><span>最近自检：2026-07-20 10:36:28</span></div><button onClick={check} disabled={checking}>{checking ? <IconLoader2 className="spin" size={16} /> : <IconRefresh size={16} />}{checking ? "检查中" : "立即自检"}</button></div><table><thead><tr><th>检查项</th><th>结果</th><th>说明</th></tr></thead><tbody>{[["核心板通信", "正常", "响应 12ms"], ["摄像头视频流", "正常", "25 FPS"], ["存储空间", "正常", "剩余 68%"], ["算法服务", "正常", "6 个模型已加载"]].map((row) => <tr key={row[0]}><td>{row[0]}</td><td className="rh-ok">{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>}</div></div>;
}

export function RH830StationManagement() {
  const [selected, setSelected] = useState("08300008");
  const [codeQuery, setCodeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [treeHidden, setTreeHidden] = useState(false);
  const [primary, setPrimary] = useState("板卡集合");
  const [secondary, setSecondary] = useState("算法标注");
  const [more, setMore] = useState(false);
  const [devices, setDevices] = useState(["830测试设备"]);
  const [settings, setSettings] = useState(initialSettings);
  const [network, setNetwork] = useState({ ip: "10.2.4.112", mask: "255.255.255.0", gateway: "10.2.4.1", dns: "10.2.1.10" });
  const [proxy, setProxy] = useState({ enabled: false, protocol: "HTTP", host: "10.2.1.20", port: "8080", username: "rh830", password: "" });
  const [dialog, setDialog] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState("10:36:28");
  const [busyAction, setBusyAction] = useState("");
  const [toast, setToast] = useState("");
  const selectedStation = stations.find(([code]) => code === selected) || stations[0];
  const filtered = useMemo(() => stations.filter(([code, name]) => code.toLowerCase().includes(codeQuery.trim().toLowerCase()) && name.toLowerCase().includes(nameQuery.trim().toLowerCase())), [codeQuery, nameQuery]);
  const flash = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2000); };
  const markDirty = () => setDirty(true);
  const updateSettings = (group, key, value) => { setSettings((current) => ({ ...current, [group]: { ...current[group], [key]: value } })); markDirty(); };
  const finishAction = (progress, success, callback) => { setBusyAction(progress); window.setTimeout(() => { setBusyAction(""); callback?.(); flash(success); }, 700); };
  const save = () => finishAction("正在保存采集站配置…", "采集站配置已保存", () => { setDirty(false); setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false })); });
  const selectStation = (code) => { setSelected(code); setDirty(false); flash(`已切换至采集站 ${code}`); };
  const download = (content, filename, type) => { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 500); };
  const exportConfig = () => { download(JSON.stringify({ station: selected, devices, network, proxy: { ...proxy, password: proxy.password ? "******" : "" }, settings }, null, 2), `RH830-${selected}-config.json`, "application/json"); setMore(false); flash("配置文件已导出"); };
  const exportLog = () => { download(`[2026-07-20 10:36:28] station=${selected} status=online\n[2026-07-20 10:36:29] video=25fps algorithm=ready\n`, `RH830-${selected}-log.txt`, "text/plain"); setMore(false); flash("运行日志已下载"); };
  const snapshot = () => { const anchor = document.createElement("a"); anchor.href = visibleLightImage; anchor.download = `RH830-${selected}-snapshot.png`; anchor.click(); flash("已截取并下载当前可见光快照"); };
  const content = () => {
    if (primary === "属性") return <Properties code={selected} network={network} onOpenNetwork={() => setDialog({ type: "network" })} flash={flash} />;
    if (primary === "常规采集策略") return <EditableSettings title="常规采集策略" description="设置采集站通用调试与采集周期" values={settings.strategy} onChange={(key, value) => updateSettings("strategy", key, value)} rows={[{ key: "soundLevel", label: "声音偏量", type: "number", unit: "dB", help: "环境声音采集修正值" }, { key: "debugDate", label: "调试日期", type: "date", help: "最近一次现场调试日期" }, { key: "period", label: "调试周期", type: "number", unit: "天", help: "到期后生成调试提醒" }]} />;
    if (secondary === "视频设置") return <EditableSettings title="视频设置" description="配置可见光视频流参数" values={settings.video} onChange={(key, value) => updateSettings("video", key, value)} rows={[{ key: "resolution", label: "分辨率", type: "select", options: ["1920×1080", "1280×720", "640×480"], help: "主码流采集分辨率" }, { key: "frameRate", label: "帧率", type: "number", unit: "FPS", help: "支持 1–25 FPS" }, { key: "bitrate", label: "码率", type: "number", unit: "Mbps", help: "视频编码目标码率" }, { key: "stream", label: "默认码流", type: "select", options: ["主码流", "子码流"], help: "算法分析默认使用的码流" }]} />;
    if (secondary === "补光设置") return <EditableSettings title="补光设置" description="设置补光灯的启停模式和亮度" values={settings.fill} onChange={(key, value) => updateSettings("fill", key, value)} rows={[{ key: "enabled", label: "补光使能", type: "toggle", help: "关闭后补光灯保持熄灭" }, { key: "mode", label: "工作模式", type: "select", options: ["自动", "常亮", "常灭"], help: "自动模式根据环境亮度控制" }, { key: "brightness", label: "亮度", type: "number", unit: "%", help: "支持 10%–100%" }]} />;
    if (secondary === "清洁设置") return <EditableSettings title="清洁设置" description="配置镜头自动清灰计划" values={settings.clean} onChange={(key, value) => updateSettings("clean", key, value)} rows={[{ key: "enabled", label: "自动清洁", type: "toggle", help: "按周期启动清灰装置" }, { key: "cycle", label: "清灰周期", type: "number", unit: "天", help: "相邻两次清洁间隔" }, { key: "duration", label: "单次时长", type: "number", unit: "秒", help: "清灰装置单次运行时长" }]} />;
    if (secondary === "定时重启") return <EditableSettings title="定时重启" description="设置采集站自动维护重启计划" values={settings.restart} onChange={(key, value) => updateSettings("restart", key, value)} rows={[{ key: "enabled", label: "重启使能", type: "toggle", help: "开启后按计划自动重启" }, { key: "cycle", label: "重启周期", type: "number", unit: "天", help: "建议不少于 1 天" }, { key: "hour", label: "重启时刻（小时）", type: "number", unit: "时", help: "0–23" }, { key: "minute", label: "重启时刻（分钟）", type: "number", unit: "分", help: "0–59" }]} />;
    if (secondary === "算法参数") return <EditableSettings title="算法参数" description="保持原 RH830 模型级公共参数配置" values={settings.algorithm} onChange={(key, value) => updateSettings("algorithm", key, value)} rows={[{ key: "imageQuality", label: "图片质量阈值", type: "number", help: "低于阈值的图片不进入算法" }, { key: "alarmLimit", label: "报警回传上限", type: "number", unit: "条/天", help: "单日报警数据上传上限" }, { key: "abnormalLimit", label: "异常回传上限", type: "number", unit: "条/天", help: "单日异常数据上传上限" }, { key: "normalLimit", label: "正常回传上限", type: "number", unit: "条/天", help: "单日正常数据上传上限" }]} />;
    return <AnnotationWorkspace flash={flash} onDirty={markDirty} />;
  };
  const isAnnotation = primary === "板卡集合" && secondary === "算法标注";

  return <div className="rh-page"><div className={`rh-workbench ${treeHidden ? "tree-hidden" : ""}`}><aside className="rh-tree"><div className="rh-tree-search"><label><input value={codeQuery} onChange={(event) => setCodeQuery(event.target.value)} placeholder="采集站编码" /><IconSearch size={15} /></label><label><input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="采集站名称" /><IconSearch size={15} /></label></div><div className="rh-tree-columns"><span>采集站编码</span><span>采集站名称</span></div><div className="rh-root"><IconMinus size={13} /><IconBuildingFactory size={18} /><span>XX选煤厂XX</span></div><div className="rh-code-list">{filtered.map(([code, name]) => <button key={code} className={selected === code ? "selected" : ""} onClick={() => selectStation(code)}><span><IconDatabase className={onlineCodes.has(code) ? "online" : ""} size={15} />{code}</span><em title={name}>{name}</em></button>)}{!filtered.length && <div className="rh-tree-empty">未找到匹配的采集站</div>}</div></aside><button className="rh-tree-handle" onClick={() => setTreeHidden(!treeHidden)}>{treeHidden ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}</button><main className={`rh-main ${isAnnotation ? "annotation-mode" : ""}`}><div className="rh-page-label">采集站配置 <small>{dirty ? "有未保存变更" : `已保存 ${savedAt}`}</small></div><section className="rh-head"><div className="rh-head-top"><label>采集站编号：<select value={selected} onChange={(event) => selectStation(event.target.value)}>{stations.map(([code, name]) => <option key={code} value={code}>XX选煤厂XX (Robot102)/{code} · {name}</option>)}</select></label><div className="rh-actions"><button data-action="preview" onClick={() => setDialog({ type: "preview" })}>预览调试</button><button data-action="proxy" onClick={() => setDialog({ type: "proxy" })}>代理配置</button><button data-action="reboot" onClick={() => setDialog({ type: "reboot" })}>重启</button><button data-action="network" onClick={() => setDialog({ type: "network" })}>设置网络参数</button><button data-action="issue" onClick={() => setDialog({ type: "issue" })}>下达参数</button><div><button onClick={() => setMore(!more)}>更多…<IconChevronDown size={13} /></button>{more && <span className="rh-more"><button onClick={exportConfig}>导出配置</button><button onClick={exportLog}>下载日志</button></span>}</div><button className={`save ${dirty ? "dirty" : ""}`} data-action="save" onClick={save}><IconDeviceFloppy size={15} />保存{dirty && <i />}</button></div></div><div className="rh-meta"><span>采集站类型：<b>RH830</b></span><span>采集站名称：<b>{selectedStation[1]}</b></span><span>采集站模型：<b>RH830NLP</b></span><span>模型版本：<b>1.0.0.52</b></span><span>IP：<b>{network.ip}</b></span></div><div className="rh-device"><span>监测设备：</span>{devices.map((device) => <span className="rh-device-chip" key={device}><strong>{device}</strong><button title={`移除${device}`} onClick={() => setDialog({ type: "remove-device", device })}><IconX size={13} /></button></span>)}<button className="add" onClick={() => setDialog({ type: "devices" })}><IconCirclePlus size={15} />添加设备</button></div></section><nav className="rh-primary">{["板卡集合", "属性", "常规采集策略"].map((tab) => <button key={tab} className={primary === tab ? "active" : ""} onClick={() => setPrimary(tab)}>{tab}</button>)}</nav>{primary === "板卡集合" && <nav className="rh-secondary">{["视频设置", "补光设置", "清洁设置", "算法标注", "算法参数", "定时重启"].map((tab) => <button key={tab} className={secondary === tab ? "active" : ""} onClick={() => setSecondary(tab)}>{tab}</button>)}</nav>}<section className="rh-body"><div className="rh-content">{content()}</div></section></main></div>
  {dialog?.type === "preview" && <PreviewDebugModal onCancel={() => setDialog(null)} onSnapshot={snapshot} />}
  {dialog?.type === "proxy" && <ConnectionModal type="proxy" initialValue={proxy} onCancel={() => setDialog(null)} onSave={(value) => { setProxy(value); markDirty(); setDialog(null); flash("代理配置已更新，保存后生效"); }} />}
  {dialog?.type === "network" && <ConnectionModal type="network" initialValue={network} onCancel={() => setDialog(null)} onSave={(value) => { setNetwork(value); markDirty(); setDialog(null); flash("网络参数已更新，保存后生效"); }} />}
  {dialog?.type === "devices" && <DeviceModal devices={devices} onCancel={() => setDialog(null)} onSave={(value) => { setDevices(value); markDirty(); setDialog(null); flash("监测设备关联已更新"); }} />}
  {dialog?.type === "remove-device" && <ConfirmModal title="移除监测设备" message={`确认移除“${dialog.device}”吗？`} detail="设备下测点将不能继续参与新的算法绑定。" confirmText="确认移除" onCancel={() => setDialog(null)} onConfirm={() => { setDevices(devices.filter((item) => item !== dialog.device)); markDirty(); setDialog(null); flash("监测设备已移除"); }} />}
  {dialog?.type === "reboot" && <ConfirmModal title="重启采集站" message={`确认立即重启 ${selected} 吗？`} detail="重启期间视频流和算法服务预计中断约 30 秒。" confirmText="立即重启" onCancel={() => setDialog(null)} onConfirm={() => { setDialog(null); finishAction("正在发送重启指令…", "重启指令已发送，采集站正在重新连接"); }} />}
  {dialog?.type === "issue" && <ConfirmModal title="下达参数" message={`将当前配置下达到 ${selected}`} detail={dirty ? "检测到未保存变更，将先保存配置再下达至采集站。" : "将下达已保存的网络、板卡、算法与策略参数。"} confirmText="确认下达" onCancel={() => setDialog(null)} onConfirm={() => { setDialog(null); finishAction("正在校验并下达参数…", "参数下达成功，采集站已确认", () => { setDirty(false); setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false })); }); }} />}
  {busyAction && <div className="rh-command-status"><IconLoader2 className="spin" size={17} />{busyAction}</div>}{toast && <div className="rh-toast"><IconCheck size={16} />{toast}</div>}</div>;
}
