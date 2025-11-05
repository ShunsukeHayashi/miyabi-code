# 🎨 Miyabi Dashboard

**完全自律型AI開発オペレーションプラットフォーム - Web Dashboard**

Miyabi の Agent ステータス、Issue 一覧、開発進捗をリアルタイムで可視化する Web アプリケーション。

---

## 📊 Features

- **Agent Status Monitor**: 7つのAgent (Coordinator, CodeGen, Review, PR, Deployment, Issue, Refresher) の実行状況をリアルタイム表示
- **Issue Dashboard**: GitHub Issues を優先度・ラベル別に一覧表示
- **Progress Tracking**: 各Agentの進捗率 (0-100%) を視覚化
- **GitHub Integration**: GitHub API を使った実際のIssueデータ取得

---

## 🚀 Quick Start

### 1. インストール

```bash
cd miyabi-dashboard
npm install
```

### 2. 環境変数設定

`.env.local` を作成：

```bash
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=customer-cloud/miyabi-private
```

GitHub Personal Access Token を取得:
https://github.com/settings/tokens

権限: `repo` (Full control of private repositories)

### 3. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### 4. ビルド & デプロイ

```bash
npm run build
npm run start
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **API**: GitHub REST API v3

---

## 📂 Project Structure

```
miyabi-dashboard/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx             # Main dashboard page
│   └── globals.css          # Global styles
├── pages/api/
│   ├── agents.ts            # Agent status API
│   └── issues.ts            # GitHub Issues API
├── components/              # Reusable components (TBD)
├── lib/                     # Utility functions (TBD)
├── public/                  # Static assets
├── .env.local               # Environment variables
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

---

## 🎨 UI Components

### Dashboard Page

- **Header**: タイトル、説明
- **Stats Cards**: 統計情報 (Total Agents, Running, Completed, Open Issues)
- **Agent Status Grid**: 7つのAgentのカード表示 (進捗バー付き)
- **Issue List**: GitHubからフェッチしたIssue一覧

### Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Miyabi Blue | #3B82F6 | Running agents |
| Miyabi Purple | #8B5CF6 | Open issues count |
| Miyabi Green | #10B981 | Completed agents |
| Miyabi Yellow | #F59E0B | Warnings |
| Miyabi Red | #EF4444 | Failed agents |

---

## 🔌 API Endpoints

### `GET /api/agents`

Agent ステータス一覧を取得

**Response:**
```json
{
  "agents": [
    {
      "name": "CoordinatorAgent",
      "status": "running",
      "progress": 75,
      "currentTask": "Issue #531 分析中"
    }
  ]
}
```

### `GET /api/issues`

GitHub Issues を取得

**Query Parameters:**
- `repo` (default: `customer-cloud/miyabi-private`)
- `state` (default: `open`)
- `limit` (default: `10`)

**Response:**
```json
{
  "issues": [
    {
      "number": 531,
      "title": "統合占いアプリ「Shinyu（真由）」開発プロジェクト",
      "state": "open",
      "labels": ["⚠️ priority:P1-High", "✨ type:feature"],
      "url": "https://github.com/customer-cloud/miyabi-private/issues/531",
      "createdAt": "2025-10-25T05:17:47Z",
      "updatedAt": "2025-10-25T05:17:47Z"
    }
  ]
}
```

---

## 🚧 Roadmap

### Phase 1: MVP ✅
- [x] Next.js プロジェクト初期化
- [x] Dashboard UI 実装
- [x] Agent ステータス表示
- [x] GitHub API 統合

### Phase 2: リアルタイム更新
- [ ] WebSocket 統合
- [ ] Agent ステータスのリアルタイム更新
- [ ] Issue の自動リフレッシュ

### Phase 3: 高度な機能
- [ ] Agent ログ表示
- [ ] Issue フィルタリング (priority, label, assignee)
- [ ] Agent の手動起動 / 停止
- [ ] ダークモード / ライトモード切り替え

### Phase 4: デプロイ
- [ ] Vercel デプロイ
- [ ] 環境変数の本番設定
- [ ] カスタムドメイン設定

---

## 📝 License

MIT License

---

## 👥 Author

**Miyabi Development Team**
- GitHub: https://github.com/ShunsukeHayashi/Miyabi
- Created with: Claude Code + Infinity Mode 🚀

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**
