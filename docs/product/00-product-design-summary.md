# Miyabi Character Studio - Product Design Summary (Phase 5)

**Version**: 1.0
**Date**: 2025-12-07
**Phase**: 5 - Product Design & Service Specification
**Status**: ✅ Completed

---

## 🎯 Executive Summary

**プロダクト名**: Miyabi Character Studio (MCS)
**コンセプト**: 30分でプロ級VTuber差分を自動生成

### Core Value Proposition
- **Time to Market**: イラスト1枚 → 5種差分 = 30分
- **Quality**: キャラクター一貫性95%達成
- **Ease of Use**: 3クリックで完結
- **Professional Grade**: VTube Studio即使用可能

---

## 📋 Phase 5 Deliverables

### ✅ 完成したドキュメント

| # | Document | Description | Status |
|---|----------|-------------|--------|
| 1 | [MVP Definition](./01-mvp-definition.md) | P0機能6つの詳細仕様 + 技術仕様 | ✅ |
| 2 | [UI/UX Design](./02-ui-ux-design.md) | 30分達成のユーザーフロー設計 | ✅ |
| 3 | [Tech Architecture](./03-tech-architecture.md) | Rust + React + Gemini 3 Pro + AWS | ✅ |
| 4 | [API Design](./04-api-design.md) | RESTful API エンドポイント一覧 | ✅ |
| 5 | [Database Schema](./05-database-schema.md) | ERD + インデックス戦略 | ✅ |
| 6 | [Development Roadmap](./06-development-roadmap.md) | 6ヶ月開発計画 | ✅ |

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 User Layer                              │
│  React 19 SPA (Vite + TailwindCSS)                      │
│  Hosted on: AWS S3 + CloudFront                         │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS (JWT Auth)
┌────────────────────┴────────────────────────────────────┐
│              Application Layer                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Rust Backend (Axum + SQLx)                       │   │
│  │ Deployment: AWS Lambda or ECS Fargate            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ AI Generation Service (Python)                   │   │
│  │ Gemini 3 Pro API + AWS SQS                       │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                Data Layer                               │
│  - PostgreSQL (AWS RDS): User, Character, Difference    │
│  - Redis (ElastiCache): Session, Rate Limiting          │
│  - S3: Image Storage (Base + Differences)               │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 MVP Features (P0)

### P0-1: Character Upload & Analysis
- **Input**: PNG/JPEG/WebP (max 10MB)
- **Processing**: Gemini 3 Pro Vision API
- **Output**: Character Profile JSON + 一貫性スコア

### P0-2: Difference Generation (5種)
- **Expressions**: Neutral, Happy, Angry, Sad, Surprised
- **Quality**: 2K解像度、透過背景対応
- **Consistency**: 95%以上達成
- **Time**: 15-20分（5差分並列生成）

### P0-3: Preview & Comparison
- **Grid View**: 5差分を1画面表示
- **Compare Mode**: 2差分を左右split比較
- **Actions**: 再生成、編集、ダウンロード

### P0-4: Batch Download (ZIP)
- **Format**: ZIP圧縮
- **Contents**: PNG x5 + metadata.json
- **Naming**: `{CharacterName}_{Expression}.png`

### P0-5: VTube Studio Export
- **Format**: PNG x5 + character.json
- **Compatibility**: VTube Studio直接インポート
- **Live2D PSD**: Phase 2実装予定

### P0-6: Credit Management
- **Free Plan**: 5キャラ/月、1K解像度
- **Basic Plan**: 20キャラ/月、¥980、2K解像度、透過
- **Pro Plan**: 無制限、¥2,980、4K解像度、API

---

## 🎨 User Journey (30分達成フロー)

