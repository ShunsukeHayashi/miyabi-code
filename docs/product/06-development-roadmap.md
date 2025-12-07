# Miyabi Character Studio - Development Roadmap

**Version**: 1.0
**Date**: 2025-12-07
**Timeline**: 2025-12-07 ~ 2026-06-07 (6ヶ月)
**Team Size**: 2名（Backend 1名 + Frontend 1名）

---

## 🎯 Roadmap Overview

### Phase 1: MVP Development (Week 1-10, 2.5ヶ月)
**Goal**: 2026-02-21までに基本機能リリース

### Phase 2: Enhancement & Scaling (Week 11-18, 2ヶ月)
**Goal**: 2026-04-19までに高度機能追加

### Phase 3: Advanced Features (Week 19-26, 2ヶ月)
**Goal**: 2026-06-14までにフル機能完成

---

## 📅 Phase 1: MVP Development (Week 1-10)

### Week 1-2: Foundation Setup (2025-12-07 ~ 2025-12-20)

#### Backend (Rust)
- [x] プロジェクト初期化
  - `cargo new miyabi-character-studio-api`
  - Axum + SQLx + Tokio セットアップ
- [x] AWS RDS PostgreSQL プロビジョニング
  - db.t4g.micro インスタンス作成
  - VPC/Security Group 設定
- [x] データベーススキーマ初期構築
  - `users`, `characters`, `differences` テーブル作成
  - マイグレーションファイル作成 (SQLx)
- [x] 環境変数管理
  - `.env.example` 作成
  - AWS Systems Manager Parameter Store 統合

#### Frontend (React)
- [x] Vite + React 19 プロジェクト初期化
- [x] TailwindCSS セットアップ
- [x] React Router + React Query 統合
- [x] CI/CD パイプライン構築 (GitHub Actions)
  - Frontend: S3 + CloudFront デプロイ
  - Backend: Docker ビルド + ECR push

#### Deliverables
- [x] ローカル開発環境完成
- [x] AWS インフラ基盤構築
- [x] CI/CD自動デプロイ

---

### Week 3: Authentication & User Management (2025-12-21 ~ 2025-12-27)

#### Backend
- [ ] `POST /auth/register` - ユーザー登録
  - bcrypt パスワードハッシュ
  - メールアドレス重複チェック
- [ ] `POST /auth/login` - ログイン
  - JWT トークン発行 (有効期限: 7日)
- [ ] `GET /auth/me` - ログインユーザー情報取得
- [ ] JWT 検証ミドルウェア実装
- [ ] Rate Limiting ミドルウェア (tower-governor)

#### Frontend
- [ ] ログイン/登録フォーム UI
  - React Hook Form + Zod バリデーション
- [ ] JWT トークン管理 (localStorage)
- [ ] 認証状態管理 (Zustand)
- [ ] Protected Route 実装

#### Testing
- [ ] 単体テスト: bcrypt, JWT生成/検証
- [ ] 統合テスト: ユーザー登録 → ログイン フロー

#### Deliverables
- [ ] 認証機能完成
- [ ] ユーザー登録 → ログイン → ダッシュボード遷移可能

---

### Week 4: Character Upload & Analysis (2025-12-28 ~ 2026-01-03)

#### Backend
- [ ] `POST /characters` - キャラクターアップロード
  - multipart/form-data 処理
  - AWS S3 アップロード (boto3 or aws-sdk-s3)
  - 画像検証 (サイズ、形式)
- [ ] Gemini 3 Pro Vision API 統合
  - キャラクター特徴抽出プロンプト作成
  - 一貫性スコア計算ロジック
- [ ] `GET /characters` - キャラクター一覧取得
  - ページネーション実装
- [ ] `GET /characters/{id}` - キャラクター詳細取得

#### Frontend
- [ ] キャラクターアップロード UI
  - ドラッグ&ドロップ
  - プレビュー表示
- [ ] AI分析結果表示
  - 検出された特徴（髪色、目の色、服装）
  - 一貫性スコアメーター
