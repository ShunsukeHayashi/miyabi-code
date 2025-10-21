# Product Hunt ローンチプラン - Miyabi

## 📅 ローンチ日程

**推奨日**: 火曜日または水曜日（UTC 00:01開始）
**理由**:
- 火曜・水曜は最もトラフィックが多い
- 週末は避ける（エンゲージメント低下）
- 月曜は競合が多い

**準備期間**: 1-2週間前から

---

## 🎯 Product Hunt ページ構成

### 1. タグライン（60文字以内）

**Option A（推奨）**:
```
21 AI agents automate DevOps from Issue to Production in Rust
```

**Option B**:
```
One command for complete DevOps automation with 21 AI agents
```

**Option C**:
```
GitHub Issues → Production code automatically. Built with Rust.
```

---

### 2. 製品説明（260文字以内）

```
Miyabi turns GitHub Issues into production-ready code automatically using 21 specialized AI agents.

Built with Rust 🦀
• 50% faster execution
• 83% test coverage auto-generated
• Zero-conflict parallel execution with Git Worktrees
• 10-15 minutes from Issue to Pull Request

One command: miyabi work-on <issue>

That's it. CoordinatorAgent, CodeGenAgent, ReviewAgent, and 18 others handle everything else.

Open source (Apache 2.0) | From Japan 🇯🇵
```

---

### 3. メディアアセット

#### 必須アセット

**1. サムネイル画像（240x240px）**
- Miyabiロゴ + 🦀 Rustアイコン
- 背景: グラデーション（深い青→紫）

**2. ギャラリー画像（1270x760px、4-6枚）**

1. **Hero Image**: OGP画像（生成済み）
2. **Terminal Demo**: `miyabi work-on 1` 実行画面
3. **Parallel Execution**: Git Worktree並列実行の可視化
4. **PR Created**: 自動生成されたPR画面
5. **Architecture**: 21 Agents の関係図
6. **Stats**: パフォーマンス数値（50% faster等）

**3. デモビデオ（30-60秒、推奨）**
- 0:00-0:05 - Miyabiロゴ + タグライン
- 0:05-0:15 - `miyabi init` 実行
- 0:15-0:35 - `miyabi work-on 1` → Agent並列実行
- 0:35-0:50 - PR自動作成
- 0:50-1:00 - "That's it. Star on GitHub" CTA

---

### 4. リンク

**必須リンク**:
- 🌐 Website: https://shunsukehayashi.github.io/Miyabi
- 💻 GitHub: https://github.com/ShunsukeHayashi/Miyabi
- 📖 Docs: https://shunsukehayashi.github.io/Miyabi/docs

**追加リンク**:
- 💬 Discord: https://discord.gg/Urx8547abS
- 🦀 crates.io: https://crates.io/crates/miyabi-cli
- 📝 Dev.to: （記事公開後に追加）

---

### 5. トピック選択（最大3つ）

**推奨トピック**:
1. **Developer Tools** （メインカテゴリ）
2. **Artificial Intelligence**
3. **Open Source**

**代替案**:
- DevOps
- Productivity
- Automation

---

### 6. Maker Comment（最初のコメント）

**投稿テンプレート**:

```markdown
Hey Product Hunt! 👋

I'm Shunsuke, creator of Miyabi.

**What is Miyabi?**
Miyabi (雅 = elegant simplicity in Japanese) automates DevOps using 21 AI agents built in Rust.

**The Problem:**
Traditional DevOps requires 47 manual steps and 3 hours to deploy. Code reviews take days. "Works on my machine" is still a thing.

**Our Solution:**
One command: `miyabi work-on 1`

That's it. 21 AI agents handle:
- Issue analysis
- Code generation (with tests!)
- Security scanning
- Code review (100-point score)
- PR creation
- Deployment

**Why Rust?**
TypeScript → Rust migration results:
• 50% faster ⚡
• 30% less memory 💾
• Single binary (no Node.js) 📦
• 735+ tests passing ✅

**What makes it unique:**
Git Worktree parallel execution = zero merge conflicts. Multiple agents work simultaneously on different issues. 72% faster than sequential.

**It's 100% open source** (Apache 2.0)

We'd love to hear your feedback! 🙏

AMA about DevOps automation, Rust, or AI agents.

⭐ Star us on GitHub: https://github.com/ShunsukeHayashi/Miyabi
```

---

## 📊 アップボート戦略

### ローンチ前（1-2週間前）

**1. コミュニティ構築**
- Discord メンバー: 50人以上
- Twitter フォロワー: 100人以上
- GitHub Stars: 100以上

**2. 事前告知**
```
🚀 Exciting news!

Miyabi is launching on Product Hunt next Tuesday!

21 AI agents for autonomous DevOps automation.
Built with Rust. 100% open source.

Set a reminder 👇
[Product Hunt upcoming page URL]

What feature should we highlight first? 🤔
```

**3. Hunter（推薦者）を見つける**
- Product Huntで実績のあるHunterにDM
- 「Would you be interested in hunting Miyabi?」
- Hunterがいると初期ブーストが大きい

---

### ローンチ日（UTC 00:01開始）

