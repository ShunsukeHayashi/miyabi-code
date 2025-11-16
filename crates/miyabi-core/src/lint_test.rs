// Miyabi Lint Configuration Test
// This file intentionally contains various lint violations to test the configuration

#![allow(dead_code)] // This entire file is for testing

use std::collections::HashMap;

/// Test Tier 1 (Critical - DENY) lints
mod tier1_critical {
    use std::sync::Mutex;
    use std::collections::HashMap;

    // ❌ Tier 1: await_holding_lock (DENY)
    // This should trigger an error
    #[allow(clippy::await_holding_lock)]
    pub async fn test_await_holding_lock() {
        let mutex = Mutex::new(vec![1, 2, 3]);
        let _guard = mutex.lock().unwrap();
        // Holding lock across await point
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }

    // ❌ Tier 1: mem_forget (DENY)
    #[allow(clippy::mem_forget)]
    pub fn test_mem_forget() {
        let data = vec![1, 2, 3];
        std::mem::forget(data); // Memory leak
    }

    // ❌ Tier 1: empty_loop (DENY)
    #[allow(clippy::empty_loop)]
    pub fn test_empty_loop() {
        loop {
            // Infinite loop without logic
        }
    }
}

/// Test Tier 2 (Important - WARN) lints
mod tier2_important {
    use std::collections::HashMap;

    // ⚠️ Tier 2: unwrap_used (WARN)
    pub fn test_unwrap() -> i32 {
        let value: Option<i32> = Some(42);
        value.unwrap() // Should warn
    }

    // ⚠️ Tier 2: panic (WARN)
    pub fn test_panic() {
        panic!("This is a test panic");
    }

    // ⚠️ Tier 2: expect_used (ALLOW but trackable)
    pub fn test_expect() -> i32 {
        let value: Option<i32> = Some(42);
        value.expect("This should have a value")
    }

    // ⚠️ Tier 2: Performance issue
    pub fn test_performance() {
        let mut map: HashMap<String, i32> = HashMap::new();
        for i in 0..1000 {
            map.insert(i.to_string(), i); // Could use with_capacity
        }
    }
}

/// Test Tier 3 (Style - ALLOW) lints
mod tier3_style {
    use std::collections::HashMap;

    // ✅ Tier 3: type_complexity (ALLOW)
    pub type ComplexType = HashMap<String, Vec<Result<Option<i32>, Box<dyn std::error::Error>>>>;

    // ✅ Tier 3: too_many_lines (ALLOW)
    #[allow(clippy::too_many_lines)]
    pub fn very_long_function() {
        // Imagine 500+ lines of well-structured code here
        let line1 = 1;
        let line2 = 2;
        let line3 = 3;
        // ... (this would be 500+ lines in real code)
    }

    // ✅ Tier 3: too_many_arguments (ALLOW)
    #[allow(clippy::too_many_arguments)]
    pub fn many_arguments(
        arg1: i32,
        arg2: i32,
        arg3: i32,
        arg4: i32,
        arg5: i32,
        arg6: i32,
        arg7: i32,
        arg8: i32,
        arg9: i32,
        arg10: i32,
        arg11: i32,
        arg12: i32,
    ) -> i32 {
        arg1 + arg2 + arg3 + arg4 + arg5 + arg6 + arg7 + arg8 + arg9 + arg10 + arg11 + arg12
    }

    // ✅ Tier 3: module_name_repetitions (ALLOW)
    pub mod tier3_style_module {
        pub struct Tier3StyleStruct {
            pub tier3_style_field: i32,
        }
    }

    // ✅ Tier 3: vec_init_then_push (ALLOW - common AI pattern)
    pub fn test_vec_init() -> Vec<i32> {
        let mut vec = Vec::new();
        vec.push(1);
        vec.push(2);
        vec.push(3);
        vec
    }

    // ✅ Tier 3: single_match (ALLOW - AI pattern)
    pub fn test_single_match(value: Option<i32>) {
        match value {
            Some(x) => println!("Got {}", x),
            None => {}
        }
    }

    // ✅ Tier 3: needless_return (ALLOW - AI explicit returns)
    pub fn test_needless_return(x: i32) -> i32 {
        let result = x * 2;
        return result; // Explicit return
    }
}

/// Test AI-friendly patterns
mod ai_patterns {
    // ✅ Complex but correct logic (cognitive_complexity ALLOW)
    pub fn complex_business_logic(input: &str) -> Result<String, String> {
        if input.is_empty() {
            return Err("Empty input".to_string());
        }

        let mut result = String::new();

        for ch in input.chars() {
            if ch.is_ascii_alphabetic() {
                if ch.is_ascii_uppercase() {
                    result.push(ch.to_ascii_lowercase());
                } else {
                    result.push(ch.to_ascii_uppercase());
                }
            } else if ch.is_ascii_digit() {
                let digit = ch.to_digit(10).ok_or("Invalid digit")?;
                result.push_str(&(digit * 2).to_string());
            } else {
                result.push(ch);
            }
        }

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tier3_allowed() {
        // These should compile without errors
        assert_eq!(tier3_style::test_needless_return(5), 10);
        assert_eq!(tier3_style::test_vec_init(), vec![1, 2, 3]);
        assert_eq!(
            tier3_style::many_arguments(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12),
            78
        );
    }

    #[test]
    fn test_ai_patterns() {
        let result = ai_patterns::complex_business_logic("Hello123").unwrap();
        assert!(!result.is_empty());
    }
}
