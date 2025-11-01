#!/bin/bash
set -e

CONTEXT=$(cat EXECUTION_CONTEXT.md)

claude --print --output-format text "$CONTEXT

Please create a complete Tutorial 04: Integration with GitHub.

Requirements:
- GitHub API integration guide
- octocrab usage examples
- Issue/PR manipulation
- Authentication setup
- At least 200 lines of content

Output the complete tutorial markdown directly." > docs/tutorials/04-integration-with-github.md

git add docs/tutorials/04-integration-with-github.md
git commit -m 'docs(tutorial): add Tutorial 04 - Integration with GitHub (Claude Code generated)'

echo 'Tutorial 04 completed with Claude Code'
