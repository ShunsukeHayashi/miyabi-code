# 🧠 Miyabi Error Learning System (Θ6 Process)

**Version**: 1.0.0
**Created**: 2025-11-15
**Based on**: C-Θ1-2-3-4-5-6 Transformation Process

---

## 概要 (Overview)

Θ6 (Learn) プロセスを活用し、全てのエラーから学習して完全なプロセスへ落とし込むシステム。

### 目的 (Purpose)

1. **エラー収集**: 全オペレーションからエラーパターンを自動収集
2. **学習**: エラーの原因・パターン・解決策を分析
3. **知識化**: ナレッジベース (KB) / ベクトルDB に保存
4. **自動修正**: 同じエラーを繰り返さないように自動対応
5. **プロセス改善**: 完全なプロセスへ収束

---

## アーキテクチャ (Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                  Error Learning System                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│  │ Collect  │────▶│ Analyze  │────▶│ Store KB │      │
│  └──────────┘     └──────────┘     └──────────┘      │
│       │                 │                 │            │
│       ▼                 ▼                 ▼            │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│  │ Pattern  │────▶│  Learn   │────▶│  Fix     │      │
│  │ Match    │     │  Model   │     │  Auto    │      │
│  └──────────┘     └──────────┘     └──────────┘      │
│       │                 │                 │            │
│       └─────────────────┴─────────────────┘            │
│                         ▼                              │
│                  ┌──────────┐                         │
│                  │ Process  │                         │
│                  │ Improve  │                         │
│                  └──────────┘                         │
└─────────────────────────────────────────────────────────┘
```

---

## データ構造 (Data Structure)

### エラーレコード (Error Record)

```json
{
  "error_id": "uuid",
  "timestamp": "ISO 8601",
  "category": "deployment | agent_execution | api_call | build | ...  ",
  "severity": "P0 | P1 | P2",
  "context": {
    "operation": "cdk deploy | agent run | ...",
    "agent": "orchestrator | uiux | security | ...",
    "task_id": "task-xxx",
    "environment": "mac | mugen | majin | ..."
  },
  "error_details": {
    "message": "エラーメッセージ全文",
    "stack_trace": "スタックトレース",
    "exit_code": 1,
    "stderr": "標準エラー出力"
  },
  "root_cause": {
    "type": "missing_dependency | wrong_directory | permission_denied | ...",
    "description": "根本原因の説明"
  },
  "solution": {
    "steps": ["step1", "step2", "..."],
    "commands": ["command1", "command2"],
    "verification": "解決確認方法"
  },
  "learning": {
    "pattern": "エラーパターンの一般化",
    "prevention": "今後の防止策",
    "related_errors": ["error_id_1", "error_id_2"]
  },
  "status": "new | analyzed | fixed | recurring",
  "fix_count": 0,
  "last_occurrence": "ISO 8601"
}
```

### ナレッジベース (Knowledge Base)

```json
{
  "kb_id": "uuid",
  "title": "CDK Bootstrap Required Before Deploy",
  "category": "deployment",
  "tags": ["cdk", "aws", "bootstrap", "deployment"],
  "problem": {
    "description": "CDK deployでSSM parameter not foundエラー",
    "symptoms": [
      "SSM parameter /cdk-bootstrap/hnb659fds/version not found",
      "Has the environment been bootstrapped?"
    ],
    "occurrences": 3,
    "first_seen": "ISO 8601",
    "last_seen": "ISO 8601"
  },
  "solution": {
    "root_cause": "CDK環境が初期化されていない",
    "fix_steps": [
      "正しいディレクトリに移動: cd infrastructure/aws-cdk",
      "Bootstrap実行: npx cdk bootstrap aws://ACCOUNT/REGION",
      "Deploy実行: npx cdk deploy"
    ],
    "prevention": "デプロイ前に必ずbootstrap状態を確認"
  },
  "code_examples": [
    {
      "language": "bash",
      "code": "cd infrastructure/aws-cdk\nnpx cdk bootstrap aws://112530848482/us-west-2\nnpx cdk deploy --require-approval never"
    }
  ],
  "related_kb": ["kb-001", "kb-002"],
  "confidence": 0.95,
  "vector_embedding": [0.1, 0.2, ...],
  "status": "validated"
}
```

---

## Θ6 (Learn) プロセス統合

### Step 1: Error Detection (エラー検出)

```python
def detect_error(operation_result):
    """
    全オペレーション結果からエラーを検出
    """
    if operation_result.exit_code != 0:
        error_record = {
            "error_id": generate_uuid(),
            "timestamp": datetime.now().isoformat(),
            "severity": classify_severity(operation_result),
            "error_details": extract_error_details(operation_result)
        }
        return error_record
    return None
