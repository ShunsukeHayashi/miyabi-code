/// Test helper function to validate workflow
///
/// # Arguments
/// * `prefix` - A string prefix to add to the test message
///
/// # Returns
/// A formatted string containing the prefix and test message
///
/// # Examples
/// ```
/// use miyabi_core::utils::test_helper::generate_test_message;
///
/// let msg = generate_test_message("INFO");
/// assert!(msg.contains("INFO"));
/// assert!(msg.contains("Miyabi"));
/// ```
pub fn generate_test_message(prefix: &str) -> String {
    format!("{}: Miyabi autonomous workflow test", prefix)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_test_message() {
        let msg = generate_test_message("INFO");
        assert!(msg.contains("INFO"));
        assert!(msg.contains("Miyabi"));
    }

    #[test]
    fn test_generate_test_message_with_different_prefixes() {
        let test_cases = vec![
            ("DEBUG", "DEBUG: Miyabi autonomous workflow test"),
            ("WARN", "WARN: Miyabi autonomous workflow test"),
            ("ERROR", "ERROR: Miyabi autonomous workflow test"),
        ];

        for (prefix, expected) in test_cases {
            let result = generate_test_message(prefix);
            assert_eq!(result, expected);
        }
    }

    #[test]
    fn test_generate_test_message_empty_prefix() {
        let msg = generate_test_message("");
        assert_eq!(msg, ": Miyabi autonomous workflow test");
    }
}
