# Protocols - タスク管理・報告プロトコル

**Priority**: ⭐⭐

## 📋 タスク管理プロトコル

**詳細仕様**: `.claude/prompts/task-management-protocol.md`

### Todo作成基準

✅ **使用する場合**:
- 複数ステップ（3以上）が必要なタスク
- 複雑なタスク（実装 + テスト + ドキュメント）
- ユーザーが複数タスクをリスト形式で提供

❌ **使用しない場合**:
- 単純な1ステップタスク
- 純粋な質問・情報提供

### ステータス管理

```
pending → in_progress → completed
```

**ルール**:
- 同時に`in_progress`は**1つのみ**
- 完了したタスクは**即座に**`completed`に変更
- エラー時は`in_progress`のまま維持

### Todo構造

```typescript
{
  content: "【カテゴリ】タスク内容 - 詳細",
  status: "pending" | "in_progress" | "completed",
  activeForm: "【実施中 - カテゴリ】進行状況"
}
```

### 実装例

```typescript
[
  {
    content: "【Phase 1】型安全性の向上 - IToolCreator interface作成",
    status: "completed",
    activeForm: "【完了 - Phase 1】IToolCreator interface作成完了✅"
  },
  {
    content: "【Phase 2】エラーハンドリング強化 - 5種類のエラークラス実装",
    status: "in_progress",
    activeForm: "【実装中 - Phase 2】Exponential Backoff実装中"
  }
]
```

### 禁止事項

❌ **やってはいけないこと**:
- 複数タスクをまとめて`completed`に変更（バッチ更新禁止）
- テスト失敗時に`completed`にする
- 部分的な実装で`completed`にする
- 複数のタスクを同時に`in_progress`にする

## 📋 報告プロトコル

**テンプレート**: `.claude/templates/reporting-protocol.md`

### Claude Codeからの報告形式

```markdown
## 📋 Claude Code からの作業報告

**報告者**: Claude Code (AI Assistant)
**報告日時**: YYYY-MM-DD
**セッション**: [セッション名/タスク名]

---

### ✅ 完了した作業

#### 1. [作業項目名]
**担当**: Claude Code
- 作業内容の詳細
- 実施した変更

---

### 📊 変更統計

**コミット情報**:
- **コミットID**: [hash]
- **変更ファイル数**: N ファイル
- **追加行数**: +N行
- **削除行数**: -N行

---

### 🎯 動作確認結果

**確認者**: Claude Code

✅ [確認項目1]
✅ [確認項目2]

---

### ⚠️ 注意事項

**報告者**: Claude Code

1. [注意点1]
2. [注意点2]

---

### 🚀 次のステップ（提案）

**提案者**: Claude Code

1. [提案1]
2. [提案2]

---

**報告終了**
Claude Code
```

### 報告ルール

1. **報告者の明記**: 全ての報告で「Claude Code」として名乗る
2. **担当者の明記**: 各作業項目に「担当: Claude Code」を記載
3. **確認者の明記**: 動作確認結果に「確認者: Claude Code」を記載
4. **提案者の明記**: 次のステップ提案に「提案者: Claude Code」を記載
5. **報告終了の明記**: 報告の最後に「**報告終了** Claude Code」を記載

### 適用範囲

- セッション終了時の作業サマリー
- 重要なマイルストーン達成時
- Issue処理完了時
- Agent実行結果の報告
- エラー・問題発生時の報告

## 🔗 Related Modules

- **Development**: [development.md](./development.md) - Commit Conventions

## 📖 Detailed Documentation

- **Task Management Protocol**: `.claude/prompts/task-management-protocol.md` (完全仕様)
- **Reporting Protocol**: `.claude/templates/reporting-protocol.md` (テンプレート)