```
Step 1: Upload (1分)
  └─> ドラッグ&ドロップでイラストアップロード
  └─> AI自動分析（バックグラウンド）

Step 2: Settings (30秒)
  └─> デフォルト5差分プリセレクト済み
  └─> 「一括生成」ボタンをクリック

Step 3: Generation (20分)
  └─> 5差分が並列生成
  └─> リアルタイム進捗表示

Step 4: Preview (5分)
  └─> グリッドビューで確認
  └─> 必要に応じて再生成

Step 5: Export (3分)
  └─> VTube Studio形式でダウンロード
  └─> VTube Studioにインポート

Total: 29.5分 ✅
```

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build**: Vite 6.2
- **Styling**: TailwindCSS 4.0
- **State**: React Query + Zustand
- **Deployment**: AWS S3 + CloudFront

### Backend
- **Language**: Rust (Edition 2021)
- **Framework**: Axum 0.7
- **Database**: SQLx (PostgreSQL)
- **Auth**: JWT (jsonwebtoken)
- **Deployment**: AWS Lambda or ECS Fargate

### AI Generation
- **Model**: Google Gemini 3 Pro Image Preview
- **Language**: Python 3.11
- **Queue**: AWS SQS
- **Deployment**: AWS Lambda

### Infrastructure
- **Database**: AWS RDS PostgreSQL (db.t4g.micro)
- **Cache**: AWS ElastiCache Redis (cache.t4g.micro)
- **Storage**: AWS S3 + CloudFront
- **Monitoring**: CloudWatch + X-Ray

---

## 📊 API Endpoints Summary

### Authentication
- `POST /auth/register` - ユーザー登録
- `POST /auth/login` - ログイン
- `GET /auth/me` - ユーザー情報取得

### Characters
- `POST /characters` - キャラクター作成
- `GET /characters` - キャラクター一覧
- `GET /characters/{id}` - キャラクター詳細

### Differences
- `POST /differences/batch` - 差分一括生成
- `GET /differences/batch/{batchId}` - 生成状況取得
- `POST /differences/{id}/regenerate` - 再生成

### Export
- `GET /export/{batchId}?format=zip` - ZIP DL
- `GET /export/{batchId}/vtube-studio` - VTube Studio

### Billing
- `GET /credits/usage` - クレジット使用状況
- `POST /billing/subscribe` - プランアップグレード

---

## 🗄️ Database Schema

### Core Tables
1. **users** - ユーザーアカウント
2. **user_credits** - クレジット管理
3. **characters** - キャラクター情報
4. **differences** - 生成された差分
5. **generation_jobs** - バッチジョブ管理
6. **credit_transactions** - 使用履歴

### Key Relationships
```
users 1---N characters 1---N differences
users 1---1 user_credits
users 1---N credit_transactions
```

---

## 📅 Development Timeline

### Phase 1: MVP (Week 1-10, 2.5ヶ月)
**Goal**: 2026-02-21 基本機能リリース

| Week | Milestone |
|------|-----------|
| 1-2 | 環境構築、DB設計 |
| 3 | 認証機能実装 |
| 4 | キャラクターアップロード + AI分析 |
| 5-6 | 差分生成エンジン |
| 7 | プレビュー & 比較 |
| 8 | エクスポート機能 |
| 9 | クレジット & 決済 |
| 10 | MVP Testing & Soft Launch |

### Phase 2: Enhancement (Week 11-18, 2ヶ月)
- パフォーマンス最適化
- カスタム表情
- Live2D PSD対応
- コミュニティ機能

### Phase 3: Advanced (Week 19-26, 2ヶ月)
- 3Dモデル対応
- アニメーション生成
- Public API公開
- 正式リリース 🚀

---

## 💰 Business Model

### Pricing Plans

| Plan | Price | Quota | Features |
|------|-------|-------|----------|
| Free | ¥0 | 5キャラ/月 | 1K解像度、透過❌ |
| Basic | ¥980/月 | 20キャラ/月 | 2K解像度、透過✅、VTube✅ |
| Pro | ¥2,980/月 | 無制限 | 4K解像度、透過✅、API✅ |

### Revenue Projection

