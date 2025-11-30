"""
テストハーネス
エージェントテスト、モック/スタブ、統合テスト

このモジュールは、AIエージェントの包括的なテスト環境を提供し、
品質保証と信頼性向上をサポートします。
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable, Type
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json
import time

logger = logging.getLogger(__name__)


class TestStatus(Enum):
    """テストステータス"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"


class TestPriority(Enum):
    """テスト優先度"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class TestCase:
    """テストケースの定義"""
    test_id: str
    name: str
    description: str
    test_func: Callable
    priority: TestPriority = TestPriority.MEDIUM
    tags: List[str] = field(default_factory=list)
    timeout: float = 30.0  # 秒
    retry_count: int = 0
    status: TestStatus = TestStatus.PENDING
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


@dataclass
class TestResult:
    """テスト結果"""
    test_case: TestCase
    passed: bool
    message: str
    details: Dict[str, Any] = field(default_factory=dict)


class MockAgent:
    """
    モックエージェントクラス
    テスト用のシンプルなエージェント実装
    """

    def __init__(
        self,
        agent_id: str,
        response_delay: float = 0.1,
        failure_rate: float = 0.0
    ):
        """
        初期化

        Args:
            agent_id: エージェントID
            response_delay: レスポンス遅延（秒）
            failure_rate: 失敗率（0.0～1.0）
        """
        self.agent_id = agent_id
        self.response_delay = response_delay
        self.failure_rate = failure_rate
        self.call_count = 0
        self.call_history: List[Dict[str, Any]] = []

        logger.info(f"MockAgent initialized: id={agent_id}")

    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        タスクを実行（モック）

        Args:
            task: タスク情報

        Returns:
            実行結果
        """
        self.call_count += 1

        # 履歴に記録
        call_record = {
            "call_number": self.call_count,
            "timestamp": datetime.now().isoformat(),
            "task": task
        }
        self.call_history.append(call_record)

        # 遅延をシミュレート
        await asyncio.sleep(self.response_delay)

        # 失敗をシミュレート
        import random
        if random.random() < self.failure_rate:
            raise Exception(f"Mock agent {self.agent_id} simulated failure")

        # 成功レスポンス
        return {
            "agent_id": self.agent_id,
            "status": "success",
            "result": f"Mock result for task: {task.get('description', 'unknown')}",
            "call_count": self.call_count,
            "execution_time": self.response_delay
        }

    def get_call_history(self) -> List[Dict[str, Any]]:
        """
        呼び出し履歴を取得

        Returns:
            呼び出し履歴
        """
        return self.call_history

    def reset(self) -> None:
        """状態をリセット"""
        self.call_count = 0
        self.call_history.clear()
        logger.info(f"MockAgent {self.agent_id} reset")


class StubOrchestrator:
    """
    スタブオーケストレータークラス
    テスト用の固定レスポンスを返す
    """

    def __init__(self):
        """初期化"""
        self.predefined_responses: Dict[str, Any] = {}
        logger.info("StubOrchestrator initialized")

    def set_response(self, task_id: str, response: Any) -> None:
        """
        事前定義されたレスポンスを設定

        Args:
            task_id: タスクID
            response: レスポンス
        """
        self.predefined_responses[task_id] = response
        logger.info(f"Stub response set for task_id: {task_id}")

    async def execute_task(self, task_id: str, task: Dict[str, Any]) -> Any:
        """
        タスクを実行（スタブ）

        Args:
            task_id: タスクID
            task: タスク情報

        Returns:
            事前定義されたレスポンス
        """
        if task_id in self.predefined_responses:
            logger.info(f"Returning stub response for task_id: {task_id}")
            return self.predefined_responses[task_id]
        else:
            logger.warning(f"No stub response found for task_id: {task_id}")
            return {"status": "error", "message": "No stub response defined"}


