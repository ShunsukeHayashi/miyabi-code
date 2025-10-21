# BytePlus Video API Bootcamp - メンテナンスガイド

## 📋 概要

このドキュメントは、BytePlus Video API Bootcampランディングページの定期更新とメンテナンス手順を定義します。

**管理対象URL**: https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/

**更新頻度**: 以下の3つのカテゴリに分類

---

## 📅 更新スケジュール

### 🔴 毎日更新（Daily）

#### 1. 残席数の更新

**ファイル**: `index.html`
**箇所**: L450付近

```html
<div class="availability">
  <span class="availability-label">残席:</span>
  <span class="availability-number">XX席</span> <!-- ここを毎日更新 -->
</div>
```

**更新手順**:
```bash
# 1. index.htmlを編集
vim docs/landing-pages/byteplus-bootcamp/index.html

# 2. 残席数を更新（例: 42席 → 41席）
# 検索: availability-number
# 変更: <span class="availability-number">41席</span>

# 3. コミット
git add docs/landing-pages/byteplus-bootcamp/index.html
git commit -m "update(landing): update remaining seats to 41"
git push origin main
```

---

### 🟡 週次更新（Weekly）

#### 1. 参加者の声（Testimonials）の追加

**ファイル**: `index.html`
**箇所**: L650付近 - Testimonialsセクション

**追加手順**:
```html
<!-- 新しいTestimonialを追加 -->
<div class="testimonial-item">
  <img src="images/testimonial-4.jpg" alt="参加者4" class="testimonial-avatar">
  <div class="testimonial-content">
    <p class="testimonial-text">「新しいレビュー内容」</p>
    <p class="testimonial-author">— 参加者名, 所属企業</p>
  </div>
</div>
```

#### 2. FAQの更新

**ファイル**: `index.html`
**箇所**: L800付近 - FAQセクション

**追加手順**:
```html
<!-- 新しいFAQを追加 -->
<div class="faq-item">
  <button class="faq-question">
    <span>新しい質問内容</span>
    <svg>...</svg>
  </button>
  <div class="faq-answer">
    <p>回答内容</p>
  </div>
</div>
```

---

### 🟢 必要に応じて更新（As Needed）

#### 1. カウントダウン締切の変更

**ファイル**: `script.js`
**箇所**: L20付近

```javascript
const countdownDate = new Date('2025-11-10T23:59:59+09:00').getTime();
// ↓ 新しい締切に変更
const countdownDate = new Date('2025-11-15T23:59:59+09:00').getTime();
```

#### 2. 料金プランの変更

**ファイル**: `index.html`
**箇所**: L500付近 - Pricingセクション

```html
<span class="price-amount">¥29,800</span>
<!-- ↓ 新しい料金に変更 -->
<span class="price-amount">¥24,800</span>
```

#### 3. 開催日時の変更

**ファイル**: `index.html`
**箇所**: L300付近 - Event Detailsセクション

```html
<p class="event-date">📅 2025年11月15日(土) 10:00-13:30</p>
<!-- ↓ 新しい日時に変更 -->
<p class="event-date">📅 2025年12月15日(日) 13:00-16:30</p>
```

---

## 💾 バックアップ戦略

### デプロイ前バックアップ

**必須**: 本番環境への変更前に必ずバックアップを取得

```bash
# バックアップスクリプト
#!/bin/bash
BACKUP_DIR="docs/landing-pages/byteplus-bootcamp-backup-$(date +%Y%m%d-%H%M%S)"
cp -r docs/landing-pages/byteplus-bootcamp "$BACKUP_DIR"
echo "✅ Backup created: $BACKUP_DIR"
```

**保存場所**: `docs/landing-pages/`
**保持期間**: 30日間（月次クリーンアップ）

### バックアップからの復元

```bash
# 1. 最新のバックアップを確認
ls -lt docs/landing-pages/ | grep byteplus-bootcamp-backup | head -1

# 2. 復元
BACKUP="docs/landing-pages/byteplus-bootcamp-backup-20251021-213000"
rm -rf docs/landing-pages/byteplus-bootcamp
cp -r "$BACKUP" docs/landing-pages/byteplus-bootcamp

# 3. プッシュ
git add docs/landing-pages/byteplus-bootcamp/
git commit -m "revert(landing): restore from backup $BACKUP"
git push origin main
```

---

## ✅ 更新チェックリスト

### 本番デプロイ前

- [ ] ローカルでindex.htmlを確認（ブラウザで開く）
- [ ] カウントダウンタイマーが動作するか確認
- [ ] フォームバリデーションが動作するか確認
- [ ] スクロールアニメーションが動作するか確認
- [ ] モバイル表示が正常か確認（Chrome DevTools）
- [ ] バックアップを取得
- [ ] Git commit & push

### 本番デプロイ後

- [ ] 公開URLにアクセス: https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/
- [ ] 全セクションが正しく表示されるか確認
- [ ] カウントダウンタイマーが動作するか確認
- [ ] フォームが送信できるか確認
- [ ] GA4でページビューが計測されるか確認
- [ ] Facebook Pixelがイベントを送信するか確認
- [ ] モバイル/タブレット/デスクトップで表示確認

---

## 🔧 トラブルシューティング

### 問題1: GitHub Pagesが404エラーを返す

**原因**: ビルドが完了していない、またはパスが間違っている

**解決策**:
```bash
# GitHub Pagesのビルド状況を確認
gh api repos/ShunsukeHayashi/miyabi-private/pages/builds/latest

# ビルドが完了するまで待つ（通常3-5分）
# それでも404の場合は、リポジトリ設定を確認:
# Settings > Pages > Source: main / /docs
```

### 問題2: カウントダウンタイマーが動作しない

**原因**: JavaScriptエラー、日時フォーマットが間違っている

**解決策**:
```bash
# ブラウザのコンソールを確認
# Chrome DevTools > Console

# script.jsのcountdownDate形式を確認:
# new Date('2025-11-10T23:59:59+09:00').getTime()
# ↑ ISO 8601形式で記述されているか確認
```

### 問題3: フォームが送信できない

**原因**: バリデーションエラー、Stripe統合エラー

**解決策**:
```bash
# Chrome DevTools > Network タブで確認
# フォーム送信時のリクエストを確認

# Stripe Checkout統合が完了しているか確認:
# script.js L300付近のstripe.redirectToCheckout()
```

---

## 📊 モニタリング

### Google Analytics 4

**ダッシュボード**: https://analytics.google.com/

**監視すべきKPI**:
- **Page Views**: 10,000PV/月 目標
- **Conversion Rate**: 5% 目標
- **Bounce Rate**: < 40% 目標
- **Avg. Session Duration**: > 3分 目標

### Facebook Pixel

**Events Manager**: https://business.facebook.com/events_manager2

**監視すべきイベント**:
- `PageView` - ページ閲覧
- `Lead` - 申込フォーム送信
- `CompleteRegistration` - 申込完了

---

## 🚨 緊急連絡先

**担当者**: ShunsukeHayashi
**Email**: (記載が必要な場合)
**GitHub**: https://github.com/ShunsukeHayashi

**緊急時の対応**:
1. バックアップから復元（上記手順参照）
2. GitHub Issueを作成: https://github.com/ShunsukeHayashi/miyabi-private/issues/new
3. ラベル: `🔥 priority:P0-Critical`, `🐛 type:bug`

---

## 📝 変更履歴

| 日付 | 変更内容 | 担当者 |
|------|---------|--------|
| 2025-10-21 | 初版作成 | Claude Code |
| - | - | - |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
