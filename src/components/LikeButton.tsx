"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Heart, Loader2 } from "lucide-react"
import { ContentType } from "@prisma/client"

interface LikeButtonProps {
  contentType: ContentType
  contentId: string
  initialLikeCount?: number
  initialIsLiked?: boolean
  showCount?: boolean
}

export function LikeButton({
  contentType,
  contentId,
  initialLikeCount = 0,
  initialIsLiked = false,
  showCount = true,
}: LikeButtonProps) {
  const { isAuthenticated } = useAuth()
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch like status on mount
    fetchLikeStatus()
  }, [contentType, contentId])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(
        `/api/likes?contentType=${contentType}&contentId=${contentId}`
      )
      if (response.ok) {
        const data = await response.json()
        setLikeCount(data.likeCount)
        setIsLiked(data.isLiked)
      }
    } catch (error) {
      console.error("Failed to fetch like status:", error)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("Please login to like content")
      return
    }

    setLoading(true)
    try {
      if (isLiked) {
        // Unlike
        const response = await fetch(
          `/api/likes?contentType=${contentType}&contentId=${contentId}`,
          { method: "DELETE" }
        )

        if (response.ok) {
          setIsLiked(false)
          setLikeCount((prev) => Math.max(0, prev - 1))
        }
      } else {
        // Like
        const response = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType, contentId }),
        })

        if (response.ok) {
          setIsLiked(true)
          setLikeCount((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error("Like action failed:", error)
      alert("Failed to update like status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
        isLiked
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
      )}
      {showCount && <span>{likeCount}</span>}
    </button>
  )
}
