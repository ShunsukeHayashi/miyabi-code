#!/bin/bash
# Batch 2: Tutorials 05, 06, 08 (parallel Level 3 from DAG)
set -e

SESSION="tut-batch2-$$"
tmux kill-session -t "$SESSION" 2>/dev/null || true

echo "🚀 Launching Batch 2: Tutorials 05, 06, 08..."

# Tutorial 05: Testing Strategies
cat > .worktrees/tutorial-05/execute.sh << 'T05'
#!/bin/bash
claude --print --output-format text "
# Tutorial 05: Testing Strategies

Create comprehensive Rust testing tutorial (200+ lines):
- Unit tests (#[test], #[cfg(test)])
- Integration tests (tests/ directory)
- Doc tests (/// examples)
- Property-based testing (quickcheck/proptest)
- Mocking and fixtures
- Test organization best practices

IMPORTANT: Output ONLY raw Markdown. No meta-information.
Start with: # Tutorial 05: Testing Strategies in Rust
" > docs/tutorials/05-testing-strategies.md

git add docs/tutorials/05-testing-strategies.md
git commit -m 'docs(tutorial): add Tutorial 05 - Testing Strategies'
echo "✅ Tutorial 05 done"
T05

# Tutorial 06: Performance Optimization
cat > .worktrees/tutorial-06/execute.sh << 'T06'
#!/bin/bash
claude --print --output-format text "
# Tutorial 06: Performance Optimization

Create Rust performance optimization tutorial (200+ lines):
- Profiling tools (cargo flamegraph, perf)
- Memory optimization (stack vs heap, Box, Rc, Arc)
- Async performance (tokio runtime tuning)
- Compile-time optimizations (release profile)
- Benchmarking (criterion.rs)
- Common performance pitfalls

IMPORTANT: Output ONLY raw Markdown. No meta-information.
Start with: # Tutorial 06: Performance Optimization in Rust
" > docs/tutorials/06-performance-optimization.md

git add docs/tutorials/06-performance-optimization.md
git commit -m 'docs(tutorial): add Tutorial 06 - Performance Optimization'
echo "✅ Tutorial 06 done"
T06

# Tutorial 08: Deployment Guide
cat > .worktrees/tutorial-08/execute.sh << 'T08'
#!/bin/bash
claude --print --output-format text "
# Tutorial 08: Deployment Guide

Create deployment tutorial (200+ lines):
- Firebase deployment (Functions, Hosting)
- Vercel deployment (serverless Rust)
- AWS deployment (Lambda, ECS, EC2)
- Docker containerization
- CI/CD with GitHub Actions
- Environment management
- Health checks and monitoring

IMPORTANT: Output ONLY raw Markdown. No meta-information.
Start with: # Tutorial 08: Deployment Guide
" > docs/tutorials/08-deployment-guide.md

git add docs/tutorials/08-deployment-guide.md
git commit -m 'docs(tutorial): add Tutorial 08 - Deployment Guide'
echo "✅ Tutorial 08 done"
T08

chmod +x .worktrees/tutorial-*/execute.sh

# Launch in tmux
tmux new-session -d -s "$SESSION" -n "t05"
tmux send-keys -t "$SESSION:t05" "cd .worktrees/tutorial-05 && bash execute.sh 2>&1" C-m

tmux new-window -t "$SESSION" -n "t06"
tmux send-keys -t "$SESSION:t06" "cd .worktrees/tutorial-06 && bash execute.sh 2>&1" C-m

tmux new-window -t "$SESSION" -n "t08"
tmux send-keys -t "$SESSION:t08" "cd .worktrees/tutorial-08 && bash execute.sh 2>&1" C-m

echo "✅ Batch 2 launched (3 tutorials)"
echo "Monitor: tmux attach -t $SESSION"
