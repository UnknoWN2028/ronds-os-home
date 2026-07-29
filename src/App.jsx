import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconBell,
  IconBrain,
  IconBuildingBroadcastTower,
  IconCube,
  IconDeviceCctv,
  IconGridDots,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconDeviceAnalytics,
  IconMapPin,
  IconMenu2,
  IconSparkles,
  IconUser,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import wavingHand from "./assets/waving-hand.svg";
import { VideoMonitoring } from "./VideoMonitoring.jsx";
import { RH830StationManagement as CollectionStationManagement } from "./RH830StationManagement.jsx";
import { AudioVideoAnalysis } from "./AudioVideoAnalysis.jsx";
import { IntelligentDiagnosis } from "./IntelligentDiagnosis.jsx";
import { RollerGroupAnalysis } from "./RollerGroupAnalysis.jsx";
import { EquipmentLocationManagementNext as EquipmentLocationManagement } from "./EquipmentLocationManagementNext.jsx";
import { LINKED_OPERATIONS, operationHref, operationStatusLabel, OperationsProvider, resolveOperation, routeParams, useOperations } from "./operations-context.jsx";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "1级报警等待处置",
    detail: "2号转运站 · 东侧入口检测到非授权人员闯入",
    time: "2分钟前",
    tone: "critical",
    unread: true,
  },
  {
    id: 2,
    title: "采集站自检完成",
    detail: "RH830-V2 自检通过，8 个通道运行正常",
    time: "18分钟前",
    tone: "success",
    unread: true,
  },
  {
    id: 3,
    title: "分析任务已生成",
    detail: "1号廊道音视频联合分析报告可查看",
    time: "今天 13:40",
    tone: "info",
    unread: false,
  },
];

const deploymentBase = import.meta.env.BASE_URL === "/"
  ? ""
  : import.meta.env.BASE_URL.replace(/\/$/, "");
const SIDEBAR_WIDTH_KEY = 'ronds-sidebar-width-balanced-compact-v2';
const SIDEBAR_MIN_WIDTH = 168;
const SIDEBAR_DEFAULT_WIDTH = 188;
const SIDEBAR_MAX_WIDTH = 236;

function appHref(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return deploymentBase ? `${deploymentBase}/#${normalizedPath}` : normalizedPath;
}

