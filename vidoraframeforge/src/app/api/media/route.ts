export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { Prisma } from "@prisma/client"
import { Logger, LogTags, categorizeError, DatabaseError } from "@/lib/logger"

interface MediaItem {
  id: string
  type: 'photo' | 'video' | 'journal'
  title?: string
  content?: string
  description?: string
  url?: string
  videoUrl?: string
  thumbnailUrl?: string
  tags?: string[]
  createdAt: Date
  uploader?: any
  author?: any
}

export async function GET(request: NextRequest) {
  Logger.d(LogTags.AUTH, 'Unified media fetch request received');

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // photo, video, journal, or 'all'
    const search = searchParams.get("search")
    const tag = searchParams.get("tag")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "100")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    Logger.d(LogTags.AUTH, 'Query parameters', { type, hasSearch: !!search, tag, userId, limit });

    // Build common filters
    const dateFilter = startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      }
    } : {}

    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc'

    let allMedia: MediaItem[] = []

    // Fetch photos
    if (!type || type === 'all' || type === 'photo') {
      const photoWhere: Prisma.PhotoWhereInput = {
        ...(userId ? { userId } : { privacy: 'public' }),
        ...dateFilter,
        ...(tag ? { tags: { hasSome: [tag] } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: search, mode: Prisma.QueryMode.insensitive } }
              ]
            }
          : {})
      }

      const photos = await prisma.photo.findMany({
        where: photoWhere,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: orderDirection },
        take: limit
      })

      allMedia.push(...photos.map((photo: any) => ({
        ...photo,
        uploader: photo.user,
        type: 'photo' as const
      })))
    }

    // Fetch videos
    if (!type || type === 'all' || type === 'video') {
      const videoWhere: Prisma.VideoWhereInput = {
        ...(userId ? { userId } : { privacy: 'public' }),
        ...dateFilter,
        ...(tag ? { tags: { hasSome: [tag] } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: search, mode: Prisma.QueryMode.insensitive } }
              ]
            }
          : {})
      }

      const videos = await prisma.video.findMany({
        where: videoWhere,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: orderDirection },
        take: limit
      })

      allMedia.push(...videos.map((video: any) => ({
        ...video,
        uploader: video.user,
        type: 'video' as const
      })))
    }

    // Fetch journals
    if (!type || type === 'all' || type === 'journal') {
      const journalWhere: Prisma.JournalWhereInput = {
        ...(userId ? { authorId: userId } : { privacy: 'public' }),
        ...dateFilter,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { content: { contains: search, mode: Prisma.QueryMode.insensitive } }
              ]
            }
          : {})
      }

      const journals = await prisma.journal.findMany({
        where: journalWhere,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: orderDirection },
        take: limit
      })

      allMedia.push(...journals.map((journal: any) => ({
        ...journal,
        type: 'journal' as const,
        uploader: journal.author // Normalize field name
      })))
    }

    // Sort all media by date
    allMedia.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })

    // Apply limit to combined results
    if (allMedia.length > limit) {
      allMedia = allMedia.slice(0, limit)
    }

    Logger.i(LogTags.AUTH, `Media fetched successfully: ${allMedia.length} items returned`);
    
    return NextResponse.json({
      media: allMedia,
      total: allMedia.length,
      filters: { type, search, tag, startDate, endDate }
    })
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in media fetch: ${categorizedError.message}`);
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.AUTH, `Unexpected error in media fetch: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
