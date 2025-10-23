#!/usr/bin/env python3
"""
Miyabi開発進捗をゆっくり解説風に変換するスクリプト

Usage:
    python yukkuri-narration-generator.py [--days N]

Output:
    - 台本Markdown (script.md)
    - VOICEVOX APIリクエスト用JSON
"""

import argparse
import json
import re
import subprocess
from datetime import datetime
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class CommitInfo:
    """Git commit情報"""
    hash: str
    type: str  # feat, fix, docs, security等
    scope: str  # design, web-ui等
    description: str
    issue_number: str = ""
    phase: str = ""


class YukkuriScriptGenerator:
    """ゆっくり解説風台本生成器"""

    def __init__(self):
        self.reimu_speaker_id = 0  # 霊夢のspeaker ID（実際のVOICEVOXモデルに合わせて調整）
        self.marisa_speaker_id = 1  # 魔理沙のspeaker ID

    def parse_git_commits(self, days: int = 1) -> List[CommitInfo]:
        """Git commitsをパース"""
        cmd = f'git log --oneline --since="{days} days ago"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

        commits = []
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue

            parts = line.split(' ', 1)
            if len(parts) < 2:
                continue

            commit_hash = parts[0]
            message = parts[1]

            commit_info = self._parse_commit_message(commit_hash, message)
            commits.append(commit_info)

        return commits

    def _parse_commit_message(self, commit_hash: str, message: str) -> CommitInfo:
        """コミットメッセージを解析"""
        # Conventional Commits形式をパース
        # 例: feat(design): complete Phase 0.4 - Issue #425

        commit_type = "other"
        scope = ""
        description = message
        issue_number = ""
        phase = ""

        # Type + Scope
        type_scope_match = re.match(r'^(\w+)(?:\(([^)]+)\))?: (.+)$', message)
        if type_scope_match:
            commit_type = type_scope_match.group(1)
            scope = type_scope_match.group(2) or ""
            description = type_scope_match.group(3)

        # Issue番号
        issue_match = re.search(r'#(\d+)', description)
        if issue_match:
            issue_number = issue_match.group(1)

        # Phase情報
        phase_match = re.search(r'Phase [\d.]+', description)
        if phase_match:
            phase = phase_match.group(0)

        return CommitInfo(
            hash=commit_hash,
            type=commit_type,
            scope=scope,
            description=description,
            issue_number=issue_number,
            phase=phase
        )

    def generate_yukkuri_script(self, commits: List[CommitInfo]) -> List[Dict]:
        """ゆっくり解説風の台本を生成"""

        if not commits:
            return []

        script = []

        # オープニング
        script.append({
            "speaker": "reimu",
            "speaker_id": self.reimu_speaker_id,
            "text": "こんにちは、霊夢よ！今日もMiyabiの開発進捗を報告するわ〜"
        })

        script.append({
            "speaker": "marisa",
            "speaker_id": self.marisa_speaker_id,
            "text": "魔理沙だぜ！今日は何が進んだんだ？"
        })

        # コミット内容を会話形式に変換
        for i, commit in enumerate(commits[:5]):  # 最新5件のみ
            # 霊夢が説明
            reimu_text = self._generate_commit_explanation(commit)
            script.append({
                "speaker": "reimu",
                "speaker_id": self.reimu_speaker_id,
                "text": reimu_text
            })

            # 魔理沙が反応
            marisa_reaction = self._generate_marisa_reaction(commit)
            script.append({
                "speaker": "marisa",
                "speaker_id": self.marisa_speaker_id,
                "text": marisa_reaction
            })

        # エンディング
        script.append({
            "speaker": "reimu",
            "speaker_id": self.reimu_speaker_id,
            "text": "今日の開発進捗は以上よ！また明日ね〜"
        })

        script.append({
            "speaker": "marisa",
            "speaker_id": self.marisa_speaker_id,
            "text": "次回も楽しみにしてくれよな！それじゃあまただぜ！"
        })

        return script

    def _generate_commit_explanation(self, commit: CommitInfo) -> str:
        """コミットの説明を生成"""
        type_map = {
            "feat": "新機能を追加したわ",
            "fix": "バグを修正したわ",
            "docs": "ドキュメントを更新したわ",
            "security": "セキュリティの問題を修正したわ",
            "test": "テストを追加したわ",
            "refactor": "リファクタリングをしたわ"
        }

        type_text = type_map.get(commit.type, "変更を加えたわ")

        if commit.scope:
            scope_text = f"{commit.scope}モジュールで"
        else:
            scope_text = ""

        if commit.issue_number:
            issue_text = f"Issue番号{commit.issue_number}の"
        else:
            issue_text = ""

        if commit.phase:
            phase_text = f"{commit.phase}を"
        else:
            phase_text = ""

        # 説明文を短縮
        desc = commit.description[:50]

        return f"{scope_text}{issue_text}{phase_text}{type_text}。具体的には、{desc}よ。"

    def _generate_marisa_reaction(self, commit: CommitInfo) -> str:
        """魔理沙の反応を生成"""
        reactions = {
            "feat": "新機能が追加されたのか！すごいぜ！",
            "fix": "バグ修正お疲れ様だぜ！",
            "security": "セキュリティは大事だからな！よくやったぜ！",
            "docs": "ドキュメント整備は重要だぜ！",
            "test": "テストがあると安心だぜ！"
        }

        return reactions.get(commit.type, "なるほどな！次も頑張ろうぜ！")

    def export_markdown(self, script: List[Dict], output_file: str = "script.md"):
        """台本をMarkdown形式でエクスポート"""
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("# Miyabi開発進捗 - ゆっくり解説台本\n\n")
            f.write(f"生成日時: {datetime.now().isoformat()}\n\n")
            f.write("---\n\n")

            for item in script:
                speaker_name = "霊夢" if item["speaker"] == "reimu" else "魔理沙"
                f.write(f"### {speaker_name}\n\n")
                f.write(f"{item['text']}\n\n")

        print(f"✅ 台本を {output_file} に保存しました")

    def export_voicevox_requests(self, script: List[Dict], output_file: str = "voicevox_requests.json"):
        """VOICEVOX API リクエスト用JSONをエクスポート"""
        requests = []

        for item in script:
            requests.append({
                "speaker_id": item["speaker_id"],
                "text": item["text"]
            })

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(requests, f, ensure_ascii=False, indent=2)

        print(f"✅ VOICEVOX APIリクエストを {output_file} に保存しました")


