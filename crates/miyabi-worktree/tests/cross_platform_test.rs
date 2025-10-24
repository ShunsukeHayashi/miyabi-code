//! Cross-platform compatibility tests for Windows and macOS
//!
//! These tests verify that path handling, environment variables, and file operations
//! work correctly across different platforms.

use miyabi_worktree::normalize_path;
use std::path::PathBuf;

#[test]
fn test_normalize_path_with_current_dir() {
    let path = normalize_path("./test/path");
    assert!(path.ends_with("test/path") || path.ends_with("test\\path"));
}

#[test]
fn test_normalize_path_with_parent_dir() {
    let path = normalize_path("test/../another");
    assert!(path.ends_with("another"));
}

#[test]
fn test_normalize_path_multiple_separators() {
    // Unix style
    let path = normalize_path("test//path///file");
    assert!(path.to_string_lossy().contains("test"));
    assert!(path.to_string_lossy().contains("path"));
    assert!(path.to_string_lossy().contains("file"));
}

#[test]
fn test_path_join_is_platform_agnostic() {
    let base = PathBuf::from("base");
    let joined = base.join("sub").join("file.txt");

    // Should work on both Windows and Unix
    assert!(joined.to_string_lossy().contains("base"));
    assert!(joined.to_string_lossy().contains("sub"));
    assert!(joined.to_string_lossy().contains("file.txt"));
}

#[test]
fn test_absolute_path_detection() {
    // This should be absolute
    let absolute = if cfg!(windows) {
        PathBuf::from("C:\\Users\\test")
    } else {
        PathBuf::from("/home/test")
    };
    assert!(absolute.is_absolute());

    // This should be relative
    let relative = PathBuf::from("relative/path");
    assert!(!relative.is_absolute());
}

#[cfg(windows)]
#[test]
fn test_windows_unc_path_normalization() {
    use dunce::simplified;
    use std::path::Path;

    // Windows UNC paths should be normalized
    let unc = Path::new("\\\\?\\C:\\test\\path");
    let normalized = simplified(unc);

    // Should strip UNC prefix
    assert!(!normalized.to_string_lossy().starts_with("\\\\?\\"));
}

#[cfg(unix)]
#[test]
fn test_unix_symlink_handling() {
    use std::os::unix::fs::symlink;
    use tempfile::TempDir;

    let temp = TempDir::new().unwrap();
    let target = temp.path().join("target");
    let link = temp.path().join("link");

    // Create target file
    std::fs::write(&target, "content").unwrap();

    // Create symlink
    symlink(&target, &link).unwrap();

    // Should be able to read through symlink
    assert!(link.exists());
    let content = std::fs::read_to_string(&link).unwrap();
    assert_eq!(content, "content");
}

#[test]
fn test_path_extension_handling() {
    let path = PathBuf::from("file.txt");
    assert_eq!(path.extension().and_then(|s| s.to_str()), Some("txt"));

    let no_ext = PathBuf::from("file");
    assert_eq!(no_ext.extension(), None);

    // Multiple dots
    let multiple = PathBuf::from("file.tar.gz");
    assert_eq!(multiple.extension().and_then(|s| s.to_str()), Some("gz"));
}

#[test]
fn test_cache_directory_creation() {
    // Test that cache directories can be created cross-platform
    let cache_dir = dirs::cache_dir().expect("Failed to get cache directory");
    assert!(cache_dir.exists() || !cache_dir.as_os_str().is_empty());
}

#[test]
fn test_home_directory_resolution() {
    // Test that home directory can be resolved cross-platform
    let home = dirs::home_dir().expect("Failed to get home directory");
    assert!(home.exists());
    assert!(home.is_absolute());
}

#[cfg(windows)]
#[test]
fn test_windows_path_separators() {
    let path = PathBuf::from("C:\\Users\\test\\file.txt");
    let components: Vec<_> = path.components().collect();

    // Should have at least 4 components: prefix, root, Users, test, file.txt
    assert!(components.len() >= 4);
}

#[cfg(unix)]
#[test]
fn test_unix_path_separators() {
    let path = PathBuf::from("/home/test/file.txt");
    let components: Vec<_> = path.components().collect();

    // Should have 4 components: root, home, test, file.txt
    assert_eq!(components.len(), 4);
}

#[test]
fn test_relative_path_resolution() {
    use std::env;

    let original_dir = env::current_dir().unwrap();

    // Create a temporary directory and change to it
    let temp = tempfile::TempDir::new().unwrap();
    env::set_current_dir(temp.path()).unwrap();

    // Test relative path
    let relative = PathBuf::from("./test.txt");
    std::fs::write(&relative, "test").unwrap();

    assert!(relative.exists());

    // Restore original directory
    env::set_current_dir(original_dir).unwrap();
}

#[test]
fn test_path_canonicalization() {
    use std::env;

    let current_dir = env::current_dir().unwrap();

    // Canonicalize should resolve to absolute path
    let canonical = current_dir.canonicalize().unwrap();
    assert!(canonical.is_absolute());
}

#[cfg(windows)]
#[test]
fn test_windows_drive_letter() {
    let path = PathBuf::from("C:\\test");
    let components: Vec<_> = path.components().collect();

    // First component should be a prefix containing drive letter
    if let Some(std::path::Component::Prefix(_)) = components.first() {
        // Expected on Windows
    } else {
        panic!("Expected prefix component with drive letter");
    }
}

#[test]
fn test_path_file_name_extraction() {
    let path = if cfg!(windows) {
        PathBuf::from("C:\\Users\\test\\file.txt")
    } else {
        PathBuf::from("/home/test/file.txt")
    };

    assert_eq!(path.file_name().and_then(|s| s.to_str()), Some("file.txt"));
}

#[test]
fn test_path_parent_extraction() {
    let path = if cfg!(windows) {
        PathBuf::from("C:\\Users\\test\\file.txt")
    } else {
        PathBuf::from("/home/test/file.txt")
    };

    let parent = path.parent().unwrap();
    assert!(parent.ends_with("test"));
}

#[test]
fn test_empty_path_handling() {
    let empty = PathBuf::from("");
    assert_eq!(empty.to_str(), Some(""));
    assert!(!empty.is_absolute());
}

#[test]
fn test_current_directory_path() {
    let current = PathBuf::from(".");
    assert!(!current.is_absolute());

    // Should be able to canonicalize it
    let canonical = current.canonicalize().unwrap();
    assert!(canonical.is_absolute());
}
