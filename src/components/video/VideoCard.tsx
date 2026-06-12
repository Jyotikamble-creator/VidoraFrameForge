"use client"

import Image from "next/image"
import Link from "next/link"
import { Video } from "@/types/video/video"
import { IVideo } from "@/server/models/Video"

interface VideoCardProps {
  video: Video | IVideo
  onDelete?: (videoId: string) => void
}

export default function VideoCard({ video, onDelete }: VideoCardProps) {
  // Helper function to get uploader name from different possible structures
  const getUploaderName = () => {
    if ('uploader' in video && video.uploader) {
      if (typeof video.uploader === 'object' && 'name' in video.uploader) {
        return video.uploader.name
      }
      if (typeof video.uploader === 'string') {
        return 'Unknown'
      }
    }
    return 'Unknown'
  }

  const getViews = () => {
    if ('views' in video && typeof video.views === 'number') {
      return video.views.toLocaleString()
    }
    return '0'
  }

  const getCreatedAt = () => {
    if ('createdAt' in video && video.createdAt) {
      return new Date(video.createdAt).toLocaleDateString()
    }
    return ''
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete && video._id) {
      onDelete(video._id.toString())
    }
  }

  return (
    <div className="group bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer relative">
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Delete video"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      <Link href={`/video/${video._id}`}>
        <div className="relative w-full aspect-video">
          <Image
            src={video.thumbnailUrl || "/placeholder.svg"}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-white line-clamp-2 mb-2 group-hover:text-purple-300 transition-colors">
            {video.title}
          </h3>
          <p className="text-sm text-gray-400 mb-3">By {getUploaderName()}</p>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {getViews()} views
            </span>
            <span>{getCreatedAt()}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}