import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const settings = await prisma.setting.findMany()
  const result: Record<string, string> = {}
  settings.forEach((s) => { result[s.key] = s.value })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json()
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
  return NextResponse.json(setting)
}
