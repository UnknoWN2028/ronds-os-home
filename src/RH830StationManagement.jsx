import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconActivity,
  IconAlertTriangle,
  IconBuildingFactory,
  IconCamera,
  IconCheck,
  IconChecklist,
  IconHistory,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCirclePlus,
  IconDatabase,
  IconDeviceFloppy,
  IconEye,
  IconEyeOff,
  IconFocusCentered,
  IconForms,
  IconGauge,
  IconInfoCircle,
  IconLoader2,
  IconLock,
  IconLockOpen,
  IconMinus,
  IconPencil,
  IconPlayerPlay,
  IconPointFilled,
  IconPolygon,
  IconPlus,
  IconPower,
  IconRectangle,
  IconRefresh,
  IconSearch,
  IconServer,
  IconSettings,
  IconTrash,
  IconUpload,
  IconVectorBezier2,
  IconWifi,
  IconX,
  IconZoomIn,
  IconZoomOut
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import visibleLightImage from "./assets/rh830-visible-light.png";
import monitorBeltImage from "./assets/monitor-belt-misalignment.png";
import monitorSmokeImage from "./assets/monitor-corridor-smoke.png";
import monitorIdlerImage from "./assets/monitor-idler-anomaly.png";
import monitorIntrusionImage from "./assets/monitor-east-entrance-intrusion.png";
import monitorCounterweightImage from "./assets/monitor-counterweight-anomaly.png";
import monitorMaterialImage from "./assets/monitor-material-off-center.png";
import "./rh830-station.css";
import "./station-control-capability.css";
import "./rh830-station-dark.css";
import { UnifiedStationDeviceOverview } from "./UnifiedStationDeviceOverview.jsx";

const stations = [
  ["HKV01101", "#1锅炉南侧固定枪机", "锅炉区域"],
  ["HKV01102", "#1锅炉燃烧器红外", "锅炉区域"],
  ["HKV01103", "#1锅炉东侧云台球机", "锅炉区域"],
  ["HKV01104", "#1锅炉炉顶汽包枪机", "锅炉区域"],
  ["HKV01105", "#1锅炉磨煤机层云台球机", "锅炉区域"],
  ["HKV01106", "#1锅炉空预器出口红外", "锅炉区域"],
  ["HKV01107", "#1锅炉送风机层固定枪机", "锅炉区域"],
  ["HKV02201", "转载站皮带通廊枪机", "输煤区域"],
  ["HKV02202", "转载站驱动滚筒红外", "输煤区域"],
  ["HKV02203", "转载站落料口云台球机", "输煤区域"],
  ["HKV03301", "#1汽轮机前箱固定枪机", "汽机区域"],
  ["HKV03302", "#1汽机凝汽器层云台球机", "汽机区域"],
  ["HKV03303", "#1汽机润滑油站红外", "汽机区域"],
  ["HKV05501", "脱硫吸收塔入口枪机", "脱硫区域"],
  ["HKV05502", "脱硫浆液循环泵红外", "脱硫区域"],
  ["HKV05503", "脱硫石膏脱水间云台球机", "脱硫区域"],
  ["HKV06601", "220kV主变区域固定枪机", "电气区域"],
  ["HKV06602", "220kV主变套管红外", "电气区域"],
  ["HKV06603", "升压站东侧云台球机", "电气区域"],
  ["05601128", "1号煤仓东侧", "输煤区域"],
  ["05700001", "一号转载点", "输煤区域"],
  ["05700005", "二号转载点", "输煤区域"],
  ["05701111", "1号锅炉给煤层", "锅炉区域"],
  ["05701223", "碎煤机室", "输煤区域"],
  ["05701997", "翻车机室", "输煤区域"],
  ["05706271", "干煤棚", "输煤区域"],
  ["06300006", "2号煤仓", "输煤区域"],
  ["08300000", "重锤下方", "输煤区域"],
  ["08300008", "重锤正上方", "输煤区域"],
  ["08300009", "驱动滚筒", "输煤区域"],
  ["08300011", "800m皮带中部", "输煤区域"],
  ["08300013", "800m皮带尾部", "输煤区域"],
  ["08300038", "机头落料口", "输煤区域"],
  ["08300039", "机尾受料点", "输煤区域"],
  ["08300066", "清扫器位置", "输煤区域"],
  ["08300097", "张紧装置", "输煤区域"],
  ["08300100", "一号皮带廊", "输煤区域"],
  ["08300101", "二号皮带廊", "输煤区域"],
  ["08300102", "三号皮带廊", "输煤区域"],
  ["08300103", "四号皮带廊", "输煤区域"],
  ["08300105", "转载站北侧", "输煤区域"],
  ["08300166", "转载站南侧", "输煤区域"],
  ["08300199", "煤流入口", "输煤区域"],
  ["08300200", "煤流出口", "输煤区域"],
  ["08300999", "移动巡检采集站", "输煤区域"],
  ["08301111", "备用站", "输煤区域"],
  ["08309901", "仓下给煤机", "输煤区域"],
  ["08309980", "巡检机器人", "输煤区域"],
  ["0830HW28", "检修备用采集站", "输煤区域"]
];
const stationRegionOrder = ["锅炉区域", "汽机区域", "输煤区域", "脱硫区域", "电气区域"];
const stationRegionFor = (stationCode) => stations.find(([code]) => code === stationCode)?.[2] || "输煤区域";
const onlineCodes = /* @__PURE__ */ new Set(["HKV01101", "HKV01102", "HKV01103", "HKV01104", "HKV01105", "HKV01106", "HKV01107", "HKV02202", "HKV02203", "HKV03301", "HKV03302", "HKV03303", "HKV05501", "HKV05502", "HKV05503", "HKV06601", "HKV06602", "HKV06603", "08300008", "08300038", "08300039"]);
const createHikvisionDeviceOption = (device, points) => ({
  ...device,
  children: points.map((point, index) => ({
    ...point,
    type: "point",
    vendor: device.vendor,
    model: device.model,
    media: device.media,
    ptz: device.ptz,
    ip: device.ip,
    protocol: device.protocol,
    image: device.image,
    parentId: device.id,
    parentLabel: device.label,
    ptzView: point.ptzView || {
      x: device.ptz ? (index === 0 ? -3 : 5) : 0,
      y: device.ptz ? (index === 0 ? -1 : 2) : 0,
      zoom: device.ptz ? Number((1 + index * 0.6).toFixed(1)) : 1,
      digitalZoom: 1,
      preset: point.presetName || (device.ptz ? `测点预置位 ${index + 1}` : "固定视角")
    }
  }))
});
const dataOptions = [
  createHikvisionDeviceOption(
    { id: "hk-visible-ptz", label: "#1锅炉东侧云台球机", path: "#1锅炉主厂房/东侧平台/#1锅炉东侧云台球机", type: "device", vendor: "Hikvision", model: "DS-2DC4223IW-DE", media: "可见光", ptz: true, ip: "10.10.1.103", protocol: "海康SDK / RTSP", image: monitorIntrusionImage },
    [
      { id: "hk-visible-ptz-boiler-east", label: "炉膛东侧巡检位", path: "#1锅炉东侧云台球机/视频测点/炉膛东侧巡检位", presetName: "炉膛东侧" },
      { id: "hk-visible-ptz-burner-overview", label: "燃烧器层全景位", path: "#1锅炉东侧云台球机/视频测点/燃烧器层全景位", presetName: "燃烧器层全景" }
    ]
  ),
  createHikvisionDeviceOption(
    { id: "hk-thermal-ptz", label: "#1锅炉燃烧器红外", path: "#1锅炉主厂房/燃烧器层/#1锅炉燃烧器红外", type: "device", vendor: "Hikvision", model: "DS-2TD2637T-10", media: "红外", ptz: false, ip: "10.10.1.102", protocol: "海康SDK / RTSP", image: monitorCounterweightImage },
    [
      { id: "hk-thermal-ptz-burner-temperature", label: "燃烧器温度巡检位", path: "#1锅炉燃烧器红外/红外测点/燃烧器温度巡检位", presetName: "燃烧器温度" },
      { id: "hk-thermal-ptz-furnace-hotspot", label: "炉墙热点巡检位", path: "#1锅炉燃烧器红外/红外测点/炉墙热点巡检位", presetName: "炉墙热点" }
    ]
  ),
  createHikvisionDeviceOption(
    { id: "hk-visible-fixed", label: "#1锅炉南侧固定枪机", path: "#1锅炉主厂房/南侧平台/#1锅炉南侧固定枪机", type: "device", vendor: "Hikvision", model: "DS-2CD7A47EWD-XZ", media: "可见光", ptz: false, ip: "10.10.1.101", protocol: "海康SDK / RTSP", image: monitorBeltImage },
    [
      { id: "hk-visible-fixed-south-platform", label: "南侧平台设备巡检位", path: "#1锅炉南侧固定枪机/视频测点/南侧平台设备巡检位", presetName: "固定视角" }
    ]
  ),
  { id: "device-830", label: "RH830综合在线监测单元", path: "RH830综合在线监测单元", type: "device", children: [
    { id: "point-status", label: "310A输煤皮带机状态", path: "RH830综合在线监测单元/输送区域/310A输煤皮带机状态", type: "point" },
    { id: "point-head", label: "机头可见光", path: "RH830综合在线监测单元/视频数据/机头可见光", type: "point" },
    { id: "point-tail", label: "机尾可见光", path: "RH830综合在线监测单元/视频数据/机尾可见光", type: "point" }
  ] },
  { id: "device-belt", label: "皮带跑偏传感器", path: "皮带跑偏传感器", type: "device", children: [
    { id: "point-offset", label: "横向偏移量", path: "皮带跑偏传感器/运行参数/横向偏移量", type: "point" },
    { id: "point-speed", label: "皮带速度", path: "皮带跑偏传感器/运行参数/皮带速度", type: "point" }
  ] },
  { id: "device-head-temperature", label: "机头温度传感器", path: "机头温度传感器", type: "device", children: [
    { id: "point-head-temperature", label: "机头轴承温度", path: "机头温度传感器/温度数据/机头轴承温度", type: "point" },
    { id: "point-head-vibration", label: "机头振动值", path: "机头温度传感器/振动数据/机头振动值", type: "point" }
  ] },
  { id: "device-cleaner", label: "清扫器状态监测设备", path: "清扫器状态监测设备", type: "device", children: [
    { id: "point-cleaner-status", label: "清扫器运行状态", path: "清扫器状态监测设备/状态数据/清扫器运行状态", type: "point" },
    { id: "point-cleaner-current", label: "清扫器电流", path: "清扫器状态监测设备/电气数据/清扫器电流", type: "point" }
  ] }
];
const functionCatalog = [
  { group: "海康原生算法指标", functions: [
    { id: "hk-fire-smoke", name: "烟火识别状态", nativeMetric: true, metricCode: "hik.fire_smoke.status", color: "#e34f4f", regions: 1, params: [["置信度阈值", "0.72", ""], ["连续确认时长", "3", "S"]] },
    { id: "hk-max-temperature", name: "区域最高温度", nativeMetric: true, metricCode: "hik.thermal.max_temperature", color: "#f08a24", regions: 1, params: [["高温报警阈值", "80", "℃"], ["温度修正值", "0", "℃"]] },
    { id: "hk-intrusion", name: "区域入侵状态", nativeMetric: true, metricCode: "hik.vca.intrusion.status", color: "#8b5cf6", regions: 1, params: [["目标持续时间", "2", "S"], ["灵敏度", "60", "%"]] },
    { id: "hk-video-loss", name: "视频信号状态", nativeMetric: true, metricCode: "hik.device.video_signal", color: "#3978e8", regions: 0, noAnnotation: true, params: [["断流判定时间", "5", "S"]] }
  ] },
  { group: "智能皮带巡检", functions: [
    { id: "damage", name: "皮带损伤检测", color: "#2f6cf6", regions: 2, params: [["图片质量阈值", "0.5", ""], ["报警回传数据上限", "50", "条/天"], ["连续判断时间", "15", "S"]] },
    { id: "deviation", name: "皮带跑偏检测", color: "#f7a12f", regions: 2, params: [["二级跑偏阈值", "0.06", "M"], ["三级跑偏阈值", "0.09", "M"], ["连续判断时间", "30", "S"]] },
    { id: "tear", name: "皮带边缘撕裂", color: "#e20821", regions: 1, params: [["图片质量阈值", "0.5", ""], ["撕裂置信度", "0.72", ""], ["报警间隔", "5", "S"]] },
    { id: "foreign", name: "皮带异物检测", color: "#12a97a", regions: 1, params: [["异物置信度", "0.68", ""], ["最小目标面积", "120", "px²"]] }
  ] },
  { group: "人员安全识别", functions: [
    { id: "helmet", name: "安全帽佩戴检测", color: "#8b5cf6", regions: 0, noAnnotation: true, params: [["安全帽置信度", "0.75", ""], ["连续判断帧数", "5", "帧"]] },
    { id: "intrusion", name: "人员闯入检测", color: "#00a6a6", regions: 1, params: [["人员置信度", "0.70", ""], ["报警间隔", "10", "S"]] }
  ] }
];
const catalogMap = Object.fromEntries(functionCatalog.flatMap((group) => group.functions.map((item) => [item.id, item])));
const findData = (id) => dataOptions.flatMap((item) => [item, ...item.children]).find((item) => item.id === id);
const regionPresets = [
  { x: 0.15, y: 0.3, width: 0.44, height: 0.34 },
  { x: 0.62, y: 0.17, width: 0.25, height: 0.26 },
  { x: 0.52, y: 0.58, width: 0.3, height: 0.22 }
];
const createRegionItems = (functionId, color, count) => Array.from({ length: count }, (_, index) => ({
  regionId: `${functionId}-region-${index + 1}`,
  name: `标注区域${index + 1}`,
  color,
  shape: "rectangle",
  ...regionPresets[index % regionPresets.length],
  visible: true,
  order: index,
  usesDefaultColor: true
}));
const getFeatureRegions = (feature) => Array.isArray(feature.regionItems) ? feature.regionItems : createRegionItems(feature.id, feature.color, feature.regions || 0);
let generatedRegionSequence = 0;
const nextRegionId = (functionId) => `${functionId}-region-${Date.now()}-${++generatedRegionSequence}`;
const createFunction = (id, createdAt = Date.now()) => {
  const template = catalogMap[id];
  return { ...template, createdAt, visible: true, description: "", regionItems: createRegionItems(id, template.color, template.regions || 0) };
};
const initialBindings = [
  { id: "point-status", data: findData("point-status"), open: true, functions: [createFunction("damage", 1), createFunction("deviation", 2), createFunction("tear", 3)] },
  { id: "device-830", data: findData("device-830"), open: false, functions: [createFunction("foreign", 4)] }
];
const initialHikvisionBindings = [
  { id: "hk-visible-ptz", data: findData("hk-visible-ptz"), open: true, functions: [createFunction("hk-fire-smoke", 1), createFunction("hk-intrusion", 2)] },
  { id: "hk-visible-ptz-boiler-east", data: findData("hk-visible-ptz-boiler-east"), open: true, functions: [createFunction("hk-intrusion", 3)] },
  { id: "hk-thermal-ptz", data: findData("hk-thermal-ptz"), open: true, functions: [createFunction("hk-max-temperature", 4)] }
];
const cloneBindings = (source = initialBindings) => source.map((group) => ({
  ...group,
  data: { ...group.data, ptzView: group.data?.ptzView ? { ...group.data.ptzView } : undefined },
  functions: group.functions.map((feature) => ({
    ...feature,
    params: feature.params.map((parameter) => [...parameter]),
    regionItems: getFeatureRegions(feature).map((region) => ({ ...region }))
  }))
}));
const cloneDeviceRecords = (records = []) => records.map((device) => ({
  ...device,
  collectionStationRegion: device.collectionStationRegion || stationRegionFor(device.collectionStationCode),
  algorithms: [...(device.algorithms || [])]
}));
const cloneSettings = (source = initialSettings) => Object.fromEntries(Object.entries(source).map(([key, value]) => {
  const cloned = { ...value };
  if (Array.isArray(value.deviceRecords)) cloned.deviceRecords = cloneDeviceRecords(value.deviceRecords);
  return [key, cloned];
}));
const initialSettings = {
  strategy: { soundLevel: "90", debugDate: "2026-07-20", period: "15" },
  video: { resolution: "1920×1080", frameRate: "25", bitrate: "4", stream: "主码流" },
  fill: { enabled: true, mode: "自动", brightness: "70" },
  clean: { enabled: true, cycle: "7", duration: "15" },
  restart: { enabled: true, cycle: "1", hour: "19", minute: "34" },
  algorithm: { imageQuality: "35", alarmLimit: "50", abnormalLimit: "30", normalLimit: "20" },
  hikvision: { accessProtocol: "ISAPI + ONVIF", streamTransport: "RTSP / TCP", servicePort: "8000", rtspPort: "554", timeout: "5", metricSync: true }
};
const settingsPanels = {
  strategy: {
    title: "常规采集策略",
    description: "设置采集站通用调试与采集周期",
    primary: "常规采集策略",
    rows: [
      { key: "soundLevel", label: "声音偏量", type: "number", min: -30, max: 120, unit: "dB", help: "支持 -30–120 dB" },
      { key: "debugDate", label: "调试日期", type: "date", required: true, help: "最近一次现场调试日期" },
      { key: "period", label: "调试周期", type: "number", min: 1, max: 365, integer: true, unit: "天", help: "支持 1–365 天" }
    ]
  },
  video: {
    title: "视频设置",
    description: "配置可见光视频流参数",
    primary: "板卡集合",
    secondary: "视频设置",
    rows: [
      { key: "resolution", label: "分辨率", type: "select", options: ["1920×1080", "1280×720", "640×480"], help: "主码流采集分辨率" },
      { key: "frameRate", label: "帧率", type: "number", min: 1, max: 25, integer: true, unit: "FPS", help: "支持 1–25 FPS" },
      { key: "bitrate", label: "码率", type: "number", min: 1, max: 50, step: 0.5, unit: "Mbps", help: "支持 1–50 Mbps" },
      { key: "stream", label: "默认码流", type: "select", options: ["主码流", "子码流"], help: "算法分析默认使用的码流" }
    ]
  },
  fill: {
    title: "补光设置",
    description: "设置补光灯的启停模式和亮度",
    primary: "板卡集合",
    secondary: "补光设置",
    rows: [
      { key: "enabled", label: "补光使能", type: "toggle", help: "关闭后补光灯保持熄灭" },
      { key: "mode", label: "工作模式", type: "select", options: ["自动", "常亮", "常灭"], disabledWhen: (values) => !values.enabled, help: "自动模式根据环境亮度控制" },
      { key: "brightness", label: "亮度", type: "number", min: 10, max: 100, integer: true, unit: "%", disabledWhen: (values) => !values.enabled, help: "支持 10%–100%" }
    ]
  },
  clean: {
    title: "清洁设置",
    description: "配置镜头自动清灰计划",
    primary: "板卡集合",
    secondary: "清洁设置",
    rows: [
      { key: "enabled", label: "自动清洁", type: "toggle", help: "按周期启动清灰装置" },
      { key: "cycle", label: "清灰周期", type: "number", min: 1, max: 365, integer: true, unit: "天", disabledWhen: (values) => !values.enabled, help: "支持 1–365 天" },
      { key: "duration", label: "单次时长", type: "number", min: 1, max: 600, integer: true, unit: "秒", disabledWhen: (values) => !values.enabled, help: "支持 1–600 秒" }
    ]
  },
  restart: {
    title: "定时重启",
    description: "设置采集站自动维护重启计划",
    primary: "板卡集合",
    secondary: "定时重启",
    rows: [
      { key: "enabled", label: "重启使能", type: "toggle", help: "开启后按计划自动重启" },
      { key: "cycle", label: "重启周期", type: "number", min: 1, max: 365, integer: true, unit: "天", disabledWhen: (values) => !values.enabled, help: "支持 1–365 天" },
      { key: "hour", label: "重启时刻（小时）", type: "number", min: 0, max: 23, integer: true, unit: "时", disabledWhen: (values) => !values.enabled, help: "支持 0–23" },
      { key: "minute", label: "重启时刻（分钟）", type: "number", min: 0, max: 59, integer: true, unit: "分", disabledWhen: (values) => !values.enabled, help: "支持 0–59" }
    ]
  },
  algorithm: {
    title: "算法参数",
    description: "保持原 RH830 模型级公共参数配置",
    primary: "板卡集合",
    secondary: "算法参数",
    rows: [
      { key: "imageQuality", label: "图片质量阈值", type: "number", min: 0, max: 100, step: 1, unit: "%", help: "支持 0–100%" },
      { key: "alarmLimit", label: "报警回传上限", type: "number", min: 0, max: 1e4, integer: true, unit: "条/天", help: "支持 0–10000 条/天" },
      { key: "abnormalLimit", label: "异常回传上限", type: "number", min: 0, max: 1e4, integer: true, unit: "条/天", help: "支持 0–10000 条/天" },
      { key: "normalLimit", label: "正常回传上限", type: "number", min: 0, max: 1e4, integer: true, unit: "条/天", help: "支持 0–10000 条/天" }
    ]
  }
  ,
  hikvision: {
    title: "海康设备接入",
    description: "统一配置视频流、设备控制与原生算法指标通道",
    primary: "板卡集合",
    secondary: "算法标注",
    rows: [
      { key: "accessProtocol", label: "设备接入方式", type: "select", options: ["ISAPI + ONVIF", "仅 ISAPI", "仅 ONVIF"], help: "优先使用 ISAPI 同步海康原生能力" },
      { key: "streamTransport", label: "视频流传输", type: "select", options: ["RTSP / TCP", "RTSP / UDP"], help: "交付环境默认使用 TCP 保证稳定性" },
      { key: "servicePort", label: "SDK 服务端口", type: "number", min: 1, max: 65535, integer: true, help: "海康设备服务端口" },
      { key: "rtspPort", label: "RTSP 端口", type: "number", min: 1, max: 65535, integer: true, help: "主/子码流拉流端口" },
      { key: "timeout", label: "连接超时", type: "number", min: 1, max: 30, integer: true, unit: "S", help: "支持 1–30 秒" },
      { key: "metricSync", label: "原生算法指标同步", type: "toggle", help: "自动发现并同步海康算法指标" }
    ]
  }
};
const validateSettingRow = (row, rawValue, values) => {
  if (row.disabledWhen?.(values)) return "";
  const value = String(rawValue ?? "").trim();
  if (row.required && !value) return "此项不能为空";
  if (row.type !== "number") return "";
  if (!value) return "请输入数值";
  const number = Number(value);
  if (!Number.isFinite(number)) return "请输入合法数字";
  if (row.integer && !Number.isInteger(number)) return "请输入整数";
  if (row.min !== void 0 && number < row.min) return `不能小于 ${row.min}`;
  if (row.max !== void 0 && number > row.max) return `不能大于 ${row.max}`;
  return "";
};
const validateStationSettings = (settings) => {
  for (const [group, panel] of Object.entries(settingsPanels)) {
    for (const row of panel.rows) {
      const message = validateSettingRow(row, settings[group][row.key], settings[group]);
      if (message) return { group, key: row.key, message: `${row.label}：${message}`, ...panel };
    }
  }
  return null;
};
const createDefaultStationProfile = (code) => {
  const stationIndex = Math.max(0, stations.findIndex(([stationCode]) => stationCode === code));
  const hikvision = code.startsWith("HKV");
  const stationCameraRecords = hikvision ? getHikvisionDevicesForStation(code) : [];
  const stationSettings = cloneSettings(initialSettings);
  if (hikvision) {
    stationSettings.hikvision = {
      ...stationSettings.hikvision,
      stationCode: code,
      deviceRecords: cloneDeviceRecords(stationCameraRecords)
    };
  }
  return {
    settings: stationSettings,
    network: { ip: hikvision ? stationCameraRecords[0]?.ip || "0.0.0.0" : `10.2.4.${code === "08300008" ? 112 : 100 + stationIndex}`, mask: "255.255.255.0", gateway: "10.2.4.1", dns: "10.2.1.10" },
    proxy: { enabled: false, protocol: "HTTP", host: "10.2.1.20", port: "8080", username: "rh830", password: "" },
    devices: hikvision ? stationCameraRecords.map((device) => device.name) : ["RH830综合在线监测单元"],
    bindings: cloneBindings(hikvision ? createHikvisionBindingsForStation(code) : initialBindings),
    savedAt: "10:36:28",
    version: 42,
    issuedVersion: 42,
    issuedAt: "10:35:12"
  };
};
const cloneProfile = (profile) => ({
  settings: cloneSettings(profile.settings),
  network: { ...profile.network },
  proxy: { ...profile.proxy },
  devices: [...profile.devices],
  bindings: cloneBindings(profile.bindings),
  savedAt: profile.savedAt,
  version: profile.version,
  issuedVersion: profile.issuedVersion ?? profile.version,
  issuedAt: profile.issuedAt || profile.savedAt
});
const comparableBindings = (bindings) => bindings.map(({ open, ...group }) => ({ ...group, functions: group.functions.map((feature) => ({ ...feature })) }));
const sameConfig = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const stationSectionMeta = {
  hikvision: { label: "海康设备接入", primary: "板卡集合", secondary: "算法标注" },
  devices: { label: "监测设备", primary: "板卡集合", secondary: "算法标注" },
  network: { label: "网络参数", primary: "属性" },
  proxy: { label: "代理配置", primary: "属性" },
  strategy: { label: "常规采集策略", primary: "常规采集策略" },
  video: { label: "视频设置", primary: "板卡集合", secondary: "视频设置" },
  fill: { label: "补光设置", primary: "板卡集合", secondary: "补光设置" },
  clean: { label: "清洁设置", primary: "板卡集合", secondary: "清洁设置" },
  restart: { label: "定时重启", primary: "板卡集合", secondary: "定时重启" },
  algorithm: { label: "算法参数", primary: "板卡集合", secondary: "算法参数" },
  annotation: { label: "算法标注", primary: "板卡集合", secondary: "算法标注" }
};
function Toggle({ value, onChange }) {
  return <button type="button" className={`rh-toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)} aria-pressed={value} aria-label={value ? "已开启，点击关闭" : "已关闭，点击开启"}>
<span />
</button>;
}
function EditableSettings({ title, description, rows, values, onChange }) {
  return <section className="rh-config-panel">
<header>
<div>
<b>{title}</b>
<span>{description}</span>
</div>
<em>修改后点击右上角“保存”统一提交</em>
</header>
<table className="rh-settings">
<thead>
<tr>
<th>属性</th>
<th>值</th>
<th>说明</th>
</tr>
</thead>
<tbody>{rows.map((row) => {
    const disabled = Boolean(row.disabledWhen?.(values));
    const error = validateSettingRow(row, values[row.key], values);
    return <tr key={row.key} className={error ? "invalid" : disabled ? "disabled" : ""}>
<td>{row.label}</td>
<td>{row.type === "toggle" ? <Toggle value={values[row.key]} onChange={(value) => onChange(row.key, value)} /> : row.type === "select" ? <select disabled={disabled} value={values[row.key]} onChange={(event) => onChange(row.key, event.target.value)}>{row.options.map((option) => <option key={option}>{option}</option>)}</select> : <>
<label className="rh-setting-input">
<input type={row.type || "text"} value={values[row.key]} min={row.min} max={row.max} step={row.step} disabled={disabled} aria-invalid={Boolean(error)} onChange={(event) => onChange(row.key, event.target.value)} />{row.unit && <span>{row.unit}</span>}</label>{error && <small className="rh-setting-error">
<IconAlertTriangle size={13} />{error}</small>}</>}</td>
<td>{disabled ? "当前功能关闭，保存值但暂不生效" : row.help}</td>
</tr>;
  })}</tbody>
</table>
</section>;
}
function Modal({ title, children, onCancel, onConfirm, width = "760px", confirmText = "确定", secondaryText = "", onSecondary, secondaryDisabled = false, secondaryTone = "danger", cancelDisabled = false, confirmDisabled = false }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const focusables = () => Array.from(dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || []);
    const initialFocus = dialogRef.current?.querySelector(".rh-modal-body input:not([disabled]), .rh-modal-body select:not([disabled]), footer .primary:not([disabled]), header button");
    initialFocus?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, []);
  return <div className="rh-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section ref={dialogRef} className="rh-modal" style={{ width }} role="dialog" aria-modal="true" aria-label={title}>
      <header>
<b>{title}</b>
<button onClick={onCancel} aria-label="关闭" disabled={cancelDisabled}>
<IconX size={18} />
</button>
</header>
      <div className="rh-modal-body">{children}</div>
      <footer>
<button className="primary" onClick={onConfirm} disabled={confirmDisabled}>{confirmText}</button>{secondaryText && <button className={`secondary-action ${secondaryTone}`} onClick={onSecondary} disabled={secondaryDisabled}>{secondaryText}</button>}<button onClick={onCancel} disabled={cancelDisabled}>取消</button>
</footer>
    </section>
  </div>;
}
const getParameterRule = (name, unit) => {
  if (/置信度|图片质量阈值/.test(name)) return { min: 0, max: 1, step: 0.01, hint: "0–1" };
  if (/回传.*上限/.test(name)) return { min: 0, max: 1e4, step: 1, hint: "0–10000", integer: true };
  if (/连续判断帧数/.test(name)) return { min: 1, max: 1e3, step: 1, hint: "1–1000", integer: true };
  if (/时间|间隔/.test(name)) return { min: 0.1, max: 3600, step: 0.1, hint: "0.1–3600" };
  if (/面积/.test(name)) return { min: 1, max: 1e5, step: 1, hint: "1–100000", integer: true };
  if (unit === "M") return { min: 0, max: 10, step: 0.01, hint: "0–10" };
  return { min: 0, max: 1e4, step: 0.01, hint: "0–10000" };
};
const validateAlgorithmBindings = (bindings) => {
  for (const group of bindings) {
    for (const feature of group.functions) {
      for (const [name, rawValue, unit] of feature.params) {
        const rule = getParameterRule(name, unit);
        const value = String(rawValue).trim();
        const numericValue = Number(value);
        if (!value || !Number.isFinite(numericValue) || numericValue < rule.min || numericValue > rule.max) return { groupId: group.id, functionId: feature.id, message: `${feature.name}的“${name}”不在允许范围 ${rule.hint}` };
        if (rule.integer && !Number.isInteger(numericValue)) return { groupId: group.id, functionId: feature.id, message: `${feature.name}的“${name}”必须为整数` };
      }
      if ((feature.description || "").trim().length > 50) return { groupId: group.id, functionId: feature.id, message: `${feature.name}的监测位置描述不能超过 50 个字符` };
      if (feature.noAnnotation) continue;
      const regions = getFeatureRegions(feature);
      if (!regions.length) return { groupId: group.id, functionId: feature.id, message: `${feature.name}尚未配置标注区域` };
      const names = regions.map((region) => region.name.trim());
      if (names.some((name) => !name) || new Set(names).size !== names.length) return { groupId: group.id, functionId: feature.id, message: `${feature.name}存在空白或重复的区域名称` };
      if (regions.some((region) => region.shape === "polygon" && (polygonPointsForRegion(region).length < 3 || polygonPointsForRegion(region).some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x > 1 || point.y > 1)))) return { groupId: group.id, functionId: feature.id, message: `${feature.name}存在无效的多点线框` };
      if (regions.some((region) => [region.x, region.y, region.width, region.height].some((value) => !Number.isFinite(value)) || region.width < 0.05 || region.height < 0.05 || region.x < 0 || region.y < 0 || region.x + region.width > 1.0001 || region.y + region.height > 1.0001)) return { groupId: group.id, functionId: feature.id, message: `${feature.name}存在超出图像范围的标注区域` };
    }
  }
  return null;
};
function ParameterModal({ feature, onCancel, onSave }) {
  const [values, setValues] = useState(() => feature.params.map((item) => item[1]));
  const errors = feature.params.map(([name, , unit], index) => {
    const rule = getParameterRule(name, unit);
    const value = values[index].trim();
    if (!value) return "请输入参数值";
    if (!Number.isFinite(Number(value))) return "请输入合法数字";
    if (rule.integer && !Number.isInteger(Number(value))) return "请输入整数";
    if (Number(value) < rule.min || Number(value) > rule.max) return `允许范围 ${rule.hint}`;
    return "";
  });
  return <Modal title={`参数 - ${feature.name}`} onCancel={onCancel} onConfirm={() => onSave(values.map((value) => value.trim()))} width="820px" confirmDisabled={errors.some(Boolean)}>
    <div className="rh-param-head">
<b>属性</b>
<b>值</b>
</div>
    {feature.params.map(([name, , unit], index) => {
    const rule = getParameterRule(name, unit);
    return <div className={`rh-param-row ${errors[index] ? "invalid" : ""}`} key={name}>
<span>{name}</span>
<div className="rh-param-editor">
<label>
<input type="number" min={rule.min} max={rule.max} step={rule.step} value={values[index]} aria-invalid={Boolean(errors[index])} onChange={(event) => setValues(values.map((value, valueIndex) => valueIndex === index ? event.target.value : value))} />
<i>{unit}</i>
</label>
<small>{errors[index] || `允许范围 ${rule.hint}`}</small>
</div>
</div>;
  })}
  </Modal>;
}

const polygonPointsForRegion = (region) => {
  if (Array.isArray(region?.points) && region.points.length >= 3) return region.points;
  const x = Number(region?.x || 0);
  const y = Number(region?.y || 0);
  const width = Number(region?.width || 0.2);
  const height = Number(region?.height || 0.2);
  return [
    { x: x + width * 0.5, y },
    { x: x + width, y: y + height * 0.3 },
    { x: x + width * 0.82, y: y + height },
    { x: x + width * 0.18, y: y + height },
    { x, y: y + height * 0.3 }
  ];
};
const polygonBounds = (points) => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { x, y, width: right - x, height: bottom - y };
};
function PolygonCanvas({ regions = [], selectedRegionId = "", draftPoints = [], hoverPoint = null, draftColor = "#20b5ff" }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return void 0;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      const pixelWidth = Math.round(rect.width * ratio);
      const pixelHeight = Math.round(rect.height * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const drawPolygon = (points, color, { close = true, selected = false, muted = false, label = "" } = {}) => {
        if (!points.length) return;
        context.save();
        context.globalAlpha = muted ? 0.3 : 1;
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = selected ? 3 : 2;
        context.lineJoin = "round";
        context.lineCap = "round";
        context.beginPath();
        points.forEach((point, index) => {
          const px = point.x * rect.width;
          const py = point.y * rect.height;
          if (index === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        });
        if (close) context.closePath();
        context.stroke();
        if (selected || !close) {
          points.forEach((point) => {
            context.beginPath();
            context.arc(point.x * rect.width, point.y * rect.height, selected ? 4 : 3.5, 0, Math.PI * 2);
            context.fill();
            context.lineWidth = 1.5;
            context.strokeStyle = "#ffffff";
            context.stroke();
            context.strokeStyle = color;
          });
        }
        if (label && close) {
          const bounds = polygonBounds(points);
          const labelX = Math.max(0, bounds.x * rect.width);
          const labelY = Math.max(13, bounds.y * rect.height - 5);
          context.font = '10px "Microsoft YaHei", sans-serif';
          const labelWidth = Math.min(180, context.measureText(label).width + 10);
          context.fillStyle = color;
          context.fillRect(labelX, labelY - 13, labelWidth, 16);
          context.fillStyle = "#ffffff";
          context.fillText(label, labelX + 5, labelY - 2, labelWidth - 8);
        }
        context.restore();
      };
      regions.filter((region) => region.shape === "polygon").forEach((region) => {
        drawPolygon(polygonPointsForRegion(region), region.color, {
          selected: region.regionId === selectedRegionId,
          muted: region.visible === false,
          label: region.name
        });
      });
      if (draftPoints.length) {
        const previewPoints = hoverPoint ? [...draftPoints, hoverPoint] : draftPoints;
        drawPolygon(previewPoints, draftColor, { close: false });
      }
    };
    draw();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(draw) : null;
    observer?.observe(canvas);
    window.addEventListener("resize", draw);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [regions, selectedRegionId, draftPoints, hoverPoint, draftColor]);
  return <canvas ref={canvasRef} className="rh-polygon-canvas" data-qa="polygon-canvas" data-polygon-count={regions.filter((region) => region.shape === "polygon").length} data-polygon-vertex-count={regions.filter((region) => region.shape === "polygon").reduce((count, region) => count + polygonPointsForRegion(region).length, 0)} aria-hidden="true" />;
}

function AnnotationModal({ feature, initialTool = "edit", onCancel, onSave }) {
  const [color, setColor] = useState(feature.color);
  const [regions, setRegions] = useState(() => getFeatureRegions(feature).map((region) => ({ ...region })));
  const [selectedRegionId, setSelectedRegionId] = useState(() => getFeatureRegions(feature)[0]?.regionId || "");
  const [noAnnotation, setNoAnnotation] = useState(Boolean(feature.noAnnotation));
  const [shapeMode, setShapeMode] = useState(initialTool === "edit" ? "rectangle" : initialTool);
  const [polygonDrawing, setPolygonDrawing] = useState(initialTool === "polygon");
  const [polygonDraft, setPolygonDraft] = useState([]);
  const [polygonHover, setPolygonHover] = useState(null);
  const [polygonMessage, setPolygonMessage] = useState(initialTool === "polygon" ? "在画面中连续点击添加顶点" : "");
  const originalStateRef = useRef({ color: feature.color, regions: getFeatureRegions(feature).map((region) => ({ ...region })), noAnnotation: Boolean(feature.noAnnotation) });
  const [localDirty, setLocalDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [drag, setDrag] = useState(null);
  const stageRef = useRef(null);
  const selectedRegion = regions.find((region) => region.regionId === selectedRegionId);
  const trimmedNames = regions.map((region) => region.name.trim());
  const normalizedNames = trimmedNames.map((name) => name.toLocaleLowerCase());
  const duplicateNames = new Set(normalizedNames.filter((name, index) => name && normalizedNames.indexOf(name) !== index));
  const validationError = noAnnotation ? "" : !regions.length ? "至少保留一个标注区域，或启用“无需标注区域”" : trimmedNames.some((name) => !name) ? "区域名称不能为空" : trimmedNames.some((name) => name.length > 30) ? "区域名称不能超过 30 个字符" : duplicateNames.size ? "区域名称不能重复" : "";
  const commitRegions = (updater) => {
    setRegions((current) => typeof updater === "function" ? updater(current) : updater);
    setLocalDirty(true);
  };
  const updateRegion = (regionId, changes) => commitRegions((current) => current.map((region) => {
    if (region.regionId !== regionId) return region;
    const changesGeometry = region.shape === "polygon" && ["x", "y", "width", "height"].some((key) => Object.prototype.hasOwnProperty.call(changes, key));
    if (!changesGeometry) return { ...region, ...changes };
    const nextX = changes.x ?? region.x;
    const nextY = changes.y ?? region.y;
    const nextWidth = changes.width ?? region.width;
    const nextHeight = changes.height ?? region.height;
    const scaleX = region.width ? nextWidth / region.width : 1;
    const scaleY = region.height ? nextHeight / region.height : 1;
    const points = polygonPointsForRegion(region).map((point) => ({
      x: nextX + (point.x - region.x) * scaleX,
      y: nextY + (point.y - region.y) * scaleY
    }));
    return { ...region, ...changes, points };
  }));
  const startPolygonDrawing = () => {
    setShapeMode("polygon");
    setPolygonDraft([]);
    setPolygonHover(null);
    setPolygonDrawing(true);
    setPolygonMessage("在画面中连续点击添加顶点");
    window.setTimeout(() => stageRef.current?.focus(), 0);
  };
  const cancelPolygonDrawing = (message = "已取消本次多点线框") => {
    setPolygonDraft([]);
    setPolygonHover(null);
    setPolygonDrawing(false);
    setPolygonMessage(message);
  };
  const finishPolygonDrawing = () => {
    if (polygonDraft.length < 3) {
      setPolygonMessage("至少需要 3 个顶点才能闭合");
      return false;
    }
    const bounds = polygonBounds(polygonDraft);
    if (bounds.width < 0.05 || bounds.height < 0.05) {
      setPolygonMessage("线框范围过小，请扩大顶点间距");
      return false;
    }
    const names = new Set(regions.map((region) => region.name.trim()));
    let number = 1;
    while (names.has(`多点线框${number}`)) number += 1;
    const region = {
      regionId: nextRegionId(feature.id),
      name: `多点线框${number}`,
      color,
      shape: "polygon",
      ...bounds,
      points: polygonDraft.map((point) => ({ x: Number(point.x.toFixed(4)), y: Number(point.y.toFixed(4)) })),
      visible: true,
      order: regions.length,
      usesDefaultColor: true
    };
    commitRegions([...regions, region]);
    setSelectedRegionId(region.regionId);
    setNoAnnotation(false);
    setPolygonDraft([]);
    setPolygonHover(null);
    setPolygonDrawing(false);
    setPolygonMessage(`已闭合 ${region.points.length} 个顶点`);
    return true;
  };
  const stagePoint = (event) => {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds?.height) return null;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    };
  };
  const handleStageClick = (event) => {
    if (!polygonDrawing) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.detail > 1) {
      finishPolygonDrawing();
      return;
    }
    const point = stagePoint(event);
    if (!point) return;
    if (polygonDraft.length >= 3) {
      const first = polygonDraft[0];
      if (Math.hypot(point.x - first.x, point.y - first.y) < 0.025) {
        finishPolygonDrawing();
        return;
      }
    }
    setPolygonDraft((current) => [...current, point]);
    setPolygonMessage(`已添加 ${polygonDraft.length + 1} 个顶点`);
  };
  const handleStagePointerMove = (event) => {
    dragRegion(event);
    if (polygonDrawing) setPolygonHover(stagePoint(event));
  };
  const selectShapeMode = (shape) => {
    if (shape === "polygon") startPolygonDrawing();
    else {
      cancelPolygonDrawing("");
      setShapeMode(shape);
    }
  };
  const addRegion = (shape = shapeMode) => {
    if (shape === "polygon") {
      startPolygonDrawing();
      return;
    }
    const names = new Set(regions.map((region2) => region2.name.trim()));
    let number = 1;
    const shapeLabel = shape === "point" ? "点标注" : "矩形线框";
    while (names.has(`${shapeLabel}${number}`)) number += 1;
    const preset = shape === "point"
      ? { x: 0.48, y: 0.48, width: 0.035, height: 0.035 }
      : regionPresets[regions.length % regionPresets.length];
    const region = { regionId: nextRegionId(feature.id), name: `${shapeLabel}${number}`, color, shape, ...preset, visible: true, order: regions.length, usesDefaultColor: true };
    commitRegions([...regions, region]);
    setSelectedRegionId(region.regionId);
    if (noAnnotation) setNoAnnotation(false);
  };
  useEffect(() => {
    if (!polygonDrawing) return void 0;
    const handlePolygonKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancelPolygonDrawing();
      } else if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        finishPolygonDrawing();
      } else if (event.key === "Backspace" && polygonDraft.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setPolygonDraft((current) => current.slice(0, -1));
        setPolygonMessage("已撤销最后一个顶点");
      }
    };
    window.addEventListener("keydown", handlePolygonKeyDown, true);
    return () => window.removeEventListener("keydown", handlePolygonKeyDown, true);
  }, [polygonDrawing, polygonDraft]);
  const moveRegion = (regionId, direction) => commitRegions((current) => {
    const index = current.findIndex((region) => region.regionId === regionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((region, order) => ({ ...region, order }));
  });
  const updateDefaultColor = (value) => {
    setColor(value);
    commitRegions((current) => current.map((region) => region.usesDefaultColor ? { ...region, color: value } : region));
  };
  const beginDrag = (event, region, mode) => {
    if (noAnnotation) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedRegionId(region.regionId);
    const bounds = stageRef.current.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({ pointerId: event.pointerId, regionId: region.regionId, mode, startX: event.clientX, startY: event.clientY, bounds, origin: { x: region.x, y: region.y, width: region.width, height: region.height } });
  };
  const dragRegion = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = (event.clientX - drag.startX) / drag.bounds.width;
    const dy = (event.clientY - drag.startY) / drag.bounds.height;
    if (drag.mode === "move") updateRegion(drag.regionId, { x: Math.max(0, Math.min(1 - drag.origin.width, drag.origin.x + dx)), y: Math.max(0, Math.min(1 - drag.origin.height, drag.origin.y + dy)) });
    else updateRegion(drag.regionId, { width: Math.max(0.05, Math.min(1 - drag.origin.x, drag.origin.width + dx)), height: Math.max(0.05, Math.min(1 - drag.origin.y, drag.origin.height + dy)) });
  };
  const updatePercent = (region, key, rawValue) => {
    const value = Number(rawValue) / 100;
    if (!Number.isFinite(value)) return;
    if (key === "x") updateRegion(region.regionId, { x: Math.max(0, Math.min(1 - region.width, value)) });
    if (key === "y") updateRegion(region.regionId, { y: Math.max(0, Math.min(1 - region.height, value)) });
    if (key === "width") updateRegion(region.regionId, { width: Math.max(0.05, Math.min(1 - region.x, value)) });
    if (key === "height") updateRegion(region.regionId, { height: Math.max(0.05, Math.min(1 - region.y, value)) });
  };
  const handleRegionKeyDown = (event, region) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedRegionId(region.regionId);
      return;
    }
    if (event.key === "Delete") {
      event.preventDefault();
      setPendingAction({ type: "delete", regionId: region.regionId });
      return;
    }
    const step = event.shiftKey ? 0.05 : 0.01;
    const changes = event.key === "ArrowLeft" ? { x: Math.max(0, region.x - step) } : event.key === "ArrowRight" ? { x: Math.min(1 - region.width, region.x + step) } : event.key === "ArrowUp" ? { y: Math.max(0, region.y - step) } : event.key === "ArrowDown" ? { y: Math.min(1 - region.height, region.y + step) } : null;
    if (!changes) return;
    event.preventDefault();
    setSelectedRegionId(region.regionId);
    updateRegion(region.regionId, changes);
  };
  const requestNoAnnotation = (value) => {
    if (value && regions.length) return setPendingAction({ type: "no-annotation" });
    setNoAnnotation(value);
    setLocalDirty(true);
    if (!value && !regions.length) addRegion();
  };
  const requestClose = () => {
    if (polygonDrawing) {
      cancelPolygonDrawing();
      return;
    }
    if (pendingAction) {
      setPendingAction(null);
      return;
    }
    if (localDirty) setPendingAction({ type: "discard" });
    else onCancel();
  };
  const resetLocalDraft = () => {
    const original = originalStateRef.current;
    setColor(original.color);
    setRegions(original.regions.map((region) => ({ ...region })));
    setSelectedRegionId(original.regions[0]?.regionId || "");
    setNoAnnotation(original.noAnnotation);
    setPendingAction(null);
    setPolygonDraft([]);
    setPolygonHover(null);
    setPolygonDrawing(false);
    setPolygonMessage("");
    setLocalDirty(false);
  };
  const confirmPendingAction = () => {
    if (pendingAction.type === "delete") {
      const index = regions.findIndex((region) => region.regionId === pendingAction.regionId);
      const nextRegions = regions.filter((region) => region.regionId !== pendingAction.regionId).map((region, order) => ({ ...region, order }));
      commitRegions(nextRegions);
      setSelectedRegionId(nextRegions[Math.min(index, nextRegions.length - 1)]?.regionId || "");
    }
    if (pendingAction.type === "no-annotation") {
      setNoAnnotation(true);
      setLocalDirty(true);
    }
    if (pendingAction.type === "discard") {
      onCancel();
      return;
    }
    setPendingAction(null);
  };
  const pendingMessage = pendingAction?.type === "delete" ? "删除后该区域的坐标与颜色将从草稿中移除。" : pendingAction?.type === "no-annotation" ? `启用后将停用现有 ${regions.length} 个区域，但会保留坐标以便恢复。` : "本次区域编辑尚未应用到页面草稿，确认放弃吗？";
  return <Modal title={`标注区域 - ${feature.name}`} onCancel={requestClose} onConfirm={() => onSave({ color, regions: regions.length, regionItems: regions.map((region, order) => ({ ...region, name: region.name.trim(), order })), noAnnotation })} width="1200px" confirmText="应用到草稿" confirmDisabled={Boolean(validationError || pendingAction || polygonDrawing || !localDirty)}>
    <div className="rh-region-layout">
      <div className={`rh-region-stage ${polygonDrawing ? "polygon-drawing" : ""}`} ref={stageRef} tabIndex="0" aria-label={polygonDrawing ? "多点线框绘制画布，连续点击添加顶点，双击或按 Enter 闭合" : "标注区域配置画面"} onClick={handleStageClick} onDoubleClick={(event) => { if (polygonDrawing) { event.preventDefault(); event.stopPropagation(); finishPolygonDrawing(); } }} onPointerMove={handleStagePointerMove} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)} onPointerLeave={() => polygonDrawing && setPolygonHover(null)}>
<img src={visibleLightImage} alt="标注区域配置画面" />
<PolygonCanvas regions={noAnnotation ? [] : regions} selectedRegionId={selectedRegionId} draftPoints={polygonDraft} hoverPoint={polygonHover} draftColor={color} />
{!noAnnotation && regions.map((region) => <span data-region-id={region.regionId} data-shape={region.shape || "rectangle"} data-point-count={region.shape === "polygon" ? polygonPointsForRegion(region).length : undefined} key={region.regionId} className={`rh-region-frame ${region.shape || "rectangle"} ${selectedRegionId === region.regionId ? "selected" : ""} ${region.visible ? "" : "hidden"}`} style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%`, borderColor: region.color, color: region.color }} onClick={() => setSelectedRegionId(region.regionId)} onPointerDown={(event) => beginDrag(event, region, "move")} onKeyDown={(event) => handleRegionKeyDown(event, region)} tabIndex="0" role="button" aria-pressed={selectedRegionId === region.regionId} aria-label={`${region.name}，方向键微调，Shift 加方向键快速移动`} >
<em style={{ background: region.color }}>{region.name}</em>{selectedRegionId === region.regionId && <i className="rh-region-resize" title="拖动调整大小" onPointerDown={(event) => beginDrag(event, region, "resize")} />}</span>)}
{polygonDrawing && <div className="rh-polygon-drawing-status" role="status"><b>多点线框</b><span>{polygonMessage} · 双击或 Enter 闭合 · Esc 取消</span><button onClick={(event) => { event.stopPropagation(); cancelPolygonDrawing(); }}>取消绘制</button></div>}
{noAnnotation && !polygonDrawing && <div className="rh-region-stage-empty"><IconInfoCircle size={24} /><b>该功能无需标注区域</b><span>现有区域已停用，关闭此状态后可恢复编辑</span></div>}
{!noAnnotation && !regions.length && !polygonDrawing && <div className="rh-region-stage-empty"><IconVectorBezier2 size={24} /><b>尚未配置标注区域</b><span>点击右侧“新增区域”开始配置</span></div>}
</div>
      <aside>
