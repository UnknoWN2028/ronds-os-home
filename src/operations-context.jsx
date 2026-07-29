import { createContext, useCallback, useContext, useMemo, useState } from "react";

const OperationsContext = createContext(null);
const SESSION_KEY = "ronds-linked-operations-v1";

export const LINKED_OPERATION = {
  id: "ops-belt-offset-head",
  displayId: "EV-20260721-094218-001",
  videoAlarmId: 1,
  diagnosisCaseId: "belt-offset-head",
  stationCode: "08300038",
  stationName: "机头落料口",
  cameraId: "bluetooth-b",
  cameraName: "310A皮带机中段巡检相机",
  analysisPoint: "belt",
  analysisPointCode: "VD-BELT-001",
  analysisPointName: "机头300米处煤流状态",
  analysisMetric: "alignment",
  analysisMetricName: "煤流不对中",
  time: "2026-07-21 09:42:18",
  timeWithMillis: "2026-07-21 09:42:18.000",
  title: "煤流偏载",
  deviceCode: "TPP-01",
  device: "310A输煤皮带机",
  location: "机头300米处",
  devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头300米处 / 中段巡检相机",
  analysisPath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头300米处 / 煤流状态监测",
  initialStatus: "pending",
};

const RELATED_OPERATIONS = [
  {
    id: "ops-belt-deviation-100", displayId: "EV-20260718-195122-009", videoAlarmId: 9, diagnosisCaseId: "belt-deviation-100",
    stationCode: "08300038", stationName: "100m转弯处", cameraId: "bluetooth-b", cameraName: "310B皮带机转弯段巡检相机",
    analysisPoint: "100", analysisPointCode: "VD-BELT-100", analysisPointName: "100m转弯处皮带状态", analysisMetric: "deviation", analysisMetricName: "皮带跑偏",
    time: "2026-07-18 19:51:22", timeWithMillis: "2026-07-18 19:51:22.518", title: "100m转弯处皮带跑偏", deviceCode: "TPP-01", device: "310B输煤皮带机", location: "100m转弯处",
    devicePath: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 皮带本体 / 100m转弯处 / 转弯段巡检相机", analysisPath: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 100m转弯处 / 皮带状态监测", initialStatus: "pending",
  },
  {
    id: "ops-helmet-100", displayId: "EV-20260718-184506-010", videoAlarmId: 10, diagnosisCaseId: "helmet-100",
    stationCode: "08300038", stationName: "100m转弯处", cameraId: "bluetooth-b", cameraName: "310B皮带机转弯段巡检相机",
    analysisPoint: "100", analysisPointCode: "VD-BELT-100", analysisPointName: "100m转弯处皮带状态", analysisMetric: "helmet", analysisMetricName: "安全帽状态",
    time: "2026-07-18 18:45:06", timeWithMillis: "2026-07-18 18:45:06.555", title: "100m转弯处未佩戴安全帽", deviceCode: "TPP-01", device: "310B输煤皮带机", location: "100m转弯处",
    devicePath: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 皮带本体 / 100m转弯处 / 转弯段巡检相机", analysisPath: "示范火电厂 / 输煤系统 / 310B输煤皮带机 / 100m转弯处 / 人员安全监测", initialStatus: "pending",
  },
  {
    id: "ops-intrusion-east", displayId: "EV-20260720-142956-002", videoAlarmId: 2, diagnosisCaseId: "intrusion-east",
    stationCode: "08300105", stationName: "2号转运站北侧", cameraId: "bluetooth-a", cameraName: "2号转运站东侧入口相机",
    analysisPoint: "east-entrance", analysisPointCode: "VD-ENTRY-001", analysisPointName: "东侧入口人员监测", analysisMetric: "intrusion", analysisMetricName: "人员闯入",
    time: "2026-07-20 14:29:56", timeWithMillis: "2026-07-20 14:29:56.000", title: "非授权人员闯入", deviceCode: "TPP-01", device: "2号转运站", location: "东侧入口",
    devicePath: "示范火电厂 / 输煤系统 / 2号转运站 / 东侧入口 / 人员监控相机", analysisPath: "示范火电厂 / 输煤系统 / 2号转运站 / 东侧入口 / 人员闯入监测", initialStatus: "pending",
  },
  {
    id: "ops-material-alignment-97", displayId: "EV-20260720-142741-003", videoAlarmId: 3, diagnosisCaseId: "material-alignment-97",
    stationCode: "08300097", stationName: "张紧装置", cameraId: "08300097", cameraName: "08300097",
    analysisPoint: "material-97", analysisPointCode: "VD-MATERIAL-097", analysisPointName: "310A机头煤流状态", analysisMetric: "alignment", analysisMetricName: "煤流不对中",
    time: "2026-07-20 14:27:41", timeWithMillis: "2026-07-20 14:27:41.000", title: "煤流不对中", deviceCode: "TPP-01", device: "310A输煤皮带机", location: "机头落料段",
    devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头落料段 / 煤流监控相机", analysisPath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头落料段 / 煤流状态监测", initialStatus: "pending",
  },
  {
    id: "ops-counterweight-belt-98", displayId: "EV-20260720-142416-004", videoAlarmId: 4, diagnosisCaseId: "hammer-damage",
    stationCode: "08300008", stationName: "重锤正上方", cameraId: "08300098", cameraName: "08300098",
    analysisPoint: "counterweight-98", analysisPointCode: "VD-HAMMER-098", analysisPointName: "重锤处皮带状态", analysisMetric: "counterweight", analysisMetricName: "重锤皮带状态",
    time: "2026-07-20 14:24:16", timeWithMillis: "2026-07-20 14:24:16.000", title: "重锤处皮带状态异常", deviceCode: "TPP-01", device: "310A输煤皮带机", location: "重锤张紧区",
    devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 重锤张紧区 / 重锤区监控相机", analysisPath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 重锤张紧区 / 皮带状态监测", initialStatus: "pending",
  },
  {
    id: "ops-corridor-fire", displayId: "EV-20260720-141848-005", videoAlarmId: 5, diagnosisCaseId: "corridor-smoke",
    stationCode: "08300100", stationName: "1号输煤廊道", cameraId: "a-building", cameraName: "1号输煤廊道烟火监控相机",
    analysisPoint: "corridor-smoke", analysisPointCode: "VD-SMOKE-001", analysisPointName: "1号廊道火情监测", analysisMetric: "smoke", analysisMetricName: "火情识别",
    time: "2026-07-20 14:18:48", timeWithMillis: "2026-07-20 14:18:48.000", title: "输煤廊道烟火识别", deviceCode: "TPP-01", device: "1号输煤廊道", location: "中段顶部",
    devicePath: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段顶部 / 烟火监控相机", analysisPath: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段顶部 / 烟火监测", initialStatus: "closed", initialActionNote: "现场复核无明火，已恢复正常巡检。",
  },
  {
    id: "ops-belt-deviation-97", displayId: "EV-20260720-141208-006", videoAlarmId: 6, diagnosisCaseId: "belt-deviation",
    stationCode: "08300097", stationName: "张紧装置", cameraId: "08300097", cameraName: "08300097",
    analysisPoint: "belt-97", analysisPointCode: "VD-BELT-097", analysisPointName: "310A机头皮带跑偏监测", analysisMetric: "deviation", analysisMetricName: "皮带跑偏",
    time: "2026-07-20 14:12:08", timeWithMillis: "2026-07-20 14:12:08.000", title: "皮带跑偏", deviceCode: "TPP-01", device: "310A输煤皮带机", location: "机头落料段",
    devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头落料段 / 跑偏监控相机", analysisPath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头落料段 / 皮带跑偏监测", initialStatus: "defect", initialDefectId: "QX-20260720-141208-006", initialActionNote: "跑偏持续超限，已转缺陷跟踪。",
  },
  {
    id: "ops-drum-surface-98", displayId: "EV-20260720-140825-007", videoAlarmId: 7, diagnosisCaseId: "drum-surface-98",
    stationCode: "08300009", stationName: "驱动滚筒", cameraId: "08300098", cameraName: "08300098",
    analysisPoint: "drum-98", analysisPointCode: "VD-DRUM-098", analysisPointName: "310A驱动滚筒表面监测", analysisMetric: "drumSurface", analysisMetricName: "滚筒表面异常",
    time: "2026-07-20 14:08:25", timeWithMillis: "2026-07-20 14:08:25.000", title: "滚筒表面异常", deviceCode: "TPP-01", device: "310A输煤皮带机", location: "驱动滚筒",
    devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 驱动滚筒 / 滚筒监控相机", analysisPath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 驱动滚筒 / 表面状态监测", initialStatus: "closed", initialActionNote: "清理滚筒表面粘料后复核正常。",
  },
  {
    id: "ops-roller-noise-corridor", displayId: "EV-20260720-140232-008", videoAlarmId: 8, diagnosisCaseId: "roller-noise-corridor",
    stationCode: "08300011", stationName: "1号输煤廊道中段", cameraId: "bluetooth-b", cameraName: "托辊组声学监测单元",
    analysisPoint: "roller-audio", analysisPointCode: "AU-ROLLER-011", analysisPointName: "1号输煤廊道托辊声学测点", analysisMetric: "decibel", analysisMetricName: "分贝指标",
    time: "2026-07-20 14:02:32", timeWithMillis: "2026-07-20 14:02:32.000", title: "托辊异响", deviceCode: "TPP-01", device: "1号输煤廊道", location: "中段托辊组",
    devicePath: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段托辊组 / 声学监测单元", analysisPath: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段托辊组 / 声学监测", initialStatus: "defect", initialDefectId: "QX-20260720-140232-008", initialActionNote: "异响持续，已生成托辊检修缺陷。",
  },
];