class TestRunner:
    """
    テストランナークラス
    テストケースを実行し、結果を管理
    """

    def __init__(self):
        """初期化"""
        self.test_cases: List[TestCase] = []
        self.test_results: List[TestResult] = []
        logger.info("TestRunner initialized")

    def add_test_case(self, test_case: TestCase) -> None:
        """
        テストケースを追加

        Args:
            test_case: テストケース
        """
        self.test_cases.append(test_case)
        logger.info(f"Test case added: {test_case.test_id} - {test_case.name}")

    def register_test(
        self,
        test_id: str,
        name: str,
        description: str,
        priority: TestPriority = TestPriority.MEDIUM,
        tags: Optional[List[str]] = None,
        timeout: float = 30.0
    ):
        """
        テストをデコレータとして登録

        Args:
            test_id: テストID
            name: テスト名
            description: 説明
            priority: 優先度
            tags: タグ
            timeout: タイムアウト

        Returns:
            デコレータ関数
        """
        def decorator(test_func: Callable):
            test_case = TestCase(
                test_id=test_id,
                name=name,
                description=description,
                test_func=test_func,
                priority=priority,
                tags=tags or [],
                timeout=timeout
            )
            self.add_test_case(test_case)
            return test_func

        return decorator

    async def run_test_case(self, test_case: TestCase) -> TestResult:
        """
        単一のテストケースを実行

        Args:
            test_case: テストケース

        Returns:
            テスト結果
        """
        test_case.status = TestStatus.RUNNING
        test_case.started_at = datetime.now()

        logger.info(f"Running test: {test_case.test_id} - {test_case.name}")

        try:
            # タイムアウト付きで実行
            start_time = time.time()

            result = await asyncio.wait_for(
                test_case.test_func(),
                timeout=test_case.timeout
            )

            execution_time = time.time() - start_time

            test_case.status = TestStatus.PASSED
            test_case.result = result
            test_case.execution_time = execution_time
            test_case.completed_at = datetime.now()

            test_result = TestResult(
                test_case=test_case,
                passed=True,
                message="Test passed successfully",
                details={
                    "result": result,
                    "execution_time": execution_time
                }
            )

            logger.info(
                f"Test passed: {test_case.test_id} "
                f"(execution time: {execution_time:.2f}s)"
            )

        except asyncio.TimeoutError:
            test_case.status = TestStatus.FAILED
            test_case.error = f"Test timed out after {test_case.timeout}s"
            test_case.completed_at = datetime.now()

            test_result = TestResult(
                test_case=test_case,
                passed=False,
                message=test_case.error,
                details={"error_type": "timeout"}
            )

            logger.error(f"Test failed (timeout): {test_case.test_id}")

        except AssertionError as e:
            test_case.status = TestStatus.FAILED
            test_case.error = str(e)
            test_case.completed_at = datetime.now()

            test_result = TestResult(
                test_case=test_case,
                passed=False,
                message=f"Assertion failed: {str(e)}",
                details={"error_type": "assertion", "error": str(e)}
            )

            logger.error(f"Test failed (assertion): {test_case.test_id} - {str(e)}")

        except Exception as e:
            test_case.status = TestStatus.FAILED
            test_case.error = str(e)
            test_case.completed_at = datetime.now()

            test_result = TestResult(
                test_case=test_case,
                passed=False,
                message=f"Test error: {str(e)}",
                details={"error_type": "exception", "error": str(e)}
            )

            logger.error(f"Test failed (exception): {test_case.test_id} - {str(e)}")

        self.test_results.append(test_result)
        return test_result

    async def run_all_tests(
        self,
        filter_tags: Optional[List[str]] = None,
        min_priority: Optional[TestPriority] = None
    ) -> Dict[str, Any]:
        """
        すべてのテストを実行

        Args:
            filter_tags: タグでフィルタ
            min_priority: 最小優先度

        Returns:
            テスト実行結果のサマリー
        """
        logger.info(f"Running {len(self.test_cases)} test cases")

        # フィルタリング
        tests_to_run = self.test_cases

        if filter_tags:
            tests_to_run = [
                t for t in tests_to_run
                if any(tag in t.tags for tag in filter_tags)
            ]

        if min_priority:
            tests_to_run = [
                t for t in tests_to_run
                if t.priority.value >= min_priority.value
            ]

        logger.info(f"Filtered to {len(tests_to_run)} test cases")

        # 優先度順にソート
        tests_to_run.sort(key=lambda t: t.priority.value, reverse=True)

        # テストを実行
        start_time = time.time()

        for test_case in tests_to_run:
            await self.run_test_case(test_case)

        total_execution_time = time.time() - start_time

        # サマリーを作成
        summary = self.get_test_summary()
        summary["total_execution_time"] = total_execution_time

        logger.info(f"All tests completed in {total_execution_time:.2f}s")

        return summary

    def get_test_summary(self) -> Dict[str, Any]:
        """
        テスト結果のサマリーを取得

        Returns:
            サマリー
        """
        if not self.test_results:
            return {"message": "No test results"}

        total = len(self.test_results)
        passed = len([r for r in self.test_results if r.passed])
        failed = total - passed

        pass_rate = (passed / total * 100) if total > 0 else 0

        # 優先度別の集計
        priority_stats = {}
        for result in self.test_results:
            priority = result.test_case.priority.name
            if priority not in priority_stats:
                priority_stats[priority] = {"total": 0, "passed": 0, "failed": 0}

            priority_stats[priority]["total"] += 1
            if result.passed:
                priority_stats[priority]["passed"] += 1
            else:
                priority_stats[priority]["failed"] += 1

        return {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": pass_rate,
            "priority_stats": priority_stats
        }

    def get_failed_tests(self) -> List[TestResult]:
        """
        失敗したテストを取得

        Returns:
            失敗したテスト結果のリスト
        """
        return [r for r in self.test_results if not r.passed]

    def generate_report(self, output_file: Optional[str] = None) -> str:
        """
        テストレポートを生成

        Args:
            output_file: 出力ファイルパス

        Returns:
            レポートの文字列
        """
        summary = self.get_test_summary()

        report_lines = [
            "=" * 60,
            "テストレポート",
            "=" * 60,
            f"総テスト数: {summary['total_tests']}",
            f"成功: {summary['passed']}",
            f"失敗: {summary['failed']}",
            f"成功率: {summary['pass_rate']:.2f}%",
            "",
            "優先度別統計:",
        ]

        for priority, stats in summary.get("priority_stats", {}).items():
            report_lines.append(
                f"  {priority}: {stats['passed']}/{stats['total']} passed"
            )

        report_lines.append("")
        report_lines.append("失敗したテスト:")

        failed_tests = self.get_failed_tests()
        if failed_tests:
            for result in failed_tests:
                report_lines.extend([
                    f"  - {result.test_case.test_id}: {result.test_case.name}",
                    f"    理由: {result.message}",
                    ""
                ])
        else:
            report_lines.append("  なし")

        report_lines.append("=" * 60)

        report = "\n".join(report_lines)

        # ファイルに出力
        if output_file:
            with open(output_file, "w") as f:
                f.write(report)
            logger.info(f"Test report written to {output_file}")

        return report


