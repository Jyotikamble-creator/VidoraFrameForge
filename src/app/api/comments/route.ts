export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/server/auth-config/auth"
import { Logger, LogTags, categorizeError, ValidationError, DatabaseError } from "@/lib/logger"
import { sanitizeString } from "@/lib/validation"
import { commentRepository } from "@/server/repositories/commentRepository"
import { videoRepository } from "@/server/repositories/videoRepository"
import { photoRepository } from "@/server/repositories/photoRepository"
import { journalRepository } from "@/server/repositories/journalRepository"
import { prisma } from "@/server/db"
import { ContentType } from "@prisma/client"

// Validation helper for ContentType
const VALID_CONTENT_TYPES = Object.values(ContentType)

// GET /api/comments?contentType=video&contentId=xxx
export async function GET(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Comments fetch request received');

  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get("contentType")
    const contentId = searchParams.get("contentId")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!contentType || !contentId) {
      return NextResponse.json({ error: "Content type and ID are required" }, { status: 400 })
    }

    if (!VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // Get root comments
    const comments = await commentRepository.findByContent(
      contentType as ContentType,
      contentId,
      limit
    )

    // Fetch replies for each comment (using repository)
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: typeof comments[0]) => {
        const replies = await commentRepository.getThread(comment.id)
        return { ...comment, replies: replies.slice(1) } // Exclude root comment from replies
      })
    )

    Logger.i(LogTags.AUTH, `Fetched ${comments.length} comments`)
    return NextResponse.json({ comments: commentsWithReplies, count: comments.length })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to fetch comments', { error: categorizedError })
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

// POST /api/comments - Create a comment
export async function POST(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Create comment request received');

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      Logger.w(LogTags.AUTH, 'Comment creation failed: unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { contentType, contentId, content, parentComment } = body

    // Validation
    if (!contentType || !contentId || !content) {
      return NextResponse.json({ error: "Content type, ID, and comment text are required" }, { status: 400 })
    }

    if (!VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: "Comment cannot exceed 500 characters" }, { status: 400 })
    }

    // Verify content exists
    let contentExists = false
    switch (contentType) {
      case "video":
        contentExists = !!(await videoRepository.findById(contentId))
        break
      case "photo":
        contentExists = !!(await photoRepository.findById(contentId))
        break
      case "journal":
        contentExists = !!(await journalRepository.findById(contentId))
        break
    }

    if (!contentExists) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Create comment using repository
    const comment = await commentRepository.create({
      userId: session.user.id,
      contentType: contentType as ContentType,
      contentId,
      content: sanitizeString(content),
      parentCommentId: parentComment || undefined
    })

    Logger.i(LogTags.AUTH, `Comment created on ${contentType} ${contentId}`)
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to create comment', { error: categorizedError })
    
    if (categorizedError instanceof ValidationError) {
      return NextResponse.json({ error: categorizedError.message }, { status: 400 })
    }
    
    if (categorizedError instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }
    
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}

// PUT /api/comments?id=xxx - Update a comment
export async function PUT(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Update comment request received');

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("id")
    const body = await request.json()
    const { content } = body

    if (!commentId || !content) {
      return NextResponse.json({ error: "Comment ID and content are required" }, { status: 400 })
    }

    const comment = await commentRepository.findById(commentId)
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check ownership
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to edit this comment" }, { status: 403 })
    }

    // Update comment
    const updatedComment = await commentRepository.update(
      commentId,
      sanitizeString(content)
    )

    Logger.i(LogTags.AUTH, `Comment ${commentId} updated`)
    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to update comment', { error: categorizedError })
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 })
  }
}

// DELETE /api/comments?id=xxx
export async function DELETE(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Delete comment request received');

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("id")

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    const comment = await commentRepository.findById(commentId)
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check ownership
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this comment" }, { status: 403 })
    }

    // Delete comment and its replies
    await commentRepository.deleteWithReplies(commentId)

    Logger.i(LogTags.AUTH, `Comment ${commentId} deleted`)
    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    const categorizedError = categorizeError(error)
    Logger.e(LogTags.AUTH, 'Failed to delete comment', { error: categorizedError })
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
