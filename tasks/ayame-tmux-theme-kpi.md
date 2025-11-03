# tmux Theme Update KPI Monitoring Draft (Ayame)

## 1. Context & Objectives
- **Release scope**: New tmux visual theme rollout across Miyabi orchestration sessions (coding + business panes).
- **Primary goals**: Improve visual clarity, reduce operator fatigue, and maintain agent execution reliability while the theme is adopted.
- **Reporting owners**: Ayame (analytics), Tmux platform maintainers, CoordinatorAgent PM.
- **Evaluation window**: T0 = theme deploy date (set as `2025-11-03`). Track roll-out daily (first 14 days), then weekly through Day 45.

## 2. Data Sources & Instrumentation Backbone
- `tmux-manager` CLI hooks (`scripts/tmux/tmux-manager.ts`) → capture session metadata on create/attach/detach; emit JSON to `.ai/logs/tmux/theme-events.jsonl`.
- `tmux capture-pane` sample runners (`scripts/tmux-dev-env.sh`, `tmux-send-reliable.sh`) → augment with ANSI color checksum to detect rendering glitches.
- Agent orchestrator logs (`./scripts/miyabi-orchestra*.sh`) → extend to record active panes, pane roles, and theme ID.
- User feedback:
  - Lightweight `/feedback theme` command in coordinator console (append to `data/theme-feedback.csv`).
  - Scheduled survey (Day 7 / Day 30) via Discord automation.
- Support & incidents: tag tickets in `data/support/theme` with `theme-update` label.
- Optional: integrate `tmux theme` toggles into `monitor-agents.sh` heartbeat for real-time adoption gauge.

## 3. KPI Stack

### 3.1 Rollout & Adoption (Acquisition/Activation)
| Metric | Definition | Formula | Source | Cadence | Target / Alert |
| --- | --- | --- | --- | --- | --- |
| Theme Adoption Rate | Share of active tmux sessions using the new theme | `sessions_with_new_theme / total_active_sessions` | tmux-manager event log | Hourly during week 1, daily afterward | ≥ 80% by Day 5, alert if < 60% after Day 3 |
| First-Use Lead Time | Median time from deployment to first use per operator | `median(first_use_ts - deploy_ts)` | Session logs keyed by user | Daily | ≤ 2 days |
| Rollback Ratio | Sessions reverting to legacy theme within same day | `rollback_sessions / sessions_with_new_theme` | Theme toggle logs | Hourly | ≤ 5%; alert at ≥ 10% |
| Unsupported Environment Count | Sessions failing to load theme (e.g., missing TrueColor) | `failed_theme_load_events` | tmux stderr capture | Real-time | 0 tolerable; trigger incident immediately |

### 3.2 Session Quality & Stability (Retention/Performance)
| Metric | Definition | Formula | Source | Cadence | Target / Alert |
| --- | --- | --- | --- | --- | --- |
| Theme Load Success Rate | Percentage of session startups applying theme without error | `1 - (failed_loads / total_session_starts)` | tmux-manager logs + stderr | Real-time | ≥ 99.5% |
| Rendering Degradation Index | Weighted count of ANSI checksum mismatches or contrast breaches | `(high * 1.0) + (medium * 0.5)` | capture-pane diagnostics | Hourly roll-up | < 5 per 24h |
| Pane Glitch MTTR | Mean time to resolve theme-related visual glitches | `avg(resolution_ts - detection_ts)` | Incident tickets | Daily | < 30 min |
| Automation Health Drift | Δ success rate of orchestrated commands vs. pre-theme baseline | `(current_success - baseline_success)` | `miyabi-orchestra` telemetry | Daily | ±1% band; alert beyond ±3% |

