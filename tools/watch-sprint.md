# 📊 Infinity Sprint ログ監視 + VOICEVOX音声通知

**作成日**: 2025-10-28
**バージョン**: 1.0.0

Infinity Sprintのログファイルをリアルタイム監視し、重要なイベント発生時にVOICEVOXで音声通知を行います。

---

## 🎯 機能

### 監視対象イベント

| イベント | トリガーワード | 音声メッセージ | 速度 |
|---------|--------------|--------------|------|
| 🚀 スプリント開始 | `Sprint N` | "新しいスプリントが始まるのだ！頑張るのだ！" | 1.2x |
| ✅ タスク成功 | `: Success`, `✅` | "やったのだ！タスクが成功したのだ！" | 1.3x |
| ❌ タスク失敗 | `: Failed`, `❌` | "失敗したのだ！でも諦めないのだ！次頑張るのだ！" | 1.0x |
| 📋 Issue完了 | `Issue #N 完了` | "Issueが1つ完了したのだ！" | 1.2x |
| ⚠️ エラー発生 | `Error`, `エラー` | "エラーが発生したのだ！確認するのだ！" | 1.0x |
| 🎉 全タスク完了 | `All tasks completed` | "全部終わったのだ！お疲れ様なのだ！すごいのだ！" | 1.4x |

---

## 🚀 使い方

### 1. VOICEVOX Engine起動確認

```bash
# Docker版（推奨）
docker ps | grep voicevox

# 起動していない場合
docker run -d --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

### 2. 監視スクリプト起動

```bash
# フォアグラウンド実行（推奨）
bash .shunsuke/watch-sprint.sh

# バックグラウンド実行
bash .shunsuke/watch-sprint.sh &
echo $! > /tmp/miyabi-watch-sprint.pid
```

### 3. Infinity Mode起動

```bash
# 別のターミナルで実行
miyabi infinity --concurrency 3 --sprint-size 5
```

---

## ⚙️ 環境変数

| 変数名 | デフォルト値 | 説明 |
|-------|------------|------|
| `VOICEVOX_HOST` | `http://localhost:50021` | VOICEVOX EngineのURL |
| `VOICEVOX_SPEAKER` | `3` (ずんだもん) | 話者ID |

### 話者ID一覧

```bash
# 話者一覧を取得
curl -s http://localhost:50021/speakers | jq -r '.[] | "\(.styles[0].id): \(.name)"'
```

**主要な話者**:
- `1`: 四国めたん
- `3`: ずんだもん（デフォルト）
- `8`: 春日部つむぎ
- `10`: 波音リツ
- `11`: 雨晴はう

### カスタマイズ例

```bash
# 四国めたんで監視
VOICEVOX_SPEAKER=1 bash .shunsuke/watch-sprint.sh

# 別のVOICEVOX Engineを使用
VOICEVOX_HOST=http://192.168.1.100:50021 bash .shunsuke/watch-sprint.sh
```

---

## 🛑 停止方法

### フォアグラウンド実行の場合
```bash
# Ctrl+C で停止
```

### バックグラウンド実行の場合
```bash
# PIDファイルから停止
kill $(cat /tmp/miyabi-watch-sprint.pid)

# プロセス名から停止
pkill -f "watch-sprint.sh"

# 強制停止
pkill -9 -f "watch-sprint.sh"
```

---

## 📊 ログ出力例

```
🔊 VOICEVOX Engine接続確認中...
✅ VOICEVOX Engine v0.24.1 接続確認

📊 監視開始: .ai/logs/infinity-sprint-2025-10-28_18-00-00.md
🔊 VoiceVox音声通知: 有効
👤 話者: ずんだもん

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎤 [VoiceVox] Infinity Sprintの監視を開始するのだ！
🚀 Sprint 1
🎤 [VoiceVox] 新しいスプリントが始まるのだ！頑張るのだ！
✅ Issue #270: Success
🎤 [VoiceVox] やったのだ！タスクが成功したのだ！
📋 Issue #270 完了
🎤 [VoiceVox] Issueが1つ完了したのだ！
```

---

## 🔧 トラブルシューティング

### 問題1: VOICEVOX Engineに接続できない

**症状**:
```
❌ VOICEVOX Engineに接続できません
```

**解決策**:
```bash
# VOICEVOX Engine起動確認
docker ps | grep voicevox

# 再起動
docker run -d --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest

# 接続テスト
curl http://localhost:50021/version
```

### 問題2: ログファイルが見つからない

**症状**:
```
⚠️  Infinity Sprintログファイルが見つかりません
```

**解決策**:
```bash
# Infinity Modeが起動しているか確認
ps aux | grep "miyabi infinity"

# Infinity Mode起動
miyabi infinity
```

### 問題3: 音声が再生されない

**症状**: 音声ファイルは生成されるが再生されない

**解決策**:
```bash
# macOS: afplayが使用可能か確認
which afplay

# Linux: aplayまたはsoxをインストール
sudo apt-get install sox  # Debian/Ubuntu
sudo yum install sox      # CentOS/RHEL
```

---

## 🎨 カスタマイズ例

### 独自メッセージの追加

`.shunsuke/watch-sprint.sh`を編集:

```bash
# "PR作成完了" を検知して通知
if [[ "$line" == *"PR created"* ]]; then
    echo -e "${GREEN}🎉 $line${NC}"
    voicevox_speak "プルリクエストを作成したのだ！レビューよろしくなのだ！" "$SPEAKER_ID" 1.2
fi
```

### 音声速度の調整

```bash
# 標準速度
voicevox_speak "メッセージ" 3 1.0

# 高速（1.5倍速）
voicevox_speak "メッセージ" 3 1.5

# ゆっくり（0.8倍速）
voicevox_speak "メッセージ" 3 0.8
```

---

## 🔗 関連ドキュメント

- [VOICEVOX Engine API仕様](http://localhost:50021/docs)
- [Miyabi CLI完全ガイド](../CLAUDE.md#-cli---)
- [Infinity Mode使用方法](../CLAUDE.md#-quick-start)

---

## 📝 更新履歴

### v1.0.0 (2025-10-28)
- ✅ 初版リリース
- ✅ 6種類のイベント検知
- ✅ VOICEVOX Engine統合
- ✅ カラー出力対応
- ✅ 自動ログファイル検出

---

**作成者**: Claude Code
**ライセンス**: MIT
