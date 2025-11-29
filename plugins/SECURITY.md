# Miyabi Plugin Security Policy

## セキュリティ原則

### 機密情報の取り扱い

#### 絶対にコミットしてはいけないもの
- API Keys (Gemini, OpenAI, Anthropic, etc.)
- OAuth Secrets / Client Secrets
- GitHub Personal Access Tokens
- Discord Bot Tokens
- AWS Credentials
- Database Passwords
- Lark App ID / App Secret
- ライセンスキー

#### 環境変数による参照
すべての機密情報は `${VARIABLE_NAME}` 形式で参照:

```json
{
  "env": {
    "GITHUB_TOKEN": "${GITHUB_TOKEN}",
    "GEMINI_API_KEY": "${GEMINI_API_KEY}",
    "LARK_APP_ID": "${LARK_APP_ID}",
    "LARK_APP_SECRET": "${LARK_APP_SECRET}"
  }
}
```

### 必要な環境変数一覧

| 変数名 | 用途 | 取得方法 |
|--------|------|----------|
| `GITHUB_TOKEN` | GitHub API認証 | GitHub Settings → Developer settings → PAT |
| `GEMINI_API_KEY` | Google Gemini API | Google AI Studio |
| `LARK_APP_ID` | Lark OpenAPI認証 | Lark Developer Console |
| `LARK_APP_SECRET` | Lark OpenAPI認証 | Lark Developer Console |
| `DISCORD_BOT_TOKEN` | Discord Bot認証 | Discord Developer Portal |
| `MIYABI_LICENSE_KEY` | 商用機能ライセンス | Miyabi License Portal |
| `OPENAI_API_KEY` | OpenAI API | OpenAI Platform |

---

## MCPサーバーソースコード保護

### 保護対象

```
mcp-servers/           # 全MCPサーバーソース
├── miyabi-*/          # Miyabi独自MCPサーバー
├── gemini3-*/         # Gemini統合サーバー
└── lark-*/            # Lark統合サーバー
```

### 配布時の除外

プラグイン配布時、以下は**含めない**:
- `mcp-servers/` ディレクトリ全体
- `target/` (Rustビルド成果物)
- `.claude/mcp-servers/` (Node.js MCPサーバー)
- 商用ライセンスが必要なバイナリ

---

## 配布パッケージ構成

### Public (オープンソース) パッケージ

```
plugins/
├── index.json              # マーケットプレイス索引
├── README.md               # 使用方法
├── SECURITY.md             # このファイル
├── @miyabi-core/           # 基盤定義 (オープン)
│   ├── context/            # コンテキストファイル
│   ├── principles/         # 15原則
│   ├── AGENT_CHARACTERS.md # キャラクター定義
│   └── .mcp.json.template  # テンプレート (機密なし)
├── @miyabi-dev-agents/     # Agent仕様 (オープン)
│   ├── agents/             # Agent Markdown仕様
│   └── .mcp.json.template
└── ...
```

### Private (商用) パッケージ

```
commercial-package/          # 別リポジトリ or 有料配布
├── mcp-servers/             # コンパイル済みバイナリのみ
│   ├── miyabi-mcp-server    # Rustバイナリ
│   └── dist/                # Minified JS
├── license-server/          # ライセンス認証
└── installation-guide.md
```

---

## 配布モデル

### Tier 1: Community (無料・オープンソース)

**含まれるもの:**
- Agent仕様書 (Markdown)
- コンテキストファイル
- スキル定義
- コマンド定義
- 設定テンプレート

**含まれないもの:**
- MCPサーバーソースコード
- コンパイル済みバイナリ
- 商用Agent機能

### Tier 2: Professional (有料サブスクリプション)

**追加で含まれるもの:**
- コンパイル済みMCPサーバー (バイナリ配布)
- 商用Agent (miyabi-commercial-agents)
- 優先サポート
- ライセンスキー発行

**価格案:**
- 月額: ¥9,800 / $79
- 年額: ¥98,000 / $790 (2ヶ月分お得)

### Tier 3: Enterprise (カスタム契約)

**追加で含まれるもの:**
- ソースコードアクセス (NDA締結)
- カスタマイズ対応
- オンプレミス導入支援
- SLA保証
- 専用サポートチャネル

**価格:**
- 要相談 (¥500,000〜/年)

---

## ライセンス認証フロー

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User      │────▶│  License Server  │────▶│  Feature Gate   │
│  (環境変数) │     │  (miyabi-world)  │     │  (MCP Server)   │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                     │                        │
       │ MIYABI_LICENSE_KEY  │ Validate               │ Enable/Disable
       │                     │                        │ Features
       ▼                     ▼                        ▼
   ┌───────┐           ┌──────────┐            ┌───────────┐
   │ .env  │           │ JWT/API  │            │ Commercial│
   │ file  │           │ Response │            │ Agents    │
   └───────┘           └──────────┘            └───────────┘
```

---

## Git履歴からの機密情報除去

### 既にコミットされた機密情報の対処

```bash
# BFG Repo-Cleaner を使用
bfg --delete-files "*.secret" --no-blob-protection
bfg --replace-text passwords.txt

# git filter-branch (代替)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .mcp.json' \
  --prune-empty --tag-name-filter cat -- --all
```

### 緊急対応手順

1. **即座に認証情報を無効化** (GitHub, Lark, Discord等のダッシュボードで)
2. **新しい認証情報を発行**
3. **Git履歴から削除**
4. **force push** (チーム通知必須)

---

## セキュリティチェックリスト

### コミット前チェック

- [ ] `.mcp.json` に生の認証情報がないか
- [ ] `${ENV_VAR}` 形式で参照しているか
- [ ] `.env` ファイルがコミットされていないか
- [ ] ログにトークンが出力されていないか

### リリース前チェック

- [ ] `mcp-servers/` ソースが除外されているか
- [ ] ライセンス認証が機能するか
- [ ] 環境変数テンプレートが揃っているか
- [ ] セキュリティスキャン実行済みか

---

## 連絡先

セキュリティ脆弱性の報告: security@miyabi-world.com