export const LINKED_OPERATIONS = Object.freeze([LINKED_OPERATION, ...RELATED_OPERATIONS]);
export const OPERATIONS_BY_ID = Object.freeze({
  ...Object.fromEntries(LINKED_OPERATIONS.map((operation) => [operation.id, operation])),
});

const OPERATIONS_BY_VIDEO_ALARM = Object.freeze(Object.fromEntries(LINKED_OPERATIONS.map((operation) => [String(operation.videoAlarmId), operation])));
const OPERATIONS_BY_DIAGNOSIS_CASE = Object.freeze(Object.fromEntries(LINKED_OPERATIONS.map((operation) => [operation.diagnosisCaseId, operation])));
const OPERATIONS_BY_ANALYSIS_POINT = Object.freeze(LINKED_OPERATIONS.reduce((result, operation) => {
  if (!result[operation.analysisPoint]) result[operation.analysisPoint] = operation;
  return result;
}, {}));

export function resolveOperation(eventId) {
  return eventId ? OPERATIONS_BY_ID[eventId] || null : null;
}

export function resolveOperationByVideoAlarm(alarmId) {
  return alarmId === undefined || alarmId === null ? null : OPERATIONS_BY_VIDEO_ALARM[String(alarmId)] || null;
}

export function resolveOperationByDiagnosisCase(caseId) {
  return caseId ? OPERATIONS_BY_DIAGNOSIS_CASE[caseId] || null : null;
}

