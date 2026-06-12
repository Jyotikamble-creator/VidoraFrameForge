import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { prisma } from "@/server/db"
import { Logger, LogTags, categorizeError, DatabaseError } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  Logger.d(LogTags.JOURNAL_FETCH, 'Individual journal fetch request received', { journalId: params.id });

  try {
    // Fetch journal with author and attachments
    const journal = await prisma.journal.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            email: true
          }
        },
        attachments: true
      }
    })

    if (!journal) {
      Logger.w(LogTags.JOURNAL_FETCH, 'Journal not found', { journalId: params.id });
      return NextResponse.json({ error: "Journal not found" }, { status: 404 })
    }

    Logger.i(LogTags.JOURNAL_FETCH, 'Journal fetched successfully', {
      journalId: params.id,
      title: journal.title
    });

    return NextResponse.json(journal)
  } catch (error) {
    const categorizedError = categorizeError(error);

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in individual journal fetch: ${categorizedError.message}`);
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    Logger.e(LogTags.JOURNAL_FETCH, `Unexpected error in individual journal fetch: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Failed to fetch journal" }, { status: 500 })
  }
}