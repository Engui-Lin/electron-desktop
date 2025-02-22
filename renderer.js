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

// Show notification when screenshot is saved
if (window.electronAPI) {
  window.electronAPI.onScreenshotSaved((filePath) => {
    console.log("Screenshot saved at:", filePath);
    alert(`Screenshot saved at:\n${filePath}`);
  });
}
