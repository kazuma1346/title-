import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { sessionOptions, SessionData } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { action, email, password, name } = await req.json()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)

  if (action === "login") {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 })
    }
    session.userId = user.id
    session.userName = user.name
    await session.save()
    return NextResponse.json({ ok: true, name: user.name })
  }

  if (action === "logout") {
    session.destroy()
    return NextResponse.json({ ok: true })
  }

  if (action === "register") {
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: "このメールアドレスは既に登録済みです" }, { status: 400 })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { name, email, password: hashed } })
    session.userId = user.id
    session.userName = user.name
    await session.save()
    return NextResponse.json({ ok: true, name: user.name })
  }

  return NextResponse.json({ error: "不明なアクション" }, { status: 400 })
}

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.userId) return NextResponse.json({ authenticated: false })
  return NextResponse.json({ authenticated: true, userId: session.userId, userName: session.userName })
}
