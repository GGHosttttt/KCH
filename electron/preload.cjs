// const { contextBridge } = require("electron");
// const fs = require("fs");
// const path = require("path");

// // External config file path located on the Windows host
// const configPath = "C:\\ProgramData\\KCH\\kiosk_config.json";

// if (fs.existsSync(configPath)) {
//   try {
//     const rawData = fs.readFileSync(configPath, "utf-8");
//     config = { ...config, ...JSON.parse(rawData) };
//   } catch (err) {
//     console.error("Failed to read kiosk_config.json:", err);
//   }
// }

// contextBridge.exposeInMainWorld("kioskEnv", {
//   getKioskId: () => config.kiosk_id,
//   getApiUrl: () => config.api_url,
// });

// // PROD configuration
const { contextBridge } = require("electron");
const fs = require("fs");

const configPath = "C:\\ProgramData\\KCH\\kiosk_config.json";
let config = null;

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    console.error("Failed to parse kiosk_config.json:", err);
  }
}

contextBridge.exposeInMainWorld("kioskEnv", {
  getKioskId: () => config?.kiosk_device_id || config?.kiosk_id || null,
  getApiUrl: () => config?.api_url || null,
  getLocalApiUrl: () => config?.api_local_url || null,
  getFrontOrigin: () => config?.front_origin || null,
  isConfigured: () => Boolean((config?.kiosk_device_id || config?.kiosk_id) && config?.api_url),
});