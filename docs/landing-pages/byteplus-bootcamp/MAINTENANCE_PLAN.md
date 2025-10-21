# Maintenance Plan - BytePlus Landing Page

## 📋 概要

BytePlus Video API Bootcampランディングページの定期メンテナンス計画書

**対象期間**: 2025年11月10日まで（セミナー開催日）
**更新頻度**: 週次 + イベントドリブン
**担当者**: プロジェクトオーナー

---

## 🔄 定期更新項目

### 1. カウントダウンタイマー（自動更新）
- **頻度**: リアルタイム（JavaScript自動更新）
- **対象**: `script.js` の `initCountdown()` 関数
- **アクション**: 不要（自動）

### 2. 残席数（週次更新）
- **頻度**: 毎週月曜日 10:00
- **対象**: `index.html` Line 89
- **更新箇所**:
  ```html
  <span class="seats-remaining">残り15席</span>
  ```
- **手順**:
  1. 申込数を確認（GA4 or Stripe Dashboard）
  2. 残席数を計算（オンライン50名 - 申込数）
  3. HTMLを更新してコミット

### 3. 参加者の声（2週間毎）
- **頻度**: 2週間毎
- **対象**: testimonial セクション
- **更新内容**: 新しい参加者レビュー追加（最大6件）
- **ソース**: Google Forms, アンケート, SNS

### 4. FAQ追加（月次）
- **頻度**: 月1回
- **対象**: FAQ セクション
- **追加基準**: 3回以上の同じ質問があった場合
- **手順**:
  1. よくある質問をリスト化
  2. 回答を作成
  3. `index.html` FAQ セクションに追加
  4. Schema.org FAQPage更新

### 5. A/Bテスト結果適用（4週間毎）
- **頻度**: 4週間毎（統計的有意性確認後）
- **対象**: ヘッドライン, CTAカラー, 料金順序
- **手順**:
  1. GA4でA/Bテスト結果確認
  2. 統計的有意性検定（p < 0.05）
  3. 勝者バリエーションを本番適用
  4. A/Bテストを新しいバリエーションで継続

---

## 🚨 イベントドリブン更新

### セミナー満席時（緊急）
- **トリガー**: 申込数が定員に到達
- **更新内容**:
  - ヘッダーに「満席御礼」バナー追加
  - CTA「今すぐ申し込む」→「キャンセル待ちリスト」に変更
  - カウントダウンタイマー「満席」表示
- **所要時間**: 30分

### 価格変更時（計画的）
- **トリガー**: 早割終了, 通常価格への移行
- **更新内容**:
  - 価格表示を更新
  - 早割バッジを削除
- **所要時間**: 15分

### 重要なお知らせ（随時）
- **トリガー**: 会場変更, 講師変更, 特典追加
- **更新内容**:
  - お知らせバナー追加（ページ上部）
  - 該当セクション更新
- **所要時間**: 30分

---

## 💾 バックアップ戦略

### 1. Gitバージョン管理
- **頻度**: 全更新時（自動）
- **保存先**: GitHub Repository
- **保持期間**: 無制限
- **復元方法**:
  ```bash
  git log --oneline  # コミット履歴確認
  git checkout <commit-hash>  # 特定バージョンに復元
  ```

### 2. 週次フルバックアップ
- **頻度**: 毎週日曜日 23:00
- **保存先**: ローカル + Google Drive
- **スクリプト**:
  ```bash
  #!/bin/bash
  DATE=$(date +%Y%m%d)
  tar -czf byteplus-backup-$DATE.tar.gz docs/landing-pages/byteplus-bootcamp/
  cp byteplus-backup-$DATE.tar.gz ~/Google\ Drive/Backups/
  ```

### 3. GitHub Pages自動デプロイ
- **トリガー**: `main` ブランチへのpush
- **所要時間**: 2-5分
- **確認URL**: https://shunsukehayashi.github.io/Miyabi/landing-pages/byteplus-bootcamp/

---

## 📊 パフォーマンスモニタリング

### 週次チェック項目

| 項目 | 目標値 | 確認方法 | アクション |
|------|--------|----------|----------|
| Lighthouse Performance | 90+ | Chrome DevTools | 画像最適化, CSS圧縮 |
| Core Web Vitals (LCP) | < 2.5s | PageSpeed Insights | Critical CSS inline化 |
| Core Web Vitals (FID) | < 100ms | Real User Monitoring | JavaScript最適化 |
| Core Web Vitals (CLS) | < 0.1 | PageSpeed Insights | 画像サイズ固定 |
| 直帰率 | < 40% | GA4 | コンテンツ改善 |
| 平均滞在時間 | > 3分 | GA4 | エンゲージメント強化 |

