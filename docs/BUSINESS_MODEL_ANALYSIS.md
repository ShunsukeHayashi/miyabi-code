# ソースコード非公開モデルの妥当性分析

**調査日**: 2025-10-20
**結論**: ✅ **一般的で正当なビジネスモデル**

---

## 🔍 調査結果サマリー

### ✅ 結論: この戦略は「あり」

**ソースコード非公開 + バイナリ配布**は：
1. ✅ 極めて一般的な商用モデル
2. ✅ 多くの大手企業が採用
3. ✅ 法的に完全に正当
4. ⚠️ ただし「オープンソース」とは呼べない

---

## 📊 3つの主要ビジネスモデル（2024-2025）

### 1. **Open Core Model**（最も一般的）

**定義**: コア機能はOSS、追加機能は有料・プロプライエタリ

**採用企業**:
- **GitLab**: CE（無料・MIT）+ EE（有料・プロプライエタリ）
- **Docker**: Engine（無料・Apache 2.0）+ Desktop（有料・制限あり）
- **Redis**: BSD（コア）+ Enterprise（有料）
- **Elastic**: OSS（基本）+ X-Pack（有料）

**特徴**:
- ✅ コミュニティ版で普及
- ✅ エンタープライズ版で収益
- ✅ 透明性が高い
- ⚠️ コアと商用の境界が重要

### 2. **Source Available Model**（急増中）

**定義**: ソースコード公開だが使用に制限あり

**採用企業（2024年移行）**:
- **Redis**: SSPLv1 + RSALv2（2024年3月）
- **Elastic**: SSPL + Elastic License（2021年〜）
- **MongoDB**: SSPL（2018年〜）
- **Confluent**: Community License（Kafka）

**特徴**:
- ✅ ソースコード閲覧可能
- ✅ クラウドベンダー対策
- ⚠️ OSIの「オープンソース」定義に非適合
- ⚠️ "Source Available" ≠ "Open Source"

### 3. **Proprietary Binary Distribution**（完全非公開）

**定義**: バイナリのみ配布、ソースコード完全非公開

**採用企業**:
- **VS Code**: バイナリ配布（MIT License）※
- **Slack**: 完全プロプライエタリ
- **Discord**: 完全プロプライエタリ
- **Zoom**: 完全プロプライエタリ
- **Figma**: 完全プロプライエタリ
- **Notion**: 完全プロプライエタリ

※VS Codeのソースコード（vscode）はMITだが、Microsoft配布バイナリには独自ライセンス

**特徴**:
- ✅ 知財完全保護
- ✅ 最も単純なモデル
- ✅ 法的リスク最小
- ⚠️ コミュニティ信頼獲得が課題

---

## 🎯 Miyabiに最適なモデル

### 推奨: **Proprietary Binary Distribution + Optional Source Available**

**Phase 1（現在）**: 完全非公開
```
- バイナリ: 無料配布（Apache 2.0）
- ソースコード: 非公開
- ドキュメント: 完全公開
```

**Phase 2（将来）**: Partial Source Available
```
- コア: Source Available（制限付き）
- Agent実装: 非公開
- Business Agents: 非公開
```

**Phase 3（長期）**: Open Core
```
- Coding Agents: OSS（MIT/Apache 2.0）
- Business Agents: プロプライエタリ
- Enterprise機能: 有料ライセンス
```

---

## ⚖️ 法的妥当性

### Apache 2.0ライセンスの適用

**誤解**: "Apache 2.0 = ソースコード公開必須"
**正解**: Apache 2.0はバイナリにも適用可能

**実例**:
- Android OS: Apache 2.0だが多くのベンダーがソースコード非公開
- ChromeOS: 部分的にソースコード非公開

**Miyabiの場合**:
```
LICENSE file:
"This binary is licensed under Apache License 2.0.
Source code is proprietary and not included."
```

### 必要な法的ドキュメント

1. **LICENSE**: Apache 2.0全文
2. **NOTICE**: 著作権・商標表示
3. **EULA**（End User License Agreement）:
   - バイナリの使用条件
   - ソースコード非公開の明記
   - 逆コンパイル禁止
   - データ収集の同意（オプトイン）

---

## 📋 オプトイン・顧客管理の実装

### ユーザー要求: 必須事項

> "必ずこのプロダクトを使うときはオプトインを取り、必ず顧客管理できるようにしてほしいです。"

### 実装方針

#### 1. **初回起動時のオプトイン画面**

