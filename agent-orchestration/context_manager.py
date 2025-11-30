"""
コンテキスト管理ユーティリティ
トークン使用量追跡、コンテキストウィンドウ最適化、動的コンテキストロード

このモジュールは、AIエージェントのコンテキスト管理を最適化し、
トークン使用量を効率的に管理します。
"""

import logging
import tiktoken
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import deque
import json
import hashlib

logger = logging.getLogger(__name__)


@dataclass
class Message:
    """メッセージの定義"""
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    token_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ContextWindow:
    """コンテキストウィンドウの定義"""
    messages: deque = field(default_factory=deque)
    max_tokens: int = 200000  # Claude Sonnet 4.5のデフォルト
    current_tokens: int = 0
    system_prompt: Optional[str] = None
    system_prompt_tokens: int = 0


class TokenCounter:
    """
    トークンカウンター
    各モデルに応じたトークン数を正確にカウント
    """

    def __init__(self):
        """初期化"""
        self.encoders = {}
        self._initialize_encoders()

    def _initialize_encoders(self):
        """エンコーダーの初期化"""
        try:
            # GPT-4用
            self.encoders["gpt-4"] = tiktoken.encoding_for_model("gpt-4")
            # GPT-3.5用
            self.encoders["gpt-3.5-turbo"] = tiktoken.encoding_for_model("gpt-3.5-turbo")
            # Claude用（GPT-4のエンコーダーを近似として使用）
            self.encoders["claude"] = tiktoken.encoding_for_model("gpt-4")
        except Exception as e:
            logger.warning(f"Failed to initialize some encoders: {e}")
            # フォールバック: cl100k_baseを使用
            self.encoders["default"] = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str, model: str = "claude") -> int:
        """
        テキストのトークン数をカウント

        Args:
            text: カウント対象のテキスト
            model: モデル名

        Returns:
            トークン数
        """
        try:
            encoder = self.encoders.get(model, self.encoders.get("default"))
            if encoder:
                return len(encoder.encode(text))
            else:
                # エンコーダーがない場合は文字数ベースで推定（1トークン≈4文字）
                return len(text) // 4
        except Exception as e:
            logger.error(f"Error counting tokens: {e}")
            return len(text) // 4

    def count_message_tokens(
        self,
        messages: List[Dict[str, str]],
        model: str = "claude"
    ) -> int:
        """
        メッセージリストの総トークン数をカウント

        Args:
            messages: メッセージリスト
            model: モデル名

        Returns:
            総トークン数
        """
        total_tokens = 0

        for message in messages:
            # メッセージのオーバーヘッド（role等）
            total_tokens += 4

            # コンテンツのトークン数
            content = message.get("content", "")
            total_tokens += self.count_tokens(content, model)

        # APIコールのオーバーヘッド
        total_tokens += 3

        return total_tokens


