"use client";

import { useState } from "react";
import { Video } from "@/types/video/video";
import { formatViews } from "@/lib/utils/formatters";
import { formatTimeAgo } from "@/lib/utils/formatTimeAgo";

interface VideoDescriptionProps {
  video: Video;
}

export const VideoDescription = ({ video }: VideoDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#2a3544] rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span>{formatViews(video.views)} views</span>
        <span>•</span>
        <span>{formatTimeAgo(video.uploadedAt)}</span>
      </div>

      <p className={`text-gray-300 ${isExpanded ? "" : "line-clamp-2"}`}>
        {video.description}
      </p>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-white font-semibold hover:text-gray-300 transition-colors"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
};