- [ ] キャラクター一覧画面
  - グリッドレイアウト

#### Testing
- [ ] 単体テスト: 画像バリデーション、S3アップロード
- [ ] 統合テスト: アップロード → AI分析 → DB保存

#### Deliverables
- [ ] キャラクター作成機能完成
- [ ] AI分析結果が正しく表示される

---

### Week 5-6: Difference Generation Engine (2026-01-04 ~ 2026-01-17)

#### Backend
- [ ] `POST /differences/batch` - 差分一括生成開始
  - AWS SQS キュー統合
  - ジョブID発行 (batch_id)
- [ ] AI Generation Lambda 関数 (Python)
  - Gemini 3 Pro API 統合
  - 一貫性維持プロンプト最適化
  - 並列生成 (5差分同時)
- [ ] `GET /differences/batch/{batchId}` - 生成状況取得
  - リアルタイム進捗更新
  - WebSocket 検討 (Phase 2)
- [ ] `POST /differences/{id}/regenerate` - 再生成

#### Frontend
- [ ] 差分生成設定 UI
  - 表情チェックボックス（デフォルト5種）
  - 解像度、アスペクト比選択
- [ ] 生成中プログレスバー
  - リアルタイム進捗表示 (ポーリング)
  - 推定残り時間表示
- [ ] 生成完了通知
  - ブラウザ通知 API

#### AI Prompt Optimization
```python
# 一貫性95%達成のためのプロンプト調整
base_prompt = """
A {art_style} character with the following features:
- Hair: {hair_color} {hair_style}, {hair_length} length
- Eyes: {eye_color} {eye_shape} eyes
- Outfit: {outfit_primary}, {outfit_secondary}
- Body Type: {body_type}

CRITICAL: Maintain exact character consistency.
ONLY CHANGE: Facial expression to {expression_modifier}

Same pose, same angle, same lighting, same art style.
High quality, professional illustration, transparent background.
"""
```

#### Testing
- [ ] 負荷テスト: 5差分同時生成
- [ ] 一貫性テスト: 同じキャラで10回生成 → 平均一貫性95%以上
- [ ] エラーハンドリング: Gemini API失敗時のリトライ

#### Deliverables
- [ ] 差分生成機能完成
- [ ] 一貫性95%達成確認
- [ ] 平均生成時間 < 25分

---

### Week 7: Preview & Comparison (2026-01-18 ~ 2026-01-24)

#### Backend
- [ ] 差分画像のCDN配信最適化 (CloudFront)
- [ ] 画像リサイズAPI (オプション)

#### Frontend
- [ ] グリッドビュー実装
  - 5差分を1画面で並列表示
  - ホバー時にアクション表示（再生成、編集、DL）
- [ ] 個別プレビューモーダル
  - 全画面表示
  - 一貫性スコア表示
- [ ] 比較モード
  - 2差分を左右split表示
  - スライダーで比較
- [ ] 一貫性メーター UI コンポーネント

#### Testing
- [ ] UI/UXテスト: 30分フロー達成確認
- [ ] レスポンシブテスト (デスクトップのみMVP)

#### Deliverables
- [ ] プレビュー & 比較機能完成
- [ ] ユーザーが差分を視覚的に確認可能

---

### Week 8: Export & Download (2026-01-25 ~ 2026-01-31)

#### Backend
- [ ] `GET /export/{batchId}?format=zip` - ZIP一括DL
  - Rust `zip` crate 統合
  - metadata.json 生成
- [ ] `GET /export/{batchId}/vtube-studio` - VTube Studio形式
  - character.json フォーマット生成
- [ ] S3 署名付きURL生成 (有効期限: 1時間)

#### Frontend
- [ ] エクスポート画面 UI
  - 形式選択 (ZIP, VTube Studio, Live2D PSD)
  - DLボタン
- [ ] 一括DL機能
  - ZIP自動ダウンロード
  - ファイル名自動設定

#### Testing
- [ ] ZIPファイル構造検証
- [ ] VTube Studio連携テスト (実機)

