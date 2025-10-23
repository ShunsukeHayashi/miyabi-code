# Miyabi開発進捗 → ゆっくり解説音声ガイドシステム

Miyabiプロジェクトの開発進捗を、Git commitsから自動的に「ゆっくり解説」風の音声ガイドに変換するツール群です。

## 📋 概要

```
Git Commits → 台本生成 → VOICEVOX音声合成 → 音声ファイル出力
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

### 2. 台本生成 + 音声合成

```bash
cd /Users/a003/dev/miyabi-private/tools

# 1. 台本生成
python yukkuri-narration-generator.py

# 2. 音声合成
python voicevox-synthesizer.py
```

**ワンライナー実行**:
```bash
python yukkuri-narration-generator.py && python voicevox-synthesizer.py
```

---

### 3. 生成物の確認

```bash
# 台本確認
cat script.md

# 音声ファイル確認
ls -lh audio/

# 音声再生（macOS）
afplay audio/speaker0_000.wav
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
├── yukkuri-narration-generator.py  # 台本生成スクリプト
├── voicevox-synthesizer.py         # 音声合成スクリプト
├── README.md                        # このファイル
├── script.md                        # 生成された台本
├── voicevox_requests.json           # APIリクエストデータ
└── audio/                           # 音声ファイル出力先
    ├── speaker0_000.wav             # 霊夢
    ├── speaker1_001.wav             # 魔理沙
    └── ...
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

### Phase 7: 動画自動生成

**ゆっくりムービーメーカー（YMM）統合**:
- YMMプロジェクトファイル自動生成
- テロップ自動挿入
- サムネイル生成

### Phase 8: YouTube配信自動化

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
    media_body='video.mp4'
).execute()
```

### Phase 9: Miyabi Agent統合

**CLIツール化**:
```bash
# Miyabiの一機能として統合
miyabi narrate --days 3 --output youtube

# 自動配信モード
miyabi narrate --schedule daily --time 18:00
```

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
**バージョン**: v1.0.0
**作成者**: Claude Code (AI Assistant)
