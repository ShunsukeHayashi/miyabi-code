# Miyabi Daily Update System

**毎日の開発進捗を自動的にnote.com記事として生成するシステム**

## 🎯 概要

このシステムは、**かきこちゃん（NoteAgent）** と **えがくん（ImageGenAgent）** を連携させて、毎日の開発進捗をnote.com投稿用の記事として自動生成します。

### システム構成

```
┌─────────────────────────────────────────────┐
│ /daily-update                               │
│ (Claude Code Slash Command)                 │
└─────────────┬───────────────────────────────┘
              │
              ├─► 1. collect-git-info.sh
              │   └─► Git情報収集 → JSON出力
              │
              ├─► 2. かきこちゃん (NoteAgent)
              │   └─► 記事生成 (3,000-4,000文字)
              │
              ├─► 3. えがくん (ImageGenAgent)
              │   └─► 画像生成 (PlantUML + DALL-E 3)
              │
              └─► 4. Save & Commit
                  └─► docs/daily-updates/YYYY-MM-DD.md
```

## 🚀 クイックスタート

### ステップ1: コマンド実行

Claude Codeで以下を入力：

```
/daily-update
```

### ステップ2: 自動実行

システムが以下を自動実行：
1. ✅ Git情報収集（コミット、Issue、PR）
2. ✅ かきこちゃんが記事生成
3. ✅ えがくんが画像生成
4. ✅ ファイル保存（docs/daily-updates/YYYY-MM-DD.md）
5. ✅ Git commit

### ステップ3: note.com投稿

生成された記事を手動で投稿：
1. `docs/daily-updates/YYYY-MM-DD.md` を開く
2. 内容をnote.comにコピー
3. 画像をアップロード（`docs/daily-updates/images/YYYY-MM-DD/`）
4. 公開！

## 📁 ファイル構成

```
miyabi-private/
├── .claude/
│   └── commands/
│       └── daily-update.md         # Slash command定義
│
├── scripts/
│   └── daily-update/
│       ├── README.md               # このファイル
│       └── collect-git-info.sh     # Git情報収集スクリプト
│
├── docs/
│   └── daily-updates/
│       ├── 2025-10-22.md           # 今日の記事
│       ├── 2025-10-21.md           # 昨日の記事
│       ├── images/
│       │   ├── 2025-10-22/
│       │   │   ├── progress-chart.png
│       │   │   └── commit-stats.png
│       │   └── 2025-10-21/
│       │       └── ...
│       └── README.md               # 記事一覧（自動生成）
│
└── .claude/agents/
    ├── prompts/business/
    │   ├── note-agent-prompt.md    # かきこちゃん
    │   └── imagegen-agent-prompt.md # えがくん
    └── specs/business/
        ├── note-agent.md
        └── imagegen-agent.md
```

## 🛠️ Git情報収集スクリプト

### 使い方

#### 今日の情報を収集（JSON形式）

```bash
./scripts/daily-update/collect-git-info.sh
```

#### 特定日の情報を収集

```bash
./scripts/daily-update/collect-git-info.sh 2025-10-21
```

#### Markdown形式で出力

```bash
./scripts/daily-update/collect-git-info.sh 2025-10-22 markdown
```

### 出力例（JSON）

```json
{
  "date": "2025-10-22",
  "summary": {
    "commits": 5,
    "filesChanged": 12,
    "additions": 342,
    "deletions": 89,
    "issuesProcessed": 2,
    "prsCreated": 1
  },
  "commits": [
    {
      "hash": "3fc883a",
      "message": "feat(content): add Miyabi development status article",
      "author": "Claude Code",
      "time": "2025-10-22 15:07:00 +0900"
    }
  ],
  "issues": [
    {"number": 270, "title": "Add user authentication"},
    {"number": 271, "title": "Fix memory leak"}
  ],
  "prs": [
    {
      "number": 280,
      "title": "feat: add Rust migration",
      "url": "https://github.com/..."
    }
  ],
  "changedFiles": [
    {"status": "M", "file": "CLAUDE.md"},
    {"status": "A", "file": "docs/articles/MIYABI_DEVELOPMENT_STATUS_NOTE.md"}
  ],
  "highlights": [
    "Add Miyabi development status article with PlantUML diagrams",
    "Enhance note.com agents with Amazon affiliate + image workflow",
    "Add ImageGenAgent (えがくん) for note.com image generation"
  ],
  "nextSteps": [],
  "metadata": {
    "collectedAt": "2025-10-22T06:07:00Z",
    "repository": "https://github.com/ShunsukeHayashi/miyabi-private.git",
    "branch": "main"
  }
}
```

### 収集される情報

| 情報 | 説明 | 用途 |
|------|------|------|
| **commits** | 今日のコミット履歴 | 記事の「主な変更内容」セクション |
| **summary.commits** | コミット数 | 統計表 |
| **summary.filesChanged** | 変更ファイル数 | 統計表 |
| **summary.additions** | 追加行数 | 統計表 |
| **summary.deletions** | 削除行数 | 統計表 |
| **issues** | 処理されたIssue | 「Issue/PR進捗」セクション |
| **prs** | 作成されたPR | 「Issue/PR進捗」セクション |
| **changedFiles** | 変更ファイル一覧 | 詳細説明用 |
| **highlights** | ハイライト（feat, fix等） | 「今日のハイライト」セクション |

## 📝 記事生成フロー

### 1. かきこちゃん（NoteAgent）

