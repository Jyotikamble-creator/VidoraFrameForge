import { prisma } from "@/server/db"
import { Photo, Prisma } from "@prisma/client"
import { Logger, LogTags } from "@/lib/logger"

export interface PhotoFilters {
  userId?: string
  album?: string
  tags?: string | string[]
  search?: string
  startDate?: Date
  endDate?: Date
  privacy?: string
}

export const PHOTO_POPULATE_OPTIONS = {
  user: {
    select: {
      username: true,
      email: true,
      avatar: true
    }
  }
}

export class PhotoRepository {
  /**
   * Find photo by ID
   */
  async findById(photoId: string, populate = true) {
    try {
      return await prisma.photo.findUnique({
        where: { id: photoId },
        include: populate ? PHOTO_POPULATE_OPTIONS : undefined
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding photo by ID: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find photos by user ID
   */
  async findByUser(userId: string, limit = 50, skip = 0) {
    try {
      return await prisma.photo.findMany({
        where: { userId },
        include: PHOTO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding photos by user: ${String(error)}`)
      throw error
    }
  }

  /**
   * Find all photos with filters
   */
  async findAll(filters: PhotoFilters = {}, limit = 50, skip = 0) {
    try {
      const where: Prisma.PhotoWhereInput = {}

      if (filters.userId) {
        where.userId = filters.userId
      }

      if (filters.album) {
        where.album = filters.album
      }

      if (filters.privacy !== undefined) {
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

      return await prisma.photo.findMany({
        where,
        include: PHOTO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding all photos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Search photos with text search
   */
  async search(searchTerm: string, limit = 50) {
    try {
      return await prisma.photo.findMany({
        where: {
          privacy: "public",
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { hasSome: [searchTerm] } }
          ]
        },
        include: PHOTO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error searching photos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create a new photo
   */
  async create(photoData: {
    userId: string
    title?: string
    description?: string
    url: string
    altText?: string
    tags?: string[]
    album?: string
    privacy?: "public" | "private" | "friends"
    width?: number
    height?: number
  }) {
    try {
      const photo = await prisma.photo.create({
        data: photoData,
        include: PHOTO_POPULATE_OPTIONS
      })
      Logger.i(LogTags.PHOTO_UPLOAD, `Photo created: ${photo.id}`, {
        title: photo.title,
        userId: photo.userId
      })
      return photo
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error creating photo: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update photo by ID
   */
  async update(
    photoId: string,
    updateData: Partial<{
      title: string
      description: string
      album: string
      tags: string[]
      privacy: "public" | "private" | "friends"
    }>
  ) {
    try {
      const photo = await prisma.photo.update({
        where: { id: photoId },
        data: updateData,
        include: PHOTO_POPULATE_OPTIONS
      })
      Logger.i(LogTags.PHOTO_UPDATE, `Photo updated: ${photoId}`)
      return photo
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error updating photo: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete photo by ID
   */
  async delete(photoId: string) {
    try {
      const result = await prisma.photo.delete({
        where: { id: photoId }
      })
      Logger.i(LogTags.PHOTO_DELETE, `Photo deleted: ${photoId}`)
      return result
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error deleting photo: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get photos by album
   */
  async findByAlbum(album: string, userId?: string, limit = 50) {
    try {
      const where: Prisma.PhotoWhereInput = { album }

      if (userId) {
        where.userId = userId
      } else {
        where.privacy = "public"
      }

      return await prisma.photo.findMany({
        where,
        include: PHOTO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding photos by album: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get photos by tags
   */
  async findByTags(tags: string[], limit = 50) {
    try {
      return await prisma.photo.findMany({
        where: {
          privacy: "public",
          tags: { hasSome: tags }
        },
        include: PHOTO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding photos by tags: ${String(error)}`)
      throw error
    }
  }

  /**
   * Count photos with filters
   */
  async count(filters: PhotoFilters = {}): Promise<number> {
    try {
      const where: Prisma.PhotoWhereInput = {}

      if (filters.userId) {
        where.userId = filters.userId
      }

      if (filters.album) {
        where.album = filters.album
      }

      if (filters.tags) {
        where.tags = Array.isArray(filters.tags)
          ? { hasSome: filters.tags }
          : { has: filters.tags }
      }

      if (filters.privacy !== undefined) {
        where.privacy = filters.privacy
      }

      return await prisma.photo.count({ where })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error counting photos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Check if photo exists and user is owner
   */
  async isOwner(photoId: string, userId: string): Promise<boolean> {
    try {
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
        select: { userId: true }
      })
      return photo?.userId === userId
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error checking photo ownership: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get unique albums for user
   */
  async getUserAlbums(userId: string): Promise<string[]> {
    try {
      const albums = await prisma.photo.findMany({
        where: { userId },
        select: { album: true },
        distinct: ['album']
      })
      return albums
        .map(a => a.album)
        .filter((a) => a) as string[]
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user albums: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get unique tags from user's photos
   */
  async getUserTags(userId: string): Promise<string[]> {
    try {
      const photos = await prisma.photo.findMany({
        where: { userId },
        select: { tags: true }
      })

      const allTags = photos.flatMap((p) => p.tags || [])
      return [...new Set(allTags)].sort()
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user tags: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get photo statistics for user
   */
  async getUserStats(userId: string) {
    try {
      const photos = await prisma.photo.findMany({
        where: { userId }
      })

      const totalPhotos = photos.length

      return {
        totalPhotos,
        totalLikes: 0, // Would need separate likes count query
        totalSize: 0
      }
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting user stats: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get recent photos (global)
   */
  async findRecent(limit = 20) {
    try {
      return await prisma.photo.findMany({
        where: { privacy: "public" },
        include: PHOTO_POPULATE_OPTIONS,
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error finding recent photos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get album count for user
   */
  async getAlbumCount(userId: string): Promise<number> {
    try {
      const albums = await this.getUserAlbums(userId)
      return albums.length
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting album count: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get photos count by album for user
   */
  async getPhotosPerAlbum(userId: string) {
    try {
      const albums = await prisma.photo.groupBy({
        by: ['album'],
        where: { userId },
        _count: true
      })
      return albums.map(a => ({
        album: a.album,
        count: a._count
      }))
    } catch (error) {
      Logger.e(LogTags.DB_QUERY, `Error getting photos per album: ${String(error)}`)
      throw error
    }
  }
}

// Export singleton instance
export const photoRepository = new PhotoRepository()
