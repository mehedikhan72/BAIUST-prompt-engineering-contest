import OpenAI, { toFile } from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to download image with retry logic
async function downloadImageWithRetry(url: string, maxRetries = 3, delayMs = 2000): Promise<Buffer> {
  console.log('=== Starting reference image download ===');
  console.log('URL to download:', url);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} - Downloading from: ${url}`);
      const imageResponse = await axios.get(url, { 
        responseType: "arraybuffer",
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });
      
      console.log(`Response status: ${imageResponse.status}`);
      console.log(`Response headers:`, imageResponse.headers);
      
      if (imageResponse.status === 200) {
        console.log('✅ Reference image downloaded successfully!');
        console.log(`Image size: ${imageResponse.data.byteLength} bytes`);
        return Buffer.from(imageResponse.data);
      } else {
        console.error(`❌ Unexpected status code: ${imageResponse.status}`);
        console.error(`Response data:`, imageResponse.data.toString?.() || 'Unable to parse response');
      }
    } catch (error: any) {
      console.error(`❌ Download attempt ${attempt} failed:`, error.message);
      console.error('Error details:', {
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url
      });
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw new Error(`Failed to download reference image after ${maxRetries} attempts. URL: ${url}. Last error: ${error.message}. Please check if the CDN URL is correct in your .env file.`);
      }
    }
  }
  throw new Error('Failed to download reference image');
}

export async function generateImage(
  prompt: string, 
  assets: string[] = [], 
  referenceImageBuffer?: Buffer, 
  userAssets: Buffer[] = []
): Promise<Buffer> {
  try {
    console.log('🎨 Starting image generation...');
    console.log('Prompt:', prompt);
    console.log('Level assets:', assets);
    console.log('Has reference image:', !!referenceImageBuffer);
    console.log('User assets count:', userAssets.length);

    // Combine user prompt with assets
    let fullPrompt = prompt;
    if (assets.length > 0) {
      fullPrompt += `. Include these assets: ${assets.join(", ")}`;
    }
    if (userAssets.length > 0) {
      fullPrompt += `. Also incorporate the ${userAssets.length} uploaded asset(s)`;
    }

    let response;

    if (referenceImageBuffer) {
      // Path 1: WITH reference image - use gpt-image-1 for editing
      console.log('🖼️ Using reference image with gpt-image-1 (editing)');
      const imageFile = await toFile(referenceImageBuffer, "reference.png", { type: "image/png" });

      response = await openai.images.edit({
        model: "gpt-image-1",
        image: [imageFile],
        prompt: fullPrompt,
      });
    } else {
      // Path 2: WITHOUT reference image - use gpt-image-1 for generation
      console.log('✨ Generating new image with gpt-image-1');
      response = await openai.images.generate({
        model: "gpt-image-1",
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

    console.log('✅ Image generated successfully!');
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, "base64");
    return imageBuffer;
  } catch (error: any) {
    console.error("❌ Image generation error:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}
