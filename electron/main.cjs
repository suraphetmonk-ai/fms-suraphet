const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");
const { fork } = require("child_process");

app.name = "FMS-MCU";

let mainWindow = null;
let setupWindow = null;
let serverProcess = null;
let serverPort = 3010;

const isDev = !app.isPackaged;
const userDataDir = app.getPath("userData");
const configFilePath = path.join(userDataDir, "config.env");
const logFilePath = path.join(userDataDir, "app.log");

function logToFile(msg) {
  try {
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] ${msg}\n`, "utf8");
  } catch {}
}

process.on("uncaughtException", (err) => {
  logToFile(`[UNCAUGHT EXCEPTION] ${err.stack || err.message}`);
});

process.on("unhandledRejection", (reason) => {
  logToFile(`[UNHANDLED REJECTION] ${reason}`);
});

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else if (setupWindow) {
    if (setupWindow.isMinimized()) setupWindow.restore();
    setupWindow.focus();
  }
});

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const result = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

function parseDatabaseUrl(dbUrl) {
  if (!dbUrl) return null;
  try {
    const u = new URL(dbUrl);
    return {
      host: u.hostname,
      port: parseInt(u.port, 10) || 5432,
      database: u.pathname.replace(/^\//, ""),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    };
  } catch {
    return null;
  }
}

function checkPortReachable(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      isResolved = true;
      socket.destroy();
      resolve({ ok: true });
    });

    socket.once("timeout", () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ ok: false, error: "Connection timed out" });
      }
    });

    socket.once("error", (err) => {
      if (!isResolved) {
        isResolved = true;
        resolve({ ok: false, error: err.message });
      }
    });

    socket.connect(port, host);
  });
}

async function waitForServer(url, maxAttempts = 40, checkExited) {
  for (let i = 0; i < maxAttempts; i++) {
    if (checkExited && checkExited()) {
      return false;
    }
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode) resolve();
          else reject(new Error("No status"));
        });
        req.on("error", reject);
        req.setTimeout(800, () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

function startNextServer(envVars) {
  return new Promise(async (resolve, reject) => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }

    try {
      serverPort = await getFreePort();
    } catch {
      serverPort = 3010;
    }

    let serverPath = "";
    if (isDev) {
      serverPath = path.join(__dirname, "../.next/standalone/server.js");
    } else {
      serverPath = path.join(process.resourcesPath, "standalone/server.js");
      if (!fs.existsSync(serverPath)) {
        serverPath = path.join(process.resourcesPath, "app.asar.unpacked/.next/standalone/server.js");
      }
      if (!fs.existsSync(serverPath)) {
        serverPath = path.join(app.getAppPath(), ".next/standalone/server.js");
      }
    }

    const appUrl = `http://127.0.0.1:${serverPort}`;
    logToFile(`Target server path: ${serverPath}`);

    if (!fs.existsSync(serverPath)) {
      if (isDev) {
        console.log("Standalone server.js not found in dev, assuming next dev is running on 3010");
        serverPort = 3010;
        resolve(`http://127.0.0.1:3010`);
        return;
      }
      const notFoundErr = new Error("Next.js Standalone server.js not found at: " + serverPath);
      logToFile(notFoundErr.message);
      return reject(notFoundErr);
    }

    const standaloneDir = path.dirname(serverPath);

    const childEnv = {
      ...process.env,
      ...envVars,
      PORT: serverPort.toString(),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      APP_URL: appUrl,
      NEXTAUTH_URL: appUrl,
      AUTH_TRUST_HOST: "true",
      ELECTRON_RUN_AS_NODE: "1",
    };

    logToFile(`Launching standalone server process (port: ${serverPort}, cwd: ${standaloneDir})`);

    let hasExited = false;
    let exitCode = null;
    let stderrBuffer = "";

    serverProcess = fork(serverPath, [], {
      cwd: standaloneDir,
      env: childEnv,
      stdio: "pipe",
    });

    serverProcess.stdout.on("data", (d) => {
      const msg = d.toString();
      logToFile(`[Next.js stdout] ${msg.trim()}`);
      console.log(`[Next.js] ${msg}`);
    });

    serverProcess.stderr.on("data", (d) => {
      const msg = d.toString();
      stderrBuffer += msg;
      logToFile(`[Next.js stderr] ${msg.trim()}`);
      console.error(`[Next.js ERR] ${msg}`);
    });

    serverProcess.on("exit", (code) => {
      hasExited = true;
      exitCode = code;
      logToFile(`[Next.js exit] code: ${code}`);
      serverProcess = null;
    });

    const isReady = await waitForServer(appUrl, 40, () => hasExited);
    if (isReady) {
      logToFile(`Server successfully responded at ${appUrl}`);
      resolve(appUrl);
    } else {
      const errMsg = hasExited
        ? `เซิร์ฟเวอร์ปิดตัวกะทันหัน (Exit code ${exitCode}): ${stderrBuffer.slice(-300)}`
        : "เซิร์ฟเวอร์ไม่ตอบสนองภายในเวลาที่กำหนด";
      logToFile(`Failed to start server: ${errMsg}`);
      reject(new Error(errMsg));
    }
  });
}

