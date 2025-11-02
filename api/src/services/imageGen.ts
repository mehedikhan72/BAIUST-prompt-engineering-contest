import OpenAI, { toFile } from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImage(prompt: string, assets: string[] = [], referenceImageUrl?: string): Promise<Buffer> {
  try {
    // Combine user prompt with assets
    const fullPrompt = assets.length > 0 ? `${prompt}. Include: ${assets.join(", ")}` : prompt;

    let response;

    // Path 1: WITH Reference Image (Image Editing)
    if (referenceImageUrl) {
      // Download reference image
      const imageResponse = await axios.get(referenceImageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(imageResponse.data);
      const imageFile = await toFile(imageBuffer, "reference.png", { type: "image/png" });

      // Use DALL-E 2 for image editing (single file, not array!)
      response = await openai.images.edit({
        model: "dall-e-2",
        image: imageFile,
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      });
    } else {
      // Path 2: WITHOUT Reference Image (Image Generation)
      // Use DALL-E 3 for generation from scratch
      response = await openai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      });
    }

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
