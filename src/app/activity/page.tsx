"use client"
import { useEffect, useState } from "react"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"

type Event = {
  id: number; name: string; date: string | null; location: string | null
  feePerPerson: number; status: string
  participations: { joined: boolean; memberId: number }[]
  accountItems: { type: string; amount: number }[]
}

export default function ActivityPage() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then((evs: Event[]) =>
      setEvents(evs.filter(e => e.status === "done"))
    )
  }, [])

  return (
    <AppLayout>
      <p className="section-title">過去の活動</p>
      {events.length === 0 && (
        <div className="card text-center text-gray-400 text-sm py-10">完了した活動はありません</div>
      )}
      {events.map(ev => {
        const income = ev.accountItems?.filter(i => i.type === "income").reduce((s, i) => s + i.amount, 0) ?? 0
        const expense = ev.accountItems?.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0) ?? 0
        const joinedCount = ev.participations?.filter(p => p.joined).length ?? 0
        return (
          <Link key={ev.id} href={`/activity/${ev.id}`}>
            <div className="card flex items-center gap-3">
              <div className="flex-1">
                <p className="text-primary-900 font-semibold text-sm">{ev.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {ev.date ? new Date(ev.date).toLocaleDateString("ja-JP") : "日程未定"}
                  {ev.location ? ` · ${ev.location}` : ""}
                  {` · ${joinedCount}名参加`}
                </p>
                <div className="flex gap-3 mt-1.5 text-xs">
                  <span className="text-green-600 font-medium">¥{income.toLocaleString()}</span>
                  <span className="text-red-500 font-medium">¥{expense.toLocaleString()}</span>
                  <span className="text-primary-500 font-medium">繰越 ¥{(income - expense).toLocaleString()}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )
      })}
    </AppLayout>
  )
}
