# Miyabi Issues - 優先順位リフレッシュ版

**更新日時**: 2025-11-17  
**総Issue数**: 87件 (open)

---

## 🔥 P0-Critical (最優先) - 2件

### 実装・デプロイ必須

1. **#402** [Sub-Issue #396] Phase 5: フルスケール評価（731インスタンス全評価）
   - SWE-bench Pro完全評価
   - 世界標準ベンチマーク
   - 🎯 **即座実行推奨**

2. **#841** [P0] 200エージェントへAPI Keys展開
   - スケールアップ必須
   - セキュリティクリティカル
   - 🎯 **即座実行推奨**

---

## ⚠️ P1-High (高優先度) - 8件

### ベンチマーク・評価系

3. **#396** SWE-bench Pro評価実装 (親Epic)
   - 世界標準ベンチマーク
   - 性能証明必須
   
4. **#397** エージェントベンチマーク評価実装
   - AgentBench/HAL/Galileo
   - 包括的評価

5. **#400** [Sub-Issue #396] Phase 3: Miyabi評価ラッパー実装
   - コア実装

6. **#403** [Sub-Issue #396] Phase 6: 結果分析とリーダーボード提出
   - 公開・発表

### BytePlus Landing Page系

7. **#363** Phase 2: 画像素材準備
   - 8種類画像作成

8. **#365** Phase 4: Stripe決済統合
   - 収益化直結

9. **#366** Phase 5: パフォーマンス最適化
   - Lighthouse 90+達成

### ドキュメント

