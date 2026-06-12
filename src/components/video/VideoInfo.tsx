"use client"

import { Video } from "@/types/video/video"
import { Eye, ThumbsUp, MessageCircle, Share2 } from "lucide-react"

interface VideoInfoProps {
  video: Video
}

export function VideoInfo({ video }: VideoInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{video.views || 0} views</span>
            <span>•</span>
            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 hover:text-blue-600">
              <ThumbsUp className="w-4 h-4" />
              <span>{video.likes || 0}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-blue-600">
              <MessageCircle className="w-4 h-4" />
              <span>{video.comments?.length || 0}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-blue-600">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full shrink-0"></div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{video.uploader?.name || 'Anonymous'}</h3>
          <p className="text-sm text-gray-600">{video.uploader?.subscribers || 0} subscribers</p>
        </div>
        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Subscribe
        </button>
      </div>
    </div>
  )
}