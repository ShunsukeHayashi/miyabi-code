# Miyabi Orchestra - テスト戦略

**目的**: 完全自律稼働システムの品質保証と信頼性確保

---

## 🎯 テスト方針

### 基本原則

1. **早期テスト**: 各コンポーネント実装と同時にテストを作成
2. **自動化優先**: 手動テストは最小限に
3. **継続的テスト**: CI/CDパイプラインに組み込み
4. **本番同等環境**: Staging環境でのテスト必須

---

## 📋 テストレベル

```
Level 4: 受入テスト (Acceptance Testing)
  ↑
Level 3: システムテスト (System Testing)
  ↑
Level 2: 統合テスト (Integration Testing)
  ↑
Level 1: ユニットテスト (Unit Testing)
```

---

## 🧪 Level 1: ユニットテスト

### 対象
個々のスクリプト・関数

### フレームワーク
**bats-core** (Bash Automated Testing System)

### テスト例

**ファイル**: `scripts/tests/test_message_queue.bats`

```bash
#!/usr/bin/env bats

# セットアップ
setup() {
    load 'test_helper/bats-support/load'
    load 'test_helper/bats-assert/load'

    export QUEUE_DIR="/tmp/test-miyabi-queue"
    source scripts/miyabi-message-queue.sh
}

# クリーンアップ
teardown() {
    rm -rf "$QUEUE_DIR"
}

@test "init_queue creates queue directory" {
    run init_queue
    assert_success
    assert [ -d "$QUEUE_DIR" ]
}

@test "send_message creates valid JSON message" {
    init_queue
    run send_message "conductor" "kaede" "task_request" '{"issue": 270}'
    assert_success

    # メッセージファイルが存在するか確認
    assert [ -f "$QUEUE_DIR/kaede.inbox" ]

    # JSON形式が正しいか確認
    message=$(cat "$QUEUE_DIR/kaede.inbox")
    run jq -e '.id' <<< "$message"
    assert_success
}

@test "receive_messages returns and clears inbox" {
    init_queue
    send_message "conductor" "kaede" "task_request" '{"issue": 270}'

    # 受信
    run receive_messages "kaede"
    assert_success
    assert_output --partial '"from":"conductor"'

    # inboxがクリアされているか確認
    assert [ ! -s "$QUEUE_DIR/kaede.inbox" ]
}

@test "broadcast_message sends to all agents" {
    init_queue
    run broadcast_message "conductor" "status_query" '{}'
    assert_success

    # 全Agentのinboxにメッセージがあるか確認
    for agent in kaede sakura tsubaki botan; do
        assert [ -s "$QUEUE_DIR/${agent}.inbox" ]
    done
}
```

### 実行コマンド

```bash
# 全ユニットテスト実行
bats scripts/tests/*.bats

# カバレッジ測定（bashcov使用）
bashcov bats scripts/tests/*.bats
```

### カバレッジ目標
- **Phase 1完了時**: 70%
- **Phase 4完了時**: 90%

---

## 🔗 Level 2: 統合テスト

### 対象
複数コンポーネント間の連携

### テストシナリオ

#### Test 1: Message Queue → Agent通信

```bash
#!/bin/bash
# scripts/tests/integration_test_message_communication.sh

# セットアップ
source scripts/miyabi-message-queue.sh
init_queue

# テスト: メッセージ送信 → 受信 → 処理
echo "Test: Message communication flow"

# ステップ1: Conductorがカエデにメッセージ送信
send_message "conductor" "kaede" "task_request" \
    '{"issue": 270, "title": "Test task"}'

# ステップ2: カエデがメッセージ受信
messages=$(receive_messages "kaede")

# 検証
if echo "$messages" | jq -e '.payload.issue == 270' > /dev/null; then
    echo "✅ PASS: Message received correctly"
else
    echo "❌ FAIL: Message content incorrect"
    exit 1
fi

# ステップ3: カエデがACKを返信
send_message "kaede" "conductor" "ack" '{"issue": 270}'

# ステップ4: ConductorがACKを受信
ack=$(receive_messages "conductor")

if echo "$ack" | jq -e '.type == "ack"' > /dev/null; then
    echo "✅ PASS: ACK received"
else
    echo "❌ FAIL: ACK not received"
    exit 1
fi

echo "✅ ALL TESTS PASSED"
```

#### Test 2: Task Scheduler → Message Queue → Agent

