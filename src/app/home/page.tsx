"use client"
import { useEffect, useState } from "react"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"

type Event = { id: number; name: string; date: string | null; location: string | null; status: string; participations: { joined: boolean; paid: boolean }[] }
type Member = { id: number; name: string; grade: number; department: string }
type AbsenceInfo = { member: Member; count: number }

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [absences, setAbsences] = useState<AbsenceInfo[]>([])
  const [totalBalance, setTotalBalance] = useState(0)

  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then(setEvents)
    fetch("/api/members").then(r => r.json()).then(async (members: Member[]) => {
      const eventsData = await fetch("/api/events").then(r => r.json())
      const doneEvents = eventsData.filter((e: Event) => e.status === "done")
        .sort((a: Event, b: Event) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())

      const absenceList: AbsenceInfo[] = members.map((m: Member) => {
        let count = 0
        for (const ev of doneEvents) {
          const p = ev.participations?.find((p: { memberId: number }) => p.memberId === m.id)
          if (!p || !p.joined) count++
          else break
        }
        return { member: m, count }
      }).filter((a: AbsenceInfo) => a.count >= 3).sort((a: AbsenceInfo, b: AbsenceInfo) => b.count - a.count)
      setAbsences(absenceList)
    })
  }, [])

  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then((evs: (Event & { accountItems: { type: string; amount: number }[] })[]) => {
      let balance = 0
      evs.filter(e => e.status === "done").forEach(e => {
        const inc = e.accountItems?.filter(i => i.type === "income").reduce((s, i) => s + i.amount, 0) ?? 0
        const exp = e.accountItems?.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0) ?? 0
        balance += inc - exp
      })
      setTotalBalance(balance)
    })
  }, [])

  const activeEvents = events.filter(e => e.status === "active")
  const latestEvent = activeEvents[0]

  return (
    <AppLayout>
      {/* 残高カード */}
      <div className="bg-primary-900 rounded-2xl p-5 mb-3 text-center">
        <p className="text-primary-100 text-xs mb-1 opacity-80">サークル総資金</p>
        <p className="text-white text-3xl font-bold">¥{totalBalance.toLocaleString()}</p>
      </div>

      {/* 直近の企画 */}
      <div className="mb-1">
        <p className="section-title">直近の企画</p>
        {latestEvent ? (
          <Link href={`/plan/${latestEvent.id}`}>
            <div className="card">
              <p className="text-primary-900 font-semibold text-sm">{latestEvent.name}</p>
              <p className="text-gray-400 text-xs mt-1">
                {latestEvent.date ? new Date(latestEvent.date).toLocaleDateString("ja-JP") : "日程未定"}
                {latestEvent.location ? ` · ${latestEvent.location}` : ""}
              </p>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>参加 {latestEvent.participations?.filter(p => p.joined).length ?? 0}名</span>
                <span>集金済 {latestEvent.participations?.filter(p => p.paid).length ?? 0}名</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="card text-center text-gray-400 text-sm py-6">進行中の企画はありません</div>
        )}
      </div>

      {/* 連続欠席アラート */}
      {absences.length > 0 && (
        <>
          <p className="section-title mt-2">連続欠席アラート</p>
          {absences.map(({ member, count }) => (
            <Link key={member.id} href={`/members/${member.id}`}>
              <div className={`rounded-2xl p-4 mb-2 flex items-center gap-3 ${count >= 4 ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${count >= 4 ? "bg-red-400" : "bg-amber-400"}`} />
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${count >= 4 ? "text-red-800" : "text-amber-800"}`}>{member.name}</p>
                  <p className={`text-xs ${count >= 4 ? "text-red-500" : "text-amber-600"}`}>
                    {count}回連続欠席
                    {count >= 4 ? " · 除名まであと1回" : " · 注意"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </>
      )}
    </AppLayout>
  )
}