### 月次レポート

**作成タイミング**: 毎月1日
**レポート内容**:
1. 訪問者数・PV
2. CVR（申込率）
3. トラフィックソース分析
4. A/Bテスト結果サマリー
5. パフォーマンス指標
6. 改善アクション

---

## 🔧 メンテナンス手順書

### 残席数更新（週次）

```bash
# 1. リポジトリを最新化
cd /path/to/miyabi-private
git pull origin main

# 2. index.htmlを編集
# Line 89: 残席数を更新
nano docs/landing-pages/byteplus-bootcamp/index.html

# 3. コミット & プッシュ
git add docs/landing-pages/byteplus-bootcamp/index.html
git commit -m "chore(byteplus): 残席数更新 - XX席"
git push origin main

# 4. GitHub Pagesデプロイ確認（2-5分待機）
open https://shunsukehayashi.github.io/Miyabi/landing-pages/byteplus-bootcamp/
```

### FAQ追加（月次）

```bash
# 1. よくある質問をリスト化
# 例: "録画配信はいつまで見られますか？"

# 2. index.htmlのFAQセクションに追加
nano docs/landing-pages/byteplus-bootcamp/index.html

# 3. Schema.org FAQPageを更新
nano docs/landing-pages/byteplus-bootcamp/schema-faq.json

# 4. コミット & プッシュ
git add docs/landing-pages/byteplus-bootcamp/
git commit -m "feat(byteplus): FAQ追加 - 録画配信期間"
git push origin main
```

### A/Bテスト勝者適用（4週間毎）

```bash
# 1. GA4でA/Bテスト結果確認
# Variant Bが統計的有意にCVR +12.5% (p < 0.01)

# 2. 勝者バリエーションをデフォルトに設定
# ab-test.jsを編集 or HTMLを直接更新

# 3. コミット & プッシュ
git add docs/landing-pages/byteplus-bootcamp/
git commit -m "feat(byteplus): A/Bテスト勝者適用 - Variant B"
git push origin main
```

---

## 🚀 緊急対応プロトコル

### サイトダウン時

1. **確認** (5分)
   - GitHub Pages Status確認
   - DNS確認（dig コマンド）
   - CDN確認（Cloudflare Status）

2. **復旧** (15分)
   - GitHub Pages再デプロイ
   - 直前のコミットにロールバック
   - 緊急連絡（Slack/Email）

3. **事後対応** (30分)
   - インシデントレポート作成
   - 原因分析
   - 再発防止策

### 重大バグ発見時

1. **即座にロールバック** (5分)
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **修正** (30分)
   - ローカルで修正
   - テスト実行
   - 再デプロイ

3. **検証** (10分)
   - 全ブラウザで動作確認
   - GA4トラッキング確認

---

## 📝 更新ログテンプレート

### 週次更新ログ

```markdown
## 週次更新 - YYYY年MM月DD日

### 実施内容
- [ ] 残席数更新: XX席 → YY席
- [ ] GA4レポート確認: CVR XX%
- [ ] パフォーマンスチェック: Lighthouse XX点
- [ ] A/Bテスト状況: Variant B +X.X%

### 次回アクション
- XX日: FAQ追加予定
- XX日: A/Bテスト結果分析

### 備考
- 特記事項なし
```

---

## 🔗 関連リンク

- **GitHub Repository**: https://github.com/ShunsukeHayashi/Miyabi
- **GitHub Pages**: https://shunsukehayashi.github.io/Miyabi/landing-pages/byteplus-bootcamp/
- **GA4 Dashboard**: https://analytics.google.com/
- **PageSpeed Insights**: https://pagespeed.web.dev/

---

## ⚠️ 重要な注意事項

1. **本番環境への直接編集禁止**
   - 必ずGit経由で更新
   - ローカルで確認後にプッシュ

2. **セミナー開催24時間前はフリーズ**
   - 緊急修正以外の更新禁止
   - 混乱防止のため

3. **バックアップ確認**
   - 週次バックアップが正常に実行されているか確認
   - Google Driveにファイルが存在するか確認

4. **トラッキングコード変更時は慎重に**
   - GA4/Facebook/LinkedInのトラッキングコードは変更しない
   - 変更が必要な場合は事前にテスト環境で検証

---

**作成日**: 2025-10-22
**最終更新**: 2025-10-22
**バージョン**: 1.0.0
**Issue**: #382 ([Sub-Issue #361] Phase 7: メンテナンス計画)
**Milestone**: #32 (BytePlus Video API Bootcamp)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
