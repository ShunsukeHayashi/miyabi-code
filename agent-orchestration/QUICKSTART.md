# クイックスタートガイド

Agent Orchestration Frameworkを素早く始めるためのガイドです。

## インストール

### 1. 依存関係のインストール

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/agent-orchestration
pip install -r requirements.txt
```

### 2. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集してAPIキーを設定
vim .env
```

必須の環境変数:
```
ANTHROPIC_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 3. （オプション）パッケージとしてインストール

```bash
pip install -e .
```

---

## 5分で始める基本的な使い方

### 例1: 単純なコード生成

```python
import asyncio
from multi_agent_orchestrator import MultiAgentOrchestrator, Task, TaskType, TaskPriority

async def simple_example():
    # オーケストレーターを初期化
    orchestrator = MultiAgentOrchestrator(
        claude_api_key="your-claude-api-key",
        openai_api_key="your-openai-api-key"
    )

    # タスクを作成
    task = Task(
        task_id="task-001",
        task_type=TaskType.CODE_GENERATION,
        description="Create a Python function to calculate factorial",
        priority=TaskPriority.HIGH
    )

    # タスクを追加して実行
    orchestrator.add_task(task)
    await orchestrator.process_queue()

    # 結果を確認
    for completed_task in orchestrator.completed_tasks:
        print(f"Task: {completed_task.task_id}")
        print(f"Status: {completed_task.status}")
        print(f"Result: {completed_task.result}")

# 実行
asyncio.run(simple_example())
```

### 例2: コンテキスト管理

```python
from context_manager import ContextManager

# コンテキストマネージャーを初期化
context = ContextManager(max_tokens=10000)

# システムプロンプトを設定
context.set_system_prompt("あなたは親切なAIアシスタントです。")

# メッセージを追加
context.add_message("user", "こんにちは")
context.add_message("assistant", "こんにちは！何かお手伝いできることはありますか？")

# API用のメッセージリストを取得
messages = context.get_messages_for_api()

# トークン使用量を確認
stats = context.get_token_usage_statistics()
print(f"Total tokens: {stats['total_tokens']}")
print(f"Utilization: {stats['utilization_rate']:.2f}%")
```

### 例3: エラーハンドリング

```python
from error_handling import ErrorHandlingFramework, ErrorSeverity

# フレームワークを初期化
error_handler = ErrorHandlingFramework(max_retries=3)

# 不安定な関数を定義
async def unstable_api_call():
    # 何らかの不安定なAPI呼び出し
    return await some_api()

# フォールバック関数
async def fallback():
    return {"status": "fallback", "data": "cached"}

# 安全に実行
result = await error_handler.execute_safely(
    operation_name="api_call",
    func=unstable_api_call,
    fallback_func=fallback,
    use_retry=True,
    use_circuit_breaker=True
)

print(f"Result: {result}")
```

### 例4: セキュリティチェック

```python
from security_layer import SecurityLayer, ActionType

# セキュリティレイヤーを初期化
security = SecurityLayer()

# ユーザー権限を設定
security.permission_checker.assign_role("user-001", "developer")

# 入力を検証
input_result = security.process_input(
    user_id="user-001",
    input_text="Create a function to sort a list",
    required_permission=ActionType.WRITE
)

if input_result['success']:
    # 安全な入力を使用
    safe_input = input_result['sanitized_input']
    print(f"Safe input: {safe_input}")
else:
    print(f"Input rejected: {input_result['error']}")
```

### 例5: テストの実行

```python
from test_harness import TestRunner, MockAgent, TestPriority
import asyncio

async def run_tests():
    runner = TestRunner()

    # テストを登録
    @runner.register_test(
        test_id="test-001",
        name="Basic Test",
        description="Test basic functionality",
        priority=TestPriority.HIGH
    )
    async def test_basic():
        agent = MockAgent("test-agent")
        result = await agent.execute_task({"description": "test"})
        assert result["status"] == "success"
        return result

    # すべてのテストを実行
    summary = await runner.run_all_tests()
    print(f"Tests: {summary['passed']}/{summary['total_tests']} passed")

    # レポートを生成
    report = runner.generate_report()
    print(report)

