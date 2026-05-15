import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPreviousCarryOver } from "@/lib/carryover"

export async function GET() {
  const events = await prisma.event.findMany({
    include: {
      participations: { include: { member: true } },
      accountItems: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const carryOver = await getPreviousCarryOver()
  const event = await prisma.event.create({
    data: { ...data, carryOver },
    include: { participations: true, accountItems: true },
  })
  return NextResponse.json(event, { status: 201 })
}
