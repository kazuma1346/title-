"use client"
import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"

type Member = { id: number; name: string; grade: number }
type Participation = { id: number; memberId: number; joined: boolean; paid: boolean; member: Member }
type AccountItem = { id: number; type: string; name: string; amount: number }
type BudgetItem = { id: number; type: string; name: string; amount: number }
type Event = {
  id: number; name: string; date: string | null; location: string | null
  feePerPerson: number; memo: string | null; note: string | null; status: string; carryOver: number; allocation: number
  participations: Participation[]; accountItems: AccountItem[]; budgetItems?: BudgetItem[]
}

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const [event, setEvent] = useState<Event | null>(null)
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [budgetTab, setBudgetTab] = useState<"income" | "expense">("income")
  const [accTab, setAccTab] = useState<"income" | "expense">("income")
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [editingFee, setEditingFee] = useState(false)
  const [feeValue, setFeeValue] = useState("")
  const [localBudgetItems, setLocalBudgetItems] = useState<BudgetItem[]>([])
  const [localItems, setLocalItems] = useState<AccountItem[]>([])
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [budgetSaved, setBudgetSaved] = useState(false)
  const [accSaving, setAccSaving] = useState(false)
  const [accSaved, setAccSaved] = useState(false)
  const [allocation, setAllocation] = useState(0)
  const [totalFunds, setTotalFunds] = useState(0)

  

  // 自動的に参加費を予算に計上
  useEffect(() => {
    if (!event) return
    const participantCount = event.participations.length
    const expectedFee = participantCount * event.feePerPerson
    
    // 既存の参加費項目を探す
    const existingFeeItem = localBudgetItems.find(i => i.type === "income" && i.name === "参加費")
    
    if (expectedFee > 0) {
      if (existingFeeItem) {
        // 金額を更新
        setLocalBudgetItems(prev => 
          prev.map(i => i.id === existingFeeItem.id ? { ...i, amount: expectedFee } : i)
        )
      } else {
        // 新規追加
        setLocalBudgetItems(prev => [
          { id: -(Date.now()), type: "income", name: "参加費", amount: expectedFee },
          ...prev
        ])
      }
    } else if (existingFeeItem) {
      // 参加者がいない場合は削除
      setLocalBudgetItems(prev => prev.filter(i => i.id !== existingFeeItem.id))
    }
  }, [event?.participations.length, event?.feePerPerson, event])

  const load = useCallback(() => {
    fetch(`/api/events/${id}`).then(r => r.json()).then((ev: Event) => {
      setEvent(ev)
      setFeeValue(String(ev.feePerPerson))
      setLocalItems(ev.accountItems)
      setLocalBudgetItems(ev.budgetItems || [])
      setAllocation(ev.allocation ?? 0)
    })
    fetch("/api/members").then(r => r.json()).then(setAllMembers)
  }, [id])

  useEffect(() => { load() }, [load])

  if (!event) return <AppLayout><div className="text-center text-gray-400 py-20">読み込み中...</div></AppLayout>

  const localBudgetIncome = localBudgetItems.filter(i => i.type === "income").reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const localBudgetExpense = localBudgetItems.filter(i => i.type === "expense").reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const localBudgetBalance = localBudgetIncome - localBudgetExpense

  const localIncome = localItems.filter(i => i.type === "income").reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const localExpense = localItems.filter(i => i.type === "expense").reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const localCarryOver = localIncome - localExpense

  const saveFee = async () => {
    await fetch(`/api/events/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feePerPerson: Number(feeValue) || 0 }) })
    setEditingFee(false); load()
  }

  const toggleJoined = async (memberId: number, current: boolean) => {
    await fetch("/api/participation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, memberId, joined: !current }) })
    load()
  }

  const togglePaid = async (memberId: number, current: boolean) => {
    const newPaid = !current
    await fetch("/api/participation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, memberId, paid: newPaid }) })
    const feeItem = event.accountItems.find(i => i.type === "income" && i.name === "参加費")
    const paidCount = event.participations.filter(p => p.paid).length
    const newAmount = (newPaid ? paidCount + 1 : paidCount - 1) * event.feePerPerson
    if (newAmount <= 0 && feeItem) {
      await fetch("/api/account-items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: feeItem.id }) })
    } else if (feeItem) {
      await fetch("/api/account-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: feeItem.id, name: "参加費", amount: newAmount }) })
    } else if (newAmount > 0) {
      await fetch("/api/account-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, type: "income", name: "参加費", amount: newAmount }) })
    }
    load()
  }

  const addSelectedMembers = async () => {
    if (selectedMembers.length === 0) return
    setSaving(true)
    await Promise.all(
      selectedMembers.map(memberId =>
        fetch("/api/participation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: id, memberId, joined: true, paid: false })
        })
      )
    )
    setSaving(false)
    setSelectedMembers([])
    setShowAddMember(false)
    load()
  }

  const removeMember = async (participationId: number) => {
    if (!confirm("このメンバーを削除しますか？")) return
    await fetch("/api/participation", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: participationId })
    })
    load()
  }

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const addLocalBudgetItem = (type: string) => setLocalBudgetItems(prev => [...prev, { id: -(Date.now()), type, name: "", amount: 0 }])
  const updateLocalBudgetItem = (itemId: number, field: "name" | "amount", value: string) =>
    setLocalBudgetItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: field === "amount" ? Number(value) || 0 : value } : i))
  const removeLocalBudgetItem = (itemId: number) => setLocalBudgetItems(prev => prev.filter(i => i.id !== itemId))

  const saveBudgetItems = async () => {
    setBudgetSaving(true)
    const original = event.budgetItems || []
    const deleted = original.filter(o => !localBudgetItems.find(l => l.id === o.id))
    const added = localBudgetItems.filter(i => i.id < 0)
    const updated = localBudgetItems.filter(i => i.id > 0)
    await Promise.all([
      ...deleted.map(d => fetch("/api/budget-items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id }) })),
      ...added.map(a => fetch("/api/budget-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, type: a.type, name: a.name, amount: a.amount }) })),
      ...updated.map(u => fetch("/api/budget-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, name: u.name, amount: u.amount }) })),
    ])
    setBudgetSaving(false); setBudgetSaved(true)
    setTimeout(() => setBudgetSaved(false), 2000)
    load()
  }

  const addLocalItem = (type: string) => setLocalItems(prev => [...prev, { id: -(Date.now()), type, name: "", amount: 0 }])
  const updateLocalItem = (itemId: number, field: "name" | "amount", value: string) =>
    setLocalItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: field === "amount" ? Number(value) || 0 : value } : i))
  const removeLocalItem = (itemId: number) => setLocalItems(prev => prev.filter(i => i.id !== itemId))

  const saveAccountItems = async () => {
    setAccSaving(true)
    const original = event.accountItems
    const deleted = original.filter(o => !localItems.find(l => l.id === o.id))
    const added = localItems.filter(i => i.id < 0)
    const updated = localItems.filter(i => i.id > 0)
    await Promise.all([
      ...deleted.map(d => fetch("/api/account-items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id }) })),
      ...added.map(a => fetch("/api/account-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, type: a.type, name: a.name, amount: a.amount }) })),
      ...updated.map(u => fetch("/api/account-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, name: u.name, amount: u.amount }) })),
    ])
    setAccSaving(false); setAccSaved(true)
    setTimeout(() => setAccSaved(false), 2000)
    load()
  }

  const saveNote = async (note: string) => {
    await fetch(`/api/events/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) })
  }

  const complete = async () => {
    if (!confirm("この活動を完了にしますか？")) return
    setSaving(true)
    await fetch(`/api/events/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "done" }) })
    setSaving(false); router.push("/activity")
  }

  
  // 学年順でソートした参加者リスト（順番を固定）
  const sortedParticipations = useMemo(() => {
    if (!event) return []
    return [...event.participations].sort((a, b) => {
      // 学年で降順ソート、同じ学年ならIDでソート
      if (b.member.grade !== a.member.grade) {
        return b.member.grade - a.member.grade
      }
      return a.id - b.id
    })
  }, [event?.participations])

  const existingMemberIds = event.participations.map(p => p.memberId)
  const availableMembers = allMembers.filter(m => !existingMemberIds.includes(m.id))
  const budgetTabItems = localBudgetItems.filter(i => i.type === budgetTab)
  const tabItems = localItems.filter(i => i.type === accTab)

  return (
    <AppLayout>
      <Link href="/plan" className="flex items-center gap-1 text-primary-500 text-sm mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        企画一覧
      </Link>
      <div className="card">
        <h2 className="text-primary-900 font-bold text-lg mb-3">{event.name}</h2>
        {event.date && <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{new Date(event.date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</div>}
        {event.location && <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{event.location}</div>}
        <div className="bg-primary-50 rounded-xl px-3 py-2.5 mt-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">一人あたりの参加費</span>
          {editingFee ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">¥</span>
              <input type="number" value={feeValue} onChange={e => setFeeValue(e.target.value)} className="w-24 border border-primary-300 rounded-lg px-2 py-1 text-sm text-right font-bold text-primary-900 outline-none" autoFocus onKeyDown={e => e.key === "Enter" && saveFee()} />
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
        {sortedParticipations.map(p => (
          <div key={p.id} className="flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0">
            <span className="flex-1 text-sm font-medium text-gray-800">{p.member.name}</span>
            <button onClick={() => toggleJoined(p.memberId, p.joined)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${p.joined ? "bg-primary-500 text-white" : "bg-primary-100 text-primary-400"}`}>{p.joined ? "参加" : "不参加"}</button>
            <button onClick={() => togglePaid(p.memberId, p.paid)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${p.paid ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>{p.paid ? "集金済" : "未集金"}</button>
            <button onClick={() => removeMember(p.id)} className="text-red-400 hover:text-red-600 text-sm font-bold px-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
          </div>
        ))}
      </div>

      {/* 予算セクション */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <p className="section-title mb-0">予算</p>
          <button onClick={saveBudgetItems} disabled={budgetSaving} className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${budgetSaved ? "bg-green-100 text-green-600" : "bg-primary-500 text-white"} disabled:opacity-50`}>
            {budgetSaving ? "保存中..." : budgetSaved ? "✓ 保存済" : "保存"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[{ label: "収入予算", value: `¥${localBudgetIncome.toLocaleString()}`, color: "text-green-600" }, { label: "支出予算", value: `¥${localBudgetExpense.toLocaleString()}`, color: "text-red-500" }, { label: "予算残高", value: `¥${localBudgetBalance.toLocaleString()}`, color: "text-primary-500" }].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center"><p className="text-gray-400 text-[10px] mb-1">{label}</p><p className={`font-bold text-sm ${color}`}>{value}</p></div>
          ))}
        </div>
        <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
          {(["income", "expense"] as const).map(t => (
            <button key={t} onClick={() => setBudgetTab(t)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${budgetTab === t ? "bg-white text-primary-500 shadow-sm" : "text-gray-400"}`}>{t === "income" ? "収入" : "支出"}</button>
          ))}
        </div>
        {budgetTabItems.length === 0 && <p className="text-gray-300 text-xs text-center py-3">科目がありません</p>}
        {budgetTabItems.map(item => (
          <div key={item.id} className="flex gap-2 mb-2 items-center">
            <input className="input-field flex-[2]" value={item.name} placeholder="科目名" onChange={e => updateLocalBudgetItem(item.id, "name", e.target.value)} />
            <div className="relative flex-[1.3]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
              <input className="input-field pl-6" type="number" value={item.amount || ""} placeholder="0" onChange={e => updateLocalBudgetItem(item.id, "amount", e.target.value)} />
            </div>
            <button onClick={() => removeLocalBudgetItem(item.id)} className="bg-gray-100 text-gray-400 rounded-lg p-2 text-sm font-bold hover:bg-red-50 hover:text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
          </div>
        ))}
        <button onClick={() => addLocalBudgetItem(budgetTab)} className="w-full py-2.5 rounded-xl bg-primary-50 text-primary-500 text-sm font-semibold mt-1">＋ 科目を追加</button>
      </div>

      {/* 会計報告セクション */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <p className="section-title mb-0">会計報告</p>
          <button onClick={saveAccountItems} disabled={accSaving} className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${accSaved ? "bg-green-100 text-green-600" : "bg-primary-500 text-white"} disabled:opacity-50`}>
            {accSaving ? "保存中..." : accSaved ? "✓ 保存済" : "保存"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[{ label: "収入合計", value: `¥${localIncome.toLocaleString()}`, color: "text-green-600" }, { label: "支出合計", value: `¥${localExpense.toLocaleString()}`, color: "text-red-500" }, { label: "繰越金", value: `¥${localCarryOver.toLocaleString()}`, color: "text-primary-500" }].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center"><p className="text-gray-400 text-[10px] mb-1">{label}</p><p className={`font-bold text-sm ${color}`}>{value}</p></div>
          ))}
        </div>
        <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
          {(["income", "expense"] as const).map(t => (
            <button key={t} onClick={() => setAccTab(t)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${accTab === t ? "bg-white text-primary-500 shadow-sm" : "text-gray-400"}`}>{t === "income" ? "収入" : "支出"}</button>
          ))}
        </div>
        {tabItems.length === 0 && <p className="text-gray-300 text-xs text-center py-3">科目がありません</p>}
        {tabItems.map(item => (
          <div key={item.id} className="flex gap-2 mb-2 items-center">
            <input className="input-field flex-[2]" value={item.name} placeholder="科目名" onChange={e => updateLocalItem(item.id, "name", e.target.value)} />
            <div className="relative flex-[1.3]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
              <input className="input-field pl-6" type="number" value={item.amount || ""} placeholder="0" onChange={e => updateLocalItem(item.id, "amount", e.target.value)} />
            </div>
            <button onClick={() => removeLocalItem(item.id)} className="bg-gray-100 text-gray-400 rounded-lg p-2 text-sm font-bold hover:bg-red-50 hover:text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
          </div>
        ))}
        <button onClick={() => addLocalItem(accTab)} className="w-full py-2.5 rounded-xl bg-primary-50 text-primary-500 text-sm font-semibold mt-1">＋ 科目を追加</button>
      </div>

      <div className="card">
        <p className="section-title">備考</p>
        <textarea className="input-field resize-none h-20" placeholder="メモを入力..." defaultValue={event.note ?? ""} onBlur={e => saveNote(e.target.value)} />
      </div>
      {event.status === "active" && (
        <button onClick={complete} disabled={saving} className="btn-primary mt-2 mb-6 disabled:opacity-50">{saving ? "処理中..." : "この活動を完了にする"}</button>
      )}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6 max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-semibold text-gray-800 mb-3">メンバーを追加（複数選択可）</h3>
            {availableMembers.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">追加できるメンバーがいません</p>
              : availableMembers.map(m => {
                const isSelected = selectedMembers.includes(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMemberSelection(m.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 mb-2 transition-colors ${
                      isSelected ? "bg-primary-50 border-2 border-primary-500" : "bg-white border-2 border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-primary-500 border-primary-500" : "border-gray-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-800">{m.name}</span>
                    <span className="text-xs text-gray-400">{m.grade}年</span>
                  </button>
                )
              })}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowAddMember(false); setSelectedMembers([]) }} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold">キャンセル</button>
              <button
                onClick={addSelectedMembers}
                disabled={selectedMembers.length === 0 || saving}
                className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "追加中..." : `追加 (${selectedMembers.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
