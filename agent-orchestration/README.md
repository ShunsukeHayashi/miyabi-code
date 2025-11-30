# Agent Orchestration - Claude Code & OpenAI Agents SDK 協調フレームワーク

このディレクトリには、Claude CodeとOpenAI Agents SDKを協調させるための包括的な実装コード例が含まれています。

## data_toolkit パッケージ (utility bundle)
- データ操作向けの軽量パッケージ `data_toolkit/` を追加。`DataLoader`/`Analyzer`/`Plotter` の3クラスと `utils` モジュールを含み、`tests/` に各コンポーネントのサンプルテストを用意。
- 最小依存でCSV/JSON読み書き、統計計算、簡易プロット仕様生成が可能。詳細は `data_toolkit/README.md` 相当のセクションを参照。
- クイックスタート:
  ```python
  from data_toolkit import DataLoader, Analyzer, Plotter

  loader = DataLoader()
  rows = loader.load_csv("input.csv")
  ok, _ = loader.validate(rows, required_fields=["a", "b"])
  transformed = loader.transform(rows, lambda r: {**r, "sum": int(r["a"]) + int(r["b"])})
  loader.save(transformed, "out.json")

  analyzer = Analyzer()
  stats = analyzer.summary([1, 2, 3])

  plotter = Plotter()
  spec = plotter.line_plot([0, 1, 2], [2, 3, 4])
  ```

## 概要

Miyabiプロジェクトにおいて、複数のAIエージェントを効率的に協調させ、タスクを最適に処理するためのフレームワークです。以下の5つの主要コンポーネントで構成されています：

## コンポーネント

### 1. マルチエージェントオーケストレーター (`multi_agent_orchestrator.py`)

**目的**: Claude Code Generator (CCG) と Codex Generator (CG) の協調パターンを実装し、タスクを最適なエージェントに振り分けます。

**主要機能**:
- **タスクルーティング**: タスクの種類、優先度、トークン数に基づいて最適なエージェントを選択
- **ハイブリッド実行**: 複雑なタスクでは両方のエージェントを使用して結果を統合
- **結果集約**: 複数のエージェントからの結果を統合し、最適な出力を生成
- **統計追跡**: 実行時間、成功率、エージェント使用率などを追跡

**使用例**:
```python
from multi_agent_orchestrator import MultiAgentOrchestrator, Task, TaskType, TaskPriority

# オーケストレーターの初期化
orchestrator = MultiAgentOrchestrator(
    claude_api_key="your-claude-api-key",
    openai_api_key="your-openai-api-key",
    max_concurrent_tasks=3
)

# タスクの作成と追加
task = Task(
    task_id="task-001",
    task_type=TaskType.CODE_GENERATION,
    description="Create a Python function to calculate Fibonacci numbers",
    priority=TaskPriority.HIGH
)

orchestrator.add_task(task)

# タスクの処理
await orchestrator.process_queue()

# 統計情報の取得
stats = orchestrator.get_statistics()
print(f"成功率: {stats['success_rate']:.2f}%")
```

**エージェント選択ロジック**:
- **CCG (Claude)**: コードレビュー、分析、ドキュメント生成、高優先度タスク
- **CG (Codex)**: テスト生成、最適化、低コストタスク
- **ハイブリッド**: クリティカルなタスク、複数の視点が必要なタスク

---

### 2. コンテキスト管理ユーティリティ (`context_manager.py`)

**目的**: トークン使用量を追跡し、コンテキストウィンドウを最適化します。

**主要機能**:
- **トークンカウント**: 各モデルに応じた正確なトークン数のカウント
- **コンテキスト最適化**: 重要なメッセージを優先し、トークン制限内に収める
- **動的ロード**: 必要に応じてコンテキストを動的にロード・アンロード
- **使用量追跡**: トークン使用量の履歴と統計

