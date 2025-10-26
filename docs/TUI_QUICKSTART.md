# Miyabi TUI - クイックスタート

**5分で試せる！Miyabi TUIの基本的な使い方**

---

## 🚀 最速で試す（API Key無し）

```bash
# 1. プロジェクトルートに移動
cd /Users/shunsuke/Dev/miyabi-private

# 2. TUIを起動
./target/release/miyabi chat --tui

# 3. メッセージを入力
Hello!
[Enter]

# → エラーメッセージが表示されます（正常動作）:
# "Error: LLM client not initialized. Set ANTHROPIC_API_KEY environment variable."

# 4. 終了
[Ctrl+C]
```

**確認できること**:
- ✅ TUIが起動する
- ✅ Welcome messageが表示される
- ✅ メッセージ入力が動作する
- ✅ エラーハンドリングが動作する
- ✅ 正常に終了できる

---

## 🔑 実際にLLMと会話する（API Key必要）

### Step 1: API Keyを取得

1. https://console.anthropic.com/ にアクセス
2. API Keysセクションで新しいキーを作成
3. キーをコピー（`sk-ant-...` で始まる文字列）

### Step 2: API Keyを設定

**方法A: 現在のセッションのみ（一時的）**
```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**方法B: 永続的に設定**
```bash
# ~/.zshrc または ~/.bashrc に追加
echo 'export ANTHROPIC_API_KEY=sk-ant-xxxx' >> ~/.zshrc
source ~/.zshrc
```

**確認**:
```bash
echo $ANTHROPIC_API_KEY
# → sk-ant-... が表示されればOK
```

### Step 3: TUIを起動

```bash
./target/release/miyabi chat --tui
```

### Step 4: Claudeと会話

```
Hello, how are you?
[Enter]

# → Processing... 状態になる
# → 数秒後、Claudeの応答が表示される

What is Rust?
[Enter]

# → 会話履歴を考慮して応答される
```

### Step 5: 終了

```
[Ctrl+C]
```

---

## 🎨 UI説明

### 画面構成

```
┌─────────────────────────────────────┐
│  Miyabi TUI - Codex Architecture   │ ← Header
├─────────────────────────────────────┤
│ Messages (Idle)                     │ ← Status
│                                     │
│ System: Welcome to Miyabi TUI!      │
│                                     │
│ You: Hello, how are you?            │
│                                     │
│ Miyabi: I'm doing well, thank you!  │ ← Messages
│         How can I help you today?   │   (scrollable)
│                                     │
│                                     │
├─────────────────────────────────────┤
│ > Hello!_                           │ ← Input
└─────────────────────────────────────┘
```

### ステータス表示

| ステータス | 意味 |
|-----------|------|
| **Idle** | 入力待機中 |
| **Processing...** | LLM API呼び出し中 |
| **Streaming...** | 応答受信中（将来実装） |

### メッセージの色

- **You (緑)**: ユーザーメッセージ
- **Miyabi (青)**: AI応答
- **System (黄)**: システムメッセージ・エラー

---

## ⌨️ キーボード操作

| キー | 動作 |
|------|------|
| **Enter** | メッセージ送信 |
| **Backspace** | 文字削除 |
| **Ctrl+C** | 終了 |

---

## 💡 使用例

### 例1: シンプルな質問

```
> What is the capital of Japan?
[Enter]

Miyabi: The capital of Japan is Tokyo.
```

### 例2: コード生成

```
> Write a hello world program in Rust
[Enter]

Miyabi: Here's a simple Hello World program in Rust:

```rust
fn main() {
    println!("Hello, World!");
}
```

You can run this by saving it to a file...
```

### 例3: 複数ターン会話

```
> What is Rust?
[Enter]

Miyabi: Rust is a systems programming language...

> Can you give me an example?
[Enter]

Miyabi: Sure! Here's an example of Rust code...
```

---

## 🐛 トラブルシューティング

### 問題1: "Error: LLM client not initialized..."

**原因**: ANTHROPIC_API_KEYが設定されていない

**解決策**:
```bash
export ANTHROPIC_API_KEY=sk-ant-xxxx
```

### 問題2: TUIが起動しない

**原因**: バイナリが見つからない

**解決策**:
```bash
# ビルドする
cargo build --package miyabi-cli --bin miyabi --features tui --release

# パスを確認
ls -l ./target/release/miyabi
```

### 問題3: 応答が返ってこない

**原因**: API Keyが無効、またはネットワークエラー

**解決策**:
1. API Keyを確認
2. インターネット接続を確認
3. エラーメッセージを確認（System messageとして表示されます）

### 問題4: 文字化けする

**原因**: ターミナルのエンコーディング

**解決策**:
```bash
# UTF-8を設定
export LANG=en_US.UTF-8
```

---

## 📊 パフォーマンス

### レイテンシ

- **API呼び出し**: 1-3秒（Anthropic Claude）
- **メッセージ表示**: 即座
- **TUI起動**: <1秒

### リソース使用量

- **メモリ**: ~10MB（アイドル時）
- **CPU**: <5%（アイドル時）

---

## 🚀 次のステップ

### 1. 長い会話を試す

複数ターンの会話で、会話履歴がどのように保持されるか確認してください。

### 2. エッジケースをテスト

- 空メッセージ
- 非常に長いメッセージ
- 特殊文字（絵文字、日本語など）

### 3. フィードバックを送る

- 使いやすさ
- 改善提案
- バグ報告

**フィードバック先**: GitHub Issues または開発者に直接

---

## 📚 詳細ドキュメント

- **完全なテストガイド**: [TUI_MANUAL_TEST_GUIDE.md](./TUI_MANUAL_TEST_GUIDE.md)
- **実装レポート**: [TUI_LLM_INTEGRATION_COMPLETION_REPORT.md](./TUI_LLM_INTEGRATION_COMPLETION_REPORT.md)
- **設計ドキュメント**: [TUI_LLM_INTEGRATION_DESIGN.md](./TUI_LLM_INTEGRATION_DESIGN.md)

---

## ❓ FAQ

### Q1: TUIを終了できない

**A**: `Ctrl+C` を押してください。それでも終了しない場合は、別のターミナルから `pkill miyabi` を実行してください。

### Q2: 会話履歴は保存されますか？

**A**: 現在のバージョンでは、TUI終了時に会話履歴は消えます。将来のバージョンで永続化機能を追加予定です。

### Q3: ストリーミング応答は対応していますか？

**A**: 現在のバージョン（MVP）では非対応です。完全な応答を待ってから一括表示されます。将来のバージョンでストリーミング対応予定です。

### Q4: API Keyは安全ですか？

**A**: API Keyは環境変数として扱われ、ファイルには保存されません。ただし、`.zshrc`等に記載した場合は注意してください。

### Q5: 他のLLMプロバイダー（OpenAI、Ollama等）は使えますか？

**A**: 現在はAnthropicのみ対応していますが、`miyabi-llm`クレートは複数プロバイダーをサポートしているため、将来対応予定です。

---

## 🎉 楽しんでください！

Miyabi TUIはまだMVP（最小限の機能を持つ製品）ですが、基本的なチャット機能は動作します。

フィードバックをお待ちしています！

---

**作成日**: 2025-10-26
**対象バージョン**: miyabi v0.1.1
**ステータス**: MVP実装完了

---

🤖 Generated with [Claude Code](https://claude.com/claude-code) in Miyabi Infinity Mode