function getAppIcon() {
  if (!isDev) return undefined; // Embedded icon in PE header used on Windows packaged app
  const icoPath = path.join(__dirname, "../public/icon.ico");
  if (fs.existsSync(icoPath)) return icoPath;
  return undefined;
}

function createMainWindow(targetUrl) {
  logToFile("createMainWindow called: " + targetUrl);
  if (mainWindow) {
    mainWindow.loadURL(targetUrl);
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  try {
    mainWindow = new BrowserWindow({
      width: 1366,
      height: 850,
      minWidth: 1024,
      minHeight: 700,
      title: "คณะวิทยาการจัดการ มจร (FMS MCU)",
      icon: getAppIcon(),
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      autoHideMenuBar: false,
    });

    buildAppMenu();

    mainWindow.loadURL(targetUrl).catch((err) => {
      logToFile(`mainWindow loadURL error: ${err.message}`);
    });

    mainWindow.on("closed", () => {
      logToFile("mainWindow closed");
      mainWindow = null;
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  } catch (err) {
    logToFile(`[createMainWindow EXCEPTION] ${err.stack || err.message}`);
  }
}

function openSetupWindow() {
  logToFile("openSetupWindow called");
  if (setupWindow) {
    setupWindow.show();
    setupWindow.focus();
    return;
  }

  try {
    const preloadPath = path.join(__dirname, "preload.cjs");
    const htmlPath = path.join(__dirname, "setup-db.html");
    logToFile(`setupWindow preload: ${preloadPath} (exists: ${fs.existsSync(preloadPath)})`);
    logToFile(`setupWindow html: ${htmlPath} (exists: ${fs.existsSync(htmlPath)})`);

    setupWindow = new BrowserWindow({
      width: 560,
      height: 700,
      resizable: false,
      maximizable: false,
      title: "ตั้งค่าฐานข้อมูล - คณะวิทยาการจัดการ มจร",
      icon: getAppIcon(),
      show: true,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    logToFile("setupWindow created successfully");

    setupWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
      logToFile(`[setupWindow did-fail-load] code: ${code}, desc: ${desc}, url: ${url}`);
    });

    setupWindow.loadFile(htmlPath).then(() => {
      logToFile("setupWindow.loadFile succeeded");
    }).catch((err) => {
      logToFile(`[setupWindow loadFile error] ${err.stack || err.message}`);
    });

    setupWindow.setMenuBarVisibility(false);

    setupWindow.on("closed", () => {
      logToFile("setupWindow closed");
      setupWindow = null;
    });
  } catch (err) {
    logToFile(`[openSetupWindow EXCEPTION] ${err.stack || err.message}`);
  }
}

function buildAppMenu() {
  const template = [
    {
      label: "ระบบ (System)",
      submenu: [
        {
          label: "ตั้งค่าการเชื่อมต่อฐานข้อมูล (Database Connection)...",
          click: () => openSetupWindow(),
        },
        { type: "separator" },
        {
          label: "ออกจากโปรแกรม (Exit)",
          role: "quit",
        },
      ],
    },
    {
      label: "มุมมอง (View)",
      submenu: [
        { role: "reload", label: "รีโหลด (Reload)" },
        { role: "forceReload", label: "รีโหลดแบบล้างแคช (Force Reload)" },
        { type: "separator" },
        { role: "resetZoom", label: "ขนาดมาตรฐาน (Actual Size)" },
        { role: "zoomIn", label: "ขยาย (Zoom In)" },
        { role: "zoomOut", label: "ย่อ (Zoom Out)" },
        { type: "separator" },
        { role: "togglefullscreen", label: "เต็มหน้าจอ (Toggle Full Screen)" },
      ],
    },
    {
      label: "ช่วยเหลือ (Help)",
      submenu: [
        {
          label: "ดู Log การทำงาน (Open Log File)",
          click: () => {
            if (fs.existsSync(logFilePath)) {
              shell.openPath(logFilePath);
            } else {
              dialog.showMessageBox(mainWindow || setupWindow, {
                type: "info",
                title: "Log",
                message: "ยังไม่มีไฟล์ log อยู่ที่: " + logFilePath,
              });
            }
          },
        },
        { type: "separator" },
        {
          label: "เกี่ยวกับโปรแกรม (About FMS MCU)",
          click: () => {
            dialog.showMessageBox(mainWindow || setupWindow, {
              type: "info",
              title: "คณะวิทยาการจัดการ มจร",
              message: "ระบบสารสนเทศเพื่อการบริหารจัดการ\nคณะวิทยาการจัดการ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
              detail: "เวอร์ชัน 0.1.0 (Windows Desktop Client)\nขับเคลื่อนด้วย Next.js 16, React 19 และ PostgreSQL",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle("test-db-connection", async (_event, config) => {
  const { host, port } = config;
  logToFile(`Testing connection to ${host}:${port}`);
  const res = await checkPortReachable(host, port, 4000);
  logToFile(`Test connection result: ${JSON.stringify(res)}`);
  return res;
});

ipcMain.handle("get-db-config", async () => {
  let envs = {};
  if (fs.existsSync(configFilePath)) {
    envs = parseEnvFile(configFilePath);
  } else if (isDev && fs.existsSync(path.join(__dirname, "../.env"))) {
    envs = parseEnvFile(path.join(__dirname, "../.env"));
  }

  const parsed = parseDatabaseUrl(envs.DATABASE_URL);
  return parsed || { host: "localhost", port: 5432, database: "ums_dev", user: "postgres", password: "" };
});

ipcMain.handle("save-db-config", async (_event, config) => {
  try {
    const { host, port, database, user, password } = config;
    const encodedUser = encodeURIComponent(user);
    const encodedPass = encodeURIComponent(password);
    const databaseUrl = `postgresql://${encodedUser}:${encodedPass}@${host}:${port}/${database}?schema=public`;

    let existingEnv = {};
    if (fs.existsSync(configFilePath)) {
      existingEnv = parseEnvFile(configFilePath);
    }

    const authSecret = existingEnv.AUTH_SECRET || require("crypto").randomBytes(32).toString("hex");

    const content = [
      "# การตั้งค่าฐานข้อมูลระบบ FMS MCU",
      `DATABASE_URL="${databaseUrl}"`,
      `AUTH_SECRET="${authSecret}"`,
      "",
    ].join("\n");

    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    fs.writeFileSync(configFilePath, content, "utf8");
    logToFile(`Saved new database config to ${configFilePath}`);

    // Launch Next server
    const appUrl = await startNextServer({
      DATABASE_URL: databaseUrl,
      AUTH_SECRET: authSecret,
    });

    if (setupWindow) {
      setupWindow.close();
      setupWindow = null;
    }

    createMainWindow(appUrl);
    return { ok: true };
  } catch (err) {
    logToFile(`Save db config error: ${err.message}`);
    return { ok: false, error: err.message || String(err) };
  }
});

ipcMain.on("close-setup", () => {
  if (setupWindow) {
    setupWindow.close();
    setupWindow = null;
  }
});

// App lifecycle
app.whenReady().then(async () => {
  logToFile("================ APP LAUNCH ================");
  logToFile(`isPackaged: ${app.isPackaged}, execPath: ${process.execPath}`);
  logToFile(`userDataDir: ${userDataDir}`);

  let envs = {};
  if (fs.existsSync(configFilePath)) {
    envs = parseEnvFile(configFilePath);
    logToFile(`Loaded configuration from ${configFilePath}`);
  } else if (isDev && fs.existsSync(path.join(__dirname, "../.env"))) {
    envs = parseEnvFile(path.join(__dirname, "../.env"));
    logToFile("Loaded dev environment from .env");
  }

  if (envs.DATABASE_URL) {
    try {
      logToFile("Found DATABASE_URL, attempting to start server...");
      const appUrl = await startNextServer(envs);
      createMainWindow(appUrl);
    } catch (err) {
      logToFile(`Auto-start failed: ${err.message}. Showing setup window.`);
      openSetupWindow();
    }
  } else {
    logToFile("No DATABASE_URL found. Showing setup window.");
    openSetupWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (mainWindow) mainWindow.show();
      else openSetupWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