#### Deliverables
- [ ] エクスポート機能完成
- [ ] VTube Studioで差分が使用可能

---

### Week 9: Credits & Billing (2026-02-01 ~ 2026-02-07)

#### Backend
- [ ] `user_credits` テーブル初期化
- [ ] `GET /credits/usage` - クレジット使用状況API
- [ ] `GET /credits/transactions` - 履歴API
- [ ] Stripe API 統合
  - `POST /billing/subscribe` - Checkout Session作成
  - `POST /billing/webhook` - Webhook処理
- [ ] プラン別クレジット制限ミドルウェア

#### Frontend
- [ ] クレジット表示 UI (ヘッダー)
- [ ] プラン管理画面
  - Free/Basic/Pro 比較表
  - アップグレードボタン
- [ ] Stripe Checkout 統合

#### Testing
- [ ] Stripe Test Mode でサブスクリプションテスト
- [ ] クレジット超過時のエラーハンドリング

#### Deliverables
- [ ] クレジット管理機能完成
- [ ] Stripe決済フロー動作確認

---

### Week 10: MVP Testing & Soft Launch (2026-02-08 ~ 2026-02-14)

#### QA Testing
- [ ] 全機能統合テスト
  - ユーザー登録 → キャラ作成 → 差分生成 → DL
- [ ] パフォーマンステスト
  - API レスポンス時間 < 3秒
  - 同時ユーザー10名負荷テスト
- [ ] セキュリティテスト
  - SQLインジェクション、XSS対策確認
  - JWT トークン検証

#### Bug Fixes
- [ ] Critical バグ修正
- [ ] UI/UX 調整

#### Soft Launch
- [ ] Beta ユーザー5名招待
- [ ] フィードバック収集
- [ ] NPS スコア測定

#### Deliverables
- [ ] **MVP完成 🎉**
- [ ] ソフトローンチ完了
- [ ] 初期ユーザーフィードバック取得

---

## 📅 Phase 2: Enhancement & Scaling (Week 11-18)

### Week 11-12: Performance Optimization (2026-02-15 ~ 2026-02-28)

#### Backend
- [ ] データベースクエリ最適化
  - N+1問題解決
  - Materialized Views 導入
- [ ] Redis キャッシュ導入
  - キャラクター一覧キャッシュ
  - 生成ジョブ状況キャッシュ
- [ ] Lambda Cold Start 対策
  - プロビジョニング済みconcurrency

#### Frontend
- [ ] 画像Lazy Loading
- [ ] コード分割 (React.lazy)
- [ ] Service Worker (PWA化 - Phase 3)

#### Deliverables
- [ ] API レスポンス時間 50%改善
- [ ] 同時ユーザー50名対応可能

---

### Week 13-14: Custom Expressions (2026-03-01 ~ 2026-03-14)

#### Backend
- [ ] カスタム表情プロンプト機能
- [ ] 差分タイプ追加 (最大10種)
- [ ] プロンプトテンプレート保存

#### Frontend
- [ ] カスタム表情入力フォーム
- [ ] プロンプトプレビュー
- [ ] テンプレート保存 UI

#### Deliverables
- [ ] ユーザー定義表情生成可能

---

### Week 15-16: Live2D PSD Export (2026-03-15 ~ 2026-03-28)

#### Backend (Node.js)
- [ ] ag-psd ライブラリ統合
- [ ] レイヤー分けPSD生成
- [ ] `GET /export/{batchId}/live2d-psd` (Pro限定)

#### Frontend
- [ ] PSDエクスポートボタン (Pro限定)

#### Deliverables
- [ ] Live2D Cubism互換PSD出力

---

### Week 17-18: Community Features (2026-03-29 ~ 2026-04-11)

#### Backend
- [ ] キャラクター公開/非公開設定
- [ ] ギャラリー API (`GET /gallery`)
- [ ] いいね機能

#### Frontend
- [ ] コミュニティギャラリー画面
- [ ] いいね、コメント UI

#### Deliverables
- [ ] ユーザー間でキャラクター共有可能

---

