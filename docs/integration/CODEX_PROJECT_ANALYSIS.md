# Codex プロジェクト完全解説 - 小学生でもわかる！

**作成日**: 2025-10-26
**対象**: `/Users/shunsuke/Dev/codex_dev/codex`
**作成者**: Claude Code

---

## 🎯 Codexって何？

### 超簡単に言うと

**Codex（コーデックス）は、OpenAIが作った「AIプログラマー」です！**

あなたが「このバグ直して！」とか「テスト書いて！」って言うと、AIが自動でコードを書いたり、テストを実行したり、ファイルを編集したりしてくれる魔法のツールです。

### 例えばこんなことができる

1. **「このファイルのバグ直して」** → AIが自動でバグを見つけて修正
2. **「テスト書いて」** → AIがテストコードを自動生成して実行
3. **「このコードを説明して」** → AIが分かりやすく解説
4. **「SQLマイグレーション作って」** → データベースの設定ファイルを自動生成

---

## 🏗️ プロジェクトの構造

### 大きく分けると3つ

Codexプロジェクトは、大きく分けて**3つの部分**でできています：

```
codex/
├── codex-rs/          ← ① Rustで書かれた「脳みそ」部分（40個のクレート）
├── codex-cli/         ← ② Node.jsのCLIラッパー（実行ファイル）
└── docs/              ← ③ ドキュメント（説明書）
```

### ① codex-rs（Rustの脳みそ）

これが**Codexの本体**です！Rustという言語で書かれていて、40個のクレート（部品）に分かれています。

#### 主要な部品（クレート）

| クレート名 | 何をするもの？ | 例え話 |
|-----------|--------------|--------|
| **codex-core** | Codexの心臓部。会話管理、LLM通信など | 人間の「脳」 |
| **codex-tui** | ターミナルのUI（見た目） | 人間の「顔」 |
| **codex-cli** | コマンドライン実行 | 人間の「口」 |
| **codex-mcp-server** | MCPサーバー（外部ツール連携） | 人間の「手」 |
| **backend-client** | OpenAI APIと通信 | 人間の「耳」 |
| **linux-sandbox** | セキュリティサンドボックス | 人間の「盾」 |
| **git-tooling** | Git操作 | 人間の「記憶」 |
| **file-search** | ファイル検索 | 人間の「目」 |

### ② codex-cli（Node.jsラッパー）

これは**実行するためのラッパー**です。`npm install -g @openai/codex` でインストールすると、この部分が入ります。

中身は：
- `bin/codex.js` - 実際に実行されるJavaScriptファイル
- Rustでビルドされたバイナリを呼び出すだけ

### ③ docs（ドキュメント）

説明書がたくさん入っています：
- `getting-started.md` - 使い方
- `config.md` - 設定方法
- `sandbox.md` - サンドボックスの説明
- `authentication.md` - ログイン方法
- など19個のドキュメント

---

## 🧠 どうやって動いているの？

### 動作の流れ（超詳細版）

```
【1. ユーザーがコマンド実行】
   ↓
$ codex "バグ修正して"
   ↓
【2. codex-cli (Node.js) が起動】
   ↓
bin/codex.js が実行される
   ↓
【3. Rustバイナリを呼び出し】
   ↓
codex-tui が起動（ターミナルUI表示）
   ↓
【4. codex-core がメイン処理】
   ↓
① ユーザーの入力を解析
② 現在のディレクトリを調べる
③ AGENTS.md ファイルを探して読む
④ プロンプトを作成
   ↓
【5. OpenAI APIに送信】
   ↓
backend-client が https://api.openai.com に接続
GPT-4などのモデルにプロンプト送信
   ↓
【6. AIの返事を受信（ストリーミング）】
   ↓
eventsource-stream で Server-Sent Events を受信
返事が少しずつ流れてくる（リアルタイム）
   ↓
【7. ツール呼び出し】
   ↓
AIが「shell」ツールを使いたいと言ってきた！
   ↓
tools/router が適切なツールを呼び出し：
- shell → codex-rs/core/src/tools/runtimes/shell.rs
- edit → ファイル編集
- read → ファイル読み込み
など
   ↓
【8. サンドボックスで実行】
   ↓
linux-sandbox または seatbelt（Mac）で安全に実行
   ↓
【9. 実行結果をAIに返す】
   ↓
backend-client が結果をOpenAI APIに送信
   ↓
【10. AIが次の行動を決める】
   ↓
AIが「もっとツール使う」or「完了」を判断
   ↓
【11. TUIで結果を表示】
   ↓
codex-tui がきれいな画面で結果を表示
   ↓
【12. セッション保存】
   ↓
~/.codex/sessions/ に会話履歴を保存
```

