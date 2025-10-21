# Miyabi リリース戦略 - ソースコード保護モデル

**戦略**: バイナリ配布 + ドキュメント公開（ソースコードは非公開）

**更新日**: 2025-10-20
**バージョン**: v0.1.1

---

## 🎯 戦略概要

Miyabiは**商用オープンソース**モデルを採用します：

- ✅ **バイナリは無料配布**（Apache 2.0ライセンス）
- ✅ **ドキュメントは完全公開**
- ✅ **ランディングページで宣伝**
- ❌ **ソースコードは非公開**（知財保護）

### メリット

1. **オープンソースの恩恵**
   - コミュニティからの信頼
   - GitHub Starによる認知度向上
   - ユーザーフィードバックの獲得
   - SEO効果

2. **知財の保護**
   - 独自アルゴリズムの保護
   - 商業的価値の維持
   - 競合コピーの防止
   - 将来的なライセンス販売の可能性

3. **ライセンスの柔軟性**
   - バイナリ: Apache 2.0（自由利用）
   - ソースコード: プロプライエタリ
   - エンタープライズ版の可能性

---

## 📁 リポジトリ構成

### Private Repository: `Miyabi`
**現在のリポジトリ - すべてのソースコードを保持**

```
Miyabi/
├── crates/              # ✅ Rustソースコード（非公開）
│   ├── miyabi-types/
│   ├── miyabi-core/
│   ├── miyabi-cli/
│   ├── miyabi-agents/
│   └── ...
├── packages/            # ✅ TypeScriptソースコード（非公開）
├── tests/               # ✅ テストコード（非公開）
├── docs/                # 📄 一部公開
├── .claude/             # ✅ 内部ドキュメント（非公開）
└── ...
```

### Public Repository: `miyabi-release`
**新規作成 - バイナリ + ドキュメントのみ**

```
miyabi-release/
├── README.md                    # 📄 公開版README
├── LICENSE                      # 📄 Apache 2.0
├── NOTICE                       # 📄 著作権表示
├── CHANGELOG.md                 # 📄 変更履歴
├── SECURITY.md                  # 📄 セキュリティポリシー
├── docs/
│   ├── landing.html             # 📄 ランディングページ
│   ├── GETTING_STARTED.md       # 📄 スタートガイド
│   ├── CLI_USAGE_EXAMPLES.md    # 📄 使用例
│   ├── TROUBLESHOOTING.md       # 📄 トラブルシューティング
│   ├── MIYABI_CLI_USER_GUIDE.md # 📄 ユーザーガイド
│   └── schemas/                 # 📄 JSONスキーマ
├── .claude/
│   └── agents/
│       └── specs/               # 📄 Agent仕様（一部）
├── .github/
│   ├── workflows/
│   │   └── release.yml          # 📄 リリース自動化
│   └── ISSUE_TEMPLATE/          # 📄 Issueテンプレート
└── releases/                    # 📦 バイナリ配布
    └── README.md                # 📄 ダウンロード手順
```

---

## 📦 公開するファイル（詳細）

### 1. ドキュメント（docs/）

**必須**:
- ✅ `README.md` - プロジェクト概要（調整版）
- ✅ `GETTING_STARTED.md` - 5分スタートガイド
- ✅ `CLI_USAGE_EXAMPLES.md` - 実用例
- ✅ `TROUBLESHOOTING.md` - トラブルシューティング
- ✅ `MIYABI_CLI_USER_GUIDE.md` - 完全ユーザーガイド
- ✅ `landing.html` - ランディングページ

**オプション**:
- ✅ `AGENT_OPERATIONS_MANUAL.md` - Agent運用マニュアル（簡略版）
- ✅ `LABEL_SYSTEM_GUIDE.md` - ラベル体系ガイド
- ❌ `ENTITY_RELATION_MODEL.md` - 内部設計（非公開）
- ❌ `TEMPLATE_MASTER_INDEX.md` - テンプレート（非公開）

