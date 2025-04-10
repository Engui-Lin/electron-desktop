import { ElevenLabsClient, play } from "elevenlabs";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});
const audio = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
  text: "The first move is what sets everything in motion.",
  model_id: "eleven_multilingual_v2",
  output_format: "mp3_44100_128",
});

await play(audio);
