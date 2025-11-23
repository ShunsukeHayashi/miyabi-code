---
title: "Workflows Diagram"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Auto-Generator"
category: "diagrams"
tags: ["miyabi", "diagram", "workflows"]
status: "published"
---

# Miyabi Workflows - Visual Guide

## 🔄 Complete Workflow Chain

```mermaid
graph TB
    %% Style Definitions
    classDef issueClass fill:#FFE5E5,stroke:#FF6B6B,stroke-width:2px
    classDef agentClass fill:#E5FFE5,stroke:#51CF66,stroke-width:2px
    classDef taskClass fill:#E5F5FF,stroke:#339AF0,stroke-width:2px
    classDef prClass fill:#FFE5F5,stroke:#CC5DE8,stroke-width:2px
    classDef deployClass fill:#FFF5E5,stroke:#FFA94D,stroke-width:2px

    %% W1: Issue Creation & Triage
    subgraph W1["W1: Issue Creation & Triage (~5 min)"]
        I1[GitHub Issue Created]:::issueClass
        IA[IssueAgent<br/>Analyzes Issue]:::agentClass
        L1[Labels Assigned<br/>state:pending]:::issueClass

        I1 --> IA
        IA --> L1
    end

    %% W2: Task Decomposition & Planning
    subgraph W2["W2: Task Decomposition & Planning (~10-30 min)"]
        L1 --> CA[CoordinatorAgent<br/>Decomposes Issue]:::agentClass
        CA --> DAG[DAG Created<br/>Task Dependencies]:::taskClass
        DAG --> T1[Task 1]:::taskClass
        DAG --> T2[Task 2]:::taskClass
        DAG --> T3[Task N]:::taskClass
    end

    %% W3: Code Implementation
    subgraph W3["W3: Code Implementation (~30-120 min)"]
        T1 --> WT1[Worktree 1<br/>CodeGenAgent]:::agentClass
        T2 --> WT2[Worktree 2<br/>CodeGenAgent]:::agentClass
        T3 --> WT3[Worktree N<br/>CodeGenAgent]:::agentClass

        WT1 --> CODE1[Generated Code]:::taskClass
        WT2 --> CODE2[Generated Code]:::taskClass
        WT3 --> CODE3[Generated Code]:::taskClass

        CODE1 --> PRA[PRAgent<br/>Creates Draft PR]:::agentClass
        CODE2 --> PRA
        CODE3 --> PRA

        PRA --> PR1[Draft Pull Request]:::prClass
    end

    %% W4: Code Review & QA
    subgraph W4["W4: Code Review & QA (~10-20 min)"]
        PR1 --> RA[ReviewAgent<br/>Analyzes Quality]:::agentClass
        RA --> QR[Quality Report<br/>Score >= 80?]:::taskClass

        QR -->|Pass| PR2[PR Ready for Merge]:::prClass
        QR -->|Fail| FIX[Fix Required]:::issueClass
        FIX --> WT1
    end

    %% W5: Deployment & Monitoring
    subgraph W5["W5: Deployment & Monitoring (~10-30 min)"]
        PR2 --> DA[DeploymentAgent<br/>Deploy to Staging]:::agentClass
        DA --> STG[Staging Deploy<br/>Health Check]:::deployClass

        STG -->|OK| PROD[Production Deploy]:::deployClass
        STG -->|Fail| RB1[Rollback]:::issueClass

        PROD --> HC[Health Check]:::deployClass
        HC -->|OK| DONE[Issue Closed<br/>state:done]:::issueClass
        HC -->|Fail| RB2[Auto Rollback]:::issueClass
    end

    %% Links between workflows
    linkStyle default stroke:#666,stroke-width:2px
```

## 📊 Workflow Details

### W1: Issue Creation & Triage
- **Duration**: ~5 minutes
- **Trigger**: Issue created on GitHub
- **Agent**: IssueAgent
- **Output**: Labeled Issue with type/priority/severity

