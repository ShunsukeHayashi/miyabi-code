# Miyabi Disaster Recovery Plan

**Version**: 1.0.0  
**RTO**: 4 hours | **RPO**: 1 hour

## Recovery Objectives
- Service restoration within 4 hours
- Data loss limited to 1 hour
- 99.9% availability target

## Backup Strategy
- Daily: Git, configs, logs
- Weekly: Full snapshots
- Monthly: Complete archival

## Recovery Procedures

### Restore from AWS Snapshot
1. Launch EC2 from latest snapshot
2. Update IP references
3. Verify all services
4. Update client configurations

### Restore Git Repository
1. Clone from GitHub: `gh repo clone customer-cloud/miyabi-private`
2. Verify integrity: `git fsck --full`
3. Recreate worktrees as needed

---
**Last Updated**: 2025-11-17
