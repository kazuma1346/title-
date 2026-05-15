import { prisma } from "./prisma"

/**
 * メンバーの連続欠席回数を返す（直近の活動から遡って計算）
 */
export async function getConsecutiveAbsences(memberId: number): Promise<number> {
  const participations = await prisma.participation.findMany({
    where: {
      memberId,
      event: { status: "done" },
    },
    include: { event: true },
    orderBy: { event: { createdAt: "desc" } },
  })

  let count = 0
  for (const p of participations) {
    if (!p.joined) {
      count++
    } else {
      break
    }
  }
  return count
}

/**
 * 全メンバーの連続欠席数をまとめて返す
 */
export async function getAllAbsenceCounts(): Promise<Record<number, number>> {
  const members = await prisma.member.findMany({ select: { id: true } })
  const result: Record<number, number> = {}
  await Promise.all(
    members.map(async (m) => {
      result[m.id] = await getConsecutiveAbsences(m.id)
    })
  )
  return result
}
