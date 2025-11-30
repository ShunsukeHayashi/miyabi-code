"""
マルチエージェントオーケストレーター
Claude Code Generator (CCG) と Codex Generator (CG) の協調パターン実装

このモジュールは、複数のAIエージェントを協調させて、
タスクを効率的に処理するためのオーケストレーション機能を提供します。
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import anthropic
from openai import OpenAI

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentType(Enum):
    """エージェントタイプの定義"""
    CCG = "claude_code_generator"  # Claude Code Generator
    CG = "codex_generator"  # Codex Generator
    HYBRID = "hybrid"  # 両方を使用


class TaskType(Enum):
    """タスクタイプの定義"""
    CODE_GENERATION = "code_generation"
    CODE_REVIEW = "code_review"
    REFACTORING = "refactoring"
    DOCUMENTATION = "documentation"
    TESTING = "testing"
    ANALYSIS = "analysis"
    OPTIMIZATION = "optimization"


class TaskPriority(Enum):
    """タスク優先度"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class Task:
    """タスクの定義"""
    task_id: str
    task_type: TaskType
    description: str
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_agent: Optional[AgentType] = None
    status: str = "pending"
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentCapability:
    """エージェントの能力定義"""
    agent_type: AgentType
    supported_tasks: List[TaskType]
    max_tokens: int
    cost_per_token: float
    avg_response_time: float  # 秒単位


class AgentRouter:
    """
    タスクを最適なエージェントにルーティングするクラス

    各エージェントの特性とタスクの要件に基づいて、
    最適なエージェントを選択します。
    """

    def __init__(self):
        self.agent_capabilities = {
            AgentType.CCG: AgentCapability(
                agent_type=AgentType.CCG,
                supported_tasks=[
                    TaskType.CODE_GENERATION,
                    TaskType.CODE_REVIEW,
                    TaskType.REFACTORING,
                    TaskType.DOCUMENTATION,
                    TaskType.ANALYSIS
                ],
                max_tokens=200000,  # Claude Sonnet 4.5
                cost_per_token=0.000003,
                avg_response_time=2.5
            ),
            AgentType.CG: AgentCapability(
                agent_type=AgentType.CG,
                supported_tasks=[
                    TaskType.CODE_GENERATION,
                    TaskType.TESTING,
                    TaskType.OPTIMIZATION,
                    TaskType.REFACTORING
                ],
                max_tokens=128000,  # GPT-4
                cost_per_token=0.000001,
                avg_response_time=1.8
            )
        }

    def route_task(self, task: Task) -> AgentType:
        """
        タスクを最適なエージェントにルーティング

        Args:
            task: ルーティング対象のタスク

        Returns:
            選択されたエージェントタイプ
        """
        # 優先度が高いタスクはCCGに割り当て
        if task.priority in [TaskPriority.HIGH, TaskPriority.CRITICAL]:
            if task.task_type in self.agent_capabilities[AgentType.CCG].supported_tasks:
                logger.info(f"Task {task.task_id} routed to CCG (high priority)")
                return AgentType.CCG

        # タスクタイプに基づいてルーティング
        if task.task_type in [TaskType.CODE_REVIEW, TaskType.ANALYSIS, TaskType.DOCUMENTATION]:
            logger.info(f"Task {task.task_id} routed to CCG (task type match)")
            return AgentType.CCG

        if task.task_type in [TaskType.TESTING, TaskType.OPTIMIZATION]:
            logger.info(f"Task {task.task_id} routed to CG (task type match)")
            return AgentType.CG

        # デフォルトはコストとレスポンスタイムを考慮
        ccg_cap = self.agent_capabilities[AgentType.CCG]
        cg_cap = self.agent_capabilities[AgentType.CG]

        if task.metadata.get("estimated_tokens", 0) > cg_cap.max_tokens * 0.8:
            logger.info(f"Task {task.task_id} routed to CCG (token limit)")
            return AgentType.CCG

        logger.info(f"Task {task.task_id} routed to CG (default)")
        return AgentType.CG

    def should_use_hybrid(self, task: Task) -> bool:
        """
        ハイブリッドアプローチを使用すべきか判定

        Args:
            task: 判定対象のタスク

        Returns:
            ハイブリッドアプローチを使用する場合True
        """
        # 複雑なタスクやクリティカルなタスクはハイブリッド
        if task.priority == TaskPriority.CRITICAL:
            return True

        if task.task_type == TaskType.CODE_REVIEW and task.metadata.get("require_multiple_perspectives"):
            return True

        return False


