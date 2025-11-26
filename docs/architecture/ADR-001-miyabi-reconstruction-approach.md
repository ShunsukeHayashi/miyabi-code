# ADR-001: Miyabi Society Reconstruction Approach

**Date**: 2025-11-26
**Status**: ✅ Approved
**Decision Makers**: Layer 0 (Human) + Layer 2 (Orchestrator)
**Related Issues**: #969, #970, #971, #977

---

## Context

Miyabi Societyプロジェクトの調査中に、システム基盤の重大な問題が発覚:

### Critical Issues

1. **Database Layer**: PostgreSQL接続が無効化されている
   - `crates/miyabi-web-api/src/lib.rs:143-144` でスキップ
   - 全DB依存APIがコメントアウト
   - Telegram Webhook専用モードのみ稼働

2. **Dashboard**: Frontend稼働もBackend API未デプロイ
   - `API_BASE = 'http://localhost:3000/api'` (localhost参照)
   - 全APIコールが失敗

3. **Organization/Team Management**: 完全未実装
   - マルチテナントスキーマ不在
   - RBAC未実装
   - Enterprise機能実装不可

### Impact

- ❌ Dashboard機能不全
- ❌ Agent実行履歴が保存されない
- ❌ SaaS製品として販売不可
- ❌ ユーザー認証・管理不可

---

## Decision

**Option A: Incremental Reconstruction** を採用

### Rationale

| Criteria | Option A (Incremental) | Option B (Full Rewrite) | Weight |
|----------|----------------------|----------------------|--------|
| Time to Market | 4 weeks ✅ | 12+ weeks ❌ | 30% |
| Development Cost | $12k ✅ | $40k+ ❌ | 25% |
| Technical Risk | Medium ✅ | High ❌ | 20% |
| Maintainability | Good ✅ | Excellent 🟡 | 15% |
| Scalability | Good ✅ | Excellent 🟡 | 10% |

**Total Score**: Option A = 87/100, Option B = 65/100

### Key Advantages

1. **Faster Time to Market**: 4週間 vs 12週間以上
2. **Lower Cost**: $12k vs $40k+
3. **Preserve Working Components**: Agent System 87%完成を維持
4. **Gradual Rollout**: リスク最小化
5. **Future Upgrade Path**: 後でOption Bへ移行可能

---

## Architecture

### Target Stack

**Backend**:
- Framework: Axum 0.7
- Database: PostgreSQL 15 (AWS RDS)
- ORM: SQLx
- Auth: JWT + GitHub OAuth 2.0
- Deploy: AWS Lambda + API Gateway

**Frontend**:
- Framework: Next.js 15
- UI: React + Tailwind CSS
- Deploy: S3 + CloudFront

**Infrastructure**:
- Database: AWS RDS PostgreSQL (db.t3.small)
- API: AWS Lambda + API Gateway
- Frontend: S3 + CloudFront
- Monitoring: CloudWatch

### Why PostgreSQL (vs Firebase/Firestore)

✅ Schema already designed and tested
✅ SQLx integration implemented
✅ Better for complex queries (JOIN, aggregations)
✅ Lower cost for high-volume operations
✅ ACID compliance for financial/audit data

---

## Implementation Plan

### Phase 0: Assessment & Architecture (16-24h)
- 0.1: Architecture review & decision ✅ **COMPLETE**
- 0.2: AWS infrastructure setup (8-12h)
- 0.3: Baseline documentation (4-6h)

### Phase 1: Database Foundation (60-80h)
- 1.1: PostgreSQL connection enablement (8-12h)
- 1.2: Base schema migration (12-16h)
- 1.3: Organization/Team schema (16-20h)
- 1.4: RBAC implementation (16-24h)
- 1.5: JWT authentication (8-12h)

### Phase 2: Backend API (40-50h)
- 2.1: Task Management API (12-16h)
- 2.2: Worker/Coordinator Status API (8-12h)
- 2.3: Dashboard Backend API (12-16h)
- 2.4: Lambda deployment (8-12h)

### Phase 3: Frontend Integration (20-30h)
- 3.1: Frontend API integration (8-12h)
- 3.2: CloudFront deployment (4-6h)
- 3.3: E2E testing (6-8h)
- 3.4: Documentation (2-4h)

