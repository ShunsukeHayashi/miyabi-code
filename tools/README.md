# Miyabi開発進捗 → ゆっくり解説音声ガイドシステム

Miyabiプロジェクトの開発進捗を、Git commitsから自動的に「ゆっくり解説」風の音声ガイドに変換するツール群です。

## 🚀 クイックスタート

**初回セットアップ（必須）**:
```bash
# VOICEVOXセットアップ（自動）
./tools/setup-voicevox.sh
```

このコマンドで以下が自動実行されます：
- ✅ スクリプト配置確認
- ✅ シンボリックリンク作成
- ✅ VOICEVOX Engine確認
- ✅ ワーカー起動
- ✅ 動作テスト

**使用方法**:
```bash
# Claude Codeから実行
/voicevox

# または直接スクリプト実行
tools/voicevox_enqueue.sh "やぁやぁ!ずんだもんなのだ!" 3 1.2
```

---

## 📋 概要

```
Git Commits → 台本生成 → VOICEVOX音声合成 → 音声ファイル出力 → 動画生成（MP4）
   Phase 1        Phase 2                               Phase 3
```

## 🎯 用途

- **開発進捗の音声報告**: 毎日/毎週の開発サマリーを音声で配信
- **YouTube配信**: ゆっくり解説チャンネルでの開発ログ公開
- **チーム共有**: 非技術者にも分かりやすい進捗報告
- **アーカイブ**: 開発履歴の音声記録

## 🛠️ ツール構成

### 1. `yukkuri-narration-generator.py`

**機能**: Git commitsをゆっくり解説風の台本に変換

**入力**:
- Git commitsログ（過去N日分）

**出力**:
- `script.md` - Markdown形式の台本
- `voicevox_requests.json` - VOICEVOX APIリクエスト用JSON

**使用例**:
```bash
python yukkuri-narration-generator.py
```

**カスタマイズ可能な項目**:
- 収集期間（days引数）
- 話者ID（霊夢、魔理沙）
- 台本テンプレート
- コミット数上限

---

### 2. `voicevox-synthesizer.py`

**機能**: 台本をVOICEVOX APIで音声合成

**入力**:
- `voicevox_requests.json`

**出力**:
- `audio/speaker{id}_{index}.wav` - 音声ファイル群

**使用例**:
```bash
python voicevox-synthesizer.py
```

**前提条件**:
- VOICEVOX Engineが起動中（http://127.0.0.1:50021）

---

### 3. `video-generator.py`

**機能**: 音声ファイルから動画ファイル（MP4）を生成

**入力**:
- `audio/*.wav` - 音声ファイル群
- `thumbnail.png` - サムネイル画像（オプション）

**出力**:
- `miyabi-progress.mp4` - Full HD動画（1920x1080、H.264/AAC）

**使用例**:
```bash
python video-generator.py --audio-dir ./output/audio --output ./output/video.mp4
```

**特徴**:
- 複数音声ファイルの自動連結
- デフォルトサムネイル自動生成
- Web再生最適化（faststart）
- YouTube推奨エンコーディング設定

**前提条件**:
- ffmpegがインストール済み

---

### 4. `miyabi-narrate.sh` ⭐ 統合スクリプト（推奨）

**機能**: Phase 1→2→3を一括実行する統合スクリプト

**使用例**:
```bash
# 基本的な使用（Phase 1-2）
./miyabi-narrate.sh

# 動画生成も含む（Phase 1-2-3）
./miyabi-narrate.sh --video

# 7日分の進捗、Engine自動起動、動画生成
./miyabi-narrate.sh --days 7 --start-engine --video
```

**オプション**:
- `-d, --days N`: 過去N日分のcommitsを収集（デフォルト: 3）
- `-o, --output DIR`: 出力ディレクトリ（デフォルト: ./output）
- `-s, --start-engine`: VOICEVOX Engineを自動起動
- `-k, --keep-engine`: 実行後もEngineを起動したまま
- `-v, --video`: 動画ファイル（MP4）も生成
- `-h, --help`: ヘルプ表示

**Lifecycle Hooks統合**:
- `narration-start-headless.sh` - 開始時に音声通知
- `narration-complete-headless.sh` - 完了時に結果報告
- `narration-error-headless.sh` - エラー時に警告通知

---

## 🚀 クイックスタート

### 1. VOICEVOX Engineのセットアップ

```bash
cd /Users/a003/dev/voicevox_engine

# 依存関係インストール（初回のみ）
uv sync

# エンジン起動（モックモード）
uv run run.py --enable_mock --host 127.0.0.1 --port 50021
```

**実音声モデルを使う場合**:
```bash
# 製品版VOICEVOXのエンジンを指定
VOICEVOX_DIR="/path/to/VOICEVOX/vv-engine"
uv run run.py --voicevox_dir=$VOICEVOX_DIR
```

