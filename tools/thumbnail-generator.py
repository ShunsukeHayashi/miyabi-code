#!/usr/bin/env python3
"""
thumbnail-generator.py

BytePlus ARK API（ByteDance）を使って動画サムネイル画像を生成

使用例:
    python thumbnail-generator.py --prompt "開発進捗を表現する画像" --output ./thumbnail.png
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv


class ThumbnailGenerator:
    """BytePlus ARK APIを使った画像生成"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

    def generate_image(
        self,
        prompt: str,
        output_path: Path,
        model: str = "seedream-4-0-250828",
        size: str = "2K",
        watermark: bool = False,
        sequential: bool = False,
        max_images: int = 1,
        source_image_url: Optional[str] = None,
        source_image_urls: Optional[list] = None
    ) -> dict:
        """
        画像を生成してファイルに保存

        Args:
            prompt: 画像生成プロンプト
            output_path: 出力ファイルパス
            model: 使用モデル（デフォルト: seedream-4-0-250828）
            size: 画像サイズ（2K = 1920x1080）
            watermark: 透かしを入れるか
            sequential: 連続画像生成を使うか
            max_images: 連続画像生成時の最大画像数
            source_image_url: Image-to-Image用のソース画像URL（単一）
            source_image_urls: Images-to-Image用のソース画像URLリスト（複数）

        Returns:
            生成結果の情報
        """
        print(f"🎨 画像生成開始: {model}")
        print(f"📝 プロンプト: {prompt}")

        payload = {
            "model": model,
            "prompt": prompt,
            "response_format": "url",
            "size": size,
            "stream": sequential,  # 連続生成時はストリーミング
            "watermark": watermark
        }

        # Images-to-Image機能（複数画像入力）
        if source_image_urls:
            payload["image"] = source_image_urls
            print(f"🖼️  ソース画像: {len(source_image_urls)}枚")
            for i, url in enumerate(source_image_urls):
                print(f"    [{i + 1}] {url}")
        # Image-to-Image機能（単一画像入力）
        elif source_image_url:
            payload["image"] = source_image_url
            print(f"🖼️  ソース画像: {source_image_url}")

        if sequential:
            payload["sequential_image_generation"] = "auto"
            payload["sequential_image_generation_options"] = {
                "max_images": max_images
            }
            print(f"🔄 連続画像生成モード: 最大{max_images}枚")
        else:
            payload["sequential_image_generation"] = "disabled"

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=120 if sequential else 60,
                stream=sequential
            )
            response.raise_for_status()

            if sequential:
                return self._handle_sequential_response(response, output_path, model, prompt)
            else:
                return self._handle_single_response(response, output_path, model, prompt)

        except requests.exceptions.RequestException as e:
            print(f"❌ API リクエストエラー: {e}", file=sys.stderr)
            raise

    def _handle_single_response(
        self,
        response: requests.Response,
        output_path: Path,
        model: str,
        prompt: str
    ) -> dict:
        """単一画像生成のレスポンス処理"""
        result = response.json()

        if "data" in result and len(result["data"]) > 0:
            image_url = result["data"][0]["url"]
            print(f"✅ 画像URL取得: {image_url}")

            # 画像をダウンロード
            self._download_image(image_url, output_path)

            return {
                "success": True,
                "image_url": image_url,
                "output_path": str(output_path),
                "model": model,
                "prompt": prompt
            }
        else:
            raise RuntimeError("画像URLが取得できませんでした")

    def _handle_sequential_response(
        self,
        response: requests.Response,
        output_path: Path,
        model: str,
        prompt: str
    ) -> dict:
        """連続画像生成のストリーミングレスポンス処理"""
        images = []
        output_dir = output_path.parent
        output_stem = output_path.stem
        output_suffix = output_path.suffix

        print(f"🔄 ストリーミング受信中...")

        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data:'):
                    data_json = line_str[5:].strip()
                    if data_json and data_json != '[DONE]':
                        try:
                            data = json.loads(data_json)
                            if "data" in data and len(data["data"]) > 0:
                                image_url = data["data"][0]["url"]
                                index = len(images)

                                # 連番付きファイル名
                                image_path = output_dir / f"{output_stem}_{index:02d}{output_suffix}"

                                print(f"⬇️  画像 {index + 1} ダウンロード中...")
                                self._download_image(image_url, image_path)

                                images.append({
                                    "url": image_url,
                                    "path": str(image_path)
                                })
                        except json.JSONDecodeError:
                            continue

        if not images:
            raise RuntimeError("画像URLが取得できませんでした")

        print(f"✅ {len(images)}枚の画像を生成しました")

        return {
            "success": True,
            "images": images,
            "image_count": len(images),
            "model": model,
            "prompt": prompt
        }

    def _download_image(self, url: str, output_path: Path) -> None:
        """画像URLからファイルをダウンロード"""
        print(f"⬇️  画像ダウンロード中...")

        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, "wb") as f:
                f.write(response.content)

            file_size = output_path.stat().st_size / (1024 * 1024)
            print(f"✅ 保存完了: {output_path} ({file_size:.2f}MB)")

        except requests.exceptions.RequestException as e:
            print(f"❌ ダウンロードエラー: {e}", file=sys.stderr)
            raise

    def generate_miyabi_thumbnail(
        self,
        commit_count: int,
        audio_count: int,
        output_path: Path
    ) -> dict:
        """
        Miyabi開発進捗用のサムネイルを生成

        Args:
            commit_count: コミット数
            audio_count: 音声ファイル数
            output_path: 出力ファイルパス

        Returns:
            生成結果の情報
        """
        # Miyabi専用プロンプト
        prompt = f"""
A high-tech development progress visualization:
- Abstract digital dashboard with glowing metrics
- Futuristic HUD interface displaying: "{commit_count} commits, {audio_count} audio files"
- Cyberpunk aesthetic with neon blue and purple gradients
- Minimalist design with geometric patterns
- Japanese kanji for "進捗" (progress) subtly integrated
- Dark background with bright accent colors
- Professional, clean, modern technology theme
- 16:9 aspect ratio optimized
- Cinematic lighting, depth of field, ray tracing
- High quality render, 4K resolution
        """.strip()

        return self.generate_image(prompt, output_path, watermark=False)


