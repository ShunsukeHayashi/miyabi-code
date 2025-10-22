# /voicevox コマンド

VOICEVOXサーバーに音声合成リクエストを投げて、バックグラウンドで音声を再生します。

## 使い方

```
/voicevox "テキスト" [speaker] [speedScale]
```

**パラメータ**:
- `text` (必須): 読み上げるテキスト
- `speaker` (オプション): 話者ID（デフォルト: 3 = ずんだもん）
- `speedScale` (オプション): 話速（デフォルト: 1.2 = 1.2倍速）

**話者ID一覧**:
- `2` - 四国めたん（女性、かわいい）
- `3` - ずんだもん（女性、元気）
- `8` - 春日部つむぎ（女性、明るい）
- `9` - 波音リツ（女性、落ち着き）

## 実行内容

1. テキストをVOICEVOXキューに追加
2. バックグラウンドワーカーが順次処理
3. 前の発話が終わったら次を自動スタート
4. メインフローは即座に次のタスクに進む

## 実装

```bash
# キューに追加
/tmp/voicevox_enqueue.sh "$TEXT" $SPEAKER $SPEED

# すぐにメインフローに戻る（待たない）
```

## キューワーカー

バックグラウンドで常駐するワーカーが処理を担当:
- PID: `/tmp/voicevox_queue/worker.lock`
- ログ: `/tmp/voicevox_queue/worker.log`
- キュー: `/tmp/voicevox_queue/*.json`

## ログ確認

```bash
# リアルタイムログ
tail -f /tmp/voicevox_queue/worker.log

# キュー状態
ls -1 /tmp/voicevox_queue/*.json | wc -l
```

## 例

```bash
# ずんだもんで1.2倍速
/voicevox "やぁやぁ!ずんだもんなのだ!" 3 1.2

# 四国めたんで通常速度
/voicevox "こんにちは!" 2 1.0

# 霊夢と魔理沙の掛け合い
/voicevox "やっほー!" 2 1.2
/voicevox "おう!今日も頑張ったぜ!" 8 1.2
```