<div className="rh-region-mode">
<div>
<b>无需标注区域</b>
<span>与“尚未配置”区分保存</span>
</div>
<Toggle value={noAnnotation} onChange={requestNoAnnotation} />
</div>
<div className="rh-region-title">
<div>
<b>区域列表</b>
<span>{regions.length} 个 · {regions.filter((region) => region.visible).length} 个显示</span>
</div>
<button onClick={() => addRegion(shapeMode)}>
<IconPlus size={14} />新增{shapeMode === "point" ? "点标注" : shapeMode === "polygon" ? "多点线框" : "矩形线框"}</button>
<button data-qa="region-reset" className="rh-region-reset" onClick={resetLocalDraft} disabled={!localDirty} title="恢复为打开弹窗时的区域状态"><IconHistory size={14} />重置本次</button>
</div>
<div className="rh-region-shape-tools" role="toolbar" aria-label="新增标注类型">
<button className={shapeMode === "point" && !polygonDrawing ? "active" : ""} title="点标注" aria-label="点标注" aria-pressed={shapeMode === "point" && !polygonDrawing} onClick={() => selectShapeMode("point")}><IconPointFilled size={17} /></button>
<button className={shapeMode === "rectangle" && !polygonDrawing ? "active" : ""} title="矩形线框标注" aria-label="矩形线框标注" aria-pressed={shapeMode === "rectangle" && !polygonDrawing} onClick={() => selectShapeMode("rectangle")}><IconRectangle size={17} /></button>
<button className={shapeMode === "polygon" ? "active" : ""} title="多点线框标注" aria-label="多点线框标注" aria-pressed={shapeMode === "polygon"} onClick={startPolygonDrawing}><IconPolygon size={17} /></button>
</div>{regions.map((region, index) => {
    const normalizedName = region.name.trim().toLocaleLowerCase();
    const nameError = !region.name.trim() ? "名称不能为空" : region.name.trim().length > 30 ? "名称最多 30 个字符" : duplicateNames.has(normalizedName) ? "名称重复" : "";
    return <div data-qa="region-row" className={`rh-region-item ${selectedRegionId === region.regionId ? "selected" : ""} ${nameError ? "invalid" : ""}`} key={region.regionId} onClick={() => setSelectedRegionId(region.regionId)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedRegionId(region.regionId); } }} tabIndex="0" aria-current={selectedRegionId === region.regionId ? "true" : undefined}>
<input value={region.name} maxLength="30" aria-label={`${region.name || "未命名区域"}名称`} aria-invalid={Boolean(nameError)} onClick={(event) => event.stopPropagation()} onChange={(event) => updateRegion(region.regionId, { name: event.target.value })} />
<button title={region.visible ? "隐藏该区域" : "显示该区域"} onClick={(event) => {
      event.stopPropagation();
      updateRegion(region.regionId, { visible: !region.visible });
    }}>{region.visible ? <IconEye size={15} /> : <IconEyeOff size={15} />}</button>
<input type="color" value={region.color} onClick={(event) => event.stopPropagation()} onChange={(event) => updateRegion(region.regionId, { color: event.target.value, usesDefaultColor: false })} aria-label={`${region.name}颜色`} />
<span className="rh-region-order">
<button disabled={index === 0} title="上移" onClick={(event) => {
      event.stopPropagation();
      moveRegion(region.regionId, -1);
    }}>
<IconChevronUp size={14} />
</button>
<button disabled={index === regions.length - 1} title="下移" onClick={(event) => {
      event.stopPropagation();
      moveRegion(region.regionId, 1);
    }}>
<IconChevronDown size={14} />
</button>
</span>
<button className="danger" title="删除区域" onClick={(event) => {
      event.stopPropagation();
      setPendingAction({ type: "delete", regionId: region.regionId });
    }}>
<IconTrash size={15} />
</button>{nameError && <small>{nameError}</small>}</div>;
  })}{selectedRegion && !noAnnotation && <div className="rh-region-coordinates">
<b>位置与大小（%）</b>
<div>{[["x", "X"], ["y", "Y"], ["width", "宽"], ["height", "高"]].map(([key, label]) => <label key={key}>
<span>{label}</span>
<input type="number" min={key === "width" || key === "height" ? 5 : 0} max="100" step="1" value={Math.round(selectedRegion[key] * 100)} onChange={(event) => updatePercent(selectedRegion, key, event.target.value)} />
</label>)}</div>
</div>}<div className="rh-color-setting">
<span>功能默认颜色</span>
<input type="color" value={color} onChange={(event) => updateDefaultColor(event.target.value)} />
<code>{color.toUpperCase()}</code>
</div>{validationError && <p className="rh-region-error">
<IconAlertTriangle size={15} />{validationError}</p>}{pendingAction && <div className="rh-region-confirm">
<IconAlertTriangle size={16} />
<span>{pendingMessage}</span>
<div>
<button onClick={confirmPendingAction}>确认</button>
<button onClick={() => setPendingAction(null)}>取消</button>
</div>
</div>}<p>
<IconInfoCircle size={15} />{polygonDrawing ? "连续点击添加顶点，双击起点或按 Enter 闭合；Backspace 撤销最后一点。" : "拖动标记可移动，拖动右下角控制点可缩放；坐标按原图比例保存。"}</p>
</aside>
    </div>
  </Modal>;
}
function ConfirmModal({ title = "操作确认", message, detail = "该操作将立即生效，请确认是否继续。", confirmText = "确认", onCancel, onConfirm }) {
  return <Modal title={title} onCancel={onCancel} onConfirm={onConfirm} width="430px" confirmText={confirmText}>
<div className="rh-confirm">
<IconAlertTriangle size={28} />
<div>
<b>{message}</b>
<p>{detail}</p>
</div>
</div>
</Modal>;
}
function IssueModal({ station, dirty, dirtyLabels, savedVersion, runningVersion, online, onCancel, onIssueDraft, onIssueSaved }) {
  const versionsSynced = savedVersion === runningVersion;
  return <Modal title="下达参数" onCancel={onCancel} onConfirm={dirty ? onIssueDraft : onIssueSaved} width="640px" confirmText={dirty ? "保存并下达" : "确认下达"} secondaryText={dirty ? `仅下达已保存 V${savedVersion}` : ""} onSecondary={onIssueSaved} secondaryTone="neutral">
    <div className="rh-issue-review">
      <div className={`rh-issue-state ${online ? "ready" : "blocked"}`}>
        {online ? <IconCheck size={22} /> : <IconAlertTriangle size={22} />}
        <div><b>{online ? `采集站 ${station} 已连接` : `采集站 ${station} 当前离线`}</b><span>{online ? "确认后才会改变设备运行版本" : "可继续检查配置，但下达会失败且不会修改版本"}</span></div>
      </div>
      <div className="rh-version-flow" aria-label="配置版本流转">
        <span className={dirty ? "draft" : "quiet"}><small>页面草稿</small><b>{dirty ? `${dirtyLabels.length} 处变更` : "无变更"}</b></span>
        <i>→</i>
        <span><small>平台已保存</small><b>V{savedVersion}</b></span>
        <i>→</i>
        <span className={versionsSynced ? "synced" : "behind"}><small>设备运行</small><b>V{runningVersion}</b></span>
      </div>
      {dirty && <div className="rh-issue-changes"><b>本次草稿涉及</b><div>{dirtyLabels.map((label) => <span key={label}>{label}</span>)}</div><p>“保存并下达”会生成 V{savedVersion + 1}；“仅下达已保存”会保留当前草稿。</p></div>}
      {!dirty && !versionsSynced && <p className="rh-issue-note"><IconInfoCircle size={16} />平台 V{savedVersion} 尚未在设备生效，本次将补齐版本差异。</p>}
    </div>
  </Modal>;
}
function ConfigurationReviewModal({ online, dirty, dirtyEntries, settingsIssue, algorithmIssue, deviceCount, bindingCount, savedVersion, runningVersion, onCancel, onJump, onSave, onIssue }) {
  const settingsReady = !settingsIssue;
  const algorithmReady = !algorithmIssue && bindingCount > 0;
  const devicesReady = deviceCount > 0;
  const localReady = settingsReady && algorithmReady && devicesReady;
  const issueReady = localReady && online;
  const checks = [
    { key: "online", label: "设备连接", tone: online ? "pass" : "warning", detail: online ? "采集站在线，可执行预览、重启与下达" : "采集站离线；仍可保存草稿，但不能下达" },
    { key: "devices", label: "监测设备", tone: devicesReady ? "pass" : "error", detail: devicesReady ? `已关联 ${deviceCount} 个监测设备` : "至少关联 1 个监测设备", action: devicesReady ? "" : "devices" },
    { key: "settings", label: "基础配置", tone: settingsReady ? "pass" : "error", detail: settingsReady ? "视频、补光、清洁与采集策略参数有效" : settingsIssue.message, action: settingsReady ? "" : settingsIssue.group },
    { key: "algorithm", label: "算法与标注", tone: algorithmReady ? "pass" : "error", detail: algorithmReady ? `已配置 ${bindingCount} 个数据组，参数和区域有效` : algorithmIssue?.message || "至少配置 1 个算法数据组", action: algorithmReady ? "" : "annotation" },
    { key: "version", label: "版本状态", tone: dirty || savedVersion !== runningVersion ? "warning" : "pass", detail: dirty ? `${dirtyEntries.length} 个分区仍是页面草稿` : savedVersion === runningVersion ? `平台与设备均为 V${savedVersion}` : `平台 V${savedVersion} 尚未下达到设备 V${runningVersion}` }
  ];
  const primaryLabel = dirty && localReady ? "保存变更" : !dirty && issueReady ? "继续下达" : "关闭";
  const primaryAction = dirty && localReady ? onSave : !dirty && issueReady ? onIssue : onCancel;
  return <Modal title="配置检查" onCancel={onCancel} onConfirm={primaryAction} width="700px" confirmText={primaryLabel} secondaryText={dirty && issueReady ? "下达参数" : ""} onSecondary={onIssue} secondaryTone="neutral">
    <div className="rh-config-review">
      <header><div><IconChecklist size={25} /><span><b>{localReady ? "配置结构完整" : "发现阻塞项"}</b><small>{issueReady ? "当前配置具备下达条件" : online ? "请先处理红色项目" : "保存不受影响，设备上线后再下达"}</small></span></div><em className={localReady ? "ready" : "blocked"}>{localReady ? "可保存" : "需处理"}</em></header>
      <div className="rh-review-checks">{checks.map((check) => <div className={`rh-review-check ${check.tone}`} key={check.key}><span>{check.tone === "pass" ? <IconCheck size={16} /> : check.tone === "error" ? <IconAlertTriangle size={16} /> : <IconInfoCircle size={16} />}</span><div><b>{check.label}</b><small>{check.detail}</small></div>{check.action && <button onClick={() => onJump(check.action)}>去处理</button>}</div>)}</div>
      {dirtyEntries.length > 0 && <section className="rh-review-changes"><b>未保存变更</b><div>{dirtyEntries.map((entry) => <button key={entry.key} onClick={() => onJump(entry.key)}><span>{entry.label}</span><small>查看</small></button>)}</div></section>}
    </div>
  </Modal>;
}
function StationSwitchModal({ currentStation, targetStation, busy, onCancel, onDiscard, onSave }) {
  const guard = (action) => () => { if (!busy) action(); };
  return <Modal title="存在未保存修改" onCancel={guard(onCancel)} onConfirm={guard(onSave)} secondaryText="放弃修改" onSecondary={guard(onDiscard)} secondaryDisabled={busy} cancelDisabled={busy} confirmDisabled={busy} width="520px" confirmText={busy ? "保存中…" : "保存并切换"}>
    <div className="rh-switch-warning">
<IconAlertTriangle size={28} />
<div>
<b>先处理当前站点的配置草稿</b>
<p>你正在从 <strong>{currentStation[0]} · {currentStation[1]}</strong> 切换到 <strong>{targetStation[0]} · {targetStation[1]}</strong>。直接放弃将丢失本次修改。</p>
</div>
</div>
  </Modal>;
}
function DependencyModal({ device, dependencies, onClose }) {
  return <Modal title="暂时无法移除设备" onCancel={onClose} onConfirm={onClose} width="560px" confirmText="知道了">
    <div className="rh-dependency">
<div className="rh-dependency-lead">
<IconAlertTriangle size={25} />
<div>
<b>{device} 仍被算法绑定引用</b>
<p>请先删除下列数据组中的绑定功能，再移除设备。</p>
</div>
</div>
<ul>{dependencies.map((dependency) => <li key={dependency.id}>
<span title={dependency.path}>{dependency.label}</span>
<small>{dependency.functions.join("、")}</small>
</li>)}</ul>
</div>
  </Modal>;
}
const isIPv4 = (value) => {
  const parts = value.trim().split(".");
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
};
const ipv4ToNumber = (value) => value.split(".").reduce((result, part) => (result << 8 | Number(part)) >>> 0, 0);
const isSubnetMask = (value) => {
  if (!isIPv4(value)) return false;
  const bits = value.split(".").map((part) => Number(part).toString(2).padStart(8, "0")).join("");
  return /^1+0*$/.test(bits);
};
function ConnectionModal({ type, initialValue, onCancel, onSave }) {
  const isNetwork = type === "network";
  const [form, setForm] = useState(initialValue);
  const update = (key, value) => setForm({ ...form, [key]: value });
  const networkValues = isNetwork ? [form.ip, form.mask, form.gateway, form.dns] : [];
  const subnetMismatch = isNetwork && isIPv4(form.ip) && isIPv4(form.gateway) && isSubnetMask(form.mask) && (ipv4ToNumber(form.ip) & ipv4ToNumber(form.mask)) !== (ipv4ToNumber(form.gateway) & ipv4ToNumber(form.mask));
  const proxyPort = Number(form.port);
  const error = isNetwork ? networkValues.some((value) => !isIPv4(value)) ? "请输入合法的 IPv4 地址" : !isSubnetMask(form.mask) ? "请输入连续且合法的子网掩码" : subnetMismatch ? "IP 地址与默认网关需处于子网掩码定义的同一网段" : "" : form.enabled && !form.host.trim() ? "启用代理后必须填写代理地址" : form.enabled && (!Number.isInteger(proxyPort) || proxyPort < 1 || proxyPort > 65535) ? "代理端口需为 1–65535 的整数" : "";
  return <Modal title={isNetwork ? "设置网络参数" : "代理配置"} onCancel={onCancel} onConfirm={() => onSave(form)} width="620px" confirmDisabled={Boolean(error)}>
    <div className="rh-form-grid">
      {!isNetwork && <>
<label>
<span>启用代理</span>
<Toggle value={form.enabled} onChange={(value) => update("enabled", value)} />
</label>
<label>
<span>代理协议</span>
<select disabled={!form.enabled} value={form.protocol} onChange={(event) => update("protocol", event.target.value)}>
<option>HTTP</option>
<option>HTTPS</option>
<option>SOCKS5</option>
</select>
</label>
</>}
      <label>
<span>{isNetwork ? "IP 地址" : "代理地址"}</span>
<input disabled={!isNetwork && !form.enabled} value={isNetwork ? form.ip : form.host} onChange={(event) => update(isNetwork ? "ip" : "host", event.target.value)} />
</label>
      <label>
<span>{isNetwork ? "子网掩码" : "代理端口"}</span>
<input disabled={!isNetwork && !form.enabled} value={isNetwork ? form.mask : form.port} onChange={(event) => update(isNetwork ? "mask" : "port", event.target.value)} />
</label>
      <label>
<span>{isNetwork ? "默认网关" : "用户名"}</span>
<input disabled={!isNetwork && !form.enabled} value={isNetwork ? form.gateway : form.username} onChange={(event) => update(isNetwork ? "gateway" : "username", event.target.value)} />
</label>
      <label>
<span>{isNetwork ? "首选 DNS" : "密码"}</span>
<input disabled={!isNetwork && !form.enabled} type={isNetwork ? "text" : "password"} value={isNetwork ? form.dns : form.password} onChange={(event) => update(isNetwork ? "dns" : "password", event.target.value)} />
</label>
    </div>{error && <p className="rh-form-alert">
<IconAlertTriangle size={15} />{error}</p>}{isNetwork && !error && <p className="rh-network-warning">
<IconInfoCircle size={15} />网络参数保存并下达后，采集站可能短暂离线。</p>}
  </Modal>;
}
function DeviceModal({ devices, options: deviceOptions = dataOptions, onCancel, onSave }) {
  const options = deviceOptions.map((item) => item.label);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(devices);
  const visible = options.filter((item) => item.includes(query.trim()));
  const toggle = (item) => setSelected(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item]);
  const unchanged = options.every((item) => selected.includes(item) === devices.includes(item));
  return <Modal title="关联监测设备" onCancel={onCancel} onConfirm={() => onSave(selected)} confirmText="应用关联" confirmDisabled={unchanged} width="580px">
