import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconBuilding,
  IconChartLine,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconFileExport,
  IconFilter,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import "./threshold-alarm.css";

const STATUS_OPTIONS = [
  { id: "pending", label: "待处理" },
  { id: "defect", label: "已成缺陷" },
  { id: "closed", label: "已关闭" },
  { id: "all", label: "全部" },
];

const PAGE_SIZES = [10, 30, 50];

const alarmSeed = [
  {
    id: "TA-260703-001",
    status: "pending",
    devicePath: "示范火电厂 / 输煤系统",
    deviceName: "310A输煤皮带机",
    importance: "--",
    pointName: "电机非驱动端1H/128k 加速度波形(0.1-20000) 有效值",
    valueText: "7.071 m/s²",
    thresholdText: "窗外（值<-4.0m/s²，值>4.0m/s²）",
    level: 1,
    time: "2026-07-03 21:41:05",
    occurrenceCount: 2,
    diagnosis: "振动有效值超过门限，建议结合频谱与设备负荷进行复核。",
  },
  {
    id: "TA-260701-008",
    status: "defect",
    devicePath: "示范火电厂 / 输煤系统 / 2号转运站",
    deviceName: "2#驱动滚筒",
    importance: "重要",
    pointName: "驱动端轴承温度",
    valueText: "82.6 ℃",
    thresholdText: "上限（值>75.0℃）",
    level: 2,
    time: "2026-07-01 18:22:16",
    occurrenceCount: 4,
    diagnosis: "温度持续超过二级门限，已关联缺陷 DX-260701-018。",
  },
  {
    id: "TA-260630-006",
    status: "defect",
    devicePath: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机尾",
    deviceName: "机尾改向滚筒",
    importance: "重要",
    pointName: "滚筒非驱动端垂直振动速度",
    valueText: "11.42 mm/s",
    thresholdText: "上限（值>9.80mm/s）",
    level: 3,
    time: "2026-06-30 10:08:42",
    occurrenceCount: 3,
    diagnosis: "振动速度连续越限，已生成检修缺陷。",
  },
  ...Array.from({ length: 12 }, (_, index) => ({
    id: `TA-2606${String(18 - index).padStart(2, "0")}-${String(index + 10).padStart(3, "0")}`,
    status: "closed",
    devicePath: index % 2 ? "示范火电厂 / 输煤系统 / 2号转运站" : "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头",
    deviceName: index % 2 ? "2#皮带减速机" : "机头驱动滚筒",
    importance: index % 3 === 0 ? "重要" : "一般",
    pointName: index % 2 ? "减速机高速轴水平振动速度" : "驱动端轴承温度",
    valueText: index % 2 ? `${(9.2 + index / 10).toFixed(2)} mm/s` : `${78 + index / 10} ℃`,
    thresholdText: index % 2 ? "上限（值>8.50mm/s）" : "上限（值>75.0℃）",
    level: (index % 4) + 1,
    time: `2026-06-${String(18 - index).padStart(2, "0")} ${String(9 + (index % 8)).padStart(2, "0")}:26:18`,
    occurrenceCount: (index % 5) + 1,
    diagnosis: "现场复核后确认为工况波动，已记录关闭原因。",
  })),
];

function statusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.id === status)?.label || status;
}