### 2. ライセンス・法務

- ✅ `LICENSE` - Apache 2.0全文
- ✅ `NOTICE` - 著作権・商標表示
- ✅ `SECURITY.md` - セキュリティポリシー
- ✅ `PRIVACY.md` - プライバシーポリシー
- ✅ `CHANGELOG.md` - 変更履歴

### 3. Agent仕様（.claude/agents/specs/）

**公開するもの**:
- ✅ Agent概要（README.md）
- ✅ Coding Agent仕様（7個）- ユーザーが理解するため
- ❌ Business Agent仕様（14個）- 将来の商品化のため非公開
- ❌ Agent実装プロンプト - 内部ロジック非公開

### 4. GitHub設定

- ✅ `.github/ISSUE_TEMPLATE/` - Issue/PRテンプレート
- ✅ `.github/workflows/release.yml` - リリース自動化のみ
- ❌ `.github/workflows/` - 他のワークフロー（非公開）

### 5. バイナリ（GitHub Releases）

- ✅ `miyabi-macos-arm64` - macOS Apple Silicon
- ✅ `miyabi-macos-x64` - macOS Intel（将来）
- ✅ `miyabi-linux-x64` - Linux（将来）
- ✅ `miyabi-windows-x64.exe` - Windows（将来）

---

## 🚫 非公開にするファイル

### 絶対に公開しないもの

1. **ソースコード**
   - `crates/` - 全Rustコード
   - `packages/` - 全TypeScriptコード
   - `src/` - 任意のソースディレクトリ

2. **テスト・開発**
   - `tests/` - テストコード
   - `benches/` - ベンチマーク
   - `.cargo/` - Cargo設定
   - `target/` - ビルド成果物

3. **内部ドキュメント**
   - `docs/RUST_MIGRATION_*.md` - 移行ドキュメント
   - `docs/ENTITY_RELATION_MODEL.md` - 内部設計
   - `docs/TEMPLATE_MASTER_INDEX.md` - テンプレート設計
   - `docs/WORKTREE_PROTOCOL.md` - 内部プロトコル
   - `docs/SAAS_BUSINESS_MODEL.md` - ビジネスモデル

4. **Agent実装**
   - `.claude/agents/prompts/` - 実行プロンプト
   - `crates/miyabi-agents/src/` - Agent実装コード
   - `crates/miyabi-business-agents/src/` - Business Agent実装

5. **MCP Server**
   - `crates/miyabi-mcp-server/` - MCP Server実装
   - `crates/miyabi-discord-mcp-server/` - Discord MCP Server

6. **設定・環境**
   - `.env` - 環境変数
   - `.miyabi.yml` - プロジェクト設定
   - `Cargo.toml` - ワークスペース設定（一部）
   - `.github/workflows/` - CI/CD設定（リリース以外）

---

## 🛠️ セットアップ手順

### Step 1: 公開リポジトリ作成

```bash
# 新しいリポジトリを作成（GitHub UI）
# Repository name: miyabi-release
# Description: Official release repository for Miyabi CLI
# Public: ✅
# Initialize with README: ❌（後で追加）
```

### Step 2: 公開ファイルの準備

```bash
# 一時ディレクトリ作成
mkdir -p /tmp/miyabi-release
cd /tmp/miyabi-release

# Git初期化
git init
git remote add origin https://github.com/ShunsukeHayashi/miyabi-release.git

# 公開ファイルをコピー（選択的）
cp -r ~/dev/Miyabi/docs/GETTING_STARTED.md docs/
cp -r ~/dev/Miyabi/docs/CLI_USAGE_EXAMPLES.md docs/
cp -r ~/dev/Miyabi/docs/TROUBLESHOOTING.md docs/
cp -r ~/dev/Miyabi/docs/MIYABI_CLI_USER_GUIDE.md docs/
cp -r ~/dev/Miyabi/docs/landing.html docs/
cp -r ~/dev/Miyabi/LICENSE .
cp -r ~/dev/Miyabi/NOTICE .
cp -r ~/dev/Miyabi/CHANGELOG.md .
cp -r ~/dev/Miyabi/SECURITY.md .

# README.mdを調整版に置き換え
cp -r ~/dev/Miyabi/docs/README-PUBLIC.md README.md
```

