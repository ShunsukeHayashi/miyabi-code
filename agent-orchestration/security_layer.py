"""
セキュリティレイヤー
入出力ガードレール、権限チェッカー、監査ログ

このモジュールは、AIエージェントの入出力を安全に管理し、
セキュリティリスクを軽減するための機能を提供します。
"""

import logging
import re
import json
import hashlib
from typing import List, Dict, Optional, Any, Set, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import secrets

logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    """セキュリティレベル"""
    PUBLIC = 1
    INTERNAL = 2
    CONFIDENTIAL = 3
    RESTRICTED = 4


class ActionType(Enum):
    """アクション種別"""
    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    DELETE = "delete"
    ADMIN = "admin"


@dataclass
class AuditLogEntry:
    """監査ログエントリ"""
    timestamp: datetime
    user_id: str
    action: str
    resource: str
    result: str  # "success" or "denied"
    details: Dict[str, Any] = field(default_factory=dict)
    security_level: Optional[SecurityLevel] = None


class InputGuardrail:
    """
    入力ガードレールクラス
    危険な入力をフィルタリング
    """

    def __init__(self):
        """初期化"""
        # 危険なパターン
        self.dangerous_patterns = [
            # SQLインジェクション
            r"(?i)(union\s+select|drop\s+table|insert\s+into|delete\s+from)",
            # コマンドインジェクション
            r"(?i)(\||;|&&|\$\(|\`)",
            # パストラバーサル
            r"\.\./|\.\.\\",
            # XXE攻撃
            r"<!ENTITY|<!DOCTYPE",
            # スクリプトインジェクション
            r"<script[^>]*>.*?</script>",
        ]

        # 機密情報パターン
        self.sensitive_patterns = [
            # APIキー
            r"(?i)(api[_-]?key|apikey)[\s:=]+['\"]?[\w-]{20,}",
            # パスワード
            r"(?i)(password|passwd|pwd)[\s:=]+['\"]?[\w@#$%^&*]{6,}",
            # トークン
            r"(?i)(token|bearer)[\s:=]+['\"]?[\w.-]{20,}",
            # クレジットカード番号
            r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
            # SSH秘密鍵
            r"-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----",
        ]

        logger.info("InputGuardrail initialized")

    def validate_input(
        self,
        input_text: str,
        allow_code: bool = False
    ) -> Dict[str, Any]:
        """
        入力を検証

        Args:
            input_text: 検証する入力テキスト
            allow_code: コード入力を許可するか

        Returns:
            検証結果
        """
        issues = []

        # 危険なパターンをチェック
        for pattern in self.dangerous_patterns:
            if re.search(pattern, input_text):
                issues.append({
                    "type": "dangerous_pattern",
                    "pattern": pattern,
                    "severity": "high"
                })

        # 機密情報をチェック
        for pattern in self.sensitive_patterns:
            matches = re.findall(pattern, input_text)
            if matches:
                issues.append({
                    "type": "sensitive_data",
                    "pattern": pattern,
                    "match_count": len(matches),
                    "severity": "critical"
                })

        # 入力長チェック（DoS対策）
        if len(input_text) > 100000:
            issues.append({
                "type": "excessive_length",
                "length": len(input_text),
                "severity": "medium"
            })

        is_safe = len(issues) == 0

        result = {
            "is_safe": is_safe,
            "issues": issues,
            "input_length": len(input_text)
        }

        if not is_safe:
            logger.warning(f"Input validation failed: {len(issues)} issues found")

        return result

    def sanitize_input(self, input_text: str) -> str:
        """
        入力をサニタイズ

        Args:
            input_text: サニタイズする入力テキスト

        Returns:
            サニタイズされたテキスト
        """
        sanitized = input_text

        # HTMLタグを除去
        sanitized = re.sub(r"<[^>]*>", "", sanitized)

        # 特殊文字をエスケープ
        special_chars = {
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            '"': "&quot;",
            "'": "&#x27;",
        }

        for char, escaped in special_chars.items():
            sanitized = sanitized.replace(char, escaped)

        return sanitized

    def mask_sensitive_data(self, text: str) -> str:
        """
        機密データをマスク

        Args:
            text: マスク対象のテキスト

        Returns:
            マスクされたテキスト
        """
        masked = text

        # 機密情報パターンをマスク
        for pattern in self.sensitive_patterns:
            masked = re.sub(
                pattern,
                lambda m: m.group(0)[:4] + "*" * (len(m.group(0)) - 8) + m.group(0)[-4:],
                masked
            )

        return masked


