import { prisma } from "@/server/db"
import { Like, Prisma, ContentType } from "@prisma/client"
import { Logger, LogTags } from "@/lib/logger"

export interface LikeFilters {
  userId?: string
  contentType?: ContentType
  contentId?: string
}

export class LikeRepository {
  /**
   * Find like by ID
   */
  async findById(likeId: string) {
    try {
      return await prisma.like.findUnique({
        where: { id: likeId }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding like by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find like by user and content
   */
  async findOne(userId: string, contentType: ContentType, contentId: string) {
    try {
      return await prisma.like.findUnique({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType,
            contentId
          }
        }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding like: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if user has liked content
   */
  async hasLiked(userId: string, contentType: ContentType, contentId: string): Promise<boolean> {
    try {
      const like = await this.findOne(userId, contentType, contentId)
      return !!like
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking if user has liked: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find all likes for content
   */
  async findByContent(contentType: ContentType, contentId: string, limit = 100) {
    try {
      return await prisma.like.findMany({
        where: { contentType, contentId },
        include: {
          user: {
            select: {
              username: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding likes by content: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find all likes by user
   */
  async findByUser(
    userId: string,
    contentType?: "video" | "photo" | "journal",
    limit = 100,
    skip = 0
  ) {
    try {
      const where: Prisma.LikeWhereInput = { userId }

      if (contentType) {
        where.contentType = contentType
      }

      return await prisma.like.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding likes by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create a like
   */
  async create(likeData: {
    userId: string
    contentType: ContentType
    contentId: string
  }) {
    try {
      // Check if already liked
      const existing = await this.findOne(likeData.userId, likeData.contentType, likeData.contentId)

      if (existing) {
        Logger.w(LogTags.AUTH, "User already liked this content")
        return null
      }

      const like = await prisma.like.create({
        data: likeData
      })
      Logger.i(LogTags.AUTH, `Like created: ${like.id}`, {
        userId: likeData.userId,
        contentType: likeData.contentType
      })
      return like
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error creating like: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete a like
   */
  async delete(userId: string, contentType: ContentType, contentId: string) {
    try {
      const result = await prisma.like.delete({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType,
            contentId
          }
        }
      })

      if (result) {
        Logger.i(LogTags.AUTH, `Like deleted: ${result.id}`)
      }

      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting like: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete like by ID
   */
  async deleteById(likeId: string) {
    try {
      const result = await prisma.like.delete({
        where: { id: likeId }
      })
      Logger.i(LogTags.AUTH, `Like deleted: ${likeId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting like by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count likes for content
   */
  async countByContent(contentType: ContentType, contentId: string): Promise<number> {
    try {
      return await prisma.like.count({ where: { contentType, contentId } })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting likes by content: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count likes by user
   */
  async countByUser(userId: string, contentType?: "video" | "photo" | "journal"): Promise<number> {
    try {
      const where: Prisma.LikeWhereInput = { userId }

      if (contentType) {
        where.contentType = contentType
      }

      return await prisma.like.count({ where })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting likes by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get like statistics for user
   */
  async getUserStats(userId: string) {
    try {
      const stats = await prisma.like.groupBy({
        by: ['contentType'],
        where: { userId },
        _count: true
      })

      const result = {
        total: 0,
        videos: 0,
        photos: 0,
        journals: 0
      }

      stats.forEach((stat) => {
        result.total += stat._count
        if (stat.contentType === "video") result.videos = stat._count
        if (stat.contentType === "photo") result.photos = stat._count
        if (stat.contentType === "journal") result.journals = stat._count
      })

      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user like stats: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get most liked content by user
   */
  async getMostLikedByUser(
    userId: string,
    contentType?: "video" | "photo" | "journal",
    limit = 10
  ) {
    try {
      const where: Prisma.LikeWhereInput = { userId }

      if (contentType) {
        where.contentType = contentType
      }

      return await prisma.like.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting most liked by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete all likes for content (when content is deleted)
   */
  async deleteByContent(contentType: ContentType, contentId: string) {
    try {
      const result = await prisma.like.deleteMany({ where: { contentType, contentId } })
      Logger.i(LogTags.AUTH, `${result.count} likes deleted for ${contentType} ${contentId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting likes by content: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete all likes by user (when user is deleted)
   */
  async deleteByUser(userId: string) {
    try {
      const result = await prisma.like.deleteMany({ where: { userId } })
      Logger.i(LogTags.AUTH, `${result.count} likes deleted for user ${userId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting likes by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get users who liked content
   */
  async getUsersWhoLiked(contentType: ContentType, contentId: string, limit = 50) {
    try {
      const likes = await prisma.like.findMany({
        where: { contentType, contentId },
        include: {
          user: {
            select: {
              username: true,
              email: true,
              avatar: true,
              stats: {
                select: { followerCount: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return likes.map((like) => like.user).filter((user) => user)
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting users who liked: ${String(error)}`)
      throw error
    }
  }

  /**
   * Bulk check if user liked multiple content items
   */
  async hasLikedMultiple(
    userId: string,
    contentType: ContentType,
    contentIds: string[]
  ): Promise<{ [contentId: string]: boolean }> {
    try {
      const likes = await prisma.like.findMany({
        where: {
          userId,
          contentType,
          contentId: { in: contentIds }
        },
        select: { contentId: true }
      })

      const result: { [contentId: string]: boolean } = {}
      contentIds.forEach((id) => {
        result[id] = false
      })

      likes.forEach((like) => {
        result[like.contentId] = true
      })

      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking multiple likes: ${String(error)}`)
      throw error
    }
  }
}

// Export singleton instance
export const likeRepository = new LikeRepository()
