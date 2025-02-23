const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  takeScreenshot: () => ipcRenderer.send("save-screenshot"),
  onScreenshotSaved: (callback) =>
    ipcRenderer.on("screenshot-saved", (_, path) => callback(path)),
  getAPIKey: () => ipcRenderer.invoke("get-api-key"),
  getFilePath: () => ipcRenderer.invoke("get-file-path"),
  summarizeImageWithOpenAI: (filePath) =>
    ipcRenderer.invoke("summarize-image", filePath),
  //Settings
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  saveSettings: (settings) => ipcRenderer.send("save-settings", settings),
});
