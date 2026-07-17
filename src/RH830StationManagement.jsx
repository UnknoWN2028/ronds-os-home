import { useMemo, useState } from "react";
import {
  IconAlertTriangle, IconBuildingFactory, IconCamera, IconCheck, IconChevronDown, IconChevronLeft,
  IconChevronRight, IconChevronUp, IconCirclePlus, IconDatabase, IconDeviceFloppy, IconEye,
  IconEyeOff, IconFocusCentered, IconForms, IconInfoCircle, IconLock, IconLockOpen, IconMinus,
  IconPencil, IconPlus, IconSearch, IconSettings, IconTrash, IconVectorBezier2, IconX, IconZoomIn,
  IconZoomOut,
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

function SettingsTable({ rows }) {
  return <table className="rh-settings"><thead><tr><th>属性</th><th>值</th></tr></thead><tbody>{rows.map(([name, value]) => <tr key={name}><td>{name}</td><td><span>{value}<IconChevronDown size={14} /></span></td></tr>)}</tbody></table>;
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

function ConfirmModal({ message, onCancel, onConfirm }) {
  return <Modal title="操作确认" onCancel={onCancel} onConfirm={onConfirm} width="430px" confirmText="确认删除"><div className="rh-confirm"><IconAlertTriangle size={28} /><div><b>{message}</b><p>删除后当前配置将不再展示，请确认是否继续。</p></div></div></Modal>;
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

function AnnotationWorkspace({ flash }) {
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
    flash("数据ID与监测功能绑定成功");
  };
  const updateFeature = (groupId, functionId, changes) => setBindings((current) => current.map((group) => group.id === groupId ? { ...group, functions: group.functions.map((feature) => feature.id === functionId ? { ...feature, ...changes } : feature) } : group));
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
    setConfirm(null);
  };

  return <><div className="rh-annotation-layout"><div className="rh-annotation-main">
    <section className="rh-bind"><div className="rh-bind-field"><span><b>*</b> 数据ID <IconInfoCircle size={14} title="可选择当前已绑定监测设备及下级测点" /></span><button onClick={() => { setDataOpen(!dataOpen); setFunctionOpen(false); }}><span>{selectedData?.path || "请选择设备或测点"}</span><IconChevronDown size={14} /></button>{dataOpen && <DataSelector value={pendingDataId} bindings={bindings} onSelect={chooseData} onClose={() => setDataOpen(false)} />}</div><div className="rh-bind-field"><span><b>*</b> 监测功能</span><button onClick={() => { setFunctionOpen(!functionOpen); setDataOpen(false); }}><span>{pendingFunctions.length ? `已选择 ${pendingFunctions.length} 项` : "请选择监测功能"}</span><IconChevronDown size={14} /></button>{functionOpen && <FunctionSelector selectedIds={pendingFunctions} lockedIds={lockedIds} onChange={setPendingFunctions} onClose={() => setFunctionOpen(false)} />}</div><button className="bind" onClick={bind}><IconPlus size={14} />绑定</button></section>
    <section className="rh-groups">{bindings.map((group) => <article className="rh-group" key={group.id}><header onClick={() => setBindings(bindings.map((item) => item.id === group.id ? { ...item, open: !item.open } : item))}><div><button className="rh-delete-group" title="删除数据ID" onClick={(event) => { event.stopPropagation(); setConfirm({ type: "group", groupId: group.id, message: `确认删除“${group.data.path}”及其全部绑定功能吗？` }); }}><IconTrash size={16} /></button><span>数据ID：</span><a title={group.data.path}>{group.data.path}</a><em>已绑定{group.functions.length}项</em></div><button className="rh-collapse" aria-label={group.open ? "收缩" : "展开"}>{group.open ? <IconChevronDown size={17} /> : <IconChevronRight size={17} />}</button></header>{group.open && <div>{group.functions.map((feature) => <AlgorithmCard key={feature.id} feature={feature} count={group.functions.length} selected={selectedFeature.groupId === group.id && selectedFeature.functionId === feature.id} onSelect={() => setSelectedFeature({ groupId: group.id, functionId: feature.id })} onEditParameters={() => setParameterTarget({ groupId: group.id, functionId: feature.id })} onEditRegions={() => setRegionTarget({ groupId: group.id, functionId: feature.id })} onDelete={() => setConfirm({ type: "feature", groupId: group.id, functionId: feature.id, message: `确认删除监测功能“${feature.name}”吗？` })} onToggleVisible={() => updateFeature(group.id, feature.id, { visible: !feature.visible })} onDescription={(description) => updateFeature(group.id, feature.id, { description })} onColor={(color) => updateFeature(group.id, feature.id, { color })} />)}</div>}</article>)}</section>
  </div><Preview activeFeature={activeFeature} onSnapshot={() => flash("已截取当前可见光快照")} /></div>
  {parameterTarget && <ParameterModal feature={targetFeature(parameterTarget)} onCancel={() => setParameterTarget(null)} onSave={(values) => { const feature = targetFeature(parameterTarget); updateFeature(parameterTarget.groupId, parameterTarget.functionId, { params: feature.params.map((item, index) => [item[0], values[index], item[2]]) }); setParameterTarget(null); flash("参数已保存"); }} />}
  {regionTarget && <AnnotationModal feature={targetFeature(regionTarget)} onCancel={() => setRegionTarget(null)} onSave={({ color, regions }) => { updateFeature(regionTarget.groupId, regionTarget.functionId, { color, regions }); setRegionTarget(null); flash("标注区域已保存"); }} />}
  {confirm && <ConfirmModal message={confirm.message} onCancel={() => setConfirm(null)} onConfirm={confirmDelete} />}</>;
}

function Preview({ activeFeature, onSnapshot }) {
  const [zoom, setZoom] = useState(1);
  const [locked, setLocked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return <section className={`rh-preview ${expanded ? "expanded" : ""}`}><header><span>可见光</span>{expanded && <button onClick={() => setExpanded(false)}><IconX size={18} /></button>}</header><div className="rh-preview-tools"><button className="snapshot" onClick={onSnapshot}><IconCamera size={18} />截取快照</button><i /><button className="active" title="全屏预览" onClick={() => setExpanded(!expanded)}><IconForms size={19} /></button><button title="标注区域"><IconVectorBezier2 size={19} /></button><button title="放大" onClick={() => setZoom(Math.min(1.5, zoom + .1))}><IconZoomIn size={19} /></button><button title="缩小" onClick={() => setZoom(Math.max(.8, zoom - .1))}><IconZoomOut size={19} /></button><button title={locked ? "解锁" : "锁定"} onClick={() => setLocked(!locked)}>{locked ? <IconLock size={19} /> : <IconLockOpen size={19} />}</button></div><div className="rh-camera"><img src={visibleLightImage} alt="RH830 可见光实时画面" style={{ transform: `scale(${zoom})` }} />{activeFeature && !activeFeature.noAnnotation && activeFeature.visible && Array.from({ length: Math.max(1, activeFeature.regions) }, (_, index) => <span key={index} className={`rh-frame frame-${index + 1}`} style={{ borderColor: activeFeature.color }}><em>{activeFeature.name}{index + 1}</em></span>)}<div className="rh-tip">当前功能：{activeFeature?.name || "未选择"}<br />点击功能区可切换对应标注</div></div></section>;
}

function Properties({ code }) {
  return <div className="rh-properties"><aside><button className="active">基本信息</button><button>网络信息</button><button>自检信息</button></aside><div><dl><div><dt>采集站编码</dt><dd>{code}</dd></div><div><dt>物设备模型</dt><dd>RH830NLP</dd></div><div><dt>物设备模型版本</dt><dd></dd></div><div><dt>算法版本</dt><dd>RH830_20251209_V1.3.2</dd></div><div><dt>架构版本</dt><dd>RH830_MPU_A_V1.0.00.0012</dd></div></dl><h4><IconChevronDown size={15} />板信息</h4><table><thead><tr><th>序号</th><th>卡槽</th><th>板类型</th><th>软件版本</th><th>硬件版本</th><th>序列号</th><th>传感器类型</th></tr></thead><tbody><tr><td>1</td><td></td><td>核心板</td><td>RH830_MPU_A_V1.0.00.0012</td><td>1.000</td><td>{code}</td><td></td></tr><tr><td>2</td><td></td><td>辅助板</td><td>1.0.10</td><td>1.0.1</td><td>2</td><td></td></tr></tbody></table></div></div>;
}

export function RH830StationManagement() {
  const [selected, setSelected] = useState("08300008");
  const [codeQuery, setCodeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [treeHidden, setTreeHidden] = useState(false);
  const [primary, setPrimary] = useState("板卡集合");
  const [secondary, setSecondary] = useState("算法标注");
  const [more, setMore] = useState(false);
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState("");
  const selectedStation = stations.find(([code]) => code === selected) || stations[0];
  const filtered = useMemo(() => stations.filter(([code, name]) => code.toLowerCase().includes(codeQuery.trim().toLowerCase()) && name.toLowerCase().includes(nameQuery.trim().toLowerCase())), [codeQuery, nameQuery]);
  const flash = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2000); };
  const content = () => {
    if (primary === "属性") return <Properties code={selected} />;
    if (primary === "常规采集策略") return <SettingsTable rows={[["声音贝偏量", "90"], ["调试日期", "请选择日期"], ["调试周期", "15"]]} />;
    if (secondary === "视频设置") return <SettingsTable rows={[["分辨率", "1920×1080"], ["帧率", "25帧"]]} />;
    if (secondary === "补光设置") return <SettingsTable rows={[["补光设置", "常亮常灭"], ["模式", "灭"]]} />;
    if (secondary === "清洁设置") return <SettingsTable rows={[["清灰周期", "7天"]]} />;
    if (secondary === "定时重启") return <SettingsTable rows={[["重启使能", "开启"], ["重启周期（天）", "1"], ["重启时刻（小时）", "19"], ["重启时刻（分钟）", "34"]]} />;
    if (secondary === "算法参数") return <div className="rh-param-entry"><IconSettings size={28} /><b>算法参数配置</b><span>此标签保持原 RH830 配置内容不变</span></div>;
    return <AnnotationWorkspace flash={flash} />;
  };
  const isAnnotation = primary === "板卡集合" && secondary === "算法标注";

  return <div className="rh-page"><div className={`rh-workbench ${treeHidden ? "tree-hidden" : ""}`}><aside className="rh-tree"><div className="rh-tree-search"><label><input value={codeQuery} onChange={(event) => setCodeQuery(event.target.value)} placeholder="采集站编码" /><IconSearch size={15} /></label><label><input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="采集站名称" /><IconSearch size={15} /></label></div><div className="rh-tree-columns"><span>采集站编码</span><span>采集站名称</span></div><div className="rh-root"><IconMinus size={13} /><IconBuildingFactory size={18} /><span>XX选煤厂XX</span></div><div className="rh-code-list">{filtered.map(([code, name]) => <button key={code} className={selected === code ? "selected" : ""} onClick={() => setSelected(code)}><span><IconDatabase className={onlineCodes.has(code) ? "online" : ""} size={15} />{code}</span><em title={name}>{name}</em></button>)}</div></aside><button className="rh-tree-handle" onClick={() => setTreeHidden(!treeHidden)}>{treeHidden ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}</button><main className={`rh-main ${isAnnotation ? "annotation-mode" : ""}`}><div className="rh-page-label">采集站配置</div><section className="rh-head"><div className="rh-head-top"><label>采集站编号：<select value={selected} onChange={(event) => setSelected(event.target.value)}>{stations.map(([code, name]) => <option key={code} value={code}>XX选煤厂XX (Robot102)/{code} · {name}</option>)}</select></label><div className="rh-actions">{["预览调试", "代理配置", "重启", "设置网络参数", "下达参数"].map((action) => <button key={action} onClick={() => flash(`${action}已执行`)}>{action}</button>)}<div><button onClick={() => setMore(!more)}>更多…<IconChevronDown size={13} /></button>{more && <span className="rh-more"><button onClick={() => flash("配置已导出")}>导出配置</button><button onClick={() => flash("日志已下载")}>下载日志</button></span>}</div><button className="save" onClick={() => flash("采集站配置已保存")}><IconDeviceFloppy size={15} />保存</button></div></div><div className="rh-meta"><span>采集站类型：<b>RH830</b></span><span>采集站名称：<b>{selectedStation[1]}</b></span><span>采集站模型：<b>RH830NLP</b></span><span>模型版本：<b>1.0.0.52</b></span><span>IP：<b>10.2.4.112</b></span></div><div className="rh-device"><span>监测设备：</span><strong>830测试设备</strong><button><IconX size={13} /></button>{added && <><strong>皮带跑偏传感器</strong><button onClick={() => setAdded(false)}><IconX size={13} /></button></>}<button className="add" onClick={() => { setAdded(true); flash("监测设备已添加"); }}><IconCirclePlus size={15} />添加设备</button></div></section><nav className="rh-primary">{["板卡集合", "属性", "常规采集策略"].map((tab) => <button key={tab} className={primary === tab ? "active" : ""} onClick={() => setPrimary(tab)}>{tab}</button>)}</nav>{primary === "板卡集合" && <nav className="rh-secondary">{["视频设置", "补光设置", "清洁设置", "算法标注", "算法参数", "定时重启"].map((tab) => <button key={tab} className={secondary === tab ? "active" : ""} onClick={() => setSecondary(tab)}>{tab}</button>)}</nav>}<section className="rh-body"><div className="rh-content">{content()}</div></section></main></div>{toast && <div className="rh-toast">{toast}</div>}</div>;
}
