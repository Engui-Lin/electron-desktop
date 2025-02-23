require("dotenv").config();

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");
const { ElevenLabsClient, play } = require("elevenlabs");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

let mainWindow;
let filePath;
let textSummary;
let ttsText = "test";
// "Ugh, look at you trying so hard to be productive. Developing and debugging an Electron app? How riveting. I can't even come up with a colorful insult for this oneΓÇöyou're actually working and making progress. It's just sickening. Can't you do something less productive for once?";

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
      "If yes, you will be upset. Otherwise you'll be happy, supportive, and encouraging. What will you say to them? Keep your response short and to the point.";
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

// ipcMain.handle("generate-tts", async (event, text) => {
//   try {
//     const response = await elevenlabs.textToSpeech.convert(
//       "JBFqnCBsd6RMkjVDRZzb",
//       {
//         output_format: "mp3_44100_128",
//         text: text,
//         model_id: "eleven_multilingual_v2",
//       }
//     );

//     console.log(response);

//     // Ensure the response contains a buffer
//     if (!response || !response.readableStream) {
//       throw new Error("No readable stream received");
//     }

//     const downloadsFolder = path.join(
//       app.getPath("downloads"),
//       "electron-screenshots"
//     );

//     const mp3Path = path.join(downloadsFolder, "output.mp3");
//     // Read the stream correctly without locking it
//     const fileStream = fs.createWriteStream(mp3Path);
//     const reader = response.readableStream.getReader();

//     async function writeStream() {
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         fileStream.write(value);
//       }
//       fileStream.end();
//     }

//     await writeStream();

//     console.log(`MP3 file saved to: ${mp3Path}`);
//     return response;
//   } catch (error) {
//     console.error("Error generating TTS:", error);
//     return error;
//   }
// });

ipcMain.handle("generate-tts", async (event, text) => {
  try {
    const downloadsFolder = path.join(
      app.getPath("downloads"),
      "electron-screenshots"
    );

    // Ensure the directory exists
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder, { recursive: true });
    }

    const mp3Path = path.join(downloadsFolder, "output.mp3");

    const audio = await elevenlabs.textToSpeech.convert(
      "JBFqnCBsd6RMkjVDRZzb",
      {
        output_format: "mp3_44100_128",
        text: text,
        model_id: "eleven_multilingual_v2",
      }
    );
    await play(audio);
    // await streamPipeline(response, fs.createWriteStream(mp3Path));
    // console.log(response);
    // Convert the ReadableStream to an ArrayBuffer
    // const arrayBuffer = await response.readableStream.arrayBuffer();

    // Convert ArrayBuffer to Buffer
    // const buffer = Buffer.from(arrayBuffer);

    // Write the buffer to a file
    // await fs.writeFile(mp3Path, buffer);

    // Get the Downloads folder path

    // Get the readable stream
    // const readableStream = response.readableStream;

    // Save the stream to the specified file path
    // await streamPipeline(readableStream, fs.createWriteStream(mp3Path));

    console.log(`MP3 file saved to: ${mp3Path}`);

    // Use pipeline() to correctly stream the audio to file

    console.log(`MP3 file saved to: ${mp3Path}`);
    return { success: true, filePath: mp3Path };
  } catch (error) {
    console.error("Error generating TTS:", error);
    return { success: false, error: error.message };
  }
});
