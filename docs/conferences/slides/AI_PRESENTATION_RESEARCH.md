# AI-Driven Presentation Generation Research
**Date**: 2025-10-22
**Purpose**: GitHub全体検索によるAI/Agent駆動スライド生成システムの参考実装調査

---

## 調査対象リポジトリ

### 1. PPTAgent (EMNLP 2025)
**Repository**: https://github.com/icip-cas/PPTAgent
**Stars**: Academic research project
**Tech Stack**: Python (94.3%), Vue (3.9%), Docker

#### アーキテクチャ
- **Two-Phase Approach**:
  - **Analysis Phase**: 既存プレゼンからパターン抽出（手動アノテーション不要）
  - **Generation Phase**: 構造化アウトライン開発 → 視覚的に一貫性のあるスライド生成

#### 主要機能
- **Dynamic Content Generation**: テキストと画像をシームレスに統合
- **Smart Reference Learning**: 既存プレゼンからパターン認識で学習
- **PPTEval Framework**: 多次元評価システム
  - Content: 正確性と関連性
  - Design: 視覚的魅力と一貫性
  - Coherence: 論理的フローとアイデアの進行
- **MCP Server Support**: 他ツールとの統合

#### Miyabiへの適用可能性
✅ **高**: Pattern Recognition（既存高品質スライドから学習）
✅ **高**: Multi-dimensional Evaluation（Content/Design/Coherence評価）
✅ **中**: MCP Server統合（Miyabi AgentとのAgent間連携）
⚠️ **課題**: Python実装 → Rust/TypeScript統合が必要

---

### 2. presentation-ai (Gamma Alternative)
**Repository**: https://github.com/allweonedev/presentation-ai
**License**: MIT (Open Source)
**Tech Stack**: Next.js, React, TypeScript, Prisma, PostgreSQL

#### アーキテクチャ
- **Frontend**: React + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Next.js API routes + NextAuth.js
- **Data Layer**: PostgreSQL + Prisma ORM
- **Rich Editing**: Plate.js (text/images) + DND Kit (drag-drop)
- **File Uploads**: UploadThing

#### ワークフロー
1. **Outline Phase**: ユーザーがトピック入力 → AIがアウトライン生成
2. **Approval**: ユーザーがアウトライン編集・承認
3. **Real-Time Generation**: スライドを順次生成、進捗表示
4. **Auto-Save**: 変更を自動保存

#### Theme Customization
- **Built-in Themes**: 9つのプリセットテーマ
- **Custom Creation**: 色、フォント、レイアウトをカスタマイズ
- **Theme Persistence**: Prisma ORMで永続化

#### AI Integration
- **Primary**: OpenAI API（コンテンツ生成）
- **Image**: Together AI API
- **Local Models**: Ollama / LM Studio（CORSサポート）

#### Gamma との差別化
- ✅ Open Source（MIT License）
- ✅ Local Model Support（クラウド依存を排除）
- ✅ Full Theme Control（ブランドアイデンティティ完全制御）
- ✅ Real-Time Visual Feedback（生成中のライブプレビュー）

#### Miyabiへの適用可能性
✅ **高**: Component-Based Architecture（Reveal.jsプラグイン設計に適用）
✅ **高**: Theme Customization System（複数テーマサポート）
✅ **高**: Outline Phase → Generation Workflow（構造化生成プロセス）
✅ **中**: State Management（Reveal.js controller統合）
✅ **中**: Drag-and-Drop（スライド並び替え）
⚠️ **課題**: Next.js/React → 静的HTML/Reveal.js変換が必要

---

### 3. ChatPPT (Multi-Model Integration)
**Repository**: https://github.com/Jayden-Cho/ChatPPT
**Tech Stack**: ChatGPT, Dall-E, Stable Diffusion, python-pptx, Gradio

#### AI Model Orchestration
**`gr_generate_slides()` 関数** (util.py):
1. AIモデルでコンテンツをブレインストーム
2. 画像生成関数を呼び出し
3. スライドを個別に構築
4. タイトル・目次等の構造要素を追加

#### Interactive Workflow
1. `python app.py` でアプリ起動
2. プレゼンパラメータ入力（ページ数、トピック、ファイル名）
3. カスタマイズ選択（画像生成モデル、レイアウト、フォント）
4. 生成ボタンクリック
5. プレビュー → .pptxダウンロード → イテレーション可能

#### Customization System
- **Basics Tab**: スライド数、テーマ、出力ファイル名
- **Customizations Tab**:
  - Image Generation: Dall-E vs Stable Diffusion
  - Layout: Orientation（横/縦）
  - Font: フォントカスタマイズ

