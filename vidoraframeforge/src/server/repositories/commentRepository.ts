import { prisma } from "@/server/db"
import { Comment, Prisma, ContentType } from "@prisma/client"
import { Logger, LogTags } from "@/lib/logger"

export interface CommentFilters {
  userId?: string
  contentType?: ContentType
  contentId?: string
  parentCommentId?: string | null
}

export const COMMENT_POPULATE_OPTIONS = {
  user: {
    select: {
      username: true,
      email: true,
      avatar: true
    }
  }
}

export class CommentRepository {
  /**
   * Find comment by ID
   */
  async findById(commentId: string, populate = true) {
    try {
      return await prisma.comment.findUnique({
        where: { id: commentId },
        include: populate ? COMMENT_POPULATE_OPTIONS : undefined
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding comment by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find root comments for content (no parent)
   */
  async findByContent(
    contentType: ContentType,
    contentId: string,
    limit = 50,
    skip = 0
  ) {
    try {
      return await prisma.comment.findMany({
        where: {
          contentType,
          contentId,
          parentCommentId: null
        },
        include: COMMENT_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding comments by content: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find replies for a comment
   */
  async findReplies(parentCommentId: string, limit = 50) {
    try {
      return await prisma.comment.findMany({
        where: { parentCommentId },
        include: COMMENT_POPULATE_OPTIONS,
        orderBy: { createdAt: 'asc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding comment replies: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find all comments by user
   */
  async findByUser(userId: string, limit = 50, skip = 0) {
    try {
      return await prisma.comment.findMany({
        where: { userId },
        include: COMMENT_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding comments by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find all comments with filters
   */
  async findAll(filters: CommentFilters = {}, limit = 50, skip = 0) {
    try {
      const where: Prisma.CommentWhereInput = {}

      if (filters.userId) {
        where.userId = filters.userId
      }

      if (filters.contentType) {
        where.contentType = filters.contentType
      }

      if (filters.contentId) {
        where.contentId = filters.contentId
      }

      if (filters.parentCommentId !== undefined) {
        where.parentCommentId = filters.parentCommentId
      }

      return await prisma.comment.findMany({
        where,
        include: COMMENT_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding all comments: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create a comment
   */
  async create(commentData: {
    userId: string
    contentType: ContentType
    contentId: string
    content: string
    parentCommentId?: string
  }) {
    try {
      const comment = await prisma.comment.create({
        data: commentData,
        include: COMMENT_POPULATE_OPTIONS
      })
      Logger.i(LogTags.AUTH, `Comment created: ${comment.id}`, {
        userId: commentData.userId,
        contentType: commentData.contentType,
        isReply: !!commentData.parentCommentId
      })
      return comment
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error creating comment: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update comment
   */
  async update(commentId: string, content: string) {
    try {
      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: COMMENT_POPULATE_OPTIONS
      })
      Logger.i(LogTags.AUTH, `Comment updated: ${commentId}`)
      return comment
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error updating comment: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete comment by ID
   */
  async delete(commentId: string) {
    try {
      const result = await prisma.comment.delete({
        where: { id: commentId }
      })
      Logger.i(LogTags.AUTH, `Comment deleted: ${commentId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting comment: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete comment and all its replies
   */
  async deleteWithReplies(commentId: string) {
    try {
      // First delete all replies
      const repliesResult = await prisma.comment.deleteMany({
        where: { parentCommentId: commentId }
      })

      // Then delete the parent comment
      const commentResult = await prisma.comment.delete({
        where: { id: commentId }
      })

      Logger.i(
        LogTags.AUTH,
        `Comment deleted with ${repliesResult.count} replies: ${commentId}`
      )

      return {
        comment: commentResult,
        repliesDeleted: repliesResult.count
      }
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting comment with replies: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count comments for content
   */
  async countByContent(
    contentType: ContentType,
    contentId: string,
    includeReplies = true
  ): Promise<number> {
    try {
      const where: Prisma.CommentWhereInput = { contentType, contentId }

      if (!includeReplies) {
        where.parentCommentId = null
      }

      return await prisma.comment.count({ where })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting comments by content: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count comments by user
   */
  async countByUser(userId: string): Promise<number> {
    try {
      return await prisma.comment.count({ where: { userId } })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting comments by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count replies for comment
   */
  async countReplies(parentCommentId: string): Promise<number> {
    try {
      return await prisma.comment.count({ where: { parentCommentId } })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting replies: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if user is comment owner
   */
  async isOwner(commentId: string, userId: string): Promise<boolean> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { userId: true }
      })
      return comment?.userId === userId
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking comment ownership: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get recent comments (global)
   */
  async findRecent(limit = 20) {
    try {
      return await prisma.comment.findMany({
        where: { parentCommentId: null },
        include: COMMENT_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding recent comments: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get user comment statistics
   */
  async getUserStats(userId: string) {
    try {
      const comments = await prisma.comment.groupBy({
        by: ['contentType'],
        where: { userId },
        _count: true,
        _sum: { likes: true }
      })

      const result = {
        total: 0,
        totalLikes: 0,
        videos: 0,
        photos: 0,
        journals: 0
      }

      comments.forEach((stat) => {
        result.total += stat._count
        result.totalLikes += stat._sum.likes || 0
        if (stat.contentType === "video") result.videos = stat._count
        if (stat.contentType === "photo") result.photos = stat._count
        if (stat.contentType === "journal") result.journals = stat._count
      })

      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user comment stats: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete all comments for content (when content is deleted)
   */
  async deleteByContent(contentType: ContentType, contentId: string) {
    try {
      const result = await prisma.comment.deleteMany({
        where: { contentType, contentId }
      })
      Logger.i(
        LogTags.AUTH,
        `${result.count} comments deleted for ${contentType} ${contentId}`
      )
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting comments by content: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete all comments by user (when user is deleted)
   */
  async deleteByUser(userId: string) {
    try {
      const result = await prisma.comment.deleteMany({ where: { userId } })
      Logger.i(LogTags.AUTH, `${result.count} comments deleted for user ${userId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting comments by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find comments with replies populated
   */
  async findWithReplies(
    contentType: ContentType,
    contentId: string,
    limit = 50
  ) {
    try {
      const rootComments = await this.findByContent(contentType, contentId, limit)

      // Fetch replies for each root comment
      const commentsWithReplies = await Promise.all(
        rootComments.map(async (comment) => {
          const replies = await this.findReplies(comment.id)
          return { ...comment, replies }
        })
      )

      return commentsWithReplies
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding comments with replies: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get comment thread (parent and all ancestors)
   */
  async getThread(commentId: string) {
    try {
      const comment = await this.findById(commentId, true)
      if (!comment) return []

      const thread: Comment[] = [comment]

      // If has parent, recursively get parent thread
      if (comment.parentCommentId) {
        const parentThread = await this.getThread(comment.parentCommentId)
        thread.unshift(...parentThread)
      }

      return thread
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting comment thread: ${String(error)}`)
      throw error
    }
  }
}

// Export singleton instance
export const commentRepository = new CommentRepository()
