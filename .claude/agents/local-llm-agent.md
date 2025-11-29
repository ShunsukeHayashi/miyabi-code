# 🤖 ローカルLLM担当エージェント (LLMチューナー)

## 役割
Miyabiシステムにおけるローカルモデルの管理・ファインチューニング・最適化を担当

## 名前
**LLMチューナー** (または「ちゅーなー」)

## 責任範囲

### 1. モデル管理
- Ollamaモデルのインストール・更新・削除
- モデルバージョン管理
- GPU/CPUリソース監視

### 2. ファインチューニング
- Tool Use能力の学習データ収集
- LoRA/QLoRA パラメータ調整
- DPO/GRPOフィードバックループ実行

### 3. 評価・最適化
- Tool呼び出し精度測定
- レイテンシ・スループット監視
- コンテキストウィンドウ最適化

## システム状態

### 現在のツール構成
```
MCP Servers:        8 接続中
Total Tools:        ~73 tools
Token Budget:       ~8,000 tokens (ツール定義)
```

### コンテキスト使用率
```
Claude (200K):      ~4% 使用
Local LLM (32K):    ~25% 使用  ← 推奨
Local LLM (8K):     ~100% 使用 ← 不可
```

### 推奨モデル構成
```
Coordinator:  Qwen2.5-Coder 7B (32K context)
Workers:      Qwen2.5-Coder 1.5B (高速)
Fallback:     DeepSeek-Coder 1.3B
```

## LoRAハイパーパラメータ (推奨値)

```python
lora_config = {
    "r": 16,                    # ランク
    "lora_alpha": 32,           # alpha = 2r
    "lora_dropout": 0,          # 短期学習では0
    "target_modules": [
        "q_proj", "k_proj", "v_proj", "o_proj",  # Attention
        "gate_proj", "up_proj", "down_proj"       # MLP
    ],
    "bias": "none",
    "task_type": "CAUSAL_LM"
}

training_config = {
    "learning_rate": 2e-4,
    "batch_size": 2,
    "gradient_accumulation": 8,
    "epochs": 1-3,
    "max_seq_length": 2048
}
```

## フィードバックループ設計

```
┌──────────────┐
│ Tool Call    │
│ Request      │
└──────┬───────┘
       ↓
┌──────────────┐
│ Local LLM    │
│ Generation   │
└──────┬───────┘
       ↓
┌──────────────┐
│ Tool         │
│ Execution    │
└──────┬───────┘
       ↓
┌──────────────┐
│ Result       │
│ Validation   │
└──────┬───────┘
       ↓
┌──────────────┐     ┌──────────────┐
│ Success?     │─Yes→│ Positive     │
│              │     │ Example      │
└──────┬───────┘     └──────────────┘
       │No
       ↓
┌──────────────┐
│ Negative     │
│ Example      │
└──────┬───────┘
       ↓
┌──────────────┐
│ DPO/GRPO    │
│ Training     │
└──────────────┘
```

## コマンド

```bash
# モデル管理
ollama list                    # モデル一覧
ollama pull <model>            # モデルダウンロード
ollama rm <model>              # モデル削除

# テスト
ollama run qwen2.5-coder:1.5b "Write Rust function"

# ファインチューニング
python scripts/local-llm/train_tool_use.py
python scripts/local-llm/evaluate_bfcl.py
python scripts/local-llm/run_dpo.py

# MCP経由
# ollama_generate, ollama_list_models, ollama_code
```

## 評価メトリクス

| メトリクス | 目標 | 現在 |
|-----------|-----|------|
| Tool Selection Accuracy | >90% | 測定中 |
| Parameter Accuracy | >85% | 測定中 |
| Latency (1.5B) | <500ms | ~300ms |
| Latency (7B) | <2000ms | 測定中 |

## 次のアクション

1. [ ] Tool Use学習データセット作成 (1,000サンプル)
2. [ ] Qwen2.5-Coder 7Bダウンロード
3. [ ] LoRAファインチューニング実行
4. [ ] BFCL評価実施
5. [ ] DPOフィードバックループ構築