class ContextOptimizer:
    """
    コンテキスト最適化クラス
    コンテキストウィンドウを効率的に管理し、重要な情報を保持
    """

    def __init__(self, token_counter: TokenCounter):
        """
        初期化

        Args:
            token_counter: トークンカウンター
        """
        self.token_counter = token_counter

    def prioritize_messages(
        self,
        messages: List[Message],
        max_tokens: int
    ) -> List[Message]:
        """
        メッセージの優先順位付けと選択

        Args:
            messages: メッセージリスト
            max_tokens: 最大トークン数

        Returns:
            優先順位付けされたメッセージリスト
        """
        # システムメッセージは常に保持
        system_messages = [m for m in messages if m.role == "system"]
        other_messages = [m for m in messages if m.role != "system"]

        # 最新のメッセージを優先
        other_messages.reverse()

        selected_messages = []
        current_tokens = sum(m.token_count for m in system_messages)

        # システムメッセージを追加
        selected_messages.extend(system_messages)

        # トークン制限内で他のメッセージを追加
        for message in other_messages:
            if current_tokens + message.token_count <= max_tokens:
                selected_messages.append(message)
                current_tokens += message.token_count
            else:
                # 要約して追加を試みる
                summarized = self._summarize_message(message, max_tokens - current_tokens)
                if summarized:
                    selected_messages.append(summarized)
                    current_tokens += summarized.token_count
                break

        # 元の順序に戻す
        return sorted(selected_messages, key=lambda m: m.timestamp)

    def _summarize_message(self, message: Message, max_tokens: int) -> Optional[Message]:
        """
        メッセージを要約

        Args:
            message: 要約対象のメッセージ
            max_tokens: 最大トークン数

        Returns:
            要約されたメッセージ、または要約できない場合はNone
        """
        if max_tokens < 50:
            return None

        # 簡易的な要約（最初と最後の部分を保持）
        content = message.content
        tokens_per_part = max_tokens // 2

        encoder = self.token_counter.encoders.get("default")
        if encoder:
            tokens = encoder.encode(content)
            start_tokens = tokens[:tokens_per_part]
            end_tokens = tokens[-tokens_per_part:]

            summarized_content = (
                encoder.decode(start_tokens) +
                "\n... [中略] ...\n" +
                encoder.decode(end_tokens)
            )
        else:
            # エンコーダーがない場合は文字数ベース
            chars_per_part = max_tokens * 4 // 2
            summarized_content = (
                content[:chars_per_part] +
                "\n... [中略] ...\n" +
                content[-chars_per_part:]
            )

        return Message(
            role=message.role,
            content=summarized_content,
            timestamp=message.timestamp,
            token_count=self.token_counter.count_tokens(summarized_content),
            metadata={**message.metadata, "summarized": True}
        )

    def compress_context(
        self,
        messages: List[Message],
        target_reduction: float = 0.3
    ) -> List[Message]:
        """
        コンテキストを圧縮

        Args:
            messages: メッセージリスト
            target_reduction: 目標削減率（0.3 = 30%削減）

        Returns:
            圧縮されたメッセージリスト
        """
        if not messages:
            return messages

        total_tokens = sum(m.token_count for m in messages)
        target_tokens = int(total_tokens * (1 - target_reduction))

        # 優先順位付けして選択
        return self.prioritize_messages(messages, target_tokens)


