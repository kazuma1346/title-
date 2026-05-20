import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const { eventId, type, name, amount } = await req.json()
  const item = await prisma.budgetItem.create({
    data: { eventId, type, name, amount }
  })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest) {
  const { id, name, amount } = await req.json()
  const item = await prisma.budgetItem.update({
    where: { id },
    data: { name, amount }
  })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await prisma.budgetItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
