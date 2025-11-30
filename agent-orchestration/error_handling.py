"""
エラーハンドリングフレームワーク
リトライ機構（指数バックオフ）、サーキットブレーカー、フォールバック処理

このモジュールは、AIエージェントの信頼性を向上させるための
包括的なエラーハンドリング機能を提供します。
"""

import asyncio
import logging
import time
from typing import Optional, Callable, Any, Dict, List, Type
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import functools
import traceback

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    """エラーの重要度"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class CircuitState(Enum):
    """サーキットブレーカーの状態"""
    CLOSED = "closed"  # 正常動作
    OPEN = "open"  # エラー多発により開放
    HALF_OPEN = "half_open"  # 回復テスト中


@dataclass
class ErrorRecord:
    """エラー記録"""
    error_type: str
    error_message: str
    severity: ErrorSeverity
    timestamp: datetime = field(default_factory=datetime.now)
    stack_trace: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    recovery_attempted: bool = False
    recovery_successful: bool = False


class RetryStrategy:
    """
    リトライ戦略クラス
    指数バックオフを使用したインテリジェントなリトライ機構
    """

    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True
    ):
        """
        初期化

        Args:
            max_retries: 最大リトライ回数
            base_delay: 基本遅延時間（秒）
            max_delay: 最大遅延時間（秒）
            exponential_base: 指数の基数
            jitter: ジッターを追加するか
        """
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter

    def calculate_delay(self, attempt: int) -> float:
        """
        リトライ遅延時間を計算

        Args:
            attempt: リトライ試行回数（0始まり）

        Returns:
            遅延時間（秒）
        """
        # 指数バックオフ
        delay = min(
            self.base_delay * (self.exponential_base ** attempt),
            self.max_delay
        )

        # ジッターを追加して負荷を分散
        if self.jitter:
            import random
            delay = delay * (0.5 + random.random())

        return delay

    async def execute_with_retry(
        self,
        func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """
        リトライ付きで関数を実行

        Args:
            func: 実行する関数
            *args: 関数の位置引数
            **kwargs: 関数のキーワード引数

        Returns:
            関数の実行結果

        Raises:
            最後の試行で発生した例外
        """
        last_exception = None

        for attempt in range(self.max_retries + 1):
            try:
                # 非同期関数の場合
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)

                if attempt > 0:
                    logger.info(f"Retry succeeded on attempt {attempt + 1}")

                return result

            except Exception as e:
                last_exception = e
                logger.warning(
                    f"Attempt {attempt + 1}/{self.max_retries + 1} failed: {str(e)}"
                )

                # 最後の試行でない場合は待機
                if attempt < self.max_retries:
                    delay = self.calculate_delay(attempt)
                    logger.info(f"Retrying in {delay:.2f} seconds...")
                    await asyncio.sleep(delay)

        # すべてのリトライが失敗
        logger.error(f"All retry attempts failed: {str(last_exception)}")
        raise last_exception


def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0
):
    """
    リトライデコレーター

    Args:
        max_retries: 最大リトライ回数
        base_delay: 基本遅延時間
        max_delay: 最大遅延時間
        exponential_base: 指数の基数

    Returns:
        デコレートされた関数
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            strategy = RetryStrategy(
                max_retries=max_retries,
                base_delay=base_delay,
                max_delay=max_delay,
                exponential_base=exponential_base
            )
            return await strategy.execute_with_retry(func, *args, **kwargs)

        return wrapper

    return decorator


