"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import Link from "next/link"

type Event = { id: number; name: string; date: string | null; status: string }
type Participation = { eventId: number; joined: boolean; event: Event }
type Member = { id: number; name: string; grade: number; department: string; studentId: string; participations: Participation[] }

export default function MemberDetailPage() {
  const params = useParams()
  const [member, setMember] = useState<Member | null>(null)

  useEffect(() => {
    fetch(`/api/members/${params.id}`).then(r => r.json()).then(setMember)
  }, [params.id])

  if (!member) return <AppLayout><div className="text-center text-gray-400 py-20">読み込み中...</div></AppLayout>

  const doneParticipations = member.participations
    .filter(p => p.event.status === "done")
    .sort((a, b) => new Date(b.event.date ?? 0).getTime() - new Date(a.event.date ?? 0).getTime())

  let consecutiveAbsences = 0
  for (const p of doneParticipations) {
    if (!p.joined) consecutiveAbsences++
    else break
  }

  const attendanceRate = doneParticipations.length > 0
    ? Math.round(doneParticipations.filter(p => p.joined).length / doneParticipations.length * 100)
    : 0

  return (
    <AppLayout>
      <Link href="/members" className="flex items-center gap-1 text-primary-500 text-sm mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        名簿
      </Link>

      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-900 font-bold text-xl flex-shrink-0">
            {member.name[0]}
          </div>
          <div>
            <h2 className="text-primary-900 font-bold text-lg">{member.name}</h2>
            <p className="text-gray-500 text-sm">{member.grade}年 · {member.department}</p>
            <p className="text-gray-300 text-xs mt-0.5">{member.studentId}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 mb-1">出席率</p>
            <p className="font-bold text-primary-900 text-lg">{attendanceRate}%</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${consecutiveAbsences >= 4 ? "bg-red-50" : consecutiveAbsences >= 3 ? "bg-amber-50" : "bg-gray-50"}`}>
            <p className="text-[10px] text-gray-400 mb-1">連続欠席</p>
            <p className={`font-bold text-lg ${consecutiveAbsences >= 4 ? "text-red-500" : consecutiveAbsences >= 3 ? "text-amber-500" : "text-primary-900"}`}>
              {consecutiveAbsences}回
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="section-title">活動参加履歴</p>
        {doneParticipations.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">活動履歴がありません</p>
        )}
        {doneParticipations.map(p => (
          <div key={p.eventId} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.joined ? "bg-green-400" : "bg-red-300"}`} />
            <div className="flex-1">
              <p className="text-sm text-gray-700">{p.event.name}</p>
              {p.event.date && <p className="text-xs text-gray-400">{new Date(p.event.date).toLocaleDateString("ja-JP")}</p>}
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.joined ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
              {p.joined ? "出席" : "欠席"}
            </span>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
