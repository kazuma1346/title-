"use client"
import { useEffect, useState } from "react"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"

type Member = { id: number; name: string; grade: number; department: string; studentId: string }
type ParsedMember = { name: string; grade: number; department: string; studentId: string }

const DEPT_MAP: Record<string, string> = { C: "商学科", M: "経営学科", E: "経済学科", J: "法学部", W: "法学部" }

function inferFromStudentId(sid: string): { grade: number; department: string } | null {
  const match = sid.match(/^(\d{2})([A-Za-z])/)
  if (!match) return null
  const grade = Math.min(Math.max(new Date().getFullYear() - (2000 + Number(match[1])) + 1, 1), 4)
  return { grade, department: DEPT_MAP[match[2].toUpperCase()] ?? "" }
}

function parseMembersText(text: string): ParsedMember[] {
  return text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0).map(line => {
    let rest = line
    const sidMatch = rest.match(/\d{2}[A-Za-z]\d+/) || rest.match(/[A-Za-z]\d+/)
    const studentId = sidMatch ? sidMatch[0] : ""
    if (studentId) rest = rest.replace(studentId, "").trim()
    const inferred = studentId ? inferFromStudentId(studentId) : null
    const gradeMatch = rest.match(/([1-4])\s*年[生]?/)
    let grade = gradeMatch ? Number(gradeMatch[1]) : (inferred?.grade ?? 1)
    if (gradeMatch) rest = rest.replace(gradeMatch[0], "").trim()
    else if (!inferred) { const n = rest.match(/\b([1-4])\b/); if (n) { grade = Number(n[1]); rest = rest.replace(n[0], "").trim() } }
    const deptMatch = rest.match(/[\u4e00-\u9fa5]+(?:学部|学科|学院|研究科|系|専攻)/)
    const department = deptMatch ? deptMatch[0] : (inferred?.department ?? "")
    if (deptMatch) rest = rest.replace(deptMatch[0], "").trim()
    const name = rest.replace(/[\s\u3000・、。，,]+/g, " ").trim()
    return { name, grade, department, studentId }
  }).filter(m => m.name.length > 0)
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [absences, setAbsences] = useState<Record<number, number>>({})
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [form, setForm] = useState({ name: "", grade: "1", department: "", studentId: "" })
  const [bulkText, setBulkText] = useState("")
  const [preview, setPreview] = useState<ParsedMember[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const [mems, evs] = await Promise.all([
      fetch("/api/members").then(r => r.json()),
      fetch("/api/events").then(r => r.json()),
    ])
    setMembers(mems)
    const doneEvents = evs.filter((e: any) => e.status === "done")
      .sort((a: any, b: any) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    const counts: Record<number, number> = {}
    mems.forEach((m: Member) => {
      let count = 0
      for (const ev of doneEvents) {
        const p = ev.participations?.find((p: any) => p.memberId === m.id)
        if (!p || !p.joined) count++
        else break
      }
      counts[m.id] = count
    })
    setAbsences(counts)
  }

  useEffect(() => { load() }, [])

  const onStudentIdChange = (val: string) => {
    const inferred = inferFromStudentId(val)
    if (inferred) {
      setForm(f => ({ ...f, studentId: val, grade: String(inferred.grade), department: f.department || inferred.department }))
    } else {
      setForm(f => ({ ...f, studentId: val }))
    }
  }

  const create = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    await fetch("/api/members", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, grade: Number(form.grade), department: form.department, studentId: form.studentId || `tmp-${Date.now()}` }),
    })
    setShowForm(false); setLoading(false)
    setForm({ name: "", grade: "1", department: "", studentId: "" }); load()
  }

  const update = async () => {
    if (!editTarget) return
    setLoading(true)
    await fetch(`/api/members/${editTarget.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, grade: Number(form.grade), department: form.department, studentId: form.studentId || editTarget.studentId }),
    })
    setShowEdit(false); setLoading(false); load()
  }

  const openEdit = (m: Member) => {
    setEditTarget(m)
    setForm({ name: m.name, grade: String(m.grade), department: m.department, studentId: m.studentId?.startsWith("tmp-") ? "" : m.studentId })
    setShowEdit(true)
  }

  const deleteMember = async (id: number) => {
    if (!confirm("このメンバーを削除しますか？")) return
    await fetch(`/api/members/${id}`, { method: "DELETE" })
    load()
  }
  const bulkImport = async () => {
    setLoading(true)
    for (const m of preview) {
      await fetch("/api/members", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...m, studentId: m.studentId || `tmp-${Date.now()}-${Math.random()}` }),
      })
    }
    setShowBulk(false); setBulkText(""); setPreview([]); setLoading(false); load()
  }

  const grades = Array.from(new Set(members.map(m => m.grade))).sort()

  const MemberFormModal = ({ onSave, onCancel, title }: { onSave: () => void; onCancel: () => void; title: string }) => (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white rounded-t-3xl w-full p-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">学籍番号（入力で学年・学部を自動補完）</label>
            <input className="input-field" placeholder="例：24E197" value={form.studentId} onChange={e => onStudentIdChange(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">名前 *</label>
            <input className="input-field" placeholder="山田 太郎" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">学年</label>
            <select className="input-field" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
              {[1,2,3,4].map(g => <option key={g} value={g}>{g}年</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">学部</label>
            <input className="input-field" placeholder="例：経済学科" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium">キャンセル</button>
          <button onClick={onSave} disabled={loading || !form.name} className="flex-1 btn-primary disabled:opacity-50">{loading ? "保存中..." : "保存"}</button>
        </div>
      </div>
    </div>
  )

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-3">
        <p className="section-title mb-0">名簿</p>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)} className="text-xs bg-gray-100 text-gray-600 font-semibold px-3 py-1.5 rounded-full">一括追加</button>
          <button onClick={() => { setForm({ name: "", grade: "1", department: "", studentId: "" }); setShowForm(true) }} className="text-xs bg-primary-100 text-primary-500 font-semibold px-3 py-1.5 rounded-full">＋ 追加</button>
        </div>
      </div>
      {grades.map(grade => (
        <div key={grade} className="mb-2">
          <p className="text-xs font-bold text-gray-400 px-1 mb-2 tracking-widest">{grade}年生</p>
          {members.filter(m => m.grade === grade).map(m => {
            const absence = absences[m.id] ?? 0
            return (
              <div key={m.id} className="card flex items-center gap-3 mb-2">
                <Link href={`/members/${m.id}`} className="flex-1 min-w-0">
                  <p className="text-primary-900 font-semibold text-sm">{m.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{m.department || "学部未設定"}</p>
                  <p className="text-gray-300 text-[10px] mt-0.5">{m.studentId?.startsWith("tmp-") ? "学籍番号未設定" : m.studentId}</p>
                </Link>
                {absence >= 3 && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${absence >= 4 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                    {absence}回欠席
                  </span>
                )}
                <button onClick={(e) => { e.preventDefault(); deleteMember(m.id) }} className="text-red-400 hover:text-red-600 flex-shrink-0 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={() => openEdit(m)} className="text-gray-300 hover:text-primary-400 flex-shrink-0 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            )
          })}
        </div>
      ))}
      {members.length === 0 && <div className="card text-center text-gray-400 text-sm py-10">メンバーがいません</div>}
      {showForm && <MemberFormModal title="メンバー追加" onSave={create} onCancel={() => setShowForm(false)} />}
      {showEdit && <MemberFormModal title="メンバー編集" onSave={update} onCancel={() => setShowEdit(false)} />}
      {showBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-semibold text-gray-800 mb-2">一括追加</h3>
            <p className="text-xs text-gray-400 mb-3">1行1人。学籍番号から学年・学部を自動判定します。</p>
            <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-500 space-y-0.5">
              <p className="font-medium mb-1">例：</p>
              <p>山田 太郎 24E197</p>
              <p>佐藤花子 23M045</p>
              <p>田中悠人 2年 経済学科</p>
            </div>
            <textarea className="input-field resize-none h-36 mb-3" placeholder="ここにテキストを貼り付け..."
              value={bulkText} onChange={e => { setBulkText(e.target.value); setPreview([]) }} />
            {preview.length === 0 ? (
              <button onClick={() => setPreview(parseMembersText(bulkText))} disabled={!bulkText.trim()} className="btn-primary mb-3 disabled:opacity-50">内容を確認する</button>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-600 mb-2">確認（{preview.length}名）</p>
                <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
                  {preview.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.grade}年 · {m.department || "学部なし"} · {m.studentId || "学籍番号なし"}</p>
                      </div>
                      <button onClick={() => setPreview(prev => prev.filter((_, j) => j !== i))} className="text-red-300 hover:text-red-500 text-xs">削除</button>
                    </div>
                  ))}
                </div>
                <button onClick={bulkImport} disabled={loading} className="btn-primary mb-3 disabled:opacity-50">
                  {loading ? "追加中..." : `${preview.length}名を追加する`}
                </button>
              </>
            )}
            <button onClick={() => { setShowBulk(false); setBulkText(""); setPreview([]) }} className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium">キャンセル</button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
