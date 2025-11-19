# GitHub Issue Batch Creation System

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Purpose**: 複数のGitHubイシューを効率的に一括作成するテンプレートシステム

---

## 📋 概要

このシステムは、JSON形式のテンプレートから複数のGitHubイシューを一括作成します。

**特徴**:
- ✅ テンプレートベースの管理（JSON）
- ✅ Claude Code headless mode でバッチ実行
- ✅ Dry-run モード対応
- ✅ 詳細なログ出力
- ✅ エラー時も処理継続

---

## 🗂️ ディレクトリ構造

```
.claude/
├── templates/
│   ├── orchestrator-improvements.json  # 例: Orchestrator改善提案12件
│   └── [your-template].json           # 独自テンプレート
├── prompts/
│   └── batch-create-issues.txt        # Claude用プロンプト
├── scripts/
│   └── batch-create-issues.sh         # 実行スクリプト
├── logs/
│   └── batch-create-issues_*.log      # 実行ログ
└── docs/
    └── BATCH_ISSUE_CREATION.md        # このドキュメント
```

---

## 🚀 クイックスタート

### 1. テンプレートを確認

```bash
ls .claude/templates/
```

### 2. Dry-runで確認

```bash
./.claude/scripts/batch-create-issues.sh orchestrator-improvements --dry-run
```

### 3. 実際に作成

```bash
./.claude/scripts/batch-create-issues.sh orchestrator-improvements
```

---

## 📝 テンプレート形式

### JSON構造

```json
{
  "batch_name": "バッチの名前",
  "created_at": "2025-11-15",
  "created_by": "作成者",
  "description": "バッチの説明",
  "issues": [
    {
      "title": "[Component][Priority] イシュータイトル",
      "priority": "P0",
      "labels": ["priority:p0", "enhancement", "📥 state:pending"],
      "estimated_hours": 1,
      "body": "## 🎯 目的\n\n...\n\n## 📊 推定工数\n\n**1時間**"
    }
  ]
}
```

### フィールド説明

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `batch_name` | Yes | バッチの識別名 |
| `created_at` | No | 作成日（記録用） |
| `created_by` | No | 作成者（記録用） |
| `description` | No | バッチの説明 |
| `issues` | Yes | イシューの配列 |

**issue オブジェクト**:

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `title` | Yes | イシューのタイトル |
| `priority` | No | P0/P1/P2/P3（記録用） |
| `labels` | Yes | ラベルの配列 |
| `estimated_hours` | No | 推定工数（記録用） |
| `body` | Yes | イシュー本文（Markdown） |

---

## 🔧 使用方法

### 基本的な使い方

```bash
./.claude/scripts/batch-create-issues.sh <template-name>
```

### オプション

| オプション | 説明 |
|----------|------|
| `-d, --dry-run` | 実際には作成せず、何が実行されるか表示 |
| `-v, --verbose` | 詳細なログを表示 |
| `-h, --help` | ヘルプを表示 |

### 実行例

#### 1. 利用可能なテンプレートを確認

```bash
./.claude/scripts/batch-create-issues.sh --help
```

#### 2. Dry-runで内容を確認

```bash
./.claude/scripts/batch-create-issues.sh orchestrator-improvements --dry-run
```

**出力例**:
```
================================
Miyabi - Issue Batch Creation
================================

[INFO] Template: orchestrator-improvements
[INFO] Template file: .claude/templates/orchestrator-improvements.json
[INFO] Batch: Orchestrator Initialization Improvements
[INFO] Issues to create: 12
[WARNING] DRY RUN MODE - No issues will be created

[INFO] Starting Claude Code in headless mode...

# GitHub Issue Batch Creation Report (DRY RUN)

Would execute:
1. gh issue create --title "[Orchestrator][P0] 環境変数検証スクリプト追加" --label "priority:p0,enhancement,..."
2. gh issue create --title "[Orchestrator][P0] SSH接続検証・自動修復スクリプト" --label "priority:p0,enhancement,..."
...
```

#### 3. 実際に作成

```bash
./.claude/scripts/batch-create-issues.sh orchestrator-improvements
```

**対話例**:
```
[INFO] Batch: Orchestrator Initialization Improvements
[INFO] Issues to create: 12

Do you want to proceed? (y/N): y

[INFO] Starting Claude Code in headless mode...

Creating issue 1/12...
✅ Created #862 - [Orchestrator][P0] 環境変数検証スクリプト追加

Creating issue 2/12...
✅ Created #863 - [Orchestrator][P0] SSH接続検証・自動修復スクリプト

...

[SUCCESS] Batch creation completed successfully
[INFO] Full log saved to: .claude/logs/batch-create-issues_orchestrator-improvements_20251115_183045.log
```

