import { userRepository } from "@/server/repositories/userRepository"
import { Logger, LogTags } from "@/lib/logger"

export const findUserByEmail = async (email: string) => {
  try {
    return await userRepository.findByEmail(email)
  } catch (error) {
    Logger.e(LogTags.DB_QUERY, `Error finding user by email: ${String(error)}`)
    throw error
  }
}

export const findUserById = async (userId: string) => {
  try {
    return await userRepository.findById(userId)
  } catch (error) {
    Logger.e(LogTags.DB_QUERY, `Error finding user by ID: ${String(error)}`)
    throw error
  }
}

export const updateUser = async (userId: string, updates: object) => {
  try {
    return await userRepository.update(userId, updates)
  } catch (error) {
    Logger.e(LogTags.DB_QUERY, `Error updating user: ${String(error)}`)
    throw error
  }
}
