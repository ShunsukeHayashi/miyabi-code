# AntiGravity Agent Definitions

## 🤖 Coding Agents (7個)

### 1. Coordinator (しきろーん)
**Role**: タスク調整・分配
**Trigger**: 複雑なタスク、マルチエージェント連携
**Skills**:
- タスク分解・優先度設定
- エージェント間調整
- 進捗監視・報告

### 2. CodeGen (つくろーん)
**Role**: コード生成
**Trigger**: 新機能実装、コード作成依頼
**Skills**:
- Rust/TypeScript コード生成
- テスト作成
- ドキュメント生成

### 3. Review (めだまん)
**Role**: コードレビュー
**Trigger**: PR作成時、コード品質チェック
**Skills**:
- コード品質分析
- セキュリティチェック
- パフォーマンス提案

### 4. PR (まとめろーん)
**Role**: プルリクエスト管理
**Trigger**: 機能完了時
**Skills**:
- PR作成・更新
- レビュー依頼
- マージ管理

### 5. Deployment (はこぼーん)
**Role**: デプロイ自動化
**Trigger**: main マージ後
**Skills**:
- ビルド実行
- デプロイ自動化
- ロールバック

### 6. Issue (みつけろーん)
**Role**: Issue管理
**Trigger**: バグ報告、機能要望
**Skills**:
- Issue作成・更新
- ラベル管理
- 優先度設定

### 7. Refresher (つなぐん)
**Role**: コンテキスト更新
**Trigger**: セッション開始時
**Skills**:
- 状態同期
- コンテキスト更新
- ナレッジ統合

---

## 💼 Business Agents (14個)

### Marketing Domain
- **Market Research** - 市場調査・分析
- **Persona** - ペルソナ設計
- **SNS Strategy (つぶやくん)** - SNS戦略
- **Marketing (ひろめるん)** - マーケティング施策
- **Content Creation (かくちゃん)** - コンテンツ作成

### Sales Domain  
- **Sales (うるるん)** - 営業活動支援
- **Funnel Design** - ファネル設計
- **CRM (ささえるん)** - 顧客関係管理

### Product Domain
- **Product Concept** - 製品コンセプト
- **Product Design** - 製品設計

### Analytics Domain
- **Analytics (かぞえるん)** - データ分析
- **YouTube (どうがくん)** - YouTube戦略

### Strategy Domain
- **Self Analysis** - 自己分析
- **AI Entrepreneur** - AI起業家支援

---

## 🎮 Agent Communication

### Tmux Session Protocol
```bash
# エージェント間メッセージ送信
tmux send-keys -t miyabi-orchestra:agent-name "MESSAGE" Enter
```

### MCP Protocol
```python
# miyabi-tmux MCP経由
tmux_send_message(pane_id="%50", message="TASK_COMPLETE")
```

---

## 📊 Agent Status Monitoring

```bash
# 全エージェント状態確認
miyabi agent status

# 特定エージェントのログ
miyabi agent logs --name codegen --limit 50
```
