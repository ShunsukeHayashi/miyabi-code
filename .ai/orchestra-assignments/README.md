# Miyabi Orchestra - Sales Funnel Project

**Started**: 2025-11-10  
**Repository**: [ShunsukeHayashi/miyabi-sales-funnel](https://github.com/ShunsukeHayashi/miyabi-sales-funnel)  
**Total Issues**: 26  
**Strategy**: Hybrid Ensemble (Content + System + Automation tracks)

## 🎭 Current Status

### Active Agents (Priority 1)

| Pane | Agent | Issue | Status |
|------|-------|-------|--------|
| %49 | **Conductor** | #1 Master Issue | 🔄 分析中 |
| %30 | **ContentCreationAgent** | #2 実践ガイドPDF | 🔄 作成中 |
| %31 | **MarketingAgent** | #5 LP構築 | 🔄 設計中 |
| %29 | **CRMAgent** | #6 CRM構築 | 🔄 構築中 |

### Standby Agents

| Pane | Agent | Assigned Issues | Next Task |
|------|-------|-----------------|-----------|
| %35 | SalesAgent | #7, #8 | メール自動化、Calendly |
| %36 | AnalyticsAgent | #9, #17-19 | ダッシュボード、A/Bテスト |
| %32 | YouTubeAgent | #10-14 | YouTube Live配信 |
| %40 | CoordinatorAgent | #23-25 | 自動化統合 |
| %45 | ProductDesignAgent | #4 | ROI計算シート |
| %50 | SNSStrategyAgent | #10, #15-16 | SNS戦略 |

## 📊 Issue Distribution

### Phase 1: Preparation (Day 1-30) - 9 Issues
- **System Setup**: #6, #7, #8, #9, #26
- **Content**: #2, #3, #4, #5

### Phase 2: Launch (Day 31-60) - 10 Issues
- **Live Streaming**: #10-15
- **Analytics**: #17-19

### Phase 3: Scale (Day 61-90) - 6 Issues
- **Content Expansion**: #20-22
- **Automation**: #23-25

## 🎼 Execution Plan

### Wave 1 (Current)
Priority 1の4エージェントが基盤構築
- Conductor: 全体戦略
- ContentCreation: 実践ガイド
- Marketing: LP
- CRM: 顧客管理基盤

### Wave 2 (Next)
System Setup完成後
- SalesAgent → #7, #8
- AnalyticsAgent → #9
- ProductDesignAgent → #4

### Wave 3
Phase 2移行後
- YouTubeAgent → #10-14
- SNSStrategyAgent → #10, #15-16
- AnalyticsAgent → #17-19

### Wave 4
Phase 3移行後
- ContentCreationAgent → #20-22
- CoordinatorAgent → #23-25
- CRMAgent → #26

## 📞 Communication Protocol

**報告形式**:
```bash
tmux send-keys -t %49 '[AgentName] 報告内容' && sleep 0.5 && tmux send-keys -t %49 Enter
```

**例**:
```bash
tmux send-keys -t %49 '[ContentCreation] Issue #2完了。実践ガイドPDF 30ページ作成済み' && sleep 0.5 && tmux send-keys -t %49 Enter
```

## 🔗 Resources

- **Assignment Config**: `sales-funnel-assignment.yaml`
- **Orchestra Guide**: `../../.claude/MIYABI_PARALLEL_ORCHESTRA.md`
- **tmux Operations**: `../../.claude/TMUX_OPERATIONS.md`

## 🎯 Success Criteria

- ✅ 全26 Issues完全処理
- ✅ 3フェーズ完遂
- ✅ YouTube Live成功配信
- ✅ 完全自動化達成

---

**🎭 Miyabi Orchestra - Where Agents Dance in Harmony**