### Step 3: GitHub Releases設定

```bash
# バイナリアップロード（GitHub UI）
# Release title: v0.1.1 - "Insanely Great" Onboarding Edition
# Tag: v0.1.1
# Description: CHANGELOGから引用
# Assets:
#   - miyabi-macos-arm64 (8.4MB)
#   - checksums.txt
```

### Step 4: GitHub Pages有効化

```yaml
# Settings → Pages
Source: Deploy from a branch
Branch: main
Folder: /docs

# カスタムドメイン（オプション）
# Custom domain: miyabi.dev (将来)
```

---

## 🔄 リリースワークフロー

### 自動化（GitHub Actions）

**`.github/workflows/release.yml`**:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Download binaries from private repo
        run: |
          # プライベートリポジトリからビルド済みバイナリをダウンロード
          # （GitHub Personal Access Tokenが必要）
          curl -L -H "Authorization: token ${{ secrets.PRIVATE_REPO_TOKEN }}" \
            https://api.github.com/repos/ShunsukeHayashi/Miyabi/releases/latest/assets/miyabi-macos-arm64 \
            -o miyabi-macos-arm64

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            miyabi-macos-arm64
            checksums.txt
          body_path: CHANGELOG.md
```

### 手動リリース手順

1. **プライベートリポジトリでビルド**
   ```bash
   cd ~/dev/Miyabi
   cargo build --release
   ```

2. **バイナリを公開リポジトリに配置**
   ```bash
   cp target/release/miyabi /tmp/miyabi-macos-arm64
   shasum -a 256 /tmp/miyabi-macos-arm64 > /tmp/checksums.txt
   ```

3. **GitHub Releaseを作成**
   - Tag: `v0.1.1`
   - Title: "v0.1.1 - 'Insanely Great' Onboarding Edition"
   - Assets: バイナリ + checksums

4. **ドキュメント更新**
   ```bash
   cd /tmp/miyabi-release
   git pull origin main
   # 必要に応じてドキュメント更新
   git add .
   git commit -m "docs: update for v0.1.1"
   git push origin main
   ```

---

## 📊 README.md の調整

### 公開版README.mdの変更点

**削除するセクション**:
- ❌ Cargo Workspace構成
- ❌ ソースコードビルド手順
- ❌ 開発者向けガイドライン
- ❌ コントリビューション（ソースコードへの）
- ❌ 内部アーキテクチャ詳細

**追加するセクション**:
- ✅ バイナリダウンロードリンク
- ✅ "ソースコードについて" セクション
- ✅ エンタープライズ版の紹介（将来）
- ✅ スポンサーシップ

**変更例**:

```markdown
## 📦 インストール

### バイナリダウンロード（推奨）

最新版のバイナリをダウンロード：

