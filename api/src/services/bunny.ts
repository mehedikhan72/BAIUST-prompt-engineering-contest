import axios from 'axios';
import { Readable } from 'stream';

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY || '';
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || '';
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || '';

export async function uploadImage(
  imageBuffer: Buffer, 
  teamId: string, 
  filename?: string
): Promise<string> {
  try {
    const timestamp = Date.now();
    const finalFilename = filename || `${timestamp}.png`;
    const path = `/images/${teamId}/${finalFilename}`;
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}${path}`;
    
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': 'image/png'
      }
    });
    
    return `${BUNNY_CDN_URL}${path}`;
  } catch (error: any) {
    console.error('Bunny upload error:', error);
    throw new Error(`Failed to upload image to Bunny: ${error.message}`);
  }
}

export async function uploadFile(
  fileBuffer: Buffer,
  teamId: string,
  filename: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  try {
    const timestamp = Date.now();
    const path = `/submissions/${teamId}/${timestamp}-${filename}`;
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}${path}`;
    
    await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': contentType
      }
    });
    
    return `${BUNNY_CDN_URL}${path}`;
  } catch (error: any) {
    console.error('Bunny upload error:', error);
    throw new Error(`Failed to upload file to Bunny: ${error.message}`);
  }
}