class CircuitBreaker:
    """
    サーキットブレーカーパターンの実装
    連続エラーを検知してシステムを保護
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        expected_exception: Type[Exception] = Exception
    ):
        """
        初期化

        Args:
            failure_threshold: エラー閾値
            recovery_timeout: 回復タイムアウト（秒）
            expected_exception: 期待される例外タイプ
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitState.CLOSED

        logger.info(
            f"CircuitBreaker initialized: threshold={failure_threshold}, "
            f"timeout={recovery_timeout}s"
        )

    def _should_attempt_reset(self) -> bool:
        """
        リセットを試みるべきか判定

        Returns:
            リセットを試みる場合True
        """
        if self.state != CircuitState.OPEN:
            return False

        if not self.last_failure_time:
            return True

        time_since_failure = (datetime.now() - self.last_failure_time).total_seconds()
        return time_since_failure >= self.recovery_timeout

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        サーキットブレーカー経由で関数を呼び出し

        Args:
            func: 実行する関数
            *args: 関数の位置引数
            **kwargs: 関数のキーワード引数

        Returns:
            関数の実行結果

        Raises:
            CircuitBreakerOpenError: サーキットが開いている場合
            その他: 関数実行中のエラー
        """
        # リセットを試みる
        if self._should_attempt_reset():
            logger.info("Attempting circuit reset (HALF_OPEN)")
            self.state = CircuitState.HALF_OPEN

        # サーキットが開いている場合はエラー
        if self.state == CircuitState.OPEN:
            logger.error("Circuit breaker is OPEN, rejecting call")
            raise CircuitBreakerOpenError(
                f"Circuit breaker is open. Last failure: {self.last_failure_time}"
            )

        try:
            # 関数を実行
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            # 成功した場合
            self._on_success()
            return result

        except self.expected_exception as e:
            # 期待される例外が発生した場合
            self._on_failure()
            raise

    def _on_success(self) -> None:
        """成功時の処理"""
        if self.state == CircuitState.HALF_OPEN:
            logger.info("Circuit recovery successful, closing circuit")
            self.state = CircuitState.CLOSED
            self.failure_count = 0
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def _on_failure(self) -> None:
        """失敗時の処理"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        logger.warning(
            f"Failure recorded: count={self.failure_count}/{self.failure_threshold}"
        )

        if self.failure_count >= self.failure_threshold:
            logger.error("Failure threshold reached, opening circuit")
            self.state = CircuitState.OPEN

    def get_state(self) -> Dict[str, Any]:
        """
        現在の状態を取得

        Returns:
            状態情報
        """
        return {
            "state": self.state.value,
            "failure_count": self.failure_count,
            "failure_threshold": self.failure_threshold,
            "last_failure_time": self.last_failure_time.isoformat() if self.last_failure_time else None,
            "recovery_timeout": self.recovery_timeout
        }


class CircuitBreakerOpenError(Exception):
    """サーキットブレーカーが開いている場合のエラー"""
    pass


