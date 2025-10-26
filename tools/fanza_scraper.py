#!/usr/bin/env python3
"""
FANZA新着作品スクレイパー（APIキー不要版）
Beautiful Soup 4を使用してFANZAの新着作品情報を取得

Usage:
    python3 fanza_scraper.py [--pages 3] [--output data/fanza/new_releases.md]
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from time import sleep
from typing import List, Dict

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ 必要なパッケージがインストールされていません")
    print("")
    print("📦 インストールコマンド:")
    print("   pip3 install requests beautifulsoup4")
    print("")
    print("または:")
    print("   python3 -m pip install requests beautifulsoup4")
    sys.exit(1)


class FANZAScraper:
    """FANZA新着作品スクレイパー"""

    BASE_URL = "https://www.dmm.co.jp/digital/videoa/-/list/"
    PARAMS = "=/article=keyword/id=6529/sort=date"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        })
        # 年齢確認クッキーを設定
        self.session.cookies.set("age_check_done", "1", domain=".dmm.co.jp")
        self.session.cookies.set("ckcy", "1", domain=".dmm.co.jp")

    def fetch_page(self, page: int = 1) -> BeautifulSoup:
        """指定ページのHTMLを取得"""
        url = f"{self.BASE_URL}{self.PARAMS}/page={page}/"
        print(f"📄 ページ {page} を取得中: {url}")

        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.content, "html.parser")
        except requests.RequestException as e:
            print(f"❌ エラー: {e}")
            return None

    def extract_items(self, soup: BeautifulSoup) -> List[Dict]:
        """ページから作品情報を抽出"""
        items = []

        # 商品リストを取得（実際のHTML構造に応じて調整が必要）
        # DMM/FANZAのHTML構造の一般的なパターン:
        # - id="list" 内の ul > li
        # - class="tmb" がサムネイル/タイトル
        # - class="tx-text" がテキスト情報

        product_list = soup.find(id="list")
        if not product_list:
            print("⚠️  商品リストが見つかりません（年齢確認ページの可能性があります）")
            return items

        product_items = product_list.find_all("li")
        print(f"   → {len(product_items)}件の商品を発見")

        for item in product_items:
            try:
                # タイトル
                title_elem = item.find("p", class_="tmb")
                title = title_elem.get_text(strip=True) if title_elem else "タイトル不明"

                # リンク
                link_elem = item.find("a")
                link = link_elem["href"] if link_elem and link_elem.get("href") else ""
                if link and not link.startswith("http"):
                    link = "https://www.dmm.co.jp" + link

                # サムネイル
                img_elem = item.find("img")
                thumbnail = img_elem["src"] if img_elem and img_elem.get("src") else ""

                # 品番（URLから抽出を試みる）
                product_id = ""
                if link:
                    match = re.search(r'cid=([^/&]+)', link)
                    if match:
                        product_id = match.group(1)

                # 価格（あれば）
                price_elem = item.find("p", class_="price")
                price = price_elem.get_text(strip=True) if price_elem else "価格不明"

                items.append({
                    "title": title,
                    "product_id": product_id,
                    "url": link,
                    "thumbnail": thumbnail,
                    "price": price,
                    "scraped_at": datetime.now().isoformat(),
                })

            except Exception as e:
                print(f"⚠️  商品情報の抽出エラー: {e}")
                continue

        return items

    def scrape(self, pages: int = 1) -> List[Dict]:
        """複数ページをスクレイピング"""
        all_items = []

        for page in range(1, pages + 1):
            soup = self.fetch_page(page)
            if not soup:
                break

            items = self.extract_items(soup)
            all_items.extend(items)

            print(f"   ✅ {len(items)}件取得 (合計: {len(all_items)}件)")

            # サーバー負荷軽減のための待機
            if page < pages:
                sleep(2)

        return all_items


def save_markdown(items: List[Dict], output_path: Path):
    """Markdown形式で保存"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(f"# FANZA 新着作品 - {datetime.now().strftime('%Y年%m月%d日')}\n\n")
        f.write(f"**取得日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**取得件数**: {len(items)}件\n\n")
        f.write("---\n\n")

        for item in items:
            f.write(f"## {item['title']}\n\n")
            if item['product_id']:
                f.write(f"- **品番**: {item['product_id']}\n")
            f.write(f"- **価格**: {item['price']}\n")
            f.write(f"- **URL**: {item['url']}\n\n")
            if item['thumbnail']:
                f.write(f"![サムネイル]({item['thumbnail']})\n\n")
            f.write("---\n\n")

    print(f"✅ Markdown保存: {output_path}")


def save_json(items: List[Dict], output_path: Path):
    """JSON形式で保存"""
    data = {
        "date": datetime.now().isoformat(),
        "count": len(items),
        "items": items,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ JSON保存: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="FANZA新着作品スクレイパー")
    parser.add_argument("--pages", type=int, default=1, help="取得ページ数 (default: 1)")
    parser.add_argument("--output", type=str, help="出力ファイルパス (default: data/fanza/new_releases_YYYYMMDD.md)")
    args = parser.parse_args()

    # 出力ディレクトリ作成
    output_dir = Path("data/fanza")
    output_dir.mkdir(parents=True, exist_ok=True)

    # 出力ファイル名決定
    date_str = datetime.now().strftime("%Y%m%d")
    if args.output:
        output_md = Path(args.output)
    else:
        output_md = output_dir / f"new_releases_{date_str}.md"

    output_json = output_md.with_suffix(".json")

    print("🔍 FANZA新着作品をスクレイピング中...")
    print(f"   取得ページ数: {args.pages}")
    print(f"   出力先: {output_md}")
    print("")

    # スクレイピング実行
    scraper = FANZAScraper()
    items = scraper.scrape(pages=args.pages)

    if not items:
        print("❌ 作品情報を取得できませんでした")
        sys.exit(1)

    # 保存
    save_markdown(items, output_md)
    save_json(items, output_json)

    print("")
    print(f"📊 取得作品数: {len(items)}")
    print("🎉 完了！")


if __name__ == "__main__":
    main()