```bash
#!/bin/bash
# scripts/tests/integration_test_task_assignment.sh

# セットアップ
export GITHUB_REPOSITORY="customer-cloud/miyabi-private"

# テストIssue作成
ISSUE_NUM=$(gh issue create \
    --title "Integration Test Issue" \
    --label "status:todo,type:bug" \
    --body "This is a test issue" \
    --json number \
    --jq '.number')

echo "Created test issue #$ISSUE_NUM"

# Task Schedulerをテストモードで1回実行
timeout 10 ./scripts/miyabi-task-scheduler.sh test

# 検証1: メッセージキューに送信されたか
messages=$(./scripts/miyabi-message-queue.sh receive kaede)

if echo "$messages" | jq -e ".payload.issue == $ISSUE_NUM" > /dev/null; then
    echo "✅ PASS: Task assigned to Agent"
else
    echo "❌ FAIL: Task not assigned"
    exit 1
fi

# 検証2: GitHubラベルが付与されたか
labels=$(gh issue view "$ISSUE_NUM" --json labels --jq '.labels[].name')

if echo "$labels" | grep -q "assigned:kaede"; then
    echo "✅ PASS: GitHub label added"
else
    echo "❌ FAIL: GitHub label not added"
    exit 1
fi

# クリーンアップ
gh issue close "$ISSUE_NUM"
echo "✅ ALL TESTS PASSED"
```

### 実行方法

```bash
# 統合テスト全実行
./scripts/tests/run_integration_tests.sh

# 個別実行
./scripts/tests/integration_test_message_communication.sh
./scripts/tests/integration_test_task_assignment.sh
```

---

## 🖥️ Level 3: システムテスト

### 対象
システム全体のエンドツーエンド動作

### Test Suite 1: 24時間連続稼働テスト

**目的**: システムが24時間ノンストップで稼働することを確認

**手順**:
```bash
# 1. システム起動
sudo systemctl start miyabi-orchestra

# 2. 監視スクリプト起動
./scripts/tests/system_test_24h_monitoring.sh &

# 3. 負荷生成（1時間ごとにIssue作成）
./scripts/tests/load_generator.sh --duration 24h --issues-per-hour 5 &

# 4. 24時間後に結果確認
```

**成功基準**:
- [ ] ダウンタイムゼロ
- [ ] 全Issue処理完了
- [ ] エラー率 < 1%
- [ ] メモリリークなし

### Test Suite 2: 障害復旧テスト

**目的**: 各種障害からの自動復旧を確認

**Scenario A: Paneクラッシュ**
```bash
# 障害注入
tmux kill-pane -t miyabi-orchestra:0.1

# 検証
sleep 15
if tmux list-panes -t miyabi-orchestra:0.1 &>/dev/null; then
    echo "✅ PASS: Pane recovered"
else
    echo "❌ FAIL: Pane not recovered"
fi

# MTTRを測定
grep "RECOVERY" logs/watchdog/*.log | tail -1
```

**Scenario B: プロセスハング**
```bash
# 障害注入: 無限ループを送信
tmux send-keys -t miyabi-orchestra:0.1 "while true; do sleep 1; done" Enter

# 5分後にWatchdogがkillすることを確認
sleep 320
tail -f logs/watchdog/watchdog.log
```

**Scenario C: サーバー再起動**
```bash
# 再起動前にセッションIDを記録
SESSION_ID=$(tmux list-sessions -F "#{session_name}" | grep miyabi-orchestra)

# サーバー再起動
sudo reboot

# 再起動後（SSH再接続後）
sleep 60
NEW_SESSION_ID=$(tmux list-sessions -F "#{session_name}" | grep miyabi-orchestra)

if [[ "$SESSION_ID" == "$NEW_SESSION_ID" ]]; then
    echo "✅ PASS: System auto-started after reboot"
else
    echo "❌ FAIL: System did not auto-start"
fi
```

### Test Suite 3: 負荷テスト

**目的**: 高負荷下でのパフォーマンス検証

```bash
#!/bin/bash
# scripts/tests/load_test.sh

# 100件のIssueを一気に作成
for i in {1..100}; do
    gh issue create \
        --title "Load Test Issue $i" \
        --label "status:todo,type:enhancement" \
        --body "This is load test issue $i" &
done

wait

# パフォーマンス測定
START_TIME=$(date +%s)

# 全Issue処理完了まで待機
while true; do
    REMAINING=$(gh issue list --label "status:todo" --json number | jq '. | length')
    if [[ $REMAINING -eq 0 ]]; then
        break
    fi
    sleep 10
done

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo "Processing time: $ELAPSED seconds"
echo "Throughput: $(echo "scale=2; 100 / ($ELAPSED / 3600)" | bc) issues/hour"

# 成功基準
if [[ $ELAPSED -lt 7200 ]]; then  # 2時間以内
    echo "✅ PASS: Load test completed within target time"
else
    echo "❌ FAIL: Load test took too long"
fi
```

