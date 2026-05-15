import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { eventId, memberId, joined, paid } = await req.json()
  const p = await prisma.participation.upsert({
    where: { eventId_memberId: { eventId, memberId } },
    update: { ...(joined !== undefined && { joined }), ...(paid !== undefined && { paid }) },
    create: { eventId, memberId, joined: joined ?? false, paid: paid ?? false },
  })
  return NextResponse.json(p)
}