<div className="rh-device-picker">
<label>
<input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入设备名称模糊搜索" />
<IconSearch size={16} />
</label>
<div>{visible.map((item) => {
    const option = deviceOptions.find((candidate) => candidate.label === item);
    return <button key={item} aria-pressed={selected.includes(item)} onClick={() => toggle(item)}>
<span className={`rh-checkbox ${selected.includes(item) ? "checked" : ""}`}>{selected.includes(item) && <IconCheck size={12} />}</span>
<IconDatabase size={16} />
<span>{item}</span>
<small>在线 · {option.children.length} 个数据项</small>
</button>;
  })}{!visible.length && <div className="rh-selector-empty">
<IconSearch size={20} />
<b>未找到匹配的监测设备</b>
<span>请尝试输入设备名称中的其他关键词</span>
</div>}</div>
</div>
</Modal>;
}
function BatchImportModal({ existingDevices, onCancel, onImport }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const templateHeaders = ["设备名称", "IP地址", "设备类型", "型号", "序列号", "接入协议"];
  const parseCsv = (text) => {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return { error: "文件中没有可导入的设备数据", rows: [] };
    const headers = lines[0].split(",").map((item) => item.trim());
    const missing = templateHeaders.filter((header) => !headers.includes(header));
    if (missing.length) return { error: `缺少字段：${missing.join("、")}`, rows: [] };
    const nextRows = lines.slice(1).map((line, index) => {
      const values = line.split(",").map((item) => item.trim());
      const valueFor = (name) => values[headers.indexOf(name)] || "";
      return {
        row: index + 2,
        name: valueFor("设备名称"),
        ip: valueFor("IP地址"),
        type: valueFor("设备类型"),
        model: valueFor("型号"),
        serial: valueFor("序列号"),
        protocol: valueFor("接入协议")
      };
    });
    const duplicateIp = nextRows.find((row, index) => nextRows.findIndex((item) => item.ip === row.ip) !== index || existingDevices.some((item) => item.ip === row.ip));
    const duplicateSerial = nextRows.find((row, index) => nextRows.findIndex((item) => item.serial === row.serial) !== index || existingDevices.some((item) => item.serial === row.serial));
    const invalid = nextRows.find((row) => !row.name || !isIPv4(row.ip) || !["可见光", "红外热成像", "云台球机"].includes(row.type) || !row.model || !row.serial || !row.protocol);
    if (duplicateIp) return { error: `第 ${duplicateIp.row} 行 IP ${duplicateIp.ip} 已存在`, rows: [] };
    if (duplicateSerial) return { error: `第 ${duplicateSerial.row} 行序列号 ${duplicateSerial.serial} 已存在`, rows: [] };
    if (invalid) return { error: `第 ${invalid.row} 行存在空字段、非法 IP 或不支持的设备类型`, rows: [] };
    return { error: "", rows: nextRows };
  };
  const applyText = (text, name) => {
    const result = parseCsv(text);
    setRows(result.rows);
    setError(result.error);
    setFileName(name);
  };
  const downloadTemplate = () => {
    const sample = [
      templateHeaders.join(","),
      "2号锅炉西侧云台球机,10.10.5.121,云台球机,DS-2DE7430IW-AE,DS-2DE7430-05121,海康SDK"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", sample], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "海康设备批量导入模板.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const loadExample = () => applyText([
    templateHeaders.join(","),
    "2号锅炉给煤层固定枪机,10.10.5.131,可见光,DS-2CD7A47EWD-XZ,DS-2CD7A47-05131,ONVIF",
    "2号锅炉燃烧器红外,10.10.5.132,红外热成像,DS-2TD2637T-10,DS-2TD2637T-05132,海康SDK"
  ].join("\n"), "演示导入数据.csv");
  return <Modal title="批量导入海康设备" onCancel={onCancel} onConfirm={() => onImport(rows)} confirmText={`导入 ${rows.length} 台到页面草稿`} confirmDisabled={!rows.length || Boolean(error)} width="780px">
    <div className="rh-batch-import">
      <div className="rh-batch-import-actions">
        <div><b>CSV 导入</b><span>模板中的设备名称、IP、类型、型号、序列号和协议均为必填项。</span></div>
        <button onClick={downloadTemplate}><IconUpload size={15} />下载模板</button>
        <label><input type="file" accept=".csv,text/csv" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => applyText(String(reader.result || ""), file.name);
          reader.onerror = () => { setRows([]); setError("文件读取失败，请重新选择"); };
          reader.readAsText(file, "utf-8");
        }} /><IconDatabase size={15} />选择 CSV 文件</label>
        <button onClick={loadExample}><IconPlayerPlay size={15} />载入演示数据</button>
      </div>
      {fileName && <p className="rh-batch-file"><IconCheck size={14} />{fileName}<span>{error || `已通过校验，可导入 ${rows.length} 台设备`}</span></p>}
      {error && <p className="rh-form-alert"><IconAlertTriangle size={15} />{error}</p>}
      <div className="rh-batch-preview">
        <header><b>导入预览</b><span>{rows.length ? `${rows.length} 台设备` : "等待选择文件"}</span></header>
        {rows.length ? <table><thead><tr><th>设备名称</th><th>IP / 序列号</th><th>类型 / 型号</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.ip}-${row.serial}`}><td>{row.name}</td><td><b>{row.ip}</b><small>{row.serial}</small></td><td><b>{row.type}</b><small>{row.model}</small></td></tr>)}</tbody></table> : <div><IconUpload size={26} /><span>导入前会校验必填字段、IP、设备类型、IP 与序列号唯一性</span></div>}
      </div>
    </div>
  </Modal>;
}
function PreviewDebugModal({ onCancel, onSnapshot }) {
  const [running, setRunning] = useState(false);
  const [frames, setFrames] = useState(0);
  useEffect(() => {
    if (!running) return void 0;
    const timer = window.setInterval(() => setFrames((value) => value + 25), 1e3);
    return () => window.clearInterval(timer);
  }, [running]);
  const toggle = () => {
    setRunning(!running);
    if (!running && frames === 0) setFrames(25);
  };
  return <Modal title="预览调试" onCancel={onCancel} onConfirm={onCancel} confirmText="完成" width="1040px">
<div className="rh-debug-layout">
<div className="rh-debug-image">
<img src={visibleLightImage} alt="可见光调试画面" />
<span>LIVE</span>
</div>
<aside>
<h4>
<IconActivity size={17} />实时状态</h4>
<dl>
<div>
<dt>视频流</dt>
<dd className="ok">正常</dd>
</div>
<div>
<dt>分辨率</dt>
<dd>1920 × 1080</dd>
</div>
<div>
<dt>帧率</dt>
<dd>25 FPS</dd>
</div>
<div>
<dt>延迟</dt>
<dd>86 ms</dd>
</div>
<div>
<dt>已分析帧数</dt>
<dd>{frames}</dd>
</div>
</dl>
<button className={running ? "stop" : ""} onClick={toggle}>{running ? <IconPower size={16} /> : <IconPlayerPlay size={16} />}{running ? "停止分析" : "开始分析"}</button>
<button onClick={onSnapshot}>
<IconCamera size={16} />截取快照</button>
<p>{running ? "算法正在分析实时画面，检测结果会同步叠加。" : "点击开始分析以验证当前算法和标注区域。"}</p>
</aside>
</div>
</Modal>;
}
function DataSelector({ value, bindings, options = dataOptions, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visible = options.map((device) => {
    const deviceMatches = !normalized || (device.label + device.path + (device.ip || "")).toLowerCase().includes(normalized);
    return {
      ...device,
      children: deviceMatches
        ? device.children
        : device.children.filter((item) => (item.label + item.path).toLowerCase().includes(normalized))
    };
  }).filter((device) => !normalized || (device.label + device.path + (device.ip || "")).toLowerCase().includes(normalized) || device.children.length);
  const visiblePointCount = visible.reduce((count, device) => count + device.children.length, 0);
  const choose = (id) => {
    onSelect(id);
    onClose();
  };
  return <div className="rh-select-popover rh-data-popover" aria-label="选择数据 ID">
<header className="rh-data-selector-head">
<label>
<IconSearch size={16} />
<input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索测点或完整路径" aria-label="搜索测点" />
{query && <button type="button" onClick={() => setQuery("")} aria-label="清空搜索"><IconX size={14} /></button>}
</label>
<div><span>当前范围 <b>{visiblePointCount}</b> 个测点</span><small>摄像头仅用于分组，请选择组内测点</small></div>
</header>
<div className="rh-option-scroll" role="listbox">{visible.map((device) => {
    return <section className="rh-data-branch" key={device.id}>
<div className="rh-data-device-row" role="group" aria-label={device.label + "下的测点"}>
<span className="rh-data-type-label">{device.vendor === "Hikvision" ? "摄像头" : "设备"}</span>
<span className="rh-data-option-copy">
<span className="rh-data-title-line"><strong>{device.label}</strong></span>
<small>{device.path}</small>
</span>
<span className="rh-data-group-count">{device.children.length} 个测点</span>
</div>
{device.children.length > 0 && <div className="rh-data-point-list">{device.children.map((item) => {
      const itemConfigured = bindings.some((group) => group.id === item.id);
      const itemChosen = value === item.id;
      return <button type="button" role="option" aria-selected={itemChosen} data-data-id={item.id} className={"rh-data-point-row " + (itemChosen ? "chosen " : "") + (itemConfigured ? "configured" : "")} key={item.id} onClick={() => choose(item.id)}>
<span className="rh-data-type-label point">测点</span>
<span className="rh-data-option-copy">
<span className="rh-data-title-line"><strong>{item.label}</strong></span>
<small>{item.path}</small>
</span>
{itemConfigured && <em className="rh-data-bound-state">已绑定</em>}
{itemChosen && <span className="rh-data-selected-state" title="当前选择" aria-label="当前选择"><IconCheck size={17} /></span>}
</button>;
    })}</div>}
</section>;
  })}{!visible.length && <div className="rh-selector-empty">
<IconSearch size={20} />
<b>{options.length ? "未找到匹配的测点" : "暂无可配置的测点"}</b>
<span>{options.length ? "请尝试测点名称或完整路径关键词" : "请先为当前采集站的摄像头配置测点"}</span>
{query && <button type="button" onClick={() => setQuery("")}>清空搜索</button>}
</div>}</div>
</div>;
}

function FunctionSelector({ selectedIds, lockedIds, onChange, onClose }) {
  const [activeGroup, setActiveGroup] = useState(functionCatalog[0].group);
  const group = functionCatalog.find((item) => item.group === activeGroup);
  const toggle = (id) => {
    if (lockedIds.includes(id)) return;
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };
  return <div className="rh-select-popover rh-function-popover">
<div className="rh-cascade-groups">{functionCatalog.map((item) => <button key={item.group} className={activeGroup === item.group ? "active" : ""} onClick={() => setActiveGroup(item.group)}>
<span>{item.group}</span>
<small>{item.functions.length}</small>
<IconChevronRight size={14} />
</button>)}</div>
<div className="rh-cascade-functions">{group.functions.map((item) => {
    const locked = lockedIds.includes(item.id);
    const checked = selectedIds.includes(item.id);
    return <button data-function-id={item.id} key={item.id} className={locked ? "locked" : ""} disabled={locked} aria-disabled={locked} onClick={() => toggle(item.id)}>
<span className={`rh-checkbox ${checked ? "checked" : ""}`}>{checked && <IconCheck size={12} />}</span>
<span>{item.name}</span>{locked && <small>
<IconLock size={12} />已绑定</small>}</button>;
  })}<footer>
<span>已选 {selectedIds.length} 项{lockedIds.length ? ` 路 ${lockedIds.length} 项锁定` : ""}</span>
<button onClick={onClose}>完成</button>
</footer>
</div>
</div>;
}
function AlgorithmCard({ groupId, feature, selected, annotationLocked, onSelect, onEditParameters, onEditRegions, onDelete, onToggleVisible, onDescription, onColor }) {
  const params = feature.params.map(([name, value, unit]) => `${name}：${value}${unit}`).join("，");
  const regions = getFeatureRegions(feature);
  const visibleRegions = regions.filter((region) => region.visible).length;
  return <article data-group-id={groupId} data-function-id={feature.id} className={`rh-algorithm ${selected ? "selected" : ""}`} onClick={onSelect} tabIndex="0" aria-current={selected ? "true" : void 0} onKeyDown={(event) => {
    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onSelect();
    }
  }}>
    <div className="rh-algorithm-title">
<div>
<span>{feature.name}</span>{selected && <em>当前预览</em>}<small className={feature.noAnnotation ? "neutral" : feature.visible ? "visible" : "hidden"}>{feature.noAnnotation ? "无需标注" : feature.visible ? `标注显示 ${visibleRegions}/${regions.length}` : "标注已隐藏"}</small>
</div>
<div>
<button className="edit-region" disabled={annotationLocked} title={annotationLocked ? "标注已锁定，请先在预览工具栏解锁" : "编辑标注区域"} onClick={(event) => {
    event.stopPropagation();
    onSelect();
    onEditRegions();
  }}>
<IconForms size={15} />编辑标注</button>{!feature.noAnnotation && <button disabled={annotationLocked} title={annotationLocked ? "标注已锁定" : feature.visible ? "隐藏标注" : "显示标注"} onClick={(event) => {
    event.stopPropagation();
    onToggleVisible();
  }}>{feature.visible ? <IconEye size={16} /> : <IconEyeOff size={16} />}</button>}<button className="danger" aria-label={feature.name + "\u5220\u9664"} title="删除监测功能" onClick={(event) => {
    event.stopPropagation();
    onDelete();
  }}>
<IconTrash size={15} /></button>
</div>
</div>
    <div className="rh-function-fields">
<div>
<small>参数</small>
<button className="rh-text-edit" title={params} onClick={(event) => {
    event.stopPropagation();
    onEditParameters();
  }}>
<span>{params}</span>
<IconPencil size={15} />
</button>
</div>
<div>
<small>标注区域</small>
<button disabled={annotationLocked} title={annotationLocked ? "标注已锁定，请先解锁" : "编辑标注区域"} className={`rh-text-edit ${feature.noAnnotation ? "rh-no-annotation" : ""}`} onClick={(event) => {
    event.stopPropagation();
    onSelect();
    onEditRegions();
  }}>
<span>{feature.noAnnotation ? "该功能无需标注区域（可修改）" : regions.length ? `已配置 ${regions.length} 个区域 路 ${visibleRegions} 个显示` : "尚未配置区域"}</span>
<IconPencil size={15} />
</button>
</div>{!feature.noAnnotation ? <input className="rh-color-input" type="color" value={feature.color} disabled={annotationLocked} onClick={(event) => event.stopPropagation()} onChange={(event) => onColor(event.target.value)} aria-label={`${feature.name}默认标注颜色`} title={annotationLocked ? "标注已锁定" : "修改功能默认标注颜色"} /> : <span className="rh-color-placeholder" />}<div className="rh-location">
<small>检测位置描述 <IconInfoCircle size={13} title="为空时报警位置回退为摄像头名称，最多 50 个字符" />
</small>
<input value={feature.description} maxLength="50" onClick={(event) => event.stopPropagation()} onChange={(event) => onDescription(event.target.value)} onBlur={(event) => onDescription(event.target.value.trim())} placeholder="非必填，为空时使用摄像头名称" />
<span>{feature.description.length}/50</span>
</div>
</div>
  </article>;
}

const platformMetricCodes = {
  damage: "belt.damage.status",
  deviation: "belt.deviation.status",
  tear: "belt.edge_tear.status",
  foreign: "belt.foreign_object.status",
  helmet: "safety.helmet.status",
  intrusion: "safety.intrusion.status"
};
const allAlgorithmMetricOptions = functionCatalog.flatMap((group) => group.functions.map((metric) => ({ ...metric, group: group.group, metricCode: metric.metricCode || platformMetricCodes[metric.id] })));

const hikvisionDeliveryDevices = [
  { id: "delivery-fixed-01", collectionStationCode: "HKV01101", collectionStationName: "#1锅炉南侧固定枪机", collectionStationRegion: "锅炉区域", annotationDataId: "hk-visible-fixed", name: "#1锅炉南侧固定枪机", ip: "10.10.1.101", type: "可见光", typeTone: "visible", status: "在线", ptz: false, zoom: "", model: "DS-2CD7A47EWD-XZ", protocol: "海康SDK", serial: "DS-2CD7A47EWD-XZ-01101", image: monitorBeltImage, algorithms: ["跑偏滴漏", "仪表识别", "+1"] },
  { id: "delivery-thermal-02", collectionStationCode: "HKV01102", collectionStationName: "#1锅炉燃烧器红外", collectionStationRegion: "锅炉区域", annotationDataId: "hk-thermal-ptz", name: "#1锅炉燃烧器红外", ip: "10.10.1.102", type: "红外热成像", typeTone: "thermal", status: "在线", ptz: false, zoom: "", model: "DS-2TD2637T-10", protocol: "海康SDK", serial: "DS-2TD2637T-10-01102", image: monitorCounterweightImage, algorithms: ["温升检测"] },
  { id: "delivery-ptz-03", collectionStationCode: "HKV01103", collectionStationName: "#1锅炉东侧云台球机", collectionStationRegion: "锅炉区域", annotationDataId: "hk-visible-ptz", name: "#1锅炉东侧云台球机", ip: "10.10.1.103", type: "云台球机", typeTone: "ptz", status: "在线", ptz: true, zoom: "32x", model: "DS-2DC4223IW-DE", protocol: "海康SDK", serial: "DS-2DC4223IW-DE123456789", image: monitorIntrusionImage, algorithms: ["跑偏滴漏", "皮带跑偏", "烟雾检测", "+2"] },
  { id: "delivery-fixed-07", collectionStationCode: "HKV01104", collectionStationName: "#1锅炉炉顶汽包枪机", collectionStationRegion: "锅炉区域", annotationDataId: "hkv001-boiler-drum-fixed", name: "#1锅炉炉顶汽包枪机", ip: "10.10.1.104", type: "可见光", typeTone: "visible", status: "在线", ptz: false, zoom: "", model: "DS-2CD7A47EWD-XZ", protocol: "海康SDK", serial: "DS-2CD7A47EWD-XZ-01104", image: monitorIntrusionImage, algorithms: ["液位识别", "仪表识别"] },
  { id: "delivery-ptz-08", collectionStationCode: "HKV01105", collectionStationName: "#1锅炉磨煤机层云台球机", collectionStationRegion: "锅炉区域", annotationDataId: "hkv001-coal-mill-ptz", name: "#1锅炉磨煤机层云台球机", ip: "10.10.1.105", type: "云台球机", typeTone: "ptz", status: "在线", ptz: true, zoom: "30x", model: "DS-2DE7430IW-AE", protocol: "海康SDK", serial: "DS-2DE7430IW-AE-01105", image: monitorIdlerImage, algorithms: ["烟火识别", "人员闯入", "+1"] },
  { id: "delivery-thermal-09", collectionStationCode: "HKV01106", collectionStationName: "#1锅炉空预器出口红外", collectionStationRegion: "锅炉区域", annotationDataId: "hkv001-air-preheater-thermal", name: "#1锅炉空预器出口红外", ip: "10.10.1.106", type: "红外热成像", typeTone: "thermal", status: "在线", ptz: false, zoom: "", model: "DS-2TD2637T-15", protocol: "海康SDK", serial: "DS-2TD2637T-15-01106", image: monitorCounterweightImage, algorithms: ["区域最高温度", "温升检测"] },
  { id: "delivery-fixed-10", collectionStationCode: "HKV01107", collectionStationName: "#1锅炉送风机层固定枪机", collectionStationRegion: "锅炉区域", annotationDataId: "hkv001-forced-draft-fixed", name: "#1锅炉送风机层固定枪机", ip: "10.10.1.107", type: "可见光", typeTone: "visible", status: "在线", ptz: false, zoom: "", model: "DS-2CD2646FWDA3-XZ", protocol: "ONVIF", serial: "DS-2CD2646FWDA3-XZ-01107", image: monitorMaterialImage, algorithms: ["设备状态识别", "人员闯入"] },
  { id: "delivery-fixed-04", collectionStationCode: "HKV02201", collectionStationName: "转载站皮带通廊枪机", collectionStationRegion: "输煤区域", annotationDataId: "hkv002-corridor-fixed", name: "转载站皮带通廊枪机", ip: "10.10.2.201", type: "可见光", typeTone: "visible", status: "离线", ptz: false, zoom: "", model: "DS-2CD2646FWDA3-XZ", protocol: "ONVIF", serial: "DS-2CD2646-02201", image: monitorMaterialImage, algorithms: ["皮带跑偏"] },
  { id: "delivery-thermal-05", collectionStationCode: "HKV02202", collectionStationName: "转载站驱动滚筒红外", collectionStationRegion: "输煤区域", annotationDataId: "hkv002-drive-thermal", name: "转载站驱动滚筒红外", ip: "10.10.2.202", type: "红外热成像", typeTone: "thermal", status: "告警", ptz: false, zoom: "", model: "DS-2TD2637T-15", protocol: "海康SDK", serial: "DS-2TD2637T-02202", image: monitorCounterweightImage, algorithms: ["区域最高温度"] },
  { id: "delivery-ptz-06", collectionStationCode: "HKV02203", collectionStationName: "转载站落料口云台球机", collectionStationRegion: "输煤区域", annotationDataId: "hkv002-discharge-ptz", name: "转载站落料口云台球机", ip: "10.10.2.203", type: "云台球机", typeTone: "ptz", status: "在线", ptz: true, zoom: "30x", model: "DS-2DE7430IW-AE", protocol: "海康SDK", serial: "DS-2DE7430-02203", image: monitorIdlerImage, algorithms: ["烟火识别", "区域入侵"] },
  { id: "delivery-fixed-11", collectionStationCode: "HKV03301", collectionStationName: "#1汽轮机前箱固定枪机", collectionStationRegion: "汽机区域", annotationDataId: "hkv003-turbine-front-bearing", name: "#1汽轮机前箱固定枪机", ip: "10.10.3.31", type: "可见光", typeTone: "visible", status: "在线", ptz: false, zoom: "", model: "DS-2CD7A47EWD-XZ", protocol: "海康SDK", serial: "DS-2CD7A47EWD-XZ-03301", image: monitorBeltImage, algorithms: ["仪表识别", "油液泄漏"] },
  { id: "delivery-ptz-12", collectionStationCode: "HKV03302", collectionStationName: "#1汽机凝汽器层云台球机", collectionStationRegion: "汽机区域", annotationDataId: "hkv003-condenser-ptz", name: "#1汽机凝汽器层云台球机", ip: "10.10.3.32", type: "云台球机", typeTone: "ptz", status: "在线", ptz: true, zoom: "32x", model: "DS-2DC4223IW-DE", protocol: "海康SDK", serial: "DS-2DC4223IW-DE-03302", image: monitorIntrusionImage, algorithms: ["人员闯入", "烟雾检测"] },
  { id: "delivery-thermal-13", collectionStationCode: "HKV03303", collectionStationName: "#1汽机润滑油站红外", collectionStationRegion: "汽机区域", annotationDataId: "hkv003-lube-oil-thermal", name: "#1汽机润滑油站红外", ip: "10.10.3.33", type: "红外热成像", typeTone: "thermal", status: "在线", ptz: false, zoom: "", model: "DS-2TD2637T-15", protocol: "海康SDK", serial: "DS-2TD2637T-03303", image: monitorCounterweightImage, algorithms: ["区域最高温度", "温升检测"] },
  { id: "delivery-fixed-14", collectionStationCode: "HKV05501", collectionStationName: "脱硫吸收塔入口枪机", collectionStationRegion: "脱硫区域", annotationDataId: "hkv005-absorber-inlet", name: "脱硫吸收塔入口枪机", ip: "10.10.5.51", type: "可见光", typeTone: "visible", status: "在线", ptz: false, zoom: "", model: "DS-2CD2646FWDA3-XZ", protocol: "ONVIF", serial: "DS-2CD2646FWDA3-05501", image: monitorSmokeImage, algorithms: ["烟雾检测", "人员闯入"] },
  { id: "delivery-thermal-15", collectionStationCode: "HKV05502", collectionStationName: "脱硫浆液循环泵红外", collectionStationRegion: "脱硫区域", annotationDataId: "hkv005-slurry-pump-thermal", name: "脱硫浆液循环泵红外", ip: "10.10.5.52", type: "红外热成像", typeTone: "thermal", status: "告警", ptz: false, zoom: "", model: "DS-2TD2637T-10", protocol: "海康SDK", serial: "DS-2TD2637T-05502", image: monitorCounterweightImage, algorithms: ["区域最高温度", "温升检测"] },
  { id: "delivery-ptz-16", collectionStationCode: "HKV05503", collectionStationName: "脱硫石膏脱水间云台球机", collectionStationRegion: "脱硫区域", annotationDataId: "hkv005-gypsum-ptz", name: "脱硫石膏脱水间云台球机", ip: "10.10.5.53", type: "云台球机", typeTone: "ptz", status: "在线", ptz: true, zoom: "30x", model: "DS-2DE7430IW-AE", protocol: "海康SDK", serial: "DS-2DE7430IW-AE-05503", image: monitorMaterialImage, algorithms: ["积料识别", "区域入侵"] },
  { id: "delivery-fixed-17", collectionStationCode: "HKV06601", collectionStationName: "220kV主变区域固定枪机", collectionStationRegion: "电气区域", annotationDataId: "hkv006-transformer-fixed", name: "220kV主变区域固定枪机", ip: "10.10.6.61", type: "可见光", typeTone: "visible", status: "在线", ptz: false, zoom: "", model: "DS-2CD7A47EWD-XZ", protocol: "海康SDK", serial: "DS-2CD7A47EWD-XZ-06601", image: monitorIntrusionImage, algorithms: ["人员闯入", "烟火识别"] },
  { id: "delivery-thermal-18", collectionStationCode: "HKV06602", collectionStationName: "220kV主变套管红外", collectionStationRegion: "电气区域", annotationDataId: "hkv006-bushing-thermal", name: "220kV主变套管红外", ip: "10.10.6.62", type: "红外热成像", typeTone: "thermal", status: "在线", ptz: false, zoom: "", model: "DS-2TD2637T-15", protocol: "海康SDK", serial: "DS-2TD2637T-06602", image: monitorCounterweightImage, algorithms: ["区域最高温度", "温升检测"] },
  { id: "delivery-ptz-19", collectionStationCode: "HKV06603", collectionStationName: "升压站东侧云台球机", collectionStationRegion: "电气区域", annotationDataId: "hkv006-switchyard-ptz", name: "升压站东侧云台球机", ip: "10.10.6.63", type: "云台球机", typeTone: "ptz", status: "在线", ptz: true, zoom: "32x", model: "DS-2DC4223IW-DE", protocol: "海康SDK", serial: "DS-2DC4223IW-DE-06603", image: monitorSmokeImage, algorithms: ["区域入侵", "烟雾检测"] }
];
const hikvisionAnnotationTargetByDevice = Object.freeze({
  "delivery-fixed-01": { dataId: "hk-visible-fixed-south-platform", stationCode: "HKV01101", targetLabel: "南侧平台设备巡检位" },
  "delivery-thermal-02": { dataId: "hk-thermal-ptz-burner-temperature", stationCode: "HKV01102", targetLabel: "燃烧器温度巡检位" },
  "delivery-ptz-03": { dataId: "hk-visible-ptz-boiler-east", stationCode: "HKV01103", targetLabel: "炉膛东侧巡检位" }
});
const hikvisionAnnotationDataIdFor = (device) => {
  if (!device?.id) return "";
  return device.annotationDataId || device.id;
};
const hikvisionAnnotationTargetFor = (device) => {
  if (!device) return null;
  const annotationDataId = hikvisionAnnotationDataIdFor(device);
  return hikvisionAnnotationTargetByDevice[device.id]
    || (annotationDataId ? {
      dataId: `${annotationDataId}-inspection-point`,
      stationCode: device.collectionStationCode,
      targetLabel: `${device.name}巡检位 · 算法标注`
    } : null);
};
const hikvisionDataOptionFromRecord = (device) => {
  const dataId = hikvisionAnnotationDataIdFor(device);
  const basePath = device.collectionStationName === device.name ? device.name : (device.collectionStationName || "未命名采集站") + "/" + device.name;
  return createHikvisionDeviceOption({
    id: dataId,
    label: device.name,
    path: basePath,
    type: "device",
    vendor: "Hikvision",
    model: device.model,
    media: device.type === "红外热成像" ? "红外+可见光" : "可见光",
    ptz: Boolean(device.ptz),
    ip: device.ip,
    protocol: device.protocol,
    image: device.image,
    sourceRecordId: device.id
  }, [{
    id: dataId + "-inspection-point",
    label: device.name + "巡检位",
    path: basePath + "/视频测点/" + device.name + "巡检位",
    presetName: device.ptz ? "默认预置位" : "固定视角"
  }]);
};
const getCollectionStationCameraPoints = () => hikvisionDeliveryDevices.flatMap((device) => {
  const generatedDevice = hikvisionDataOptionFromRecord(device);
  const catalogDevice = dataOptions.find((option) => option.id === generatedDevice.id && option.vendor === "Hikvision");
  const measurementPoints = catalogDevice?.children?.length ? catalogDevice.children : generatedDevice.children;
  return measurementPoints.map((point) => ({
    pointId: point.id,
    pointName: point.label,
    cameraId: device.id,
    cameraName: device.name,
    stationCode: device.collectionStationCode,
    stationName: device.collectionStationName,
    region: device.collectionStationRegion,
    model: device.model,
    ip: device.ip,
    protocol: device.protocol,
    media: device.type,
    status: device.status,
    preset: point.presetName || point.ptzView?.preset || (device.ptz ? "默认预置位" : "固定视角"),
    algorithms: (device.algorithms || []).filter((algorithm) => !algorithm.startsWith("+")),
  }));
});
const getHikvisionDevicesForStation = (stationCode) => cloneDeviceRecords(
  hikvisionDeliveryDevices.filter((device) => device.collectionStationCode === stationCode)
);
const createHikvisionBindingsForStation = (stationCode) => {
  return getHikvisionDevicesForStation(stationCode)
    .filter((device) => device.annotationDataId)
    .flatMap((device, deviceIndex) => {
      const cameraData = hikvisionDataOptionFromRecord(device);
      const catalogDevice = dataOptions.find((option) => option.id === cameraData.id && option.vendor === "Hikvision");
      const measurementPoints = catalogDevice?.children?.length ? catalogDevice.children : cameraData.children;
      const functionIds = device.type === "红外热成像" ? ["hk-max-temperature"] : ["hk-fire-smoke", "hk-intrusion"];
      return measurementPoints.map((data, pointIndex) => ({
        id: data.id,
        data: { ...data, ptzView: { ...data.ptzView } },
        open: pointIndex === 0,
        functions: functionIds.map((functionId, functionIndex) => createFunction(functionId, 100 + deviceIndex * 20 + pointIndex * 5 + functionIndex))
      }));
    });
};
const hikDrawerMaxForViewport = () => window.innerWidth <= 1450 ? 420 : window.innerWidth <= 1700 ? 580 : 650;

function HikvisionAccessPanel({ stationCode, stationName, stationRegion, values, onChange, devices, online, flash, onOpenAnnotation, onEditorDirtyChange, onSelectStation, initialContext }) {
  const initialRecords = values.deviceRecords?.length ? cloneDeviceRecords(values.deviceRecords) : getHikvisionDevicesForStation(stationCode);
  const initialSelectedId = initialContext?.selectedId && initialRecords.some((device) => device.id === initialContext.selectedId) ? initialContext.selectedId : initialRecords.find((device) => device.ptz && device.status === "在线")?.id || initialRecords[0]?.id || "";
  const initialDeviceEditor = { ...(initialRecords.find((device) => device.id === initialSelectedId) || initialRecords[0] || {}), port: values.servicePort, username: "admin", password: "Hikvision@2026", channel: "1", stream: "主码流", resolution: "1920 × 1080", fps: "25" };
  const [deviceRecords, setDeviceRecords] = useState(() => cloneDeviceRecords(initialRecords));
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [drawerOpen, setDrawerOpen] = useState(initialContext?.drawerOpen ?? true);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = Number(window.localStorage.getItem("rh-hik-drawer-width-v2"));
    const responsiveMax = hikDrawerMaxForViewport();
    return Number.isFinite(saved) && saved >= 460 && saved <= responsiveMax ? saved : responsiveMax;
  });
  const [drawerTab, setDrawerTab] = useState(initialContext?.drawerTab || "视频接入");
  const [query, setQuery] = useState(initialContext?.query || "");
  const [orgQuery, setOrgQuery] = useState(initialContext?.orgQuery || "");
  const [typeFilter, setTypeFilter] = useState(initialContext?.typeFilter || "全部");
  const [statusFilter, setStatusFilter] = useState(initialContext?.statusFilter || "全部");
  const [treeNode, setTreeNode] = useState(initialContext?.treeNode || "全部设备");
  const [treeExpanded, setTreeExpanded] = useState({ plant: true, production: true });
  const [expandedAreas, setExpandedAreas] = useState(() => new Set(initialContext?.expandedAreas?.length ? initialContext.expandedAreas : [stationRegion]));
  const [selectedRows, setSelectedRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState("15:58");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [metricSyncing, setMetricSyncing] = useState(false);
  const [metricLastSynced, setMetricLastSynced] = useState("2026-07-23 10:12");
  const [metricQuery, setMetricQuery] = useState("");
  const [metricSourceFilter, setMetricSourceFilter] = useState("全部来源");
  const [metricStatusFilter, setMetricStatusFilter] = useState("全部状态");
  const [controlZoom, setControlZoom] = useState(initialDeviceEditor.ptz ? 1 : 100);
  const [controlPreset, setControlPreset] = useState("锅炉全景");
  const [controlStatus, setControlStatus] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [deliveryReviewOpen, setDeliveryReviewOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const drawerResizeRef = useRef(null);
  const tableWrapRef = useRef(null);
  const moreMenuRef = useRef(null);
  const [form, setForm] = useState(() => ({ ...initialDeviceEditor }));
  const [formBaseline, setFormBaseline] = useState(() => ({ ...initialDeviceEditor }));
  const selectedDevice = deviceRecords.find((item) => item.id === selectedId);
  const formDirty = !sameConfig(form, formBaseline);
  useEffect(() => {
    setControlZoom(form.ptz ? 1 : 100);
    setControlPreset("锅炉全景");
    setControlStatus("");
  }, [selectedId, form.ptz, form.status]);
  const formErrors = {
    name: !form.name?.trim(),
    ip: !isIPv4(form.ip || ""),
    port: !Number.isInteger(Number(form.port)) || Number(form.port) < 1 || Number(form.port) > 65535,
    username: !form.username?.trim(),
    serial: !form.serial?.trim()
  };
  const formValid = !Object.values(formErrors).some(Boolean);
  const captureAccessContext = (device = selectedDevice) => ({
    selectedId: device?.id || selectedId,
    drawerOpen,
    drawerTab,
    query,
    orgQuery,
    typeFilter,
    statusFilter,
    treeNode,
    expandedAreas: [...expandedAreas],
    tableScrollTop: tableWrapRef.current?.scrollTop || 0,
    stationCode
  });
  const requestAnnotation = (device = selectedDevice) => {
    if (!device) return flash("请先选择需要配置算法标注的设备", "warning");
    if (formDirty) return flash("当前设备有未应用修改，请先应用或取消后再进入算法标注", "warning");
    const target = hikvisionAnnotationTargetFor(device);
    if (!target) {
      openDevice(device, true);
      setDrawerTab("算法指标");
      setDrawerOpen(true);
      return flash("该摄像头尚未生成算法配置上下文，已定位到“算法指标”", "warning");
    }
    if (target.stationCode !== stationCode) return flash(`设备归属异常：${device.name} 不属于当前采集站 ${stationCode}`, "error");
    onOpenAnnotation?.({
      ...target,
      device: { id: device.id, name: device.name, ip: device.ip, type: device.type, status: device.status },
      returnContext: captureAccessContext(device)
    });
  };
  const drawerMaxWidth = hikDrawerMaxForViewport();
  useEffect(() => {
    const syncDrawerWidth = () => setDrawerWidth((current) => Math.min(current, hikDrawerMaxForViewport()));
    window.addEventListener("resize", syncDrawerWidth);
    return () => window.removeEventListener("resize", syncDrawerWidth);
  }, []);
  const stats = {
    total: deviceRecords.length,
    online: deviceRecords.filter((item) => item.status === "在线").length,
    offline: deviceRecords.filter((item) => item.status === "离线").length,
    alarm: deviceRecords.filter((item) => item.status === "告警").length,
    abnormal: deviceRecords.filter((item) => item.status === "告警" || item.status === "离线").length,
    ptz: deviceRecords.filter((item) => item.ptz).length
  };
  const orgTerm = orgQuery.trim().toLowerCase();
  const organizationDevices = [
    ...hikvisionDeliveryDevices.filter((device) => device.collectionStationCode !== stationCode),
    ...deviceRecords
  ];
  const organizationGroups = stationRegionOrder.map((region) => {
    const regionMatch = region.toLowerCase().includes(orgTerm);
    const regionStations = stations
      .filter(([code, , stationArea]) => code.startsWith("HKV") && stationArea === region)
      .map(([code, name]) => {
        const stationDevices = organizationDevices.filter((device) => device.collectionStationCode === code);
        const stationMatch = regionMatch || `${code}${name}${region}`.toLowerCase().includes(orgTerm);
        const matchingDevices = !orgTerm || stationMatch
          ? stationDevices
          : stationDevices.filter((device) => `${device.name}${device.ip}${device.serial}`.toLowerCase().includes(orgTerm));
        return { code, name, devices: matchingDevices, total: stationDevices.length, matched: stationMatch || matchingDevices.length > 0 };
      })
      .filter((station) => !orgTerm || station.matched);
    return { region, stations: regionStations };
  }).filter((group) => group.stations.length);
  const stationStatusClassFor = (code) => {
    const items = organizationDevices.filter((device) => device.collectionStationCode === code);
    if (items.some((item) => item.status === "告警")) return "alarm";
    if (items.some((item) => item.status === "离线")) return "offline";
    return "online";
  };
  const toggleArea = (name) => setExpandedAreas((current) => {
    const next = new Set(current);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    return next;
  });
  const deviceHealth = (device) => {
    if (device.status === "离线") return { blocking: true, tone: "offline", label: "设备离线", detail: "网络不可达，视频流与算法能力无法验证", tab: "视频接入" };
    if (device.status === "告警") return { blocking: true, tone: "alarm", label: "视频流异常", detail: "设备已连接，但主码流连续取流失败", tab: "视频接入" };
    if (!device.algorithms?.length) return { blocking: true, tone: "warning", label: "未配置算法", detail: "视频接入正常，尚未配置任何算法检测", tab: "算法指标" };
    return { blocking: false, tone: "ready", label: "交付就绪", detail: `${device.ptz ? "云台能力、" : ""}视频流和算法指标均已验证`, tab: "视频接入" };
  };
  const deliveryStatusFor = (device) => deviceHealth(device).label;
  const visibleDevices = deviceRecords.filter((item) => {
    const matchesQuery = !query.trim() || `${item.name}${item.ip}${item.serial}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesDelivery = statusFilter === "全部" || deliveryStatusFor(item) === statusFilter;
    return matchesQuery && (typeFilter === "全部" || item.type === typeFilter) && matchesDelivery;
  });
  const scopeDevices = deviceRecords;
  const scopeBlockingDevices = scopeDevices.filter((device) => deviceHealth(device).blocking);
  const scopeReadyCount = scopeDevices.length - scopeBlockingDevices.length;
  const scopeBlockReasons = [
    [scopeBlockingDevices.filter((device) => device.status === "离线").length, "离线"],
    [scopeBlockingDevices.filter((device) => device.status === "告警").length, "码流异常"],
    [scopeBlockingDevices.filter((device) => device.status !== "离线" && device.status !== "告警" && !device.algorithms?.length).length, "未配算法"]
  ].filter(([count]) => count > 0);
  const displayedDevices = visibleDevices;
  const blockingCount = displayedDevices.filter((device) => deviceHealth(device).blocking).length;
  const totalPages = Math.max(1, Math.ceil(displayedDevices.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedDevices = displayedDevices.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allVisibleSelected = pagedDevices.length > 0 && pagedDevices.every((item) => selectedRows.includes(item.id));
  useEffect(() => setPage(1), [query, typeFilter, statusFilter, treeNode, pageSize]);
  useEffect(() => {
    const move = (event) => {
      if (!drawerResizeRef.current) return;
      const next = Math.max(460, Math.min(drawerMaxWidth, drawerResizeRef.current.startWidth + drawerResizeRef.current.startX - event.clientX));
      setDrawerWidth(next);
    };
    const stop = () => {
      if (!drawerResizeRef.current) return;
      drawerResizeRef.current = null;
      document.body.classList.remove("rh-resizing");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      document.body.classList.remove("rh-resizing");
    };
  }, []);
  useEffect(() => {
    window.localStorage.setItem("rh-hik-drawer-width-v2", String(drawerWidth));
  }, [drawerWidth]);
  useEffect(() => {
    const closeMore = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "mousedown" && moreMenuRef.current?.contains(event.target)) return;
      setMoreOpen(false);
    };
    document.addEventListener("mousedown", closeMore);
    window.addEventListener("keydown", closeMore);
    return () => {
      document.removeEventListener("mousedown", closeMore);
      window.removeEventListener("keydown", closeMore);
    };
  }, []);
  useEffect(() => {
    const closeReview = (event) => {
      if (event.key === "Escape") setDeliveryReviewOpen(false);
    };
    window.addEventListener("keydown", closeReview);
    return () => window.removeEventListener("keydown", closeReview);
  }, []);
  useEffect(() => {
    onEditorDirtyChange?.(formDirty);
    return () => onEditorDirtyChange?.(false);
  }, [formDirty, onEditorDirtyChange]);
  useEffect(() => {
    const restore = window.requestAnimationFrame(() => {
      if (tableWrapRef.current) tableWrapRef.current.scrollTop = initialContext?.tableScrollTop || 0;
      document.querySelector(`[data-device-id="${initialSelectedId}"]`)?.scrollIntoView({ block: "nearest" });
    });
    return () => window.cancelAnimationFrame(restore);
  }, []);
  const resizeDrawerWithKeyboard = (event) => {
    const step = event.shiftKey ? 40 : 10;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setDrawerWidth((current) => Math.min(drawerMaxWidth, current + step));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setDrawerWidth((current) => Math.max(460, current - step));
    } else if (event.key === "Home") {
      event.preventDefault();
      setDrawerWidth(drawerMaxWidth);
    }
  };
  const editorValueFor = (device) => ({ ...device, port: device.port || values.servicePort, username: device.username || "admin", password: device.password || "Hikvision@2026", channel: device.channel || "1", stream: device.stream || "主码流", resolution: device.resolution || "1920 × 1080", fps: device.fps || "25" });
  const openDevice = (device, force = false) => {
    if (!force && formDirty && device.id !== selectedId) {
      flash("当前设备有未应用修改，请先应用到页面草稿或取消修改", "warning");
      return;
    }
    const nextForm = editorValueFor(device);
    setSelectedId(device.id);
    setForm(nextForm);
    setFormBaseline(nextForm);
    setTestResult("");
    setDrawerOpen(true);
    setDrawerTab("视频接入");
  };
  const beginCreateDevice = () => {
    if (formDirty) {
      flash("请先处理当前设备的未应用修改", "warning");
      return;
    }
    const draft = { id: "", collectionStationCode: stationCode, collectionStationName: stationName, name: "", ip: "", type: "云台球机", typeTone: "ptz", status: "未测试", ptz: true, model: "", protocol: "海康SDK", serial: "", collectionStationRegion: stationRegion, port: values.servicePort, username: "admin", password: "", channel: "1", stream: "主码流", resolution: "1920 × 1080", fps: "25", algorithms: [] };
    setSelectedId("");
    setForm(draft);
    setFormBaseline(draft);
    setTestResult("");
    setDrawerOpen(true);
    setDrawerTab("视频接入");
  };
  const cancelDeviceChanges = () => {
    setForm({ ...formBaseline });
    setTestResult("");
    setDrawerOpen(false);
    if (formDirty) flash("已取消当前设备的未应用修改", "info");
  };
  const requestCloseDrawer = () => formDirty ? flash("当前设备有未应用修改，请使用底部“取消修改”或“应用到页面草稿”", "warning") : setDrawerOpen(false);
  const toggleRow = (id) => setSelectedRows((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAllVisible = () => setSelectedRows((current) => allVisibleSelected ? current.filter((id) => !pagedDevices.some((item) => item.id === id)) : [...new Set([...current, ...pagedDevices.map((item) => item.id)])]);
  const updateDeviceDraft = (nextRecords, message) => {
    setDeviceRecords(nextRecords);
    onChange("deviceRecords", nextRecords);
    onChange("deviceDraftRevision", Number(values.deviceDraftRevision || 0) + 1);
    flash(`${message}；仍需点击顶部“保存平台版本”`);
  };
  const importDevices = (rows) => {
    const now = Date.now();
    const imported = rows.map((row, index) => ({
      ...row,
      id: `delivery-import-${now}-${index + 1}`,
      typeTone: row.type === "红外热成像" ? "thermal" : row.type === "云台球机" ? "ptz" : "visible",
      status: "未测试",
      ptz: row.type === "云台球机",
      zoom: row.type === "云台球机" ? "32x" : "",
      image: row.type === "红外热成像" ? monitorCounterweightImage : row.type === "云台球机" ? monitorIntrusionImage : monitorBeltImage,
      algorithms: [],
      channel: "1",
      annotationDataId: `hik-access-device-${now}-${index + 1}`,
      collectionStationCode: stationCode,
      collectionStationName: stationName,
      collectionStationRegion: stationRegion
    }));
    updateDeviceDraft([...deviceRecords, ...imported], `已导入 ${imported.length} 台设备到页面草稿`);
    setBatchImportOpen(false);
    setTreeNode("全部设备");
    setPage(Math.ceil((deviceRecords.length + imported.length) / pageSize));
  };
  const applyBatchAlgorithms = () => {
    if (formDirty) return flash("当前设备有未应用修改，请先应用或取消", "warning");
    const selectedSet = new Set(selectedRows);
    const nextRecords = deviceRecords.map((device) => selectedSet.has(device.id)
      ? { ...device, algorithms: [...new Set([...(device.algorithms || []).filter((item) => !item.startsWith("+")), "视频信号", "烟火识别"])] }
      : device);
    updateDeviceDraft(nextRecords, `已为 ${selectedRows.length} 台设备接入通用视频指标`);
    setSelectedRows([]);
  };
  const downloadDeviceList = () => {
    const headers = ["采集站编码", "采集站名称", "设备名称", "IP地址", "设备类型", "型号", "序列号", "状态", "算法指标"];
    const csv = [headers, ...displayedDevices.map((device) => [stationCode, stationName, device.name, device.ip, device.type, device.model, device.serial, device.status, (device.algorithms || []).join("|")])]
      .map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `海康设备清单-${stationCode}-${Date.now()}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    setMoreOpen(false);
    flash(`已导出当前范围 ${displayedDevices.length} 台设备`);
  };
  const batchTest = () => {
    if (refreshing) return;
    setMoreOpen(false);
    setRefreshing(true);
    const count = selectedRows.length || displayedDevices.length;
    window.setTimeout(() => {
      setRefreshing(false);
      const blocked = Math.min(count, stats.abnormal);
      flash(`批量连接测试完成：${count - blocked} 台通过，${blocked} 台需处理`, blocked ? "warning" : "success");
    }, 750);
  };
  const batchSyncMetrics = () => {
    setMoreOpen(false);
    setMetricLastSynced("刚刚");
    flash(`已同步当前范围 ${displayedDevices.length} 台设备的算法指标目录`);
  };
  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      setLastCheckedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
      flash(`已刷新 ${deviceRecords.length} 台海康设备的在线、视频流和算法通道状态`);
    }, 650);
  };
  const focusNextBlocker = () => {
    if (formDirty) return flash("当前设备有未应用修改，请先应用或取消后再处理阻塞项", "warning");
    const next = scopeBlockingDevices.find((device) => device.id !== selectedId) || scopeBlockingDevices[0];
    setStatusFilter("全部");
    setQuery("");
    setSelectedRows([]);
    if (!next) return flash("当前范围全部设备已通过交付检查", "success");
    openDevice(next);
    setDrawerTab(deviceHealth(next).tab);
    window.requestAnimationFrame(() => document.querySelector(`[data-device-id="${next.id}"]`)?.scrollIntoView({ block: "nearest" }));
    flash(`已定位：${next.name} · ${deviceHealth(next).label}`, "info");
  };
  const locateDeliveryBlocker = (device) => {
    if (formDirty) return flash("当前设备有未应用修改，请先应用或取消后再处理阻塞项", "warning");
    setDeliveryReviewOpen(false);
    setStatusFilter("全部");
    setQuery("");
    setSelectedRows([]);
    openDevice(device);
    setDrawerTab(deviceHealth(device).tab);
    window.requestAnimationFrame(() => document.querySelector(`[data-device-id="${device.id}"]`)?.scrollIntoView({ block: "nearest" }));
    flash(`已定位：${device.name} · ${deviceHealth(device).label}`, "info");
  };
  const exportDeliveryChecklist = () => {
    const headers = ["采集站编码", "采集站名称", "设备名称", "IP地址", "交付结论", "阻塞原因", "建议处理入口"];
    const rows = scopeDevices.map((device) => {
      const health = deviceHealth(device);
      return [stationCode, stationName, device.name, device.ip, health.label, health.detail, health.tab];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `采集站交付检查单-${Date.now()}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    flash(`已导出当前范围 ${scopeDevices.length} 台设备的交付检查单`);
  };
  const deliveryGates = [
    { label: "基础信息", passed: scopeDevices.filter((device) => device.name && isIPv4(device.ip || "") && device.serial).length, detail: "名称、IP、序列号完整" },
    { label: "设备连接", passed: scopeDevices.filter((device) => device.status !== "离线").length, detail: "设备登录与能力探测可用" },
    { label: "视频取流", passed: scopeDevices.filter((device) => device.status === "在线").length, detail: "主码流连续取流正常" },
    { label: "算法标注", passed: scopeDevices.filter((device) => device.algorithms?.length).length, detail: "至少为一个已有测点绑定海康原生或平台算法指标" }
  ];
  const saveDevice = () => {
    if (!formValid) return flash("请先修正基础信息中的必填项和格式错误", "error");
    if (!formDirty) return flash("当前设备没有待应用的修改", "info");
    setSaving(true);
    window.setTimeout(() => {
      const id = form.id || `delivery-custom-${Date.now()}`;
      const savedDevice = {
        ...form,
        id,
        collectionStationCode: stationCode,
        collectionStationName: stationName,
        collectionStationRegion: stationRegion,
        annotationDataId: form.annotationDataId || `hik-access-device-${id}`,
        typeTone: form.type === "红外热成像" ? "thermal" : form.type === "云台球机" ? "ptz" : "visible",
        zoom: form.ptz ? form.zoom || "32x" : ""
      };
      setDeviceRecords((current) => {
        const nextRecords = current.some((item) => item.id === id) ? current.map((item) => item.id === id ? savedDevice : item) : [...current, savedDevice];
        onChange("deviceRecords", nextRecords);
        return nextRecords;
      });
      setSelectedId(id);
      setForm(savedDevice);
      setFormBaseline(savedDevice);
      setSaving(false);
      setTestResult("passed");
      onChange("servicePort", savedDevice.port);
      onChange("deviceDraftRevision", Number(values.deviceDraftRevision || 0) + 1);
      flash(`${savedDevice.name}已应用到页面草稿；仍需点击顶部“保存”生成平台版本`);
    }, 650);
  };
  const testConnection = () => {
    if (!formValid) return flash("请先补齐设备名称、合法 IP、端口、用户名和序列号", "error");
    if (testing) return;
    setTesting(true);
    setTestResult("");
    window.setTimeout(() => {
      setTesting(false);
      setTestResult("passed");
      flash("连接测试通过：设备登录、视频取流和能力探测均正常");
    }, 850);
  };
  const metricSupported = (metric) => {
    if (metric.id === "hk-max-temperature") return form.type === "红外热成像";
    if (!metric.nativeMetric && form.type === "红外热成像") return false;
    return true;
  };
  const metricKeywords = {
    "hk-fire-smoke": ["烟雾", "烟火"],
    "hk-max-temperature": ["温升", "温度"],
    "hk-intrusion": ["区域入侵", "海康入侵"],
    "hk-video-loss": ["视频信号", "断流"],
    damage: ["皮带损伤", "损伤"],
    deviation: ["皮带跑偏", "跑偏"],
    tear: ["皮带撕裂", "边缘撕裂"],
    foreign: ["皮带异物", "异物"],
    helmet: ["安全帽"],
    intrusion: ["人员闯入", "人员入侵"]
  };
  const metricBound = (metric) => metricSupported(metric) && form.algorithms?.some((item) => metricKeywords[metric.id]?.some((keyword) => item.includes(keyword)));
  const supportedMetricCount = allAlgorithmMetricOptions.filter(metricSupported).length;
  const boundMetricCount = allAlgorithmMetricOptions.filter(metricBound).length;
  const metricCatalogItems = allAlgorithmMetricOptions
    .map((metric) => {
      const supported = metricSupported(metric);
      const bound = metricBound(metric);
      return { ...metric, supported, bound, status: bound ? "已接入" : supported ? "可接入" : "机型不支持" };
    })
    .filter((metric) => {
      const term = metricQuery.trim().toLowerCase();
      const sourceLabel = metric.nativeMetric ? "设备原生" : "平台算法";
      const matchesQuery = !term || [metric.name, metric.metricCode, metric.group, sourceLabel].some((value) => String(value || "").toLowerCase().includes(term));
      const matchesSource = metricSourceFilter === "全部来源" || metricSourceFilter === sourceLabel;
      const matchesStatus = metricStatusFilter === "全部状态" || metricStatusFilter === metric.status;
      return matchesQuery && matchesSource && matchesStatus;
    })
    .sort((a, b) => Number(b.bound) - Number(a.bound) || Number(b.supported) - Number(a.supported) || a.name.localeCompare(b.name, "zh-CN"));
  const metricCatalogBlockedReason = !form.id
    ? "新增设备需先应用到页面草稿，再配置算法指标"
    : formDirty
      ? "当前设备有未应用修改，请先保存或取消"
      : form.status === "离线"
        ? "设备离线，无法同步目录或进入算法标注"
        : "";
  const syncMetricCatalog = () => {
    if (metricCatalogBlockedReason) return flash(metricCatalogBlockedReason, "warning");
    if (metricSyncing) return;
    setMetricSyncing(true);
    window.setTimeout(() => {
      setMetricSyncing(false);
      setMetricLastSynced("刚刚");
      flash(`指标目录同步完成：发现 ${allAlgorithmMetricOptions.length} 项，当前设备支持 ${supportedMetricCount} 项`);
    }, 650);
  };
  const controlReady = Boolean(form.ptz && form.status !== "离线");
  const controlUnavailableReason = form.status === "离线"
    ? "设备离线，控制通道不可达；请先在“视频接入”恢复连接"
    : !form.ptz
      ? `型号 ${form.model || "未识别"} 未声明 PTZ 能力，旋转、光学变焦、聚焦和预置位不可用`
      : "";
  const runControlCommand = (label) => {
    if (!controlReady) return flash(controlUnavailableReason, "warning");
    setControlStatus(`执行中 · ${label}`);
    window.setTimeout(() => {
      setControlStatus(`已完成 · ${label}`);
      flash(`${form.name}：${label} 已执行并停止`, "info");
    }, 260);
  };
  const applyControlZoom = (nextValue) => {
    const next = Number(nextValue);
    setControlZoom(next);
    setControlStatus(form.ptz ? `光学变焦已调整至 ${next}x` : `数字缩放已调整至 ${next}%`);
  };
  const invokeControlPreset = () => runControlCommand(`调用预置位“${controlPreset}”`);
  return <div className={`rh-hik-delivery ${drawerOpen ? "drawer-open" : ""}`} style={{ "--hik-drawer-width": `${drawerWidth}px` }}>
    <div className="rh-hik-view-tabs">
      <div className="rh-hik-single-view-title"><strong>设备接入</strong><small>{stationCode} · {stationName} · {stats.total} 台摄像头</small></div>
      <div className={`rh-hik-delivery-summary ${scopeBlockingDevices.length ? "blocked" : "ready"}`}>
        <button className="rh-hik-delivery-score" onClick={() => setDeliveryReviewOpen(true)} title="打开交付检查单"><IconChecklist size={16} /><strong>{scopeReadyCount}/{scopeDevices.length}</strong><small>交付就绪</small></button>
        <span className="rh-hik-delivery-reasons">
          {scopeBlockReasons.length ? scopeBlockReasons.map(([count, label]) => <button key={label} onClick={() => setStatusFilter({ "离线": "设备离线", "码流异常": "视频流异常", "未配算法": "未配置算法" }[label])}>{count} {label}</button>) : <i>当前范围无阻塞</i>}
          <small>最近检测 {lastCheckedAt}</small>
        </span>
        <button className="review" onClick={() => setDeliveryReviewOpen(true)}><IconChecklist size={14} />交付检查</button>
        <button className="next" onClick={focusNextBlocker}>{scopeBlockingDevices.length ? "处理下一个阻塞项" : "查看交付结果"}<IconChevronRight size={14} /></button>
      </div>
    </div>
    <aside className="rh-hik-org">
      <header><span>区域 / 采集站 / 摄像头</span><small>{stationRegionOrder.length} 区 · {organizationDevices.length} 台</small></header>
      <label className="rh-hik-org-search">
        <IconSearch size={15} />
        <input value={orgQuery} onChange={(event) => { setOrgQuery(event.target.value); if (event.target.value) setTreeExpanded((current) => ({ ...current, plant: true })); }} placeholder="搜索区域、采集站、摄像头或 IP" />
        {orgQuery && <button type="button" onClick={() => setOrgQuery("")} aria-label="清空组织树搜索"><IconX size={13} /></button>}
      </label>
      <div className="rh-hik-org-tree">
        <button className="root" aria-expanded={treeExpanded.plant} onClick={() => setTreeExpanded((current) => ({ ...current, plant: !current.plant }))}>
          {treeExpanded.plant ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}<IconBuildingFactory size={16} /><span>示范火电厂</span><small>{organizationDevices.length} 台</small>
        </button>
        {treeExpanded.plant && organizationGroups.map((group) => {
          const areaOpen = Boolean(orgTerm) || expandedAreas.has(group.region);
          return <div className="rh-hik-org-branch" key={group.region}>
            <div className="rh-hik-area-row">
              <button className="rh-hik-area-toggle" aria-label={`${areaOpen ? "收起" : "展开"}${group.region}`} aria-expanded={areaOpen} onClick={() => toggleArea(group.region)}>
                {areaOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </button>
              <button className={`rh-hik-area-select ${group.region === stationRegion ? "selected" : ""}`} onClick={() => toggleArea(group.region)}>
                <IconDatabase size={14} /><span>{group.region}</span><small>{group.stations.length} 个采集站</small>
              </button>
            </div>
            {areaOpen && group.stations.map((station) => <div className="rh-hik-station-branch" key={station.code}>
              <button className={`rh-hik-station-node ${station.code === stationCode ? "selected" : ""}`} onClick={() => station.code === stationCode ? setTreeNode("全部设备") : onSelectStation?.(station.code)} title={`${station.code} · ${station.name}`}>
                <IconDatabase size={15} /><span><b>{station.code}</b><small>{station.name}</small></span><i className={stationStatusClassFor(station.code)} />
              </button>
              {(station.code === stationCode || orgTerm) && station.devices.map((device) => <button
                key={device.id}
                className={`rh-hik-device-node ${station.code === stationCode && selectedId === device.id ? "current" : ""}`}
                onClick={() => station.code === stationCode ? openDevice(device) : onSelectStation?.(station.code)}
                title={`${device.name} · ${device.ip}`}
              >
                <IconCamera size={14} /><span><b>{device.name}</b><small>{device.ip}</small></span><i className={device.status === "在线" ? "online" : device.status === "告警" ? "alarm" : "offline"} />
              </button>)}
            </div>)}
          </div>;
        })}
        {orgTerm && !organizationGroups.length && <div className="rh-hik-org-empty"><IconSearch size={18} /><span>未找到匹配的区域、采集站或摄像头</span><button onClick={() => setOrgQuery("")}>清空搜索</button></div>}
      </div>
    </aside>
    <main className="rh-hik-device-list">
      <div className="rh-hik-list-toolbar">
        <button className="primary" onClick={beginCreateDevice}><IconPlus size={16} />新增设备</button>
        <button onClick={() => formDirty ? flash("当前设备有未应用修改，请先应用或取消", "warning") : setBatchImportOpen(true)}><IconUpload size={15} />批量导入</button>
        {selectedRows.length > 0 && <><span className="rh-hik-selection">已选 {selectedRows.length} 台</span><button onClick={applyBatchAlgorithms}>批量接入算法</button><button onClick={() => setSelectedRows([])}>取消选择</button></>}
        <div className="rh-hik-more-wrap" ref={moreMenuRef}><button aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}>更多<IconChevronDown size={14} /></button>{moreOpen && <div className="rh-hik-list-more">
          <button onClick={() => { setMoreOpen(false); refresh(); }}><IconRefresh size={14} />刷新设备状态</button>
          <button onClick={batchTest}><IconRefresh size={14} />{selectedRows.length ? `测试已选 ${selectedRows.length} 台` : "测试当前范围"}</button>
          <button onClick={batchSyncMetrics}><IconActivity size={14} />同步指标目录</button>
          <button onClick={downloadDeviceList}><IconDatabase size={14} />导出设备清单</button>
        </div>}</div>
        <span className="rh-hik-scope-note">当前采集站：<b>{stationCode}</b> · {stationName} · {displayedDevices.length} 台</span>
      </div>
      <div className="rh-hik-filters">
        <label>设备类型<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>全部</option><option>可见光</option><option>红外热成像</option><option>云台球机</option></select></label>
        <label>交付状态<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>全部</option><option>交付就绪</option><option>设备离线</option><option>视频流异常</option><option>未配置算法</option></select></label>
        <label className="search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索设备名称/IP/序列号" /><IconSearch size={15} /></label>
      </div>
      <div ref={tableWrapRef} className="rh-hik-table-wrap">
      <table className="rh-hik-table">
        <thead><tr><th><button className={`rh-checkbox ${allVisibleSelected ? "checked" : ""}`} aria-label={allVisibleSelected ? "取消选择当前结果" : "选择当前结果"} onClick={toggleAllVisible}>{allVisibleSelected && <IconCheck size={11} />}</button></th><th>设备</th><th>设备类型</th><th>视频流</th><th>云台能力</th><th>交付状态与下一步</th></tr></thead>
        <tbody>{pagedDevices.map((device) => <tr key={device.id} data-device-id={device.id} className={`${selectedId === device.id ? "selected" : ""} ${deviceHealth(device).blocking ? "blocked" : ""}`} onClick={() => openDevice(device)}>
          <td onClick={(event) => event.stopPropagation()}><button className={`rh-checkbox ${selectedRows.includes(device.id) ? "checked" : ""}`} onClick={() => toggleRow(device.id)}>{selectedRows.includes(device.id) && <IconCheck size={11} />}</button></td>
          <td><b>{device.name}</b><small>{device.ip} · 通道 {device.channel || "1"}</small></td>
          <td><span className={`rh-hik-type ${device.typeTone}`}>{device.type}</span></td>
          <td><button className="rh-stream-thumb" aria-label={`预览${device.name}`} onClick={(event) => { event.stopPropagation(); openDevice(device); setDrawerTab("控制能力"); flash(`${device.name}实时视频与控制能力已定位`, "info"); }}><img src={device.image} alt="" /><IconPlayerPlay size={18} /></button></td>
          <td>{device.ptz ? <button className="rh-ptz-link" onClick={(event) => { event.stopPropagation(); openDevice(device); setDrawerTab("控制能力"); }}>支持({device.zoom})<IconChevronRight size={13} /></button> : "不支持"}</td>
          <td><div className="rh-hik-health-result merged"><span className={deviceHealth(device).tone}>{deviceHealth(device).label}</span><small>{deviceHealth(device).detail}</small><span className="rh-hik-alg-tags">{device.algorithms.map((item, index) => <span key={`${item}-${index}`} className={item.startsWith("+") ? "more" : ""}>{item}</span>)}</span><span className="rh-hik-health-actions"><button onClick={(event) => { event.stopPropagation(); openDevice(device); setDrawerTab(deviceHealth(device).tab); }}>定位配置</button><button onClick={(event) => { event.stopPropagation(); requestAnnotation(device); }}>算法标注</button></span></div></td>
        </tr>)}</tbody>
      </table>{!displayedDevices.length && <div className="rh-hik-empty"><IconSearch size={25} /><b>当前条件下没有设备</b><span>当前范围可能已无此类交付阻塞，或搜索条件过窄。</span><button onClick={() => { setQuery(""); setTypeFilter("全部"); setStatusFilter("全部"); }}>查看全部设备</button></div>}</div>
      <footer className="rh-hik-pagination"><span>显示 {displayedDevices.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, displayedDevices.length)} / 当前范围 {displayedDevices.length} 台</span><select aria-label="每页条数" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value="20">20条/页</option><option value="50">50条/页</option></select><div><button disabled={safePage === 1} title={safePage === 1 ? "已是第一页" : "上一页"} aria-label="上一页" onClick={() => setPage((current) => Math.max(1, current - 1))}><IconChevronLeft size={14} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => <button key={item} className={safePage === item ? "active" : ""} aria-current={safePage === item ? "page" : undefined} onClick={() => setPage(item)}>{item}</button>)}<button disabled={safePage === totalPages} title={safePage === totalPages ? "已是最后一页" : "下一页"} aria-label="下一页" onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><IconChevronRight size={14} /></button></div></footer>
    </main>
    {drawerOpen ? <aside className="rh-hik-drawer">
      <button className="rh-hik-drawer-resizer" role="separator" aria-orientation="vertical" aria-valuemin="460" aria-valuemax={drawerMaxWidth} aria-valuenow={drawerWidth} aria-label="调整设备配置抽屉宽度" title="拖动或方向键调整；双击恢复默认" onPointerDown={(event) => {
        drawerResizeRef.current = { startX: event.clientX, startWidth: drawerWidth };
        document.body.classList.add("rh-resizing");
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }} onKeyDown={resizeDrawerWithKeyboard} onDoubleClick={() => setDrawerWidth(drawerMaxWidth)} />
      <header><div><b>{form.name ? `编辑设备 - ${form.name}` : "新增海康设备"}</b>{formDirty && <span>未应用</span>}</div><button onClick={requestCloseDrawer} aria-label="关闭设备配置"><IconX size={19} /></button></header>
      <nav>{["视频接入", "控制能力", "算法指标"].map((tab) => <button key={tab} className={drawerTab === tab ? "active" : ""} onClick={() => setDrawerTab(tab)}>{tab}</button>)}</nav>
      <div className="rh-hik-drawer-body">

      {drawerTab === "视频接入" && <>
        <section><h4>基础信息</h4><div className="rh-hik-form">
          <label className={`wide ${formErrors.name ? "invalid" : ""}`}><span>设备名称<i>*</i></span><input aria-invalid={formErrors.name} value={form.name || ""} onChange={(event) => { setForm({ ...form, name: event.target.value }); setTestResult(""); }} /></label>
          <label><span>设备类型</span><select value={form.type || ""} onChange={(event) => setForm({ ...form, type: event.target.value, ptz: event.target.value === "云台球机" })}><option>云台球机</option><option>可见光</option><option>红外热成像</option></select></label>
          <label><span>接入协议</span><select value={form.protocol || ""} onChange={(event) => setForm({ ...form, protocol: event.target.value })}><option>海康SDK</option><option>ISAPI</option><option>ONVIF</option></select></label>
          <label className={formErrors.ip ? "invalid" : ""}><span>IP地址<i>*</i></span><input aria-invalid={formErrors.ip} value={form.ip || ""} onChange={(event) => { setForm({ ...form, ip: event.target.value }); setTestResult(""); }} /></label><label className={formErrors.port ? "invalid" : ""}><span>端口<i>*</i></span><input aria-invalid={formErrors.port} value={form.port || ""} onChange={(event) => { setForm({ ...form, port: event.target.value }); setTestResult(""); }} /></label>
          <label className={formErrors.username ? "invalid" : ""}><span>用户名<i>*</i></span><input aria-invalid={formErrors.username} value={form.username || ""} onChange={(event) => { setForm({ ...form, username: event.target.value }); setTestResult(""); }} /></label>
          <label className="password"><span>密码</span><input type={passwordVisible ? "text" : "password"} value={form.password || ""} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? <IconEyeOff size={15} /> : <IconEye size={15} />}</button></label>
          <label className={`wide ${formErrors.serial ? "invalid" : ""}`}><span>序列号<i>*</i></span><input aria-invalid={formErrors.serial} value={form.serial || ""} onChange={(event) => { setForm({ ...form, serial: event.target.value }); setTestResult(""); }} /></label>
          <label className="rh-hik-station-owner"><span>所属区域</span><input readOnly value={stationRegion} /></label>
          <label className="rh-hik-station-owner"><span>采集站编码</span><input readOnly value={stationCode} /></label>
          <label className="wide rh-hik-station-owner"><span>采集站名称</span><input readOnly value={stationName} /><small>摄像头仅归属当前采集站；跨站调整需在目标站重新接入</small></label>
        </div></section>
        <section><h4>视频通道</h4><div className="rh-hik-form compact"><label><span>通道号</span><input value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} /></label><label><span>码流类型</span><select value={form.stream} onChange={(event) => setForm({ ...form, stream: event.target.value })}><option>主码流</option><option>子码流</option></select></label><label><span>分辨率</span><input value={form.resolution} onChange={(event) => setForm({ ...form, resolution: event.target.value })} /></label><label><span>帧率(FPS)</span><select value={form.fps} onChange={(event) => setForm({ ...form, fps: event.target.value })}><option>25</option><option>20</option><option>15</option></select></label></div></section>
        <section className="rh-integration-status"><h4><span>集成状态</span><button disabled={testing || !formValid} onClick={testConnection}>{testing ? <IconLoader2 className="spin" size={14} /> : <IconRefresh size={14} />}{testing ? "检测中" : "重新检测"}</button></h4>{[["设备连接", "10:12:33"], ["视频取流", "10:12:35"], ["云台控制", "10:12:36"], ["算法接入", "10:12:40"]].map(([label, time]) => <div key={label}><IconCheck size={12} /><b>{label}</b><span>2026-07-23 {time}</span><em>{form.ptz || label !== "云台控制" ? "成功" : "不支持"}</em></div>)}</section>
      </>}
      {drawerTab === "控制能力" && <section className="rh-hik-control-tab">
        <header className="rh-control-section-head">
          <div><h4>控制能力</h4><p>设备能力探测结果与实时取景控制</p></div>
          <span className={controlReady ? "ready" : "limited"}>{controlReady ? <IconCheck size={13} /> : <IconInfoCircle size={13} />}{controlReady ? "控制就绪" : form.status === "离线" ? "通道不可达" : "固定机位"}</span>
        </header>
        <div className={`rh-control-overview ${controlReady ? "ready" : "limited"}`}>
          <span className="rh-control-overview-icon">{controlReady ? <IconGauge size={22} /> : <IconCamera size={22} />}</span>
          <div>
            <b>{controlReady ? `支持云台旋转与 ${form.zoom || "32x"} 光学变焦` : form.status === "离线" ? "当前设备离线" : "当前设备为固定机位"}</b>
            <p>{controlReady ? "可在算法标注前调整视角、焦距并调用预置位。" : controlUnavailableReason}</p>
          </div>
          <dl>
            <div><dt>型号</dt><dd>{form.model || "未识别"}</dd></div>
            <div><dt>协议</dt><dd>{form.protocol || "未配置"}</dd></div>
          </dl>
        </div>
        <div className="rh-control-capability-grid" aria-label="设备控制能力清单">
          {[
            ["云台旋转", controlReady, controlReady ? "四向控制" : "机型不支持"],
            ["光学变焦", controlReady, controlReady ? form.zoom || "32x" : "机型不支持"],
            ["聚焦控制", controlReady, controlReady ? "手动 / 自动" : "机型不支持"],
            ["预置位", controlReady, controlReady ? "可调用" : "机型不支持"],
            ["数字缩放", form.status !== "离线", form.status === "离线" ? "视频不可用" : "标注可用"],
            ["算法标注", Boolean(hikvisionAnnotationTargetFor(selectedDevice)), hikvisionAnnotationTargetFor(selectedDevice) ? "摄像头级配置" : "待建立配置"]
          ].map(([label, supported, detail]) => <article key={label} className={supported ? "supported" : "unsupported"}>
            <span>{supported ? <IconCheck size={13} /> : <IconLock size={13} />}</span>
            <div><b>{label}</b><small>{detail}</small></div>
          </article>)}
        </div>
        <div className="rh-control-workspace">
          <header><div><b>{controlReady ? "实时云台取景" : "取景辅助"}</b><small>{controlReady ? "单次点击执行，命令完成后自动停止" : "不可用能力保留在位并说明原因"}</small></div><span>{controlStatus || (controlReady ? "控制通道就绪" : controlUnavailableReason)}</span></header>
          <div className="rh-control-console">
            <div className="rh-control-direction-pad" aria-label="云台方向控制">
              <button disabled={!controlReady} title={controlReady ? "向上旋转" : controlUnavailableReason} onClick={() => runControlCommand("向上旋转")}><IconChevronUp size={18} /></button>
              <button disabled={!controlReady} title={controlReady ? "向左旋转" : controlUnavailableReason} onClick={() => runControlCommand("向左旋转")}><IconChevronLeft size={18} /></button>
              <button disabled={!controlReady} title={controlReady ? "归中" : controlUnavailableReason} onClick={() => runControlCommand("云台归中")}><IconFocusCentered size={17} /></button>
              <button disabled={!controlReady} title={controlReady ? "向右旋转" : controlUnavailableReason} onClick={() => runControlCommand("向右旋转")}><IconChevronRight size={18} /></button>
              <button disabled={!controlReady} title={controlReady ? "向下旋转" : controlUnavailableReason} onClick={() => runControlCommand("向下旋转")}><IconChevronDown size={18} /></button>
            </div>
            <div className="rh-control-adjustments">
              <label>
                <span>{form.ptz ? "光学变焦" : "数字缩放"}<output>{form.ptz ? `${controlZoom}x` : `${controlZoom}%`}</output></span>
                <input type="range" min={form.ptz ? 1 : 100} max={form.ptz ? Number.parseInt(form.zoom, 10) || 32 : 400} step={form.ptz ? 1 : 25} value={controlZoom} disabled={form.status === "离线"} onChange={(event) => applyControlZoom(event.target.value)} />
                <small>{form.ptz ? "改变摄像机光学焦距" : "仅改变算法标注预览，不改变摄像机焦距"}</small>
              </label>
              {form.ptz ? <>
                <div className="rh-control-focus-row"><span>聚焦</span><button disabled={!controlReady} onClick={() => runControlCommand("焦点拉近")}><IconMinus size={14} /></button><button disabled={!controlReady} onClick={() => runControlCommand("自动聚焦")}>自动</button><button disabled={!controlReady} onClick={() => runControlCommand("焦点拉远")}><IconPlus size={14} /></button></div>
                <div className="rh-control-preset-row"><select value={controlPreset} onChange={(event) => setControlPreset(event.target.value)} disabled={!controlReady}><option>锅炉全景</option><option>燃烧器特写</option><option>检修平台</option></select><button disabled={!controlReady} onClick={invokeControlPreset}>调用</button></div>
              </> : <div className="rh-control-fixed-note"><IconInfoCircle size={15} /><span>固定机位仍可进入算法标注，通过数字缩放完成取景和区域标注。</span></div>}
            </div>
          </div>
        </div>
        <div className="rh-control-next-step"><div><b>下一步：校准算法取景</b><span>{hikvisionAnnotationTargetFor(selectedDevice) ? "已建立摄像头算法上下文，进入后将自动定位当前设备。" : "请先同步算法目录，再进入标注。"}</span></div><button className="rh-live-annotation-jump" onClick={() => requestAnnotation()}><IconVectorBezier2 size={16} />进入算法标注取景<IconChevronRight size={14} /></button></div>
      </section>}
      {drawerTab === "算法指标" && <section className="rh-hik-metric-tab">
        <header className="rh-hik-metric-head">
          <div>
            <h4>算法指标目录</h4>
            <p><b>{supportedMetricCount}</b> / {allAlgorithmMetricOptions.length} 项兼容 · <b>{boundMetricCount}</b> 项已接入 · 最近同步 {metricLastSynced}</p>
          </div>
          <div className="rh-hik-metric-actions">
            <span className={metricCatalogBlockedReason ? "blocked" : "synced"}>{metricCatalogBlockedReason ? <IconAlertTriangle size={13} /> : <IconCheck size={13} />}{metricCatalogBlockedReason ? "待处理" : "已同步"}</span>
            <button disabled={metricSyncing || Boolean(metricCatalogBlockedReason)} onClick={syncMetricCatalog} title={metricCatalogBlockedReason || "同步算法指标目录"} aria-label="同步算法指标目录">
              {metricSyncing ? <IconLoader2 className="spin" size={14} /> : <IconRefresh size={14} />}
            </button>
          </div>
        </header>
        <div className="rh-hik-metric-toolbar">
          <label><IconSearch size={14} /><input value={metricQuery} onChange={(event) => setMetricQuery(event.target.value)} placeholder="搜索指标名称或编码" aria-label="搜索算法指标" /></label>
          <select value={metricSourceFilter} onChange={(event) => setMetricSourceFilter(event.target.value)} aria-label="按指标来源筛选">
            <option>全部来源</option><option>设备原生</option><option>平台算法</option>
          </select>
          <select value={metricStatusFilter} onChange={(event) => setMetricStatusFilter(event.target.value)} aria-label="按兼容状态筛选">
            <option>全部状态</option><option>已接入</option><option>可接入</option><option>机型不支持</option>
          </select>
          <small>{metricCatalogItems.length} / {allAlgorithmMetricOptions.length}</small>
        </div>
        <div className="rh-hik-metric-list">
          {metricCatalogItems.map((metric) => <article key={metric.id} className={[metric.bound ? "bound" : "", metric.supported ? "" : "unsupported"].filter(Boolean).join(" ")}>
            <span className="rh-hik-metric-icon"><IconActivity size={16} /></span>
            <div className="rh-hik-metric-copy">
              <b>{metric.name}</b>
              <code>{metric.metricCode || platformMetricCodes[metric.id]}</code>
              <small><i>{metric.nativeMetric ? "设备原生" : "平台算法"}</i><i>{metric.noAnnotation ? "无需标注区域" : "需配置标注区域"}</i></small>
            </div>
            <em className={metric.bound ? "bound" : metric.supported ? "available" : "unsupported"}>
              {metric.bound ? <><IconCheck size={12} />已接入</> : metric.supported ? "可接入" : "机型不支持"}
            </em>
          </article>)}
          {!metricCatalogItems.length && <div className="rh-hik-metric-empty">
            <IconSearch size={22} /><b>没有匹配的算法指标</b><span>调整关键词、来源或兼容状态后重试。</span>
            <button onClick={() => { setMetricQuery(""); setMetricSourceFilter("全部来源"); setMetricStatusFilter("全部状态"); }}>清除筛选</button>
          </div>}
        </div>
        <div className={["rh-hik-metric-note", metricCatalogBlockedReason ? "blocked" : ""].filter(Boolean).join(" ")}>
          {metricCatalogBlockedReason ? <IconAlertTriangle size={14} /> : <IconInfoCircle size={14} />}
          <span>{metricCatalogBlockedReason || "目录随设备能力动态排序；进入标注工作区后，可将任意兼容指标直接配置到当前摄像头。"}</span>
        </div>
        <button className="rh-hik-metric-primary" disabled={Boolean(metricCatalogBlockedReason)} onClick={() => requestAnnotation()} title={metricCatalogBlockedReason || "进入算法标注工作区"}>
          <IconVectorBezier2 size={15} />{boundMetricCount ? "管理算法标注" : "配置算法标注"}<IconChevronRight size={14} />
        </button>
      </section>}
      </div>
      <footer>
        <span className="rh-hik-save-hint">{formDirty ? "修改尚未进入页面草稿" : "设备配置已应用"}</span>
        <button onClick={cancelDeviceChanges}>取消修改</button>
        <button className="primary" disabled={saving || !formValid} onClick={saveDevice}>{saving ? <IconLoader2 className="spin" size={15} /> : <IconDeviceFloppy size={15} />}{saving ? "应用中" : "应用到页面草稿"}</button>
      </footer>
    </aside> : <button className="rh-hik-drawer-restore" onClick={() => setDrawerOpen(true)} aria-label="展开设备配置"><IconSettings size={16} /><span>设备配置</span><IconChevronLeft size={14} /></button>}
    {batchImportOpen && <BatchImportModal existingDevices={deviceRecords} onCancel={() => setBatchImportOpen(false)} onImport={importDevices} />}
    {deliveryReviewOpen && <div className="rh-delivery-review-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeliveryReviewOpen(false)}>
      <section className="rh-delivery-review" role="dialog" aria-modal="true" aria-label="采集站交付检查单">
        <header><div><IconChecklist size={21} /><span><b>采集站交付检查单</b><small>{treeNode} · 最近检测 {lastCheckedAt}</small></span></div><button onClick={() => setDeliveryReviewOpen(false)} aria-label="关闭交付检查单"><IconX size={18} /></button></header>
        <div className={`rh-delivery-decision ${scopeBlockingDevices.length ? "blocked" : "ready"}`}>
          {scopeBlockingDevices.length ? <IconAlertTriangle size={22} /> : <IconCheck size={22} />}
          <div><b>{scopeBlockingDevices.length ? `暂不建议验收，仍有 ${scopeBlockingDevices.length} 台设备阻塞` : "当前范围已满足交付条件"}</b><span>{scopeBlockingDevices.length ? "按检查项完成修复并重新检测，平台草稿可继续保存但不得误标为已交付。" : "基础信息、连接、视频和摄像头算法标注均已验证。"}</span></div>
          <strong>{scopeReadyCount}/{scopeDevices.length}</strong>
        </div>
        <div className="rh-delivery-review-body">
          <section className="rh-delivery-gates"><h4>交付门槛</h4>{deliveryGates.map((gate) => {
            const complete = gate.passed === scopeDevices.length;
            return <div key={gate.label} className={complete ? "complete" : "blocked"}><span>{complete ? <IconCheck size={13} /> : <IconAlertTriangle size={13} />}</span><b>{gate.label}</b><small>{gate.detail}</small><em>{gate.passed}/{scopeDevices.length}</em></div>;
          })}</section>
          <section className="rh-delivery-blockers"><h4>待处理设备 <small>{scopeBlockingDevices.length}</small></h4>{scopeBlockingDevices.map((device) => {
            const health = deviceHealth(device);
            return <article key={device.id}><span className={health.tone}><IconCamera size={15} /></span><div><b>{device.name}</b><small>{health.label} · {health.detail}</small></div><button onClick={() => locateDeliveryBlocker(device)}>定位配置<IconChevronRight size={13} /></button></article>;
          })}{!scopeBlockingDevices.length && <div className="rh-delivery-empty"><IconCheck size={18} />没有待处理设备</div>}</section>
        </div>
        <footer><button onClick={exportDeliveryChecklist}><IconDatabase size={14} />导出检查单</button><span />{scopeBlockingDevices.length > 0 && <button className="primary" onClick={() => locateDeliveryBlocker(scopeBlockingDevices[0])}>处理首个阻塞项<IconChevronRight size={14} /></button>}<button onClick={() => setDeliveryReviewOpen(false)}>关闭</button></footer>
      </section>
    </div>}
  </div>;
}
function AnnotationWorkspace({ flash, onDirty, onSnapshot, online, devices, deviceRecords = [], bindings, setBindings, focusTarget }) {
  const dynamicHikvisionOptions = deviceRecords
    .filter((device) => !hikvisionAnnotationTargetByDevice[device.id] && hikvisionAnnotationDataIdFor(device))
    .map(hikvisionDataOptionFromRecord);
  const baseStationDataOptions = [
    ...dataOptions.filter((device) => devices.includes(device.label)),
    ...dynamicHikvisionOptions.filter((device) => !dataOptions.some((option) => option.id === device.id))
  ];
  const boundInspectionPoints = bindings
    .map((group) => group.data)
    .filter((data) => data?.vendor === "Hikvision" && data.type === "point" && data.parentId);
  const stationDataOptions = baseStationDataOptions.map((device) => ({
    ...device,
    children: [
      ...device.children,
      ...boundInspectionPoints.filter((point) => point.parentId === device.id && !device.children.some((item) => item.id === point.id))
    ]
  }));
  const focusDataOption = focusTarget?.dataId
    ? stationDataOptions.find((device) => device.id === focusTarget.dataId || device.children.some((point) => point.id === focusTarget.dataId)) || null
    : null;
  const stationPointIds = new Set(stationDataOptions.flatMap((device) => device.children.map((point) => point.id)));
  const focusedPointId = focusTarget?.dataId && stationPointIds.has(focusTarget.dataId)
    ? focusTarget.dataId
    : focusDataOption?.children[0]?.id;
  const initialDataId = focusedPointId || bindings.find((group) => stationPointIds.has(group.id))?.id || stationDataOptions[0]?.children[0]?.id || "";
  const initialDataGroup = bindings.find((group) => group.id === initialDataId);
  const [pendingDataId, setPendingDataId] = useState(initialDataId);
  const [pendingFunctions, setPendingFunctions] = useState(() => initialDataGroup?.functions.map((feature) => feature.id) || []);
  const [dataOpen, setDataOpen] = useState(false);
  const [functionOpen, setFunctionOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(() => initialDataGroup?.functions[0] ? { groupId: initialDataGroup.id, functionId: initialDataGroup.functions[0].id } : { groupId: "", functionId: "" });
  const [parameterTarget, setParameterTarget] = useState(null);
  const [regionTarget, setRegionTarget] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [annotationLocked, setAnnotationLocked] = useState(false);

  const selectorsRef = useRef(null);
  const availableDataOptions = focusDataOption ? [focusDataOption] : stationDataOptions;
  const availableDataItems = useMemo(() => availableDataOptions.flatMap((device) => device.children), [availableDataOptions]);
  const availableDataIds = useMemo(() => new Set(availableDataItems.map((item) => item.id)), [availableDataItems]);
  const focusDataIds = focusDataOption ? new Set(focusDataOption.children.map((point) => point.id)) : null;
  const visibleBindings = focusDataIds
    ? bindings.filter((group) => focusDataIds.has(group.id))
    : bindings;
  const selectedData = availableDataItems.find((item) => item.id === pendingDataId) || null;
  const existing = bindings.find((group) => group.id === pendingDataId);
  const lockedIds = existing?.functions.map((item) => item.id) || [];
  const newFunctionIds = pendingFunctions.filter((id) => !lockedIds.includes(id));
  const canBind = Boolean(selectedData && pendingFunctions.length && newFunctionIds.length);
  const totalFunctions = visibleBindings.reduce((count, group) => count + group.functions.length, 0);
  const targetFeature = (target) => bindings.find((group) => group.id === target?.groupId)?.functions.find((feature) => feature.id === target?.functionId);
  const activeGroup = bindings.find((group) => group.id === selectedFeature.groupId) || bindings.find((group) => group.id === pendingDataId) || null;
  const activeFeature = targetFeature(selectedFeature) || activeGroup?.functions[0] || null;
  const activePreviewData = activeGroup?.data || selectedData || focusDataOption;
  const hikvisionDevices = availableDataOptions.filter((device) => device.vendor === "Hikvision");
  const cameraContext = hikvisionDevices.length > 0;
  const bindSubject = cameraContext ? "算法指标" : "监测功能";
  const bindStatus = !availableDataItems.length ? "请先为当前采集站的摄像头配置测点" : !selectedData ? "请选择测点" : !pendingFunctions.length ? "请选择至少一个" + bindSubject : !newFunctionIds.length ? "所选" + bindSubject + "已全部绑定，可在下方直接编辑配置" : "将为当前测点新增 " + newFunctionIds.length + " 项；" + (lockedIds.length ? "保留并锁定已绑定 " + lockedIds.length + " 项" : "创建新的算法绑定");
  useEffect(() => {
    if (availableDataIds.has(pendingDataId)) return;
    const fallback = visibleBindings.find((group) => availableDataIds.has(group.id))?.id || availableDataOptions[0]?.children[0]?.id || "";
    const fallbackGroup = bindings.find((group) => group.id === fallback);
    setPendingDataId(fallback);
    setPendingFunctions(fallbackGroup?.functions.map((feature) => feature.id) || []);
    setDataOpen(false);
    setFunctionOpen(false);
  }, [availableDataIds, availableDataOptions, bindings, pendingDataId]);
  useEffect(() => {
    if (targetFeature(selectedFeature)) return;
    const focusedGroup = visibleBindings.find((group) => group.id === pendingDataId) || visibleBindings[0];
    setSelectedFeature(focusedGroup?.functions[0] ? { groupId: focusedGroup.id, functionId: focusedGroup.functions[0].id } : { groupId: "", functionId: "" });
  }, [bindings, pendingDataId, selectedFeature]);
  useEffect(() => {
    const closeSelectors = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "mousedown" && selectorsRef.current?.contains(event.target)) return;
      setDataOpen(false);
      setFunctionOpen(false);
    };
    document.addEventListener("mousedown", closeSelectors);
    window.addEventListener("keydown", closeSelectors);
    return () => {
      document.removeEventListener("mousedown", closeSelectors);
      window.removeEventListener("keydown", closeSelectors);
    };
  }, []);
  useEffect(() => {
    if (!focusTarget?.dataId) return undefined;
    const timer = window.setTimeout(() => {
      document.querySelector(`[data-data-id="${focusTarget.dataId}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      document.querySelector(`[data-data-id="${focusTarget.dataId}"] .rh-algorithm`)?.focus({ preventScroll: true });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [focusTarget?.dataId]);
  const chooseData = (id) => {
    const bound = bindings.find((group) => group.id === id);
    setPendingDataId(id);
    setPendingFunctions(bound?.functions.map((item) => item.id) || []);
    setSelectedFeature(bound?.functions[0] ? { groupId: bound.id, functionId: bound.functions[0].id } : { groupId: "", functionId: "" });
  };
  const bind = () => {
    if (!selectedData || selectedData.type !== "point" || !availableDataIds.has(pendingDataId)) return flash("当前测点已失效，请重新选择当前摄像头下的测点");
    if (!pendingFunctions.length) return flash("请选择测点和监测功能");
    if (!newFunctionIds.length) return flash("当前选择中没有新增监测功能");
    const data = selectedData;
    setBindings((current) => {
      const group = current.find((item) => item.id === pendingDataId);
      if (!group) return [...current, { id: pendingDataId, data, open: true, functions: pendingFunctions.map((id, index) => createFunction(id, Date.now() + index)) }];
      const existingIds = group.functions.map((item) => item.id);
      const appended = pendingFunctions.filter((id) => !existingIds.includes(id)).map((id, index) => createFunction(id, Date.now() + index));
      return current.map((item) => item.id === pendingDataId ? { ...item, open: true, functions: [...item.functions, ...appended].sort((a, b) => a.createdAt - b.createdAt) } : item);
    });
    setSelectedFeature({ groupId: pendingDataId, functionId: newFunctionIds[0] });
    onDirty();
    flash(`已将 ${newFunctionIds.length} 个${bindSubject}加入草稿，保存后生效`);
  };
  const updatePointView = (dataId, ptzView) => {
    const group = bindings.find((item) => item.id === dataId);
    if (!group || group.data?.type !== "point" || JSON.stringify(group.data.ptzView) === JSON.stringify(ptzView)) return;
    setBindings((current) => current.map((item) => item.id === dataId ? { ...item, data: { ...item.data, ptzView: { ...ptzView } } } : item));
    onDirty();
  };
  const updateFeature = (groupId, functionId, changes) => {
    const currentFeature = targetFeature({ groupId, functionId });
    if (!currentFeature || Object.entries(changes).every(([key, value]) => JSON.stringify(currentFeature[key]) === JSON.stringify(value))) return;
    setBindings((current) => current.map((group) => group.id === groupId ? { ...group, functions: group.functions.map((feature) => feature.id === functionId ? { ...feature, ...changes } : feature) } : group));
    onDirty();
  };
  const updateFeatureColor = (groupId, functionId, color) => {
    const feature = targetFeature({ groupId, functionId });
    if (!feature) return;
    const regionItems = getFeatureRegions(feature).map((region) => region.usesDefaultColor ? { ...region, color } : region);
    updateFeature(groupId, functionId, { color, regionItems });
  };
  const confirmDelete = () => {
    let nextBindings;
    if (confirm.type === "group") {
      nextBindings = bindings.filter((group) => group.id !== confirm.groupId);
      flash("检测对象的算法配置已从草稿删除");
    } else {
      nextBindings = bindings.map((group) => group.id === confirm.groupId ? { ...group, functions: group.functions.filter((feature) => feature.id !== confirm.functionId) } : group).filter((group) => group.functions.length);
      flash("算法指标已从草稿删除");
    }
    setBindings(nextBindings);
    const selectedStillExists = nextBindings.some((group) => group.id === selectedFeature.groupId && group.functions.some((feature) => feature.id === selectedFeature.functionId));
    if (!selectedStillExists) setSelectedFeature(nextBindings[0]?.functions[0] ? { groupId: nextBindings[0].id, functionId: nextBindings[0].functions[0].id } : { groupId: "", functionId: "" });
    onDirty();
    setConfirm(null);
  };
  const toggleGroup = (groupId) => setBindings((current) => current.map((item) => item.id === groupId ? { ...item, open: !item.open } : item));
  const setLocked = (value) => {
    setAnnotationLocked(value);
    flash(value ? "标注编辑已锁定，预览与参数仍可查看" : "标注编辑已解锁", "info");
  };

  return <>
<div className="rh-annotation-layout">
<div className="rh-annotation-main">
    {hikvisionDevices.length > 0 && <section className="rh-hik-context-bar">
      <div><span className="hik-logo">HIK</span><div><b>{focusTarget ? `当前摄像头 · ${focusTarget.device.name}` : "海康摄像头算法标注"}</b><small>{focusTarget ? `${focusTarget.device.ip} · ${focusTarget.device.type} · 测点、算法指标与取景控制保持同一摄像头上下文` : `${hikvisionDevices.length} 台摄像头已接入 · 测点承载算法指标、检测区域与位置描述`}</small></div></div>
      <div className="rh-hik-context-actions"><span><IconCheck size={13} />测点即算法检测对象</span></div>
    </section>}
    <section className="rh-bind" ref={selectorsRef}>
<div className="rh-bind-field">
<span>
<b>*</b> 数据 ID <IconInfoCircle size={14} title="摄像头仅作为分组；请选择组内测点，已绑定测点仍可继续追加监测功能" />
</span>
<button title={focusTarget ? "当前仅展示该海康摄像机下的已有测点" : "选择测点"} aria-expanded={dataOpen} onClick={() => {
    setDataOpen(!dataOpen);
    setFunctionOpen(false);
  }}>
<span>{selectedData?.path || "请选择测点"}</span>
<IconChevronDown size={14} />
</button>{dataOpen && <DataSelector value={pendingDataId} bindings={bindings} options={availableDataOptions} onSelect={chooseData} onClose={() => setDataOpen(false)} />}</div>
<div className="rh-bind-field">
<span>
<b>*</b> {cameraContext ? "算法指标" : "监测功能"}</span>
<button disabled={!selectedData} aria-expanded={functionOpen} onClick={() => {
    setFunctionOpen(!functionOpen);
    setDataOpen(false);
  }}>
<span>{pendingFunctions.length ? "已选 " + pendingFunctions.length + " 项" + (lockedIds.length ? " · 已绑定 " + lockedIds.length + " 项" : "") : cameraContext ? "请选择算法指标" : "请选择监测功能"}</span>
<IconChevronDown size={14} />
</button>{functionOpen && <FunctionSelector selectedIds={pendingFunctions} lockedIds={lockedIds} onChange={setPendingFunctions} onClose={() => setFunctionOpen(false)} />}</div>
<div className="rh-bind-action">
<button data-qa="bind-action" className={`bind ${!canBind && lockedIds.length ? "complete" : ""}`} onClick={bind} disabled={!canBind} aria-describedby="rh-bind-status">
{canBind ? <IconPlus size={14} /> : lockedIds.length ? <IconCheck size={14} /> : <IconPlus size={14} />}{canBind ? `添加 ${newFunctionIds.length} 项` : lockedIds.length ? "已全部绑定" : "暂无新增"}</button>
</div>
<p id="rh-bind-status" className={`rh-bind-status-line ${canBind ? "ready" : ""}`}>
<IconInfoCircle size={13} /><span>{bindStatus}</span>
</p>
</section>
    <section className="rh-groups">
<div className="rh-binding-summary">
<div>
<b>{cameraContext ? `${visibleBindings.length} 个测点已配置` : `已配置 ${visibleBindings.length} 个数据组`}</b>
<span>{focusTarget ? `${focusTarget.device.name} · ` : ""}{totalFunctions} 个{cameraContext ? "算法指标" : "监测功能"}</span>
</div>
<div className="rh-binding-summary-actions"><small>{activeFeature ? `当前预览：${activeFeature.name}` : "选择已有测点并添加算法指标开始配置"}</small></div>
</div>{visibleBindings.map((group) => <article className="rh-group" data-data-id={group.id} key={group.id}>
<header role="button" tabIndex="0" aria-expanded={group.open} onClick={() => toggleGroup(group.id)} onKeyDown={(event) => {
    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      toggleGroup(group.id);
    }
  }}>
<div>
<button className="rh-delete-group" title="删除数据组的算法配置" onClick={(event) => {
    event.stopPropagation();
    setConfirm({ type: "group", groupId: group.id, message: `确认删除“${group.data.label}”的算法配置吗？`, detail: `将从草稿中删除该检测对象下的 ${group.functions.length} 个算法指标，不会移除摄像头。` });
  }}>
<IconTrash size={16} />
</button>
<strong>{group.data.label}</strong>
{!cameraContext && group.data.path !== group.data.label && <span className="rh-group-path" title={group.data.path}>{group.data.path}</span>}
{group.data.ptzView && <span className="rh-group-view"><b>视角</b> 水平 {group.data.ptzView.x > 0 ? "+" : ""}{group.data.ptzView.x}° · 俯仰 {group.data.ptzView.y > 0 ? "+" : ""}{group.data.ptzView.y}° · 光学 {group.data.ptzView.zoom.toFixed(1)}x{group.data.ptzView.digitalZoom !== 1 ? ` · 数字 ${Math.round(group.data.ptzView.digitalZoom * 100)}%` : ""}</span>}
<em>已绑定{group.functions.length}项</em>
</div>
<button className="rh-collapse" aria-label={group.open ? "收缩" : "展开"} onClick={(event) => {
    event.stopPropagation();
    toggleGroup(group.id);
  }}>{group.open ? <IconChevronDown size={17} /> : <IconChevronRight size={17} />}</button>
</header>{group.open && <div>{group.functions.map((feature) => <AlgorithmCard key={feature.id} groupId={group.id} feature={feature} selected={selectedFeature.groupId === group.id && selectedFeature.functionId === feature.id} annotationLocked={annotationLocked} onSelect={() => setSelectedFeature({ groupId: group.id, functionId: feature.id })} onEditParameters={() => setParameterTarget({ groupId: group.id, functionId: feature.id })} onEditRegions={() => setRegionTarget({ groupId: group.id, functionId: feature.id })} onDelete={() => setConfirm({ type: "feature", groupId: group.id, functionId: feature.id, message: `确认删除算法指标“${feature.name}”吗？`, detail: group.functions.length === 1 ? "这是该摄像头最后一个算法指标，确认后将一并移除该摄像头的算法配置。" : `将保留该摄像头上的其他 ${group.functions.length - 1} 个算法指标。` })} onToggleVisible={() => updateFeature(group.id, feature.id, { visible: !feature.visible })} onDescription={(description) => updateFeature(group.id, feature.id, { description })} onColor={(color) => updateFeatureColor(group.id, feature.id, color)} />)}</div>}</article>)}{!visibleBindings.length && <div className="rh-groups-empty">
<IconVectorBezier2 size={30} />
<b>尚未配置算法绑定</b>
<span>在上方选择数据 ID 和监测功能，添加后即可编辑检测区域、参数与位置描述</span>
</div>}</section>
  </div>
<Preview activeFeature={activeFeature} activeData={activePreviewData} online={online} locked={annotationLocked} onLockedChange={setLocked} onSnapshot={onSnapshot} flash={flash} onViewChange={(ptzView) => updatePointView(activePreviewData?.id, ptzView)} onEditRegions={(initialTool = "edit") => activeFeature && setRegionTarget({ groupId: selectedFeature.groupId, functionId: activeFeature.id, initialTool })} />
</div>
  {parameterTarget && targetFeature(parameterTarget) && <ParameterModal feature={targetFeature(parameterTarget)} onCancel={() => setParameterTarget(null)} onSave={(values) => {
    const feature = targetFeature(parameterTarget);
    updateFeature(parameterTarget.groupId, parameterTarget.functionId, { params: feature.params.map((item, index) => [item[0], values[index], item[2]]) });
    setParameterTarget(null);
    flash("参数已应用到草稿，保存采集站配置后生效");
  }} />}
  {regionTarget && targetFeature(regionTarget) && <AnnotationModal feature={targetFeature(regionTarget)} initialTool={regionTarget.initialTool || "edit"} onCancel={() => setRegionTarget(null)} onSave={({ color, regions, regionItems, noAnnotation }) => {
    updateFeature(regionTarget.groupId, regionTarget.functionId, { color, regions, regionItems, noAnnotation });
    setRegionTarget(null);
    flash("标注区域已应用到草稿，保存采集站配置后生效");
  }} />}

  {confirm && <ConfirmModal message={confirm.message} detail={confirm.detail || "删除只会更新页面草稿，保存采集站配置后生效。"} confirmText="确认删除" onCancel={() => setConfirm(null)} onConfirm={confirmDelete} />}</>;
}
function LegacyPreview({ activeFeature, onSnapshot }) {
  const [zoom, setZoom] = useState(1);
  const [locked, setLocked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return <section className={`rh-preview ${isHikvisionCamera ? "hikvision" : ""} ${expanded ? "expanded" : ""}`}>
<header>
<span>可见光</span>{expanded && <button onClick={() => setExpanded(false)}>
<IconX size={18} />
</button>}</header>
<div className="rh-preview-tools">
<button className="snapshot" onClick={onSnapshot}>
<IconCamera size={18} />截取快照</button>
<i />
<button className="active" title="全屏预览" onClick={() => setExpanded(!expanded)}>
<IconForms size={19} />
</button>
<button title="显示标注区域" disabled={!activeFeature} onClick={() => setLocked(false)}>
<IconVectorBezier2 size={19} />
</button>
<button title="放大" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>
<IconZoomIn size={19} />
</button>
<button title="缩小" onClick={() => setZoom(Math.max(0.8, zoom - 0.1))}>
<IconZoomOut size={19} />
</button>
<button title={locked ? "解锁" : "锁定"} onClick={() => setLocked(!locked)}>{locked ? <IconLock size={19} /> : <IconLockOpen size={19} />}</button>
</div>
<div className="rh-camera">
<img src={visibleLightImage} alt="RH830 可见光实时画面" style={{ transform: `scale(${zoom})` }} />{activeFeature && !activeFeature.noAnnotation && activeFeature.visible && Array.from({ length: Math.max(1, activeFeature.regions) }, (_, index) => <span key={index} className={`rh-frame frame-${index + 1}`} style={{ borderColor: activeFeature.color }}>
<em>{activeFeature.name}{index + 1}</em>
</span>)}<div className="rh-tip">当前功能：{activeFeature?.name || "未选择"}<br />点击功能区可切换对应标注</div>
</div>
</section>;
}
const measurementPointView = (data) => ({
  x: Number(data?.ptzView?.x ?? 0),
  y: Number(data?.ptzView?.y ?? 0),
  zoom: Number(data?.ptzView?.zoom ?? 1),
  digitalZoom: Number(data?.ptzView?.digitalZoom ?? 1),
  preset: data?.ptzView?.preset || data?.presetName || (data?.ptz ? "机头全景" : "固定视角")
});
function Preview({ activeFeature, activeData, online, locked, onLockedChange, onSnapshot, onEditRegions, onViewChange, flash }) {
  const initialView = measurementPointView(activeData);
  const [zoom, setZoom] = useState(initialView.digitalZoom);
  const [expanded, setExpanded] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [streamMode, setStreamMode] = useState(activeData?.media?.includes("红外") ? "红外" : "可见光");
  const [ptz, setPtz] = useState({ x: initialView.x, y: initialView.y, zoom: initialView.zoom, preset: initialView.preset });
  const [ptzStatus, setPtzStatus] = useState("");
  const [annotationTool, setAnnotationTool] = useState("point");
  const statusTimerRef = useRef(null);
  const regions = activeFeature ? getFeatureRegions(activeFeature) : [];
  const visibleRegions = activeFeature && !activeFeature.noAnnotation && activeFeature.visible && showAnnotations ? regions.filter((region) => region.visible) : [];
  const isHikvisionCamera = activeData?.vendor === "Hikvision";
  const isMeasurementPoint = activeData?.type === "point";
  const supportsPtz = Boolean(isHikvisionCamera && activeData?.ptz);
  const supportsThermal = Boolean(activeData?.media?.includes("红外"));
  const angle = (value) => `${value > 0 ? "+" : ""}${value}°`;
  const persistView = (nextPtz, nextDigitalZoom = zoom) => {
    if (!isMeasurementPoint) return;
    onViewChange?.({ ...nextPtz, digitalZoom: nextDigitalZoom });
  };
  const resetView = () => {
    const nextPtz = { x: 0, y: 0, zoom: 1, preset: activeData?.presetName || ptz.preset };
    setZoom(1);
    setPtz(nextPtz);
    persistView(nextPtz, 1);
    setPtzStatus("已复位并保存");
  };
  const sendPtz = (label, dx = 0, dy = 0, zoomDelta = 0) => {
    if (!online) return flash("云台控制失败：摄像机或采集站离线", "error");
    if (!supportsPtz) return flash("当前摄像机为非云台机型，不支持实时旋转", "warning");
    setPtz((current) => {
      const next = {
        ...current,
        x: Math.max(-180, Math.min(180, current.x + dx)),
        y: Math.max(-90, Math.min(90, current.y + dy)),
        zoom: Math.max(1, Math.min(4, Number((current.zoom + zoomDelta).toFixed(1))))
      };
      persistView(next);
      return next;
    });
    setPtzStatus(`正在${label}`);
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setPtzStatus(`${label}已停止 · 已保存`), 420);
  };
  const changeDigitalZoom = (delta) => {
    const nextZoom = Math.max(0.8, Math.min(1.5, Number((zoom + delta).toFixed(1))));
    setZoom(nextZoom);
    persistView(ptz, nextZoom);
    setPtzStatus(`数字变焦 ${Math.round(nextZoom * 100)}% 已保存`);
  };
  const recallPointPreset = () => {
    const saved = measurementPointView(activeData);
    const nextPtz = { x: saved.x, y: saved.y, zoom: saved.zoom, preset: saved.preset };
    setZoom(saved.digitalZoom);
    setPtz(nextPtz);
    setPtzStatus(`已调用预置位：${saved.preset}`);
  };
  const openAnnotationTool = (tool) => {
    if (!activeFeature) return;
    if (locked) return flash("标注已冻结，请先解锁后再编辑", "warning");
    setAnnotationTool(tool);
    onEditRegions?.(tool);
  };
  useEffect(() => {
    const view = measurementPointView(activeData);
    setStreamMode(activeData?.media?.includes("红外") ? "红外" : "可见光");
    setZoom(view.digitalZoom);
    setPtz({ x: view.x, y: view.y, zoom: view.zoom, preset: view.preset });
    setPtzStatus(activeData?.type === "point" ? "已恢复该测点视角" : "");
  }, [activeData?.id]);
  useEffect(() => {
    const exitExpanded = (event) => {
      if (event.key === "Escape" && !document.querySelector(".rh-modal-backdrop")) setExpanded(false);
    };
    window.addEventListener("keydown", exitExpanded);
    return () => {
      window.removeEventListener("keydown", exitExpanded);
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    };
  }, []);
  return <section className={`rh-preview ${isHikvisionCamera ? "hikvision" : ""} ${expanded ? "expanded" : ""}`}>
    <header>
      <div className="rh-preview-title"><span>{streamMode}</span><small>{activeData ? `${activeData.label} · ${activeData.model || "取景通道"}` : activeFeature?.name || "请选择左侧监测功能"}</small></div>
      {isHikvisionCamera && <em className="rh-camera-capability">{supportsPtz ? "云台/变焦" : "非云台"}</em>}
      {expanded && <button onClick={() => setExpanded(false)} aria-label="退出全屏"><IconX size={18} /></button>}
    </header>
    <div className="rh-preview-tools">
      <button className="snapshot" onClick={onSnapshot} title={online ? "截取快照" : "采集站离线，无法截取实时快照"}><IconCamera size={18} /><span>截取快照</span></button>
      {supportsThermal && <div className="rh-stream-switch"><button className={streamMode === "可见光" ? "active" : ""} onClick={() => setStreamMode("可见光")}>可见光</button><button className={streamMode === "红外" ? "active thermal" : ""} onClick={() => setStreamMode("红外")}>红外</button></div>}
      <i />
      <div className="rh-annotation-toolset" role="toolbar" aria-label="标注工具">
        <button className={annotationTool === "point" && !locked ? "active" : ""} title="点标注" aria-label="点标注" aria-pressed={annotationTool === "point" && !locked} disabled={!activeFeature || locked} onClick={() => openAnnotationTool("point")}><IconPointFilled size={19} /></button>
        <button className={annotationTool === "rectangle" && !locked ? "active" : ""} title="矩形线框标注" aria-label="矩形线框标注" aria-pressed={annotationTool === "rectangle" && !locked} disabled={!activeFeature || locked} onClick={() => openAnnotationTool("rectangle")}><IconRectangle size={19} /></button>
        <button className={annotationTool === "polygon" && !locked ? "active" : ""} title="多点线框标注" aria-label="多点线框标注" aria-pressed={annotationTool === "polygon" && !locked} disabled={!activeFeature || locked} onClick={() => openAnnotationTool("polygon")}><IconPolygon size={19} /></button>
        <button className={`tool-divider ${annotationTool === "edit" && !locked ? "active" : ""}`} title="编辑标记" aria-label="编辑标记" aria-pressed={annotationTool === "edit" && !locked} disabled={!activeFeature || locked} onClick={() => openAnnotationTool("edit")}><IconVectorBezier2 size={19} /></button>
        <button title="放大" aria-label="放大" disabled={zoom >= 1.5} onClick={() => changeDigitalZoom(0.1)}><IconZoomIn size={19} /></button>
        <button className="tool-divider" title="缩小" aria-label="缩小" disabled={zoom <= 0.8} onClick={() => changeDigitalZoom(-0.1)}><IconZoomOut size={19} /></button>
        <button className={locked ? "active" : ""} title="冻结标注" aria-label="冻结标注" aria-pressed={locked} disabled={!activeFeature || locked} onClick={() => onLockedChange(true)}><IconLock size={19} /></button>
        <button title="解锁标注" aria-label="解锁标注" disabled={!activeFeature || !locked} onClick={() => onLockedChange(false)}><IconLockOpen size={19} /></button>
      </div>
      <output>{Math.round(zoom * ptz.zoom * 100)}%</output>
      <div className="rh-preview-view-actions">
        <button className={expanded ? "active" : ""} title={expanded ? "恢复窗口" : "全屏预览"} aria-label={expanded ? "恢复窗口" : "全屏预览"} onClick={() => setExpanded(!expanded)}><IconFocusCentered size={18} /></button>
        <button title="复位当前测点画面与云台视角" aria-label="复位当前测点画面与云台视角" disabled={zoom === 1 && ptz.x === 0 && ptz.y === 0 && ptz.zoom === 1} onClick={resetView}><IconRefresh size={18} /></button>
        <button title={showAnnotations ? "隐藏全部标注" : "显示全部标注"} aria-label={showAnnotations ? "隐藏全部标注" : "显示全部标注"} disabled={!activeFeature} onClick={() => setShowAnnotations(!showAnnotations)}>{showAnnotations ? <IconEye size={18} /> : <IconEyeOff size={18} />}</button>
      </div>
    </div>
    {isHikvisionCamera && <div className={`rh-ptz-strip ${supportsPtz ? "" : "fixed"}`} data-point-id={activeData?.id || ""}>
      <div className="rh-ptz-status"><span><IconGauge size={16} /></span><div><b><span>{supportsPtz ? "测点独立云台视角" : "固定机位测点"}</span><em>{supportsPtz ? "独立保存" : "数字取景"}</em></b><small><span>{supportsPtz ? `水平 ${angle(ptz.x)} · 俯仰 ${angle(ptz.y)} · 光学 ${ptz.zoom.toFixed(1)}x` : `数字变焦 ${Math.round(zoom * 100)}%`}</span><em>{ptzStatus || "视角已保存至当前测点"}</em></small></div></div>
      {supportsPtz && <><div className="rh-ptz-directions">
        <button aria-label="当前测点云台向上" onPointerDown={() => sendPtz("向上旋转", 0, -2)}><IconChevronUp size={15} /></button>
        <button aria-label="当前测点云台向左" onPointerDown={() => sendPtz("向左旋转", -2, 0)}><IconChevronLeft size={15} /></button>
        <button aria-label="当前测点云台归中" onClick={resetView}><IconFocusCentered size={14} /></button>
        <button aria-label="当前测点云台向右" onPointerDown={() => sendPtz("向右旋转", 2, 0)}><IconChevronRight size={15} /></button>
        <button aria-label="当前测点云台向下" onPointerDown={() => sendPtz("向下旋转", 0, 2)}><IconChevronDown size={15} /></button>
      </div><div className="rh-ptz-zoom"><button onClick={() => sendPtz("光学缩小", 0, 0, -0.2)}><IconZoomOut size={14} />变焦</button><b>{ptz.zoom.toFixed(1)}x</b><button onClick={() => sendPtz("光学放大", 0, 0, 0.2)}><IconZoomIn size={14} />变焦</button></div><button className="rh-preset" onClick={recallPointPreset}>调用测点预置位</button></>}
    </div>}
    <div className="rh-camera">
      <div className="rh-camera-stage" style={{ transform: `translate(calc(-50% + ${Math.max(-12, Math.min(12, ptz.x))}%), calc(-50% + ${Math.max(-8, Math.min(8, ptz.y))}%)) scale(${zoom * ptz.zoom})` }}>
        <img className={streamMode === "红外" ? "thermal" : ""} src={activeData?.image || visibleLightImage} alt={`${activeData?.model || "RH830"} ${streamMode}实时画面`} />
        <PolygonCanvas regions={visibleRegions} />
        {visibleRegions.filter((region) => region.shape !== "polygon").map((region) => <span data-qa="preview-frame" data-region-id={region.regionId} key={region.regionId} className={`rh-frame ${region.shape || "rectangle"}`} style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%`, borderColor: region.color, color: region.color }}><em style={{ background: region.color }}>{region.name}</em></span>)}
      </div>
      {!online && <div className="rh-preview-offline"><IconAlertTriangle size={18} /><span>采集站离线，当前展示最后一帧缓存画面</span></div>}
      {!activeFeature && <div className="rh-preview-empty"><IconVectorBezier2 size={26} /><b>请选择一个监测功能</b><span>右侧将只展示该功能的标注区域</span></div>}
      {activeFeature?.noAnnotation && <div data-qa="no-annotation-preview" className="rh-preview-empty compact"><IconInfoCircle size={25} /><b>该功能无需标注区域</b><span>可从左侧功能卡重新启用区域配置</span></div>}
      {activeFeature && !activeFeature.noAnnotation && !regions.length && <div className="rh-preview-empty compact"><IconVectorBezier2 size={25} /><b>尚未配置标注区域</b><button disabled={locked} onClick={onEditRegions}>立即配置</button></div>}
      {activeFeature && !activeFeature.noAnnotation && regions.length > 0 && (!activeFeature.visible || !showAnnotations || !visibleRegions.length) && <div className="rh-preview-note">{!activeFeature.visible ? "当前功能的标注已隐藏" : !showAnnotations ? "全部标注已临时隐藏" : "当前功能的区域均已隐藏"}</div>}
      <div className="rh-tip"><span className={locked ? "locked" : "ready"}>{locked ? "标注已冻结" : isHikvisionCamera ? "海康实时取景" : "预览模式"}</span><br />{activeFeature ? `${visibleRegions.length}/${regions.length} 个标记显示` : "等待选择监测功能"}</div>
    </div>
  </section>;
}function Properties({ code, network, online, onOpenNetwork, flash, hikvision = false }) {
  const [active, setActive] = useState("基本信息");
  const [checking, setChecking] = useState(false);
  const [boardOpen, setBoardOpen] = useState(true);
  const [lastSelfCheck, setLastSelfCheck] = useState("2026-07-20 10:36:28");
  const selfCheckTimerRef = useRef(null);
  const networkUpdatedAt = "2026-07-20 10:36:28";
  useEffect(() => {
    setChecking(false);
    setLastSelfCheck("2026-07-20 10:36:28");
    return () => {
      if (selfCheckTimerRef.current) window.clearTimeout(selfCheckTimerRef.current);
      selfCheckTimerRef.current = null;
    };
  }, [code]);
  const check = () => {
    if (!online) {
      flash("自检失败：采集站当前离线，请恢复连接后重试", "error");
      return;
    }
    const requestedCode = code;
    setChecking(true);
    selfCheckTimerRef.current = window.setTimeout(() => {
      selfCheckTimerRef.current = null;
      setChecking(false);
      setLastSelfCheck((/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { hour12: false }));
      flash(`采集站 ${requestedCode} 自检完成，全部项目正常`);
    }, 700);
  };
  const checkRows = online ? [["核心板通信", "正常", "响应 12ms"], ["摄像头视频流", "正常", "25 FPS"], ["存储空间", "正常", "剩余 68%"], ["算法服务", "正常", "6 个模型已加载"]] : [["核心板通信", "未连接", "等待采集站上线"], ["摄像头视频流", "不可用", "无实时视频流"], ["存储空间", "未知", "无法读取"], ["算法服务", "未知", "无法读取"]];
  return <div className="rh-properties">
<aside>{["基本信息", "网络信息", "自检信息"].map((item) => <button key={item} className={active === item ? "active" : ""} onClick={() => setActive(item)}>{item}</button>)}</aside>
<div className="rh-properties-body">{active === "基本信息" && <div className="rh-property-basic">
<dl className="rh-property-grid">
<div>
<dt>采集站编码</dt>
<dd>{code}</dd>
</div>
<div>
<dt>物设备模型</dt>
<dd>{hikvision ? "HIKVISION_VIDEO_DEVICE" : "RH830NLP"}</dd>
</div>
<div>
<dt>物设备模型版本</dt>
<dd>--</dd>
</div>
<div>
<dt>算法版本</dt>
<dd>{hikvision ? "HIK_ISAPI_V3.4.1" : "RH830_20251209_V1.3.2"}</dd>
</div>
<div>
<dt>架构版本</dt>
<dd>RH830_MPU_A_V1.0.00.0012</dd>
</div>
<div>
<dt>温补温控库硬件版本</dt>
<dd>--</dd>
</div>
</dl>
<button className="rh-board-title" aria-expanded={boardOpen} onClick={() => setBoardOpen(!boardOpen)}>{boardOpen ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />}板信息</button>{boardOpen && <table className="rh-board-table">
<thead>
<tr>
<th>序号</th>
<th>卡槽</th>
<th>板类型</th>
<th>软件版本</th>
<th>硬件版本</th>
<th>序列号</th>
<th>传感器类型</th>
<th>通道</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>--</td>
<td>核心板</td>
<td>RH830_MPU_A_V1.0.00.0012</td>
<td>1.000</td>
<td>{code}</td>
<td>--</td>
<td>--</td>
</tr>
<tr>
<td>2</td>
<td>--</td>
<td>辅助板</td>
<td>1.0.10</td>
<td>1.0.1</td>
<td>2</td>
<td>--</td>
<td>--</td>
</tr>
</tbody>
</table>}<dl className="rh-property-grid rh-property-bottom">
<div>
<dt>采集站同步类型</dt>
<dd>--</dd>
</div>
<div>
<dt>最大通道数</dt>
<dd>--</dd>
</div>
</dl>
</div>}{active === "网络信息" && <div className="rh-property-section">
<div className="rh-section-head">
<div>
<b>网络信息</b>
<span>当前采集站的有线网络参数</span>
</div>
<button onClick={onOpenNetwork}>
<IconWifi size={16} />编辑网络参数</button>
</div>
<dl className="rh-property-grid">
<div>
<dt>IP 地址</dt>
<dd>{network.ip}</dd>
</div>
<div>
<dt>子网掩码</dt>
<dd>{network.mask}</dd>
</div>
<div>
<dt>默认网关</dt>
<dd>{network.gateway}</dd>
</div>
<div>
<dt>首选 DNS</dt>
<dd>{network.dns}</dd>
</div>
<div>
<dt>连接状态</dt>
<dd className={online ? "rh-ok" : "rh-offline-value"}>{online ? "已连接" : "离线"}</dd>
</div>
<div>
<dt>最后更新时间</dt>
<dd>{networkUpdatedAt}</dd>
</div>
</dl>
</div>}{active === "自检信息" && <div className="rh-property-section">
<div className="rh-section-head">
<div>
<b>自检信息</b>
<span>最近自检：{lastSelfCheck}</span>
</div>
<button onClick={check} disabled={checking}>{checking ? <IconLoader2 className="spin" size={16} /> : <IconRefresh size={16} />}{checking ? "检查中" : online ? "立即自检" : "离线自检"}</button>
</div>
<table>
<thead>
<tr>
<th>检查项</th>
<th>结果</th>
<th>说明</th>
</tr>
</thead>
<tbody>{checkRows.map((row) => <tr key={row[0]}>
<td>{row[0]}</td>
<td className={online ? "rh-ok" : "rh-offline-value"}>{row[1]}</td>
<td>{row[2]}</td>
</tr>)}</tbody>
</table>
</div>}</div>
</div>;
}
function RH830StationManagement() {
  const [selected, setSelected] = useState("HKV01101");
  const [codeQuery, setCodeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [stationStatusFilter, setStationStatusFilter] = useState("all");
  const [factoryOpen, setFactoryOpen] = useState(true);
  const [treeHidden, setTreeHidden] = useState(false);
  const [primary, setPrimary] = useState("板卡集合");
  const [secondary, setSecondary] = useState("算法标注");
  const [more, setMore] = useState(false);
  const [stationDetailsOpen, setStationDetailsOpen] = useState(true);
  const [deviceEditorDirty, setDeviceEditorDirty] = useState(false);
  const [accessContext, setAccessContext] = useState(null);
  const [annotationFocus, setAnnotationFocus] = useState(null);
  const [viewMotion, setViewMotion] = useState("");
  const [devices, setDevices] = useState(() => [...createDefaultStationProfile("HKV01101").devices]);
  const [settings, setSettings] = useState(() => cloneSettings(createDefaultStationProfile("HKV01101").settings));
  const [bindings, setBindings] = useState(() => cloneBindings(createDefaultStationProfile("HKV01101").bindings));
  const [network, setNetwork] = useState(() => ({ ...createDefaultStationProfile("HKV01101").network }));
  const [proxy, setProxy] = useState(() => ({ ...createDefaultStationProfile("HKV01101").proxy }));
  const [baselineProfile, setBaselineProfile] = useState(() => createDefaultStationProfile("HKV01101"));
  const [stationProfiles, setStationProfiles] = useState({});
  const [dialog, setDialog] = useState(null);
  const [pendingStation, setPendingStation] = useState("");
  const [busyAction, setBusyAction] = useState(null);
  const [toast, setToast] = useState(null);
  const moreRef = useRef(null);
  const toastTimerRef = useRef(null);
  const actionTimerRef = useRef(null);
  const actionLockRef = useRef(null);
  const viewMotionTimerRef = useRef(null);
  const selectedStation = stations.find(([code]) => code === selected) || stations[0];
  const selectedStationRegion = selectedStation[2] || "输煤区域";
  const isHikvision = selected.startsWith("HKV");
  const filtered = useMemo(() => stations.filter(([code, name]) => code.toLowerCase().includes(codeQuery.trim().toLowerCase()) && name.toLowerCase().includes(nameQuery.trim().toLowerCase()) && (stationStatusFilter === "all" || stationStatusFilter === "online" === onlineCodes.has(code))), [codeQuery, nameQuery, stationStatusFilter]);
  const filteredStationGroups = stationRegionOrder.map((region) => ({ region, stations: filtered.filter((station) => station[2] === region) })).filter((group) => group.stations.length);
  const dirtySections = useMemo(() => ({
    devices: !isHikvision && !sameConfig([...devices].sort(), [...baselineProfile.devices].sort()),
    network: !sameConfig(network, baselineProfile.network),
    proxy: !sameConfig(proxy, baselineProfile.proxy),
    strategy: !sameConfig(settings.strategy, baselineProfile.settings.strategy),
    video: !sameConfig(settings.video, baselineProfile.settings.video),
    fill: !sameConfig(settings.fill, baselineProfile.settings.fill),
    clean: !sameConfig(settings.clean, baselineProfile.settings.clean),
    restart: !sameConfig(settings.restart, baselineProfile.settings.restart),
    algorithm: !sameConfig(settings.algorithm, baselineProfile.settings.algorithm),
    hikvision: !sameConfig(settings.hikvision, baselineProfile.settings.hikvision),
    annotation: !sameConfig(comparableBindings(bindings), comparableBindings(baselineProfile.bindings))
  }), [baselineProfile, bindings, devices, network, proxy, settings]);
  const dirty = Object.values(dirtySections).some(Boolean);
  const dirtySectionCount = Object.values(dirtySections).filter(Boolean).length;
  const dirtySectionDetails = Object.entries(dirtySections).filter(([, changed]) => changed).map(([key]) => ({ key, ...stationSectionMeta[key] }));
  const settingsIssue = validateStationSettings(settings);
  const algorithmIssue = validateAlgorithmBindings(bindings);
  const online = onlineCodes.has(selected);
  const markDirty = () => void 0;
  const flash = (message, tone = "success", duration = tone === "error" ? 4200 : 2400) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ message, tone });
    toastTimerRef.current = window.setTimeout(() => setToast(null), duration);
  };
  const transitionView = (direction, changeView) => {
    if (viewMotionTimerRef.current) window.clearTimeout(viewMotionTimerRef.current);
    setViewMotion("");
    window.requestAnimationFrame(() => {
      changeView();
      setViewMotion(direction);
      viewMotionTimerRef.current = window.setTimeout(() => setViewMotion(""), 320);
    });
  };
  const openAnnotationFromAccess = (payload) => {
    if (payload.stationCode !== selected) {
      flash(`已阻止跨站跳转：设备归属 ${payload.stationCode}，当前采集站为 ${selected}`, "error");
      return;
    }
    setAccessContext(payload.returnContext);
    setAnnotationFocus({ ...payload, nonce: Date.now() });
    transitionView("forward", () => {
      setPrimary("板卡集合");
      setSecondary("算法标注");
      setTreeHidden(true);
    });
    window.setTimeout(() => flash(`已定位 ${payload.device.name} · ${payload.targetLabel}`, "info"), 120);
  };
  const openAnnotationFromOverview = (device) => {
    const target = hikvisionAnnotationTargetFor(device);
    if (!target) {
      flash(`无法定位 ${device.name}：尚未建立算法数据 ID`, "warning");
      return;
    }
    setAnnotationFocus({ ...target, device, nonce: Date.now() });
    setPrimary("板卡集合");
    setSecondary("算法标注");
    setTreeHidden(false);
    window.setTimeout(() => flash(`已在主工作台定位 ${device.name} · ${target.targetLabel}`, "info"), 80);
  };
  const returnToAccess = () => {
    transitionView("back", () => {
      setAnnotationFocus(null);
      setPrimary("板卡集合");
      setSecondary("算法标注");
      setTreeHidden(false);
    });
    window.setTimeout(() => flash("已返回当前采集站的全部设备范围", "info"), 120);
  };
  useEffect(() => () => {
    if (viewMotionTimerRef.current) window.clearTimeout(viewMotionTimerRef.current);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    actionLockRef.current = null;
  }, []);
  useEffect(() => {
    const closeMore = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "mousedown" && moreRef.current?.contains(event.target)) return;
      setMore(false);
    };
    document.addEventListener("mousedown", closeMore);
    window.addEventListener("keydown", closeMore);
    return () => {
      document.removeEventListener("mousedown", closeMore);
      window.removeEventListener("keydown", closeMore);
    };
  }, []);
  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);
  useEffect(() => {
    const closeNarrowTree = (event) => {
      if (event.key === "Escape" && !treeHidden && window.matchMedia("(max-width: 1100px)").matches && !document.querySelector(".rh-modal-backdrop")) setTreeHidden(true);
    };
    window.addEventListener("keydown", closeNarrowTree);
    return () => window.removeEventListener("keydown", closeNarrowTree);
  }, [treeHidden]);
  const updateSettings = (group, key, value) => setSettings((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  const updateHikvisionSettings = (key, value) => {
    updateSettings("hikvision", key, value);
    if (key === "deviceRecords") setDevices(value.map((device) => device.name));
  };
  const finishAction = (type, progress, success, callback) => {
    if (actionLockRef.current) {
      flash(`正在执行“${actionLockRef.current.label}”，请稍候`, "warning");
      return false;
    }
    const actionStation = selected;
    const lock = { type, label: progress.replace(/^正在/, "").replace(/…$/, ""), message: progress, stationCode: actionStation };
    actionLockRef.current = lock;
    setBusyAction(lock);
    actionTimerRef.current = window.setTimeout(() => {
      actionLockRef.current = null;
      setBusyAction(null);
      callback?.(actionStation);
      flash(success);
    }, 700);
    return true;
  };
  const snapshotProfile = (metadata = {}) => ({ settings: cloneSettings(settings), network: { ...network }, proxy: { ...proxy }, devices: [...devices], bindings: cloneBindings(bindings), savedAt: metadata.savedAt ?? baselineProfile.savedAt, version: metadata.version ?? baselineProfile.version, issuedVersion: metadata.issuedVersion ?? baselineProfile.issuedVersion ?? baselineProfile.version, issuedAt: metadata.issuedAt ?? baselineProfile.issuedAt ?? baselineProfile.savedAt });
  const focusAlgorithmValidation = (validation, prefix = "保存已阻止") => {
    setPrimary("板卡集合");
    setSecondary("算法标注");
    flash(`${prefix}：${validation.message}`, "error");
  };
  const focusSettingsValidation = (validation, prefix = "保存已阻止") => {
    setPrimary(validation.primary);
    if (validation.secondary) setSecondary(validation.secondary);
    flash(`${prefix}：${validation.message}`, "error");
    window.setTimeout(() => document.querySelector(`.rh-settings [aria-invalid="true"]`)?.focus(), 0);
  };
  const persist = (afterSave) => {
    const settingsValidation = validateStationSettings(settings);
    if (settingsValidation) {
      focusSettingsValidation(settingsValidation);
      return false;
    }
    const algorithmValidation = validateAlgorithmBindings(bindings);
    if (algorithmValidation) {
      focusAlgorithmValidation(algorithmValidation);
      return false;
    }
    const savedAt2 = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
    const profile = snapshotProfile({ savedAt: savedAt2, version: baselineProfile.version + 1 });
    return finishAction("save", "正在保存采集站配置…", `采集站配置已保存为 V${profile.version}，尚未下达至设备`, () => {
      setStationProfiles((profiles) => ({ ...profiles, [selected]: cloneProfile(profile) }));
      setBaselineProfile(cloneProfile(profile));
      afterSave?.(profile);
    });
  };
  const save = () => {
    if (deviceEditorDirty) return flash("当前设备有未应用修改，请先在右侧应用到页面草稿", "warning");
    return dirty ? persist() : flash("当前配置已是最新版本", "info");
  };
  const commitStation = (code, preserveCurrent = true) => {
    if (preserveCurrent) setStationProfiles((profiles) => ({ ...profiles, [selected]: cloneProfile(baselineProfile) }));
    const profile = cloneProfile(stationProfiles[code] || createDefaultStationProfile(code));
    setSelected(code);
    setAccessContext(null);
    setAnnotationFocus(null);
    setPrimary("板卡集合");
    setSecondary("算法标注");
    setTreeHidden(false);
    setSettings(cloneSettings(profile.settings));
    setNetwork({ ...profile.network });
    setProxy({ ...profile.proxy });
    setDevices([...profile.devices]);
    setBindings(cloneBindings(profile.bindings || initialBindings));
    setBaselineProfile(cloneProfile(profile));
    flash(`已切换至采集站 ${code}`);
  };
  const selectStation = (code) => {
    if (code === selected) return;
    if (deviceEditorDirty) {
      flash("当前设备有未应用修改，请先应用或取消后再切换采集站", "warning");
      return;
    }
    if (busyAction) {
      flash("命令执行期间暂不能切换采集站", "warning");
      return;
    }
    if (dirty) {
      setPendingStation(code);
      return;
    }
    commitStation(code);
  };
  const restoreBaseline = () => {
    setSettings(cloneSettings(baselineProfile.settings));
    setNetwork({ ...baselineProfile.network });
    setProxy({ ...baselineProfile.proxy });
    setDevices([...baselineProfile.devices]);
    setBindings(cloneBindings(baselineProfile.bindings));
    setDialog(null);
    flash("已撤销当前站点的全部未保存修改", "info");
  };
  const collectDeviceDependencies = (device) => {
    const deviceOption = dataOptions.find((option) => option.label === device);
    if (!deviceOption) return [];
    const descendantIds = /* @__PURE__ */ new Set([deviceOption.id, ...deviceOption.children.map((point) => point.id)]);
    return bindings.filter((group) => descendantIds.has(group.id)).map((group) => ({ id: group.id, label: group.data.label, path: group.data.path, functions: group.functions.map((feature) => feature.name) }));
  };
  const requestRemoveDevice = (device) => {
    const dependencies = collectDeviceDependencies(device);
    setDialog(dependencies.length ? { type: "device-dependency", device, dependencies } : { type: "remove-device", device });
  };
  const fileStamp = () => {
    const now = /* @__PURE__ */ new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  };
  const download = (content2, filename, type) => {
    const url = URL.createObjectURL(new Blob([content2], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const exportConfig = () => {
    download(JSON.stringify({ station: selected, scope: dirty ? "current-draft" : "saved-version", devices, network, proxy: { ...proxy, password: proxy.password ? "******" : "" }, settings, bindings: comparableBindings(bindings) }, null, 2), `RH830-${selected}-${dirty ? "draft" : "saved"}-config-${fileStamp()}.json`, "application/json");
    setMore(false);
    flash(dirty ? "当前配置草稿已导出" : "已保存配置已导出");
  };
  const exportLog = () => {
    download(`[${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { hour12: false })}] station=${selected} status=${online ? "online" : "offline"}
video=${online ? "25fps" : "unavailable"} algorithm=${online ? "ready" : "unknown"}
`, `RH830-${selected}-log-${fileStamp()}.txt`, "text/plain");
    setMore(false);
    flash("运行日志已下载");
  };
  const snapshot = () => {
    if (!online) {
      flash("快照失败：采集站当前离线，无法获取实时画面", "error");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = visibleLightImage;
    anchor.download = `RH830-${selected}-snapshot-${fileStamp()}.png`;
    anchor.click();
    flash("已截取并下载当前可见光快照");
  };
  const jumpToSection = (key) => {
    const target = stationSectionMeta[key];
    if (!target) return;
    if (target.primary) setPrimary(target.primary);
    if (target.secondary) setSecondary(target.secondary);
    if (key === "network" || key === "proxy") { setDialog({ type: key }); return; }
    if (key === "devices") { setDialog({ type: "devices" }); return; }
    setDialog(null);
    flash(`已定位到“${target.label}”`, "info");
  };
  const issueSavedVersion = () => {
    setDialog(null);
    if (!online) { flash("下达失败：采集站当前离线，请恢复连接后重试", "error"); return false; }
    const issuedAt = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const issuedProfile = cloneProfile({ ...baselineProfile, issuedVersion: baselineProfile.version, issuedAt });
    return finishAction("issue", `正在下达已保存 V${baselineProfile.version}…`, dirty ? `已下达保存版本 V${baselineProfile.version}，当前草稿仍保留` : `参数下达成功，设备运行版本已同步为 V${baselineProfile.version}`, () => {
      setStationProfiles((profiles) => ({ ...profiles, [selected]: cloneProfile(issuedProfile) }));
      setBaselineProfile(cloneProfile(issuedProfile));
    });
  };
  const issueDraftVersion = () => {
    const currentSettingsIssue = validateStationSettings(settings);
    if (currentSettingsIssue) { setDialog(null); focusSettingsValidation(currentSettingsIssue, "下达已终止"); return false; }
    const currentAlgorithmIssue = validateAlgorithmBindings(bindings);
    if (currentAlgorithmIssue) { setDialog(null); focusAlgorithmValidation(currentAlgorithmIssue, "下达已终止"); return false; }
    setDialog(null);
    if (!online) { flash("下达失败：采集站当前离线，请恢复连接后重试", "error"); return false; }
    const issuedAt = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const nextVersion = baselineProfile.version + 1;
    const issuedProfile = snapshotProfile({ savedAt: issuedAt, version: nextVersion, issuedVersion: nextVersion, issuedAt });
    return finishAction("issue", `正在保存 V${nextVersion} 并下达参数…`, `保存并下达成功，设备运行版本已同步为 V${nextVersion}`, () => {
      setStationProfiles((profiles) => ({ ...profiles, [selected]: cloneProfile(issuedProfile) }));
      setBaselineProfile(cloneProfile(issuedProfile));
    });
  };
  const content = () => {
    if (primary === "设备接入") return <HikvisionAccessPanel key={selected} stationCode={selected} stationName={selectedStation[1]} stationRegion={selectedStationRegion} values={settings.hikvision} onChange={updateHikvisionSettings} devices={devices} online={online} flash={flash} onEditorDirtyChange={setDeviceEditorDirty} onOpenAnnotation={openAnnotationFromAccess} onSelectStation={selectStation} initialContext={accessContext} />;
    if (primary === "属性") return <Properties code={selected} network={network} online={online} onOpenNetwork={() => setDialog({ type: "network" })} flash={flash} hikvision={isHikvision} />;
    if (primary === "常规采集策略") return <EditableSettings {...settingsPanels.strategy} values={settings.strategy} onChange={(key, value) => updateSettings("strategy", key, value)} />;

    const panelKey = { "视频设置": "video", "补光设置": "fill", "清洁设置": "clean", "算法参数": "algorithm", "定时重启": "restart" }[secondary];
    if (panelKey) return <EditableSettings {...settingsPanels[panelKey]} values={settings[panelKey]} onChange={(key, value) => updateSettings(panelKey, key, value)} />;
    return <AnnotationWorkspace key={`${selected}-${annotationFocus?.nonce || "default"}`} flash={flash} onDirty={markDirty} onSnapshot={snapshot} online={online} devices={devices} deviceRecords={settings.hikvision.deviceRecords || []} bindings={bindings} setBindings={setBindings} focusTarget={annotationFocus} />;
  };
  const isAccess = primary === "设备接入";
  const isBoard = primary === "板卡集合";
  const isAnnotation = isBoard && secondary === "算法标注";
  const boardDirty = dirtySections.devices || dirtySections.video || dirtySections.fill || dirtySections.clean || dirtySections.annotation || dirtySections.algorithm || dirtySections.restart;
  const accessDirty = dirtySections.hikvision;
  const propertyDirty = dirtySections.network || dirtySections.proxy;
  const secondaryDirty = { "视频设置": dirtySections.video, "补光设置": dirtySections.fill, "清洁设置": dirtySections.clean, "算法标注": dirtySections.annotation, "算法参数": dirtySections.algorithm, "定时重启": dirtySections.restart };
  return <div className={`rh-page ${viewMotion ? `rh-view-motion-${viewMotion}` : ""}`}>
<div className={`rh-workbench ${treeHidden ? "tree-hidden" : ""} ${isAccess ? "access-mode" : ""} ${busyAction ? "command-busy" : ""}`} aria-busy={Boolean(busyAction)}>
{!isAccess && <aside className="rh-tree">
<div className="rh-tree-search">
<label>
<input value={codeQuery} onChange={(event) => setCodeQuery(event.target.value)} placeholder="采集站编码" aria-label="按采集站编码筛选" />
<IconSearch size={15} />
</label>
<label>
<input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="采集站名称" aria-label="按采集站名称筛选" />
<IconSearch size={15} />
</label>
</div>
<div className="rh-tree-status" aria-label="采集站状态筛选">{[["all", "全部", stations.length], ["online", "在线", onlineCodes.size], ["offline", "离线", stations.length - onlineCodes.size]].map(([value, label, count]) => <button key={value} className={stationStatusFilter === value ? "active" : ""} aria-pressed={stationStatusFilter === value} onClick={() => setStationStatusFilter(value)}>{label}<b>{count}</b>
</button>)}</div>
<div className="rh-tree-columns">
<span>采集站编码</span>
<span>采集站名称</span>
<span>状态</span>
</div>
<button className="rh-root" aria-expanded={factoryOpen} onClick={() => setFactoryOpen(!factoryOpen)}>
{factoryOpen ? <IconMinus size={13} /> : <IconPlus size={13} />}
<IconBuildingFactory size={18} />
<span>示范火电厂 · 音视频巡检中心</span>
<small>{filtered.length} / {stations.length}</small>
</button>
{factoryOpen && <div className="rh-station-groups">
  {filteredStationGroups.map((group) => <section className="rh-region-group" key={group.region}>
    <div className="rh-region-node"><IconChevronDown size={13} /><span>{group.region}</span><small>{group.stations.length} 个采集站</small></div>
    <div className="rh-code-list">{group.stations.map(([code, name]) => <button key={code} className={selected === code ? "selected" : ""} onClick={() => selectStation(code)}>
      <span><IconDatabase className={onlineCodes.has(code) ? "online" : ""} size={15} />{code}</span>
      <em title={name}>{name}</em>
      <small className={onlineCodes.has(code) ? "online" : "offline"}>{onlineCodes.has(code) ? "在线" : "离线"}</small>
    </button>)}</div>
  </section>)}
  {!filtered.length && <div className="rh-tree-empty">
    <span>未找到匹配的采集站</span>
    <button onClick={() => { setCodeQuery(""); setNameQuery(""); setStationStatusFilter("all"); }}>清空筛选</button>
  </div>}
</div>}
</aside>}
{!isAccess && !treeHidden && <button className="rh-tree-scrim" aria-label="关闭采集站列表" onClick={() => setTreeHidden(true)} />}
{!isAccess && <button className="rh-tree-handle" onClick={() => setTreeHidden(!treeHidden)} aria-label={treeHidden ? "展开采集站树" : "收起采集站树"}>{treeHidden ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}</button>}
<main className={`rh-main ${isAccess ? "access-mode" : ""} ${isBoard ? "board-mode" : ""} ${isAnnotation ? "annotation-mode" : ""}`}>
{isAccess && <div className="rh-access-page-heading">
  <div className="rh-access-heading-copy"><strong>采集站管理</strong><span>海康视频设备接入与配置</span></div>
  <label className="rh-access-station-select"><span>当前采集站</span><select value={selected} disabled={Boolean(busyAction)} onChange={(event) => selectStation(event.target.value)}>{stationRegionOrder.map((region) => <optgroup key={region} label={region}>{stations.filter(([code, , stationRegion]) => code.startsWith("HKV") && stationRegion === region).map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}</optgroup>)}</select></label>
  <button className={`rh-access-version ${dirty ? "dirty" : ""}`} onClick={() => setDialog({ type: "config-review" })} title="查看草稿、平台版本和设备运行版本"><IconChecklist size={15} /><span>{dirty ? `${dirtySectionCount} 处页面草稿` : `平台 V${baselineProfile.version}`}</span><small>设备 V{baselineProfile.issuedVersion ?? baselineProfile.version}</small></button>
  <div className="rh-access-heading-actions">
    <button className="discard" disabled={!dirty || Boolean(busyAction)} title={dirty ? "撤销当前采集站页面草稿" : "没有可撤销的页面草稿"} onClick={() => setDialog({ type: "discard-draft" })}><IconRefresh size={15} />撤销草稿</button>
    <button className={`primary ${dirty ? "dirty" : ""}`} disabled={Boolean(busyAction) || deviceEditorDirty} title={deviceEditorDirty ? "请先处理右侧设备未应用修改" : dirty ? "保存页面草稿为新的平台版本" : "当前平台版本已是最新"} onClick={save}>{busyAction?.type === "save" ? <IconLoader2 className="spin" size={15} /> : <IconDeviceFloppy size={15} />}{busyAction?.type === "save" ? "保存中" : "保存平台版本"}</button>
  </div>
</div>}
{!isAccess && <div className="rh-page-label">
<strong>采集站配置</strong>
<span className={`rh-runtime ${online ? "online" : "offline"}`}>
<i />{online ? "在线" : "离线"}</span>
<span className="rh-current-station">{selected} · {selectedStation[1]}</span>{isAnnotation && annotationFocus && <button className="rh-context-back" onClick={returnToAccess} title={`返回并恢复${annotationFocus.device.name}`}><IconChevronLeft size={14} /><span>全部设备</span><i /> <b>{annotationFocus.device.name}</b><small>{annotationFocus.targetLabel}</small></button>}
<div className="rh-version-state"><button data-action="version-review" className={dirty ? "dirty" : ""} onClick={() => setDialog({ type: "config-review" })} title="查看配置检查与版本状态"><small className={dirty ? "dirty" : ""}>{dirty ? `${dirtySectionCount} 处未保存 · 平台 V${baselineProfile.version}` : `平台已保存 V${baselineProfile.version}`}</small><IconChecklist size={14} /></button><span className={(baselineProfile.issuedVersion ?? baselineProfile.version) === baselineProfile.version ? "synced" : "behind"}>设备运行 V{baselineProfile.issuedVersion ?? baselineProfile.version}</span></div>
</div>}
{!isAccess && <section className={`rh-head ${isAccess ? "access-compact" : ""}`}>
<div className="rh-head-top">
<label>采集站编号：<select value={selected} disabled={Boolean(busyAction)} onChange={(event) => selectStation(event.target.value)}>{stations.map(([code, name, region]) => <option key={code} value={code}>示范火电厂 / {region}/{code} · {name}</option>)}</select>
</label>
{isBoard && <div className="rh-inline-context" aria-label="当前采集站摘要">
<span>{isHikvision ? "海康视频接入站" : "RH830"}</span>
<span>{devices.length} 台监测设备</span>
<span>{network.ip}</span>
<button type="button" aria-expanded={stationDetailsOpen} onClick={() => setStationDetailsOpen((open) => !open)}>
站点详情 <IconChevronDown size={13} />
</button>
{isHikvision && <UnifiedStationDeviceOverview devices={settings.hikvision.deviceRecords || []} stationCode={selected} onOpenAnnotation={openAnnotationFromOverview} />}
</div>}
<div className="rh-actions">
<button data-action="preview" aria-label="预览调试" title={online ? "预览调试" : "采集站离线，无法实时预览"} disabled={Boolean(busyAction)} onClick={() => online ? setDialog({ type: "preview" }) : flash("预览失败：采集站当前离线", "error")}>
<IconActivity size={15} />
<span>预览调试</span>
</button>
{isBoard && <button className="rh-ref-action" data-action="proxy" onClick={() => setDialog({ type: "proxy" })}><IconSettings size={15} /><span>代理配置</span></button>}
{isBoard && <button className="rh-ref-action" data-action="network" onClick={() => setDialog({ type: "network" })}><IconWifi size={15} /><span>设置网络参数</span></button>}
<button data-action="config-review" aria-label="配置检查" title="检查完整性、草稿与设备运行版本" disabled={Boolean(busyAction)} onClick={() => setDialog({ type: "config-review" })}><IconChecklist size={15} /><span>配置检查</span></button>
<button data-action="issue" aria-label="下达参数" title={online ? "下达参数" : "采集站离线，下达将失败"} disabled={Boolean(busyAction)} onClick={() => setDialog({ type: "issue" })}>
<IconUpload size={15} />
<span>下达参数</span>
</button>
<div ref={moreRef}>
<button aria-label="更多操作" aria-expanded={more} title="更多操作" disabled={Boolean(busyAction)} onClick={() => setMore(!more)}>更多<IconChevronDown size={13} />
</button>{more && <span className="rh-more">
<button data-action="proxy" onClick={() => { setMore(false); setDialog({ type: "proxy" }); }}><IconSettings size={14} />代理配置</button>
<button data-action="network" onClick={() => { setMore(false); setDialog({ type: "network" }); }}><IconWifi size={14} />网络参数</button>
<button data-action="reboot" onClick={() => { setMore(false); online ? setDialog({ type: "reboot" }) : flash("重启失败：采集站当前离线", "error"); }}><IconPower size={14} />重启采集站</button>
<button data-action="export-config" onClick={exportConfig}>{dirty ? "导出当前草稿" : "导出已保存配置"}</button>
<button data-action="export-log" onClick={exportLog}>下载运行日志</button>
</span>}</div>
<button className="discard" data-action="discard" disabled={!dirty || Boolean(busyAction)} title={dirty ? "撤销当前站点全部未保存修改" : "没有可撤销的修改"} onClick={() => setDialog({ type: "discard-draft" })}>
<IconRefresh size={15} />
<span>撤销</span>
</button>
<button className={`save ${dirty ? "dirty" : ""}`} data-action="save" disabled={Boolean(busyAction)} onClick={save} title={dirty ? "保存当前配置草稿" : "当前配置已保存"}>
<IconDeviceFloppy size={15} />
<span>保存</span>{dirty && <i />}</button>
</div>
</div>
{(!isBoard || stationDetailsOpen) && <div className="rh-meta">
<span>采集站类型：<b>{isHikvision ? "\u6D77\u5EB7\u89C6\u9891\u63A5\u5165\u7AD9" : "RH830"}</b>
</span>
<span>采集站名称：<b>{selectedStation[1]}</b>
</span>
<span>采集站模型：<b>{isHikvision ? "HIKVISION-VIDEO-GATEWAY" : "RH830NLP"}</b>
</span>
<span>模型版本：<b>{isHikvision ? "2.1.0-delivery" : "1.0.0.52"}</b>
</span>
<span>IP：<b>{network.ip}</b>
</span>
</div>}
{!isAccess && (!isBoard || stationDetailsOpen) && <div className="rh-device">
<span>{isHikvision ? "当前摄像头：" : "监测设备："}</span>{devices.map((device) => <span className="rh-device-chip" key={device}>
<strong>{device}</strong>
{!isHikvision && <button title={`移除${device}`} disabled={Boolean(busyAction)} onClick={() => requestRemoveDevice(device)}>
<IconX size={13} />
</button>}
</span>)}{isHikvision ? <small className="rh-single-camera-note"><IconLock size={13} />一机一站，摄像头随采集站固定</small> : <button className="add" disabled={Boolean(busyAction)} onClick={() => setDialog({ type: "devices" })}>
<IconCirclePlus size={15} />添加设备</button>}
</div>}
</section>}
{!isAccess && <div className={`rh-tab-rails ${isBoard ? "board-compact" : ""}`}><nav className="rh-primary" role="tablist" aria-label="采集站配置分类">{isHikvision && <button type="button" className="rh-device-overview-tab" aria-selected="false" onClick={() => document.querySelector(".rh-unified-device-trigger")?.click()}>设备接入</button>}{(["板卡集合", "属性", "常规采集策略"]).map((tab) => {
  const hasDraft = tab === "设备接入" ? accessDirty : tab === "板卡集合" ? boardDirty : tab === "属性" ? propertyDirty : dirtySections.strategy;
  return <button key={tab} role="tab" aria-selected={primary === tab} aria-controls="rh-config-panel" className={primary === tab ? "active" : ""} onClick={() => {
    if (isAccess && deviceEditorDirty && tab !== "设备接入") {
      flash("当前设备有未应用修改，请先在右侧应用或取消", "warning");
      return;
    }
    if (tab === "设备接入" && isAnnotation && annotationFocus) {
      returnToAccess();
      return;
    }
    setPrimary(tab);
    if (tab === "设备接入") setTreeHidden(true);
  }}>{tab}{hasDraft && <i className="rh-tab-dirty" />}</button>;
})}</nav>{primary === "板卡集合" && <nav className="rh-secondary" role="tablist" aria-label="板卡配置分类">{["视频设置", "补光设置", "清洁设置", "算法标注", "算法参数", "定时重启"].map((tab) => <button key={tab} role="tab" aria-selected={secondary === tab} aria-controls="rh-config-panel" className={secondary === tab ? "active" : ""} onClick={() => setSecondary(tab)}>{tab}{secondaryDirty[tab] && <i className="rh-tab-dirty" />}</button>)}</nav>}</div>}<section className={`rh-body ${isAccess ? "access-body" : ""}`} id="rh-config-panel" role="tabpanel" tabIndex="0">
<div className="rh-content">{content()}</div>
</section>
</main>
</div>
  {dialog?.type === "discard-draft" && <ConfirmModal title="撤销未保存修改" message="确认恢复为当前站点最近保存的版本吗？" detail={`将撤销 ${dirtySectionCount} 个配置分区中的草稿修改，且无法恢复。`} confirmText="确认撤销" onCancel={() => setDialog(null)} onConfirm={restoreBaseline} />}
  {dialog?.type === "preview" && <PreviewDebugModal onCancel={() => setDialog(null)} onSnapshot={snapshot} />}
  {dialog?.type === "proxy" && <ConnectionModal type="proxy" initialValue={proxy} onCancel={() => setDialog(null)} onSave={(value) => {
    setProxy(value);
    markDirty();
    setDialog(null);
    flash("代理配置已更新，保存后生效");
  }} />}
  {dialog?.type === "network" && <ConnectionModal type="network" initialValue={network} onCancel={() => setDialog(null)} onSave={(value) => {
    setNetwork(value);
    markDirty();
    setDialog(null);
    flash("网络参数已更新，保存后生效");
  }} />}
  {dialog?.type === "devices" && <DeviceModal devices={devices} options={dataOptions.filter((item) => isHikvision ? item.vendor === "Hikvision" : item.vendor !== "Hikvision")} onCancel={() => setDialog(null)} onSave={(value) => {
    const blockingDevices = devices.filter((device) => !value.includes(device)).map((device) => ({ device, dependencies: collectDeviceDependencies(device) })).filter((item) => item.dependencies.length);
    if (blockingDevices.length) {
      setDialog({ type: "device-dependency", device: blockingDevices.map((item) => item.device).join("、"), dependencies: blockingDevices.flatMap((item) => item.dependencies) });
      return;
    }
    setDevices(value);
    setDialog(null);
    flash("监测设备关联已更新，数据 ID 候选已同步");
  }} />}
  {dialog?.type === "device-dependency" && <DependencyModal device={dialog.device} dependencies={dialog.dependencies} onClose={() => setDialog(null)} />}
  {dialog?.type === "remove-device" && <ConfirmModal title="移除监测设备" message={`确认移除“${dialog.device}”吗？`} detail="设备上的算法标注将不能继续参与新的配置绑定。" confirmText="确认移除" onCancel={() => setDialog(null)} onConfirm={() => {
    setDevices(devices.filter((item) => item !== dialog.device));
    markDirty();
    setDialog(null);
    flash("监测设备已移除");
  }} />}
  {dialog?.type === "reboot" && <ConfirmModal title="重启采集站" message={`确认立即重启 ${selected} 吗？`} detail="重启期间视频流和算法服务预计中断约 30 秒。" confirmText="立即重启" onCancel={() => setDialog(null)} onConfirm={() => {
    setDialog(null);
    if (!online) { flash("重启失败：采集站当前离线", "error"); return; }
    finishAction("reboot", "正在发送重启指令…", "重启指令已发送，采集站正在重新连接");
  }} />}
  {dialog?.type === "config-review" && <ConfigurationReviewModal online={online} dirty={dirty} dirtyEntries={dirtySectionDetails} settingsIssue={settingsIssue} algorithmIssue={algorithmIssue} deviceCount={devices.length} bindingCount={bindings.length} savedVersion={baselineProfile.version} runningVersion={baselineProfile.issuedVersion ?? baselineProfile.version} onCancel={() => setDialog(null)} onJump={jumpToSection} onSave={() => { setDialog(null); save(); }} onIssue={() => setDialog({ type: "issue" })} />}
  {dialog?.type === "issue" && <IssueModal station={selected} dirty={dirty} dirtyLabels={dirtySectionDetails.map((entry) => entry.label)} savedVersion={baselineProfile.version} runningVersion={baselineProfile.issuedVersion ?? baselineProfile.version} online={online} onCancel={() => setDialog(null)} onIssueDraft={issueDraftVersion} onIssueSaved={issueSavedVersion} />}
  {pendingStation && <StationSwitchModal currentStation={selectedStation} targetStation={stations.find(([code]) => code === pendingStation) || stations[0]} busy={busyAction?.type === "save"} onCancel={() => setPendingStation("")} onDiscard={() => {
    commitStation(pendingStation, false);
    setPendingStation("");
  }} onSave={() => {
    const target = pendingStation;
    const started = persist(() => { commitStation(target, false); setPendingStation(""); });
    if (!started) setPendingStation("");
  }} />}
  {busyAction && <div className="rh-command-status" role="status" aria-live="polite">
<IconLoader2 className="spin" size={17} />{busyAction.message}</div>}{toast && <div className={`rh-toast ${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>{toast.tone === "success" ? <IconCheck size={16} /> : toast.tone === "error" ? <IconAlertTriangle size={16} /> : <IconInfoCircle size={16} />}{toast.message}</div>}</div>;
}
export {
  RH830StationManagement,
  getCollectionStationCameraPoints
};
