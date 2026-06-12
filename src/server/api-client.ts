// FIX: Complete the incomplete implementation
import type { IVideo } from "@/server/models/Video"

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
}

export type VideoFormData = Omit<IVideo, "_id">

class ApiClient {
  private async fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = options

    const defaultHeaders = {
      "Content-Type": "application/json",
      ...headers,
    }

    // FIX: Proper fetch implementation
    const response = await fetch(`/api/auth${endpoint}`, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(await response.text())
    }

    return response.json()
  }

  async getVideos() {
    return this.fetchApi("/videos")
  }

  async uploadVideo(videoData: VideoFormData) {
    return this.fetchApi("/videos", {
      method: "POST",
      body: videoData,
    })
  }

  async getVideoById(id: string) {
    return this.fetchApi(`/video?id=${id}`)
  }
}

export const apiClient = new ApiClient()
