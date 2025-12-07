# Agent Send

特定のエージェントにメッセージを送信します。

## 使用方法

/agent-send [エージェント名またはペインID] [メッセージ]

## エージェントマッピング

| 名前 | ペインID | 役割 |
|------|----------|------|
| shikiroon / 指揮郎 | %18 | Conductor |
| kaede / 楓 | %19 | CodeGen |
| sakura / 桜 | %20 | Review |
| tsubaki / 椿 | %21 | PR |
| botan / 牡丹 | %22 | Deploy |
| mitsukeroon / 見付郎 | %23 | Issue |

## 実行内容

P0.2プロトコルでメッセージ送信:

```bash
source ./a2a.sh && a2a_send "<pane_id>" "<message>"
```

## 例

```
/agent-send kaede "Implement user authentication feature"
/agent-send %19 "[Task] Create REST API endpoints"
```

引数を解析し、適切なペインにメッセージを送信してください。
エージェント名が指定された場合は、対応するペインIDに変換してください。
