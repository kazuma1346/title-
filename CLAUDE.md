# Circle Admin — サークル管理アプリ

## 技術スタック
- **フレームワーク**: Next.js 14 (App Router)
- **スタイリング**: Tailwind CSS（カラー: primary-900=#1a3a8f, primary-500=#2563eb）
- **ORM**: Prisma / SQLite
- **認証**: iron-session（Cookie ベース）
- **言語**: TypeScript

## ディレクトリ構成
```
src/
├── app/
│   ├── login/           # ログイン・新規登録
│   ├── home/            # ホームタブ
│   ├── plan/            # 企画タブ
│   │   └── [id]/        # 企画詳細
│   ├── activity/        # 活動タブ
│   │   └── [id]/        # 活動詳細
│   ├── members/         # 名簿タブ
│   │   └── [id]/        # メンバー詳細
│   ├── finance/         # 会計タブ
│   └── api/             # APIルート
├── components/
│   └── layout/AppLayout.tsx  # タブバー・ヘッダー共通レイアウト
└── lib/
    ├── prisma.ts        # Prismaシングルトン
    ├── session.ts       # iron-sessionの設定
    ├── absence.ts       # 連続欠席カウント
    └── carryover.ts     # 繰越金計算
```

## DBスキーマ（prisma/schema.prisma）
- **User**: 幹部アカウント（name, email, password）
- **Setting**: サークル名などのアプリ設定（key-value）
- **Member**: name, grade, department, studentId
- **Event**: name, date, location, feePerPerson, memo, note, status(active/done), carryOver
- **Participation**: eventId, memberId, joined, paid
- **AccountItem**: eventId, type(income/expense), name, amount

## 主要ルール
- 全ページ `AppLayout` でラップ（タブバー・ヘッダー自動付与）
- ログイン状態は `/api/auth` GET で確認
- モバイルファースト、max-w-md 固定
- 入力欄は必ず `color-scheme: light` を指定（ダークモード対策）
- ボタンカラー: btn-primary（青）、状態ON=単色塗り、状態OFF=薄色

## セットアップ
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## 連続欠席ロジック
完了済み活動を新しい順に見て、joined=falseが続く回数をカウント。
3回以上で警告（amber）、4回以上で除名警告（red）。

## 繰越金ロジック
企画作成時に直前の完了済み活動の（収入合計 - 支出合計）を自動セット。
