"use client"
import { useEffect, useState } from "react"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Member = { id: number; name: string; grade: number; department: string; studentId: string }

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [absences, setAbsences] = useState<Record<number, number>>({})
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", grade: "1", department: "", studentId: "" })
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const [mems, evs] = await Promise.all([
      fetch("/api/members").then(r => r.json()),
      fetch("/api/events").then(r => r.json()),
    ])
    setMembers(mems)

    const doneEvents = evs.filter((e: { status: string; date: string | null; participations: { memberId: number; joined: boolean }[] }) => e.status === "done")
      .sort((a: { date: string | null }, b: { date: string | null }) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())

    const counts: Record<number, number> = {}
    mems.forEach((m: Member) => {
      let count = 0
      for (const ev of doneEvents) {
        const p = ev.participations?.find((p: { memberId: number }) => p.memberId === m.id)
        if (!p || !p.joined) count++
        else break
      }
      counts[m.id] = count
    })
    setAbsences(counts)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setLoading(true)
    await fetch("/api/members", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, grade: Number(form.grade) }),
    })
    setShowForm(false)
    setLoading(false)
    load()
  }

  const grades = [...new Set(members.map(m => m.grade))].sort()

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-3">
        <p className="section-title mb-0">名簿</p>
        <button onClick={() => setShowForm(true)} className="text-xs bg-primary-100 text-primary-500 font-semibold px-3 py-1.5 rounded-full">＋ 追加</button>
      </div>

      {grades.map(grade => (
        <div key={grade} className="mb-2">
          <p className="text-xs font-bold text-gray-400 px-1 mb-2 tracking-widest">{grade}年生</p>
          {members.filter(m => m.grade === grade).map(m => {
            const absence = absences[m.id] ?? 0
            return (
              <Link key={m.id} href={`/members/${m.id}`}>
                <div className="card flex items-center gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-primary-900 font-semibold text-sm">{m.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{m.department}</p>
                    <p className="text-gray-300 text-[10px] mt-0.5">{m.studentId}</p>
                  </div>
                  {absence >= 3 && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${absence >= 4 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                      {absence}回欠席
                    </span>
                  )}
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      ))}

      {members.length === 0 && (
        <div className="card text-center text-gray-400 text-sm py-10">メンバーがいません</div>
      )}

      {/* メンバー追加モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-semibold text-gray-800 mb-4">メンバー追加</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">名前 *</label>
                <input className="input-field" placeholder="山田 太郎" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">学年</label>
                <select className="input-field" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                  {[1, 2, 3, 4].map(g => <option key={g} value={g}>{g}年</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">学部</label>
                <input className="input-field" placeholder="例：経済学部" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">学籍番号</label>
                <input className="input-field" placeholder="例：B2400123" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium">キャンセル</button>
              <button onClick={create} disabled={loading || !form.name} className="flex-1 btn-primary disabled:opacity-50">{loading ? "追加中..." : "追加する"}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