```bash
$ miyabi

┌─────────────────────────────────────────────────────────┐
│                  Welcome to Miyabi! 🌸                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Before you begin, please review and accept:             │
│                                                           │
│  ✓ End User License Agreement (EULA)                     │
│    - Terms of use for Miyabi CLI                         │
│    - Proprietary software notice                         │
│                                                           │
│  ✓ Privacy Policy                                        │
│    - Anonymous usage analytics (optional)                │
│    - Crash reports (optional)                            │
│                                                           │
│  ✓ Data Collection                                       │
│    - Email (optional, for product updates)               │
│    - Anonymous usage statistics                          │
│                                                           │
│  [View EULA] [View Privacy Policy]                       │
│                                                           │
│  Do you accept the terms? (y/n):                         │
│  > _                                                     │
│                                                           │
│  By typing 'y', you agree to the terms and conditions.   │
└─────────────────────────────────────────────────────────┘
```

#### 2. **ユーザー登録（オプション）**

```bash
$ miyabi register

┌─────────────────────────────────────────────────────────┐
│               Register Your Installation                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Get the most out of Miyabi by registering:              │
│                                                           │
│  Benefits:                                               │
│  ✓ Product update notifications                          │
│  ✓ Priority support on Discord                           │
│  ✓ Early access to new features                          │
│  ✓ Exclusive tutorials and content                       │
│                                                           │
│  Email: ___________________________________________      │
│                                                           │
│  [✓] I want to receive product updates                   │
│  [✓] I want to receive community newsletters             │
│  [ ] I want to participate in beta programs              │
│                                                           │
│  [Register] [Skip]                                       │
│                                                           │
│  Privacy: Your email will never be shared.               │
└─────────────────────────────────────────────────────────┘
```

#### 3. **アナリティクス同意**

```bash
$ miyabi status

First time? Help us improve Miyabi!

┌─────────────────────────────────────────────────────────┐
│            Anonymous Usage Analytics (Optional)          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  We'd like to collect anonymous usage data to improve    │
│  Miyabi. This helps us understand how the tool is used.  │
│                                                           │
│  What we collect:                                        │
│  ✓ Command usage frequency (e.g., "miyabi init")         │
│  ✓ Error types and frequencies                           │
│  ✓ OS version and architecture                           │
│  ✓ Miyabi version                                        │
│                                                           │
│  What we DON'T collect:                                  │
│  ✗ Your project names or code                            │
│  ✗ Personal information                                  │
│  ✗ File paths or directory structures                    │
│  ✗ Environment variables                                 │
│                                                           │
│  Enable anonymous analytics? (y/n):                      │
│  > _                                                     │
│                                                           │
│  You can change this later: miyabi config analytics      │
└─────────────────────────────────────────────────────────┘
```

#### 4. **バックエンド実装**

**顧客管理API**:

```rust
// crates/miyabi-telemetry/src/lib.rs

use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct UserConsent {
    pub user_id: Uuid,
    pub email: Option<String>,
    pub eula_accepted: bool,
    pub eula_version: String,
    pub eula_accepted_at: chrono::DateTime<chrono::Utc>,
    pub analytics_opt_in: bool,
    pub marketing_opt_in: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub struct TelemetryClient {
    api_url: String,
    user_id: Uuid,
}

impl TelemetryClient {
    pub async fn register_user(&self, consent: UserConsent) -> Result<(), Error> {
        // POST https://api.miyabi.dev/v1/users
        let client = reqwest::Client::new();
        client
            .post(format!("{}/v1/users", self.api_url))
            .json(&consent)
            .send()
            .await?;
        Ok(())
    }

    pub async fn track_event(&self, event: Event) -> Result<(), Error> {
        if !self.analytics_enabled()? {
            return Ok(()); // Opt-out済み
        }

        // POST https://api.miyabi.dev/v1/events
        let client = reqwest::Client::new();
        client
            .post(format!("{}/v1/events", self.api_url))
            .json(&event)
            .send()
            .await?;
        Ok(())
    }
}

#[derive(Serialize)]
pub struct Event {
    pub user_id: Uuid,
    pub event_type: String,        // "command_executed"
    pub event_data: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub miyabi_version: String,
    pub os: String,
    pub arch: String,
}
```

**データストレージ**:

```sql
-- PostgreSQL Schema

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    eula_accepted BOOLEAN NOT NULL,
    eula_version VARCHAR(50) NOT NULL,
    eula_accepted_at TIMESTAMP NOT NULL,
    analytics_opt_in BOOLEAN DEFAULT false,
    marketing_opt_in BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    miyabi_version VARCHAR(50),
    os VARCHAR(50),
    arch VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_type ON events(event_type);
```

