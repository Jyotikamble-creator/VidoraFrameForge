"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"

interface FollowButtonProps {
  userId: string
  initialFollowing?: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({ userId, initialFollowing = false, onFollowChange }: FollowButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  // Can't follow yourself
  if (user?.id === userId) {
    return null
  }

  const handleFollow = async () => {
    if (!isAuthenticated) {
      alert("Please login to follow users")
      return
    }

    setLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/follows?userId=${userId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setIsFollowing(false)
          onFollowChange?.(false)
        } else {
          throw new Error("Failed to unfollow")
        }
      } else {
        // Follow
        const response = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })

        if (response.ok) {
          setIsFollowing(true)
          onFollowChange?.(true)
        } else {
          const data = await response.json()
          throw new Error(data.error || "Failed to follow")
        }
      }
    } catch (error) {
      console.error("Follow action failed:", error)
      alert(error instanceof Error ? error.message : "Failed to update follow status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
        isFollowing
          ? "bg-gray-600 hover:bg-gray-700 text-white"
          : "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </button>
  )
}
