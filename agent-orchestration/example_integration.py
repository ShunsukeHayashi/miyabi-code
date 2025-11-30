"""
統合例 - Miyabiプロジェクトでの使用例
Claude Code & OpenAI Agents SDK 協調フレームワークの実践的な使用方法

このファイルは、フレームワークのすべてのコンポーネントを統合した
実践的な使用例を示します。
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import timedelta
import os

# フレームワークのインポート
from multi_agent_orchestrator import (
    MultiAgentOrchestrator,
    Task,
    TaskType,
    TaskPriority
)
from context_manager import ContextManager
from error_handling import ErrorHandlingFramework, ErrorSeverity
from security_layer import SecurityLayer, ActionType, SecurityLevel
from test_harness import TestRunner, MockAgent, TestPriority

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MiyabiAgentSystem:
    """
    Miyabi統合エージェントシステム
    すべてのコンポーネントを統合した包括的なシステム
    """

    def __init__(
        self,
        claude_api_key: str,
        openai_api_key: str,
        audit_log_path: str = "/tmp/miyabi_audit.log"
    ):
        """
        初期化

        Args:
            claude_api_key: Claude APIキー
            openai_api_key: OpenAI APIキー
            audit_log_path: 監査ログのパス
        """
        logger.info("Initializing Miyabi Agent System")

        # オーケストレーター
        self.orchestrator = MultiAgentOrchestrator(
            claude_api_key=claude_api_key,
            openai_api_key=openai_api_key,
            max_concurrent_tasks=5
        )

        # コンテキストマネージャー
        self.context_manager = ContextManager(
            max_tokens=200000,
            model="claude",
            cache_size=100
        )

        # エラーハンドリング
        self.error_handler = ErrorHandlingFramework(
            max_retries=3,
            circuit_failure_threshold=5,
            circuit_recovery_timeout=60.0
        )

        # セキュリティレイヤー
        self.security = SecurityLayer(log_file=audit_log_path)

        # システムプロンプトを設定
        self.context_manager.set_system_prompt(
            "あなたはMiyabiプロジェクトのAIアシスタントです。"
            "ユーザーのコード生成、レビュー、分析のリクエストに応えます。"
        )

        # デフォルトユーザーロールを設定
        self._setup_default_roles()

        logger.info("Miyabi Agent System initialized successfully")

    def _setup_default_roles(self):
        """デフォルトのロールを設定"""
        # 管理者ロール
        self.security.permission_checker.assign_role("admin", "admin")

        # 開発者ロール
        self.security.permission_checker.assign_role("developer", "developer")

        # ビューワーロール
        self.security.permission_checker.assign_role("viewer", "viewer")

    async def process_user_request(
        self,
        user_id: str,
        request: str,
        task_type: TaskType = TaskType.CODE_GENERATION,
        priority: TaskPriority = TaskPriority.MEDIUM
    ) -> Dict[str, Any]:
        """
        ユーザーリクエストを処理

        Args:
            user_id: ユーザーID
            request: リクエスト内容
            task_type: タスクタイプ
            priority: 優先度

        Returns:
            処理結果
        """
        logger.info(f"Processing request from user {user_id}")

        try:
            # ステップ1: セキュリティチェック（入力検証）
            input_result = await self._validate_input(user_id, request)

            if not input_result['success']:
                return {
                    'success': False,
                    'error': input_result['error'],
                    'stage': 'input_validation'
                }

            sanitized_input = input_result['sanitized_input']

            # ステップ2: コンテキストに追加
            self.context_manager.add_message(
                role="user",
                content=sanitized_input,
                metadata={
                    'user_id': user_id,
                    'task_type': task_type.value,
                    'priority': priority.value
                }
            )

            # ステップ3: タスクを作成
            task = Task(
                task_id=f"task-{user_id}-{asyncio.get_event_loop().time()}",
                task_type=task_type,
                description=sanitized_input,
                priority=priority,
                metadata={
                    'user_id': user_id,
                    'estimated_tokens': len(sanitized_input) // 4
                }
            )

            # ステップ4: エラーハンドリング付きでタスクを実行
            execution_result = await self._execute_task_safely(task)

            if not execution_result['success']:
                return {
                    'success': False,
                    'error': execution_result['error'],
                    'stage': 'task_execution'
                }

            # ステップ5: 出力のセキュリティチェック
            output_result = await self._validate_output(
                user_id,
                execution_result['result']
            )

            # ステップ6: コンテキストに応答を追加
            self.context_manager.add_message(
                role="assistant",
                content=output_result['output'],
                metadata={'redacted': output_result['redacted']}
            )

            return {
                'success': True,
                'result': output_result['output'],
                'redacted': output_result['redacted'],
                'agent_used': execution_result.get('agent_used'),
                'execution_time': execution_result.get('execution_time'),
                'token_usage': self.context_manager.context_window.current_tokens
            }

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")

            # エラーを記録
            self.error_handler.error_tracker.record_error(
                e,
                severity=ErrorSeverity.HIGH,
                context={'user_id': user_id, 'request_preview': request[:100]}
            )

            return {
                'success': False,
                'error': str(e),
                'stage': 'system_error'
            }

    async def _validate_input(
        self,
        user_id: str,
        input_text: str
    ) -> Dict[str, Any]:
        """入力を検証"""
        return self.security.process_input(
            user_id=user_id,
            input_text=input_text,
            required_permission=ActionType.WRITE
        )

    async def _execute_task_safely(self, task: Task) -> Dict[str, Any]:
        """タスクを安全に実行"""
        try:
            # タスクをオーケストレーターに追加
            self.orchestrator.add_task(task)

            # エラーハンドリング付きで実行
            result = await self.error_handler.execute_safely(
                f"execute_task_{task.task_id}",
                self.orchestrator.execute_task,
                task,
                use_circuit_breaker=True,
                use_retry=True,
                error_severity=ErrorSeverity.MEDIUM
            )

            return {
                'success': True,
                'result': result.get('content', ''),
                'agent_used': result.get('agent', 'unknown'),
                'execution_time': result.get('execution_time', 0)
            }

        except Exception as e:
            logger.error(f"Task execution failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    async def _validate_output(
        self,
        user_id: str,
        output_text: str
    ) -> Dict[str, Any]:
        """出力を検証"""
        return self.security.process_output(
            user_id=user_id,
            output_text=output_text,
            security_level=SecurityLevel.PUBLIC
        )

    def get_system_status(self) -> Dict[str, Any]:
        """
        システムのステータスを取得

        Returns:
            システムステータス
        """
        orchestrator_stats = self.orchestrator.get_statistics()
        context_stats = self.context_manager.get_token_usage_statistics()
        error_health = self.error_handler.get_health_status()
        security_report = self.security.get_security_report()

        return {
            'orchestrator': orchestrator_stats,
            'context': context_stats,
            'error_handling': error_health,
            'security': security_report
        }

    async def run_diagnostics(self) -> Dict[str, Any]:
        """
        診断テストを実行

        Returns:
            診断結果
        """
        logger.info("Running system diagnostics")

        diagnostics = {
            'timestamp': asyncio.get_event_loop().time(),
            'tests': {}
        }

        # テスト1: モックエージェントでの基本動作確認
        try:
            mock_agent = MockAgent("diagnostic-agent", response_delay=0.1)
            result = await mock_agent.execute_task({"description": "diagnostic test"})
            diagnostics['tests']['mock_agent'] = {
                'status': 'passed',
                'result': result
            }
        except Exception as e:
            diagnostics['tests']['mock_agent'] = {
                'status': 'failed',
                'error': str(e)
            }

        # テスト2: コンテキスト管理
        try:
            test_message = self.context_manager.add_message(
                role="user",
                content="診断テストメッセージ"
            )
            diagnostics['tests']['context_manager'] = {
                'status': 'passed',
                'token_count': test_message.token_count
            }
        except Exception as e:
            diagnostics['tests']['context_manager'] = {
                'status': 'failed',
                'error': str(e)
            }

        # テスト3: セキュリティレイヤー
        try:
            security_result = self.security.process_input(
                user_id="diagnostic-user",
                input_text="安全なテスト入力",
                required_permission=ActionType.READ
            )
            diagnostics['tests']['security_layer'] = {
                'status': 'passed' if security_result['success'] else 'failed',
                'result': security_result
            }
        except Exception as e:
            diagnostics['tests']['security_layer'] = {
                'status': 'failed',
                'error': str(e)
            }

        # テスト4: エラーハンドリング
        try:
            circuit_state = self.error_handler.circuit_breaker.get_state()
            diagnostics['tests']['error_handling'] = {
                'status': 'passed',
                'circuit_state': circuit_state
            }
        except Exception as e:
            diagnostics['tests']['error_handling'] = {
                'status': 'failed',
                'error': str(e)
            }

        # 全体の成功率を計算
        total_tests = len(diagnostics['tests'])
        passed_tests = len([t for t in diagnostics['tests'].values() if t['status'] == 'passed'])

        diagnostics['summary'] = {
            'total_tests': total_tests,
            'passed': passed_tests,
            'failed': total_tests - passed_tests,
            'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0
        }

        logger.info(f"Diagnostics completed: {passed_tests}/{total_tests} tests passed")

        return diagnostics


# 使用例
async def main():
    """使用例のデモンストレーション"""

    print("=" * 80)
    print("Miyabi Agent System - 統合例")
    print("=" * 80)

    # 環境変数からAPIキーを取得（または直接指定）
    claude_api_key = os.getenv("ANTHROPIC_API_KEY", "your-claude-api-key")
    openai_api_key = os.getenv("OPENAI_API_KEY", "your-openai-api-key")

    # システムを初期化
    system = MiyabiAgentSystem(
        claude_api_key=claude_api_key,
        openai_api_key=openai_api_key
    )

    # ユーザーロールを設定
    system.security.permission_checker.assign_role("user-001", "developer")

    # 例1: コード生成リクエスト
    print("\n" + "=" * 80)
    print("例1: コード生成リクエスト")
    print("=" * 80)

    result1 = await system.process_user_request(
        user_id="user-001",
        request="Pythonでフィボナッチ数列を計算する関数を作成してください。",
        task_type=TaskType.CODE_GENERATION,
        priority=TaskPriority.HIGH
    )

    print(f"\n結果: {'成功' if result1['success'] else '失敗'}")
    if result1['success']:
        print(f"エージェント: {result1.get('agent_used', 'N/A')}")
        print(f"実行時間: {result1.get('execution_time', 0):.2f}秒")
        print(f"トークン使用: {result1.get('token_usage', 0)}")
        print(f"\n生成コード:\n{result1['result'][:200]}...")
    else:
        print(f"エラー: {result1['error']}")

    # 例2: コードレビューリクエスト
    print("\n" + "=" * 80)
    print("例2: コードレビューリクエスト")
    print("=" * 80)

    result2 = await system.process_user_request(
        user_id="user-001",
        request="""
        以下のコードをレビューしてください:

        def process_data(data):
            result = []
            for item in data:
                result.append(item * 2)
            return result
        """,
        task_type=TaskType.CODE_REVIEW,
        priority=TaskPriority.MEDIUM
    )

    print(f"\n結果: {'成功' if result2['success'] else '失敗'}")
    if result2['success']:
        print(f"\nレビュー結果:\n{result2['result'][:200]}...")

    # 例3: 危険な入力（セキュリティテスト）
    print("\n" + "=" * 80)
    print("例3: セキュリティテスト（危険な入力）")
    print("=" * 80)

    result3 = await system.process_user_request(
        user_id="user-001",
        request="SELECT * FROM users; DROP TABLE users;",
        task_type=TaskType.CODE_GENERATION,
        priority=TaskPriority.LOW
    )

    print(f"\n結果: {'成功' if result3['success'] else '失敗'}")
    if not result3['success']:
        print(f"エラー（期待通り）: {result3['error']}")
        print(f"ステージ: {result3.get('stage', 'N/A')}")

    # システムステータスを確認
    print("\n" + "=" * 80)
    print("システムステータス")
    print("=" * 80)

    status = system.get_system_status()

    print("\nオーケストレーター:")
    if 'total_tasks' in status['orchestrator']:
        print(f"  総タスク数: {status['orchestrator']['total_tasks']}")
        print(f"  成功率: {status['orchestrator']['success_rate']:.2f}%")

    print("\nコンテキスト:")
    if 'total_tokens' in status['context']:
        print(f"  総トークン数: {status['context']['total_tokens']}")
        print(f"  使用率: {status['context']['utilization_rate']:.2f}%")

    print("\nセキュリティ:")
    if 'audit_statistics' in status['security']:
        audit_stats = status['security']['audit_statistics']
        if 'total_actions' in audit_stats:
            print(f"  総アクション数: {audit_stats['total_actions']}")
            print(f"  成功率: {audit_stats['success_rate']:.2f}%")

    # 診断テストを実行
    print("\n" + "=" * 80)
    print("診断テスト")
    print("=" * 80)

    diagnostics = await system.run_diagnostics()

    print(f"\n診断結果: {diagnostics['summary']['passed']}/{diagnostics['summary']['total_tests']} テスト成功")
    print(f"成功率: {diagnostics['summary']['success_rate']:.2f}%")

    print("\n各テストの結果:")
    for test_name, test_result in diagnostics['tests'].items():
        status_icon = "✓" if test_result['status'] == 'passed' else "✗"
        print(f"  {status_icon} {test_name}: {test_result['status']}")


if __name__ == "__main__":
    asyncio.run(main())
