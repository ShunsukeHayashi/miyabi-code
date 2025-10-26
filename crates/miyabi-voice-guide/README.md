# 🎤 Miyabi Voice Guide

**Voice-First Onboarding System** - ドキュメント読まずに使える音声ガイド

## 🌟 概要

Miyabi Voice Guideは、ユーザーがドキュメントを読まなくても、音声ガイドだけでMiyabiを使えるようにする革新的なシステムです。

### なぜVoice-First Onboarding?

```
❌ 従来のアプローチ:
1. README.md読む（30分） → 途中で諦める確率 60%
2. エラーで詰まる → Googleで検索 → 解決できず諦める 40%
3. 成功率: 約 20%

✅ Voice-First Onboarding:
1. 音声ガイドを聞く（5分） → 諦める確率 10%
2. エラー時に音声で解決策 → 自己解決率 80%
3. 成功率: 約 70%+
```

---

## 🚀 主要機能

### 1. 自動歓迎メッセージ

初回起動時に、ずんだもんが自動的に使い方を教えてくれます：

```bash
$ miyabi

🎤 ずんだもん:
「やぁやぁ！miyabiへようこそなのだ！
 自律型AI開発フレームワークなのだ！

 まず最初に、GitHubに接続する必要があるのだ。
 `gh auth login` を実行するのだ！

 準備ができたら `miyabi init プロジェクト名` を
 実行してプロジェクトを作るのだ！」
```

### 2. エラー時の音声サポート

エラーが発生すると、自動的に解決方法を音声で案内：

```bash
$ miyabi work-on 1

❌ Error: GitHub token not found

🎤 ずんだもん:
「あれれ、GitHub tokenが見つからないのだ！

 解決方法は2つあるのだ：

 1つ目: GitHub CLIを使う方法（推奨なのだ！）
     `gh auth login` を実行するのだ！

 2つ目: 環境変数で設定する方法
     `export GITHUB_TOKEN=ghp_xxx` なのだ！」
```

### 3. 成功時の祝福メッセージ

成功すると、ずんだもんが一緒に喜んでくれます：

```bash
$ miyabi work-on 1

✅ PR #42 created successfully!

🎤 ずんだもん:
「やったのだ！PR #42が完成したのだ！🎉

 次は GitHub で確認して、レビューして、
 マージするだけなのだ！

 もっとIssueを処理したい場合は
 `miyabi work-on 番号` を実行するのだ！」
```

### 4. VOICEVOX Engine 自動起動

VOICEVOX Engineが起動していない場合、自動的にDockerで起動します：

```bash
# 1. VOICEVOX Engine未起動を検知
# 2. Docker経由で自動起動
# 3. 起動完了まで待機
# 4. 音声ガイド開始
```

---

## 📦 インストール

### 前提条件

- **Docker** - VOICEVOX Engine自動起動用
- **Rust 1.75+** - ビルド用

### 依存関係追加

```toml
[dependencies]
miyabi-voice-guide = { path = "../miyabi-voice-guide" }
```

---

## 💻 使い方

### 基本的な使用例

```rust
use miyabi_voice_guide::{VoiceGuide, VoiceMessage};

#[tokio::main]
async fn main() {
    // Voice Guide初期化
    let guide = VoiceGuide::new();

    // 歓迎メッセージ
    guide.speak(VoiceMessage::Welcome).await;

    // エラー時
    guide.speak(VoiceMessage::ErrorGitHubToken).await;

    // 成功時
    guide.speak(VoiceMessage::SuccessPrCreated { pr_number: 42 }).await;
}
```

### カスタムメッセージ

```rust
// 任意のテキストを喋らせる
guide.speak_text("カスタムメッセージなのだ！").await;
```

### 有効/無効の切り替え

```bash
# 環境変数で無効化
export MIYABI_VOICE_GUIDE=false

# プログラムから制御
let mut guide = VoiceGuide::new();
guide.disable();  // 無効化
guide.enable();   // 有効化
```

---

## 🎨 利用可能な音声メッセージ

### Welcome & Onboarding
- `VoiceMessage::Welcome` - 初回起動時の歓迎
- `VoiceMessage::NextStepInit` - 次のステップ案内（init）
- `VoiceMessage::NextStepWorkOn` - 次のステップ案内（work-on）
- `VoiceMessage::NextStepGitHubAuth` - GitHub認証案内

### Errors
- `VoiceMessage::ErrorGitHubToken` - GitHub token未設定
- `VoiceMessage::ErrorVoicevoxNotRunning` - VOICEVOX未起動
- `VoiceMessage::ErrorDockerNotFound` - Docker未インストール
- `VoiceMessage::ErrorProjectExists { project_name }` - プロジェクト重複
- `VoiceMessage::ErrorIssueNotFound { issue_number }` - Issue見つからない

### Success
- `VoiceMessage::SuccessPrCreated { pr_number }` - PR作成成功
- `VoiceMessage::SuccessProjectCreated { project_name }` - プロジェクト作成成功
- `VoiceMessage::SuccessIssueProcessed { issue_number }` - Issue処理完了