class OutputGuardrail:
    """
    出力ガードレールクラス
    出力の安全性を確保
    """

    def __init__(self):
        """初期化"""
        # 禁止ワードリスト
        self.forbidden_words = [
            "password",
            "secret_key",
            "api_key",
            "private_key",
            "access_token",
        ]

        # 機密情報パターン（入力ガードレールと同じ）
        self.sensitive_patterns = [
            r"(?i)(api[_-]?key|apikey)[\s:=]+['\"]?[\w-]{20,}",
            r"(?i)(password|passwd|pwd)[\s:=]+['\"]?[\w@#$%^&*]{6,}",
            r"(?i)(token|bearer)[\s:=]+['\"]?[\w.-]{20,}",
            r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
            r"-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----",
        ]

        logger.info("OutputGuardrail initialized")

    def validate_output(
        self,
        output_text: str,
        security_level: SecurityLevel = SecurityLevel.PUBLIC
    ) -> Dict[str, Any]:
        """
        出力を検証

        Args:
            output_text: 検証する出力テキスト
            security_level: セキュリティレベル

        Returns:
            検証結果
        """
        issues = []

        # 機密情報をチェック
        for pattern in self.sensitive_patterns:
            matches = re.findall(pattern, output_text)
            if matches:
                issues.append({
                    "type": "sensitive_data_leak",
                    "pattern": pattern,
                    "match_count": len(matches),
                    "severity": "critical"
                })

        # 禁止ワードをチェック
        for word in self.forbidden_words:
            if word.lower() in output_text.lower():
                issues.append({
                    "type": "forbidden_word",
                    "word": word,
                    "severity": "high"
                })

        is_safe = len(issues) == 0

        result = {
            "is_safe": is_safe,
            "issues": issues,
            "output_length": len(output_text),
            "security_level": security_level.name
        }

        if not is_safe:
            logger.warning(f"Output validation failed: {len(issues)} issues found")

        return result

    def redact_output(self, output_text: str) -> str:
        """
        出力を編集（機密情報を削除）

        Args:
            output_text: 編集する出力テキスト

        Returns:
            編集されたテキスト
        """
        redacted = output_text

        # 機密情報パターンを編集
        for pattern in self.sensitive_patterns:
            redacted = re.sub(pattern, "[REDACTED]", redacted)

        # 禁止ワードを編集
        for word in self.forbidden_words:
            redacted = re.sub(
                rf"\b{word}\b",
                "[REDACTED]",
                redacted,
                flags=re.IGNORECASE
            )

        return redacted


