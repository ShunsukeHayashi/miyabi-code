# 🎭 Miyabi Orchestra - Claude Code対応コマンド集

**Claude Codeのインタラクティブモード用に最適化されたワンライナーコマンド**

---

## 🎯 現在の構成

```
Conductor: pane 1 (%1) ← あなた
Agent 1:   pane 2 (%2) ← カエデ (CodeGen)
Agent 2:   pane 3 (%5) ← サクラ (Review)
Agent 3:   pane 4 (%3) ← ツバキ (PR)
Agent 4:   pane 5 (%4) ← ボタン (Deploy)
```

---

## ⚠️ 重要: Claude Code インタラクティブモード対応

**基本スタイル**:
```bash
tmux send-keys -t %N "cd '/Users/shunsuke/Dev/miyabi-private' && [指示内容]" && sleep 0.1 && tmux send-keys -t %N Enter
```

**重要な要素**:
1. ✅ **ダブルクォート**を使用
2. ✅ **cd コマンド**でワーキングディレクトリに移動
3. ✅ **&& sleep 0.1** を挟む
4. ✅ **その後 Enter を送信**

---

## ⚡ クイックテストコマンド

### パターン1: 最もシンプル（推奨）

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。準備ができたら [カエデ] 準備OK と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**期待結果**: カエデが `[カエデ] 準備OK` と発言

---

### パターン2: 自己紹介

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」- Miyabi CodeGenAgentです。簡単な自己紹介をお願いします。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

---

### パターン3: ディレクトリ確認

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && pwdコマンドで現在のディレクトリを確認して、結果を教えてください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

---

## 🎭 全Agent起動コマンド

```bash
# カエデ (Agent 1)
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」- Miyabi CodeGenAgentです。Rustコード実装担当。準備完了したら [カエデ] 準備完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter

# サクラ (Agent 2)
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」- Miyabi ReviewAgentです。コードレビュー担当。準備完了したら [サクラ] 準備完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter

# ツバキ (Agent 3)
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」- Miyabi PRAgentです。PR作成担当。準備完了したら [ツバキ] 準備完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter

# ボタン (Agent 4)
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」- Miyabi DeploymentAgentです。デプロイ担当。準備完了したら [ボタン] 準備完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

---

## 🚀 実践タスクコマンド

### Issue実装

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && Issue #270のコード実装をお願いします。agent-executionスキルを使用してください。完了したら [カエデ] Issue #270完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### コードレビュー

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && カエデが Issue #270完了 と発言したら、コードレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### PR作成

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter
```

---

## 🔧 Agent管理コマンド

### 状態確認

```bash
# カエデの状態確認
tmux capture-pane -t %2 -p | tail -10

# 全Agent一括確認
for pane in %2 %5 %3 %4; do echo "=== $pane ==="; tmux capture-pane -t $pane -p | tail -5; echo ""; done
```

### 記憶リセット

```bash
# カエデをリセット
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %2 Enter

# 全Agent一括リセット
for pane in %2 %5 %3 %4; do tmux send-keys -t $pane "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t $pane Enter; sleep 0.5; done
```

---

## 📋 使い方のコツ

### ✅ DO（良い例）

```bash
# ダブルクォート・cd・sleep・Enter分離
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && Issue #270を実装してください。完了したら [カエデ] 完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### ❌ DON'T（悪い例）

```bash
# 複数行・改行あり（Claude Codeでは正しく動作しない）
tmux send-keys -t %2 "あなたは「カエデ」です。
Issue #270を実装してください。
完了したら報告してください。" && sleep 0.1 && tmux send-keys -t %2 Enter

# cd なし
tmux send-keys -t %2 "タスク内容" && sleep 0.1 && tmux send-keys -t %2 Enter  # ❌ ワーキングディレクトリが不明

# sleep なし
tmux send-keys -t %2 "cd '/path' && タスク" && tmux send-keys -t %2 Enter  # ❌ 実行されない可能性
```

---

## 🎯 テンプレート

### 基本テンプレート

```bash
tmux send-keys -t %N "cd '/Users/shunsuke/Dev/miyabi-private' && [指示内容]。完了したら [エージェント名] [ステータス] と発言してください。" && sleep 0.1 && tmux send-keys -t %N Enter
```

### Skill使用テンプレート

```bash
tmux send-keys -t %N "cd '/Users/shunsuke/Dev/miyabi-private' && [タスク内容]。[スキル名]スキルを使用してください。完了したら [エージェント名] 完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %N Enter
```

### 連鎖タスクテンプレート

```bash
tmux send-keys -t %N "cd '/Users/shunsuke/Dev/miyabi-private' && [前のAgent名]が [完了メッセージ] と発言したら、[タスク内容]を開始してください。" && sleep 0.1 && tmux send-keys -t %N Enter
```

---

## 💡 実践例: Issue #270を4人で処理

### ステップ1: カエデに実装依頼

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && Issue #270のRust実装をagent-executionスキルで行ってください。完了したら [カエデ] Issue #270実装完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### ステップ2: サクラにレビュー待機

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && カエデが Issue #270実装完了 と発言したら、コードレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### ステップ3: ツバキにPR作成待機

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter
```

### ステップ4: ボタンにデプロイ待機

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && ツバキが PR作成完了 と発言したら、デプロイを開始してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

---

## 🎨 pane操作（Kamui版）

| 操作 | コマンド |
|------|---------|
| pane移動 | `Ctrl-a + 矢印` |
| pane番号表示 | `Ctrl-a + q` |
| paneフルスクリーン | `Ctrl-a + z` |
| pane 2に移動 | `Ctrl-a + 2` |
| pane 1に戻る | `Ctrl-a + 1` |

---

## 🚨 トラブルシューティング

### 問題1: Agentが反応しない

```bash
# 状態確認
tmux capture-pane -t %2 -p | tail -20

# paneに移動して直接確認
Ctrl-a + 2
```

### 問題2: コマンドが文字列として表示される

**原因**: 改行を含むコマンドを送信した

**解決**: このドキュメントのワンライナーコマンドを使用

### 問題3: Enterで改行されてしまう（解決済み）

**原因**: `Enter`を直接使用すると、Claude Codeの入力ボックスで改行される

**解決**: sleep を挟んで Enter を分離
```bash
# ❌ 悪い例
tmux send-keys -t %2 'コマンド' Enter

# ❌ これも動かない
tmux send-keys -t %2 'コマンド' C-m

# ✅ 正解
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && コマンド" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### 問題4: 発言（報告）が見つからない

**原因**: Claude Codeでは標準出力への報告は別の方法が必要

**解決**: Agentに「発言してください」と指示し、会話履歴で確認

---

## 📚 関連ドキュメント

- [MIYABI_PARALLEL_ORCHESTRA.md](../.claude/MIYABI_PARALLEL_ORCHESTRA.md) - 哲学とパターン
- [YOUR_CURRENT_SETUP.md](./YOUR_CURRENT_SETUP.md) - あなた専用ガイド（更新済み）
- [QUICK_START_3STEPS.md](./QUICK_START_3STEPS.md) - 3ステップガイド

---

## 🎭 今すぐ試す

**Step 1**: 最もシンプルなテスト

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。準備ができたら [カエデ] 準備OK と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**Step 2**: pane 2に移動して確認

```bash
Ctrl-a + 2
```

**Step 3**: pane 1（Conductor）に戻る

```bash
Ctrl-a + 1
```

---

**🎭 Claude Code対応 - Miyabi Orchestra**

**基本スタイル**: `tmux send-keys -t %N "cd '/path' && [指示]" && sleep 0.1 && tmux send-keys -t %N Enter`
