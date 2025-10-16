# Mac mini LLM Server - Testing Guide

このガイドでは、Mac mini上でgpt-oss:20bモデルのダウンロードが完了した後、統合テストを実行する手順を説明します。

## 前提条件

- ✅ Mac mini上でOllamaがインストール済み
- ✅ gpt-oss:20bモデルのダウンロードが完了
- ✅ Ollamaがネットワークモード（0.0.0.0:11434）で起動している
- ✅ 開発マシンからMac miniにネットワーク接続可能

## ステップ 1: Mac mini側の準備確認

Mac mini上で以下を確認してください：

```bash
# モデルがダウンロードされていることを確認
ollama list | grep gpt-oss

# Ollamaが起動していることを確認
curl http://localhost:11434/api/tags

# ネットワークモードで起動しているか確認
ps aux | grep ollama
# 結果に "OLLAMA_HOST=0.0.0.0:11434" が含まれていることを確認
```

### Ollamaの起動方法（まだ起動していない場合）

```bash
# ネットワークモードで起動
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

または、LaunchAgentで自動起動設定済みの場合：

```bash
# サービスを再起動
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

# 起動確認
launchctl list | grep ollama
```

## ステップ 2: 開発マシンからの接続確認

開発マシン（このプロジェクトがある環境）で、Mac miniに接続できることを確認：

```bash
# LAN接続の場合
curl http://192.168.3.27:11434/api/tags

# Tailscale接続の場合
curl http://100.88.201.67:11434/api/tags
```

成功すると、以下のようなJSON応答が返ります：

```json
{
  "models": [
    {
      "name": "gpt-oss:20b",
      "modified_at": "2025-01-XX...",
      "size": 13958643712
    }
  ]
}
```

## ステップ 3: 統合テストの実行

### 3.1 環境変数の設定

Mac miniのIPアドレスを環境変数に設定します：

```bash
# LAN接続の場合
export MAC_MINI_IP="192.168.3.27"

# Tailscale接続の場合
export MAC_MINI_IP="100.88.201.67"
```

環境変数を設定しない場合は、デフォルトで `192.168.3.27` が使用されます。

### 3.2 統合テストの実行

プロジェクトルートから、以下のコマンドを実行：

```bash
cd /Users/a003/dev/miyabi-private
export PATH="/Users/a003/.cargo/bin:$PATH"
export MAC_MINI_IP="192.168.3.27"  # または "100.88.201.67"
cargo run --example test_mac_mini
```

### 3.3 期待される出力

成功した場合、以下のような出力が表示されます：

```
=== Mac mini LLM Server Integration Test ===

📡 Connecting to Mac mini: 192.168.3.27
   Endpoint: http://192.168.3.27:11434

✅ Provider created
   Model: gpt-oss:20b
   Max tokens: 128000

🧪 Test 1: Simple prompt
✅ Success!
   Response: Hello! I'm here to help you with any questions or tasks you have.
   Tokens used: 15
   Finish reason: stop
   Elapsed: 2.34s

🧪 Test 2: Code generation (Rust)
✅ Success!
   Generated code:
   ------------------------------------------------------------
   fn factorial(n: u64) -> u64 {
       if n == 0 {
           1
       } else {
           n * factorial(n - 1)
       }
   }
   ------------------------------------------------------------
   Tokens used: 42
   Elapsed: 5.67s

🧪 Test 3: Complex reasoning
✅ Success!
   Response: Rust's ownership system ensures memory safety without garbage collection by enforcing strict rules at compile time: each value has a single owner, ownership can be transferred (moved), and values are automatically dropped when their owner goes out of scope. This prevents memory leaks, data races, and null pointer errors.
   Tokens used: 78
   Elapsed: 8.12s

=== All tests passed! ===

✅ Mac mini LLM server is working correctly
   You can now integrate it into Miyabi agents
```

## トラブルシューティング

### エラー: "Connection refused"

**原因**: Mac miniのOllamaが起動していない、またはネットワークモードで起動していない

**解決策**:
```bash
# Mac mini側で実行
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

### エラー: "Request timeout"

**原因**: ネットワーク遅延、またはモデルの初回読み込みに時間がかかっている

**解決策**:
- 初回実行時は、モデルのメモリ読み込みに30秒程度かかる場合があります
- 再度実行してください
- ネットワーク接続を確認してください

### エラー: "Model not found"

**原因**: gpt-oss:20bモデルがまだダウンロードされていない

**解決策**:
```bash
# Mac mini側で実行
ollama pull gpt-oss:20b

# ダウンロード状況を確認
ollama list
```

### エラー: "API returned status 500"

**原因**: Ollama内部エラー

**解決策**:
```bash
# Mac mini側でログを確認
tail -f ~/Library/Logs/Ollama/server.log

# Ollamaを再起動
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist
```

## パフォーマンス目標

正常に動作している場合、以下のパフォーマンスが期待されます：

| テストケース | 予想トークン数 | 予想実行時間 | 説明 |
|------------|--------------|------------|------|
| Simple prompt | 10-20 tokens | 2-5秒 | 短文生成 |
| Code generation | 30-50 tokens | 5-10秒 | Rust関数生成 |
| Complex reasoning | 50-100 tokens | 8-15秒 | 論理的説明 |

**注**: 初回実行時は、モデルのメモリ読み込みに追加で20-30秒かかる場合があります。

## 次のステップ

統合テストが成功したら、次のフェーズに進めます：

1. **Phase 2**: CodeGenAgentへの統合
   - `generate_code_with_llm()` メソッドの実装
   - miyabi-agents crateへのmiyabi-llm依存追加

2. **Phase 3**: ReviewAgentへの統合
   - `generate_review_comments()` メソッドの実装

3. **Phase 4**: IssueAgentへの統合
   - `analyze_issue_with_llm()` メソッドの実装

## 参考資料

- [GPT_OSS_20B_INTEGRATION_PLAN.md](../../docs/GPT_OSS_20B_INTEGRATION_PLAN.md) - 統合計画全体
- [MAC_MINI_LLM_SERVER_SETUP.md](../../docs/MAC_MINI_LLM_SERVER_SETUP.md) - Mac miniセットアップ詳細
- [MAC_MINI_CHECKLIST.md](../../docs/MAC_MINI_CHECKLIST.md) - 設定確認チェックリスト
- [README.md](README.md) - miyabi-llm crateドキュメント

## サポート

問題が発生した場合は、以下の情報を含めてIssueを作成してください：

- エラーメッセージの全文
- `cargo --version` の出力
- Mac miniのmacOSバージョン
- `ollama list` の出力
- ネットワーク接続方法（LAN / Tailscale）
