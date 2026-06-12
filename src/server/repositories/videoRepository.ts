import { prisma } from "@/server/db"
import { Video, Prisma } from "@prisma/client"
import { Logger, LogTags } from "@/lib/logger"

export interface VideoFilters {
  userId?: string
  category?: string
  privacy?: "public" | "private" | "friends"
  tags?: string | string[]
  search?: string
  startDate?: Date
  endDate?: Date
}

export const VIDEO_POPULATE_OPTIONS = {
  user: {
    select: {
      username: true,
      email: true,
      avatar: true,
      stats: {
        select: {
          followerCount: true
        }
      }
    }
  }
}

export class VideoRepository {
  /**
   * Find video by ID
   */
  async findById(videoId: string, populate = true) {
    try {
      return await prisma.video.findUnique({
        where: { id: videoId },
        include: populate ? VIDEO_POPULATE_OPTIONS : undefined
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding video by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find videos by user ID
   */
  async findByUser(userId: string, limit = 50, skip = 0) {
    try {
      return await prisma.video.findMany({
        where: { userId },
        include: VIDEO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding videos by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find all videos with filters
   */
  async findAll(filters: VideoFilters = {}, limit = 50, skip = 0) {
    try {
      const where: Prisma.VideoWhereInput = {}

      if (filters.userId) {
        where.userId = filters.userId
      }

      if (filters.category) {
        where.category = filters.category
      }

      if (filters.privacy) {
        where.privacy = filters.privacy
      } else {
        where.privacy = "public"
      }

      if (filters.tags) {
        if (Array.isArray(filters.tags)) {
          where.tags = { hasSome: filters.tags }
        } else {
          where.tags = { has: filters.tags }
        }
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate
        }
      }

      return await prisma.video.findMany({
        where,
        include: VIDEO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding all videos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Search videos with text search
   */
  async search(searchTerm: string, limit = 50) {
    try {
      return await prisma.video.findMany({
        where: {
          privacy: "public",
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { hasSome: [searchTerm] } }
          ]
        },
        include: VIDEO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error searching videos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create a new video
   */
  async create(videoData: {
    userId: string
    title: string
    description?: string
    url: string
    thumbnail?: string
    duration?: number
    category?: string
    tags?: string[]
    privacy?: "public" | "private" | "friends"
    transformationUrl?: string
    width?: number
    height?: number
  }) {
    try {
      const video = await prisma.video.create({
        data: videoData,
        include: VIDEO_POPULATE_OPTIONS
      })
      Logger.i(LogTags.VIDEO_UPLOAD, `Video created: ${video.id}`, {
        title: video.title,
        userId: video.userId
      })
      return video
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error creating video: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update video by ID
   */
  async update(
    videoId: string,
    updateData: Partial<{
      title: string
      description: string
      category: string
      tags: string[]
      privacy: "public" | "private" | "friends"
      thumbnail: string
    }>
  ) {
    try {
      const video = await prisma.video.update({
        where: { id: videoId },
        data: updateData,
        include: VIDEO_POPULATE_OPTIONS
      })
      Logger.i(LogTags.VIDEO_UPDATE, `Video updated: ${videoId}`)
      return video
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error updating video: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete video by ID
   */
  async delete(videoId: string) {
    try {
      const result = await prisma.video.delete({
        where: { id: videoId }
      })
      Logger.i(LogTags.VIDEO_DELETE, `Video deleted: ${videoId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting video: ${String(error)}`)
      throw error
    }
  }

  /**
   * Increment video views
   */
  async incrementViews(videoId: string) {
    try {
      return await prisma.video.update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error incrementing views: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get videos by category
   */
  async findByCategory(category: string, limit = 50) {
    try {
      return await prisma.video.findMany({
        where: { category, privacy: "public" },
        include: VIDEO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding videos by category: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get videos by tags
   */
  async findByTags(tags: string[], limit = 50) {
    try {
      return await prisma.video.findMany({
        where: {
          privacy: "public",
          tags: { hasSome: tags }
        },
        include: VIDEO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding videos by tags: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get trending videos (most views recently)
   */
  async findTrending(limit = 20) {
    try {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      return await prisma.video.findMany({
        where: {
          privacy: "public",
          createdAt: { gte: oneWeekAgo }
        },
        include: VIDEO_POPULATE_OPTIONS,
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding trending videos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get recommended videos (similar tags or category)
   */
  async findRecommended(videoId: string, limit = 10) {
    try {
      const currentVideo = await prisma.video.findUnique({
        where: { id: videoId }
      })

      if (!currentVideo) return []

      return await prisma.video.findMany({
        where: {
          NOT: { id: videoId },
          privacy: "public",
          OR: [
            { tags: { hasSome: currentVideo.tags } },
            { category: currentVideo.category }
          ]
        },
        include: VIDEO_POPULATE_OPTIONS,
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding recommended videos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count videos with filters
   */
  async count(filters: VideoFilters = {}): Promise<number> {
    try {
      const where: Prisma.VideoWhereInput = {}

      if (filters.userId) {
        where.userId = filters.userId
      }

      if (filters.category) {
        where.category = filters.category
      }

      if (filters.privacy) {
        where.privacy = filters.privacy
      }

      if (filters.tags) {
        where.tags = Array.isArray(filters.tags)
          ? { hasSome: filters.tags }
          : { has: filters.tags }
      }

      return await prisma.video.count({ where })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting videos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if video exists and user is owner
   */
  async isOwner(videoId: string, userId: string): Promise<boolean> {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { userId: true }
      })
      return video?.userId === userId
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking video ownership: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const categories = await prisma.video.findMany({
        where: { privacy: "public" },
        select: { category: true },
        distinct: ['category']
      })
      return categories
        .map(c => c.category)
        .filter((c) => c) as string[]
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting categories: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get unique tags from user's videos
   */
  async getUserTags(userId: string): Promise<string[]> {
    try {
      const videos = await prisma.video.findMany({
        where: { userId },
        select: { tags: true }
      })

      const allTags = videos.flatMap((v) => v.tags || [])
      return [...new Set(allTags)].sort()
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user tags: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get video statistics for user
   */
  async getUserStats(userId: string) {
    try {
      const videos = await prisma.video.findMany({
        where: { userId },
        select: { viewCount: true }
      })

      const totalVideos = videos.length
      const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0)
      const averageViews = totalVideos > 0 ? totalViews / totalVideos : 0

      return {
        totalVideos,
        totalViews,
        totalLikes: 0, // Would need separate likes count query
        averageViews
      }
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user stats: ${String(error)}`)
      throw error
    }
  }
}

// Export singleton instance
export const videoRepository = new VideoRepository()
