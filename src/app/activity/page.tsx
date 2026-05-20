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
  
  const load = () => {
    fetch("/api/events").then(r => r.json()).then((evs: Event[]) =>
      setEvents(evs.filter(e => e.status === "done"))
    )
  }

  useEffect(() => { load() }, [])

  const deleteEvent = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("この活動を削除しますか？")) return
    await fetch(`/api/events/${id}`, { method: "DELETE" })
    load()
  }

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
              <button 
                onClick={(e) => deleteEvent(ev.id, e)}
                className="text-red-400 hover:text-red-600 text-sm font-bold px-2 mr-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
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
