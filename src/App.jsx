import { useEffect, useState } from "react";
import {
  IconBell,
  IconBuildingBroadcastTower,
  IconCube,
  IconDeviceCctv,
  IconGridDots,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconDeviceAnalytics,
  IconMenu2,
  IconSparkles,
  IconUser,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";
import wavingHand from "./assets/waving-hand.svg";
import { VideoMonitoring } from "./VideoMonitoring.jsx";
import { RH830StationManagement as CollectionStationManagement } from "./RH830StationManagement.jsx";
import { AudioVideoAnalysis } from "./AudioVideoAnalysis.jsx";

const deploymentBase = import.meta.env.BASE_URL === "/"
  ? ""
  : import.meta.env.BASE_URL.replace(/\/$/, "");

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

function Brand({ compact = false }) {
  return (
    <div className="brand" aria-label="智能运维OS">
      <a className="app-switcher" href={appHref("/video-monitoring")} aria-label="打开智慧视频监控" title="智慧视频监控">
        <IconGridDots size={30} stroke={2.5} />
      </a>
      <span className="brand-mark" aria-hidden="true">
        <IconCube size={23} stroke={2.1} />
      </span>
      {!compact && <span className="brand-name">智能运维OS</span>}
    </div>
  );
}

function Sidebar({ collapsed, mobileOpen, onClose, activePage }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="mobile-sidebar-head">
        <Brand compact={collapsed} />
        <button className="icon-button" onClick={onClose} aria-label="关闭导航">
          <IconX size={21} />
        </button>
      </div>

      <nav className="nav-list" aria-label="主导航">
        <a className={`nav-item ${activePage === "home" ? "active" : ""}`} href={appHref("/")} onClick={onClose} title={collapsed ? "主页" : undefined}>
          <span className="nav-icon"><IconHome size={22} stroke={1.85} /></span>
          {!collapsed && <span className="nav-label">主页</span>}
        </a>
        <a className={`nav-item ${activePage === "video" ? "active" : ""}`} href={appHref("/video-monitoring")} onClick={onClose} title={collapsed ? "智慧视频监控" : undefined}>
          <span className="nav-icon"><IconDeviceCctv size={22} stroke={1.85} /></span>
          {!collapsed && <span className="nav-label">智慧视频监控</span>}
        </a>
        <a className={`nav-item ${activePage === "stations" ? "active" : ""}`} href={appHref("/collection-stations")} onClick={onClose} title={collapsed ? "采集站管理" : undefined}>
          <span className="nav-icon"><IconBuildingBroadcastTower size={22} stroke={1.85} /></span>
          {!collapsed && <span className="nav-label">采集站管理</span>}
        </a>
        <a className={`nav-item ${activePage === "analysis" ? "active" : ""}`} href={appHref("/audio-video-analysis")} onClick={onClose} title={collapsed ? "音视频分析" : undefined}>
          <span className="nav-icon"><IconDeviceAnalytics size={22} stroke={1.85} /></span>
          {!collapsed && <span className="nav-label">音视频分析</span>}
        </a>
      </nav>
    </aside>
  );
}