### Phase 4: Production Validation (20-30h)
- 4.1: Production smoke tests (8-12h)
- 4.2: Load testing (6-8h)
- 4.3: Security audit (4-6h)
- 4.4: Documentation & handover (2-4h)

**Total Duration**: 4-6 weeks
**Total Effort**: 156-214 hours
**Parallel Execution**: 120-160 hours (with 3 workers)

---

## Cost Analysis

### Development Cost
- Engineer hours: 160h @ $75/h = **$12,000**

### AWS Monthly Cost
- RDS db.t3.small (production): $24/mo
- RDS db.t3.small (staging): $24/mo
- Lambda: ~$0 (free tier)
- API Gateway: ~$1/mo
- S3 + CloudFront: ~$3/mo
- **Total: $52/mo**

### Annual Cost
- Development: $12,000 (one-time)
- AWS: $52 × 12 = $624/year
- **Total Year 1: $12,624**

---

## Risk Mitigation

### Risk 1: Database Migration Failure
**Mitigation**:
- Test migrations on staging first
- Create database backup before production migration
- Have rollback script ready

### Risk 2: Lambda Cold Start Latency
**Mitigation**:
- Use provisioned concurrency for critical APIs
- Implement Lambda warming schedule (every 5 min)
- Keep Lambda size small (<50MB)

### Risk 3: Breaking Changes to Telegram Bot
**Mitigation**:
- Keep Telegram routes completely isolated
- Test Telegram webhook after each phase
- Rollback immediately if broken

### Risk 4: Budget Overrun
**Mitigation**:
- Monitor costs daily
- Set AWS billing alerts ($50, $100)
- Track hours per phase

---

## Success Criteria

### Phase 1 Complete
- [ ] PostgreSQL connection stable
- [ ] All tables created successfully
- [ ] CRUD operations working for all models
- [ ] RBAC working (Owner/Admin/Member/Viewer)
- [ ] JWT authentication functional

### Phase 2 Complete
- [ ] All API routes deployed to Lambda
- [ ] Task management API working
- [ ] Worker/Coordinator status API working
- [ ] WebSocket connections working

### Phase 3 Complete
- [ ] Dashboard loads without errors
- [ ] Task submission works end-to-end
- [ ] Real-time status updates visible
- [ ] User authentication flow complete

### Phase 4 Complete
- [ ] Production smoke tests pass
- [ ] Load test: 100+ concurrent users
- [ ] Security audit: No critical vulnerabilities
- [ ] Documentation complete

---

## Rollback Plan

### Phase 1 Rollback
```bash
# Revert migrations
sqlx migrate revert --database-url $DATABASE_URL

# Restore original code
git checkout main -- crates/miyabi-web-api/src/lib.rs

# Verify Telegram bot works
curl http://localhost:8080/api/v1/health
```

### Phase 2 Rollback
```bash
# Delete Lambda functions
aws lambda delete-function --function-name miyabi-api-tasks

# Delete API Gateway
aws apigatewayv2 delete-api --api-id <API_ID>
```

### Phase 3 Rollback
```bash
# Restore previous CloudFront deployment
aws s3 sync s3://miyabi-webui-backup-YYYYMMDD/ s3://miyabi-webui-112530848482/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E1FF97QM8U71OR --paths "/*"
```

---

## Alternatives Considered

### Option B: Full Architecture Rewrite
- Firebase/Firestore migration
- Microservices architecture
- Serverless-first approach

**Rejected Reason**:
- 3x longer timeline (12+ weeks)
- 3x higher cost ($40k+)
- Higher technical risk
- Doesn't preserve existing work

### Option C: Status Quo
- Continue agent spec enhancements
- Ignore infrastructure problems

**Rejected Reason**:
- Building on broken foundation
- Dashboard remains non-functional
- SaaS product impossible to ship

---

## Approval

**Approved By**: Layer 0 (Human) - 2025-11-26
**Approved By**: Layer 2 (Orchestrator) - 2025-11-26

**Decision**: Proceed with Option A - Incremental Reconstruction

---

## References

- Issue #969: Root Cause Analysis
- Issue #970: Ultra-Detailed Implementation Plan
- Issue #971: Master Dependency Graph
- Issue #977: Team Coordination

**Next Step**: Phase 0.2 - AWS Infrastructure Setup