class FallbackHandler:
    """
    フォールバック処理クラス
    エラー時の代替動作を提供
    """

    def __init__(self):
        """初期化"""
        self.fallback_strategies: Dict[str, Callable] = {}
        logger.info("FallbackHandler initialized")

    def register_fallback(
        self,
        operation_name: str,
        fallback_func: Callable
    ) -> None:
        """
        フォールバック戦略を登録

        Args:
            operation_name: 操作名
            fallback_func: フォールバック関数
        """
        self.fallback_strategies[operation_name] = fallback_func
        logger.info(f"Fallback registered for operation: {operation_name}")

    async def execute_with_fallback(
        self,
        operation_name: str,
        primary_func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """
        フォールバック付きで関数を実行

        Args:
            operation_name: 操作名
            primary_func: 主要な関数
            *args: 関数の位置引数
            **kwargs: 関数のキーワード引数

        Returns:
            関数の実行結果、またはフォールバックの結果
        """
        try:
            # 主要な関数を実行
            if asyncio.iscoroutinefunction(primary_func):
                result = await primary_func(*args, **kwargs)
            else:
                result = primary_func(*args, **kwargs)

            return result

        except Exception as e:
            logger.warning(
                f"Primary operation '{operation_name}' failed: {str(e)}, "
                f"attempting fallback"
            )

            # フォールバックを試みる
            if operation_name in self.fallback_strategies:
                try:
                    fallback_func = self.fallback_strategies[operation_name]

                    if asyncio.iscoroutinefunction(fallback_func):
                        result = await fallback_func(*args, **kwargs)
                    else:
                        result = fallback_func(*args, **kwargs)

                    logger.info(f"Fallback successful for operation: {operation_name}")
                    return result

                except Exception as fallback_error:
                    logger.error(
                        f"Fallback also failed for operation '{operation_name}': "
                        f"{str(fallback_error)}"
                    )
                    raise

            else:
                logger.error(f"No fallback registered for operation: {operation_name}")
                raise


class ErrorTracker:
    """
    エラー追跡クラス
    エラーの記録と分析
    """

    def __init__(self, max_records: int = 1000):
        """
        初期化

        Args:
            max_records: 保持する最大レコード数
        """
        self.max_records = max_records
        self.error_records: List[ErrorRecord] = []
        logger.info(f"ErrorTracker initialized with max_records={max_records}")

    def record_error(
        self,
        error: Exception,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context: Optional[Dict[str, Any]] = None
    ) -> ErrorRecord:
        """
        エラーを記録

        Args:
            error: 発生したエラー
            severity: エラーの重要度
            context: コンテキスト情報

        Returns:
            エラーレコード
        """
        record = ErrorRecord(
            error_type=type(error).__name__,
            error_message=str(error),
            severity=severity,
            stack_trace=traceback.format_exc(),
            context=context or {}
        )

        self.error_records.append(record)

        # レコード数の制限
        if len(self.error_records) > self.max_records:
            self.error_records.pop(0)

        logger.error(
            f"Error recorded: {record.error_type} - {record.error_message} "
            f"(severity: {severity.name})"
        )

        return record

    def get_error_statistics(
        self,
        time_range: Optional[timedelta] = None
    ) -> Dict[str, Any]:
        """
        エラー統計を取得

        Args:
            time_range: 統計の時間範囲

        Returns:
            統計情報
        """
        if not self.error_records:
            return {"message": "No error records"}

        # 時間範囲でフィルタ
        if time_range:
            cutoff_time = datetime.now() - time_range
            filtered_records = [
                r for r in self.error_records
                if r.timestamp >= cutoff_time
            ]
        else:
            filtered_records = self.error_records

        if not filtered_records:
            return {"message": "No errors in specified time range"}

        # エラータイプ別の集計
        error_types = {}
        for record in filtered_records:
            error_types[record.error_type] = error_types.get(record.error_type, 0) + 1

        # 重要度別の集計
        severity_counts = {}
        for record in filtered_records:
            severity_name = record.severity.name
            severity_counts[severity_name] = severity_counts.get(severity_name, 0) + 1

        return {
            "total_errors": len(filtered_records),
            "error_types": error_types,
            "severity_counts": severity_counts,
            "most_common_error": max(error_types.items(), key=lambda x: x[1])[0],
            "time_range": str(time_range) if time_range else "all_time"
        }

    def get_recent_errors(self, count: int = 10) -> List[ErrorRecord]:
        """
        最近のエラーを取得

        Args:
            count: 取得するエラー数

        Returns:
            エラーレコードのリスト
        """
        return sorted(
            self.error_records,
            key=lambda r: r.timestamp,
            reverse=True
        )[:count]


class ErrorHandlingFramework:
    """
    エラーハンドリングフレームワークのメインクラス
    リトライ、サーキットブレーカー、フォールバックを統合管理
    """

    def __init__(
        self,
        max_retries: int = 3,
        circuit_failure_threshold: int = 5,
        circuit_recovery_timeout: float = 60.0
    ):
        """
        初期化

        Args:
            max_retries: 最大リトライ回数
            circuit_failure_threshold: サーキットブレーカーの閾値
            circuit_recovery_timeout: サーキットブレーカーの回復タイムアウト
        """
        self.retry_strategy = RetryStrategy(max_retries=max_retries)
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=circuit_failure_threshold,
            recovery_timeout=circuit_recovery_timeout
        )
        self.fallback_handler = FallbackHandler()
        self.error_tracker = ErrorTracker()

        logger.info("ErrorHandlingFramework initialized")

    async def execute_safely(
        self,
        operation_name: str,
        func: Callable,
        *args,
        fallback_func: Optional[Callable] = None,
        use_circuit_breaker: bool = True,
        use_retry: bool = True,
        error_severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        **kwargs
    ) -> Any:
        """
        安全に関数を実行（すべての保護機構を適用）

        Args:
            operation_name: 操作名
            func: 実行する関数
            *args: 関数の位置引数
            fallback_func: フォールバック関数
            use_circuit_breaker: サーキットブレーカーを使用するか
            use_retry: リトライを使用するか
            error_severity: エラーの重要度
            **kwargs: 関数のキーワード引数

        Returns:
            関数の実行結果
        """
        # フォールバックを登録
        if fallback_func:
            self.fallback_handler.register_fallback(operation_name, fallback_func)

        async def protected_execution():
            """保護された実行"""
            if use_circuit_breaker:
                return await self.circuit_breaker.call(func, *args, **kwargs)
            else:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)

        try:
            # リトライを使用
            if use_retry:
                result = await self.retry_strategy.execute_with_retry(
                    protected_execution
                )
            else:
                result = await protected_execution()

            return result

        except Exception as e:
            # エラーを記録
            self.error_tracker.record_error(
                e,
                severity=error_severity,
                context={
                    "operation_name": operation_name,
                    "use_circuit_breaker": use_circuit_breaker,
                    "use_retry": use_retry
                }
            )

            # フォールバックを試みる
            if fallback_func:
                return await self.fallback_handler.execute_with_fallback(
                    operation_name,
                    func,
                    *args,
                    **kwargs
                )

            raise

    def get_health_status(self) -> Dict[str, Any]:
        """
        システムの健全性ステータスを取得

        Returns:
            健全性ステータス
        """
        error_stats = self.error_tracker.get_error_statistics(
            time_range=timedelta(hours=1)
        )

        circuit_state = self.circuit_breaker.get_state()

        recent_errors = self.error_tracker.get_recent_errors(count=5)

        return {
            "circuit_breaker": circuit_state,
            "error_statistics": error_stats,
            "recent_errors": [
                {
                    "type": e.error_type,
                    "message": e.error_message,
                    "timestamp": e.timestamp.isoformat(),
                    "severity": e.severity.name
                }
                for e in recent_errors
            ]
        }


