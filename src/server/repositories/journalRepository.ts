import { prisma } from "@/server/db"
import { Prisma } from "@prisma/client"
import { Logger, LogTags } from "@/lib/logger"

export interface JournalFilters {
  authorId?: string
  mood?: string
  tags?: string | string[]
  search?: string
  startDate?: Date
  endDate?: Date
  privacy?: "public" | "private" | "friends"
}

export const JOURNAL_POPULATE_OPTIONS = {
  author: {
    select: {
      username: true,
      email: true,
      avatar: true
    }
  }
}

export class JournalRepository {
  /**
   * Find journal by ID
   */
  async findById(journalId: string, populate = true) {
    try {
      return await prisma.journal.findUnique({
        where: { id: journalId },
        include: populate
          ? {
              ...JOURNAL_POPULATE_OPTIONS,
              attachments: true
            }
          : { attachments: true }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding journal by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find journals by user ID
   */
  async findByUser(userId: string, limit = 50, skip = 0) {
    try {
      return await prisma.journal.findMany({
        where: { authorId: userId },
        include: {
          ...JOURNAL_POPULATE_OPTIONS,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding journals by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find all journals with filters
   */
  async findAll(filters: JournalFilters = {}, limit = 50, skip = 0) {
    try {
      const where: Prisma.JournalWhereInput = {}

      if (filters.authorId) {
        where.authorId = filters.authorId
      }

      if (filters.mood) {
        where.mood = filters.mood
      }

      if (filters.privacy) {
        where.privacy = filters.privacy
      } else {
        where.privacy = "public"
      }

      // Prisma Journal model currently has no tags field.
      // Keep accepting tags in filters for backward compatibility, but ignore here.
      if (filters.tags) {
        Logger.w(LogTags.DB_QUERY, "Journal tags filter ignored: tags are not in current PostgreSQL schema")
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
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

      return await prisma.journal.findMany({
        where,
        include: {
          ...JOURNAL_POPULATE_OPTIONS,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding all journals: ${String(error)}`)
      throw error
    }
  }

  /**
   * Search journals with text search
   */
  async search(searchTerm: string, limit = 50) {
    try {
      return await prisma.journal.findMany({
        where: {
          privacy: "public",
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          ...JOURNAL_POPULATE_OPTIONS,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error searching journals: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create a new journal
   */
  async create(journalData: {
    authorId: string
    title: string
    content: string
    mood?: string
    tags?: string[]
    privacy?: "public" | "private" | "friends"
    attachments?: Array<{
      type: "photo" | "video"
      url: string
    }>
  }) {
    try {
      const { attachments, tags, ...journalFields } = journalData
      if (tags && tags.length > 0) {
        Logger.w(LogTags.DB_QUERY, "Journal tags ignored during create: tags are not in current PostgreSQL schema")
      }
      const journal = await prisma.journal.create({
        data: {
          ...journalFields,
          attachments: attachments
            ? {
                createMany: {
                  data: attachments
                }
              }
            : undefined
        },
        include: {
          ...JOURNAL_POPULATE_OPTIONS,
          attachments: true
        }
      })
      Logger.i(LogTags.JOURNAL_CREATE, `Journal created: ${journal.id}`, {
        title: journal.title,
        authorId: journal.authorId
      })
      return journal
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error creating journal: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update journal by ID
   */
  async update(
    journalId: string,
    updateData: Partial<{
      title: string
      content: string
      mood: string
      tags: string[]
      privacy: "public" | "private" | "friends"
    }>
  ) {
    try {
      const { tags, ...safeUpdateData } = updateData
      if (tags && tags.length > 0) {
        Logger.w(LogTags.DB_QUERY, "Journal tags ignored during update: tags are not in current PostgreSQL schema")
      }

      const journal = await prisma.journal.update({
        where: { id: journalId },
        data: safeUpdateData,
        include: {
          ...JOURNAL_POPULATE_OPTIONS,
          attachments: true
        }
      })
      Logger.i(LogTags.JOURNAL_UPDATE, `Journal updated: ${journalId}`)
      return journal
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error updating journal: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete journal by ID
   */
  async delete(journalId: string) {
    try {
      const result = await prisma.journal.delete({
        where: { id: journalId }
      })
      Logger.i(LogTags.JOURNAL_DELETE, `Journal deleted: ${journalId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting journal: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get journals by mood
   */
  async findByMood(mood: string, userId?: string, limit = 50) {
    try {
      const where: Prisma.JournalWhereInput = { mood }

      if (userId) {
        where.authorId = userId
      } else {
        where.privacy = "public"
      }

      return await prisma.journal.findMany({
        where,
        include: {
          ...JOURNAL_POPULATE_OPTIONS,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding journals by mood: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get journals by tags
   */
  async findByTags(tags: string[], limit = 50) {
    try {
      Logger.w(LogTags.DB_QUERY, "findByTags called, but tags are not in current PostgreSQL Journal schema")
      void tags
      void limit
      return []
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding journals by tags: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count journals with filters
   */
  async count(filters: JournalFilters = {}): Promise<number> {
    try {
      const where: Prisma.JournalWhereInput = {}

      if (filters.authorId) {
        where.authorId = filters.authorId
      }

      if (filters.mood) {
        where.mood = filters.mood
      }

      if (filters.tags) {
        Logger.w(LogTags.DB_QUERY, "Journal tags filter ignored in count: tags are not in current PostgreSQL schema")
      }

      if (filters.privacy) {
        where.privacy = filters.privacy
      }

      return await prisma.journal.count({ where })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting journals: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if journal exists and user is owner
   */
  async isOwner(journalId: string, userId: string): Promise<boolean> {
    try {
      const journal = await prisma.journal.findUnique({
        where: { id: journalId },
        select: { authorId: true }
      })
      return journal?.authorId === userId
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking journal ownership: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get unique moods for user
   */
  async getUserMoods(userId: string): Promise<string[]> {
    try {
      const moods = await prisma.journal.findMany({
        where: {
          authorId: userId,
          mood: { not: null }
        },
        select: { mood: true },
        distinct: ['mood']
      })
      return moods.map(m => m.mood).filter((m) => m) as string[]
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user moods: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get unique tags from user's journals
   */
  async getUserTags(userId: string): Promise<string[]> {
    try {
      void userId
      Logger.w(LogTags.DB_QUERY, "getUserTags called, but tags are not in current PostgreSQL Journal schema")
      return []
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user tags: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get journal statistics for user
   */
  async getUserStats(userId: string) {
    try {
      const journals = await prisma.journal.findMany({
        where: { authorId: userId }
      })

      const totalJournals = journals.length
      const totalAttachments = await prisma.journalAttachment.count({
        where: {
          journal: {
            authorId: userId
          }
        }
      })

      return {
        totalJournals,
        totalLikes: 0, // Would need separate likes count
        averageContentLength: totalJournals > 0
          ? journals.reduce((sum, j) => sum + j.content.length, 0) / totalJournals
          : 0,
        totalAttachments
      }
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user stats: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get recent journals (global)
   */
  async findRecent(limit = 20) {
    try {
      return await prisma.journal.findMany({
        where: { privacy: "public" },
        include: {
          ...JOURNAL_POPULATE_OPTIONS,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding recent journals: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get journals with attachments
   */
  async findWithAttachments(userId?: string, limit = 50) {
    try {
      const where: Prisma.JournalWhereInput = {
        attachments: {
          some: {}
        }
      }

      if (userId) {
        where.authorId = userId
      } else {
        where.privacy = "public"
      }

      return await prisma.journal.findMany({
        where,
        include: {
          ...JOURNAL_POPULATE_OPTIONS,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding journals with attachments: ${String(error)}`)
      throw error
    }
  }
}

// Export singleton instance
export const journalRepository = new JournalRepository()