class PermissionChecker:
    """
    権限チェッカークラス
    ユーザーの権限を管理
    """

    def __init__(self):
        """初期化"""
        # ユーザー権限マップ
        self.user_permissions: Dict[str, Set[ActionType]] = {}

        # ロールベースの権限
        self.role_permissions: Dict[str, Set[ActionType]] = {
            "admin": {
                ActionType.READ,
                ActionType.WRITE,
                ActionType.EXECUTE,
                ActionType.DELETE,
                ActionType.ADMIN
            },
            "developer": {
                ActionType.READ,
                ActionType.WRITE,
                ActionType.EXECUTE
            },
            "viewer": {
                ActionType.READ
            }
        }

        # ユーザーロールマップ
        self.user_roles: Dict[str, str] = {}

        logger.info("PermissionChecker initialized")

    def assign_role(self, user_id: str, role: str) -> None:
        """
        ユーザーにロールを割り当て

        Args:
            user_id: ユーザーID
            role: ロール名
        """
        if role not in self.role_permissions:
            raise ValueError(f"Unknown role: {role}")

        self.user_roles[user_id] = role
        logger.info(f"Role '{role}' assigned to user {user_id}")

    def grant_permission(
        self,
        user_id: str,
        permission: ActionType
    ) -> None:
        """
        ユーザーに権限を付与

        Args:
            user_id: ユーザーID
            permission: 権限
        """
        if user_id not in self.user_permissions:
            self.user_permissions[user_id] = set()

        self.user_permissions[user_id].add(permission)
        logger.info(f"Permission '{permission.value}' granted to user {user_id}")

    def revoke_permission(
        self,
        user_id: str,
        permission: ActionType
    ) -> None:
        """
        ユーザーの権限を取り消し

        Args:
            user_id: ユーザーID
            permission: 権限
        """
        if user_id in self.user_permissions:
            self.user_permissions[user_id].discard(permission)
            logger.info(f"Permission '{permission.value}' revoked from user {user_id}")

    def check_permission(
        self,
        user_id: str,
        required_permission: ActionType
    ) -> bool:
        """
        ユーザーの権限をチェック

        Args:
            user_id: ユーザーID
            required_permission: 必要な権限

        Returns:
            権限がある場合True
        """
        # ロールベースの権限をチェック
        if user_id in self.user_roles:
            role = self.user_roles[user_id]
            if required_permission in self.role_permissions[role]:
                return True

        # 個別の権限をチェック
        if user_id in self.user_permissions:
            if required_permission in self.user_permissions[user_id]:
                return True

        logger.warning(
            f"Permission denied: user {user_id} lacks '{required_permission.value}' permission"
        )
        return False

    def get_user_permissions(self, user_id: str) -> Set[ActionType]:
        """
        ユーザーの全権限を取得

        Args:
            user_id: ユーザーID

        Returns:
            権限のセット
        """
        permissions = set()

        # ロールベースの権限
        if user_id in self.user_roles:
            role = self.user_roles[user_id]
            permissions.update(self.role_permissions[role])

        # 個別の権限
        if user_id in self.user_permissions:
            permissions.update(self.user_permissions[user_id])

        return permissions


class AuditLogger:
    """
    監査ログクラス
    セキュリティイベントを記録
    """

    def __init__(self, log_file: Optional[str] = None):
        """
        初期化

        Args:
            log_file: ログファイルパス（Noneの場合はメモリのみ）
        """
        self.log_file = log_file
        self.log_entries: List[AuditLogEntry] = []

        logger.info(f"AuditLogger initialized with log_file={log_file}")

    def log_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        result: str,
        details: Optional[Dict[str, Any]] = None,
        security_level: Optional[SecurityLevel] = None
    ) -> None:
        """
        アクションをログに記録

        Args:
            user_id: ユーザーID
            action: アクション
            resource: リソース
            result: 結果（success/denied）
            details: 詳細情報
            security_level: セキュリティレベル
        """
        entry = AuditLogEntry(
            timestamp=datetime.now(),
            user_id=user_id,
            action=action,
            resource=resource,
            result=result,
            details=details or {},
            security_level=security_level
        )

        self.log_entries.append(entry)

        # ファイルに書き込み
        if self.log_file:
            self._write_to_file(entry)

        logger.info(
            f"Audit log: user={user_id}, action={action}, "
            f"resource={resource}, result={result}"
        )

    def _write_to_file(self, entry: AuditLogEntry) -> None:
        """
        ログエントリをファイルに書き込み

        Args:
            entry: ログエントリ
        """
        try:
            with open(self.log_file, "a") as f:
                log_line = json.dumps({
                    "timestamp": entry.timestamp.isoformat(),
                    "user_id": entry.user_id,
                    "action": entry.action,
                    "resource": entry.resource,
                    "result": entry.result,
                    "details": entry.details,
                    "security_level": entry.security_level.name if entry.security_level else None
                })
                f.write(log_line + "\n")
        except Exception as e:
            logger.error(f"Failed to write audit log to file: {e}")

    def get_logs(
        self,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        result: Optional[str] = None,
        limit: int = 100
    ) -> List[AuditLogEntry]:
        """
        ログエントリを取得

        Args:
            user_id: ユーザーIDでフィルタ
            action: アクションでフィルタ
            result: 結果でフィルタ
            limit: 最大取得件数

        Returns:
            フィルタされたログエントリ
        """
        filtered = self.log_entries

        if user_id:
            filtered = [e for e in filtered if e.user_id == user_id]

        if action:
            filtered = [e for e in filtered if e.action == action]

        if result:
            filtered = [e for e in filtered if e.result == result]

        # 最新のものから返す
        return sorted(
            filtered,
            key=lambda e: e.timestamp,
            reverse=True
        )[:limit]

    def get_statistics(self) -> Dict[str, Any]:
        """
        監査ログの統計を取得

        Returns:
            統計情報
        """
        if not self.log_entries:
            return {"message": "No audit logs"}

        total_actions = len(self.log_entries)
        success_count = len([e for e in self.log_entries if e.result == "success"])
        denied_count = len([e for e in self.log_entries if e.result == "denied"])

        # アクション別の集計
        action_counts = {}
        for entry in self.log_entries:
            action_counts[entry.action] = action_counts.get(entry.action, 0) + 1

        # ユーザー別の集計
        user_counts = {}
        for entry in self.log_entries:
            user_counts[entry.user_id] = user_counts.get(entry.user_id, 0) + 1

        return {
            "total_actions": total_actions,
            "success_count": success_count,
            "denied_count": denied_count,
            "success_rate": (success_count / total_actions * 100) if total_actions > 0 else 0,
            "action_counts": action_counts,
            "user_counts": user_counts,
            "most_active_user": max(user_counts.items(), key=lambda x: x[1])[0] if user_counts else None
        }


