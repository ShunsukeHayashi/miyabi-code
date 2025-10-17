# GPT-OSS-20B Server Setup Guide

OpenAI GPT-OSS-20B モデルのサーバー構築ガイド

---

## 🎯 推奨順序

1. **Groq** (5分) - API キーで即スタート ✅ **最速**
2. **Ollama** (15分) - ローカル実行、Mac/Linux対応 ✅ **プライバシー**
3. **vLLM** (60分) - 本番環境、GPU サーバー ✅ **パフォーマンス**

---

## 1️⃣ Groq Setup (5分) ⚡

**メリット**: サーバー構築不要、クラウドAPI、1000+ tokens/sec

### Step 1: API キー取得

1. Groq Console にアクセス: https://console.groq.com/
2. Sign up / Log in
3. API Keys → Create API Key
4. キーをコピー（例: `gsk_xxxxxxxxxxxxx`）

### Step 2: 環境変数設定

```bash
# ~/.zshrc または ~/.bashrc に追加
export GROQ_API_KEY="gsk_xxxxxxxxxxxxx"

# 反映
source ~/.zshrc
```

### Step 3: テスト実行

```bash
# curl でテスト
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "messages": [
      {
        "role": "user",
        "content": "Write a Rust function to calculate factorial"
      }
    ],
    "temperature": 0.2,
    "max_tokens": 512
  }'
```

**期待される出力**:
```json
{
  "id": "chatcmpl-xxxxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "openai/gpt-oss-20b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "fn factorial(n: u64) -> u64 { ... }"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  }
}
```

### Step 4: Miyabi から使用

```rust
use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let api_key = std::env::var("GROQ_API_KEY")?;
    let provider = GPTOSSProvider::new_groq(&api_key)?;

    let request = LLMRequest::new("Write a hello world in Rust");
    let response = provider.generate(&request).await?;

    println!("{}", response.text);
    Ok(())
}
```

### 料金

- **Input**: $0.10 / 1M tokens
- **Output**: $0.50 / 1M tokens
- **月額目安**: $0.35 (500回実行), $3.50 (5,000回)

---

## 2️⃣ Ollama Setup (15分) 🏠

**メリット**: ローカル実行、プライバシー保護、オフライン対応

### システム要件

| 項目 | 最小要件 | 推奨 |
|------|----------|------|
| RAM | 16GB | 32GB |
| GPU | NVIDIA RTX 3090 (24GB) / Apple M1 16GB | RTX 4090 / M3 Max |
| Storage | 30GB | 50GB |
| OS | macOS 12+, Ubuntu 20.04+ | macOS 14+, Ubuntu 22.04+ |

### Step 1: Ollama インストール

**macOS**:
```bash
# Homebrew でインストール
brew install ollama

# または公式インストーラー
curl -fsSL https://ollama.com/install.sh | sh
```

**Ubuntu/Linux**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: モデルダウンロード

```bash
# gpt-oss:20b モデルをダウンロード (約16GB)
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

### Step 3: モデル実行

```bash
# インタラクティブモード
ollama run gpt-oss:20b

# プロンプト入力
>>> Write a Rust function to calculate factorial
fn factorial(n: u64) -> u64 {
    match n {
        0 | 1 => 1,
        _ => n * factorial(n - 1),
    }
}
>>> /bye
```

### Step 4: API サーバーモード

```bash
# バックグラウンドで API サーバー起動
ollama serve

# デフォルトポート: http://localhost:11434
```

### Step 5: API テスト

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Write a hello world in Rust",
  "stream": false
}'
```

### Step 6: Miyabi から使用

```rust
use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Ollama provider (デフォルト: http://localhost:11434)
    let provider = GPTOSSProvider::new_ollama()?;

    let request = LLMRequest::new("Explain Rust ownership");
    let response = provider.generate(&request).await?;

    println!("{}", response.text);
    Ok(())
}
```

### パフォーマンス (Apple M3 Max 参考)

- **推論速度**: 50-100 tokens/sec
- **レイテンシ**: 5-15秒 (プロンプト長による)
- **メモリ使用**: 14-16GB

