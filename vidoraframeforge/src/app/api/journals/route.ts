export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/server/db"
import { journalRepository } from "@/server/repositories/journalRepository"
import { authOptions } from "@/server/auth-config/auth"
import { Logger, LogTags, categorizeError, ValidationError, DatabaseError } from "@/lib/logger"
import { isValidVideoTitle, sanitizeString } from "@/lib/validation"

export async function GET(request: NextRequest) {
  Logger.d(LogTags.JOURNAL_FETCH, 'Journal fetch request received');

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const tag = searchParams.get("tag")
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "50")

    Logger.d(LogTags.JOURNAL_FETCH, 'Query parameters parsed', { hasSearch: !!search, tag, userId, limit });

    // Build filters for Prisma
    const filters: any = {}
    
    if (userId) {
      filters.authorId = userId
    } else {
      filters.privacy = "public"
    }

    if (tag) {
      filters.tags = { hasSome: [tag] }
    }

    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch journals with includes
    const journals = await prisma.journal.findMany({
      where: filters,
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
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    Logger.i(LogTags.JOURNAL_FETCH, `Journals fetched successfully: ${journals.length} journals returned`);
    return NextResponse.json(journals)
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in journal fetch: ${categorizedError.message}`);
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.JOURNAL_FETCH, `Unexpected error in journal fetch: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to fetch journals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  Logger.d(LogTags.JOURNAL_CREATE, 'Journal creation request received');

  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      Logger.w(LogTags.JOURNAL_CREATE, 'Journal creation failed: unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    Logger.d(LogTags.JOURNAL_CREATE, 'User authenticated', { userId: session.user.id });

    const body = await request.json()
    const { title, content, tags, attachments, isPublic, mood, location } = body

    Logger.d(LogTags.JOURNAL_CREATE, 'Request body parsed', {
      hasTitle: !!title,
      hasContent: !!content,
      tagsCount: tags?.length || 0,
      attachmentsCount: attachments?.length || 0
    });

    // Validate required fields
    if (!title || !content) {
      Logger.w(LogTags.JOURNAL_CREATE, 'Journal creation failed: missing required fields', {
        hasTitle: !!title,
        hasContent: !!content
      });
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Validate title
    if (!isValidVideoTitle(title)) {
      Logger.w(LogTags.JOURNAL_CREATE, 'Journal creation failed: invalid title', { title });
      return NextResponse.json({ error: "Title must be between 1 and 100 characters" }, { status: 400 })
    }

    // Validate content length
    if (content.length > 10000) {
      Logger.w(LogTags.JOURNAL_CREATE, 'Journal creation failed: content too long');
      return NextResponse.json({ error: "Content must be less than 10,000 characters" }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedContent = sanitizeString(content);
    const sanitizedMood = mood ? sanitizeString(mood) : undefined;
    const sanitizedLocation = location ? sanitizeString(location) : undefined;

    Logger.d(LogTags.JOURNAL_CREATE, 'Input validation passed', { title: sanitizedTitle });

    // Create journal using repository
    const journal = await journalRepository.create({
      title: sanitizedTitle,
      content: sanitizedContent,
      authorId: session.user.id,
      tags: tags || [],
      privacy: isPublic === false ? "private" : "public",
      mood: sanitizedMood,
    })

    // Create attachments if provided
    if (attachments && attachments.length > 0) {
      await Promise.all(
        attachments.map((attachment: any) =>
          prisma.journalAttachment.create({
            data: {
              journalId: journal.id,
              url: attachment.url,
              type: attachment.type
            }
          })
        )
      )
    }

    // Update user stats
    await prisma.userStats.update({
      where: { userId: session.user.id },
      data: { totalJournals: { increment: 1 } }
    })

    // Fetch with attachments
    const populatedJournal = await journalRepository.findById(journal.id)

    Logger.i(LogTags.JOURNAL_CREATE, 'Journal created successfully', {
      journalId: journal.id,
      userId: session.user.id,
      title: sanitizedTitle
    });

    return NextResponse.json(populatedJournal, { status: 201 })
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof ValidationError) {
      Logger.e(LogTags.JOURNAL_CREATE, `Validation error in journal creation: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: categorizedError.message }, { status: 400 });
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in journal creation: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.JOURNAL_CREATE, `Unexpected error in journal creation: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to create journal" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  Logger.d(LogTags.JOURNAL_UPDATE, 'Journal update request received');

  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      Logger.w(LogTags.JOURNAL_UPDATE, 'Journal update failed: unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    Logger.d(LogTags.JOURNAL_UPDATE, 'User authenticated', { userId: session.user.id });

    const { searchParams } = new URL(request.url)
    const journalId = searchParams.get("id")

    if (!journalId) {
      Logger.w(LogTags.JOURNAL_UPDATE, 'Journal update failed: missing journal ID');
      return NextResponse.json({ error: "Journal ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { title, content, tags, attachments, isPublic, mood, location } = body

    Logger.d(LogTags.JOURNAL_UPDATE, 'Update request body parsed', {
      journalId,
      hasTitle: !!title,
      hasContent: !!content,
      tagsCount: tags?.length || 0,
      attachmentsCount: attachments?.length || 0
    });

    // Find the journal and check ownership
    const existingJournal = await journalRepository.findById(journalId)
    if (!existingJournal) {
      Logger.w(LogTags.JOURNAL_UPDATE, 'Journal update failed: journal not found', { journalId });
      return NextResponse.json({ error: "Journal not found" }, { status: 404 })
    }

    if (existingJournal.authorId !== session.user.id) {
      Logger.w(LogTags.JOURNAL_UPDATE, 'Journal update failed: unauthorized access', {
        journalId,
        userId: session.user.id,
        authorId: existingJournal.authorId
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Validate title if provided
    if (title && !isValidVideoTitle(title)) {
      Logger.w(LogTags.JOURNAL_UPDATE, 'Journal update failed: invalid title', { title });
      return NextResponse.json({ error: "Title must be between 1 and 100 characters" }, { status: 400 })
    }

    // Validate content length if provided
    if (content && content.length > 10000) {
      Logger.w(LogTags.JOURNAL_UPDATE, 'Journal update failed: content too long');
      return NextResponse.json({ error: "Content must be less than 10,000 characters" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = sanitizeString(title);
    if (content !== undefined) updateData.content = sanitizeString(content);
    if (tags !== undefined) updateData.tags = tags;
    if (isPublic !== undefined) updateData.privacy = isPublic ? "public" : "private";
    if (mood !== undefined) updateData.mood = mood ? sanitizeString(mood) : null;
    if (location !== undefined) updateData.location = location ? sanitizeString(location) : null;
    updateData.updatedAt = new Date();

    Logger.d(LogTags.JOURNAL_UPDATE, 'Update data prepared', { journalId });

    // Update journal
    const updatedJournal = await journalRepository.update(journalId, updateData)

    // Update attachments if provided
    if (attachments !== undefined) {
      // Delete existing attachments
      await prisma.journalAttachment.deleteMany({ where: { journalId } })
      
      // Create new attachments
      if (attachments.length > 0) {
        await Promise.all(
          attachments.map((attachment: any) =>
            prisma.journalAttachment.create({
              data: {
                journalId,
                url: attachment.url,
                type: attachment.type
              }
            })
          )
        )
      }
    }

    Logger.i(LogTags.JOURNAL_UPDATE, 'Journal updated successfully', {
      journalId,
      userId: session.user.id,
      title: updatedJournal?.title
    });

    return NextResponse.json(updatedJournal)
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof ValidationError) {
      Logger.e(LogTags.JOURNAL_UPDATE, `Validation error in journal update: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: categorizedError.message }, { status: 400 });
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in journal update: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.JOURNAL_UPDATE, `Unexpected error in journal update: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to update journal" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  Logger.d(LogTags.JOURNAL_DELETE, 'Journal deletion request received');

  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      Logger.w(LogTags.JOURNAL_DELETE, 'Journal deletion failed: unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    Logger.d(LogTags.JOURNAL_DELETE, 'User authenticated', { userId: session.user.id });

    const { searchParams } = new URL(request.url)
    const journalId = searchParams.get("id")

    if (!journalId) {
      Logger.w(LogTags.JOURNAL_DELETE, 'Journal deletion failed: missing journal ID');
      return NextResponse.json({ error: "Journal ID is required" }, { status: 400 })
    }

    Logger.d(LogTags.JOURNAL_DELETE, 'Deletion request parsed', { journalId });

    // Find the journal and check ownership
    const existingJournal = await journalRepository.findById(journalId)
    if (!existingJournal) {
      Logger.w(LogTags.JOURNAL_DELETE, 'Journal deletion failed: journal not found', { journalId });
      return NextResponse.json({ error: "Journal not found" }, { status: 404 })
    }

    if (existingJournal.authorId !== session.user.id) {
      Logger.w(LogTags.JOURNAL_DELETE, 'Journal deletion failed: unauthorized access', {
        journalId,
        userId: session.user.id,
        authorId: existingJournal.authorId
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete journal using repository (cascades to attachments)
    await journalRepository.delete(journalId)

    // Update user stats
    await prisma.userStats.update({
      where: { userId: session.user.id },
      data: { totalJournals: { increment: -1 } }
    })

    Logger.i(LogTags.JOURNAL_DELETE, 'Journal deleted successfully', {
      journalId,
      userId: session.user.id,
      title: existingJournal.title
    });

    return NextResponse.json({ message: "Journal deleted successfully" })
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in journal deletion: ${categorizedError.message}`, { error: categorizedError });
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.JOURNAL_DELETE, `Unexpected error in journal deletion: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to delete journal" }, { status: 500 })
  }
}