**使用例**:
```python
from context_manager import ContextManager
from datetime import timedelta

# コンテキストマネージャーの初期化
context_manager = ContextManager(
    max_tokens=200000,  # Claude Sonnet 4.5
    model="claude",
    cache_size=100
)

# システムプロンプトを設定
context_manager.set_system_prompt(
    "あなたは親切で知識豊富なAIアシスタントです。"
)

# メッセージを追加
message = context_manager.add_message(
    role="user",
    content="Pythonでフィボナッチ数列を計算する関数を作成してください。",
    metadata={"priority": "high"}
)

# API用のメッセージリストを取得
api_messages = context_manager.get_messages_for_api()

# トークン使用量統計
stats = context_manager.get_token_usage_statistics(
    time_range=timedelta(hours=1)
)
print(f"使用率: {stats['utilization_rate']:.2f}%")

# 動的コンテキストローダーの使用
context_manager.dynamic_loader.load_context(
    context_id="code-snippet-1",
    content="def fibonacci(n):\n    ...",
    metadata={"language": "python"}
)

retrieved = context_manager.dynamic_loader.get_context("code-snippet-1")
```

**最適化戦略**:
1. システムメッセージは常に保持
2. 最新のメッセージを優先
3. 古いメッセージは要約して保持
4. トークン制限を超える場合は自動的に最適化

---

### 3. エラーハンドリングフレームワーク (`error_handling.py`)

**目的**: リトライ機構、サーキットブレーカー、フォールバック処理を提供し、システムの信頼性を向上させます。

**主要機能**:
- **指数バックオフリトライ**: ジッター付きの指数バックオフでリトライ
- **サーキットブレーカー**: 連続エラーを検知してシステムを保護
- **フォールバック処理**: エラー時の代替動作を提供
- **エラー追跡**: エラーの記録と分析

**使用例**:
```python
from error_handling import ErrorHandlingFramework, ErrorSeverity

# フレームワークの初期化
framework = ErrorHandlingFramework(
    max_retries=3,
    circuit_failure_threshold=5,
    circuit_recovery_timeout=60.0
)

# 安全に関数を実行
async def api_call():
    # 何らかのAPI呼び出し
    return await some_api_call()

async def fallback_function():
    # フォールバック処理
    return {"status": "fallback", "data": "cached data"}

result = await framework.execute_safely(
    operation_name="api_call",
    func=api_call,
    fallback_func=fallback_function,
    use_circuit_breaker=True,
    use_retry=True,
    error_severity=ErrorSeverity.HIGH
)

# 健全性ステータスの確認
health = framework.get_health_status()
print(f"Circuit state: {health['circuit_breaker']['state']}")
```

**デコレータとしての使用**:
```python
from error_handling import retry_with_backoff

@retry_with_backoff(max_retries=3, base_delay=1.0)
async def unstable_function():
    # 不安定な処理
    pass
```

**エラー戦略**:
- **リトライ**: 一時的なエラーに対して自動的にリトライ
- **サーキットブレーカー**: 連続失敗でサービスを一時停止
- **フォールバック**: キャッシュや代替データを使用

---

### 4. セキュリティレイヤー (`security_layer.py`)

**目的**: 入出力の安全性を確保し、権限管理と監査ログを提供します。

**主要機能**:
- **入力ガードレール**: SQLインジェクション、コマンドインジェクション、機密情報の検出
- **出力ガードレール**: 機密情報の漏洩防止、禁止ワードのフィルタリング
- **権限管理**: ロールベースとユーザーベースの権限チェック
- **監査ログ**: すべてのセキュリティイベントを記録

**使用例**:
```python
from security_layer import SecurityLayer, SecurityLevel, ActionType

# セキュリティレイヤーの初期化
security = SecurityLayer(log_file="/var/log/audit.log")

# ユーザー権限の設定
security.permission_checker.assign_role("user-001", "developer")
security.permission_checker.assign_role("user-002", "viewer")

# 入力処理
input_result = security.process_input(
    user_id="user-001",
    input_text="Create a Python function to calculate prime numbers",
    required_permission=ActionType.WRITE
)

if input_result['success']:
    sanitized = input_result['sanitized_input']
    # 処理を続行
else:
    print(f"Error: {input_result['error']}")

# 出力処理
output_result = security.process_output(
    user_id="user-001",
    output_text="Generated code here...",
    security_level=SecurityLevel.PUBLIC
)

if output_result['redacted']:
    print("機密情報が編集されました")

# セキュリティレポート
report = security.get_security_report()
print(f"成功率: {report['audit_statistics']['success_rate']:.2f}%")
```

