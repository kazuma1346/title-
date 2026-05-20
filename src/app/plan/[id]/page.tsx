"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"

type Member = { id: number; name: string; grade: number }
type Participation = { id: number; memberId: number; joined: boolean; paid: boolean; member: Member }
type AccountItem = { id: number; type: string; name: string; amount: number }
type Event = {
  id: number; name: string; date: string | null; location: string | null
  feePerPerson: number; memo: string | null; note: string | null; status: string; carryOver: number
  participations: Participation[]; accountItems: AccountItem[]
}

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const [event, setEvent] = useState<Event | null>(null)
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [accTab, setAccTab] = useState<"income" | "expense">("income")
  const [showAddMember, setShowAddMember] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingFee, setEditingFee] = useState(false)
  const [feeValue, setFeeValue] = useState("")

  const load = useCallback(() => {
    fetch(`/api/events/${id}`).then(r => r.json()).then((ev: Event) => {
      setEvent(ev)
      setFeeValue(String(ev.feePerPerson))
    })
    fetch("/api/members").then(r => r.json()).then(setAllMembers)
  }, [id])

  useEffect(() => { load() }, [load])

  if (!event) return <AppLayout><div className="text-center text-gray-400 py-20">読み込み中...</div></AppLayout>

  const income = event.accountItems.filter(i => i.type === "income").reduce((s, i) => s + i.amount, 0)
  const expense = event.accountItems.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0)
  const carryOver = income - expense

  const saveFee = async () => {
    const newFee = Number(feeValue) || 0
    await fetch(`/api/events/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feePerPerson: newFee }),
    })
    setEditingFee(false)
    load()
  }

  const toggleJoined = async (memberId: number, current: boolean) => {
    await fetch("/api/participation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: id, memberId, joined: !current }),
    })
    load()
  }

  const togglePaid = async (memberId: number, current: boolean, memberName: string) => {
    const newPaid = !current
    await fetch("/api/participation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: id, memberId, paid: newPaid }),
    })
    const feeItem = event.accountItems.find(i => i.type === "income" && i.name === "参加費")
    const paidCount = event.participations.filter(p => p.paid).length
    const newPaidCount = newPaid ? paidCount + 1 : paidCount - 1
    const newAmount = newPaidCount * event.feePerPerson
    if (newAmount <= 0 && feeItem) {
      await fetch("/api/account-items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: feeItem.id }) })
    } else if (feeItem) {
      await fetch("/api/account-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: feeItem.id, name: "参加費", amount: newAmount }) })
    } else if (newAmount > 0) {
      await fetch("/api/account-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, type: "income", name: "参加費", amount: newAmount }) })
    }
    load()
  }

  const addMember = async (memberId: number) => {
    await fetch("/api/participation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: id, memberId, joined: true, paid: false }),
    })
    setShowAddMember(false)
    load()
  }

  const addAccountItem = async (type: string) => {
    await fetch("/api/account-items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: id, type, name: "", amount: 0 }),
    })
    load()
  }

  const updateAccountItem = async (itemId: number, name: string, amount: number) => {
    await fetch("/api/account-items", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, name, amount }),
    })
  }

  const deleteAccountItem = async (itemId: number) => {
    await fetch("/api/account-items", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    })
    load()
  }

  const saveNote = async (note: string) => {
    await fetch(`/api/events/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    })
  }

  const complete = async () => {
    if (!confirm("この活動を完了にしますか？")) return
    setSaving(true)
    await fetch(`/api/events/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    })
    setSaving(false)
    router.push("/activity")
  }

  const existingMemberIds = event.participations.map(p => p.memberId)
  const availableMembers = allMembers.filter(m => !existingMemberIds.includes(m.id))

  return (
    <AppLayout>
      <Link href="/plan" className="flex items-center gap-1 text-primary-500 text-sm mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        企画一覧
      </Link>
      <div className="card">
        <h2 className="text-primary-900 font-bold text-lg mb-3">{event.name}</h2>
        {event.date && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {new Date(event.date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {event.location}
          </div>
        )}
        <div className="bg-primary-50 rounded-xl px-3 py-2.5 mt-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">一人あたりの参加費</span>
          {editingFee ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">¥</span>
              <input type="number" value={feeValue} onChange={e => setFeeValue(e.target.value)}
                className="w-24 border border-primary-300 rounded-lg px-2 py-1 text-sm text-right font-bold text-primary-900 outline-none focus:border-primary-500"
                autoFocus onKeyDown={e => e.key === "Enter" && saveFee()} />
              <button onClick={saveFee} className="text-xs bg-primary-500 text-white px-2 py-1 rounded-lg">保存</button>
              <button onClick={() => setEditingFee(false)} className="text-xs text-gray-400">×</button>
            </div>
          ) : (
            <button onClick={() => setEditingFee(true)} className="flex items-center gap-1 group">
              <span className="font-bold text-primary-900">¥{event.feePerPerson.toLocaleString()}</span>
              <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <p className="section-title mb-0">参加者リスト（{event.participations.length}名）</p>
          <button onClick={() => setShowAddMember(true)} className="text-xs bg-primary-100 text-primary-500 font-semibold px-3 py-1.5 rounded-full">＋ 追加</button>
        </div>
        {event.participations.length === 0 && <p className="text-gray-400 text-sm text-center py-4">メンバーを追加してください</p>}
        {event.participations.map(p => (
          <div key={p.id} className="flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0">
            <span className="flex-1 text-sm font-medium text-gray-800">{p.member.name}</span>
            <button onClick={() => toggleJoined(p.memberId, p.joined)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${p.joined ? "bg-primary-500 text-white" : "bg-primary-100 text-primary-400"}`}>
              {p.joined ? "参加" : "不参加"}
            </button>
            <button onClick={() => togglePaid(p.memberId, p.paid, p.member.name)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${p.paid ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
              {p.paid ? "集金済" : "未集金"}
            </button>
          </div>
        ))}
      </div>
      <div className="card">
        <p className="section-title">会計報告</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "収入合計", value: `¥${income.toLocaleString()}`, color: "text-green-600" },
            { label: "支出合計", value: `¥${expense.toLocaleString()}`, color: "text-red-500" },
            { label: "繰越金", value: `¥${carryOver.toLocaleString()}`, color: "text-primary-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-gray-400 text-[10px] mb-1">{label}</p>
              <p className={`font-bold text-sm ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
          {(["income", "expense"] as const).map(t => (
            <button key={t} onClick={() => setAccTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${accTab === t ? "bg-white text-primary-500 shadow-sm" : "text-gray-400"}`}>
              {t === "income" ? "収入" : "支出"}
            </button>
          ))}
        </div>
        {event.accountItems.filter(i => i.type === accTab).map(item => (
          <div key={item.id} className="flex gap-2 mb-2 items-center">
            <input className="input-field flex-[2]" defaultValue={item.name} placeholder="科目"
              onBlur={e => updateAccountItem(item.id, e.target.value, item.amount)} />
            <div className="relative flex-[1.3]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
              <input className="input-field pl-6" type="number" defaultValue={item.amount || ""} placeholder="0"
                onBlur={e => updateAccountItem(item.id, item.name, Number(e.target.value))} />
            </div>
            <button onClick={() => deleteAccountItem(item.id)} className="bg-gray-100 text-gray-400 rounded-lg p-2 text-sm font-bold hover:bg-red-50 hover:text-red-400 transition-colors">✕</button>
          </div>
        ))}
        <button onClick={() => addAccountItem(accTab)} className="w-full py-2.5 rounded-xl bg-primary-50 text-primary-500 text-sm font-semibold mt-1">＋ 科目を追加</button>
      </div>
      <div className="card">
        <p className="section-title">備考</p>
        <textarea className="input-field resize-none h-20" placeholder="メモを入力..." defaultValue={event.note ?? ""}
          onBlur={e => saveNote(e.target.value)} />
      </div>
      {event.status === "active" && (
        <button onClick={complete} disabled={saving} className="btn-primary mt-2 mb-6 disabled:opacity-50">
          {saving ? "処理中..." : "この活動を完了にする"}
        </button>
      )}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6 max-h-[60vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-semibold text-gray-800 mb-3">メンバーを追加</h3>
            {availableMembers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">追加できるメンバーがいません</p>
            ) : availableMembers.map(m => (
              <button key={m.id} onClick={() => addMember(m.id)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-800">{m.name}</span>
                <span className="text-xs text-gray-400">{m.grade}年</span>
              </button>
            ))}
            <button onClick={() => setShowAddMember(false)} className="btn-primary mt-3">閉じる</button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
