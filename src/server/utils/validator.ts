import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

export const videoUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  file: z.string().min(1, "Video file (base64 or buffer) is required"),
  fileName: z.string().min(1, "Video file name is required"),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long").optional(),
  email: z.string().email("Invalid email address").optional(),
})