class SecurityLayer:
    """
    セキュリティレイヤーのメインクラス
    すべてのセキュリティ機能を統合管理
    """

    def __init__(self, log_file: Optional[str] = None):
        """
        初期化

        Args:
            log_file: 監査ログファイルパス
        """
        self.input_guardrail = InputGuardrail()
        self.output_guardrail = OutputGuardrail()
        self.permission_checker = PermissionChecker()
        self.audit_logger = AuditLogger(log_file=log_file)

        logger.info("SecurityLayer initialized")

    def process_input(
        self,
        user_id: str,
        input_text: str,
        required_permission: ActionType = ActionType.READ
    ) -> Dict[str, Any]:
        """
        入力を処理（検証と権限チェック）

        Args:
            user_id: ユーザーID
            input_text: 入力テキスト
            required_permission: 必要な権限

        Returns:
            処理結果
        """
        # 権限チェック
        has_permission = self.permission_checker.check_permission(
            user_id,
            required_permission
        )

        if not has_permission:
            self.audit_logger.log_action(
                user_id=user_id,
                action=f"input_{required_permission.value}",
                resource="input_processing",
                result="denied",
                details={"reason": "insufficient_permissions"}
            )

            return {
                "success": False,
                "error": "Insufficient permissions",
                "required_permission": required_permission.value
            }

        # 入力検証
        validation_result = self.input_guardrail.validate_input(input_text)

        if not validation_result["is_safe"]:
            self.audit_logger.log_action(
                user_id=user_id,
                action=f"input_{required_permission.value}",
                resource="input_processing",
                result="denied",
                details={
                    "reason": "unsafe_input",
                    "issues": validation_result["issues"]
                },
                security_level=SecurityLevel.RESTRICTED
            )

            return {
                "success": False,
                "error": "Input validation failed",
                "issues": validation_result["issues"]
            }

        # サニタイズ
        sanitized_input = self.input_guardrail.sanitize_input(input_text)

        # 成功をログに記録
        self.audit_logger.log_action(
            user_id=user_id,
            action=f"input_{required_permission.value}",
            resource="input_processing",
            result="success",
            details={"input_length": len(input_text)}
        )

        return {
            "success": True,
            "sanitized_input": sanitized_input,
            "validation_result": validation_result
        }

    def process_output(
        self,
        user_id: str,
        output_text: str,
        security_level: SecurityLevel = SecurityLevel.PUBLIC
    ) -> Dict[str, Any]:
        """
        出力を処理（検証と編集）

        Args:
            user_id: ユーザーID
            output_text: 出力テキスト
            security_level: セキュリティレベル

        Returns:
            処理結果
        """
        # 出力検証
        validation_result = self.output_guardrail.validate_output(
            output_text,
            security_level
        )

        if not validation_result["is_safe"]:
            # 機密情報を編集
            redacted_output = self.output_guardrail.redact_output(output_text)

            self.audit_logger.log_action(
                user_id=user_id,
                action="output_redacted",
                resource="output_processing",
                result="success",
                details={
                    "reason": "sensitive_data_detected",
                    "issues": validation_result["issues"]
                },
                security_level=security_level
            )

            return {
                "success": True,
                "output": redacted_output,
                "redacted": True,
                "validation_result": validation_result
            }

        # 成功をログに記録
        self.audit_logger.log_action(
            user_id=user_id,
            action="output_safe",
            resource="output_processing",
            result="success",
            details={"output_length": len(output_text)},
            security_level=security_level
        )

        return {
            "success": True,
            "output": output_text,
            "redacted": False,
            "validation_result": validation_result
        }

    def get_security_report(self) -> Dict[str, Any]:
        """
        セキュリティレポートを取得

        Returns:
            セキュリティレポート
        """
        audit_stats = self.audit_logger.get_statistics()
        recent_denied = self.audit_logger.get_logs(result="denied", limit=10)

        return {
            "audit_statistics": audit_stats,
            "recent_denied_actions": [
                {
                    "timestamp": e.timestamp.isoformat(),
                    "user_id": e.user_id,
                    "action": e.action,
                    "resource": e.resource,
                    "details": e.details
                }
                for e in recent_denied
            ]
        }