class DynamicContextLoader:
    """
    動的コンテキストローダー
    必要に応じてコンテキストを動的にロード・アンロード
    """

    def __init__(
        self,
        token_counter: TokenCounter,
        cache_size: int = 100
    ):
        """
        初期化

        Args:
            token_counter: トークンカウンター
            cache_size: キャッシュサイズ
        """
        self.token_counter = token_counter
        self.cache: Dict[str, Any] = {}
        self.cache_size = cache_size
        self.access_history: deque = deque(maxlen=cache_size)

    def _generate_cache_key(self, content: str) -> str:
        """
        キャッシュキーを生成

        Args:
            content: コンテンツ

        Returns:
            キャッシュキー
        """
        return hashlib.md5(content.encode()).hexdigest()

    def load_context(
        self,
        context_id: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        コンテキストをロード

        Args:
            context_id: コンテキストID
            content: コンテンツ
            metadata: メタデータ
        """
        cache_key = self._generate_cache_key(content)

        # キャッシュサイズを超える場合は古いエントリを削除
        if len(self.cache) >= self.cache_size:
            oldest_key = self.access_history.popleft()
            if oldest_key in self.cache:
                del self.cache[oldest_key]

        # キャッシュに追加
        self.cache[cache_key] = {
            "context_id": context_id,
            "content": content,
            "token_count": self.token_counter.count_tokens(content),
            "metadata": metadata or {},
            "loaded_at": datetime.now(),
            "access_count": 1
        }

        self.access_history.append(cache_key)
        logger.info(f"Context {context_id} loaded to cache")

    def get_context(self, context_id: str) -> Optional[Dict[str, Any]]:
        """
        コンテキストを取得

        Args:
            context_id: コンテキストID

        Returns:
            コンテキスト、または見つからない場合はNone
        """
        for cache_key, context in self.cache.items():
            if context["context_id"] == context_id:
                context["access_count"] += 1
                self.access_history.append(cache_key)
                logger.info(f"Context {context_id} retrieved from cache")
                return context

        logger.warning(f"Context {context_id} not found in cache")
        return None

    def unload_context(self, context_id: str) -> bool:
        """
        コンテキストをアンロード

        Args:
            context_id: コンテキストID

        Returns:
            成功した場合True
        """
        for cache_key, context in list(self.cache.items()):
            if context["context_id"] == context_id:
                del self.cache[cache_key]
                logger.info(f"Context {context_id} unloaded from cache")
                return True

        return False

    def get_cache_statistics(self) -> Dict[str, Any]:
        """
        キャッシュ統計を取得

        Returns:
            キャッシュ統計
        """
        if not self.cache:
            return {"message": "Cache is empty"}

        total_tokens = sum(c["token_count"] for c in self.cache.values())
        total_access = sum(c["access_count"] for c in self.cache.values())

        return {
            "cache_size": len(self.cache),
            "max_cache_size": self.cache_size,
            "total_tokens": total_tokens,
            "total_access_count": total_access,
            "avg_tokens_per_context": total_tokens / len(self.cache),
            "avg_access_per_context": total_access / len(self.cache)
        }


class ContextManager:
    """
    コンテキストマネージャーのメインクラス
    トークン使用量追跡、最適化、動的ロードを統合管理
    """

    def __init__(
        self,
        max_tokens: int = 200000,
        model: str = "claude",
        cache_size: int = 100
    ):
        """
        初期化

        Args:
            max_tokens: 最大トークン数
            model: モデル名
            cache_size: キャッシュサイズ
        """
        self.token_counter = TokenCounter()
        self.optimizer = ContextOptimizer(self.token_counter)
        self.dynamic_loader = DynamicContextLoader(self.token_counter, cache_size)

        self.context_window = ContextWindow(max_tokens=max_tokens)
        self.model = model

        self.token_usage_history: List[Dict[str, Any]] = []

        logger.info(f"ContextManager initialized with max_tokens={max_tokens}, model={model}")

    def add_message(
        self,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Message:
        """
        メッセージを追加

        Args:
            role: ロール（user, assistant, system）
            content: コンテンツ
            metadata: メタデータ

        Returns:
            追加されたメッセージ
        """
        token_count = self.token_counter.count_tokens(content, self.model)

        message = Message(
            role=role,
            content=content,
            token_count=token_count,
            metadata=metadata or {}
        )

        # コンテキストウィンドウに追加
        self.context_window.messages.append(message)
        self.context_window.current_tokens += token_count

        # トークン使用量を記録
        self._record_token_usage(token_count)

        logger.info(
            f"Message added: role={role}, tokens={token_count}, "
            f"total_tokens={self.context_window.current_tokens}"
        )

        # トークン制限を超えた場合は最適化
        if self.context_window.current_tokens > self.context_window.max_tokens:
            self._optimize_context()

        return message

    def set_system_prompt(self, prompt: str) -> None:
        """
        システムプロンプトを設定

        Args:
            prompt: システムプロンプト
        """
        self.context_window.system_prompt = prompt
        self.context_window.system_prompt_tokens = self.token_counter.count_tokens(
            prompt,
            self.model
        )

        logger.info(f"System prompt set: tokens={self.context_window.system_prompt_tokens}")

    def _optimize_context(self) -> None:
        """コンテキストを最適化"""
        logger.info("Optimizing context due to token limit")

        messages = list(self.context_window.messages)

        # システムプロンプトのトークン数を考慮
        available_tokens = (
            self.context_window.max_tokens -
            self.context_window.system_prompt_tokens
        )

        # メッセージを最適化
        optimized_messages = self.optimizer.prioritize_messages(
            messages,
            available_tokens
        )

        # コンテキストウィンドウを更新
        self.context_window.messages = deque(optimized_messages)
        self.context_window.current_tokens = sum(
            m.token_count for m in optimized_messages
        ) + self.context_window.system_prompt_tokens

        logger.info(f"Context optimized: new_token_count={self.context_window.current_tokens}")

    def _record_token_usage(self, token_count: int) -> None:
        """
        トークン使用量を記録

        Args:
            token_count: トークン数
        """
        self.token_usage_history.append({
            "timestamp": datetime.now(),
            "token_count": token_count,
            "cumulative_tokens": self.context_window.current_tokens
        })

    def get_messages_for_api(self) -> List[Dict[str, str]]:
        """
        API用のメッセージリストを取得

        Returns:
            メッセージリスト
        """
        messages = []

        # システムプロンプトを追加
        if self.context_window.system_prompt:
            messages.append({
                "role": "system",
                "content": self.context_window.system_prompt
            })

        # 他のメッセージを追加
        for message in self.context_window.messages:
            messages.append({
                "role": message.role,
                "content": message.content
            })

        return messages

    def get_token_usage_statistics(
        self,
        time_range: Optional[timedelta] = None
    ) -> Dict[str, Any]:
        """
        トークン使用量統計を取得

        Args:
            time_range: 統計の時間範囲（Noneの場合は全期間）

        Returns:
            統計情報
        """
        if not self.token_usage_history:
            return {"message": "No token usage history"}

        # 時間範囲でフィルタ
        if time_range:
            cutoff_time = datetime.now() - time_range
            filtered_history = [
                h for h in self.token_usage_history
                if h["timestamp"] >= cutoff_time
            ]
        else:
            filtered_history = self.token_usage_history

        if not filtered_history:
            return {"message": "No data in specified time range"}

        total_tokens = sum(h["token_count"] for h in filtered_history)
        avg_tokens = total_tokens / len(filtered_history)

        return {
            "total_messages": len(filtered_history),
            "total_tokens": total_tokens,
            "avg_tokens_per_message": avg_tokens,
            "current_context_tokens": self.context_window.current_tokens,
            "max_tokens": self.context_window.max_tokens,
            "utilization_rate": (
                self.context_window.current_tokens /
                self.context_window.max_tokens * 100
            ),
            "time_range": str(time_range) if time_range else "all_time"
        }

    def clear_context(self) -> None:
        """コンテキストをクリア"""
        self.context_window.messages.clear()
        self.context_window.current_tokens = self.context_window.system_prompt_tokens
        logger.info("Context cleared")


# 使用例
def main():
    """使用例のデモンストレーション"""

    # コンテキストマネージャーの初期化
    context_manager = ContextManager(
        max_tokens=10000,  # デモ用に小さい値
        model="claude",
        cache_size=50
    )

    # システムプロンプトを設定
    context_manager.set_system_prompt(
        "あなたは親切で知識豊富なAIアシスタントです。"
    )

    # メッセージを追加
    print("\n=== メッセージ追加テスト ===")

    messages_to_add = [
        ("user", "Pythonでフィボナッチ数列を計算する関数を作成してください。"),
        ("assistant", "もちろんです。再帰的な実装とイテレーティブな実装の両方を提供します..."),
        ("user", "ありがとうございます。では、この関数のユニットテストも書いてください。"),
        ("assistant", "pytestを使用したユニットテストの例を示します...")
    ]

    for role, content in messages_to_add:
        message = context_manager.add_message(role, content)
        print(f"Added: {role} - {len(content)} chars, {message.token_count} tokens")

    # 現在のコンテキスト情報
    print(f"\n現在のトークン数: {context_manager.context_window.current_tokens}")
    print(f"メッセージ数: {len(context_manager.context_window.messages)}")

    # トークン使用量統計
    print("\n=== トークン使用量統計 ===")
    stats = context_manager.get_token_usage_statistics()
    for key, value in stats.items():
        if isinstance(value, float):
            print(f"{key}: {value:.2f}")
        else:
            print(f"{key}: {value}")

    # 動的コンテキストローダーのテスト
    print("\n=== 動的コンテキストローダーテスト ===")

    context_manager.dynamic_loader.load_context(
        context_id="code-snippet-1",
        content="def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
        metadata={"language": "python", "topic": "fibonacci"}
    )

    retrieved = context_manager.dynamic_loader.get_context("code-snippet-1")
    if retrieved:
        print(f"取得したコンテキスト: {retrieved['context_id']}")
        print(f"トークン数: {retrieved['token_count']}")
        print(f"アクセス回数: {retrieved['access_count']}")

    # キャッシュ統計
    print("\n=== キャッシュ統計 ===")
    cache_stats = context_manager.dynamic_loader.get_cache_statistics()
    for key, value in cache_stats.items():
        if isinstance(value, float):
            print(f"{key}: {value:.2f}")
        else:
            print(f"{key}: {value}")

    # API用のメッセージリストを取得
    print("\n=== API用メッセージリスト ===")
    api_messages = context_manager.get_messages_for_api()
    print(f"総メッセージ数: {len(api_messages)}")
    for i, msg in enumerate(api_messages[:3]):  # 最初の3件のみ表示
        print(f"\nMessage {i+1}:")
        print(f"Role: {msg['role']}")
        print(f"Content preview: {msg['content'][:100]}...")


if __name__ == "__main__":
    main()
