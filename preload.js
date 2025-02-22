const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  takeScreenshot: () => ipcRenderer.send("save-screenshot"),
  onScreenshotSaved: (callback) =>
    ipcRenderer.on("screenshot-saved", (_, path) => callback(path)),
  getAPIKey: () => ipcRenderer.invoke("get-api-key"),
  getFilePath: () => ipcRenderer.invoke("get-file-path"),
  convertImageToBase64: (filePath) => {
    return ipcRenderer.invoke("convert-image-to-base64", filePath);
  },
  summarizeImageWithOpenAI: (filePath) =>
    ipcRenderer.invoke("summarize-image", filePath),
});
