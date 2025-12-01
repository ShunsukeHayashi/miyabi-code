#!/usr/bin/env python3
"""
Miyabi Multi-Agent Orchestrator Example
CCG + CG ハイブリッドオーケストレーション実装例
"""

import asyncio
from typing import List, Dict
from dataclasses import dataclass
from enum import Enum


class TaskType(Enum):
    """タスクタイプ定義"""
    EXPLORATION = "exploration"
    PLANNING = "planning"
    CODE_GENERATION = "code_generation"
    TESTING = "testing"
    REVIEW = "review"


@dataclass
class Task:
    """タスク定義"""
    task_id: str
    task_type: TaskType
    description: str
    priority: int = 1
    metadata: Dict = None


class MiyabiOrchestrator:
    """
    純粋オーケストレーターパターン実装

    原則:
    1. 実作業は絶対に行わない
    2. グローバルな計画を保持
    3. 専門エージェントへのタスク委譲
    4. 結果の集約と調整
    """

    def __init__(self, ccg_agents: Dict, cg_agents: Dict):
        self.ccg_agents = ccg_agents  # Claude Code エージェント
        self.cg_agents = cg_agents    # Codex エージェント
        self.task_queue = []
        self.results = []

    def add_task(self, task: Task):
        """タスクをキューに追加"""
        self.task_queue.append(task)
        print(f"✅ タスク追加: {task.task_id} ({task.task_type.value})")

    def route_task(self, task: Task) -> str:
        """
        タスクルーティング戦略

        ルーティングマトリックス:
        - 探索/計画/レビュー → CCG
        - コード生成/テスト → CG
        """
        routing_map = {
            TaskType.EXPLORATION: "ccg_explorer",
            TaskType.PLANNING: "ccg_planner",
            TaskType.CODE_GENERATION: "cg_developer",
            TaskType.TESTING: "cg_tester",
            TaskType.REVIEW: "ccg_reviewer"
        }

        agent_name = routing_map.get(task.task_type)
        print(f"🎯 ルーティング: {task.task_id} → {agent_name}")
        return agent_name

    async def execute_task(self, task: Task) -> Dict:
        """単一タスク実行"""
        agent_name = self.route_task(task)

        # エージェント選択
        if agent_name.startswith('ccg_'):
            agent = self.ccg_agents.get(agent_name.replace('ccg_', ''))
        else:
            agent = self.cg_agents.get(agent_name.replace('cg_', ''))

        if not agent:
            return {"status": "error", "message": f"Agent not found: {agent_name}"}

        # エージェントに委譲（実際のAPI呼び出しはここで行う）
        print(f"⚙️  実行中: {task.task_id} by {agent_name}")
        result = await agent.query(task.description)

        return {
            "task_id": task.task_id,
            "agent": agent_name,
            "status": "success",
            "result": result
        }

    async def process_queue(self) -> List[Dict]:
        """
        タスクキュー処理

        並列実行可能なタスクは並列化
        依存関係のあるタスクは順次実行
        """
        print(f"\n🚀 タスクキュー処理開始 ({len(self.task_queue)}個のタスク)")

        # 依存関係分析（簡易版）
        independent_tasks = []
        dependent_tasks = []

        for task in self.task_queue:
            # 探索と計画は並列化不可（順次実行）
            if task.task_type in [TaskType.EXPLORATION, TaskType.PLANNING]:
                dependent_tasks.append(task)
            else:
                independent_tasks.append(task)

        results = []

        # 依存タスクを順次実行
        for task in dependent_tasks:
            result = await self.execute_task(task)
            results.append(result)

        # 独立タスクを並列実行
        if independent_tasks:
            print(f"⚡ 並列実行: {len(independent_tasks)}個のタスク")
            parallel_results = await asyncio.gather(
                *[self.execute_task(task) for task in independent_tasks]
            )
            results.extend(parallel_results)

        self.results = results
        self.task_queue.clear()

        print(f"\n✅ 処理完了: {len(results)}個の結果")
        return results

    def get_statistics(self) -> Dict:
        """統計情報取得"""
        total = len(self.results)
        success = sum(1 for r in self.results if r.get('status') == 'success')

        return {
            'total_tasks': total,
            'successful': success,
            'failed': total - success,
            'success_rate': success / total if total > 0 else 0
        }


# ===== モックエージェント（実装例） =====

class MockAgent:
    """エージェントのモック実装"""

    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model

    async def query(self, task: str) -> str:
        """タスク実行（モック）"""
        await asyncio.sleep(0.5)  # API呼び出しをシミュレート
        return f"[{self.name}] タスク完了: {task[:50]}..."


# ===== 使用例 =====

async def main():
    """オーケストレーター使用例"""

    print("=" * 60)
    print("Miyabi Multi-Agent Orchestrator - 実行例")
    print("=" * 60)

    # CCGエージェント初期化
    ccg_agents = {
        'explorer': MockAgent('CCG Explorer (Haiku)', 'claude-haiku-4.5'),
        'planner': MockAgent('CCG Planner (Opus)', 'claude-opus-4.5'),
        'reviewer': MockAgent('CCG Reviewer (Opus)', 'claude-opus-4.5')
    }

    # CGエージェント初期化
    cg_agents = {
        'developer': MockAgent('CG Developer (GPT-5)', 'gpt-5'),
        'tester': MockAgent('CG Tester (GPT-5)', 'gpt-5')
    }

    # オーケストレーター初期化
    orchestrator = MiyabiOrchestrator(ccg_agents, cg_agents)

    # タスク追加
    tasks = [
        Task(
            task_id="T001",
            task_type=TaskType.EXPLORATION,
            description="認証関連のファイルを全て検索し、現状を把握"
        ),
        Task(
            task_id="T002",
            task_type=TaskType.PLANNING,
            description="OAuth2.0認証システムの実装計画を立案"
        ),
        Task(
            task_id="T003",
            task_type=TaskType.CODE_GENERATION,
            description="認証エンドポイント実装"
        ),
        Task(
            task_id="T004",
            task_type=TaskType.CODE_GENERATION,
            description="トークン検証ミドルウェア実装"
        ),
        Task(
            task_id="T005",
            task_type=TaskType.TESTING,
            description="認証フロー統合テスト作成"
        ),
        Task(
            task_id="T006",
            task_type=TaskType.REVIEW,
            description="セキュリティレビュー実施"
        )
    ]

    for task in tasks:
        orchestrator.add_task(task)

    # タスクキュー処理
    results = await orchestrator.process_queue()

    # 統計情報表示
    print("\n" + "=" * 60)
    print("実行統計")
    print("=" * 60)
    stats = orchestrator.get_statistics()
    print(f"総タスク数: {stats['total_tasks']}")
    print(f"成功: {stats['successful']}")
    print(f"失敗: {stats['failed']}")
    print(f"成功率: {stats['success_rate']:.1%}")

    # 結果詳細
    print("\n" + "=" * 60)
    print("実行結果")
    print("=" * 60)
    for result in results:
        status_icon = "✅" if result['status'] == 'success' else "❌"
        print(f"{status_icon} {result['task_id']} [{result['agent']}]")
        print(f"   {result.get('result', result.get('message'))[:80]}...")


if __name__ == "__main__":
    asyncio.run(main())
