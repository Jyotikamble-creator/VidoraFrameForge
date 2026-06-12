"use client";

import { useCallback } from "react";
import { CloudUpload } from "lucide-react";
import { Button } from "@/ui/Button";
import { isValidVideoFile, isValidFileSize } from "@/lib/uploadHelpers";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
}

export const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && isValidVideoFile(file) && isValidFileSize(file)) {
        onFileSelect(file);
      } else {
        alert("Please select a valid video file (MP4, MOV, AVI, WebM) under 2GB");
      }
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidVideoFile(file) && isValidFileSize(file)) {
      onFileSelect(file);
    } else {
      alert("Please select a valid video file (MP4, MOV, AVI, WebM) under 2GB");
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-purple-500/50 rounded-2xl bg-[#1e2837]/30 p-12 flex flex-col items-center justify-center text-center space-y-6 hover:border-purple-500 transition-colors"
    >
      <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
        <CloudUpload className="w-8 h-8 text-purple-400" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">
          Drag & drop your video file here
        </h3>
        <p className="text-gray-400 text-sm">
          Your video must be in MP4, MOV, or AVI format. Max file size = 2GB.
        </p>
      </div>

      <input
        type="file"
        id="file-upload"
        accept="video/*"
        onChange={handleFileInput}
        className="hidden"
      />
      <label htmlFor="file-upload">
        <Button variant="primary" size="md" as="span" className="cursor-pointer">
          Click to browse
        </Button>
      </label>
    </div>
  );
};