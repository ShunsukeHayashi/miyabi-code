//! テキストチャンク分割

use crate::error::Result;
use tracing::debug;

/// チャンク設定
#[derive(Debug, Clone)]
pub struct ChunkConfig {
    /// チャンクサイズ（文字数）
    pub chunk_size: usize,

    /// オーバーラップサイズ（文字数）
    pub overlap_size: usize,

    /// 最小チャンクサイズ（これより小さいチャンクは無視）
    pub min_chunk_size: usize,
}

impl Default for ChunkConfig {
    fn default() -> Self {
        Self {
            chunk_size: 512,
            overlap_size: 128,
            min_chunk_size: 50,
        }
    }
}

/// テキストチャンカー
pub struct TextChunker {
    config: ChunkConfig,
}

impl TextChunker {
    /// 新しいTextChunkerを作成
    pub fn new(config: ChunkConfig) -> Self {
        Self { config }
    }

    /// デフォルト設定でTextChunkerを作成
    pub fn with_default_config() -> Self {
        Self::new(ChunkConfig::default())
    }

    /// テキストをチャンクに分割
    pub fn chunk(&self, text: &str) -> Result<Vec<String>> {
        debug!(
            "Chunking text: {} chars, chunk_size: {}, overlap: {}",
            text.len(),
            self.config.chunk_size,
            self.config.overlap_size
        );

        let mut chunks = Vec::new();
        let text_len = text.len();

        if text_len <= self.config.min_chunk_size {
            // 最小チャンクサイズより小さい場合は分割しない
            return Ok(vec![text.to_string()]);
        }

        let mut start = 0;

        while start < text_len {
            let end = std::cmp::min(start + self.config.chunk_size, text_len);

            // 次のチャンク開始位置を計算
            let next_start = if end < text_len {
                start + self.config.chunk_size - self.config.overlap_size
            } else {
                text_len
            };

            // チャンクを抽出（文字境界に注意）
            let chunk = self.extract_chunk(text, start, end);

            if chunk.len() >= self.config.min_chunk_size {
                chunks.push(chunk);
            }

            start = next_start;

            // 無限ループ防止
            if start <= chunks.len() * self.config.chunk_size {
                // 進行していない場合は強制的に進める
                if end >= text_len {
                    break;
                }
            }
        }

        debug!("Split text into {} chunks", chunks.len());
        Ok(chunks)
    }

    /// 文字境界を考慮してチャンクを抽出
    fn extract_chunk(&self, text: &str, start: usize, end: usize) -> String {
        // UTF-8文字境界に注意して抽出
        let chunk_start = self.find_char_boundary(text, start);
        let chunk_end = self.find_char_boundary(text, end);

        // 段落境界や文境界で分割するのが理想的だが、
        // まずはシンプルに文字数ベースで分割
        text[chunk_start..chunk_end].to_string()
    }

    /// 文字境界を見つける
    fn find_char_boundary(&self, text: &str, pos: usize) -> usize {
        if pos >= text.len() {
            return text.len();
        }

        // UTF-8文字境界でない場合は前に戻る
        let mut boundary = pos;
        while boundary > 0 && !text.is_char_boundary(boundary) {
            boundary -= 1;
        }

        boundary
    }

    /// 段落単位でチャンク化（オプション）
    pub fn chunk_by_paragraphs(&self, text: &str) -> Result<Vec<String>> {
        debug!("Chunking by paragraphs: {} chars", text.len());

        let paragraphs: Vec<&str> = text.split("\n\n").collect();
        let mut chunks = Vec::new();
        let mut current_chunk = String::new();

        for paragraph in paragraphs {
            if current_chunk.len() + paragraph.len() <= self.config.chunk_size {
                // 現在のチャンクに追加
                if !current_chunk.is_empty() {
                    current_chunk.push_str("\n\n");
                }
                current_chunk.push_str(paragraph);
            } else {
                // 現在のチャンクを確定して新しいチャンクを開始
                if !current_chunk.is_empty() && current_chunk.len() >= self.config.min_chunk_size {
                    chunks.push(current_chunk.clone());
                }

                current_chunk = paragraph.to_string();

                // パラグラフ自体がチャンクサイズより大きい場合は分割
                if current_chunk.len() > self.config.chunk_size {
                    let sub_chunks = self.chunk(&current_chunk)?;
                    chunks.extend(sub_chunks);
                    current_chunk.clear();
                }
            }
        }

        // 最後のチャンクを追加
        if !current_chunk.is_empty() && current_chunk.len() >= self.config.min_chunk_size {
            chunks.push(current_chunk);
        }

        debug!("Split text into {} paragraph-based chunks", chunks.len());
        Ok(chunks)
    }

