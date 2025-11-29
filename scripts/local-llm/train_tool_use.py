#!/usr/bin/env python3
"""
Miyabi Local LLM Tool Use Training Script
LoRA/QLoRA を使用したTool Calling能力のファインチューニング
"""

import json
import torch
from pathlib import Path
from datetime import datetime

# 設定
CONFIG = {
    "base_model": "Qwen/Qwen2.5-Coder-7B-Instruct",
    "output_dir": "/home/ubuntu/miyabi-private/models/miyabi-tool-use",
    "dataset_path": "/home/ubuntu/miyabi-private/data/tool_use_dataset.jsonl",
    
    # LoRA設定
    "lora_r": 16,
    "lora_alpha": 32,
    "lora_dropout": 0,
    "target_modules": [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    
    # トレーニング設定
    "learning_rate": 2e-4,
    "batch_size": 2,
    "gradient_accumulation_steps": 8,
    "num_epochs": 1,
    "max_seq_length": 2048,
    "warmup_ratio": 0.1,
}

def check_dependencies():
    """依存関係チェック"""
    required = ["transformers", "peft", "trl", "bitsandbytes", "datasets"]
    missing = []
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print(f"❌ 不足パッケージ: {', '.join(missing)}")
        print(f"インストール: pip install {' '.join(missing)}")
        return False
    return True

def load_dataset(path: str):
    """Tool Useデータセットをロード"""
    from datasets import load_dataset
    
    if Path(path).exists():
        return load_dataset("json", data_files=path)["train"]
    else:
        # デフォルトデータセット
        print("📥 デフォルトデータセット (glaive-function-calling) をロード中...")
        ds = load_dataset("glaiveai/glaive-function-calling-v2", split="train")
        return ds.select(range(min(5000, len(ds))))  # 最初の5000サンプル

def create_sample_dataset():
    """Miyabi MCPツール用のサンプルデータセット作成"""
    samples = [
        {
            "messages": [
                {"role": "user", "content": "tmuxセッション一覧を表示して"},
                {"role": "assistant", "tool_calls": [{
                    "type": "function",
                    "function": {
                        "name": "tmux_list_sessions",
                        "arguments": {}
                    }
                }]}
            ],
            "tools": [{
                "type": "function",
                "function": {
                    "name": "tmux_list_sessions",
                    "description": "List all tmux sessions",
                    "parameters": {"type": "object", "properties": {}}
                }
            }]
        },
        {
            "messages": [
                {"role": "user", "content": "Issue #123の詳細を見せて"},
                {"role": "assistant", "tool_calls": [{
                    "type": "function",
                    "function": {
                        "name": "get_issue",
                        "arguments": {"issue_number": 123}
                    }
                }]}
            ],
            "tools": [{
                "type": "function",
                "function": {
                    "name": "get_issue",
                    "description": "Get GitHub issue details",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "issue_number": {"type": "integer"}
                        },
                        "required": ["issue_number"]
                    }
                }
            }]
        },
        # 追加サンプル...
    ]
    
    output_path = Path(CONFIG["dataset_path"])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        for sample in samples:
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")
    
    print(f"✅ サンプルデータセット作成: {output_path}")
    return samples

def train():
    """メイントレーニング関数"""
    print("🚀 Miyabi Tool Use Training")
    print("=" * 50)
    
    if not check_dependencies():
        return
    
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model
    from trl import SFTTrainer, SFTConfig
    
    # 量子化設定
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )
    
    print(f"📥 モデルロード中: {CONFIG['base_model']}")
    model = AutoModelForCausalLM.from_pretrained(
        CONFIG["base_model"],
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    
    tokenizer = AutoTokenizer.from_pretrained(
        CONFIG["base_model"],
        trust_remote_code=True,
    )
    tokenizer.pad_token = tokenizer.eos_token
    
    # LoRA設定
    lora_config = LoraConfig(
        r=CONFIG["lora_r"],
        lora_alpha=CONFIG["lora_alpha"],
        lora_dropout=CONFIG["lora_dropout"],
        target_modules=CONFIG["target_modules"],
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # データセット
    dataset = load_dataset(CONFIG["dataset_path"])
    print(f"📊 データセットサイズ: {len(dataset)}")
    
    # トレーニング設定
    training_args = SFTConfig(
        output_dir=CONFIG["output_dir"],
        per_device_train_batch_size=CONFIG["batch_size"],
        gradient_accumulation_steps=CONFIG["gradient_accumulation_steps"],
        learning_rate=CONFIG["learning_rate"],
        lr_scheduler_type="linear",
        warmup_ratio=CONFIG["warmup_ratio"],
        num_train_epochs=CONFIG["num_epochs"],
        max_seq_length=CONFIG["max_seq_length"],
        optim="adamw_8bit",
        bf16=True,
        gradient_checkpointing=True,
        logging_steps=10,
        save_steps=100,
    )
    
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        processing_class=tokenizer,
    )
    
    print("🏋️ トレーニング開始...")
    trainer.train()
    
    # 保存
    output_path = Path(CONFIG["output_dir"]) / f"checkpoint-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    trainer.save_model(output_path)
    print(f"✅ モデル保存完了: {output_path}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--create-sample":
        create_sample_dataset()
    else:
        train()
