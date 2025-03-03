require("dotenv").config();

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  desktopCapturer,
  Tray,
  Menu,
} = require("electron");
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
let ttsText;
// let ttsText = "test";
/* let ttsText = "Ugh, look at you trying so hard to be productive. What a loser.";
 */
const hologramWidth = 720 / 3;
const hologramHeight = 1080 / 3;

// ==============================================================
const saveScreenshot = async () => {
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

    fs.writeFileSync(screenshotPath, imageBuffer, (err) => {
      if (err) {
        console.error("Failed to save screenshot:", err);
      } else {
        console.log("Screenshot saved at:", screenshotPath);
      }
    });
  } catch (error) {
    console.error("Error capturing screen:", error);
  }
};

const summarizeImage = async () => {
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
};

const generateLabsPrompt = async () => {
  try {
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    }

    const profanityLevel = settings.temperament.profanityLevel;
    const personalities = "Mean, sarcastic, and rude";
    const prefix = `Pretend like you're someone that is ${personalities}`;
    const context = `This is a summary of what the user is doing on their computer: ${textSummary}`;
    const condition = "Is the user doing something productive?";
    const demand = `If not, you will be upset, use profanity based on profanity level ${profanityLevel}, scaled from 1-10, level 1 uses little to no swear words and level 10 uses mostly swear words. Otherwise you'll be happy, supportive, and encouraging. What will you say to them? Your response should be maximum 2 sentences.`;
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
};

const generateTTS = async () => {
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

    // const audio = await elevenlabs.textToSpeech.convert(
    //   "FGY2WhTYpPnrIDTdsKH5",
    //   {
    //     output_format: "mp3_44100_128",
    //     text: ttsText,
    //     model_id: "eleven_multilingual_v2",
    //   }
    // );
    // // await play(audio);

    // // Create a writable stream to save the audio
    // const writeStream = fs.createWriteStream(mp3Path);

    // // Pipe the audio stream to the file
    // audio.pipe(writeStream);

    // return new Promise((resolve, reject) => {
    //   writeStream.on("finish", () => {
    //     console.log(`TTS audio saved to: ${mp3Path}`);
    //     resolve({ success: true, path: mp3Path });
    //   });

    //   writeStream.on("error", (error) => {
    //     console.error("Error saving TTS file:", error);
    //     reject({ success: false, error: error.message });
    //   });
    // });

    // Fetch the TTS audio as a readable stream
    const audioStream = await elevenlabs.textToSpeech.convert(
      "FGY2WhTYpPnrIDTdsKH5",
      {
        output_format: "mp3_44100_128",
        text: ttsText,
        model_id: "eleven_multilingual_v2",
      }
    );

    // Ensure the returned object is a valid stream
    if (!audioStream || typeof audioStream.pipe !== "function") {
      throw new Error("Received an invalid audio stream from ElevenLabs API");
    }

    // Create a writable stream to save the audio
    const writeStream = fs.createWriteStream(mp3Path);

    return new Promise((resolve, reject) => {
      audioStream.pipe(writeStream);

      writeStream.on("finish", () => {
        console.log(`TTS audio saved to: ${mp3Path}`);
        resolve({ success: true, path: mp3Path });
      });

      writeStream.on("error", (error) => {
        console.error("Error saving TTS file:", error);
        reject({ success: false, error: error.message });
      });

      // Also handle errors on the readable stream
      audioStream.on("error", (error) => {
        console.error("Error reading TTS stream:", error);
        reject({ success: false, error: error.message });
      });
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    return { success: false, error: error.message };
  }
};

const scheduledJob = async () => {
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  }
  const schedule = settings.schedule;
  const selectedDays = schedule.selectedDays;
  const focusStartTime = schedule.focusStartTime;
  const focusEndTime = schedule.focusEndTime;

  const now = new Date();
  // Get current day abbreviation (lowercase)
  const daysMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = daysMap[now.getDay()];
  const currentHour = now.getHours();

  // Convert focus times to hour & minute
  const [startHour, startMinute] = focusStartTime.split(":").map(Number);
  const [endHour, endMinute] = focusEndTime.split(":").map(Number);

  // Check if current time is within range
  const isWithinFocusTime =
    (currentHour > startHour || currentHour === startHour) &&
    (currentHour < endHour || currentHour === endHour);

  console.log(
    isWithinFocusTime ? "Currently within focus time!" : "Outside focus time."
  );

  console.log("Today:", today, "Current Hour:", currentHour);
  console.log(schedule.focusStartTime, schedule.focusEndTime);

  const daySelected = selectedDays.includes(today);

  console.log(daySelected, isWithinFocusTime);

  if (daySelected && isWithinFocusTime) {
    await saveScreenshot();
    await summarizeImage();
    await generateLabsPrompt();
    await generateTTS();
  }
};
// ==============================================================

