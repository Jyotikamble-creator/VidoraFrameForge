"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface VideoPlayerProps {
  thumbnail: string;
  title: string;
}

export const VideoPlayer = ({ thumbnail, title }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 group">
      <Image
        src={thumbnail}
        alt={title}
        fill
        className="object-cover"
        priority
      />
      
      {!isPlaying && (
        <button
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110">
            <Play className="w-10 h-10 text-gray-900 fill-gray-900 ml-1" />
          </div>
        </button>
      )}

      {/* Duration badge */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white text-sm px-2 py-1 rounded">
        12:47
      </div>
    </div>
  );
};