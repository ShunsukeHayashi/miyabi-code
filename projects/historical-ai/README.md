# Historical AI - 歴史上の偉人AIアバター販売プラットフォーム

**作成日**: 2025-10-25
**バージョン**: v0.1.0 MVP
**ステータス**: 開発中（Wave 1-3完了）

---

## 🎯 プロジェクト概要

歴史上の偉人（織田信長、坂本龍馬、徳川家康）をAIアバター化し、対話サービスとして提供する。

### ターゲットユースケース
1. **経営者向け**: 織田信長AIに経営戦略を相談
2. **教育向け**: 坂本龍馬AIが子供に歴史を教える
3. **エンタメ向け**: 偉人との雑談・対話体験

---

## 📁 プロジェクト構造

```
projects/historical-ai/
├── README.md              # このファイル
├── frontend/             # Next.js 16 Web UI
│   ├── app/              # App Router
│   ├── components/       # React Components
│   └── lib/              # API Client
├── backend/              # Rust API Server（シンボリックリンク）
│   ├── miyabi-historical-ai/   → crates/miyabi-historical-ai
│   └── miyabi-historical-api/  → crates/miyabi-historical-api
└── docs/                 # ビジネスプラン・設計書
    ├── business-plan/
    └── architecture/
```

---

## 🚀 クイックスタート

### 前提条件
- Rust 1.75+ (`rustup install stable`)
- Node.js 20+ (`nvm install 20`)
- OpenAI API Key

### 環境変数設定
```bash
# .env.local
export OPENAI_API_KEY=sk-proj-xxx
```

### バックエンドAPI起動
```bash
cd ../../crates/miyabi-historical-api
OPENAI_API_KEY=sk-xxx cargo run
# → http://localhost:3000
```

### フロントエンド起動
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3002
```

---

## 🏗️ 技術スタック

### バックエンド
- **言語**: Rust 2021 Edition
- **フレームワーク**: Axum 0.7
- **LLM**: OpenAI GPT-4o (`gpt-4o`)
- **RAG**: Qdrant Vector DB + Embedding
- **データ**: Wikipedia + 歴史書籍

### フロントエンド
- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript 5.9
- **スタイリング**: Tailwind CSS 4
- **状態管理**: TanStack Query 5

---

## 📊 実装状況

### ✅ 完了（Wave 1-3）
- [x] RAGパイプライン構築（Wikipedia統合）
- [x] プロンプトエンジニアリング（3偉人キャラクター定義）
- [x] Axum APIサーバー実装
- [x] Next.js チャットUI実装
- [x] OpenAI GPT-4o統合

### 🔄 進行中
- [ ] RAG検索精度向上
- [ ] 音声合成（VOICEVOX統合）
- [ ] 偉人拡張（10名→50名）

### 📅 計画中
- [ ] 有料プラン実装（$12.99/mo）
- [ ] モバイルアプリ（React Native）
- [ ] API提供（$0.01/message）

---

## 💰 ビジネスモデル

### プラン構成
| プラン | 価格 | 内容 |
|--------|------|------|
| **Free** | 無料 | 50 messages/月、5偉人 |
| **Pro** | $12.99/月 | 無制限、全偉人、音声対応 |
| **Enterprise** | $499/月 | カスタム偉人、API、白ラベル |

### 収益予測（Year 1）
- **Total Revenue**: $268,862
- **MRR (Month 12)**: $42,618
- **ARR Run-Rate**: $511,416
- **Pro Users**: 2,319
- **Break-Even**: Month 10-11

詳細: `docs/business-plan/historical-ai-business-model.md`

---

## 🧪 テスト

### バックエンド
```bash
cd ../../crates/miyabi-historical-ai
cargo test --all
cargo clippy -- -D warnings
```

### フロントエンド
```bash
cd frontend
npm run build
npm run lint
```

---

## 📚 API仕様

### POST /api/chat

**Request**:
```json
{
  "figure": "oda_nobunaga",
  "message": "新規事業の判断に迷っています",
  "user_id": "user_123"
}
```

**Response**:
```json
{
  "reply": "その迷いは不要であろう。まずは...",
  "sources": ["Wikipedia: 桶狭間の戦い"],
  "timestamp": "2025-10-25T12:00:00Z",
  "figure": "oda_nobunaga"
}
```

---

## 📖 関連ドキュメント

- [親Issue #532](https://github.com/customer-cloud/miyabi-private/issues/532) - Epic Issue
- [サブIssue #533-537](https://github.com/customer-cloud/miyabi-private/issues?q=is%3Aissue+label%3Ahistorical-ai) - タスク一覧
- [ビジネスモデル詳細](docs/business-plan/historical-ai-business-model.md)

---

## 🤝 コントリビューション

このプロジェクトはMiyabi自律型開発フレームワークの一部です。

**開発フロー**:
1. Issue作成（GitHub Issues）
2. Agent自動実行（CoordinatorAgent → CodeGenAgent）
3. PR自動作成（Draft PR）
4. レビュー → マージ

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](../../LICENSE) を参照

---

🤖 Generated with Miyabi Framework
Last Updated: 2025-10-25