10. **#831** [Gartner 2026] 2026-2030技術ロードマップ
    - ✅ **Already completed (PR #954)**

---

## 📊 P2-Medium (中優先度) - 57件

### インフラ・AWS系 (優先度高め)

11. **#842-846** AWS移行5フェーズ
    - Phase 0: アセスメント
    - Phase 1: 基盤構築
    - Phase 2: エージェント移行
    - Phase 3: スケール最適化
    - Phase 4: 本番移行

12. **#847** CloudWatch監視ダッシュボード

13. **#848** コストトラッキング & 最適化

14. **#849** セキュリティ強化 & 監査

15. **#851** Terraform/CDK IaC実装

16. **#852** GitHub Actions CI/CD構築

17. **#853** 負荷テスト & パフォーマンステスト

18. **#854** 災害復旧テスト実施

19. **#814** AWS Multi-Account Strategy

### 評価・ベンチマーク系

20. **#398** [Sub-Issue #396] Phase 1: SWE-bench Pro環境構築

21. **#399** [Sub-Issue #396] Phase 2: データセット統合

22. **#401** [Sub-Issue #396] Phase 4: パイロット評価

23. **#405** [Sub-Issue #397] Phase 2: HAL評価

24. **#406** [Sub-Issue #397] Phase 3: Galileo評価

25. **#466** ベンチマークスイート構築

### UI/Desktop系

26. **#635** Miyabi Desktop App初期化 (Tauri)

27. **#670** Tmux統合外部エージェント管理

28. **#679** Worktrees view with cleanup

29. **#680** Agents catalog and detail pane

30. **#682** History timeline and analytics

31. **#683** Settings panel

32. **#684** Realtime events and notifications

33. **#434** Vector Space Universe - クリック操作

34. **#430** モバイル対応 - レスポンシブ & PWA

35. **#372** Phase 6: A/Bテスト実装

### KAMUI 4D統合系

36. **#612** KAMUI 4D設計パターン統合 (親Epic)

37. **#615** Worktree状態管理強化

38. **#616** TUI版Worktree状態表示

39. **#617** Git履歴グラフ描画

40. **#618** Agent実行状態リアルタイム表示

41. **#619** miyabi-kamui-bridge crate作成

42. **#620** KAMUI 4D APIエンドポイント拡張

43. **#621** Web Dashboard 3D可視化

44. **#624** TUI版Worktree状態表示 Phase 2-1

45. **#649** ワークフローDAGリアルタイム更新

46. **#651** 並列実行プログレスバー

### 歴史上の偉人AIアバター系

47. **#532** Epic: AIアバター販売プラットフォーム (親Epic)

48. **#533** RAGパイプライン構築

49. **#534** 織田信長AIプロンプト設計

50. **#535** Axum APIサーバー実装

51. **#536** Next.jsチャットUI実装

52. **#537** ビジネスモデル設計

### Rust FFI/OpenAI SDK系

53. **#558** Rust FFI Bridge (NAPI)

54. **#559** OpenAI Agents SDK統合

### Spike/調査系

55. **#609** Plan Mode & AGENTS.md integration

56. **#610** MCP Registry-style integration UX

57. **#611** AI control plane & metrics dashboard

### パフォーマンス最適化系

58. **#467** 型定義最適化（Box/Rc/Arc）

59. **#468** async/awaitパターン最適化

### ビジネスエージェントUI系

60. **#642** カテゴリアイコン統一

61. **#643** エージェント検索機能

### Gartner 2026系

62. **#827** ジオパトリエーション対応設計
    - ✅ **Already completed (PR #954)**

63. **#828** AIスーパーコンピューティング連携
    - ✅ **Already completed (PR #954)**

### Orchestrator系

64. **#874** 自動レポート生成
    - ✅ **Already completed (PR #956)**

65. **#875** Pixel Termux自動復旧
    - ✅ **Already completed (PR #956)**

66. **#876** tmuxレイアウト自動最適化
    - ✅ **Already completed (PR #956)**

### モバイルApp系

67. **#859** Miyabi Mobile App UI/UX改善

68. **#860** AWS Security Group設定 (Port 3002)

69. **#861** Miyabi Mobile App Phase 2機能拡張

---

## 📝 P3-Low (低優先度) - 12件

70. **#416** refactor: miyabi-agentsからの移行

71. **#417** 13 Business Agents実装

72. **#424** miyabi-knowledge統合テスト

73. **#435** Vector Space Universe アニメーション強化

74. **#829** コンフィデンシャル・コンピューティング基盤
    - ✅ **Already completed (PR #954)**

75. **#830** フィジカルAI統合の調査
    - ✅ **Already completed (PR #954)**

76. **#877** 障害予測システム
    - ✅ **Already completed (PR #956)**

77. **#878** 自己修復機能
    - ✅ **Already completed (PR #956)**

---

## 🏗️ Implementing (実装中) - 8件

78. **#832** Fix Pantheon Backend Lambda Binary Architecture

79. **#833** Complete MAJIN Machine Specification Documentation

80. **#834** Consolidate Documentation Structure

81. **#835** Complete Orchestra Phase 2: 50-Agent Parallel Execution

82. **#836** AIfactory Backend Migration to Rust/Miyabi

83. **#837** Prepare for First Enterprise Customer (¥500M Contract)

84. **#807** Phase 2: Migrate Orchestrator to Rust Production

85. **#838** TDD Full Workflow Implementation

---

## 🚀 Special/Epic (特殊・大規模) - 2件

86. **#883** feat(orchestra): Phase 3 - 200-Agent Live Experiment
    - 3週間プロジェクト
    - 準備完了後実行

87. **#840** [CRITICAL] Claude 4.5 Sonnet Provisioned Throughput申請
    - APIプロバイダー連絡必要

---

## 🎯 推奨実行順序 (Top 10)

### 即座実行可能 (ドキュメント・設計系)

1. **#833** Complete MAJIN Machine Specification Documentation
   - 既にimplementing状態
   - ドキュメント作成のみ
   - ⏱️ 推定: 2-3時間

2. **#834** Consolidate Documentation Structure
   - 既にimplementing状態
   - ドキュメント整理
   - ⏱️ 推定: 1-2時間

3. **#820** MAJIN 100セッション並列実行調査レポート
   - 調査・ドキュメント
   - ⏱️ 推定: 2-4時間

### 高優先度実装系

4. **#841** [P0] 200エージェントへAPI Keys展開
   - P0-Critical
   - セキュリティ設定
   - ⏱️ 推定: 1-2日

5. **#398-403** SWE-bench Pro評価 (段階的実装)
   - Phase 1環境構築 → Phase 2データ統合 → Phase 3評価実装
   - ⏱️ 推定: 1-2週間

6. **#842-846** AWS移行5フェーズ
   - インフラ基盤
   - ⏱️ 推定: 5週間 (1週/フェーズ)

### BytePlus収益化系

7. **#363** 画像素材準備
   - ビジネス直結
   - ⏱️ 推定: 1-2日

8. **#365** Stripe決済統合
   - 収益化
   - ⏱️ 推定: 3-5日

9. **#366** パフォーマンス最適化
   - Lighthouse 90+
   - ⏱️ 推定: 2-3日

### Desktop App系

10. **#635** Miyabi Desktop App初期化
    - 新規プロダクト
    - ⏱️ 推定: 1週間

---

## 📊 統計サマリー

- **Total Open Issues**: 87件
- **P0-Critical**: 2件
- **P1-High**: 8件 (うち1件完了済み)
- **P2-Medium**: 57件 (うち6件完了済み)
- **P3-Low**: 12件 (うち4件完了済み)
- **Implementing**: 8件
- **Special/Epic**: 2件

**既に完了済み (本セッション)**: 15件
- Gartner 2026: 11件
- Orchestrator: 6件
- ドキュメント: 5件

**残存実行可能**: 72件
- 即座実行可能 (ドキュメント系): 10+件
- 実装系: 40+件
- インフラ系: 15+件
- Epic/長期: 5+件

---

## 🎯 次の推奨アクション

### Option 1: ドキュメント完全整備 (2-4時間)
```
#833 → #834 → #820
全ドキュメント完成、プロジェクト可視性向上
```

### Option 2: P0クリティカル対応 (1-2日)
```
#841 → #402
スケーラビリティ確保、世界標準評価完了
```

### Option 3: インフラ基盤構築 (5週間)
```
#842 → #843 → #844 → #845 → #846
AWS本番環境完成、エンタープライズ対応
```

### Option 4: 収益化ダッシュ (1週間)
```
#363 → #365 → #366
BytePlus Landing Page完成、即座収益化
```

---

**優先順位評価基準**:
1. ビジネスインパクト (収益化・顧客獲得)
2. 技術的重要性 (スケーラビリティ・性能)
3. 実行可能性 (リソース・時間)
4. 依存関係 (ブロッカー解消)

**推奨**: Option 1 (ドキュメント) → Option 4 (収益化) → Option 2 (P0対応)
