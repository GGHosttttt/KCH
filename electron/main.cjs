// electron/main.cjs
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

// Detect dev server mode via explicit env variable
const isDev = process.env.ELECTRON_IS_DEV === "true";

// Permit automated speech/sound without waiting for user click
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function createKioskWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    kiosk: !isDev,
    fullscreen: !isDev,
    alwaysOnTop: !isDev,
    autoHideMenuBar: true,
    frame: isDev,
    icon: path.join(__dirname, "../build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    // Load local built static files
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.webContents.on("context-menu", (e) => e.preventDefault());
  return win;
}

app.whenReady().then(createKioskWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
