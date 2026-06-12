export interface User {
  _id?: string;
  email: string;
  password?: string;
  role?: "admin" | "manager" | "user";
  name?: string;
  createdAt?: string;
}

export interface SessionUser {
  email: string;
  name?: string;
  image?: string;
  role?: string;
}
