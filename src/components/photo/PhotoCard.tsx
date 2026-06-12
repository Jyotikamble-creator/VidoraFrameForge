"use client"

import Link from "next/link"
import { IPhoto } from "@/server/models/Photo"

interface PhotoCardProps {
  photo: IPhoto
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const getCreatedAt = () => {
    if (photo.createdAt) {
      return new Date(photo.createdAt).toLocaleDateString()
    }
    return ''
  }

  const getUploaderName = () => {
    if (photo.uploader && typeof photo.uploader === 'object' && 'name' in photo.uploader) {
      return photo.uploader.name
    }
    return 'Unknown'
  }

  return (
    <div className="group bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer">
      <div className="relative w-full aspect-square">
        <img
          src={photo.thumbnailUrl || photo.url || "/placeholder.svg"}
          alt={photo.title || 'Photo'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="lightgray"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="black">${photo.title || 'Mock Image'}</text></svg>`)}`;
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {/* Album indicator */}
        {photo.album && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-xs text-white">{photo.album}</span>
          </div>
        )}
        {/* Location indicator */}
        {photo.location && (
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-xs text-white flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {photo.location}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-white line-clamp-2 mb-2 group-hover:text-blue-300 transition-colors">
          {photo.title}
        </h3>
        <p className="text-sm text-gray-400 mb-2">By {getUploaderName()}</p>
        {photo.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{photo.description}</p>
        )}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{getCreatedAt()}</span>
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {photo.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                  #{tag}
                </span>
              ))}
              {photo.tags.length > 2 && (
                <span className="text-gray-500 text-xs">+{photo.tags.length - 2} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}