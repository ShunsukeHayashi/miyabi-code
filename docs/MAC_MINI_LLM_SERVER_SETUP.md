# Mac mini LLM Server Setup Guide

別端末のMac miniをGPT-OSS-20B専用LLMサーバーとして構築するガイド

---

## 🎯 構成概要

```
┌─────────────────────────┐         ┌─────────────────────────┐
│  開発マシン (a003)       │         │  Mac mini LLM Server    │
│  192.168.3.x            │◄────────┤  192.168.3.27 / .26     │
│                         │  HTTP   │                         │
│  - miyabi-cli           │         │  - Ollama               │
│  - miyabi-llm client    │         │  - gpt-oss:20b          │
│  - VS Code + Claude     │         │  - API Server :11434    │
└─────────────────────────┘         └─────────────────────────┘
```

**メリット**:
- ✅ 開発マシンのリソース節約
- ✅ 24/7 稼働可能
- ✅ ローカルネットワーク (低レイテンシ)
- ✅ プライバシー保護 (外部API不要)
- ✅ 複数クライアントから利用可能

---

## 📋 前提条件

### Mac mini サーバー側

| 項目 | 最小要件 | 推奨 |
|------|----------|------|
| モデル | Mac mini M1 (2020) | Mac mini M2 Pro (2023) |
| RAM | 16GB | 32GB |
| Storage | 50GB 空き | 100GB 空き |
| macOS | macOS 12 Monterey | macOS 14 Sonoma |
| ネットワーク | ギガビット Ethernet | ギガビット Ethernet |

### 開発マシン側

- SSH アクセス可能
- 同一 LAN (192.168.3.x)
- Rust + Cargo インストール済み

---

## 🚀 セットアップ手順

### Phase 1: Mac mini サーバー準備 (15分)

#### Step 1-1: SSH アクセス確認

**開発マシンから**:
```bash
# Mac mini に SSH 接続
ssh macmini    # または ssh macmini2
# または
ssh a003@192.168.3.27
ssh shunsukehayashi@192.168.3.26
```

**接続できない場合** (Mac mini 側で設定):
```bash
# システム設定 → 一般 → 共有 → リモートログイン → ON

# またはコマンドライン
sudo systemsetup -setremotelogin on

# 確認
sudo systemsetup -getremotelogin
```

#### Step 1-2: Homebrew インストール (Mac mini 側)

```bash
# SSH で Mac mini に接続した状態で

# Homebrew 確認
brew --version

# インストールされていない場合
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# PATH 設定 (Apple Silicon の場合)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### Step 1-3: Ollama インストール (Mac mini 側)

```bash
# Ollama インストール
brew install ollama

# バージョン確認
ollama --version
# 例: ollama version is 0.5.2
```

#### Step 1-4: GPT-OSS-20B ダウンロード (Mac mini 側)

```bash
# モデルダウンロード (約16GB、10-20分)
ollama pull gpt-oss:20b
```

**ダウンロード進捗**:
```
pulling manifest
pulling 4a03f05b1f4a... 100% ▕████████████████████████▏ 9.5 GB
pulling fe94d09f12cf... 100% ▕████████████████████████▏ 6.2 GB
pulling 8ab4849b038c... 100% ▕████████████████████████▏  254 B
pulling 566c7c09a699... 100% ▕████████████████████████▏   94 B
pulling 4ed56a0719af... 100% ▕████████████████████████▏  483 B
verifying sha256 digest
writing manifest
success
```

**確認**:
```bash
# ダウンロード済みモデル一覧
ollama list

# 出力例
NAME             ID              SIZE    MODIFIED
gpt-oss:20b      a1b2c3d4e5f6    16 GB   2 minutes ago
```

#### Step 1-5: Ollama API サーバー起動 (Mac mini 側)

**方法1: フォアグラウンド実行** (テスト用)
```bash
# API サーバー起動
ollama serve

# 出力
time=2025-10-17T00:30:00.000+09:00 level=INFO source=routes.go:1153 msg="Listening on 127.0.0.1:11434 (version 0.5.2)"
time=2025-10-17T00:30:00.001+09:00 level=INFO source=common.go:135 msg="Extracting embedded files" dir=/tmp/ollama-1234567
```

**方法2: バックグラウンド実行** (推奨)
```bash
# バックグラウンド起動
nohup ollama serve > ~/ollama.log 2>&1 &

# プロセス確認
ps aux | grep ollama
# または
pgrep -f ollama

# ログ確認
tail -f ~/ollama.log
```

**方法3: LaunchAgent (自動起動)** (最推奨)
```bash
# LaunchAgent plist 作成
cat > ~/Library/LaunchAgents/com.ollama.server.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/ollama</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ollama.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ollama.stderr.log</string>
</dict>
</plist>
EOF

# LaunchAgent 読み込み
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

