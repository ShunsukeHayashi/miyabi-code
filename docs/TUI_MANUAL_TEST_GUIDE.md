# Miyabi TUI - 実機テストガイド

**作成日**: 2025-10-26
**対象**: LLM統合後の動作確認

---

## 🎯 テスト目的

1. TUIの基本動作確認
2. LLM API統合の動作確認
3. エラーハンドリングの確認
4. ユーザーエクスペリエンスの評価

---

## ⚠️ 注意事項

**重要**: TUIを起動すると、ターミナルが完全に占有されます。
- Ctrl+Cで終了できます
- 別のターミナルウィンドウで実行することを推奨

---

## 📋 テストケース一覧

### Test Case 1: API Key無しでの起動テスト

**目的**: API Key未設定時のエラーハンドリング確認

**手順**:
```bash
# 新しいターミナルを開く
cd /Users/shunsuke/Dev/miyabi-private

# API Keyを未設定のまま起動
./target/release/miyabi chat --tui
```

**期待される動作**:
1. ✅ TUIが起動する（エラーで落ちない）
2. ✅ Welcome messageが表示される
3. ✅ メッセージ入力欄が表示される
4. ✅ "Messages (Idle)" とステータスが表示される

**メッセージ送信テスト**:
```
# 入力欄でメッセージを入力
Hello!
[Enter]
```

**期待される動作**:
1. ✅ ユーザーメッセージが表示される（"You: Hello!"）
2. ✅ エラーメッセージが表示される: "Error: LLM client not initialized. Set ANTHROPIC_API_KEY environment variable."
3. ✅ ステータスが "Idle" に戻る

**終了**:
```
Ctrl+C
```

**期待される動作**:
✅ TUIが正常に終了し、ターミナルに戻る

---

### Test Case 2: API Key設定後のLLM統合テスト

**目的**: 実際のLLM API呼び出しの動作確認

**前提条件**:
- ANTHROPIC_API_KEY が有効であること

**手順**:
```bash
# 新しいターミナルを開く
cd /Users/shunsuke/Dev/miyabi-private

# API Keyを設定
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# TUI起動
./target/release/miyabi chat --tui
```

**期待される動作（起動時）**:
1. ✅ TUIが起動する
2. ✅ Welcome messageが表示される
3. ✅ "Messages (Idle)" とステータスが表示される

**シンプルなメッセージテスト**:
```
# 入力欄でメッセージを入力
Hello, how are you?
[Enter]
```

**期待される動作**:
1. ✅ ユーザーメッセージが表示される: "You: Hello, how are you?"
2. ✅ ステータスが "Processing..." に変わる
3. ✅ 数秒待機（API呼び出し中）
4. ✅ ステータスが "Idle" に戻る
5. ✅ アシスタントの応答が表示される: "Miyabi: [Claude's response]"

**複数ターンの会話テスト**:
```
# 2つ目のメッセージ
What is Rust programming language?
[Enter]
```

**期待される動作**:
1. ✅ 前の会話履歴が保持されている
2. ✅ 新しいユーザーメッセージが追加される
3. ✅ Processing状態になる
4. ✅ Claude が会話履歴を考慮して応答する

**終了**:
```
Ctrl+C
```

---

### Test Case 3: エッジケーステスト

#### 3-1: 空メッセージ送信

**手順**:
```
# 何も入力せずにEnter
[Enter]
```

**期待される動作**:
✅ 何も起こらない（空メッセージは送信されない）

#### 3-2: 長いメッセージ

**手順**:
```
Please write a detailed explanation of how async/await works in Rust, including examples of tokio::spawn, tokio::select, and futures. Make it as detailed as possible with code examples.
[Enter]
```

**期待される動作**:
1. ✅ 長いメッセージが送信される
2. ✅ Processing状態になる
3. ✅ Claude から長い応答が返る
4. ✅ メッセージリストがスクロール可能（必要に応じて）

#### 3-3: 特殊文字

**手順**:
```
Test special chars: 日本語, émojis 🎉, symbols !@#$%
[Enter]
```

**期待される動作**:
✅ 特殊文字が正しく表示・送信される

---

### Test Case 4: キーボード操作テスト

#### 4-1: Backspace

**手順**:
```
Helloooo
[Backspace] [Backspace] [Backspace]
→ "Hello"になることを確認
```

**期待される動作**:
✅ Backspaceで文字が削除される

#### 4-2: 長いinput

**手順**:
```
# 非常に長い入力をする（100文字以上）
[長い文章を入力...]
```

