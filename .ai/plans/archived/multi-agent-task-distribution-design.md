# マルチエージェント・タスク分散設計

**Created**: 2025-11-11
**Status**: In Progress
**Owner**: Leader Agent (pane %8)

## 🎯 目的

Miyabi tmuxオーケストレーション内での効率的なタスク分散と協調動作の実現

## 📊 現状分析

### 既存Agent構成
- **Coding Agents (6個)**: みつけるん、しきるん、カエデ、サクラ、ツバキ、ボタン
- **Business Agents (14個)**: あきんどさん、けいかくん、つくるん2号、等
- **tmux Panes**: %0, %1, %2, %3, %4, %7, %10, %11, %12

## 🏗️ 設計コンセプト

### 1. 階層型タスク分散モデル

```
Leader Agent (pane %8)
    │
    ├─ Worker Agent 1 (pane %11) - 実装担当
    ├─ Worker Agent 2 (pane %12) - テスト担当
    └─ Worker Agent 3 (その他) - ドキュメント担当
```

### 2. 通信プロトコル仕様

#### Format
```
[From→To] Action: Details
```

#### Message Types
- **TASK_ASSIGN**: タスク割り当て
- **PROGRESS_UPDATE**: 進捗報告
- **TASK_COMPLETE**: タスク完了報告
- **HELP_REQUEST**: 支援要請
- **ERROR_REPORT**: エラー報告

#### Example
```bash
tmux send-keys -t %11 "[Leader→Worker1] TASK_ASSIGN: エージェント間通信プロトコル実装" && sleep 0.5 && tmux send-keys -t %11 Enter
```

### 3. タスクキュー管理

**Queue Structure**:
```
Priority Queue
├─ P0 (Critical) - システム停止につながるタスク
├─ P1 (High) - 必須実行タスク
├─ P2 (Normal) - 通常タスク
└─ P3 (Low) - 最適化・改善タスク
```

**Current Tasks** (2025-11-11):
1. [P1] エージェント間通信プロトコル実装 → Worker1 (pane %11)
2. [P1] マルチエージェント協調テストケース作成 → Worker1 (pane %11)
3. [P1] タスク分散設計策定 → Leader (pane %8) ✅ In Progress
4. [P2] 進捗管理・モニタリング → Leader (pane %8)
5. [P2] 品質チェック・統合テスト → Leader + All Workers

### 4. 負荷分散アルゴリズム

**Round-Robin with Capability Matching**:
```python
def assign_task(task, available_agents):
    # 1. Filter agents by capability
    capable_agents = [a for a in available_agents if task.required_skill in a.skills]

    # 2. Sort by current load
    capable_agents.sort(key=lambda a: a.current_load)

    # 3. Assign to least loaded agent
    return capable_agents[0]
```

### 5. 進捗モニタリング

**Monitoring Metrics**:
- Task completion rate
- Average task duration
- Agent utilization rate
- Error rate
- Communication latency

**Check Interval**: 毎30秒でWorker Agentの画面を確認

### 6. エラーハンドリング

**Error Recovery Strategy**:
1. Worker Agentがエラー報告 → Leader が認識
2. Leader がエラー内容を分析
3. 以下のいずれかを実行:
   - タスクの再割り当て
   - 別Agentへの委譲
   - ユーザーへのエスカレーション

## 🚀 実装計画

### Phase 1: 通信基盤 (Worker1担当)
- [x] tmux send-keys プロトコル確立
- [ ] メッセージフォーマット標準化
- [ ] エラーハンドリング機能

### Phase 2: タスク管理 (Leader担当)
- [x] タスクキュー設計
- [ ] 優先度管理システム
- [ ] 負荷分散ロジック

### Phase 3: モニタリング (Leader担当)
- [ ] 進捗追跡システム
- [ ] メトリクス収集
- [ ] ダッシュボード（オプション）

### Phase 4: テスト (Worker1 + Leader)
- [ ] 単体テスト
- [ ] 統合テスト
- [ ] 負荷テスト

## 📝 Next Actions

1. ✅ 設計ドキュメント作成完了
2. Worker1 (pane %11) の進捗確認
3. 通信プロトコル実装完了待ち
4. Phase 2 タスク管理実装開始

## 📊 Success Criteria

- ✅ 3つ以上のAgentが同時に異なるタスクを実行可能
- ✅ タスク完了率 > 95%
- ✅ エージェント間通信成功率 > 99%
- ✅ 平均タスク完了時間 < 予定時間の120%

---

**Status**: Phase 1 In Progress | **Last Updated**: 2025-11-11
