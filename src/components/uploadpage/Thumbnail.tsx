"use client";

import { Upload } from "lucide-react";
import Image from "next/image";
import { ThumbnailOption } from "@/types/upload";

interface ThumbnailSelectorProps {
  thumbnails: ThumbnailOption[];
  selectedThumbnail: string | null;
  onThumbnailSelect: (id: string) => void;
  onCustomUpload: (file: File) => void;
}

export const ThumbnailSelector = ({
  thumbnails,
  selectedThumbnail,
  onThumbnailSelect,
  onCustomUpload,
}: ThumbnailSelectorProps) => {
  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCustomUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Choose a Thumbnail</h3>

      <div className="grid grid-cols-4 gap-4">
        {thumbnails.map((thumb) => (
          <button
            key={thumb.id}
            onClick={() => onThumbnailSelect(thumb.id)}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
              selectedThumbnail === thumb.id
                ? "border-purple-500 ring-2 ring-purple-500/50"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <Image
              src={thumb.url}
              alt="Thumbnail option"
              fill
              className="object-cover"
            />
          </button>
        ))}

        {/* Custom Upload */}
        <label
          htmlFor="thumbnail-upload"
          className="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-700 hover:border-purple-500 transition-colors cursor-pointer flex flex-col items-center justify-center bg-[#1e2837] group"
        >
          <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
          <span className="text-xs text-gray-400 mt-2">Upload</span>
          <input
            type="file"
            id="thumbnail-upload"
            accept="image/*"
            onChange={handleCustomUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