#### Image Generation Strategy
- ユーザー選択式（アルゴリズム的な自動選択なし）
- Dall-E: 高品質、商用利用可、コスト高
- Stable Diffusion: オープンソース、カスタマイズ可、コスト低

#### Miyabiへの適用可能性
✅ **中**: Multiple AI Models Orchestration（BytePlus ARK + OpenAI + Stable Diffusion）
✅ **中**: Interactive Customization UI（Gradio → Web UI）
✅ **中**: Iteration Capability（複数回生成・改善）
⚠️ **課題**: .pptx専用 → Reveal.js HTML/Markdown変換が必要

---

## 📊 統合分析: Miyabiスライドへの適用優先度

| 改善項目 | 由来 | 優先度 | 実装難易度 | 期待効果 |
|---------|------|--------|-----------|---------|
| **Theme Customization System** | presentation-ai | 🔥 P0 | 中 | 複数のデザインスタイル切り替え |
| **Multi-dimensional Evaluation** | PPTAgent | 🔥 P0 | 高 | Content/Design/Coherence評価 |
| **Outline Phase Workflow** | presentation-ai | 🔥 P1 | 中 | 構造化された生成プロセス |
| **Multiple AI Models** | ChatPPT | 🟡 P1 | 高 | 画像生成の選択肢拡大 |
| **Pattern Learning** | PPTAgent | 🟡 P2 | 高 | 既存スライドから学習 |
| **Real-Time Preview** | presentation-ai | 🟢 P2 | 中 | 生成中のライブフィードバック |
| **Drag-and-Drop Editing** | presentation-ai | 🟢 P2 | 低 | スライド並び替えUI |
| **MCP Server Integration** | PPTAgent | 🟢 P3 | 高 | Miyabi Agent連携 |

---

## 🎯 推奨実装: Phase 4.5改善

### 即座に適用可能（今セッション）

#### 1. Theme Customization System
**実装**: 複数CSSファイルをサポート

```javascript
// script.js に追加
const AVAILABLE_THEMES = {
    'apple': 'styles-apple.css',      // 現在のミニマル白ベース
    'modern': 'styles-v2.css',        // モダンなグラデーション
    'classic': 'styles-classic.css',  // 伝統的なビジネススタイル
    'dark': 'styles-dark.css'         // ダークモード
};

function switchTheme(themeName) {
    const link = document.querySelector('link[rel="stylesheet"][href*="styles-"]');
    link.href = AVAILABLE_THEMES[themeName];
    localStorage.setItem('miyabi-theme', themeName);
}

// 起動時にテーマ復元
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('miyabi-theme') || 'apple';
    switchTheme(savedTheme);
});
```

**利点**:
- ✅ ユーザーがプレゼン状況に応じてスタイル切り替え可能
- ✅ Appleスタイル、モダン、クラシック、ダークモードを選択
- ✅ LocalStorageで設定永続化

#### 2. Slide Quality Evaluation（簡易版）
**実装**: 各スライドのContent/Design/Coherenceスコア表示

```javascript
// script.js に追加
function evaluateSlideQuality(slideIndex) {
    const slide = Reveal.getSlide(slideIndex);

    // Content Score: テキスト量と構造化レベル
    const contentScore = evaluateContent(slide);

    // Design Score: 視覚要素のバランス
    const designScore = evaluateDesign(slide);

    // Coherence Score: 前後スライドとの論理的つながり
    const coherenceScore = evaluateCoherence(slideIndex);

    return {
        content: contentScore,
        design: designScore,
        coherence: coherenceScore,
        overall: (contentScore + designScore + coherenceScore) / 3
    };
}

function evaluateContent(slide) {
    const textLength = slide.textContent.trim().length;
    const hasHeading = slide.querySelector('h1, h2, h3') !== null;
    const hasList = slide.querySelector('ul, ol') !== null;

    let score = 0;
    if (textLength >= 50 && textLength <= 500) score += 40; // 適切な文字数
    if (hasHeading) score += 30; // 見出しあり
    if (hasList) score += 30; // リストあり

    return Math.min(score, 100);
}

function evaluateDesign(slide) {
    const hasImage = slide.querySelector('img') !== null;
    const hasCode = slide.querySelector('code, pre') !== null;
    const hasAnimation = slide.querySelector('[data-aos]') !== null;

    let score = 50; // ベーススコア
    if (hasImage) score += 25; // 視覚要素
    if (hasCode) score += 15; // コード例
    if (hasAnimation) score += 10; // アニメーション

    return Math.min(score, 100);
}

function evaluateCoherence(slideIndex) {
    // 簡易実装: 前後スライドとのトピック類似度
    // 実際にはNLP処理が必要だが、ここではスライド番号の連続性で近似
    return 85; // 現状は固定値
}

// スライド変更時に評価表示
Reveal.on('slidechanged', (event) => {
    const quality = evaluateSlideQuality(event.indexh);
    console.log(`📊 Slide ${event.indexh} Quality:`, quality);

    // 低品質スライドに警告
    if (quality.overall < 60) {
        console.warn(`⚠️ Slide ${event.indexh} needs improvement!`);
    }
});
```

