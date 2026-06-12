"use client"

import { Video } from "@/types/video/video"
import VideoCard from "./VideoCard"

interface UpNextSidebarProps {
  videos: Video[]
  currentVideoId?: string
}

export function UpNextSidebar({ videos, currentVideoId }: UpNextSidebarProps) {
  const filteredVideos = videos.filter(video => video._id !== currentVideoId).slice(0, 10)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Up Next</h3>

      <div className="space-y-3">
        {filteredVideos.map((video) => (
          <div key={video._id} className="flex space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <div className="shrink-0">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-20 h-12 object-cover rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {video.title}
              </h4>
              <p className="text-xs text-gray-600 truncate">
                {video.uploader?.name || 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500">
                {video.views || 0} views
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}