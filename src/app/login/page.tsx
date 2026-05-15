"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: mode, ...form }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push("/home")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-primary-900 flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-3xl font-bold text-white tracking-wide mb-1">Circle Admin</div>
        <div className="text-primary-100 text-sm opacity-75">サークル管理システム</div>
      </div>

      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {mode === "login" ? "ログイン" : "新規登録"}
        </h2>

        <div className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">名前</label>
              <input
                className="input-field"
                placeholder="山田 太郎"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">メールアドレス</label>
            <input
              className="input-field"
              type="email"
              placeholder="taro@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">パスワード</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-primary mt-5 disabled:opacity-50"
        >
          {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
        </button>

        <button
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }}
          className="w-full text-center text-sm text-primary-500 mt-4 py-1"
        >
          {mode === "login" ? "アカウントを作成する" : "ログインに戻る"}
        </button>
      </div>
    </div>
  )
}