---

### 2. 統合スクリプトで全工程実行（推奨）⭐

```bash
cd /Users/a003/dev/miyabi-private/tools

# 基本実行（Phase 1-2: 台本 + 音声）
./miyabi-narrate.sh

# フル機能（Phase 1-2-3: 台本 + 音声 + 動画）
./miyabi-narrate.sh --video

# 7日分の進捗、Engine自動起動、動画生成
./miyabi-narrate.sh --days 7 --start-engine --video
```

**実行時間の目安**:
- Phase 1（台本生成）: ~5秒
- Phase 2（音声合成）: ~20秒（14ファイル）
- Phase 3（動画生成）: ~5秒
- **合計**: 約30秒

---

### 3. 個別スクリプト実行（手動）

統合スクリプトの代わりに、個別に実行することも可能です：

```bash
# 1. 台本生成
python yukkuri-narration-generator.py --days 3

# 2. 音声合成
python voicevox-synthesizer.py

# 3. 動画生成（オプション）
python video-generator.py --audio-dir ./audio --output ./video.mp4
```

---

### 4. 生成物の確認

```bash
# 出力ディレクトリ構造
ls -lh output/
# output/
# ├── script.md              # 台本
# ├── voicevox_requests.json # APIリクエスト
# ├── audio/                 # 音声ファイル（14件、~3.7MB）
# │   ├── speaker0_000.wav
# │   └── ...
# ├── thumbnail.png          # サムネイル画像
# └── miyabi-progress.mp4    # 動画ファイル（~1.2MB）

# 台本確認
cat output/script.md

# 音声再生（macOS）
afplay output/audio/speaker0_000.wav

# 動画再生（macOS）
open output/miyabi-progress.mp4
```

---

## 📊 台本生成のロジック

### Conventional Commits解析

Git commitメッセージから以下を抽出：

| 要素 | 例 | 用途 |
|------|-----|------|
| **Type** | `feat`, `fix`, `docs` | 作業種別判定 |
| **Scope** | `(design)`, `(web-ui)` | モジュール特定 |
| **Description** | `complete Phase 0.4` | 具体的内容 |
| **Issue番号** | `#425` | Issue追跡 |
| **Phase情報** | `Phase 0.4` | 進捗段階 |

### 台本テンプレート

**霊夢（説明役）**:
```
{scope}モジュールで{issue}{phase}{type}。
具体的には、{description}よ。
```

**魔理沙（反応役）**:
- `feat` → "新機能が追加されたのか！すごいぜ！"
- `fix` → "バグ修正お疲れ様だぜ！"
- `security` → "セキュリティは大事だからな！よくやったぜ！"

---

## 🎙️ VOICEVOX API仕様

### 音声合成フロー

```
1. /audio_query → クエリ取得
2. /synthesis → 音声合成
3. .wav保存
```

### APIエンドポイント

| エンドポイント | メソッド | 用途 |
|---------------|---------|------|
| `/speakers` | GET | 利用可能な話者一覧 |
| `/audio_query` | POST | 音声合成クエリ生成 |
| `/synthesis` | POST | 音声合成実行 |
| `/version` | GET | エンジンバージョン確認 |

### 話者ID

| ID | キャラクター | スタイル |
|----|------------|---------|
| 0 | 四国めたん | あまあま |
| 2 | 四国めたん | ノーマル |
| 3 | ずんだもん | ノーマル |

**カスタマイズ例**:
```python
# 霊夢 = ずんだもん、魔理沙 = 四国めたん（ツンツン）
self.reimu_speaker_id = 3
self.marisa_speaker_id = 6
```

---

## 📁 ディレクトリ構成

```
tools/
├── yukkuri-narration-generator.py  # Phase 1: 台本生成
├── voicevox-synthesizer.py         # Phase 2: 音声合成
├── video-generator.py               # Phase 3: 動画生成
├── miyabi-narrate.sh                # 統合スクリプト（推奨）⭐
├── README.md                        # このファイル
├── PROJECT_SUMMARY.md               # 完成報告書
├── GITHUB_ACTIONS.md                # CI/CD設定ガイド
└── output/                          # 出力ディレクトリ
    ├── script.md                    # 台本（Markdown）
    ├── voicevox_requests.json       # APIリクエストデータ
    ├── thumbnail.png                # サムネイル画像（1920x1080）
    ├── audio/                       # 音声ファイル
    │   ├── speaker0_000.wav         # 霊夢（説明役）
    │   ├── speaker1_001.wav         # 魔理沙（反応役）
    │   └── ...
    └── miyabi-progress.mp4          # 動画ファイル（H.264/AAC）
```

---

## 🔧 高度な使い方

### 1. 台本のカスタマイズ

`yukkuri-narration-generator.py`の編集：