function AppShell({ page = "home" }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = Number(window.localStorage.getItem("ronds-sidebar-width"));
    const defaultWidth = Math.min(344, Math.max(286, window.innerWidth * 0.1675));
    return Number.isFinite(savedWidth) && savedWidth >= 220 && savedWidth <= 480 ? savedWidth : defaultWidth;
  });
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [homeTabOpen, setHomeTabOpen] = useState(true);
  const moduleLabel = page === "video" ? "智慧视频监控" : page === "stations" ? "采集站管理" : page === "analysis" ? "音视频分析" : "";
  const modulePath = page === "video" ? "/video-monitoring" : page === "stations" ? "/collection-stations" : "/audio-video-analysis";
  const moduleHref = appHref(modulePath);

  useEffect(() => {
    const closePopovers = (event) => {
      if (!event.target.closest("[data-popover]")) {
        setNoticeOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("click", closePopovers);
    return () => window.removeEventListener("click", closePopovers);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ronds-sidebar-width", String(Math.round(sidebarWidth)));
  }, [sidebarWidth]);

  const updateSidebarWidth = (clientX) => {
    setSidebarWidth(Math.min(480, Math.max(220, clientX)));
  };

  const resizeWithKeyboard = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSidebarWidth((width) => Math.max(220, width - 10));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSidebarWidth((width) => Math.min(480, width + 10));
    }
    if (event.key === "Home") {
      event.preventDefault();
      setSidebarWidth(286);
    }
    if (event.key === "End") {
      event.preventDefault();
      setSidebarWidth(480);
    }
  };

  return (
    <div
      className={`app-shell ${collapsed ? "sidebar-collapsed" : ""} ${resizingSidebar ? "sidebar-resizing" : ""}`}
      style={{ "--sidebar-width": `${sidebarWidth}px` }}
    >
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="打开导航">
          <IconMenu2 size={23} />
        </button>
        <Brand />

        <div className="topbar-actions">
          <div className="popover-wrap" data-popover>
            <button
              className={`icon-button header-button ${noticeOpen ? "selected" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                setNoticeOpen((open) => !open);
                setProfileOpen(false);
              }}
              aria-label="通知"
            >
              <IconBell size={23} stroke={1.8} />
              <span className="notification-dot" />
            </button>
            {noticeOpen && (
              <div className="popover notification-popover">
                <strong>通知</strong>
                <p>当前没有新的系统通知</p>
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
              aria-label="超级管理员账户"
            >
              <IconUser size={22} stroke={1.7} />
              <span>超级管理员</span>
            </button>
            {profileOpen && (
              <div className="popover profile-popover">
                <strong>超级管理员</strong>
                <button>个人设置</button>
                <button>退出登录</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} activePage={page} />
      <div
        className="sidebar-resizer"
        role="separator"
        aria-label="调整侧边栏宽度"
        aria-orientation="vertical"
        aria-valuemin="220"
        aria-valuemax="480"
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
        onDoubleClick={() => setSidebarWidth(Math.min(344, Math.max(286, window.innerWidth * 0.1675)))}
        onKeyDown={resizeWithKeyboard}
        title="拖动调整侧边栏宽度；双击恢复默认"
      />
      {mobileOpen && <button className="sidebar-scrim" aria-label="关闭导航" onClick={() => setMobileOpen(false)} />}

      <main className={`workspace ${page === "video" ? "video-workspace" : ""} ${page === "stations" ? "stations-workspace" : ""} ${page === "analysis" ? "analysis-workspace" : ""}`}>
        <div className="breadcrumb-row">
          {page !== "home" ? (
            <div className="page-tabs" role="tablist" aria-label="已打开页面">
              {homeTabOpen && (
                <span className="page-tab">
                  <a href={appHref("/")} role="tab" aria-selected="false">{page === "stations" ? "机器人管理" : "主页"}</a>
                  <button onClick={() => setHomeTabOpen(false)} aria-label={`关闭${page === "stations" ? "机器人管理" : "主页"}标签`}><IconX size={14} /></button>
                </span>
              )}
              <span className="page-tab active">
                <a href={moduleHref} role="tab" aria-selected="true">{moduleLabel}</a>
                <button onClick={() => { window.location.href = appHref("/"); }} aria-label={`关闭${moduleLabel}标签`}><IconX size={14} /></button>
              </span>
            </div>
          ) : <span className="breadcrumb-chip">主页</span>}
        </div>

        {page === "video" ? (
          <section className="content-card monitoring-content-card" aria-label="智慧视频监控">
            <VideoMonitoring embedded />
          </section>
        ) : page === "stations" ? (
          <section className="content-card station-content-card" aria-label="采集站管理">
            <CollectionStationManagement />
          </section>
        ) : page === "analysis" ? (
          <section className="content-card analysis-content-card" aria-label="音视频分析">
            <AudioVideoAnalysis />
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
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        title={collapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        {collapsed ? <IconLayoutSidebarLeftExpand size={23} /> : <IconLayoutSidebarLeftCollapse size={23} />}
      </button>

      <div className="assistant">
        {assistantOpen && (
          <div className="assistant-panel">
            <strong>智能助手</strong>
            <p>您好，我可以协助您处理运维问题。</p>
            <button onClick={() => setAssistantOpen(false)}>知道了</button>
          </div>
        )}
        <button
          className="assistant-button"
          onClick={() => setAssistantOpen((open) => !open)}
          aria-label="打开智能助手"
        >
          <IconSparkles size={26} stroke={1.8} />
        </button>
      </div>
    </div>
  );
}

export function App() {
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

  const page = routePath.startsWith("/audio-video-analysis")
    ? "analysis"
    : routePath.startsWith("/video-monitoring")
    ? "video"
    : routePath.startsWith("/collection-stations")
      ? "stations"
      : "home";
  return <AppShell page={page} />;
}
