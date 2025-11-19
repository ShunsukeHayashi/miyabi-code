# 🔄 Retry Strategy - CloudWatch Logs異常値検出対応

**Version**: 1.0.0
**Created**: 2025-11-15
**Purpose**: CloudWatch Logs取得失敗時の自動リトライ機能

---

## 🎯 目的

CloudWatch Logsからのデータ取得で異常値やエラーが発生した場合、自動的にリトライして信頼性を向上させる。

---

## 🔧 リトライ設定

### パラメータ

```javascript
const RETRY_CONFIG = {
  maxRetries: 5,                    // 最大リトライ回数
  initialDelayMs: 1000,            // 初回リトライ待機時間（1秒）
  maxDelayMs: 30000,               // 最大待機時間（30秒）
  backoffMultiplier: 2,            // 指数バックオフ係数
  jitter: true,                    // ジッター有効（ランダム待機時間追加）
};
```

### リトライ対象エラー

```javascript
const RETRYABLE_ERRORS = [
  'ServiceUnavailable',            // CloudWatchサービス一時停止
  'ThrottlingException',           // レート制限
  'RequestTimeout',                // タイムアウト
  'NetworkingError',               // ネットワークエラー
  'UnknownError',                  // 不明なエラー
];
```

### 非リトライエラー（即座に失敗）

```javascript
const NON_RETRYABLE_ERRORS = [
  'InvalidParameterException',     // パラメータエラー（修正必要）
  'ResourceNotFoundException',     // リソース不在（ログがない）
  'AccessDeniedException',         // 権限不足（IAM設定要）
];
```

---

## 📊 指数バックオフ計算

```javascript
function calculateBackoff(attemptNumber, config) {
  // Base delay: 1秒 * 2^(試行回数-1)
  let delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);

  // 最大待機時間でキャップ
  delay = Math.min(delay, config.maxDelayMs);

  // Jitter追加（ランダム変動: ±25%）
  if (config.jitter) {
    const jitterRange = delay * 0.25;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    delay += jitter;
  }

  return Math.floor(delay);
}
```

**待機時間の例**:
| 試行回数 | ベース待機時間 | Jitter適用後 |
|---------|---------------|-------------|
| 1回目 | 0ms | 0ms (即座) |
| 2回目 | 1000ms (1秒) | 750-1250ms |
| 3回目 | 2000ms (2秒) | 1500-2500ms |
| 4回目 | 4000ms (4秒) | 3000-5000ms |
| 5回目 | 8000ms (8秒) | 6000-10000ms |
| 6回目 | 16000ms (16秒) | 12000-20000ms |

---

## 🛠️ Lambda実装例

### Progress Collector Lambda

