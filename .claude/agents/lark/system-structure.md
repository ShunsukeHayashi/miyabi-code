---
name: doc_system_structure
description: Documentation file: system-structure.md
---

# Lark システム構造 - 実環境マッピング

## 📖 概要

このドキュメントは、実際のLark/Feishu環境の構造を文書化します。
Wiki空間の階層構造、Bitableアプリケーション、テーブル・フィールド定義を記録し、
MCP操作時の参照として使用します。

## 🏗️ プラットフォームアーキテクチャ

### Lark Suite - コアコンポーネント

```
Tenant (テナント)
  └─ Workspace (ワークスペース)
       ├─ Wiki (知識ベース)
       │    └─ Space (空間)
       │         ├─ Node (ノード)
       │         │    ├─ Document (ドキュメント)
       │         │    ├─ Bitable (多維表格)
       │         │    ├─ Sheet (スプレッドシート)
       │         │    └─ Other Objects
       │         └─ Permissions (権限)
       │
       ├─ Communication (コミュニケーション)
       │    ├─ Chat (チャット)
       │    ├─ Video (ビデオ)
       │    ├─ Calendar (カレンダー)
       │    └─ Mail (メール)
       │
       ├─ Collaboration (コラボレーション)
       │    ├─ Docs (ドキュメント)
       │    ├─ Sheets (スプレッドシート)
       │    ├─ Base (ベース)
       │    ├─ Wiki (Wiki)
       │    └─ Mindnote (マインドマップ)
       │
       └─ Automation (自動化)
            ├─ Approval (承認)
            ├─ Forms (フォーム)
            ├─ Automation (自動化)
            └─ Bot (ボット)
```

## 📁 Wiki構造

### Wiki Space情報

```yaml
space_id: "7324483648537755682"
root_node_token: "K7xUwSKH0i3fPekyD9ojSsCLpna"
tenant: "Feishu/Lark"
```

### 階層構造

#### ルート階層

```
Root (K7xUwSKH0i3fPekyD9ojSsCLpna)
  ├─ 業務マニュアル・指示書
  └─ プロジェクトナレッジ
```

#### 1. 業務マニュアル・指示書

```yaml
node_token: "NdVNwfA8di1S1xk2QD9j90nJp2e"
type: "docx"
children:
  - title: "2025"
    node_token: "IZoWwN1Esi7LaWkkbZXj9Kp1pid"
    children:
      - title: "202508"
        node_token: "XXX"
        children:
          - title: "v.2 キーワード記事作成業務マニュアル"
          - title: "Firefox Multi-Account Containers"
          - title: "記事のストック"
  
  - title: "Udemyコース作成マニュアル"
    node_token: "YYY"
    type: "docx"
```

#### 2. プロジェクトナレッジ

```yaml
node_token: "HQtHw5lWGiIZ9MkFrpBj4Y5upEc"
type: "docx"
children:
  - title: "2025"
    node_token: "ZZZ"
    children:
      - title: "AI駆動型BPO業務運用マニュアル"
        node_token: "TNRywTB0kiDgyekrnlhjymqmpah"
        children:
          - title: "v3.1 AI駆動型BPO業務運用マニュアル"
      
      - title: "[MCP Demo] AI-BPO事業管理システム"
        node_token: "JkKnwgeSViU4QWkj7FPj3dUGpVh"
        obj_token: "N4p3bChGhajodqs96chj5UDXpRb" # ⭐ Bitable app_token
        type: "bitable"
        status: "アクティブシステム"
  
  - title: "ストック"
    node_token: "HQtHw5lWGiIZ9MkFrpBj4Y5upEc"
    children:
      - title: "工数集計 コピー"
        obj_token: "GiQRbYNtNay96is1v2ojcg4ZpNb"
        type: "bitable"
      
      - title: "旧) タスク管理"
        obj_token: "NjzyblnJlaqrvnsQ4Scj2EHkprh"
        type: "bitable"
        status: "deprecated"
```

## 📊 Bitableアプリケーション詳細

### 1. [MCP Demo] AI-BPO事業管理システム

#### 基本情報

```yaml
app_token: "N4p3bChGhajodqs96chj5UDXpRb"
app_name: "[MCP Demo] AI-BPO事業管理システム カスタマークラウド 事業計画 202508版 XAI"
location: "/プロジェクトナレッジ/2025/"
wiki_node_token: "JkKnwgeSViU4QWkj7FPj3dUGpVh"
status: "production"
```

