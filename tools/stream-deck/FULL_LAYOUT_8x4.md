# Stream Deck 完全レイアウト - 8行×4列（32ボタン）

**最終更新**: 2025-10-26
**対象**: Stream Deck Mobile (iOS/Android)
**構成**: 8行 × 4列 = 32ボタン

---

## 📋 全体構成

| 行 | カテゴリ | 用途 |
|---|---------|------|
| Row 1 | Claude Code基本操作 | Next, Continue, Fix, Help |
| Row 2 | ビルド・テスト | Build, Test, Clippy, Format |
| Row 3 | Git操作 | Status, Commit, PR, Push |
| Row 4 | Agent実行 | Coordinator, CodeGen, Review, Deploy |
| Row 5 | ドキュメント・解析 | Docs, Analyze, Benchmark, Profile |
| Row 6 | デプロイ・インフラ | Deploy, Rollback, Logs, Monitor |
| Row 7 | ユーティリティ | Clean, Cache, Deps, Audit |
| Row 8 | カスタム・拡張 | Voice, Infinity, Session, Custom |

---

## Row 1: Claude Code基本操作 (1-4)

### ボタン1: ▶️ Next
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
引数: next
タイトル: Next
アイコン: ▶️
```

### ボタン2: ⏭️ Continue
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
引数: continue
タイトル: Continue
アイコン: ⏭️
```

### ボタン3: 🔧 Fix Errors
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
引数: fix
タイトル: Fix
アイコン: 🔧
```

### ボタン4: ❓ Help
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
引数: help
タイトル: Help
アイコン: ❓
```

---

## Row 2: ビルド・テスト (5-8)

### ボタン5: 🏗️ Build Release
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/02-build-release.sh
タイトル: Build
アイコン: 🏗️
```

### ボタン6: ✅ Run Tests
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/03-run-tests.sh
タイトル: Test
アイコン: ✅
```

### ボタン7: 📎 Clippy
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/07-clippy.sh
タイトル: Clippy
アイコン: 📎
```

### ボタン8: 💅 Format
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/08-format.sh
タイトル: Format
アイコン: 💅
```

---

## Row 3: Git操作 (9-12)

### ボタン9: 📊 Git Status
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/04-git-status.sh
タイトル: Git
アイコン: 📊
```

### ボタン10: 💬 Commit
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
引数: commit
タイトル: Commit
アイコン: 💬
```

### ボタン11: 🔀 Create PR
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
引数: pr
タイトル: PR
アイコン: 🔀
```

### ボタン12: 🚀 Push
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/09-git-push.sh
タイトル: Push
アイコン: 🚀
```

---

## Row 4: Agent実行 (13-16)

### ボタン13: 🎯 Coordinator
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/10-agent-coordinator.sh
タイトル: Coord
アイコン: 🎯
```

### ボタン14: ⚙️ CodeGen
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/11-agent-codegen.sh
タイトル: CodeGen
アイコン: ⚙️
```

### ボタン15: 🔍 Review
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/12-agent-review.sh
タイトル: Review
アイコン: 🔍
```

### ボタン16: 🚢 Deploy Agent
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/13-agent-deploy.sh
タイトル: Deploy
アイコン: 🚢
```

---

## Row 5: ドキュメント・解析 (17-20)

### ボタン17: 📚 Generate Docs
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/14-generate-docs.sh
タイトル: Docs
アイコン: 📚
```

### ボタン18: 🔬 Analyze Code
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/15-analyze-code.sh
タイトル: Analyze
アイコン: 🔬
```

### ボタン19: 🏁 Benchmark
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/16-benchmark.sh
タイトル: Bench
アイコン: 🏁
```

### ボタン20: ⚡ Profile
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/17-profile.sh
タイトル: Profile
アイコン: ⚡
```

---

## Row 6: デプロイ・インフラ (21-24)

### ボタン21: 🌐 Deploy Prod
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/18-deploy-prod.sh
タイトル: Deploy
アイコン: 🌐
```

### ボタン22: ⏪ Rollback
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/19-rollback.sh
タイトル: Rollback
アイコン: ⏪
```

### ボタン23: 📝 View Logs
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/20-view-logs.sh
タイトル: Logs
アイコン: 📝
```

### ボタン24: 📡 Monitor
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/21-monitor.sh
タイトル: Monitor
アイコン: 📡
```

---

## Row 7: ユーティリティ (25-28)

### ボタン25: 🧹 Clean Build
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/22-clean-build.sh
タイトル: Clean
アイコン: 🧹
```

### ボタン26: 💾 Clear Cache
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/23-clear-cache.sh
タイトル: Cache
アイコン: 💾
```

