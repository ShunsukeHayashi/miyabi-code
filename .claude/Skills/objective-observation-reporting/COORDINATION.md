# Objective Observation Reporting - Coordination Integration

**Skill**: objective-observation-reporting
**Category**: Coordination (Quality)
**Dependencies**: None
**Dependents**: All skills (quality feedback)

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| Any skill | Error/failure | Generate error report |
| ci-cd-pipeline | Pipeline complete | Generate status report |
| miyabi-session-recovery | Recovery complete | Generate recovery report |
| rust-development | Build/test results | Generate quality report |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| miyabi-session-recovery | Error pattern detected | `REPORT_ERROR: {details}` |
| miyabi-agent-orchestration | Quality issue | `REPORT_QUALITY: {metrics}` |
| All skills | Feedback ready | `REPORT_FEEDBACK: {recommendations}` |

---

## Resource Sharing

### Produces
```yaml
- type: observation_report
  data:
    observed_phenomenon: "Long session context compression..."
    impact: "Additional explanation needed..."
    reproduction_conditions:
      session_duration: "2-3 hours"
      work_content: "Multiple derived tasks"
    unknown_points:
      - "Internal design is non-public"
      - "Intended behavior unknown"
    requests: "Consider implementing..."
```

### Consumes
```yaml
- type: error_log
  from: Any skill
- type: metrics
  from: ci-cd-pipeline, rust-development
- type: status
  from: All skills
```

---

## Communication Protocol

### Status Report Format
```
[REPORT] {TYPE}: {summary}
```

### Types
- `OBSERVATION`: Factual observation
- `ERROR`: Error report
- `QUALITY`: Quality metrics
- `RECOVERY`: Recovery summary

### Examples
```bash
# Report observation
tmux send-keys -t %1 '[REPORT] OBSERVATION: Context compression behavior observed in long sessions' && sleep 0.5 && tmux send-keys -t %1 Enter

# Report error
tmux send-keys -t %1 '[REPORT] ERROR: Build failure - type mismatch in module X' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Reporting Templates

### Error Report Template
```markdown
## Observation Report: {Title}

### Observed Phenomenon
[Objective description of what happened]

### Impact
[User experience or workflow impact]

### Reproduction Conditions (if known)
- Condition 1: ...
- Condition 2: ...
- Reproduction frequency: [unknown / once / multiple times]

### Unknown Points
- [Internal design uncertainties]
- [Whether behavior is intended]

### Request (optional)
[Polite suggestion for consideration]

### Notes
[Any speculation clearly labeled as such]
```

### Quality Report Template
```markdown
## Quality Report: {Component}

### Metrics
- Build status: [pass/fail]
- Test coverage: [X%]
- Lint warnings: [N]
- Security issues: [N]

### Observations
[Factual observations about quality]

### Recommendations
[Suggestions for improvement]
```

---

## Chain Sequences

### Sequence: Error Handling
```
[Error detected in any skill]
    |
    v
objective-observation-reporting [START]
    |
    +---> Capture error details
    +---> Generalize to pattern
    +---> Apply forbidden expression check
    |
    v
[Generate objective report]
    |
    v
miyabi-session-recovery [SIGNAL: REPORT_ERROR]
    |
    v
[Recovery action if needed]
```

### Sequence: Pipeline Quality Report
```
ci-cd-pipeline [COMPLETE]
    |
    v
objective-observation-reporting [START]
    |
    +---> Collect metrics
    +---> Analyze trends
    +---> Generate quality report
    |
    v
[SIGNAL: REPORT_QUALITY to all interested skills]
```

---

## Language Rules

### Forbidden Expressions
```
X "fatal defect"
X "design mistake"
X "obvious bug"
X "must be..."
X "should do..." (imperative)
X "ultimatum"
X "urgent" (without evidence)
```

### Recommended Expressions
```
V "observed phenomenon"
V "tendency observed"
V "possibility exists"
V "internal design unknown"
V "would appreciate consideration"
V "intended behavior unknown"
V "reproduction conditions unverified"
```

---

## Abstraction Levels

### Level 1: Specific Event
```
"During Dioxus Labs strategy review transitioning to YouTube Live prep,
after context compression, the starting objective was less prominent
in the summary than recent work."
```

### Level 2: Generalized Description
```
"In long sessions where context compression occurs, recent work content
tends to become central in summaries, with reduced reference to
initial session objectives."
```

### Level 3: Abstracted Concept
```
"Balance between 'temporal proximity' and 'purposive importance'
in context management."
```

---

## Momentum Multiplier

### Optimization 1: Pattern Recognition
```
[Multiple similar errors]
    |
    v
[Identify pattern]
    |
    v
[Generate consolidated report]
    |
    v
[Suggest systematic fix]
```

### Optimization 2: Proactive Quality Monitoring
```
[Continuous metrics collection]
    |
    v
[Trend analysis]
    |
    v
[Early warning before failure]
```

### Optimization 3: Feedback Loop Integration
```
objective-observation-reporting --> All skills (quality feedback)
                                       |
                                       v
                                   [Improvement actions]
                                       |
                                       v
                                   [Better metrics]
                                       |
                                       v
                                   objective-observation-reporting (track improvement)
```

---

## Health Check Integration

### Quality Checklist (Pre-report)
```
[ ] Facts and speculation clearly distinguished
[ ] No assertions about internal design
[ ] No emotional/exaggerated expressions
[ ] "Unknown" items marked as "unknown"
[ ] Non-imperative request format
[ ] Specific events properly generalized
[ ] No forbidden expressions used
```

---

## Perpetual Activation

### Auto-triggers
- Error in any skill: Generate error report
- Pipeline completion: Generate quality report
- Recovery completion: Generate recovery report
- Periodic schedule: Generate health report

### Quality-Driven Improvement Loop
```
[Operation]
    |
    v
[Metrics collected]
    |
    v
objective-observation-reporting [Analyze]
    |
    v
[Generate recommendations]
    |
    v
[Skills implement improvements]
    |
    v
[Better operation]
    |
    v
[Loop]
```
