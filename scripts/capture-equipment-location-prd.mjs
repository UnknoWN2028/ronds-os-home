import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(workspaceRoot, "prd-assets", "device-location");
const profileDirectory = path.join(workspaceRoot, ".edge-prd-capture-runtime");
const browserPath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const pageUrl = process.argv[2] || "http://127.0.0.1:4174/equipment-locations";
const debuggingPort = 9500 + Math.floor(Math.random() * 350);

if (!fs.existsSync(browserPath)) {
  throw new Error(`Edge not found: ${browserPath}`);
}

fs.mkdirSync(outputDirectory, { recursive: true });

const ensureWorkspaceTarget = (targetPath) => {
  const absoluteTarget = path.resolve(targetPath);
  const workspacePrefix = `${workspaceRoot}${path.sep}`;
  if (!absoluteTarget.startsWith(workspacePrefix)) {
    throw new Error(`Unsafe workspace target: ${absoluteTarget}`);
  }
  return absoluteTarget;
};

ensureWorkspaceTarget(outputDirectory);
ensureWorkspaceTarget(profileDirectory);

if (fs.existsSync(profileDirectory)) {
  fs.rmSync(profileDirectory, { recursive: true, force: true });
}

const browser = spawn(
  browserPath,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--disable-default-apps",
    "--disable-extensions",
    "--remote-allow-origins=*",
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${profileDirectory}`,
    "--window-size=1440,1000",
    "about:blank",
  ],
  {
    detached: false,
    stdio: "ignore",
    windowsHide: true,
  },
);

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForDebuggingTarget = async () => {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        const pageTarget = targets.find((target) => target.type === "page");
        if (pageTarget?.webSocketDebuggerUrl) return pageTarget;
      }
    } catch {
      // Browser is still starting.
    }
    await delay(200);
  }
  throw new Error("Timed out while waiting for the Edge debugging target.");
};

const connectToTarget = async (webSocketUrl) => {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener(
      "error",
      () => reject(new Error("Could not connect to the Edge debugging target.")),
      { once: true },
    );
  });

  let sequence = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  return { socket, send };
};

let client;

try {
  const target = await waitForDebuggingTarget();
  client = await connectToTarget(target.webSocketDebuggerUrl);
  const { send } = client;

  await Promise.all([
    send("Page.enable"),
    send("Runtime.enable"),
    send("DOM.enable"),
  ]);
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: pageUrl });

  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.text || "Runtime evaluation failed.");
    }
    return response.result.value;
  };

  const waitForSelector = async (selector, timeout = 20000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return;
      await delay(160);
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  };

  const getElementRect = async (selector, padding = 0) =>
    evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const left = Math.max(0, rect.left - ${padding});
      const top = Math.max(0, rect.top - ${padding});
      const right = Math.min(window.innerWidth, rect.right + ${padding});
      const bottom = Math.min(window.innerHeight, rect.bottom + ${padding});
      return {
        x: left + window.scrollX,
        y: top + window.scrollY,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top)
      };
    })()`);

  const writeScreenshot = async (fileName, clip) => {
    const response = await send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
      ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
    });
    fs.writeFileSync(path.join(outputDirectory, fileName), response.data, "base64");
  };

  const captureElement = async (selector, fileName, padding = 0) => {
    const clip = await getElementRect(selector, padding);
    if (!clip) throw new Error(`Cannot capture missing selector: ${selector}`);
    await writeScreenshot(fileName, clip);
  };

  const clickButtonByText = async (label) => {
    const clicked = await evaluate(`(() => {
      const button = [...document.querySelectorAll("button")]
        .find((item) => item.textContent.trim().includes(${JSON.stringify(label)}));
      if (!button || button.disabled) return false;
      button.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Cannot click button: ${label}`);
    await delay(450);
  };

  const hoverSelector = async (selector) => {
    const rect = await getElementRect(selector);
    if (!rect) throw new Error(`Cannot hover missing selector: ${selector}`);
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    });
    await delay(650);
  };

  await waitForSelector(".equipment-location-next");
  await waitForSelector(".eln-canvas > img");
  await delay(1800);

  await writeScreenshot("01-page-overview.png");
  await captureElement(".eln-left", "02-device-tree.png");
  await captureElement(".eln-map-panel", "03-floor-plan.png");

  await hoverSelector(".eln-marker.grouped");
  await captureElement(".eln-map-panel", "04-auto-group.png");

  await hoverSelector(".eln-marker.single");
  await captureElement(".eln-map-panel", "06-marker-realtime.png");

  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 10, y: 110 });
  await clickButtonByText("编辑位置");
  await captureElement(".eln-map-panel", "05-position-edit.png");

  const generatedFiles = fs
    .readdirSync(outputDirectory)
    .filter((fileName) => /^\d{2}-.*\.png$/i.test(fileName))
    .sort();
  console.log(JSON.stringify({ outputDirectory, generatedFiles }, null, 2));
} finally {
  try {
    if (client) {
      await client.send("Browser.close");
      client.socket.close();
    }
  } catch {
    browser.kill();
  }
  await delay(1000);
  if (fs.existsSync(profileDirectory)) {
    try {
      fs.rmSync(profileDirectory, { recursive: true, force: true });
    } catch {
      // Edge may briefly retain profile files after Browser.close.
    }
  }
}
