# セミナー管理システム — CLAUDE.md

## プロジェクト概要

研究室の輪読（論文輪読・書籍輪読）における発表順番を管理するWebアプリ。
発表者はレジュメ・資料をアップロードでき、自分の発表が近づくとSlackで通知が届く。

## 技術スタック

| 層 | 技術 |
|---|---|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| DB | PostgreSQL（Prisma ORM） |
| 認証 | NextAuth.js（メール＋パスワード） |
| 通知 | Slack Incoming Webhook |
| スケジューラ | Vercel Cron Jobs |
| ストレージ | Vercel Blob（レジュメ・資料） |
| デプロイ | Vercel |
| スタイル | Tailwind CSS |

## 主要機能

### 実装予定（MVP）
- [ ] ユーザー登録・ログイン（メール＋パスワード）
- [ ] 輪読セッション（シリーズ）の作成・管理
- [ ] 発表順番リストの登録・並べ替え
- [ ] 発表回ごとのタイトル・日時・担当者の管理
- [ ] レジュメ・資料のアップロード（PDF / スライド）
- [ ] 発表N回前にSlack通知（Cron Job経由）

### 将来的な拡張候補
- コメント・フィードバック機能（発表後）
- 過去の発表アーカイブ・検索
- 欠席・順番スワップのリクエスト機能
- 発表評価・星付け機能
- 複数の輪読グループ対応

## ディレクトリ構成（想定）

```
src/
  app/
    (auth)/           # ログイン・登録ページ
    dashboard/        # トップページ（次回発表・直近スケジュール）
    sessions/         # 輪読セッション一覧・詳細
    admin/            # 管理者向けページ（順番編集など）
    api/
      auth/           # NextAuth.js エンドポイント
      sessions/       # セッションCRUD
      notify/         # Slack通知トリガー（Cron用）
  components/
  lib/
    prisma.ts         # Prismaクライアント
    slack.ts          # Slack通知ユーティリティ
    auth.ts           # NextAuth設定
  prisma/
    schema.prisma
```

## 環境変数

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
SLACK_WEBHOOK_URL=
BLOB_READ_WRITE_TOKEN=   # Vercel Blob
```

## スタイル・デザイン

スタイルの詳細は **[DESIGN.md](./DESIGN.md)** を参照すること。Apple デザインシステムをベースにした設計指針が定義されている。

### 要点（DESIGN.md より）

- **カラー**: アクセントカラーは `#0066cc`（Action Blue）のみ。第二アクセントカラーは使わない
- **タイポグラフィ**: `SF Pro Display / SF Pro Text`（代替：Inter）。ボディは17px / weight 400 / line-height 1.47
- **ボーダーラジアス**: CTAボタンは `pill`（9999px）、カードは `18px`、ユーティリティボタンは `8px`
- **シャドウ**: 影は商品画像のみ（`rgba(0,0,0,0.22) 3px 5px 30px`）。カード・ボタンに影は使わない
- **レイアウト**: セクションは Light tile ↔ Dark tile の交互配置。余白の基本単位は8px
- **インタラクション**: ボタンのアクティブ状態は `transform: scale(0.95)` のみ

### Tailwind への適用方針

```js
// tailwind.config.js に追加するカスタムトークン例
colors: {
  primary: '#0066cc',
  'primary-focus': '#0071e3',
  'primary-on-dark': '#2997ff',
  ink: '#1d1d1f',
  canvas: '#ffffff',
  'canvas-parchment': '#f5f5f7',
  'surface-tile-1': '#272729',
}
```

## 開発ルール

- コンポーネントはすべてTypeScriptで型付け（`any` 禁止）
- DB操作はすべてPrisma経由（生SQLは原則使わない）
- 認証が必要なAPIルートは必ず `getServerSession` でセッション確認
- ファイルアップロードはサイズ制限を設ける（例：最大20MB）
- Slack通知はべき等になるよう重複送信を防ぐ

## コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run lint         # ESLint
npx prisma studio    # DB GUI
npx prisma migrate dev  # マイグレーション実行
```

## データモデル（Prisma 概要）

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   # bcryptハッシュ
  sessions  Session[]
  presentations Presentation[]
}

model ReadingGroup {
  id           String   @id @default(cuid())
  name         String
  description  String?
  presentations Presentation[]
}

model Presentation {
  id          String   @id @default(cuid())
  order       Int
  title       String?
  scheduledAt DateTime?
  presenter   User     @relation(fields: [presenterId], references: [id])
  presenterId String
  group       ReadingGroup @relation(fields: [groupId], references: [id])
  groupId     String
  resumeUrl   String?  # Vercel Blob URL
  notified    Boolean  @default(false)
}
```