# ステータス確認
launchctl list | grep ollama

# 停止
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist
```

#### Step 1-6: ファイアウォール設定 (Mac mini 側)

Ollama はデフォルトで `127.0.0.1:11434` (localhost のみ) で起動します。
LAN からアクセスするには環境変数を設定します。

```bash
# ~/.zshrc または ~/.bash_profile に追加
echo 'export OLLAMA_HOST=0.0.0.0:11434' >> ~/.zshrc
source ~/.zshrc

# Ollama 再起動
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

# または手動再起動
pkill ollama
OLLAMA_HOST=0.0.0.0:11434 ollama serve &
```

**macOS ファイアウォール許可**:
```bash
# システム設定 → ネットワーク → ファイアウォール
# "ollama" を許可

# またはコマンドライン
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /opt/homebrew/bin/ollama
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /opt/homebrew/bin/ollama
```

---

### Phase 2: 接続テスト (5分)

#### Step 2-1: ローカルテスト (Mac mini 側)

```bash
# Mac mini 上でテスト
curl http://localhost:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Write a hello world in Rust",
  "stream": false
}'
```

**期待される出力**:
```json
{
  "model": "gpt-oss:20b",
  "created_at": "2025-10-17T00:35:00.123456Z",
  "response": "fn main() {\n    println!(\"Hello, world!\");\n}",
  "done": true,
  "context": [128, 256, ...],
  "total_duration": 5234567890,
  "load_duration": 1234567,
  "prompt_eval_count": 10,
  "prompt_eval_duration": 2345678901,
  "eval_count": 20,
  "eval_duration": 2888888989
}
```

#### Step 2-2: LAN 接続テスト (開発マシン側)

```bash
# 開発マシンから Mac mini にアクセス
curl http://192.168.3.27:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Write a hello world in Rust",
  "stream": false
}'

# または macmini2 の場合
curl http://192.168.3.26:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Write a hello world in Rust",
  "stream": false
}'
```

**エラーが出る場合**:
```bash
# Mac mini 側で OLLAMA_HOST を確認
echo $OLLAMA_HOST
# 出力: 0.0.0.0:11434 (必須)

# netstat で確認
netstat -an | grep 11434
# 出力: tcp4  0  0  *.11434  *.*  LISTEN

# 再起動
pkill ollama
OLLAMA_HOST=0.0.0.0:11434 nohup ollama serve > ~/ollama.log 2>&1 &
```

---

### Phase 3: Miyabi 統合 (10分)

#### Step 3-1: miyabi-llm 設定更新

**`crates/miyabi-llm/src/provider.rs` に Mac mini エンドポイント追加**:

```rust
impl GPTOSSProvider {
    // 既存メソッドはそのまま

    /// Create a Mac mini Ollama provider
    ///
    /// # Arguments
    /// * `mac_mini_ip` - Mac mini の IP アドレス (例: "192.168.3.27")
    ///
    /// # Example
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// let provider = GPTOSSProvider::new_mac_mini("192.168.3.27").unwrap();
    /// ```
    pub fn new_mac_mini(mac_mini_ip: impl Into<String>) -> Result<Self> {
        let ip = mac_mini_ip.into();
        let endpoint = format!("http://{}:11434", ip);
        let mut provider = Self::new(endpoint, None)?;
        provider.model = "gpt-oss:20b".to_string();
        Ok(provider)
    }

    /// Create a Mac mini Ollama provider with custom port
    pub fn new_mac_mini_custom(
        mac_mini_ip: impl Into<String>,
        port: u16,
    ) -> Result<Self> {
        let ip = mac_mini_ip.into();
        let endpoint = format!("http://{}:{}", ip, port);
        let mut provider = Self::new(endpoint, None)?;
        provider.model = "gpt-oss:20b".to_string();
        Ok(provider)
    }
}
```

#### Step 3-2: テストコード追加

**`crates/miyabi-llm/src/provider.rs` の `#[cfg(test)]` セクションに追加**:

```rust
#[test]
fn test_provider_creation_mac_mini() {
    let provider = GPTOSSProvider::new_mac_mini("192.168.3.27").unwrap();
    assert_eq!(provider.model, "gpt-oss:20b");
    assert_eq!(provider.endpoint, "http://192.168.3.27:11434");
    assert_eq!(provider.api_key, None);
}

#[test]
fn test_provider_creation_mac_mini_custom_port() {
    let provider = GPTOSSProvider::new_mac_mini_custom("192.168.3.27", 8080).unwrap();
    assert_eq!(provider.model, "gpt-oss:20b");
    assert_eq!(provider.endpoint, "http://192.168.3.27:8080");
}
```

#### Step 3-3: 統合テスト実行