### ボタン27: 📦 Update Deps
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/24-update-deps.sh
タイトル: Deps
アイコン: 📦
```

### ボタン28: 🔒 Security Audit
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/25-security-audit.sh
タイトル: Audit
アイコン: 🔒
```

---

## Row 8: カスタム・拡張 (29-32)

### ボタン29: 🔊 Voice Notify
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/01-notify-voice.sh
引数: タスク完了しました
タイトル: Voice
アイコン: 🔊
```

### ボタン30: ∞ Infinity Mode
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
引数: infinity
タイトル: Infinity
アイコン: ∞
```

### ボタン31: 🔄 Session End
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/26-session-end.sh
タイトル: Session
アイコン: 🔄
```

### ボタン32: ⚙️ Custom
```
パス: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/27-custom.sh
タイトル: Custom
アイコン: ⚙️
```

---

## 📊 ボタン配置図

```
┌─────┬─────┬─────┬─────┐
│ ▶️  │ ⏭️ │ 🔧  │ ❓  │  Row 1: Claude Code基本操作
│Next │Cont │Fix  │Help │
├─────┼─────┼─────┼─────┤
│ 🏗️ │ ✅  │ 📎  │ 💅  │  Row 2: ビルド・テスト
│Build│Test │Clip │Fmt  │
├─────┼─────┼─────┼─────┤
│ 📊  │ 💬  │ 🔀  │ 🚀  │  Row 3: Git操作
│Git  │Commit│PR  │Push │
├─────┼─────┼─────┼─────┤
│ 🎯  │ ⚙️  │ 🔍  │ 🚢  │  Row 4: Agent実行
│Coord│Code │Rev  │Dep  │
├─────┼─────┼─────┼─────┤
│ 📚  │ 🔬  │ 🏁  │ ⚡  │  Row 5: ドキュメント・解析
│Docs │Anlz │Bench│Prof │
├─────┼─────┼─────┼─────┤
│ 🌐  │ ⏪  │ 📝  │ 📡  │  Row 6: デプロイ・インフラ
│Dep  │Roll │Logs │Mon  │
├─────┼─────┼─────┼─────┤
│ 🧹  │ 💾  │ 📦  │ 🔒  │  Row 7: ユーティリティ
│Clean│Cache│Deps │Audit│
├─────┼─────┼─────┼─────┤
│ 🔊  │ ∞   │ 🔄  │ ⚙️  │  Row 8: カスタム・拡張
│Voice│Inf  │Sess │Cust │
└─────┴─────┴─────┴─────┘
```

---

## 🚀 セットアップ手順

### Step 1: 全スクリプトを生成
```bash
tools/stream-deck/generate-all-scripts.sh
```

### Step 2: Stream Deck Mobileアプリで設定
1. 新しいプロファイル作成: **Miyabi Full Layout**
2. 8行×4列で32個のボタンを配置
3. 上記の設定に従って各ボタンを設定

### Step 3: 動作確認
```bash
tools/stream-deck/test-all-scripts.sh
```

---

## 📝 スクリプト一覧

| 番号 | スクリプト名 | 機能 |
|------|------------|------|
| 01 | notify-voice.sh | 音声通知 |
| 02 | build-release.sh | リリースビルド |
| 03 | run-tests.sh | テスト実行 |
| 04 | git-status.sh | Git状態確認 |
| 05 | send-to-claude.sh | Claude Code送信 |
| 06 | quick-commands.sh | 定型コマンド |
| 07 | clippy.sh | Clippy実行 |
| 08 | format.sh | コードフォーマット |
| 09 | git-push.sh | Git Push |
| 10 | agent-coordinator.sh | Coordinator Agent |
| 11 | agent-codegen.sh | CodeGen Agent |
| 12 | agent-review.sh | Review Agent |
| 13 | agent-deploy.sh | Deploy Agent |
| 14 | generate-docs.sh | ドキュメント生成 |
| 15 | analyze-code.sh | コード解析 |
| 16 | benchmark.sh | ベンチマーク |
| 17 | profile.sh | プロファイリング |
| 18 | deploy-prod.sh | 本番デプロイ |
| 19 | rollback.sh | ロールバック |
| 20 | view-logs.sh | ログ表示 |
| 21 | monitor.sh | モニタリング |
| 22 | clean-build.sh | ビルドクリーン |
| 23 | clear-cache.sh | キャッシュクリア |
| 24 | update-deps.sh | 依存関係更新 |
| 25 | security-audit.sh | セキュリティ監査 |
| 26 | session-end.sh | セッション終了 |
| 27 | custom.sh | カスタムコマンド |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