**利点**:
- ✅ 各スライドの品質を数値化（PPTEval簡易版）
- ✅ 低品質スライドを自動検出
- ✅ コンソールで改善点を把握

### 中期実装（次セッション以降）

#### 3. Outline-Driven Generation Workflow
**実装**: `generate-slides-from-outline.js` スクリプト

```javascript
// generate-slides-from-outline.js（新規作成案）
const SLIDE_OUTLINE = {
    title: "Miyabi - 完全自律型AI開発OS",
    sections: [
        {
            title: "はじめに",
            slides: [
                { type: "title", content: "タイトルスライド" },
                { type: "intro", content: "自己紹介" }
            ]
        },
        {
            title: "問題提起",
            slides: [
                { type: "problem", content: "現状の課題" },
                { type: "statistics", content: "データで見る問題" }
            ]
        },
        {
            title: "ソリューション",
            slides: [
                { type: "solution", content: "Miyabiの特徴" },
                { type: "architecture", content: "アーキテクチャ図" },
                { type: "demo", content: "デモ動画" }
            ]
        }
    ]
};

async function generateSlidesFromOutline(outline) {
    let html = '';

    for (const section of outline.sections) {
        for (const slide of section.slides) {
            html += await generateSlideHTML(slide.type, slide.content);
        }
    }

    return html;
}

async function generateSlideHTML(type, content) {
    // BytePlus ARK APIでコンテンツ生成
    const response = await fetch('https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.BYTEPLUS_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'ep-20250315091006-vg89g',
            messages: [
                {
                    role: 'user',
                    content: `Create a Reveal.js slide (HTML) for: ${type} - ${content}`
                }
            ]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}
```

**利点**:
- ✅ アウトライン駆動の構造化生成
- ✅ スライドタイプごとのテンプレート適用
- ✅ AI生成コンテンツの一貫性向上

#### 4. Multiple AI Models Support
**実装**: Provider abstraction layer

```javascript
// ai-providers.js（新規作成案）
class AIProvider {
    async generateText(prompt) { throw new Error('Not implemented'); }
    async generateImage(prompt, options) { throw new Error('Not implemented'); }
}

class BytePlusProvider extends AIProvider {
    async generateText(prompt) {
        // BytePlus ARK API
    }

    async generateImage(prompt, options) {
        // seedream-4-0-250828
    }
}

class OpenAIProvider extends AIProvider {
    async generateText(prompt) {
        // GPT-4 API
    }

    async generateImage(prompt, options) {
        // DALL-E 3 API
    }
}

class StableDiffusionProvider extends AIProvider {
    async generateImage(prompt, options) {
        // Stable Diffusion API
    }
}

// Provider Manager
class AIProviderManager {
    constructor() {
        this.providers = {
            'byteplus': new BytePlusProvider(),
            'openai': new OpenAIProvider(),
            'stablediffusion': new StableDiffusionProvider()
        };
    }

    async generateImage(prompt, provider = 'byteplus') {
        return this.providers[provider].generateImage(prompt);
    }
}
```

**利点**:
- ✅ 複数AIモデルをシームレスに切り替え
- ✅ コスト最適化（高品質: DALL-E、低コスト: Stable Diffusion）
- ✅ フォールバック機能（1つのAPIが失敗したら別のを試す）

---

## 🚀 今セッションでの実装優先度

### P0（即実装）: Theme Customization System
- ✅ `styles-classic.css` 作成（ビジネス向け）
- ✅ `styles-dark.css` 作成（ダークモード）
- ✅ `script.js` にテーマ切り替え機能追加
- ✅ テーマセレクタUI追加（Reveal.js menu plugin利用）

### P1（時間あれば）: Slide Quality Evaluation
- ✅ `evaluateSlideQuality()` 関数実装
- ✅ コンソールに品質スコア表示
- ✅ 低品質スライドに警告

---

## 📚 参考リンク

- **PPTAgent**: https://github.com/icip-cas/PPTAgent
- **presentation-ai**: https://github.com/allweonedev/presentation-ai
- **ChatPPT**: https://github.com/Jayden-Cho/ChatPPT
- **Reveal.js**: https://revealjs.com/
- **BytePlus ARK API**: https://www.volcengine.com/docs/82379/1263512

---

**作成日**: 2025-10-22
**次のアクション**: Theme Customization System実装（styles-classic.css, styles-dark.css作成）
