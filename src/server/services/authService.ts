import axios from "axios"

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export const authService = {
  async login(data: LoginData) {
    // NextAuth handles login through signIn function, not direct API calls
    throw new Error("Use NextAuth signIn function for authentication")
  },

  async register(data: RegisterData) {
    const response = await axios.post("/api/auth/register", data)
    return response.data
  },

  async logout() {
    // Handle logout logic (clear tokens, etc.)
    localStorage.removeItem("token")
  }
}

export const { login, register, logout } = authService
export default authService