**入力**: Git情報JSON（`collect-git-info.sh`の出力）

**処理**:
1. C1: コンテキスト構造化
2. C2: 類似記事分析（note.com検索）
3. C3: アカウント最適化（@The_AGI_WAY）
4. C4: SEO戦略策定
5. C5: インストラクション生成
6. C6: 記事執筆（3,000-4,000文字）

**出力**: `docs/daily-updates/YYYY-MM-DD-draft.md`

**特徴**:
- ✅ 日次レポート専用テンプレート使用
- ✅ [--IMAGE--] プレースホルダー 2-3箇所配置
- ✅ Amazon アソシエイトリンク 1-2箇所（tag=shuhayas-22）
- ✅ フレンドリーかつ技術的なトーン

### 2. えがくん（ImageGenAgent）

**入力**: かきこちゃんが生成した記事（draft版）

**処理**:
1. プレースホルダー検出
2. 各プレースホルダーに適した画像種別を判定
3. PlantUML図生成（進捗グラフ、統計等）
4. DALL-E 3プロンプト生成（アイキャッチ）
5. プレースホルダー置換

**出力**:
- `docs/daily-updates/images/YYYY-MM-DD/*.png` (PlantUML図)
- `docs/daily-updates/YYYY-MM-DD.md`（完成記事）

**生成される画像例**:
1. **進捗グラフ**: コミット数推移、Issue処理数
2. **統計チャート**: ファイル変更統計
3. **アーキテクチャ図**: 今日追加されたコンポーネント
4. **アイキャッチ**: DALL-E 3プロンプトのみ（外部生成）

## ⚙️ カスタマイズ

### 記事文字数の変更

`.claude/commands/daily-update.md` の Step 3 を編集：

```markdown
## 記事要件
- 文字数: 3,000〜4,000文字（通常）
- 文字数: 5,000〜6,000文字（詳細版）← カスタマイズ
```

### 画像数の変更

`.claude/commands/daily-update.md` の Step 3 を編集：

```markdown
- [--IMAGE--]: 2〜3箇所配置（通常）
- [--IMAGE--]: 4〜5箇所配置（画像多め版）← カスタマイズ
```

### Amazon アソシエイトリンク数の変更

`.claude/agents/prompts/business/note-agent-prompt.md` を編集：

```markdown
#### セクション6: Amazonアソシエイトリンク挿入
- 日次レポート: 1〜2箇所（通常）
- 詳細記事: 3〜5箇所（多め）← カスタマイズ
```

## 🔧 トラブルシューティング

### Git情報が取得できない

**症状**: `No commits found for today`

**原因**: 今日まだコミットしていない

**解決策**:
```bash
# 昨日のレポート生成
/daily-update --date 2025-10-21
```

### PlantUML図が生成されない

**症状**: `plantuml command not found`

**解決策**:
```bash
brew install plantuml
```

### gh CLI エラー

**症状**: `gh: command not found`

**解決策**:
```bash
brew install gh
gh auth login
```

### かきこちゃん実行エラー

**症状**: `NoteAgent prompt file not found`

**解決策**:
```bash
# プロンプトファイルの存在確認
ls -la .claude/agents/prompts/business/note-agent-prompt.md

# ファイルがなければ、Gitから復元
git restore .claude/agents/prompts/business/note-agent-prompt.md
```

## 📊 成功条件

✅ **必須**:
- [ ] Git情報収集成功（JSON形式）
- [ ] 記事文字数 3,000〜4,000文字
- [ ] 画像 2〜3枚生成（PlantUML）
- [ ] Markdown構文エラーなし
- [ ] ファイル保存成功（docs/daily-updates/YYYY-MM-DD.md）

✅ **品質**:
- [ ] Amazonリンク全て `tag=shuhayas-22` 付き
- [ ] PlantUML図が正しくレンダリング
- [ ] 記事の論理構成が明確
- [ ] 技術的正確性
- [ ] Git情報が正確に反映

## 📖 関連ドキュメント

- **Slash Command**: `.claude/commands/daily-update.md`
- **かきこちゃん仕様**: `.claude/agents/specs/business/note-agent.md`
- **えがくん仕様**: `.claude/agents/specs/business/imagegen-agent.md`
- **かきこちゃんプロンプト**: `.claude/agents/prompts/business/note-agent-prompt.md`
- **えがくんプロンプト**: `.claude/agents/prompts/business/imagegen-agent-prompt.md`

## 🔗 使用技術

- **Claude Code**: AI-powered development assistant
- **Git**: バージョン管理
- **PlantUML**: 図表生成
- **DALL-E 3**: アイキャッチ画像生成（外部）
- **note.com**: 記事配信プラットフォーム
- **GitHub CLI (gh)**: Issue/PR情報取得
- **jq**: JSON処理

## 🎯 次のステップ

### Phase 1: 手動運用（現在）
- ✅ `/daily-update` でワンコマンド実行
- ⏳ note.comに手動投稿

### Phase 2: 半自動運用（将来）
- 🔄 GitHub Actionsで毎日自動実行
- 🔄 note.com APIで自動投稿

### Phase 3: 完全自動運用（将来）
- 🚀 コミットトリガーでリアルタイム更新
- 🚀 Twitter自動シェア
- 🚀 Analytics自動収集

---

**毎日の開発を記録し、振り返りと共有を習慣化しましょう！** 📝✨

**Created by**: かきこちゃん & えがくん
**Version**: 1.0.0
**Date**: 2025-10-22
