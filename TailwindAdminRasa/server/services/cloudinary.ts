import { v2 as cloudinary } from 'cloudinary';
import type { CloudinaryImage, CloudinaryVideo } from '@shared/schema';

// Configure Cloudinary
console.log('Cloudinary Config - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('Cloudinary Config - API Key:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
console.log('Cloudinary Config - API Secret:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  tags?: string[];
  alt?: string;
  resource_type?: 'auto' | 'image' | 'video';
}

export interface CloudinaryUploadResult {
  public_id: string;
  asset_id?: string;
  secure_url: string;
  resource_type: 'image' | 'video';
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  folder?: string;
  version: number;
  created_at: string;
  tags?: string[];
}

/**
 * Upload file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  mimetype: string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    // Convert buffer to base64
    const fileBase64 = fileBuffer.toString('base64');
    const fileUri = `data:${mimetype};base64,${fileBase64}`;

    // Determine resource type from mimetype
    let resourceType: 'image' | 'video' | 'auto' = options.resource_type || 'auto';
    if (mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: options.folder || 'products',
      public_id: options.public_id,
      tags: options.tags,
      resource_type: resourceType,
      quality: 'auto',
      fetch_format: 'auto',
    });

    return {
      public_id: result.public_id,
      asset_id: result.asset_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type as 'image' | 'video',
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration,
      folder: result.folder,
      version: result.version,
      created_at: result.created_at,
      tags: result.tags,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert Cloudinary upload result to typed schema format
 */
export function convertToCloudinaryMedia(result: CloudinaryUploadResult, alt?: string): CloudinaryImage | CloudinaryVideo {
  const base = {
    public_id: result.public_id,
    asset_id: result.asset_id,
    secure_url: result.secure_url,
    resource_type: result.resource_type,
    format: result.format,
    bytes: result.bytes,
    folder: result.folder,
    version: result.version,
    created_at: result.created_at,
    tags: result.tags,
    alt,
  };

  if (result.resource_type === 'image') {
    return {
      ...base,
      resource_type: 'image',
      width: result.width || 0,
      height: result.height || 0,
    } as CloudinaryImage;
  } else {
    return {
      ...base,
      resource_type: 'video',
      duration: result.duration || 0,
      width: result.width,
      height: result.height,
      thumbnail_url: result.secure_url.replace(/\.[^/.]+$/, '.jpg'), // Generate thumbnail URL
    } as CloudinaryVideo;
  }
}

/**
 * Generate optimized URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  return cloudinary.url(publicId, {
    width: options.width,
    height: options.height,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto',
    fetch_format: options.format || 'auto',
  });
}

export { cloudinary };