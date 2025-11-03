import axios from 'axios';
import { Readable } from 'stream';

const BUNNY_STORAGE_API_KEY = 'd1fa7632-b9d4-423e-821aa8b786c7-8076-43fb';
const BUNNY_STORAGE_ZONE = 'bcc-prompt-contest';
const BUNNY_STORAGE_HOSTNAME = 'sg.storage.bunnycdn.com';
const BUNNY_CDN_URL = 'https://bcc-prompt-contest.b-cdn.net';

export async function uploadImage(
  imageBuffer: Buffer, 
  teamId: string, 
  filename?: string
): Promise<string> {
  try {
    const timestamp = Date.now();
    const finalFilename = filename || `${timestamp}.png`;
    const path = `/images/${teamId}/${finalFilename}`;
    const uploadUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}${path}`;
    
    console.log('Uploading to Bunny Storage:', uploadUrl);
    
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': 'image/png'
      }
    });
    
    const cdnUrl = `${BUNNY_CDN_URL}${path}`;
    console.log('Image uploaded successfully. CDN URL:', cdnUrl);
    
    return cdnUrl;
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
    const uploadUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}${path}`;
    
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

