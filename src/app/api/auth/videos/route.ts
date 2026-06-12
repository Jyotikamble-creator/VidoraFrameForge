import { type NextRequest, NextResponse } from "next/server"
import { VideoController } from "@/server/controllers/video.controller"

/**
 * Video API Routes
 * Thin route handlers that delegate to VideoController
 */

const videoController = new VideoController()

// GET /api/auth/videos?category=gaming&search=tutorial&userId=123&limit=10
export async function GET(request: NextRequest) {
  return videoController.getVideos(request)
}

// POST /api/auth/videos
export async function POST(request: NextRequest) {
  return videoController.createVideo(request)
}