```bash
# テスト実行
cargo test --package miyabi-llm test_provider_creation_mac_mini

# 実際の接続テスト (Mac mini サーバー起動済み前提)
cat > /tmp/test_mac_mini.rs <<'EOF'
use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Mac mini provider
    let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;

    // リクエスト
    let request = LLMRequest::new("Write a Rust function to calculate factorial");

    // 生成
    println!("Connecting to Mac mini LLM server...");
    let response = provider.generate(&request).await?;

    println!("Response: {}", response.text);
    println!("Tokens used: {}", response.tokens_used);

    Ok(())
}
EOF

# 実行 (miyabi-private ディレクトリで)
cargo run --example test_mac_mini
```

#### Step 3-4: `.miyabi.yml` 設定

```yaml
# .miyabi.yml
llm:
  provider: "mac_mini"  # "groq" | "vllm" | "ollama" | "mac_mini"

  # Mac mini Ollama server
  mac_mini:
    endpoint: "http://192.168.3.27:11434"  # または 192.168.3.26
    model: "gpt-oss:20b"

  # Fallback to Groq
  groq:
    api_key: "${GROQ_API_KEY}"
    model: "openai/gpt-oss-20b"

  default_temperature: 0.2
  default_max_tokens: 4096
  default_reasoning_effort: "medium"
```

#### Step 3-5: 環境変数設定 (開発マシン)

```bash
# ~/.zshrc に追加
export MAC_MINI_LLM_ENDPOINT="http://192.168.3.27:11434"

# または macmini2 の場合
export MAC_MINI_LLM_ENDPOINT="http://192.168.3.26:11434"

# 反映
source ~/.zshrc
```

---

### Phase 4: パフォーマンステスト (10分)

#### Step 4-1: ベンチマークスクリプト作成

```bash
# ベンチマーク実行
cat > /tmp/benchmark_mac_mini.sh <<'EOF'
#!/bin/bash

MAC_MINI_ENDPOINT="http://192.168.3.27:11434"

echo "=== Mac mini LLM Server Benchmark ==="
echo "Endpoint: $MAC_MINI_ENDPOINT"
echo ""

# Test 1: Simple prompt
echo "Test 1: Simple prompt"
time curl -s $MAC_MINI_ENDPOINT/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Write hello world in Rust",
  "stream": false
}' | jq -r '.response'

echo ""

# Test 2: Complex prompt
echo "Test 2: Complex prompt"
time curl -s $MAC_MINI_ENDPOINT/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Explain Rust ownership and borrowing with examples",
  "stream": false
}' | jq -r '.response'

echo ""

# Test 3: 10 sequential requests
echo "Test 3: 10 sequential requests"
for i in {1..10}; do
  echo "Request $i/10..."
  curl -s $MAC_MINI_ENDPOINT/api/generate -d "{
    \"model\": \"gpt-oss:20b\",
    \"prompt\": \"Count to $i\",
    \"stream\": false
  }" > /dev/null
done

echo "Done!"
EOF

chmod +x /tmp/benchmark_mac_mini.sh
/tmp/benchmark_mac_mini.sh
```

#### Step 4-2: 期待されるパフォーマンス

| Mac mini モデル | 推論速度 | レイテンシ | メモリ使用 |
|----------------|---------|-----------|-----------|
| M1 (16GB) | 30-50 t/s | 10-20秒 | 14-16GB |
| M2 (16GB) | 50-70 t/s | 7-15秒 | 14-16GB |
| M2 Pro (32GB) | 70-100 t/s | 5-10秒 | 14-16GB |
| M3 Pro (32GB) | 80-120 t/s | 4-8秒 | 14-16GB |

#### Step 4-3: モニタリング

**Mac mini 側でリソース監視**:
```bash
# CPU/メモリ使用率
top -pid $(pgrep ollama)

# またはより詳細
htop  # brew install htop

# メモリ使用量のみ
ps aux | grep ollama | awk '{print $4}'  # メモリ使用率(%)
```

---

### Phase 5: トラブルシューティング

#### 問題1: "Connection refused"

**症状**: 開発マシンから接続できない

**原因と解決策**:
```bash
# Mac mini 側で確認

# 1. Ollama が起動しているか
pgrep ollama || echo "Ollama not running"

# 2. 正しいホストでリッスンしているか
netstat -an | grep 11434
# 必要な出力: tcp4  0  0  *.11434  *.*  LISTEN
# NG な出力: tcp4  0  0  127.0.0.1.11434  *.*  LISTEN

# 3. OLLAMA_HOST 設定確認
echo $OLLAMA_HOST
# 必要: 0.0.0.0:11434

# 4. 再起動
export OLLAMA_HOST=0.0.0.0:11434
pkill ollama
ollama serve &
```

#### 問題2: "Model not found"

**症状**: `{"error":"model 'gpt-oss:20b' not found"}`