# 使用例
def main():
    """使用例のデモンストレーション"""

    # セキュリティレイヤーの初期化
    security = SecurityLayer(log_file="/tmp/audit.log")

    # ユーザー設定
    security.permission_checker.assign_role("user-001", "developer")
    security.permission_checker.assign_role("user-002", "viewer")

    print("=== テスト1: 安全な入力 ===")
    result = security.process_input(
        user_id="user-001",
        input_text="Create a Python function to calculate prime numbers",
        required_permission=ActionType.WRITE
    )
    print(f"Success: {result['success']}")
    if result['success']:
        print(f"Sanitized input: {result['sanitized_input'][:100]}")

    print("\n=== テスト2: 危険な入力 ===")
    result = security.process_input(
        user_id="user-001",
        input_text="SELECT * FROM users; DROP TABLE users;",
        required_permission=ActionType.WRITE
    )
    print(f"Success: {result['success']}")
    if not result['success']:
        print(f"Error: {result['error']}")
        print(f"Issues: {result.get('issues', [])}")

    print("\n=== テスト3: 権限不足 ===")
    result = security.process_input(
        user_id="user-002",  # viewerロール
        input_text="Write some code",
        required_permission=ActionType.WRITE
    )
    print(f"Success: {result['success']}")
    if not result['success']:
        print(f"Error: {result['error']}")

    print("\n=== テスト4: 機密情報を含む出力 ===")
    result = security.process_output(
        user_id="user-001",
        output_text="Here is your API key: sk-1234567890abcdefghijklmnopqrstuvwxyz",
        security_level=SecurityLevel.PUBLIC
    )
    print(f"Success: {result['success']}")
    print(f"Redacted: {result['redacted']}")
    print(f"Output: {result['output']}")

    print("\n=== テスト5: 安全な出力 ===")
    result = security.process_output(
        user_id="user-001",
        output_text="def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
        security_level=SecurityLevel.PUBLIC
    )
    print(f"Success: {result['success']}")
    print(f"Redacted: {result['redacted']}")

    # セキュリティレポート
    print("\n=== セキュリティレポート ===")
    report = security.get_security_report()
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    import json
    main()
