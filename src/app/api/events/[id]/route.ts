import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: Number(params.id) },
    include: {
      participations: { include: { member: true } },
      accountItems: true,
      budgetItems: true,
    },
  })
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(event)
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()
  const event = await prisma.event.update({
    where: { id: Number(params.id) },
    data,
    include: { 
      participations: { include: { member: true } }, 
      accountItems: true,
      budgetItems: true,
    },
  })
  return NextResponse.json(event)
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.event.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