```

### Step 2: Error Analysis (エラー分析)

```python
def analyze_error(error_record):
    """
    エラーの根本原因を分析
    """
    # パターンマッチング
    pattern = match_known_patterns(error_record)

    if pattern:
        # 既知のエラー
        return pattern.solution
    else:
        # 新規エラー - AI分析
        analysis = ai_analyze(error_record)
        create_new_kb_entry(analysis)
        return analysis.solution
```

### Step 3: Auto-Fix (自動修正)

```python
def auto_fix(error_record, solution):
    """
    可能であれば自動修正を試行
    """
    if solution.automatable:
        execute_fix_steps(solution.steps)
        verify_fix(solution.verification)
        update_error_status(error_record, "fixed")
    else:
        escalate_to_human(error_record, solution)
```

### Step 4: Learning (学習)

```python
def learn_from_error(error_record, fix_result):
    """
    エラーと修正から学習
    """
    # ナレッジベース更新
    kb_entry = create_or_update_kb(error_record, fix_result)

    # ベクトルDB保存
    embedding = generate_embedding(kb_entry)
    vector_db.store(kb_entry, embedding)

    # プロセス改善提案
    process_improvement = suggest_process_improvement(kb_entry)

    return {
        "kb_entry": kb_entry,
        "embedding": embedding,
        "improvement": process_improvement
    }
```

---

## 実装 (Implementation)

### Phase 1: エラー収集基盤

```bash
# エラー収集スクリプト
.claude/systems/error-collector.sh
```

全てのオペレーション結果を監視:
- Bash実行結果 (exit_code, stderr)
- Agent実行ログ
- CDK deployログ
- WebUI APIエラー

### Phase 2: ナレッジベース構築

```
.claude/knowledge-base/
├── errors/
│   ├── deployment/
│   │   └── cdk-bootstrap-required.json
│   ├── agent/
│   ├── api/
│   └── build/
├── solutions/
│   └── verified/
└── patterns/
    └── common-errors.json
```

### Phase 3: ベクトルDB統合

**Option A: ローカルベクトルDB**
- FAISS
- Chroma
- LanceDB

**Option B: クラウドベクトルDB**
- Pinecone
- Weaviate
- Qdrant

**推奨**: LanceDB (ローカル、Rust実装、高速)

### Phase 4: AI分析統合

Claude API使用:
```python
def ai_analyze_error(error_record):
    prompt = f"""
    以下のエラーを分析してください:

    エラーメッセージ: {error_record.error_details.message}
    コンテキスト: {error_record.context}

    以下を出力してください:
    1. 根本原因
    2. 解決手順
    3. 今後の防止策
    """

    response = claude_api.complete(prompt)
    return parse_analysis(response)
```

---

## 使用例 (Usage Examples)

### 例1: CDK Bootstrap エラー

**エラー発生**:
```
SSM parameter /cdk-bootstrap/hnb659fds/version not found.
Has the environment been bootstrapped?
```

**学習プロセス**:
1. **Θ1 (Understand)**: エラーメッセージからCDK環境未初期化と判断
2. **Θ2 (Generate)**: Bootstrap実行の解決策生成
3. **Θ3 (Allocate)**: 自動修正可能と判定 (P1)
4. **Θ4 (Execute)**: `npx cdk bootstrap` 実行
5. **Θ5 (Integrate)**: 修正結果を検証
6. **Θ6 (Learn)**: ナレッジベースに保存 + 次回から自動対応

**KB Entry作成**:
```json
{
  "title": "CDK Bootstrap Required",
  "pattern": "SSM parameter .*/cdk-bootstrap/.* not found",
  "solution": {
    "auto_fix": true,
    "steps": ["cd infrastructure/aws-cdk", "npx cdk bootstrap aws://ACCOUNT/REGION"]
  }
}
```

### 例2: 複雑なシェル変数エラー

**エラー発生**:
```
(eval):1: parse error near `)'
```