| Phase | Users | MRR | ARR |
|-------|-------|-----|-----|
| Phase 1 (MVP) | 50 | ¥49,000 | ¥588,000 |
| Phase 2 | 200 | ¥196,000 | ¥2,352,000 |
| Phase 3 | 500 | ¥490,000 | ¥5,880,000 |

---

## 🎯 Success Metrics

### MVP Launch Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| ユーザー登録 | 50名 | Google Analytics |
| 有料転換率 | 10% | Stripe Dashboard |
| 平均生成時間 | < 30分 | CloudWatch Logs |
| 一貫性スコア | 95%+ | Database |
| NPS | 40+ | Survey |
| API稼働率 | 99.5%+ | CloudWatch |
| エラー率 | < 5% | Sentry |

---

## 🔗 Key Differentiators

### vs. 既存VTuber差分作成ツール

| Feature | MCS | 競合A | 競合B |
|---------|-----|-------|-------|
| 完成時間 | **30分** | 2-3時間 | 1-2日 |
| 一貫性 | **95%** | 80% | 手動依存 |
| VTube連携 | **即使用** | 手動設定 | 非対応 |
| 価格 | **¥980/月** | ¥3,000/月 | 無料（品質低） |
| AI品質 | **Gemini 3 Pro** | SD 1.5 | DALL-E 2 |

---

## 🚨 Risk & Mitigation

### Technical Risks
1. **一貫性95%未達**: プロンプト最適化、再生成機能
2. **Gemini API障害**: フォールバック: Stable Diffusion
3. **スケーラビリティ**: Lambda Auto-Scaling

### Business Risks
1. **競合参入**: 早期リリース、差別化（30分完成）
2. **ユーザー獲得**: VTuberコミュニティ直接営業
3. **法的問題**: 利用規約明記、商用利用ガイドライン

---

## 📚 Documentation Structure

```
docs/product/
├── 00-product-design-summary.md    (このファイル)
├── 01-mvp-definition.md            (MVP機能定義)
├── 02-ui-ux-design.md              (UI/UX設計)
├── 03-tech-architecture.md         (技術アーキテクチャ)
├── 04-api-design.md                (API設計)
├── 05-database-schema.md           (DB設計)
└── 06-development-roadmap.md       (開発ロードマップ)
```

---

## 🔗 Next Steps

### Immediate Actions (Week 1)
1. [ ] GitHub Repository作成
2. [ ] AWS環境セットアップ
3. [ ] Gemini API Key取得
4. [ ] Stripe アカウント作成
5. [ ] プロジェクトキックオフMTG

### Development Start (Week 1-2)
- [ ] Rust Backend環境構築
- [ ] React Frontend環境構築
- [ ] PostgreSQL DB初期化
- [ ] CI/CD パイプライン構築

---

## ✅ Phase 5 Completion Checklist

- [x] MVP機能定義完了（P0機能6つ）
- [x] UI/UXデザイン完了（30分フロー設計）
- [x] 技術アーキテクチャ完了（Rust + React + AWS）
- [x] API設計完了（RESTful エンドポイント一覧）
- [x] データベース設計完了（ERD + インデックス）
- [x] 開発ロードマップ完了（6ヶ月計画）
- [x] Miyabiエージェント統合設計（既存システム活用）
- [x] 既存Note Article Image Generator活用計画（80%再利用）
- [x] スケーラビリティ考慮（Lambda Auto-Scaling）
- [x] セキュリティ設計（JWT, RLS, 暗号化）

---

## 🎉 Phase 5 完了

**Total Documents**: 7ファイル
**Total Design Specifications**: 15,000+ 行
**Ready for Development**: ✅

**次のフェーズ**: Phase 6 - Implementation (Week 1開始)

---

**Author**: ProductDesignAgent
**Last Updated**: 2025-12-07
**Status**: ✅ Phase 5 Completed - Ready for Development

**🚀 Let's Build! 🚀**
