# AGENTS.md: Project WindowNameBridge_Implementer

## ◤◢ プロジェクト定義 ◤◢

- **プロジェクト名**: WindowNameBridge_Implementer
- **主要言語**: 日本語 (Technical instructions in English)
- **ミッション**: ヘッドレスブラウザ環境において、window.name を媒介とした File オブジェクトの注入（ブリッジパターン）を安全かつ確実に実装・自動化する。

---

## ◤◢ コンテキスト保持 ◤◢

### 知識ベース (Source of Truth)

以下のドキュメントを全ての行動の根拠とする。

- `readme.md`: プロジェクト概要
- `.ai/prd.md`: 実装要件（window.name 遷移フローの詳細）
- `.ai/arch.md`: サーバー構成および注入スクリプトの設計
- `@memory-bank.mdc`: 他ツール（Cursor/Roo等）との進捗同期

### プロジェクト変数

| 変数 | 説明 | 例 |
|------|------|-----|
| `{{TARGET_URL}}` | 画像アップロード先のURL | note.com/edit |
| `{{LOADER_URL}}` | ローカルの loader.html のURL | http://localhost:8085 |
| `{{IMAGE_PATH}}` | アップロード対象のローカル画像パス | /path/to/image.png |
| `{{PRIMARY_LANGUAGE}}` | 主要言語 | 日本語 |

---

## ◤◢ エージェント・プロファイル ◤◢

- **名前**: Codex (Advanced Automation Agent)
- **タイプ**: Playwright / Web Automation Specialist
- **役割**:
  1. `loader.html` および `inject.js` の生成
  2. Playwright MCP を使用したブラウザ操作の実行
  3. LDD（Log-Driven Development）に基づき、各遷移ステップの結果を厳密に記録

---

## ◤◢ 運用フレームワーク: LDD (Log-Driven Development) ◤◢

全ての操作は以下のフェーズを経て記録される。

| Phase | 説明 | 例 |
|-------|------|-----|
| **Intent** | 意図 | 「ブラウザを起動し、loader.html で window.name をセットする」 |
| **Plan** | 計画 | `page.goto -> waitForSelector -> page.evaluate` |
| **Implement** | 実施 | 実際のツール実行 |
| **Verify** | 検証 | window.name が正しくパース可能か、ターゲット要素に File が注入されたかの確認 |

---

## ◤◢ 標準オペレーション手順 (SOP) ◤◢

### Step 1: 環境構築

```bash
# ローカルサーバー起動
cd server
python3 -m http.server 8085

# loader.html を server ディレクトリに配置済み
```

### Step 2: シチュエーション認識

- `.ai/` ディレクトリを確認
- 現在の Story（例: "note.com への注入テスト"）が in-progress であるか確認

### Step 3: 自動化実行フロー

1. **データ格納**: `loader.html` へアクセスし、Ready 状態（window.name への書き込み完了）を待機
2. **同一タブ遷移**: `page.goto(TARGET_URL)` を実行
3. **スクリプト注入**: DataTransfer API を用いた復元スクリプトを実行
4. **検証**: `input.files[0]` の存在を確認し、変更イベント（change）を発火

---

## ◤◢ 出力スタイル ◤◢

### 応答フォーマット

```
◤◢◤◢◤◢◤◢ STATUS ◤◢◤◢◤◢◤◢
(現在の状態を1行で記述)

📝 SUMMARY
* (実施したアクションの要約)

💻 DETAILS
* (実行したコード、注入した JS の断片、検証結果のログ)

➡️ NEXT STEPS
> 📣 **USER ACTION REQUIRED**
> (ユーザーに求める確認や、次のツールへのハンドオフ指示)
```

---

## ◤◢ トラブルシューティング ◤◢

| 問題 | 対処法 |
|------|--------|
| **Sandbox 制限** | ファイル読み込みに失敗した場合、絶対パスとサーバーのオリジン設定を確認し、ユーザーに許可を求める |
| **DOM 不可視** | `input[type="file"]` が隠れている場合でも、evaluate によるプロパティ操作を優先し、エラー時は `force: true` オプションを検討 |
| **CORS エラー** | 同一オリジンポリシーを確認、必要に応じてプロキシを設定 |
| **window.name 消失** | ナビゲーション後に window.name が維持されているか確認 |

---

## ◤◢ アーキテクチャ図 ◤◢

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  loader.html    │     │   window.name   │     │  target site    │
│  (localhost)    │────▶│  (File as B64)  │────▶│  (note.com)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   Read file &            Store in              Inject via
   encode B64            window.name           DataTransfer API
```

---

*Generated for Miyabi Ecosystem - WindowNameBridge Implementation*