### トラブルシューティング

**問題: "Error: model not found"**
```bash
# モデル一覧確認
ollama list

# 再ダウンロード
ollama pull gpt-oss:20b
```

**問題: "Out of memory"**
```bash
# 軽量モデルに切り替え (量子化版)
ollama pull gpt-oss:20b-q4_0  # 4-bit quantized
```

---

## 3️⃣ vLLM Setup (60分) 🏭

**メリット**: 最高パフォーマンス、OpenAI 互換 API、本番環境向け

### システム要件

| 項目 | 最小要件 | 推奨 |
|------|----------|------|
| GPU | NVIDIA A100 40GB | NVIDIA H100 80GB |
| CUDA | 11.8+ | 12.1+ |
| RAM | 64GB | 128GB |
| Storage | 50GB | 100GB |
| OS | Ubuntu 20.04+ | Ubuntu 22.04+ |

### Step 1: NVIDIA Driver + CUDA

```bash
# NVIDIA Driver インストール
sudo apt update
sudo apt install nvidia-driver-535

# CUDA Toolkit インストール
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-ubuntu2204.pin
sudo mv cuda-ubuntu2204.pin /etc/apt/preferences.d/cuda-repository-pin-600
wget https://developer.download.nvidia.com/compute/cuda/12.1.0/local_installers/cuda-repo-ubuntu2204-12-1-local_12.1.0-530.30.02-1_amd64.deb
sudo dpkg -i cuda-repo-ubuntu2204-12-1-local_12.1.0-530.30.02-1_amd64.deb
sudo cp /var/cuda-repo-ubuntu2204-12-1-local/cuda-*-keyring.gpg /usr/share/keyrings/
sudo apt update
sudo apt -y install cuda

# 再起動
sudo reboot
```

### Step 2: Python 環境

```bash
# Python 3.12 + venv
sudo apt install python3.12 python3.12-venv python3-pip

# uv インストール (推奨)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 環境作成
uv venv --python 3.12 --seed
source .venv/bin/activate
```

### Step 3: vLLM インストール

```bash
# vLLM with gpt-oss support
uv pip install --pre vllm==0.10.1+gptoss \
  --extra-index-url https://wheels.vllm.ai/gpt-oss/ \
  --extra-index-url https://download.pytorch.org/whl/nightly/cu128 \
  --index-strategy unsafe-best-match
```

**インストール時間**: 約10-15分

### Step 4: モデル起動

```bash
# API サーバー起動
vllm serve openai/gpt-oss-20b

# カスタムポート
vllm serve openai/gpt-oss-20b --port 8080

# GPU 指定
CUDA_VISIBLE_DEVICES=0 vllm serve openai/gpt-oss-20b
```

**起動ログ**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Loading model openai/gpt-oss-20b
INFO:     Model loaded successfully
```

### Step 5: Docker デプロイ (推奨)

```bash
# Docker イメージでデプロイ
docker run --gpus all \
  -p 8000:8000 \
  --ipc=host \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  vllm/vllm-openai:v0.10.2 \
  --model openai/gpt-oss-20b
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  vllm:
    image: vllm/vllm-openai:v0.10.2
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
    command: --model openai/gpt-oss-20b
    environment:
      - CUDA_VISIBLE_DEVICES=0
    restart: unless-stopped
```

```bash
# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

### Step 6: API テスト

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "messages": [
      {
        "role": "user",
        "content": "Write a Rust function to calculate factorial"
      }
    ],
    "temperature": 0.2,
    "max_tokens": 512
  }'
```

### Step 7: Miyabi から使用

```rust
use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // vLLM provider
    let provider = GPTOSSProvider::new_vllm("http://localhost:8000")?;

    let request = LLMRequest::new("Explain async/await in Rust");
    let response = provider.generate(&request).await?;

    println!("{}", response.text);
    Ok(())
}
```

### パフォーマンス (NVIDIA A100 参考)

- **推論速度**: 500-1000 tokens/sec
- **レイテンシ**: 2-3秒
- **スループット**: 100+ requests/min

### 本番環境設定

**Systemd Service** (`/etc/systemd/system/vllm.service`):
```ini
[Unit]
Description=vLLM API Server
After=network.target

