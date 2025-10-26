# VOICEVOX Hooks Quick Start Guide

**完璧なエージェントコントロール** を体験するためのクイックスタートガイド

---

## 🎯 概要

このガイドでは、新しく実装されたVOICEVOX音声ナレーションシステムを使って、Miyabiのオーケストレーター挙動を完全に可視化する方法を説明します。

---

## 📋 前提条件

### 必須
- ✅ Rust 1.89.0以上
- ✅ VOICEVOX Engine (起動済み)
- ✅ Miyabi プロジェクト (このリポジトリ)

### オプション
- VOICEVOX GUIアプリ（音声確認用）
- スピーカーまたはヘッドフォン

---

## 🚀 セットアップ (3ステップ)

### Step 1: VOICEVOX Engineを起動

```bash
# VOICEVOX Engineが起動していることを確認
curl -s http://localhost:50021/version
# → {"version":"0.14.0"} のような応答があればOK
```

### Step 2: 環境変数を設定

```bash
# .envファイルに追加（またはexport）
echo 'VOICEVOX_NARRATION_ENABLED=true' >> .env
echo 'VOICEVOX_SPEAKER=3' >> .env  # 3 = ずんだもん
echo 'VOICEVOX_SPEED=1.1' >> .env   # 話速（0.5〜2.0）

# 環境変数を読み込み
source .env
```

### Step 3: ビルド確認

```bash
# オーケストレーターパッケージをビルド
cargo build --package miyabi-orchestrator

# ✅ コンパイル成功を確認
```

---

## 🎬 使用例

### 例1: 5-Worlds実行をナレーション付きで体験

```bash
# テストを実行してナレーションを確認
cargo test --package miyabi-orchestrator five_worlds_executor::tests::test_prepare_world_configs -- --nocapture

# 期待される音声ナレーション:
# 🔊 "5つの並行世界での実行を開始するのだ！"
# 🔊 "5つのWorktreeを生成完了したのだ！"
# 🔊 "並列実行モードなのだ！"
# 🔊 "Winner決定なのだ！World Betaが最高スコア95点で勝利！"
# 🔊 "5-Worlds実行完了なのだ！"
```

### 例2: 動的スケーリングのナレーション

```bash
# 動的スケーリングのテストを実行
cargo test --package miyabi-orchestrator dynamic_scaling::tests::test_dynamic_scaler_creation -- --nocapture

# 期待される音声ナレーション:
# 🔊 "動的スケーラーを初期化したのだ！初期並行実行数：5なのだ！"
# 🔊 "リソース監視を開始するのだ！10秒ごとに確認するのだ！"
```

### 例3: フィードバックループのナレーション

```bash
# フィードバックループのテストを実行
cargo test --package miyabi-orchestrator feedback::infinite_loop::tests::test_start_loop_convergence -- --nocapture

# 期待される音声ナレーション:
# 🔊 "フィードバックループを開始するのだ！"
# 🔊 "反復1回目が成功したのだ！スコア：70点なのだ！"
# 🔊 "自動改善を実行するのだ！スコア70点が目標85点を下回った！"
# 🔊 "収束検知なのだ！反復7回目で収束を検出したのだ！"
# 🔊 "フィードバックループ完了なのだ！"
```

---

## 🎛️ カスタマイズ

### ナレーション速度を調整

```bash
# ゆっくり話す（初心者向け）
export VOICEVOX_SPEED=0.9

# 標準速度
export VOICEVOX_SPEED=1.1

# 速く話す（上級者向け）
export VOICEVOX_SPEED=1.5
```

### 特定のイベントだけを有効化

`.claude/settings.local.json` を編集:

```json
{
  "voicevox": {
    "narration_enabled": true,
    "event_filters": {
      "orchestrator_events": true,      // 5-Worldsイベント
      "circuit_breaker_events": false,  // サーキットブレーカーは無効
      "scaling_events": true,           // スケーリングイベント
      "feedback_loop_events": true      // フィードバックループ
    }
  }
}
```

### ナレーションメッセージをカスタマイズ

フックスクリプトを直接編集:

```bash
# 例: orchestrator-event.sh のメッセージを変更
vim .claude/hooks/orchestrator-event.sh

# generate_orchestrator_narration() 関数内のメッセージを編集
# 例:
# 変更前: "5つの並行世界での実行を開始するのだ！"
# 変更後: "Five Worlds execution started!"
```

---

## 🔊 ナレーションイベント一覧

### 🌍 5-Worlds実行 (13イベント)

| イベント | タイミング | 内容 |
|---------|-----------|------|
| `five_worlds_start` | 実行開始時 | 5つの世界の説明 |
| `worktrees_spawned` | Worktree作成後 | 5つのWorktree準備完了 |
| `parallel_execution` | 並列実行選択時 | 並列実行モードの説明 |
| `winner_selected` | Winner決定時 | 勝者の発表とスコア |
| `execution_summary` | 実行完了時 | 実行時間・成功数・コスト |

[全13イベントの詳細は HOOKS_INTEGRATION_COMPLETE.md 参照]

### 🛡️ サーキットブレーカー (8イベント)

