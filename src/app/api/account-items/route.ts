import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const data = await req.json()
  const item = await prisma.accountItem.create({ data })
  return NextResponse.json(item, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { id, ...data } = await req.json()
  const item = await prisma.accountItem.update({ where: { id }, data })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await prisma.accountItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
