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
  IconInbox,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import "./smart-alarm.css";

const STATUS_OPTIONS = [
  { id: "pending", label: "待处理" },
  { id: "defect", label: "已成缺陷" },
  { id: "closed", label: "已关闭" },
  { id: "all", label: "全部" },
];

const PAGE_SIZES = [10, 30, 50];

const DEVICE_GROUPS = [
  { path: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机头", name: "310A输煤皮带机", importance: "重要" },
  { path: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 300米处", name: "机头300米可见光相机", importance: "重要" },
  { path: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 重锤张紧区", name: "重锤区皮带监测相机", importance: "一般" },
  { path: "示范火电厂 / 输煤系统 / 310A输煤皮带机 / 机尾", name: "机尾纵撕监测相机", importance: "重要" },
  { path: "示范火电厂 / 输煤系统 / 2号转运站 / 落料口", name: "2号转运站落料监测相机", importance: "重要" },
  { path: "示范火电厂 / 输煤系统 / 2号转运站 / 托辊组", name: "2号转运站托辊监测单元", importance: "一般" },
  { path: "示范火电厂 / 输煤系统 / 1号输煤廊道 / 中段", name: "廊道环境监测相机", importance: "一般" },
  { path: "示范火电厂 / 输煤系统 / 驱动站 / 安全区", name: "驱动站安全监控相机", importance: "重要" },
];

const FAULT_TEMPLATES = [
  { title: "机头300米处-煤流状态监测/煤流偏载", type: "煤流偏载", evidence: "煤流偏离皮带中心，持续时间10秒", algorithm: "煤流状态识别" },
  { title: "重锤处-皮带状态监测/皮带损伤", type: "皮带损伤", evidence: "皮带表面检测到连续损伤区域", algorithm: "皮带损伤识别" },
  { title: "机尾20米处-皮带纵撕监测状态/皮带纵向撕裂", type: "皮带纵向撕裂", evidence: "纵撕特征连续出现3帧", algorithm: "纵向撕裂识别" },
  { title: "2#转运站-托辊状态监测/托辊异音", type: "托辊异音", evidence: "音频特征与典型托辊异音模式匹配", algorithm: "托辊异音识别" },
  { title: "机头落料口-煤流状态监测/煤流偏载", type: "煤流偏载", evidence: "落料区域向左侧偏移18厘米", algorithm: "煤流偏载识别" },
  { title: "廊道中部-环境监测/温度异常", type: "温度异常", evidence: "局部温升高于背景温度12.6℃", algorithm: "环境温度异常识别" },
  { title: "驱动站安全区-人员行为监测/人员闯入", type: "人员闯入", evidence: "非授权人员进入设备运行区域", algorithm: "人员闯入识别" },
  { title: "尾部滚筒-托辊状态监测/托辊缺辊", type: "托辊缺辊", evidence: "托辊组中检测到一个缺失位置", algorithm: "托辊缺辊识别" },
];

const SMART_ALARM_SEED = Array.from({ length: 248 }, (_, index) => {
  const device = DEVICE_GROUPS[index % DEVICE_GROUPS.length];
  const fault = FAULT_TEMPLATES[(index * 3) % FAULT_TEMPLATES.length];
  const day = 20 - (index % 20);
  const hour = 17 - (index % 10);
  const minute = (8 + index * 7) % 60;
  const second = (26 + index * 11) % 60;
  return {
    id: `SA-2607-${String(index + 1).padStart(4, "0")}`,
    status: "closed",
    devicePath: device.path,
    deviceName: device.name,
    importance: device.importance,
    summary: fault.title,
    faultType: fault.type,
    evidence: fault.evidence,
    algorithm: fault.algorithm,
    level: (index % 4) + 1,
    time: `2026-07-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`,
    occurrenceCount: (index % 6) + 1,
    probability: 82 + (index % 18),
    closeReason: index % 3 === 0 ? "现场复核未发现持续异常，确认为短时工况波动。" : index % 3 === 1 ? "设备已完成检查，报警条件已消除。" : "同类报警合并处理，已记录现场核查结果。",
    conclusion: `${fault.type}特征在报警时刻出现，现场复核后已关闭本次报警。`,
    advice: "持续关注同位置趋势，如重复出现请安排专项检查。",
  };
});

function statusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.id === status)?.label || status;
}

function downloadCsv(rows) {
  const header = ["报警编号", "状态", "设备路径", "设备名称", "报警摘要", "报警等级", "报警数据时间", "处理结论"];
  const body = rows.map((row) => [
    row.id,
    statusLabel(row.status),
    row.devicePath,
    row.deviceName,
    row.summary,
    `${row.level}级1`,
    row.time,
    row.conclusion,
  ]);
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `智能报警_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ModalShell({ title, subtitle, children, busy, confirmText, confirmDisabled, onConfirm, onCancel, qa }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.querySelector("input, textarea, select, button")?.focus());
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
    <div className="sa-modal-mask" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <section className="sa-modal" role="dialog" aria-modal="true" aria-labelledby={`${qa}-title`} ref={dialogRef} data-qa={qa}>
        <header>
          <div>
            <h2 id={`${qa}-title`}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" aria-label="关闭弹窗" disabled={busy} onClick={onCancel}><IconX size={18} /></button>
        </header>
        <div className="sa-modal-body">{children}</div>
        <footer>
          <button type="button" className="sa-button" disabled={busy} onClick={onCancel}>{onConfirm ? "取消" : "关闭"}</button>
          {onConfirm && (
            <button type="button" className="sa-button primary" disabled={busy || confirmDisabled} onClick={onConfirm}>
              {busy && <IconRefresh className="sa-spinning" size={16} />}
              {busy ? "保存中…" : confirmText}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function DiagnosisDialog({ rows, busy, onConfirm, onCancel }) {
  const first = rows[0];
  const [conclusion, setConclusion] = useState(first?.conclusion || "");
  const [advice, setAdvice] = useState(first?.advice || "");
  return (
    <ModalShell
      title="添加诊断"
      subtitle={`为已选择的 ${rows.length} 条智能报警补充统一诊断信息。`}
      busy={busy}
      confirmText="保存诊断"
      confirmDisabled={!conclusion.trim()}
      onConfirm={() => onConfirm({ conclusion: conclusion.trim(), advice: advice.trim() })}
      onCancel={onCancel}
      qa="smart-diagnosis-modal"
    >
      <div className="sa-form-grid">
        <label><span><b>*</b> 诊断结论</span><textarea rows={5} value={conclusion} onChange={(event) => setConclusion(event.target.value)} /></label>
        <label><span>检维修建议</span><textarea rows={4} value={advice} onChange={(event) => setAdvice(event.target.value)} /></label>
      </div>
    </ModalShell>
  );
}

function RecordDialog({ row, onCancel }) {
  return (
    <ModalShell title="报警处理记录" subtitle={`${row.deviceName} · ${row.time}`} onCancel={onCancel} qa="smart-record-modal">
      <dl className="sa-detail-list">
        <div><dt>报警编号</dt><dd>{row.id}</dd></div>
        <div><dt>故障类型</dt><dd>{row.faultType}</dd></div>
        <div><dt>处理状态</dt><dd><span className="sa-status-badge">已关闭</span></dd></div>
        <div><dt>处理时间</dt><dd>{row.time}</dd></div>
        <div className="wide"><dt>关闭原因</dt><dd>{row.closeReason}</dd></div>
        <div className="wide"><dt>诊断结论</dt><dd>{row.conclusion}</dd></div>
        {row.manualDiagnosis && <div className="wide"><dt>补充诊断</dt><dd>{row.manualDiagnosis}</dd></div>}
      </dl>
    </ModalShell>
  );
}

function AnalysisDialog({ row, onCancel }) {
  const values = [28, 34, 31, 43, 51, row.probability];
  const points = values.map((value, index) => ({ x: 64 + index * 104, y: 170 - value * 1.25, value }));
  return (
    <ModalShell title="智能报警分析" subtitle={`${row.deviceName} · ${row.algorithm}`} onCancel={onCancel} qa="smart-analysis-modal">
      <div className="sa-analysis-context">
        <dl>
          <div><dt>故障类型</dt><dd>{row.faultType}</dd></div>
          <div><dt>匹配概率</dt><dd>{row.probability}%</dd></div>
          <div><dt>报警时刻</dt><dd>{row.time}</dd></div>
          <div><dt>分析范围</dt><dd>报警时刻近15天</dd></div>
        </dl>
        <section className="sa-analysis-chart">
          <header><strong>故障模式匹配趋势</strong><span><i />报警点</span></header>
          <svg viewBox="0 0 620 210" role="img" aria-label="故障模式匹配概率趋势图">
            <line className="grid" x1="48" y1="40" x2="596" y2="40" />
            <line className="grid" x1="48" y1="100" x2="596" y2="100" />
            <line className="grid" x1="48" y1="160" x2="596" y2="160" />
            <line className="threshold" x1="48" y1="72" x2="596" y2="72" />
            <text x="8" y="44">100</text><text x="14" y="104">50</text><text x="20" y="164">0</text>
            <text className="threshold-label" x="505" y="66">报警线 80%</text>
            <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
            {points.map((point, index) => <circle key={`${point.x}-${point.y}`} className={index === points.length - 1 ? "alarm" : "normal"} cx={point.x} cy={point.y} r={index === points.length - 1 ? 6 : 4.5} />)}
          </svg>
        </section>
        <p className="sa-analysis-result"><IconAlertTriangle size={18} /><span><b>诊断结论：</b>{row.conclusion}</span></p>
      </div>
    </ModalShell>
  );
}

export function SmartAlarmView({ onPendingCountChange }) {
  const [alarms, setAlarms] = useState(SMART_ALARM_SEED);
  const [status, setStatus] = useState("pending");
  const [searchDraft, setSearchDraft] = useState("");
  const [levelDraft, setLevelDraft] = useState("all");
  const [filters, setFilters] = useState({ search: "", level: "all" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({ importance: true, occurrence: true });
  const [dialog, setDialog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const columnSettingsRef = useRef(null);
  const toastTimerRef = useRef(null);
  const workTimerRef = useRef(null);

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
      return [item.id, item.devicePath, item.deviceName, item.summary, item.faultType, item.algorithm]
        .some((value) => String(value).toLocaleLowerCase().includes(keyword));
    });
  }, [alarms, filters, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const groups = useMemo(() => {
    const map = new Map();
    pageRows.forEach((row) => {
      const key = `${row.devicePath}__${row.deviceName}`;
      if (!map.has(key)) map.set(key, { key, path: row.devicePath, name: row.deviceName, importance: row.importance, rows: [] });
      map.get(key).rows.push(row);
    });
    return [...map.values()];
  }, [pageRows]);

  const selectedRows = alarms.filter((item) => selectedIds.includes(item.id));
  const pendingSelection = selectedRows.length > 0 && selectedRows.every((item) => item.status === "pending");
  const pageIds = pageRows.map((item) => item.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const partiallyPageSelected = pageIds.some((id) => selectedIds.includes(id)) && !allPageSelected;

  useEffect(() => {
    onPendingCountChange?.(counts.pending);
  }, [counts.pending, onPendingCountChange]);

  useEffect(() => () => {
    window.clearTimeout(toastTimerRef.current);
    window.clearTimeout(workTimerRef.current);
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [status]);

  useEffect(() => {
    if (!columnMenuOpen) return undefined;
    const onMouseDown = (event) => {
      if (!columnSettingsRef.current?.contains(event.target)) setColumnMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setColumnMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [columnMenuOpen]);

  const showToast = (message, tone = "success") => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ message, tone });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
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
    }, 420);
  };

  const refresh = () => {
    if (loading || refreshing) return;
    setRefreshing(true);
    window.clearTimeout(workTimerRef.current);
    workTimerRef.current = window.setTimeout(() => {
      setRefreshing(false);
      showToast("智能报警数据已刷新");
    }, 560);
  };

  const clearFilters = () => {
    setSearchDraft("");
    setLevelDraft("all");
    setFilters({ search: "", level: "all" });
    setPage(1);
  };

  const toggleRows = (ids, checked) => {
    setSelectedIds((current) => checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)));
  };

  const openUnavailableAction = (action) => {
    if (!selectedRows.length) {
      showToast("请先选择待处理报警", "warning");
      return;
    }
    if (!pendingSelection) showToast(`仅待处理报警支持${action}`, "warning");
  };

  const saveDiagnosis = (payload) => {
    const ids = dialog?.ids || [];
    setSubmitting(true);
    window.clearTimeout(workTimerRef.current);
    workTimerRef.current = window.setTimeout(() => {
      setAlarms((current) => current.map((item) => ids.includes(item.id) ? { ...item, manualDiagnosis: payload.conclusion, advice: payload.advice } : item));
      setSubmitting(false);
      setDialog(null);
      setSelectedIds([]);
      showToast(`已保存 ${ids.length} 条报警的诊断信息`);
    }, 620);
  };

  const dialogRows = alarms.filter((item) => dialog?.ids?.includes(item.id));

  return (
    <section className="sa-workbench" aria-label="智能报警" data-qa="smart-alarm-view">
      <div className="sa-toolbar">
        <div className="sa-toolbar-actions">
          <button className={`sa-button primary ${!pendingSelection ? "visually-disabled" : ""}`} type="button" data-qa="smart-generate-defect" aria-disabled={!pendingSelection} title={!pendingSelection ? "请先选择待处理报警" : undefined} onClick={() => openUnavailableAction("生成缺陷")}>生成缺陷</button>
          <button className={`sa-button ${!pendingSelection ? "visually-disabled" : ""}`} type="button" data-qa="smart-close" aria-disabled={!pendingSelection} title={!pendingSelection ? "请先选择待处理报警" : undefined} onClick={() => openUnavailableAction("关闭")}>关闭</button>
          <button className="sa-button" type="button" data-qa="smart-add-diagnosis" disabled={!selectedRows.length} title={!selectedRows.length ? "请先选择报警" : undefined} onClick={() => setDialog({ type: "diagnosis", ids: selectedIds })}>添加诊断</button>
          <i className="sa-toolbar-divider" aria-hidden="true" />
          <div className="sa-status-tabs" role="tablist" aria-label="报警状态">
            {STATUS_OPTIONS.map((item) => (
              <button key={item.id} type="button" role="tab" data-qa={`smart-status-${item.id}`} aria-selected={status === item.id} className={status === item.id ? "active" : ""} onClick={() => setStatus(item.id)}>
                <i aria-hidden="true" /><span>{item.label}({counts[item.id]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sa-filter-bar">
          <label className="sa-search-field">
            <IconSearch size={16} />
            <input value={searchDraft} data-qa="smart-search" onChange={(event) => setSearchDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runQuery()} placeholder="设备/组织" aria-label="设备或组织" />
            {searchDraft && <button type="button" onClick={() => setSearchDraft("")} aria-label="清空搜索"><IconX size={14} /></button>}
          </label>
          <label className="sa-select-field">
            <IconFilter size={15} />
            <select value={levelDraft} data-qa="smart-level" onChange={(event) => setLevelDraft(event.target.value)} aria-label="报警等级">
              <option value="all">报警等级</option>
              <option value="1">1级1</option><option value="2">2级1</option><option value="3">3级1</option><option value="4">4级1</option>
            </select>
            <IconChevronDown size={16} />
          </label>
          <button className="sa-button primary query" type="button" data-qa="smart-query" disabled={loading || refreshing} onClick={runQuery}>{loading && <IconRefresh className="sa-spinning" size={16} />}{loading ? "查询中" : "查询"}</button>
          <button className="sa-icon-button" type="button" data-qa="smart-refresh" title="刷新报警" aria-label="刷新报警" disabled={loading || refreshing} onClick={refresh}><IconRefresh className={refreshing ? "sa-spinning" : ""} size={22} /></button>
          <button className="sa-icon-button" type="button" data-qa="smart-export" title="导出当前筛选结果" aria-label="导出当前筛选结果" onClick={() => { downloadCsv(filtered); showToast(`已导出 ${filtered.length} 条报警`); }}><IconFileExport size={22} /></button>
        </div>
      </div>

      <div className="sa-table-shell" aria-busy={loading || refreshing}>
        {(loading || refreshing) && <div className="sa-table-loading"><IconRefresh className="sa-spinning" size={18} /><span>{loading ? "正在查询报警…" : "正在刷新报警…"}</span></div>}
        <div className="sa-table-scroll">
          <table className="sa-alarm-table" data-qa="smart-alarm-table">
            <colgroup>
              <col className="sa-col-check" /><col className="sa-col-index" /><col className="sa-col-path" /><col className="sa-col-device" />
              {visibleColumns.importance && <col className="sa-col-importance" />}
              <col className="sa-col-summary" /><col className="sa-col-level" /><col className="sa-col-time" />
              {visibleColumns.occurrence && <col className="sa-col-occurrence" />}
              <col className="sa-col-action" />
            </colgroup>
            <thead>
              <tr>
                <th><input type="checkbox" data-qa="smart-select-page" aria-label="选择当前页报警" checked={allPageSelected} ref={(node) => { if (node) node.indeterminate = partiallyPageSelected; }} disabled={!pageIds.length} onChange={(event) => toggleRows(pageIds, event.target.checked)} /></th>
                <th>序号</th>
                <th>设备路径</th>
                <th>设备名称 <IconFilter size={14} /></th>
                {visibleColumns.importance && <th>设备重要等级 <IconFilter size={14} /></th>}
                <th>报警摘要</th>
                <th>报警等级</th>
                <th>报警数据时间</th>
                {visibleColumns.occurrence && <th>报警次数</th>}
                <th className="sa-operation-heading">
                  <span>操作</span>
                  <div className="sa-column-settings" ref={columnSettingsRef}>
                    <button type="button" data-qa="smart-column-settings" aria-label="设置表格列" aria-expanded={columnMenuOpen} onClick={() => setColumnMenuOpen((value) => !value)}><IconSettings size={18} /></button>
                    {columnMenuOpen && (
                      <div className="sa-column-menu" role="menu" data-qa="smart-column-menu">
                        <strong>显示列</strong>
                        <label><input type="checkbox" checked={visibleColumns.importance} onChange={(event) => setVisibleColumns((current) => ({ ...current, importance: event.target.checked }))} />设备重要等级</label>
                        <label><input type="checkbox" checked={visibleColumns.occurrence} onChange={(event) => setVisibleColumns((current) => ({ ...current, occurrence: event.target.checked }))} />报警次数</label>
                      </div>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const collapsed = collapsedGroups.includes(group.key);
                const groupIds = group.rows.map((row) => row.id);
                const groupChecked = groupIds.length > 0 && groupIds.every((id) => selectedIds.includes(id));
                const groupPartial = groupIds.some((id) => selectedIds.includes(id)) && !groupChecked;
                return [
                  <tr className="sa-device-row" key={`${group.key}-parent`} data-qa="smart-device-group">
                    <td><input type="checkbox" aria-label={`选择 ${group.name} 下报警`} checked={groupChecked} ref={(node) => { if (node) node.indeterminate = groupPartial; }} onChange={(event) => toggleRows(groupIds, event.target.checked)} /></td>
                    <td />
                    <td><button type="button" className="sa-device-toggle" data-qa={`smart-group-toggle-${group.rows[0].id}`} aria-expanded={!collapsed} onClick={() => setCollapsedGroups((current) => current.includes(group.key) ? current.filter((item) => item !== group.key) : [...current, group.key])}><IconChevronDown size={15} className={collapsed ? "collapsed" : ""} /><span>{group.path}</span></button></td>
                    <td><span className="sa-device-name"><IconBuilding size={16} />{group.name}</span></td>
                    {visibleColumns.importance && <td>{group.importance}</td>}
                    <td colSpan={4 + (visibleColumns.occurrence ? 1 : 0)} />
                  </tr>,
                  ...(!collapsed ? group.rows.map((row, rowIndex) => {
                    const absoluteIndex = (currentPage - 1) * pageSize + pageRows.indexOf(row) + 1;
                    return (
                      <tr className={`sa-alarm-row ${selectedIds.includes(row.id) ? "selected" : ""}`} key={row.id} data-qa={`smart-row-${row.id}`}>
                        <td><input type="checkbox" data-qa={`smart-select-${row.id}`} aria-label={`选择报警 ${row.id}`} checked={selectedIds.includes(row.id)} onChange={(event) => toggleRows([row.id], event.target.checked)} /></td>
                        <td>{absoluteIndex || rowIndex + 1}</td>
                        <td><span className="sa-child-guide" aria-hidden="true" /></td>
                        <td />
                        {visibleColumns.importance && <td />}
                        <td><div className="sa-summary-cell"><strong>{row.summary}</strong><span>依据：{row.evidence}</span><small>{row.algorithm} · 概率 {row.probability}%</small></div></td>
                        <td><span className={`sa-level level-${row.level}`}>{row.level}级1</span></td>
                        <td><time>{row.time}</time></td>
                        {visibleColumns.occurrence && <td><span className="sa-occurrences" title="报警发生次数">{row.occurrenceCount}</span></td>}
                        <td><div className="sa-row-actions"><button type="button" className="sa-link-button" data-qa={`smart-record-${row.id}`} onClick={() => setDialog({ type: "record", row })}>处理记录</button><button type="button" className="sa-link-button" data-qa={`smart-analysis-${row.id}`} onClick={() => setDialog({ type: "analysis", row })}>诊断分析</button></div></td>
                      </tr>
                    );
                  }) : []),
                ];
              })}
            </tbody>
          </table>
        </div>
        {!groups.length && (
          <div className="sa-empty-overlay" data-qa="smart-empty-state" role="status">
            <IconInbox size={42} /><strong>{filters.search || filters.level !== "all" ? "未查询到报警" : "暂无数据"}</strong>
            {(filters.search || filters.level !== "all") && <><span>请调整设备、组织或报警等级后重新查询</span><button type="button" onClick={clearFilters}>清空筛选</button></>}
          </div>
        )}
        <footer className="sa-pagination">
          <span data-qa="smart-total">共{filtered.length}项</span>
          <button type="button" data-qa="smart-prev-page" aria-label="上一页" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><IconChevronLeft size={18} /></button>
          <b data-qa="smart-current-page">{currentPage}</b>
          <button type="button" data-qa="smart-next-page" aria-label="下一页" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><IconChevronRight size={18} /></button>
          <label><select value={pageSize} data-qa="smart-page-size" onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="每页条数">{PAGE_SIZES.map((size) => <option key={size} value={size}>{size} 条/页</option>)}</select><IconChevronDown size={15} /></label>
          {selectedRows.length > 0 && <em>已选择 {selectedRows.length} 条</em>}
        </footer>
      </div>

      {toast && <div className={`sa-toast ${toast.tone}`} role="status" data-qa="smart-toast"><span>{toast.tone === "warning" ? <IconAlertTriangle size={17} /> : toast.tone === "info" ? <IconSparkles size={17} /> : <IconCheck size={17} />}</span>{toast.message}<button type="button" aria-label="关闭提示" onClick={() => setToast(null)}><IconX size={14} /></button></div>}
      {dialog?.type === "diagnosis" && <DiagnosisDialog rows={dialogRows} busy={submitting} onConfirm={saveDiagnosis} onCancel={() => !submitting && setDialog(null)} />}
      {dialog?.type === "record" && <RecordDialog row={dialog.row} onCancel={() => setDialog(null)} />}
      {dialog?.type === "analysis" && <AnalysisDialog row={dialog.row} onCancel={() => setDialog(null)} />}
    </section>
  );
}

export default SmartAlarmView;
