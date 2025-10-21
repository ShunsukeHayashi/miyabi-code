# Getting Started - Miyabi A2A Live UI

## 🎯 概要

Miyabi A2A Live UIは、Agent-to-Agent Protocol v0.3.0を実装したREST APIサーバーのための **リアルタイムテスト・監視インターフェース** です。

ブラウザから直感的にAgentとのやり取りをテストし、Taskの実行状況を監視できます。

---

## 🚀 5分でスタート

### ステップ1: サーバー起動

```bash
# プロジェクトルートから
cd crates/miyabi-a2a

# UIサーバーを起動
cargo run --example ui_server
```

### ステップ2: ブラウザを開く

```
http://localhost:8080/
```

### ステップ3: 試してみる

1. **Messages**タブでメッセージ送信
2. **Tasks**タブでタスク一覧確認
3. **Agent Cards**タブでAgent情報閲覧

---

## 📁 ファイル構成

```
crates/miyabi-a2a/
├── static/
│   ├── index.html                    # メインUIファイル (単一ファイル)
│   ├── README.md                     # UI機能詳細ガイド
│   ├── GETTING_STARTED.md            # このファイル
│   └── UI_UX_PROPOSAL.md             # UI/UX改善提案書
├── examples/
│   └── ui_server.rs                  # UIサーバー実行例
├── src/rest/
│   └── server.rs                     # REST APIサーバー実装
└── agent-cards/                      # Agent Card JSONファイル
    ├── coding/
    │   ├── agent-card-coordinator-agent.json
    │   ├── agent-card-codegen-agent.json
    │   └── ...
    └── business/
        └── agent-card-ai-entrepreneur-agent.json
```

---

## 🎮 基本操作

### 1️⃣ Message送信 (Task作成)

**Messages**タブから:
1. **Role**を選択 (`user`, `agent`, `system`)
2. **Content**にメッセージ入力
3. (オプション) **Context ID**を入力
4. **Send Message**ボタンをクリック

→ Task IDが返却され、Tasksタブに自動遷移

**例**:
```
Role: user
Content: "Implement user authentication feature"
Context ID: "project-123"
```

---

### 2️⃣ Task管理

**Tasks**タブから:
- **リスト表示**: すべてのTaskを一覧表示
- **フィルター**: Statusでフィルタリング
  - `submitted` - 新規作成
  - `working` - 実行中
  - `completed` - 完了
  - `failed` - 失敗
  - `cancelled` - キャンセル済み
- **詳細表示**: Taskカードをクリックで詳細
- **キャンセル**: 実行中Taskをキャンセル

**リフレッシュ**: 🔄ボタンで最新状態に更新

---

### 3️⃣ Agent Card閲覧

**Agent Cards**タブから:
- 利用可能なAgentの一覧表示
- Agent名、説明、バージョン表示
- Skillsの詳細確認
- **View JSON**でAgent Card全文表示

**利用可能なAgent**:
- 🔴 **しきるん** (CoordinatorAgent) - タスク統括
- 🟢 **つくるん** (CodeGenAgent) - コード生成
- 🟢 **めだまん** (ReviewAgent) - コードレビュー
- 🔵 **みつけるん** (IssueAgent) - Issue分析
- 🟡 **まとめるん** (PRAgent) - PR作成
- 🟡 **はこぶん** (DeploymentAgent) - デプロイ

---

## ⚙️ 設定

### API Base URL

デフォルト: `http://localhost:8080`

**変更方法**:
1. 画面上部の**API Base URL**フィールドを編集
2. 自動的にlocalStorageに保存

**用途**:
- ローカル開発: `http://localhost:8080`
- リモートサーバー: `https://api.example.com`

---

### API Key (オプション)

認証が必要な環境で使用。

**設定方法**:
1. 画面上部の**API Key**フィールドに入力
2. 自動的にlocalStorageに保存

**注意**: API KeyはブラウザのlocalStorageに保存されます（暗号化なし）

---

## 🔧 開発者向け情報

### サーバー設定 (Rust)

```rust
use miyabi_a2a::rest::{RestServer, RestServerConfig};
use std::path::PathBuf;

let mut config = RestServerConfig::default();
config.bind_addr = "127.0.0.1:8080".parse().unwrap();
config.static_dir = Some(PathBuf::from("static"));     // UI配信
config.agent_cards_dir = Some(PathBuf::from("agent-cards"));

let server = RestServer::new(config, handler);
server.serve().await;
```

