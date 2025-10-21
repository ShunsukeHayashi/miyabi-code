# A/B Testing Guide - BytePlus Landing Page

## 📋 概要

このドキュメントは、BytePlus Video API BootcampランディングページのA/Bテスト実装ガイドです。

**実装日**: 2025-10-22
**テスト対象**: ヘッドライン、CTAボタンカラー、料金表示順序
**トラッキング**: Google Analytics 4, Facebook Pixel, LinkedIn Insight Tag

---

## 🧪 実装された A/B テスト

### 1. ヘッドラインテスト（3バリエーション）

**目的**: CVR最適化のための最適なヘッドラインコピーを発見

| Variant | テキスト | 重み |
|---------|---------|------|
| Control (A) | 次世代動画生成API<br>実装完全マスター | 33% |
| Variant B | 動画生成APIで<br>月30万円を稼ぐ | 33% |
| Variant C | 3時間でマスター<br>動画生成API実装 | 34% |

**仮説**:
- Control: 技術的アプローチ（既存）
- Variant B: 収益化訴求（金銭的メリット強調）
- Variant C: 時間効率訴求（スピード学習強調）

---

### 2. CTAボタンカラーテスト（3バリエーション）

**目的**: クリック率（CTR）最大化のための最適なボタンカラーを発見

| Variant | カラー | Hex Code | 重み |
|---------|--------|----------|------|
| Control (A) | オレンジ | #FF6B00 | 33% |
| Variant B | グリーン | #10B981 | 33% |
| Variant C | ブルー | #3B82F6 | 34% |

**仮説**:
- Control: BytePlusブランドカラー（既存）
- Variant B: コンバージョンに強いグリーン（Go/行動喚起）
- Variant C: 信頼性の高いブルー（企業サービス定番）

**対象要素**:
- `.cta-button-primary` - メインCTAボタン
- `.cta-button-nav` - ナビゲーションCTAボタン

---

### 3. 料金表示順序テスト（2バリエーション）

**目的**: 高額プラン優先表示によるアンカリング効果検証

| Variant | 表示順序 | 重み |
|---------|---------|------|
| Control (A) | オンライン → オフライン | 50% |
| Variant B | オフライン → オンライン（人気を先に） | 50% |

**仮説**:
- Control: 価格低い順（既存）
- Variant B: 価格高い順（アンカリング効果によるオンライン申込増加）

---

## 🔧 技術実装

### ファイル構成

```
docs/landing-pages/byteplus-bootcamp/
├── ab-test.js          # A/Bテストエンジン（新規）
├── style.css           # CTAカラーバリエーション追加
├── index.html          # ab-test.js読み込み追加
└── AB_TEST_GUIDE.md    # このファイル
```

### A/Bテストエンジンの仕組み

1. **ランダム割り当て**
   - 初回訪問時に各テストのバリエーションをランダム割り当て
   - LocalStorageに保存（`byteplus_ab_variant`）
   - 再訪問時は同じバリエーションを表示（一貫性）

2. **DOM書き換え**
   - ヘッドライン: `.hero-title-large` のinnerHTMLを書き換え
   - CTAカラー: `data-ab-color` 属性を追加（CSS適用）
   - 料金順序: `.pricing-grid` の子要素を入れ替え

3. **トラッキング**
   - GA4カスタムイベント: `ab_test_assigned`
   - Facebook Pixel: `ABTestAssigned`
   - LinkedIn Insight Tag: `ab_test_assigned`

---

## 📊 トラッキングとレポート

### Google Analytics 4 カスタムイベント

**イベント名**: `ab_test_assigned`

**パラメータ**:
- `test_name`: テスト名（headline, cta_color, pricing_order）
- `variant_name`: バリエーション名（control, variant_b, variant_c）
- `timestamp`: 割り当て日時（ISO 8601形式）

### GA4レポート作成手順

1. **GA4管理画面** → **探索**
2. **自由形式** を選択
3. **ディメンション**: `test_name`, `variant_name`
4. **指標**: `event_count`, `conversions`, `purchase_revenue`
5. **セグメント**: `ab_test_assigned` イベント発火ユーザー

### 推奨KPI

| KPI | 計算式 | 目標 |
|-----|--------|------|
| CVR | (コンバージョン数 / 訪問者数) × 100 | +10% 改善 |
| CTR | (CTA クリック数 / 表示回数) × 100 | +15% 改善 |
| 平均滞在時間 | 合計滞在時間 / セッション数 | > 3分 |
| 直帰率 | 直帰セッション数 / 全セッション数 | < 40% |

---

## 🛠️ デバッグ方法

### ブラウザコンソールでバリエーション確認

```javascript
// 現在割り当てられているバリエーションを確認
ABTest.getVariants()

// 出力例:
// {
//   headline: "variant_b",
//   cta_color: "control",
//   pricing_order: "variant_b"
// }
```

### バリエーションをリセット（再割り当て）

