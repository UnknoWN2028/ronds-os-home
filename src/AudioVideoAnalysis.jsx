import { useEffect, useMemo, useRef, useState } from "react";
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
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import conveyorImage from "./assets/conveyor-belt.jpg";
import coalFlowImage from "./assets/monitor-material-off-center.png";
import personnelSafetyImage from "./assets/monitor-east-entrance-intrusion.png";
import { LINKED_OPERATION, LINKED_OPERATIONS, operationHref, operationStatusLabel, resolveOperation, resolveOperationByAnalysisPoint, resolveOperationByAnalysisSelection, useOperations } from "./operations-context.jsx";
import "./audio-video-analysis.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (value, size = 2) => String(value).padStart(size, "0");
const formatDateInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const today = new Date();
const defaultEndDate = formatDateInput(today);
const defaultStartDate = formatDateInput(new Date(today.getTime() - 14 * DAY_MS));
const formatClock = (date = new Date()) => `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

function parseDateInput(value, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function inclusiveDateDays(startDate, endDate) {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate, true);
  return start && end ? Math.floor((end - start) / DAY_MS) + 1 : Number.NaN;
}

function getPresetRange(days, anchorDate = defaultEndDate) {
  const end = parseDateInput(anchorDate);
  if (!end) return { startDate: "", endDate: "" };
  return {
    startDate: formatDateInput(new Date(end.getTime() - (days - 1) * DAY_MS)),
    endDate: anchorDate,
  };
}

function formatRangeText(startDate, endDate, compact = false) {
  if (!startDate || !endDate) return "日期未完整";
  return compact ? `${startDate.slice(5)} 至 ${endDate.slice(5)}` : `${startDate} 至 ${endDate}`;
}

const metrics = [
  { id: "deviation", label: "皮带跑偏", group: "视觉算法", kind: "observation", yLabels: ["4级", "3级", "2级", "1级", "正常"], min: 0, max: 4 },
  { id: "alignment", label: LINKED_OPERATION.analysisMetricName, group: "视觉算法", kind: "observation", yLabels: [LINKED_OPERATION.analysisMetricName, "运行正常"], min: 0, max: 1 },
  { id: "helmet", label: "安全帽状态", group: "视觉算法", kind: "observation", yLabels: ["未带安全帽", "正常"], min: 0, max: 1 },
  { id: "intrusion", label: "人员闯入", group: "视觉算法", kind: "observation", yLabels: ["人员闯入", "运行正常"], min: 0, max: 1 },
  { id: "counterweight", label: "重锤皮带状态", group: "视觉算法", kind: "observation", yLabels: ["状态异常", "运行正常"], min: 0, max: 1 },
  { id: "smoke", label: "火情识别", group: "视觉算法", kind: "observation", yLabels: ["烟雾火情", "运行正常"], min: 0, max: 1 },
  { id: "drumSurface", label: "滚筒表面异常", group: "视觉算法", kind: "observation", yLabels: ["表面异常", "运行正常"], min: 0, max: 1 },
  { id: "decibel", label: "分贝指标", group: "音频算法", kind: "numeric", unit: "dB", yLabels: ["80", "60", "40", "20"], min: 20, max: 80 },
];

const baseSeries = {
  deviation: [1.8, 2.2, 1.2, 3.4, 1.2, 2.2, 1.2, 2.2, 1.2, 2.2, 3.4, 3.4, 3.4, 1.2, 1.2, 3.4],
  alignment: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  helmet: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  intrusion: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  counterweight: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  smoke: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  drumSurface: [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  decibel: [42, 68, 45, 64, 66, 62, 58, 61, 63, 59, 67, 69, 65, 48, 76, 54],
};

const CHART_SAMPLE_COUNT = baseSeries.deviation.length;
const MIN_CHART_VISIBLE_SAMPLES = 4;
const EVIDENCE_PANE_MIN_WIDTH = 184;
const EVIDENCE_PANE_MAX_WIDTH = 420;
const EVIDENCE_PANE_DEFAULT_WIDTH = 228;
const EVIDENCE_PANE_COMPACT_WIDTH = 196;
const EVIDENCE_PANE_KEYBOARD_STEP = 16;
const EVIDENCE_PLOT_MIN_WIDTH = 360;
const fullChartViewport = () => ({ start: 0, end: CHART_SAMPLE_COUNT - 1 });
const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));
const defaultEvidencePaneWidth = () => typeof window !== "undefined" && window.innerWidth <= 1600 ? EVIDENCE_PANE_COMPACT_WIDTH : EVIDENCE_PANE_DEFAULT_WIDTH;

function normalizeChartViewport(viewport, total = CHART_SAMPLE_COUNT) {
  const lastIndex = Math.max(0, total - 1);
  const minimumSpan = Math.min(lastIndex, MIN_CHART_VISIBLE_SAMPLES - 1);
  let start = clampNumber(Math.round(viewport?.start ?? 0), 0, lastIndex);
  let end = clampNumber(Math.round(viewport?.end ?? lastIndex), start, lastIndex);
  if (end - start < minimumSpan) {
    end = Math.min(lastIndex, start + minimumSpan);
    start = Math.max(0, end - minimumSpan);
  }
  return { start, end };
}

function chartViewportsEqual(first, second) {
  return first.start === second.start && first.end === second.end;
}

function zoomChartViewport(viewport, direction, anchorIndex, total = CHART_SAMPLE_COUNT) {
  const current = normalizeChartViewport(viewport, total);
  const currentCount = current.end - current.start + 1;
  const targetCount = direction === "in"
    ? Math.max(MIN_CHART_VISIBLE_SAMPLES, Math.floor(currentCount / 1.28))
    : Math.min(total, Math.ceil(currentCount * 1.28));
  if (targetCount === currentCount) return current;
  const currentSpan = Math.max(1, currentCount - 1);
  const anchor = clampNumber(Number.isFinite(anchorIndex) ? anchorIndex : (current.start + current.end) / 2, current.start, current.end);
  const anchorRatio = (anchor - current.start) / currentSpan;
  const maxStart = Math.max(0, total - targetCount);
  const start = clampNumber(Math.round(anchor - anchorRatio * (targetCount - 1)), 0, maxStart);
  return { start, end: start + targetCount - 1 };
}

function shiftChartViewport(viewport, deltaIndexes, total = CHART_SAMPLE_COUNT) {
  const current = normalizeChartViewport(viewport, total);
  const count = current.end - current.start + 1;
  const start = clampNumber(Math.round(current.start + deltaIndexes), 0, Math.max(0, total - count));
  return { start, end: start + count - 1 };
}

const attachmentMissingReasonByMetric = {
  deviation: { 0: "not-triggered", 10: "generation-failed" },
  alignment: { 5: "device-offline" },
  helmet: {},
  decibel: { 15: "expired" },
};
const attachmentVisualSources = {
  deviation: conveyorImage,
  alignment: coalFlowImage,
  helmet: personnelSafetyImage,
};

const pointCatalog = {
  belt: { code: LINKED_OPERATION.analysisPointCode, label: LINKED_OPERATION.analysisPointName, type: "video", path: LINKED_OPERATION.analysisPath, metrics: metrics.map((metric) => metric.id), sample: { metricId: LINKED_OPERATION.analysisMetric, index: 14 } },
  "500a": { code: "VD-BELT-500A", label: "310B机尾纵撕状态", type: "video", path: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 机尾段 / 纵撕状态监测", metrics: metrics.map((metric) => metric.id), sample: { metricId: "alignment", index: 9 } },
  "100": { code: "VD-BELT-100", label: "310B转弯段皮带状态", type: "video", path: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 100m转弯处 / 皮带状态监测", metrics: metrics.map((metric) => metric.id), sample: { metricId: "deviation", index: 3 } },
  "500b": { code: "VD-BELT-500B", label: "310B中段人员安全监测", type: "video", path: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 中段巡检通道 / 人员安全监测", metrics: metrics.map((metric) => metric.id), sample: { metricId: "helmet", index: 1 } },
  "line-test": { code: "AU-LINE-001", label: "碎煤机室声学测点", type: "audio", path: "示范火电厂 / 输煤系统 / 碎煤机室 / 1号碎煤机 / 声学监测", metrics: ["decibel"], sample: { metricId: "decibel", index: 14 } },
  alarm: { code: "AU-BELT-880", label: "310B驱动滚筒声学测点", type: "audio", path: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 驱动滚筒 / 声学监测", metrics: ["decibel"], sample: { metricId: "decibel", index: 14 } },
  "upper-roller": { code: "VD-ROLLER-001", label: "310B上排托辊状态", type: "video", path: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 上托辊组 / 视觉状态监测", metrics: metrics.map((metric) => metric.id), sample: { metricId: "helmet", index: 1 } },
  "east-entrance": { code: "VD-ENTRY-001", label: "2号转运站东侧入口人员监测", type: "video", path: "示范火电厂 / 输煤系统 / 2号转运站 / 东侧入口 / 人员闯入监测", metrics: ["intrusion"], sample: { metricId: "intrusion", index: 14 } },
  "material-97": { code: "VD-MATERIAL-097", label: "310A机头煤流状态", type: "video", path: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头落料段 / 煤流状态监测", metrics: ["alignment"], sample: { metricId: "alignment", index: 14 } },
  "counterweight-98": { code: "VD-HAMMER-098", label: "310A重锤区皮带状态", type: "video", path: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 重锤张紧区 / 皮带状态监测", metrics: ["counterweight"], sample: { metricId: "counterweight", index: 14 } },
  "corridor-smoke": { code: "VD-SMOKE-001", label: "1号输煤廊道烟火监测", type: "video", path: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段顶部 / 烟火监测", metrics: ["smoke"], sample: { metricId: "smoke", index: 14 } },
  "belt-97": { code: "VD-BELT-097", label: "310A机头皮带跑偏监测", type: "video", path: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头落料段 / 皮带跑偏监测", metrics: ["deviation"], sample: { metricId: "deviation", index: 14 } },
  "drum-98": { code: "VD-DRUM-098", label: "310A驱动滚筒表面监测", type: "video", path: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 驱动滚筒 / 表面状态监测", metrics: ["drumSurface"], sample: { metricId: "drumSurface", index: 14 } },
  "roller-audio": { code: "AU-ROLLER-011", label: "1号输煤廊道托辊声学测点", type: "audio", path: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段托辊组 / 声学监测", metrics: ["decibel"], sample: { metricId: "decibel", index: 14 } },
};

function analysisQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const hashQueryIndex = window.location.hash.indexOf("?");
  if (hashQueryIndex >= 0) {
    const hashParams = new URLSearchParams(window.location.hash.slice(hashQueryIndex + 1));
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  return params;
}

function parseAlarmTime(value) {
  if (!value) return null;
  const normalized = value.trim().replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function alarmSampleIndex(metric, alarmTime, startDate, endDate) {
  const values = baseSeries[metric.id] || [];
  const alarmIndexes = values
    .map((value, index) => (isAlarmPoint(metric, value) ? index : -1))
    .filter((index) => index >= 0);
  if (!alarmIndexes.length) return 0;

  return alarmIndexes.reduce((closest, index) => {
    const sampleDistance = Math.abs(sampleDateTime(index, startDate, endDate).getTime() - alarmTime.getTime());
    const closestDistance = Math.abs(sampleDateTime(closest, startDate, endDate).getTime() - alarmTime.getTime());
    return sampleDistance < closestDistance ? index : closest;
  }, alarmIndexes[0]);
}

function readAnalysisDeepLink() {
  const params = analysisQueryParams();
  const linkedOperation = resolveOperation(params.get("event"));
  const requestedPoint = linkedOperation?.analysisPoint || params.get("point");
  const pointId = pointCatalog[requestedPoint]
    ? requestedPoint
    : Object.keys(pointCatalog).find((id) => pointCatalog[id].code === requestedPoint);
  const metricId = linkedOperation?.analysisMetric || params.get("metric");
  const alarmTime = parseAlarmTime(linkedOperation?.timeWithMillis?.replace(" ", "T") || params.get("alarmTime"));
  const point = pointCatalog[pointId];
  const metric = metrics.find((item) => item.id === metricId);

  if (!point || !metric || !point.metrics.includes(metric.id) || !alarmTime) return null;
  if (alarmTime.getTime() > parseDateInput(defaultEndDate, true).getTime()) return null;

  const requestedDays = Number.parseInt(params.get("days") || "15", 10);
  const days = Number.isFinite(requestedDays) && requestedDays > 0 ? Math.min(30, requestedDays) : 15;
  const endDate = formatDateInput(alarmTime);
  const startDate = formatDateInput(new Date(alarmTime.getTime() - (days - 1) * DAY_MS));

  return {
    pointId,
    metricId: metric.id,
    startDate,
    endDate,
    sample: { metricId: metric.id, index: alarmSampleIndex(metric, alarmTime, startDate, endDate) },
    linkedEventId: linkedOperation?.id || "",
    stationCode: linkedOperation?.stationCode || "",
    cameraId: linkedOperation?.cameraId || "",
  };
}

const CHART_EXPORT_STYLE = ".plot-grid{stroke:#cfd4da;stroke-width:1;stroke-dasharray:6 5}.plot-guide{stroke:#3e78f6;stroke-width:1;stroke-dasharray:3 2}.plot-alarm-line{stroke:#ef3f4c;stroke-width:1.2;stroke-dasharray:7 4}.plot-line{fill:none;stroke:#3679fa;stroke-width:1.2}.plot-point.empty{fill:#fff;stroke:#3679fa;stroke-width:1.4}.plot-point.attached{fill:#3679fa;stroke:#3679fa}.plot-point.alarm{fill:#f04444;stroke:#f04444}.plot-point.selected{stroke:#172e4c;stroke-width:2.2}.plot-point.false-signal{opacity:.38}.plot-y-label,.plot-x-label{fill:#353d46;font:12px Microsoft YaHei,Arial,sans-serif}.plot-x-label{fill:#6f7780}.plot-marker-ring{fill:none;stroke:#f0a21a;stroke-width:2;stroke-dasharray:3 2}";

function sampleDateTime(index, startDate, endDate) {
  if (index === 14 && endDate === LINKED_OPERATION.time.slice(0, 10)) {
    return new Date(`${LINKED_OPERATION.time.replace(" ", "T")}.000`);
  }
  const rangeStart = new Date(`${startDate}T08:00:18.111`);
  const rangeEnd = new Date(`${endDate}T15:26:18.666`);
  const lastIndex = Math.max(1, baseSeries.deviation.length - 1);
  const ratio = Math.min(1, Math.max(0, index / lastIndex));
  return new Date(rangeStart.getTime() + (rangeEnd.getTime() - rangeStart.getTime()) * ratio);
}

function sampleTime(index, startDate, endDate) {
  const value = sampleDateTime(index, startDate, endDate);
  return `${formatDateInput(value)} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}.${pad(value.getMilliseconds(), 3)}`;
}

function sampleAxisLabel(index, startDate, endDate, compact = false) {
  const value = sampleTime(index, startDate, endDate);
  if (!compact) return value.slice(5, 16);
  return startDate === endDate ? value.slice(11, 16) : value.slice(5, 10);
}

function sampleIdentity(pointId, metricId, index, startDate, endDate) {
  return `${pointId}|${metricId}|${sampleTime(index, startDate, endDate)}`;
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return `${pad(Math.floor(safeSeconds / 60))}:${pad(Math.floor(safeSeconds % 60))}`;
}

function trapDialogFocus(event) {
  if (event.key !== "Tab") return;
  const focusable = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
}

function displayValue(metric, value) {
  if (metric.id === "deviation") return value === 0 ? "正常" : `${Math.round(value)}级`;
  if (metric.id === "alignment") return value >= 1 ? "煤流不对中" : "运行正常";
  if (metric.id === "helmet") return value >= 1 ? "未带安全帽" : "正常";
  if (metric.kind === "observation") return value >= 1 ? metric.label : "运行正常";
  return `${value.toFixed(1)} ${metric.unit}`;
}

function getAttachment(metricId, index) {
  if (attachmentMissingReasonByMetric[metricId]?.[index]) return null;
  if (metricId === "decibel") return { type: "waveform", count: 1 };
  if (index === 9) return { type: "video", count: 1 };
  return { type: "image", count: 1 };
}

function getAttachmentMissingReason(metricId, index) {
  const code = attachmentMissingReasonByMetric[metricId]?.[index];
  const isAudio = metricId === "decibel";
  if (code === "not-triggered") {
    return {
      code,
      label: isAudio ? "未触发录音" : "未触发抓拍",
      statusLabel: "策略未触发",
      detail: isAudio ? "当前时刻未达到自动录音留证条件" : "当前时刻未达到自动抓拍留证条件",
    };
  }
  if (code === "device-offline") {
    return {
      code,
      label: "设备离线",
      statusLabel: "采集失败",
      detail: isAudio ? "采样时刻拾音设备离线，未生成异音波形" : "采样时刻关联摄像机离线，未生成现场图像",
    };
  }
  if (code === "generation-failed") {
    return {
      code,
      label: "生成失败",
      statusLabel: "处理失败",
      detail: isAudio ? "波形文件生成失败，算法分析结果仍已保留" : "抓拍文件生成失败，算法分析结果仍已保留",
    };
  }
  if (code === "expired") {
    return {
      code,
      label: "附件已过期",
      statusLabel: "已清理",
      detail: isAudio ? "录音与波形已超过保留期限，原始文件已清理" : "图像或视频已超过保留期限，原始文件已清理",
    };
  }
  return {
    code: "unavailable",
    label: "附件状态异常",
    statusLabel: "状态异常",
    detail: "附件状态暂不可用，请稍后刷新查看",
  };
}

function isAlarmPoint(metric, value) {
  if (metric.id === "deviation") return value >= 3;
  if (metric.id === "alignment" || metric.id === "helmet") return value >= 1;
  if (metric.id === "decibel") return value >= 70;
  if (metric.kind === "observation") return value >= 1;
  return false;
}

function getAlarmText(metric, value, index) {
  if (!isAlarmPoint(metric, value)) return null;
  if (index === 14) return { title: "报警处理结果", detail: "现场查验正常，已完成关联处理" };
  const descriptions = {
    deviation: "皮带跑偏达到3级，报警待处理",
  alignment: "检测到煤流不对中，报警待处理",
    helmet: "检测到未佩戴安全帽，报警待处理",
    decibel: "现场分贝超过70dB，报警待处理",
  };
  return { title: "故障描述", detail: descriptions[metric.id] || `检测到${metric.label}，报警待处理` };
}

function pointHasAlarm(point) {
  return point.metrics.some((metricId) => {
    const metric = metrics.find((item) => item.id === metricId);
    return metric && (baseSeries[metricId] || []).some((value) => isAlarmPoint(metric, value));
  });
}

function ToolRail({ cursorActive, onToggleCursor, onReset, metricLabel, disabled, resetDisabled }) {
  return (
    <div className="plot-tool-rail" role="toolbar" aria-label={`${metricLabel}图表工具`}>
      <button className={cursorActive ? "active" : ""} aria-label={cursorActive ? "关闭同步游标" : "开启同步游标"} aria-pressed={cursorActive} disabled={disabled} title={disabled ? "查询完成后可切换同步游标" : cursorActive ? "关闭同步游标" : "开启同步游标"} onClick={onToggleCursor}><IconChartLine size={18} /></button>
      <button aria-label={`恢复${metricLabel}趋势全览`} disabled={disabled || resetDisabled} title={disabled ? "查询完成后可恢复全览" : resetDisabled ? "当前已是全览" : "恢复全览并同步其他趋势图"} onClick={onReset}><IconRefresh size={17} /></button>
    </div>
  );
}

function DiagnosticPlot({ pointId, metric, data, selectedSample, onSelectSample, collapsed, onCollapse, onOpenContextMenu, startDate, endDate, chartHeight = 178, dynamicCursor, onToggleCursor, onResetView, alarmLine, markedSamples, falseSignals, filterFalseSignals, viewport, onViewportChange, onViewportCommit, interactionDisabled = false }) {
  const plotBodyRef = useRef(null);
  const plotCanvasRef = useRef(null);
  const panRef = useRef(null);
  const wheelCommitTimerRef = useRef(null);
  const [renderSize, setRenderSize] = useState({ width: 720, height: chartHeight });
  const [isPanning, setIsPanning] = useState(false);
  const width = renderSize.width;
  const height = renderSize.height;
  const normalizedViewport = normalizeChartViewport(viewport, data.length);
  const viewStart = normalizedViewport.start;
  const viewEnd = normalizedViewport.end;
  const viewSpan = Math.max(1, viewEnd - viewStart);
  const viewCount = viewEnd - viewStart + 1;
  const viewportZoomed = viewStart > 0 || viewEnd < data.length - 1;
  const plotDensity = metric.kind === "numeric" ? "continuous" : metric.yLabels.length <= 2 ? "binary" : "ordinal";
  useEffect(() => {
    const body = plotBodyRef.current;
    const canvas = plotCanvasRef.current;
    if (!body || !canvas || collapsed) return undefined;
    const syncSize = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const next = {
        width: Math.max(240, Math.round(canvasRect.width)),
        height: Math.max(52, Math.round(canvasRect.height)),
      };
      setRenderSize((current) => current.width === next.width && current.height === next.height ? current : next);
    };
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(syncSize) : null;
    observer?.observe(body);
    observer?.observe(canvas);
    syncSize();
    return () => observer?.disconnect();
  }, [collapsed, chartHeight]);
  useEffect(() => () => window.clearTimeout(wheelCommitTimerRef.current), []);
  const compactYAxis = height < 120;
  const ultraCompactYAxis = height < 90;
  const chartPad = ultraCompactYAxis
    ? { left: 70, right: 18, top: 8, bottom: 14 }
    : compactYAxis
      ? { left: 70, right: 18, top: 12, bottom: 18 }
      : { left: 70, right: 18, top: 20, bottom: 26 };
  const span = Math.max(1, metric.max - metric.min);
  const points = data.map((value, index) => ({
    x: chartPad.left + (index - viewStart) * ((width - chartPad.left - chartPad.right) / viewSpan),
    y: chartPad.top + ((metric.max - value) / span) * (height - chartPad.top - chartPad.bottom),
    value,
  }));
  const availableIndexes = data.map((_, index) => index).filter((index) => !(filterFalseSignals && falseSignals.includes(sampleIdentity(pointId, metric.id, index, startDate, endDate))));
  const viewportIndexes = availableIndexes.filter((index) => index >= viewStart && index <= viewEnd);
  const visibleIndexSet = new Set(viewportIndexes);
  const pointSegments = [];
  let currentSegment = [];
  points.forEach((point, index) => {
    if (visibleIndexSet.has(index)) currentSegment.push(`${point.x},${point.y}`);
    else if (currentSegment.length) { pointSegments.push(currentSegment.join(" ")); currentSegment = []; }
  });
  if (currentSegment.length) pointSegments.push(currentSegment.join(" "));
  const selectedIndex = Math.min(selectedSample.index, data.length - 1);
  const selectedPoint = points[selectedIndex];
  const selectedKey = sampleIdentity(pointId, metric.id, selectedIndex, startDate, endDate);
  const selectedVisible = !(filterFalseSignals && falseSignals.includes(selectedKey));
  const selectedInViewport = selectedIndex >= viewStart && selectedIndex <= viewEnd;
  const rovingIndex = viewportIndexes.includes(selectedIndex) ? selectedIndex : (viewportIndexes[0] ?? -1);
  const selectedAlarm = selectedVisible ? getAlarmText(metric, selectedPoint.value, selectedIndex) : null;
  const guide = selectedPoint;
  const alarmY = chartPad.top + ((metric.max - (metric.kind === "numeric" ? 70 : metric.max * 0.75)) / span) * (height - chartPad.top - chartPad.bottom);
  const headlineTime = sampleTime(selectedIndex, startDate, endDate);
  const headlineValue = selectedVisible ? displayValue(metric, selectedPoint.value) : "已过滤";
  const plotBodyId = `analysis-plot-${metric.id}`;
  const plotTooltipId = `${plotBodyId}-tooltip`;
  const compactXAxis = width < 520;
  const tooltipVisible = selectedSample.metricId === metric.id && selectedVisible && selectedInViewport;
  const tooltipWidth = Math.max(150, Math.min(width - 16, width < 520 ? 184 : 230));
  const tooltipOnLeft = selectedPoint.x + tooltipWidth + 18 > width;
  const tooltipLeft = Math.min(width - tooltipWidth - 8, Math.max(8, selectedPoint.x + (tooltipOnLeft ? -tooltipWidth - 10 : 10)));
  const tooltipAbove = selectedPoint.y > height * 0.52;
  const viewportStartLabel = sampleAxisLabel(viewStart, startDate, endDate, true);
  const viewportEndLabel = sampleAxisLabel(viewEnd, startDate, endDate, true);
  const viewportStatus = viewportZoomed ? `${viewportStartLabel}—${viewportEndLabel} · ${viewCount}/${data.length}点` : `全览 · ${data.length}点`;

  const pointerToIndex = (clientX) => {
    const rect = plotCanvasRef.current?.getBoundingClientRect();
    if (!rect?.width) return (viewStart + viewEnd) / 2;
    const viewBoxX = ((clientX - rect.left) / rect.width) * width;
    const ratio = clampNumber((viewBoxX - chartPad.left) / Math.max(1, width - chartPad.left - chartPad.right), 0, 1);
    return viewStart + ratio * viewSpan;
  };

  const applyViewport = (nextViewport, source, anchorIndex) => {
    const next = normalizeChartViewport(nextViewport, data.length);
    if (chartViewportsEqual(next, normalizedViewport)) return false;
    onViewportChange?.(next, { source, metricId: metric.id, anchorIndex });
    return next;
  };

  const handleWheel = (event) => {
    if (interactionDisabled || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    const anchorIndex = pointerToIndex(event.clientX);
    const next = zoomChartViewport(normalizedViewport, event.deltaY < 0 ? "in" : "out", anchorIndex, data.length);
    const applied = applyViewport(next, "wheel", anchorIndex);
    if (!applied) return;
    window.clearTimeout(wheelCommitTimerRef.current);
    wheelCommitTimerRef.current = window.setTimeout(() => onViewportCommit?.("zoom", applied, metric.id), 180);
  };

  const beginPan = (event) => {
    if (interactionDisabled || event.button !== 0 || event.target?.closest?.(".plot-point") || !viewportZoomed) return;
    const rect = plotCanvasRef.current?.getBoundingClientRect();
    if (!rect?.width) return;
    panRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startViewport: normalizedViewport,
      plotPixelWidth: rect.width * ((width - chartPad.left - chartPad.right) / width),
      moved: false,
      lastViewport: normalizedViewport,
    };
    setIsPanning(true);
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* Pointer capture is optional in the QA/browser fallback. */ }
  };

  const movePan = (event) => {
    const drag = panRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaPixels = drag.startClientX - event.clientX;
    if (!drag.moved && Math.abs(deltaPixels) < 4) return;
    drag.moved = true;
    const spanIndexes = drag.startViewport.end - drag.startViewport.start;
    const deltaIndexes = (deltaPixels / Math.max(1, drag.plotPixelWidth)) * spanIndexes;
    const next = shiftChartViewport(drag.startViewport, deltaIndexes, data.length);
    if (chartViewportsEqual(next, drag.lastViewport)) return;
    drag.lastViewport = next;
    onViewportChange?.(next, { source: "pan", metricId: metric.id, anchorIndex: (next.start + next.end) / 2 });
  };

  const finishPan = (event) => {
    const drag = panRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch { /* Pointer capture is optional in the QA/browser fallback. */ }
    panRef.current = null;
    setIsPanning(false);
    if (drag.moved) onViewportCommit?.("pan", drag.lastViewport, metric.id);
  };

  const resetViewportFromCanvas = (event) => {
    if (interactionDisabled) return;
    event.preventDefault();
    onResetView?.("double-click");
  };

  const handlePlotKeyDown = (event) => {
    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
      openContextMenu(event);
      return;
    }
    if (interactionDisabled) return;
    if (["+", "="].includes(event.key)) {
      event.preventDefault();
      const next = zoomChartViewport(normalizedViewport, "in", selectedInViewport ? selectedIndex : (viewStart + viewEnd) / 2, data.length);
      const applied = applyViewport(next, "keyboard", selectedIndex);
      if (applied) onViewportCommit?.("zoom", applied, metric.id);
      return;
    }
    if (event.key === "-") {
      event.preventDefault();
      const next = zoomChartViewport(normalizedViewport, "out", selectedInViewport ? selectedIndex : (viewStart + viewEnd) / 2, data.length);
      const applied = applyViewport(next, "keyboard", selectedIndex);
      if (applied) onViewportCommit?.("zoom", applied, metric.id);
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      onResetView?.("keyboard");
    }
  };

  const openContextMenu = (event) => {
    event.preventDefault();
    const indexedTarget = event.target?.closest?.("[data-sample-index]");
    const svg = event.currentTarget.querySelector?.("svg");
    let index = indexedTarget ? Number(indexedTarget.getAttribute("data-sample-index")) : selectedIndex;
    if (!indexedTarget && svg && Number.isFinite(event.clientX) && event.clientX > 0) {
      const rect = svg.getBoundingClientRect();
      const viewBoxX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * width;
      const ratio = Math.min(1, Math.max(0, (viewBoxX - chartPad.left) / (width - chartPad.left - chartPad.right)));
      index = Math.round(viewStart + ratio * viewSpan);
    }
    onSelectSample({ metricId: metric.id, index });
    const bounds = event.currentTarget.getBoundingClientRect();
    onOpenContextMenu({
      x: event.clientX || bounds.left + 110,
      y: event.clientY || bounds.top + 42,
      metricId: metric.id,
      index,
      collapsed,
      returnFocus: document.activeElement,
    });
  };

  return (
    <section className={`diagnostic-plot ${collapsed ? "collapsed" : ""} ${compactYAxis ? "compact-height" : ""} ${tooltipVisible ? "tooltip-active" : ""}`} data-metric-id={metric.id} data-plot-density={plotDensity} data-window-start={viewStart} data-window-end={viewEnd} data-window-count={viewCount} data-zoomed={viewportZoomed ? "true" : "false"} tabIndex="0" role="group" aria-keyshortcuts="+ - 0 Shift+F10" aria-label={`${metric.label}趋势图，Ctrl加滚轮缩放，拖拽平移，双击或按0恢复全览，按 Shift+F10 打开图表菜单`} onContextMenu={openContextMenu} onKeyDown={handlePlotKeyDown}>
      <header>
        <div className="plot-title"><b>{metric.label}</b><span>{metric.group}</span></div>
        <div className="plot-reading"><span>{headlineTime}</span><em className={selectedAlarm ? "alarm" : "normal"}>{headlineValue}</em></div>
        <button className="plot-collapse" onClick={onCollapse} aria-label={collapsed ? `展开${metric.label}` : `收缩${metric.label}`} aria-expanded={!collapsed} aria-controls={plotBodyId}><IconChevronDown size={15} /></button>
      </header>
      {!collapsed && (
        <div ref={plotBodyRef} className="plot-body" id={plotBodyId}>
          <ToolRail cursorActive={dynamicCursor} onToggleCursor={onToggleCursor} onReset={onResetView} metricLabel={metric.label} disabled={interactionDisabled} resetDisabled={!viewportZoomed} />
          <div ref={plotCanvasRef} className={`plot-canvas interactive ${viewportZoomed ? "zoomed" : ""} ${isPanning ? "is-panning" : ""} ${interactionDisabled ? "interaction-disabled" : ""}`} title={interactionDisabled ? "查询完成后可操作趋势图" : "Ctrl/⌘+滚轮缩放；放大后拖拽平移；双击恢复全览"}>
            <svg className={ultraCompactYAxis ? "compact-axis ultra-compact-axis" : compactYAxis ? "compact-axis" : undefined} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="group" aria-label={`${metric.label}分析趋势，可缩放、平移并逐点键盘选择`} onWheel={handleWheel} onPointerDown={beginPan} onPointerMove={movePan} onPointerUp={finishPan} onPointerCancel={finishPan} onLostPointerCapture={finishPan} onDoubleClick={resetViewportFromCanvas}>
              {metric.yLabels.map((label, index) => {
                const y = chartPad.top + index * ((height - chartPad.top - chartPad.bottom) / (metric.yLabels.length - 1));
                return <g key={label}><line className="plot-grid" x1={chartPad.left} y1={y} x2={width - chartPad.right} y2={y} /><text className="plot-y-label" x={metric.kind === "numeric" ? 24 : 7} y={y + (compactYAxis ? 3 : 4)}>{label}</text></g>;
              })}
              {dynamicCursor && selectedVisible && selectedInViewport && <line className="plot-guide" x1={guide.x} y1={chartPad.top} x2={guide.x} y2={height - chartPad.bottom} />}
              {alarmLine && <line className="plot-alarm-line" x1={chartPad.left} y1={alarmY} x2={width - chartPad.right} y2={alarmY} />}
               {pointSegments.filter((segment) => segment.includes(" ")).map((segment, index) => <polyline key={index} className="plot-line" points={segment} />)}
               {!viewportIndexes.length && <text className="plot-filter-empty" x={width / 2} y={height / 2}>{filterFalseSignals ? "当前窗口内暂无有效信号" : "当前窗口暂无数据"}</text>}
              {points.map((point, index) => {
                if (index < viewStart || index > viewEnd) return null;
                const hasAttachment = Boolean(getAttachment(metric.id, index));
                const missingReason = hasAttachment ? null : getAttachmentMissingReason(metric.id, index);
                const hasAlarm = isAlarmPoint(metric, point.value);
                const isSelected = selectedSample.metricId === metric.id && selectedSample.index === index;
                const sampleKey = sampleIdentity(pointId, metric.id, index, startDate, endDate);
                const isFalseSignal = falseSignals.includes(sampleKey);
                if (filterFalseSignals && isFalseSignal) return null;
                return (
                  <g key={index}>
                    {markedSamples.includes(sampleKey) && <circle className="plot-marker-ring" cx={point.x} cy={point.y} r="8" />}
                     <circle
                      data-sample-index={index}
                      className={`plot-point ${hasAlarm ? "alarm" : hasAttachment ? "attached" : "empty"} ${isSelected ? "selected" : ""} ${isFalseSignal ? "false-signal" : ""}`}
                      cx={point.x}
                      cy={point.y}
                      r={isSelected ? 5.3 : 4.3}
                      onClick={() => onSelectSample({ metricId: metric.id, index })}
                      role="button"
                      tabIndex={index === rovingIndex ? "0" : "-1"}
                      aria-pressed={isSelected}
                      aria-describedby={isSelected ? plotTooltipId : undefined}
                      aria-label={`${sampleTime(index, startDate, endDate)}，${displayValue(metric, point.value)}，${hasAlarm ? "报警，" : ""}${hasAttachment ? "有附件" : missingReason.label}${isFalseSignal ? "，已标记误信号" : ""}`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectSample({ metricId: metric.id, index }); return; }
                        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                        event.preventDefault();
                        const currentPosition = Math.max(0, viewportIndexes.indexOf(index));
                        const nextPosition = event.key === "Home" ? 0 : event.key === "End" ? viewportIndexes.length - 1 : Math.min(viewportIndexes.length - 1, Math.max(0, currentPosition + (event.key === "ArrowLeft" ? -1 : 1)));
                        const nextIndex = viewportIndexes[nextPosition];
                        if (!Number.isFinite(nextIndex)) return;
                        onSelectSample({ metricId: metric.id, index: nextIndex });
                        window.setTimeout(() => event.currentTarget.ownerSVGElement?.querySelector(`[data-sample-index="${nextIndex}"]`)?.focus(), 0);
                      }}
                    >
                      <title>{`${sampleTime(index, startDate, endDate)} · ${displayValue(metric, point.value)} · ${hasAttachment ? "有附件" : missingReason.label}${isFalseSignal ? " · 误信号" : ""}`}</title>
                    </circle>
                  </g>
                );
              })}
              <text className="plot-x-label" x={chartPad.left} y={height - 6} textAnchor="start">{sampleAxisLabel(viewStart, startDate, endDate, compactXAxis)}</text>
              {!compactXAxis && <text className="plot-x-label" x={width / 2} y={height - 6} textAnchor="middle">{sampleAxisLabel(Math.round((viewStart + viewEnd) / 2), startDate, endDate)}</text>}
              <text className="plot-x-label" x={width - chartPad.right} y={height - 6} textAnchor="end">{sampleAxisLabel(viewEnd, startDate, endDate, compactXAxis)}</text>
            </svg>
            <div className={`plot-viewport-status ${viewportZoomed ? "zoomed" : ""}`} role={selectedSample.metricId === metric.id ? "status" : undefined} aria-live={selectedSample.metricId === metric.id ? "polite" : undefined} data-window-start={viewStart} data-window-end={viewEnd}>{viewportStatus}</div>
            {tooltipVisible && (
              <div id={plotTooltipId} role="tooltip" className={`plot-tooltip ${tooltipAbove ? "above" : "below"} ${tooltipOnLeft ? "align-left" : "align-right"}`} style={{ width: `${tooltipWidth}px`, left: `${tooltipLeft}px`, top: `${selectedPoint.y}px` }}>
                <b>{headlineTime}</b>
                <span>当前点位值：{headlineValue}</span>
                {selectedAlarm && <><strong>{selectedAlarm.title}</strong><span>{selectedAlarm.detail}</span></>}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function TreeLeaf({ children, selected, type = "video", onClick, code, hasAlarm = false }) {
  return <button className={`analysis-tree-leaf ${selected ? "selected" : ""}`} onClick={onClick} aria-current={selected ? "true" : undefined} aria-label={`${children}${code ? `，编码${code}` : ""}${hasAlarm ? "，当前存在报警" : ""}`} title={code ? `${children} · ${code}` : children}><span className="tree-corner" />{type === "audio" ? <IconMicrophone size={14} /> : <IconVideo size={14} />}<span className="tree-leaf-copy"><span>{children}</span>{code && <small>{code}</small>}</span>{hasAlarm && <i className="tree-alarm-dot" title="当前存在报警" />}</button>;
}

function TreeEmpty() {
  return <div className="tree-empty-hint">暂无音视频测点</div>;
}

function ResourceTree({ selected, onSelect, query, filter }) {
  const searchItems = Object.entries(pointCatalog);
  const term = query.trim().toLowerCase();
  if (term || filter !== "all") {
    const matches = searchItems.filter(([, point]) => {
      const matchesTerm = !term || `${point.label} ${point.code} ${point.path}`.toLowerCase().includes(term);
      const matchesFilter = filter === "all" || point.type === filter || (filter === "alarm" && pointHasAlarm(point));
      return matchesTerm && matchesFilter;
    });
    return <div className="source-tree source-search-results"><div className="source-search-heading">匹配测点（{matches.length}）</div>{matches.map(([id, point]) => <TreeLeaf key={id} type={point.type} code={point.code} hasAlarm={pointHasAlarm(point)} selected={selected === id} onClick={() => onSelect(id)}>{point.label}</TreeLeaf>)}{!matches.length && <div className="source-search-empty">未找到匹配测点</div>}</div>;
  }
  return (
    <div className="source-tree">
      <details open className="linked-alarm-points">
        <summary><IconAlertTriangle size={15} />关联报警点（{LINKED_OPERATIONS.length}）</summary>
        {LINKED_OPERATIONS.map((operation) => {
          const point = pointCatalog[operation.analysisPoint];
          if (!point) return null;
          return <TreeLeaf key={operation.id} type={point.type} code={point.code} hasAlarm selected={selected === operation.analysisPoint} onClick={() => onSelect(operation.analysisPoint)}>{point.label}</TreeLeaf>;
        })}
      </details>
      <details open><summary><IconFolder size={15} />碎煤机室</summary><TreeLeaf type="audio" selected={selected === "line-test"} onClick={() => onSelect("line-test")}>1号碎煤机声学测点</TreeLeaf></details>
      <details open>
        <summary><IconFolder size={15} />310B输煤皮带机</summary>
        <details open className="level-two"><summary><IconFolder size={15} />机头区域</summary><TreeEmpty /></details>
        <details open className="level-two"><summary><IconFolder size={15} />重锤/拉紧滚筒区域</summary><TreeEmpty /></details>
        <details open className="level-two">
          <summary><IconFolder size={15} />输送区域</summary>
          <details open className="level-three"><summary><IconFolder size={15} />上托辊组</summary><TreeLeaf selected={selected === "upper-roller"} onClick={() => onSelect("upper-roller")}>上排托辊状态</TreeLeaf></details>
          <details className="level-three"><summary><IconFolder size={15} />下托辊组</summary><TreeEmpty /></details>
          <details open className="level-three">
            <summary><IconFolder size={15} />皮带本体</summary>
            <TreeLeaf selected={selected === "belt"} onClick={() => onSelect("belt")}>皮带状态</TreeLeaf>
            <TreeLeaf selected={selected === "500a"} onClick={() => onSelect("500a")}>机尾纵撕状态</TreeLeaf>
            <TreeLeaf selected={selected === "100"} onClick={() => onSelect("100")}>100m转弯处皮带状态</TreeLeaf>
            <TreeLeaf selected={selected === "500b"} onClick={() => onSelect("500b")}>中段人员安全监测</TreeLeaf>
          </details>
          <details className="level-three"><summary><IconFolder size={15} />翻转滚筒</summary><TreeEmpty /></details>
          <details className="level-three"><summary><IconFolder size={15} />犁煤器</summary><TreeEmpty /></details>
        </details>
        <details className="level-two"><summary><IconFolder size={15} />机尾</summary><TreeEmpty /></details>
        <details className="level-two"><summary><IconFolder size={15} />机尾区域</summary><TreeEmpty /></details>
        <TreeLeaf type="audio" selected={selected === "alarm"} onClick={() => onSelect("alarm")}>驱动滚筒声学测点</TreeLeaf>
      </details>
    </div>
  );
}

function AttachmentCard({ item, selected, onSelect, onFeedback }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const imageRef = useRef(null);
  const attachment = item.attachment;
  const missingReason = item.missingReason;
  const duration = attachment?.type === "video" ? 12 : 8.24;
  const mediaSource = attachmentVisualSources[item.metric.id] || coalFlowImage;
  const attachmentTypeLabel = attachment?.type === "video" ? "现场视频" : attachment?.type === "waveform" ? "异音波形" : attachment?.type === "image" ? "现场图像" : item.filtered ? "已过滤" : missingReason?.label || "状态异常";
  const MissingIcon = item.filtered ? IconFilterOff : missingReason?.code === "device-offline" ? IconDeviceCctv : missingReason?.code === "generation-failed" ? IconAlertTriangle : missingReason?.code === "expired" ? IconInfoCircle : IconPaperclip;
  const evidenceStateClass = item.filtered ? "filtered" : attachment ? item.alarm ? "alarm" : "synced" : `missing ${missingReason?.code || "unavailable"}`;
  const evidenceStateLabel = item.filtered ? "已过滤" : attachment ? item.alarm ? "报警证据" : "已同步" : missingReason?.statusLabel || "状态异常";

  useEffect(() => { setPlaying(false); setProgress(0); }, [item.sampleKey, attachment?.type]);
  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setProgress((current) => Math.min(duration, Number((current + 0.2).toFixed(2)))), 200);
    return () => window.clearInterval(timer);
  }, [playing, duration]);
  useEffect(() => {
    if (!playing || progress < duration) return;
    setPlaying(false);
    onFeedback?.(`${item.metric.label}附件播放完成`);
  }, [playing, progress, duration]);

  const togglePlayback = () => {
    if (progress >= duration) setProgress(0);
    setPlaying((value) => !value);
  };

  const openImageFullscreen = async () => {
    const image = imageRef.current;
    if (!image?.requestFullscreen) return onFeedback?.("当前浏览器不支持图片全屏", true);
    try {
      await image.requestFullscreen();
      onFeedback?.(`${item.metric.label}现场图像已进入全屏`);
    } catch {
      onFeedback?.("当前浏览器未允许图片全屏", true);
    }
  };

  return (
    <article className={`attachment-algorithm-card ${selected ? "selected" : ""} ${item.alarm ? "alarm" : ""}`} data-metric-id={item.metric.id} data-sample-index={item.index} data-attachment-type={attachment?.type || "none"} data-algorithm-domain={item.metric.group === "音频算法" ? "audio" : "visual"} data-missing-reason={missingReason?.code || undefined} aria-current={selected ? "true" : undefined} role="listitem">
      <button type="button" className="attachment-card-heading" onClick={onSelect} aria-pressed={selected}>
        <span><small>{item.metric.group}</small><strong>{item.metric.label}</strong></span>
        <span className="attachment-card-reading"><b className={item.alarm ? "alarm" : "normal"}>{item.valueText}</b><small>{attachmentTypeLabel}</small></span>
      </button>
      {attachment?.type === "image" && <div className="attachment-viewer"><img ref={imageRef} src={mediaSource} alt={`${item.metric.label}现场关联图像`} /><span className="attachment-kind"><IconPhoto size={13} />{item.metric.label}</span><button className="attachment-zoom" onClick={openImageFullscreen} aria-label={`全屏查看${item.metric.label}现场图像`} title="全屏查看"><IconMaximize size={14} /></button></div>}
      {attachment?.type === "video" && <div className="attachment-viewer"><img src={mediaSource} alt={`${item.metric.label}现场关联视频画面`} /><span className="attachment-kind"><IconVideo size={13} />{item.metric.label}</span><button className="attachment-play" onClick={togglePlayback} aria-label={playing ? `暂停${item.metric.label}现场视频` : `播放${item.metric.label}现场视频`} aria-pressed={playing}>{playing ? <IconPlayerPause size={19} /> : <IconPlayerPlay size={19} />}</button><div className="attachment-playback"><i><b style={{ width: `${(progress / duration) * 100}%` }} /></i><span>{formatDuration(progress)} / {formatDuration(duration)}</span></div></div>}
      {attachment?.type === "waveform" && <div className={`attachment-waveform ${playing ? "playing" : ""}`}><IconWaveSine size={48} /><div className="waveform-bars">{[28, 52, 38, 74, 46, 83, 31, 62, 44, 72, 36, 58].map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}</div><button onClick={togglePlayback} aria-label={playing ? `暂停${item.metric.label}异音波形` : `播放${item.metric.label}异音波形`} aria-pressed={playing}>{playing ? <IconPlayerPause size={19} /> : <IconPlayerPlay size={19} />}</button><span>{formatDuration(progress)} / {formatDuration(duration)}</span><i className="waveform-progress" style={{ width: `${(progress / duration) * 100}%` }} /></div>}
      {!attachment && <div className={`attachment-card-empty attachment-missing ${item.filtered ? "filtered" : missingReason?.code || "unavailable"}`}><MissingIcon size={18} /><span><strong className="attachment-missing-reason">{item.filtered ? "误信号已过滤" : missingReason?.label || "附件状态异常"}</strong><small>{item.filtered ? "关闭误信号过滤后可重新查看" : missingReason?.detail}</small></span></div>}
      <div className="attachment-card-meta"><span className={evidenceStateClass}><i />{evidenceStateLabel}</span><small title={item.detail}>{item.detail}</small></div>
    </article>
  );
}

function AttachmentPane({ collapsed, onToggle, width, maxWidth, onResizeStart, onResizeKeyDown, onResetWidth, items, selectedMetricId, onSelectMetric, onFeedback }) {
  const listRef = useRef(null);
  const layoutSignature = items.map((item) => `${item.metric.id}:${item.attachment?.type || "none"}`).join("|");
  const selectedItem = items.find((item) => item.metric.id === selectedMetricId);
  const selectedSampleKey = selectedItem?.sampleKey || "";

  useEffect(() => {
    if (collapsed || !selectedMetricId) return undefined;
    const timer = window.setTimeout(() => {
      const list = listRef.current;
      const selectedCard = [...(list?.querySelectorAll("[data-metric-id]") || [])].find((card) => card.dataset.metricId === selectedMetricId);
      if (!list || !selectedCard) return;
      const listRect = list.getBoundingClientRect();
      const cardRect = selectedCard.getBoundingClientRect();
      const cardTop = list.scrollTop + cardRect.top - listRect.top;
      const cardBottom = cardTop + cardRect.height;
      const visibleTop = list.scrollTop + 6;
      const visibleBottom = list.scrollTop + list.clientHeight - 6;
      let nextScrollTop = list.scrollTop;
      if (cardRect.height > list.clientHeight - 12 || cardTop < visibleTop) nextScrollTop = Math.max(0, cardTop - 6);
      else if (cardBottom > visibleBottom) nextScrollTop = Math.max(0, cardBottom - list.clientHeight + 6);
      if (Math.abs(nextScrollTop - list.scrollTop) > 1) list.scrollTo({ top: nextScrollTop, behavior: "auto" });
    }, 190);
    return () => window.clearTimeout(timer);
  }, [collapsed, width, selectedMetricId, selectedSampleKey, layoutSignature]);

  return (
    <aside className={`source-attachment-pane ${collapsed ? "collapsed" : ""}`} id="analysis-evidence-pane" data-evidence-width={Math.round(width)} style={{ "--evidence-width": `${width}px` }}>
      {!collapsed && <div className="evidence-resize-handle" data-testid="evidence-resize-handle" role="separator" tabIndex={0} aria-label="左右拖拽或使用方向键调整证据附件宽度" aria-orientation="vertical" aria-controls="analysis-evidence-content" aria-valuemin={EVIDENCE_PANE_MIN_WIDTH} aria-valuemax={Math.round(maxWidth)} aria-valuenow={Math.round(width)} aria-valuetext={`${Math.round(width)} 像素`} onPointerDown={onResizeStart} onKeyDown={onResizeKeyDown} onDoubleClick={onResetWidth} title="左右拖拽调整宽度，双击恢复默认" />}
      <button type="button" className="attachment-toggle" onClick={onToggle} aria-label={collapsed ? "展开证据附件" : "收缩证据附件"} aria-expanded={!collapsed} aria-controls="analysis-evidence-content"><IconPaperclip size={16} />{!collapsed && <span>证据附件</span>}{collapsed ? <IconChevronLeft size={15} /> : <IconChevronRight size={15} />}</button>
      {!collapsed && (
        <div className="attachment-content" id="analysis-evidence-content">
          {items.length ? <div ref={listRef} className="attachment-algorithm-grid" role="list" aria-label="当前时刻算法证据附件">{items.map((item) => <AttachmentCard key={item.metric.id} item={item} selected={item.metric.id === selectedMetricId} onSelect={() => onSelectMetric(item.metric.id)} onFeedback={onFeedback} />)}</div> : <div className="attachment-empty"><IconPaperclip size={26} /><span>暂无已应用算法</span></div>}
        </div>
      )}
    </aside>
  );
}

function ContextMenu({ menu, actions, onAction, onClose, onDisabled }) {
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menu) return;
    window.setTimeout(() => menuRef.current?.querySelector("button:not(:disabled)")?.focus(), 0);
  }, [menu]);
  if (!menu) return null;
  const moveFocus = (event) => {
    const buttons = [...menuRef.current.querySelectorAll("button")];
    if (!buttons.length) return;
    const current = Math.max(0, buttons.indexOf(document.activeElement));
    let next = current;
    if (event.key === "Tab") { window.setTimeout(() => onClose(false), 0); return; }
    if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
    else if (event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault(); event.stopPropagation(); onClose(true); return;
    }
    else return;
    event.preventDefault();
    buttons[next].focus();
  };
  return (
    <div ref={menuRef} className="analysis-context-menu" role="menu" aria-label="趋势图操作" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()} onKeyDown={moveFocus}>
      {actions.map(({ id, Icon, label, pressed, disabled, hint }) => (
        <button key={id} role={typeof pressed === "boolean" ? "menuitemcheckbox" : "menuitem"} aria-checked={typeof pressed === "boolean" ? pressed : undefined} aria-disabled={disabled || undefined} title={disabled ? hint : undefined} onClick={() => disabled ? onDisabled?.(hint) : onAction(id, "menu")}>
          <Icon size={15} />
          <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
        </button>
      ))}
    </div>
  );
}

function WaveformModal({ open, onClose, time }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const closeRef = useRef(null);
  const duration = 8.24;
  useEffect(() => {
    setPlaying(false);
    if (open) { setProgress(0); window.setTimeout(() => closeRef.current?.focus(), 0); }
  }, [open]);
  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setProgress((current) => Math.min(duration, Number((current + 0.2).toFixed(2)))), 200);
    return () => window.clearInterval(timer);
  }, [playing]);
  useEffect(() => { if (playing && progress >= duration) setPlaying(false); }, [playing, progress]);
  if (!open) return null;
  return (
    <div className="waveform-modal-backdrop" onMouseDown={onClose}>
      <section className="waveform-modal" role="dialog" aria-modal="true" aria-labelledby="waveform-modal-title" onMouseDown={(event) => event.stopPropagation()} onKeyDown={trapDialogFocus}>
        <header><div><IconWaveSine size={19} /><strong id="waveform-modal-title">关联波形分析</strong><span>{time}</span></div><button ref={closeRef} onClick={onClose} aria-label="关闭波形分析"><IconX size={18} /></button></header>
        <div className={`waveform-modal-chart ${playing ? "playing" : ""}`}><svg viewBox="0 0 760 240" preserveAspectRatio="none" role="img" aria-label="当前采样点异音波形"><polyline points="0,122 20,115 40,130 60,92 80,150 100,118 120,70 140,166 160,111 180,126 200,46 220,181 240,101 260,132 280,62 300,158 320,107 340,124 360,90 380,144 400,116 420,41 440,186 460,102 480,135 500,75 520,156 540,109 560,128 580,84 600,149 620,113 640,55 660,173 680,104 700,138 720,91 740,128 760,116" /></svg><i className="waveform-modal-progress" style={{ left: `${(progress / duration) * 100}%` }} /><button onClick={() => { if (progress >= duration) setProgress(0); setPlaying((value) => !value); }} aria-label={playing ? "暂停波形" : "播放波形"} aria-pressed={playing}>{playing ? <IconPlayerPause size={24} /> : <IconPlayerPlay size={24} />}</button></div>
        <footer><span>采样率 44.1 kHz</span><span>进度 {formatDuration(progress)} / 00:08</span><span>峰值 82.6 dB</span></footer>
      </section>
    </div>
  );
}

function SettingsModal({ open, onClose, onApply, dynamicCursor, setDynamicCursor, alarmLine, setAlarmLine, filterFalseSignals, setFilterFalseSignals }) {
  const [draftCursor, setDraftCursor] = useState(dynamicCursor);
  const [draftAlarmLine, setDraftAlarmLine] = useState(alarmLine);
  const [draftFilter, setDraftFilter] = useState(filterFalseSignals);
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    setDraftCursor(dynamicCursor);
    setDraftAlarmLine(alarmLine);
    setDraftFilter(filterFalseSignals);
    window.setTimeout(() => closeRef.current?.focus(), 0);
  }, [open, dynamicCursor, alarmLine, filterFalseSignals]);
  if (!open) return null;
  const apply = () => {
    setDynamicCursor(draftCursor);
    setAlarmLine(draftAlarmLine);
    setFilterFalseSignals(draftFilter);
    onClose();
    onApply?.();
  };
  return (
    <div className="waveform-modal-backdrop" onMouseDown={onClose}>
      <section className="analysis-settings-modal" role="dialog" aria-modal="true" aria-labelledby="analysis-settings-title" onMouseDown={(event) => event.stopPropagation()} onKeyDown={trapDialogFocus}>
        <header><div><IconSettings size={18} /><strong id="analysis-settings-title">界面设置</strong></div><button ref={closeRef} onClick={onClose} aria-label="关闭界面设置"><IconX size={18} /></button></header>
        <div className="settings-options">
          <label><input type="checkbox" checked={draftCursor} onChange={(event) => setDraftCursor(event.target.checked)} /><span><b>显示动态游标</b><small>选中趋势点时同步显示垂直游标</small></span></label>
          <label><input type="checkbox" checked={draftAlarmLine} onChange={(event) => setDraftAlarmLine(event.target.checked)} /><span><b>显示报警线</b><small>在所有当前图谱中显示报警阈值</small></span></label>
          <label><input type="checkbox" checked={draftFilter} onChange={(event) => setDraftFilter(event.target.checked)} /><span><b>过滤误信号</b><small>隐藏已设置为误信号的数据点</small></span></label>
        </div>
        <footer><button onClick={onClose}>取消</button><button className="primary" onClick={apply}>确定</button></footer>
      </section>
    </div>
  );
}

function HelpModal({ open, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => { if (open) window.setTimeout(() => closeRef.current?.focus(), 0); }, [open]);
  if (!open) return null;
  return (
    <div className="waveform-modal-backdrop" onMouseDown={onClose}>
      <section className="analysis-help-modal" role="dialog" aria-modal="true" aria-labelledby="analysis-help-title" onMouseDown={(event) => event.stopPropagation()} onKeyDown={trapDialogFocus}>
        <header><div><IconHelpCircle size={18} /><strong id="analysis-help-title">音视频分析操作说明</strong></div><button ref={closeRef} onClick={onClose} aria-label="关闭操作说明"><IconX size={18} /></button></header>
        <div className="analysis-help-content">
          <article><b>1. 选择对象</b><span>从设备树选择音频或视频测点，系统会自动查询近 15 天兼容指标。</span></article>
          <article><b>2. 定位证据</b><span>点击趋势点或结果行，会同步该时刻读数、报警依据和右侧证据附件。</span></article>
          <article><b>3. 缩放与平移</b><span>用工具栏或 Ctrl/⌘+滚轮同步缩放；放大后拖拽图面平移；双击图面恢复全览。</span></article>
          <article><b>4. 右键与键盘</b><span>右键可标注、过滤、缩放或导出；聚焦图表后按 + / - 缩放、按 0 复位、Shift+F10 打开菜单。</span></article>
        </div>
        <footer><button className="primary" onClick={onClose}>知道了</button></footer>
      </section>
    </div>
  );
}

export function AudioVideoAnalysis() {
  const { getEvent } = useOperations();
  const rootRef = useRef(null);
  const sourceAnalysisBodyRef = useRef(null);
  const toastTimerRef = useRef(null);
  const queryTimerRef = useRef(null);
  const dialogReturnFocusRef = useRef(null);
  const contextReturnFocusRef = useRef(null);
  const treeCollapseRef = useRef(null);
  const treeRestoreRef = useRef(null);
  const conditionsCollapseRef = useRef(null);
  const conditionsRestoreRef = useRef(null);
  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);
  const evidenceResizeCleanupRef = useRef(null);
  const initialDeepLink = useMemo(() => readAnalysisDeepLink(), []);
  const initialPointId = initialDeepLink?.pointId || "100";
  const initialPointOperation = resolveOperationByAnalysisPoint(initialPointId);
  const [linkedContext, setLinkedContext] = useState(() => initialDeepLink?.linkedEventId ? initialDeepLink : initialPointOperation ? {
    linkedEventId: initialPointOperation.id,
    pointId: initialPointId,
    metricId: initialPointOperation.analysisMetric,
    stationCode: initialPointOperation.stationCode,
    cameraId: initialPointOperation.cameraId,
  } : null);
  const linkedEventId = linkedContext?.linkedEventId || "";
  const linkedOperation = resolveOperation(linkedEventId);
  const linkedEvent = linkedEventId ? getEvent(linkedEventId) : null;
  const [selectedPoint, setSelectedPoint] = useState(initialPointId);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [startDate, setStartDate] = useState(initialDeepLink?.startDate || defaultStartDate);
  const [endDate, setEndDate] = useState(initialDeepLink?.endDate || defaultEndDate);
  const [activeMetrics, setActiveMetrics] = useState(initialDeepLink ? [initialDeepLink.metricId] : metrics.map((metric) => metric.id));
  const [appliedStartDate, setAppliedStartDate] = useState(initialDeepLink?.startDate || defaultStartDate);
  const [appliedEndDate, setAppliedEndDate] = useState(initialDeepLink?.endDate || defaultEndDate);
  const [appliedMetrics, setAppliedMetrics] = useState(initialDeepLink ? [initialDeepLink.metricId] : metrics.map((metric) => metric.id));
  const [run, setRun] = useState(0);
  const [toast, setToast] = useState("");
  const [toastError, setToastError] = useState(false);
  const [toastRevision, setToastRevision] = useState(0);
  const [selectedSample, setSelectedSample] = useState(initialDeepLink?.sample || { metricId: "deviation", index: 3 });
  const [attachmentCollapsed, setAttachmentCollapsed] = useState(false);
  const [evidenceWidth, setEvidenceWidth] = useState(() => {
    const stored = window.localStorage.getItem("ronds-analysis-evidence-width");
    const saved = Number(stored);
    return stored !== null && Number.isFinite(saved)
      ? clampNumber(saved, EVIDENCE_PANE_MIN_WIDTH, EVIDENCE_PANE_MAX_WIDTH)
      : defaultEvidencePaneWidth();
  });
  const [evidenceMaxWidth, setEvidenceMaxWidth] = useState(EVIDENCE_PANE_MAX_WIDTH);
  const [treeCollapsed, setTreeCollapsed] = useState(() => window.localStorage.getItem("ronds-analysis-tree-collapsed") === "true");
  const [conditionsCollapsed, setConditionsCollapsed] = useState(() => window.localStorage.getItem("ronds-analysis-conditions-collapsed") === "true");
  const [collapsedPlots, setCollapsedPlots] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [waveformOpen, setWaveformOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [favoriteTool, setFavoriteTool] = useState(() => window.localStorage.getItem("ronds-analysis-favorite-tool") !== "false");
  const [operationWidth, setOperationWidth] = useState(() => {
    const stored = window.localStorage.getItem("ronds-analysis-operation-width");
    const saved = Number(stored);
    return stored !== null && Number.isFinite(saved) ? Math.min(380, Math.max(224, saved)) : window.innerWidth <= 1600 ? 260 : 292;
  });
  const [loading, setLoading] = useState(false);
  const [queryMode, setQueryMode] = useState("auto");
  const [lastQueryAt, setLastQueryAt] = useState(() => formatClock());
  const [resultFilter, setResultFilter] = useState("all");
  const [dynamicCursor, setDynamicCursor] = useState(true);
  const [alarmLine, setAlarmLine] = useState(false);
  const [markedSamples, setMarkedSamples] = useState([]);
  const [falseSignals, setFalseSignals] = useState([]);
  const [filterFalseSignals, setFilterFalseSignals] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartRevision, setChartRevision] = useState(0);
  const [chartViewport, setChartViewport] = useState(fullChartViewport);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    window.addEventListener("click", closeMenu);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      window.removeEventListener("click", closeMenu);
      document.removeEventListener("fullscreenchange", syncFullscreen);
      window.clearTimeout(toastTimerRef.current);
      window.clearTimeout(queryTimerRef.current);
      evidenceResizeCleanupRef.current?.(false);
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      if (!contextMenu && !waveformOpen && !settingsOpen && !helpOpen) return;
      event.preventDefault();
      const contextFocus = contextMenu ? contextReturnFocusRef.current : null;
      const dialogFocus = waveformOpen || settingsOpen || helpOpen ? dialogReturnFocusRef.current : null;
      setContextMenu(null);
      setWaveformOpen(false);
      setSettingsOpen(false);
      setHelpOpen(false);
      window.setTimeout(() => (contextFocus || dialogFocus)?.focus?.(), 0);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [contextMenu, waveformOpen, settingsOpen, helpOpen]);

  useEffect(() => {
    window.localStorage.setItem("ronds-analysis-operation-width", String(Math.round(operationWidth)));
  }, [operationWidth]);

  useEffect(() => {
    window.localStorage.setItem("ronds-analysis-evidence-width", String(Math.round(evidenceWidth)));
  }, [evidenceWidth]);

  useEffect(() => {
    const analysisBody = sourceAnalysisBodyRef.current;
    if (!analysisBody || typeof ResizeObserver === "undefined") return undefined;
    const updateEvidenceLimit = () => {
      const nextMax = clampNumber(analysisBody.clientWidth - EVIDENCE_PLOT_MIN_WIDTH, EVIDENCE_PANE_MIN_WIDTH, EVIDENCE_PANE_MAX_WIDTH);
      setEvidenceMaxWidth(nextMax);
      setEvidenceWidth((current) => clampNumber(current, EVIDENCE_PANE_MIN_WIDTH, nextMax));
    };
    updateEvidenceLimit();
    const observer = new ResizeObserver(updateEvidenceLimit);
    observer.observe(analysisBody);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ronds-analysis-tree-collapsed", String(treeCollapsed));
  }, [treeCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("ronds-analysis-conditions-collapsed", String(conditionsCollapsed));
  }, [conditionsCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("ronds-analysis-favorite-tool", String(favoriteTool));
  }, [favoriteTool]);

  const pointInfo = pointCatalog[selectedPoint] || pointCatalog["100"];
  const availableDefinitions = metrics.filter((metric) => pointInfo.metrics.includes(metric.id));
  const shiftedSeries = useMemo(() => Object.fromEntries(Object.entries(baseSeries).map(([key, values]) => [key, values.map((value, index) => Number((value + (run && index % 7 === 0 ? key === "decibel" ? 1 : 0.1 : 0)).toFixed(1)))])), [run]);
  const draftDefinitions = availableDefinitions.filter((metric) => activeMetrics.includes(metric.id));
  const activeDefinitions = availableDefinitions.filter((metric) => appliedMetrics.includes(metric.id));
  const normalizedChartViewport = normalizeChartViewport(chartViewport, CHART_SAMPLE_COUNT);
  const chartViewportCount = normalizedChartViewport.end - normalizedChartViewport.start + 1;
  const chartAtFullRange = chartViewportCount >= CHART_SAMPLE_COUNT;
  const chartAtMinimumRange = chartViewportCount <= MIN_CHART_VISIBLE_SAMPLES;
  const chartViewportSummary = chartAtFullRange
    ? `全览 · ${CHART_SAMPLE_COUNT}点`
    : `${sampleAxisLabel(normalizedChartViewport.start, appliedStartDate, appliedEndDate, true)}—${sampleAxisLabel(normalizedChartViewport.end, appliedStartDate, appliedEndDate, true)} · ${chartViewportCount}/${CHART_SAMPLE_COUNT}点`;
  useEffect(() => {
    if (appliedMetrics.includes(selectedSample.metricId) || !activeDefinitions.length) return;
    setSelectedSample({ metricId: activeDefinitions[0].id, index: 3 });
  }, [appliedMetrics, activeDefinitions, selectedSample.metricId]);
  useEffect(() => {
    if (selectedSample.index >= normalizedChartViewport.start && selectedSample.index <= normalizedChartViewport.end) return;
    const count = normalizedChartViewport.end - normalizedChartViewport.start + 1;
    const start = clampNumber(selectedSample.index - Math.floor(count / 2), 0, CHART_SAMPLE_COUNT - count);
    setChartViewport({ start, end: start + count - 1 });
  }, [selectedSample.index, normalizedChartViewport.start, normalizedChartViewport.end]);
  const expandedCount = activeDefinitions.filter((metric) => !collapsedPlots.includes(metric.id)).length;
  const selectedMetric = activeDefinitions.find((metric) => metric.id === selectedSample.metricId) || activeDefinitions[0] || null;
  const selectedSampleKey = sampleIdentity(selectedPoint, selectedMetric?.id || selectedSample.metricId, selectedSample.index, appliedStartDate, appliedEndDate);
  const selectedSampleFiltered = filterFalseSignals && falseSignals.includes(selectedSampleKey);
  const selectedValue = selectedMetric && !selectedSampleFiltered ? shiftedSeries[selectedMetric.id]?.[selectedSample.index] : null;
  const selectedAlarm = selectedMetric && Number.isFinite(selectedValue) ? getAlarmText(selectedMetric, selectedValue, selectedSample.index) : null;
  const attachmentItems = activeDefinitions.map((metric) => {
    const sampleKey = sampleIdentity(selectedPoint, metric.id, selectedSample.index, appliedStartDate, appliedEndDate);
    const filtered = filterFalseSignals && falseSignals.includes(sampleKey);
    const value = shiftedSeries[metric.id]?.[selectedSample.index];
    const alarm = !filtered && Number.isFinite(value) ? getAlarmText(metric, value, selectedSample.index) : null;
    const attachment = filtered ? null : getAttachment(metric.id, selectedSample.index);
    const missingReason = filtered || attachment ? null : getAttachmentMissingReason(metric.id, selectedSample.index);
    return {
      metric,
      index: selectedSample.index,
      sampleKey,
      filtered,
      value,
      valueText: filtered ? "已过滤" : Number.isFinite(value) ? displayValue(metric, value) : "--",
      alarm,
      attachment,
      missingReason,
      detail: filtered
        ? "当前采样已被误信号筛选隐藏"
        : attachment ? alarm?.detail || `附件与${metric.label}分析结果同步` : missingReason?.detail || "附件状态暂不可用",
    };
  });
  const selectedAttachment = attachmentItems.find((item) => item.metric.id === selectedMetric?.id)?.attachment || null;
  const currentDate = formatDateInput(new Date());
  const currentDateEnd = parseDateInput(currentDate, true);
  const draftStart = parseDateInput(startDate);
  const draftEnd = parseDateInput(endDate, true);
  const draftDays = inclusiveDateDays(startDate, endDate);
  const appliedDays = inclusiveDateDays(appliedStartDate, appliedEndDate);
  const rangeDirty = startDate !== appliedStartDate || endDate !== appliedEndDate;
  const conditionsDirty = rangeDirty || activeMetrics.length !== appliedMetrics.length || activeMetrics.some((id) => !appliedMetrics.includes(id));
  const dateOrderInvalid = Boolean(draftStart && draftEnd && draftEnd < draftStart);
  const futureDateInvalid = Boolean((draftStart && draftStart > currentDateEnd) || (draftEnd && draftEnd > currentDateEnd));
  const rangeTooLong = Number.isFinite(draftDays) && draftDays > 30;
  const dateRangeError = !startDate || !endDate
    ? "请选择完整的开始和结束日期"
    : !draftStart || !draftEnd
      ? "日期格式无效，请重新选择"
      : dateOrderInvalid
        ? "结束时间不能早于开始时间"
        : futureDateInvalid
          ? "查询范围不能晚于今天"
          : rangeTooLong
            ? "时间范围最大允许选择30天"
            : "";
  const startDateInvalid = !startDate || !draftStart || dateOrderInvalid || Boolean(draftStart && draftStart > currentDateEnd) || rangeTooLong;
  const endDateInvalid = !endDate || !draftEnd || dateOrderInvalid || Boolean(draftEnd && draftEnd > currentDateEnd) || rangeTooLong;
  const activePresetDays = [1, 7, 15, 30].find((days) => {
    const preset = getPresetRange(days, currentDate);
    return preset.startDate === startDate && preset.endDate === endDate;
  }) || null;
  const appliedRangeSummary = appliedEndDate === currentDate
    ? appliedDays === 1 ? "今日" : `近${appliedDays}天`
    : `${formatRangeText(appliedStartDate, appliedEndDate, true)} · ${appliedDays}天`;
  const draftRangeSummary = dateRangeError ? dateRangeError : `${formatRangeText(startDate, endDate)} · 共${draftDays}天`;
  const sampleIsFiltered = (metricId, index) => filterFalseSignals && falseSignals.includes(sampleIdentity(selectedPoint, metricId, index, appliedStartDate, appliedEndDate));
  const resultStats = activeDefinitions.reduce((summary, metric) => {
    shiftedSeries[metric.id].forEach((value, index) => {
      if (sampleIsFiltered(metric.id, index)) return;
      summary.total += 1;
      if (isAlarmPoint(metric, value)) summary.alarms += 1;
      if (getAttachment(metric.id, index)) summary.attachments += 1;
    });
    return summary;
  }, { total: 0, alarms: 0, attachments: 0 });
  const selectedMetricRows = selectedMetric ? (shiftedSeries[selectedMetric.id] || []).map((value, index) => ({
    index,
    time: sampleTime(index, appliedStartDate, appliedEndDate),
    value: displayValue(selectedMetric, value),
    attachment: getAttachment(selectedMetric.id, index),
    alarm: isAlarmPoint(selectedMetric, value),
  })).filter((row) => !sampleIsFiltered(selectedMetric.id, row.index)).reverse() : [];
  const selectedResultStats = selectedMetricRows.reduce((summary, row) => ({
    total: summary.total + 1,
    alarms: summary.alarms + (row.alarm ? 1 : 0),
    attachments: summary.attachments + (row.attachment ? 1 : 0),
  }), { total: 0, alarms: 0, attachments: 0 });
  const filteredOperationRows = selectedMetricRows.filter((row) => resultFilter === "all" || (resultFilter === "alarm" && row.alarm) || (resultFilter === "attachment" && row.attachment));
  const selectedListRow = filteredOperationRows.find((row) => row.index === selectedSample.index);
  const operationRows = selectedListRow && !filteredOperationRows.slice(0, 8).some((row) => row.index === selectedSample.index)
    ? [selectedListRow, ...filteredOperationRows.filter((row) => row.index !== selectedSample.index).slice(0, 7)]
    : filteredOperationRows.slice(0, 8);

  const flash = (message, isError = false) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(message); setToastError(isError);
    setToastRevision((value) => value + 1);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    if (!selectedSampleFiltered || !selectedMetricRows.length || !selectedMetric) return;
    setSelectedSample({ metricId: selectedMetric.id, index: selectedMetricRows[0].index });
    setAttachmentCollapsed(false);
    flash("误信号已隐藏，已定位到下一条有效数据");
  }, [selectedSampleFiltered, selectedMetric?.id, filterFalseSignals]);

  const openDialog = (setter, event) => {
    dialogReturnFocusRef.current = event?.currentTarget || document.activeElement;
    setter(true);
  };

  const closeDialog = (setter) => {
    const returnTarget = dialogReturnFocusRef.current;
    setter(false);
    window.setTimeout(() => {
      if (returnTarget?.isConnected) returnTarget.focus?.();
      else document.querySelector(`[data-metric-id="${selectedSample.metricId}"]`)?.focus?.();
    }, 0);
  };

  const closeContextMenu = (returnFocus = false) => {
    const metricId = contextMenu?.metricId;
    setContextMenu(null);
    if (returnFocus) window.setTimeout(() => {
      const target = contextReturnFocusRef.current;
      if (target?.isConnected) target.focus?.();
      else document.querySelector(`[data-metric-id="${metricId}"]`)?.focus?.();
    }, 0);
  };

  const toggleMetric = (id) => setActiveMetrics((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const toggleMetricGroup = (groupMetrics) => {
    const ids = groupMetrics.map((metric) => metric.id);
    const allSelected = ids.every((id) => activeMetrics.includes(id));
    setActiveMetrics((current) => allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  };

  const setRangePreset = (days) => {
    const preset = getPresetRange(days, formatDateInput(new Date()));
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
  };

  const revertRangeDraft = () => {
    setStartDate(appliedStartDate);
    setEndDate(appliedEndDate);
    flash("已撤销查询范围修改");
  };

  const openDatePicker = (inputRef) => {
    const input = inputRef.current;
    if (!input || input.disabled) return;
    try {
      if (typeof input.showPicker === "function") input.showPicker();
      else input.focus();
    } catch {
      input.focus();
    }
  };

  const selectPoint = (id) => {
    const point = pointCatalog[id];
    if (!point) return;
    const pointMetric = metrics.find((metric) => metric.id === point.sample.metricId);
    const pointValue = baseSeries[point.sample.metricId]?.[point.sample.index];
    const pointOperation = pointMetric && isAlarmPoint(pointMetric, pointValue)
      ? resolveOperationByAnalysisSelection(id, point.sample.metricId)
      : null;
    const automaticRange = getPresetRange(15, formatDateInput(new Date()));
    window.clearTimeout(queryTimerRef.current);
    setLoading(false);
    setSelectedPoint(id);
    setLinkedContext(pointOperation ? {
      linkedEventId: pointOperation.id,
      pointId: id,
      metricId: pointOperation.analysisMetric,
      stationCode: pointOperation.stationCode,
      cameraId: pointOperation.cameraId,
    } : null);
    setActiveMetrics(point.metrics);
    setAppliedMetrics(point.metrics);
    setStartDate(automaticRange.startDate);
    setEndDate(automaticRange.endDate);
    setAppliedStartDate(automaticRange.startDate);
    setAppliedEndDate(automaticRange.endDate);
    setSelectedSample(point.sample);
    setChartViewport(fullChartViewport());
    setAttachmentCollapsed(false);
    setCollapsedPlots([]);
    setResultFilter("all");
    setQueryMode("auto");
    setLoading(true);
    queryTimerRef.current = window.setTimeout(() => {
      setRun((value) => value + 1);
      setLoading(false);
      setLastQueryAt(formatClock());
      flash(`已切换至${point.label}，近15天数据已自动查询`);
    }, 420);
  };

  const analyze = () => {
    const days = draftDays;
    if (dateRangeError) return flash(dateRangeError, true);
    if (!draftDefinitions.length) return flash("请至少选择一个指标", true);
    window.clearTimeout(queryTimerRef.current);
    setQueryMode("manual");
    setLoading(true);
    queryTimerRef.current = window.setTimeout(() => {
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
      setAppliedMetrics(activeMetrics);
      setChartViewport(fullChartViewport());
      if (!activeMetrics.includes(selectedSample.metricId)) setSelectedSample({ metricId: draftDefinitions[0].id, index: selectedSample.index });
      setRun((value) => value + 1);
      setLoading(false);
      setLastQueryAt(formatClock());
      setResultFilter("all");
      flash(`查询完成，已加载${formatRangeText(startDate, endDate)}的趋势数据`);
    }, 520);
  };

  const resetAnalysis = () => {
    const automaticRange = getPresetRange(15, formatDateInput(new Date()));
    window.clearTimeout(queryTimerRef.current);
    setStartDate(automaticRange.startDate);
    setEndDate(automaticRange.endDate);
    setActiveMetrics(pointInfo.metrics);
    setQueryMode("auto");
    setLoading(true);
    queryTimerRef.current = window.setTimeout(() => {
      setAppliedStartDate(automaticRange.startDate);
      setAppliedEndDate(automaticRange.endDate);
      setAppliedMetrics(pointInfo.metrics);
      setSelectedSample(pointInfo.sample);
      setChartViewport(fullChartViewport());
      setCollapsedPlots([]);
      setMarkedSamples((current) => current.filter((key) => !key.startsWith(`${selectedPoint}|`)));
      setFalseSignals((current) => current.filter((key) => !key.startsWith(`${selectedPoint}|`)));
      setFilterFalseSignals(false);
      setAlarmLine(false);
      setDynamicCursor(true);
      setRun(0);
      setAttachmentCollapsed(false);
      setResultFilter("all");
      setLastQueryAt(formatClock());
      setLoading(false);
      flash("已恢复默认条件，并自动查询近15天数据");
    }, 420);
  };

  const applySharedChartViewport = (nextViewport, interaction = {}) => {
    const next = normalizeChartViewport(nextViewport, CHART_SAMPLE_COUNT);
    setChartViewport(next);
    setSelectedSample((current) => {
      if (current.index >= next.start && current.index <= next.end) return current;
      const fallbackIndex = clampNumber(Math.round(interaction.anchorIndex ?? current.index), next.start, next.end);
      return { metricId: interaction.metricId || current.metricId, index: fallbackIndex };
    });
  };

  const viewportSummaryFor = (viewportValue) => {
    const next = normalizeChartViewport(viewportValue, CHART_SAMPLE_COUNT);
    const count = next.end - next.start + 1;
    return count >= CHART_SAMPLE_COUNT
      ? `全览${CHART_SAMPLE_COUNT}个采样点`
      : `${sampleAxisLabel(next.start, appliedStartDate, appliedEndDate, true)} 至 ${sampleAxisLabel(next.end, appliedStartDate, appliedEndDate, true)}，${count}个采样点`;
  };

  const zoomSynchronizedCharts = (direction, anchorIndex = selectedSample.index, metricId = selectedSample.metricId, announce = true) => {
    const next = zoomChartViewport(normalizedChartViewport, direction, anchorIndex, CHART_SAMPLE_COUNT);
    if (chartViewportsEqual(next, normalizedChartViewport)) {
      if (announce) flash(direction === "in" ? `已达到最小范围（${MIN_CHART_VISIBLE_SAMPLES}个采样点）` : "当前已是完整时间范围");
      return false;
    }
    applySharedChartViewport(next, { source: "toolbar", metricId, anchorIndex });
    if (announce) flash(`趋势图已同步${direction === "in" ? "放大" : "缩小"}：${viewportSummaryFor(next)}`);
    return true;
  };

  const commitChartViewportInteraction = (type, nextViewport, metricId) => {
    const definition = activeDefinitions.find((item) => item.id === metricId);
    flash(`${definition?.label || "趋势图"}已${type === "pan" ? "平移" : "缩放"}，全部指标同步至${viewportSummaryFor(nextViewport)}`);
  };

  const resetSharedChartViewport = (reason = "button", metricId = selectedSample.metricId) => {
    if (chartAtFullRange) {
      if (reason !== "double-click") flash("当前趋势图已是全览");
      return;
    }
    setChartViewport(fullChartViewport());
    const definition = activeDefinitions.find((item) => item.id === metricId);
    flash(`${definition?.label || "趋势图"}已恢复全览，其他指标同步复位`);
  };

  const currentMarked = markedSamples.includes(selectedSampleKey);
  const currentFalseSignal = falseSignals.includes(selectedSampleKey);
  const contextActions = [
    { id: "toggle-cursor", Icon: IconPointer, label: dynamicCursor ? "关闭动态游标" : "开启动态游标", pressed: dynamicCursor, disabled: loading, hint: "同步定位所有图谱的同一时刻" },
    { id: "zoom-in", Icon: IconZoomIn, label: "同步放大", disabled: loading || chartAtMinimumRange, hint: chartAtMinimumRange ? `已达到最小范围（${MIN_CHART_VISIBLE_SAMPLES}个点）` : "以当前点为中心放大全部趋势图" },
    { id: "zoom-out", Icon: IconZoomOut, label: "同步缩小", disabled: loading || chartAtFullRange, hint: chartAtFullRange ? "当前已是完整时间范围" : "缩小全部趋势图的时间窗口" },
    { id: "reset-viewport", Icon: IconRefresh, label: "恢复全览", disabled: loading || chartAtFullRange, hint: chartAtFullRange ? "当前已是完整时间范围" : "恢复全部趋势图的完整时间范围" },
    { id: "toggle-mark", Icon: IconFlag, label: currentMarked ? "取消标注" : "标注当前点", pressed: currentMarked, disabled: loading, hint: "在当前采样点显示标注环" },
    { id: "snapshot-chart", Icon: IconScreenshot, label: "截单个图形", disabled: loading || contextMenu?.collapsed, hint: contextMenu?.collapsed ? "请先展开当前图谱" : "下载当前图谱 PNG 快照" },
    { id: "snapshot-all", Icon: IconMaximize, label: "截整个图形", disabled: loading, hint: "下载全部展开图谱 PNG 快照" },
    { id: "settings", Icon: IconSettings, label: "界面设置", hint: "统一配置游标、报警线与误信号筛选" },
    { id: "toggle-alarm-line", Icon: IconAlertTriangle, label: alarmLine ? "隐藏报警线" : "显示报警线", pressed: alarmLine, disabled: loading, hint: "显示各指标报警阈值" },
    { id: "toggle-false-signal", Icon: IconFilterOff, label: currentFalseSignal ? "取消误信号" : "设为误信号", pressed: currentFalseSignal, disabled: loading, hint: "标记当前采样点" },
    { id: "toggle-false-filter", Icon: IconFilter, label: filterFalseSignals ? "显示全部信号" : "过滤误信号", pressed: filterFalseSignals, disabled: loading, hint: "同步影响图谱、结果数据与导出" },
    { id: "waveform", Icon: IconWaveSine, label: "关联波形分析", disabled: loading || selectedAttachment?.type !== "waveform", hint: selectedAttachment?.type === "waveform" ? "打开当前采样的波形详情" : "当前采样点无波形附件" },
    { id: "export-chart", Icon: IconFileExport, label: "导出图形", disabled: loading || contextMenu?.collapsed, hint: contextMenu?.collapsed ? "请先展开当前图谱" : "下载当前图谱 SVG 文件" },
  ];

  const downloadBlob = (content, type, filename) => {
    const link = document.createElement("a");
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const downloadSvgAsPng = (svg, filename, successMessage) => {
    const content = new XMLSerializer().serializeToString(svg);
    const sourceUrl = URL.createObjectURL(new Blob([content], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      const viewBox = svg.viewBox?.baseVal;
      const width = Number(svg.getAttribute("width")) || 1440;
      const height = Number(svg.getAttribute("height")) || Math.round(width * ((viewBox?.height || 178) / (viewBox?.width || 720)));
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height); context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(sourceUrl);
        if (!blob) return flash("图形快照生成失败", true);
        downloadBlob(blob, "image/png", filename);
        flash(successMessage);
      }, "image/png");
    };
    image.onerror = () => { URL.revokeObjectURL(sourceUrl); flash("图形快照生成失败", true); };
    image.src = sourceUrl;
  };

  const downloadSelectedPng = () => {
    const metricId = contextMenu?.metricId || selectedSample.metricId;
    const svg = document.querySelector(`[data-metric-id="${metricId}"] svg`);
    if (!svg) return flash("请先展开当前图谱", true);
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const viewBox = svg.viewBox.baseVal;
    clone.setAttribute("width", "1440");
    clone.setAttribute("height", String(Math.round(1440 * viewBox.height / viewBox.width)));
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style"); style.textContent = CHART_EXPORT_STYLE; clone.prepend(style);
    downloadSvgAsPng(clone, `${pointInfo.label}-${metricId}-快照.png`, "当前图形已截取为 PNG");
  };

  const downloadSelectedSvg = () => {
    const metricId = contextMenu?.metricId || selectedSample.metricId;
    const svg = document.querySelector(`[data-metric-id="${metricId}"] svg`);
    if (!svg) return flash("当前图形不可导出", true);
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = CHART_EXPORT_STYLE;
    clone.prepend(style);
    const content = new XMLSerializer().serializeToString(clone);
    downloadBlob(content, "image/svg+xml;charset=utf-8", `${pointInfo.label}-${metricId}.svg`);
    flash("当前图形已导出为 SVG");
  };

  const downloadAllCharts = () => {
    const plots = [...document.querySelectorAll(".diagnostic-plot:not(.collapsed)")].map((plot) => ({
      label: plot.querySelector(".plot-title b")?.textContent || "趋势图",
      svg: plot.querySelector("svg"),
    })).filter((item) => item.svg);
    if (!plots.length) return flash("请先展开至少一个图谱", true);
    const namespace = "http://www.w3.org/2000/svg";
    const width = 960;
    const chartHeight = 250;
    const titleHeight = 34;
    const outer = document.createElementNS(namespace, "svg");
    outer.setAttribute("xmlns", namespace);
    outer.setAttribute("width", String(width));
    outer.setAttribute("height", String(44 + plots.length * (chartHeight + titleHeight)));
    outer.setAttribute("viewBox", `0 0 ${width} ${44 + plots.length * (chartHeight + titleHeight)}`);
    const background = document.createElementNS(namespace, "rect");
    background.setAttribute("width", "100%"); background.setAttribute("height", "100%"); background.setAttribute("fill", "#ffffff");
    outer.appendChild(background);
    const title = document.createElementNS(namespace, "text");
    title.setAttribute("x", "18"); title.setAttribute("y", "27"); title.setAttribute("fill", "#24394f"); title.setAttribute("font-family", "Microsoft YaHei,Arial,sans-serif"); title.setAttribute("font-size", "16"); title.setAttribute("font-weight", "600");
    title.textContent = `${pointInfo.label} · ${appliedStartDate} 至 ${appliedEndDate}`;
    outer.appendChild(title);
    plots.forEach((item, index) => {
      const y = 44 + index * (chartHeight + titleHeight);
      const label = document.createElementNS(namespace, "text");
      label.setAttribute("x", "18"); label.setAttribute("y", String(y + 22)); label.setAttribute("fill", "#344b63"); label.setAttribute("font-family", "Microsoft YaHei,Arial,sans-serif"); label.setAttribute("font-size", "13"); label.setAttribute("font-weight", "600"); label.textContent = item.label;
      outer.appendChild(label);
      const clone = item.svg.cloneNode(true);
      clone.setAttribute("x", "0"); clone.setAttribute("y", String(y + titleHeight)); clone.setAttribute("width", String(width)); clone.setAttribute("height", String(chartHeight));
      const style = document.createElementNS(namespace, "style"); style.textContent = CHART_EXPORT_STYLE; clone.prepend(style);
      outer.appendChild(clone);
    });
    downloadSvgAsPng(outer, `${pointInfo.label}-全部趋势图.png`, `已截取${plots.length}个展开图谱`);
  };

  const exportAllData = () => {
    if (loading) return flash("查询完成后再导出数据", true);
    if (!activeDefinitions.length) return flash("请先选择需要导出的指标", true);
    const rows = ["指标,采样时间,值,附件,报警"];
    activeDefinitions.forEach((metric) => shiftedSeries[metric.id].forEach((value, index) => {
      if (sampleIsFiltered(metric.id, index)) return;
      rows.push(`${metric.label},${sampleTime(index, appliedStartDate, appliedEndDate)},${displayValue(metric, value)},${getAttachment(metric.id, index) ? "是" : "否"},${isAlarmPoint(metric, value) ? "是" : "否"}`);
    }));
    downloadBlob(`\ufeff${rows.join("\n")}`, "text/csv;charset=utf-8", `${pointInfo.label}-音视频分析数据.csv`);
    flash(filterFalseSignals ? "已导出筛除误信号后的查询数据" : "当前查询数据已导出");
  };

  const handleContextAction = (actionId, source = "toolbar") => {
    const invokedFromMenu = source === "menu";
    let opensDialog = false;
    if (actionId === "toggle-cursor") {
      setDynamicCursor((value) => !value);
      flash(dynamicCursor ? "动态游标已关闭" : "动态游标已开启");
    } else if (actionId === "zoom-in") {
      zoomSynchronizedCharts("in", contextMenu?.index ?? selectedSample.index, contextMenu?.metricId || selectedSample.metricId);
    } else if (actionId === "zoom-out") {
      zoomSynchronizedCharts("out", contextMenu?.index ?? selectedSample.index, contextMenu?.metricId || selectedSample.metricId);
    } else if (actionId === "reset-viewport") {
      resetSharedChartViewport("context-menu", contextMenu?.metricId || selectedSample.metricId);
    } else if (actionId === "toggle-mark") {
      setMarkedSamples((current) => currentMarked ? current.filter((item) => item !== selectedSampleKey) : [...current, selectedSampleKey]);
      flash(currentMarked ? "当前标注已移除" : "当前趋势点已标注");
    } else if (actionId === "settings") {
      if (invokedFromMenu) dialogReturnFocusRef.current = contextReturnFocusRef.current?.closest?.(".diagnostic-plot") || contextReturnFocusRef.current;
      setSettingsOpen(true);
      opensDialog = true;
    } else if (actionId === "toggle-alarm-line") {
      setAlarmLine((value) => !value);
      flash(alarmLine ? "报警线已隐藏" : "报警线已显示");
    } else if (actionId === "toggle-false-signal") {
      setFalseSignals((current) => currentFalseSignal ? current.filter((item) => item !== selectedSampleKey) : [...current, selectedSampleKey]);
      flash(currentFalseSignal ? "已取消误信号" : "当前点已设置为误信号");
    } else if (actionId === "toggle-false-filter") {
      setFilterFalseSignals((value) => !value);
      flash(filterFalseSignals ? "已显示全部信号" : "已在图谱、列表和导出中筛除误信号");
    } else if (actionId === "snapshot-chart") {
      downloadSelectedPng();
    } else if (actionId === "export-chart") {
      downloadSelectedSvg();
    } else if (actionId === "snapshot-all") {
      downloadAllCharts();
    } else if (actionId === "waveform") {
      if (selectedAttachment?.type === "waveform") {
        if (invokedFromMenu) dialogReturnFocusRef.current = contextReturnFocusRef.current?.closest?.(".diagnostic-plot") || contextReturnFocusRef.current;
        setWaveformOpen(true);
        opensDialog = true;
      }
      else flash("当前时刻无关联波形", true);
    }
    if (invokedFromMenu) closeContextMenu(!opensDialog);
  };

  const resetChartView = (metricId, reason = "button") => {
    const definition = activeDefinitions.find((metric) => metric.id === metricId) || activeDefinitions[0];
    if (!definition) return flash("当前没有可重置的图谱", true);
    if (chartAtFullRange) {
      if (reason !== "double-click") flash("当前趋势图已是全览");
      return;
    }
    setChartViewport(fullChartViewport());
    setChartRevision((value) => value + 1);
    flash(`${definition.label}已恢复全览，其他指标同步复位`);
  };

  const resetAllChartViews = () => {
    if (!activeDefinitions.length) return flash("当前没有可重置的图谱", true);
    setCollapsedPlots([]);
    setSelectedSample(activeDefinitions.some((metric) => metric.id === pointInfo.sample.metricId) ? pointInfo.sample : { metricId: activeDefinitions[0].id, index: 3 });
    setDynamicCursor(true);
    setChartViewport(fullChartViewport());
    setChartRevision((value) => value + 1);
    flash("全部图谱视图已重置");
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        flash("已退出全屏分析");
      } else if (rootRef.current?.requestFullscreen) {
        await rootRef.current.requestFullscreen();
        flash("已进入全屏分析，按 Esc 可退出");
      } else {
        flash("当前浏览器不支持全屏", true);
      }
    } catch {
      flash("当前浏览器未允许全屏", true);
    }
  };

  const collapseTree = () => {
    setTreeCollapsed(true);
    window.setTimeout(() => treeRestoreRef.current?.focus(), 0);
  };

  const restoreTree = () => {
    setTreeCollapsed(false);
    window.setTimeout(() => treeCollapseRef.current?.focus(), 0);
  };

  const collapseConditions = () => {
    setConditionsCollapsed(true);
    window.setTimeout(() => conditionsRestoreRef.current?.focus(), 0);
  };

  const restoreConditions = () => {
    setConditionsCollapsed(false);
    window.setTimeout(() => conditionsCollapseRef.current?.focus(), 0);
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

  const resizeOperationByKeyboard = (event) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") return setOperationWidth(224);
    if (event.key === "End") return setOperationWidth(380);
    setOperationWidth((width) => Math.min(380, Math.max(224, width + (event.key === "ArrowLeft" ? 16 : -16))));
  };

  const beginEvidenceResize = (event) => {
    if (event.button !== 0 || attachmentCollapsed) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    evidenceResizeCleanupRef.current?.(false);
    const startX = event.clientX;
    const startWidth = evidenceWidth;
    let latestWidth = startWidth;
    const move = (moveEvent) => {
      latestWidth = clampNumber(startWidth + startX - moveEvent.clientX, EVIDENCE_PANE_MIN_WIDTH, evidenceMaxWidth);
      setEvidenceWidth(latestWidth);
    };
    const stop = (announce = true) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      document.body.classList.remove("evidence-resizing");
      evidenceResizeCleanupRef.current = null;
      if (announce && Math.round(latestWidth) !== Math.round(startWidth)) flash(`证据附件宽度已调整为 ${Math.round(latestWidth)} 像素`);
    };
    evidenceResizeCleanupRef.current = stop;
    document.body.classList.add("evidence-resizing");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  const resizeEvidenceByKeyboard = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? EVIDENCE_PANE_KEYBOARD_STEP * 2 : EVIDENCE_PANE_KEYBOARD_STEP;
    const nextWidth = event.key === "Home"
      ? EVIDENCE_PANE_MIN_WIDTH
      : event.key === "End"
        ? evidenceMaxWidth
        : clampNumber(evidenceWidth + (event.key === "ArrowLeft" ? step : -step), EVIDENCE_PANE_MIN_WIDTH, evidenceMaxWidth);
    setEvidenceWidth(nextWidth);
    flash(`证据附件宽度已调整为 ${Math.round(nextWidth)} 像素`);
  };

  const resetEvidenceWidth = () => {
    const defaultWidth = Math.min(defaultEvidencePaneWidth(), evidenceMaxWidth);
    setEvidenceWidth(defaultWidth);
    flash(`证据附件已恢复默认宽度 ${Math.round(defaultWidth)} 像素`);
  };

  return (
    <div ref={rootRef} className={`analysis-page analysis-framework-layout ${treeCollapsed ? "tree-collapsed" : ""} ${conditionsCollapsed ? "conditions-collapsed" : ""} ${isFullscreen ? "is-fullscreen" : ""}`} style={{ "--operation-width": `${operationWidth}px`, "--evidence-width": `${evidenceWidth}px` }}>
      <aside id="analysis-device-tree" className={`analysis-resource-pane exact-tree-pane ${treeCollapsed ? "collapsed" : ""}`}>
        {treeCollapsed ? (
          <button ref={treeRestoreRef} className="analysis-panel-restore tree-panel-restore" onClick={restoreTree} aria-label="展开设备树" aria-expanded="false" aria-controls="analysis-device-tree" title="展开设备树"><IconChevronRight size={16} /><span>设备树</span></button>
        ) : (
          <>
            <div className="tree-pane-header">
              <div className="source-tree-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名称/编码" aria-label="按测点名称或编码搜索" /><IconSearch size={16} aria-hidden="true" /><button type="button" className="tree-search-clear" onClick={() => { setQuery(""); flash("搜索条件已清空"); }} disabled={!query} aria-label="清空设备树搜索" title={query ? "清空搜索" : "暂无搜索内容"}><IconX size={14} /></button></div>
              <button ref={treeCollapseRef} className="analysis-panel-collapse-button" onClick={collapseTree} aria-label="收起设备树" aria-expanded="true" aria-controls="analysis-device-tree" title="收起设备树"><IconChevronLeft size={16} /></button>
            </div>
            <div className="source-tree-filters" role="group" aria-label="测点类型筛选">
              {[{ id: "all", label: "全部" }, { id: "video", label: "视频" }, { id: "audio", label: "音频" }, { id: "alarm", label: "报警" }].map((item) => <button key={item.id} className={sourceFilter === item.id ? "active" : ""} aria-pressed={sourceFilter === item.id} onClick={() => setSourceFilter(item.id)}>{item.label}</button>)}
            </div>
            <div className="source-tree-scroll"><ResourceTree selected={selectedPoint} onSelect={selectPoint} query={query} filter={sourceFilter} /></div>
          </>
        )}
      </aside>

      <main className={`analysis-main exact-analysis-main ${linkedContext && linkedOperation ? "has-linked-context" : ""}`}>
        <div className="source-tool-strip framework-tool-strip" role="toolbar" aria-label="音视频分析工具">
          <div className="analysis-workbench-title"><IconDeviceCctv size={18} /><span><strong>音视频分析</strong><small>联合诊断工作台</small></span></div>
          <div className="framework-tool-tabs" />
          <button className={`favorite-tool ${favoriteTool ? "active" : ""}`} onClick={() => { setFavoriteTool((value) => !value); flash(favoriteTool ? "已从常用工具移除" : "已加入常用工具"); }} aria-label={favoriteTool ? "从常用工具移除音视频分析" : "将音视频分析加入常用工具"} aria-pressed={favoriteTool}>{favoriteTool ? <IconStarFilled size={16} /> : <IconStar size={16} />}常用</button>
          <button className="tool-help" onClick={(event) => openDialog(setHelpOpen, event)} aria-label="打开音视频分析操作说明" title="操作说明"><IconHelpCircle size={17} /></button>
        </div>
        <div className="chart-operation-strip" role="toolbar" aria-label="趋势图操作">
          <span className="chart-scope-label"><IconChartLine size={15} />同步趋势</span>
          <span className={`chart-view-status ${chartAtFullRange ? "" : "zoomed"}`} role="status" aria-live="polite" data-window-start={normalizedChartViewport.start} data-window-end={normalizedChartViewport.end}>{chartViewportSummary}</span>
          <button title={chartAtMinimumRange ? `已达到最小范围（${MIN_CHART_VISIBLE_SAMPLES}个点）` : "以当前选中点为中心同步放大"} aria-label="同步放大趋势图" disabled={loading || chartAtMinimumRange} onClick={() => zoomSynchronizedCharts("in")}><IconZoomIn size={15} />放大</button>
          <button title={chartAtFullRange ? "当前已是完整时间范围" : "同步缩小趋势图时间范围"} aria-label="同步缩小趋势图" disabled={loading || chartAtFullRange} onClick={() => zoomSynchronizedCharts("out")}><IconZoomOut size={15} />缩小</button>
          <button className={dynamicCursor ? "active" : ""} title={dynamicCursor ? "关闭同步游标" : "开启同步游标"} aria-pressed={dynamicCursor} disabled={loading} onClick={() => handleContextAction("toggle-cursor")}><IconPointer size={15} />单游标</button>
          <button className={currentMarked ? "active" : ""} title={currentMarked ? "取消当前点标注" : "标注当前点"} aria-pressed={currentMarked} disabled={loading} onClick={() => handleContextAction("toggle-mark")}><IconFlag size={15} />标注</button>
          <button className={alarmLine ? "active" : ""} title={alarmLine ? "隐藏报警线" : "显示报警线"} aria-pressed={alarmLine} disabled={loading} onClick={() => handleContextAction("toggle-alarm-line")}><IconAlertTriangle size={15} />报警线</button>
          <button className={currentFalseSignal ? "active" : ""} title={currentFalseSignal ? "取消当前点误信号" : "设置当前点为误信号"} aria-pressed={currentFalseSignal} disabled={loading} onClick={() => handleContextAction("toggle-false-signal")}><IconFilterOff size={15} />误信号</button>
          <button title={selectedAttachment?.type === "waveform" ? "打开关联波形分析" : "当前采样点无波形附件"} disabled={loading || selectedAttachment?.type !== "waveform"} onClick={(event) => { dialogReturnFocusRef.current = event.currentTarget; handleContextAction("waveform"); }}><IconWaveSine size={15} />波形</button>
          <button className={!attachmentCollapsed ? "active" : ""} title={attachmentCollapsed ? "展开证据附件" : "收起证据附件"} aria-pressed={!attachmentCollapsed} aria-expanded={!attachmentCollapsed} aria-controls="analysis-evidence-pane" onClick={() => setAttachmentCollapsed((value) => !value)}><IconPaperclip size={15} />证据</button>
          <button title={chartAtFullRange ? "当前已是全览" : "恢复全览并重置图谱选择"} disabled={loading || chartAtFullRange} onClick={resetAllChartViews}><IconRefresh size={15} />重置视图</button>
          <button title={loading ? "查询完成后可导出" : "导出当前查询数据"} disabled={loading} onClick={exportAllData}><IconFileExport size={15} />导出</button>
          <button title="界面设置" aria-label="打开界面设置" onClick={(event) => openDialog(setSettingsOpen, event)}><IconSettings size={15} /></button>
          <button className={isFullscreen ? "active" : ""} title={isFullscreen ? "取消全屏" : "全屏"} aria-label={isFullscreen ? "退出全屏分析" : "进入全屏分析"} aria-pressed={isFullscreen} onClick={toggleFullscreen}><IconMaximize size={15} /></button>
        </div>
        <div className="analysis-context-bar">
          <div className="analysis-context-copy">
            <div className="analysis-context-title">{pointInfo.type === "audio" ? <IconMicrophone size={17} /> : <IconVideo size={17} />}<strong>{pointInfo.label}</strong><span>{pointInfo.type === "audio" ? "音频测点" : "视频测点"}</span><i>在线</i></div>
            <div className="analysis-context-path" title={pointInfo.path}>{pointInfo.path}</div>
          </div>
          <div className="analysis-query-summary" aria-live="polite">
            <span className={`analysis-query-status ${loading ? "loading" : conditionsDirty ? "dirty" : ""}`}><i />{loading ? queryMode === "manual" ? "正在查询" : "自动查询中" : conditionsDirty ? "条件待应用" : queryMode === "manual" ? "查询完成" : "自动查询完成"}</span>
            <b>{appliedRangeSummary} · {activeDefinitions.length}项指标 · {resultStats.total}条数据</b>
            <small>{loading ? `目标 ${formatRangeText(startDate, endDate, true)}` : `更新于 ${lastQueryAt}`}</small>
          </div>
          {linkedContext && linkedOperation && <nav className="analysis-linked-context" aria-label="关联业务模块" title={`${linkedOperation.displayId} · ${linkedOperation.devicePath} · ${linkedOperation.timeWithMillis}`}>
              <b className="linked-context-label">当前报警联动</b>
              <span className="linked-event-id">{linkedOperation.displayId} · {linkedOperation.title}</span>
              <span className="linked-selected-time">{linkedContext.alarmTime || linkedOperation.timeWithMillis}</span>
              <span className={`linked-status status-${linkedEvent?.status || "pending"}`}>{operationStatusLabel(linkedEvent?.status)}</span>
              {(linkedEvent?.defectId || linkedEvent?.actionNote) && <span className="linked-result" title={linkedEvent.defectId ? `缺陷编号：${linkedEvent.defectId}；处置说明：${linkedEvent.actionNote || "—"}` : `处置说明：${linkedEvent.actionNote}`}>{linkedEvent.defectId ? `缺陷 ${linkedEvent.defectId}` : `处置 ${linkedEvent.actionNote}`}</span>}
              <a href={operationHref("/video-monitoring", linkedEventId)}>智慧视频监控</a>
              <a href={operationHref("/intelligent-diagnosis", linkedEventId)}>智能诊断</a>
              <a href={operationHref("/collection-stations", linkedEventId)}>采集站管理</a>
            </nav>
          }
          <div className="analysis-point-legend" aria-label="数据点状态图例"><span><i className="empty" />附件原因</span><span><i className="attached" />有附件</span><span><i className="alarm" />报警</span></div>
        </div>
        <div ref={sourceAnalysisBodyRef} className="source-analysis-body">
          <div className={`source-plots-scroll plots-expanded-${expandedCount}`} aria-busy={loading}>
            {activeDefinitions.map((metric) => (
              <DiagnosticPlot
                key={`${metric.id}-${chartRevision}`}
                pointId={selectedPoint}
                metric={metric}
                data={shiftedSeries[metric.id]}
                selectedSample={selectedSample}
                onSelectSample={(sample) => {
                  setSelectedSample(sample);
                  setAttachmentCollapsed(false);
                  const sampleMetric = metrics.find((item) => item.id === sample.metricId);
                  const sampleValue = shiftedSeries[sample.metricId]?.[sample.index];
                  if (!sampleMetric || !isAlarmPoint(sampleMetric, sampleValue)) {
                    setLinkedContext(null);
                    return;
                  }
                  const sampleOperation = resolveOperationByAnalysisSelection(selectedPoint, sample.metricId);
                  if (!sampleOperation) {
                    setLinkedContext(null);
                    flash(`${sampleMetric.label}报警尚未建立跨模块事件`, true);
                    return;
                  }
                  const alarmTime = sampleTime(sample.index, appliedStartDate, appliedEndDate);
                  setLinkedContext({
                    linkedEventId: sampleOperation.id,
                    pointId: selectedPoint,
                    metricId: sample.metricId,
                    stationCode: sampleOperation.stationCode,
                    cameraId: sampleOperation.cameraId,
                    alarmTime,
                  });
                  flash(`已定位${sampleMetric.label}报警 · ${alarmTime}`);
                }}
                collapsed={collapsedPlots.includes(metric.id)}
                onCollapse={() => setCollapsedPlots((current) => current.includes(metric.id) ? current.filter((item) => item !== metric.id) : [...current, metric.id])}
                onOpenContextMenu={(menu) => {
                  contextReturnFocusRef.current = menu.returnFocus;
                  setContextMenu({
                    x: Math.max(8, Math.min(menu.x, window.innerWidth - 224)),
                    y: Math.max(8, Math.min(menu.y, window.innerHeight - 568)),
                    metricId: menu.metricId,
                    index: menu.index,
                    collapsed: menu.collapsed,
                  });
                }}
                startDate={appliedStartDate}
                endDate={appliedEndDate}
                chartHeight={metric.kind === "numeric" ? 220 : metric.yLabels.length <= 2 ? 190 : 210}
                dynamicCursor={dynamicCursor}
                onToggleCursor={() => { setDynamicCursor((value) => !value); flash(dynamicCursor ? "动态游标已关闭" : "动态游标已开启"); }}
                onResetView={(reason) => resetChartView(metric.id, reason)}
                alarmLine={alarmLine}
                markedSamples={markedSamples}
                falseSignals={falseSignals}
                filterFalseSignals={filterFalseSignals}
                viewport={normalizedChartViewport}
                onViewportChange={applySharedChartViewport}
                onViewportCommit={commitChartViewportInteraction}
                interactionDisabled={loading}
              />
            ))}
            {!activeDefinitions.length && <div className="source-empty-metrics"><IconChartDots size={28} /><span>请选择至少一个分析指标</span></div>}
          </div>
          <AttachmentPane collapsed={attachmentCollapsed} onToggle={() => setAttachmentCollapsed((value) => !value)} width={evidenceWidth} maxWidth={evidenceMaxWidth} onResizeStart={beginEvidenceResize} onResizeKeyDown={resizeEvidenceByKeyboard} onResetWidth={resetEvidenceWidth} items={attachmentItems} selectedMetricId={selectedMetric?.id} onSelectMetric={(metricId) => { setSelectedSample((current) => ({ metricId, index: current.index })); setAttachmentCollapsed(false); }} onFeedback={flash} />
          {loading && <div className="analysis-loading" role="status" aria-live="polite"><IconRefresh size={27} /><strong>正在查询 {formatRangeText(startDate, endDate, true)} 趋势数据...</strong></div>}
        </div>
      </main>

      <aside id="analysis-conditions-panel" className={`analysis-operation-pane ${conditionsCollapsed ? "collapsed" : ""}`}>
        {conditionsCollapsed ? (
          <button ref={conditionsRestoreRef} className="analysis-panel-restore conditions-panel-restore" onClick={restoreConditions} aria-label="展开分析条件" aria-description={conditionsDirty ? "存在待应用条件" : undefined} aria-expanded="false" aria-controls="analysis-conditions-panel" title={conditionsDirty ? "展开分析条件（存在待应用条件）" : "展开分析条件"}><IconChevronLeft size={16} /><span>分析条件</span>{conditionsDirty && <i title="存在待应用条件" />}</button>
        ) : (
          <>
            <div className="operation-resize-handle" role="separator" tabIndex="0" aria-label="拖拽或使用方向键调整分析条件栏宽度" aria-orientation="vertical" aria-valuemin="224" aria-valuemax="380" aria-valuenow={operationWidth} aria-valuetext={`${Math.round(operationWidth)} 像素`} onPointerDown={beginOperationResize} onKeyDown={resizeOperationByKeyboard} onDoubleClick={() => { setOperationWidth(292); flash("分析条件栏已恢复默认宽度"); }} title="拖拽调整宽度，双击恢复默认" />
            <header className="operation-pane-title"><div className="operation-pane-heading"><IconAdjustmentsHorizontal size={17} /><strong>分析条件</strong><small className={conditionsDirty ? "dirty" : ""}>{conditionsDirty ? "待应用" : "已同步"}</small></div><span className="operation-pane-tools"><button ref={conditionsCollapseRef} onClick={collapseConditions} aria-label="收起分析条件" aria-expanded="true" aria-controls="analysis-conditions-panel" title="收起分析条件"><IconChevronRight size={16} /></button><button onClick={(event) => openDialog(setSettingsOpen, event)} aria-label="打开界面设置" title="界面设置"><IconInfoCircle size={16} /></button></span></header>
        <div className="operation-pane-scroll">
          <section className="operation-section query-range-section">
            <div className="operation-section-title"><span><i className="operation-step">1</i>查询范围</span><small id="analysis-date-message" className={dateRangeError ? "error" : ""} role={dateRangeError ? "alert" : undefined} aria-live="polite">{dateRangeError || `共${draftDays}天 · 最多30天`}</small></div>
            <div className="range-presets" aria-label="最近查询范围">{[1, 7, 15, 30].map((days) => <button key={days} className={activePresetDays === days ? "active" : ""} aria-pressed={activePresetDays === days} onClick={() => setRangePreset(days)} disabled={loading} title={days === 1 ? "查询今天" : `查询最近${days}天`}>{days === 1 ? "今天" : `近${days}天`}</button>)}</div>
            <label className="operation-field"><span>开始日期</span><div className={`operation-date ${startDateInvalid ? "error" : ""}`}><input ref={startDateInputRef} type="date" value={startDate} max={currentDate} required disabled={loading} aria-invalid={startDateInvalid} aria-describedby="analysis-date-message" onChange={(event) => setStartDate(event.target.value)} /><button type="button" disabled={loading} aria-label="选择开始日期" title="打开开始日期选择器" onClick={() => openDatePicker(startDateInputRef)}><IconCalendar size={15} aria-hidden="true" /></button></div></label>
            <label className="operation-field"><span>结束日期</span><div className={`operation-date ${endDateInvalid ? "error" : ""}`}><input ref={endDateInputRef} type="date" value={endDate} max={currentDate} required disabled={loading} aria-invalid={endDateInvalid} aria-describedby="analysis-date-message" onChange={(event) => setEndDate(event.target.value)} /><button type="button" disabled={loading} aria-label="选择结束日期" title="打开结束日期选择器" onClick={() => openDatePicker(endDateInputRef)}><IconCalendar size={15} aria-hidden="true" /></button></div></label>
            <div className={`range-application-state ${dateRangeError ? "error" : rangeDirty ? "dirty" : "applied"}`} data-range-state={dateRangeError ? "invalid" : rangeDirty ? "draft" : "applied"} aria-live="polite"><span><i />{dateRangeError ? "需修正" : rangeDirty ? "待应用" : "已应用"}</span><b title={draftRangeSummary}>{draftRangeSummary}</b>{rangeDirty && <button type="button" onClick={revertRangeDraft} disabled={loading}>撤销</button>}</div>
          </section>
          <section className="operation-section">
            <div className="operation-section-title"><span><i className="operation-step">2</i>诊断测点</span><small>{pointInfo.code}</small></div>
            <button type="button" className="selected-node-card" onClick={() => { setQuery(""); setSourceFilter("all"); setTreeCollapsed(false); window.setTimeout(() => document.querySelector(".source-tree-search input")?.focus(), 0); flash("请在左侧设备树选择音视频测点"); }}>{pointInfo.type === "audio" ? <IconMicrophone size={17} /> : <IconDeviceCctv size={17} />}<div><strong>{pointInfo.label}</strong><span>{pointInfo.type === "audio" ? "音频测点" : "视频测点"} · 切换后自动查询</span></div><IconChevronRight size={15} /></button>
          </section>
          <section className="operation-section metric-operation-section">
            <div className="operation-section-title"><span><i className="operation-step">3</i>关联指标</span><small>已选 {draftDefinitions.length}/{availableDefinitions.length}</small></div>
            <div className="operation-metric-groups">
              {["视觉算法", "音频算法"].map((group) => {
                const groupMetrics = availableDefinitions.filter((metric) => metric.group === group);
                if (!groupMetrics.length) return null;
                const allSelected = groupMetrics.every((metric) => activeMetrics.includes(metric.id));
                return <div className="operation-metric-group" key={group} role="group" aria-label={group}><div className="metric-group-heading"><strong>{group}</strong><button type="button" disabled={loading} onClick={() => toggleMetricGroup(groupMetrics)}>{allSelected ? "清空" : "全选"}</button></div>{groupMetrics.map((metric) => <label key={metric.id}><input type="checkbox" checked={activeMetrics.includes(metric.id)} disabled={loading} onChange={() => toggleMetric(metric.id)} /><span>{metric.label}</span></label>)}</div>;
              })}
            </div>
          </section>
          <section className="operation-section operation-data-section">
            <div className="operation-section-title"><span><IconListDetails size={14} />结果数据</span><small>{selectedMetric?.label} · 最近8条</small></div>
            <div className="result-filter-row"><button className={resultFilter === "all" ? "active" : ""} aria-pressed={resultFilter === "all"} onClick={() => setResultFilter("all")}>全部 {selectedResultStats.total}</button><button className={resultFilter === "alarm" ? "active" : ""} aria-pressed={resultFilter === "alarm"} onClick={() => setResultFilter("alarm")}>报警 {selectedResultStats.alarms}</button><button className={resultFilter === "attachment" ? "active" : ""} aria-pressed={resultFilter === "attachment"} onClick={() => setResultFilter("attachment")}>有附件 {selectedResultStats.attachments}</button></div>
            <div className="operation-data-table">
              <header><span>采样时间</span><span>值</span><span>状态</span></header>
              {operationRows.map((row) => { const rowSelected = selectedSample.index === row.index && selectedSample.metricId === selectedMetric.id; const rowStatus = row.alarm ? "报警" : row.attachment ? "有附件" : "正常"; return <button key={row.index} className={rowSelected ? "selected" : ""} aria-pressed={rowSelected} aria-label={`${row.time}，${row.value}，${rowStatus}`} onClick={() => { setSelectedSample({ metricId: selectedMetric.id, index: row.index }); setAttachmentCollapsed(false); }}><span className="operation-row-time"><b>{row.time.slice(5, 10)}</b><small>{row.time.slice(11)}</small></span><span>{row.value}</span><span className={`operation-row-status ${row.alarm ? "alarm" : row.attachment ? "attached" : "empty"}`}><i />{row.alarm ? "报警" : row.attachment ? "附件" : "正常"}</span></button>; })}
              {!operationRows.length && <div className="operation-data-empty"><span>{filterFalseSignals && !selectedResultStats.total ? "误信号筛选后暂无有效数据" : "当前筛选下暂无数据"}</span>{filterFalseSignals && !selectedResultStats.total ? <button type="button" onClick={() => { setFilterFalseSignals(false); flash("已显示全部信号"); }}>显示全部信号</button> : resultFilter !== "all" && <button type="button" onClick={() => setResultFilter("all")}>查看全部数据</button>}</div>}
            </div>
          </section>
        </div>
            <footer className="operation-actions"><div className="operation-submit-summary"><span>{loading ? `正在查询 ${formatRangeText(startDate, endDate, true)}` : conditionsDirty ? "条件已修改，应用后更新结果" : `结果已同步 · ${lastQueryAt}`}</span><b>{draftDefinitions.length}项指标 · {dateRangeError ? "日期无效" : `${draftDays}天`}</b></div><div><button className="source-reset-button" onClick={resetAnalysis} disabled={loading} title="恢复当前测点默认分析条件并自动查询近15天"><IconRefresh size={16} />重置</button><button className="source-analyze-button" onClick={analyze} disabled={loading} aria-describedby={dateRangeError ? "analysis-date-message" : undefined} title={dateRangeError || (!draftDefinitions.length ? "请至少选择一个指标" : conditionsDirty ? "应用条件并重新查询" : "按当前条件重新查询")}><IconChartLine size={16} />{loading ? "查询中" : conditionsDirty ? "应用并查询" : "重新查询"}</button></div></footer>
          </>
        )}
      </aside>
      <ContextMenu menu={contextMenu} actions={contextActions} onAction={handleContextAction} onClose={closeContextMenu} onDisabled={(reason) => flash(reason || "当前操作不可用", true)} />
      <WaveformModal open={waveformOpen} onClose={() => closeDialog(setWaveformOpen)} time={sampleTime(selectedSample.index, appliedStartDate, appliedEndDate)} />
      <SettingsModal open={settingsOpen} onClose={() => closeDialog(setSettingsOpen)} onApply={() => flash("界面设置已应用")} dynamicCursor={dynamicCursor} setDynamicCursor={setDynamicCursor} alarmLine={alarmLine} setAlarmLine={setAlarmLine} filterFalseSignals={filterFalseSignals} setFilterFalseSignals={setFilterFalseSignals} />
      <HelpModal open={helpOpen} onClose={() => closeDialog(setHelpOpen)} />
      {toast && <div key={toastRevision} className={`analysis-toast ${toastError ? "error" : ""}`} role={toastError ? "alert" : "status"} aria-live={toastError ? "assertive" : "polite"}><IconChartLine size={17} />{toast}</div>}
    </div>
  );
}