class IntegrationTestSuite:
    """
    統合テストスイート
    エンドツーエンドのシナリオテストを実行
    """

    def __init__(self):
        """初期化"""
        self.test_runner = TestRunner()
        self.mock_agent = MockAgent("test-agent")
        self.stub_orchestrator = StubOrchestrator()

        logger.info("IntegrationTestSuite initialized")

    def setup_scenario(
        self,
        scenario_name: str,
        mock_responses: Dict[str, Any]
    ) -> None:
        """
        テストシナリオをセットアップ

        Args:
            scenario_name: シナリオ名
            mock_responses: モックレスポンス
        """
        logger.info(f"Setting up scenario: {scenario_name}")

        for task_id, response in mock_responses.items():
            self.stub_orchestrator.set_response(task_id, response)

    async def run_integration_test(
        self,
        test_name: str,
        test_scenario: Callable
    ) -> TestResult:
        """
        統合テストを実行

        Args:
            test_name: テスト名
            test_scenario: テストシナリオ関数

        Returns:
            テスト結果
        """
        logger.info(f"Running integration test: {test_name}")

        test_case = TestCase(
            test_id=f"integration-{test_name}",
            name=test_name,
            description=f"Integration test: {test_name}",
            test_func=test_scenario,
            priority=TestPriority.HIGH,
            tags=["integration"]
        )

        return await self.test_runner.run_test_case(test_case)


