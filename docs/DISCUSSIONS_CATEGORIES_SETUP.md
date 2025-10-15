# 💬 GitHub Discussions Categories Setup

**Issue**: #139 - GitHub as Operating System Integration
**Phase**: Phase C - Discussions: Message Queue
**作成日**: 2025-10-15
**対象**: 6つのDiscussionカテゴリ定義

---

## 📋 概要

GitHub Discussionsを「Message Queue」として活用し、コミュニティからのアイデア、質問、フィードバックを構造化して管理します。

### アーキテクチャ

```
GitHub Discussions (Message Queue)
        ↓
6 Categories (Topic-based Routing)
        ↓
discussion-bot.yml (Auto-response)
        ↓
Idea → Issue Auto-conversion
        ↓
Agent Execution
```

---

## 🎯 6つのカテゴリ定義

### 1. 💡 Ideas (アイデア)

**用途**: 新機能・改善提案のアイデア収集

**説明**:
新しい機能のアイデアや既存機能の改善提案を共有する場所です。コミュニティで議論し、賛同を得たアイデアは自動的にIssueに変換されます。

**Settings**:
- **Format**: Discussion
- **Emoji**: 💡
- **Auto-convert to Issue**: ✅ Yes (when `/convert-to-issue` command or 👍 reactions ≥ 5)

**Auto-response Template**:
```markdown
## 💡 Thank you for your idea!

Your suggestion has been recorded. The community can now discuss and vote on this idea.

### Next Steps:
1. 📝 Provide more details if needed
2. 👍 Community votes (5+ reactions → auto-converts to Issue)
3. 🤖 Use `/convert-to-issue` to convert manually

---

*Automated by Discussion Bot (Phase C)*
```

---

### 2. ❓ Q&A (質問・回答)

**用途**: 技術的な質問とトラブルシューティング

**説明**:
Miyabiの使い方、セットアップ、トラブルシューティングに関する質問をする場所です。コミュニティメンバーやメンテナーが回答します。

**Settings**:
- **Format**: Question/Answer (Answers can be marked as "Accepted")
- **Emoji**: ❓
- **Auto-convert to Issue**: ❌ No (Q&A stays in Discussions)

**Auto-response Template**:
```markdown
## ❓ Thank you for your question!

We'll do our best to answer your question. Please provide:

### Checklist:
- [ ] Operating System (macOS, Linux, Windows)
- [ ] Miyabi version (`miyabi --version`)
- [ ] Rust version (`rustc --version`)
- [ ] Error messages (if any)

### Tips:
- 📚 Check [Documentation](../docs)
- 🔍 Search existing Q&A
- 🐛 If it's a bug, create an [Issue](../../issues/new)

---

*Automated by Discussion Bot (Phase C)*
```

---

### 3. 📢 Announcements (お知らせ)

**用途**: 公式アナウンスメント・リリース情報

**説明**:
新バージョンのリリース、重要な変更、イベント情報などの公式アナウンスメントを発信する場所です。

**Settings**:
- **Format**: Announcement (Read-only, only maintainers can post)
- **Emoji**: 📢
- **Auto-convert to Issue**: ❌ No

**使用例**:
- 🚀 v1.0.0 Release Announcement
- 🔄 Breaking Changes in v2.0
- 🎉 Miyabi が 1000 GitHub Stars 達成！
- 📅 Community Meetup (Monthly)

---

### 4. 🎨 Show and Tell (作品紹介)

**用途**: Miyabiを使ったプロジェクト・ユースケース紹介

**説明**:
Miyabiを使って作成したプロジェクトや、興味深いユースケースを共有する場所です。他のユーザーのインスピレーション源となります。

**Settings**:
- **Format**: Discussion
- **Emoji**: 🎨
- **Auto-convert to Issue**: ❌ No

**Auto-response Template**:
```markdown
## 🎨 Awesome project!

Thank you for sharing your work with the community!

### Showcase Guidelines:
- 📝 Project description
- 🔗 Repository link (if public)
- 📸 Screenshots/Demo
- 💡 What problem does it solve?
- 🛠️ Tech stack & Miyabi features used

### Community Engagement:
- React with 👍 if you like it
- Comment with questions or feedback
- Share your own projects inspired by this

---

*Automated by Discussion Bot (Phase C)*
```

