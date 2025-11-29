---
name: Paper2Agent
description: Convert research papers (arXiv PDFs) into interactive AI agents using the Model Context Protocol (MCP). Based on arXiv:2509.06917 methodology.
allowed-tools: Bash, Read, Write, Grep, Glob, WebFetch
---

# Paper2Agent Skill

**Version**: 1.0.0
**Last Updated**: 2025-11-09
**Priority**: P1 Level
**Purpose**: Research Paper PDF → Interactive AI Agent 変換

---

## 概要

Paper2Agentは、学術論文（主にarXiv PDF）を解析し、その手法を実装したMCPサーバーとして対話可能なAIエージェントに変換するスキルです。

**Based on**: [arXiv:2509.06917 - Paper2Agent: Reimagining Research Papers...](https://arxiv.org/abs/2509.06917)

---

## 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| 論文変換 | "convert this paper to agent" |
| arXiv処理 | "analyze arXiv:2509.06917" |
| MCPサーバー生成 | "create MCP server from paper" |
| 論文分析 | "extract methods from PDF" |
| コード抽出 | "find code references in paper" |

---

## パイプライン構造

```
arXiv PDF
    ↓
┌──────────────────────────────────┐
│ 1. analyze-paper.sh              │
│ - Extract abstract, methods      │
│ - Find GitHub code references    │
│ - Extract examples from paper    │
└──────────────────────────────────┘
    ↓ JSON
┌──────────────────────────────────┐
│ 2. extract-code.sh               │
│ - Clone GitHub repository        │
│ - Detect language (Py/Rust/JS)   │
│ - Analyze API surface            │
└──────────────────────────────────┘
    ↓ JSON
┌──────────────────────────────────┐
│ 3. generate-mcp.sh               │
│ - Create MCP server definition   │
│ - Generate Python skeleton       │
│ - Map functions to MCP tools     │
└──────────────────────────────────┘
    ↓ MCP JSON + Python
┌──────────────────────────────────┐
│ 4. test-agent.sh                 │
│ - Validate MCP definition        │
│ - Test reproducibility           │
│ - Verify server startup          │
└──────────────────────────────────┘
    ↓
✅ Interactive AI Agent Ready
```

---

## コマンドリファレンス

### Step 1: 論文分析

```bash
# arXiv URLから分析
.claude/Skills/paper2agent/analyze-paper.sh \
  https://arxiv.org/abs/2509.06917 \
  > paper-analysis.json

# ローカルPDFから分析
.claude/Skills/paper2agent/analyze-paper.sh \
  ./my-paper.pdf \
  > paper-analysis.json
```

**出力形式**:
```json
{
  "title": "Paper2Agent: Reimagining Research Papers...",
  "arxiv_id": "2509.06917",
  "abstract": "...",
  "methods": "...",
  "code_references": ["https://github.com/..."],
  "extracted_at": "2025-11-09T05:04:00Z",
  "parser": "pdftotext"
}
```

### Step 2: コード抽出

```bash
# GitHubリポジトリからAPI抽出
.claude/Skills/paper2agent/extract-code.sh \
  --repo https://github.com/user/repo \
  > code-analysis.json

# 既存クローンを使用
.claude/Skills/paper2agent/extract-code.sh \
  --repo https://github.com/user/repo \
  --no-clone
```

**出力形式**:
```json
{
  "language": "python",
  "repository": "alphagenome",
  "statistics": {
    "function_count": 42,
    "class_count": 12
  },
  "sample_functions": [
    {
      "name": "predict_splice_site",
      "signature": "predict_splice_site(sequence: str) -> dict",
      "language": "python"
    }
  ],
  "analyzed_at": "2025-11-09T05:27:00Z"
}
```

### Step 3: MCPサーバー生成

```bash
.claude/Skills/paper2agent/generate-mcp.sh \
  --paper-analysis paper-analysis.json \
  --code-analysis code-analysis.json \
  --generate-impl
```

**出力**:
- `mcp-servers/paper2agent/<name>.json` - MCP定義
- `mcp-servers/paper2agent/<name>/mcp_server.py` - Python実装
- `mcp-servers/paper2agent/<name>/requirements.txt` - 依存関係

### Step 4: テスト

```bash
.claude/Skills/paper2agent/test-agent.sh \
  --mcp .claude/mcp-servers/paper2agent/paper-example.json \
  --paper-analysis paper-analysis.json \
  --code-analysis code-analysis.json
```

---

## サポート言語

| 言語 | 詳細分析 | API抽出 | 備考 |
|------|---------|---------|------|
| Python | ✅ | ✅ | 関数シグネチャ、クラス定義 |
| Rust | ✅ | ✅ | pub関数、struct |
| JavaScript/TypeScript | ⚠️ | ⚠️ | 基本的な抽出 |
| Go | ⚠️ | ⚠️ | 基本的な抽出 |
| Others | ❌ | ⚠️ | 汎用フォールバック |

---

## 依存関係

**必須**:
- `bash` (4.0+)
- `git`
- `curl`
- `jq`
- `python3`

**推奨**:
- `pdftotext` (poppler) - 高品質PDF抽出
- `pypdf` - Pythonフォールバック

```bash
# macOS
brew install poppler jq

# Ubuntu
apt-get install poppler-utils jq
```

---

## 環境変数

```bash
# キャッシュディレクトリ
export MIYABI_PAPER2AGENT_CACHE_DIR="$HOME/.miyabi/paper2agent"

# MCPサーバー出力先
export MIYABI_MCP_SERVERS_DIR=".claude/mcp-servers/paper2agent"

# PDFパーサー選択
export MIYABI_PAPER2AGENT_PDF_PARSER="pdftotext"  # or "pypdf"
```

---

## ディレクトリ構造

```
.claude/Skills/paper2agent/
├── SKILL.md                     # このドキュメント
├── analyze-paper.sh             # PDF → JSON
├── extract-code.sh              # GitHub → API分析
├── generate-mcp.sh              # JSON → MCPサーバー
├── test-agent.sh                # 検証スイート
└── IMPLEMENTATION_COMPLETE.md   # 実装完了レポート

$HOME/.miyabi/paper2agent/       # キャッシュ
├── repos/                       # クローンしたリポジトリ
├── <hash>.pdf                   # キャッシュPDF
└── <hash>.txt                   # 抽出テキスト

.claude/mcp-servers/paper2agent/ # 生成MCPサーバー
└── paper_<name>/
    ├── mcp_server.py
    ├── requirements.txt
    └── README.md
```

---

## クイックスタート例

### 例1: AlphaGenome論文変換

```bash
cd /Users/shunsuke/Dev/miyabi-private

# 1. 論文分析
.claude/Skills/paper2agent/analyze-paper.sh \
  https://arxiv.org/abs/2509.06917 \
  > /tmp/paper-analysis.json

# 2. コード抽出
.claude/Skills/paper2agent/extract-code.sh \
  --repo https://github.com/bioinformatics/alphagenome \
  > /tmp/code-analysis.json

# 3. MCP生成
.claude/Skills/paper2agent/generate-mcp.sh \
  --paper-analysis /tmp/paper-analysis.json \
  --code-analysis /tmp/code-analysis.json \
  --generate-impl

# 4. テスト
.claude/Skills/paper2agent/test-agent.sh \
  --mcp .claude/mcp-servers/paper2agent/paper-alphagenome.json
```

---

## トラブルシューティング

### PDF抽出エラー

```bash
# poppler未インストール
brew install poppler

# pypdfフォールバック
export MIYABI_PAPER2AGENT_PDF_PARSER=pypdf
pip install pypdf
```

### リポジトリクローンタイムアウト

```bash
# 手動クローン
git clone https://github.com/user/repo ~/.miyabi/paper2agent/repos/repo

# --no-cloneで実行
.claude/Skills/paper2agent/extract-code.sh \
  --repo https://github.com/user/repo \
  --no-clone
```

---

## 成功基準

| チェック項目 | 基準 |
|-------------|------|
| PDF分析 | JSON出力あり |
| 論文タイトル抽出 | 非空文字列 |
| コード参照検出 | GitHub URL発見 |
| MCP定義 | 有効なJSON |
| サーバースクリプト | Pythonインポート可能 |

---

## 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| arXiv:2509.06917 | 原論文 |
| `.claude/MCP_INTEGRATION_PROTOCOL.md` | MCPプロトコル |
| `.claude/context/agents.md` | Agent登録 |

---

## 関連Skills

- **Documentation Generation**: 生成エージェントのドキュメント
- **Security Audit**: コード安全性確認
- **Git Workflow**: ブランチ管理・PR作成
