# Shinyu AI - 統合占いアプリケーション

**ステータス**: ✅ 独立リポジトリに移行完了
**優先度**: P1-High
**技術スタック**: Rust + Next.js

---

## 🔗 移行完了

shinyu-aiプロジェクトは独立リポジトリに移行しました：

**新リポジトリ**: https://github.com/ShunsukeHayashi/shinyu-ai

---

## 📚 概要

タロット、易経、西洋占星術を統合し、AIが総合的に分析・アドバイスを提供する占いプラットフォーム。

### 主要機能
- **タロット占い** (78枚のカード)
- **易経占い** (64卦)
- **西洋占星術**
- **AI解釈** (GPT-4搭載)
- **記憶システム** (ベクトルDB)
- **SNS統合** (Twitter自動返信)
- **音声合成** (VOICEVOX)

---

## 🏗️ アーキテクチャ

### Rust Backend
- キャラクター管理
- 占い診断エンジン
- 対話システム
- メモリー管理（ベクトルDB）
- LLM統合

### Next.js Frontend
- レスポンシブWebUI
- WebSocket対話
- アバター生成
- 音声合成（TTS/STT）

---

## 📊 統計

- **ファイル数**: 109 files
- **コード行数**: 34,210 lines
- **サイズ**: 1.3MB
- **ドキュメント**: 完全なビジネスプラン・製品コンセプト付き

---

## 📖 ドキュメント

### ビジネス関連
- [Market Research Report](https://github.com/ShunsukeHayashi/shinyu-ai/blob/main/MARKET_RESEARCH_REPORT.md)
- [Product Concept Summary](https://github.com/ShunsukeHayashi/shinyu-ai/blob/main/PRODUCT_CONCEPT_SUMMARY.md)
- [Roadmap](https://github.com/ShunsukeHayashi/shinyu-ai/blob/main/ROADMAP.md)

### 技術関連
- [Architecture](https://github.com/ShunsukeHayashi/shinyu-ai/blob/main/ARCHITECTURE.md)
- [Development Guide](https://github.com/ShunsukeHayashi/shinyu-ai/blob/main/DEVELOPMENT.md)
- [User Guide](https://github.com/ShunsukeHayashi/shinyu-ai/blob/main/USER_GUIDE.md)

---

## 🚀 クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/ShunsukeHayashi/shinyu-ai.git
cd shinyu-ai

# Rustバックエンド起動
cargo run

# Next.jsフロントエンド起動（別ターミナル）
cd app
npm install
npm run dev
```

詳細は新リポジトリのREADMEを参照してください。

---

## 📈 収益モデル

### 想定収益（Year 1）
- フリーミアムモデル
- プレミアム機能課金
- API提供
- アフィリエイト

詳細は [Product Concept](https://github.com/ShunsukeHayashi/shinyu-ai/blob/main/PRODUCT_CONCEPT_SUMMARY.md) を参照。

---

## 🔗 関連リンク

- **リポジトリ**: https://github.com/ShunsukeHayashi/shinyu-ai
- **移行Issue**: https://github.com/customer-cloud/miyabi-private/issues/543
- **元の場所**: `miyabi-private/shinyu-ai/` (v0.1.0)

---

## 📝 移行履歴

- **2025-10-25**: 独立リポジトリに移行完了
- **移行元**: `customer-cloud/miyabi-private`
- **移行先**: `ShunsukeHayashi/shinyu-ai`
- **コミット**: 22bf53f

---

**このディレクトリは参照用ドキュメントのみを保持します。**
**実装コードは新リポジトリで管理されています。**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
