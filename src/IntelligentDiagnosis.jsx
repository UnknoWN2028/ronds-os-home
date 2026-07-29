import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconArrowLeft,
  IconChartLine,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconExternalLink,
  IconFileExport,
  IconFiles,
  IconFilter,
  IconHistory,
  IconInfoCircle,
  IconListCheck,
  IconMapPin,
  IconMaximize,
  IconDownload,
  IconPaperclip,
  IconPhoto,
  IconPhotoOff,
  IconRefresh,
  IconRoute,
  IconSearch,
  IconSortAscending,
  IconSparkles,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import conveyorImage from "./assets/conveyor-belt.jpg";
import beltScratchEvidenceImage from "./assets/diagnosis-belt-scratch-evidence-v1.png";
import equipmentOverviewImage from "./assets/diagnosis-equipment-overview-v2.png";
import materialOffsetEvidenceImage from "./assets/diagnosis-material-offset-evidence-v2.png";
import { SmartAlarmView } from "./SmartAlarmView.jsx";
import { ThresholdAlarmView } from "./ThresholdAlarmView.jsx";
import { createOperationDefectId, LINKED_OPERATION, moduleHref, operationHref, operationStatusLabel, resolveOperation, resolveOperationByDiagnosisCase, routeParams, useOperations } from "./operations-context.jsx";
import "./intelligent-diagnosis.css";

const moduleTabs = [
  { id: "diagnosis", label: "智能诊断" },
  { id: "threshold", label: "门限报警" },
  { id: "alarm", label: "智能报警" },
];

const statusTabs = [
  { id: "pending", label: "待处理" },
  { id: "defect", label: "已成缺陷" },
  { id: "closed", label: "已关闭" },
];

const EVIDENCE_SUPPLEMENT_STORAGE_KEY = "ronds-intelligent-diagnosis-evidence-v1";
const DIAGNOSIS_LAYOUT_STORAGE_KEY = "ronds-intelligent-diagnosis-layout-v1";
const DIAGNOSIS_LAYOUT_BREAKPOINT = 1100;
const DIAGNOSIS_SPLITTER_WIDTH = 7;
const DIAGNOSIS_PANEL_KEYS = ["queue", "verification", "evidence"];
const DIAGNOSIS_PANEL_DEFAULT_RATIOS = { queue: 0.27, verification: 0.28, evidence: 0.45 };
const DIAGNOSIS_PANEL_MIN_WIDTHS = { queue: 285, verification: 320, evidence: 420 };
const DIAGNOSIS_PANEL_META = {
  queue: { label: "事件队列", panelId: "id-diagnosis-queue" },
  verification: { label: "证据核查", panelId: "id-diagnosis-verification" },
  evidence: { label: "现场证据", panelId: "id-diagnosis-evidence" },
};

function normalizePanelRatios(source = DIAGNOSIS_PANEL_DEFAULT_RATIOS) {
  const ratios = Object.fromEntries(DIAGNOSIS_PANEL_KEYS.map((key) => {
    const value = Number(source?.[key]);
    return [key, Number.isFinite(value) && value > 0 ? value : DIAGNOSIS_PANEL_DEFAULT_RATIOS[key]];
  }));
  const total = DIAGNOSIS_PANEL_KEYS.reduce((sum, key) => sum + ratios[key], 0);
  if (!Number.isFinite(total) || total <= 0) return { ...DIAGNOSIS_PANEL_DEFAULT_RATIOS };
  return Object.fromEntries(DIAGNOSIS_PANEL_KEYS.map((key) => [key, ratios[key] / total]));
}

function readDiagnosisLayout() {
  const fallback = {
    version: 1,
    ratios: { ...DIAGNOSIS_PANEL_DEFAULT_RATIOS },
    collapsed: { queue: false, verification: false, evidence: false },
  };
  if (typeof window === "undefined") return fallback;
  try {
    const stored = JSON.parse(window.localStorage.getItem(DIAGNOSIS_LAYOUT_STORAGE_KEY) || "null");
    if (!stored || stored.version !== 1) return fallback;
    const collapsed = Object.fromEntries(DIAGNOSIS_PANEL_KEYS.map((key) => [
      key,
      typeof stored.collapsed?.[key] === "boolean" ? stored.collapsed[key] : false,
    ]));
    if (DIAGNOSIS_PANEL_KEYS.every((key) => collapsed[key])) collapsed.evidence = false;
    return { version: 1, ratios: normalizePanelRatios(stored.ratios), collapsed };
  } catch {
    return fallback;
  }
}

function allocateDiagnosisPanelWidths(containerWidth, visibleKeys, ratios) {
  if (!visibleKeys.length || !Number.isFinite(containerWidth) || containerWidth <= 0) return {};
  const available = Math.max(0, containerWidth - DIAGNOSIS_SPLITTER_WIDTH * Math.max(0, visibleKeys.length - 1));
  const minimumTotal = visibleKeys.reduce((sum, key) => sum + DIAGNOSIS_PANEL_MIN_WIDTHS[key], 0);
  if (available <= minimumTotal) {
    const scale = minimumTotal ? available / minimumTotal : 1;
    return Object.fromEntries(visibleKeys.map((key) => [key, DIAGNOSIS_PANEL_MIN_WIDTHS[key] * scale]));
  }

  const widths = {};
  let remainingKeys = [...visibleKeys];
  let remainingWidth = available;
  while (remainingKeys.length) {
    const weightTotal = remainingKeys.reduce((sum, key) => sum + ratios[key], 0) || remainingKeys.length;
    const undersized = remainingKeys.filter((key) => {
      const weight = weightTotal ? ratios[key] / weightTotal : 1 / remainingKeys.length;
      return remainingWidth * weight < DIAGNOSIS_PANEL_MIN_WIDTHS[key];
    });
    if (!undersized.length) {
      remainingKeys.forEach((key) => {
        const weight = weightTotal ? ratios[key] / weightTotal : 1 / remainingKeys.length;
        widths[key] = remainingWidth * weight;
      });
      break;
    }
    undersized.forEach((key) => {
      widths[key] = DIAGNOSIS_PANEL_MIN_WIDTHS[key];
      remainingWidth -= widths[key];
    });
    remainingKeys = remainingKeys.filter((key) => !undersized.includes(key));
  }
  return widths;
}

