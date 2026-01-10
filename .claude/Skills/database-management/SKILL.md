---
name: Database Management Workflow
description: Comprehensive Prisma and PostgreSQL database management for Miyabi projects. Use when setting up schemas, running migrations, seeding data, or debugging database issues.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# 🗄️ Database Management Workflow

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐⭐ (P0 Level)
**Purpose**: データベースとPrisma統合の完全管理

---

## 📋 概要

Miyabiプロジェクトにおける包括的なデータベース管理ワークフロー。
Prisma ORM、PostgreSQL、マイグレーション、シーディングを統合管理します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| スキーマ変更 | "update schema", "modify database" |
| マイグレーション | "run migration", "migrate database" |
| データベース設定 | "setup database", "database config" |
| デバッグ | "database error", "connection issue" |
| シーディング | "seed data", "populate database" |
| Prisma関連 | "prisma studio", "generate client" |

---

## 🔧 P1: コマンド別最適化

### 基本コマンド優先順位

| コマンド | 用途 | 平均時間 | 頻度 |
|---------|------|---------|------|
| `prisma generate` | クライアント生成 | 5-15s | 高 |
| `prisma db push` | スキーマ同期 | 10-30s | 高 |
| `prisma migrate dev` | 開発マイグレーション | 15-45s | 中 |
| `prisma migrate deploy` | 本番マイグレーション | 30-120s | 低 |
| `prisma db seed` | データシーディング | 30-60s | 中 |
| `prisma studio` | データベースGUI | 3-5s | 中 |
| `prisma db pull` | スキーマ逆生成 | 10-20s | 低 |

### 最適パターン

```bash
✅ GOOD: 開発フロー（依存関係あり）
prisma generate && prisma db push && npm run dev

❌ BAD: 個別実行（同期エラーリスク）
prisma generate → 確認 → prisma db push → 確認 → ...
```

---

## 🚀 P2: ワークフロー別パターン

### Pattern 1: 開発環境セットアップ

```bash
# 初回セットアップ（2-5分）
cp .env.example .env.local && \
prisma generate && \
prisma db push && \
prisma db seed
```

**用途**: 新規開発環境の構築

### Pattern 2: スキーマ変更フロー

```bash
# スキーマ変更適用（1-3分）
prisma format && \
prisma generate && \
prisma db push && \
npm run type-check
```

**用途**: schema.prisma変更後の同期

### Pattern 3: 本番マイグレーション

```bash
# 本番マイグレーション（5-15分）
prisma migrate dev --name migration_name && \
prisma generate && \
npm run build && \
npm run test:db
```

**用途**: 本番環境へのマイグレーション適用

### Pattern 4: データベースリセット

```bash
# 開発データベースリセット（2-5分）
prisma migrate reset --force && \
prisma db seed
```

**用途**: 開発環境のクリーンリセット

### Pattern 5: データベース診断

```bash
# 診断・デバッグ（1-2分）
prisma validate && \
prisma db pull && \
prisma format
```

**用途**: スキーマ不整合の診断

---

## ⚡ P3: 環境別設定

### 環境変数管理

```bash
# 開発環境
DATABASE_URL="postgresql://user:pass@localhost:5432/miyabi_dev"

# テスト環境
DATABASE_URL="postgresql://user:pass@localhost:5432/miyabi_test"

# 本番環境
DATABASE_URL="postgresql://user:pass@prod.example.com:5432/miyabi_prod"
```

### 接続プール設定

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### パフォーマンス最適化

| 設定項目 | 開発 | 本番 |
|---------|------|------|
| connection_limit | 5 | 20 |
| pool_timeout | 10s | 30s |
| connect_timeout | 5s | 10s |

---

## 📊 プロジェクト固有設定

### Miyabi Database Schema

```
miyabi-private/
├── prisma/
│   ├── schema.prisma      # メインスキーマ
│   ├── migrations/        # マイグレーション履歴
│   ├── seed.ts           # シードデータ
│   └── dbml/             # ER図生成用
├── .env.local            # ローカル環境変数
├── .env.example          # 環境変数テンプレート
└── package.json          # Prisma scripts
```

### 重要なテーブル

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projects  Project[]
  sessions  Session[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
  agents      Agent[]
  workflows   Workflow[]
}

model Agent {
  id          String   @id @default(cuid())
  name        String
  type        AgentType
  config      Json
  projectId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project  @relation(fields: [projectId], references: [id])
  executions  Execution[]
}
```

---

## 🛡️ エラーハンドリング

### 共通エラーパターン

| エラー | 原因 | 対処 |
|--------|------|------|
| `P1001` | DB接続エラー | DATABASE_URL確認 |
| `P2002` | Unique制約違反 | データ重複チェック |
| `P2025` | レコード未存在 | WHERE条件見直し |
| `P3006` | マイグレーション失敗 | 手動ロールバック |
| `P4001` | DB削除エラー | 外部キー制約確認 |

### 接続問題デバッグ

```bash
# 接続テスト
npx prisma db execute --stdin <<< "SELECT 1"

# 詳細診断
PRISMA_DEBUG=* npx prisma generate

# ログレベル調整
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=10"
```

### マイグレーション復旧

```bash
# マイグレーション状態確認
prisma migrate status

# 失敗したマイグレーション解決
prisma migrate resolve --rolled-back 20240101000000_migration_name

# マイグレーション履歴リセット
prisma migrate reset
```

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| `prisma validate` | 0 errors |
| `prisma generate` | クライアント正常生成 |
| `prisma db push` | スキーマ同期完了 |
| 接続テスト | 正常接続確認 |
| データ整合性 | 制約エラー 0件 |

### 出力フォーマット

```
🗄️ Database Management Results

✅ Schema: Valid (XX models, YY fields)
✅ Generation: Prisma client updated
✅ Migration: Applied successfully
✅ Connection: Database accessible
✅ Seeding: XX records created

Database ready ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `docs/database/` | DB設計ドキュメント |
| `prisma/schema.prisma` | メインスキーマ定義 |
| `docs/api-reference.md` | API仕様 |

---

## 📝 関連Skills

- **Multi-Project Workspace**: 複数DBの管理
- **Testing Framework**: DBテスト統合
- **Environment Management**: 環境変数管理
- **CI/CD Pipeline**: マイグレーション自動化