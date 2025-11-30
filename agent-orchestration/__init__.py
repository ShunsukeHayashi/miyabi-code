"""
Agent Orchestration Framework
Claude Code & OpenAI Agents SDK 協調フレームワーク

このパッケージは、複数のAIエージェントを協調させて効率的にタスクを処理するための
包括的なフレームワークを提供します。

主要コンポーネント:
- MultiAgentOrchestrator: エージェントのオーケストレーション
- ContextManager: コンテキストとトークンの管理
- ErrorHandlingFramework: エラーハンドリングとリトライ機構
- SecurityLayer: セキュリティとアクセス制御
- TestHarness: テストとモック機能

使用例:
    from agent_orchestration import MultiAgentOrchestrator, Task, TaskType

    orchestrator = MultiAgentOrchestrator(
        claude_api_key="your-key",
        openai_api_key="your-key"
    )

    task = Task(
        task_id="task-001",
        task_type=TaskType.CODE_GENERATION,
        description="Create a Python function"
    )

    orchestrator.add_task(task)
    await orchestrator.process_queue()
"""

__version__ = "1.0.0"
__author__ = "Miyabi Project"
__all__ = [
    # オーケストレーション
    "MultiAgentOrchestrator",
    "AgentType",
    "TaskType",
    "TaskPriority",
    "Task",
    "AgentRouter",
    "ResultAggregator",

    # コンテキスト管理
    "ContextManager",
    "TokenCounter",
    "ContextOptimizer",
    "DynamicContextLoader",
    "Message",
    "ContextWindow",

    # エラーハンドリング
    "ErrorHandlingFramework",
    "RetryStrategy",
    "CircuitBreaker",
    "FallbackHandler",
    "ErrorTracker",
    "ErrorSeverity",
    "CircuitState",
    "retry_with_backoff",

    # セキュリティ
    "SecurityLayer",
    "InputGuardrail",
    "OutputGuardrail",
    "PermissionChecker",
    "AuditLogger",
    "SecurityLevel",
    "ActionType",

    # テスト
    "TestRunner",
    "MockAgent",
    "StubOrchestrator",
    "IntegrationTestSuite",
    "TestCase",
    "TestResult",
    "TestStatus",
    "TestPriority",
]

# オーケストレーション
from .multi_agent_orchestrator import (
    MultiAgentOrchestrator,
    AgentType,
    TaskType,
    TaskPriority,
    Task,
    AgentRouter,
    ResultAggregator,
)

# コンテキスト管理
from .context_manager import (
    ContextManager,
    TokenCounter,
    ContextOptimizer,
    DynamicContextLoader,
    Message,
    ContextWindow,
)

# エラーハンドリング
from .error_handling import (
    ErrorHandlingFramework,
    RetryStrategy,
    CircuitBreaker,
    FallbackHandler,
    ErrorTracker,
    ErrorSeverity,
    CircuitState,
    retry_with_backoff,
)

# セキュリティ
from .security_layer import (
    SecurityLayer,
    InputGuardrail,
    OutputGuardrail,
    PermissionChecker,
    AuditLogger,
    SecurityLevel,
    ActionType,
)

# テスト
from .test_harness import (
    TestRunner,
    MockAgent,
    StubOrchestrator,
    IntegrationTestSuite,
    TestCase,
    TestResult,
    TestStatus,
    TestPriority,
)
