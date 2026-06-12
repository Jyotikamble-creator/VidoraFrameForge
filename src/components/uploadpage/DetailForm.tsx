"use client";

import { useState } from "react";
import { Input } from "@/ui/Input";
import { Textarea } from "@/ui/Textarea";
import { Select } from "@/ui/Select";

interface VideoDetailsFormProps {
  title: string;
  description: string;
  category: string;
  tags: string[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
}

const categoryOptions = [
  { value: "gaming", label: "Gaming" },
  { value: "education", label: "Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "technology", label: "Technology" },
  { value: "vlog", label: "Vlog" },
  { value: "other", label: "Other" },
];

export const VideoDetailsForm = ({
  title,
  description,
  category,
  tags,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onTagsChange,
}: VideoDetailsFormProps) => {
  const [tagInput, setTagInput] = useState("");

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Video Details</h2>

      <Input
        label="Title"
        required
        placeholder="Enter a catchy title for your video"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        helperText="Max 100 characters"
        maxLength={100}
      />

      <Textarea
        label="Description"
        placeholder="Tell viewers about your video"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        rows={5}
      />

      <Select
        label="Category"
        options={categoryOptions}
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Tags</label>
        <Input
          placeholder="Add tags separated by commas"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInput}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() => onTagsChange(tags.filter((_, i) => i !== index))}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