---

## ✅ Level 4: 受入テスト

### 対象
ユーザーシナリオベースの実際の運用テスト

### Scenario 1: 新機能実装Issue処理

**ストーリー**:
```
開発者がGitHubに新機能実装Issueを作成
→ Miyabi Orchestraが自動検出
→ カエデが実装
→ サクラがレビュー
→ ツバキがPR作成
→ ボタンがデプロイ
→ Issue自動クローズ
```

**テスト手順**:
```bash
# 1. Issue作成（手動）
gh issue create \
    --title "Feature: Add user profile page" \
    --label "status:todo,type:enhancement" \
    --body "Implement user profile page with avatar and bio"

# 2. 自動処理を観察（自動）
./scripts/miyabi-monitor.sh

# 3. 各ステップの確認
- [ ] カエデが実装開始（5分以内）
- [ ] コードコミット（30分以内）
- [ ] サクラがレビュー開始（実装完了後5分以内）
- [ ] ツバキがPR作成（レビュー完了後5分以内）
- [ ] ボタンがテスト実行（PR作成後10分以内）
- [ ] Issue自動クローズ（全完了後5分以内）
```

**成功基準**:
- [ ] 人間の介入なしで全プロセス完了
- [ ] 総処理時間 < 2時間
- [ ] エラーゼロ

---

## 🔥 Chaos Engineering（障害注入テスト）

### 目的
予期しない障害に対するシステムの耐性を検証

### Chaos Scenarios

#### Chaos 1: ネットワーク障害
```bash
# GitHub API接続を遮断
sudo iptables -A OUTPUT -d api.github.com -j DROP

# 5分後に復旧
sleep 300
sudo iptables -D OUTPUT -d api.github.com -j DROP

# 検証: タスクキューにバッファリングされているか
```

#### Chaos 2: ディスク満杯
```bash
# テンポラリディスクを満杯に
dd if=/dev/zero of=/tmp/fillfile bs=1M count=10240

# システムがグレースフルに処理するか確認
tail -f logs/scheduler/*.log

# クリーンアップ
rm /tmp/fillfile
```

#### Chaos 3: ランダムプロセスキル
```bash
# ランダムにAgentプロセスをkill
while true; do
    RANDOM_PANE=$((RANDOM % 4 + 1))
    tmux kill-pane -t miyabi-orchestra:0.$RANDOM_PANE
    sleep $((RANDOM % 300 + 60))  # 1-5分ごと
done &

# 1時間後に停止して検証
```

---

## 🤖 CI/CD統合

### GitHub Actions ワークフロー

```yaml
# .github/workflows/test.yml
name: Miyabi Orchestra Test Suite

on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main ]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: |
          sudo apt-get install -y tmux jq bats
      - name: Run unit tests
        run: bats scripts/tests/*.bats

  integration-test:
    needs: unit-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup environment
        run: ./scripts/setup-test-env.sh
      - name: Run integration tests
        run: ./scripts/tests/run_integration_tests.sh

  system-test:
    needs: integration-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: ./scripts/deploy-staging.sh
      - name: Run 24h test (abbreviated)
        run: timeout 1h ./scripts/tests/system_test_24h_monitoring.sh

  report:
    needs: [unit-test, integration-test, system-test]
    runs-on: ubuntu-latest
    steps:
      - name: Generate test report
        run: ./scripts/generate-test-report.sh
      - name: Upload to Slack
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"Test suite completed: ${{ job.status }}"}'
```

---

## 📊 テストメトリクス

### 測定項目

| メトリクス | 目標値 | 測定方法 |
|----------|--------|---------|
| テストカバレッジ | > 80% | bashcov |
| テスト成功率 | 100% | CI/CDログ |
| テスト実行時間 | < 10分 | CI/CDダッシュボード |
| バグ検出率 | > 90% | Issue追跡 |

---

## ✅ Phase別テスト完了基準

### Phase 1完了基準
- [ ] ユニットテスト: 全パス、カバレッジ > 70%
- [ ] 統合テスト: Message Queue/Task Scheduler連携動作確認
- [ ] 24時間稼働テスト: 成功
- [ ] 障害復旧テスト: 全シナリオ成功

### Phase 4完了基準
- [ ] 全レベルのテスト: 全パス
- [ ] カバレッジ > 90%
- [ ] Chaos Engineering: 全シナリオ成功
- [ ] 受入テスト: ユーザーシナリオ完全自動化

---

**テスト責任者**: QA Team
**レビュー頻度**: 週次
**最終更新**: 2025-11-03