class ResultAggregator:
    """
    複数のエージェントからの結果を統合するクラス
    """

    @staticmethod
    def aggregate_code_generation(results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        コード生成結果を統合

        Args:
            results: 各エージェントからの結果リスト

        Returns:
            統合された結果
        """
        if not results:
            return {"code": "", "explanation": "", "confidence": 0.0}

        # 最も信頼度の高い結果を選択
        best_result = max(results, key=lambda x: x.get("confidence", 0.0))

        # 他の結果から有用な情報を抽出
        alternative_approaches = [
            r for r in results if r != best_result and r.get("code")
        ]

        return {
            "code": best_result.get("code", ""),
            "explanation": best_result.get("explanation", ""),
            "confidence": best_result.get("confidence", 0.0),
            "alternative_approaches": alternative_approaches,
            "consensus_score": len([r for r in results if r.get("code") == best_result.get("code")]) / len(results)
        }

    @staticmethod
    def aggregate_code_review(results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        コードレビュー結果を統合

        Args:
            results: 各エージェントからのレビュー結果リスト

        Returns:
            統合されたレビュー結果
        """
        all_issues = []
        all_suggestions = []

        for result in results:
            all_issues.extend(result.get("issues", []))
            all_suggestions.extend(result.get("suggestions", []))

        # 重複を除去し、重要度でソート
        unique_issues = list({issue["description"]: issue for issue in all_issues}.values())
        unique_suggestions = list({sug["description"]: sug for sug in all_suggestions}.values())

        return {
            "issues": sorted(unique_issues, key=lambda x: x.get("severity", 0), reverse=True),
            "suggestions": unique_suggestions,
            "reviewer_count": len(results),
            "overall_quality_score": sum(r.get("quality_score", 0) for r in results) / len(results)
        }


class MultiAgentOrchestrator:
    """
    マルチエージェントオーケストレーターのメインクラス

    複数のAIエージェントを協調させて、タスクを効率的に処理します。
    """

    def __init__(
        self,
        claude_api_key: str,
        openai_api_key: str,
        max_concurrent_tasks: int = 3
    ):
        """
        初期化

        Args:
            claude_api_key: Claude APIキー
            openai_api_key: OpenAI APIキー
            max_concurrent_tasks: 同時実行可能なタスク数
        """
        self.claude_client = anthropic.Anthropic(api_key=claude_api_key)
        self.openai_client = OpenAI(api_key=openai_api_key)
        self.router = AgentRouter()
        self.aggregator = ResultAggregator()
        self.max_concurrent_tasks = max_concurrent_tasks

        self.task_queue: List[Task] = []
        self.active_tasks: Dict[str, Task] = {}
        self.completed_tasks: List[Task] = []

        logger.info("MultiAgentOrchestrator initialized")

    def add_task(self, task: Task) -> None:
        """
        タスクをキューに追加

        Args:
            task: 追加するタスク
        """
        task.assigned_agent = self.router.route_task(task)
        self.task_queue.append(task)
        logger.info(f"Task {task.task_id} added to queue, assigned to {task.assigned_agent.value}")

    async def execute_task_with_ccg(self, task: Task) -> Dict[str, Any]:
        """
        Claude Code Generatorでタスクを実行

        Args:
            task: 実行するタスク

        Returns:
            実行結果
        """
        logger.info(f"Executing task {task.task_id} with CCG")

        try:
            # Claude APIを使用してタスクを実行
            message = self.claude_client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=8000,
                messages=[
                    {
                        "role": "user",
                        "content": f"Task type: {task.task_type.value}\n\n{task.description}"
                    }
                ]
            )

            result = {
                "agent": "CCG",
                "content": message.content[0].text,
                "tokens_used": message.usage.input_tokens + message.usage.output_tokens,
                "confidence": 0.9,  # Claude は一般的に高い信頼度
                "model": "claude-sonnet-4-5"
            }

            logger.info(f"Task {task.task_id} completed by CCG")
            return result

        except Exception as e:
            logger.error(f"Error executing task {task.task_id} with CCG: {str(e)}")
            raise

    async def execute_task_with_cg(self, task: Task) -> Dict[str, Any]:
        """
        Codex Generatorでタスクを実行

        Args:
            task: 実行するタスク

        Returns:
            実行結果
        """
        logger.info(f"Executing task {task.task_id} with CG")

        try:
            # OpenAI APIを使用してタスクを実行
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant specialized in code generation and analysis."
                    },
                    {
                        "role": "user",
                        "content": f"Task type: {task.task_type.value}\n\n{task.description}"
                    }
                ],
                max_tokens=4000
            )

            result = {
                "agent": "CG",
                "content": response.choices[0].message.content,
                "tokens_used": response.usage.total_tokens,
                "confidence": 0.85,  # GPT-4 の標準的な信頼度
                "model": "gpt-4-turbo"
            }

            logger.info(f"Task {task.task_id} completed by CG")
            return result

        except Exception as e:
            logger.error(f"Error executing task {task.task_id} with CG: {str(e)}")
            raise

    async def execute_task_hybrid(self, task: Task) -> Dict[str, Any]:
        """
        ハイブリッドアプローチでタスクを実行
        両方のエージェントを使用して結果を統合

        Args:
            task: 実行するタスク

        Returns:
            統合された実行結果
        """
        logger.info(f"Executing task {task.task_id} with HYBRID approach")

        # 両方のエージェントで並行実行
        ccg_task = self.execute_task_with_ccg(task)
        cg_task = self.execute_task_with_cg(task)

        results = await asyncio.gather(ccg_task, cg_task, return_exceptions=True)

        # エラーチェック
        valid_results = [r for r in results if not isinstance(r, Exception)]

        if not valid_results:
            raise Exception("Both agents failed to complete the task")

        # 結果を統合
        if task.task_type == TaskType.CODE_GENERATION:
            aggregated = self.aggregator.aggregate_code_generation(valid_results)
        elif task.task_type == TaskType.CODE_REVIEW:
            aggregated = self.aggregator.aggregate_code_review(valid_results)
        else:
            # デフォルトは最も信頼度の高い結果を選択
            aggregated = max(valid_results, key=lambda x: x.get("confidence", 0.0))

        aggregated["approach"] = "HYBRID"
        aggregated["agents_used"] = [r.get("agent") for r in valid_results]

        logger.info(f"Task {task.task_id} completed with HYBRID approach")
        return aggregated

    async def execute_task(self, task: Task) -> None:
        """
        タスクを実行

        Args:
            task: 実行するタスク
        """
        task.status = "running"
        self.active_tasks[task.task_id] = task

        try:
            # ハイブリッドアプローチを使用すべきか判定
            if self.router.should_use_hybrid(task):
                result = await self.execute_task_hybrid(task)
            elif task.assigned_agent == AgentType.CCG:
                result = await self.execute_task_with_ccg(task)
            else:
                result = await self.execute_task_with_cg(task)

            task.result = result
            task.status = "completed"
            task.completed_at = datetime.now()

        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            logger.error(f"Task {task.task_id} failed: {str(e)}")

        finally:
            del self.active_tasks[task.task_id]
            self.completed_tasks.append(task)

    async def process_queue(self) -> None:
        """
        キュー内のタスクを処理
        """
        logger.info(f"Processing queue with {len(self.task_queue)} tasks")

        # 優先度でソート
        self.task_queue.sort(key=lambda t: t.priority.value, reverse=True)

        while self.task_queue:
            # 同時実行数を制限
            if len(self.active_tasks) >= self.max_concurrent_tasks:
                await asyncio.sleep(1)
                continue

            task = self.task_queue.pop(0)
            asyncio.create_task(self.execute_task(task))

        # すべてのタスクが完了するまで待機
        while self.active_tasks:
            await asyncio.sleep(1)

        logger.info("All tasks completed")

    def get_statistics(self) -> Dict[str, Any]:
        """
        オーケストレーターの統計情報を取得

        Returns:
            統計情報
        """
        total_tasks = len(self.completed_tasks)

        if total_tasks == 0:
            return {"message": "No completed tasks"}

        successful_tasks = len([t for t in self.completed_tasks if t.status == "completed"])
        failed_tasks = len([t for t in self.completed_tasks if t.status == "failed"])

        ccg_tasks = len([t for t in self.completed_tasks if t.assigned_agent == AgentType.CCG])
        cg_tasks = len([t for t in self.completed_tasks if t.assigned_agent == AgentType.CG])

        avg_completion_time = sum(
            (t.completed_at - t.created_at).total_seconds()
            for t in self.completed_tasks if t.completed_at
        ) / total_tasks

        return {
            "total_tasks": total_tasks,
            "successful_tasks": successful_tasks,
            "failed_tasks": failed_tasks,
            "success_rate": successful_tasks / total_tasks * 100,
            "ccg_tasks": ccg_tasks,
            "cg_tasks": cg_tasks,
            "avg_completion_time_seconds": avg_completion_time
        }


