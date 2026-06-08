import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/server/auth-config/auth"
import { Logger, LogTags, categorizeError } from "@/lib/logger"
import { likeRepository } from "@/server/repositories/likeRepository"
import { videoRepository } from "@/server/repositories/videoRepository"
import { photoRepository } from "@/server/repositories/photoRepository"
import { journalRepository } from "@/server/repositories/journalRepository"
import { prisma } from "@/server/db"
import { ContentType } from "@prisma/client"

// Validation helper for ContentType
const VALID_CONTENT_TYPES = Object.values(ContentType)

// GET /api/likes?contentType=video&contentId=xxx - Check if user liked and get like count
export async function GET(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Like status fetch request received');

  try {
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get("contentType")
    const contentId = searchParams.get("contentId")

    if (!contentType || !contentId) {
      return NextResponse.json({ error: "Content type and ID are required" }, { status: 400 })
    }

    if (!VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // Get total like count using Prisma
    const likeCount = await prisma.like.count({
      where: { contentType: contentType as ContentType, contentId }
    })

    // Check if current user liked (if authenticated)
    let isLiked = false
    if (session?.user) {
      isLiked = await likeRepository.hasLiked(session.user.id, contentType as ContentType, contentId)
    }

    return NextResponse.json({ likeCount, isLiked })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to fetch like status', { error: categorizedError })
    return NextResponse.json({ error: "Failed to fetch like status" }, { status: 500 })
  }
}

// POST /api/likes - Toggle like on content
export async function POST(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Like creation request received');

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { contentType, contentId } = await request.json()

    if (!contentType || !contentId) {
      return NextResponse.json({ error: "Content type and ID are required" }, { status: 400 })
    }

    if (!VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // Check if content exists
    const contentExists = await validateContentExists(contentType, contentId)
    if (!contentExists) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    const typedContentType = contentType as ContentType

    // Toggle like using available repository methods
    const existingLike = await likeRepository.findOne(session.user.id, typedContentType, contentId)

    if (existingLike) {
      await likeRepository.delete(session.user.id, typedContentType, contentId)
      const likeCount = await likeRepository.countByContent(typedContentType, contentId)
      return NextResponse.json({ liked: false, likeCount })
    }

    await likeRepository.create({
      userId: session.user.id,
      contentType: typedContentType,
      contentId
    })
    const likeCount = await likeRepository.countByContent(typedContentType, contentId)
    const result = { liked: true, likeCount }

    return NextResponse.json(result)
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to create like', { error: categorizedError })
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}

// DELETE /api/likes?contentType=video&contentId=xxx - Unlike content
export async function DELETE(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Unlike content request received');

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get("contentType")
    const contentId = searchParams.get("contentId")

    if (!contentType || !contentId) {
      return NextResponse.json({ error: "Content type and ID are required" }, { status: 400 })
    }

    if (!["video", "photo", "journal"].includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const typedContentType = contentType as ContentType

    const hasLiked = await likeRepository.hasLiked(session.user.id, typedContentType, contentId)
    if (!hasLiked) {
      return NextResponse.json({ error: "Like not found" }, { status: 404 })
    }

    await likeRepository.delete(session.user.id, typedContentType, contentId)

    return NextResponse.json({ message: "Unlike successful" })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to unlike content', { error: categorizedError })
    return NextResponse.json({ error: "Failed to unlike content" }, { status: 500 })
  }
}

async function validateContentExists(contentType: string, contentId: string): Promise<boolean> {
  if (contentType === 'video') {
    const video = await videoRepository.findById(contentId)
    return !!video
  } else if (contentType === 'photo') {
    const photo = await photoRepository.findById(contentId)
    return !!photo
  } else if (contentType === 'journal') {
    const journal = await journalRepository.findById(contentId)
    return !!journal
  }
  return false
}
