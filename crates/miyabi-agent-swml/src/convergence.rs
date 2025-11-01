//! Convergence Tracking for SWML
//!
//! Implements convergence analysis based on Theorem 7.2 from the paper:
//! - Geometric convergence with rate (1-α)^n
//! - Safety axiom: Q* ≥ 0.80
//! - Expected iterations: E[N_stop] = 4.14

use std::collections::VecDeque;

/// Convergence tracker for SWML execution
///
/// # Example
///
/// ```rust,no_run
/// use miyabi_agent_swml::ConvergenceTracker;
///
/// let mut tracker = ConvergenceTracker::new(0.80);
/// tracker.record_quality(0.75);
/// tracker.record_quality(0.82);
/// tracker.record_quality(0.84);
///
/// if tracker.has_converged() {
///     println!("Converged in {} iterations", tracker.iteration_count());
/// }
/// ```
#[derive(Debug, Clone)]
pub struct ConvergenceTracker {
    threshold: f64,
    history: VecDeque<f64>,
    max_iterations: usize,
    convergence_rate: f64, // α parameter
}

impl ConvergenceTracker {
    /// Create a new convergence tracker
    ///
    /// # Arguments
    ///
    /// * `threshold` - Quality threshold Q* (default: 0.80)
    pub fn new(threshold: f64) -> Self {
        Self {
            threshold,
            history: VecDeque::new(),
            max_iterations: 20,
            convergence_rate: 0.20, // α = 0.20 from paper
        }
    }

    /// Record a quality measurement
    pub fn record_quality(&mut self, quality: f64) {
        self.history.push_back(quality);

        // Keep only last 10 measurements
        if self.history.len() > 10 {
            self.history.pop_front();
        }
    }

    /// Check if convergence has been achieved
    ///
    /// Convergence is achieved when:
    /// 1. Quality ≥ threshold (Q* = 0.80)
    /// 2. Quality is stable (last 3 iterations within 5% variance)
    pub fn has_converged(&self) -> bool {
        if self.history.is_empty() {
            return false;
        }

        // Check if latest quality meets threshold
        let latest = self.history.back().unwrap();
        if *latest < self.threshold {
            return false;
        }

        // Check stability (last 3 iterations)
        if self.history.len() >= 3 {
            let last_three: Vec<f64> = self.history.iter().rev().take(3).copied().collect();
            let mean = last_three.iter().sum::<f64>() / 3.0;
            let variance = last_three
                .iter()
                .map(|q| (q - mean).powi(2))
                .sum::<f64>()
                / 3.0;
            let std_dev = variance.sqrt();

            // Stable if std dev < 5% of mean
            std_dev < 0.05 * mean
        } else {
            false
        }
    }

    /// Calculate current convergence rate
    ///
    /// Based on geometric convergence formula: (1-α)^n
    pub fn calculate_rate(&self) -> f64 {
        if self.history.len() < 2 {
            return self.convergence_rate;
        }

        // Estimate α from quality improvements
        let improvements: Vec<f64> = self
            .history
            .iter()
            .zip(self.history.iter().skip(1))
            .map(|(prev, curr)| (curr - prev).abs())
            .collect();

        if improvements.is_empty() {
            return self.convergence_rate;
        }

        let avg_improvement = improvements.iter().sum::<f64>() / improvements.len() as f64;

        // Estimate α (convergence rate parameter)
        // α = 1 - exp(ln(improvement) / n)
        if avg_improvement > 0.0 {
            1.0 - (1.0 - avg_improvement).powf(1.0 / self.history.len() as f64)
        } else {
            self.convergence_rate
        }
    }

    /// Predict number of iterations until convergence
    ///
    /// Based on expected value formula: E[N_stop] ≈ 4.14 iterations
    /// (from paper Theorem 7.3)
    pub fn predict_iterations(&self) -> usize {
        if self.has_converged() {
            return 0;
        }

        let current_quality = self.history.back().copied().unwrap_or(0.0);
        let gap = self.threshold - current_quality;

        if gap <= 0.0 {
            return 0;
        }

        // Geometric convergence: gap_n = gap_0 * (1-α)^n
        // Solve for n: n = ln(gap_n / gap_0) / ln(1-α)
        let alpha = self.calculate_rate();
        if alpha <= 0.0 || alpha >= 1.0 {
            return self.max_iterations;
        }

        let n = (gap / (self.threshold * 0.1)).ln() / (1.0 - alpha).ln();
        n.ceil() as usize
    }

    /// Get current iteration count
    pub fn iteration_count(&self) -> usize {
        self.history.len()
    }

    /// Get quality history
    pub fn history(&self) -> &VecDeque<f64> {
        &self.history
    }

    /// Get latest quality score
    pub fn latest_quality(&self) -> Option<f64> {
        self.history.back().copied()
    }

    /// Check if max iterations reached
    pub fn is_exhausted(&self) -> bool {
        self.history.len() >= self.max_iterations
    }
}

impl Default for ConvergenceTracker {
    fn default() -> Self {
        Self::new(0.80)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convergence_tracker_creation() {
        let tracker = ConvergenceTracker::new(0.80);
        assert_eq!(tracker.threshold, 0.80);
        assert_eq!(tracker.iteration_count(), 0);
    }

    #[test]
    fn test_record_quality() {
        let mut tracker = ConvergenceTracker::new(0.80);
        tracker.record_quality(0.75);
        tracker.record_quality(0.82);

        assert_eq!(tracker.iteration_count(), 2);
        assert_eq!(tracker.latest_quality(), Some(0.82));
    }

    #[test]
    fn test_has_converged() {
        let mut tracker = ConvergenceTracker::new(0.80);

        // Not converged yet
        tracker.record_quality(0.75);
        assert!(!tracker.has_converged());

        // Above threshold but not stable
        tracker.record_quality(0.82);
        assert!(!tracker.has_converged());

        // Stable convergence
        tracker.record_quality(0.83);
        tracker.record_quality(0.83);
        assert!(tracker.has_converged());
    }

    #[test]
    fn test_predict_iterations() {
        let mut tracker = ConvergenceTracker::new(0.80);
        tracker.record_quality(0.60);

        let predicted = tracker.predict_iterations();
        assert!(predicted > 0 && predicted <= 20);
    }
}
