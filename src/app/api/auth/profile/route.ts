import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/server/auth-config/auth"
import { Logger, LogTags, categorizeError, ValidationError, DatabaseError, AuthenticationError } from "@/lib/logger"
import { isValidEmail } from "@/lib/validation"
import * as bcrypt from "bcryptjs"
import { prisma } from "@/server/db"

export async function PUT(request: NextRequest) {
  Logger.d(LogTags.USER_UPDATE, 'Profile update request received')

  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      Logger.w(LogTags.USER_UPDATE, 'Profile update failed: unauthorized access attempt')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    Logger.d(LogTags.USER_UPDATE, 'User authenticated', { userId: session.user.id })

    const body = await request.json()
    const { name, email, avatar, currentPassword, newPassword } = body

    Logger.d(LogTags.USER_UPDATE, 'Request body parsed', {
      hasName: !!name,
      hasEmail: !!email,
      hasAvatar: !!avatar,
      hasNewPassword: !!newPassword
    })

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      Logger.w(LogTags.USER_UPDATE, 'Profile update failed: user not found', { userId: session.user.id })
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const errors: Record<string, string> = {}

    // Validate name
    if (name !== undefined) {
      if (!name.trim()) {
        errors.name = "Name is required"
      } else if (name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters"
      } else if (name.trim().length > 50) {
        errors.name = "Name cannot exceed 50 characters"
      }
    }

    // Validate email
    if (email !== undefined) {
      if (!email.trim()) {
        errors.email = "Email is required"
      } else if (!isValidEmail(email.trim())) {
        errors.email = "Please enter a valid email"
      } else {
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            email: email.trim().toLowerCase(),
            NOT: { id: session.user.id }
          }
        })
        if (existingUser) {
          errors.email = "Email is already taken"
        }
      }
    }

    // Validate password change
    if (newPassword) {
      if (!currentPassword) {
        errors.currentPassword = "Current password is required to change password"
      } else {
        // Verify current password
        const isCurrentPasswordValid = user.password ? await bcrypt.compare(currentPassword, user.password) : false
        if (!isCurrentPasswordValid) {
          errors.currentPassword = "Current password is incorrect"
        }
      }

      if (newPassword.length < 6) {
        errors.newPassword = "New password must be at least 6 characters"
      }
    }

    // Return validation errors
    if (Object.keys(errors).length > 0) {
      Logger.w(LogTags.USER_UPDATE, 'Profile update failed: validation errors', { errors })
      return NextResponse.json({ errors }, { status: 400 })
    }

    // Prepare update data
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.firstName = name.trim()
    if (email !== undefined) updateData.email = email.trim().toLowerCase()
    if (avatar !== undefined) updateData.avatar = avatar.trim() || ""
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    Logger.d(LogTags.USER_UPDATE, 'Update data prepared', {
      hasName: 'firstName' in updateData,
      hasEmail: 'email' in updateData,
      hasAvatar: 'avatar' in updateData,
      hasPassword: 'password' in updateData
    })

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        email: true,
        avatar: true,
        role: true
      }
    })

    if (!updatedUser) {
      Logger.e(LogTags.USER_UPDATE, 'Profile update failed: user not found after update', { userId: session.user.id })
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    Logger.i(LogTags.USER_UPDATE, 'Profile updated successfully', {
      userId: session.user.id,
      updatedFields: Object.keys(updateData)
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.firstName,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role
      }
    })

  } catch (error) {
    const categorizedError = categorizeError(error)

    if (categorizedError instanceof ValidationError) {
      Logger.e(LogTags.USER_UPDATE, `Validation error in profile update: ${categorizedError.message}`, { error: categorizedError })
      return NextResponse.json({ error: categorizedError.message }, { status: 400 })
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in profile update: ${categorizedError.message}`, { error: categorizedError })
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (categorizedError instanceof AuthenticationError) {
      Logger.w(LogTags.USER_UPDATE, `Authentication error in profile update: ${categorizedError.message}`, { error: categorizedError })
      return NextResponse.json({ error: categorizedError.message }, { status: 401 })
    }

    Logger.e(LogTags.USER_UPDATE, `Unexpected error in profile update: ${categorizedError.message}`, { error: categorizedError })
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}