**セキュリティチェック**:
1. 危険なパターンの検出（SQLインジェクション等）
2. 機密情報の検出とマスキング
3. 権限の検証
4. すべてのアクションを監査ログに記録

---

### 5. テストハーネス (`test_harness.py`)

**目的**: エージェントの包括的なテスト環境を提供します。

**主要機能**:
- **モックエージェント**: テスト用のシンプルなエージェント実装
- **スタブオーケストレーター**: 固定レスポンスを返すテスト用オーケストレーター
- **テストランナー**: テストケースの実行と結果管理
- **統合テスト**: エンドツーエンドのシナリオテスト

**使用例**:
```python
from test_harness import TestRunner, MockAgent, TestPriority

# テストランナーの初期化
runner = TestRunner()

# テストケースの登録
@runner.register_test(
    test_id="test-001",
    name="Mock Agent Basic Test",
    description="Test mock agent basic functionality",
    priority=TestPriority.HIGH,
    tags=["unit", "mock"]
)
async def test_mock_agent_basic():
    agent = MockAgent("test-agent-001", response_delay=0.1)

    task = {"description": "Test task"}
    result = await agent.execute_task(task)

    assert result["status"] == "success"
    assert agent.call_count == 1

    return result

# すべてのテストを実行
summary = await runner.run_all_tests()

# レポート生成
report = runner.generate_report(output_file="/tmp/test_report.txt")
print(report)

# 統合テスト
from test_harness import IntegrationTestSuite

suite = IntegrationTestSuite()

suite.setup_scenario(
    "user-registration-flow",
    {
        "validate-user": {"valid": True},
        "create-user": {"user_id": "user-123", "status": "created"}
    }
)

async def user_registration_scenario():
    validation = await suite.stub_orchestrator.execute_task(
        "validate-user",
        {"email": "test@example.com"}
    )
    assert validation["valid"] == True

    creation = await suite.stub_orchestrator.execute_task(
        "create-user",
        {"email": "test@example.com"}
    )
    assert creation["status"] == "created"

    return {"all_steps_passed": True}

result = await suite.run_integration_test(
    "user-registration-flow",
    user_registration_scenario
)
```

**テスト戦略**:
1. ユニットテスト: 個別コンポーネントのテスト
2. モック/スタブ: 外部依存を排除
3. 統合テスト: エンドツーエンドのシナリオ
4. 優先度付け: クリティカルなテストを先に実行

---

## インストールと依存関係

### 必要な依存関係:

```bash
pip install anthropic openai tiktoken asyncio
```

### requirements.txt:
```
anthropic>=0.18.0
openai>=1.12.0
tiktoken>=0.5.2
```

---

## Miyabiプロジェクトとの統合

このフレームワークは、Miyabiプロジェクトの以下のコンポーネントと統合されます：

### 1. **miyabi-openhands** との統合
- エージェントオーケストレーションを活用したタスク管理
- コンテキスト管理によるメモリ効率の向上

### 2. **miyabi-console** との統合
- セキュリティレイヤーによるユーザー入力の保護
- 監査ログによるアクティビティ追跡

### 3. **miyabi-agent-sdk** との統合
- エラーハンドリングによる信頼性向上
- テストハーネスによる品質保証

### 統合例:

```python
# Miyabiプロジェクトでの統合例
from multi_agent_orchestrator import MultiAgentOrchestrator
from context_manager import ContextManager
from error_handling import ErrorHandlingFramework
from security_layer import SecurityLayer

class MiyabiAgentSystem:
    def __init__(self, config):
        self.orchestrator = MultiAgentOrchestrator(
            claude_api_key=config.claude_api_key,
            openai_api_key=config.openai_api_key
        )
        self.context = ContextManager(max_tokens=200000)
        self.error_handler = ErrorHandlingFramework()
        self.security = SecurityLayer(log_file=config.audit_log)

    async def process_user_request(self, user_id, request):
        # セキュリティチェック
        input_result = self.security.process_input(
            user_id=user_id,
            input_text=request,
            required_permission=ActionType.WRITE
        )

        if not input_result['success']:
            return {"error": input_result['error']}

        # コンテキストに追加
        self.context.add_message(
            role="user",
            content=input_result['sanitized_input']
        )

        # タスクを作成してオーケストレーターに送信
        task = Task(
            task_id=f"task-{user_id}-{time.time()}",
            task_type=TaskType.CODE_GENERATION,
            description=input_result['sanitized_input']
        )

        # エラーハンドリング付きで実行
        result = await self.error_handler.execute_safely(
            operation_name="process_task",
            func=self.orchestrator.execute_task,
            task
        )

        # 出力のセキュリティチェック
        output_result = self.security.process_output(
            user_id=user_id,
            output_text=result['content']
        )

        return output_result
```

