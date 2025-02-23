require("dotenv").config();

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");
const { ElevenLabsClient, play, save } = require("elevenlabs");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

let mainWindow;
let filePath;
let textSummary;
// let ttsText;
// let ttsText = "test";
let ttsText = "Ugh, look at you trying so hard to be productive. What a loser.";

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

ipcMain.handle("get-text-summary", () => {
  return textSummary;
});

ipcMain.handle("get-tts-text", () => {
  return ttsText;
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
    textSummary = response.choices[0].message.content;
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error summarizing image:", error);
    return error;
  }
});

ipcMain.handle("generate-labs-prompt", async (event, textSummary) => {
  try {
    const personalities = "Mean, sarcastic, and rude";
    const prefix = `Pretend like you're someone that is ${personalities}`;
    const context = `This is a summary of what the user is doing on their computer ${textSummary}`;
    const condition = "Is the user doing something productive?";
    const demand =
      "If yes, you will be upset. Otherwise you'll be happy, supportive, and encouraging. What will you say to them? Your response should be maximum 2 sentences.";
    const fullPrompt = `${prefix}. ${context}. ${condition}. ${demand}`;
    console.log("fullPrompt: ", fullPrompt);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "developer",
          content: fullPrompt,
        },
      ],
      store: true,
    });

    console.log(response.choices[0]);
    ttsText = response.choices[0].message.content;
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating prompt:", error);
    return error;
  }
});

ipcMain.handle("generate-tts", async (event, text) => {
  try {
    /* 
    const downloadsFolder = path.join(
      app.getPath("downloads"),
      "electron-screenshots"
    );

    // Ensure the directory exists
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder, { recursive: true });
    }

    const mp3Path = path.join(downloadsFolder, "output.mp3");

    if (fs.existsSync(mp3Path)) {
      fs.unlinkSync(mp3Path);
      console.log(`File deleted: ${mp3Path}`);
    }
 */
    //Changed it to save the file in the same directory as the app
    const assetsFolder = path.join(__dirname, "assets");

    // Ensure the directory exists
    if (!fs.existsSync(assetsFolder)) {
      fs.mkdirSync(assetsFolder, { recursive: true });
    }

    const mp3Path = path.join(assetsFolder, "output.mp3");

    if (fs.existsSync(mp3Path)) {
      fs.unlinkSync(mp3Path);
      console.log(`File deleted: ${mp3Path}`);
    }

    const audio = await elevenlabs.textToSpeech.convert(
      "FGY2WhTYpPnrIDTdsKH5",
      {
        output_format: "mp3_44100_128",
        text: text,
        model_id: "eleven_multilingual_v2",
      }
    );
    // await play(audio);

    // Create a writable stream to save the audio
    const writeStream = fs.createWriteStream(mp3Path);

    // Pipe the audio stream to the file
    audio.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        console.log(`TTS audio saved to: ${mp3Path}`);
        resolve({ success: true, path: mp3Path });
      });

      writeStream.on("error", (error) => {
        console.error("Error saving TTS file:", error);
        reject({ success: false, error: error.message });
      });
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    return { success: false, error: error.message };
  }
});
