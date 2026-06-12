import axios from "axios"
import { Logger, LogTags } from "@/lib/logger"

export interface VideoPayload {
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  controls?: boolean
  transformation?: {
    width?: number
    height?: number
    quality?: number
  }
}

export const videoService = {
  async uploadVideo(payload: VideoPayload) {
    Logger.d(LogTags.VIDEO_UPLOAD, 'Video upload service called', { title: payload.title });
    const response = await axios.post("/api/auth/videos", payload)
    Logger.i(LogTags.VIDEO_UPLOAD, 'Video upload API call successful');
    return response.data
  },

  async getVideos() {
    Logger.d(LogTags.VIDEO_FETCH, 'Get videos service called');
    const response = await axios.get("/api/auth/videos")
    Logger.i(LogTags.VIDEO_FETCH, `Videos fetched: ${response.data?.length || 0} videos`);
    return response.data
  },

  async getVideoById(id: string) {
    Logger.d(LogTags.VIDEO_FETCH, 'Get video by ID service called', { videoId: id });
    const response = await axios.get(`/api/auth/video?id=${id}`)
    Logger.i(LogTags.VIDEO_FETCH, 'Video by ID fetched successfully', { videoId: id });
    return response.data
  },

  async getUserVideos(userId: string) {
    Logger.d(LogTags.VIDEO_FETCH, 'Get user videos service called', { userId });
    const response = await axios.get(`/api/auth/videos?userId=${userId}`)
    Logger.i(LogTags.VIDEO_FETCH, `User videos fetched: ${response.data?.length || 0} videos`, { userId });
    return response.data
  },
}

export const { uploadVideo, getVideos, getVideoById, getUserVideos } = videoService
export const fetchAllVideos = getVideos
export const fetchVideoById = getVideoById
export const fetchUserVideos = (userId: string) => getUserVideos(userId)