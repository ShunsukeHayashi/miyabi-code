#!/usr/bin/env python3
"""
obs-websocket-client.py

OBS WebSocketクライアント - Miyabi Narration System統合

使用例:
    # 接続テスト
    python3 obs-websocket-client.py --test
    
    # Text Sourceを更新
    python3 obs-websocket-client.py --update-text "メッセージ内容"
    
    # シーン情報取得
    python3 obs-websocket-client.py --get-scenes
"""

import argparse
import json
import sys
from pathlib import Path

try:
    from obswebsocket import obsws, requests as obs_requests
except ImportError:
    print("❌ エラー: obs-websocket-py がインストールされていません")
    print("インストール: pip3 install obs-websocket-py")
    sys.exit(1)


class OBSWebSocketClient:
    """OBS WebSocketクライアント"""
    
    def __init__(self, host: str = "localhost", port: int = 4455, password: str = ""):
        self.host = host
        self.port = port
        self.password = password
        self.ws = None
        
    def connect(self) -> bool:
        """WebSocket接続を確立"""
        try:
            print(f"🔌 Connecting to OBS WebSocket...")
            print(f"   Host: {self.host}")
            print(f"   Port: {self.port}")
            
            self.ws = obsws(self.host, self.port, self.password)
            self.ws.connect()
            
            print("✅ Connected successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Connection failed: {e}", file=sys.stderr)
            return False
    
    def disconnect(self):
        """WebSocket接続を切断"""
        if self.ws:
            try:
                self.ws.disconnect()
                print("🔌 Disconnected")
            except Exception as e:
                print(f"⚠️  Disconnect error: {e}", file=sys.stderr)
    
    def get_version(self) -> dict:
        """OBS Studioバージョン情報を取得"""
        try:
            response = self.ws.call(obs_requests.GetVersion())
            return response.datain
        except Exception as e:
            print(f"❌ Failed to get version: {e}", file=sys.stderr)
            return {}
    
    def get_scenes(self) -> list:
        """シーン一覧を取得"""
        try:
            response = self.ws.call(obs_requests.GetSceneList())
            return response.datain.get('scenes', [])
        except Exception as e:
            print(f"❌ Failed to get scenes: {e}", file=sys.stderr)
            return []
    
    def get_current_scene(self) -> str:
        """現在のシーン名を取得"""
        try:
            response = self.ws.call(obs_requests.GetCurrentProgramScene())
            return response.datain.get('currentProgramSceneName', '')
        except Exception as e:
            print(f"❌ Failed to get current scene: {e}", file=sys.stderr)
            return ""
    
    def update_text_source(self, source_name: str, text: str) -> bool:
        """Text Sourceのテキストを更新
        
        Args:
            source_name: ソース名
            text: 更新するテキスト
            
        Returns:
            成功した場合True
        """
        try:
            self.ws.call(obs_requests.SetInputSettings(
                inputName=source_name,
                inputSettings={"text": text}
            ))
            print(f"✅ Updated text source '{source_name}'")
            return True
        except Exception as e:
            print(f"❌ Failed to update text source: {e}", file=sys.stderr)
            return False
    
    def set_source_visibility(self, scene_name: str, source_name: str, visible: bool) -> bool:
        """ソースの表示/非表示を切り替え
        
        Args:
            scene_name: シーン名
            source_name: ソース名
            visible: True=表示, False=非表示
            
        Returns:
            成功した場合True
        """
        try:
            self.ws.call(obs_requests.SetSceneItemEnabled(
                sceneName=scene_name,
                sceneItemId=self._get_source_id(scene_name, source_name),
                sceneItemEnabled=visible
            ))
            status = "visible" if visible else "hidden"
            print(f"✅ Set source '{source_name}' to {status}")
            return True
        except Exception as e:
            print(f"❌ Failed to set source visibility: {e}", file=sys.stderr)
            return False
    
    def _get_source_id(self, scene_name: str, source_name: str) -> int:
        """ソースIDを取得（内部用）"""
        response = self.ws.call(obs_requests.GetSceneItemList(sceneName=scene_name))
        items = response.datain.get('sceneItems', [])
        
        for item in items:
            if item.get('sourceName') == source_name:
                return item.get('sceneItemId')
        
        raise ValueError(f"Source '{source_name}' not found in scene '{scene_name}'")


def main():
    parser = argparse.ArgumentParser(
        description="OBS WebSocketクライアント"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="接続テスト"
    )
    parser.add_argument(
        "--get-scenes",
        action="store_true",
        help="シーン一覧を取得"
    )
    parser.add_argument(
        "--update-text",
        type=str,
        help="Text Sourceのテキストを更新"
    )
    parser.add_argument(
        "--source-name",
        type=str,
        default="NarrationText",
        help="ソース名（デフォルト: NarrationText）"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="localhost",
        help="OBS WebSocketホスト（デフォルト: localhost）"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=4455,
        help="OBS WebSocketポート（デフォルト: 4455）"
    )
    parser.add_argument(
        "--password",
        type=str,
        default="O7f4ZAafNbakI2Cd",
        help="OBS WebSocketパスワード"
    )
    
    args = parser.parse_args()
    
    # クライアント作成
    client = OBSWebSocketClient(args.host, args.port, args.password)
    
    # 接続
    if not client.connect():
        sys.exit(1)
    
    try:
        # 接続テスト
        if args.test:
            print("\n🧪 Connection Test")
            print("=" * 60)
            
            version = client.get_version()
            print(f"\n📊 OBS Studio Version:")
            print(f"   Version: {version.get('obsVersion', 'Unknown')}")
            print(f"   WebSocket: {version.get('obsWebSocketVersion', 'Unknown')}")
            
            current_scene = client.get_current_scene()
            print(f"\n🎬 Current Scene: {current_scene}")
            
            print("\n✅ Test completed successfully!")
        
        # シーン一覧取得
        if args.get_scenes:
            scenes = client.get_scenes()
            print(f"\n🎬 Scenes ({len(scenes)}):")
            for i, scene in enumerate(scenes, 1):
                scene_name = scene.get('sceneName', 'Unknown')
                print(f"   {i}. {scene_name}")
        
        # Text Source更新
        if args.update_text:
            client.update_text_source(args.source_name, args.update_text)
    
    finally:
        # 切断
        client.disconnect()


if __name__ == "__main__":
    main()
