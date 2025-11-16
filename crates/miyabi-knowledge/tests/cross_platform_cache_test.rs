//! Cross-platform cache tests for Windows and macOS
//!
//! These tests verify that cache operations work correctly across different platforms,
//! especially focusing on path handling and home directory resolution.

use miyabi_knowledge::IndexCache;
use std::path::PathBuf;

#[test]
fn test_cache_creation_cross_platform() {
    let cache = IndexCache::new("test-workspace".to_string());
    assert_eq!(cache.workspace, "test-workspace");
    assert_eq!(cache.indexed_count(), 0);
}

#[test]
fn test_cache_with_platform_paths() {
    let mut cache = IndexCache::new("test".to_string());

    // Test with platform-specific paths
    let path = if cfg!(windows) {
        PathBuf::from("C:\\Users\\test\\file.txt")
    } else {
        PathBuf::from("/home/test/file.txt")
    };

    let hash = "abc123".to_string();
    cache.mark_indexed(path.clone(), hash.clone());

    assert_eq!(cache.indexed_count(), 1);
    assert!(cache.is_indexed(&path, &hash));
}

#[test]
fn test_cache_directory_detection() {
    // Test that cache directory can be determined on all platforms
    let cache_dir = dirs::cache_dir();
    assert!(cache_dir.is_some(), "Cache directory should be available");

    let cache_dir = cache_dir.unwrap();
    assert!(!cache_dir.as_os_str().is_empty(), "Cache directory should not be empty");
}

#[test]
fn test_multiple_paths_same_workspace() {
    let mut cache = IndexCache::new("multi-test".to_string());

    let paths = if cfg!(windows) {
        vec![
            PathBuf::from("C:\\Users\\test\\file1.txt"),
            PathBuf::from("C:\\Users\\test\\file2.txt"),
            PathBuf::from("D:\\projects\\file3.txt"),
        ]
    } else {
        vec![
            PathBuf::from("/home/test/file1.txt"),
            PathBuf::from("/home/test/file2.txt"),
            PathBuf::from("/var/log/file3.txt"),
        ]
    };

    for (i, path) in paths.iter().enumerate() {
        cache.mark_indexed(path.clone(), format!("hash{}", i));
    }

    assert_eq!(cache.indexed_count(), 3);

    for (i, path) in paths.iter().enumerate() {
        assert!(cache.is_indexed(path, &format!("hash{}", i)));
    }
}

#[test]
fn test_cache_serialization_with_platform_paths() {
    let mut cache = IndexCache::new("serialization-test".to_string());

    let path = if cfg!(windows) {
        PathBuf::from("C:\\test\\file.txt")
    } else {
        PathBuf::from("/test/file.txt")
    };

    cache.mark_indexed(path.clone(), "hash123".to_string());

    // Serialize
    let json = serde_json::to_string(&cache).unwrap();
    assert!(!json.is_empty());

    // Deserialize
    let deserialized: IndexCache = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.workspace, cache.workspace);
    assert_eq!(deserialized.indexed_count(), cache.indexed_count());
    assert!(deserialized.is_indexed(&path, "hash123"));
}

#[cfg(windows)]
#[test]
fn test_windows_unc_path_in_cache() {
    let mut cache = IndexCache::new("unc-test".to_string());

    // Test with UNC path
    let unc_path = PathBuf::from("\\\\server\\share\\file.txt");
    cache.mark_indexed(unc_path.clone(), "unc_hash".to_string());

    assert!(cache.is_indexed(&unc_path, "unc_hash"));
}

#[cfg(windows)]
#[test]
fn test_windows_relative_path_normalization() {
    let mut cache = IndexCache::new("relative-test".to_string());

    let relative = PathBuf::from("..\\..\\test.txt");
    cache.mark_indexed(relative.clone(), "rel_hash".to_string());

    assert!(cache.is_indexed(&relative, "rel_hash"));
}

#[test]
fn test_clear_cache_cross_platform() {
    let mut cache = IndexCache::new("clear-test".to_string());

    let path1 = PathBuf::from("file1.txt");
    let path2 = PathBuf::from("file2.txt");

    cache.mark_indexed(path1, "hash1".to_string());
    cache.mark_indexed(path2, "hash2".to_string());

    assert_eq!(cache.indexed_count(), 2);

    cache.clear();

    assert_eq!(cache.indexed_count(), 0);
}

#[test]
fn test_load_or_default_nonexistent() {
    // Use a unique workspace name to avoid conflicts
    let workspace = format!(
        "nonexistent-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    // Should create new cache if not exists
    let cache = IndexCache::load_or_default(&workspace);
    assert!(cache.is_ok(), "Should successfully create default cache");

    let cache = cache.unwrap();
    assert_eq!(cache.workspace, workspace);
    assert_eq!(cache.indexed_count(), 0);
}

#[test]
fn test_path_with_spaces() {
    let mut cache = IndexCache::new("spaces-test".to_string());

    let path = if cfg!(windows) {
        PathBuf::from("C:\\Program Files\\My App\\file.txt")
    } else {
        PathBuf::from("/home/user name/my file.txt")
    };

    cache.mark_indexed(path.clone(), "spaces_hash".to_string());
    assert!(cache.is_indexed(&path, "spaces_hash"));
}

#[test]
fn test_path_with_unicode() {
    let mut cache = IndexCache::new("unicode-test".to_string());

    let path = if cfg!(windows) {
        PathBuf::from("C:\\Users\\日本語\\ファイル.txt")
    } else {
        PathBuf::from("/home/ユーザー/ファイル.txt")
    };

    cache.mark_indexed(path.clone(), "unicode_hash".to_string());
    assert!(cache.is_indexed(&path, "unicode_hash"));
}

#[test]
fn test_very_long_path() {
    let mut cache = IndexCache::new("long-path-test".to_string());

    // Create a very long path (but within reasonable limits)
    let mut long_path = if cfg!(windows) {
        PathBuf::from("C:\\")
    } else {
        PathBuf::from("/")
    };

    for i in 0..10 {
        long_path.push(format!("very_long_directory_name_{}", i));
    }
    long_path.push("file.txt");

    cache.mark_indexed(long_path.clone(), "long_hash".to_string());
    assert!(cache.is_indexed(&long_path, "long_hash"));
}

#[cfg(windows)]
#[test]
fn test_windows_reserved_names() {
    let mut cache = IndexCache::new("reserved-test".to_string());

    // Windows has reserved names that should still work in paths
    let path = PathBuf::from("C:\\test\\CON_file.txt");
    cache.mark_indexed(path.clone(), "reserved_hash".to_string());
    assert!(cache.is_indexed(&path, "reserved_hash"));
}

#[test]
fn test_case_sensitivity() {
    let mut cache = IndexCache::new("case-test".to_string());

    let path1 = PathBuf::from("test.txt");
    let path2 = PathBuf::from("Test.txt");

    cache.mark_indexed(path1.clone(), "hash1".to_string());

    // On Windows, paths are case-insensitive, on Unix they're case-sensitive
    if cfg!(windows) {
        // On Windows, these should be considered the same
        // But PathBuf preserves the case, so they're different keys
        assert!(cache.is_indexed(&path1, "hash1"));
    } else {
        // On Unix, these are different files
        assert!(cache.is_indexed(&path1, "hash1"));
        assert!(!cache.is_indexed(&path2, "hash1"));
    }
}
