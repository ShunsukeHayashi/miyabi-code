#!/usr/bin/env python3
"""
シンプルなスクレイピングデモ
DMM一般ページ（年齢確認なし）から新作情報を取得

Usage:
    python3 simple_scraper_demo.py
"""

import json
from datetime import datetime
from pathlib import Path
from time import sleep

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ 必要なパッケージがインストールされていません")
    print("   pip3 install requests beautifulsoup4")
    exit(1)


def scrape_dmm_general():
    """DMM一般サイトから新作情報を取得（デモ）"""

    # 一般向けDMMの新作ページ（年齢確認なし）
    url = "https://www.dmm.com/digital/-/new-release/=/type=rental/"

    print(f"🔍 ページを取得中: {url}")

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")

        # タイトル取得
        title = soup.find("title")
        print(f"✅ ページ取得成功: {title.text if title else 'タイトル不明'}")

        # 商品リストを探す（実際のHTML構造に依存）
        items = []

        # 一般的なDMMの商品リスト構造を試す
        product_list = soup.find("ul", class_="d-item") or soup.find("div", id="list")

        if product_list:
            product_items = product_list.find_all("li")[:10]  # 最初の10件
            print(f"   → {len(product_items)}件の商品を発見")

            for idx, item in enumerate(product_items, 1):
                # タイトル抽出
                title_elem = item.find("a")
                title_text = title_elem.get("title") if title_elem else "不明"
                link = title_elem.get("href") if title_elem else ""

                items.append({
                    "index": idx,
                    "title": title_text,
                    "url": f"https://www.dmm.com{link}" if link.startswith("/") else link,
                })

                print(f"   {idx}. {title_text[:50]}...")
        else:
            print("⚠️  商品リストが見つかりません")
            print("   ページ構造:")
            # デバッグ: 主要な要素を表示
            for tag in ["ul", "div", "section"]:
                elements = soup.find_all(tag, limit=5)
                for elem in elements:
                    classes = elem.get("class", [])
                    elem_id = elem.get("id", "")
                    print(f"     <{tag} class='{classes}' id='{elem_id}'>")

        return items

    except requests.RequestException as e:
        print(f"❌ エラー: {e}")
        return []


def save_demo_result(items):
    """デモ結果を保存"""
    output_dir = Path("data/fanza")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / f"demo_scraping_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("# スクレイピングデモ結果\n\n")
        f.write(f"**実行日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**取得件数**: {len(items)}件\n\n")
        f.write("---\n\n")

        for item in items:
            f.write(f"## {item['index']}. {item['title']}\n\n")
            f.write(f"- **URL**: {item['url']}\n\n")
            f.write("---\n\n")

    print(f"\n✅ 結果を保存: {output_file}")
    return output_file


def main():
    print("🎬 スクレイピングデモを開始します")
    print("   対象: DMM一般サイト（年齢確認なし）")
    print("")

    items = scrape_dmm_general()

    if items:
        output_file = save_demo_result(items)
        print(f"\n📊 取得件数: {len(items)}")
        print("🎉 デモ完了！")
        print(f"\n💡 次のステップ:")
        print(f"   1. 生成されたファイルを確認: cat {output_file}")
        print(f"   2. 実際のFANZAページに対応するにはHTML構造の解析が必要です")
    else:
        print("\n❌ 商品情報を取得できませんでした")
        print("   → HTML構造が想定と異なる可能性があります")


if __name__ == "__main__":
    main()
