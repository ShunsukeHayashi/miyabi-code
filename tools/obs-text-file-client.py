#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
obs-text-file-client.py

ファイルベースのOBSテキスト表示クライアント
文字化けを回避するため、UTF-8ファイルに書き込み、OBSで読み込む方式
"""

import argparse
import sys
from pathlib import Path


def update_text_file(text: str, file_path: str = "/tmp/obs-narration.txt"):
    """テキストファイルを更新
    
    Args:
        text: 表示するテキスト
        file_path: ファイルパス
    """
    try:
        # UTF-8でファイルに書き込み
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f"✅ Updated text file: {file_path}")
        print(f"   Content: {text}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to update file: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(
        description="ファイルベースのOBSテキスト表示クライアント"
    )
    parser.add_argument(
        "text",
        type=str,
        help="表示するテキスト"
    )
    parser.add_argument(
        "--file",
        type=str,
        default="/tmp/obs-narration.txt",
        help="出力ファイルパス（デフォルト: /tmp/obs-narration.txt）"
    )
    
    args = parser.parse_args()
    
    if not update_text_file(args.text, args.file):
        sys.exit(1)


if __name__ == "__main__":
    main()