### 3.3 Productivity & Workflow Efficiency (Engagement)
| Metric | Definition | Formula | Source | Cadence | Target / Alert |
| --- | --- | --- | --- | --- | --- |
| Command Throughput per Pane | Commands per active minute on coding panes | `commands_sent / active_minutes` | tmux send-keys monitor | Daily | Maintain baseline ±5% |
| Context Switch Latency | Avg time to identify correct pane after focus change | `avg(time_to_interact_after pane-switch)` | Pane focus event hooks (key binding logger) | Daily | ≤ 1.5s |
| Visual Cognitive Load Proxy | Frequency of manual color tweaks (`:set-option`) post theme load | `color_adjust_events / sessions` | tmux history diff | Daily | ≤ 10% of sessions |
| Multi-Agent Session Uptime | Minutes per day all panes remain in synced theme state | `sum(sync_span_minutes)` | monitor-agents heartbeat | Hourly | ≥ 97% of session time |

### 3.4 Sentiment & Support (Loyalty)
| Metric | Definition | Formula | Source | Cadence | Target / Alert |
| --- | --- | --- | --- | --- | --- |
| Net Theme Satisfaction Score (NTSS) | Themed NPS-style rating (0-10 scale) | `(% promoters - % detractors)` | Discord surveys & in-session feedback | Weekly | ≥ +40 |
| Friction Ticket Volume | Theme-related tickets per 100 sessions | `tickets / sessions * 100` | Support queue | Daily | < 2 |
| Positive Feedback Ratio | Positive mentions ÷ total theme mentions | `positive / total` | Feedback CSV sentiment tag | Daily | ≥ 70% |
| Accessibility Issue Flag Rate | Reports of contrast, readability, or eye strain | `accessibility_flags / sessions` | Feedback + manual log | Daily | < 3% |

### 3.5 Business & Strategic Alignment
| Metric | Definition | Formula | Source | Cadence | Target / Alert |
| --- | --- | --- | --- | --- | --- |
| Agent Delivery Velocity | Completed agent tasks per orchestrated hour | `completed_tasks / orchestrated_hours` | `.ai/logs/agent-executions.jsonl` | Daily | Improve ≥ 3% vs. pre-theme |
| Mean Parallel Concurrency | Avg simultaneous panes during peak | `avg(active_panes 18–22 JST)` | Orchestrator telemetry | Daily | Maintain ≥ baseline |
| Theme-Linked Revenue Proxy | Revenue-weighted hours using theme (for billing) | `billable_hours_theme / total_billable_hours` | Billing export (if available) | Weekly | Track upward trend |
| Experiment Coverage | A/B test cells instrumented with new theme variants | `active_experiments_theme / total_active_experiments` | Growth experiment logs | Weekly | ≥ 1 active experiment |

## 4. Dashboard & Alerting Blueprint
- **Real-time tile** (Grafana/Looker Studio): adoption rate gauge, theme load success, active sessions map.
- **Daily operations tab**: trend lines for throughput, context switch latency, automation health drift.
- **Sentiment pulse**: NTSS, accessibility flags, ticket volume with annotations.
- **Experiment space**: A/B comparisons (theme vs. legacy) on productivity & satisfaction metrics.
- **Alerting rules**:
  - Slack webhook `#tmux-ops` for adoption or load success breaches.
  - Pager escalation if automation health drift exceeds ±5% for >30 min.
  - Survey reminder automation via `miyabi orchestrators` when NTSS < +20.

## 5. Implementation Backlog
1. Extend `tmux-manager` to emit JSON events (fields: `session_id`, `operator`, `theme_id`, `pane_roles`, `timestamp`, `status`).
2. Add checksum collector script to `scripts/tmux` (scheduled via cron) and store diagnostics under `.ai/logs/theme/`.
3. Update `monitor-agents.sh` to append theme state to heartbeat payload.
4. Ship Notion/Sheets single source of truth for sentiment tagging (import CSV weekly).
5. Configure Looker/Grafana dataset using `.ai/logs` ingestion (dbt prototype optional).

## 6. Next Experiments & Questions
- Evaluate dark vs. light sub-variants (`Ayame Midnight`, `Ayame Dawn`) with split cohorts.
- Validate whether higher command throughput correlates with reduced support tickets post theme.
- Investigate linking accessibility feedback to actual measured contrast deltas.
- Consider automated rollback trigger when adoption falls below threshold while glitches spike.

---

_Draft prepared referencing Growth Analytics dashboard playbooks. Awaiting validation by AnalyticsAgent (すうじるん) and tmux platform owners._
