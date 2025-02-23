require("dotenv").config();

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");
const { type } = require("os");

let mainWindow;
let filePath;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.webContents.openDevTools(); // Open DevTools for debugging

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
});

ipcMain.on("save-screenshot", async (event) => {
  console.log("Screenshot request received!"); // Debugging log

  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 }, // TODO: Match user's screen resolution
      fetchWindowIcons: true, // Optional: fetch window icons if needed
    });

    if (sources.length === 0) {
      console.error("No screen sources found.");
      return;
    }

    // TODO : Modify this to use the user's preferred screen
    const screen = sources[0];

    console.log("Captured screen size:", screen.thumbnail.getSize()); // Debugging log

    const imageBuffer = screen.thumbnail.toPNG(); // Convert to PNG format

    // TODO: Modify this to use the user's preferred download location
    const screenshotsFolder = path.join(
      app.getPath("downloads"),
      "electron-screenshots"
    );

    if (!fs.existsSync(screenshotsFolder)) {
      fs.mkdirSync(screenshotsFolder, { recursive: true });
    }

    const screenshotPath = path.join(
      screenshotsFolder,
      "screenshot.png"
      // `screenshot-${Date.now()}.png`
    );

    filePath = screenshotPath;

    fs.writeFile(screenshotPath, imageBuffer, (err) => {
      if (err) {
        console.error("Failed to save screenshot:", err);
      } else {
        console.log("Screenshot saved at:", screenshotPath);
        event.reply("screenshot-saved", screenshotPath);
      }
    });
  } catch (error) {
    console.error("Error capturing screen:", error);
  }
});

// Send API key securely to the renderer process
ipcMain.handle("get-api-key", () => {
  return process.env.OPENAI_API_KEY;
});

// Send screenshot file path to the renderer process
ipcMain.handle("get-file-path", () => {
  return filePath;
});

// Handle image summary request
ipcMain.handle("summarize-image", async (event, filePath) => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    base64Image = imageBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What's in this image?" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      store: true,
    });

    console.log(response.choices[0]);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error summarizing image:", error);
    return error;
  }
});
