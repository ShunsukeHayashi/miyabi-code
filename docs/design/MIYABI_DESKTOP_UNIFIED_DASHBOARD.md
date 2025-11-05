# Miyabi Desktop Unified Dashboard Concept

**Date**: 2025-11-03  
**Author**: Codex Assistant  
**Related Issue**: `ISSUES/desktop-ui-ux-improvement.md`

---

## 🎯 Vision

「何も考えずに操作しても完走できる」ワンビュー体験を提供する。  
ユーザーはアプリを開き、巨大なスタートボタンを押すだけでエージェント実行〜結果共有まで自動進行。状況は常に 1 画面で把握でき、迷いや不安を排除する。

---

## ✨ 体験設計の柱

1. **Single-Screen Orchestration**  
   - サイドバーやタブ切替を廃止し、全情報を 1 画面に統合。  
   - 初見ユーザーでも視線の流れが明確な三分割レイアウト（上段ステータス／中央アクション／下段フィード）を採用。

2. **Guided Automation**  
   - 中央に「Start」ボタン＋3 ステップ図解（解析 → 実装 → 共有）。  
   - ボタンは状態に応じてラベルを変える（例: `Start Workflow` → `Running…` → `View Summary`）。  
   - トグル式のプリセット（標準ワークフロー、デザインレビューのみ等）で意思決定を最小化。

3. **Persistent Awareness**  
   - 右側に常設のリアルタイムフィード（ログ／タスクリスト／リソース使用率）。  
   - プログレスバー＋マイルストーンチップで現在フェーズと次アクションを可視化。  
   - エラー時は赤カード 1 枚で提示し、選択肢は「リトライ」「詳細を見る」の 2 つだけ。

4. **Onboarding & Recovery**  
   - 初回起動は自動診断（環境変数、tmux、VOICEVOX）を実行し、問題点を一覧化。  
   - 修復は「Fix All」ボタンに集約し、手順をユーザーに考えさせない。  
   - 途中中断からの復帰時は「Continue last run」バナーを画面上部に表示。

---

## 🧩 UI レイアウト（ワイヤーフレーム記述）

```
┌───────────────────────────────────────────────┐
│ Top Status Strip                             │
│ [Repo: miyabi-private] [GitHub ✅] [VOICEVOX ⚠] │
│ Primary Alert/Success messages inline         │
├───────────────────────────────────────────────┤
│                 Primary Action Stage          │
│ ┌─────────────────────────────────────────┐   │
│ │ ① Analyze → ② Implement → ③ Share        │   │
│ │                                           │   │
│ │ [ Start Workflow ]                        │   │
│ │  - Preset selector (dropdown + chips)     │   │
│ │  - Next scheduled run (if any)            │   │
│ └─────────────────────────────────────────┘   │
│                                               │
│ ┌───────┐   ┌──────────────────────────────┐  │
│ │Summary│   │Timeline / Milestones         │  │
│ │(Issue │   │[ Analysis   ]───[ Build   ]──│  │
│ │Stake  │   │[ Review    ]───[ Publish ]   │  │
│ │holders│   └──────────────────────────────┘  │
│ └───────┘                                     │
├───────────────────────────────────────────────┤
│                    Live Feed                  │
│ ┌───────────────────────────────────────────┐ │
│ │ • Live log stream (auto-scroll, pin toggle)│ │
│ │ • Task checklist (auto-checked)            │ │
│ │ • Resource meters (CPU / RAM / GPU)        │ │
│ └───────────────────────────────────────────┘ │
│ Secondary actions: [View Details] [Open PR]   │
└───────────────────────────────────────────────┘
```

---

## 🔄 ユーザーフロー

1. **起動**  
   - アプリが環境チェック → 問題なければトップストリップを緑で表示。  
   - 既存の未完了ワークフローがあれば「Resume」バナーを表示。

2. **実行**  
   - `Start Workflow` ボタン押下でプリセットに基づきエージェント連鎖を起動。  
   - ボタンは実行中 `Stop / Pause` に変化し、進捗は中央タイムラインへ。

3. **監視**  
   - ログ・チェックリストが自動更新。必要ならピン留めし、スクロールなしで追従。  
   - 失敗時：赤カード + `Retry` ボタン。詳細はモーダルではなく右カラムに出す。

4. **完了**  
   - ハイライトカードに成果（Plans.md / PR リンク / Issue ステータス）を集約。  
   - 「Share」ボタンで Slack・Notion などへ即共有。

---

## ⚙️ 実装プラン（フェーズ分割）

| フェーズ | スコープ | 主な変更点 |
|---------|----------|-----------|
| Phase 1 | レイアウト統合 | `App.tsx` を再構成し、サイドバー/タブ依存を排除。新しい `UnifiedDashboard` コンポーネントを実装。 |
| Phase 2 | 状態管理刷新 | Zustand ストアを集約 (`executionState`, `diagnosticsState`)。既存の端末ログ/Issue 状態を統合ストアへマイグレート。 |
| Phase 3 | ガイド付き UI | 自動診断モジュール、プリセット UI、ステップ可視化を追加。空/エラーステートのデザイン適用。 |
| Phase 4 | 成果サマリー & 共有 | 成果カード、共有アクション、履歴一覧を実装。既存 `HistoryView` を統合。 |
| Phase 5 | ユーザーテスト & ポリッシュ | `test-ux-scenario.md` を更新し、実ユーザーテストを実施。アクセシビリティ監査、厳密なデザインシステム適用。 |

---

## 📋 チェックリスト

- [ ] `UnifiedDashboard` の JSX 骨格を作成し、旧パネルを削除 or 保守フォルダへ移動  
- [ ] 自動診断サービス (`tmux`, `VOICEVOX`, `GitHub`) の結果を Top Strip に表示  
- [ ] プリセット JSON (`config/presets/unified_dashboard.json`) を追加し UI から選択可能に  
- [ ] ログストリームを小型化しつつ、詳細オーバーレイを保持  
- [ ] 成果サマリー・共有アクションを `SummaryCard` として独立実装  
- [ ] アクセシビリティ: focus outline, aria-label, reduce motion トグル  
- [ ] UX シナリオ再実行 & ドキュメント更新 (`miyabi-desktop/test-ux-scenario.md`)

---

## 🚧 Blockers / Notes

- `ProductDesignAgent` 実行を試みたが、ローカル GPT-OSS エンドポイント（`http://192.168.3.27:11434/api/generate`）が応答せず失敗。Groq 用 API キーが未設定のため、デザイン自動生成は停止中。改善後に再実行して追加インサイトを取得する。  
- `JonathanIveDesignAgent` の CLI マッピングが未定義のため、専用エージェント呼び出しを整備するとデザインレビューの自動化が可能。

---

## 🔜 次アクション

1. Phase 1 実装のためのブランチ作成 (`feature/unified-dashboard-layout`)。  
2. `UnifiedDashboard` のプロトタイプ（静的データ）を作成し、エグゼクティブレビューを実施。  
3. GPT-OSS インフラ or Groq API キーを復旧し、エージェント生成ドキュメントと照合。  
4. ユーザーテストの観察項目を追加し、「ボタン 1 クリック」で完結するか検証。

---

## 📚 参考資料

- `miyabi-desktop/src/App.tsx` — 現行のパネル構造  
- `miyabi-desktop/src/components/AgentExecutionPanel.tsx` — ログ／実行 UI の現状  
- `miyabi-desktop/test-ux-scenario.md` — UX 検証シナリオ  
- `docs/UI_UX_DESIGN_SYSTEM.md` — 最新デザインシステム  
- `ISSUES/desktop-ui-ux-improvement.md` — 改善要求詳細