---

## 🔧 主要なクレートの詳細解説

### 1. codex-core（心臓部）

**場所**: `codex-rs/core/`

**役割**: Codexの中心！すべての主要機能がここにあります。

**主要なモジュール**:

```rust
codex_core/
├── auth/               // 認証（ChatGPTログイン、APIキー）
├── bash/               // シェルコマンド実行
├── codex/              // メインのCodex構造体
├── config/             // 設定ファイル管理（~/.codex/config.toml）
├── mcp/                // Model Context Protocol（外部ツール連携）
├── tools/              // ツール実行（shell, edit, read, write等）
│   ├── registry.rs     // 利用可能なツール一覧
│   ├── router.rs       // ツール呼び出しルーター
│   └── runtimes/       // 各ツールの実装
│       ├── shell.rs    // シェル実行
│       ├── apply_patch.rs // パッチ適用
│       └── unified_exec.rs // 統合実行
├── sandboxing/         // サンドボックス（安全実行）
├── conversation/       // 会話履歴管理
└── client/             // LLM通信クライアント
```

**依存関係**（Cargo.toml から）:
- `tokio` - 非同期ランタイム（並行処理）
- `reqwest` - HTTP通信（API呼び出し）
- `eventsource-stream` - Server-Sent Events受信
- `serde_json` - JSON処理
- `anyhow` - エラー処理
- `tracing` - ログ出力

### 2. codex-tui（見た目）

**場所**: `codex-rs/tui/`

**役割**: ターミナルでのユーザーインターフェース（UI）

**使っている技術**:
- `ratatui` - ターミナルUI描画ライブラリ
- `crossterm` - クロスプラットフォームのターミナル制御

**画面構成**:
```
┌─────────────────────────────────────────┐
│ Codex CLI (GPT-4)                       │ ← ヘッダー
├─────────────────────────────────────────┤
│                                         │
│ User: バグ修正して                      │ ← ユーザーメッセージ
│                                         │
│ Assistant: わかりました。              │ ← AI返答
│ まずファイルを確認します...            │
│                                         │
│ [実行中] shell: npm test               │ ← ツール実行状態
│                                         │
├─────────────────────────────────────────┤
│ > ここに入力...                         │ ← 入力欄（Composer）
└─────────────────────────────────────────┘
```

**主要機能**:
- リアルタイムストリーミング表示
- Markdown レンダリング
- コードハイライト（シンタックスハイライト）
- ファジーファイル検索（`@` で起動）
- 画像表示（ペースト対応）

### 3. backend-client（OpenAI通信）

**場所**: `codex-rs/backend-client/`

**役割**: OpenAI APIとの通信を担当

**通信フロー**:
```
1. リクエスト作成
   ↓
2. HTTPSで https://api.openai.com/v1/chat/completions に送信
   ↓
3. Server-Sent Events (SSE) でストリーミング受信
   ↓
4. 各イベントをパース（解析）
   - response.created
   - function_call
   - content.delta（テキストの一部）
   - response.completed
   ↓
5. イベントを codex-core に渡す
```

**認証方法**:
- ChatGPTアカウント（推奨）
- APIキー（従量課金）

### 4. codex-mcp-server（MCP統合）

**場所**: `codex-rs/mcp-server/`

**役割**: Model Context Protocol（MCP）サーバーの実装

**MCPって何？**:
外部ツールやサービスと連携するためのプロトコル（約束事）です。

例：
- データベース接続
- Slack通知
- GitHub操作
- カスタムツール

**設定方法**:
`~/.codex/config.toml` に設定を書く：
```toml
[mcp_servers.my-server]
command = "/path/to/server"
args = ["--port", "8080"]
```

### 5. linux-sandbox / process-hardening（セキュリティ）

**場所**:
- `codex-rs/linux-sandbox/`
- `codex-rs/process-hardening/`

**役割**: コマンド実行を安全に！

**サンドボックスとは？**:
「砂場」という意味。プログラムを「砂場」の中で実行して、外に影響が出ないようにする仕組み。