#### テーブル一覧

##### 1.1. 顧客管理

```yaml
table_id: "tblwRRR6Bi2P5XxE"
table_name: "顧客管理"
description: "取引先企業の基本情報と契約状況を管理"

fields:
  - field_id: "fldG7zxBGj"
    field_name: "👥会社名"
    type: "text"
    is_primary: true
    description: "主キーフィールド（最左端配置）"
  
  - field_id: "fldsBDgxEb"
    field_name: "🎯顧客タイプ"
    type: "single_select"
    options:
      - "大企業"
      - "中堅企業"
      - "中小企業"
      - "個人事業主"
  
  - field_id: "fldb7rEsgG"
    field_name: "📊ステータス"
    type: "single_select"
    options:
      - "00.見込み"
      - "01.商談中"
      - "02.契約中"
      - "03.休眠"
      - "99.失注"
  
  - field_id: "fldTMNGcDV"
    field_name: "💰契約金額"
    type: "currency"
    currency_code: "JPY"
  
  - field_id: "fldMRRxxx"
    field_name: "💳MRR"
    type: "currency"
    description: "月次経常収益"
  
  - field_id: "fldDatexxx"
    field_name: "📅契約開始日"
    type: "date"
  
  - field_id: "fldGrmUVCL"
    field_name: "👤担当営業"
    type: "user"
  
  - field_id: "fldIndxxx"
    field_name: "🏢業界"
    type: "single_select"
  
  - field_id: "fldNotexxx"
    field_name: "📝備考"
    type: "text"
```

##### 1.2. パートナー管理

```yaml
table_id: "tbloO6l2UWv3Fco9"
table_name: "パートナー管理"
description: "協力パートナー企業の管理"

fields:
  - field_id: "fldKm6C45z"
    field_name: "🤝パートナー企業名"
    type: "text"
    is_primary: true
  
  - field_id: "fldjxZZI1p"
    field_name: "🎯パートナー種別"
    type: "single_select"
    options:
      - "技術パートナー"
      - "販売パートナー"
      - "マーケティングパートナー"
  
  - field_name: "📊ステータス"
    type: "single_select"
  
  - field_name: "💹収益配分率"
    type: "percentage"
  
  - field_name: "📅契約開始日"
    type: "date"
  
  - field_name: "👤担当マネージャー"
    type: "user"
  
  - field_name: "🗺️対象地域"
    type: "multi_select"
  
  - field_name: "💰累計売上貢献"
    type: "currency"
  
  - field_name: "📝備考"
    type: "text"
```

##### 1.3. プロジェクト管理

```yaml
table_id: "tbli8gxgwMhhynC1"
table_name: "プロジェクト管理"
description: "案件・プロジェクトの進捗管理"

fields:
  - field_id: "fldIGjpBLU"
    field_name: "📋プロジェクト名"
    type: "text"
    is_primary: true
  
  - field_name: "🎯プロジェクトタイプ"
    type: "single_select"
  
  - field_id: "fldg5pJpUY"
    field_name: "👥顧客"
    type: "link"
    link_to:
      table_id: "tblwRRR6Bi2P5XxE"
      table_name: "顧客管理"
    description: "双方向リンク"
  
  - field_name: "📊ステータス"
    type: "single_select"
    options:
      - "00.準備中"
      - "01.実行中"
      - "02.完了"
      - "99.中断"
  
  - field_name: "📅開始日"
    type: "date"
  
  - field_name: "📅終了日"
    type: "date"
  
  - field_name: "💰プロジェクト金額"
    type: "currency"
  
  - field_id: "fldUE8Ve9f"
    field_name: "👤担当PM"
    type: "user"
  
  - field_name: "📈進捗率"
    type: "percentage"
  
  - field_name: "📝備考"
    type: "text"
```

##### 1.4. タスク管理

```yaml
table_id: "tblEshOhj7lctWxJ"
table_name: "タスク管理"
description: "プロジェクト内のタスク管理"

fields:
  - field_id: "fldDegxzYZ"
    field_name: "✅タスク名"
    type: "text"
    is_primary: true
  
  - field_name: "📂カテゴリ"
    type: "single_select"
  
  - field_id: "fldul6Id2m"
    field_name: "🔗関連プロジェクト"
    type: "link"
    link_to:
      table_id: "tbli8gxgwMhhynC1"
      table_name: "プロジェクト管理"
  
  - field_name: "📊ステータス"
    type: "single_select"
    options:
      - "00.未着手"
      - "01.準備完了"
      - "02.作業開始"
      - "03.作業完了"
      - "04.確認完了"
      - "05.承認完了"
      - "99.作業中断"
  
  - field_name: "🔥優先度"
    type: "single_select"
    options:
      - "緊急"
      - "高"
      - "中"
      - "低"
  
  - field_id: "fldZpeZMAN"
    field_name: "👤担当者"
    type: "user"
  
  - field_id: "fldtvem5e1"
    field_name: "📅期限"
    type: "datetime"
  
  - field_name: "📅完了日"
    type: "datetime"
  
  - field_name: "📝詳細説明"
    type: "text"
```

