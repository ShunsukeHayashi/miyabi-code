# 🤖 ローカルLLM対応実装計画

## Issue #1100: ローカルLLMファインチューニング戦略

### 📋 タスク分割

#### Phase 1: 環境構築 (今すぐ実行)
- [ ] Ollama インストール
- [ ] MLX (Apple Silicon用) 確認
- [ ] vLLM 設定
- [ ] 推論サーバー起動確認

#### Phase 2: モデル評価
- [ ] Gemma 2 9B/27B
- [ ] Qwen 2.5 7B/14B  
- [ ] DeepSeek Coder V2
- [ ] Llama 3.1 8B

#### Phase 3: Miyabi統合
- [ ] miyabi-llm crate作成
- [ ] Ollama API対応
- [ ] Claude ↔ Local切り替え
- [ ] 性能モニタリング

### 🚀 実行開始
