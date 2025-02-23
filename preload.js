const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  takeScreenshot: () => ipcRenderer.send("save-screenshot"),
  onScreenshotSaved: (callback) =>
    ipcRenderer.on("screenshot-saved", (_, path) => callback(path)),
  getAPIKey: () => ipcRenderer.invoke("get-api-key"),
  getFilePath: () => ipcRenderer.invoke("get-file-path"),
  getTextSummary: () => ipcRenderer.invoke("get-text-summary"),
  getTTSText: () => ipcRenderer.invoke("get-tts-text"),
  summarizeImageWithOpenAI: (filePath) =>
    ipcRenderer.invoke("summarize-image", filePath),
  generatePromptWithOpenAI: (textSummary) =>
    ipcRenderer.invoke("generate-labs-prompt", textSummary),
  generateTTS: (text) => ipcRenderer.invoke("generate-tts", text),
});
