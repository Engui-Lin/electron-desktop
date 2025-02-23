console.log("renderer.js is loaded!"); // Debugging log
console.log("Checking window.electronAPI:", window.electronAPI); // Debugging log

// Send image to OpenAI API for summary
// async function summarizeImageWithOpenAI(base64Image) {
//   const apiKey = await window.electronAPI.getAPIKey(); // Get API key securely

//   if (!apiKey) {
//     console.error("Missing OpenAI API key!");
//     return "API key not found.";
//   }

//   const response = await fetch("https://api.openai.com/v1/images/generate", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4-vision-preview", // Replace with OpenAI's vision model
//       prompt: "Describe this screenshot in detail.",
//       image: base64Image,
//     }),
//   });

//   const data = await response.json();
//   return data.choices?.[0]?.text || "No summary available.";
// }

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