**時系列アクション**:

**00:01 - ローンチ**
- Product Huntに投稿
- Maker Commentを即座に投稿

**00:15 - 初期シェア**
- Twitter告知（メインアカウント）
- Discord告知（#announcements）
- Telegram/Slack コミュニティ

**03:00 - アジア圏シェア**
- 日本時間12:00（昼休み）
- WeChat, LINE, Kakao等

**12:00 - 欧州圏シェア**
- LinkedIn投稿
- Reddit r/rust, r/devops

**16:00 - 米国圏シェア（最重要）**
- Hacker News "Show HN"
- Reddit再投稿
- Indie Hackers

**終日 - コメント対応**
- 全てのコメントに30分以内に返信
- 質問には詳細に回答
- 感謝の気持ちを忘れずに

---

### ローンチ後フォローアップ

**Day 1終了時**:
```
🎉 Update: Day 1 Results

Thanks to everyone who supported Miyabi on Product Hunt!

📊 Results:
• XX upvotes
• #X Product of the Day
• XX comments
• XX GitHub stars (from YY to ZZ)

Your feedback was incredible. Here's what we're working on next:
1. [Feature request 1]
2. [Feature request 2]
3. [Feature request 3]

Still time to check it out 👇
[Product Hunt URL]
```

**Week 1**:
- 全フィードバックをGitHub Issuesに追加
- Product Hunt Badge をREADMEに追加
- Dev.to記事で詳細を公開

---

## 🎨 メディア制作チェックリスト

### 画像

- [ ] サムネイル（240x240px）
  - Miyabiロゴ + Rustアイコン
  - PNG, 透明背景

- [ ] ギャラリー画像（1270x760px × 6枚）
  - [ ] 1. Hero Image（OGP画像を使用）✅
  - [ ] 2. Terminal Demo
  - [ ] 3. Parallel Execution
  - [ ] 4. PR Created
  - [ ] 5. Architecture Diagram
  - [ ] 6. Performance Stats

- [ ] OGP画像（1200x630px）
  - [ ] v1, v2, v3からベストを選択 ✅
  - [ ] リサイズ実行

### 動画

- [ ] デモビデオ（30-60秒）
  - [ ] スクリプト作成
  - [ ] 画面収録
  - [ ] 編集（字幕・効果音）
  - [ ] MP4エクスポート（最大50MB）

### テキスト

- [ ] タグライン（3パターン作成済み）✅
- [ ] 製品説明（260字）✅
- [ ] Maker Comment（ドラフト作成済み）✅
- [ ] FAQ準備（よくある質問10個）

---

## 💰 Product Hunt Ads（オプション）

**予算**: $500-1,000
**期間**: ローンチ日から3日間
**ターゲット**: Developer Tools カテゴリ閲覧者

**広告クリエイティブ**:
- 画像: OGP画像 v1（推奨）
- テキスト: "Automate DevOps with 21 AI Agents. Built with Rust. Open Source."
- CTA: "Check it out"

**ROI期待値**:
- クリック数: 500-1,000
- アップボート: 50-100追加
- GitHub Stars: 100-200追加

---

## 📈 成功指標（KPI）

### 最低目標（Day 1）
- ✅ アップボート: 100+
- ✅ コメント: 20+
- ✅ GitHub Stars: 50+増加
- ✅ Top 10 Product of the Day

### 理想目標（Day 1）
- 🎯 アップボート: 300+
- 🎯 コメント: 50+
- 🎯 GitHub Stars: 200+増加
- 🎯 #1-3 Product of the Day
- 🎯 Featured in Product Hunt newsletter

### 長期目標（Week 1）
- 🚀 GitHub Stars: 1,000+
- 🚀 npm/cargo downloads: 1,000+
- 🚀 Discord members: 200+
- 🚀 Dev.to記事: 10,000+ views

---

## 🔗 参考リンク

**Product Hunt成功事例**:
- Supabase: 1,200+ upvotes
- Vercel: 800+ upvotes
- Tauri: 600+ upvotes

**ローンチガイド**:
- Product Hunt Official Launch Guide
- Indie Hackers: "How to Launch on Product Hunt"
- First Round Review: "The Product Hunt Launch Playbook"

---

## ✅ Next Actions

### 今すぐ実行（優先度高）

1. **メディア制作開始**
   - サムネイル画像作成
   - ギャラリー画像6枚準備
   - デモビデオ収録

2. **Product Hunt下書き保存**
   - アカウント作成/ログイン
   - 下書きページ作成
   - 全アセットをアップロード

3. **コミュニティ準備**
   - Discord招待リンク確認
   - Twitter投稿テンプレート準備
   - メールリスト準備（もしあれば）

### 1週間前

4. **Hunter探し**
   - Product Huntで活発なユーザー特定
   - DMで依頼

5. **事前告知**
   - Twitter/X で upcoming告知
   - GitHub READMEにバッジ追加

### 前日

6. **最終確認**
   - 全アセット再チェック
   - タイムゾーン確認（UTC 00:01）
   - Maker Comment最終編集

---

**作成日**: 2025-10-22
**次回レビュー**: ローンチ1週間前