---

### 5. 🤝 General (雑談)

**用途**: 一般的な会話・コミュニティ交流

**説明**:
Miyabiに関する一般的な会話、コミュニティメンバー同士の交流の場所です。カジュアルな雰囲気で気軽に投稿できます。

**Settings**:
- **Format**: Discussion
- **Emoji**: 🤝
- **Auto-convert to Issue**: ❌ No

**トピック例**:
- 自己紹介 (Introduce yourself)
- Miyabiの好きな機能
- 開発中のプロジェクト共有
- オフトピック (趣味、Tech news等)

---

### 6. 🚀 Roadmap & Planning (ロードマップ)

**用途**: プロジェクトの方向性・ロードマップ議論

**説明**:
Miyabiの将来的な方向性、ロードマップ、大きな機能追加に関する議論を行う場所です。コミュニティの意見を反映してプロジェクトを進化させます。

**Settings**:
- **Format**: Discussion (Poll可能)
- **Emoji**: 🚀
- **Auto-convert to Issue**: ⚠️ Selective (Maintainer decision)

**使用例**:
- 📊 Poll: Next major feature to implement
- 🗺️ Quarterly Roadmap Discussion
- 🎯 Vision for Miyabi 2.0
- 💬 RFC (Request for Comments) for breaking changes

**Auto-response Template**:
```markdown
## 🚀 Thank you for contributing to Miyabi's roadmap!

Your input helps shape the future of Miyabi.

### Participation Guidelines:
- 📊 Vote on polls
- 💬 Share your thoughts constructively
- 📝 Provide use cases and rationale
- 🎯 Focus on long-term impact

### Decision Process:
1. Community discussion (2 weeks)
2. Maintainer review & synthesis
3. RFC document creation (if major)
4. Implementation planning

---

*Automated by Discussion Bot (Phase C)*
```

---

## 🔧 セットアップ手順

### Step 1: GitHubリポジトリでDiscussionsを有効化

1. リポジトリの **Settings** に移動
2. **General** → **Features** セクション
3. **Discussions** にチェック ✅
4. **Save changes**

---

### Step 2: 6つのカテゴリを作成

1. **Discussions** タブに移動
2. **Categories** → **New category**
3. 上記の6カテゴリを順番に作成:

#### 作成順序（推奨）:

| # | Category | Format | Emoji | Description |
|---|----------|--------|-------|-------------|
| 1 | **Ideas** | Discussion | 💡 | Share new feature ideas and improvements |
| 2 | **Q&A** | Q&A | ❓ | Ask questions about Miyabi usage |
| 3 | **Announcements** | Announcement | 📢 | Official announcements and releases |
| 4 | **Show and Tell** | Discussion | 🎨 | Share your projects using Miyabi |
| 5 | **General** | Discussion | 🤝 | General conversation and community |
| 6 | **Roadmap & Planning** | Discussion | 🚀 | Discuss Miyabi's future direction |

**各カテゴリの設定**:
- **Name**: カテゴリ名（英語）
- **Description**: 上記の説明文を使用
- **Emoji**: 上記の絵文字を選択
- **Format**: Discussion / Q&A / Announcement を選択

---

### Step 3: Webhookトリガー確認

`.github/workflows/discussion-bot.yml` が以下のイベントでトリガーされることを確認:

```yaml
on:
  discussion:
    types: [created, answered, category_changed]
  discussion_comment:
    types: [created]
```

---

### Step 4: テスト投稿

各カテゴリに1つずつテスト投稿を行い、自動応答が動作することを確認:

```bash
# 1. Ideas カテゴリに投稿
# 2. Auto-response確認
# 3. /convert-to-issue コマンドテスト
# 4. Q&A カテゴリに投稿
# 5. Show and Tell に投稿
```

---

## 🤖 自動化機能

### 1. Welcome Auto-response

**Trigger**: 新しいDiscussion作成時
**Action**: カテゴリに応じた自動返信
**File**: `.github/workflows/discussion-bot.yml` → `scripts/github/discussion-bot.ts`