**仕組み（Linux）**:
1. **Landlock** - ファイルアクセス制限
2. **Seccomp** - システムコール制限

**仕組み（macOS）**:
- **Seatbelt** - Apple純正のサンドボックス

**制限内容**:
- ネットワークアクセス禁止（`CODEX_SANDBOX_NETWORK_DISABLED=1`）
- 特定ディレクトリ以外書き込み禁止
- 危険なシステムコールブロック

### 6. git-tooling（Git操作）

**場所**: `codex-rs/git-tooling/`

**役割**: Git情報の取得

**機能**:
- 現在のブランチ取得
- Git管理下か判定
- コミット情報取得
- `.gitignore` 解析

### 7. file-search（ファイル検索）

**場所**: `codex-rs/file-search/`

**役割**: ファジーファイル検索

**使用技術**:
- `nucleo-matcher` - 高速ファジーマッチング
- `ignore` - `.gitignore` 対応

**TUIでの使い方**:
1. `@` を入力
2. ファイル名の一部を入力（例: `util`）
3. `utils/date.ts` などがマッチ
4. Tab/Enterで選択

---

## 📦 Cargo Workspace構成

Codexは**Cargo Workspace**という仕組みで、40個のクレートを管理しています。

### Workspaceって何？

複数のRustプロジェクトを1つのリポジトリで管理する仕組みです。

### メリット

1. **依存関係の共有** - `tokio` などの共通ライブラリを1回だけダウンロード
2. **一括ビルド** - `cargo build` 1回で全部ビルド
3. **バージョン統一** - すべてのクレートで同じバージョン使用

### 全40クレート一覧

```toml
[workspace]
members = [
    # コア機能
    "core",              # ← 心臓部
    "cli",               # ← CLI実行
    "tui",               # ← UI

    # ネットワーク
    "backend-client",    # ← OpenAI通信
    "chatgpt",           # ← ChatGPTログイン
    "login",             # ← 認証
    "rmcp-client",       # ← MCPクライアント

    # プロトコル
    "protocol",          # ← メッセージ定義
    "app-server-protocol", # ← アプリサーバー通信
    "mcp-types",         # ← MCP型定義

    # ツール実行
    "exec",              # ← 非対話実行
    "apply-patch",       # ← パッチ適用
    "git-apply",         # ← Gitパッチ

    # セキュリティ
    "linux-sandbox",     # ← Linuxサンドボックス
    "execpolicy",        # ← 実行ポリシー
    "process-hardening", # ← プロセス強化

    # ユーティリティ
    "common",            # ← 共通処理
    "ansi-escape",       # ← ANSI制御
    "file-search",       # ← ファイル検索
    "git-tooling",       # ← Git操作

    # MCP
    "mcp-server",        # ← MCPサーバー

    # その他
    "feedback",          # ← フィードバック
    "ollama",            # ← Ollama連携
    "otel",              # ← OpenTelemetry

    # ユーティリティ
    "utils/json-to-toml",
    "utils/readiness",
    "utils/pty",
    "utils/string",
    "utils/tokenizer",

    # ... 合計40個
]
```

---

## 🔄 データフロー（完全版）

### シーケンス図で見る

