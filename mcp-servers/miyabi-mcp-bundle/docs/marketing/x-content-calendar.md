# X (Twitter) Content Calendar

## Campaign: 1日1ツール紹介

### Week 1: Git Inspector

**Day 1**
```
Claude Desktopで「最近のコミット見せて」と言うだけでgit logが実行される

miyabi-mcp-bundle の git_log ツールを使えば、AIが直接リポジトリを調べてくれる

導入は1コマンド
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#Claude #MCP #開発効率化
```

**Day 2**
```
「このファイル、誰が変更した？」

git_blame ツールで一発解決

Claude Desktopに聞くだけで、各行の最終変更者と日時が分かる

miyabi-mcp-bundle で実現
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#Git #Claude #MCP
```

**Day 3**
```
ブランチの差分確認、まだターミナルで？

「featureブランチとmainの差分を見せて」

Claude Desktopが git_diff を実行して、分かりやすく説明してくれる

miyabi-mcp-bundle
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#開発効率化
```

### Week 2: GitHub Integration

**Day 4**
```
Issue作成が面倒？

「ログイン機能のバグ報告Issueを作って」

これだけでClaudeがGitHubにIssueを作成

miyabi-mcp-bundle の gh_issue_create
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#GitHub #Claude
```

**Day 5**
```
PR一覧の確認、GitHub開かなくてOK

「オープン中のPRを教えて」

ClaudeがGitHub APIを叩いて、PR一覧を表示

miyabi-mcp-bundle
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#GitHub #PR #MCP
```

**Day 6**
```
GitHub Actionsの状態、Claudeに聞いてみよう

「CIの状態を確認して」

gh_workflow_list で最新のワークフロー状態を取得

miyabi-mcp-bundle
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#CICD #GitHub
```

### Week 3: System & Monitoring

**Day 7**
```
「今のシステム負荷は？」

CPU、メモリ、ディスク使用率をClaudeが調べて報告

metrics_dashboard ツールで可視化

miyabi-mcp-bundle
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#システム監視 #Claude
```

**Day 8**
```
tmuxセッション管理、Claudeにお任せ

「新しいtmuxセッションを作って」
「セッション一覧を見せて」

自然言語でtmux操作が可能に

miyabi-mcp-bundle
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#tmux #ターミナル
```

### Week 4: Advanced Features

**Day 9**
```
Society Health で26個のMiyabi Societyを一括監視

「全Societyの健康状態をチェック」

Agentの稼働状況、MCPサーバーの状態を瞬時に把握

miyabi-mcp-bundle
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#Miyabi #AI
```

**Day 10**
```
Society間通信を実現する Bridge API

異なるAI Agent間でコンテキストを共有

メッセージキューで非同期通信も可能

miyabi-mcp-bundle
https://github.com/ShunsukeHayashi/miyabi-mcp-bundle

#MultiAgent #AI
```

## Tips Posts

### Tip 1
```
💡 miyabi-mcp-bundle Tips

Claude Desktopで「利用可能なツール一覧」と聞くと、102ツールがリスト表示される

何ができるか分からない時は、まずこれを試してみて

https://github.com/ShunsukeHayashi/miyabi-mcp-bundle
```

### Tip 2
```
💡 miyabi-mcp-bundle Tips

GitHub CLIがインストールされていれば、gh_* ツールが全て使える

brew install gh
gh auth login

これだけでIssue/PR操作が可能に

https://github.com/ShunsukeHayashi/miyabi-mcp-bundle
```

### Tip 3
```
💡 miyabi-mcp-bundle Tips

複数ツールの組み合わせが強力

「最近のコミットを確認して、バグっぽいのがあればIssueを作って」

GitとGitHubツールが連携して動作

https://github.com/ShunsukeHayashi/miyabi-mcp-bundle
```

## Hashtags
- #Claude
- #MCP
- #ClaudeDesktop
- #開発効率化
- #AI
- #GitHub
- #Git
- #TypeScript
- #Miyabi
