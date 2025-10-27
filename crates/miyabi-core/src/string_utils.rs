//! String transformation helpers used across Miyabi Core.

/// Convert a camelCase or PascalCase string into snake_case.
///
/// The conversion attempts to respect word boundaries introduced by
/// transitions from lowercase or digits into uppercase sequences. Non-word
/// separators such as spaces or hyphens are normalized into underscores, while
/// existing underscores are preserved.
///
/// # Examples
///
/// ```
/// use miyabi_core::string_utils::to_snake_case;
///
/// assert_eq!(to_snake_case("helloWorld"), "hello_world");
/// assert_eq!(to_snake_case("HTTPRequest"), "http_request");
/// ```
pub fn to_snake_case(s: &str) -> String {
    if s.is_empty() {
        return String::new();
    }

    #[derive(Clone, Copy)]
    enum CharState {
        Start,
        Lower,
        Upper,
        Digit,
        Separator,
        Other,
    }

    let chars: Vec<char> = s.chars().collect();
    let mut result = String::with_capacity(s.len());
    let mut prev_state = CharState::Start;
    let mut pending_separator = false;

    for (idx, &c) in chars.iter().enumerate() {
        if c == '_' {
            result.push('_');
            prev_state = CharState::Separator;
            pending_separator = false;
            continue;
        }

        if c == '-' || c.is_whitespace() {
            pending_separator = true;
            prev_state = CharState::Separator;
            continue;
        }

        if pending_separator {
            if !result.is_empty() && !result.ends_with('_') {
                result.push('_');
            }
            pending_separator = false;
        }

        if c.is_uppercase() {
            if !result.is_empty() {
                match prev_state {
                    CharState::Lower | CharState::Digit => {
                        if !result.ends_with('_') {
                            result.push('_');
                        }
                    }
                    CharState::Upper => {
                        if let Some(next) = chars.get(idx + 1) {
                            if next.is_lowercase() && !result.ends_with('_') {
                                result.push('_');
                            }
                        }
                    }
                    CharState::Other => {
                        if !result.ends_with('_') {
                            result.push('_');
                        }
                    }
                    CharState::Separator | CharState::Start => {}
                }
            }

            result.extend(c.to_lowercase());
            prev_state = CharState::Upper;
            continue;
        }

        if c.is_lowercase() {
            result.extend(c.to_lowercase());
            prev_state = CharState::Lower;
            continue;
        }

        if c.is_numeric() {
            if matches!(prev_state, CharState::Separator)
                && !result.is_empty()
                && !result.ends_with('_')
            {
                result.push('_');
            }
            result.push(c);
            prev_state = CharState::Digit;
            continue;
        }

        if matches!(prev_state, CharState::Separator)
            && !result.is_empty()
            && !result.ends_with('_')
        {
            result.push('_');
        }
        result.push(c);
        prev_state = CharState::Other;
    }

    result
}

/// Convert a snake_case (or underscored) string into camelCase.
///
/// Multiple sequential separators (underscores, hyphens, or spaces) are treated
/// as a single boundary. The first segment is emitted in lowercase, while
/// subsequent segments are capitalised.
///
/// # Examples
///
/// ```
/// use miyabi_core::string_utils::to_camel_case;
///
/// assert_eq!(to_camel_case("hello_world"), "helloWorld");
/// assert_eq!(to_camel_case("with-dashes_and spaces"), "withDashesAndSpaces");
/// ```
pub fn to_camel_case(s: &str) -> String {
    if s.is_empty() {
        return String::new();
    }

    if !s.chars().any(|c| c == '_' || c == '-' || c.is_whitespace()) {
        return s.to_string();
    }

    let mut result = String::with_capacity(s.len());

    for (index, part) in s
        .split(|c: char| c == '_' || c == '-' || c.is_whitespace())
        .filter(|segment| !segment.is_empty())
        .enumerate()
    {
        let mut chars = part.chars();
        if let Some(first) = chars.next() {
            if index == 0 {
                result.extend(first.to_lowercase());
            } else {
                result.extend(first.to_uppercase());
            }
        }

        for c in chars {
            result.extend(c.to_lowercase());
        }
    }

    result
}

/// Truncate a string to a maximum logical length, appending `"..."` when
/// truncation occurs.
///
/// Length is measured in Unicode scalar values (characters), ensuring multi-
/// byte graphemes remain intact. If `max_len` is zero, an empty string is
/// returned. When `max_len` is less than or equal to three, the result consists
/// solely of up to three dots.
///
/// # Examples
///
/// ```
/// use miyabi_core::string_utils::truncate;
///
/// assert_eq!(truncate("hello world", 8), "hello...");
/// assert_eq!(truncate("short", 10), "short");
/// ```
pub fn truncate(s: &str, max_len: usize) -> String {
    if max_len == 0 {
        return String::new();
    }

    let char_count = s.chars().count();
    if char_count <= max_len {
        return s.to_string();
    }

    if max_len <= 3 {
        return ".".repeat(max_len);
    }

    let visible_chars = max_len - 3;
    let mut truncated = String::with_capacity(max_len);

    for c in s.chars().take(visible_chars) {
        truncated.push(c);
    }

    truncated.push_str("...");
    truncated
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn to_snake_case_basic() {
        assert_eq!(to_snake_case("helloWorld"), "hello_world");
        assert_eq!(to_snake_case("PascalCase"), "pascal_case");
    }

    #[test]
    fn to_snake_case_handles_acronyms_and_digits() {
        assert_eq!(to_snake_case("HTTPRequest"), "http_request");
        assert_eq!(to_snake_case("parseHTTP2Request"), "parse_http2_request");
    }

    #[test]
    fn to_snake_case_respects_existing_underscores_and_separators() {
        assert_eq!(to_snake_case("already_snake_case"), "already_snake_case");
        assert_eq!(to_snake_case("hello-world Test"), "hello_world_test");
    }

    #[test]
    fn to_snake_case_with_unicode() {
        assert_eq!(to_snake_case("日本語Test"), "日本語_test");
        assert_eq!(to_snake_case("ßharp"), "ßharp");
    }

    #[test]
    fn to_camel_case_basic() {
        assert_eq!(to_camel_case("hello_world"), "helloWorld");
        assert_eq!(to_camel_case("multi_part_example"), "multiPartExample");
    }

    #[test]
    fn to_camel_case_handles_mixed_separators() {
        assert_eq!(
            to_camel_case("with-dashes_and spaces"),
            "withDashesAndSpaces"
        );
        assert_eq!(
            to_camel_case("__leading__underscores__"),
            "leadingUnderscores"
        );
    }

    #[test]
    fn to_camel_case_unicode() {
        assert_eq!(to_camel_case("Ünicode_test"), "ünicodeTest");
        assert_eq!(to_camel_case("もう_いい"), "もういい");
    }

    #[test]
    fn to_camel_case_without_separators() {
        assert_eq!(to_camel_case("alreadyCamel"), "alreadyCamel");
        assert_eq!(to_camel_case("SIMPLE"), "SIMPLE");
    }

    #[test]
    fn truncate_basic_usage() {
        assert_eq!(truncate("hello world", 8), "hello...");
        assert_eq!(truncate("short", 10), "short");
    }

    #[test]
    fn truncate_handles_edge_cases() {
        assert_eq!(truncate("emoji🙂sequence", 8), "emoji...");
        assert_eq!(truncate("data", 0), "");
        assert_eq!(truncate("data", 2), "..");
        assert_eq!(truncate("data", 3), "...");
        assert_eq!(truncate("longform", 4), "l...");
    }
}
