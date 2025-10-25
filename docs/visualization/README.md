# Miyabi Molecular Visualization - Documentation Index

**Version**: 2.0.0
**Project**: https://github.com/customer-cloud/miyabi-private
**Live Demo**: http://localhost:3003

---

## 📚 Documentation Overview

このディレクトリには、Miyabi Molecular Visualizationの設計・使用方法に関するドキュメントが含まれています。

---

## 📖 Documents

### 1. [USER_GUIDE.md](./USER_GUIDE.md) ⭐ Start Here!
**対象**: 全ユーザー（新規・開発者・アーキテクト・トラブルシューター）

**内容**:
- 🚀 5分クイックスタート
- 🎨 画面の見方・操作方法
- 🎓 使用シーン別ガイド（4つのペルソナ）
- 💡 Tips & Tricks
- ❓ FAQ
- 🆘 サポート

**こんな時に読む**:
- Miyabi Visualizationを初めて使う
- 使い方が分からない
- エラーが発生した

---

### 2. [USER_CENTERED_DESIGN.md](./USER_CENTERED_DESIGN.md)
**対象**: プロダクトマネージャー、UXデザイナー、開発者

**内容**:
- 👥 5つのペルソナ定義
  1. 新規ユーザー (Miyabi初心者)
  2. Agent開発者
  3. システムアーキテクト
  4. トラブルシューター
  5. OSS Contributor
- 📊 各レベルで提供する情報の詳細
  - Level 0: Crate Level
  - Level 1: Module Level
  - Level 2: File Level
  - Level 3: Function Level
- 🎨 UI/UX設計
- 📖 チュートリアル・ガイド設計
- 🚀 実装優先度
- 📊 成功指標 (Success Metrics)

**こんな時に読む**:
- 「なぜこの可視化が必要か」を理解したい
- 各ユーザーが何を必要としているか知りたい
- 新機能の優先度を判断したい

---

### 3. [HIERARCHICAL_DESIGN.md](./HIERARCHICAL_DESIGN.md)
**対象**: 開発者、システムアーキテクト

**内容**:
- 🧬 分子生物学的比喩の拡張
- 📊 階層構造の詳細設計
  - Level 0: Crate (Protein Complex)
  - Level 1: Module (Domain)
  - Level 2: File (Amino Acid Residue)
  - Level 3: Function (Atomic Group)
  - Level 4: Variable (Atom)
- 🎮 インタラクション設計（ズーム/ドリルダウン）
- 🔬 解析ツールの実装
- 📦 データ形式の拡張
- 🎨 視覚化の実装
- 🚀 実装ロードマップ

**こんな時に読む**:
- 階層的可視化の技術的詳細を知りたい
- Module/File/Function Levelの実装方法を理解したい
- 分子構造比喩のマッピングを知りたい

---

### 4. [CHANGELOG_V2.md](./CHANGELOG_V2.md)
**対象**: 全ユーザー

**内容**:
- 📊 Version 2.0の主要変更点
  - Layout Direction (Top-Down → Bottom-Up)
  - Enhanced Visual Clarity (ノード・ラベル・リンク)
  - Layer Separation (100 → 200)
  - Enhanced Lighting
- 📈 改善前後の比較
- 🔍 Word Space (言葉空間) メタファー
- 📁 変更されたファイル一覧
- ✅ テスト結果

**こんな時に読む**:
- Version 2.0で何が変わったか知りたい
- 改善の理由を理解したい
- 変更履歴を確認したい

---

## 🎯 読む順番（推奨）

### 初めての方
```
1. USER_GUIDE.md (5分)
   ↓
2. 実際に触ってみる (10分)
   ↓
3. USER_CENTERED_DESIGN.md (必要に応じて)
```

### 開発者
```
1. USER_GUIDE.md (5分)
   ↓
2. HIERARCHICAL_DESIGN.md (30分)
   ↓
3. USER_CENTERED_DESIGN.md (30分)
   ↓
4. 実装開始
```

### アーキテクト
```
1. USER_CENTERED_DESIGN.md (30分)
   ↓
2. HIERARCHICAL_DESIGN.md (30分)
   ↓
3. USER_GUIDE.md (参考資料として)
```

---

## 🚀 Quick Links

### 実行
```bash
# データ生成
cargo run --package miyabi-viz --features cli --bin miyabi-viz -- \
  generate --output crates/miyabi-viz/frontend/public/structure.json

# サーバー起動
cd crates/miyabi-viz/frontend && npm run dev

# ブラウザで開く
open http://localhost:3003
```

### コードベース
- **Backend (Rust)**: `crates/miyabi-viz/`
- **Frontend (Next.js)**: `crates/miyabi-viz/frontend/`
- **CLI Tool**: `crates/miyabi-viz/src/bin/main.rs`

### 関連Issue
- Phase 1 (Crate Level): ✅ 完了
- Phase 2 (Module Level): 🔜 実装予定
- Phase 3 (File Level): 📅 計画中
- Phase 4 (Function Level): 📅 計画中

---

## 📊 Feature Status

| Feature | Status | Version | Document |
|---------|--------|---------|----------|
| **Level 0: Crate View** | ✅ 完了 | 2.0.0 | USER_GUIDE.md |
| Bottom-Up Layout | ✅ 完了 | 2.0.0 | CHANGELOG_V2.md |
| Enhanced Labels | ✅ 完了 | 2.0.0 | CHANGELOG_V2.md |
| Category Colors | ✅ 完了 | 2.0.0 | CHANGELOG_V2.md |
| Filter Panel | ⬜ 未実装 | 2.1.0 | USER_CENTERED_DESIGN.md |
| Stats Panel | ⬜ 未実装 | 2.1.0 | USER_CENTERED_DESIGN.md |
| Search | ⬜ 未実装 | 2.1.0 | USER_CENTERED_DESIGN.md |
| **Level 1: Module View** | ⬜ 未実装 | 3.0.0 | HIERARCHICAL_DESIGN.md |
| **Level 2: File View** | ⬜ 未実装 | 4.0.0 | HIERARCHICAL_DESIGN.md |
| **Level 3: Function View** | ⬜ 未実装 | 5.0.0 | HIERARCHICAL_DESIGN.md |

---

## 🎓 Concepts

### Molecular Structure Metaphor
Miyabiのコードベースを分子構造として表現:
- **Crate** = Protein Complex (タンパク質複合体)
- **Module** = Domain (ドメイン)
- **File** = Amino Acid Residue (アミノ酸残基)
- **Function** = Atomic Group (原子団)
- **Variable** = Atom (原子)

### Word Space (言葉空間)
各モジュール・ファイル・関数を「言葉」として捉え、意味的な近さを空間配置で表現:
- **Position** = 抽象度レベル
- **Distance** = 依存関係の強さ
- **Color** = カテゴリ/役割
- **Size** = 複雑さ

---

## 🆘 Support

### バグ報告・機能リクエスト
GitHub Issueで報告してください:
https://github.com/customer-cloud/miyabi-private/issues

### 質問・議論
GitHub Discussionsで質問してください:
https://github.com/customer-cloud/miyabi-private/discussions

---

## 📝 Contributing

可視化の改善アイデアがある場合:
1. USER_CENTERED_DESIGN.mdでペルソナ・ユースケースを確認
2. HIERARCHICAL_DESIGN.mdで技術的実現可能性を確認
3. Issue/PRを作成

---

**Last Updated**: 2025-10-26
**Maintainer**: Miyabi Development Team
