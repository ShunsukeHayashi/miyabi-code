# TypeScript (レガシー - 参考)

**Priority**: ⭐ (レガシー参考のみ)

## ⚠️ 注意

**TypeScript版は段階的にRustに移行中です。**

新規開発はすべてRustで実施してください。
このドキュメントはレガシーコード参照時の参考情報として提供されています。

## 📁 レガシーTypeScriptコード

### ディレクトリ構造
```
packages/
├── miyabi-agent-sdk/     # NPMパッケージ（レガシー）
└── coding-agents/        # TypeScript版Agent実装（レガシー）

agents/
└── types/                # TypeScript型定義（レガシー）
```

### 型定義（参考）
```typescript
// agents/types/index.ts
export interface Agent {
  id: string;
  type: AgentType;
  status: AgentStatus;
}

export interface Task {
  id: string;
  type: TaskType;
  dependencies: string[];
  estimatedTime: number;
}
```

## 🔄 Rust移行状況

### 移行完了
- ✅ **miyabi-types** - コア型定義（Rust）
- ✅ **miyabi-agents** - 全21 Agents（Rust）
- ✅ **miyabi-cli** - CLI binary（Rust）
- ✅ **miyabi-github** - GitHub API統合（Rust）

### 移行中
- 🔄 **Business Agents** - `miyabi-business-agents` → `miyabi-agents/business` に統合中

### レガシー（参考のみ）
- 📘 **TypeScript Agent実装** - `packages/coding-agents/`
- 📘 **TypeScript型定義** - `agents/types/`

## 📖 移行ドキュメント

新規開発時は以下のRustドキュメントを参照してください：

- **Rust Development**: [rust.md](./rust.md)
- **Rust Migration Requirements**: `docs/RUST_MIGRATION_REQUIREMENTS.md`
- **Rust Migration Sprint**: `docs/RUST_MIGRATION_SPRINT_PLAN.md`

## 🔗 Related Modules

- **Rust**: [rust.md](./rust.md) - Rust開発ガイド（現行）
- **Development**: [development.md](./development.md) - 開発ガイドライン全般
- **Architecture**: [architecture.md](./architecture.md) - Cargo Workspace構造

---

**新規開発はすべてRustで実施してください。TypeScriptコードは参考情報としてのみ使用してください。**
