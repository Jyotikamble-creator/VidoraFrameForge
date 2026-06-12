"use client";

import { ThumbsUp, ThumbsDown, Share2, BookmarkPlus } from "lucide-react";
import { Button } from "@/ui/Button";
import { Video } from "@/types/video/video";
import { formatViews, formatSubscribers } from "@/lib/utils/formatters";

interface VideoInfoProps {
  video: Video;
}

export const VideoInfo = ({ video }: VideoInfoProps) => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">{video.title}</h1>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
              {video.creator?.avatar ? (
                <img
                  src={video.creator.avatar}
                  alt={video.creator.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                video.creator?.name?.charAt(0) || "?"
              )}
            </div>
            <div>
              <div className="font-semibold text-white">{video.creator?.name || "Unknown Creator"}</div>
              <div className="text-sm text-gray-400">
                {formatSubscribers(video.creator?.subscribers || 0)} subscribers
              </div>
            </div>
          </div>
          <Button variant="primary" size="md">
            Subscribe
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#2a3544] rounded-lg overflow-hidden">
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors border-r border-gray-700">
              <ThumbsUp className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {formatViews(video.likes)}
              </span>
            </button>
            <button className="px-4 py-2 hover:bg-white/10 transition-colors">
              <ThumbsDown className="w-5 h-5 text-white" />
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#2a3544] hover:bg-[#3a4554] rounded-lg transition-colors">
            <Share2 className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Share</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#2a3544] hover:bg-[#3a4554] rounded-lg transition-colors">
            <BookmarkPlus className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};