asyncio.run(run_tests())
```

---

## 統合例の実行

完全に統合されたシステムを試す:

```bash
# 統合例を実行
python example_integration.py
```

この例では:
1. すべてのコンポーネントを統合したシステムを構築
2. 複数のリクエストを処理
3. セキュリティチェックを実施
4. システムステータスを確認
5. 診断テストを実行

---

## よくある使用パターン

### パターン1: 基本的なタスク処理

```python
from multi_agent_orchestrator import MultiAgentOrchestrator, Task, TaskType

orchestrator = MultiAgentOrchestrator(claude_api_key="...", openai_api_key="...")
task = Task(task_id="1", task_type=TaskType.CODE_GENERATION, description="...")
orchestrator.add_task(task)
await orchestrator.process_queue()
```

### パターン2: 安全な実行（推奨）

```python
from error_handling import ErrorHandlingFramework

error_handler = ErrorHandlingFramework()

result = await error_handler.execute_safely(
    operation_name="my_operation",
    func=my_function,
    fallback_func=my_fallback,
    use_retry=True,
    use_circuit_breaker=True
)
```

### パターン3: セキュアな入出力

```python
from security_layer import SecurityLayer

security = SecurityLayer()

# 入力
input_result = security.process_input(user_id="...", input_text="...")
if not input_result['success']:
    return  # エラー処理

# 処理...

# 出力
output_result = security.process_output(user_id="...", output_text="...")
final_output = output_result['output']  # 編集済み
```

### パターン4: コンテキスト最適化

```python
from context_manager import ContextManager

context = ContextManager(max_tokens=200000)
context.set_system_prompt("...")

# メッセージを追加
context.add_message("user", "...")
context.add_message("assistant", "...")

# トークン制限を超えた場合は自動的に最適化される
messages = context.get_messages_for_api()  # API用に最適化済み
```

---

## トラブルシューティング

### 問題: APIキーエラー

```python
# 解決策: 環境変数を確認
import os
print(os.getenv("ANTHROPIC_API_KEY"))
print(os.getenv("OPENAI_API_KEY"))
```

### 問題: トークン制限エラー

```python
# 解決策: コンテキストを圧縮
context.optimizer.compress_context(messages, target_reduction=0.3)
```

### 問題: インポートエラー

```bash
# 解決策: 依存関係を再インストール
pip install -r requirements.txt --upgrade
```

### 問題: テストが失敗する

```python
# 解決策: タイムアウトを延長
@runner.register_test(timeout=60.0)  # デフォルトは30秒
async def my_test():
    # テストコード
    pass
```

---

## 次のステップ

1. **README.mdを読む**: 詳細なドキュメント
2. **example_integration.pyを実行**: 統合例を試す
3. **各モジュールのドキュメント**: ソースコード内のdocstringを参照
4. **テストを書く**: test_harness.pyを使用してテストを作成
5. **Miyabiプロジェクトに統合**: 既存のプロジェクトに統合

---

## サポート

質問や問題がある場合:
1. README.mdの詳細ドキュメントを確認
2. ソースコード内のコメントを確認
3. example_integration.pyの例を参照
4. Miyabiプロジェクトのissueトラッカーで報告

---

## 便利なコマンド

```bash
# テストの実行
python -m pytest

# カバレッジレポート
python -m pytest --cov=. --cov-report=html

# コードフォーマット
black .

# リンター
flake8 .

# 型チェック
mypy .

# 統合例の実行
python example_integration.py

# 診断テストの実行
python -c "from example_integration import MiyabiAgentSystem; import asyncio; system = MiyabiAgentSystem('key1', 'key2'); asyncio.run(system.run_diagnostics())"
```

---

作成日: 2025-11-30
バージョン: 1.0.0
