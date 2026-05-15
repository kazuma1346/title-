import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const members = await prisma.member.findMany({ orderBy: [{ grade: "asc" }, { name: "asc" }] })
  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const member = await prisma.member.create({ data })
  return NextResponse.json(member, { status: 201 })
}
