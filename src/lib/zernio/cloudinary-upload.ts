import { v2 as cloudinary } from 'cloudinary';

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadUrlToCloudinary(
  url: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> {
  configure();
  const result = await cloudinary.uploader.upload(url, {
    folder: `zernio-ai/${resourceType}s`,
    resource_type: resourceType,
  });
  return result.secure_url;
}

export async function uploadMediaUrls(urls: string[], type: 'image' | 'video'): Promise<string[]> {
  return Promise.all(urls.map((url) => uploadUrlToCloudinary(url, type)));
}
