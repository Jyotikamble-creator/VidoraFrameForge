import { NextRequest, NextResponse } from "next/server"
import { PhotoService } from "@/server/services/photo.service"
import { Logger, LogTags, categorizeError, ValidationError, DatabaseError } from "@/lib/logger"
import { requireAuth } from "@/server/utils/apiHelpers"
import { sanitizeString } from "@/lib/validation"

/**
 * Photo Controller
 * Handles HTTP request/response for photo-related operations
 * Delegates business logic to PhotoService
 */
export class PhotoController {
  private photoService: PhotoService

  constructor() {
    this.photoService = new PhotoService()
  }

  /**
   * Get photos with filters
   * GET /api/photos?album=vacation&search=beach&userId=123&limit=20
   */
  async getPhotos(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.PHOTO_FETCH, 'Get photos request received')

    try {
      const { searchParams } = new URL(request.url)
      
      const filters = {
        album: searchParams.get("album"),
        search: searchParams.get("search"),
        userId: searchParams.get("userId"),
        limit: parseInt(searchParams.get("limit") || "20")
      }

      Logger.d(LogTags.PHOTO_FETCH, 'Fetching photos with filters', { filters })

      const photos = await this.photoService.getPhotos(filters)

      Logger.i(LogTags.PHOTO_FETCH, `Successfully fetched ${photos.length} photos`)
      
      return NextResponse.json(photos)
    } catch (error) {
      return this.handleError(error, 'Failed to fetch photos')
    }
  }

  /**
   * Create new photo
   * POST /api/photos
   */
  async createPhoto(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.PHOTO_UPLOAD, 'Create photo request received')

    try {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const body = await request.json()
      const userId = authResult.userId

      // Validate required fields
      const validation = this.validatePhotoData(body)
      if (!validation.valid) {
        Logger.w(LogTags.PHOTO_UPLOAD, 'Photo validation failed', { errors: validation.errors })
        return NextResponse.json({ error: validation.errors[0] }, { status: 400 })
      }

      // Sanitize inputs
      const photoData = {
        title: body.title ? sanitizeString(body.title) : undefined,
        description: body.description ? sanitizeString(body.description) : undefined,
        url: body.url || body.photoUrl,
        thumbnailUrl: body.thumbnailUrl,
        width: body.width,
        height: body.height,
        tags: Array.isArray(body.tags) ? body.tags.map((tag: string) => sanitizeString(tag)) : [],
        album: body.album ? sanitizeString(body.album) : undefined,
        location: body.location ? sanitizeString(body.location) : undefined,
        takenAt: body.takenAt,
        privacy: (body.isPublic === false ? 'private' : 'public') as 'public' | 'private' | 'friends',
        fileId: body.fileId,
        fileName: body.fileName,
        size: body.size
      }

      Logger.d(LogTags.PHOTO_UPLOAD, 'Creating photo', { title: photoData.title, userId })

      const photo = await this.photoService.createPhoto(userId, photoData)

      Logger.i(LogTags.PHOTO_UPLOAD, 'Photo created successfully', { photoId: photo.id, userId })
      
      return NextResponse.json(photo, { status: 201 })
    } catch (error) {
      return this.handleError(error, 'Failed to create photo')
    }
  }

  /**
   * Update photo
   * PUT /api/photos?id=123
   */
  async updatePhoto(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.PHOTO_UPDATE, 'Update photo request received')

    try {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const { searchParams } = new URL(request.url)
      const photoId = searchParams.get("id")

      if (!photoId) {
        return NextResponse.json({ error: "Photo ID is required" }, { status: 400 })
      }

      const body = await request.json()
      const userId = authResult.userId

      // Sanitize update data
      const updateData: any = {}
      if (body.title !== undefined) updateData.title = sanitizeString(body.title)
      if (body.description !== undefined) updateData.description = sanitizeString(body.description)
      if (body.tags !== undefined) updateData.tags = body.tags.map((tag: string) => sanitizeString(tag))
      if (body.album !== undefined) updateData.album = sanitizeString(body.album)
      if (body.location !== undefined) updateData.location = sanitizeString(body.location)
      if (body.privacy !== undefined) updateData.privacy = body.privacy

      const photo = await this.photoService.updatePhoto(photoId, userId, updateData)

      if (!photo) {
        return NextResponse.json({ error: "Photo not found or unauthorized" }, { status: 404 })
      }

      Logger.i(LogTags.PHOTO_UPDATE, 'Photo updated successfully', { photoId, userId })
      
      return NextResponse.json(photo)
    } catch (error) {
      return this.handleError(error, 'Failed to update photo')
    }
  }

  /**
   * Delete photo
   * DELETE /api/photos?id=123
   */
  async deletePhoto(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.PHOTO_DELETE, 'Delete photo request received')

    try {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const { searchParams } = new URL(request.url)
      const photoId = searchParams.get("id")

      if (!photoId) {
        return NextResponse.json({ error: "Photo ID is required" }, { status: 400 })
      }

      const userId = authResult.userId

      const result = await this.photoService.deletePhoto(photoId, userId)

      if (!result.success) {
        Logger.w(LogTags.PHOTO_DELETE, result.message, { photoId, userId })
        return NextResponse.json({ error: result.message }, { status: result.notFound ? 404 : 403 })
      }

      Logger.i(LogTags.PHOTO_DELETE, 'Photo deleted successfully', { photoId, userId })
      
      return NextResponse.json({ message: "Photo deleted successfully" })
    } catch (error) {
      return this.handleError(error, 'Failed to delete photo')
    }
  }

  /**
   * Validate photo data
   */
  private validatePhotoData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    const url = data.url || data.photoUrl
    if (!url || typeof url !== 'string') {
      errors.push("Photo URL is required")
    }

    if (data.title && typeof data.title !== 'string') {
      errors.push("Title must be a string")
    }

    if (data.title && (data.title.trim().length < 1 || data.title.trim().length > 100)) {
      errors.push("Title must be between 1 and 100 characters")
    }

    if (data.description && data.description.length > 1000) {
      errors.push("Description cannot exceed 1000 characters")
    }

    if (data.album && typeof data.album !== 'string') {
      errors.push("Album must be a string")
    }

    if (data.tags && !Array.isArray(data.tags)) {
      errors.push("Tags must be an array")
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Centralized error handling
   */
  private handleError(error: unknown, defaultMessage: string): NextResponse {
    const categorizedError = categorizeError(error)

    if (categorizedError instanceof ValidationError) {
      Logger.w(LogTags.PHOTO_UPLOAD, `Validation error: ${categorizedError.message}`)
      return NextResponse.json({ error: categorizedError.message }, { status: 400 })
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error: ${categorizedError.message}`, { error: categorizedError })
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    Logger.e(LogTags.PHOTO_UPLOAD, `Unexpected error: ${categorizedError.message}`, { error: categorizedError })
    return NextResponse.json({ error: defaultMessage }, { status: 500 })
  }
}
