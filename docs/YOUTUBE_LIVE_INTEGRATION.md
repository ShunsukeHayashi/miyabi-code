# YouTube Live 統合 - 技術調査レポート & 実装Roadmap

**作成日**: 2025-10-19
**ステータス**: 技術調査完了 ✅
**実現可能性**: 🟢 **実装可能**

---

## 📋 目次

1. [概要](#概要)
2. [技術調査結果](#技術調査結果)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [実装Roadmap](#実装roadmap)
5. [コスト見積もり](#コスト見積もり)
6. [リスクと対策](#リスクと対策)
7. [次のステップ](#次のステップ)

---

## 概要

### 🎯 プロジェクトビジョン

**「みやび」がYouTube Liveで24時間自動開発配信を行い、視聴者のコメントを拾いながらリアルタイムで機能実装を進める**

視聴者参加型の完全自律開発プラットフォームを実現します。

### ✨ 主な機能

1. **YouTube Live自動配信**
   - コーディング画面のリアルタイム配信
   - スケジュール配信（cron連携）
   - 自動開始/停止

2. **リアルタイムコメント取得**
   - YouTube Live Chat APIでコメント監視
   - フィルタリング（開発要望のみ抽出）
   - スパム対策

3. **AI駆動タスク生成**
   - Claude 4 Opusでコメント解析
   - 自然言語→Issueタスク変換
   - 優先度・実現可能性の自動判定

4. **自動実装 & フィードバック**
   - Miyabi Agent自動実行
   - 進捗をライブチャットに投稿
   - 実装完了を視聴者に通知

---

## 技術調査結果

### 1️⃣ YouTube Live Chat API

#### 📚 公式ドキュメント
- [YouTube Live Streaming API](https://developers.google.com/youtube/v3/live/docs)
- [LiveChatMessages](https://developers.google.com/youtube/v3/live/docs/liveChatMessages)

#### ✅ できること
- ✅ リアルタイムでライブチャットのコメント取得
- ✅ `liveChatMessage.list` でメッセージ一覧取得
- ✅ `liveChatMessage.insert` でBotがコメント投稿
- ✅ サーバーストリーミング接続（低レイテンシー）

#### ⚠️ 制約
- ❌ **APIクォータ制限**: 頻繁なポーリングは日次クォータを消費
- ⚠️ 高頻度リアルタイムには**クォータ拡張申請が必要**
- ✅ `pollingIntervalMillis` で推奨ポーリング間隔を取得可能

#### 🦀 Rustライブラリ
- **youtube_chat** crate (2024年12月更新)
  - リアルタイムチャット取得
  - 使いやすいAPI
- **google_youtube3** crate (v6.0.0+20240626)
  - YouTube Data API v3の完全ラッパー
  - OAuth 2.0認証サポート

#### 📝 実装例
```rust
use youtube_chat::{live_chat::LiveChatClientBuilder, item::MessageItem};

#[tokio::main]
async fn main() {
    let client = LiveChatClientBuilder::new()
        .live_id("YOUR_LIVE_ID")
        .build();

    while let Some(Ok(response)) = client.next().await {
        for msg in response.items {
            if let MessageItem::TextMessageItem(text_msg) = msg {
                println!("{}: {}", text_msg.author.name, text_msg.message);
                // コメント解析 & タスク生成
                analyze_and_create_task(&text_msg).await;
            }
        }
    }
}
```

---

### 2️⃣ YouTube Live Streaming API (配信制御)

#### 📚 公式ドキュメント
- [LiveBroadcasts](https://developers.google.com/youtube/v3/live/docs/liveBroadcasts)

#### ✅ できること
- ✅ プログラムで配信イベント作成
- ✅ `enableAutoStart` / `enableAutoStop` で自動開始/停止
- ✅ `liveBroadcasts.transition` で配信状態遷移（testing → live）
- ✅ ストリームキーの取得・管理

#### 📝 配信開始フロー
```
1. 配信イベント作成 (liveBroadcasts.insert)
2. ストリームにバインド (liveBroadcasts.bind)
3. 状態遷移 (liveBroadcasts.transition)
   - ready → testing → live
4. ストリーム送信開始（FFmpeg等）
```

---

### 3️⃣ RTMP配信 (FFmpeg)

#### 🎥 スクリーンキャプチャ配信

**macOS/Linuxでの画面キャプチャ**:
```bash
# macOS (AVFoundation)
ffmpeg -f avfoundation -i "1:0" \
  -vcodec libx264 -preset veryfast -b:v 2500k \
  -maxrate 2500k -bufsize 5000k \
  -pix_fmt yuv420p -g 50 \
  -f flv rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY

# Linux (x11grab)
ffmpeg -framerate 30 -video_size 1920x1080 -f x11grab -i :0.0 \
  -vcodec libx264 -preset veryfast -b:v 2500k \
  -f flv rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY
```

#### 🤖 自動化
- **cronでスケジュール配信**
  ```cron
  0 9 * * * /path/to/start_stream.sh
  0 18 * * * /path/to/stop_stream.sh
  ```
- **Python自動化**: `pylivestream` パッケージ利用可能

---

### 4️⃣ AI駆動コメント解析 (Claude API)

#### 🧠 Claude 4 Opusの能力

**SWE-bench スコア**: **72-73%**（2025年トップ）

#### ✅ できること
- ✅ 自然言語の開発要望を理解
- ✅ 曖昧な表現から具体的なタスクを生成
- ✅ 実現可能性の判定
- ✅ 優先度の自動割り当て
- ✅ Issue/PR の自動作成

#### 📝 実装例
```rust
use anthropic_sdk::Client;

async fn analyze_comment(comment: &str) -> Option<Task> {
    let client = Client::new(env::var("ANTHROPIC_API_KEY")?);

    let prompt = format!(
        "以下のYouTubeコメントから開発タスクを抽出してください:\n\n{}\n\n\
        JSON形式で返してください: {{\"task\": \"...\", \"priority\": \"...\", \"feasible\": true/false}}",
        comment
    );

    let response = client.messages()
        .model("claude-opus-4-20250514")
        .max_tokens(1024)
        .message(prompt)
        .send()
        .await?;

    // JSON parse & Task生成
    parse_task_from_response(&response)
}
```

---

## アーキテクチャ設計

### 🏗️ システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                  YouTube Live Platform                   │
│  ┌──────────────┐            ┌──────────────┐           │
│  │ Live Stream  │            │  Live Chat   │           │
│  │ (RTMP/HLS)   │            │   (API v3)   │           │
│  └──────┬───────┘            └──────┬───────┘           │
└─────────┼────────────────────────────┼──────────────────┘
          │                            │
          │ ①Video                     │ ②Comments
          │                            │
┌─────────▼────────────────────────────▼──────────────────┐
│              Miyabi YouTube Live Agent                   │
│                                                          │
│  ┌────────────────┐      ┌─────────────────┐           │
│  │ Stream Manager │      │ Chat Listener    │           │
│  │  (FFmpeg)      │      │ (youtube_chat)   │           │
│  └────────────────┘      └────────┬─────────┘           │
│                                   │                      │
│                          ③Comment │                      │
│                                   │                      │
│                          ┌────────▼─────────┐            │
│                          │ AI Analyzer      │            │
│                          │ (Claude 4 Opus)  │            │
│                          └────────┬─────────┘            │
│                                   │                      │
│                          ④Task    │                      │
│                                   │                      │
│  ┌────────────────────────────────▼──────────────────┐  │
│  │         Miyabi Agent Orchestrator                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│  │  │CodeGen   │ │Review    │ │Deploy    │  ...     │  │
│  │  └──────────┘ └──────────┘ └──────────┘          │  │
│  └────────────────────────────┬───────────────────────┘  │
│                                │                          │
│                       ⑤Result  │                          │
│                                │                          │
│  ┌────────────────────────────▼───────────────────────┐  │
│  │         Feedback Manager                            │  │
│  │  - ライブチャットに進捗投稿                              │  │
│  │  - GitHub Issue/PR更新                               │  │
│  │  - 視聴者への完了通知                                   │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 🧩 コンポーネント詳細

#### 1. **Stream Manager**
- **役割**: 画面キャプチャ & RTMP配信
- **技術**: FFmpeg
- **機能**:
  - VSCodeウィンドウのキャプチャ
  - リアルタイムエンコーディング
  - RTMPストリーム送信
  - 自動再接続

#### 2. **Chat Listener**
- **役割**: ライブチャットのリアルタイム監視
- **技術**: `youtube_chat` crate
- **機能**:
  - コメントの取得（ポーリング）
  - スーパーチャット検出
  - スパムフィルタリング
  - コメント履歴保存

#### 3. **AI Analyzer**
- **役割**: コメントから開発タスクを抽出
- **技術**: Claude 4 Opus API
- **機能**:
  - 自然言語理解
  - タスク生成（JSON出力）
  - 実現可能性判定
  - 優先度割り当て

#### 4. **Agent Orchestrator**
- **役割**: 既存のMiyabi Agentを実行
- **技術**: Miyabi Agent System
- **機能**:
  - タスクのDAG分解
  - Worktree並列実行
  - エラーハンドリング
  - 実行統計収集

#### 5. **Feedback Manager**
- **役割**: 視聴者へのフィードバック
- **技術**: YouTube Live Chat API
- **機能**:
  - 進捗をチャットに投稿
  - Issue/PR URLの共有
  - 完了通知
  - エラー報告

---

## 実装Roadmap

### 🎯 Phase 1: 基礎インフラ構築 (2週間)

**目標**: YouTube配信とチャット取得の基本動作を実現

#### タスク
- [ ] **T1.1**: YouTube Data API v3のOAuth 2.0認証実装
- [ ] **T1.2**: `youtube_chat` crateを使ったチャット取得テスト
- [ ] **T1.3**: FFmpegスクリプトでスクリーンキャプチャ配信テスト
- [ ] **T1.4**: 配信自動開始/停止スクリプト作成
- [ ] **T1.5**: APIクォータ監視ツール作成

**成果物**:
- YouTube Live配信の自動化スクリプト
- ライブチャット取得のRustサンプルコード

---

### 🤖 Phase 2: AI解析エンジン実装 (2週間)

**目標**: コメントからタスク生成を自動化

#### タスク
- [ ] **T2.1**: Claude API統合 (Rust SDK)
- [ ] **T2.2**: プロンプトエンジニアリング（コメント→Task変換）
- [ ] **T2.3**: JSON出力のバリデーション
- [ ] **T2.4**: 実現可能性判定ロジック実装
- [ ] **T2.5**: タスク優先度自動割り当て

**成果物**:
- `YouTubeCommentAnalyzer` モジュール
- タスク生成のユニットテスト

---

### 🎬 Phase 3: Agent統合 & フィードバック (2週間)

**目標**: 既存Agentと統合し、視聴者にフィードバック

#### タスク
- [ ] **T3.1**: `YouTubeLiveAgent` 実装（新Agent）
- [ ] **T3.2**: Orchestratorとの統合
- [ ] **T3.3**: ライブチャットへの進捗投稿機能
- [ ] **T3.4**: GitHub Issue自動作成（コメント起点）
- [ ] **T3.5**: エラーハンドリング & リトライロジック

**成果物**:
- `crates/miyabi-agents/src/youtube_live.rs`
- エンドツーエンドテスト

---

### 🚀 Phase 4: 本番運用 & 最適化 (継続的)

**目標**: 24時間自動配信の安定運用

#### タスク
- [ ] **T4.1**: クォータ拡張申請（Google）
- [ ] **T4.2**: 監視ダッシュボード構築（Grafana/Prometheus）
- [ ] **T4.3**: スパム対策強化
- [ ] **T4.4**: 視聴者参加型機能追加（投票システム等）
- [ ] **T4.5**: パフォーマンスチューニング

**成果物**:
- 本番環境デプロイ
- 運用ドキュメント

---

## コスト見積もり

### 💰 月額コスト試算（24時間配信想定）

#### 1. YouTube API クォータ

**無料枠**: 10,000 units/day

**必要クォータ**:
- `liveChatMessages.list`: **5 units/call**
- ポーリング間隔: 5秒 → 17,280 calls/day
- **必要クォータ**: 86,400 units/day

**結論**: 🚨 **クォータ拡張申請が必須**

**拡張申請後の想定コスト**: 無料（通常、非商用利用では無料拡張可能）

#### 2. Claude API (AI解析)

**想定コメント数**: 1,000 comments/day（視聴者100人想定）

**コスト計算**:
- Input: 500 tokens/comment × 1,000 = 500,000 tokens/day
- Output: 200 tokens/comment × 1,000 = 200,000 tokens/day
- **月間トークン**: 15M input + 6M output
- **Claude 4 Opus価格**: $15/M input, $75/M output
- **月額コスト**: (15 × $15) + (6 × $75) = **$225 + $450 = $675/月**

**最適化案**:
- Claude Sonnet 4.5を使用 → **約$100/月**
- DeepSeek V3を使用 → **約$10/月**

#### 3. インフラコスト

- **ストリーミングサーバー**: 既存マシン（$0）
- **ストレージ**: GitHub LFS（$0 - $5/月）
- **監視ツール**: Grafana Cloud Free Tier（$0）

### 📊 総コスト

| 項目 | 月額コスト |
|------|----------|
| YouTube API | $0（拡張申請後） |
| Claude 4 Opus | $675 |
| Claude Sonnet 4.5 | $100 |
| DeepSeek V3 | $10 |
| インフラ | $5 |

**推奨構成（Phase 1）**: DeepSeek V3 → **$15/月**
**推奨構成（本番）**: Claude Sonnet 4.5 → **$105/月**

---

## リスクと対策

### ⚠️ リスク1: APIクォータ制限

**リスク**: YouTube APIのクォータ超過により配信停止

**対策**:
- ✅ クォータ拡張申請を最優先で実施
- ✅ ポーリング間隔を最適化（5秒 → 10秒）
- ✅ キャッシュ機能でAPI呼び出し削減

---

### ⚠️ リスク2: 不適切なコメント

**リスク**: スパム、荒らし、不適切な要望

**対策**:
- ✅ コメントフィルタリング（NGワード）
- ✅ AI判定で悪質コメントをブロック
- ✅ 視聴者投票システム（要望の妥当性を民主的に判断）

---

### ⚠️ リスク3: AI誤判定

**リスク**: コメントを誤解して不要なタスク生成

**対策**:
- ✅ 信頼度スコアリング（低信頼度は手動承認）
- ✅ 人間の承認フロー（Phase 1では必須）
- ✅ プロンプト最適化で精度向上

---

### ⚠️ リスク4: 配信品質問題

**リスク**: 画面ラグ、音声途切れ、エンコード失敗

**対策**:
- ✅ FFmpegパラメータ最適化
- ✅ 自動再接続ロジック
- ✅ ヘルスチェック監視

---

## 次のステップ

### 🎯 即座にできること

1. **Issue #220 作成**: YouTube Live Agent実装
2. **YouTube API OAuth設定**: Google Cloud Consoleでプロジェクト作成
3. **FFmpeg配信テスト**: スクリーンキャプチャの動作確認
4. **プロトタイプ実装**: 最小限の機能でPoCを構築

### 📅 今週の目標

- [ ] Issue #220 作成 & ラベル付け
- [ ] YouTube Data API v3のOAuth認証設定
- [ ] FFmpegスクリプトで配信テスト
- [ ] `youtube_chat` crateでチャット取得テスト

### 🚀 長期目標（3ヶ月）

- [ ] Phase 1-3の完了
- [ ] YouTube チャンネル「みやび - AI開発ライブ」開設
- [ ] 初回配信イベント開催
- [ ] 視聴者100人達成

---

## まとめ

### ✅ 実現可能性: **高い**

**理由**:
1. 必要な技術スタックが全て揃っている
2. Rustライブラリが成熟している
3. Claude 4のAI能力が十分に高い
4. 既存のMiyabi Agentシステムと相性が良い

### 💡 推奨アプローチ

1. **Phase 1を2週間で完了**: まずは配信とチャット取得を実現
2. **小規模テスト配信**: 視聴者10人程度で動作確認
3. **段階的スケールアップ**: 視聴者数・コメント数に応じて最適化
4. **コミュニティ構築**: 視聴者を巻き込んでプロジェクトを成長

---

**作成者**: Claude Code (miyabi)
**最終更新**: 2025-10-19
**関連Issue**: #219, #220（作成予定）

---

## 参考リンク

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [YouTube Live Streaming API](https://developers.google.com/youtube/v3/live)
- [youtube_chat crate](https://lib.rs/crates/youtube_chat)
- [FFmpeg Live Streaming Guide](https://www.dacast.com/blog/how-to-broadcast-live-stream-using-ffmpeg/)
- [Claude 4 Documentation](https://docs.anthropic.com/)