# 使用例
async def main():
    """使用例のデモンストレーション"""

    framework = ErrorHandlingFramework(
        max_retries=3,
        circuit_failure_threshold=3,
        circuit_recovery_timeout=10.0
    )

    # テスト用の関数
    call_count = 0

    async def unreliable_api_call(should_fail: bool = False):
        """不安定なAPI呼び出しをシミュレート"""
        nonlocal call_count
        call_count += 1

        print(f"API call attempt #{call_count}")

        if should_fail:
            raise Exception("API call failed")

        return {"status": "success", "data": "test data"}

    async def fallback_function(*args, **kwargs):
        """フォールバック関数"""
        print("Using fallback function")
        return {"status": "fallback", "data": "cached data"}

    # テスト1: 成功するケース
    print("\n=== テスト1: 成功するAPI呼び出し ===")
    try:
        result = await framework.execute_safely(
            operation_name="api_call",
            func=unreliable_api_call,
            should_fail=False
        )
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

    # テスト2: リトライで成功
    print("\n=== テスト2: リトライテスト ===")
    call_count = 0
    retry_test_calls = 0

    async def sometimes_fails():
        nonlocal retry_test_calls
        retry_test_calls += 1
        if retry_test_calls < 3:
            raise Exception("Temporary failure")
        return {"status": "success after retries"}

    try:
        result = await framework.execute_safely(
            operation_name="retry_test",
            func=sometimes_fails,
            use_circuit_breaker=False
        )
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

    # テスト3: フォールバック
    print("\n=== テスト3: フォールバックテスト ===")
    try:
        result = await framework.execute_safely(
            operation_name="fallback_test",
            func=unreliable_api_call,
            should_fail=True,
            fallback_func=fallback_function,
            use_circuit_breaker=False,
            use_retry=False
        )
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

    # 健全性ステータスの表示
    print("\n=== システム健全性ステータス ===")
    health = framework.get_health_status()
    print(json.dumps(health, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    import json
    asyncio.run(main())