#### 4. ログを確認

```bash
cat .claude/logs/batch-create-issues_orchestrator-improvements_*.log
```

---

## 🛠️ 新しいテンプレートの作成

### Step 1: テンプレートファイルを作成

```bash
cat > .claude/templates/my-feature.json << 'EOF'
{
  "batch_name": "My Feature Implementation",
  "description": "新機能実装のためのイシュー群",
  "issues": [
    {
      "title": "[Feature] APIエンドポイント追加",
      "labels": ["enhancement", "api", "📥 state:pending"],
      "estimated_hours": 3,
      "body": "## 🎯 目的\n\n新しいAPIエンドポイントを追加する。\n\n## 📋 要件\n\n- [ ] エンドポイント設計\n- [ ] 実装\n- [ ] テスト\n\n## 📊 推定工数\n\n**3時間**"
    }
  ]
}
EOF
```

### Step 2: バリデーション（オプション）

```bash
jq empty .claude/templates/my-feature.json
# エラーがなければOK
```

### Step 3: Dry-runで確認

```bash
./.claude/scripts/batch-create-issues.sh my-feature --dry-run
```

### Step 4: 作成

```bash
./.claude/scripts/batch-create-issues.sh my-feature
```

---

## 📊 既存テンプレート

### orchestrator-improvements.json

**内容**: Orchestrator初期化プロセスの改善提案12件

**カテゴリ**:
- 🔴 Tier 1 (P0): 3件 - 即座に実装すべき
- 🟡 Tier 2 (P1): 3件 - 早期実装が望ましい
- 🟢 Tier 3 (P2): 4件 - 中期的に実装
- 🔵 Tier 4 (P3): 2件 - 長期的改善

**総工数**: 約130時間

**使用例**:
```bash
./.claude/scripts/batch-create-issues.sh orchestrator-improvements
```

---

## 🔍 トラブルシューティング

### エラー: "claude command not found"

**原因**: Claude Code CLIがインストールされていない

**解決**:
```bash
# Claude Code CLIをインストール
# （インストール方法は公式ドキュメント参照）
```

### エラー: "gh command not found"

**原因**: GitHub CLIがインストールされていない

**解決**:
```bash
brew install gh
gh auth login
```

### エラー: "Template file not found"

**原因**: テンプレート名が間違っているか、ファイルが存在しない

**解決**:
```bash
# 利用可能なテンプレートを確認
./.claude/scripts/batch-create-issues.sh --help
```

### エラー: Issue creation failed

**原因**: GitHubの認証エラー、レート制限、権限不足など

**解決**:
```bash
# GitHub認証を確認
gh auth status

# 認証し直す
gh auth login

# レート制限を確認
gh api rate_limit
```

---

## 🎯 ベストプラクティス

### 1. 必ずDry-runで確認

```bash
# 必ず最初はdry-runで確認
./.claude/scripts/batch-create-issues.sh <template> --dry-run
```

### 2. テンプレートをバージョン管理

```bash
# Gitでテンプレートを管理
git add .claude/templates/*.json
git commit -m "Add issue templates"
```

### 3. ログを確認

```bash
# 実行後は必ずログを確認
tail -f .claude/logs/batch-create-issues_*.log
```

### 4. 段階的に作成

大量のイシューを作成する場合は、分割して実行：

```bash
# P0のみを先に作成（テンプレートを分割）
./.claude/scripts/batch-create-issues.sh orchestrator-p0

# 次にP1
./.claude/scripts/batch-create-issues.sh orchestrator-p1
```

---

## 🔗 関連ドキュメント

- [Miyabi Society Formula](../../miyabi_def/MIYABI_SOCIETY_FORMULA.md)
- [Orchestrator Agent](../../CLAUDE.md)
- [Label System Guide](../../docs/LABEL_SYSTEM_GUIDE.md)

---

## 📝 更新履歴

### v1.0.0 (2025-11-15)
- 初版リリース
- テンプレートシステム実装
- `orchestrator-improvements.json` テンプレート追加
- Dry-run モード実装
- ログ機能追加

---

**このシステムは Miyabi Orchestra (Layer 2 - Orchestrator) の一部として開発されました。**
