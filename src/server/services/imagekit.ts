import ImageKit from "imagekit";

// Validate environment variables
if (!process.env.IMAGEKIT_PUBLIC_KEY) {
  throw new Error("IMAGEKIT_PUBLIC_KEY is not defined in environment variables");
}
if (!process.env.IMAGEKIT_PRIVATE_KEY) {
  throw new Error("IMAGEKIT_PRIVATE_KEY is not defined in environment variables");
}
if (!process.env.IMAGEKIT_URL_ENDPOINT) {
  throw new Error("IMAGEKIT_URL_ENDPOINT is not defined in environment variables");
}

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ImageKit service functions
export const imagekitService = {
  // Get authentication parameters for client-side uploads
  getAuthenticationParameters: () => {
    try {
      const token = imagekit.getAuthenticationParameters();
      return token;
    } catch (error) {
      console.error('ImageKit auth parameters error:', error);
      throw new Error('Failed to get ImageKit authentication parameters');
    }
  },

  // Upload file to ImageKit
  upload: async (file: Buffer | string, fileName: string, folder?: string) => {
    try {
      const uploadResponse = await imagekit.upload({
        file,
        fileName,
        folder: folder || 'videos',
      });
      return uploadResponse;
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw new Error('Failed to upload file to ImageKit');
    }
  },

  // Delete file from ImageKit
  deleteFile: async (fileId: string) => {
    try {
      await imagekit.deleteFile(fileId);
      return { success: true };
    } catch (error) {
      console.error('ImageKit delete error:', error);
      throw new Error('Failed to delete file from ImageKit');
    }
  },

  // Get file details
  getFileDetails: async (fileId: string) => {
    try {
      const fileDetails = await imagekit.getFileDetails(fileId);
      return fileDetails;
    } catch (error) {
      console.error('ImageKit get file details error:', error);
      throw new Error('Failed to get file details from ImageKit');
    }
  },

  // Generate URL for transformations (simplified)
  generateUrl: (path: string, transformations?: Array<Record<string, string | number>>) => {
    try {
      return imagekit.url({
        path,
        transformation: transformations,
      });
    } catch (error) {
      console.error('ImageKit URL generation error:', error);
      return path; // Fallback to original path
    }
  },
};

export default imagekit;
export { imagekit };
