"use client"

import { useState } from "react"
import axios from "axios"

interface UploadMetadata {
  title: string
  description: string
  category: string
  tags: string[]
  isPublic: boolean
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadVideo = async (file: File, metadata: UploadMetadata) => {
    setUploading(true)
    setProgress(0)

    try {
      // Get ImageKit auth parameters
      const { data: authData } = await axios.get("/api/auth/imagekit-auth")

      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      // Upload to ImageKit
      const formData = new FormData()
      formData.append("file", base64)
      formData.append("fileName", file.name)
      formData.append("publicKey", authData.publicKey)
      formData.append("signature", authData.authenticationParameters.signature)
      formData.append("expire", authData.authenticationParameters.expire)
      formData.append("token", authData.authenticationParameters.token)
      formData.append("folder", "/videos")

      const uploadResponse = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setProgress(percent)
        },
      })

      // Save video metadata to database
      await axios.post("/api/auth/videos", {
        ...metadata,
        videoUrl: uploadResponse.data.url,
        thumbnailUrl: uploadResponse.data.thumbnailUrl || uploadResponse.data.url,
        fileId: uploadResponse.data.fileId,
        size: file.size,
      })

      setProgress(100)
    } catch (error) {
      console.error("Upload failed:", error)
      throw error
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return {
    uploadVideo,
    uploading,
    progress,
  }
}