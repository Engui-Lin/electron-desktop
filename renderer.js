console.log("renderer.js is loaded!"); // Debugging log
console.log("Checking window.electronAPI:", window.electronAPI); // Debugging log

document.getElementById("screenshotBtn").addEventListener("click", () => {
  if (!window.electronAPI || !window.electronAPI.takeScreenshot) {
    console.error(
      "window.electronAPI is undefined! The preload script may not be loaded."
    );
    return;
  }

  console.log("Screenshot button clicked!");
  window.electronAPI.takeScreenshot();
});

document
  .getElementById("sendToOpenAIBtn")
  .addEventListener("click", async () => {
    console.log("Send-to-OpenAI button clicked!");
    filePath = await window.electronAPI.getFilePath();

    console.log("Sending screenshot to OpenAI...");
    const response = await window.electronAPI.summarizeImageWithOpenAI(
      filePath
    );

    console.log("AI Summary:", response);
    alert(`AI Summary:\n${response}`);
  });

// Show notification when screenshot is saved
window.electronAPI.onScreenshotSaved((filePath) => {
  console.log("Screenshot saved at:", filePath);
  // alert(`Screenshot saved at:\n${filePath}`);
});

document
  .getElementById("generatePrompt")
  .addEventListener("click", async () => {
    console.log("generatePrompt button clicked!");
    textSummary = await window.electronAPI.getTextSummary();

    console.log("Sending command to OpenAI...");
    const response = await window.electronAPI.generatePromptWithOpenAI(
      textSummary
    );

    console.log("Generated TTS Prompt:", response);
    alert(`Generated TTS Prompt:\n${response}`);
  });
