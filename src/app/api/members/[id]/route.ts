import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({
    where: { id: Number(params.id) },
    include: {
      participations: {
        include: { event: true },
        orderBy: { event: { createdAt: "desc" } },
      },
    },
  })
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(member)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()
  const member = await prisma.member.update({ where: { id: Number(params.id) }, data })
  return NextResponse.json(member)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.member.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