##### 1.5. 売上管理

```yaml
table_id: "tbldXU4HdONNgEBm"
table_name: "売上管理"
description: "月次・年次売上の管理"

fields:
  - field_name: "📅年月"
    type: "text"
    is_primary: true
    example: "2025年8月"
  
  - field_name: "💰売上実績"
    type: "currency"
  
  - field_name: "🎯目標売上"
    type: "currency"
  
  - field_name: "📊達成率"
    type: "percentage"
    formula: "売上実績 / 目標売上 × 100"
  
  - field_name: "📈前年同期比"
    type: "percentage"
  
  - field_name: "💹成長率"
    type: "percentage"
```

##### 1.6. KPI管理

```yaml
table_id: "tblKkXRLxA2VyDB2"
table_name: "KPI管理"
description: "各種KPIの追跡・管理"

fields:
  - field_name: "📊KPI名"
    type: "text"
    is_primary: true
  
  - field_name: "🎯目標値"
    type: "number"
  
  - field_name: "📈実績値"
    type: "number"
  
  - field_name: "📊達成率"
    type: "percentage"
  
  - field_name: "📅測定日"
    type: "date"
  
  - field_name: "👤責任者"
    type: "user"
```

### 2. 工数集計 コピー

```yaml
app_token: "GiQRbYNtNay96is1v2ojcg4ZpNb"
app_name: "工数集計 コピー"
status: "active"

tables:
  - table_name: "シフト・工数報告"
  - table_name: "集計テーブル"
  - table_name: "シフト提出"
  - table_name: "シフト提出ボタン"
```

### 3. 旧) タスク管理

```yaml
app_token: "NjzyblnJlaqrvnsQ4Scj2EHkprh"
app_name: "旧) タスク管理"
status: "deprecated"
note: "非推奨 - AI-BPO事業管理システムに移行済み"

tables:
  - table_name: "担当業務・タスク"
  - table_name: "作業リスト"
```

## 🔗 リレーションシップマッピング

### テーブル間の関係

```
顧客管理 (1) ←→ (N) プロジェクト管理
  └─ 双方向リンク
  └─ 顧客管理で Rollup: プロジェクト件数、総売上
  └─ プロジェクト管理で Lookup: 顧客名、業界、担当営業

プロジェクト管理 (1) ←→ (N) タスク管理
  └─ 双方向リンク
  └─ プロジェクト管理で Rollup: タスク数、完了タスク数、進捗率
  └─ タスク管理で Lookup: プロジェクト名、プロジェクト金額、担当PM

顧客管理 (N) ←→ (N) パートナー管理
  └─ 中間テーブル: パートナーアサイン（将来実装）
```

## 🎯 MCP操作時の参照方法

### Step 1: Wiki Node → Bitable App Token

```typescript
const nodeInfo = await callMCPTool('wiki.v2.space.getNode', {
  token: 'JkKnwgeSViU4QWkj7FPj3dUGpVh' // Wiki node token
});

const app_token = nodeInfo.obj_token; // 'N4p3bChGhajodqs96chj5UDXpRb'
```

### Step 2: Table ID参照

```typescript
// このドキュメントから table_id をコピー
const table_id = 'tblwRRR6Bi2P5XxE'; // 顧客管理テーブル
```

### Step 3: Field Name参照

```typescript
// このドキュメントから field_name をコピー（絵文字含む）
const fields = {
  '👥会社名': '株式会社サンプル',
  '🎯顧客タイプ': '大企業',
  '💰契約金額': 1000000
};
```

## 📋 更新履歴

| 日付 | バージョン | 変更内容 |
|-----|----------|---------|
| 2025-10-18 | 1.0.0 | 初版作成 |

---

**最終更新**: 2025-10-18
**バージョン**: 1.0.0
**参照**: [MCP操作マニュアル](mcp-operations.md)