---

### REST API エンドポイント

| Method | Endpoint | 説明 |
|--------|----------|------|
| `POST` | `/v1/message:send` | Message送信 → Task作成 |
| `GET` | `/v1/tasks` | Task一覧取得 (フィルタ・ページング対応) |
| `GET` | `/v1/tasks/{taskId}` | Task詳細取得 |
| `POST` | `/v1/tasks/{taskId}/cancel` | Taskキャンセル |
| `GET` | `/.well-known/agent-card-*.json` | Agent Card取得 |

---

### カスタマイズ

#### 新しいAgentを追加

1. **Agent Cardを生成**:
```bash
cargo run --bin agent_card_gen -- \
  --spec .claude/agents/specs/coding/my-agent.md \
  --output agent-cards/coding/agent-card-my-agent.json
```

2. **UIのAgent一覧に追加** (`index.html` 行900付近):
```javascript
const knownAgents = [
    'coordinator-agent',
    'codegen-agent',
    'my-agent',  // 追加
];
```

---

#### UI見た目のカスタマイズ

`index.html`の`<style>`セクションを編集:

```css
/* カラースキーム変更 */
:root {
    --primary: #6366f1;      /* メインカラー */
    --success: #10b981;      /* 成功 */
    --error: #ef4444;        /* エラー */
}

/* ダークモード無効化 */
body {
    background: #ffffff;
    color: #1f2937;
}
```

---

## 🐛 トラブルシューティング

### Q1. "No agent cards found" と表示される

**原因**: Agent Cardsが生成されていない

**解決策**:
```bash
# Agent Cards生成
cargo run --bin agent_card_gen

# agent-cards/ディレクトリを確認
ls -la agent-cards/coding/
ls -la agent-cards/business/
```

---

### Q2. "Failed to connect to API" エラー

**原因**: サーバーが起動していない、またはURL誤り

**解決策**:
1. サーバー起動確認:
```bash
cargo run --example ui_server
# → 🚀 Miyabi A2A REST Server starting on http://127.0.0.1:8080
```

2. API Base URLを確認 (画面上部)
3. ブラウザのコンソールでエラー確認 (F12 → Console)

---

### Q3. Taskが更新されない

**原因**: 手動リフレッシュが必要

**解決策**:
- **Tasksタブ**の🔄 Refreshボタンをクリック

**将来の改善**: WebSocketによるリアルタイム更新
→ 詳細は`UI_UX_PROPOSAL.md` Phase 1参照

---

### Q4. CORSエラーが出る

**原因**: 別ドメインからのアクセス

**解決策**:
- `RestServerConfig::enable_cors = true` を設定 (デフォルトで有効)
- ブラウザ拡張機能でCORS制限を無効化（開発時のみ）

---

## 📚 さらに詳しく

### 詳細ドキュメント

- **[README.md](README.md)** - UI機能の詳細説明
- **[UI_UX_PROPOSAL.md](UI_UX_PROPOSAL.md)** - 将来の改善提案
- **[OpenAPI Spec](../openapi.yaml)** - REST API仕様書

---

### 次のステップ

1. **基本操作をマスター** (この文書)
2. **UI機能を深く理解** (`README.md`)
3. **将来の改善に貢献** (`UI_UX_PROPOSAL.md`)

---

### 実装ロードマップ

**現在**: v1.0 - 基本的なAPI Testing UI

**次期バージョン**:
- **v2.0** (Phase 1-3) - リアルタイム監視・Workflow可視化
- **v3.0** (Phase 4) - 高度な制御機能
- **v4.0** (Phase 5) - Workflow Builder

詳細: `UI_UX_PROPOSAL.md`

---

## 🤝 貢献

### フィードバック

- **Issue**: https://github.com/ShunsukeHayashi/Miyabi/issues
- **Discussions**: プロジェクトのDiscussionsタブ

### Pull Request

UI改善のPRを歓迎します:
1. `static/index.html` を編集
2. ローカルでテスト: `cargo run --example ui_server`
3. PRを作成: `feat(ui): add XYZ feature`

---

## 📝 ライセンス

MIT License - プロジェクトルートの`LICENSE`参照

---

**Happy Agent Testing! 🚀**