function readEvidenceSupplements() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(EVIDENCE_SUPPLEMENT_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeEvidenceSupplement(caseId, resolution, record) {
  if (typeof window === "undefined") return;
  const current = readEvidenceSupplements();
  const previousRecords = Array.isArray(current[caseId]?.records) ? current[caseId].records : [];
  window.sessionStorage.setItem(EVIDENCE_SUPPLEMENT_STORAGE_KEY, JSON.stringify({
    ...current,
    [caseId]: {
      resolution,
      records: [...previousRecords, record],
    },
  }));
}

function trendTimesFor(stamp) {
  const latest = new Date(String(stamp).replace(" ", "T"));
  if (!Number.isFinite(latest.getTime())) return ["06-29 20:01", "07-03 10:18", "07-07 15:42", "07-10 09:36", "07-13 17:10"];
  const offsets = [14, 10, 6, 3, 0];
  const clocks = ["20:01", "10:18", "15:42", "09:36", String(stamp).slice(11, 16) || "17:10"];
  return offsets.map((offset, index) => {
    const date = new Date(latest.getTime() - offset * 24 * 60 * 60 * 1000);
    return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${clocks[index]}`;
  });
}

function makeEvidence(id, source, title, description, values, stamp = "2026-07-13 17:10", options = {}) {
  const isAlarmValue = (value) => options.kind === "numeric" ? Number(value) >= Number(options.threshold) : Boolean(value);
  const trendTimes = options.times || trendTimesFor(stamp);
  return {
    id,
    source,
    title,
    description,
    stamp,
    values,
    kind: options.kind || "status",
    unit: options.unit || "",
    threshold: options.threshold,
    range: options.range,
    points: values.map((value, index) => ({
      value,
      time: trendTimes[index],
      isAlarm: isAlarmValue(value),
      state: options.kind === "numeric"
        ? `${value}${options.unit || ""}${isAlarmValue(value) ? ` · ${description}` : ""}`
        : isAlarmValue(value) ? title.replace(/^.*?\//, "") : "运行正常",
      hasAttachment: options.attachments?.[index] ?? (isAlarmValue(value) || index === 1),
      attachmentCount: options.attachmentCounts?.[index] ?? (isAlarmValue(value) ? 2 : index === 1 ? 1 : 0),
    })),
  };
}

const initialCases = [
  {
    id: "belt-offset-head",
    linkedEventId: LINKED_OPERATION.id,
    stationCode: LINKED_OPERATION.stationCode,
    cameraId: LINKED_OPERATION.cameraId,
    module: "diagnosis",
    status: "pending",
    title: `${LINKED_OPERATION.location}-煤流状态监测/${LINKED_OPERATION.title}`,
    shortTitle: LINKED_OPERATION.title,
    level: 2,
    time: LINKED_OPERATION.time,
    probability: 99,
    device: LINKED_OPERATION.device,
    code: LINKED_OPERATION.deviceCode,
    duration: "2小时 08分钟",
    location: LINKED_OPERATION.location,
    faultPart: "煤流",
    faultType: "煤流偏载",
    conclusion: "图像识别到煤流持续偏离皮带中心线，近5次采样3次报警，最新偏移约18cm。",
    analysisPoint: "belt",
    analysisMetric: "alignment",
    runAdvice: "降低给料量并持续观察30分钟。",
    inspectionAction: "核查落料口与导料槽中心位置。",
    maintenanceAdvice: "检查托辊及皮带张紧状态。",
    advice: "建议降低给料量并持续观察，复核落料点、导料槽及皮带张紧状态。",
    evidences: [
      makeEvidence("material", "机头300米处-煤流状态监测", "图像中识别到煤流偏载，持续时间10秒", "煤流偏载", [0, 1, 0, 1, 0, 1, 0, 1], "2026-07-21 09:42:18", {
        times: ["07-07 09:42", "07-09 09:42", "07-11 09:42", "07-13 09:42", "07-15 09:42", "07-17 09:42", "07-19 09:42", "07-21 09:42"],
        attachments: [true, true, true, true, false, true, true, true],
        attachmentCounts: [1, 2, 1, 2, 0, 2, 1, 2],
        range: "2026-07-07 — 2026-07-28",
      }),
      makeEvidence("edge", "机头300米处-皮带边缘监测", "皮带边缘相对基准线向右偏移，连续出现3次", "皮带边缘偏移", [0, 0, 1, 0, 1, 1], "2026-07-21 09:42:18", {
        times: ["07-11 09:42", "07-13 09:42", "07-15 09:42", "07-17 09:42", "07-19 09:42", "07-21 09:42"],
        attachments: [true, false, true, true, true, true],
        attachmentCounts: [1, 0, 1, 1, 2, 2],
        range: "2026-07-07 — 2026-07-28",
      }),
    ],
  },
  {
    id: "belt-deviation",
    module: "diagnosis",
    status: "pending",
    title: "皮带跑偏",
    shortTitle: "皮带跑偏",
    level: 2,
    time: "2026-06-24 11:20:04",
    probability: 97,
    device: "2#主运皮带机",
    code: "PD-02-1204",
    duration: "26天 5小时 21分钟",
    conclusion: "皮带运行中心线出现持续偏移，跑偏幅度已超过二级预警阈值。",
    location: "2#主运皮带机",
    faultPart: "皮带",
    faultType: "跑偏",
    analysisPoint: "belt",
    analysisMetric: "deviation",
    parameterCompleteness: {
      module: "皮带跑偏",
      configuredCount: 1,
      totalCount: 1,
      configuredParameters: ["皮带非展平宽度"],
      missingParameters: [],
    },
    advice: "建议检查头尾滚筒中心线及托辊组安装状态，排查粘料和局部受力不均。",
    evidences: [makeEvidence("deviation", "2#主运皮带机-跑偏监测", "视觉算法识别到皮带向左跑偏，持续时间8秒", "皮带跑偏", [0, 1, 0, 1, 1], "2026-06-24 11:20")],
  },
  {
    id: "bearing-hot-a",
    module: "diagnosis",
    status: "pending",
    title: "通用发热2/最高温超限",
    shortTitle: "最高温超限",
    level: 2,
    time: "2026-06-23 14:08:40",
    probability: 90,
    device: "破碎机减速箱",
    code: "TEMP-GX-02",
    duration: "27天 2小时 32分钟",
    conclusion: "设备表面最高温度多次超过预警线，温升趋势与负荷变化相关。",
    advice: "建议检查润滑油位与冷却风道，并在下次停机窗口复核轴承间隙。",
    evidences: [makeEvidence("thermal", "减速箱-红外温度监测", "最高温度达到82.4℃，连续超限6分钟", "温度超限", [64.2, 68.7, 76.8, 82.4, 79.5], "2026-06-23 14:08", { kind: "numeric", unit: "℃", threshold: 75 })],
  },
  {
    id: "bearing-hot-b",
    module: "diagnosis",
    status: "pending",
    title: "通用发热/最高温超限",
    shortTitle: "温度异常",
    level: 2,
    time: "2026-06-23 14:08:40",
    probability: 90,
    device: "1#驱动滚筒",
    code: "TEMP-GT-01",
    duration: "27天 2小时 32分钟",
    conclusion: "驱动滚筒轴承座温度缓慢抬升，当前处于二级预警区间。",
    advice: "建议清理测温区域并复测，检查润滑与滚筒负荷分配。",
    evidences: [makeEvidence("thermal", "1#驱动滚筒-温度监测", "轴承座温度持续高于72℃", "温度预警", [65.8, 73.2, 76.4, 70.1, 78.6], "2026-06-23 14:08", { kind: "numeric", unit: "℃", threshold: 72 })],
  },
  {
    id: "hammer-damage",
    module: "diagnosis",
    status: "pending",
    title: "重锤处-皮带状态监测/皮带损伤",
    shortTitle: "皮带损伤",
    level: 4,
    time: "2026-07-08 10:21:42",
    probability: 84,
    device: "重锤张紧装置",
    code: "CV-HM-08",
    duration: "12天 6小时 19分钟",
    conclusion: "重锤区域皮带表面存在疑似划伤，缺陷边缘清晰且长度增加。",
    criticalEvidenceGap: {
      id: "damage-depth",
      label: "损伤深度与贯穿状态",
      value: "未上报",
      detail: "缺少损伤深度与是否贯穿的证据，暂不能判断缺陷等级",
      unit: "mm",
    },
    advice: "建议安排现场确认损伤深度，必要时降载运行并准备皮带修补材料。",
    evidences: [makeEvidence("damage", "重锤处-皮带状态监测", "皮带表面识别到长条形损伤，长度约320毫米", "皮带损伤", [0, 1, 1, 1, 1], "2026-07-08 10:21")],
  },
  {
    id: "edge-tear",
    module: "diagnosis",
    status: "pending",
    title: "重锤处-皮带状态监测/皮带边缘撕裂",
    shortTitle: "边缘撕裂",
    level: 2,
    time: "2026-07-07 15:12:32",
    probability: 64,
    device: "重锤张紧装置",
    code: "CV-HM-07",
    duration: "13天 2小时 08分钟",
    conclusion: "皮带边缘出现不连续缺口，当前模型置信度一般，需结合现场复核。",
    faultPart: "皮带边缘",
    faultType: "撕裂",
    analysisPoint: "belt",
    analysisMetric: "deviation",
    parameterCompleteness: {
      module: "皮带边缘撕裂",
      configuredCount: 0,
      totalCount: 1,
      configuredParameters: [],
      missingParameters: ["展平宽度"],
    },
    advice: "建议清洁镜头后重新采样，并检查皮带边缘及邻近托辊是否存在刮碰。",
    evidences: [makeEvidence("tear", "重锤处-皮带边缘监测", "边缘检测发现不规则缺口，持续时间4秒", "边缘撕裂", [0, 0, 1, 0, 1], "2026-07-07 15:12")],
  },
  {
    id: "roller-missing-11l",
    module: "diagnosis",
    status: "pending",
    groupKey: "roller-missing",
    groupName: "托辊缺辊",
    groupFaultPart: "托辊",
    title: "11#左托辊/托辊缺辊",
    shortTitle: "托辊缺辊",
    location: "11#左托辊",
    locationDescription: "机身中段11#左侧",
    faultPart: "11#左托辊",
    faultType: "缺辊",
    level: 4,
    time: "2026-07-20 13:06:12",
    probability: 96,
    device: "310A皮带",
    code: "ROLLER-11-L",
    measurementPoint: "11#左托辊视觉测点",
    duration: "4小时 43分钟",
    conclusion: "11#左托辊缺失，皮带局部支撑不足，存在进一步磨损风险。",
    advice: "建议降低载荷并尽快补装缺失托辊。",
    evidences: [makeEvidence("roller-11", "11#左托辊视觉测点", "图像识别到左侧托辊缺失，连续3次报警", "托辊缺辊", [0, 0, 1, 1, 1], "2026-07-20 13:06")],
  },
  {
    id: "roller-missing-12l",
    module: "diagnosis",
    status: "pending",
    groupKey: "roller-missing",
    groupName: "托辊缺辊",
    groupFaultPart: "托辊",
    title: "12#左托辊/托辊缺辊",
    shortTitle: "托辊缺辊",
    location: "12#左托辊",
    locationDescription: "机身中段12#左侧",
    faultPart: "12#左托辊",
    faultType: "缺辊",
    level: 3,
    time: "2026-07-20 12:58:44",
    probability: 91,
    device: "310A皮带",
    code: "ROLLER-12-L",
    measurementPoint: "12#左托辊视觉测点",
    duration: "4小时 51分钟",
    conclusion: "12#左托辊缺失，与相邻位置形成连续支撑空档。",
    advice: "建议与11#左托辊合并安排停机更换。",
    evidences: [makeEvidence("roller-12", "12#左托辊视觉测点", "图像识别到左侧托辊缺失，连续2次报警", "托辊缺辊", [0, 1, 0, 1, 1], "2026-07-20 12:58")],
  },
  {
    id: "roller-missing-17r",
    module: "diagnosis",
    status: "pending",
    groupKey: "roller-missing",
    groupName: "托辊缺辊",
    groupFaultPart: "托辊",
    title: "17#右托辊/托辊缺辊",
    shortTitle: "托辊缺辊",
    location: "17#右托辊",
    locationDescription: "机身中段17#右侧",
    faultPart: "17#右托辊",
    faultType: "缺辊",
    level: 2,
    time: "2026-07-20 12:41:09",
    probability: 88,
    device: "310A皮带",
    code: "ROLLER-17-R",
    measurementPoint: "17#右托辊视觉测点",
    duration: "5小时 08分钟",
    conclusion: "17#右托辊缺失，当前皮带运行姿态尚稳定。",
    advice: "建议列入本班次巡检并准备备件。",
    evidences: [makeEvidence("roller-17", "17#右托辊视觉测点", "图像识别到右侧托辊缺失", "托辊缺辊", [0, 0, 0, 1, 1], "2026-07-20 12:41")],
  },
  {
    id: "roller-missing-18r",
    module: "diagnosis",
    status: "pending",
    groupKey: "roller-missing",
    groupName: "托辊缺辊",
    groupFaultPart: "托辊",
    title: "18#右托辊/托辊缺辊",
    shortTitle: "托辊缺辊",
    location: "18#右托辊",
    locationDescription: "机身中段18#右侧",
    faultPart: "18#右托辊",
    faultType: "缺辊",
    level: 2,
    time: "2026-07-20 11:55:36",
    probability: 82,
    device: "310A皮带",
    code: "ROLLER-18-R",
    measurementPoint: "18#右托辊视觉测点",
    duration: "5小时 54分钟",
    conclusion: "18#右托辊疑似缺失，建议结合现场确认。",
    advice: "建议清洁镜头并核实托辊安装状态。",
    evidences: [makeEvidence("roller-18", "18#右托辊视觉测点", "图像识别到右侧托辊疑似缺失", "托辊缺辊", [0, 0, 1, 0, 1], "2026-07-20 11:55")],
  },
  {
    id: "roller-stuck-13r",
    module: "diagnosis",
    status: "pending",
    groupKey: "roller-stuck",
    groupName: "托辊死辊",
    groupFaultPart: "托辊",
    title: "13#右托辊/托辊死辊",
    shortTitle: "托辊死辊",
    location: "13#右托辊",
    faultPart: "13#右托辊",
    faultType: "死辊",
    level: 3,
    time: "2026-07-19 16:32:18",
    probability: 89,
    device: "310A皮带",
    code: "ROLLER-13-R",
    measurementPoint: "13#右托辊声学测点",
    duration: "1天 1小时 17分钟",
    conclusion: "13#右托辊转动特征消失，疑似卡滞。",
    advice: "建议现场测温并确认转动状态，必要时更换托辊。",
    evidences: [makeEvidence("roller-stuck", "13#右托辊声学测点", "转动声纹能量持续低于正常范围", "托辊死辊", [0, 1, 1, 1, 1], "2026-07-19 16:32")],
  },
  {
    id: "tail-tear",
    module: "diagnosis",
    status: "closed",
    title: "机尾20米处-皮带纵撕监测状态/皮带纵向撕裂",
    shortTitle: "纵向撕裂",
    level: 4,
    time: "2026-04-16 13:31:10",
    probability: 80,
    device: "机尾纵撕监测",
    code: "CV-TAIL-20",
    duration: "已关闭",
    conclusion: "历史图像曾识别到纵向裂纹，经现场核验为皮带表面水迹干扰。",
    faultPart: "皮带",
    faultType: "纵向撕裂",
    analysisPoint: "belt",
    analysisMetric: "deviation",
    parameterCompleteness: {
      module: "纵向撕裂",
      configuredCount: 1,
      totalCount: 1,
      configuredParameters: ["皮带机总长度（单向）"],
      missingParameters: [],
    },
    advice: "该事件已关闭，建议保持镜头清洁并继续观察同一区域。",
    closeReason: "现场核验为水迹反光，未发现实体裂纹。",
    evidences: [makeEvidence("long-tear", "机尾20米处-纵撕监测", "历史图像识别到纵向疑似裂纹", "疑似纵撕", [0, 1, 0, 0, 0], "2026-04-16 13:31")],
  },
  {
    id: "intrusion-east",
    module: "diagnosis",
    status: "pending",
    title: "2号转运站东侧入口-人员监测/非授权人员闯入",
    shortTitle: "非授权人员闯入",
    level: 1,
    time: "2026-07-20 14:29:56",
    probability: 98,
    device: "2号转运站",
    code: "CAM-ENTRY-01",
    duration: "8分钟",
    location: "东侧入口",
    faultPart: "东侧入口",
    faultType: "人员闯入",
    conclusion: "视频识别到非授权人员进入东侧入口警戒区域，目标持续停留约12秒。",
    advice: "建议值班员立即复核实时画面并联系现场安保确认人员身份。",
    evidences: [makeEvidence("intrusion", "东侧入口-人员闯入监测", "警戒区域内识别到人员目标", "人员闯入", [0, 0, 1, 1, 1], "2026-07-20 14:29")],
  },
  {
    id: "belt-deviation-100",
    module: "diagnosis",
    status: "pending",
    title: "100m转弯处-皮带状态监测/皮带跑偏",
    shortTitle: "100m转弯处皮带跑偏",
    level: 3,
    time: "2026-07-18 19:51:22",
    probability: 96,
    device: "310B输煤皮带机",
    code: "VD-BELT-100",
    duration: "持续待复核",
    location: "100m转弯处",
    faultPart: "皮带本体",
    faultType: "皮带跑偏",
    conclusion: "100m转弯处视觉测点连续识别到皮带中心线偏移，最新状态达到3级报警。",
    analysisPoint: "100",
    analysisMetric: "deviation",
    parameterCompleteness: {
      module: "皮带跑偏",
      configuredCount: 1,
      totalCount: 1,
      configuredParameters: ["皮带非展平宽度"],
      missingParameters: [],
    },
    runAdvice: "降低带速并持续观察跑偏变化。",
    inspectionAction: "复核100m转弯处托辊组、滚筒中心线和粘料情况。",
    maintenanceAdvice: "根据复核结果调整托辊组并清理局部积料。",
    advice: "建议立即复核对应视频画面，检查转弯段托辊与皮带张紧状态。",
    evidences: [makeEvidence("deviation-100", "100m转弯处皮带状态", "视觉算法识别到皮带跑偏达到3级", "皮带跑偏", [1, 2, 1, 3, 3], "2026-07-18 19:51", { kind: "numeric", unit: "级", threshold: 3 })],
  },
  {
    id: "helmet-100",
    module: "diagnosis",
    status: "pending",
    title: "100m转弯处-人员安全监测/未佩戴安全帽",
    shortTitle: "未佩戴安全帽",
    level: 2,
    time: "2026-07-18 18:45:06",
    probability: 95,
    device: "310B输煤皮带机",
    code: "VD-BELT-100",
    duration: "持续待复核",
    location: "100m转弯处",
    faultPart: "作业人员",
    faultType: "未佩戴安全帽",
    conclusion: "100m转弯处视觉画面识别到作业人员未佩戴安全帽，需要复核现场画面。",
    analysisPoint: "100",
    analysisMetric: "helmet",
    runAdvice: "保持设备运行状态并立即通知现场人员离开危险区域。",
    inspectionAction: "核对人员身份、作业许可和安全帽佩戴情况。",
    maintenanceAdvice: "无需设备检修，建议加强该区域人员安全巡检。",
    advice: "建议立即复核对应视频画面并通知现场人员规范佩戴安全帽。",
    evidences: [makeEvidence("helmet-100", "100m转弯处人员安全监测", "视觉算法识别到人员未佩戴安全帽", "未佩戴安全帽", [0, 1, 0, 0, 1], "2026-07-18 18:45")],
  },
  {
    id: "material-alignment-97",
    module: "diagnosis",
    status: "pending",
    title: "机头落料段-煤流状态监测/煤流不对中",
    shortTitle: "煤流不对中",
    level: 2,
    time: "2026-07-20 14:27:41",
    probability: 94,
    device: "310A输煤皮带机",
    code: "CAM-COALFLOW-01",
    duration: "10分钟",
    location: "机头落料段",
    faultPart: "煤流",
    faultType: "煤流不对中",
    conclusion: "煤流中心持续偏离皮带中心线，最新偏移量超过当前算法阈值。",
    advice: "建议检查落料方向和导料槽位置，并观察相邻采样是否恢复。",
    evidences: [makeEvidence("alignment-97", "机头落料段-煤流状态监测", "煤流轮廓偏离皮带中心", "煤流不对中", [0, 1, 0, 1, 1], "2026-07-20 14:27")],
  },
  {
    id: "corridor-smoke",
    module: "diagnosis",
    status: "closed",
    title: "1号输煤廊道-烟火监测/输煤廊道烟火识别",
    shortTitle: "输煤廊道烟火识别",
    level: 4,
    time: "2026-07-20 14:18:48",
    probability: 87,
    device: "1号输煤廊道",
    code: "CAM-SMOKE-01",
    duration: "已关闭",
    location: "中段顶部",
    faultPart: "廊道环境",
    faultType: "烟雾火情",
    conclusion: "画面中短时出现烟雾特征，现场复核未发现明火或持续烟源。",
    advice: "保持消防巡检并持续关注同一区域。",
    closeReason: "现场复核无明火，已恢复正常巡检。",
    evidences: [makeEvidence("smoke", "1号输煤廊道-烟火监测", "识别到局部烟雾特征", "疑似火情", [0, 0, 1, 0, 0], "2026-07-20 14:18")],
  },
  {
    id: "drum-surface-98",
    module: "diagnosis",
    status: "closed",
    title: "驱动滚筒-表面监测/滚筒表面异常",
    shortTitle: "滚筒表面异常",
    level: 3,
    time: "2026-07-20 14:08:25",
    probability: 91,
    device: "310A输煤皮带机",
    code: "CAM-08300098",
    duration: "已关闭",
    location: "驱动滚筒",
    faultPart: "驱动滚筒",
    faultType: "表面异常",
    conclusion: "滚筒表面检测到不规则附着物，经清理后复核恢复正常。",
    advice: "建议关注清扫器状态并定期检查滚筒粘料。",
    closeReason: "清理滚筒表面粘料后复核正常。",
    evidences: [makeEvidence("drum", "驱动滚筒-表面监测", "识别到滚筒表面局部附着", "表面异常", [0, 1, 1, 0, 0], "2026-07-20 14:08")],
  },
  {
    id: "roller-noise-corridor",
    module: "diagnosis",
    status: "defect",
    title: "1号廊道托辊组/托辊异响",
    shortTitle: "托辊异响",
    level: 2,
    time: "2026-07-20 14:02:32",
    probability: 93,
    device: "1号廊道",
    code: "AU-ROLLER-011",
    duration: "已成缺陷",
    location: "托辊组",
    faultPart: "托辊组",
    faultType: "异响",
    conclusion: "托辊声学能量连续超过正常基线，异响特征在多个采样中重复出现。",
    advice: "建议现场定位异响托辊并安排测温、停机检查。",
    evidences: [makeEvidence("roller-noise", "1号廊道托辊声学测点", "分贝和冲击声纹持续异常", "托辊异响", [42, 61, 74, 78, 76], "2026-07-20 14:02", { kind: "numeric", unit: "dB", threshold: 70 })],
  },
  {
    id: "threshold-temperature",
    module: "threshold",
    status: "pending",
    title: "驱动端轴承温度超过门限",
    shortTitle: "温度门限报警",
    level: 3,
    time: "2026-07-20 09:42:16",
    probability: 100,
    device: "主驱动电机",
    code: "MOTOR-01-DE",
    duration: "8小时 13分钟",
    conclusion: "驱动端温度连续超过75℃门限，峰值达到81.6℃。",
    advice: "建议核对负载与冷却条件，安排测温复核并检查轴承润滑。",
    evidences: [makeEvidence("temperature", "主驱动电机-驱动端温度", "温度值连续6次超过75℃门限", "温度超限", [62.6, 69.4, 75.8, 81.6, 78.2], "2026-07-20 09:42", { kind: "numeric", unit: "℃", threshold: 75 })],
  },
  {
    id: "smart-alarm-foreign-object",
    module: "alarm",
    status: "pending",
    title: "落料口异物智能报警",
    algorithmTitle: "落料口异物智能报警",
    shortTitle: "异物报警",
    level: 3,
    time: "2026-07-20 10:06:38",
    probability: 93,
    device: "落料口智能摄像机",
    code: "CAM-CHUTE-03",
    duration: "7小时 49分钟",
    conclusion: "落料口区域出现不明大块物体，存在堵料风险。",
    advice: "建议调取实时画面核验，必要时暂停上游给料并清理异物。",
    evidences: [makeEvidence("foreign", "落料口-异物识别", "目标区域识别到大块异物，连续存在12秒", "异物出现", [0, 0, 0, 1, 1], "2026-07-20 10:06")],
  },
].map((item) => {
  const operation = resolveOperationByDiagnosisCase(item.id);
  const isEnvironment = item.shortTitle.includes("温") || item.shortTitle.includes("发热");
  const isRoller = item.groupKey?.startsWith("roller");
  const baseAdvice = item.advice || "建议结合现场状态进行复核。";
  return {
    location: item.location || item.locationDescription || item.title.split("/")[0],
    locationDescription: item.locationDescription || item.title.split("/")[0],
    faultPart: item.faultPart || item.device,
    faultType: item.faultType || item.shortTitle,
    measurementPoint: item.measurementPoint || item.evidences[0]?.source || item.code,
    devicePath: item.devicePath || `SC / 生产一部 / 皮带运输系统 / ${item.device}`,
    category: item.category || (isRoller ? "roller" : "audio-video"),
    analysisPoint: item.analysisPoint || (isRoller ? "upper-roller" : "belt"),
    analysisMetric: item.analysisMetric || (isRoller ? "alignment" : "deviation"),
    runAdvice: item.runAdvice || (isEnvironment ? "保持当前负荷并持续观察温升变化。" : baseAdvice),
    inspectionAction: item.inspectionAction || (isEnvironment ? "检查散热、润滑及环境温度。" : "复核现场画面、设备状态和相邻部件。"),
    maintenanceAdvice: item.maintenanceAdvice || baseAdvice,
    treatmentRecords: item.treatmentRecords || (item.closeReason ? [{ action: "关闭", operator: "超级管理员", time: "2026-07-20 09:18:32", note: item.closeReason }] : []),
    ...item,
    ...(operation ? {
      linkedEventId: operation.id,
      stationCode: operation.stationCode,
      cameraId: operation.cameraId,
      status: operation.initialStatus || item.status,
      time: operation.time,
      shortTitle: operation.title,
      device: operation.device,
      code: operation.deviceCode,
      location: operation.location,
      locationDescription: operation.location,
      devicePath: operation.devicePath,
      analysisPoint: operation.analysisPoint,
      analysisMetric: operation.analysisMetric,
    } : {}),
  };
});

function levelClass(level) {
  if (level >= 4) return "critical";
  if (level === 3) return "major";
  return "warning";
}

const rollerGroupIdentity = (item) => `${item.device}::${item.groupKey}`;

const uniqueValues = (items) => [...new Set(items.filter((value) => String(value || "").trim()).map((value) => String(value).trim()))];

const joinMappedValues = (events, key, separator = "、") => uniqueValues(events.map((item) => item[key])).join(separator);

const joinReportValues = (events, key) => events
  .filter((item) => String(item[key] || "").trim())
  .map((item) => events.length > 1 ? `${item.location || item.code}：${item[key]}` : item[key])
  .join("\n");

function createDefectDraft(events) {
  const first = events[0];
  const batchName = first?.groupName || joinMappedValues(events, "faultType") || "智能诊断缺陷";
  const firstEvidence = first?.evidences?.[0];
  const phenomenon = events
    .map((item) => item.evidences?.[0]?.title ? (events.length > 1 ? `${item.location}：${item.evidences[0].title}` : item.evidences[0].title) : "")
    .filter(Boolean)
    .join("；");
  const combinedMaintenanceAdvice = uniqueValues([first?.runAdvice, first?.maintenanceAdvice]).join("\n");
  return {
    name: events.length > 1 ? batchName : `${first.faultPart}${first.faultType}`,
    device: first.device,
    devicePath: first.devicePath,
    faultPart: events.length > 1 ? (first.groupFaultPart || first.faultPart) : first.faultPart,
    faultType: first.faultType,
    locationDescription: joinMappedValues(events, "locationDescription", "；"),
    measurementPoint: joinMappedValues(events, "measurementPoint", "；"),
    defectLevel: "",
    description: phenomenon || firstEvidence?.description || "",
    conclusion: first.conclusion,
    maintenanceAdvice: combinedMaintenanceAdvice,
    note: events.length > 1 ? `本缺陷由${events.length}条同类待处理报警合并生成，原始证据分别保留。` : "本缺陷由智能诊断结果生成，建议结合现场复核后完善处置计划。",
  };
}

function formatTreatmentTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function mergeLinkedTreatmentRecords(records = [], linkedEvent, eventId) {
  const recordId = `operation-sync-${eventId}`;
  const base = records.filter((record) => record.id !== recordId);
  if (!linkedEvent || linkedEvent.status === "pending") return base;
  const syncedRecord = {
    id: recordId,
    action: linkedEvent.status === "defect" ? "生成缺陷" : "关闭",
    operator: "超级管理员",
    time: linkedEvent.updatedAt ? linkedEvent.updatedAt.slice(0, 19).replace("T", " ") : formatTreatmentTime(),
    note: linkedEvent.actionNote,
    defectNo: linkedEvent.defectId,
    scope: linkedEvent.source === "intelligent-diagnosis" ? "智能诊断处置" : "跨模块同步",
  };
  const equivalentExists = base.some((record) => record.action === syncedRecord.action
    && record.note === syncedRecord.note
    && (syncedRecord.action !== "生成缺陷" || record.defectNo === syncedRecord.defectNo));
  return equivalentExists ? base : [...base, syncedRecord];
}

function CaseCard({ item, selected, onSelect }) {
  const title = item.algorithmTitle || (item.location && item.location !== item.faultType ? `${item.location} · ${item.faultType}` : item.title);
  return (
    <button
      className={`id-case-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(item.id)}
      aria-pressed={selected}
    >
      <span className="id-case-title" title={title}>{title}</span>
      <span className="id-case-meta">
        <span className={`id-level id-level-${levelClass(item.level)}`}>{item.level}级1</span>
        <span className="id-meta-divider" aria-hidden="true" />
        <time>{item.time}</time>
        <span className="id-meta-divider" aria-hidden="true" />
        <span className="id-probability-mini"><i aria-hidden="true" />{item.probability}%</span>
      </span>
      {selected && <IconChevronRight className="id-case-arrow" size={20} aria-hidden="true" />}
    </button>
  );
}

function GroupCard({ group, onOpen }) {
  const locations = group.children.map((item) => item.location).join("、");
  const latestEvent = group.latestEvent || [...group.children].sort((a, b) => b.time.localeCompare(a.time))[0];
  return (
    <button className="id-case-card id-group-card" onClick={() => onOpen(group.key)} aria-label={`查看${group.name}分组，共${group.children.length}条报警`}>
      <span className="id-case-title"><IconFiles size={17} aria-hidden="true" />{group.name}<em>{group.children.length}条</em></span>
      <span className="id-group-locations" title={locations}>{locations}</span>
      <span className="id-case-meta">
        <span className={`id-level id-level-${levelClass(latestEvent.level)}`}>{latestEvent.level}级1</span>
        <span className="id-meta-divider" aria-hidden="true" />
        <time>{group.latestTime}</time>
      </span>
      <IconChevronRight className="id-case-arrow" size={20} aria-hidden="true" />
    </button>
  );
}

function TreatmentRecords({ records }) {
  return (
    <section className="id-treatment-records" aria-labelledby="id-treatment-title">
      <h2 id="id-treatment-title"><IconHistory size={17} />处理记录</h2>
      {records?.length ? <ol>
        {[...records].reverse().map((record, index) => (
          <li
            key={record.id || `${record.time}-${record.action}-${index}`}
            data-qa="treatment-record"
            data-action={record.action === "补充关键证据" || record.action === "更新关键证据" ? "evidence-supplement" : undefined}
          >
            <i aria-hidden="true" />
            <div><strong>{record.action}</strong>{record.scope && <span>{record.scope}</span>}<span>{record.operator}</span><time>{record.time}</time></div>
            {record.defectNo && <a className="id-treatment-code" href="#defect-detail" onClick={(event) => event.preventDefault()}>缺陷编号：{record.defectNo}</a>}
            {record.note && <p>{record.note}</p>}
          </li>
        ))}
      </ol> : <div className="id-treatment-empty"><IconHistory size={26} /><span>暂无处理记录</span><small>补充证据、生成缺陷或关闭后，系统将在此记录处理人、时间和结果</small></div>}
    </section>
  );
}

function getDefaultPointIndex(evidence) {
  if (!evidence?.points?.length) return 0;
  for (let index = evidence.points.length - 1; index >= 0; index -= 1) {
    if (evidence.points[index].isAlarm) return index;
  }
  return evidence.points.length - 1;
}

function evidenceRange(evidence) {
  if (evidence?.range) return evidence.range;
  const year = Number(String(evidence?.stamp || "").slice(0, 4)) || 2026;
  const alarmPoints = evidence?.points?.filter((point) => point.isAlarm) || [];
  const parsePoint = (point) => {
    const match = String(point?.time || "").match(/(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(year, Number(match[1]) - 1, Number(match[2]), Number(match[3]), Number(match[4]));
  };
  const first = parsePoint(alarmPoints[0]);
  const latest = parsePoint(alarmPoints.at(-1));
  if (!first || !latest) return "首个报警点前2周 — 最新报警点后1周";
  const start = new Date(first.getTime() - 14 * 24 * 60 * 60 * 1000);
  const end = new Date(latest.getTime() + 7 * 24 * 60 * 60 * 1000);
  const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${format(start)} — ${format(end)}`;
}

function analysisHref(item) {
  if (item.category !== "roller" && item.linkedEventId) {
    return operationHref("/audio-video-analysis", item.linkedEventId, {
      point: item.analysisPoint,
      metric: item.analysisMetric,
    });
  }
  const params = item.category === "roller"
    ? new URLSearchParams({
      device: item.device,
      location: item.location,
      metric: item.faultType,
      alarmTime: item.time.replace(" ", "T"),
      days: "15",
      queryMode: "abnormal-roller",
    })
    : new URLSearchParams({
      point: item.analysisPoint,
      metric: item.analysisMetric,
      alarmTime: item.time.replace(" ", "T"),
      days: "15",
    });
  const path = `${item.category === "roller" ? "/roller-group-analysis" : "/audio-video-analysis"}?${params.toString()}`;
  const base = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
  return base ? `${base}/#${path}` : path;
}

function OverviewCard({ item, onOpenEvidence }) {
  return (
    <section className="id-overview-card" aria-label="故障位置总貌图">
      <header><span>设备概览</span><small>故障位置与测点分布</small></header>
      <div className="id-overview-stage">
        <img src={equipmentOverviewImage} alt={`${item.device}设备总貌`} />
        <span className="id-overview-end-label">机尾</span>
        <button className={`id-overview-marker level-${item.level}`} onClick={onOpenEvidence} title={`${item.location} · ${item.faultType} · ${item.level}级1`}>
          <IconMapPin size={18} /><span>{item.location}</span>
        </button>
        <span className="id-overview-point">测点A-106</span>
      </div>
    </section>
  );
}

function longestAlarmRun(points = []) {
  let longest = 0;
  let current = 0;
  points.forEach((point) => {
    current = point.isAlarm ? current + 1 : 0;
    longest = Math.max(longest, current);
  });
  return longest;
}

function getKeyEvidence(item, evidence) {
  const latestAlarmPoint = [...(evidence?.points || [])].reverse().find((point) => point.isAlarm) || evidence?.points?.at(-1);
  const alarmCount = evidence?.points?.filter((point) => point.isAlarm).length || 0;
  const sampleCount = evidence?.points?.length || 0;
  const consecutiveCount = longestAlarmRun(evidence?.points);
  const facts = [
    {
      id: "location",
      label: "异常位置",
      value: item?.location || "未定位",
      available: Boolean(item?.location),
      icon: IconMapPin,
    },
    {
      id: "detection",
      label: "识别结果",
      value: evidence?.title || "算法未上报识别结果",
      available: Boolean(evidence?.title),
      icon: IconListCheck,
      inspectable: true,
    },
    {
      id: "trend",
      label: "趋势连续性",
      value: alarmCount
        ? `${alarmCount}/${sampleCount} 个采样异常${consecutiveCount > 1 ? ` · 连续${consecutiveCount}次` : ""}`
        : "未形成异常趋势",
      available: alarmCount > 0,
      icon: IconChartLine,
      inspectable: true,
    },
    {
      id: "attachment",
      label: "媒体佐证",
      value: latestAlarmPoint?.hasAttachment ? `最新报警点 ${latestAlarmPoint.attachmentCount} 项附件` : "最新报警点未上传附件",
      available: Boolean(latestAlarmPoint?.hasAttachment),
      icon: IconPhoto,
      inspectable: true,
    },
  ];
  if (item?.criticalEvidenceResolution) {
    facts.push({
      id: item.criticalEvidenceGap?.id || "critical-resolution",
      ...item.criticalEvidenceResolution,
      available: true,
      critical: true,
      resolved: true,
      supplementable: item.status === "pending",
      icon: IconCheck,
    });
  } else if (item?.criticalEvidenceGap) {
    facts.push({
      id: item.criticalEvidenceGap.id || "critical-gap",
      ...item.criticalEvidenceGap,
      available: false,
      critical: true,
      supplementable: item.status === "pending",
      icon: IconAlertTriangle,
    });
  }
  return { facts, latestAlarmPoint };
}

function getVerificationSummary(item, evidence) {
  const { facts, latestAlarmPoint } = getKeyEvidence(item, evidence);
  const parameterPercent = item?.parameterCompleteness?.totalCount
    ? Math.round((item.parameterCompleteness.configuredCount / item.parameterCompleteness.totalCount) * 100)
    : null;
  const missingFacts = facts.filter((fact) => !fact.available);
  const criticalGaps = missingFacts.filter((fact) => fact.critical);
  const parameterIncomplete = parameterPercent !== null && parameterPercent < 100;
  let confidenceLabel = "高可信";
  let confidenceTone = "high";
  if (missingFacts.length) {
    confidenceLabel = criticalGaps.length ? "证据不足" : "待补证";
    confidenceTone = "insufficient";
  } else if (parameterIncomplete) {
    confidenceLabel = "待补参数";
    confidenceTone = "review";
  } else if (item.probability < 75) {
    confidenceLabel = "待复核";
    confidenceTone = "review";
  } else if (item.probability < 90) {
    confidenceLabel = "中可信";
    confidenceTone = "medium";
  }
  return {
    facts,
    verifiedCount: facts.filter((fact) => fact.available).length,
    totalCount: facts.length,
    missingCount: missingFacts.length,
    criticalGapCount: criticalGaps.length,
    hasCriticalGap: criticalGaps.length > 0,
    latestAlarmPoint,
    parameterPercent,
    confidenceLabel,
    confidenceTone,
  };
}

function hasCriticalEvidenceGap(item) {
  return Boolean(item?.criticalEvidenceGap && !item?.criticalEvidenceResolution);
}

function VerificationSummary({ item, evidence }) {
  const summary = getVerificationSummary(item, evidence);
  const ConfidenceIcon = summary.confidenceTone === "high" ? IconCheck : summary.confidenceTone === "insufficient" ? IconAlertTriangle : IconInfoCircle;
  return (
    <section className="id-verification-summary" aria-label="诊断可信度核验摘要">
      <p>{item.conclusion}</p>
      <div>
        <span className={`id-confidence-level tone-${summary.confidenceTone}`}><ConfidenceIcon size={15} />{summary.confidenceLabel}</span>
        <span>模型匹配 <strong>{item.probability}%</strong><button type="button" className="id-probability-info" aria-label="概率说明"><IconInfoCircle size={14} /><span role="tooltip">基于数据特征，计算出与典型故障模式的匹配概率</span></button></span>
        <span>证据 <strong>{summary.verifiedCount}/{summary.totalCount}</strong></span>
        <span>{summary.parameterPercent === null ? "参数状态" : "参数完备"} <strong>{summary.parameterPercent === null ? "不适用" : `${summary.parameterPercent}%`}</strong></span>
      </div>
    </section>
  );
}

function KeyEvidencePanel({ item, evidence, onSelectEvidence, onSupplementEvidence }) {
  const summary = getVerificationSummary(item, evidence);
  return (
    <section className={`id-key-evidence ${summary.hasCriticalGap ? "has-critical-gap" : ""}`} aria-label="关键证据">
      <header>
        <div><strong>关键证据</strong><small>支撑诊断结论的事实</small></div>
        <span>{summary.missingCount ? `缺少 ${summary.missingCount} 项关键证据` : `已核验 ${summary.verifiedCount}/${summary.totalCount}`}</span>
      </header>
      <div className="id-key-evidence-grid">
        {summary.facts.map((fact) => {
          const Icon = fact.icon;
          const actionable = fact.inspectable || fact.supplementable;
          const content = <><Icon size={17} /><span><small>{fact.label}</small><strong title={fact.value}>{fact.value}</strong>{fact.detail && <em>{fact.detail}</em>}</span>{actionable && <IconChevronRight size={16} />}</>;
          const className = `${fact.available ? "" : "missing"} ${fact.critical ? "critical" : ""} ${fact.resolved ? "resolved" : ""}`.trim();
          if (fact.supplementable) {
            return <button type="button" key={fact.id} className={className} onClick={onSupplementEvidence} aria-label={`${fact.resolved ? "编辑" : "补充"}${fact.label}`} data-qa="evidence-supplement-open" data-evidence-id={fact.id}>{content}</button>;
          }
          return fact.inspectable
            ? <button type="button" key={fact.id} className={className} onClick={() => onSelectEvidence(evidence.id)}>{content}</button>
            : <div key={fact.id} className={className} data-qa={fact.critical ? "critical-evidence-fact" : undefined} data-evidence-id={fact.critical ? fact.id : undefined}>{content}</div>;
        })}
      </div>
    </section>
  );
}

function InlineAdvice({ item }) {
  const rows = [
    ["运行建议", item.runAdvice, IconRoute, "run"],
    ["检查动作", item.inspectionAction, IconSearch, "inspect"],
    ["检维修建议", item.maintenanceAdvice, IconAdjustmentsHorizontal, "maintain"],
  ].filter(([, content]) => String(content || "").trim());
  return (
    <section className="id-inline-advice" aria-label="处置建议">
      {rows.map(([label, content, Icon, tone]) => (
        <div className={tone} key={label}><Icon size={18} /><strong>{label}：</strong><span>{content}</span></div>
      ))}
    </section>
  );
}

function ParameterCompleteness({ data }) {
  if (!data) return null;
  const percent = data.totalCount ? Math.round((data.configuredCount / data.totalCount) * 100) : 0;
  return (
    <section className="id-parameter-card" aria-label={`${data.module}参数完备度`}>
      <header><span>参数完备度</span><strong>{percent}%</strong></header>
      <div><span>{data.module}</span><div className="id-parameter-progress"><i style={{ width: `${percent}%` }} /></div></div>
      <p>已配置 {data.configuredCount} / 总计 {data.totalCount}</p>
      {data.missingParameters?.length > 0 && <p className="missing">未配置：{data.missingParameters.join("、")}</p>}
      {data.configuredParameters?.length > 0 && <p className="configured">已配置：{data.configuredParameters.join("、")}</p>}
    </section>
  );
}

function AdviceSections({ item }) {
  const sections = [
    ["运行建议", item.runAdvice, IconRoute],
    ["检查动作", item.inspectionAction, IconListCheck],
    ["检维修建议", item.maintenanceAdvice, IconAdjustmentsHorizontal],
  ].filter(([, content]) => String(content || "").trim());
  return (
    <div className="id-advice-sections">
      {sections.map(([title, content, Icon], index) => (
        <section key={title}><header><i>{index + 1}</i><Icon size={17} /><strong>{title}</strong></header><p>{content}</p></section>
      ))}
    </div>
  );
}

function EmptyDetail({ evidence = false }) {
  return (
    <div className="id-empty-detail">
      {evidence ? <IconPhotoOff size={34} /> : <IconInfoCircle size={34} />}
      <strong>{evidence ? "暂无证据详情" : "当前队列暂无事件"}</strong>
      <span>{evidence ? "选择一条诊断事件后查看趋势与附件" : "可切换状态或报警类型继续查看"}</span>
    </div>
  );
}

function TrendChart({ evidence, hoveredIndex, selectedIndex, onHover, onSelect }) {
  const chartRef = useRef(null);
  const [chartSize, setChartSize] = useState({ width: 800, height: 258 });
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return undefined;
    const updateSize = ({ width, height }) => {
      const nextWidth = Math.max(240, Math.round(width));
      const nextHeight = Math.max(180, Math.round(height));
      setChartSize((current) => current.width === nextWidth && current.height === nextHeight
        ? current
        : { width: nextWidth, height: nextHeight });
    };
    updateSize(chart.getBoundingClientRect());
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => updateSize(entries[0]?.contentRect || chart.getBoundingClientRect()))
      : null;
    observer?.observe(chart);
    return () => observer?.disconnect();
  }, []);
  const { width, height } = chartSize;
  const pad = { left: 84, right: 18, top: 28, bottom: 38 };
  const plotWidth = width - pad.left - pad.right;
  const topY = pad.top + 10;
  const bottomY = height - pad.bottom - 10;
  const numericValues = evidence.kind === "numeric" ? evidence.points.map((point) => Number(point.value)) : [];
  const numericMin = numericValues.length ? Math.min(...numericValues, Number(evidence.threshold || Infinity)) : 0;
  const numericMax = numericValues.length ? Math.max(...numericValues, Number(evidence.threshold || -Infinity)) : 1;
  const numericRange = Math.max(1, numericMax - numericMin);
  const points = evidence.points.map((point, index) => ({
    ...point,
    x: pad.left + (index * plotWidth) / Math.max(1, evidence.points.length - 1),
    y: evidence.kind === "numeric"
      ? bottomY - ((Number(point.value) - numericMin) / numericRange) * (bottomY - topY)
      : point.isAlarm ? topY : bottomY,
  }));
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  const tooltipIndex = Number.isInteger(hoveredIndex) ? hoveredIndex : selectedIndex;
  const hovered = Number.isInteger(tooltipIndex) ? points[tooltipIndex] : null;
  const selected = Number.isInteger(selectedIndex) ? points[selectedIndex] : null;
  const tooltipPlacement = hovered?.y > height / 2 ? "above" : "below";

  return (
    <div ref={chartRef} className="id-chart-canvas" onMouseLeave={() => onHover(null)} data-qa="diagnosis-chart-canvas">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${evidence.title}状态趋势图`}>
        <rect className="id-chart-bg" x="0" y="0" width={width} height={height} />
        {[topY, bottomY].map((y) => (
          <line key={y} className="id-chart-grid" x1={pad.left} y1={y} x2={width - pad.right} y2={y} />
        ))}
        <line className="id-chart-axis" x1={pad.left} y1={pad.top - 2} x2={pad.left} y2={height - pad.bottom} />
        <line className="id-chart-axis" x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} />
        <text className="id-chart-y-label" x={pad.left - 12} y={topY + 5} textAnchor="end">{evidence.kind === "numeric" ? `${numericMax}${evidence.unit}` : evidence.description}</text>
        <text className="id-chart-y-label" x={pad.left - 12} y={bottomY + 5} textAnchor="end">{evidence.kind === "numeric" ? `${numericMin}${evidence.unit}` : "正常"}</text>
        {evidence.kind === "numeric" && Number.isFinite(Number(evidence.threshold)) && <line className="id-chart-threshold" x1={pad.left} y1={bottomY - ((Number(evidence.threshold) - numericMin) / numericRange) * (bottomY - topY)} x2={width - pad.right} y2={bottomY - ((Number(evidence.threshold) - numericMin) / numericRange) * (bottomY - topY)} />}
        <polyline className="id-chart-line" points={pointString} />
        {selected && <line className="id-chart-cursor" x1={selected.x} y1={pad.top - 2} x2={selected.x} y2={height - pad.bottom} aria-hidden="true" />}
        {points.map((point, index) => (
          <g key={`${point.time}-${index}`}>
            <circle
              className={`id-chart-hit ${point.isAlarm ? "alarm" : "normal"}`}
              cx={point.x}
              cy={point.y}
              r="13"
              tabIndex="0"
              role="button"
              aria-label={`${point.time}，${point.state}`}
              onMouseEnter={() => onHover(index)}
              onFocus={() => onHover(index)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(index)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(index); } }}
            />
            {selectedIndex === index && <circle className={`id-chart-selection ${point.isAlarm ? "alarm" : "normal"}`} cx={point.x} cy={point.y} r="10" aria-hidden="true" />}
            <circle className={`id-chart-point ${point.isAlarm ? "alarm" : "normal"} ${point.hasAttachment ? "has-attachment" : "no-attachment"}`} cx={point.x} cy={point.y} r="5.8" aria-hidden="true" />
          </g>
        ))}
        <text className="id-chart-x-label" x={pad.left} y={height - 10}>{points[0]?.time}</text>
        <text className="id-chart-x-label" x={width - pad.right} y={height - 10} textAnchor="end">{points.at(-1)?.time}</text>
      </svg>
      {hovered && (
        <div
          className={`id-chart-tooltip ${tooltipPlacement}`}
          style={{
            left: `clamp(82px, ${(hovered.x / width) * 100}%, calc(100% - 82px))`,
            top: `${(hovered.y / height) * 100}%`,
          }}
          role="status"
          data-qa="diagnosis-chart-tooltip"
        >
          <strong>{hovered.time}</strong>
          <span>{hovered.state}</span>
          <small>{hovered.hasAttachment ? `${hovered.attachmentCount} 个附件` : "未检测到附件"}</small>
        </div>
      )}
      <div className="id-chart-legend" aria-label="趋势点图例"><span><i className="solid alarm" />报警</span><span><i className="solid normal" />正常</span><span><i className="hollow" />无附件</span></div>
    </div>
  );
}

function ConfirmationModal({ type, events, reason, onReasonChange, defectDraft, onDefectDraftChange, activeTab, onTabChange, onCancel, onConfirm }) {
  const isDefect = type === "defect";
  const eventCount = events.length;
  const criticalGapEvents = events.filter(hasCriticalEvidenceGap);
  const latestTime = [...events].sort((a, b) => b.time.localeCompare(a.time))[0]?.time || "--";
  const reportSections = isDefect ? [
    { title: "诊断结论", content: defectDraft.conclusion, icon: IconInfoCircle },
    { title: "检维修建议", content: defectDraft.maintenanceAdvice, icon: IconAdjustmentsHorizontal },
  ].filter((section) => String(section.content || "").trim()) : [];
  const updateDraft = (field) => (event) => onDefectDraftChange(field, event.target.value);

  return (
    <div className="id-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section
        className={`id-modal ${isDefect ? "id-defect-modal" : "id-close-modal"}`}
        style={isDefect ? { width: "min(860px, 94vw)" } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="id-modal-title"
      >
        <header>
          <div className={isDefect ? "defect" : "close"}>
            {isDefect ? <IconSparkles size={20} /> : <IconX size={20} />}
          </div>
          <div>
            <h2 id="id-modal-title">{isDefect ? `${eventCount > 1 ? "批量" : ""}生成设备缺陷` : eventCount > 1 ? `批量关闭报警（${eventCount}条）` : "关闭报警事件"}</h2>
            <p>{isDefect ? `将 ${eventCount} 条待处理报警转入已成缺陷队列` : `将 ${eventCount} 条待处理报警转入已关闭队列`}</p>
          </div>
          <button onClick={onCancel} aria-label="关闭确认窗口"><IconX size={18} /></button>
        </header>

        {isDefect && (
          <nav className="id-modal-tabs" role="tablist" aria-label="生成缺陷步骤">
            {[
              ["info", "缺陷信息", IconInfoCircle],
              ["alarms", `关联报警 (${eventCount})`, IconListCheck],
              ["report", "诊断报告", IconFiles],
            ].map(([id, label, Icon]) => (
              <button key={id} className={activeTab === id ? "active" : ""} onClick={() => onTabChange(id)} role="tab" aria-selected={activeTab === id} aria-controls={`id-modal-panel-${id}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </nav>
        )}

        <div className="id-modal-body id-action-modal-body">
          {!isDefect && (
            <>
              <div className="id-modal-case">
                <span>诊断对象</span>
                <strong>{eventCount > 1 ? `${joinMappedValues(events, "device")} · ${eventCount} 条报警` : events[0].device}</strong>
                <small>{eventCount > 1 ? joinMappedValues(events, "location", "、") : events[0].title}</small>
              </div>
              {criticalGapEvents.length > 0 && <p className="id-modal-note"><IconAlertTriangle size={17} />其中 {criticalGapEvents.length} 条报警仍缺少领域必需证据。允许关闭，但系统会把缺证快照与关闭原因一并留痕。</p>}
              <label className="id-reason-field">
                <span>关闭原因 <b>*</b></span>
                <textarea
                  autoFocus
                  value={reason}
                  maxLength="120"
                  onChange={(event) => onReasonChange(event.target.value)}
                  placeholder="请输入现场核实结果或关闭原因"
                  rows="4"
                />
                <small>{reason.trim().length}/120</small>
              </label>
            </>
          )}

          {isDefect && activeTab === "info" && (
            <div id="id-modal-panel-info" className="id-defect-information" role="tabpanel">
              <p className="id-modal-note"><IconAlertTriangle size={17} />系统已按诊断结果映射缺陷字段；缺陷等级需由处理人确认后提交。</p>
              <div className="id-defect-form-grid">
                <label className="wide"><span>缺陷名称 <b>*</b></span><input value={defectDraft.name} onChange={updateDraft("name")} /></label>
                <label><span>缺陷等级 <b>*</b></span><select value={defectDraft.defectLevel} onChange={updateDraft("defectLevel")}><option value="">请选择缺陷等级</option><option>一级缺陷</option><option>二级缺陷</option><option>三级缺陷</option><option>四级缺陷</option></select></label>
                <label><span>诊断时间</span><input value={latestTime} readOnly /></label>
                <label><span>设备部件</span><input value={defectDraft.device} onChange={updateDraft("device")} /></label>
                <label><span>故障部件</span><input value={defectDraft.faultPart} onChange={updateDraft("faultPart")} /></label>
                <label><span>故障类型</span><input value={defectDraft.faultType} onChange={updateDraft("faultType")} /></label>
                <label className="wide"><span>设备路径</span><textarea rows="2" value={defectDraft.devicePath} onChange={updateDraft("devicePath")} /></label>
                <label className="wide"><span>现象描述</span><textarea rows="3" value={defectDraft.description} onChange={updateDraft("description")} /></label>
                <label className="wide"><span>诊断结论</span><textarea rows="3" value={defectDraft.conclusion} onChange={updateDraft("conclusion")} /></label>
                <label className="wide"><span>检维修建议</span><textarea rows="3" value={defectDraft.maintenanceAdvice} onChange={updateDraft("maintenanceAdvice")} /></label>
                <label className="wide"><span>备注</span><textarea rows="2" value={defectDraft.note} onChange={updateDraft("note")} /></label>
              </div>
            </div>
          )}

          {isDefect && activeTab === "alarms" && (
            <div id="id-modal-panel-alarms" className="id-related-alarms" role="tabpanel">
              <div className="id-related-alarm-summary"><IconPaperclip size={17} /><span>以下报警将与新缺陷建立关联，原始诊断证据不会合并或丢失。</span></div>
              <div className="id-related-alarm-table-wrap">
                <table className="id-related-alarm-table">
                  <thead><tr><th>序号</th><th>报警对象</th><th>报警摘要</th><th>诊断时间</th><th>状态</th></tr></thead>
                  <tbody>{events.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><strong>{item.location}-{item.faultType}</strong><small>{item.code}</small></td><td><strong>{item.measurementPoint}：{item.evidences?.[0]?.title}</strong>{item.conclusion && <small>诊断：{item.conclusion}</small>}{item.evidences?.[0]?.points?.some((point) => point.hasAttachment) && <small>附件：现场图像 / 趋势图谱</small>}</td><td>{item.time}</td><td><em>待处理</em></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {isDefect && activeTab === "report" && (
            <article id="id-modal-panel-report" className="id-diagnosis-report" role="tabpanel">
              <header><div><IconFiles size={20} /><span><strong>{defectDraft.name || "智能诊断报告"}</strong><small>{defectDraft.device} · {latestTime}</small></span></div><em>{eventCount} 条关联报警</em></header>
              <dl>
                {defectDraft.faultPart && <div><dt>故障部位</dt><dd>{defectDraft.faultPart}</dd></div>}
                {defectDraft.faultType && <div><dt>缺陷类型</dt><dd>{defectDraft.faultType}</dd></div>}
                {defectDraft.locationDescription && <div><dt>位置描述</dt><dd>{defectDraft.locationDescription}</dd></div>}
                {defectDraft.measurementPoint && <div><dt>诊断测点</dt><dd>{defectDraft.measurementPoint}</dd></div>}
              </dl>
              <div className="id-report-sections">
                {reportSections.map(({ title, content, icon: Icon }) => <section key={title}><h3><Icon size={16} />{title}</h3><p>{content}</p></section>)}
                {events.some((item) => item.evidences?.length) && <section className="id-report-analysis"><h3><IconChartLine size={16} />分析过程</h3><div>{events.flatMap((item) => item.evidences.map((evidence) => <article key={`${item.id}-${evidence.id}`}><span>{item.location}</span><strong>{evidence.title}</strong><small>{evidence.stamp} · 图谱与附件已归档</small></article>))}</div></section>}
                {String(defectDraft.note || "").trim() && <section className="id-report-note"><h3><IconInfoCircle size={16} />备注</h3><p>{defectDraft.note}</p></section>}
              </div>
            </article>
          )}
        </div>
        <footer>
          <span className="id-modal-selection-note">已选择 {eventCount} 条待处理报警</span>
          <button className="id-secondary-button" onClick={onCancel}>取消</button>
          <button className="id-primary-button" disabled={isDefect ? !String(defectDraft.name || "").trim() || !defectDraft.defectLevel : !reason.trim()} onClick={onConfirm}>{isDefect ? `确认生成${eventCount > 1 ? ` (${eventCount})` : ""}` : `确认关闭${eventCount > 1 ? ` (${eventCount})` : ""}`}</button>
        </footer>
      </section>
    </div>
  );
}

function EvidenceSupplementModal({ item, draft, onDraftChange, onCancel, onConfirm }) {
  const depth = Number.parseFloat(draft.depth);
  const depthValid = String(draft.depth).trim() !== "" && Number.isFinite(depth) && depth > 0 && depth <= 100;
  const canSubmit = depthValid && Boolean(draft.penetration) && Boolean(draft.confirmed);
  const updateDraft = (field) => (event) => onDraftChange(field, event.target.type === "checkbox" ? event.target.checked : event.target.value);

  return (
    <div className="id-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="id-modal id-evidence-supplement-modal" role="dialog" aria-modal="true" aria-labelledby="id-evidence-modal-title" data-qa="evidence-supplement-dialog">
        <header>
          <div className="evidence"><IconListCheck size={20} /></div>
          <div>
            <h2 id="id-evidence-modal-title">补充关键证据</h2>
            <p>现场复核结果将参与证据完整性计算，并写入处理记录</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭补充证据窗口"><IconX size={18} /></button>
        </header>
        <div className="id-modal-body">
          <div className="id-modal-case id-evidence-case">
            <span>待复核诊断</span>
            <strong>{item.location} · {item.faultType}</strong>
            <small>{item.device} / {item.code} · 模型匹配 {item.probability}%</small>
          </div>
          <p className="id-modal-note"><IconAlertTriangle size={17} />当前缺少“损伤深度”和“是否贯穿”两项领域必需事实，补充前不能判定为高可信。</p>
          <div className="id-evidence-supplement-form">
            <label>
              <span>损伤深度（mm） <b>*</b></span>
              <input
                autoFocus
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={draft.depth}
                onChange={updateDraft("depth")}
                placeholder="请输入现场测量值"
                aria-invalid={String(draft.depth).trim() !== "" && !depthValid}
                data-qa="evidence-supplement-depth"
              />
              <small>允许范围 0.1–100.0 mm</small>
            </label>
            <label>
              <span>贯穿状态 <b>*</b></span>
              <select value={draft.penetration} onChange={updateDraft("penetration")} data-qa="evidence-supplement-method">
                <option value="">请选择现场核验结果</option>
                <option value="未贯穿">未贯穿</option>
                <option value="疑似贯穿">疑似贯穿</option>
                <option value="已贯穿">已贯穿</option>
              </select>
              <small>按皮带内外表面检查结果填写</small>
            </label>
            <label className="wide id-evidence-review-note">
              <span>复核说明</span>
              <textarea rows="3" maxLength="120" value={draft.note} onChange={updateDraft("note")} placeholder="可填写测量位置、工具或现场异常情况" data-qa="evidence-supplement-note" />
              <small>{draft.note.trim().length}/120</small>
            </label>
          </div>
          <div className="id-evidence-source-summary">
            <IconPhoto size={18} />
            <span><strong>已关联当前报警现场附件</strong><small>{item.evidences?.[0]?.source} · {item.evidences?.[0]?.stamp}</small></span>
            <em>原始证据</em>
          </div>
          <label className="id-evidence-confirmation">
            <input type="checkbox" checked={draft.confirmed} onChange={updateDraft("confirmed")} />
            <span><strong>已核对现场测量结果</strong><small>提交后将以“人工复核”来源留痕；算法模型匹配概率保持不变。</small></span>
          </label>
        </div>
        <footer>
          <span className="id-modal-selection-note">补证后系统将重新计算证据状态</span>
          <button type="button" className="id-secondary-button" onClick={onCancel}>取消</button>
          <button type="button" className="id-primary-button" disabled={!canSubmit} onClick={onConfirm} data-qa="evidence-supplement-submit">确认补充</button>
        </footer>
      </section>
    </div>
  );
}

export function IntelligentDiagnosis() {
  const { events, getEvent, updateEvent } = useOperations();
  const requestedParams = useMemo(() => routeParams(), []);
  const requestedOperation = resolveOperation(requestedParams.get("event"));
  const [cases, setCases] = useState(() => {
    const savedSupplements = readEvidenceSupplements();
    return initialCases.map((sourceItem) => {
      const sourceEvent = sourceItem.linkedEventId ? getEvent(sourceItem.linkedEventId) : null;
      const item = sourceEvent
        ? {
            ...sourceItem,
            status: sourceEvent.status,
            closeReason: sourceEvent.status === "closed" ? sourceEvent.actionNote : sourceItem.closeReason,
            treatmentRecords: mergeLinkedTreatmentRecords(sourceItem.treatmentRecords, sourceEvent, sourceItem.linkedEventId),
          }
        : sourceItem;
      const saved = savedSupplements[item.id];
      if (!saved?.resolution) return item;
      const savedRecords = Array.isArray(saved.records) ? saved.records : [];
      const savedRecordIds = new Set(savedRecords.map((record) => record.id));
      return {
        ...item,
        criticalEvidenceResolution: saved.resolution,
        treatmentRecords: [
          ...(item.treatmentRecords || []).filter((record) => !savedRecordIds.has(record.id)),
          ...savedRecords,
        ],
      };
    });
  });
  const [activeModule, setActiveModule] = useState(() => {
    const requestedModule = requestedParams.get("module");
    return moduleTabs.some((item) => item.id === requestedModule) ? requestedModule : "diagnosis";
  });
  const requestedCaseId = requestedOperation?.diagnosisCaseId || requestedParams.get("case");
  const initialSelectedId = initialCases.some((item) => item.id === requestedCaseId) ? requestedCaseId : "belt-offset-head";
  const initialSelectedCase = initialCases.find((item) => item.id === initialSelectedId);
  const initialSelectedEvent = initialSelectedCase?.linkedEventId ? getEvent(initialSelectedCase.linkedEventId) : null;
  const [activeStatus, setActiveStatus] = useState(initialSelectedEvent?.status || initialSelectedCase?.status || "pending");
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [activeDetailTab, setActiveDetailTab] = useState("conclusion");
  const [activeEvidenceId, setActiveEvidenceId] = useState("material");
  const [query, setQuery] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [closeReason, setCloseReason] = useState("");
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceDraft, setEvidenceDraft] = useState({ depth: "", penetration: "", note: "", confirmed: false });
  const [toast, setToast] = useState(null);
  const [maximized, setMaximized] = useState(false);
  const [diagnosisLayout, setDiagnosisLayout] = useState(readDiagnosisLayout);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [compactLayout, setCompactLayout] = useState(() => typeof window !== "undefined" && window.innerWidth <= DIAGNOSIS_LAYOUT_BREAKPOINT);
  const [focusPanel, setFocusPanel] = useState("queue");
  const [resizingPair, setResizingPair] = useState("");
  const [counts, setCounts] = useState(() => {
    return { pending: 198, defect: 23, closed: 54 };
  });
  const [activeGroupKey, setActiveGroupKey] = useState("");
  const [groupSelectedIds, setGroupSelectedIds] = useState([]);
  const [groupPage, setGroupPage] = useState(1);
  const [batchMenuOpen, setBatchMenuOpen] = useState(false);
  const [modalEventIds, setModalEventIds] = useState([]);
  const [modalTab, setModalTab] = useState("info");
  const [defectDraft, setDefectDraft] = useState({});
  const [selectedPointIndex, setSelectedPointIndex] = useState(4);
  const [attachmentIndex, setAttachmentIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(() => window.localStorage.getItem("ronds-intelligent-diagnosis-guide-seen") !== "true");
  const [thresholdCount, setThresholdCount] = useState(1);
  const searchRef = useRef(null);
  const batchMenuRef = useRef(null);
  const evidenceSubmitLockRef = useRef(false);
  const layoutBodyRef = useRef(null);
  const layoutResizeCleanupRef = useRef(null);
  useEffect(() => {
    setCases((items) => items.map((item) => {
      const eventState = item.linkedEventId ? events[item.linkedEventId] : null;
      return eventState ? {
          ...item,
          status: eventState.status,
          closeReason: eventState.status === "closed" ? eventState.actionNote : item.closeReason,
          defectInfo: eventState.status === "defect" ? { ...(item.defectInfo || {}), defectNo: eventState.defectId } : item.defectInfo,
          treatmentRecords: mergeLinkedTreatmentRecords(item.treatmentRecords, eventState, item.linkedEventId),
        }
        : item;
    }));
    const selectedSource = initialCases.find((item) => item.id === selectedId);
    const selectedState = selectedSource?.linkedEventId ? events[selectedSource.linkedEventId] : null;
    if (selectedState?.status) setActiveStatus(selectedState.status);
  }, [events, selectedId]);

  const notify = (message, type = "success") => setToast({ message, type, key: Date.now() });

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (activeModule !== "diagnosis") return undefined;
    const body = layoutBodyRef.current;
    if (!body) return undefined;

    const updateLayoutWidth = (width) => {
      if (!Number.isFinite(width) || width <= 0) return;
      setLayoutWidth(width);
      const nextCompact = width <= DIAGNOSIS_LAYOUT_BREAKPOINT;
      setCompactLayout((currentCompact) => {
        return nextCompact;
      });
    };
    const measure = () => updateLayoutWidth(body.getBoundingClientRect().width);
    measure();

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => updateLayoutWidth(entries[0]?.contentRect?.width || body.getBoundingClientRect().width))
      : null;
    observer?.observe(body);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeModule]);

  useEffect(() => {
    if (resizingPair || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DIAGNOSIS_LAYOUT_STORAGE_KEY, JSON.stringify(diagnosisLayout));
    } catch {
      // Layout preferences are optional; storage may be unavailable in private contexts.
    }
  }, [diagnosisLayout, resizingPair]);

  useEffect(() => () => {
    layoutResizeCleanupRef.current?.(true, true);
    document.body.classList.remove("id-resizing-panels");
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (resizingPair) layoutResizeCleanupRef.current?.(true);
        else if (evidenceModalOpen) {
          setEvidenceModalOpen(false);
          setEvidenceDraft({ depth: "", penetration: "", note: "", confirmed: false });
        }
        else if (modalType) {
          setModalType(null);
          setModalEventIds([]);
          setCloseReason("");
        }
        else if (batchMenuOpen) setBatchMenuOpen(false);
        else if (maximized) setMaximized(false);
        else if (activeGroupKey) {
          setActiveGroupKey("");
          setGroupSelectedIds([]);
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGroupKey, batchMenuOpen, evidenceModalOpen, maximized, modalType, resizingPair]);

  useEffect(() => {
    if (!batchMenuOpen) return undefined;
    const closeMenu = (event) => {
      if (!batchMenuRef.current?.contains(event.target)) setBatchMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [batchMenuOpen]);

  const selectedCase = cases.find((item) => item.id === selectedId) || null;
  const selectedOperation = resolveOperation(selectedCase?.linkedEventId);
  const selectedLinkedEvent = selectedCase?.linkedEventId ? getEvent(selectedCase.linkedEventId) : null;
  const selectedEvidence = selectedCase
    ? selectedCase.evidences.find((item) => item.id === activeEvidenceId) || selectedCase.evidences[0]
    : null;
  const selectedEvidencePoint = selectedEvidence?.points?.[selectedPointIndex] || null;
  const selectedAttachmentImages = selectedCase?.id === "belt-offset-head"
    ? [materialOffsetEvidenceImage, conveyorImage]
    : selectedCase?.id === "hammer-damage"
      ? [beltScratchEvidenceImage, conveyorImage]
      : [conveyorImage];
  const availableAttachmentCount = selectedEvidencePoint?.hasAttachment
    ? Math.min(Math.max(1, selectedEvidencePoint.attachmentCount || 1), selectedAttachmentImages.length)
    : 0;
  const selectedAttachmentImage = selectedAttachmentImages[Math.min(attachmentIndex, Math.max(0, availableAttachmentCount - 1))];
  const selectedVerification = selectedCase && selectedEvidence ? getVerificationSummary(selectedCase, selectedEvidence) : null;
  const modalEvents = useMemo(() => modalEventIds.map((id) => cases.find((item) => item.id === id)).filter(Boolean), [cases, modalEventIds]);
  const desktopVisibleKeys = DIAGNOSIS_PANEL_KEYS.filter((key) => !diagnosisLayout.collapsed[key]);
  const visiblePanelCount = desktopVisibleKeys.length;
  const desktopPanelWidths = useMemo(
    () => allocateDiagnosisPanelWidths(layoutWidth, desktopVisibleKeys, diagnosisLayout.ratios),
    [desktopVisibleKeys.join("|"), diagnosisLayout.ratios, layoutWidth],
  );
  const desktopSplitterPairs = desktopVisibleKeys.slice(0, -1).map((left, index) => ({ left, right: desktopVisibleKeys[index + 1] }));
  const diagnosisGridStyle = compactLayout
    ? undefined
    : {
        gridTemplateColumns: desktopVisibleKeys.flatMap((key, index) => {
          const panelTrack = desktopPanelWidths[key]
            ? `${desktopPanelWidths[key]}px`
            : `minmax(0, ${diagnosisLayout.ratios[key]}fr)`;
          return index === desktopVisibleKeys.length - 1 ? [panelTrack] : [panelTrack, `${DIAGNOSIS_SPLITTER_WIDTH}px`];
        }).join(" "),
      };

  const isPanelVisible = (key) => compactLayout ? focusPanel === key : !diagnosisLayout.collapsed[key];
  const panelGridStyle = (key) => {
    if (!isPanelVisible(key)) return undefined;
    if (compactLayout) return { gridColumn: "1", gridRow: "2" };
    const column = desktopVisibleKeys.indexOf(key) * 2 + 1;
    return {
      gridColumn: String(column),
      gridRow: key === "queue" && visiblePanelCount > 1 ? "1 / 3" : "1",
    };
  };
  const bottomActionGridStyle = compactLayout
    ? { gridColumn: "1", gridRow: "3" }
    : {
        gridColumn: desktopVisibleKeys[0] === "queue" && visiblePanelCount > 1 ? "3 / -1" : "1 / -1",
        gridRow: "2",
      };

  const focusAfterLayoutChange = (selector) => {
    window.setTimeout(() => document.querySelector(selector)?.focus(), 0);
  };

  const collapseDiagnosisPanel = (key) => {
    if (compactLayout || maximized || diagnosisLayout.collapsed[key]) return;
    if (visiblePanelCount <= 1) {
      notify("至少保留一个诊断工作区", "error");
      return;
    }
    setDiagnosisLayout((current) => ({
      ...current,
      collapsed: { ...current.collapsed, [key]: true },
    }));
    focusAfterLayoutChange(`[data-qa="diagnosis-restore-${key}"]`);
  };

  const restoreDiagnosisPanel = (key) => {
    setDiagnosisLayout((current) => ({
      ...current,
      collapsed: { ...current.collapsed, [key]: false },
    }));
    focusAfterLayoutChange(`[data-qa="diagnosis-collapse-${key}"]`);
  };

  const resetDiagnosisLayout = () => {
    setDiagnosisLayout({
      version: 1,
      ratios: { ...DIAGNOSIS_PANEL_DEFAULT_RATIOS },
      collapsed: { queue: false, verification: false, evidence: false },
    });
    notify("已恢复三栏默认布局");
  };

  const resetDiagnosisRatios = () => {
    setDiagnosisLayout((current) => ({ ...current, ratios: { ...DIAGNOSIS_PANEL_DEFAULT_RATIOS } }));
    notify("三栏比例已恢复为默认值");
  };

  const resizeDiagnosisPair = (left, right, requestedLeftWidth, pairWidth) => {
    if (!Number.isFinite(pairWidth) || pairWidth <= 0) return;
    const minLeft = DIAGNOSIS_PANEL_MIN_WIDTHS[left];
    const minRight = DIAGNOSIS_PANEL_MIN_WIDTHS[right];
    const lowerBound = Math.min(minLeft, Math.max(0, pairWidth - minRight));
    const upperBound = Math.max(lowerBound, pairWidth - minRight);
    const nextLeftWidth = Math.min(upperBound, Math.max(lowerBound, requestedLeftWidth));
    setDiagnosisLayout((current) => {
      const pairRatio = current.ratios[left] + current.ratios[right];
      const nextRatios = {
        ...current.ratios,
        [left]: pairRatio * (nextLeftWidth / pairWidth),
        [right]: pairRatio * ((pairWidth - nextLeftWidth) / pairWidth),
      };
      return { ...current, ratios: normalizePanelRatios(nextRatios) };
    });
  };

  const beginDiagnosisPanelResize = (event, left, right) => {
    if (event.button !== 0 || compactLayout || maximized) return;
    const leftWidth = desktopPanelWidths[left] || document.getElementById(DIAGNOSIS_PANEL_META[left].panelId)?.getBoundingClientRect().width || 0;
    const rightWidth = desktopPanelWidths[right] || document.getElementById(DIAGNOSIS_PANEL_META[right].panelId)?.getBoundingClientRect().width || 0;
    const pairWidth = leftWidth + rightWidth;
    if (pairWidth <= 0) return;

    event.preventDefault();
    event.stopPropagation();
    layoutResizeCleanupRef.current?.(false, true);
    const separator = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startLayout = diagnosisLayout;
    const pairName = `${left}-${right}`;
    let lastClientX = startX;
    let animationFrame = 0;
    let finished = false;

    separator.focus();
    try { separator.setPointerCapture(pointerId); } catch { /* Pointer capture is best-effort. */ }
    document.body.classList.add("id-resizing-panels");
    setResizingPair(pairName);

    const applyPendingWidth = () => {
      animationFrame = 0;
      resizeDiagnosisPair(left, right, leftWidth + (lastClientX - startX), pairWidth);
    };
    const onPointerMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      lastClientX = moveEvent.clientX;
      if (!animationFrame) animationFrame = window.requestAnimationFrame(applyPendingWidth);
    };
    const finish = (restore = false, silent = false) => {
      if (finished) return;
      finished = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        if (!restore && !silent) applyPendingWidth();
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("blur", onWindowBlur);
      document.body.classList.remove("id-resizing-panels");
      try {
        if (separator.hasPointerCapture(pointerId)) separator.releasePointerCapture(pointerId);
      } catch { /* The browser may release capture before cleanup. */ }
      layoutResizeCleanupRef.current = null;
      if (!silent) {
        if (restore) setDiagnosisLayout(startLayout);
        setResizingPair("");
      }
    };
    const onPointerUp = (upEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      lastClientX = upEvent.clientX;
      finish(false);
    };
    const onPointerCancel = (cancelEvent) => {
      if (cancelEvent.pointerId === pointerId) finish(true);
    };
    const onWindowBlur = () => finish(false);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("blur", onWindowBlur);
    layoutResizeCleanupRef.current = finish;
  };

  const handleDiagnosisSplitterKeyDown = (event, left, right) => {
    const leftWidth = desktopPanelWidths[left];
    const rightWidth = desktopPanelWidths[right];
    if (!Number.isFinite(leftWidth) || !Number.isFinite(rightWidth)) return;
    const pairWidth = leftWidth + rightWidth;
    const lowerBound = DIAGNOSIS_PANEL_MIN_WIDTHS[left];
    const upperBound = Math.max(lowerBound, pairWidth - DIAGNOSIS_PANEL_MIN_WIDTHS[right]);
    const step = event.shiftKey ? 48 : 16;
    let requested = null;
    if (event.key === "ArrowLeft") requested = leftWidth - step;
    if (event.key === "ArrowRight") requested = leftWidth + step;
    if (event.key === "Home") requested = lowerBound;
    if (event.key === "End") requested = upperBound;
    if (requested === null) return;
    event.preventDefault();
    resizeDiagnosisPair(left, right, requested, pairWidth);
  };

  const renderDiagnosisSplitter = ({ left, right }, index) => {
    const leftWidth = desktopPanelWidths[left] || DIAGNOSIS_PANEL_MIN_WIDTHS[left];
    const rightWidth = desktopPanelWidths[right] || DIAGNOSIS_PANEL_MIN_WIDTHS[right];
    const pairWidth = leftWidth + rightWidth;
    const minimum = DIAGNOSIS_PANEL_MIN_WIDTHS[left];
    const maximum = Math.max(minimum, pairWidth - DIAGNOSIS_PANEL_MIN_WIDTHS[right]);
    const pairName = `${left}-${right}`;
    return (
      <div
        key={pairName}
        className={`id-panel-splitter ${resizingPair === pairName ? "dragging" : ""}`}
        style={{ gridColumn: String(index * 2 + 2), gridRow: left === "queue" ? "1 / 3" : "1" }}
        role="separator"
        tabIndex={0}
        aria-label={`调整${DIAGNOSIS_PANEL_META[left].label}与${DIAGNOSIS_PANEL_META[right].label}宽度`}
        aria-orientation="vertical"
        aria-controls={`${DIAGNOSIS_PANEL_META[left].panelId} ${DIAGNOSIS_PANEL_META[right].panelId}`}
        aria-valuemin={Math.round(minimum)}
        aria-valuemax={Math.round(maximum)}
        aria-valuenow={Math.round(leftWidth)}
        aria-valuetext={`${DIAGNOSIS_PANEL_META[left].label} ${Math.round(leftWidth)} 像素，${DIAGNOSIS_PANEL_META[right].label} ${Math.round(rightWidth)} 像素`}
        data-left={left}
        data-right={right}
        data-qa={`diagnosis-splitter-${left}-${right}`}
        title="拖动调宽；方向键微调；双击恢复默认比例"
        onPointerDown={(event) => beginDiagnosisPanelResize(event, left, right)}
        onKeyDown={(event) => handleDiagnosisSplitterKeyDown(event, left, right)}
        onDoubleClick={resetDiagnosisRatios}
      >
        <span aria-hidden="true" />
      </div>
    );
  };

  useEffect(() => {
    if (!selectedCase) {
      setHoveredPoint(null);
      return;
    }
    if (!selectedCase.evidences.some((item) => item.id === activeEvidenceId)) {
      setActiveEvidenceId(selectedCase.evidences[0].id);
    }
    setHoveredPoint(null);
  }, [activeEvidenceId, selectedCase]);

  useEffect(() => {
    if (!selectedEvidence) return;
    setSelectedPointIndex(getDefaultPointIndex(selectedEvidence));
    setAttachmentIndex(0);
    setHoveredPoint(null);
  }, [selectedCase?.id, selectedEvidence?.id]);

  const queueEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const scoped = cases
      .filter((item) => item.module === activeModule && item.status === activeStatus)
      .sort((a, b) => sortNewest
        ? b.time.localeCompare(a.time)
        : a.time.localeCompare(b.time));
    const matches = (item) => !normalizedQuery || `${item.title} ${item.shortTitle} ${item.device} ${item.code} ${item.location || ""} ${item.groupName || ""}`.toLowerCase().includes(normalizedQuery);

    if (activeStatus !== "pending") return scoped.filter(matches).map((item) => ({ kind: "case", item }));

    const rollerGroups = new Map();
    scoped.forEach((item) => {
      if (item.category !== "roller" || !item.groupKey) return;
      const identity = rollerGroupIdentity(item);
      if (!rollerGroups.has(identity)) rollerGroups.set(identity, []);
      rollerGroups.get(identity).push(item);
    });
    const qualifyingKeys = new Set([...rollerGroups.entries()].filter(([, children]) => children.length >= 2).map(([key]) => key));
    const renderedGroups = new Set();
    const entries = [];
    scoped.forEach((item) => {
      const identity = rollerGroupIdentity(item);
      if (!qualifyingKeys.has(identity)) {
        if (matches(item)) entries.push({ kind: "case", item });
        return;
      }
      if (renderedGroups.has(identity)) return;
      renderedGroups.add(identity);
      const children = rollerGroups.get(identity);
      const groupMatches = !normalizedQuery || `${item.groupName} ${item.groupFaultPart} ${children.map((child) => `${child.title} ${child.location} ${child.code}`).join(" ")}`.toLowerCase().includes(normalizedQuery);
      if (!groupMatches) return;
      const latestEvent = [...children].sort((a, b) => b.time.localeCompare(a.time))[0];
      entries.push({
        kind: "group",
        group: {
          key: identity,
          name: item.groupName,
          faultPart: item.groupFaultPart,
          latestTime: latestEvent.time,
          latestEvent,
          children,
        },
      });
    });
    return entries;
  }, [activeModule, activeStatus, cases, query, sortNewest]);

  const activeGroupEvents = useMemo(() => activeGroupKey
    ? cases
      .filter((item) => item.module === activeModule && item.status === "pending" && item.category === "roller" && rollerGroupIdentity(item) === activeGroupKey)
      .sort((a, b) => sortNewest ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time))
    : [], [activeGroupKey, activeModule, cases, sortNewest]);
  const activeGroup = activeGroupEvents.length >= 2 ? {
    key: activeGroupKey,
    name: activeGroupEvents[0].groupName,
    faultPart: activeGroupEvents[0].groupFaultPart,
    children: activeGroupEvents,
  } : null;
  const groupPageSize = 3;
  const groupTotalPages = Math.max(1, Math.ceil(activeGroupEvents.length / groupPageSize));
  const safeGroupPage = Math.min(groupPage, groupTotalPages);
  const groupPageEvents = activeGroupEvents.slice((safeGroupPage - 1) * groupPageSize, safeGroupPage * groupPageSize);
  const pageSelectionComplete = Boolean(groupPageEvents.length) && groupPageEvents.every((item) => groupSelectedIds.includes(item.id));

  useEffect(() => {
    if (!activeGroupKey) return;
    if (activeGroupEvents.length < 2) {
      setActiveGroupKey("");
      setGroupSelectedIds([]);
      setBatchMenuOpen(false);
    }
  }, [activeGroupEvents.length, activeGroupKey]);

  useEffect(() => {
    if (groupPage > groupTotalPages) setGroupPage(groupTotalPages);
  }, [groupPage, groupTotalPages]);

  const selectFirstFor = (moduleId, statusId) => {
    const next = cases.find((item) => item.module === moduleId && item.status === statusId);
    setSelectedId(next?.id || "");
    setActiveEvidenceId(next?.evidences[0]?.id || "");
  };

  const handleModuleChange = (moduleId) => {
    setActiveModule(moduleId);
    setActiveStatus("pending");
    setQuery("");
    setActiveGroupKey("");
    setGroupSelectedIds([]);
    setBatchMenuOpen(false);
    setModalType(null);
    setModalEventIds([]);
    if (moduleId === "diagnosis") {
      selectFirstFor(moduleId, "pending");
      setFocusPanel("queue");
    }
  };

  const handleStatusChange = (statusId) => {
    setActiveStatus(statusId);
    setQuery("");
    setActiveGroupKey("");
    setGroupSelectedIds([]);
    setBatchMenuOpen(false);
    selectFirstFor(activeModule, statusId);
    if (compactLayout) setFocusPanel("queue");
  };

  const handleCaseSelect = (id) => {
    const next = cases.find((item) => item.id === id);
    if (!next) return;
    setSelectedId(id);
    setActiveEvidenceId(next.evidences[0].id);
    setActiveDetailTab("conclusion");
    if (compactLayout) setFocusPanel("verification");
  };

  const handleEvidenceSelect = (id) => {
    setActiveEvidenceId(id);
    setHoveredPoint(null);
    setAttachmentIndex(0);
    if (compactLayout) setFocusPanel("evidence");
  };

  const navigateEvidence = (direction) => {
    if (!selectedCase || !selectedEvidence) return;
    const currentIndex = selectedCase.evidences.findIndex((item) => item.id === selectedEvidence.id);
    const nextIndex = Math.min(selectedCase.evidences.length - 1, Math.max(0, currentIndex + direction));
    handleEvidenceSelect(selectedCase.evidences[nextIndex].id);
  };

  const handlePointSelect = (index) => {
    const point = selectedEvidence?.points?.[index];
    if (!point) return;
    setSelectedPointIndex(index);
    setAttachmentIndex(0);
    if (!point.hasAttachment) notify("未检测到附件", "error");
  };

  const closeGuide = () => {
    window.localStorage.setItem("ronds-intelligent-diagnosis-guide-seen", "true");
    setGuideOpen(false);
  };

  const openEvidenceSupplement = () => {
    if (!selectedCase?.criticalEvidenceGap) {
      notify("当前诊断没有待补充的领域必需证据", "error");
      return;
    }
    if (selectedCase.status !== "pending") {
      notify("已处理事件的关键证据仅支持查看", "error");
      return;
    }
    const resolution = selectedCase.criticalEvidenceResolution;
    setEvidenceDraft({
      depth: resolution?.depth ? String(resolution.depth) : "",
      penetration: resolution?.penetration || "",
      note: resolution?.note || "",
      confirmed: false,
    });
    setEvidenceModalOpen(true);
  };

  const closeEvidenceSupplement = () => {
    setEvidenceModalOpen(false);
    setEvidenceDraft({ depth: "", penetration: "", note: "", confirmed: false });
  };

  const confirmEvidenceSupplement = () => {
    if (evidenceSubmitLockRef.current) {
      notify("关键证据正在提交，请勿重复操作", "error");
      return;
    }
    if (!selectedCase?.criticalEvidenceGap || selectedCase.status !== "pending") {
      closeEvidenceSupplement();
      notify("当前事件状态已变化，请刷新后重试", "error");
      return;
    }
    const depth = Number.parseFloat(evidenceDraft.depth);
    if (!Number.isFinite(depth) || depth <= 0 || depth > 100) {
      notify("请输入 0.1–100.0 mm 范围内的损伤深度", "error");
      return;
    }
    if (!evidenceDraft.penetration) {
      notify("请选择贯穿状态", "error");
      return;
    }
    if (!evidenceDraft.confirmed) {
      notify("请确认已核对现场测量结果", "error");
      return;
    }
    evidenceSubmitLockRef.current = true;
    const actionTime = formatTreatmentTime();
    const normalizedDepth = Number(depth.toFixed(1));
    const note = evidenceDraft.note.trim().slice(0, 120);
    const evidenceValue = `${normalizedDepth} mm · ${evidenceDraft.penetration}`;
    const recordNote = `损伤深度 ${normalizedDepth} mm；${evidenceDraft.penetration}${note ? `；${note}` : ""}`;
    const resolution = {
      label: selectedCase.criticalEvidenceGap.label,
      value: evidenceValue,
      detail: `人工复核 · 超级管理员 · ${actionTime}`,
      depth: normalizedDepth,
      penetration: evidenceDraft.penetration,
      note,
      verifiedAt: actionTime,
      verifiedBy: "超级管理员",
    };
    const record = {
      id: `evidence-${selectedCase.id}-${Date.now()}`,
      action: selectedCase.criticalEvidenceResolution ? "更新关键证据" : "补充关键证据",
      operator: "超级管理员",
      time: actionTime,
      note: recordNote,
      scope: "人工复核",
    };
    try {
      writeEvidenceSupplement(selectedCase.id, resolution, record);
      setCases((items) => items.map((item) => item.id === selectedCase.id
        ? {
            ...item,
            criticalEvidenceResolution: resolution,
            treatmentRecords: [...(item.treatmentRecords || []), record],
          }
        : item));
      closeEvidenceSupplement();
      const nextSummary = getVerificationSummary({ ...selectedCase, criticalEvidenceResolution: resolution }, selectedEvidence);
      notify(`关键证据已补充，可信状态已重新计算为“${nextSummary.confidenceLabel}”；模型匹配仍为 ${selectedCase.probability}%`);
    } catch {
      notify("关键证据保存失败，原证据未变更，请重试", "error");
    } finally {
      evidenceSubmitLockRef.current = false;
    }
  };

  const openGroup = (groupKey) => {
    const children = cases
      .filter((item) => item.module === activeModule && item.status === "pending" && item.category === "roller" && rollerGroupIdentity(item) === groupKey)
      .sort((a, b) => b.time.localeCompare(a.time));
    if (children.length < 2) return;
    setActiveGroupKey(groupKey);
    setGroupSelectedIds([]);
    setGroupPage(1);
    setBatchMenuOpen(false);
    handleCaseSelect(children[0].id);
  };

  const toggleGroupSelection = (id) => setGroupSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const togglePageSelection = () => setGroupSelectedIds((current) => {
    if (pageSelectionComplete) return current.filter((id) => !groupPageEvents.some((item) => item.id === id));
    return [...new Set([...current, ...groupPageEvents.map((item) => item.id)])];
  });

  const openAction = (type, eventIds) => {
    const events = eventIds
      .map((id) => cases.find((item) => item.id === id))
      .filter((item) => item?.status === "pending")
      .sort((a, b) => sortNewest ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time));
    if (!events.length) {
      notify("仅待处理事件可以执行该操作", "error");
      return;
    }
    if (type === "defect") {
      const blockedEvents = events.filter(hasCriticalEvidenceGap);
      if (blockedEvents.length) {
        if (blockedEvents.length === 1) handleCaseSelect(blockedEvents[0].id);
        notify(`有 ${blockedEvents.length} 条报警缺少关键证据，请先补充后再生成缺陷`, "error");
        setBatchMenuOpen(false);
        return;
      }
    }
    setModalEventIds(events.map((item) => item.id));
    setModalType(type);
    setModalTab("info");
    setCloseReason("");
    setDefectDraft(type === "defect" ? createDefectDraft(events) : {});
    setBatchMenuOpen(false);
  };

  const updateCaseStatus = (nextStatus, events, reason = "") => {
    const pendingEvents = events.filter((item) => item.status === "pending");
    if (!pendingEvents.length) return;
    if (nextStatus === "defect") {
      const blockedEvents = pendingEvents.filter(hasCriticalEvidenceGap);
      if (blockedEvents.length) {
        notify(`最终校验失败：${blockedEvents.length} 条报警缺少关键证据，请补充后重试`, "error");
        return;
      }
    }
    const eventIds = new Set(pendingEvents.map((item) => item.id));
    const actionTime = formatTreatmentTime();
    const action = nextStatus === "defect" ? "生成缺陷" : "关闭";
    const defectNo = nextStatus === "defect"
      ? pendingEvents.length === 1 && pendingEvents[0].linkedEventId
        ? createOperationDefectId(pendingEvents[0].linkedEventId)
        : `QX-${actionTime.replace(/[- :]/g, "").slice(0, 14)}-${String(pendingEvents.length).padStart(2, "0")}`
      : "";
    const missingEvidenceLabels = uniqueValues(pendingEvents.filter(hasCriticalEvidenceGap).map((item) => item.criticalEvidenceGap.label));
    const recordNote = nextStatus === "defect"
      ? `${defectDraft.defectLevel} · ${defectDraft.name}${defectDraft.note ? `；${defectDraft.note}` : ""}`
      : `${reason}${missingEvidenceLabels.length ? `；关闭时证据快照：缺少${missingEvidenceLabels.join("、")}` : ""}`;
    pendingEvents.filter((item) => item.linkedEventId).forEach((item) => {
      lastLinkedStatusRef.current = nextStatus;
      updateEvent(item.linkedEventId, {
        status: nextStatus,
        actionNote: recordNote,
        defectId: defectNo,
      }, "intelligent-diagnosis");
    });
    setCases((items) => items.map((item) => eventIds.has(item.id)
      ? {
        ...item,
        status: nextStatus,
        closeReason: nextStatus === "closed" ? reason : item.closeReason,
        defectInfo: nextStatus === "defect" ? { ...defectDraft, generatedAt: actionTime, relatedAlarmIds: pendingEvents.map((event) => event.id) } : item.defectInfo,
        treatmentRecords: [...(item.treatmentRecords || []), { action, operator: "超级管理员", time: actionTime, note: recordNote, defectNo, scope: pendingEvents.length > 1 ? "批量处理" : "单条处理" }],
      }
      : item));
    setCounts((current) => {
      const next = { ...current };
      next.pending = Math.max(0, next.pending - pendingEvents.length);
      next[nextStatus] += pendingEvents.length;
      return next;
    });
    const firstEvent = pendingEvents[0];
    setActiveStatus(nextStatus);
    setSelectedId(firstEvent.id);
    setActiveEvidenceId(firstEvent.evidences[0]?.id || "");
    setActiveGroupKey("");
    setGroupSelectedIds([]);
    setBatchMenuOpen(false);
    setModalType(null);
    setModalEventIds([]);
    setModalTab("info");
    setDefectDraft({});
    setCloseReason("");
    setQuery("");
    notify(nextStatus === "defect" ? `已生成缺陷，${pendingEvents.length} 条事件转入“已成缺陷”` : `已关闭 ${pendingEvents.length} 条事件，并转入“已关闭”`);
  };

  const confirmModal = () => {
    const pendingEvents = modalEvents.filter((item) => item.status === "pending");
    if (!pendingEvents.length) {
      notify("所选事件已不在待处理队列", "error");
      setModalType(null);
      return;
    }
    if (modalType === "defect") {
      const blockedEvents = pendingEvents.filter(hasCriticalEvidenceGap);
      if (blockedEvents.length) {
        notify(`证据状态已变化：${blockedEvents.length} 条报警缺少关键证据，请补充后重新生成`, "error");
        setModalType(null);
        setModalEventIds([]);
        return;
      }
      if (!String(defectDraft.name || "").trim()) {
        setModalTab("info");
        notify("请填写缺陷名称", "error");
        return;
      }
      if (!defectDraft.defectLevel) {
        setModalTab("info");
        notify("请选择缺陷等级后再生成", "error");
        return;
      }
      updateCaseStatus("defect", pendingEvents);
      return;
    }
    const reason = closeReason.trim();
    if (!reason) {
      notify("请填写关闭原因后再确认", "error");
      return;
    }
    updateCaseStatus("closed", pendingEvents, reason.slice(0, 120));
  };

  const exportEvidence = () => {
    if (!selectedCase || !selectedEvidence) return;
    const rows = ["时间,状态,值", ...selectedEvidence.points.map((point) => `${point.time},${point.state},${point.value}`)];
    const blob = new Blob([`\uFEFF${rows.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedCase.code}-${selectedEvidence.id}-诊断证据.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("诊断证据已导出");
  };

  const downloadAttachment = () => {
    if (!selectedCase || !selectedEvidencePoint?.hasAttachment) {
      notify("当前趋势点没有可下载附件", "error");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = selectedAttachmentImage;
    anchor.download = `${selectedCase.code}-${selectedEvidence.id}-${selectedEvidencePoint.time.replace(/[\s:]/g, "-")}-附件${attachmentIndex + 1}.png`;
    anchor.click();
    notify("现场附件已下载");
  };

  const resetTrend = () => {
    if (!selectedCase) return;
    setHoveredPoint(null);
    setActiveEvidenceId(selectedCase.evidences[0].id);
    setSelectedPointIndex(getDefaultPointIndex(selectedCase.evidences[0]));
    setAttachmentIndex(0);
    notify("证据趋势已复位");
  };

  const moduleCount = (moduleId) => {
    if (moduleId === "diagnosis") return counts.pending;
    if (moduleId === "threshold") return thresholdCount;
    return null;
  };

  return (
    <div className={`intelligent-diagnosis ${compactLayout && activeModule === "diagnosis" ? "id-compact-layout" : ""}`}>
      <div className={`id-frame ${activeModule === "diagnosis" ? "id-evidence-workbench" : "table-mode"}`}>
        <nav className="id-module-tabs" aria-label="报警类型" role="tablist">
          {moduleTabs.map((tab) => {
            const count = moduleCount(tab.id);
            return (
              <button
                key={tab.id}
                className={activeModule === tab.id ? "active" : ""}
                onClick={() => handleModuleChange(tab.id)}
                role="tab"
                aria-selected={activeModule === tab.id}
              >
                <span>{tab.label}{count !== null ? ` (${count})` : ""}</span>
                {tab.id === "diagnosis" && <em>试用</em>}
              </button>
            );
          })}
        </nav>

        {activeModule === "diagnosis" && !compactLayout && !maximized && (
          <div className="id-layout-toolbar" aria-label="诊断工作区布局">
            {DIAGNOSIS_PANEL_KEYS.filter((key) => diagnosisLayout.collapsed[key]).map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => restoreDiagnosisPanel(key)}
                aria-controls={DIAGNOSIS_PANEL_META[key].panelId}
                aria-expanded="false"
                data-qa={`diagnosis-restore-${key}`}
              >
                {key === "evidence" ? <IconChevronLeft size={15} /> : <IconChevronRight size={15} />}
                <span>恢复{DIAGNOSIS_PANEL_META[key].label}</span>
                {key === "queue" && <em>{counts.pending}</em>}
              </button>
            ))}
            <button type="button" className="id-layout-reset" onClick={resetDiagnosisLayout} data-qa="diagnosis-layout-reset" title="恢复三栏默认宽度与展开状态">
              <IconAdjustmentsHorizontal size={16} /><span>默认布局</span>
            </button>
          </div>
        )}

        {activeModule === "threshold" ? (
          <ThresholdAlarmView onPendingCountChange={setThresholdCount} />
        ) : activeModule === "alarm" ? (
          <SmartAlarmView />
        ) : (
        <>
        <div
          ref={layoutBodyRef}
          className="id-body"
          data-qa="diagnosis-layout"
          data-layout-mode={compactLayout ? "focus" : "desktop"}
          style={diagnosisGridStyle}
        >
          {compactLayout && (
            <div className="id-focus-tabs" role="tablist" aria-label="诊断工作区" data-qa="diagnosis-focus-tabs">
              {DIAGNOSIS_PANEL_KEYS.map((key) => (
                <button
                  type="button"
                  id={`id-focus-tab-${key}`}
                  key={key}
                  className={focusPanel === key ? "active" : ""}
                  role="tab"
                  aria-selected={focusPanel === key}
                  aria-controls={DIAGNOSIS_PANEL_META[key].panelId}
                  onClick={() => setFocusPanel(key)}
                  data-qa={`diagnosis-focus-${key}`}
                >
                  {DIAGNOSIS_PANEL_META[key].label}
                  {key === "queue" && <em>{counts.pending}</em>}
                </button>
              ))}
            </div>
          )}
          <aside
            id={DIAGNOSIS_PANEL_META.queue.panelId}
            className="id-queue-panel id-layout-panel"
            aria-label="诊断事件队列"
            aria-labelledby={compactLayout ? "id-focus-tab-queue" : undefined}
            aria-hidden={!isPanelVisible("queue")}
            role={compactLayout ? "tabpanel" : undefined}
            hidden={!isPanelVisible("queue")}
            style={panelGridStyle("queue")}
            data-collapsed={diagnosisLayout.collapsed.queue}
            data-qa="diagnosis-panel-queue"
          >
            <div className="id-status-row" role="tablist" aria-label="事件状态">
              {statusTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={activeStatus === tab.id ? "active" : ""}
                  onClick={() => handleStatusChange(tab.id)}
                  role="tab"
                  aria-selected={activeStatus === tab.id}
                >
                  <i aria-hidden="true" />
                  <span>{tab.label} ({counts[tab.id]})</span>
                </button>
              ))}
              <span className="id-status-separator" aria-hidden="true" />
              <IconFilter size={18} aria-hidden="true" />
              {!compactLayout && !maximized && (
                <button
                  type="button"
                  className="id-panel-collapse"
                  onClick={() => collapseDiagnosisPanel("queue")}
                  disabled={visiblePanelCount <= 1}
                  aria-label={visiblePanelCount <= 1 ? "事件队列不可收起，至少保留一个工作区" : "收起事件队列"}
                  aria-controls={DIAGNOSIS_PANEL_META.queue.panelId}
                  aria-expanded="true"
                  data-qa="diagnosis-collapse-queue"
                  title={visiblePanelCount <= 1 ? "至少保留一个工作区" : "收起事件队列"}
                >
                  <IconChevronLeft size={17} />
                </button>
              )}
            </div>
            {activeGroup ? (
              <div className="id-group-drilldown">
                <nav className="id-group-breadcrumb" aria-label="分组队列路径">
                  <button onClick={() => { setActiveGroupKey(""); setGroupSelectedIds([]); setBatchMenuOpen(false); }} aria-label="返回待处理队列"><IconArrowLeft size={17} />待处理</button>
                  <IconChevronRight size={14} aria-hidden="true" />
                  <strong>{activeGroup.name}</strong>
                </nav>
                <div className="id-group-summary">
                  <div><IconFiles size={19} /><span><strong>{activeGroup.name}</strong><small>{activeGroup.faultPart} · {activeGroup.children.length} 条同类报警</small></span></div>
                  <span>已选 <b>{groupSelectedIds.length}</b> 条</span>
                </div>
                <div className="id-group-batchbar">
                  <label><input type="checkbox" checked={pageSelectionComplete} onChange={togglePageSelection} /><span>本页全选</span></label>
                  <span>每页 {groupPageSize} 条</span>
                  <div className="id-batch-action" ref={batchMenuRef}>
                    <button disabled={!groupSelectedIds.length} onClick={() => setBatchMenuOpen((value) => !value)} aria-haspopup="menu" aria-expanded={batchMenuOpen}>批量处理<IconChevronDown size={15} /></button>
                    {batchMenuOpen && groupSelectedIds.length > 0 && (
                      <div className="id-batch-menu" role="menu">
                        <button role="menuitem" onClick={() => openAction("defect", groupSelectedIds)}><IconSparkles size={16} />生成缺陷</button>
                        <button role="menuitem" onClick={() => openAction("close", groupSelectedIds)}><IconX size={16} />关闭</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="id-group-event-list" aria-live="polite">
                  {groupPageEvents.map((item) => (
                    <article className={`id-group-event-row ${item.id === selectedId ? "selected" : ""}`} key={item.id}>
                      <label className="id-group-checkbox"><input type="checkbox" checked={groupSelectedIds.includes(item.id)} onChange={() => toggleGroupSelection(item.id)} /><span className="id-sr-only">选择{item.title}</span></label>
                      <button className="id-group-event-main" onClick={() => handleCaseSelect(item.id)} aria-pressed={item.id === selectedId}>
                        <span><strong>{item.location}{item.faultType}</strong><small>{item.measurementPoint}</small></span>
                        <span className="id-group-event-meta"><em className={`id-level id-level-${levelClass(item.level)}`}>{item.level}级1</em><time>{item.time}</time><b>{item.probability}%</b></span>
                      </button>
                    </article>
                  ))}
                </div>
                <footer className="id-group-pagination" aria-label="分组报警分页">
                  <span>{(safeGroupPage - 1) * groupPageSize + 1}–{Math.min(safeGroupPage * groupPageSize, activeGroupEvents.length)} / {activeGroupEvents.length}</span>
                  <div><button disabled={safeGroupPage === 1} onClick={() => setGroupPage((page) => Math.max(1, page - 1))} aria-label="上一页"><IconChevronLeft size={17} /></button><b>{safeGroupPage}/{groupTotalPages}</b><button disabled={safeGroupPage === groupTotalPages} onClick={() => setGroupPage((page) => Math.min(groupTotalPages, page + 1))} aria-label="下一页"><IconChevronRight size={17} /></button></div>
                </footer>
              </div>
            ) : (
              <>
                <div className="id-queue-tools">
                  <label>
                    <IconSearch size={16} aria-hidden="true" />
                    <span className="id-sr-only">搜索诊断事件</span>
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="搜索事件、设备或编码"
                    />
                    {query && <button onClick={() => setQuery("")} aria-label="清空搜索"><IconX size={14} /></button>}
                  </label>
                  <button
                    className={sortNewest ? "active" : ""}
                    onClick={() => setSortNewest((value) => !value)}
                    aria-label={sortNewest ? "当前按时间倒序，点击改为正序" : "当前按时间正序，点击改为倒序"}
                    title={sortNewest ? "时间倒序" : "时间正序"}
                  >
                    <IconSortAscending size={17} />
                  </button>
                </div>
                <div className="id-case-list" aria-live="polite">
                  {queueEntries.map((entry) => entry.kind === "group"
                    ? <GroupCard key={`group-${entry.group.key}`} group={entry.group} onOpen={openGroup} />
                    : <CaseCard key={entry.item.id} item={entry.item} selected={entry.item.id === selectedId} onSelect={handleCaseSelect} />)}
                  {!queueEntries.length && (
                    <div className="id-empty-list">
                      <IconSearch size={28} />
                      <strong>暂无匹配事件</strong>
                      <span>调整状态或搜索条件后重试</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>

          {selectedCase && selectedEvidence ? (
          <section
            id={DIAGNOSIS_PANEL_META.verification.panelId}
            className="id-diagnosis-panel id-layout-panel"
            aria-label="诊断结论"
            aria-labelledby={compactLayout ? "id-focus-tab-verification" : undefined}
            aria-hidden={!isPanelVisible("verification")}
            role={compactLayout ? "tabpanel" : undefined}
            hidden={!isPanelVisible("verification")}
            style={panelGridStyle("verification")}
            data-collapsed={diagnosisLayout.collapsed.verification}
            data-qa="diagnosis-panel-verification"
          >
            <header className="id-device-header">
              <div className="id-device-context" title={selectedOperation ? `${selectedOperation.displayId} · ${selectedOperation.devicePath} · ${selectedOperation.time}` : undefined}>
                {selectedOperation && <span className="id-linked-event-code">{selectedOperation.displayId} · {selectedOperation.title}</span>}
                <strong>{selectedCase.device}</strong><span aria-hidden="true">/</span><span>{selectedCase.code}</span><span aria-hidden="true">/</span><span>{selectedCase.location}</span>
                {selectedOperation && <em className={`status-${selectedLinkedEvent?.status || "pending"}`}>{operationStatusLabel(selectedLinkedEvent?.status)}</em>}
                {selectedOperation && selectedLinkedEvent?.defectId && <span className="id-linked-result">缺陷 {selectedLinkedEvent.defectId}</span>}
              </div>
              <nav className="id-device-view-actions" aria-label="诊断详情视图">
                <button className={activeDetailTab !== "treatment" ? "active" : ""} onClick={() => setActiveDetailTab("conclusion")}>证据核查</button>
                <button className={activeDetailTab === "treatment" ? "active" : ""} onClick={() => setActiveDetailTab("treatment")}>处理记录{selectedCase.treatmentRecords?.length ? ` (${selectedCase.treatmentRecords.length})` : ""}</button>
                <button className="id-guide-trigger" onClick={() => setGuideOpen(true)} title="重新查看首次使用引导" aria-label="使用引导"><IconInfoCircle size={16} /></button>
                {!compactLayout && !maximized && (
                  <button
                    type="button"
                    className="id-panel-collapse"
                    onClick={() => collapseDiagnosisPanel("verification")}
                    disabled={visiblePanelCount <= 1}
                    aria-label={visiblePanelCount <= 1 ? "证据核查不可收起，至少保留一个工作区" : "收起证据核查"}
                    aria-controls={DIAGNOSIS_PANEL_META.verification.panelId}
                    aria-expanded="true"
                    data-qa="diagnosis-collapse-verification"
                    title={visiblePanelCount <= 1 ? "至少保留一个工作区" : "收起证据核查"}
                  >
                    <IconChevronLeft size={17} />
                  </button>
                )}
              </nav>
            </header>
            <div className="id-diagnosis-scroll">
              {activeDetailTab === "conclusion" && <>
                <OverviewCard item={selectedCase} onOpenEvidence={() => handleEvidenceSelect(selectedCase.evidences[0].id)} />
                <VerificationSummary item={selectedCase} evidence={selectedEvidence} />
                <KeyEvidencePanel item={selectedCase} evidence={selectedEvidence} onSelectEvidence={handleEvidenceSelect} onSupplementEvidence={openEvidenceSupplement} />
                {selectedCase.evidences.length > 1 && (
                  <div className="id-evidence-switcher" aria-label="证据来源">
                    <span>证据来源</span>
                    {selectedCase.evidences.map((evidence, index) => (
                      <button type="button" key={evidence.id} className={selectedEvidence.id === evidence.id ? "active" : ""} onClick={() => handleEvidenceSelect(evidence.id)}>{index + 1}. {evidence.source.replace(`${selectedCase.location}-`, "")}</button>
                    ))}
                  </div>
                )}
                <InlineAdvice item={selectedCase} />
                {selectedCase.status === "closed" && selectedCase.closeReason && (
                  <div className="id-closed-note"><IconCheck size={17} /><span><b>关闭原因：</b>{selectedCase.closeReason}</span></div>
                )}
              </>}
              {activeDetailTab === "treatment" && <TreatmentRecords records={selectedCase.treatmentRecords} />}
            </div>
          </section>
          ) : (
            <section
              id={DIAGNOSIS_PANEL_META.verification.panelId}
              className="id-diagnosis-panel id-empty-panel id-layout-panel"
              aria-label="诊断结论"
              aria-labelledby={compactLayout ? "id-focus-tab-verification" : undefined}
              aria-hidden={!isPanelVisible("verification")}
              role={compactLayout ? "tabpanel" : undefined}
              hidden={!isPanelVisible("verification")}
              style={panelGridStyle("verification")}
              data-collapsed={diagnosisLayout.collapsed.verification}
              data-qa="diagnosis-panel-verification"
            ><EmptyDetail /></section>
          )}

          {selectedCase && selectedEvidence ? (
          <section
            id={DIAGNOSIS_PANEL_META.evidence.panelId}
            className={`id-evidence-panel id-layout-panel ${maximized ? "maximized" : ""}`}
            aria-label="证据详情"
            aria-labelledby={compactLayout ? "id-focus-tab-evidence" : undefined}
            aria-hidden={!isPanelVisible("evidence")}
            role={compactLayout ? "tabpanel" : undefined}
            hidden={!isPanelVisible("evidence")}
            style={panelGridStyle("evidence")}
            data-collapsed={diagnosisLayout.collapsed.evidence}
            data-qa="diagnosis-panel-evidence"
          >
            <header className="id-evidence-title" data-qa="diagnosis-evidence-header">
              <div className="id-evidence-title-copy" data-qa="diagnosis-evidence-title-copy"><b>{selectedCase.evidences.findIndex((item) => item.id === selectedEvidence.id) + 1}.1</b><span title={selectedEvidence.title}>{selectedEvidence.title}</span></div>
              <div className="id-evidence-header-actions" data-qa="diagnosis-evidence-header-actions">
                {selectedCase.linkedEventId && <a href={operationHref("/video-monitoring", selectedCase.linkedEventId)} aria-label="视频复核" title="视频复核" data-qa="diagnosis-video-review-link"><span>视频复核</span><IconExternalLink size={15} /></a>}
                <a href={analysisHref(selectedCase)} aria-label={selectedCase.category === "roller" ? "进入托辊组分析" : "进入音视频分析"} title={selectedCase.category === "roller" ? "进入托辊组分析" : "进入音视频分析"} data-qa="diagnosis-analysis-link"><span>{selectedCase.category === "roller" ? "进入托辊组分析" : "进入音视频分析"}</span><IconExternalLink size={15} /></a>
                {selectedCase.stationCode && <a href={selectedCase.linkedEventId ? operationHref("/collection-stations", selectedCase.linkedEventId, { station: selectedCase.stationCode, case: selectedCase.id }) : moduleHref("/collection-stations", { station: selectedCase.stationCode, case: selectedCase.id })} aria-label="采集站配置" title="采集站配置" data-qa="diagnosis-station-link"><span>采集站配置</span><IconExternalLink size={15} /></a>}
                <div className="id-evidence-nav" aria-label="切换证据" data-qa="diagnosis-evidence-nav"><button disabled={selectedCase.evidences.findIndex((item) => item.id === selectedEvidence.id) === 0} onClick={() => navigateEvidence(-1)} aria-label="上一项证据"><IconChevronLeft size={16} /></button><button disabled={selectedCase.evidences.findIndex((item) => item.id === selectedEvidence.id) === selectedCase.evidences.length - 1} onClick={() => navigateEvidence(1)} aria-label="下一项证据"><IconChevronRight size={16} /></button></div>
                <div className="id-chart-actions" data-qa="diagnosis-trend-actions">
                  <button onClick={resetTrend} aria-label="复位证据趋势" title="复位"><IconRefresh size={17} /></button>
                  <button onClick={exportEvidence} aria-label="导出证据数据" title="导出趋势数据"><IconFileExport size={17} /></button>
                  <button onClick={() => setMaximized((value) => !value)} aria-label={maximized ? "退出最大化" : "最大化证据区"} title={maximized ? "退出最大化" : "最大化证据区"}><IconMaximize size={17} /></button>
                  {!compactLayout && !maximized && (
                    <button
                      type="button"
                      className="id-panel-collapse"
                      onClick={() => collapseDiagnosisPanel("evidence")}
                      disabled={visiblePanelCount <= 1}
                      aria-label={visiblePanelCount <= 1 ? "现场证据不可收起，至少保留一个工作区" : "收起现场证据"}
                      aria-controls={DIAGNOSIS_PANEL_META.evidence.panelId}
                      aria-expanded="true"
                      data-qa="diagnosis-collapse-evidence"
                      title={visiblePanelCount <= 1 ? "至少保留一个工作区" : "收起现场证据"}
                    >
                      <IconChevronRight size={17} />
                    </button>
                  )}
                </div>
              </div>
            </header>
            <div className="id-evidence-stamp" data-qa="diagnosis-evidence-stamp"><span>趋势范围 {evidenceRange(selectedEvidence)}</span><small>报警时刻 {selectedEvidence.stamp}</small></div>
            <section className="id-trend-panel" aria-label="诊断趋势" data-qa="diagnosis-trend-panel">
              <TrendChart evidence={selectedEvidence} hoveredIndex={hoveredPoint} selectedIndex={selectedPointIndex} onHover={setHoveredPoint} onSelect={handlePointSelect} />
            </section>
            <section className={`id-image-panel ${selectedEvidencePoint?.hasAttachment ? "" : "empty"}`} aria-label="现场附件" data-qa="diagnosis-attachment-panel">
              <header data-qa="diagnosis-attachment-header">
                <div className="id-attachment-title"><IconPaperclip size={17} /><span>现场附件 · 图像识别</span></div>
                <small>{selectedEvidencePoint?.time || selectedEvidence.stamp} · {selectedEvidencePoint?.hasAttachment ? `${attachmentIndex + 1}/${availableAttachmentCount}` : selectedEvidencePoint?.state}</small>
                <div className="id-attachment-actions" data-qa="diagnosis-attachment-actions">
                  {availableAttachmentCount > 1 && <div className="id-attachment-nav"><button disabled={attachmentIndex === 0} onClick={() => setAttachmentIndex((index) => Math.max(0, index - 1))} aria-label="上一个附件"><IconChevronLeft size={16} /></button><button disabled={attachmentIndex >= availableAttachmentCount - 1} onClick={() => setAttachmentIndex((index) => Math.min(availableAttachmentCount - 1, index + 1))} aria-label="下一个附件"><IconChevronRight size={16} /></button></div>}
                  <button onClick={downloadAttachment} disabled={!selectedEvidencePoint?.hasAttachment} aria-label="下载现场附件" title="下载现场附件"><IconDownload size={17} /></button>
                  <button onClick={() => setMaximized((value) => !value)} aria-label={maximized ? "退出全屏" : "全屏查看证据"} title={maximized ? "退出全屏" : "全屏查看证据"}><IconMaximize size={17} /></button>
                </div>
              </header>
              {selectedEvidencePoint?.hasAttachment ? <div className="id-image-stage" data-qa="diagnosis-attachment-stage">
                <img src={selectedAttachmentImage} alt={`${selectedCase.device}${selectedEvidence.description}现场证据附件${attachmentIndex + 1}`} />
                <span className="id-camera-label">Camera {String(attachmentIndex + 1).padStart(2, "0")}</span>
                <time className="id-camera-time">{selectedEvidencePoint.time}</time>
              </div> : <div className="id-attachment-empty"><IconPhotoOff size={36} /><strong>未检测到附件</strong><span>该时刻算法未上传现场附件</span><small>{selectedEvidencePoint?.time} · {selectedEvidencePoint?.state}</small></div>}
            </section>
          </section>
          ) : (
            <section
              id={DIAGNOSIS_PANEL_META.evidence.panelId}
              className="id-evidence-panel id-empty-panel id-layout-panel"
              aria-label="证据详情"
              aria-labelledby={compactLayout ? "id-focus-tab-evidence" : undefined}
              aria-hidden={!isPanelVisible("evidence")}
              role={compactLayout ? "tabpanel" : undefined}
              hidden={!isPanelVisible("evidence")}
              style={panelGridStyle("evidence")}
              data-collapsed={diagnosisLayout.collapsed.evidence}
              data-qa="diagnosis-panel-evidence"
            ><EmptyDetail evidence /></section>
          )}
          {!compactLayout && !maximized && desktopSplitterPairs.map(renderDiagnosisSplitter)}
          <footer className="id-bottom-actions" style={bottomActionGridStyle} data-qa="diagnosis-actions">
            <div>
              {selectedCase && selectedVerification
                ? selectedVerification.missingCount
                  ? <><span className="id-verification-gap"><IconAlertTriangle size={20} />{selectedVerification.hasCriticalGap ? `缺少 ${selectedVerification.criticalGapCount} 项关键证据` : `待补 ${selectedVerification.missingCount} 项证据`}{selectedVerification.hasCriticalGap && selectedCase.status === "pending" && <button type="button" className="id-footer-evidence-action" onClick={openEvidenceSupplement}>补充证据</button>}</span><small>待补证 · {selectedCase.time}</small></>
                  : <><span><IconCheck size={20} />已核验 {selectedVerification.verifiedCount} 项关键证据</span><small>{statusTabs.find((item) => item.id === selectedCase.status)?.label} · {selectedCase.time}</small></>
                : <><span>当前队列暂无事件</span><small>请切换处理状态或调整筛选条件</small></>}
            </div>
            <button
              className="id-secondary-button id-close-action"
              onClick={() => selectedCase && openAction("close", [selectedCase.id])}
              disabled={!selectedCase || selectedCase.status !== "pending"}
              data-qa="diagnosis-close-case"
            >
              <IconX size={17} />填写原因并关闭
            </button>
            <button
              className="id-primary-button"
              onClick={() => selectedCase && openAction("defect", [selectedCase.id])}
              disabled={!selectedCase || selectedCase.status !== "pending" || selectedVerification?.hasCriticalGap}
              title={selectedVerification?.hasCriticalGap ? "缺少关键证据，请先补充" : "生成缺陷"}
              data-qa="diagnosis-generate-defect"
            >
              <IconSparkles size={17} />生成缺陷
            </button>
          </footer>
        </div>

        {guideOpen && (
          <aside className="id-first-guide" role="dialog" aria-label="智能诊断首次使用引导">
            <header><div><IconSparkles size={18} /><strong>智能诊断使用引导</strong></div><button onClick={closeGuide} aria-label="关闭使用引导"><IconX size={17} /></button></header>
            <ol><li><b>1</b><span><strong>定位同类故障</strong><small>托辊同类报警会自动分组，点击分组查看具体位置。</small></span></li><li><b>2</b><span><strong>核查结论与证据</strong><small>点击趋势点联动现场附件，空心点表示没有附件。</small></span></li><li><b>3</b><span><strong>完成业务处置</strong><small>单条或批量生成缺陷、关闭，处理结果逐条留痕。</small></span></li></ol>
            <footer><button className="id-primary-button" onClick={closeGuide}>开始使用</button></footer>
          </aside>
        )}

        {modalType && modalEvents.length > 0 && (
          <ConfirmationModal
            type={modalType}
            events={modalEvents}
            reason={closeReason}
            onReasonChange={(value) => setCloseReason(value.slice(0, 120))}
            defectDraft={defectDraft}
            onDefectDraftChange={(field, value) => setDefectDraft((current) => ({ ...current, [field]: value }))}
            activeTab={modalTab}
            onTabChange={setModalTab}
            onCancel={() => { setModalType(null); setModalEventIds([]); setCloseReason(""); setDefectDraft({}); setModalTab("info"); }}
            onConfirm={confirmModal}
          />
        )}
        {evidenceModalOpen && selectedCase?.criticalEvidenceGap && (
          <EvidenceSupplementModal
            item={selectedCase}
            draft={evidenceDraft}
            onDraftChange={(field, value) => setEvidenceDraft((current) => ({ ...current, [field]: value }))}
            onCancel={closeEvidenceSupplement}
            onConfirm={confirmEvidenceSupplement}
          />
        )}
        {toast && (
          <div className={`id-toast ${toast.type}`} role="status" key={toast.key}>
            {toast.type === "error" ? <IconAlertTriangle size={17} /> : <IconCheck size={17} />}
            <span>{toast.message}</span>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