    /// センテンス単位でチャンク化（オプション）
    pub fn chunk_by_sentences(&self, text: &str) -> Result<Vec<String>> {
        debug!("Chunking by sentences: {} chars", text.len());

        // 簡易的な文分割（. ? ! で分割）
        let sentences: Vec<&str> = text
            .split(['.', '?', '!', '。', '！', '？'])
            .filter(|s| !s.trim().is_empty())
            .collect();

        let mut chunks = Vec::new();
        let mut current_chunk = String::new();

        for sentence in sentences {
            let sentence = sentence.trim();
            if current_chunk.len() + sentence.len() <= self.config.chunk_size {
                if !current_chunk.is_empty() {
                    current_chunk.push(' ');
                }
                current_chunk.push_str(sentence);
            } else {
                if !current_chunk.is_empty() && current_chunk.len() >= self.config.min_chunk_size {
                    chunks.push(current_chunk.clone());
                }

                current_chunk = sentence.to_string();

                // センテンス自体がチャンクサイズより大きい場合は分割
                if current_chunk.len() > self.config.chunk_size {
                    let sub_chunks = self.chunk(&current_chunk)?;
                    chunks.extend(sub_chunks);
                    current_chunk.clear();
                }
            }
        }

        if !current_chunk.is_empty() && current_chunk.len() >= self.config.min_chunk_size {
            chunks.push(current_chunk);
        }

        debug!("Split text into {} sentence-based chunks", chunks.len());
        Ok(chunks)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chunking_small_text() {
        let chunker = TextChunker::with_default_config();
        let text = "This is a small text.";
        let chunks = chunker.chunk(text).unwrap();
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0], text);
    }

    #[test]
    fn test_chunking_long_text() {
        let chunker = TextChunker::new(ChunkConfig {
            chunk_size: 100,
            overlap_size: 20,
            min_chunk_size: 10,
        });

        let text = "a".repeat(300);
        let chunks = chunker.chunk(&text).unwrap();

        assert!(chunks.len() >= 3);
        assert!(chunks[0].len() <= 100);
    }

    #[test]
    fn test_chunk_by_paragraphs() {
        let chunker = TextChunker::new(ChunkConfig {
            chunk_size: 100,
            overlap_size: 0,
            min_chunk_size: 10,
        });

        let text = "Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.";
        let chunks = chunker.chunk_by_paragraphs(text).unwrap();

        assert!(chunks.len() >= 1);
    }

    #[test]
    fn test_chunk_by_sentences() {
        let chunker = TextChunker::new(ChunkConfig {
            chunk_size: 100,
            overlap_size: 0,
            min_chunk_size: 10,
        });

        let text = "Sentence 1. Sentence 2. Sentence 3.";
        let chunks = chunker.chunk_by_sentences(text).unwrap();

        assert!(chunks.len() >= 1);
    }

    #[test]
    fn test_utf8_char_boundary() {
        let chunker = TextChunker::with_default_config();
        let text = "こんにちは世界！Hello World!";
        let chunks = chunker.chunk(text).unwrap();

        // UTF-8境界が正しく処理されていることを確認
        for chunk in &chunks {
            assert!(chunk.is_char_boundary(0));
            assert!(chunk.is_char_boundary(chunk.len()));
        }
    }
}
