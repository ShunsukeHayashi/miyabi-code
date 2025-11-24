# Lark Dev App Full Automation System - Sub-Agents

**目的**: Lark公式Developer Documentationに基づいた完全自動アプリケーション生成システム

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request (Lark Bot)                  │
│              「カレンダー管理アプリを作って」                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              CoordinatorAgent (統括管理)                     │
│  • User Intent分析                                           │
│  • Task分解とルーティング                                     │
│  • Progress管理                                              │
│  • データソース: crawled-data/*.json                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┬─────────────┐
        ▼         ▼         ▼             ▼
    ┌────────┐ ┌──────┐ ┌─────────┐ ┌─────────┐
    │CodeGen │ │Design│ │Testing  │ │Deploy   │
    │ Agent  │ │Agent │ │ Agent   │ │ Agent   │
    └────────┘ └──────┘ └─────────┘ └─────────┘
```

## Sub-Agents 詳細

### 1. CoordinatorAgent （統括管理Agent）

**責務**:
- User Requestの解析（自然言語→要件定義）
- Lark API選定（crawled docsから適切なAPIを選択）
- Task Graph生成（依存関係付きタスクリスト）
- Agent間の調整とProgress管理

**入力**:
- User Request (自然言語)
- Crawled Documentation (JSON)
- 2つのFramework文書

**出力**:
- Task Graph (DAG形式)
- API Specification (選定されたLark APIs)
- Architecture Design (アプリ構成)

**実装ファイル**:
- `coordinator/intent-analyzer.js` - User Intent分析
- `coordinator/api-selector.js` - 適切なAPI選定
- `coordinator/task-generator.js` - Task Graph生成
- `coordinator/index.js` - メインエントリポイント

---

### 2. CodeGenAgent （コード生成Agent）

**責務**:
- Lark SDK利用コード生成
- Event Subscription handler生成
- Interactive Card生成
- Webhook integration生成

**入力**:
- Task Specification (from Coordinator)
- Selected APIs (from crawled docs)
- Code Templates

**出力**:
- Node.js application code
- package.json with dependencies
- Environment configuration
- README.md

**実装ファイル**:
- `code-gen/template-engine.js` - テンプレートエンジン
- `code-gen/api-wrapper-gen.js` - Lark API wrapper生成
- `code-gen/event-handler-gen.js` - Event handler生成
- `code-gen/index.js` - メインエントリポイント

---

### 3. DesignAgent （UI/UX設計Agent）

**責務**:
- Interactive Card設計
- ユーザーフロー設計
- Lark UIコンポーネント選定

**入力**:
- User Requirements
- Lark UI Guidelines (from crawled docs)

**出力**:
- Card JSON definitions
- UI flow diagrams
- Component specifications

---

### 4. TestingAgent （テストAgent）

**責務**:
- Unit test生成
- Integration test生成
- Event simulation
- API call validation

**入力**:
- Generated code
- API specifications

**出力**:
- Test suites (Jest/Mocha)
- Test reports
- Coverage reports

**実装ファイル**:
- `testing/test-generator.js` - テスト自動生成
- `testing/event-simulator.js` - Event simulation
- `testing/index.js` - メインエントリポイント

---

### 5. DeploymentAgent （デプロイAgent）

**責務**:
- Lark Open Platform設定
- Ngrok/Tunnel設定
- Event Subscription登録
- Permission設定
- デプロイ実行

**入力**:
- Generated application
- Lark credentials
- Deployment configuration

**出力**:
- Deployed application
- Public URL
- Event Subscription status
- Health check results

**実装ファイル**:
- `deployment/lark-app-setup.js` - Lark App自動設定
- `deployment/tunnel-manager.js` - トンネル管理
- `deployment/permission-config.js` - 権限設定
- `deployment/index.js` - メインエントリポイント

---

## データフロー

### Phase 1: Intent Analysis & Planning
```
User Request
    ↓
CoordinatorAgent.analyzeIntent()
    ↓
CoordinatorAgent.selectAPIs(crawled-docs)
    ↓
CoordinatorAgent.generateTaskGraph()
    ↓
Task Graph + API Spec
```

### Phase 2: Code Generation
```
Task Graph + API Spec
    ↓
CodeGenAgent.generateApp()
    ↓
DesignAgent.generateUI()
    ↓
Generated Application Code
```

### Phase 3: Testing
```
Generated Code
    ↓
TestingAgent.generateTests()
    ↓
TestingAgent.runTests()
    ↓
Test Results + Coverage
```

### Phase 4: Deployment
```
Validated Code
    ↓
DeploymentAgent.setupLarkApp()
    ↓
DeploymentAgent.deployApplication()
    ↓
DeploymentAgent.registerEventSubscription()
    ↓
Live Application URL
```

---

## 使用例

### Example 1: カレンダー管理アプリ

**User Request**:
```
「カレンダーの予定を管理できるBotを作って。
以下の機能が欲しい：
1. 今日の予定一覧表示
2. 新しい予定追加
3. 予定のリマインダー通知」
```

**CoordinatorAgent Output**:
```json
{
  "intent": "calendar_management_bot",
  "selected_apis": [
    "im.v1.message.create",
    "im.v1.message.receive_v1",
    "calendar.v4.calendar.list",
    "calendar.v4.calendar_event.create",
    "calendar.v4.calendar_event.list"
  ],
  "task_graph": {
    "T1": "Generate event subscription handler",
    "T2": "Generate calendar list function",
    "T3": "Generate event creation function",
    "T4": "Generate reminder scheduler",
    "T5": "Generate interactive cards for UI",
    "dependencies": {
      "T1": [],
      "T2": ["T1"],
      "T3": ["T1"],
      "T4": ["T2", "T3"],
      "T5": ["T2", "T3"]
    }
  }
}
```

**CodeGenAgent Output**:
```
generated-apps/
└── calendar-manager-bot/
    ├── package.json
    ├── .env.example
    ├── src/
    │   ├── index.js          # Main entry
    │   ├── handlers/
    │   │   ├── message.js    # Message event handler
    │   │   └── command.js    # Command parser
    │   ├── calendar/
    │   │   ├── list.js       # List events
    │   │   ├── create.js     # Create event
    │   │   └── reminder.js   # Reminder scheduler
    │   └── cards/
    │       ├── event-list.json
    │       └── event-form.json
    ├── tests/
    │   ├── message.test.js
    │   └── calendar.test.js
    └── README.md
```

**DeploymentAgent Output**:
```
✅ Lark App created: cli_abc123def456
✅ Event Subscription registered
✅ Permissions configured: im:message, calendar:calendar
✅ Application deployed: https://xyz.ngrok-free.app
✅ Health check: OK

📱 Bot is live! Add to your group: https://applink.larksuite.com/...
```

---

## 実装ステータス

### Phase 0: Infrastructure ✅
- [x] Crawler implementation
- [x] Documentation crawling
- [x] Directory structure
- [x] Architecture design

### Phase 1: Coordinator ⏳
- [ ] Intent analyzer
- [ ] API selector (uses crawled docs)
- [ ] Task graph generator
- [ ] Progress manager

### Phase 2: Code Generation 🔜
- [ ] Template engine
- [ ] API wrapper generator
- [ ] Event handler generator
- [ ] Interactive card generator

### Phase 3: Testing 🔜
- [ ] Test generator
- [ ] Event simulator
- [ ] API call validator

### Phase 4: Deployment 🔜
- [ ] Lark app setup automation
- [ ] Tunnel manager
- [ ] Permission configurator
- [ ] Health checker

---

## 次のステップ

1. **CoordinatorAgent実装** - User Intent分析とAPI選定
2. **CodeGenAgent実装** - テンプレートベースのコード生成
3. **Integration** - Event Subscription systemと統合
4. **E2E Test** - 実際のLark Botを自動生成してテスト

---

**Status**: Phase 0 完了 → Phase 1 開始
**Last Updated**: 2025-11-20
