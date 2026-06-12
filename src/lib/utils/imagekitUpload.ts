import axios from "axios";

export async function uploadToImageKit(file: File) {
  console.log("File:", file, "size:", file.size, "type:", file.type);

  // Handle video files differently - no thumbnail generation needed for mock
  console.log("Checking file type:", file.type, "starts with video:", file.type.startsWith('video/'));
  if (file.type.startsWith('video/')) {
    const mockResponse = {
      fileId: `mock-video-${Date.now()}`,
      name: file.name,
      url: `mock-video-url-${Date.now()}`, // Mock video URL
      thumbnailUrl: `mock-thumbnail-${Date.now()}`, // Mock thumbnail URL
      width: 1920, // Mock dimensions
      height: 1080,
      size: file.size,
      fileType: 'video'
    };
    console.log("Mock video upload successful", mockResponse);
    return Promise.resolve(mockResponse);
  }

  // TEMPORARY: Create thumbnail data URL for testing (images only)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Create thumbnail canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxSize = 300;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const thumbnailDataURL = canvas.toDataURL('image/jpeg', 0.8);

        const mockResponse = {
          fileId: `mock-${Date.now()}`,
          name: file.name,
          url: thumbnailDataURL, // Use thumbnail as main image for display
          thumbnail: thumbnailDataURL,
          width: Math.round(width),
          height: Math.round(height),
          size: file.size,
          fileType: 'image'
        };
        console.log("Mock upload successful with thumbnail data URL");
        resolve(mockResponse);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  /*
  // ACTUAL UPLOAD CODE (commented out for testing)
  // 1) get auth
  const { data: auth } = await axios.get("/api/auth/imagekit-auth");

  // 2) prepare form
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);
  formData.append("token", auth.authenticationParameters.token);
  formData.append("signature", auth.authenticationParameters.signature);
  formData.append("expire", auth.authenticationParameters.expire.toString());
  formData.append("publicKey", auth.publicKey);

  // 3) upload
  const res = await axios.post(
    "https://upload.imagekit.io/api/v1/files/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
  */
}