---

### 2. Idea → Issue 自動変換

**Trigger A (Manual)**: `/convert-to-issue` コマンド
**Trigger B (Auto)**: 👍 reactions ≥ 5 (Phase C-3で実装)

**Workflow**:
```
1. User posts idea in "Ideas" category
2. Community discusses & votes (👍)
3. When reactions ≥ 5:
   → Auto-convert to Issue
   → Add labels (enhancement, from-discussion)
   → Link back to Discussion
4. Or manual: Comment `/convert-to-issue`
```

**File**: `.github/workflows/discussion-bot.yml` (lines 44-106)

---

### 3. Weekly Digest (Phase C-2で実装)

**Trigger**: Every Monday 9:00 AM UTC
**Action**:
- 先週のDiscussion activity summary
- Top Ideas (most reactions)
- Most active Q&A threads
- Post to Discussion (Announcements category)

**File**: `.github/workflows/discussion-digest.yml` (未実装)

---

## 📊 Category Usage Guidelines

### For Users

| Category | When to Use |
|----------|-------------|
| **Ideas** | 💡 New feature request or improvement |
| **Q&A** | ❓ How to use Miyabi, troubleshooting |
| **Show and Tell** | 🎨 Share your project using Miyabi |
| **General** | 🤝 Casual chat, off-topic, community |

### For Maintainers

| Category | When to Post |
|----------|--------------|
| **Announcements** | 📢 Releases, breaking changes, events |
| **Roadmap & Planning** | 🚀 RFC, quarterly planning, polls |

---

## 🔗 統合ポイント

### 1. Issue Tracker統合

- Ideas (👍 ≥ 5) → Issue自動作成
- Issue作成時に Discussion link 追加
- Issue完了時に Discussion に通知

### 2. Label System統合

Auto-created Issuesには以下のラベルが自動付与:
- `✨type:feature` (Ideas → Issue)
- `📝from-discussion` (Discussion起源)
- `🤝community` (コミュニティ提案)

### 3. Projects V2統合

Discussion起源のIssueは自動的にProject V2に追加:
- Status: "Pending"
- Priority: P2-Medium (default)
- Phase: Backlog

---

## 📈 メトリクス

### Target Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| **Discussion Response Time** | < 24h | Time to first response |
| **Idea → Issue Conversion Rate** | 20-30% | % of Ideas converted to Issues |
| **Q&A Answer Rate** | > 80% | % of questions with accepted answer |
| **Community Engagement** | > 50/month | Total discussions + comments |
| **Active Contributors** | > 10/month | Unique users posting/commenting |

### Monitoring

- GitHub Discussions Insights (built-in)
- Weekly digest報告
- 月次コミュニティレポート

---

## 🚀 Next Steps

### Phase C-2: Weekly Digest Automation
- [ ] `.github/workflows/discussion-digest.yml` 実装
- [ ] `scripts/github/discussion-digest.ts` 実装
- [ ] Digest投稿先: Announcements category

### Phase C-3: Enhanced Idea → Issue Conversion
- [ ] Reaction-based auto-conversion (👍 ≥ 5)
- [ ] Label auto-assignment
- [ ] Projects V2 auto-add

---

## 📚 関連リソース

### Documentation
- [GitHub Discussions Docs](https://docs.github.com/en/discussions)
- [Discussion GraphQL API](https://docs.github.com/en/graphql/reference/objects#discussion)

### Implementation Files
- `.github/workflows/discussion-bot.yml` - Main bot
- `scripts/github/discussion-bot.ts` - Bot logic (TypeScript)
- `scripts/github/convert-idea-to-issue.ts` - Conversion logic

---

## 🎯 Success Criteria

- [x] Discussions feature enabled on repository
- [ ] 6 categories created and configured
- [ ] Auto-response working for all categories
- [ ] `/convert-to-issue` command working
- [ ] Weekly digest automation (Phase C-2)
- [ ] Reaction-based auto-conversion (Phase C-3)
- [ ] Community engagement metrics > targets

---

**作成日**: 2025-10-15
**最終更新**: 2025-10-15
**バージョン**: 1.0

💬 **Discussions Categories - Complete Setup Guide**
