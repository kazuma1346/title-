import { prisma } from "./prisma"

/**
 * 直前の完了済み活動の繰越金を返す（なければ0）
 */
export async function getPreviousCarryOver(): Promise<number> {
  const lastEvent = await prisma.event.findFirst({
    where: { status: "done" },
    orderBy: { createdAt: "desc" },
  })
  if (!lastEvent) return 0

  const income = await prisma.accountItem.aggregate({
    where: { eventId: lastEvent.id, type: "income" },
    _sum: { amount: true },
  })
  const expense = await prisma.accountItem.aggregate({
    where: { eventId: lastEvent.id, type: "expense" },
    _sum: { amount: true },
  })

  return (income._sum.amount ?? 0) - (expense._sum.amount ?? 0)
}
