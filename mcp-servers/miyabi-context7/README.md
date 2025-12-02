# Miyabi Context7 - Self-Hosted Documentation Retrieval

Context7の完全セルフホスト代替。プライベートリポジトリのドキュメントを無料でインデックス・検索可能。

## 🎯 概要

| 項目 | Context7 Pro | Miyabi Context7 |
|------|-------------|-----------------|
| 月額 | $7/シート + $15/100万トークン | **$0〜$17** |
| プライベートリポジトリ | ✅ | ✅ |
| セルフホスト | ❌ | ✅ |
| データプライバシー | クラウド | **完全ローカル** |

## 🚀 クイックスタート（ローカル開発）

```bash
# 1. Qdrantを起動
docker run -d -p 6333:6333 qdrant/qdrant

# 2. 依存関係インストール
pip install -r requirements.txt

# 3. サーバー起動
python main.py

# 4. ドキュメントをインデックス
curl -X POST http://localhost:8080/index-docs \
  -H "Content-Type: application/json" \
  -d '{
    "library_id": "/miyabi/docs",
    "title": "Miyabi Documentation",
    "content": "# Miyabi\n\nAI-powered development framework..."
  }'

# 5. 検索テスト
curl -X POST http://localhost:8080/get-library-docs \
  -H "Content-Type: application/json" \
  -d '{
    "context7CompatibleLibraryID": "/miyabi/docs",
    "topic": "MCP servers",
    "tokens": 5000
  }'
```

## 🐳 Docker Compose（推奨）

```bash
# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f api

# 停止
docker-compose down
```

## ☁️ AWS デプロイオプション

### Option A: EC2 + Qdrant（低コスト推奨）

**月額: ~$17**

```bash
# セットアップスクリプト実行
chmod +x setup-ec2-lowcost.sh
./setup-ec2-lowcost.sh
```

### Option B: Serverless (Lambda + OpenSearch)

**月額: ~$350+**（OpenSearch Serverlessが高い）

```bash
# SAMでデプロイ
sam build
sam deploy --guided
```

## 🔧 MCP設定

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "miyabi-context7": {
      "type": "http",
      "url": "http://localhost:8080"
    }
  }
}
```

### AWS版

```json
{
  "mcpServers": {
    "miyabi-context7": {
      "type": "http",
      "url": "http://YOUR_EC2_IP:8080"
    }
  }
}
```

## 📚 API エンドポイント

### `POST /resolve-library-id`

ライブラリ名からIDを解決

```json
// Request
{"libraryName": "miyabi"}

// Response
{
  "query": "miyabi",
  "libraries": [
    {"id": "/miyabi/docs", "name": "Miyabi Documentation", "chunks": 42}
  ]
}
```

### `POST /get-library-docs`

ドキュメント取得（セマンティック検索）

```json
// Request
{
  "context7CompatibleLibraryID": "/miyabi/docs",
  "topic": "MCP servers",
  "tokens": 5000
}

// Response
{
  "library_id": "/miyabi/docs",
  "topic": "MCP servers",
  "content": "# MCP Servers\n\nMiyabi provides 15+ MCP servers...",
  "chunks_returned": 5,
  "approximate_tokens": 1200,
  "sources": ["/miyabi/docs"]
}
```

### `POST /index-docs`

ドキュメントをインデックス

```json
// Request
{
  "library_id": "/my-project/docs",
  "title": "My Project",
  "content": "# My Project\n\nDocumentation content..."
}

// Response
{
  "status": "success",
  "library_id": "/my-project/docs",
  "chunks_indexed": 15
}
```

### `POST /index-file`

ファイルをアップロードしてインデックス

```bash
curl -X POST http://localhost:8080/index-file \
  -F "library_id=/miyabi/docs" \
  -F "file=@docs/miyabi.txt"
```

## 🔄 Claude Tool Search統合

Claude API の `tool_search_tool` と統合可能：

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=2048,
    tools=[
        {
            "type": "tool_search_tool_bm25_20251119",
            "name": "tool_search"
        },
        {
            "name": "miyabi_get_docs",
            "description": "Get Miyabi documentation",
            "input_schema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string"}
                }
            },
            "defer_loading": True
        }
    ],
    messages=[{"role": "user", "content": "How do I use Miyabi MCP servers?"}]
)
```

## 📁 ファイル構成

```
miyabi-context7/
├── README.md              # このファイル
├── main.py                # FastAPI MCPサーバー
├── requirements.txt       # Python依存関係
├── Dockerfile             # Dockerイメージ
├── docker-compose.yml     # Docker Compose設定
├── template.yaml          # AWS SAMテンプレート
├── setup-ec2-lowcost.sh   # EC2セットアップスクリプト
└── lambda/
    ├── indexer.py         # Lambda版インデクサー
    └── query.py           # Lambda版クエリ
```

## 💰 コスト比較

| 構成 | 月額 | 特徴 |
|------|------|------|
| ローカル開発 | $0 | Mac/Linux上で動作 |
| EC2 t3.small | ~$17 | 24/7稼働、チーム共有可 |
| EC2 t3.micro | ~$8 | 軽量利用、Spot可 |
| Lambda + OpenSearch | ~$350+ | サーバーレス、スケーラブル |

## 🔒 セキュリティ

- ローカル/EC2版：完全にプライベート、データ外部送信なし
- Embeddingはローカルモデル（`all-MiniLM-L6-v2`）使用
- AWS版：IAM認証、VPC内配置推奨

## 🛠️ 今後の改善予定

- [ ] GitHub連携（自動インデックス更新）
- [ ] Obsidian Vault直接インデックス
- [ ] バージョン管理（previousVersions対応）
- [ ] Miyabi MCPサーバーへの統合

---

**作成者**: Miyabi Team
**ライセンス**: MIT