---

## ベストプラクティス

### 1. **エラーハンドリング**
- すべての外部API呼び出しでエラーハンドリングフレームワークを使用
- 適切なフォールバック戦略を実装
- サーキットブレーカーで過負荷を防止

### 2. **セキュリティ**
- すべてのユーザー入力を検証とサニタイズ
- 出力から機密情報を編集
- 監査ログで追跡可能性を確保

### 3. **コンテキスト管理**
- トークン使用量を常に監視
- 重要なコンテキストを優先
- 動的ロードでメモリを効率化

### 4. **テスト**
- すべての新機能にユニットテストを追加
- 統合テストでエンドツーエンドの動作を検証
- モック/スタブで外部依存を排除

### 5. **オーケストレーション**
- タスクの優先度を適切に設定
- ハイブリッドアプローチは慎重に使用（コスト増加）
- 統計情報を定期的に確認して最適化

---

## トラブルシューティング

### よくある問題と解決策:

#### 1. **トークン制限エラー**
```python
# 問題: "Token limit exceeded"
# 解決策: コンテキストを最適化
context_manager.optimizer.compress_context(messages, target_reduction=0.3)
```

#### 2. **サーキットブレーカーが開いている**
```python
# 問題: "Circuit breaker is open"
# 解決策: エラーの原因を修正し、タイムアウトを待つ
health = framework.get_health_status()
print(f"Last failure: {health['circuit_breaker']['last_failure_time']}")
```

#### 3. **権限エラー**
```python
# 問題: "Insufficient permissions"
# 解決策: 適切な権限を付与
security.permission_checker.grant_permission(user_id, ActionType.WRITE)
```

#### 4. **テスト失敗**
```python
# 問題: テストがタイムアウト
# 解決策: タイムアウト時間を延長
@runner.register_test(timeout=60.0)  # デフォルトは30秒
```

---

## パフォーマンス最適化

### 推奨設定:

```python
# 本番環境
orchestrator = MultiAgentOrchestrator(
    max_concurrent_tasks=5  # 同時実行数を増やす
)

context_manager = ContextManager(
    max_tokens=200000,
    cache_size=200  # キャッシュサイズを増やす
)

error_handler = ErrorHandlingFramework(
    max_retries=5,  # リトライ回数を増やす
    circuit_failure_threshold=10  # 閾値を高く設定
)
```

### モニタリング:

```python
# 定期的に統計を確認
orchestrator_stats = orchestrator.get_statistics()
context_stats = context_manager.get_token_usage_statistics()
error_stats = error_handler.error_tracker.get_error_statistics()
security_report = security.get_security_report()

# ログ出力
logger.info(f"Success rate: {orchestrator_stats['success_rate']:.2f}%")
logger.info(f"Token utilization: {context_stats['utilization_rate']:.2f}%")
logger.info(f"Error count: {error_stats['total_errors']}")
```

---

## ライセンスと貢献

このコードはMiyabiプロジェクトの一部として提供されています。

### 貢献ガイドライン:
1. コードスタイル: PEP 8に準拠
2. ドキュメント: 日本語コメントを追加
3. テスト: 新機能には必ずテストを追加
4. レビュー: プルリクエスト前にコードレビューを実施

---

## サポートと連絡先

質問や問題がある場合は、Miyabiプロジェクトのissueトラッカーで報告してください。

**作成日**: 2025-11-30
**バージョン**: 1.0.0
**作成者**: Claude Code (Anthropic)