### W2: Task Decomposition & Planning
- **Duration**: ~10-30 minutes
- **Trigger**: `trigger:agent-execute` label OR manual command
- **Agent**: CoordinatorAgent
- **Output**: DAG with decomposed tasks

### W3: Code Implementation
- **Duration**: ~30-120 minutes
- **Trigger**: Task decomposition completed
- **Agents**: CodeGenAgent, PRAgent
- **Output**: Draft Pull Request

### W4: Code Review & QA
- **Duration**: ~10-20 minutes
- **Trigger**: Draft PR created
- **Agent**: ReviewAgent
- **Output**: Quality Report (score, recommendations)

### W5: Deployment & Monitoring
- **Duration**: ~10-30 minutes
- **Trigger**: PR approved and merged
- **Agent**: DeploymentAgent
- **Output**: Production deployment + health check

---

## 🔀 Parallel Execution Flow

```mermaid
graph LR
    subgraph "CoordinatorAgent - DAG Execution"
        DAG[Task DAG]

        DAG --> L0[Level 0<br/>Independent Tasks]

        L0 --> T1[Task 1<br/>Worktree 1]
        L0 --> T2[Task 2<br/>Worktree 2]
        L0 --> T3[Task 3<br/>Worktree 3]

        T1 --> L1[Level 1<br/>Dependent Tasks]
        T2 --> L1
        T3 --> L1

        L1 --> T4[Task 4<br/>Worktree 4]
        L1 --> T5[Task 5<br/>Worktree 5]

        T4 --> MERGE[Merge to Main]
        T5 --> MERGE
    end

    classDef levelClass fill:#E5F5FF,stroke:#339AF0,stroke-width:2px
    classDef taskClass fill:#FFE5F5,stroke:#CC5DE8,stroke-width:2px
    classDef mergeClass fill:#E5FFE5,stroke:#51CF66,stroke-width:3px

    class DAG,L0,L1 levelClass
    class T1,T2,T3,T4,T5 taskClass
    class MERGE mergeClass
```

---

## 🎯 Entity Flow Through Workflows

```mermaid
graph TD
    E1[E1: Issue]
    E2[E2: Task]
    E3[E3: Agent]
    E4[E4: PR]
    E5[E5: Label]
    E6[E6: QualityReport]
    E9[E9: Deployment]
    E11[E11: DAG]
    E12[E12: Worktree]

    E1 -->|W1: analyzed-by| E3
    E1 -->|W1: tagged-with| E5
    E1 -->|W2: decomposed-into| E2
    E2 -->|W2: part-of| E11
    E2 -->|W3: runs-in| E12
    E3 -->|W3: generates| E4
    E4 -->|W4: has| E6
    E4 -->|W5: triggers| E9

    classDef entityClass fill:#E5F5FF,stroke:#339AF0,stroke-width:2px
    class E1,E2,E3,E4,E5,E6,E9,E11,E12 entityClass
```

---

## 📈 Workflow Statistics

| Workflow | Avg Duration | Entities | Agents | Relations |
|----------|-------------|----------|--------|-----------|
| W1 | ~5 min | 3 (E1,E3,E5) | 1 | 25 |
| W2 | ~10-30 min | 3 (E2,E3,E11) | 1 | 21 |
| W3 | ~30-120 min | 5 (E2,E3,E4,E10,E12) | 2 | 26 |
| W4 | ~10-20 min | 2 (E3,E6) | 1 | 16 |
| W5 | ~10-30 min | 3 (E1,E3,E9) | 1 | 23 |

**Total Pipeline Duration**: ~55-185 minutes (best to worst case)

---

## 🔗 Related Documents

- [[workflows/INDEX|Workflows Index]] - Detailed workflow documentation
- [[entities/INDEX|Entities Index]] - All entities
- [[agents/INDEX|Agents Index]] - All agents
- [[relations/INDEX|Relations Index]] - All relationships

---

**Visual Guide** | Version 1.0 | 2025-11-18
