"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "social";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  as?: "button" | "span";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, fullWidth, as = "button", className, children, ...props }, ref) => {
    const Component = as === "span" ? "span" : "button";

    return (
      <Component
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500": variant === "primary",
            "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500": variant === "secondary",
            "border border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-gray-500": variant === "outline",
            "hover:bg-gray-700 text-gray-300 focus:ring-gray-500": variant === "ghost",
            "bg-[#1a2332] hover:bg-[#1f2937] text-white border border-gray-700/50 hover:border-gray-600/50": variant === "social",
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
            "w-full": fullWidth,
          },
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </Component>
    );
  }
);

Button.displayName = "Button";