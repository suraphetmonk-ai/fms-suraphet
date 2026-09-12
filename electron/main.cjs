const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");
const { fork } = require("child_process");

let mainWindow = null;
let setupWindow = null;
let serverProcess = null;
let serverPort = 3010;

const isDev = !app.isPackaged;
const userDataDir = app.getPath("userData");
const configFilePath = path.join(userDataDir, "config.env");

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

async function waitForServer(url, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode) resolve();
          else reject(new Error("No status"));
        });
        req.on("error", reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
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
      serverPath = path.join(process.resourcesPath, "app.asar.unpacked/.next/standalone/server.js");
      if (!fs.existsSync(serverPath)) {
        serverPath = path.join(app.getAppPath(), ".next/standalone/server.js");
      }
    }

    const appUrl = `http://127.0.0.1:${serverPort}`;

    const childEnv = {
      ...process.env,
      ...envVars,
      PORT: serverPort.toString(),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      APP_URL: appUrl,
      ELECTRON_RUN_AS_NODE: "1",
    };

    if (!fs.existsSync(serverPath)) {
      if (isDev) {
        console.log("Standalone server.js not found in dev, assuming next dev is running on 3010");
        serverPort = 3010;
        resolve(`http://127.0.0.1:3010`);
        return;
      }
      return reject(new Error("Next.js Standalone server.js not found at: " + serverPath));
    }

    serverProcess = fork(serverPath, [], {
      env: childEnv,
      stdio: "pipe",
    });

    serverProcess.stdout.on("data", (d) => console.log(`[Next.js] ${d}`));
    serverProcess.stderr.on("data", (d) => console.error(`[Next.js ERR] ${d}`));
    serverProcess.on("exit", (code) => {
      console.log(`[Next.js] exited with code ${code}`);
      serverProcess = null;
    });

    const isReady = await waitForServer(appUrl);
    if (isReady) {
      resolve(appUrl);
    } else {
      reject(new Error("Server failed to respond within time limit"));
    }
  });
}

function createMainWindow(targetUrl) {
  if (mainWindow) {
    mainWindow.loadURL(targetUrl);
    mainWindow.show();
    return;
  }

  const iconPath = path.join(__dirname, "../public/icon.svg");

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: "คณะวิทยาการจัดการ มจร (FMS MCU)",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: false,
  });

  buildAppMenu();

  mainWindow.loadURL(targetUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function openSetupWindow() {
  if (setupWindow) {
    setupWindow.focus();
    return;
  }

  setupWindow = new BrowserWindow({
    width: 540,
    height: 680,
    resizable: false,
    maximizable: false,
    title: "ตั้งค่าฐานข้อมูล - คณะวิทยาการจัดการ มจร",
    icon: path.join(__dirname, "../public/icon.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  setupWindow.loadFile(path.join(__dirname, "setup-db.html"));
  setupWindow.setMenuBarVisibility(false);

  setupWindow.on("closed", () => {
    setupWindow = null;
  });
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
          label: "เกี่ยวกับโปรแกรม (About FMS MCU)",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "คณะวิทยาการจัดการ มจร",
              message: "ระบบสารสนเทศเพื่อการบริหารจัดการ\nคณะวิทยาการจัดการ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย",
              detail: "เวอร์ชัน 1.0.0 (Windows Desktop Client)\nขับเคลื่อนด้วย Next.js 16, React 19 และ PostgreSQL",
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
  return checkPortReachable(host, port, 4000);
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

    fs.writeFileSync(configFilePath, content, "utf8");

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
  let envs = {};
  if (fs.existsSync(configFilePath)) {
    envs = parseEnvFile(configFilePath);
  } else if (isDev && fs.existsSync(path.join(__dirname, "../.env"))) {
    envs = parseEnvFile(path.join(__dirname, "../.env"));
  }

  if (envs.DATABASE_URL) {
    try {
      const appUrl = await startNextServer(envs);
      createMainWindow(appUrl);
    } catch (err) {
      console.error("Failed to auto-start server:", err);
      openSetupWindow();
    }
  } else {
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