```
ユーザー          codex-cli      codex-tui      codex-core      backend-client    OpenAI API
   │                 │               │               │                │               │
   │ codex "fix"     │               │               │                │               │
   ├────────────────>│               │               │                │               │
   │                 │ spawn         │               │                │               │
   │                 ├──────────────>│               │                │               │
   │                 │               │ init          │                │               │
   │                 │               ├──────────────>│                │               │
   │                 │               │               │ load config    │               │
   │                 │               │               ├────────┐       │               │
   │                 │               │               │<───────┘       │               │
   │                 │               │               │ read AGENTS.md │               │
   │                 │               │               ├────────┐       │               │
   │                 │               │               │<───────┘       │               │
   │                 │               │<──────────────┤                │               │
   │                 │               │ display ready │                │               │
   │                 │<──────────────┤               │                │               │
   │ Input: "fix bug"│               │               │                │               │
   ├────────────────>│               │               │                │               │
   │                 │               │ user_turn     │                │               │
   │                 │               ├──────────────>│                │               │
   │                 │               │               │ create_prompt  │               │
   │                 │               │               ├────────┐       │               │
   │                 │               │               │<───────┘       │               │
   │                 │               │               │ POST /chat/completions         │
   │                 │               │               ├───────────────>│               │
   │                 │               │               │                │ POST          │
   │                 │               │               │                ├──────────────>│
   │                 │               │               │                │ SSE stream    │
   │                 │               │               │                │<──────────────┤
   │                 │               │               │ event stream   │               │
   │                 │               │               │<───────────────┤               │
   │                 │               │ display stream│                │               │
   │                 │               │<──────────────┤                │               │
   │                 │<──────────────┤               │                │               │
   │<────────────────┤ (streaming)   │               │                │               │
   │                 │               │               │ tool_call      │               │
   │                 │               │               │ (shell)        │               │
   │                 │               │               ├────────┐       │               │
   │                 │               │               │ execute│       │               │
   │                 │               │               │ in sandbox     │               │
   │                 │               │               │<───────┘       │               │
   │                 │               │ tool result   │                │               │
   │                 │               │<──────────────┤                │               │
   │                 │<──────────────┤               │                │               │
   │<────────────────┤               │               │                │               │
   │                 │               │               │ POST result    │               │
   │                 │               │               ├───────────────>│               │
   │                 │               │               │                │ POST          │
   │                 │               │               │                ├──────────────>│
   │                 │               │               │                │ SSE (continue)│
   │                 │               │               │                │<──────────────┤
   │                 │               │ completion    │                │               │
   │                 │               │<──────────────┤                │               │
   │                 │<──────────────┤               │                │               │
   │<────────────────┤               │                │               │               │
```

---

## 🛠️ 使われている技術スタック

### Rust側

| カテゴリ | ライブラリ | 用途 |
|---------|-----------|------|
| 非同期 | tokio | 非同期ランタイム |
| HTTP | reqwest | HTTP通信 |
| JSON | serde_json | JSONパース |
| TUI | ratatui | ターミナルUI |
| ターミナル | crossterm | クロスプラットフォームターミナル制御 |
| エラー | anyhow, thiserror | エラーハンドリング |
| ログ | tracing | ログ出力 |
| 設定 | toml | TOML設定ファイル |
| 正規表現 | regex-lite | 正規表現 |
| ファイル監視 | notify | ファイル変更監視 |
| Git | - | gitコマンド呼び出し |

### Node.js側

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| パッケージ管理 | pnpm | モノレポ管理 |
| フォーマット | prettier | コード整形 |

### ビルドツール

- **Cargo** - Rustビルドシステム
- **cargo-insta** - スナップショットテスト
- **just** - タスクランナー（Makefileの代替）

---

## 🔐 セキュリティの仕組み

### なぜセキュリティが重要？

AIがコマンドを実行するので、悪いことをされないように守る必要があります！

### 3つの防御層

#### 1. コマンド安全性チェック

**場所**: `codex-rs/core/src/command_safety.rs`

危険なコマンドをブロック：
- `rm -rf /` - システム全削除
- `:(){ :|:& };:` - フォークボム（無限プロセス生成）
- `dd if=/dev/zero of=/dev/sda` - ディスク破壊

#### 2. サンドボックス実行

**Linux**: Landlock + Seccomp
- ファイルアクセス制限
- システムコール制限
- ネットワーク禁止

**macOS**: Seatbelt
- Appleのサンドボックス
- ファイル/ネットワーク制限

#### 3. ユーザー承認

**設定**: `~/.codex/config.toml`
```toml
ask_for_approval = true  # コマンド実行前に確認
```

---

## 📝 設定ファイル

### メイン設定

**場所**: `~/.codex/config.toml`

**主要設定**:
```toml
# モデル選択
model = "gpt-4o"

# 承認設定
ask_for_approval = true

# サンドボックス
sandbox_disabled = false

# MCPサーバー
[mcp_servers.my-db]
command = "/path/to/db-server"
args = ["--db", "mydb"]
```

### AGENTS.md（プロジェクト固有指示）

**場所**: プロジェクトルートや `~/.codex/AGENTS.md`

**例**:
```markdown
# Project Instructions

This is a React + TypeScript project.

## Coding Style
- Use functional components
- Prefer hooks over class components
- Follow Airbnb ESLint rules

## Testing
- Run `npm test` after changes
- Coverage must be >80%
```

---

## 🎨 PlantUML図（次のセクション）

次に、PlantUML形式で可視化します！

---

**このドキュメントは次のセクションに続きます...**