```python
def _generate_commit_explanation(self, commit: CommitInfo) -> str:
    # カスタム台本ロジック
    return f"今日は{commit.scope}で{commit.type}したわよ！"
```

### 2. 複数日分の統合レポート

```bash
# 7日分の進捗をまとめて台本化
python yukkuri-narration-generator.py --days 7
```

### 3. 特定のcommit typeのみ抽出

```python
# featとfixのみ
commits = [c for c in commits if c.type in ['feat', 'fix']]
```

### 4. 音声パラメータ調整

VOICEVOX APIのクエリを編集：

```python
audio_query['speedScale'] = 1.2  # 話速を1.2倍
audio_query['pitchScale'] = 0.1  # ピッチ調整
audio_query['intonationScale'] = 1.5  # イントネーション強調
```

---

## 🎬 次のステップ

### ✅ Phase 12完了: 動画自動生成

**実装済み機能**:
- ✅ 音声ファイル自動連結（ffmpeg concat）
- ✅ デフォルトサムネイル生成（1920x1080）
- ✅ Full HD動画生成（H.264/AAC、Web最適化）
- ✅ 統合スクリプト（miyabi-narrate.sh）
- ✅ Lifecycle Hooks（Claude Code headless mode）

**成果物**:
- 82秒のFull HD動画（1.2MB、非常に軽量）
- 実行時間約30秒（台本→音声→動画）

---

### Phase 13: YouTube配信自動化

**YouTube Data API v3連携**:
```python
from googleapiclient.discovery import build

youtube = build('youtube', 'v3', credentials=creds)
youtube.videos().insert(
    part='snippet,status',
    body={
        'snippet': {
            'title': 'Miyabi開発進捗 2025-10-23',
            'description': '今日の開発サマリー',
            'tags': ['開発', 'ゆっくり解説', 'Rust'],
            'categoryId': '28'  # Science & Technology
        },
        'status': {'privacyStatus': 'public'}
    },
    media_body='output/miyabi-progress.mp4'
).execute()
```

**実装計画**:
- OAuth 2.0認証
- 動画メタデータ自動生成（タイトル、説明、タグ）
- アップロードスケジューリング
- プレイリスト自動整理

---

### Phase 14: Miyabi Agent統合

**NarrationAgentとして統合**:
```bash
# Miyabiの一機能として統合
miyabi agent run narration --days 3

# 自動配信モード
miyabi agent schedule narration --daily --time 18:00

# Issue駆動実行
miyabi agent run narration --issue 425
```

**実装計画**:
- `.claude/agents/specs/business/narration-agent.md` 作成済み
- `.claude/skills/voicevox/SKILL.md` 作成済み
- `.claude/commands/narrate.md` 作成済み
- Rust crate `miyabi-narration` 実装予定

---

## 🐛 トラブルシューティング

### Q1: VOICEVOX Engineに接続できない

**エラー**:
```
❌ VOICEVOX Engineに接続できません
```

**対処法**:
```bash
# エンジンが起動しているか確認
curl http://127.0.0.1:50021/version

# エンジン再起動
cd /Users/a003/dev/voicevox_engine
uv run run.py --enable_mock
```

---

### Q2: 音声ファイルが生成されない

**原因**:
- `voicevox_requests.json`が存在しない
- Speaker IDが不正

**対処法**:
```bash
# 1. 台本を再生成
python yukkuri-narration-generator.py

# 2. JSONファイルを確認
cat voicevox_requests.json

# 3. 利用可能なSpeaker IDを確認
curl http://127.0.0.1:50021/speakers | python -m json.tool
```

---

### Q3: Git commitsが取得できない

**原因**:
- Gitリポジトリ外で実行
- commit履歴がない

**対処法**:
```bash
# Gitリポジトリ内で実行
cd /Users/a003/dev/miyabi-private
python tools/yukkuri-narration-generator.py

# commit履歴確認
git log --oneline --since="3 days ago"
```

---

## 📚 参考資料

- **VOICEVOX Engine**: https://github.com/VOICEVOX/voicevox_engine
- **VOICEVOX API Docs**: https://voicevox.github.io/voicevox_engine/api/
- **Conventional Commits**: https://www.conventionalcommits.org/
- **ゆっくりムービーメーカー**: https://manjubox.net/ymm4/

---

## 📄 ライセンス

このツールはMiyabiプロジェクトの一部として、プロジェクトのライセンスに従います。

VOICEVOX Engineは LGPL v3 デュアルライセンスです。

---

**作成日**: 2025-10-23
**バージョン**: v2.0.0
**作成者**: Claude Code (AI Assistant)

**変更履歴**:
- v2.0.0 (2025-10-23): Phase 12完了 - 動画生成機能追加
- v1.0.0 (2025-10-23): 初版リリース - 台本生成 + 音声合成
