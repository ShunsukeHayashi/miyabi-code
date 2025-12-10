/// Greet a person by name.
///
/// # Arguments
/// * `name` - The name of the person to greet
///
/// # Returns
/// A greeting message in the format "Hello, {name}!"
///
/// # Examples
/// ```
/// use miyabi_agent_core::greet;
///
/// let message = greet("World");
/// assert_eq!(message, "Hello, World!");
/// ```
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet_basic() {
        let result = greet("World");
        assert_eq!(result, "Hello, World!");
    }

    #[test]
    fn test_greet_custom_name() {
        let result = greet("Miyabi");
        assert_eq!(result, "Hello, Miyabi!");
    }

    #[test]
    fn test_greet_empty_string() {
        let result = greet("");
        assert_eq!(result, "Hello, !");
    }

    #[test]
    fn test_greet_japanese() {
        let result = greet("世界");
        assert_eq!(result, "Hello, 世界!");
    }
}