## 📅 Phase 3: Advanced Features (Week 19-26)

### Week 19-20: 3D Model Support (2026-04-12 ~ 2026-04-25)

#### Backend
- [ ] VRM/VRoid形式対応
- [ ] 3Dモデル差分生成

#### Deliverables
- [ ] VRoidモデルでも差分生成可能

---

### Week 21-22: Animation Generation (2026-04-26 ~ 2026-05-09)

#### Backend
- [ ] 表情モーフィングアニメーション
- [ ] GIFエクスポート

#### Deliverables
- [ ] 差分間のアニメーション生成

---

### Week 23-24: API Public Release (2026-05-10 ~ 2026-05-23)

#### Backend
- [ ] Public API 公開 (Pro限定)
- [ ] API Key 管理
- [ ] ドキュメント (OpenAPI)

#### Deliverables
- [ ] 外部ツールから差分生成可能

---

### Week 25-26: Final Polish & Launch (2026-05-24 ~ 2026-06-07)

#### QA
- [ ] 全機能最終テスト
- [ ] セキュリティ監査

#### Marketing
- [ ] ランディングページ最適化
- [ ] プレスリリース

#### Deliverables
- [ ] **正式リリース 🚀**

---

## 📊 Success Metrics

### MVP (Phase 1) KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| ユーザー登録数 | 50名 | Google Analytics |
| 有料転換率 | 10% | Stripe Dashboard |
| 平均生成時間 | < 30分 | CloudWatch Logs |
| 一貫性スコア | 平均95%+ | Database Query |
| NPS | 40+ | Survey |
| エラー率 | < 5% | Sentry |
| API稼働率 | 99.5%+ | CloudWatch |

### Phase 2 KPIs

| Metric | Target |
|--------|--------|
| ユーザー数 | 200名 |
| MRR | ¥196,000 (200名 x ¥980) |
| Churn Rate | < 10%/月 |
| カスタム表情使用率 | 30% |

### Phase 3 KPIs

| Metric | Target |
|--------|--------|
| ユーザー数 | 500名 |
| MRR | ¥490,000 |
| API利用企業 | 5社 |

---

## 💰 Cost Estimate (Phase 1-3)

### Monthly Infrastructure Cost

| Phase | AWS Cost | External Services | Total |
|-------|----------|-------------------|-------|
| Phase 1 (MVP) | $55 | $30 (Stripe, SendGrid) | **$85/月** |
| Phase 2 | $120 | $50 | **$170/月** |
| Phase 3 | $250 | $100 | **$350/月** |

### Revenue Projection

| Phase | Users | MRR | Profit |
|-------|-------|-----|--------|
| Phase 1 | 50 | ¥49,000 (10% x ¥980) | **-$40** |
| Phase 2 | 200 | ¥196,000 | **+¥26,000** |
| Phase 3 | 500 | ¥490,000 | **+¥440,000** |

---

## 🚨 Risk Management

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API障害 | High | フォールバック: Stable Diffusion |
| AWS障害 | High | Multi-AZ構成 (Phase 2) |
| 一貫性95%未達 | Medium | プロンプト最適化、再生成機能 |
| スケーラビリティ | Medium | Lambda Auto-Scaling |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| 競合参入 | High | 早期リリース、差別化 (30分完成) |
| ユーザー獲得困難 | High | VTuberコミュニティへの直接営業 |
| 法的問題 (著作権) | Medium | 利用規約明記、商用利用ガイドライン |

---

## 🔗 Next Actions

### Immediate (Week 1)
1. [ ] GitHub Repository 作成
2. [ ] AWS アカウントセットアップ
3. [ ] Stripe アカウント作成
4. [ ] Gemini API Key 取得
5. [ ] プロジェクトキックオフ MTG

### This Week (Week 1-2)
- [ ] Backend 環境構築
- [ ] Frontend 環境構築
- [ ] CI/CD パイプライン構築

---

**Author**: ProductDesignAgent
**Last Updated**: 2025-12-07
**Status**: ✅ Completed

**Ready for Development! 🚀**