def main():
    # .envファイル読み込み
    load_dotenv()

    parser = argparse.ArgumentParser(
        description="BytePlus ARK APIで画像生成"
    )
    parser.add_argument(
        "-p", "--prompt",
        type=str,
        help="画像生成プロンプト"
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=Path("./thumbnail.png"),
        help="出力ファイルパス（デフォルト: ./thumbnail.png）"
    )
    parser.add_argument(
        "--miyabi",
        action="store_true",
        help="Miyabi開発進捗用のサムネイルを自動生成"
    )
    parser.add_argument(
        "--commits",
        type=int,
        default=60,
        help="コミット数（Miyabiモード用、デフォルト: 60）"
    )
    parser.add_argument(
        "--audio",
        type=int,
        default=14,
        help="音声ファイル数（Miyabiモード用、デフォルト: 14）"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="seedream-4-0-250828",
        help="使用モデル（デフォルト: seedream-4-0-250828）"
    )
    parser.add_argument(
        "--sequential",
        action="store_true",
        help="連続画像生成モードを使用"
    )
    parser.add_argument(
        "--max-images",
        type=int,
        default=4,
        help="連続画像生成時の最大画像数（デフォルト: 4）"
    )
    parser.add_argument(
        "--source-image",
        type=str,
        help="Image-to-Image用のソース画像URL（単一）"
    )
    parser.add_argument(
        "--source-images",
        type=str,
        nargs='+',
        help="Images-to-Image用のソース画像URLリスト（複数、スペース区切り）"
    )

    args = parser.parse_args()

    # API Key確認
    api_key = os.getenv("ARK_API_KEY")
    if not api_key:
        print("❌ エラー: ARK_API_KEYが設定されていません", file=sys.stderr)
        print(".envファイルにARK_API_KEYを設定してください", file=sys.stderr)
        sys.exit(1)

    try:
        generator = ThumbnailGenerator(api_key)

        if args.miyabi:
            # Miyabi専用モード
            print("============================================================")
            print("🎨 Miyabi開発進捗サムネイル生成")
            print("============================================================")
            result = generator.generate_miyabi_thumbnail(
                args.commits,
                args.audio,
                args.output
            )
        else:
            # カスタムプロンプトモード
            if not args.prompt:
                print("❌ エラー: --prompt が必要です", file=sys.stderr)
                sys.exit(1)

            print("============================================================")
            if args.sequential:
                print(f"🎨 カスタム画像生成（連続{args.max_images}枚）")
            else:
                print("🎨 カスタム画像生成")
            if args.source_images:
                print(f"🖼️  Images-to-Image モード（{len(args.source_images)}枚の画像を使用）")
            elif args.source_image:
                print("🖼️  Image-to-Image モード")
            print("============================================================")

            result = generator.generate_image(
                args.prompt,
                args.output,
                model=args.model,
                sequential=args.sequential,
                max_images=args.max_images,
                source_image_url=args.source_image,
                source_image_urls=args.source_images
            )

        print("\n============================================================")
        print("✅ 完了！")
        print("============================================================")

        if "images" in result:
            # 連続画像生成の場合
            print(f"📁 生成画像数: {result['image_count']}枚")
            for i, img in enumerate(result["images"]):
                print(f"  [{i + 1}] {img['path']}")
            print(f"🤖 モデル: {result['model']}")
        else:
            # 単一画像生成の場合
            print(f"📁 出力ファイル: {result['output_path']}")
            print(f"🔗 画像URL: {result['image_url']}")
            print(f"🤖 モデル: {result['model']}")
        print()

        # JSON形式で情報を出力（CI/CD統合用）
        print(json.dumps(result, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"❌ エラー: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