# 使用例とテストケース
async def example_test_cases():
    """テストケースの使用例"""

    # テストランナーを初期化
    runner = TestRunner()

    # テストケース1: モックエージェントのテスト
    @runner.register_test(
        test_id="test-001",
        name="Mock Agent Basic Test",
        description="Test mock agent basic functionality",
        priority=TestPriority.HIGH,
        tags=["unit", "mock"]
    )
    async def test_mock_agent_basic():
        """モックエージェントの基本機能テスト"""
        agent = MockAgent("test-agent-001", response_delay=0.1)

        task = {"description": "Test task"}
        result = await agent.execute_task(task)

        assert result["status"] == "success"
        assert agent.call_count == 1

        return result

    # テストケース2: モックエージェントの失敗ケース
    @runner.register_test(
        test_id="test-002",
        name="Mock Agent Failure Test",
        description="Test mock agent failure handling",
        priority=TestPriority.MEDIUM,
        tags=["unit", "mock", "error"]
    )
    async def test_mock_agent_failure():
        """モックエージェントの失敗ハンドリングテスト"""
        agent = MockAgent("test-agent-002", failure_rate=1.0)

        task = {"description": "Test task"}

        try:
            await agent.execute_task(task)
            raise AssertionError("Expected exception not raised")
        except Exception as e:
            assert "simulated failure" in str(e)

        return {"expected_failure": True}

    # テストケース3: スタブオーケストレーターのテスト
    @runner.register_test(
        test_id="test-003",
        name="Stub Orchestrator Test",
        description="Test stub orchestrator functionality",
        priority=TestPriority.MEDIUM,
        tags=["unit", "stub"]
    )
    async def test_stub_orchestrator():
        """スタブオーケストレーターのテスト"""
        orchestrator = StubOrchestrator()

        # スタブレスポンスを設定
        orchestrator.set_response(
            "task-001",
            {"status": "success", "result": "stub result"}
        )

        result = await orchestrator.execute_task("task-001", {})

        assert result["status"] == "success"
        assert result["result"] == "stub result"

        return result

    # テストケース4: タイムアウトテスト
    @runner.register_test(
        test_id="test-004",
        name="Timeout Test",
        description="Test timeout handling",
        priority=TestPriority.LOW,
        tags=["unit", "timeout"],
        timeout=1.0
    )
    async def test_timeout():
        """タイムアウトテスト（このテストは失敗するはず）"""
        await asyncio.sleep(2.0)
        return {"should_not_reach": True}

    # すべてのテストを実行
    print("\n" + "=" * 60)
    print("テスト実行開始")
    print("=" * 60)

    summary = await runner.run_all_tests()

    # レポートを生成
    print("\n" + runner.generate_report())

    # JSON形式でサマリーを出力
    print("\nJSON サマリー:")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


# 統合テストの例
async def example_integration_test():
    """統合テストの使用例"""

    suite = IntegrationTestSuite()

    # シナリオをセットアップ
    suite.setup_scenario(
        "user-registration-flow",
        {
            "validate-user": {"valid": True},
            "create-user": {"user_id": "user-123", "status": "created"},
            "send-email": {"sent": True}
        }
    )

    # 統合テストシナリオを定義
    async def user_registration_scenario():
        """ユーザー登録フローのテストシナリオ"""

        # ステップ1: ユーザー検証
        validation = await suite.stub_orchestrator.execute_task(
            "validate-user",
            {"email": "test@example.com"}
        )
        assert validation["valid"] == True

        # ステップ2: ユーザー作成
        creation = await suite.stub_orchestrator.execute_task(
            "create-user",
            {"email": "test@example.com", "name": "Test User"}
        )
        assert creation["status"] == "created"

        # ステップ3: メール送信
        email = await suite.stub_orchestrator.execute_task(
            "send-email",
            {"user_id": creation["user_id"]}
        )
        assert email["sent"] == True

        return {
            "scenario": "user-registration-flow",
            "all_steps_passed": True
        }

    # 統合テストを実行
    print("\n" + "=" * 60)
    print("統合テスト実行")
    print("=" * 60)

    result = await suite.run_integration_test(
        "user-registration-flow",
        user_registration_scenario
    )

    print(f"\nテスト結果: {'成功' if result.passed else '失敗'}")
    print(f"メッセージ: {result.message}")
    if result.details:
        print(f"詳細: {json.dumps(result.details, indent=2, ensure_ascii=False)}")


# メイン実行
async def main():
    """メイン関数"""
    print("=" * 60)
    print("テストハーネス - 使用例")
    print("=" * 60)

    # ユニットテストの実行
    await example_test_cases()

    # 統合テストの実行
    await example_integration_test()


if __name__ == "__main__":
    asyncio.run(main())
