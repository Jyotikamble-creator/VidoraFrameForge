import { NextRequest, NextResponse } from "next/server"
import { VideoController } from "@/server/controllers/video.controller"

/**
 * Video by ID API Routes
 * Thin route handlers that delegate to VideoController
 */

const videoController = new VideoController()

// DELETE /api/auth/videos/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return videoController.deleteVideo(request, params.id)
}