app.whenReady().then(async () => {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 600,
    resizable: false,
    show: false,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  hologramWindow = new BrowserWindow({
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    width: hologramWidth,
    height: hologramHeight,
    x: width - hologramWidth, // Position at the rightmost part of the screen
    y: height - hologramHeight, // Position at the bottom
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });
  hologramWindow.setResizable(false);
  hologramWindow.loadFile("hologram.html");

  mainWindow.loadFile("index.html");

  // mainWindow.webContents.openDevTools(); // Open DevTools for debugging

  // Minimize to system tray instead of closing
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide(); // Hide instead of closing
    }
  });

  // Minimize to system tray instead of closing
  hologramWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      hologramWindow.hide(); // Hide instead of closing
    }
  });

  // Create Tray Icon
  tray = new Tray(path.join(__dirname, "icon.png")); // Use a 16x16 or 32x32 icon
  const contextMenu = Menu.buildFromTemplate([
    { label: "Settings", click: () => mainWindow.show() },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("My Electron App");

  // Restore the app when clicking the tray icon
  tray.on("click", () => {
    mainWindow.show();
    hologramWindow.show();
  });

  app.on("window-all-closed", (event) => {
    event.preventDefault();
  });

  // =============================================================
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  }
  const schedule = settings.schedule;
  const interruptionFrequency = schedule.interruptionFrequency;

  // Schedule the job to run every X minute
  setInterval(async () => {
    await scheduledJob();
    hologramWindow.webContents.send("start-audio");
  }, interruptionFrequency * 60 * 1000);

  // =============================================================
});

// Settings saving and loading
const settingsPath = path.join(app.getPath("userData"), "settings.json");
if (!fs.existsSync(settingsPath)) {
  const defaultSettings = {
    schedule: {
      selectedDays: [],
      focusStartTime: "",
      focusEndTime: "",
      interruptionFrequency: 5,
    },
    audio: {
      volume: 50,
      voice: "default",
      enablePostProcessing: true,
    },
    temperament: {
      profanityLevel: 5,
      enableFlirting: false,
    },
  };
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
}

// Listen for the event from renderer
ipcMain.on("manual-triggered", async () => {
  await scheduledJob();
  hologramWindow.webContents.send("start-audio");
});

// Handle saving settings
ipcMain.on("save-settings", (event, settings) => {
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log("Settings saved in index.js to:", settingsPath);
});

// Handle loading settings
ipcMain.handle("load-settings", (event) => {
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  }
  return settings;
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

// ipcMain.on("save-screenshot", saveScreenshot);

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
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    }

    const profanityLevel = settings.temperament.profanityLevel;
    const personalities = "Mean, sarcastic, and rude";
    const prefix = `Pretend like you're someone that is ${personalities}`;
    const context = `This is a summary of what the user is doing on their computer: ${textSummary}`;
    const condition = "Is the user doing something productive?";
    const demand = `If not, you will be upset, use profanity based on profanity level ${profanityLevel}, scaled from 1-10, level 1 uses little to no swear words and level 10 uses mostly swear words. Otherwise you'll be happy, supportive, and encouraging. What will you say to them? Your response should be maximum 2 sentences.`;
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