### Processing
- `VoiceMessage::ProcessingStarted { task_name }` - 処理開始
- `VoiceMessage::ProcessingCompleted { task_name }` - 処理完了

### Tips
- `VoiceMessage::Tip { tip_number }` - ランダムな豆知識

### Custom
- `VoiceMessage::Custom { text }` - 任意のテキスト

---

## 🔧 設定

### 環境変数

```bash
# 音声ガイドの有効/無効
export MIYABI_VOICE_GUIDE=false  # 無効化（デフォルト: true）

# 話者の変更
export VOICEVOX_SPEAKER=3  # ずんだもん（デフォルト）
export VOICEVOX_SPEAKER=2  # 四国めたん
export VOICEVOX_SPEAKER=8  # 春日部つむぎ

# 速度調整
export VOICEVOX_SPEED=1.2  # デフォルト: 1.2倍速
```

### プログラムから設定

```rust
use miyabi_voice_guide::{VoiceGuide, VoiceEngineConfig, Speaker, SpeakerVoice};

// カスタム設定
let config = VoiceEngineConfig {
    engine_url: "http://localhost:50021".to_string(),
    voice: SpeakerVoice::new(Speaker::ShikokuMetan)
        .with_speed(1.5)
        .with_pitch(0.1),
    auto_start: true,
    ..Default::default()
};

let guide = VoiceGuide::with_config(config);
```

---

## 🎤 VOICEVOX Engine セットアップ

### Docker版（推奨）

```bash
docker run --rm -p 127.0.0.1:50021:50021 \
  voicevox/voicevox_engine:cpu-latest
```

### 自動起動

Voice Guideは、VOICEVOX Engineが起動していない場合、自動的にDockerで起動を試みます：

```rust
let guide = VoiceGuide::new();

// 自動的にDockerでVOICEVOX Engineを起動
guide.ensure_engine_running().await?;
```

---

## 🧪 テスト

```bash
# 全テスト実行
cargo test -p miyabi-voice-guide

# 個別テスト
cargo test -p miyabi-voice-guide test_voice_guide_creation
cargo test -p miyabi-voice-guide test_welcome_message
```

### テスト結果

```
running 9 tests
test messages::tests::test_message_summary ... ok
test engine::tests::test_detect_enqueue_script ... ok
test messages::tests::test_success_pr_created ... ok
test messages::tests::test_welcome_message ... ok
test speaker::tests::test_speaker_id ... ok
test speaker::tests::test_speaker_voice_clamp ... ok
test tests::test_voice_guide_creation ... ok
test engine::tests::test_voice_engine_creation ... ok
test tests::test_voice_guide_disable ... ok

test result: ok. 9 passed; 0 failed; 0 ignored
```

---

## 📊 アーキテクチャ

```
miyabi-voice-guide/
├── src/
│   ├── lib.rs           # Public API
│   ├── engine.rs        # VOICEVOX Engine統合 + Docker自動起動
│   ├── error.rs         # エラー型定義
│   ├── messages.rs      # 音声メッセージスクリプト
│   └── speaker.rs       # 話者定義（ずんだもん等）
├── Cargo.toml
└── README.md
```

---

## 🌟 使用例: CLI統合

```rust
use miyabi_voice_guide::{VoiceGuide, VoiceMessage};

#[tokio::main]
async fn main() -> Result<()> {
    // Voice Guide初期化
    let voice_guide = VoiceGuide::new();

    match command {
        None => {
            // コマンドなし: Welcome
            voice_guide.speak(VoiceMessage::Welcome).await;
        }
        Some(Commands::Init { name, .. }) => {
            // 処理開始
            voice_guide.speak(VoiceMessage::ProcessingStarted {
                task_name: format!("Project '{}'", name),
            }).await;

            let result = create_project(&name).await;

            // 成功/失敗のフィードバック
            match result {
                Ok(_) => {
                    voice_guide.speak(VoiceMessage::SuccessProjectCreated {
                        project_name: name,
                    }).await;
                }
                Err(_) => {
                    voice_guide.speak(VoiceMessage::ErrorProjectExists {
                        project_name: name,
                    }).await;
                }
            }
        }
    }

    Ok(())
}
```

---

## 🤝 コントリビューション

新しい音声メッセージを追加する場合：

1. `src/messages.rs`に新しいvariantを追加
2. `VoiceMessage::script()`メソッドにスクリプトを実装
3. テストを追加

```rust
// messages.rsに追加
pub enum VoiceMessage {
    // ... 既存のメッセージ

    /// 新しいメッセージ
    MyNewMessage { param: String },
}

impl VoiceMessage {
    pub fn script(&self) -> String {
        match self {
            // ... 既存のマッチング

            VoiceMessage::MyNewMessage { param } => {
                format!("新しいメッセージなのだ！{}", param)
            }
        }
    }
}
```

---

## 📄 ライセンス

Apache License 2.0

---

## 🙏 謝辞

- **VOICEVOX** - 音声合成エンジン
- **ずんだもん** - デフォルト話者
- **Miyabiコミュニティ** - フィードバックと貢献

---

**Miyabi Voice Guide** - 誰もドキュメントを読まなくても使える、Voice-First Onboarding 🎤
