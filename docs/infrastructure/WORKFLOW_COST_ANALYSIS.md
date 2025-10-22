# 🔥 GitHub Actions コスト分析レポート

## 📊 定期実行ワークフロー（実行頻度順）

| ワークフロー名 | 実行頻度 | 月間実行回数 | リスクレベル |
|--------------|---------|------------|------------|
| **RefresherAgent** | 1時間ごと | ~720回/月 | 🔴 **最高** |
| **Deploy Pages** | 6時間ごと | ~120回/月 | 🟡 高 |
| **CI Status Report** | 毎日1回 | ~30回/月 | 🟢 中 |
| Discussion Bot | 定期実行 | 不明 | 🟢 中 |
| Discussion Digest | 定期実行 | 不明 | 🟢 中 |
| Economic Circuit Breaker | 定期実行 | 不明 | 🟢 中 |
| Security Audit | 定期実行 | 不明 | 🟡 高 |
| Security Report | 定期実行 | 不明 | 🟡 高 |
| Update Metrics Dashboard | 定期実行 | 不明 | 🟢 中 |
| **Weekly KPI Report** | 週1回 | ~4回/月 | 🟢 低 |
| **Weekly Report** | 週1回 | ~4回/月 | 🟢 低 |
| **Benchmark SWE-bench** | 週1回 | ~4回/月 | 🟡 高（長時間） |
| Cache Cleanup | 週1回 | ~4回/月 | 🟢 低 |
| CodeQL | 定期実行 | 不明 | 🟡 高（長時間） |

## 🐳 リソース集約型ワークフロー

| ワークフロー名 | 理由 | リスクレベル |
|--------------|------|------------|
| **Docker Build** | イメージビルド（時間・CPU消費） | 🔴 最高 |
| **Docker Publish** | イメージビルド＋プッシュ | 🔴 最高 |
| **Benchmark SWE-bench Pro** | 長時間実行（10分以上） | 🟡 高 |
| **CodeQL** | セキュリティスキャン（長時間） | 🟡 高 |
| **Security Audit** | 依存関係スキャン | 🟡 高 |
| **Rust CI** | ビルド＋テスト | 🟡 高 |
| **Termux** | クロスプラットフォームビルド | 🟡 高 |

## 💰 推定コスト（GitHub Team プラン）

**GitHub Team プラン**: 3,000分/月 無料、超過分 $0.008/分

### 最悪ケースシナリオ（全ワークフロー有効）

- **RefresherAgent**: 720回 × 2分 = **1,440分/月**
- **Deploy Pages**: 120回 × 1分 = **120分/月**
- **Docker Build/Publish**: 発生時 × 10分 = **変動**
- **その他定期実行**: ~**200分/月**

**合計推定**: ~**1,760分/月**（無料枠内 ✅）

ただし、以下の場合に超過リスク：
- Docker ビルドが頻繁に発生（PR毎、Push毎）
- Benchmark が長時間実行（30分以上）
- 複数ワークフローの並列実行