- [macOS (Apple Silicon)](https://github.com/ShunsukeHayashi/miyabi-release/releases/latest/download/miyabi-macos-arm64)
- Linux (x86_64) - 準備中
- Windows (x86_64) - 準備中

### Homebrewからインストール（準備中）

\`\`\`bash
brew install miyabi
\`\`\`

### Cargoからインストール

\`\`\`bash
cargo install miyabi-cli
\`\`\`

**注意**: cargo installは公開されているバイナリクレートをインストールします。
ソースコードは非公開です。
```

**ソースコードについてのセクション**:

```markdown
## 🔒 ソースコードについて

Miyabiは**商用オープンソース**モデルを採用しています：

- ✅ **バイナリは無料**で利用可能（Apache 2.0ライセンス）
- ✅ **ドキュメントは完全公開**
- ❌ **ソースコードは非公開**（知財保護のため）

### なぜソースコードを公開しないのか？

1. **知財保護**: 独自のAIエージェントアルゴリズムを保護
2. **商業的価値**: 将来的なエンタープライズ版開発の可能性
3. **品質管理**: 公式ビルドのみを提供し、品質を保証

### エンタープライズ版（計画中）

企業向けに以下の機能を提供予定：
- プライベートGitHub Enterprise対応
- カスタムAgent開発
- 専任サポート
- ソースコードライセンス

詳細はお問い合わせください: [Contact](mailto:contact@example.com)
```

---

## 🎯 マーケティング戦略

### ポジショニング

**"オープンなツール、保護された知財"**

- ユーザーは自由に利用可能
- 開発者は知財を保護
- コミュニティは成長可能

### メッセージング

1. **無料で使える強力なツール**
   - "cargo install miyabi-cli で今すぐ始めよう"
   - "完全無料、商用利用可能"

2. **信頼できる公式ビルド**
   - "公式ビルドで安心"
   - "735+テストで品質保証"

3. **活発なコミュニティ**
   - "Discordで質問できる"
   - "GitHub Discussionsで議論"

### 収益化の道筋（将来）

1. **Phase 1**: 無料配布でユーザー獲得（現在）
2. **Phase 2**: Sponsorshipモデル（GitHub Sponsors）
3. **Phase 3**: エンタープライズ版販売
4. **Phase 4**: カスタムAgent開発サービス
5. **Phase 5**: SaaS版（Miyabi Cloud）

---

## 📝 FAQ

### Q1: なぜApache 2.0なのにソースコードが非公開？

A: Apache 2.0はバイナリに適用されるライセンスです。ソースコードは別のライセンス（プロプライエタリ）で保護しています。これは法的に問題ありません。

### Q2: ユーザーはソースコードを見たいと思わない？

A: 多くのユーザーは「動くツール」が欲しいだけで、ソースコードは必要ありません。興味のある開発者には、Agent仕様ドキュメントを公開しています。

### Q3: オープンソースと言えるのか？

A: 厳密には「商用オープンソース」または「ソースコード非公開のフリーソフトウェア」です。バイナリは自由に使えますが、ソースコードは保護されています。

### Q4: 将来ソースコードを公開する予定は？

A: 現時点では未定です。ビジネスモデルが確立し、十分な収益が見込める場合は、一部または全部を公開する可能性があります。

### Q5: コントリビューションはできないの？

A: ドキュメント、バグレポート、機能リクエストは大歓迎です！ただし、コード自体への直接的なコントリビューションは受け付けていません。

---

## ✅ チェックリスト

### リポジトリ作成前

- [ ] 公開するファイルリストの最終確認
- [ ] README-PUBLIC.mdの作成
- [ ] ライセンス・NOTICEファイルの確認
- [ ] バイナリのビルドとテスト

### リポジトリ作成時

- [ ] GitHubで`miyabi-release`リポジトリ作成（Public）
- [ ] 公開ファイルをコミット
- [ ] GitHub Pages有効化
- [ ] Release v0.1.1作成
- [ ] バイナリアップロード

### 公開後

- [ ] ランディングページ動作確認
- [ ] ダウンロードリンク動作確認
- [ ] Discord/Twitter/Xで告知
- [ ] README.mdにバッジ追加
- [ ] Product Huntに投稿（オプション）

---

## 🔗 リンク

- **Private Repo**: https://github.com/ShunsukeHayashi/Miyabi
- **Public Repo**: https://github.com/ShunsukeHayashi/miyabi-release（作成予定）
- **Landing Page**: https://shunsukehayashi.github.io/miyabi-release/landing.html
- **crates.io**: https://crates.io/crates/miyabi-cli（バイナリクレートのみ）

---

**このドキュメントはプライベートリポジトリにのみ保存してください。公開しないでください。**

© 2025 Shunsuke Hayashi. All rights reserved.