**期待される動作**:
✅ Input boxが横スクロールまたは折り返し表示される

---

## 🐛 既知の問題

### 1. ストリーミング非対応

**現象**: LLM応答が一括で表示される

**期待**: リアルタイムでチャンクごとに表示

**ステータス**: 仕様（MVP実装）

### 2. 会話履歴が永続化されない

**現象**: TUI終了後、会話が消える

**期待**: 次回起動時に履歴が復元される

**ステータス**: 未実装

### 3. エラーリトライなし

**現象**: API エラー時、リトライせずエラーメッセージ表示

**期待**: 自動リトライ（exponential backoff）

**ステータス**: 未実装

---

## 📊 テスト結果記録テンプレート

### Test Case 1: API Key無し

- [ ] TUI起動成功
- [ ] Welcome message表示
- [ ] メッセージ送信
- [ ] エラーメッセージ表示
- [ ] 正常終了

**備考**:


---

### Test Case 2: LLM統合

- [ ] API Key設定
- [ ] TUI起動成功
- [ ] シンプルなメッセージ送信
- [ ] Processing状態表示
- [ ] Claude応答表示
- [ ] 複数ターン会話
- [ ] 会話履歴保持

**備考**:


---

### Test Case 3: エッジケース

- [ ] 空メッセージ
- [ ] 長いメッセージ
- [ ] 特殊文字

**備考**:


---

### Test Case 4: キーボード操作

- [ ] Backspace
- [ ] 長いinput

**備考**:


---

## 🎥 スクリーンショット推奨ポイント

1. **起動直後の画面** - Welcome message表示
2. **Processing状態** - "Messages (Processing...)" 表示
3. **Claude応答表示** - 完全な会話ログ
4. **エラーメッセージ** - API Key未設定時のエラー

---

## 💡 デバッグ情報

### ログ確認

TUIはtracing logsを出力します:

```bash
# ログレベルを設定して起動
RUST_LOG=miyabi_tui=debug ./target/release/miyabi chat --tui
```

**ログ出力先**: stderr（TUI起動前に表示されます）

### ビルド情報

```bash
# バージョン確認
./target/release/miyabi --version

# チェックサム（デバッグ用）
shasum ./target/release/miyabi
```

---

## 🚀 実機テスト実施手順（推奨）

### Step 1: 準備

```bash
# 1. プロジェクトルートに移動
cd /Users/shunsuke/Dev/miyabi-private

# 2. 最新ビルドがあることを確認
ls -lh ./target/release/miyabi

# 3. 実行権限確認
chmod +x ./target/release/miyabi
```

### Step 2: Test Case 1実行（API Key無し）

```bash
# 新しいターミナルウィンドウを開く
./target/release/miyabi chat --tui

# テスト実施
# - Welcome message確認
# - メッセージ送信: "Hello"
# - エラーメッセージ確認
# - Ctrl+Cで終了
```

### Step 3: API Key設定

```bash
# ~/.zshrc または ~/.bashrc に追加（永続化）
echo 'export ANTHROPIC_API_KEY=sk-ant-xxxx' >> ~/.zshrc
source ~/.zshrc

# または、現在のセッションのみ
export ANTHROPIC_API_KEY=sk-ant-xxxx
```

### Step 4: Test Case 2実行（LLM統合）

```bash
./target/release/miyabi chat --tui

# テスト実施
# - "Hello, how are you?" 送信
# - Processing状態確認
# - Claude応答確認
# - 追加の会話テスト
# - Ctrl+Cで終了
```

### Step 5: テスト結果記録

上記のテンプレートに記入してください。

---

## 📝 フィードバック項目

実機テスト後、以下の点をフィードバックしてください：

### UX/UI

- [ ] 起動速度は許容範囲か？
- [ ] メッセージ表示は見やすいか？
- [ ] Processing状態は分かりやすいか？
- [ ] エラーメッセージは明確か？

### 機能

- [ ] LLM応答は適切か？
- [ ] 会話履歴は正しく保持されているか？
- [ ] エラーハンドリングは適切か？

### パフォーマンス

- [ ] API呼び出しのレイテンシは許容範囲か？
- [ ] メモリ使用量は問題ないか？
- [ ] CPU使用率は問題ないか？

### 改善提案

（自由記述）


---

**作成日**: 2025-10-26
**対象バージョン**: miyabi v0.1.1 (TUI + LLM統合)
**テスト実施者**:
**テスト日時**:

---

🤖 Generated with [Claude Code](https://claude.com/claude-code) in Miyabi Infinity Mode