# 使用例
async def main():
    """使用例のデモンストレーション"""

    # オーケストレーターの初期化
    orchestrator = MultiAgentOrchestrator(
        claude_api_key="your-claude-api-key",
        openai_api_key="your-openai-api-key",
        max_concurrent_tasks=3
    )

    # タスクの作成と追加
    tasks = [
        Task(
            task_id="task-001",
            task_type=TaskType.CODE_GENERATION,
            description="Create a Python function to calculate Fibonacci numbers",
            priority=TaskPriority.HIGH
        ),
        Task(
            task_id="task-002",
            task_type=TaskType.CODE_REVIEW,
            description="Review the authentication module for security issues",
            priority=TaskPriority.CRITICAL,
            metadata={"require_multiple_perspectives": True}
        ),
        Task(
            task_id="task-003",
            task_type=TaskType.TESTING,
            description="Generate unit tests for the user service",
            priority=TaskPriority.MEDIUM
        ),
        Task(
            task_id="task-004",
            task_type=TaskType.DOCUMENTATION,
            description="Create API documentation for the REST endpoints",
            priority=TaskPriority.LOW
        )
    ]

    for task in tasks:
        orchestrator.add_task(task)

    # タスクの処理
    await orchestrator.process_queue()

    # 統計情報の表示
    stats = orchestrator.get_statistics()
    print("\n=== オーケストレーター統計 ===")
    print(f"総タスク数: {stats['total_tasks']}")
    print(f"成功: {stats['successful_tasks']}")
    print(f"失敗: {stats['failed_tasks']}")
    print(f"成功率: {stats['success_rate']:.2f}%")
    print(f"CCG使用: {stats['ccg_tasks']}")
    print(f"CG使用: {stats['cg_tasks']}")
    print(f"平均完了時間: {stats['avg_completion_time_seconds']:.2f}秒")

    # 完了したタスクの結果を表示
    print("\n=== タスク結果 ===")
    for task in orchestrator.completed_tasks:
        print(f"\nTask ID: {task.task_id}")
        print(f"Type: {task.task_type.value}")
        print(f"Status: {task.status}")
        print(f"Agent: {task.assigned_agent.value if task.assigned_agent else 'N/A'}")
        if task.result:
            print(f"Result preview: {str(task.result)[:200]}...")


if __name__ == "__main__":
    # 非同期実行
    asyncio.run(main())
