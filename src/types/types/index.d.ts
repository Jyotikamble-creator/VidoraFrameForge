// General status types
export type Status = "idle" | "loading" | "success" | "error";

// API Response Format
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}
