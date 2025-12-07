# A2A Message Format Specification

## Standard Format

```
[Agent] Status: Detail
```

## Components

### Agent Name
送信元エージェントの名前（日本語または英語）

| 日本語 | 英語 |
|--------|------|
| 指揮郎 | Shikiroon |
| 楓 | Kaede |
| 桜 | Sakura |
| 椿 | Tsubaki |
| 牡丹 | Botan |
| 見付郎 | Mitsukeroon |

### Status Types

| Status | 意味 | 使用場面 |
|--------|------|----------|
| `開始` | タスク開始 | タスク着手時 |
| `進行中` | 作業中 | 進捗報告 |
| `完了` | タスク完了 | タスク終了時 |
| `エラー` | 問題発生 | エラー時 |
| `待機` | 入力待ち | 追加情報必要時 |
| `承認` | 承認待ち | レビュー・マージ承認時 |

## Message Examples

### Status Report
```
[楓] 開始: Issue #270 実装開始
[楓] 進行中: REST API実装中 (50%)
[楓] 完了: Issue #270 実装完了
[桜] エラー: テストカバレッジ不足 (60% < 80%)
```

### Agent Relay Format
```
[FromAgent→ToAgent] Action: Detail
```

Examples:
```
[楓→桜] レビュー依頼: PR #123
[桜→椿] 承認: PR #123 マージ可
[椿→牡丹] デプロイ依頼: main更新
[見付郎→楓] 実装依頼: Issue #270
```

### Error Report
```
[牡丹] エラー: デプロイ失敗
  - 原因: S3バケットアクセス権限不足
  - 対処: ロールバック実行中
```

### Multi-line Progress
```
[楓] 進行中: Issue #270
  - API設計: 完了
  - 実装: 進行中 (70%)
  - テスト: 未着手
```

## Validation Rules

1. **必須フィールド**: Agent名, Status, Detail
2. **Agent名**: 登録されたエージェント名のみ使用可
3. **Status**: 定義されたステータスのみ使用可
4. **Detail**: 具体的で簡潔な説明

## Parsing Example

```bash
# メッセージをパース
parse_message() {
  local msg="$1"
  local agent=$(echo "$msg" | sed -n 's/^\[\([^]]*\)\].*/\1/p')
  local status=$(echo "$msg" | sed -n 's/^[^]]*\] \([^:]*\):.*/\1/p')
  local detail=$(echo "$msg" | sed -n 's/^[^:]*: \(.*\)/\1/p')

  echo "Agent: $agent"
  echo "Status: $status"
  echo "Detail: $detail"
}
```
