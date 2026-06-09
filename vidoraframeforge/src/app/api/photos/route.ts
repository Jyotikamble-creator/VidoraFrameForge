export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/server/db"
import { photoRepository } from "@/server/repositories/photoRepository"
import { authOptions } from "@/server/auth-config/auth"
import { Logger, LogTags, categorizeError, ValidationError, DatabaseError } from "@/lib/logger"
import { isValidVideoTitle, isValidVideoDescription, sanitizeString } from "@/lib/validation"

export async function GET(request: NextRequest) {
  Logger.d(LogTags.PHOTO_FETCH, 'Photo fetch request received');

  try {
    const { searchParams } = new URL(request.url)
    const album = searchParams.get("album")
    const search = searchParams.get("search")
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "50")

    Logger.d(LogTags.PHOTO_FETCH, 'Query parameters parsed', { album, hasSearch: !!search, userId, limit });

    // Build filters for Prisma
    const filters: any = {}
    
    if (userId) {
      filters.userId = userId
    } else {
      filters.privacy = "public"
    }

    if (album) {
      filters.album = album
    }

    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch photos
    const photos = await prisma.photo.findMany({
      where: filters,
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
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    Logger.i(LogTags.PHOTO_FETCH, `Photos fetched successfully: ${photos.length} photos returned`);
    return NextResponse.json(photos)
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in photo fetch: ${categorizedError.message}`);
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.PHOTO_FETCH, `Unexpected error in photo fetch: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  Logger.d(LogTags.PHOTO_UPLOAD, 'Photo creation request received');

  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo creation failed: unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    Logger.d(LogTags.PHOTO_UPLOAD, 'User authenticated', { userId: session.user.id });

    const body = await request.json()
    const { title, description, photoUrl, thumbnailUrl, album, tags, isPublic, width, height } = body

    Logger.d(LogTags.PHOTO_UPLOAD, 'Request body parsed', {
      hasTitle: !!title,
      hasPhotoUrl: !!photoUrl,
      hasThumbnailUrl: !!thumbnailUrl,
      album,
      tagsCount: tags?.length || 0
    });

    // Validate required fields
    if (!photoUrl || !thumbnailUrl) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo creation failed: missing required fields', {
        hasPhotoUrl: !!photoUrl,
        hasThumbnailUrl: !!thumbnailUrl
      });
      return NextResponse.json({ error: "Photo URL and thumbnail URL are required" }, { status: 400 })
    }

    // Validate title if provided
    if (title && !isValidVideoTitle(title)) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo creation failed: invalid title', { title });
      return NextResponse.json({ error: "Title must be between 1 and 100 characters" }, { status: 400 })
    }

    // Validate description if provided
    if (description && !isValidVideoDescription(description)) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo creation failed: invalid description length');
      return NextResponse.json({ error: "Description must be less than 1000 characters" }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedTitle = title ? sanitizeString(title) : '';
    const sanitizedDescription = description ? sanitizeString(description) : '';
    const sanitizedAlbum = album ? sanitizeString(album) : undefined;
    Logger.d(LogTags.PHOTO_UPLOAD, 'Input validation passed', { title: sanitizedTitle });

    // Create photo using repository
    const photo = await photoRepository.create({
      title: sanitizedTitle,
      description: sanitizedDescription,
      url: photoUrl,
      userId: session.user.id,
      album: sanitizedAlbum,
      tags: tags || [],
      privacy: isPublic === false ? "private" : "public",
      width,
      height,
    })

    // Update user stats
    await prisma.userStats.update({
      where: { userId: session.user.id },
      data: { totalPhotos: { increment: 1 } }
    })

    // Fetch with uploader
    const populatedPhoto = await prisma.photo.findUnique({
      where: { id: photo.id },
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
      }
    })

    Logger.i(LogTags.PHOTO_UPLOAD, 'Photo created successfully', {
      photoId: photo.id,
      userId: session.user.id,
      title: sanitizedTitle
    });

    return NextResponse.json(populatedPhoto, { status: 201 })
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof ValidationError) {
      Logger.e(LogTags.PHOTO_UPLOAD, `Validation error in photo creation: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: categorizedError.message }, { status: 400 });
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in photo creation: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.PHOTO_UPLOAD, `Unexpected error in photo creation: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to create photo" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  Logger.d(LogTags.PHOTO_UPLOAD, 'Photo update request received');

  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo update failed: unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    Logger.d(LogTags.PHOTO_UPLOAD, 'User authenticated', { userId: session.user.id });

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get("id")

    if (!photoId) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo update failed: missing photo ID');
      return NextResponse.json({ error: "Photo ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { title, description, tags, album, isPublic } = body

    Logger.d(LogTags.PHOTO_UPLOAD, 'Update request body parsed', {
      photoId,
      hasTitle: !!title,
      hasDescription: !!description,
      tagsCount: tags?.length || 0
    });

    // Find the photo and check ownership
    const existingPhoto = await photoRepository.findById(photoId)
    if (!existingPhoto) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo update failed: photo not found', { photoId });
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    if (existingPhoto.userId !== session.user.id) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo update failed: unauthorized access', {
        photoId,
        userId: session.user.id,
        uploaderId: existingPhoto.userId
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Validate title if provided
    if (title && !isValidVideoTitle(title)) {
      Logger.w(LogTags.PHOTO_UPLOAD, 'Photo update failed: invalid title', { title });
      return NextResponse.json({ error: "Title must be between 1 and 100 characters" }, { status: 400 })
    }

    // Sanitize inputs
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = sanitizeString(title);
    if (description !== undefined) updateData.description = sanitizeString(description);
    if (tags !== undefined) updateData.tags = tags;
    if (album !== undefined) updateData.album = album ? sanitizeString(album) : undefined;
    if (isPublic !== undefined) updateData.privacy = isPublic ? "public" : "private";

    updateData.updatedAt = new Date();

    Logger.d(LogTags.PHOTO_UPLOAD, 'Update data prepared', { photoId });

    // Update photo using repository
    const updatedPhoto = await photoRepository.update(photoId, updateData)

    Logger.i(LogTags.PHOTO_UPLOAD, 'Photo updated successfully', {
      photoId,
      userId: session.user.id,
      title: updatedPhoto?.title
    });

    return NextResponse.json(updatedPhoto)
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof ValidationError) {
      Logger.e(LogTags.PHOTO_UPLOAD, `Validation error in photo update: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: categorizedError.message }, { status: 400 });
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in photo update: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.PHOTO_UPLOAD, `Unexpected error in photo update: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  Logger.d(LogTags.PHOTO_DELETE, 'Photo deletion request received');

  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      Logger.w(LogTags.PHOTO_DELETE, 'Photo deletion failed: unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    Logger.d(LogTags.PHOTO_DELETE, 'User authenticated', { userId: session.user.id });

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get("id")

    if (!photoId) {
      Logger.w(LogTags.PHOTO_DELETE, 'Photo deletion failed: missing photo ID');
      return NextResponse.json({ error: "Photo ID is required" }, { status: 400 })
    }

    Logger.d(LogTags.PHOTO_DELETE, 'Deletion request parsed', { photoId });

    // Find the photo and check ownership
    const existingPhoto = await photoRepository.findById(photoId)
    if (!existingPhoto) {
      Logger.w(LogTags.PHOTO_DELETE, 'Photo deletion failed: photo not found', { photoId });
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    if (existingPhoto.userId !== session.user.id) {
      Logger.w(LogTags.PHOTO_DELETE, 'Photo deletion failed: unauthorized access', {
        photoId,
        userId: session.user.id,
        uploaderId: existingPhoto.userId
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete photo using repository
    await photoRepository.delete(photoId)

    // Update user stats
    await prisma.userStats.update({
      where: { userId: session.user.id },
      data: { totalPhotos: { increment: -1 } }
    })

    Logger.i(LogTags.PHOTO_DELETE, 'Photo deleted successfully', {
      photoId,
      userId: session.user.id,
      title: existingPhoto.title
    });

    return NextResponse.json({ message: "Photo deleted successfully" })
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in photo deletion: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.PHOTO_DELETE, `Unexpected error in photo deletion: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 })
  }
}
