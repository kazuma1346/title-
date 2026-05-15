"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"

type Member = { id: number; name: string; grade: number; department: string }
type Participation = { memberId: number; joined: boolean; member: Member }
type AccountItem = { id: number; type: string; name: string; amount: number }
type Event = {
  id: number; name: string; date: string | null; location: string | null
  feePerPerson: number; note: string | null; carryOver: number
  participations: Participation[]; accountItems: AccountItem[]
}

export default function ActivityDetailPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [membersOpen, setMembersOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/events/${params.id}`).then(r => r.json()).then(setEvent)
  }, [params.id])

  if (!event) return <AppLayout><div className="text-center text-gray-400 py-20">読み込み中...</div></AppLayout>

  const joined = event.participations.filter(p => p.joined)
  const income = event.accountItems.filter(i => i.type === "income").reduce((s, i) => s + i.amount, 0)
  const expense = event.accountItems.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0)
  const incomeItems = event.accountItems.filter(i => i.type === "income")
  const expenseItems = event.accountItems.filter(i => i.type === "expense")

  return (
    <AppLayout>
      <Link href="/activity" className="flex items-center gap-1 text-primary-500 text-sm mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        活動一覧
      </Link>

      {/* 基本情報 */}
      <div className="card">
        <h2 className="text-primary-900 font-bold text-lg mb-2">{event.name}</h2>
        {event.date && <p className="text-gray-500 text-sm">{new Date(event.date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</p>}
        {event.location && <p className="text-gray-500 text-sm">{event.location}</p>}
        {event.feePerPerson > 0 && <p className="text-gray-500 text-sm">参加費 ¥{event.feePerPerson.toLocaleString()}/人</p>}
      </div>

      {/* 参加メンバー */}
      <div className="card">
        <p className="section-title">参加メンバー（{joined.length}名）</p>
        {joined.slice(0, 3).map(p => (
          <div key={p.memberId} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-sm text-gray-700">{p.member.name}</span>
          </div>
        ))}
        {joined.length > 3 && (
          <div className="relative">
            {membersOpen ? (
              <>
                {joined.slice(3).map(p => (
                  <div key={p.memberId} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-sm text-gray-700">{p.member.name}</span>
                  </div>
                ))}
                <button onClick={() => setMembersOpen(false)} className="w-full text-center text-xs text-gray-400 py-2">▲ 閉じる</button>
              </>
            ) : (
              <div className="relative" onClick={() => setMembersOpen(true)} style={{ cursor: "pointer" }}>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-white pointer-events-none" />
                <p className="text-center text-xs text-gray-400 pt-2 pb-1">他{joined.length - 3}名</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 会計 */}
      <div className="card">
        <p className="section-title">会計</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-gray-400 mb-1">収入合計</p><p className="font-bold text-sm text-green-600">¥{income.toLocaleString()}</p></div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-gray-400 mb-1">支出合計</p><p className="font-bold text-sm text-red-500">¥{expense.toLocaleString()}</p></div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-gray-400 mb-1">繰越金</p><p className="font-bold text-sm text-primary-500">¥{(income - expense).toLocaleString()}</p></div>
        </div>
        {incomeItems.length > 0 && (
          <>
            <p className="text-xs font-bold text-gray-400 mb-2 tracking-wide">収入の部</p>
            {incomeItems.map(item => (
              <div key={item.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-semibold text-green-600">¥{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </>
        )}
        {expenseItems.length > 0 && (
          <>
            <p className="text-xs font-bold text-gray-400 mb-2 mt-3 tracking-wide">支出の部</p>
            {expenseItems.map(item => (
              <div key={item.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-semibold text-red-500">¥{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 備考 */}
      {event.note && (
        <div className="card">
          <p className="section-title">備考</p>
          <p className="text-sm text-gray-600 leading-relaxed">{event.note}</p>
        </div>
      )}
    </AppLayout>
  )
}