```javascript
const AWS = require('aws-sdk');
const Redis = require('ioredis');

const cloudwatchLogs = new AWS.CloudWatchLogs();
const redis = new Redis({
  host: process.env.REDIS_ENDPOINT,
  port: process.env.REDIS_PORT,
});

const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

// ========================================================================
// Utility: Sleep
// ========================================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================================================
// Utility: Calculate Backoff
// ========================================================================
function calculateBackoff(attemptNumber, config) {
  let delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);
  delay = Math.min(delay, config.maxDelayMs);

  if (config.jitter) {
    const jitterRange = delay * 0.25;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    delay += jitter;
  }

  return Math.floor(delay);
}

// ========================================================================
// Utility: Is Retryable Error
// ========================================================================
function isRetryableError(error) {
  const RETRYABLE_ERRORS = [
    'ServiceUnavailable',
    'ThrottlingException',
    'RequestTimeout',
    'NetworkingError',
    'UnknownError',
  ];

  return RETRYABLE_ERRORS.includes(error.code) ||
         error.statusCode >= 500;  // 5xx errors
}

// ========================================================================
// CloudWatch Logs取得（リトライ付き）
// ========================================================================
async function getCloudWatchLogsWithRetry(logGroupName, startTime, endTime) {
  let lastError;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`📥 Attempt ${attempt}/${RETRY_CONFIG.maxRetries}: Fetching logs from ${logGroupName}`);

      const result = await cloudwatchLogs.filterLogEvents({
        logGroupName,
        startTime,
        endTime,
        limit: 1000,
      }).promise();

      // 異常値チェック
      if (!result.events || result.events.length === 0) {
        console.warn(`⚠️ No log events found in ${logGroupName}`);
        // ログがない場合はリトライせず空配列を返す
        return [];
      }

      // 成功
      console.log(`✅ Successfully fetched ${result.events.length} log events`);
      return result.events;

    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.code, error.message);

      // 非リトライエラーの場合は即座に失敗
      if (!isRetryableError(error)) {
        console.error(`🚫 Non-retryable error: ${error.code}`);
        throw error;
      }

      // 最後の試行の場合はリトライしない
      if (attempt === RETRY_CONFIG.maxRetries) {
        console.error(`🔴 Max retries (${RETRY_CONFIG.maxRetries}) exceeded`);
        break;
      }

      // バックオフ待機
      const delayMs = calculateBackoff(attempt, RETRY_CONFIG);
      console.log(`⏳ Waiting ${delayMs}ms before retry...`);
      await sleep(delayMs);
    }
  }

  // 全リトライ失敗 → フォールバック
  console.error(`🔄 All retries failed. Falling back to DynamoDB...`);
  return fallbackToDynamoDB();
}

// ========================================================================
// フォールバック: DynamoDBから読み取り
// ========================================================================
async function fallbackToDynamoDB() {
  console.log(`📊 Fallback: Reading from DynamoDB...`);

  const dynamodb = new AWS.DynamoDB.DocumentClient();

  try {
    const result = await dynamodb.scan({
      TableName: process.env.TASKS_TABLE_NAME,
      Limit: 100,
    }).promise();

    console.log(`✅ Fallback succeeded: ${result.Items.length} items from DynamoDB`);
    return result.Items;

  } catch (error) {
    console.error(`❌ Fallback also failed:`, error);
    throw new Error('Both CloudWatch Logs and DynamoDB fallback failed');
  }
}

// ========================================================================
// Lambda Handler
// ========================================================================
exports.handler = async (event) => {
  try {
    const endTime = Date.now();
    const startTime = endTime - (60 * 1000);  // 過去1分間

    // CloudWatch Logsから取得（リトライ付き）
    const logEvents = await getCloudWatchLogsWithRetry(
      process.env.CDK_LOG_GROUP,
      startTime,
      endTime
    );

    // ログ解析
    const progressData = parseLogEvents(logEvents);

    // Redisに書き込み
    await updateRedisCache(progressData);

    // DynamoDBに書き込み
    await updateDynamoDB(progressData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Progress updated successfully',
        tasksProcessed: progressData.length,
      }),
    };

  } catch (error) {
    console.error('❌ Lambda execution failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to update progress',
        error: error.message,
      }),
    };
  }
};

// ========================================================================
// ログ解析（実装例）
// ========================================================================
function parseLogEvents(logEvents) {
  const progressData = [];

  for (const event of logEvents) {
    try {
      const message = event.message;

      // CDK デプロイログの解析例
      // "MiyabiWebUIStack | 5/29 | 8:00:00 PM | CREATE_IN_PROGRESS | ..."
      const match = message.match(/(\d+)\/(\d+)/);
      if (match) {
        const current = parseInt(match[1]);
        const total = parseInt(match[2]);
        const percentage = Math.floor((current / total) * 100);

        progressData.push({
          task_id: `task-cdk-deploy-${event.timestamp}`,
          timestamp: event.timestamp,
          progress: {
            current,
            total,
            percentage,
          },
          status: percentage === 100 ? 'completed' : 'running',
        });
      }
    } catch (error) {
      console.error('Failed to parse log event:', error);
    }
  }

  return progressData;
}

// ========================================================================
// Redis更新（実装例）
// ========================================================================
async function updateRedisCache(progressData) {
  for (const task of progressData) {
    await redis.setex(
      `task:${task.task_id}`,
      3600,  // TTL 1時間
      JSON.stringify(task)
    );
  }
}

// ========================================================================
// DynamoDB更新（実装例）
// ========================================================================
async function updateDynamoDB(progressData) {
  const dynamodb = new AWS.DynamoDB.DocumentClient();

  for (const task of progressData) {
    await dynamodb.put({
      TableName: process.env.TASKS_TABLE_NAME,
      Item: {
        task_id: task.task_id,
        timestamp: task.timestamp,
        ...task,
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),  // 90日
      },
    }).promise();
  }
}
```

---

## 📊 監視とアラート

### CloudWatch Metricsカスタムメトリクス

```javascript
const cloudwatch = new AWS.CloudWatch();

async function recordRetryMetrics(attempt, success) {
  await cloudwatch.putMetricData({
    Namespace: 'Miyabi/ProgressCollector',
    MetricData: [
      {
        MetricName: 'RetryAttempts',
        Value: attempt,
        Unit: 'Count',
        Dimensions: [
          { Name: 'FunctionName', Value: 'miyabi-progress-collector' },
        ],
      },
      {
        MetricName: 'RetrySuccess',
        Value: success ? 1 : 0,
        Unit: 'Count',
      },
    ],
  }).promise();
}
```

### CloudWatch Alarm設定

```typescript
// CDKスタック内
const retryAlarm = new cloudwatch.Alarm(this, 'HighRetryRateAlarm', {
  metric: new cloudwatch.Metric({
    namespace: 'Miyabi/ProgressCollector',
    metricName: 'RetryAttempts',
    statistic: 'Sum',
  }),
  threshold: 10,
  evaluationPeriods: 1,
  alarmDescription: 'High retry rate detected - CloudWatch Logs may be experiencing issues',
});
```

---

## 🎯 期待される効果

1. **信頼性向上**
   - 一時的なネットワークエラーに対応
   - CloudWatch Logs APIのレート制限を回避

2. **ユーザー体験改善**
   - データ取得失敗時も最終的にデータが表示される
   - DynamoDBフォールバックで完全なデータ損失を防ぐ

3. **コスト最適化**
   - 指数バックオフでAPI呼び出し数を最適化
   - Jitterで同時リトライの衝突を回避

4. **監視強化**
   - リトライメトリクスで問題を早期発見
   - アラームで異常を通知

---

**Orchestrator**: Layer 2 - Mac Agent
**System**: Retry Strategy with Exponential Backoff
**Status**: ✅ Design Complete

🌸 **"失敗を恐れず、リトライで強くなる"** 🌸
