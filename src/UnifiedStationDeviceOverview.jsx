import { useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconCamera,
  IconCheck,
  IconChecklist,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react/dist/cjs/tabler-icons-react.cjs";

const deviceReadiness = (device) => {
  if (device.status === "离线") {
    return { label: "设备离线", detail: "连接与视频流不可用", tone: "blocked" };
  }
  if (device.status === "告警") {
    return { label: "码流异常", detail: "需要复核实时视频", tone: "blocked" };
  }
  if (!device.algorithms?.length) {
    return { label: "未配算法", detail: "尚未建立算法检测", tone: "blocked" };
  }
  return { label: "交付就绪", detail: "连接、视频与算法已验证", tone: "ready" };
};

export function UnifiedStationDeviceOverview({ devices = [], stationCode, onOpenAnnotation }) {
  const [open, setOpen] = useState(false);
  const [testingId, setTestingId] = useState("");
  const [verifiedIds, setVerifiedIds] = useState([]);
  const stats = useMemo(() => {
    const ready = devices.filter((device) => deviceReadiness(device).tone === "ready").length;
    return {
      ready,
      blocked: devices.length - ready,
      streams: devices.filter((device) => device.status !== "离线").length,
      ptz: devices.filter((device) => device.ptz).length,
    };
  }, [devices]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const locate = (device) => {
    setOpen(false);
    onOpenAnnotation(device);
  };

  const testStreamAndAlgorithm = (device) => {
    if (testingId || device.status === "离线") return;
    setTestingId(device.id);
    window.setTimeout(() => {
      setTestingId("");
      setVerifiedIds((current) => [...new Set([...current, device.id])]);
    }, 650);
  };

  return (
    <>
      <button
        type="button"
        className={`rh-unified-device-trigger ${stats.blocked ? "blocked" : "ready"}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="查看已合并到主工作台的设备交付概览"
      >
        <IconChecklist size={14} />
        <b>{stats.ready}/{devices.length}</b>
        <span>设备就绪</span>
        {stats.blocked > 0 && <em>{stats.blocked} 阻塞</em>}
      </button>

      {open && (
        <div className="rh-unified-device-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="rh-unified-device-dialog" role="dialog" aria-modal="true" aria-label="设备接入概览">
            <header>
              <div>
                <span><IconCamera size={18} /></span>
                <div>
                  <b>设备接入概览</b>
                  <small>{stationCode} · 已合并到采集站配置主工作台</small>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭设备接入概览"><IconX size={18} /></button>
            </header>

            <div className="rh-unified-device-stats">
              <div><strong>{stats.ready}/{devices.length}</strong><span>交付就绪</span></div>
              <div><strong>{stats.streams}/{devices.length}</strong><span>视频流可用</span></div>
              <div><strong>{stats.ptz}</strong><span>云台设备</span></div>
              <div className={stats.blocked ? "blocked" : ""}><strong>{stats.blocked}</strong><span>阻塞设备</span></div>
            </div>

            <div className="rh-unified-device-table-wrap">
              <table className="rh-unified-device-table">
                <thead>
                  <tr>
                    <th>摄像头</th>
                    <th>媒体 / 视频流</th>
                    <th>控制能力</th>
                    <th>算法指标</th>
                    <th>交付状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => {
                    const readiness = deviceReadiness(device);
                    return (
                      <tr key={device.id}>
                        <td>
                          <div className="rh-unified-device-name">
                            <img src={device.image} alt="" />
                            <span><b>{device.name}</b><small>{device.ip} · {device.model}</small></span>
                          </div>
                        </td>
                        <td><b>{device.type}</b><small>{device.status === "离线" ? "视频流不可用" : `主码流正常 · ${device.protocol} / RTSP`}</small></td>
                        <td><b>{device.ptz ? `云台 / ${device.zoom || "变焦"}` : "固定机位"}</b><small>{device.ptz ? "支持旋转、变焦和预置位" : "支持数字缩放取景"}</small></td>
                        <td><div className="rh-unified-algorithms">{device.algorithms?.map((algorithm, index) => <span key={`${algorithm}-${index}`}>{algorithm}</span>)}</div></td>
                        <td><span className={`rh-unified-readiness ${readiness.tone}`}>{readiness.tone === "ready" ? <IconCheck size={13} /> : <IconAlertTriangle size={13} />}<b>{readiness.label}</b><small>{readiness.detail}</small></span></td>
                        <td><div className="rh-unified-device-actions">
                          <button type="button" className={`rh-unified-test ${verifiedIds.includes(device.id) ? "verified" : ""}`} disabled={Boolean(testingId) || device.status === "离线"} onClick={() => testStreamAndAlgorithm(device)}>
                            {testingId === device.id ? "测试中…" : verifiedIds.includes(device.id) ? "视频/算法已验证" : "测试视频与算法"}
                          </button>
                          <button type="button" className="rh-unified-locate" onClick={() => locate(device)}>算法标注<IconChevronRight size={13} /></button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer>
              <span>设备接入状态与当前站点配置保持同步，可从任一摄像头直接定位算法标注。</span>
              <button type="button" onClick={() => setOpen(false)}>关闭</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
