import { SessionOptions } from "iron-session"

export interface SessionData {
  userId?: number
  userName?: string
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "fallback-secret-change-in-production-32chars",
  cookieName: "circle-admin-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1週間
  },
}