def main():
    """メイン処理"""
    # コマンドライン引数解析
    parser = argparse.ArgumentParser(
        description="Miyabi開発進捗をゆっくり解説風の台本に変換",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python yukkuri-narration-generator.py
  python yukkuri-narration-generator.py --days 7
  python yukkuri-narration-generator.py -d 14
        """
    )
    parser.add_argument(
        '-d', '--days',
        type=int,
        default=3,
        help='過去N日分のcommitsを収集（デフォルト: 3）'
    )
    args = parser.parse_args()

    print("🎬 Miyabi開発進捗 → ゆっくり解説台本生成")
    print("=" * 60)

    generator = YukkuriScriptGenerator()

    # Git commitsを取得
    print(f"📊 Git commitsを解析中...（過去{args.days}日分）")
    commits = generator.parse_git_commits(days=args.days)
    print(f"   {len(commits)}件のコミットを取得しました")

    # 台本生成
    print("✍️  ゆっくり解説台本を生成中...")
    script = generator.generate_yukkuri_script(commits)
    print(f"   {len(script)}行の台本を生成しました")

    # エクスポート
    print("💾 ファイル保存中...")
    generator.export_markdown(script)
    generator.export_voicevox_requests(script)

    print("\n✅ 完了！")
    print("=" * 60)
    print("\n📝 次のステップ:")
    print("1. script.md で台本を確認")
    print("2. voicevox_requests.json を使ってVOICEVOX APIで音声合成")
    print("3. 動画編集ソフト（YMM等）で動画作成")


if __name__ == "__main__":
    main()
