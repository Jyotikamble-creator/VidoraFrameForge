import { NextRequest, NextResponse } from "next/server"
import { VideoService } from "@/server/services/video.service"
import { Logger, LogTags, categorizeError, ValidationError, DatabaseError } from "@/lib/logger"
import { requireAuth } from "@/server/utils/apiHelpers"
import { sanitizeString } from "@/lib/validation"

/**
 * Video Controller
 * Handles HTTP request/response for video-related operations
 * Delegates business logic to VideoService
 */
export class VideoController {
  private videoService: VideoService

  constructor() {
    this.videoService = new VideoService()
  }

  /**
   * Get videos with filters
   * GET /api/auth/videos?category=gaming&search=tutorial&userId=123&limit=10
   */
  async getVideos(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.VIDEO_FETCH, 'Get videos request received')

    try {
      const { searchParams } = new URL(request.url)
      
      const filters = {
        category: searchParams.get("category"),
        search: searchParams.get("search"),
        userId: searchParams.get("userId"),
        limit: parseInt(searchParams.get("limit") || "20")
      }

      Logger.d(LogTags.VIDEO_FETCH, 'Fetching videos with filters', { filters })

      const videos = await this.videoService.getVideos(filters)

      Logger.i(LogTags.VIDEO_FETCH, `Successfully fetched ${videos.length} videos`)
      
      return NextResponse.json(videos)
    } catch (error) {
      return this.handleError(error, 'Failed to fetch videos')
    }
  }

  /**
   * Get single video by ID
   * GET /api/auth/video?id=123
   */
  async getVideoById(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.VIDEO_FETCH, 'Get video by ID request received')

    try {
      const { searchParams } = new URL(request.url)
      const videoId = searchParams.get("id")

      if (!videoId) {
        Logger.w(LogTags.VIDEO_FETCH, 'Video ID is required')
        return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
      }

      const video = await this.videoService.getVideoById(videoId, { incrementViews: true })

      if (!video) {
        Logger.w(LogTags.VIDEO_FETCH, 'Video not found', { videoId })
        return NextResponse.json({ error: "Video not found" }, { status: 404 })
      }

      Logger.i(LogTags.VIDEO_FETCH, 'Video fetched successfully', { videoId })
      
      return NextResponse.json(video)
    } catch (error) {
      return this.handleError(error, 'Failed to fetch video')
    }
  }

  /**
   * Create new video
   * POST /api/auth/videos
   */
  async createVideo(request: NextRequest): Promise<NextResponse> {
    Logger.d(LogTags.VIDEO_UPLOAD, 'Create video request received')

    try {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const body = await request.json()
      const userId = authResult.userId

      // Validate required fields
      const validation = this.validateVideoData(body)
      if (!validation.valid) {
        Logger.w(LogTags.VIDEO_UPLOAD, 'Video validation failed', { errors: validation.errors })
        return NextResponse.json({ error: validation.errors[0] }, { status: 400 })
      }

      // Sanitize inputs
      const videoData = {
        title: sanitizeString(body.title),
        description: body.description ? sanitizeString(body.description) : undefined,
        videoUrl: body.videoUrl,
        thumbnailUrl: body.thumbnailUrl,
        category: body.category,
        tags: Array.isArray(body.tags) ? body.tags.map((tag: string) => sanitizeString(tag)) : [],
        isPublic: body.isPublic !== false,
        privacy: (body.isPublic === false ? 'private' : 'public') as 'public' | 'private' | 'friends',
        fileId: body.fileId,
        fileName: body.fileName,
        size: body.size,
        duration: body.duration,
        transformation: body.transformation,
        album: body.album,
        location: body.location
      }

      Logger.d(LogTags.VIDEO_UPLOAD, 'Creating video', { title: videoData.title, userId })

      const video = await this.videoService.createVideo(userId, videoData)

      Logger.i(LogTags.VIDEO_UPLOAD, 'Video created successfully', { videoId: video.id, userId })
      
      return NextResponse.json(video, { status: 201 })
    } catch (error) {
      return this.handleError(error, 'Failed to create video')
    }
  }

  /**
   * Delete video
   * DELETE /api/auth/videos/[id]
   */
  async deleteVideo(request: NextRequest, videoId: string): Promise<NextResponse> {
    Logger.d(LogTags.VIDEO_DELETE, 'Delete video request received', { videoId })

    try {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const userId = authResult.userId

      // Delete video (service will check ownership)
      const result = await this.videoService.deleteVideo(videoId, userId)

      if (!result.success) {
        Logger.w(LogTags.VIDEO_DELETE, result.message, { videoId, userId })
        return NextResponse.json({ error: result.message }, { status: result.notFound ? 404 : 403 })
      }

      Logger.i(LogTags.VIDEO_DELETE, 'Video deleted successfully', { videoId, userId })
      
      return NextResponse.json({ message: "Video deleted successfully" })
    } catch (error) {
      return this.handleError(error, 'Failed to delete video')
    }
  }

  /**
   * Get user's videos
   * GET /api/auth/videos?userId=123
   */
  async getUserVideos(userId: string, limit: number = 20): Promise<NextResponse> {
    Logger.d(LogTags.VIDEO_FETCH, 'Get user videos request', { userId })

    try {
      const videos = await this.videoService.getUserVideos(userId, limit)

      Logger.i(LogTags.VIDEO_FETCH, `Fetched ${videos.length} videos for user`, { userId })
      
      return NextResponse.json(videos)
    } catch (error) {
      return this.handleError(error, 'Failed to fetch user videos')
    }
  }

  /**
   * Validate video data
   */
  private validateVideoData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || typeof data.title !== 'string') {
      errors.push("Title is required")
    } else if (data.title.trim().length < 1 || data.title.trim().length > 100) {
      errors.push("Title must be between 1 and 100 characters")
    }

    if (!data.videoUrl || typeof data.videoUrl !== 'string') {
      errors.push("Video URL is required")
    }

    if (!data.thumbnailUrl || typeof data.thumbnailUrl !== 'string') {
      errors.push("Thumbnail URL is required")
    }

    if (data.description && data.description.length > 1000) {
      errors.push("Description cannot exceed 1000 characters")
    }

    if (data.category && typeof data.category !== 'string') {
      errors.push("Category must be a string")
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
      Logger.w(LogTags.VIDEO_UPLOAD, `Validation error: ${categorizedError.message}`)
      return NextResponse.json({ error: categorizedError.message }, { status: 400 })
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error: ${categorizedError.message}`, { error: categorizedError })
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    Logger.e(LogTags.VIDEO_UPLOAD, `Unexpected error: ${categorizedError.message}`, { error: categorizedError })
    return NextResponse.json({ error: defaultMessage }, { status: 500 })
  }
}
