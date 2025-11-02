import axios from 'axios';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY || '';
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || '';
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || '';
const USE_LOCAL_STORAGE = !BUNNY_STORAGE_API_KEY || !BUNNY_STORAGE_ZONE;

// Ensure public directories exist
const publicDir = path.join(process.cwd(), 'public');
const uploadsDir = path.join(publicDir, 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const submissionsDir = path.join(uploadsDir, 'submissions');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(submissionsDir)) fs.mkdirSync(submissionsDir, { recursive: true });

async function uploadToLocal(
  buffer: Buffer,
  relativePath: string
): Promise<string> {
  const fullPath = path.join(publicDir, 'uploads', relativePath);
  const dir = path.dirname(fullPath);
  
  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(fullPath, buffer);
  
  // Return URL (served by API server)
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  return `${baseUrl}/uploads/${relativePath}`;
}

export async function uploadImage(
  imageBuffer: Buffer, 
  teamId: string, 
  filename?: string
): Promise<string> {
  const timestamp = Date.now();
  const finalFilename = filename || `${timestamp}.png`;
  const relativePath = `images/${teamId}/${finalFilename}`;
  
  // Use local storage if Bunny credentials are not configured
  if (USE_LOCAL_STORAGE) {
    console.log('Using local storage for image upload');
    return uploadToLocal(imageBuffer, relativePath);
  }
  
  // Try Bunny Storage first
  try {
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${relativePath}`;
    
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': 'image/png'
      }
    });
    
    return `${BUNNY_CDN_URL}/${relativePath}`;
  } catch (error: any) {
    console.error('Bunny upload error, falling back to local storage:', error);
    // Fallback to local storage
    return uploadToLocal(imageBuffer, relativePath);
  }
}

export async function uploadFile(
  fileBuffer: Buffer,
  teamId: string,
  filename: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const timestamp = Date.now();
  const relativePath = `submissions/${teamId}/${timestamp}-${filename}`;
  
  // Use local storage if Bunny credentials are not configured
  if (USE_LOCAL_STORAGE) {
    console.log('Using local storage for file upload');
    return uploadToLocal(fileBuffer, relativePath);
  }
  
  // Try Bunny Storage first
  try {
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${relativePath}`;
    
    await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': contentType
      }
    });
    
    return `${BUNNY_CDN_URL}/${relativePath}`;
  } catch (error: any) {
    console.error('Bunny upload error, falling back to local storage:', error);
    // Fallback to local storage
    return uploadToLocal(fileBuffer, relativePath);
  }
}

