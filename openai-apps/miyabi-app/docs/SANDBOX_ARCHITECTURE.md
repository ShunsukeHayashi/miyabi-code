# Miyabi MCP Server - ユーザーサンドボックスアーキテクチャ

## 概要

マルチユーザー環境でセキュリティとアイソレーションを確保するため、ユーザーごとにサンドボックス（コンテナ）を作成するアーキテクチャを採用します。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Gateway (FastAPI)                        │
│  - OAuth認証                                                     │
│  - ユーザー識別                                                   │
│  - サンドボックスルーティング                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Sandbox A      │ │  Sandbox B      │ │  Sandbox C      │
│  (User: alice)  │ │  (User: bob)    │ │  (User: carol)  │
│                 │ │                 │ │                 │
│  /home/alice/   │ │  /home/bob/     │ │  /home/carol/   │
│  - project/     │ │  - project/     │ │  - project/     │
│  - .env         │ │  - .env         │ │  - .env         │
│  - GitHub Token │ │  - GitHub Token │ │  - GitHub Token │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 実装オプション

### オプション 1: Docker コンテナ (推奨)

```yaml
# docker-compose.sandbox.yml
version: '3.8'
services:
  sandbox-template:
    build: ./sandbox
    volumes:
      - /sandboxes/${USER_ID}:/workspace
    environment:
      - GITHUB_TOKEN=${USER_GITHUB_TOKEN}
      - MIYABI_ROOT=/workspace
    network_mode: bridge
    mem_limit: 2g
    cpus: 1
```

**メリット:**
- 完全なファイルシステムアイソレーション
- リソース制限（CPU、メモリ）
- ネットワークアイソレーション
- 簡単なクリーンアップ

**デメリット:**
- コンテナ起動のオーバーヘッド（〜1-2秒）
- ストレージ使用量の増加

### オプション 2: Linux Namespaces + chroot

```python
import os
import subprocess

def create_sandbox(user_id: str) -> str:
    sandbox_root = f"/sandboxes/{user_id}"
    os.makedirs(sandbox_root, exist_ok=True)

    # Create isolated namespace
    subprocess.run([
        "unshare", "--mount", "--pid", "--fork",
        "chroot", sandbox_root,
        "/bin/bash", "-c", "..."
    ])
    return sandbox_root
```

**メリット:**
- 軽量（コンテナより速い）
- Linuxネイティブ

**デメリット:**
- root権限が必要
- 設定が複雑

### オプション 3: AWS Lambda / Firecracker (サーバーレス)

```python
# Lambda-based sandbox
async def execute_in_sandbox(user_id: str, tool: str, params: dict):
    response = await lambda_client.invoke(
        FunctionName="miyabi-sandbox",
        Payload=json.dumps({
            "user_id": user_id,
            "tool": tool,
            "params": params,
        })
    )
    return json.loads(response["Payload"])
```

**メリット:**
- 完全なアイソレーション
- スケーラブル
- 使用した分だけ課金

**デメリット:**
- コールドスタート（〜100-500ms）
- Lambda制限（15分、メモリ、ストレージ）

## 推奨実装: Docker + オンデマンド起動

### フロー

```
1. ユーザー認証 (OAuth)
   └─> user_id 取得

2. サンドボックス確認
   └─> コンテナが存在するか？
       ├─ Yes: コンテナにリクエスト転送
       └─ No: 新規コンテナ作成 → リクエスト転送

3. ツール実行
   └─> コンテナ内でツール実行
   └─> 結果をゲートウェイに返す

4. アイドルタイムアウト
   └─> 15分間アクティビティなし → コンテナ停止
```

### API設計

```python
# Gateway側
@app.post("/mcp")
async def mcp_handler(request: Request, token: str = Depends(verify_bearer_token)):
    user_id = token_to_user.get(token)

    # Get or create sandbox
    sandbox = await sandbox_manager.get_or_create(user_id)

    # Forward request to sandbox
    result = await sandbox.execute(await request.json())

    return result


# Sandbox Manager
class SandboxManager:
    async def get_or_create(self, user_id: str) -> Sandbox:
        if user_id not in self.sandboxes:
            self.sandboxes[user_id] = await self.create_sandbox(user_id)
        return self.sandboxes[user_id]

    async def create_sandbox(self, user_id: str) -> Sandbox:
        # Create Docker container
        container = await docker.containers.create(
            image="miyabi-sandbox:latest",
            name=f"sandbox-{user_id}",
            environment={
                "USER_ID": user_id,
                "MIYABI_ROOT": "/workspace",
            },
            volumes={
                f"/data/sandboxes/{user_id}": {"bind": "/workspace", "mode": "rw"}
            },
            mem_limit="2g",
            cpu_quota=100000,  # 1 CPU
        )
        await container.start()
        return Sandbox(container)
```

### Sandbox Dockerfile

```dockerfile
# Dockerfile.sandbox
FROM python:3.11-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (optional, for agent execution)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Install Python packages
COPY requirements.txt /
RUN pip install -r /requirements.txt

# Create workspace
RUN mkdir -p /workspace
WORKDIR /workspace

# Sandbox server
COPY sandbox_server.py /
CMD ["python", "/sandbox_server.py"]
```

### Sandbox内部サーバー

```python
# sandbox_server.py
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.post("/execute")
async def execute_tool(request: dict):
    tool_name = request["tool"]
    arguments = request["arguments"]

    # Execute tool in isolated environment
    result = await execute_tool_impl(tool_name, arguments)
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

## セキュリティ考慮事項

### 1. ファイルシステムアイソレーション
- 各ユーザーは自分の `/workspace` のみアクセス可能
- ホストファイルシステムへのアクセスを禁止

### 2. ネットワーク制限
```yaml
networks:
  sandbox-network:
    driver: bridge
    internal: true  # インターネットアクセスを制限
```

### 3. リソース制限
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### 4. 秘密情報管理
- GitHub Tokenは環境変数で注入
- サンドボックス間で秘密情報を共有しない
- Docker Secretsまたは AWS Secrets Manager を使用

## 実装ロードマップ

### Phase 1: 基本サンドボックス (1週間)
- [ ] Docker イメージ作成
- [ ] SandboxManager 実装
- [ ] ゲートウェイとサンドボックス間の通信

### Phase 2: ユーザー管理 (1週間)
- [ ] ユーザーごとのワークスペース作成
- [ ] GitHub Token 管理
- [ ] プロジェクト初期化

### Phase 3: スケーリング (1週間)
- [ ] アイドルコンテナの自動停止
- [ ] 同時ユーザー数制限
- [ ] モニタリング・アラート

### Phase 4: プロダクション (1週間)
- [ ] Kubernetes 移行 (オプション)
- [ ] ログ集約
- [ ] 課金システム統合

## コスト見積もり

### EC2 (現在)
- t3.xlarge: $0.1664/hour
- 月額: ~$120

### Docker サンドボックス (同一サーバー)
- 追加コスト: なし (同一サーバーでコンテナ実行)
- ストレージ: EBS追加 (~$10/100GB)

### AWS Lambda (将来)
- 実行時間ベース課金
- 1M リクエスト/月、平均1秒実行: ~$20

## 結論

**推奨**: Docker コンテナベースのサンドボックス

理由:
1. 現在のEC2環境で即座に実装可能
2. 完全なアイソレーション
3. 既存のMCPサーバーとの統合が容易
4. 将来のKubernetes移行が容易

次のステップ:
1. `Dockerfile.sandbox` 作成
2. `SandboxManager` クラス実装
3. 既存MCPハンドラーの修正
