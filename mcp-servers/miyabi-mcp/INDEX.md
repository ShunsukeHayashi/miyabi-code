# Miyabi MCP - Documentation Index

**Version**: 1.0.0
**Last Updated**: 2025-11-19
**Status**: Production Ready ✅

---

## 📖 Documentation Structure

```
miyabi-mcp/
├── 🚀 QUICKSTART.md              ← START HERE (5分で開始)
├── 📋 README.md                  ← 全ツールリファレンス
├── 🎯 TOOL_INDEX.md              ← 階層的ツール索引
├── 🔄 WORKFLOW_PATTERNS.md       ← ワークフローパターン集
├── 📊 DEPLOYMENT_SUMMARY.md      ← デプロイメント詳細
└── 📑 INDEX.md                   ← このファイル
```

---

## 🎯 あなたの目的は？

### 🆕 初めて使う方

**読む順番**:
1. **QUICKSTART.md** (5分) - セットアップと動作確認
2. **README.md** - 全ツールの概要把握
3. **WORKFLOW_PATTERNS.md** - 実践的な使い方

**最初にやること**:
- [ ] GitHub Token 設定
- [ ] Claude Desktop 再起動
- [ ] 基本ツール (`git_status`, `resource_overview`) で動作確認

---

### 🔍 特定のツールを探している方

**Go to**: `TOOL_INDEX.md`

- 階層構造で 75 ツールを整理
- 優先度別 (P0-P3) に分類
- 状況別のツール選択ガイド
- 決定木でツールを素早く発見

**例**:
- エラー調査 → P0 Tools → `log_get_errors`
- Git状態確認 → P0 Tools → `git_status`
- タスク確認 → P0 Tools → `github_list_issues`

---

### 🔄 ワークフローを自動化したい方

**Go to**: `WORKFLOW_PATTERNS.md`

11個の実践的ワークフローパターン:

**開発フロー (3パターン)**:
- WF-D1: 作業開始フロー
- WF-D2: 実装作業フロー
- WF-D3: コードレビューフロー

**監視フロー (3パターン)**:
- WF-M1: システム定期監視
- WF-M2: ファイル変更監視
- WF-M3: Claude Code自己監視

**トラブルシューティング (3パターン)**:
- WF-T1: エラー原因調査
- WF-T2: パフォーマンス問題調査
- WF-T3: ネットワーク問題調査

**統合・レポート (2パターン)**:
- WF-I1: GitHub Issue → 実装 → PR
- WF-I2: エラー検出 → Issue自動作成
- WF-R1: デイリースタンドアップレポート
- WF-R2: 週次システムレポート

---

### 🛠️ 技術詳細を知りたい方

**Go to**: `DEPLOYMENT_SUMMARY.md`

含まれる情報:
- ✅ ビルドステータス (9/9 成功)
- 📦 パッケージ構造
- 🔧 設定状態
- 📊 ツール配分
- 🎯 優先度インデックス
- 📚 ベストプラクティス
- ⚠️ 既知の問題と制限
- 📈 パフォーマンスメトリクス
- 🔮 将来の拡張

---

### 📋 全ツールリストを見たい方

**Go to**: `README.md`

9カテゴリ、75ツールの完全リファレンス:

1. **Git Operations** (10 tools)
2. **Tmux Sessions** (9 tools)
3. **Log Aggregation** (6 tools)
4. **Resource Monitor** (8 tools)
5. **Network Inspector** (8 tools)
6. **Process Inspector** (8 tools)
7. **File Watcher** (6 tools)
8. **Claude Code Monitor** (8 tools)
9. **GitHub Integration** (12 tools)

各ツールに以下の情報:
- ツール名
- 説明
- パラメーター
- 使用例
- レスポンス形式

---

## 🎓 学習パス

### レベル1: 基礎 (初心者向け)

**目標**: 基本ツールを使えるようになる

1. **QUICKSTART.md** を読む (5分)
2. P0 ツールを試す:
   - `git_status()`
   - `resource_overview()`
   - `github_list_issues()`
3. **README.md** の基本セクションを読む

**所要時間**: 30分

---

### レベル2: 実践 (中級者向け)

**目標**: ワークフローパターンを実践

1. **WORKFLOW_PATTERNS.md** を読む
2. WF-D1 (作業開始フロー) を実践
3. WF-M1 (システム定期監視) を実践
4. 自分用のカスタムワークフローを作成

**所要時間**: 2時間

---

### レベル3: マスター (上級者向け)

**目標**: 完全自動化を実現

1. **TOOL_INDEX.md** で全ツールを把握
2. 全 11 ワークフローパターンを実践
3. エラー検出 → Issue作成の自動化
4. GitHub Issue → PR の完全自動化

**所要時間**: 1日

---

## 🔗 クイックリンク

### セットアップ

- [クイックスタート](QUICKSTART.md)
- [設定テンプレート](claude-config-template.json)
- [セットアップスクリプト](setup-all.sh)

### ドキュメント

