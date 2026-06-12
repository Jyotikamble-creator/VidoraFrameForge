import { prisma } from "@/server/db"
import { Prisma } from "@prisma/client"
import { Logger, LogTags } from "@/lib/logger"

const USER_WITH_STATS_SELECT = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  bio: true,
  avatar: true,
  coverImage: true,
  location: true,
  website: true,
  dateOfBirth: true,
  role: true,
  isEmailVerified: true,
  twoFactorEnabled: true,
  lastActive: true,
  createdAt: true,
  updatedAt: true,
  stats: true,
} as const

export interface UserFilters {
  email?: string
  role?: string
  search?: string
}

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: USER_WITH_STATS_SELECT
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding user by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find user by ID with password included (for authentication)
   */
  async findByIdWithPassword(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: { stats: true }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding user by ID with password: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: USER_WITH_STATS_SELECT
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding user by email: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { stats: true }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding user by email with password: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find multiple users with filters
   */
  async findAll(filters: UserFilters = {}, limit = 50, skip = 0) {
    try {
      const where: Prisma.UserWhereInput = {}

      if (filters.email) {
        where.email = filters.email.toLowerCase().trim()
      }

      if (filters.role) {
        where.role = filters.role
      }

      if (filters.search) {
        where.OR = [
          { username: { contains: filters.search, mode: 'insensitive' } },
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      return await prisma.user.findMany({
        where,
        select: USER_WITH_STATS_SELECT,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding all users: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create a new user
   */
  async create(userData: {
    email: string
    password?: string
    username: string
    firstName?: string
    lastName?: string
    role?: string
    avatar?: string
  }) {
    try {
      const user = await prisma.user.create({
        data: {
          ...userData,
          email: userData.email.toLowerCase().trim(),
          stats: {
            create: {}
          }
        },
        select: USER_WITH_STATS_SELECT
      })
      Logger.i(LogTags.AUTH, `User created: ${user.id}`)
      return user
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error creating user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update user by ID
   */
  async update(
    userId: string,
    updateData: Partial<{
      email: string
      password: string
      username: string
      firstName: string
      lastName: string
      bio: string
      avatar: string
      role: string
    }>
  ) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: USER_WITH_STATS_SELECT
      })
      Logger.i(LogTags.USER_UPDATE, `User updated: ${userId}`)
      return user
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error updating user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update user stats
   */
  async updateStats(
    userId: string,
    statsUpdate: {
      totalPhotos?: number
      totalVideos?: number
      totalJournals?: number
      streak?: number
      followerCount?: number
      followingCount?: number
    }
  ) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          stats: {
            update: statsUpdate
          }
        },
        select: USER_WITH_STATS_SELECT
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error updating user stats: ${String(error)}`)
      throw error
    }
  }

  /**
   * Increment user stats
   */
  async incrementStats(
    userId: string,
    field: "totalPhotos" | "totalVideos" | "totalJournals" | "followerCount" | "followingCount",
    amount = 1
  ) {
    try {
      return await prisma.userStats.update({
        where: { userId },
        data: {
          [field]: {
            increment: amount
          }
        }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error incrementing user stats: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId: string) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { lastActive: new Date() },
        select: USER_WITH_STATS_SELECT
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error updating lastActive: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete user by ID
   */
  async delete(userId: string) {
    try {
      const result = await prisma.user.delete({
        where: { id: userId }
      })
      Logger.i(LogTags.AUTH, `User deleted: ${userId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })
      return !!user
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking if user exists by email: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if user exists by ID
   */
  async existsById(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      return !!user
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking if user exists by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count total users
   */
  async count(filters: UserFilters = {}): Promise<number> {
    try {
      const where: Prisma.UserWhereInput = {}

      if (filters.role) {
        where.role = filters.role
      }

      if (filters.search) {
        where.OR = [
          { username: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      return await prisma.user.count({ where })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting users: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get user statistics
   */
  async getStats(userId: string) {
    try {
      const stats = await prisma.userStats.findUnique({
        where: { userId }
      })
      return stats || null
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user stats: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find users by IDs (for populating multiple users)
   */
  async findByIds(userIds: string[]) {
    try {
      return await prisma.user.findMany({
        where: {
          id: {
            in: userIds
          }
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          stats: {
            select: {
              followerCount: true,
              followingCount: true
            }
          }
        }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding users by IDs: ${String(error)}`)
      throw error
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository()
