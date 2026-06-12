import { photoRepository } from "@/server/repositories/photoRepository"
import { Logger, LogTags } from "@/lib/logger"
import { prisma } from "@/server/db"

interface PhotoFilters {
  album?: string | null
  search?: string | null
  userId?: string | null
  limit?: number
}

interface CreatePhotoData {
  title?: string
  description?: string
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  tags?: string[]
  album?: string
  location?: string
  takenAt?: Date
  privacy?: "public" | "private" | "friends"
  fileId?: string
  fileName?: string
  size?: number
}

interface DeleteResult {
  success: boolean
  message: string
  notFound?: boolean
}

/**
 * Photo Service
 * Contains all business logic for photo operations
 * Handles database interactions and data processing
 */
export class PhotoService {
  /**
   * Get photos with optional filters
   */
  async getPhotos(filters: PhotoFilters) {
    try {
      Logger.d(LogTags.DB_CONNECT, 'Fetching photos with filters')

      const searchTerm = filters.search || undefined
      const limit = filters.limit || 20

      if (filters.userId) {
        // Get photos for specific user
        return await photoRepository.findByUser(filters.userId)
      }

      if (filters.album) {
        // Get photos by album
        return await photoRepository.search(filters.album, limit)
      }

      if (searchTerm) {
        // Search across all public photos
        return await photoRepository.search(searchTerm, limit)
      }

      // Get all recent photos
      return await photoRepository.findAll()
    } catch (error) {
      Logger.e(LogTags.PHOTO_FETCH, `Error fetching photos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get photo by ID
   */
  async getPhotoById(photoId: string) {
    try {
      Logger.d(LogTags.PHOTO_FETCH, 'Fetching photo by ID', { photoId })
      return await photoRepository.findById(photoId)
    } catch (error) {
      Logger.e(LogTags.PHOTO_FETCH, `Error fetching photo: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get user's photos
   */
  async getUserPhotos(userId: string, limit: number = 20) {
    try {
      Logger.d(LogTags.PHOTO_FETCH, 'Fetching photos for user', { userId, limit })
      return await photoRepository.findByUser(userId)
    } catch (error) {
      Logger.e(LogTags.PHOTO_FETCH, `Error fetching user photos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Create new photo
   */
  async createPhoto(userId: string, photoData: CreatePhotoData) {
    try {
      Logger.d(LogTags.DB_CONNECT, 'Creating photo for user', { userId })

      // Create photo via repository
      const photo = await photoRepository.create({
        ...photoData,
        userId,
        privacy: (photoData.privacy || 'private') as "public" | "private" | "friends"
      })

      Logger.d(LogTags.PHOTO_UPLOAD, 'Photo document created', { photoId: photo.id })

      // Update user stats
      await prisma.userStats.update({
        where: { userId },
        data: { totalPhotos: { increment: 1 } }
      })

      Logger.i(LogTags.PHOTO_UPLOAD, 'Photo created successfully', { 
        photoId: photo.id, 
        title: photoData.title,
        userId 
      })

      return photo
    } catch (error) {
      Logger.e(LogTags.PHOTO_UPLOAD, `Error creating photo: ${String(error)}`)
      throw error
    }
  }

  /**
   * Update photo (with ownership check)
   */
  async updatePhoto(photoId: string, userId: string, updates: Partial<CreatePhotoData>) {
    try {
      Logger.d(LogTags.PHOTO_UPDATE, 'Attempting to update photo', { photoId, userId })

      // Find and check ownership
      const photo = await photoRepository.findById(photoId)

      if (!photo || photo.userId !== userId) {
        Logger.w(LogTags.PHOTO_UPDATE, 'Photo not found or unauthorized', { photoId, userId })
        return null
      }

      // Update photo
      const updatedPhoto = await photoRepository.update(photoId, {
        ...updates,
        privacy: updates.privacy as "public" | "private" | "friends" | undefined
      } as any)

      Logger.i(LogTags.PHOTO_UPDATE, 'Photo updated successfully', { photoId, userId })

      return updatedPhoto
    } catch (error) {
      Logger.e(LogTags.PHOTO_UPDATE, `Error updating photo: ${String(error)}`)
      throw error
    }
  }

  /**
   * Delete photo (with ownership check)
   */
  async deletePhoto(photoId: string, userId: string): Promise<DeleteResult> {
    try {
      Logger.d(LogTags.PHOTO_DELETE, 'Attempting to delete photo', { photoId, userId })

      // Find photo
      const photo = await photoRepository.findById(photoId)

      if (!photo) {
        Logger.w(LogTags.PHOTO_DELETE, 'Photo not found', { photoId })
        return {
          success: false,
          message: "Photo not found",
          notFound: true
        }
      }

      // Check ownership
      if (photo.userId !== userId) {
        Logger.w(LogTags.PHOTO_DELETE, 'Unauthorized delete attempt', { photoId, userId, ownerId: photo.userId })
        return {
          success: false,
          message: "Unauthorized to delete this photo"
        }
      }

      // Delete photo
      await photoRepository.delete(photoId)
      Logger.d(LogTags.PHOTO_DELETE, 'Photo deleted from database', { photoId })

      // Update user stats
      await prisma.userStats.update({
        where: { userId },
        data: { totalPhotos: { increment: -1 } }
      })

      Logger.i(LogTags.PHOTO_DELETE, 'Photo deleted successfully', { photoId, userId })

      return {
        success: true,
        message: "Photo deleted successfully"
      }
    } catch (error) {
      Logger.e(LogTags.PHOTO_DELETE, `Error deleting photo: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get photos by album
   */
  async getPhotosByAlbum(album: string, limit: number = 20) {
    try {
      Logger.d(LogTags.PHOTO_FETCH, 'Fetching photos by album', { album, limit })
      return await photoRepository.search(album, limit)
    } catch (error) {
      Logger.e(LogTags.PHOTO_FETCH, `Error fetching photos by album: ${String(error)}`)
      throw error
    }
  }

  /**
   * Search photos
   */
  async searchPhotos(searchTerm: string, limit: number = 20) {
    try {
      Logger.d(LogTags.PHOTO_FETCH, 'Searching photos', { searchTerm, limit })
      return await photoRepository.search(searchTerm, limit)
    } catch (error) {
      Logger.e(LogTags.PHOTO_FETCH, `Error searching photos: ${String(error)}`)
      throw error
    }
  }

  /**
   * Get photos by tag
   */
  async getPhotosByTag(tag: string, limit: number = 20) {
    try {
      Logger.d(LogTags.PHOTO_FETCH, 'Fetching photos by tag', { tag, limit })
      return await photoRepository.findByTags([tag], limit)
    } catch (error) {
      Logger.e(LogTags.PHOTO_FETCH, `Error fetching photos by tag: ${String(error)}`)
      throw error
    }
  }
}
