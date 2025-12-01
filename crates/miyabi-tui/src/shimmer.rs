//! Shimmer animation effect for loading indicators
//!
//! Creates a sweeping highlight band that travels across text,
//! similar to the OpenAI Codex TUI loading animation.

use ratatui::style::{Color, Modifier, Style};
use std::f64::consts::PI;
use std::sync::OnceLock;
use std::time::Instant;

/// Start time for shimmer calculations
static START_TIME: OnceLock<Instant> = OnceLock::new();

/// Get elapsed time since first call
fn elapsed_seconds() -> f64 {
    let start = START_TIME.get_or_init(Instant::now);
    start.elapsed().as_secs_f64()
}

/// Shimmer configuration
pub struct ShimmerConfig {
    /// Duration of one complete sweep in seconds
    pub sweep_seconds: f64,
    /// Half-width of the highlight band
    pub band_half_width: f64,
    /// Base color of the text
    pub base_color: Color,
    /// Highlight color for the shimmer
    pub highlight_color: Color,
}

impl Default for ShimmerConfig {
    fn default() -> Self {
        Self {
            sweep_seconds: 2.0,
            band_half_width: 5.0,
            base_color: Color::Rgb(86, 95, 137),        // MIYABI_DIM
            highlight_color: Color::Rgb(187, 154, 247), // MIYABI_PURPLE
        }
    }
}

/// Calculate shimmer intensity at a given position
///
/// Returns a value between 0.0 and 1.0 indicating how much
/// the shimmer highlight should be applied at this position.
pub fn shimmer_intensity(position: usize, text_len: usize, config: &ShimmerConfig) -> f64 {
    if text_len == 0 {
        return 0.0;
    }

    let elapsed = elapsed_seconds();

    // Sweep position (0.0 to 1.0) across the text
    let sweep_progress = (elapsed % config.sweep_seconds) / config.sweep_seconds;

    // Extend the sweep range to include padding on both sides
    let total_width = text_len as f64 + 2.0 * config.band_half_width;
    let sweep_position = sweep_progress * total_width - config.band_half_width;

    // Distance from this character to the sweep center
    let distance = (position as f64 - sweep_position).abs();

    // Calculate intensity using cosine falloff
    if distance < config.band_half_width {
        0.5 * (1.0 + (PI * distance / config.band_half_width).cos())
    } else {
        0.0
    }
}

/// Apply shimmer effect to text, returning styled spans
///
/// For terminals with true color support, blends colors.
/// For limited terminals, uses modifiers (DIM, BOLD).
pub fn shimmer_style(position: usize, text_len: usize, config: &ShimmerConfig) -> Style {
    let intensity = shimmer_intensity(position, text_len, config);

    if intensity < 0.01 {
        // No shimmer effect
        Style::default().fg(config.base_color)
    } else {
        // Blend colors based on intensity
        let blended = blend_colors(config.base_color, config.highlight_color, intensity);

        let mut style = Style::default().fg(blended);

        // Add modifiers for extra emphasis
        if intensity >= 0.6 {
            style = style.add_modifier(Modifier::BOLD);
        }

        style
    }
}

/// Simple shimmer style using only modifiers (for 256-color terminals)
pub fn shimmer_style_simple(position: usize, text_len: usize) -> Style {
    let intensity = shimmer_intensity(position, text_len, &ShimmerConfig::default());

    if intensity < 0.2 {
        Style::default().add_modifier(Modifier::DIM)
    } else if intensity < 0.6 {
        Style::default()
    } else {
        Style::default().add_modifier(Modifier::BOLD)
    }
}

/// Blend two colors based on intensity (0.0 = color1, 1.0 = color2)
fn blend_colors(color1: Color, color2: Color, intensity: f64) -> Color {
    match (color1, color2) {
        (Color::Rgb(r1, g1, b1), Color::Rgb(r2, g2, b2)) => {
            let r = lerp(r1, r2, intensity);
            let g = lerp(g1, g2, intensity);
            let b = lerp(b1, b2, intensity);
            Color::Rgb(r, g, b)
        }
        _ => {
            // Fallback for non-RGB colors
            if intensity > 0.5 {
                color2
            } else {
                color1
            }
        }
    }
}

/// Linear interpolation
fn lerp(a: u8, b: u8, t: f64) -> u8 {
    let result = a as f64 * (1.0 - t) + b as f64 * t;
    result.round() as u8
}

/// Create a shimmer loading text
///
/// Returns a vector of (char, Style) tuples for rendering.
pub fn shimmer_text(text: &str, config: &ShimmerConfig) -> Vec<(char, Style)> {
    let text_len = text.chars().count();
    text.chars()
        .enumerate()
        .map(|(i, c)| (c, shimmer_style(i, text_len, config)))
        .collect()
}

/// Spinner animation frames
pub const SPINNER_FRAMES: &[&str] = &["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/// Get current spinner frame based on time
pub fn spinner_frame() -> &'static str {
    let elapsed = elapsed_seconds();
    let frame_index = ((elapsed * 10.0) as usize) % SPINNER_FRAMES.len();
    SPINNER_FRAMES[frame_index]
}

/// Bouncing dots animation
pub const DOTS_FRAMES: &[&str] = &["   ", ".  ", ".. ", "...", " ..", "  .", "   "];

/// Get current dots frame
pub fn dots_frame() -> &'static str {
    let elapsed = elapsed_seconds();
    let frame_index = ((elapsed * 3.0) as usize) % DOTS_FRAMES.len();
    DOTS_FRAMES[frame_index]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shimmer_intensity() {
        let config = ShimmerConfig::default();
        let intensity = shimmer_intensity(0, 10, &config);
        assert!((0.0..=1.0).contains(&intensity));
    }

    #[test]
    fn test_blend_colors() {
        let white = Color::Rgb(255, 255, 255);
        let black = Color::Rgb(0, 0, 0);

        let mid = blend_colors(black, white, 0.5);
        if let Color::Rgb(r, g, b) = mid {
            assert!((r as i16 - 128).abs() <= 1);
            assert!((g as i16 - 128).abs() <= 1);
            assert!((b as i16 - 128).abs() <= 1);
        }
    }

    #[test]
    fn test_spinner_frame() {
        let frame = spinner_frame();
        assert!(SPINNER_FRAMES.contains(&frame));
    }
}
