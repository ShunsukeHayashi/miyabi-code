#!/usr/bin/env python3
"""
social-stream-client.py

Social Stream Ninja WebSocketクライアント - Miyabi Narration System統合

使用例:
    # セッション開始
    python3 social-stream-client.py --start --session miyabi-narrate

    # メッセージ送信
    python3 social-stream-client.py --send "霊夢: こんにちは！"

    # 外部コンテンツ送信
    python3 social-stream-client.py --send-content '{"chatname": "霊夢", "chatmessage": "..."}'

    # セッション情報表示
    python3 social-stream-client.py --info

    # セッション終了
    python3 social-stream-client.py --stop
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Optional

try:
    import websocket
except ImportError:
    print("❌ エラー: websocket-client がインストールされていません")
    print("インストール: pip3 install websocket-client")
    sys.exit(1)


class SocialStreamClient:
    """Social Stream Ninja WebSocketクライアント"""

    def __init__(self, session_id: str, channel: int = 1):
        self.session_id = session_id
        self.channel = channel
        self.ws_url = f"wss://io.socialstream.ninja/join/{session_id}/{channel}/{channel}"
        self.ws: Optional[websocket.WebSocket] = None
        self.session_file = Path(".miyabi-stream-session")

    def connect(self) -> bool:
        """WebSocket接続を確立"""
        try:
            print(f"🔌 Connecting to Social Stream Ninja...")
            print(f"   Session: {self.session_id}")
            print(f"   Channel: {self.channel}")
            print(f"   URL: {self.ws_url}")

            self.ws = websocket.create_connection(
                self.ws_url,
                timeout=10,
                enable_multithread=False
            )

            print(f"✅ Connected successfully!")

            # セッション情報を保存
            self._save_session()
            return True

        except Exception as e:
            print(f"❌ Connection failed: {e}", file=sys.stderr)
            return False

    def disconnect(self):
        """WebSocket接続を切断"""
        if self.ws:
            try:
                self.ws.close()
                print("🔌 Disconnected")
            except Exception as e:
                print(f"⚠️  Disconnect error: {e}", file=sys.stderr)

            self.ws = None

        # セッション情報を削除
        if self.session_file.exists():
            self.session_file.unlink()

    def send_chat(self, message: str) -> bool:
        """チャットメッセージを送信

        Args:
            message: 送信するメッセージ

        Returns:
            成功した場合True
        """
        if not self.ws:
            print("❌ Not connected. Please connect first.", file=sys.stderr)
            return False

        try:
            payload = {
                "action": "sendChat",
                "value": message
            }

            self.ws.send(json.dumps(payload))
            print(f"📤 Sent: {message}")
            return True

        except Exception as e:
            print(f"❌ Send failed: {e}", file=sys.stderr)
            return False

    def send_external_content(self, content: dict) -> bool:
        """外部コンテンツを送信（カスタムフォーマット）

        Args:
            content: コンテンツオブジェクト
                - chatname: 話者名
                - chatmessage: メッセージ
                - chatimg: 画像URL（オプション）
                - type: カスタムタイプ（オプション）

        Returns:
            成功した場合True
        """
        if not self.ws:
            print("❌ Not connected. Please connect first.", file=sys.stderr)
            return False

        try:
            payload = {
                "action": "extContent",
                "value": json.dumps(content, ensure_ascii=False)
            }

            self.ws.send(json.dumps(payload))
            print(f"📤 Sent external content: {content.get('chatname', 'Unknown')}")
            return True

        except Exception as e:
            print(f"❌ Send failed: {e}", file=sys.stderr)
            return False

    def _save_session(self):
        """セッション情報をファイルに保存"""
        session_info = {
            "session_id": self.session_id,
            "channel": self.channel,
            "url": self.ws_url,
            "connected_at": time.time()
        }

        with open(self.session_file, "w") as f:
            json.dump(session_info, f, indent=2)

    def _load_session(self) -> Optional[dict]:
        """セッション情報をファイルから読み込み"""
        if not self.session_file.exists():
            return None

        try:
            with open(self.session_file, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️  Failed to load session: {e}", file=sys.stderr)
            return None

    def show_info(self):
        """セッション情報を表示"""
        session_info = self._load_session()

        if not session_info:
            print("❌ No active session found")
            return

        print("📊 Session Info:")
        print(f"   Session ID: {session_info['session_id']}")
        print(f"   Channel: {session_info['channel']}")
        print(f"   URL: {session_info['url']}")
        print(f"   Connected at: {time.ctime(session_info['connected_at'])}")

    @staticmethod
    def create_miyabi_metrics_message(commit_count: int, audio_count: int, days: int) -> dict:
        """Miyabi進捗メトリクスメッセージを作成

        Args:
            commit_count: コミット数
            audio_count: 音声ファイル数
            days: 対象日数

        Returns:
            外部コンテンツメッセージ
        """
        return {
            "chatname": "📊 Miyabi Stats",
            "chatmessage": f"過去{days}日分: {commit_count}コミット、{audio_count}音声ファイル生成完了！",
            "type": "miyabi-metrics"
        }

    @staticmethod
    def create_narration_message(speaker: str, message: str) -> dict:
        """ゆっくり解説メッセージを作成

        Args:
            speaker: 話者名（霊夢 or 魔理沙）
            message: メッセージ内容

        Returns:
            外部コンテンツメッセージ
        """
        emoji = "🎤" if speaker == "霊夢" else "✨"
        return {
            "chatname": f"{emoji} {speaker}",
            "chatmessage": message,
            "type": "miyabi-narration"
        }


def main():
    parser = argparse.ArgumentParser(
        description="Social Stream Ninja WebSocketクライアント"
    )
    parser.add_argument(
        "--start",
        action="store_true",
        help="セッションを開始"
    )
    parser.add_argument(
        "--stop",
        action="store_true",
        help="セッションを終了"
    )
    parser.add_argument(
        "--send",
        type=str,
        help="チャットメッセージを送信"
    )
    parser.add_argument(
        "--send-content",
        type=str,
        help="外部コンテンツを送信（JSON形式）"
    )
    parser.add_argument(
        "--info",
        action="store_true",
        help="セッション情報を表示"
    )
    parser.add_argument(
        "--session",
        type=str,
        default="miyabi-narrate",
        help="セッションID（デフォルト: miyabi-narrate）"
    )
    parser.add_argument(
        "--channel",
        type=int,
        default=1,
        help="チャンネル番号（デフォルト: 1）"
    )

    args = parser.parse_args()

    # セッション情報表示
    if args.info:
        client = SocialStreamClient(args.session, args.channel)
        client.show_info()
        return

    # セッション開始
    if args.start:
        print("============================================================")
        print("🥷 Social Stream Ninja - Session Start")
        print("============================================================")

        client = SocialStreamClient(args.session, args.channel)

        if client.connect():
            print("\n✅ Session started successfully!")
            print(f"\n📋 OBS Browser Source URL:")
            print(f"   https://socialstream.ninja/dock.html?session={args.session}&channel={args.channel}")
            print("\n💡 次のステップ:")
            print(f"   1. OBSでBrowser Sourceを追加")
            print(f"   2. メッセージ送信: python3 social-stream-client.py --send \"Your message\"")
            print(f"   3. セッション終了: python3 social-stream-client.py --stop")
        else:
            sys.exit(1)

        return

    # セッション終了
    if args.stop:
        client = SocialStreamClient(args.session, args.channel)
        session_info = client._load_session()

        if session_info:
            client.disconnect()
            print("✅ Session stopped")
        else:
            print("❌ No active session found")

        return

    # メッセージ送信
    if args.send or args.send_content:
        client = SocialStreamClient(args.session, args.channel)
        session_info = client._load_session()

        if not session_info:
            print("❌ No active session. Please start a session first:", file=sys.stderr)
            print(f"   python3 social-stream-client.py --start --session {args.session}")
            sys.exit(1)

        # 接続
        if not client.connect():
            sys.exit(1)

        try:
            # チャットメッセージ送信
            if args.send:
                if not client.send_chat(args.send):
                    sys.exit(1)

            # 外部コンテンツ送信
            if args.send_content:
                try:
                    content = json.loads(args.send_content)
                    if not client.send_external_content(content):
                        sys.exit(1)
                except json.JSONDecodeError as e:
                    print(f"❌ Invalid JSON: {e}", file=sys.stderr)
                    sys.exit(1)

        finally:
            # 接続を切断
            client.disconnect()

        return

    # デフォルト: ヘルプを表示
    parser.print_help()


if __name__ == "__main__":
    main()
