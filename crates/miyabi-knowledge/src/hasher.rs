//! ファイルハッシュ計算
//!
//! ログファイルのSHA256ハッシュを計算し、変更検出に使用します。

use crate::error::Result;
use sha2::{Digest, Sha256};
use std::path::Path;

/// ファイルのSHA256ハッシュを計算
///
/// # Arguments
///
/// * `path` - ファイルパス
///
/// # Returns
///
/// SHA256ハッシュの16進数文字列
///
/// # Example
///
/// ```no_run
/// # use miyabi_knowledge::hash_file;
/// # fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let hash = hash_file("path/to/log.md")?;
/// println!("Hash: {}", hash);
/// # Ok(())
/// # }
/// ```
pub fn hash_file<P: AsRef<Path>>(path: P) -> Result<String> {
    let content = std::fs::read(path.as_ref())?;
    Ok(hash_bytes(&content))
}

/// バイト列のSHA256ハッシュを計算
///
/// # Arguments
///
/// * `data` - バイト列
///
/// # Returns
///
/// SHA256ハッシュの16進数文字列
pub fn hash_bytes(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

/// 文字列のSHA256ハッシュを計算
///
/// # Arguments
///
/// * `s` - 文字列
///
/// # Returns
///
/// SHA256ハッシュの16進数文字列
pub fn hash_string(s: &str) -> String {
    hash_bytes(s.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::TempDir;

    #[test]
    fn test_hash_string() {
        let hash = hash_string("hello world");
        // SHA256("hello world") の既知のハッシュ値
        assert_eq!(hash, "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
    }

    #[test]
    fn test_hash_bytes() {
        let data = b"test data";
        let hash = hash_bytes(data);
        // 一貫性チェック
        assert_eq!(hash, hash_string("test data"));
    }

    #[test]
    fn test_hash_file() {
        let dir = TempDir::new().unwrap();
        let file_path = dir.path().join("test.txt");

        let mut file = File::create(&file_path).unwrap();
        file.write_all(b"test content").unwrap();
        drop(file);

        let hash = hash_file(&file_path).unwrap();

        // 同じ内容のハッシュは一致する
        assert_eq!(hash, hash_string("test content"));
    }

    #[test]
    fn test_hash_file_consistency() {
        let dir = TempDir::new().unwrap();
        let file_path = dir.path().join("test.txt");

        let mut file = File::create(&file_path).unwrap();
        file.write_all(b"consistent content").unwrap();
        drop(file);

        let hash1 = hash_file(&file_path).unwrap();
        let hash2 = hash_file(&file_path).unwrap();

        // 同じファイルのハッシュは常に同じ
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_hash_file_different_content() {
        let dir = TempDir::new().unwrap();

        let file1_path = dir.path().join("file1.txt");
        let mut file1 = File::create(&file1_path).unwrap();
        file1.write_all(b"content 1").unwrap();
        drop(file1);

        let file2_path = dir.path().join("file2.txt");
        let mut file2 = File::create(&file2_path).unwrap();
        file2.write_all(b"content 2").unwrap();
        drop(file2);

        let hash1 = hash_file(&file1_path).unwrap();
        let hash2 = hash_file(&file2_path).unwrap();

        // 異なる内容のハッシュは異なる
        assert_ne!(hash1, hash2);
    }

    #[test]
    fn test_hash_empty_file() {
        let dir = TempDir::new().unwrap();
        let file_path = dir.path().join("empty.txt");

        File::create(&file_path).unwrap();

        let hash = hash_file(&file_path).unwrap();

        // 空ファイルのSHA256ハッシュ
        assert_eq!(hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    }
}
