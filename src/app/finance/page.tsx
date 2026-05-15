"use client"
import { useEffect, useState } from "react"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"

type AccountItem = { type: string; amount: number }
type Event = {
  id: number; name: string; date: string | null
  status: string; accountItems: AccountItem[]
}

export default function FinancePage() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then((evs: Event[]) =>
      setEvents(evs.filter(e => e.status === "done"))
    )
  }, [])

  const totalIncome = events.reduce((s, ev) => s + ev.accountItems.filter(i => i.type === "income").reduce((a, i) => a + i.amount, 0), 0)
  const totalExpense = events.reduce((s, ev) => s + ev.accountItems.filter(i => i.type === "expense").reduce((a, i) => a + i.amount, 0), 0)
  const balance = totalIncome - totalExpense

  return (
    <AppLayout>
      {/* 総資金 */}
      <div className="bg-primary-900 rounded-2xl p-5 mb-4 text-center">
        <p className="text-primary-100 text-xs mb-1 opacity-80">サークル総資金</p>
        <p className="text-white text-3xl font-bold mb-3">¥{balance.toLocaleString()}</p>
        <div className="flex justify-center gap-6 text-xs">
          <div className="text-center">
            <p className="text-primary-200 opacity-70 mb-0.5">総収入</p>
            <p className="text-green-300 font-semibold">¥{totalIncome.toLocaleString()}</p>
          </div>
          <div className="w-px bg-white opacity-20" />
          <div className="text-center">
            <p className="text-primary-200 opacity-70 mb-0.5">総支出</p>
            <p className="text-red-300 font-semibold">¥{totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <p className="section-title">活動別収支</p>
      {events.length === 0 && (
        <div className="card text-center text-gray-400 text-sm py-10">完了した活動はありません</div>
      )}
      {events.map(ev => {
        const income = ev.accountItems.filter(i => i.type === "income").reduce((s, i) => s + i.amount, 0)
        const expense = ev.accountItems.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0)
        const carry = income - expense
        return (
          <Link key={ev.id} href={`/activity/${ev.id}`}>
            <div className="card mb-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-primary-900 font-semibold text-sm">{ev.name}</p>
                <p className="text-gray-400 text-xs">{ev.date ? new Date(ev.date).toLocaleDateString("ja-JP") : "—"}</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-green-600 opacity-70 mb-0.5">収入</p>
                  <p className="text-xs font-bold text-green-600">¥{income.toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-red-500 opacity-70 mb-0.5">支出</p>
                  <p className="text-xs font-bold text-red-500">¥{expense.toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-primary-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-primary-500 opacity-70 mb-0.5">繰越</p>
                  <p className="text-xs font-bold text-primary-500">¥{carry.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </AppLayout>
  )
}