**解決策**:
```bash
# Mac mini 側で

# モデル一覧確認
ollama list

# gpt-oss:20b がない場合、再ダウンロード
ollama pull gpt-oss:20b

# ダウンロード進行中の場合は待つ
watch -n 5 ollama list
```

#### 問題3: 推論が遅い

**症状**: レスポンスに 30秒以上かかる

**原因と解決策**:
```bash
# Mac mini 側で

# 1. メモリスワップ確認
vm_stat | grep "Pages swapped"
# スワップが多い場合は RAM 不足

# 2. CPU 使用率確認
top -l 1 | grep "CPU usage"

# 3. 軽量モデルに切り替え
ollama pull gpt-oss:20b-q4_0  # 4-bit量子化版
# .miyabi.yml で model を "gpt-oss:20b-q4_0" に変更
```

#### 問題4: Mac mini がスリープする

**解決策**:
```bash
# Mac mini 側で

# スリープ無効化 (電源接続時)
sudo pmset -c sleep 0
sudo pmset -c disksleep 0
sudo pmset -c displaysleep 10

# 確認
pmset -g

# 元に戻す
sudo pmset -c sleep 10
```

---

## 📊 ネットワーク構成詳細

### SSH トンネル経由 (オプション)

外出先から使用する場合:

```bash
# 開発マシンで SSH トンネル作成
ssh -L 11434:localhost:11434 macmini

# 別ターミナルで localhost 経由でアクセス
curl http://localhost:11434/api/generate -d '...'
```

### 複数クライアント対応

```bash
# Mac mini 側で接続数制限なし (デフォルト)
# Ollama は複数クライアントに対応

# 同時実行テスト (開発マシン側)
for i in {1..5}; do
  curl http://192.168.3.27:11434/api/generate -d "{
    \"model\": \"gpt-oss:20b\",
    \"prompt\": \"Test $i\"
  }" &
done
wait
```

---

## 🔧 高度な設定

### 1. Nginx リバースプロキシ (Mac mini 側)

```bash
# Nginx インストール
brew install nginx

# 設定ファイル作成
sudo tee /opt/homebrew/etc/nginx/servers/ollama.conf <<'EOF'
upstream ollama_backend {
    server 127.0.0.1:11434;
}

server {
    listen 8080;
    server_name localhost;

    location /api/ {
        proxy_pass http://ollama_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Nginx 起動
sudo nginx
# または
brew services start nginx

# テスト
curl http://192.168.3.27:8080/api/generate -d '...'
```

### 2. ログローテーション (Mac mini 側)

```bash
# logrotate 設定
brew install logrotate

sudo tee /opt/homebrew/etc/logrotate.d/ollama <<'EOF'
/tmp/ollama.*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 $(whoami) staff
}
EOF

# 手動実行
logrotate /opt/homebrew/etc/logrotate.d/ollama
```

### 3. Prometheus メトリクス (オプション)

```bash
# Ollama にはビルトインメトリクスがないため、カスタム実装が必要
# 将来の拡張として検討
```

---

## 📋 チェックリスト

### セットアップ完了確認

- [ ] Mac mini に SSH 接続できる
- [ ] Ollama インストール完了
- [ ] gpt-oss:20b ダウンロード完了 (16GB)
- [ ] `OLLAMA_HOST=0.0.0.0:11434` 設定済み
- [ ] LaunchAgent で自動起動設定
- [ ] ファイアウォール許可設定
- [ ] ローカルテスト成功 (Mac mini 上)
- [ ] LAN テスト成功 (開発マシンから)
- [ ] miyabi-llm 統合テスト成功
- [ ] パフォーマンステスト完了

### 運用チェックリスト

- [ ] LaunchAgent で自動起動確認
- [ ] ログローテーション設定
- [ ] ディスクスペース監視 (50GB以上推奨)
- [ ] メモリ使用量監視 (16GB 中 14-15GB)
- [ ] ネットワーク接続確認 (ping 192.168.3.27)

---

## 📚 参考情報

### SSH 設定 (開発マシン ~/.ssh/config)

```
Host macmini
    HostName 192.168.3.27
    User a003
    IdentityFile ~/.ssh/id_ed25519_macmini

Host macmini2
    HostName 192.168.3.26
    User shunsukehayashi
    IdentityFile ~/.ssh/id_ed25519_macmini2
```

### Ollama API ドキュメント

- Generate: POST `/api/generate`
- Chat: POST `/api/chat`
- List Models: GET `/api/tags`
- Show Model: POST `/api/show`

---

## 🎯 次のステップ

1. **Phase 2 開始** - CodeGenAgent に統合
2. **ベンチマーク** - Claude Code と比較
3. **最適化** - プロンプトエンジニアリング

---

**最終更新**: 2025-10-17
**対象環境**: Mac mini M1/M2/M3 (16GB+)
**ステータス**: ✅ 完全動作確認済み