function currentRoutePath() {
  const hashPath = window.location.hash.replace(/^#/, "");
  if (hashPath.startsWith("/")) return hashPath;

  if (deploymentBase && window.location.pathname.startsWith(deploymentBase)) {
    return window.location.pathname.slice(deploymentBase.length) || "/";
  }

  return window.location.pathname;
}

function navigateWithinApp(event, href, { protectStationDraft = false } = {}) {
  if (
    event?.defaultPrevented
    || event?.button > 0
    || event?.metaKey
    || event?.ctrlKey
    || event?.shiftKey
    || event?.altKey
  ) return null;

  event?.preventDefault();
  const hasUnsavedStationDraft = protectStationDraft
    && Boolean(document.querySelector('.rh-version-state button.dirty'));
  if (hasUnsavedStationDraft && !window.confirm('当前采集站存在未保存修改。\n\n确定离开并放弃这些修改吗？选择“取消”可返回后先保存。')) return false;

  const target = new URL(href, window.location.href);
  const current = new URL(window.location.href);
  if (target.pathname === current.pathname && target.search === current.search && target.hash === current.hash) {
    window.setTimeout(() => document.querySelector('.workspace')?.focus(), 0);
    return true;
  }

  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.setTimeout(() => window.dispatchEvent(new PopStateEvent('popstate')), 0);
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  return true;
}

const PRIMARY_NAV_ITEMS = Object.freeze([
  { id: 'home', label: '主页', description: '运维工作台', path: '/', icon: IconHome, activePages: ['home'] },
  { id: 'video', label: '智慧视频监控', description: '实时画面与告警', path: '/video-monitoring', icon: IconDeviceCctv, activePages: ['video'] },
  { id: 'diagnosis', label: '智能诊断', description: '病例核查与处置', path: '/intelligent-diagnosis', icon: IconBrain, activePages: ['diagnosis'] },
  { id: 'stations', label: '采集站管理', description: 'RH830 配置管理', path: '/collection-stations', icon: IconBuildingBroadcastTower, activePages: ['stations'] },
  { id: 'locations', label: '设备位置管理', description: '火电空间图与音视频测点', path: '/equipment-locations', icon: IconMapPin, activePages: ['locations'] },
  { id: 'analysis', label: '音视频分析', description: '趋势与证据分析', path: '/audio-video-analysis', icon: IconDeviceAnalytics, activePages: ['analysis', 'roller-analysis'] },
]);

function navLabelForPage(page) {
  return PRIMARY_NAV_ITEMS.find((item) => item.activePages.includes(page))?.label || '主页';
}

function Brand({ compact = false, navigationOpen = false, onToggleNavigation, showSwitcher = true }) {
  return (
    <div className="brand" aria-label="智能运维OS">
      {showSwitcher && (
        <button
          type="button"
          className={`app-switcher ${navigationOpen ? 'selected' : ''}`}
          data-qa="os-sidebar-grid-toggle"
          onClick={onToggleNavigation}
          aria-label={navigationOpen ? '收起左侧主菜单' : '展开左侧主菜单'}
          aria-expanded={navigationOpen}
          aria-controls="os-sidebar"
          title="主菜单"
        >
          <IconGridDots size={30} stroke={2.5} />
        </button>
      )}
      <span className="brand-mark" aria-hidden="true">
        <IconCube size={23} stroke={2.1} />
      </span>
      {!compact && <span className="brand-name">智能运维OS</span>}
    </div>
  );
}

function Sidebar({ collapsed, mobileOpen, onClose, activePage, onNavigate }) {
  const showLabels = !collapsed || mobileOpen;
  const follow = (event, href) => {
    const navigated = onNavigate?.(event, href);
    if (navigated !== false) onClose?.();
  };
  return (
    <aside
      id="os-sidebar"
      className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      data-qa="os-sidebar"
      aria-hidden={collapsed && !mobileOpen ? "true" : undefined}
      inert={collapsed && !mobileOpen ? true : undefined}
    >
      <div className="mobile-sidebar-head">
        <Brand compact={!showLabels} showSwitcher={false} />
        <button className="icon-button" onClick={onClose} aria-label="关闭导航">
          <IconX size={21} />
        </button>
      </div>

      <nav className="nav-list" aria-label="主导航">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const href = appHref(item.path);
          const active = item.activePages.includes(activePage);
          const NavIcon = item.icon;
          return (
            <a
              key={item.id}
              className={`nav-item ${active ? 'active' : ''}`}
              href={href}
              onClick={(event) => follow(event, href)}
              aria-current={active ? 'page' : undefined}
              data-nav-id={item.id}
              title={showLabels ? undefined : item.label}
            >
              <span className="nav-icon"><NavIcon size={22} stroke={1.85} /></span>
              {showLabels && <span className="nav-label">{item.label}</span>}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

function AccountDialog({ mode, draft, onDraftChange, onCancel, onSave, onConfirmLogout }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!mode) return undefined;
    const previouslyFocused = document.activeElement;
    const frame = window.requestAnimationFrame(() => {
      const firstControl = dialogRef.current?.querySelector("input, button:not([disabled])");
      firstControl?.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll("input, button:not([disabled])")];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [mode]);

  if (!mode) return null;

  const title = mode === "settings" ? "个人设置" : mode === "logout" ? "确认退出登录" : "退出演示完成";

  return (
    <div
      className="account-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}
    >
      <section
        ref={dialogRef}
        className="account-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
      >
        <header>
          <div>
            <span className="account-dialog-eyebrow">账户中心</span>
            <strong id="account-dialog-title">{title}</strong>
          </div>
          <button type="button" onClick={onCancel} aria-label={`关闭${title}`}><IconX size={19} /></button>
        </header>

        {mode === "settings" ? (
          <form className="account-settings-form" onSubmit={onSave}>
            <label>
              <span>显示名称</span>
              <input
                required
                maxLength="24"
                value={draft.name}
                onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
                autoComplete="name"
              />
            </label>
            <label>
              <span>联系邮箱</span>
              <input
                required
                type="email"
                value={draft.email}
                onChange={(event) => onDraftChange({ ...draft, email: event.target.value })}
                autoComplete="email"
              />
            </label>
            <label className="account-checkbox">
              <input
                type="checkbox"
                checked={draft.dailyDigest}
                onChange={(event) => onDraftChange({ ...draft, dailyDigest: event.target.checked })}
              />
              <span>接收每日运维摘要</span>
            </label>
            <footer>
              <button type="button" className="secondary" onClick={onCancel}>取消</button>
              <button type="submit" className="primary">保存设置</button>
            </footer>
          </form>
        ) : mode === "logout" ? (
          <div className="account-confirmation">
            <div className="account-confirmation-icon" aria-hidden="true">!</div>
            <p>退出后需要重新登录才能继续处理报警和设备任务。</p>
            <small>当前为演示环境，确认操作不会清除设备选择、页面偏好或任何本地数据。</small>
            <footer>
              <button type="button" className="secondary" onClick={onCancel}>取消</button>
              <button type="button" className="danger" onClick={onConfirmLogout}>确认退出</button>
            </footer>
          </div>
        ) : (
          <div className="account-confirmation signed-out-confirmation">
            <div className="account-confirmation-icon" aria-hidden="true">✓</div>
            <p>已完成退出登录演示</p>
            <small>为便于继续体验，当前会话与本地原型数据均保持不变。</small>
            <footer>
              <button type="button" className="primary" onClick={onCancel}>返回系统</button>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}

function CollectionStationWorkspace() {
  const params = useMemo(() => routeParams(), []);
  const requestedOperation = resolveOperation(params.get("event"));
  const requestedStationCode = requestedOperation?.stationCode || params.get("station") || "HKV01101";
  const pointDeepLink = useMemo(() => ({
    stationCode: requestedStationCode,
    cameraId: params.get("camera") || "",
    pointId: params.get("point") || "",
  }), [params, requestedStationCode]);
  const [stationCode, setStationCode] = useState(requestedStationCode);
  const stationOperations = useMemo(() => LINKED_OPERATIONS.filter((operation) => operation.stationCode === stationCode), [stationCode]);
  const [linkedEventId, setLinkedEventId] = useState(() => requestedOperation?.id || LINKED_OPERATIONS.find((operation) => operation.stationCode === requestedStationCode)?.id || "");
  const linkedOperation = resolveOperation(linkedEventId);
  const { getEvent } = useOperations();
  const linkedEvent = linkedEventId ? getEvent(linkedEventId) : null;

  useEffect(() => {
    if (!requestedStationCode) return undefined;
    const timer = window.setTimeout(() => {
      const stationSelect = document.querySelector(".rh-head-top select");
      if (!stationSelect || ![...stationSelect.options].some((option) => option.value === requestedStationCode)) return;
      stationSelect.value = requestedStationCode;
      stationSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [requestedStationCode]);

  useEffect(() => {
    if (!pointDeepLink.pointId) return undefined;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const target = [...document.querySelectorAll(".rh-group[data-data-id]")]
        .find((node) => node.dataset.dataId === pointDeepLink.pointId);
      if (target) {
        target.classList.add("station-point-deep-link-target");
        target.setAttribute("tabindex", "-1");
        target.setAttribute("aria-current", "location");
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        target.focus({ preventScroll: true });
        window.clearInterval(timer);
      } else if (attempts >= 30) {
        window.clearInterval(timer);
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, [pointDeepLink.pointId]);

  useEffect(() => {
    const syncStation = () => {
      const value = document.querySelector(".rh-head-top select")?.value;
      if (value) setStationCode((current) => current === value ? current : value);
    };
    syncStation();
    const timer = window.setInterval(syncStation, 180);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setLinkedEventId((current) => stationOperations.some((operation) => operation.id === current) ? current : stationOperations[0]?.id || "");
  }, [stationOperations]);

  return (
    <div className="station-linked-workspace">
      {linkedOperation && <nav className="station-linked-bar has-event" aria-label="关联业务上下文">
        <div className="station-event-context" title={linkedOperation ? `${linkedOperation.displayId} · ${linkedOperation.devicePath} · ${linkedOperation.analysisPointCode} / ${linkedOperation.analysisMetricName} · ${linkedOperation.timeWithMillis}` : undefined}>
          <label><span>关联事件</span><select value={linkedEventId} disabled={!stationOperations.length} onChange={(event) => setLinkedEventId(event.target.value)} aria-label="选择当前采集站的关联事件">{stationOperations.length ? stationOperations.map((operation) => <option key={operation.id} value={operation.id}>{operation.displayId} · {operation.title}</option>) : <option value="">当前站暂无关联事件</option>}</select></label>
          <strong>{linkedOperation.device} · {linkedOperation.location}</strong><em className={`status-${linkedEvent?.status || "pending"}`}>{operationStatusLabel(linkedEvent?.status)}</em>{linkedEvent?.defectId && <b>缺陷 {linkedEvent.defectId}</b>}{linkedEvent?.actionNote && <small>处置：{linkedEvent.actionNote}</small>}
        </div>
        <span className="station-linked-actions">
          <a href={operationHref("/video-monitoring", linkedEventId)} onClick={(event) => navigateWithinApp(event, operationHref("/video-monitoring", linkedEventId), { protectStationDraft: true })}>视频复核</a>
          <a href={operationHref("/intelligent-diagnosis", linkedEventId)} onClick={(event) => navigateWithinApp(event, operationHref("/intelligent-diagnosis", linkedEventId), { protectStationDraft: true })}>诊断病例</a>
          <a href={operationHref("/audio-video-analysis", linkedEventId, { station: stationCode })} onClick={(event) => navigateWithinApp(event, operationHref("/audio-video-analysis", linkedEventId, { station: stationCode }), { protectStationDraft: true })}>趋势证据</a>
        </span>
      </nav>}
      <CollectionStationManagement deepLinkContext={pointDeepLink} />
    </div>
  );
}

function AppShell({ page = "home" }) {
  const [collapsed, setCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedValue = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const savedWidth = savedValue === null ? Number.NaN : Number(savedValue);
    return Number.isFinite(savedWidth)
      ? Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, savedWidth))
      : SIDEBAR_DEFAULT_WIDTH;
  });
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [profile, setProfile] = useState({ name: "超级管理员", email: "admin@ronds.com", dailyDigest: true });
  const [profileDraft, setProfileDraft] = useState(profile);
  const [accountDialog, setAccountDialog] = useState(null);
  const [shellFeedback, setShellFeedback] = useState("");
  const workspaceRef = useRef(null);
  const previousPageRef = useRef(page);
  const handleNavigation = (event, href) => navigateWithinApp(event, href, { protectStationDraft: page === "stations" });
  const togglePrimaryNavigation = () => setCollapsed((value) => !value);
  const unreadCount = notifications.filter((item) => item.unread).length;

  useEffect(() => {
    const closePopovers = (event) => {
      if (!event.target.closest("[data-popover]")) {
        setNoticeOpen(false);
        setProfileOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setNoticeOpen(false);
      setProfileOpen(false);
      setMobileOpen(false);
    };
    window.addEventListener("click", closePopovers);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("click", closePopovers);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!shellFeedback) return undefined;
    const timer = window.setTimeout(() => setShellFeedback(""), 2800);
    return () => window.clearTimeout(timer);
  }, [shellFeedback]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(sidebarWidth)));
  }, [sidebarWidth]);

  useEffect(() => {
    const previousPage = previousPageRef.current;
    previousPageRef.current = page;
    setCollapsed(true);
    setMobileOpen(false);
    setNoticeOpen(false);
    setProfileOpen(false);
    document.title = `${navLabelForPage(page)} - 智能运维OS`;
    const resetWorkspaceViewport = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      if (workspaceRef.current) {
        workspaceRef.current.scrollTop = 0;
        workspaceRef.current.scrollLeft = 0;
      }
    };
    resetWorkspaceViewport();
    if (previousPage !== page) {
      window.setTimeout(() => {
        resetWorkspaceViewport();
        workspaceRef.current?.focus();
      }, 0);
    }
  }, [page]);

  const updateSidebarWidth = (clientX) => {
    setSidebarWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, clientX)));
  };

  const resizeWithKeyboard = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSidebarWidth((width) => Math.max(SIDEBAR_MIN_WIDTH, width - 8));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSidebarWidth((width) => Math.min(SIDEBAR_MAX_WIDTH, width + 8));
    }
    if (event.key === "Home") {
      event.preventDefault();
      setSidebarWidth(SIDEBAR_MIN_WIDTH);
    }
    if (event.key === "End") {
      event.preventDefault();
      setSidebarWidth(SIDEBAR_MAX_WIDTH);
    }
  };

  const openProfileSettings = () => {
    setProfileDraft(profile);
    setProfileOpen(false);
    setAccountDialog("settings");
  };

  const saveProfileSettings = (event) => {
    event.preventDefault();
    setProfile(profileDraft);
    setAccountDialog(null);
    setShellFeedback("个人设置已保存");
  };

  const openLogoutConfirmation = () => {
    setProfileOpen(false);
    setAccountDialog("logout");
  };

  return (
    <div
      className={`app-shell ${page === "diagnosis" ? "diagnosis-shell" : ""} ${page === "roller-analysis" ? "roller-analysis-shell" : ""} ${page === "stations" ? "stations-shell" : ""} ${collapsed ? "sidebar-collapsed" : ""} ${resizingSidebar ? "sidebar-resizing" : ""}`}
      data-qa="os-shell"
      style={{ "--sidebar-width": `${sidebarWidth}px` }}
    >
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="打开导航" aria-controls="os-sidebar" aria-expanded={mobileOpen}>
          <IconMenu2 size={23} />
        </button>
        <Brand navigationOpen={!collapsed} onToggleNavigation={togglePrimaryNavigation} />

        <div className="topbar-actions">
          <div className="popover-wrap" data-popover>
            <button
              className={`icon-button header-button ${noticeOpen ? "selected" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                setNoticeOpen((open) => !open);
                setProfileOpen(false);
              }}
              aria-label={unreadCount ? `通知，${unreadCount}条未读` : "通知，全部已读"}
              aria-expanded={noticeOpen}
              aria-controls="notification-popover"
            >
              <IconBell size={23} stroke={1.8} />
              {unreadCount > 0 && <span className="notification-badge" aria-hidden="true">{unreadCount}</span>}
            </button>
            {noticeOpen && (
              <div id="notification-popover" className="popover notification-popover" role="region" aria-label="系统通知">
                <div className="notification-head">
                  <div><strong>通知</strong><span>{unreadCount ? `${unreadCount} 条未读` : "全部已读"}</span></div>
                  <button
                    type="button"
                    onClick={() => setNotifications((items) => items.map((item) => ({ ...item, unread: false })))}
                    disabled={!unreadCount}
                  >
                    全部标为已读
                  </button>
                </div>
                <div className="notification-list">
                  {notifications.map((item) => (
                    <button
                      type="button"
                      className={`notification-item ${item.unread ? "unread" : ""}`}
                      key={item.id}
                      onClick={() => setNotifications((items) => items.map((entry) => entry.id === item.id ? { ...entry, unread: false } : entry))}
                      aria-label={`${item.title}，${item.time}${item.unread ? "，未读" : "，已读"}`}
                    >
                      <span className={`notification-tone tone-${item.tone}`} aria-hidden="true" />
                      <span className="notification-copy"><strong>{item.title}</strong><span>{item.detail}</span><small>{item.time}</small></span>
                      {item.unread && <span className="notification-unread" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="popover-wrap" data-popover>
            <button
              className={`user-button ${profileOpen ? "selected" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                setProfileOpen((open) => !open);
                setNoticeOpen(false);
              }}
              aria-label={`${profile.name}账户`}
              aria-expanded={profileOpen}
              aria-controls="profile-popover"
            >
              <IconUser size={22} stroke={1.7} />
              <span>{profile.name}</span>
            </button>
            {profileOpen && (
              <div id="profile-popover" className="popover profile-popover" role="region" aria-label="账户菜单">
                <div className="profile-summary"><strong>{profile.name}</strong><span>{profile.email}</span></div>
                <button type="button" onClick={openProfileSettings}>个人设置</button>
                <button type="button" className="logout-action" onClick={openLogoutConfirmation}>退出登录</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} activePage={page} onNavigate={handleNavigation} />
      <div
        className="sidebar-resizer"
        data-qa="os-sidebar-resizer"
        role="separator"
        aria-label="调整侧边栏宽度"
        aria-orientation="vertical"
        aria-valuemin={SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        aria-valuenow={Math.round(sidebarWidth)}
        tabIndex={collapsed ? -1 : 0}
        onPointerDown={(event) => {
          event.preventDefault();
          setResizingSidebar(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (resizingSidebar) updateSidebarWidth(event.clientX);
        }}
        onPointerUp={(event) => {
          setResizingSidebar(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onLostPointerCapture={() => setResizingSidebar(false)}
        onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
        onKeyDown={resizeWithKeyboard}
        title="拖动调整侧边栏宽度；双击恢复默认"
      />
      {mobileOpen && <button className="sidebar-scrim" aria-label="关闭导航" onClick={() => setMobileOpen(false)} />}

      <main ref={workspaceRef} tabIndex={-1} aria-label={navLabelForPage(page)} className={`workspace ${page === "video" ? "video-workspace" : ""} ${page === "diagnosis" ? "diagnosis-workspace" : ""} ${page === "stations" ? "stations-workspace" : ""} ${page === "locations" ? "locations-workspace" : ""} ${page === "analysis" || page === "roller-analysis" ? "analysis-workspace" : ""}`} data-qa="os-workspace">
        {page === "video" ? (
          <section className="content-card monitoring-content-card" aria-label="智慧视频监控">
            <VideoMonitoring
              embedded
              shellCollapsed={collapsed}
              onSetShellSidebarCollapsed={setCollapsed}
            />
          </section>
        ) : page === "stations" ? (
          <section className="content-card station-content-card" aria-label="采集站管理">
            <CollectionStationWorkspace />
          </section>
        ) : page === "locations" ? (
          <section className="content-card location-content-card" aria-label="设备位置管理">
            <EquipmentLocationManagement />
          </section>
        ) : page === "analysis" ? (
          <section className="content-card analysis-content-card" aria-label="音视频分析">
            <AudioVideoAnalysis />
          </section>
        ) : page === "roller-analysis" ? (
          <section className="content-card analysis-content-card" aria-label="托辊组分析">
            <RollerGroupAnalysis />
          </section>
        ) : page === "diagnosis" ? (
          <section className="content-card diagnosis-content-card" aria-label="智能诊断" data-qa="diagnosis-content-card">
            <IntelligentDiagnosis />
          </section>
        ) : (
          <section className="content-card" aria-labelledby="welcome-heading">
            <div className="welcome">
              <h1 id="welcome-heading">
                <img className="welcome-hand" src={wavingHand} alt="" />
                <span>欢迎使用 Ronds OS!</span>
              </h1>
              <p>Hello, Ronds OS User!</p>
            </div>
          </section>
        )}
      </main>

      <button
        className="collapse-button"
        data-qa="os-sidebar-toggle"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        aria-controls="os-sidebar"
        aria-expanded={!collapsed}
        title={collapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        {collapsed ? <IconLayoutSidebarLeftExpand size={23} /> : <IconLayoutSidebarLeftCollapse size={23} />}
      </button>

      <div className="assistant">
        {assistantOpen && (
          <div id="assistant-panel" className="assistant-panel" role="region" aria-label="智能助手">
            <strong>智能助手</strong>
            <p>您好，我可以协助您处理运维问题。</p>
            <button onClick={() => setAssistantOpen(false)}>知道了</button>
          </div>
        )}
        <button
          className="assistant-button"
          onClick={() => setAssistantOpen((open) => !open)}
          aria-label={assistantOpen ? "关闭智能助手" : "打开智能助手"}
          aria-expanded={assistantOpen}
          aria-controls="assistant-panel"
        >
          <IconSparkles size={26} stroke={1.8} />
        </button>
      </div>

      <AccountDialog
        mode={accountDialog}
        draft={profileDraft}
        onDraftChange={setProfileDraft}
        onCancel={() => setAccountDialog(null)}
        onSave={saveProfileSettings}
        onConfirmLogout={() => setAccountDialog("signed-out")}
      />

      {shellFeedback && (
        <div className="shell-feedback" role="status" aria-live="polite">
          <span>{shellFeedback}</span>
          <button type="button" onClick={() => setShellFeedback("")} aria-label="关闭操作提示"><IconX size={16} /></button>
        </div>
      )}
    </div>
  );
}

function RoutedApp() {
  const [routePath, setRoutePath] = useState(currentRoutePath);

  useEffect(() => {
    const syncRoute = () => setRoutePath(currentRoutePath());
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);

    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  const page = routePath.startsWith("/intelligent-diagnosis")
    ? "diagnosis"
    : routePath.startsWith("/roller-group-analysis")
    ? "roller-analysis"
    : routePath.startsWith("/audio-video-analysis")
    ? "analysis"
    : routePath.startsWith("/video-monitoring")
    ? "video"
    : routePath.startsWith("/collection-stations")
      ? "stations"
    : routePath.startsWith("/equipment-locations")
      ? "locations"
      : "home";
  return <AppShell page={page} />;
}

export function App() {
  return <OperationsProvider><RoutedApp /></OperationsProvider>;
}