[Service]
Type=simple
User=vllm
WorkingDirectory=/opt/vllm
Environment="PATH=/opt/vllm/.venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="CUDA_VISIBLE_DEVICES=0"
ExecStart=/opt/vllm/.venv/bin/vllm serve openai/gpt-oss-20b --port 8000
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# サービス有効化
sudo systemctl daemon-reload
sudo systemctl enable vllm
sudo systemctl start vllm

# ステータス確認
sudo systemctl status vllm

# ログ確認
sudo journalctl -u vllm -f
```

### Nginx リバースプロキシ

```nginx
upstream vllm_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name llm.example.com;

    location / {
        proxy_pass http://vllm_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for streaming)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

---

## 📊 比較表

| 項目 | Groq | Ollama | vLLM |
|------|------|--------|------|
| **セットアップ時間** | 5分 | 15分 | 60分 |
| **初期コスト** | $0 | $0-1,200 (GPU) | $2,000+ (GPU) |
| **月額コスト** | $0.35-3.50 | $6.76 (電気代) | $539-2,203 (AWS) |
| **推論速度** | 1000+ t/s | 50-100 t/s | 500-1000 t/s |
| **レイテンシ** | 1-2秒 | 5-15秒 | 2-3秒 |
| **プライバシー** | ❌ クラウド | ✅ ローカル | ✅ ローカル |
| **スケーラビリティ** | ✅ 自動 | ❌ 1インスタンス | ✅ 複数GPU |
| **ネットワーク依存** | ✅ 必須 | ❌ オフライン可 | ❌ オフライン可 |
| **推奨用途** | プロトタイピング | 開発環境 | 本番環境 |

---

## 🎯 推奨フロー

### フェーズ1: プロトタイピング (Week 1-2)

✅ **Groq** で検証
- API キー取得 (5分)
- Miyabi 統合テスト
- コスト試算

### フェーズ2: 開発環境 (Week 3-4)

✅ **Ollama** で開発
- Mac/Linux にインストール
- ローカルテスト
- プライバシー確保

### フェーズ3: 本番環境 (Week 5+)

✅ **vLLM** でデプロイ
- AWS/GCP GPU インスタンス
- Docker コンテナ化
- CI/CD 統合

---

## 🔧 トラブルシューティング

### Groq

**問題**: "API key invalid"
```bash
# API キー確認
echo $GROQ_API_KEY

# 再取得
# https://console.groq.com/ で新しいキーを生成
```

**問題**: "Rate limit exceeded"
```bash
# 待機時間を増やす
sleep 1
```

### Ollama

**問題**: "Connection refused"
```bash
# サービス起動確認
ps aux | grep ollama

# 再起動
ollama serve
```

**問題**: "Model not found"
```bash
# 利用可能モデル確認
ollama list

# 再ダウンロード
ollama pull gpt-oss:20b
```

### vLLM

**問題**: "CUDA out of memory"
```bash
# GPU メモリ確認
nvidia-smi

# バッチサイズ削減
vllm serve openai/gpt-oss-20b --max-num-batched-tokens 2048
```

**問題**: "Model not found on HuggingFace"
```bash
# HuggingFace トークン設定
export HF_TOKEN="hf_xxxxx"

# 再起動
vllm serve openai/gpt-oss-20b
```

---

## 📚 参考リンク

- [Groq Console](https://console.groq.com/)
- [Ollama Official](https://ollama.com/)
- [vLLM Documentation](https://docs.vllm.ai/)
- [GPT-OSS Model Card](https://huggingface.co/openai/gpt-oss-20b)
- [OpenAI Cookbook - vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm)
- [OpenAI Cookbook - Ollama](https://cookbook.openai.com/articles/gpt-oss/run-locally-ollama)

---

**最終更新**: 2025-10-17
**ステータス**: ✅ 実装ガイド完成