```javascript
// LocalStorageをクリアして再読み込み
ABTest.reset()
```

### デバッグモード有効化

```javascript
// 詳細ログをコンソールに出力
ABTest.debug(true)
```

### 手動でバリエーションを設定

```javascript
// LocalStorageに直接書き込み
localStorage.setItem('byteplus_ab_variant', JSON.stringify({
  headline: 'variant_c',
  cta_color: 'variant_b',
  pricing_order: 'control'
}));

// ページをリロード
location.reload();
```

---

## 📈 統計的有意性の確認

### 推奨サンプルサイズ

- **最小サンプルサイズ**: 各バリエーション 1,000訪問者
- **統計的検出力**: 80% (power analysis)
- **有意水準**: p < 0.05

### 評価期間

- **最短期間**: 2週間（季節変動・曜日効果を考慮）
- **推奨期間**: 4週間
- **最大期間**: 8週間（長期化すると機会損失）

### 統計ツール

- [AB Test Calculator](https://www.optimizely.com/sample-size-calculator/)
- [VWO A/B Test Significance Calculator](https://vwo.com/ab-split-test-significance-calculator/)
- [Evan Miller's A/B Test Calculator](https://www.evanmiller.org/ab-testing/sample-size.html)

---

## 🚀 実装手順（復元用）

### 1. A/Bテストエンジン作成

```bash
# ab-test.jsを作成
touch ab-test.js
```

### 2. CSS追加

```css
/* style.cssの末尾に追加 */

/* Variant B: Green */
.cta-button-primary[data-ab-color="green"],
.cta-button-nav[data-ab-color="green"] {
    background-color: #10B981;
}

.cta-button-primary[data-ab-color="green"]:hover,
.cta-button-nav[data-ab-color="green"]:hover {
    background-color: #059669;
}

/* Variant C: Blue */
.cta-button-primary[data-ab-color="blue"],
.cta-button-nav[data-ab-color="blue"] {
    background-color: #3B82F6;
}

.cta-button-primary[data-ab-color="blue"]:hover,
.cta-button-nav[data-ab-color="blue"]:hover {
    background-color: #2563EB;
}
```

### 3. HTMLに読み込み追加

```html
<!-- index.html の </body> 直前に追加 -->
<script src="ab-test.js"></script>
```

### 4. デプロイ

```bash
git add ab-test.js style.css index.html AB_TEST_GUIDE.md
git commit -m "feat: A/Bテスト実装 - ヘッドライン/CTA/料金表示"
git push origin main
```

---

## ⚠️ 注意事項

### 1. A/Bテストの倫理

- ユーザーに不利益を与えるテストは実施しない
- 極端に誤解を招くコピーは避ける
- プライバシーポリシーにA/Bテスト実施を明記

### 2. パフォーマンス

- A/Bテストエンジンは軽量（<10KB）
- DOMContentLoadedイベントで実行（ページロード遅延なし）
- LocalStorage使用（Cookie不要）

### 3. キャッシュ

- CDN使用時はA/Bテストエンジンをキャッシュから除外
- または、バージョニング（`ab-test.js?v=1.0.0`）

### 4. 法的要件

- **GDPR**: 同意取得不要（機能的Cookie、厳密に必要）
- **CCPA**: 通知推奨（プライバシーポリシーに記載）

---

## 📝 分析レポートテンプレート

### 実施概要

- **実施期間**: YYYY-MM-DD ～ YYYY-MM-DD
- **総訪問者数**: X,XXX人
- **各バリエーション訪問者数**:
  - Control: X,XXX人
  - Variant B: X,XXX人
  - Variant C: X,XXX人

### 結果サマリー

| テスト | 勝者 | CVR改善率 | 統計的有意性 |
|--------|------|-----------|--------------|
| ヘッドライン | Variant B | +12.5% | p < 0.01 ✅ |
| CTAカラー | Control | -2.3% | p = 0.23 ❌ |
| 料金順序 | Variant B | +8.7% | p < 0.05 ✅ |

### 推奨アクション

1. **即座に実装**: Variant Bを本番環境に適用
2. **追加テスト**: CTAカラーは別のバリエーションでテスト継続
3. **長期モニタリング**: 4週間後にCVRを再評価

---

## 🔗 関連リンク

- [Google Optimize ヘルプ](https://support.google.com/optimize/)
- [A/B Testing Mastery](https://www.optimizely.com/optimization-glossary/ab-testing/)
- [Statistical Significance in A/B Testing](https://www.evanmiller.org/how-not-to-run-an-ab-test.html)
- [Conversion Rate Optimization Guide](https://www.quicksprout.com/conversion-rate-optimization/)

---

**作成者**: Claude Code (AI Assistant)
**Issue**: #381 ([Sub-Issue #361] Phase 6: A/Bテスト実装)
**Milestone**: #32 (BytePlus Video API Bootcamp - Landing Page & Sales Materials)
