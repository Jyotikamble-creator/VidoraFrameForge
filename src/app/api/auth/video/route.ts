import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { VideoController } from "@/server/controllers/video.controller"

/**
 * Single Video API Route
 * Thin route handler that delegates to VideoController
 */

const videoController = new VideoController()

// GET /api/auth/video?id=123
export async function GET(request: NextRequest) {
  return videoController.getVideoById(request)
}
