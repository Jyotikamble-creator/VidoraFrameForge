import { prisma } from "@/server/db"
import { Follow, Prisma } from "@prisma/client"
import { Logger, LogTags } from "@/lib/logger"

export interface FollowFilters {
  followerId?: string
  followingId?: string
}

export const FOLLOW_USER_POPULATE_OPTIONS = {
  select: {
    username: true,
    email: true,
    avatar: true,
    bio: true,
    stats: {
      select: {
        followerCount: true,
        followingCount: true
      }
    }
  }
}

export class FollowRepository {
  /**
   * Find follow relationship by ID
   */
  async findById(followId: string) {
    try {
      return await prisma.follow.findUnique({
        where: { id: followId }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding follow by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find specific follow relationship
   */
  async findOne(followerId: string, followingId: string) {
    try {
      return await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding follow relationship: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if user A follows user B
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follow = await this.findOne(followerId, followingId)
      return !!follow
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking if following: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if two users follow each other (mutual follow)
   */
  async areMutualFollowers(userId1: string, userId2: string): Promise<boolean> {
    try {
      const follow1 = await this.isFollowing(userId1, userId2)
      const follow2 = await this.isFollowing(userId2, userId1)
      return follow1 && follow2
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking mutual followers: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get all followers for a user
   */
  async findFollowers(userId: string, limit = 50, skip = 0) {
    try {
      return await prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: { select: FOLLOW_USER_POPULATE_OPTIONS.select } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding followers: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get all users that a user is following
   */
  async findFollowing(userId: string, limit = 50, skip = 0) {
    try {
      return await prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: FOLLOW_USER_POPULATE_OPTIONS.select } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding following: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get follower list (just user objects)
   */
  async getFollowersList(userId: string, limit = 50) {
    try {
      const follows = await this.findFollowers(userId, limit)
      return follows.map((f) => f.follower).filter((u) => u)
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting followers list: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get following list (just user objects)
   */
  async getFollowingList(userId: string, limit = 50) {
    try {
      const follows = await this.findFollowing(userId, limit)
      return follows.map((f) => f.following).filter((u) => u)
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting following list: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create a follow relationship
   */
  async create(followerId: string, followingId: string) {
    try {
      // Check if already following
      const existing = await this.findOne(followerId, followingId)
      if (existing) {
        Logger.w(LogTags.AUTH, "User already following this user")
        return null
      }

      // Can't follow yourself
      if (followerId === followingId) {
        Logger.w(LogTags.AUTH, "User cannot follow themselves")
        return null
      }

      const follow = await prisma.follow.create({
        data: {
          followerId,
          followingId
        }
      })

      Logger.i(LogTags.AUTH, `Follow created: ${follow.id}`, {
        followerId,
        followingId
      })

      return follow
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error creating follow: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete a follow relationship
   */
  async delete(followerId: string, followingId: string) {
    try {
      const result = await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      })

      if (result) {
        Logger.i(LogTags.AUTH, `Follow deleted: ${result.id}`)
      }

      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting follow: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete follow by ID
   */
  async deleteById(followId: string) {
    try {
      const result = await prisma.follow.delete({
        where: { id: followId }
      })
      Logger.i(LogTags.AUTH, `Follow deleted: ${followId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting follow by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count followers for a user
   */
  async countFollowers(userId: string): Promise<number> {
    try {
      return await prisma.follow.count({ where: { followingId: userId } })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting followers: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count following for a user
   */
  async countFollowing(userId: string): Promise<number> {
    try {
      return await prisma.follow.count({ where: { followerId: userId } })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting following: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get follow statistics for user
   */
  async getUserStats(userId: string) {
    try {
      const [followerCount, followingCount] = await Promise.all([
        this.countFollowers(userId),
        this.countFollowing(userId)
      ])

      return {
        followerCount,
        followingCount,
        ratio: followingCount > 0 ? followerCount / followingCount : 0
      }
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting follow stats: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get mutual followers (users who follow each other with this user)
   */
  async getMutualFollowers(userId: string, limit = 50) {
    try {
      // Get users this user follows
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      })
      const followingIds = following.map((f) => f.followingId)

      // Get users who follow this user AND are in the following list
      return await prisma.follow.findMany({
        where: {
          followingId: userId,
          followerId: { in: followingIds }
        },
        include: { follower: { select: FOLLOW_USER_POPULATE_OPTIONS.select } },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting mutual followers: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get suggested users to follow (friends of friends)
   */
  async getSuggestedFollows(userId: string, limit = 10) {
    try {
      // Get users this user follows
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      })
      const followingIds = following.map((f) => f.followingId)

      // Get users that people this user follows also follow
      const suggestions = await prisma.follow.findMany({
        where: {
          followerId: { in: followingIds },
          followingId: { notIn: [...followingIds, userId] }
        },
        include: { following: { select: FOLLOW_USER_POPULATE_OPTIONS.select } },
        take: limit * 3 // Get more to deduplicate
      })

      // Count occurrences (more mutual connections = better suggestion)
      const suggestionMap = new Map()
      suggestions.forEach((s) => {
        const id = s.followingId
        if (!suggestionMap.has(id)) {
          suggestionMap.set(id, { user: s.following, count: 0 })
        }
        suggestionMap.get(id).count++
      })

      // Sort by count and return top suggestions
      return Array.from(suggestionMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((s) => s.user)
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting suggested follows: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete all follows for a user (when user is deleted)
   */
  async deleteAllByUser(userId: string) {
    try {
      const [asFollower, asFollowing] = await Promise.all([
        prisma.follow.deleteMany({ where: { followerId: userId } }),
        prisma.follow.deleteMany({ where: { followingId: userId } })
      ])

      Logger.i(
        LogTags.AUTH,
        `Deleted ${asFollower.count} following and ${asFollowing.count} followers for user ${userId}`
      )

      return {
        deletedAsFollower: asFollower.count,
        deletedAsFollowing: asFollowing.count,
        total: asFollower.count + asFollowing.count
      }
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting all follows: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get recent followers (newest followers)
   */
  async getRecentFollowers(userId: string, limit = 10) {
    try {
      return await prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: { select: FOLLOW_USER_POPULATE_OPTIONS.select } },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting recent followers: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get recent following (newest users followed)
   */
  async getRecentFollowing(userId: string, limit = 10) {
    try {
      return await prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: FOLLOW_USER_POPULATE_OPTIONS.select } },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting recent following: ${String(error)}`)
      throw error
    }
  }

  /**
   * Bulk check if user follows multiple users
   */
  async isFollowingMultiple(followerId: string, followingIds: string[]): Promise<{ [userId: string]: boolean }> {
    try {
      const follows = await prisma.follow.findMany({
        where: {
          followerId,
          followingId: { in: followingIds }
        },
        select: { followingId: true }
      })

      const result: { [userId: string]: boolean } = {}
      followingIds.forEach((id) => {
        result[id] = false
      })

      follows.forEach((follow) => {
        result[follow.followingId] = true
      })

      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking multiple follows: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get follow activity timeline (recent follows in network)
   */
  async getFollowActivity(userId: string, limit = 20) {
    try {
      // Get users this user follows
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      })
      const followingIds = following.map((f) => f.followingId)

      // Get recent follow activity from these users
      return await prisma.follow.findMany({
        where: { followerId: { in: followingIds } },
        include: {
          follower: { select: FOLLOW_USER_POPULATE_OPTIONS.select },
          following: { select: FOLLOW_USER_POPULATE_OPTIONS.select }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting follow activity: ${String(error)}`)
      throw error
    }
  }
}

// Export singleton instance
export const followRepository = new FollowRepository()