- [全ツールリファレンス](README.md)
- [ツールインデックス](TOOL_INDEX.md)
- [ワークフローパターン](WORKFLOW_PATTERNS.md)
- [デプロイメント詳細](DEPLOYMENT_SUMMARY.md)

### 技術情報

- [パッケージ定義](package.json)
- [TypeScript設定](tsconfig.json)
- [ビルドスクリプト](build-bundle.sh)

---

## 📊 ツール選択チートシート

### 状況別おすすめツール

| 状況 | 推奨ツール | 優先度 |
|------|-----------|--------|
| **作業開始時** | `git_status`, `github_list_issues`, `log_get_errors` | P0 |
| **エラー発生** | `log_get_errors`, `log_search`, `process_search` | P0 |
| **パフォーマンス低下** | `resource_overview`, `process_top`, `network_bandwidth` | P1 |
| **ファイル変更確認** | `file_recent_changes`, `git_diff` | P1 |
| **タスク管理** | `github_list_issues`, `github_create_pr` | P1 |
| **システム監視** | `resource_overview`, `network_overview`, `tmux_list_panes` | P2 |
| **詳細調査** | `git_file_history`, `process_environment`, `network_ping` | P3 |

---

## 🎯 P0ツール (必須確認)

毎回のセッション開始時に必ず実行すべきツール:

```typescript
// 1. Git状態確認
git_status()

// 2. エラー検出
log_get_errors({ minutes: 1440 })  // 過去24時間

// 3. システム状態
resource_overview()

// 4. 未完了タスク
github_list_issues({ state: "open", assignee: "@me" })
```

---

## 🔄 ワークフロー早見表

### 開発ワークフロー

```
作業開始 → WF-D1
   ↓
実装作業 → WF-D2
   ↓
レビュー → WF-D3
   ↓
統合 → WF-I1 (GitHub Issue → PR)
```

### 監視ワークフロー

```
定期監視 (30分) → WF-M1
   ↓
ファイル監視 (10分) → WF-M2
   ↓
自己監視 (1時間) → WF-M3
```

### トラブルシューティング

```
エラー検出 → WF-T1 (エラー調査)
   ↓
パフォーマンス低下 → WF-T2 (性能調査)
   ↓
ネットワーク問題 → WF-T3 (ネット調査)
   ↓
Issue自動作成 → WF-I2
```

---

## ✅ チェックリスト

### 初回セットアップ

- [ ] GitHub Token 作成・設定
- [ ] Claude Desktop 設定更新
- [ ] Claude Desktop 再起動
- [ ] 基本ツール動作確認
- [ ] QUICKSTART.md 完読
- [ ] README.md 概要把握

### 日次タスク

- [ ] P0 ツールで状況確認
- [ ] エラーログ確認
- [ ] 未完了タスク確認
- [ ] システム状態確認

### 週次タスク

- [ ] 全MCPサーバー状態確認 (`claude_mcp_status`)
- [ ] パフォーマンストレンド確認
- [ ] エラー統計レビュー
- [ ] ドキュメント更新確認

---

## 🆘 トラブルシューティング

### よくある問題

| 問題 | 解決方法 | 参照先 |
|------|---------|--------|
| ツールが動作しない | `claude_mcp_status()` で確認 | QUICKSTART.md |
| GitHub APIエラー | Token 再設定 | QUICKSTART.md |
| MCPサーバー未起動 | Claude Desktop 再起動 | DEPLOYMENT_SUMMARY.md |
| パフォーマンス低下 | WF-T2 パターン実行 | WORKFLOW_PATTERNS.md |

### サポート

1. **ドキュメント確認**: まずこのINDEXから関連ドキュメントを探す
2. **ログ確認**: `claude_logs()`, `claude_log_search()` でエラー詳細
3. **状態確認**: `claude_status()` で総合ステータス

---

## 📈 統計情報

### パッケージ規模

- **Total Servers**: 9
- **Total Tools**: 75
- **Total Lines of Code**: ~3,500
- **Documentation Pages**: 6
- **Workflow Patterns**: 11

### カバー範囲

- **Development**: ✅ Git, tmux, logs, files
- **System**: ✅ CPU, memory, disk, network
- **Process**: ✅ Process management, monitoring
- **Self-Monitoring**: ✅ Claude Code status
- **Integration**: ✅ GitHub Issues, PRs

---

## 🎉 まとめ

**Miyabi MCP は完全な状況把握と自律的開発を実現する統合ツールキットです。**

### 次のステップ

1. **今すぐ**: [QUICKSTART.md](QUICKSTART.md) で5分セットアップ
2. **今日中**: [WORKFLOW_PATTERNS.md](WORKFLOW_PATTERNS.md) で基本パターン習得
3. **今週中**: [TOOL_INDEX.md](TOOL_INDEX.md) で全ツールマスター

---

**Happy Coding with Miyabi MCP! 🚀**

**Version**: 1.0.0 | **Status**: Production Ready ✅
