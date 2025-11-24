# Core Rules - 絶対に守るべき3つのルール

**Last Updated**: 2025-10-26
**Version**: 2.0.1

**Priority**: ⭐⭐⭐⭐⭐ (最重要 - 全タスク実行前に必読)

## 🔄 Rule 1: MCP First Approach

**"全てのタスク実行前に、まずMCPの活用可能性を検討する"**

### Phase 0: MCP確認フロー（必須）

```
タスク開始
    ↓
┌────────────────────┐
│ Phase 0: MCP確認   │ ← 【必須】全タスク実行前に実施
└────────────────────┘
    ↓
【Q1】既存MCPで実現可能か？
    ├─ Yes → 既存MCP活用 → 実装へ
    └─ No → Q2へ
    ↓
【Q2】新規MCP作成が有効か？
    ├─ Yes → 新規MCP作成 → 実装へ
    └─ No → 通常実装へ
```

### 確認コマンド

```bash
claude mcp list  # インストール済みMCP確認
```

### 利用可能なMCP

- `@modelcontextprotocol/server-github` - GitHub操作
- `@modelcontextprotocol/server-filesystem` - ファイル操作
- `context7` - 外部ライブラリドキュメント取得
- `miyabi-mcp-server` - Miyabi Agent実行

### 詳細ドキュメント

**完全仕様**: [MCP_INTEGRATION_PROTOCOL.md](..//MCP_INTEGRATION_PROTOCOL.md)

---

## 🚨 Rule 2: Benchmark Implementation Protocol

**"公式ハーネス必須 - 独自実装禁止"**

### 適用対象

SWE-bench Pro, AgentBench, HAL, Galileo等の公式ベンチマーク

### 実装前チェック（STOP & CHECK）

```bash
cat .claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md
```

### 必ず実行すること

1. **実装前の徹底調査（30分確保）**
   - 公式リポジトリのREADME.md熟読
   - 公式評価ハーネスの存在確認（`run_evaluation.py`等）
   - Docker要件の確認（`Dockerfile`, `docker-compose.yml`）
   - データセット形式の確認（入力・出力）

2. **公式プロトコル最優先**
   - 公式ハーネスが存在する場合は**必ず使用**（独自実装禁止）
   - Docker必須の場合は**必ず使用**（ローカル実行禁止）
   - 入出力形式は**公式形式に完全準拠**（独自形式禁止）

3. **ユーザー確認必須**
   - 実装方針を決定する前に**必ずユーザー様に確認**

### 絶対禁止事項

- ❌ **ショートカット禁止**: 「独自実装の方が速い」
- ❌ **勝手な判断禁止**: ユーザー確認なしで独自実装
- ❌ **虚偽表示禁止**: 独自実装を標準実装と偽る

### 過去の失敗例

**2025-10-22: SWE-bench Pro独自実装事件**
- 公式ハーネス無視 → 使い物にならない
- Docker要件無視 → 再現不可能
- **絶対に繰り返さない**

### 詳細ドキュメント

**チェックリスト**: [BENCHMARK_IMPLEMENTATION_CHECKLIST.md](..//BENCHMARK_IMPLEMENTATION_CHECKLIST.md)

---

## 📚 Rule 3: Context7 Usage

**"外部ライブラリ参照時は必ずContext7使用"**

### 使用が必須のケース

✅ **必ず使用**:
- 公式ベンチマークハーネスのコード参照
- 外部ライブラリの実装パターン確認（Tokio, serde, octocrab等）
- フレームワーク固有の型定義参照
- 最新APIの仕様確認
- Docker設定ファイルの標準パターン取得

### 使用方法

```bash
# Claude Codeで指示
"Use context7 to get the latest Tokio async runtime documentation"
"Use context7 to get the latest SWE-bench Pro evaluation harness code"
```

### 禁止事項

❌ **やってはいけないこと**:
- コードの直接コピー&ペースト（ライセンス違反リスク）
- Context7なしでの外部コード再実装（古いAPI使用リスク）
- 公式ドキュメント無視の独自実装（再現性欠如リスク）

### セットアップ

```bash
# Context7 MCPサーバー追加（初回のみ）
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

**API Key取得**: [context7.com](https://context7.com/) でアカウント作成（無料）

---

## 🔁 Rule 4: Relay & Skill Proxy Protocol

**"エージェント間のトリガーを必ず自動化し、必要なコマンドはホスト側で代行実行する"**

### 4-1. メッセージリレーの必須フォーマット

- 各エージェントはタスク完了／中断時に、次担当へ `[送信元→送信先]` 形式のメッセージを送る。
- 例: `[カエデ→サクラ] レビュー依頼: タイムライン集計スクリプトUTC補正`
- 送信は `tmux send-keys -t <PANE> "message" && sleep 0.1 && tmux send-keys -t <PANE> Enter` を厳守。

### 4-2. Skill Proxy を使ったコマンド実行

- Codexからスキルを直接叩けない場合は、メッセージ内に `[[exec:実行したいコマンド]]` を埋め込み、`miyabi-skill-proxy` がホスト側で実行する。
- Skill Proxy 起動方法:

```bash
./scripts/miyabi-skill-proxy.sh watch --session miyabi-refactor --interval 5
```

- コマンド例: `[[exec:miyabi agent run --issue 715 --task refactor]]`

### 4-3. リレー監視

- `scripts/miyabi-relay-watchdog.sh` を定期的に実行し、必須メッセージが流れているか確認する。

```bash
./scripts/miyabi-relay-watchdog.sh --session miyabi-refactor
```

- 未達成のリレーがあれば即座に手動で補填し、原因をConductorレポートに記録すること。

### 4-4. tmux ペインマッピング

- `.ai/orchestra/pane-map.json` に現在のペインIDを記録する。`orchestra-set-pane-ui.sh` はこのファイルを優先して利用する。
- 例:

```json
{
  "カンナ": "%52",
  "カエデ": "%53",
  "サクラ": "%55",
  "ツバキ": "%51",
  "ボタン": "%54"
}
```

---

## 🎯 Summary

| Rule | Check | Documentation |
|------|-------|---------------|
| **MCP First** | `claude mcp list` | [MCP_INTEGRATION_PROTOCOL.md](..//MCP_INTEGRATION_PROTOCOL.md) |
| **Benchmark Protocol** | `cat .claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md` | [BENCHMARK_IMPLEMENTATION_CHECKLIST.md](..//BENCHMARK_IMPLEMENTATION_CHECKLIST.md) |
| **Context7** | `"Use context7 to get..."` | [External Deps](./external-deps.md) |

**これらのルールは全タスクで最優先です。必ず確認してから実装を開始してください。**