| イベント | タイミング | 内容 |
|---------|-----------|------|
| `breaker_open` | ブレーカー作動時 | 障害保護の説明 |
| `execution_skipped` | 実行スキップ時 | スキップ理由の説明 |
| `breaker_closed` | 復旧時 | 正常復帰の通知 |

### 📊 動的スケーリング (9イベント)

| イベント | タイミング | 内容 |
|---------|-----------|------|
| `scale_up` | 並行数増加時 | リソース余裕の説明 |
| `scale_down` | 並行数減少時 | リソース不足の警告 |
| `bottleneck_detected` | ボトルネック検出時 | 制限要因の詳細説明 |

### 🔄 フィードバックループ (15イベント)

| イベント | タイミング | 内容 |
|---------|-----------|------|
| `loop_start` | ループ開始時 | 目標と反復回数の説明 |
| `iteration_success` | 反復成功時 | スコアとフィードバック |
| `convergence_detected` | 収束検出時 | 収束条件の詳細説明 |
| `auto_refinement` | 自動改善時 | 改善理由の説明 |

---

## 🎓 学習パス

### 初心者向け

1. **まずは聞いてみる**
   ```bash
   cargo test --package miyabi-orchestrator -- --nocapture
   ```
   すべてのテストを実行して、様々なナレーションを聞いてみましょう。

2. **個別のイベントを理解する**
   各フックスクリプトを開いて、どんなメッセージが流れるか確認:
   ```bash
   cat .claude/hooks/orchestrator-event.sh | grep 'echo '
   ```

3. **カスタマイズに挑戦**
   好みの速度やメッセージに変更してみましょう。

### 中級者向け

1. **統合ポイントを理解する**
   Rustコードを読んで、どこでフックが呼ばれるか確認:
   ```bash
   grep -r "notify_orchestrator_event" crates/miyabi-orchestrator/src/
   ```

2. **新しいイベントを追加**
   独自のナレーションポイントを追加してみましょう。

3. **パフォーマンス測定**
   フックのオーバーヘッドを測定:
   ```bash
   time cargo test --package miyabi-orchestrator
   ```

### 上級者向け

1. **フック呼び出しフローを追跡**
   デバッグログでフック実行を確認:
   ```bash
   RUST_LOG=debug cargo test --package miyabi-orchestrator
   ```

2. **複数言語対応を実装**
   英語ナレーションを追加する。

3. **パフォーマンス最適化**
   非同期フック実行、バッチ処理等を実装。

---

## 🐛 トラブルシューティング

### Q: 音声が聞こえない

**A1**: VOICEVOX Engineが起動しているか確認
```bash
curl http://localhost:50021/version
# 応答がない場合はVOICEVOX Engineを起動
```

**A2**: 環境変数が設定されているか確認
```bash
echo $VOICEVOX_NARRATION_ENABLED  # → "true" が表示されるべき
```

**A3**: フックスクリプトが実行可能か確認
```bash
ls -la .claude/hooks/*.sh | grep "orchestrator"
# → "-rwxr-xr-x" と表示されるべき（xが実行権限）
```

### Q: エラーメッセージが表示される

**A**: フックログを確認
```bash
tail -f /tmp/voicevox_queue/hook.log
# フック実行のログが表示される
```

### Q: ナレーションが遅すぎる/速すぎる

**A**: VOICEVOX_SPEEDを調整
```bash
export VOICEVOX_SPEED=1.0  # 0.5〜2.0の範囲で調整
```

### Q: 特定のイベントだけ無効化したい

**A**: 該当するフックスクリプトで条件分岐を追加
```bash
# 例: orchestrator-event.sh の特定イベントをスキップ
if [ "$EVENT_TYPE" = "cost_report" ]; then
    exit 0  # このイベントはナレーションしない
fi
```

---

## 📊 パフォーマンス情報

### フックのオーバーヘッド

- **フック呼び出し**: ~1ms (非ブロッキング)
- **音声生成**: ~50-100ms (バックグラウンド)
- **システム影響**: ほぼゼロ（非同期実行）

### リソース使用量

- **CPU**: <1% (フック実行時)
- **メモリ**: ~5MB (音声キュー)
- **ディスク**: ~100KB (ログファイル)

---

## 🔗 関連リンク

- [HOOKS_INTEGRATION_COMPLETE.md](./HOOKS_INTEGRATION_COMPLETE.md) - 完全な実装サマリー
- [AGENT_CONTROL_TRANSPARENCY_GAP_ANALYSIS.md](./AGENT_CONTROL_TRANSPARENCY_GAP_ANALYSIS.md) - ギャップ分析
- [PERFECT_AGENT_CONTROL_PROPOSAL.md](./PERFECT_AGENT_CONTROL_PROPOSAL.md) - 実装プロポーザル
- [VOICEVOX公式サイト](https://voicevox.hiroshiba.jp/) - VOICEVOX Engine

---

## 🎉 次のステップ

1. ✅ このガイドに従ってセットアップ
2. ✅ テストを実行してナレーションを体験
3. ✅ 自分好みにカスタマイズ
4. ✅ 実際のエージェント実行で活用
5. ✅ フィードバックを共有

---

**Happy Coding with Perfect Agent Control! 🎤🤖**

**ずんだもんと一緒に、完璧なエージェントコントロールを体験するのだ！**
