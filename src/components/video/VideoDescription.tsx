"use client"

import { useState } from "react"
import { Video } from "@/types/video/video"

interface VideoDescriptionProps {
  video: Video
}

export function VideoDescription({ video }: VideoDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const description = video.description || "No description available."
  const shouldTruncate = description.length > 200

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-900">
        {shouldTruncate && !isExpanded ? (
          <>
            {description.substring(0, 200)}...
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              Show more
            </button>
          </>
        ) : (
          <>
            {description}
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-blue-600 hover:text-blue-800 ml-1 block mt-2"
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>

      {video.tags && video.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {video.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}