#### 5. **プライバシーポリシー更新**

**PRIVACY.md**に追加:

```markdown
## データ収集について

### 必須データ
Miyabiは初回起動時に以下の情報を生成・保存します：
- 匿名ユーザーID（UUID v4）
- EULAバージョンと同意日時
- 初回インストール日時

これらのデータは**ローカルのみ**に保存され、外部送信されません。

### オプショナルデータ
以下のデータは**ユーザーの明示的同意がある場合のみ**収集されます：

1. **メールアドレス**（登録時）
   - 用途: 製品アップデート通知、重要なお知らせ
   - 第三者共有: なし
   - 削除リクエスト: privacy@miyabi.dev

2. **使用統計**（アナリティクス）
   - コマンド実行頻度
   - エラー発生率
   - OS/アーキテクチャ情報
   - 匿名化: 完全匿名（個人特定不可）

### データの削除
```bash
# すべてのローカルデータを削除
miyabi config reset

# アカウント削除リクエスト
miyabi account delete

# または: privacy@miyabi.dev にメール
```

### GDPR/CCPA準拠
Miyabiは以下の権利を尊重します：
- アクセス権: データの確認
- 訂正権: データの修正
- 削除権: データの完全削除
- 異議申立権: データ処理の停止
```

---

## 🚀 実装ロードマップ

### Phase 1: オプトイン実装（v0.2.0）

- [ ] EULAファイル作成
- [ ] 初回起動時のオプトイン画面
- [ ] ローカルコンセント管理（~/.miyabi/consent.json）
- [ ] `miyabi config` コマンド実装

### Phase 2: テレメトリ基盤（v0.3.0）

- [ ] バックエンドAPI構築（https://api.miyabi.dev）
- [ ] PostgreSQLデータベース設計
- [ ] ユーザー登録機能
- [ ] アナリティクス収集機能

### Phase 3: 顧客管理ダッシュボード（v0.4.0）

- [ ] 管理画面構築
- [ ] ユーザー統計表示
- [ ] メール配信システム
- [ ] GDPR対応機能（データエクスポート/削除）

---

## 📝 重要な注意点

### 1. オプトインの必須性

**ユーザー要求**: "必ずこのプロダクトを使うときはオプトインを取る"

**実装**:
```rust
// 初回起動時
if !consent_file_exists() {
    display_eula_and_consent_prompt();
    block_until_consent_given();
}

// EULAなしでは使用不可
if !eula_accepted() {
    eprintln!("EULA must be accepted to use Miyabi.");
    eprintln!("Run: miyabi accept-eula");
    std::process::exit(1);
}
```

### 2. 顧客管理の必須性

**ユーザー要求**: "必ず顧客管理できるようにする"

**実装**:
- UUIDベースの匿名追跡（デフォルト）
- メールベースの識別（オプション）
- イベントトラッキング
- データエクスポート機能

### 3. プライバシー最優先

**原則**:
- Opt-in デフォルト（Opt-outではない）
- 最小限のデータ収集
- 完全な透明性
- ユーザー制御可能

---

## ✅ チェックリスト: リリース前必須

### 法的ドキュメント
- [ ] EULA作成（弁護士レビュー推奨）
- [ ] PRIVACY.md更新（GDPR/CCPA準拠）
- [ ] TERMS_OF_SERVICE.md作成
- [ ] LICENSE説明追加（"Source code is proprietary"）

### 技術実装
- [ ] 初回起動オプトイン画面
- [ ] ローカルコンセント管理
- [ ] `miyabi config` コマンド
- [ ] テレメトリAPI（オプション）

### 透明性
- [ ] README.mdに明記（"ソースコード非公開"）
- [ ] FAQセクション追加
- [ ] データ収集の説明
- [ ] 連絡先明記（privacy@miyabi.dev）

---

## 🎯 結論

### Miyabiの最終戦略

**モデル**: Proprietary Binary Distribution + Opt-in Telemetry

**特徴**:
- ✅ ソースコード完全非公開
- ✅ バイナリ無料配布（Apache 2.0）
- ✅ オプトイン必須（EULA）
- ✅ 顧客管理可能（UUID + Email）
- ✅ 法的に完全準拠

**同類製品**:
- VS Code（バイナリ配布モデル）
- Docker Desktop（有料・制限付き）
- Slack、Discord、Zoom（完全プロプライエタリ）

**この戦略は「あり」**: ✅ 極めて一般的で正当なビジネスモデル

---

**次のステップ**: オプトイン実装ドキュメントの作成（別ファイル）

© 2025 Shunsuke Hayashi. All rights reserved.
