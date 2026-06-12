import { videoRepository } from "@/server/repositories/videoRepository"
import { userRepository } from "@/server/repositories/userRepository"
import { Logger, LogTags } from "@/lib/logger"
import { prisma } from "@/server/db"

interface VideoFilters {
  category?: string | null
  search?: string | null
  userId?: string | null
  limit?: number
}

interface CreateVideoData {
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl: string
  category?: string
  tags?: string[]
  isPublic?: boolean
  privacy?: "public" | "private" | "friends"
  fileId?: string
  fileName?: string
  size?: number
  duration?: number
  transformation?: any
  album?: string
  location?: string
}

interface DeleteResult {
  success: boolean
  message: string
  notFound?: boolean
}

/**
 * Video Service
 * Contains all business logic for video operations
 * Handles database interactions and data processing
 */
export class VideoService {
  /**
   * Get videos with optional filters
   */
  async getVideos(filters: VideoFilters) {
    try {
      Logger.d(LogTags.DB_CONNECT, 'Fetching videos with filters')

      const searchFilter = filters.search || undefined
      const limit = filters.limit || 20

      if (filters.userId) {
        // Get videos for specific user
        return await videoRepository.findByUser(filters.userId)
      }

      if (filters.category) {
        // Get videos by category with search
        return await videoRepository.search(searchFilter || filters.category, limit)
      }

      if (searchFilter) {
        // Search across all public videos
        return await videoRepository.search(searchFilter, limit)
      }

      // Get all recent videos
      return await videoRepository.findAll()
    } catch (error) {
      Logger.e(LogTags.VIDEO_FETCH, `Error fetching videos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(
    videoId: string, 
    options: { incrementViews?: boolean } = {}
  ) {
    try {
      Logger.d(LogTags.VIDEO_FETCH, 'Fetching video by ID', { videoId, incrementViews: options.incrementViews })

      if (options.incrementViews) {
        // Increment views
        await videoRepository.incrementViews(videoId)
      }

      const video = await videoRepository.findById(videoId)
      return video
    } catch (error) {
      Logger.e(LogTags.VIDEO_FETCH, `Error fetching video: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get user's videos
   */
  async getUserVideos(userId: string, limit: number = 20) {
    try {
      Logger.d(LogTags.VIDEO_FETCH, 'Fetching videos for user', { userId, limit })
      return await videoRepository.findByUser(userId)
    } catch (error) {
      Logger.e(LogTags.VIDEO_FETCH, `Error fetching user videos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create new video
   */
  async createVideo(userId: string, videoData: CreateVideoData) {
    try {
      Logger.d(LogTags.DB_CONNECT, 'Creating video for user', { userId })

      // Create video via repository
      const video = await videoRepository.create({
        userId,
        title: videoData.title,
        description: videoData.description,
        url: videoData.videoUrl,
        thumbnail: videoData.thumbnailUrl,
        duration: videoData.duration,
        category: videoData.category,
        tags: videoData.tags,
        privacy: (videoData.privacy || 'private') as "public" | "private" | "friends"
      })

      Logger.d(LogTags.VIDEO_UPLOAD, 'Video document created', { videoId: video.id })

      // Update user stats
      await prisma.userStats.update({
        where: { userId },
        data: { totalVideos: { increment: 1 } }
      })

      Logger.i(LogTags.VIDEO_UPLOAD, 'Video created successfully', { 
        videoId: video.id, 
        title: videoData.title,
        userId 
      })

      return video
    } catch (error) {
      Logger.e(LogTags.VIDEO_UPLOAD, `Error creating video: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete video (with ownership check)
   */
  async deleteVideo(videoId: string, userId: string): Promise<DeleteResult> {
    try {
      Logger.d(LogTags.VIDEO_DELETE, 'Attempting to delete video', { videoId, userId })

      // Find video
      const video = await videoRepository.findById(videoId)

      if (!video) {
        Logger.w(LogTags.VIDEO_DELETE, 'Video not found', { videoId })
        return {
          success: false,
          message: "Video not found",
          notFound: true
        }
      }

      // Check ownership
      if (video.userId !== userId) {
        Logger.w(LogTags.VIDEO_DELETE, 'Unauthorized delete attempt', { videoId, userId, ownerId: video.userId })
        return {
          success: false,
          message: "Unauthorized to delete this video"
        }
      }

      // Delete video
      await videoRepository.delete(videoId)
      Logger.d(LogTags.VIDEO_DELETE, 'Video deleted from database', { videoId })

      // Update user stats
      await prisma.userStats.update({
        where: { userId },
        data: { totalVideos: { increment: -1 } }
      })

      Logger.i(LogTags.VIDEO_DELETE, 'Video deleted successfully', { videoId, userId })

      return {
        success: true,
        message: "Video deleted successfully"
      }
    } catch (error) {
      Logger.e(LogTags.VIDEO_DELETE, `Error deleting video: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update video (future implementation)
   */
  async updateVideo(videoId: string, userId: string, updates: Partial<CreateVideoData>) {
    try {
      Logger.d(LogTags.VIDEO_UPDATE, 'Attempting to update video', { videoId, userId })

      // Find and check ownership
      const video = await videoRepository.findById(videoId)

      if (!video || video.userId !== userId) {
        Logger.w(LogTags.VIDEO_UPDATE, 'Video not found or unauthorized', { videoId, userId })
        return null
      }

      // Update video
      const updatedVideo = await videoRepository.update(videoId, {
        ...updates,
        privacy: updates.privacy as "public" | "private" | "friends" | undefined
      } as any)

      Logger.i(LogTags.VIDEO_UPDATE, 'Video updated successfully', { videoId, userId })

      return updatedVideo
    } catch (error) {
      Logger.e(LogTags.VIDEO_UPDATE, `Error updating video: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get videos by category
   */
  async getVideosByCategory(category: string, limit: number = 20) {
    try {
      Logger.d(LogTags.VIDEO_FETCH, 'Fetching videos by category', { category, limit })
      return await videoRepository.search(category, limit)
    } catch (error) {
      Logger.e(LogTags.VIDEO_FETCH, `Error fetching videos by category: ${String(error)}`)
      throw error
    }
  }

  /**
   * Search videos
   */
  async searchVideos(searchTerm: string, limit: number = 20) {
    try {
      Logger.d(LogTags.VIDEO_FETCH, 'Searching videos', { searchTerm, limit })
      return await videoRepository.search(searchTerm, limit)
    } catch (error) {
      Logger.e(LogTags.VIDEO_FETCH, `Error searching videos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get trending videos (by views)
   */
  async getTrendingVideos(limit: number = 10) {
    try {
      Logger.d(LogTags.VIDEO_FETCH, 'Fetching trending videos', { limit })
      return await videoRepository.findAll()
    } catch (error) {
      Logger.e(LogTags.VIDEO_FETCH, `Error fetching trending videos: ${String(error)}`)
      throw error
    }
  }
}