export function resolveOperationByAnalysisPoint(pointId) {
  return pointId ? OPERATIONS_BY_ANALYSIS_POINT[pointId] || null : null;
}

export function resolveOperationByAnalysisSelection(pointId, metricId) {
  if (!metricId) return resolveOperationByAnalysisPoint(pointId);
  return LINKED_OPERATIONS.find((operation) => operation.analysisPoint === pointId && operation.analysisMetric === metricId)
    || LINKED_OPERATIONS.find((operation) => operation.analysisMetric === metricId)
    || resolveOperationByAnalysisPoint(pointId);
}

export const OPERATION_STATUS_LABELS = {
  pending: "待处理",
  defect: "已成缺陷",
  closed: "已关闭",
};

export function operationStatusLabel(status) {
  return OPERATION_STATUS_LABELS[status] || OPERATION_STATUS_LABELS.pending;
}

export function createOperationDefectId(eventId, date = new Date()) {
  const operation = resolveOperation(eventId);
  if (operation?.displayId) return `QX-${operation.displayId.replace(/^EV-/, "")}`;
  const pad = (value) => String(value).padStart(2, "0");
  return `QX-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

const DEFAULT_STATE = {
  events: Object.fromEntries(LINKED_OPERATIONS.map((operation) => [operation.id, {
    status: operation.initialStatus || "pending",
    actionNote: operation.initialActionNote || "",
    defectId: operation.initialDefectId || "",
    updatedAt: "",
    source: "",
  }])),
};

function readInitialState() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || "null");
    if (!stored?.events) return DEFAULT_STATE;
    return {
      ...DEFAULT_STATE,
      ...stored,
      events: { ...DEFAULT_STATE.events, ...stored.events },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function OperationsProvider({ children }) {
  const [state, setState] = useState(readInitialState);

  const updateEvent = useCallback((eventId, patch, source = "") => {
    setState((current) => {
      const next = {
        ...current,
        events: {
          ...current.events,
          [eventId]: {
            ...(current.events[eventId] || {}),
            ...patch,
            source,
            updatedAt: new Date().toISOString(),
          },
        },
      };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    events: state.events,
    getOperation: resolveOperation,
    getEvent: (eventId) => state.events[eventId] || null,
    updateEvent,
  }), [state.events, updateEvent]);

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations() {
  const value = useContext(OperationsContext);
  if (!value) throw new Error("useOperations must be used inside OperationsProvider");
  return value;
}

export function routeParams() {
  const params = new URLSearchParams(window.location.search);
  const hashQueryIndex = window.location.hash.indexOf("?");
  if (hashQueryIndex >= 0) {
    new URLSearchParams(window.location.hash.slice(hashQueryIndex + 1)).forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  return params;
}

export function moduleHref(path, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
  const target = `${path}${query.size ? `?${query.toString()}` : ""}`;
  const base = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
  return base ? `${base}/#${target}` : target;
}

export function operationHref(path, eventId, overrides = {}) {
  const operation = resolveOperation(eventId);
  if (!operation) return moduleHref(path, { event: eventId, ...overrides });
  const common = { event: operation.id };
  let params = common;
  if (path === "/video-monitoring") {
    params = { ...common, camera: operation.cameraId, alarm: operation.videoAlarmId };
  } else if (path === "/intelligent-diagnosis") {
    params = { ...common, case: operation.diagnosisCaseId };
  } else if (path === "/audio-video-analysis") {
    params = {
      ...common,
      point: operation.analysisPoint,
      metric: operation.analysisMetric,
      alarmTime: operation.timeWithMillis.replace(" ", "T"),
      days: "15",
      station: operation.stationCode,
      camera: operation.cameraId,
    };
  } else if (path === "/collection-stations") {
    params = { ...common, station: operation.stationCode, case: operation.diagnosisCaseId };
  }
  return moduleHref(path, { ...params, ...overrides });
}
