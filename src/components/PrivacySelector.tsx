"use client"

import { Globe, Lock, Users } from "lucide-react"

interface PrivacySelectorProps {
  value: "public" | "private" | "friends"
  onChange: (value: "public" | "private" | "friends") => void
  disabled?: boolean
}

export function PrivacySelector({ value, onChange, disabled = false }: PrivacySelectorProps) {
  const options = [
    {
      value: "public" as const,
      label: "Public",
      description: "Anyone can see this",
      icon: Globe,
    },
    {
      value: "friends" as const,
      label: "Friends",
      description: "Only people you follow",
      icon: Users,
    },
    {
      value: "private" as const,
      label: "Private",
      description: "Only you can see this",
      icon: Lock,
    },
  ]

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Privacy Setting
      </label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <Icon
                  className={`w-6 h-6 ${
                    isSelected ? "text-purple-400" : "text-gray-400"
                  }`}
                />
                <div>
                  <div
                    className={`font-semibold ${
                      isSelected ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {option.description}
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