**学習プロセス**:
1. **Θ1**: 複雑なシェル変数置換が原因と分析
2. **Θ2**: シンプルなスクリプトファイル方式への変更提案
3. **Θ3**: 手動修正必要 (P2)
4. **Θ4**: 新しいスクリプトファイル作成
5. **Θ5**: 動作確認
6. **Θ6**: ベストプラクティスとして記録

**改善提案**:
```markdown
## Learning: Shell Variable Substitution
- **Problem**: Complex inline variable substitution causes parse errors
- **Solution**: Use dedicated script files instead
- **Prevention**: Always prefer script files for multi-line operations
```

---

## メトリクス (Metrics)

### 追跡指標

1. **エラー発生率** (Error Rate)
   - 総オペレーション数に対するエラー数
   - 目標: < 5%

2. **エラー解決時間** (MTTR - Mean Time To Resolution)
   - エラー検出から修正完了までの時間
   - 目標: < 10分

3. **再発率** (Recurrence Rate)
   - 同じエラーの再発回数
   - 目標: 0%

4. **自動修正率** (Auto-Fix Rate)
   - 自動修正可能なエラーの割合
   - 目標: > 80%

5. **ナレッジベース成長** (KB Growth)
   - KB エントリー数の増加
   - 目標: +10 entries/week

### ダッシュボード

```
┌────────────────────────────────────────┐
│  Miyabi Error Learning Dashboard       │
├────────────────────────────────────────┤
│ Total Errors:     42                   │
│ Auto-Fixed:       34 (81%)             │
│ Manual Fix:       6  (14%)             │
│ Escalated:        2  (5%)              │
├────────────────────────────────────────┤
│ KB Entries:       28                   │
│ New This Week:    7                    │
│ Top Category:     deployment (12)      │
├────────────────────────────────────────┤
│ MTTR:             8.5 minutes          │
│ Recurrence:       2% (↓ 5%)           │
│ Success Rate:     95% (↑ 3%)          │
└────────────────────────────────────────┘
```

---

## ロードマップ (Roadmap)

### Week 1: 基盤構築
- [x] エラー収集スクリプト
- [ ] ナレッジベース構造設計
- [ ] 基本的なパターンマッチング

### Week 2: AI統合
- [ ] Claude API統合
- [ ] エラー分析自動化
- [ ] ベクトルDB選定・導入

### Week 3: 自動修正
- [ ] 自動修正フレームワーク
- [ ] 検証システム
- [ ] エスカレーション機構

### Week 4: 最適化
- [ ] ダッシュボード構築
- [ ] メトリクス収集
- [ ] プロセス改善サイクル

---

## ベストプラクティス (Best Practices)

### DO ✅

1. **全エラーをログ**: 小さなwarningも記録
2. **コンテキスト保存**: エラー発生時の環境情報を詳細に
3. **パターン一般化**: 特定のケースではなく一般的なパターンへ
4. **検証必須**: 自動修正後は必ず検証
5. **人間エスカレーション**: P0/複雑なエラーは即座にエスカレート

### DON'T ❌

1. **エラー無視**: どんな小さなエラーも無視しない
2. **盲目的自動修正**: 検証なしの自動修正は危険
3. **単一解決策**: 複数の解決策を保持
4. **学習忘却**: 過去の学習を再利用
5. **パターン過学習**: 過度に特化したパターンは避ける

---

## 統合 (Integration)

### Miyabi Societyとの統合

全Agent (Orchestrator, UI/UX, Security, etc.) が自動的にΘ6プロセスを実行:

```python
class MiyabiAgent:
    def execute_task(self, task):
        try:
            result = self.run(task)  # Θ1-Θ5
            self.learn(result)       # Θ6
        except Exception as error:
            error_record = self.log_error(error)
            solution = self.analyze_error(error_record)
            self.auto_fix_or_escalate(solution)
            self.learn_from_error(error_record, solution)  # Θ6
```

---

**System**: Miyabi Error Learning System v1.0.0
**Status**: 設計完了 - 実装開始準備完了
**Next**: エラー収集スクリプト実装 → KB構築 → ベクトルDB統合

🌸 **"エラーから学び、完璧なプロセスへ収束する"** 🌸