function downloadCsv(rows) {
  const header = ["报警编号", "状态", "设备路径", "设备名称", "报警摘要", "报警值", "报警等级", "报警数据时间"];
  const body = rows.map((row) => [
    row.id,
    statusLabel(row.status),
    row.devicePath,
    row.deviceName,
    row.pointName,
    row.valueText,
    `${row.level}级1`,
    row.time,
  ]);
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `门限报警_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ModalShell({ title, description, children, busy, confirmText = "确定", confirmDisabled, onConfirm, onCancel, qa }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.querySelector("input, select, textarea, button")?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [busy, onCancel]);

  return (
    <div className="ta-modal-mask" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <section className="ta-modal" role="dialog" aria-modal="true" aria-labelledby="ta-modal-title" ref={dialogRef} data-qa={qa}>
        <header>
          <div>
            <h2 id="ta-modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="关闭弹窗"><IconX size={18} /></button>
        </header>
        <div className="ta-modal-body">{children}</div>
        <footer>
          <button type="button" className="ta-button" onClick={onCancel} disabled={busy}>取消</button>
          <button type="button" className="ta-button primary" onClick={onConfirm} disabled={busy || confirmDisabled}>
            {busy && <IconRefresh className="ta-spinning" size={16} />}
            {busy ? "处理中…" : confirmText}
          </button>
        </footer>
      </section>
    </div>
  );
}

function DefectDialog({ rows, busy, onConfirm, onCancel }) {
  const first = rows[0];
  const [name, setName] = useState(rows.length > 1 ? `${first?.deviceName || "设备"}门限报警` : `${first?.deviceName || "设备"}-${first?.pointName || "门限报警"}`);
  const [level, setLevel] = useState("");
  const [phenomenon, setPhenomenon] = useState(rows.map((row) => `${row.pointName}：${row.valueText}，${row.thresholdText}`).join("；\n"));

  return (
    <ModalShell
      title="生成缺陷"
      description={`已选择 ${rows.length} 条待处理报警，确认后将同步更新报警状态。`}
      busy={busy}
      confirmText="生成缺陷"
      confirmDisabled={!name.trim()}
      qa="threshold-defect-modal"
      onCancel={onCancel}
      onConfirm={() => onConfirm({ name: name.trim(), level, phenomenon: phenomenon.trim() })}
    >
      <div className="ta-form-grid">
        <label className="wide"><span><b>*</b> 缺陷名称</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label><span>设备名称</span><input value={first?.deviceName || ""} readOnly /></label>
        <label><span>设备路径</span><input value={first?.devicePath || ""} readOnly /></label>
        <label><span>缺陷等级</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="">请选择</option><option>一般</option><option>较大</option><option>重大</option></select></label>
        <label><span>关联报警</span><input value={`${rows.length} 条`} readOnly /></label>
        <label className="wide"><span>现象描述</span><textarea rows={4} value={phenomenon} onChange={(event) => setPhenomenon(event.target.value)} /></label>
      </div>
    </ModalShell>
  );
}

function CloseDialog({ rows, busy, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <ModalShell
      title="关闭报警"
      description={`本次将关闭 ${rows.length} 条报警，关闭后仍可在“已关闭”中查看。`}
      busy={busy}
      confirmText="确认关闭"
      confirmDisabled={!reason.trim()}
      qa="threshold-close-modal"
      onCancel={onCancel}
      onConfirm={() => onConfirm({ reason: reason.trim() })}
    >
      <div className="ta-warning-note"><IconAlertTriangle size={18} /><span>请确认报警已完成现场核查。关闭原因会写入每条报警的处理记录。</span></div>
      <label className="ta-reason-field"><span><b>*</b> 关闭原因</span><textarea rows={5} autoFocus placeholder="请输入现场核查结果或关闭原因" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
    </ModalShell>
  );
}

function DiagnosisDialog({ rows, busy, onConfirm, onCancel }) {
  const first = rows[0];
  const [conclusion, setConclusion] = useState(first?.diagnosis || "");
  const [advice, setAdvice] = useState("建议结合趋势、频谱和现场工况进一步确认。 ");
  return (
    <ModalShell
      title="添加诊断"
      description={`为已选择的 ${rows.length} 条报警补充诊断结论。`}
      busy={busy}
      confirmText="保存诊断"
      confirmDisabled={!conclusion.trim()}
      qa="threshold-diagnosis-modal"
      onCancel={onCancel}
      onConfirm={() => onConfirm({ conclusion: conclusion.trim(), advice: advice.trim() })}
    >
      <div className="ta-form-grid one-column">
        <label><span><b>*</b> 诊断结论</span><textarea rows={4} value={conclusion} onChange={(event) => setConclusion(event.target.value)} /></label>
        <label><span>检维修建议</span><textarea rows={3} value={advice} onChange={(event) => setAdvice(event.target.value)} /></label>
      </div>
    </ModalShell>
  );
}

function ThresholdAnalysisDialog({ row, onCancel }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.querySelector("button")?.focus());
    const onKeyDown = (event) => event.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [onCancel]);

  const samples = [3.18, 3.62, 4.08, 3.76, 7.071];
  const points = samples.map((value, index) => ({
    value,
    x: 68 + index * 128,
    y: 184 - (value / 8) * 126,
    alarm: value > 4,
  }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="ta-modal-mask" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="ta-analysis-modal" role="dialog" aria-modal="true" aria-labelledby="ta-analysis-title" ref={dialogRef} data-qa="threshold-analysis-dialog">
        <header>
          <div><IconChartLine size={20} /><span><h2 id="ta-analysis-title">门限诊断分析</h2><p>{row.deviceName} · {row.devicePath}</p></span></div>
          <button type="button" onClick={onCancel} aria-label="关闭诊断分析"><IconX size={18} /></button>
        </header>
        <div className="ta-analysis-context">
          <dl>
            <div><dt>测点</dt><dd>{row.pointName}</dd></div>
            <div><dt>报警时刻</dt><dd>{row.time}</dd></div>
            <div><dt>查询范围</dt><dd>报警时刻近 15 天</dd></div>
            <div><dt>门限规则</dt><dd>{row.thresholdText}</dd></div>
          </dl>
          <section className="ta-analysis-chart" aria-label="加速度有效值趋势">
            <header><strong>加速度有效值趋势</strong><span><i />报警点 <i />正常点</span></header>
            <svg viewBox="0 0 620 220" role="img" aria-label="近15天加速度有效值趋势图">
              <line className="grid" x1="54" y1="36" x2="596" y2="36" />
              <line className="grid" x1="54" y1="100" x2="596" y2="100" />
              <line className="grid" x1="54" y1="164" x2="596" y2="164" />
              <line className="threshold" x1="54" y1="121" x2="596" y2="121" />
              <text x="8" y="40">8.0</text><text x="8" y="104">4.0</text><text x="8" y="168">0.0</text>
              <text className="threshold-label" x="500" y="114">上限 4.0 m/s²</text>
              <polyline points={polyline} />
              {points.map((point, index) => <circle key={index} className={point.alarm ? "alarm" : "normal"} cx={point.x} cy={point.y} r={index === points.length - 1 ? 6 : 4.5} />)}
            </svg>
            <footer><span>06-19</span><span>06-23</span><span>06-27</span><span>07-01</span><span>07-03 21:41:05</span></footer>
          </section>
          <p className="ta-analysis-conclusion"><IconAlertTriangle size={18} /><span><b>分析结论：</b>{row.diagnosis}</span></p>
        </div>
        <footer><button type="button" className="ta-button primary" onClick={onCancel}>完成查看</button></footer>
      </section>
    </div>
  );
}

export function ThresholdAlarmView({ onOpenAnalysis, onPendingCountChange }) {
  const [alarms, setAlarms] = useState(alarmSeed);
  const [status, setStatus] = useState("pending");
  const [searchDraft, setSearchDraft] = useState("");
  const [levelDraft, setLevelDraft] = useState("all");
  const [filters, setFilters] = useState({ search: "", level: "all" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [collapsedPaths, setCollapsedPaths] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [analysisRow, setAnalysisRow] = useState(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({ importance: true, occurrence: true });
  const toastTimerRef = useRef(null);
  const workTimerRef = useRef(null);
  const columnSettingsRef = useRef(null);

  const counts = useMemo(() => ({
    pending: alarms.filter((item) => item.status === "pending").length,
    defect: alarms.filter((item) => item.status === "defect").length,
    closed: alarms.filter((item) => item.status === "closed").length,
    all: alarms.length,
  }), [alarms]);

  const filtered = useMemo(() => {
    const keyword = filters.search.trim().toLocaleLowerCase();
    return alarms.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (filters.level !== "all" && String(item.level) !== filters.level) return false;
      if (!keyword) return true;
      return [item.devicePath, item.deviceName, item.pointName, item.id].some((value) => String(value).toLocaleLowerCase().includes(keyword));
    });
  }, [alarms, filters, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const groups = useMemo(() => {
    const map = new Map();
    pageRows.forEach((item) => {
      const key = `${item.devicePath}__${item.deviceName}`;
      if (!map.has(key)) map.set(key, { key, path: item.devicePath, name: item.deviceName, importance: item.importance, rows: [] });
      map.get(key).rows.push(item);
    });
    return [...map.values()];
  }, [pageRows]);

  const selectedRows = alarms.filter((item) => selectedIds.includes(item.id));
  const pendingSelection = selectedRows.length > 0 && selectedRows.every((item) => item.status === "pending");
  const pageSelectableIds = pageRows.filter((item) => item.status === "pending").map((item) => item.id);
  const allPageSelected = pageSelectableIds.length > 0 && pageSelectableIds.every((id) => selectedIds.includes(id));
  const partiallyPageSelected = pageSelectableIds.some((id) => selectedIds.includes(id)) && !allPageSelected;

  useEffect(() => {
    onPendingCountChange?.(counts.pending);
  }, [counts.pending, onPendingCountChange]);

  const showToast = (message, tone = "success") => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ message, tone });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => () => {
    window.clearTimeout(toastTimerRef.current);
    window.clearTimeout(workTimerRef.current);
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setActionMenuId(null);
  }, [status]);

  useEffect(() => {
    if (!actionMenuId) return undefined;
    const dismiss = (event) => {
      if (!event.target.closest(".ta-row-action-wrap")) setActionMenuId(null);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActionMenuId(null);
    };
    document.addEventListener("mousedown", dismiss);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [actionMenuId]);

  useEffect(() => {
    if (!columnMenuOpen) return undefined;
    const dismiss = (event) => {
      if (!columnSettingsRef.current?.contains(event.target)) setColumnMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setColumnMenuOpen(false);
    };
    document.addEventListener("mousedown", dismiss);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [columnMenuOpen]);

  const toggleId = (id, checked) => {
    const row = alarms.find((item) => item.id === id);
    if (!row || row.status !== "pending") return;
    setSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  };

  const toggleGroup = (rows, checked) => {
    const ids = rows.filter((row) => row.status === "pending").map((row) => row.id);
    setSelectedIds((current) => checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)));
  };

  const runQuery = () => {
    if (loading || refreshing) return;
    setLoading(true);
    window.clearTimeout(workTimerRef.current);
    workTimerRef.current = window.setTimeout(() => {
      setFilters({ search: searchDraft, level: levelDraft });
      setPage(1);
      setSelectedIds([]);
      setLoading(false);
      showToast("查询完成", "info");
    }, 520);
  };

  const refresh = () => {
    if (loading || refreshing) return;
    setRefreshing(true);
    window.clearTimeout(workTimerRef.current);
    workTimerRef.current = window.setTimeout(() => {
      setRefreshing(false);
      showToast("报警数据已刷新");
    }, 620);
  };

  const openAnalysis = (row) => {
    setActionMenuId(null);
    if (onOpenAnalysis) {
      onOpenAnalysis(row);
      return;
    }
    setAnalysisRow(row);
  };

  const startModal = (type, rows = selectedRows) => {
    if (!rows.length) {
      showToast("请先选择报警", "warning");
      return;
    }
    if ((type === "defect" || type === "close") && !rows.every((row) => row.status === "pending")) {
      showToast("仅待处理报警支持该操作", "warning");
      return;
    }
    setActionMenuId(null);
    setModal({ type, ids: rows.map((row) => row.id) });
  };

  const submitModal = (payload) => {
    const ids = modal?.ids || [];
    setSubmitting(true);
    window.clearTimeout(workTimerRef.current);
    workTimerRef.current = window.setTimeout(() => {
      setAlarms((current) => current.map((item) => {
        if (!ids.includes(item.id)) return item;
        if (modal.type === "defect") return { ...item, status: "defect", defectName: payload.name, treatment: `生成缺陷：${payload.name}` };
        if (modal.type === "close") return { ...item, status: "closed", closeReason: payload.reason, treatment: `关闭：${payload.reason}` };
        return { ...item, diagnosis: payload.conclusion, advice: payload.advice, hasManualDiagnosis: true };
      }));
      const type = modal.type;
      setSubmitting(false);
      setModal(null);
      setSelectedIds([]);
      if (type === "defect" || type === "close") setStatus(type === "defect" ? "defect" : "closed");
      showToast(type === "defect" ? `已生成缺陷并处理 ${ids.length} 条报警` : type === "close" ? `已关闭 ${ids.length} 条报警` : `已保存 ${ids.length} 条报警的诊断`);
    }, 680);
  };

  const modalRows = alarms.filter((item) => modal?.ids.includes(item.id));

  return (
    <section className="ta-workbench" aria-label="门限报警" data-qa="threshold-alarm-view">
      <div className="ta-toolbar">
        <div className="ta-toolbar-actions">
          <button className="ta-button primary" type="button" data-qa="threshold-generate-defect" disabled={!pendingSelection} title={!pendingSelection ? "请先选择待处理报警" : undefined} onClick={() => startModal("defect")}>生成缺陷</button>
          <button className="ta-button" type="button" data-qa="threshold-close" disabled={!pendingSelection} title={!pendingSelection ? "请先选择待处理报警" : undefined} onClick={() => startModal("close")}>关闭</button>
          <button className="ta-button" type="button" data-qa="threshold-add-diagnosis" disabled={!selectedRows.length} title={!selectedRows.length ? "请先选择报警" : undefined} onClick={() => startModal("diagnosis")}>添加诊断</button>
          <i className="ta-toolbar-divider" aria-hidden="true" />
          <div className="ta-status-tabs" role="tablist" aria-label="报警状态">
            {STATUS_OPTIONS.map((item) => (
              <button key={item.id} type="button" role="tab" data-qa={`threshold-status-${item.id}`} aria-selected={status === item.id} className={status === item.id ? "active" : ""} onClick={() => setStatus(item.id)}>
                <i aria-hidden="true" />
                <span>{item.label}({counts[item.id]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ta-filter-bar">
          <label className="ta-search-field">
            <IconSearch size={16} />
            <input value={searchDraft} data-qa="threshold-search" onChange={(event) => setSearchDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runQuery()} placeholder="设备/组织/报警摘要" aria-label="设备、组织或报警摘要" />
            {searchDraft && <button type="button" onClick={() => setSearchDraft("")} aria-label="清空搜索"><IconX size={14} /></button>}
          </label>
          <label className="ta-select-field">
            <IconFilter size={15} />
            <select value={levelDraft} data-qa="threshold-level" onChange={(event) => setLevelDraft(event.target.value)} aria-label="报警等级">
              <option value="all">报警等级</option>
              <option value="1">1级1</option><option value="2">2级1</option><option value="3">3级1</option><option value="4">4级1</option>
            </select>
            <IconChevronDown size={16} />
          </label>
          <button className="ta-button primary query" type="button" data-qa="threshold-query" onClick={runQuery} disabled={loading || refreshing}>{loading && <IconRefresh className="ta-spinning" size={16} />}{loading ? "查询中" : "查询"}</button>
          <button className="ta-icon-button" type="button" data-qa="threshold-refresh" title="刷新报警" aria-label="刷新报警" onClick={refresh} disabled={loading || refreshing}><IconRefresh className={refreshing ? "ta-spinning" : ""} size={22} /></button>
          <button className="ta-icon-button" type="button" data-qa="threshold-export" title="导出当前筛选结果" aria-label="导出当前筛选结果" onClick={() => { downloadCsv(filtered); showToast(`已导出 ${filtered.length} 条报警`); }} disabled={!filtered.length}><IconFileExport size={22} /></button>
        </div>
      </div>

      <div className="ta-table-shell" aria-busy={loading || refreshing}>
        {(loading || refreshing) && <div className="ta-table-loading"><IconRefresh className="ta-spinning" size={18} /><span>{loading ? "正在查询报警…" : "正在刷新报警…"}</span></div>}
        <div className="ta-table-scroll">
          <table className="ta-alarm-table" data-qa="threshold-alarm-table">
            <colgroup><col className="ta-col-check" /><col className="ta-col-index" /><col className="ta-col-path" /><col className="ta-col-device" />{visibleColumns.importance && <col className="ta-col-importance" />}<col className="ta-col-summary" /><col className="ta-col-level" /><col className="ta-col-time" />{visibleColumns.occurrence && <col className="ta-col-occurrence" />}<col className="ta-col-action" /></colgroup>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="选择当前页待处理报警" checked={allPageSelected} ref={(node) => { if (node) node.indeterminate = partiallyPageSelected; }} disabled={!pageSelectableIds.length} onChange={(event) => toggleGroup(pageRows, event.target.checked)} /></th>
                <th>序号</th>
                <th>设备路径</th>
                <th>设备名称 <IconFilter size={14} /></th>
                {visibleColumns.importance && <th>设备重要等级 <IconFilter size={14} /></th>}
                <th>报警摘要</th>
                <th>报警等级</th>
                <th>报警数据时间</th>
                {visibleColumns.occurrence && <th>报警次数</th>}
                <th className="ta-operation-heading">
                  <span>操作</span>
                  <div className="ta-column-settings" ref={columnSettingsRef}>
                    <button type="button" aria-label="设置表格列" aria-expanded={columnMenuOpen} onClick={() => setColumnMenuOpen((value) => !value)}><IconSettings size={18} /></button>
                    {columnMenuOpen && <div className="ta-column-menu" role="menu"><strong>显示列</strong><label><input type="checkbox" checked={visibleColumns.importance} onChange={(event) => setVisibleColumns((current) => ({ ...current, importance: event.target.checked }))} />设备重要等级</label><label><input type="checkbox" checked={visibleColumns.occurrence} onChange={(event) => setVisibleColumns((current) => ({ ...current, occurrence: event.target.checked }))} />报警次数</label></div>}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const collapsed = collapsedPaths.includes(group.key);
                const selectableRows = group.rows.filter((row) => row.status === "pending");
                const groupChecked = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.includes(row.id));
                const groupPartial = selectableRows.some((row) => selectedIds.includes(row.id)) && !groupChecked;
                return [
                  <tr className="ta-device-row" key={`${group.key}-parent`} data-qa="threshold-device-group">
                    <td><input type="checkbox" aria-label={`选择 ${group.name} 下待处理报警`} checked={groupChecked} ref={(node) => { if (node) node.indeterminate = groupPartial; }} disabled={!selectableRows.length} onChange={(event) => toggleGroup(group.rows, event.target.checked)} /></td>
                    <td />
                    <td><button type="button" className="ta-device-toggle" onClick={() => setCollapsedPaths((current) => current.includes(group.key) ? current.filter((item) => item !== group.key) : [...current, group.key])} aria-expanded={!collapsed}><IconChevronDown size={15} className={collapsed ? "collapsed" : ""} /><span>{group.path}</span></button></td>
                    <td><span className="ta-device-name"><IconBuilding size={16} />{group.name}</span></td>
                    {visibleColumns.importance && <td>{group.importance}</td>}
                    <td colSpan={4 + (visibleColumns.occurrence ? 1 : 0)} />
                  </tr>,
                  ...(!collapsed ? group.rows.map((row, rowIndex) => {
                    const absoluteIndex = (currentPage - 1) * pageSize + pageRows.indexOf(row) + 1;
                    return (
                      <tr className={`ta-alarm-row ${selectedIds.includes(row.id) ? "selected" : ""}`} key={row.id} data-qa={`threshold-row-${row.id}`}>
                        <td><input type="checkbox" checked={selectedIds.includes(row.id)} aria-label={`选择报警 ${row.id}`} disabled={row.status !== "pending"} title={row.status !== "pending" ? "已处理报警不可重复处理" : undefined} onChange={(event) => toggleId(row.id, event.target.checked)} /></td>
                        <td>{absoluteIndex || rowIndex + 1}</td>
                        <td><span className="ta-child-guide" aria-hidden="true" /></td>
                        {visibleColumns.importance && <td />}
                        <td />
                        <td>
                          <div className="ta-summary-cell">
                            <strong>{row.pointName}</strong>
                            <span>报警值：<b>{row.valueText}</b></span>
                            <small>{row.thresholdText}</small>
                          </div>
                        </td>
                        <td><span className={`ta-level level-${row.level}`}>{row.level}级1</span></td>
                        <td><time>{row.time}</time></td>
                        {visibleColumns.occurrence && <td><span className="ta-occurrences" title="报警发生次数">{row.occurrenceCount}</span></td>}
                        <td>
                          <div className="ta-row-action-wrap">
                            {row.status === "pending" ? <button type="button" className="ta-link-button" data-qa={`threshold-process-${row.id}`} aria-expanded={actionMenuId === row.id} onClick={() => setActionMenuId((current) => current === row.id ? null : row.id)}>处理</button> : <span className={`ta-status-text ${row.status}`}>{statusLabel(row.status)}</span>}
                            <button type="button" className="ta-link-button" data-qa={`threshold-analysis-${row.id}`} onClick={() => openAnalysis(row)}>诊断分析</button>
                            {actionMenuId === row.id && (
                              <div className="ta-action-menu" role="menu">
                                <button type="button" role="menuitem" onClick={() => startModal("defect", [row])}>生成缺陷</button>
                                <button type="button" role="menuitem" onClick={() => startModal("close", [row])}>关闭报警</button>
                                <button type="button" role="menuitem" onClick={() => startModal("diagnosis", [row])}>添加诊断</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : []),
                ];
              })}
              {!groups.length && (
                <tr className="ta-empty-row"><td colSpan={8 + (visibleColumns.importance ? 1 : 0) + (visibleColumns.occurrence ? 1 : 0)}><IconSearch size={34} /><strong>未查询到报警</strong><span>请调整设备、组织或报警等级后重新查询</span><button type="button" onClick={() => { setSearchDraft(""); setLevelDraft("all"); setFilters({ search: "", level: "all" }); }}>清空筛选</button></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="ta-pagination">
          <span>共{filtered.length}项</span>
          <button type="button" aria-label="上一页" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><IconChevronLeft size={18} /></button>
          <b>{currentPage}</b>
          <button type="button" aria-label="下一页" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><IconChevronRight size={18} /></button>
          <label><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="每页条数">{PAGE_SIZES.map((size) => <option key={size} value={size}>{size} 条/页</option>)}</select><IconChevronDown size={15} /></label>
          {selectedRows.length > 0 && <em>已选择 {selectedRows.length} 条</em>}
        </footer>
      </div>

      {toast && <div className={`ta-toast ${toast.tone}`} role="status" data-qa="threshold-toast"><span>{toast.tone === "warning" ? <IconAlertTriangle size={17} /> : toast.tone === "info" ? <IconSparkles size={17} /> : <IconCheck size={17} />}</span>{toast.message}<button type="button" onClick={() => setToast(null)} aria-label="关闭提示"><IconX size={14} /></button></div>}
      {modal?.type === "defect" && <DefectDialog rows={modalRows} busy={submitting} onConfirm={submitModal} onCancel={() => !submitting && setModal(null)} />}
      {modal?.type === "close" && <CloseDialog rows={modalRows} busy={submitting} onConfirm={submitModal} onCancel={() => !submitting && setModal(null)} />}
      {modal?.type === "diagnosis" && <DiagnosisDialog rows={modalRows} busy={submitting} onConfirm={submitModal} onCancel={() => !submitting && setModal(null)} />}
      {analysisRow && <ThresholdAnalysisDialog row={analysisRow} onCancel={() => setAnalysisRow(null)} />}
    </section>
  );
}

export default ThresholdAlarmView;
