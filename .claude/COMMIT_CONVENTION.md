# Miyabi Orchestra - Git Commit Convention

## Format

```
[LAYER][MACHINE] type(scope): message
```

## Layers (レイヤー)

| Layer | Emoji | Description |
|-------|-------|-------------|
| `L0` | 🎹 | MAESTRO - 最上位指揮 (Pixel) |
| `L1` | 🎻 | ORCHESTRATOR - オーケストレーション (MacBook) |
| `L2` | ⚡ | COORDINATOR - タスク調整 (EC2 MUGEN/MAJIN) |
| `L3` | 🔧 | WORKER - 実行ワーカー (Sub-agents) |

## Machines (マシン)

| Machine | Emoji | Description |
|---------|-------|-------------|
| `PX` | 📱 | Pixel 9 Pro XL (Termux) |
| `MB` | 💻 | MacBook |
| `MU` | ⚡ | EC2 MUGEN (無限) |
| `MJ` | 👹 | EC2 MAJIN (魔人) |
| `GH` | 🤖 | GitHub Actions |

## Types (従来のConventional Commits)

| Type | Description |
|------|-------------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `refactor` | リファクタリング |
| `test` | テスト |
| `chore` | 雑務 |
| `ci` | CI/CD |

## Examples

```bash
# Pixel (MAESTRO) からの指示・計画
[L0][PX] feat(planning): Phase 1 architecture design

# MacBook (ORCHESTRATOR) でのオーケストレーション
[L1][MB] feat(agents): implement CoordinatorAgent

# EC2 MUGEN (COORDINATOR) でのビルド・テスト
[L2][MU] fix(web-api): Update route params for Axum 0.8

# EC2 MAJIN (COORDINATOR) での並列処理
[L2][MJ] feat(parallel): GPU-accelerated batch processing

# GitHub Actions (自動)
[L3][GH] ci(release): automated release v1.2.3

# Sub-agent による自動生成
[L3][MU] docs(agent): enhance SalesAgent spec
```

## Compact Display in tig

With this convention, tig shows:
```
3f7251b ∙ [L2][MU] fix(web-api): Update API_BASE_URL
6fce877 ∙ [L1][MB] feat(agents): Add new business agent
d54a742 ∙ [L0][PX] docs(planning): Phase 0 complete
```

## Quick Reference

```
Layer + Machine = Where & Who
─────────────────────────────
[L0][PX] = Pixel指揮官
[L1][MB] = MacBookオケ
[L2][MU] = MUGEN実行
[L2][MJ] = MAJIN実行
[L3][GH] = GitHub自動
```
