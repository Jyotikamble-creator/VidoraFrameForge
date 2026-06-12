
"use client"

import { useState } from "react"
import axios from "axios"
import { logger, LogTags, categorizeError } from "@/lib/logger"
import { uploadToImageKit } from "@/lib/utils/imagekitUpload"

interface UploadMetadata {
  title: string
  description: string
  category?: string
  tags?: string
  isPublic?: boolean
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File, metadata: UploadMetadata) => {
    setUploading(true)
    setError(null)
    setProgress(0)

    logger.video.uploadStart('anonymous', file.name);

    try {
      // Upload to ImageKit
      logger.debug(LogTags.IMAGEKIT_UPLOAD, 'Starting ImageKit upload', { fileName: file.name, fileSize: file.size });

      const uploadResult = await uploadToImageKit(file) as any;

      logger.info(LogTags.IMAGEKIT_UPLOAD, 'ImageKit upload successful', {
        fileId: uploadResult.fileId,
        url: uploadResult.url
      });

      // Save video metadata to database
      logger.debug(LogTags.VIDEO_UPLOAD, 'Saving video metadata to database', { title: metadata.title });
      await axios.post("/api/auth/videos", {
        title: metadata.title,
        description: metadata.description,
        videoUrl: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl || uploadResult.url,
        category: metadata.category || undefined,
        tags: metadata.tags ? metadata.tags.split(",").map(tag => tag.trim()) : [],
        isPublic: metadata.isPublic !== false,
      }, { withCredentials: true })

      setProgress(100)
      logger.video.uploadSuccess('anonymous', 'pending');
      return uploadResult.url
    } catch (err: unknown) {
      const categorizedError = categorizeError(err);
      logger.error(LogTags.VIDEO_UPLOAD, `Upload failed: ${categorizedError.message}`, categorizedError);

      let errorMessage = "Upload failed"
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error
      }
      setError(errorMessage)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const uploadVideo = handleUpload

  return {
    handleUpload,
    uploadVideo,
    uploading,
    progress,
    error,
  }
}
