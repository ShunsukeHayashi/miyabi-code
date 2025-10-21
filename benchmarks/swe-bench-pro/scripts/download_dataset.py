#!/usr/bin/env python3
"""
SWE-bench Pro データセットダウンロードスクリプト

HuggingFaceから公式データセットを取得し、JSON形式で保存します。
"""

import json
from pathlib import Path
from datasets import load_dataset
from typing import Dict, List

def download_swebench_pro(output_dir: Path = Path("data")) -> None:
    """
    SWE-bench Proデータセットをダウンロード

    Args:
        output_dir: 出力ディレクトリ
    """
    print("📥 SWE-bench Pro データセットをダウンロード中...")

    # 公式データセット取得（test split: 731インスタンス）
    dataset = load_dataset('ScaleAI/SWE-bench_Pro', split='test')

    print(f"✅ データセット取得完了: {len(dataset)} インスタンス")

    # 出力ディレクトリ作成
    output_dir.mkdir(parents=True, exist_ok=True)

    # 全インスタンスをJSON形式で保存
    instances: List[Dict] = []

    for i, item in enumerate(dataset):
        instance = {
            "instance_id": item["instance_id"],
            "repo": item["repo"],
            "base_commit": item["base_commit"],
            "problem_statement": item["problem_statement"],
            "patch": item["patch"],
            "test_patch": item["test_patch"],
            "fail_to_pass": item.get("fail_to_pass", []),
            "pass_to_pass": item.get("pass_to_pass", []),
            "repo_language": item.get("repo_language"),
            "requirements": item.get("requirements"),
        }
        instances.append(instance)

        # 進捗表示
        if (i + 1) % 100 == 0:
            print(f"  処理中: {i + 1}/{len(dataset)}")

    # JSON保存
    output_file = output_dir / "swebench_pro_test.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(instances, f, indent=2, ensure_ascii=False)

    print(f"✅ データセット保存完了: {output_file}")
    print(f"📊 統計情報:")
    print(f"  - 総インスタンス数: {len(instances)}")

    # 言語別集計
    languages = {}
    for inst in instances:
        lang = inst.get("repo_language", "unknown")
        languages[lang] = languages.get(lang, 0) + 1

    print(f"  - 言語別分布:")
    for lang, count in sorted(languages.items(), key=lambda x: x[1], reverse=True):
        print(f"    - {lang}: {count} ({count/len(instances)*100:.1f}%)")

    # サンプルデータ作成（最初の10件）
    sample_file = output_dir / "swebench_pro_sample_10.json"
    with open(sample_file, 'w', encoding='utf-8') as f:
        json.dump(instances[:10], f, indent=2, ensure_ascii=False)

    print(f"✅ サンプルデータ保存完了: {sample_file} (10件)")

if __name__ == "__main__":
    download_swebench_pro()
