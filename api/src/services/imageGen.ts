import OpenAI, { toFile } from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImage(prompt: string, assets: string[] = [], referenceImageUrl?: string): Promise<Buffer> {
  try {
    // Combine user prompt with assets
    const fullPrompt = assets.length > 0 ? `${prompt}. Include: ${assets.join(", ")}` : prompt;

    // Download reference image if provided
    let images: any[] = [];
    if (referenceImageUrl) {
      const imageResponse = await axios.get(referenceImageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(imageResponse.data);
      const imageFile = await toFile(imageBuffer, "reference.png", { type: "image/png" });
      images.push(imageFile);
    }

    // Use gpt-image-1 with images.edit
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: images,
      prompt: fullPrompt,
    });

    // Get base64 image from response
    const imageBase64 = response.data[0].b64_json;

    if (!imageBase64) {
      throw new Error("No image data returned from OpenAI");
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, "base64");

    return imageBuffer;
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}
