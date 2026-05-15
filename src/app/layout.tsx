import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Circle Admin",
  description: "サークル管理アプリ",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" style={{ colorScheme: "light" }}>
      <body>{children}</body>
    </html>
  )
}
