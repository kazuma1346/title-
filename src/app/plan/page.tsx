"use client"
import { useEffect, useState } from "react"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Event = {
  id: number; name: string; date: string | null; location: string | null
  feePerPerson: number; memo: string | null; status: string
  participations: { joined: boolean; paid: boolean }[]
}

export default function PlanPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", date: "", location: "", feePerPerson: "", memo: "" })
  const [loading, setLoading] = useState(false)

  const load = () => fetch("/api/events").then(r => r.json()).then(setEvents)
  useEffect(() => { load() }, [])

  const create = async () => {
    setLoading(true)
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        date: form.date ? new Date(form.date).toISOString() : null,
        location: form.location || null,
        feePerPerson: Number(form.feePerPerson) || 0,
        memo: form.memo || null,
      }),
    })
    const ev = await res.json()
    setShowForm(false)
    setLoading(false)
    router.push(`/plan/${ev.id}`)
  }

  const active = events.filter(e => e.status === "active")
  const done = events.filter(e => e.status === "done")

  return (
    <AppLayout>
      <button onClick={() => setShowForm(true)} className="btn-primary mb-4">
        ＋ 新規企画立案
      </button>

      {active.length > 0 && (
        <>
          <p className="section-title">進行中</p>
          {active.map(ev => <EventCard key={ev.id} ev={ev} />)}
        </>
      )}

      {done.length > 0 && (
        <>
          <p className="section-title mt-2">完了</p>
          {done.map(ev => <EventCard key={ev.id} ev={ev} done />)}
        </>
      )}

      {events.length === 0 && (
        <div className="card text-center text-gray-400 text-sm py-10">企画がありません</div>
      )}

      {/* 新規企画モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-semibold text-gray-800 mb-4">新規企画立案</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">企画名 *</label>
                <input className="input-field" placeholder="例：春の花見" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">日時</label>
                <input className="input-field" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">場所</label>
                <input className="input-field" placeholder="例：上野公園" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">参加費（円/人）</label>
                <input className="input-field" type="number" placeholder="2000" value={form.feePerPerson} onChange={e => setForm({ ...form, feePerPerson: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">メモ</label>
                <textarea className="input-field resize-none h-16" placeholder="準備事項など" value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium">キャンセル</button>
              <button onClick={create} disabled={loading || !form.name} className="flex-1 btn-primary disabled:opacity-50">{loading ? "作成中..." : "作成する"}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function EventCard({ ev, done = false }: { ev: Event; done?: boolean }) {
  const joinedCount = ev.participations?.filter(p => p.joined).length ?? 0
  const paidCount = ev.participations?.filter(p => p.paid).length ?? 0

  return (
    <Link href={`/plan/${ev.id}`}>
      <div className={`card ${done ? "opacity-60" : ""}`}>
        <div className="flex justify-between items-start mb-1">
          <p className="text-primary-900 font-semibold text-sm flex-1 mr-2">{ev.name}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${done ? "bg-green-100 text-green-700" : "bg-primary-100 text-primary-500"}`}>
            {done ? "完了" : "進行中"}
          </span>
        </div>
        {ev.date && <p className="text-gray-400 text-xs">{new Date(ev.date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</p>}
        {ev.location && <p className="text-gray-400 text-xs">{ev.location}</p>}
        {ev.memo && <div className="bg-gray-50 rounded-lg px-3 py-2 mt-2 text-xs text-gray-500">{ev.memo}</div>}
        {!done && (
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            <span>参加 {joinedCount}名</span>
            <span>集金済 {paidCount}名</span>
          </div>
        )}
      </div>
    </Link>
  )
}
