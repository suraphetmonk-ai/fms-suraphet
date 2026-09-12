const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  testConnection: (config) => ipcRenderer.invoke("test-db-connection", config),
  saveConfig: (config) => ipcRenderer.invoke("save-db-config", config),
  getConfig: () => ipcRenderer.invoke("get-db-config"),
  closeSetup: () => ipcRenderer.send("close-setup"),
});
