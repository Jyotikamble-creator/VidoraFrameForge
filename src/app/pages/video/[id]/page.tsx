"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/ui/Loader";
import VideoPlayer from "@/components/video/VideoPlayer";
import { IVideo } from "@/server/models/Video";

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [video, setVideo] = useState<IVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && params.id) {
      fetchVideo();
    }
  }, [isAuthenticated, params.id]);

  const fetchVideo = async () => {
    try {
      setVideoLoading(true);
      const response = await fetch(`/api/auth/video?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setVideo(data);
      } else if (response.status === 404) {
        console.error("Video not found");
        router.push("/video");
      } else {
        console.error("Failed to fetch video");
      }
    } catch (error) {
      console.error("Error fetching video:", error);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const response = await fetch(`/api/auth/videos/${video!._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/video");
      } else {
        console.error("Failed to delete video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  if (loading || videoLoading) return <Loader fullscreen />;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Please login to view this video</p>
          <a href="/auth/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Login
          </a>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Video not found</p>
          <a href="/video" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Back to Videos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/video")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Videos
          </button>
        </div>

        {/* Video Player */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
          <VideoPlayer
            src={video.videoUrl}
            poster={video.thumbnailUrl}
          />
        </div>

        {/* Video Info */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
              <div className="flex items-center text-sm text-gray-400 mb-4">
                <span>{video.views || 0} views</span>
                <span className="mx-2">•</span>
                <span>{new Date(video.createdAt || Date.now()).toLocaleDateString()}</span>
                {video.uploader && typeof video.uploader === 'object' && 'name' in video.uploader ? (
                  <>
                    <span className="mx-2">•</span>
                    <span>by {video.uploader.name || video.uploader.email}</span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Delete Button (only for video owner) */}
            {user?.id === video.uploader?._id?.toString() && (
              <button
                onClick={handleDeleteVideo}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-600/30"
              >
                Delete Video
              </button>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-gray-300 whitespace-pre-wrap">{video.description}</p>
            </div>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm border border-purple-600/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          {video.category && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-sm border border-blue-600/30">
                {video.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}