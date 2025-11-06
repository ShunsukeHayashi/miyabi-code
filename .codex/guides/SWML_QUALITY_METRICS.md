# SWML Quality Metrics Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-01
**Purpose**: Implementation guide for SWML quality metrics

---

## Quality Formula

From SWML paper (Section 6.2):

```
Q(R) = 0.40 × TestPassRate +
       0.30 × CodeQuality +
       0.20 × Correctness +
       0.10 × StyleCompliance
```

**Target**: Q* = 0.80 (Safety Axiom threshold)

---

## Implementation

### Location
`/implementation/quality/miyabi-metrics/` (NEW - planned)

### API

```rust
use miyabi_metrics::QualityMetrics;

// Calculate quality
let metrics = QualityMetrics {
    test_pass_rate: 0.95,      // 95% of tests pass
    code_quality: 0.82,         // Clippy score
    correctness: 0.88,          // Spec adherence
    style_compliance: 0.90,     // Rustfmt compliance
};

let quality = metrics.compute_quality();
println!("Q = {:.4}", quality); // Should output: Q = 0.8880

// Check safety axiom
assert!(quality >= 0.80, "Quality below threshold!");
```

---

## Component Metrics

### 1. Test Pass Rate (40% weight)

```rust
pub fn test_pass_rate(test_results: &TestResults) -> f64 {
    let total = test_results.total_tests();
    let passed = test_results.passed_tests();

    if total == 0 {
        return 0.0;
    }

    passed as f64 / total as f64
}
```

**Example**:
- 95 tests pass, 5 fail → 95/100 = 0.95

### 2. Code Quality (30% weight)

```rust
pub fn code_quality(clippy_warnings: &[Warning]) -> f64 {
    let total_lines = count_code_lines();
    let warning_count = clippy_warnings.len();

    // Perfect score = no warnings
    // 10 warnings per 1000 lines = 0.50
    let warnings_per_kloc = (warning_count as f64 / total_lines as f64) * 1000.0;

    (1.0 - (warnings_per_kloc / 20.0)).max(0.0)
}
```

**Scale**:
- 0 warnings → 1.00
- 10 warnings/1000 lines → 0.50
- 20+ warnings/1000 lines → 0.00

### 3. Correctness (20% weight)

```rust
pub fn correctness(spec: &Specification, implementation: &Code) -> f64 {
    let requirements = spec.requirements();
    let met_requirements = implementation.verify_requirements(&requirements);

    met_requirements.len() as f64 / requirements.len() as f64
}
```

**Example**:
- 9/10 requirements met → 0.90

### 4. Style Compliance (10% weight)

```rust
pub fn style_compliance(code: &Code) -> f64 {
    let rustfmt_check = run_rustfmt_check(code);

    if rustfmt_check.is_ok() {
        1.0
    } else {
        let violations = rustfmt_check.unwrap_err().violations();
        (1.0 - (violations.len() as f64 / 100.0)).max(0.0)
    }
}
```

**Scale**:
- Rustfmt passes → 1.00
- N violations → 1.0 - (N/100)

---

## Usage Examples

### Example 1: Perfect Quality

```rust
let metrics = QualityMetrics {
    test_pass_rate: 1.0,
    code_quality: 1.0,
    correctness: 1.0,
    style_compliance: 1.0,
};

let quality = metrics.compute_quality();
assert_eq!(quality, 1.0); // Perfect score
```

### Example 2: Minimum Passing

```rust
let metrics = QualityMetrics {
    test_pass_rate: 0.80,     // 40% * 0.80 = 0.32
    code_quality: 0.80,       // 30% * 0.80 = 0.24
    correctness: 0.80,        // 20% * 0.80 = 0.16
    style_compliance: 0.80,   // 10% * 0.80 = 0.08
};

let quality = metrics.compute_quality();
assert_eq!(quality, 0.80); // Exactly at threshold
```

### Example 3: Typical Production

```rust
let metrics = QualityMetrics {
    test_pass_rate: 0.95,     // 40% * 0.95 = 0.38
    code_quality: 0.85,       // 30% * 0.85 = 0.255
    correctness: 0.90,        // 20% * 0.90 = 0.18
    style_compliance: 0.95,   // 10% * 0.95 = 0.095
};

let quality = metrics.compute_quality();
// 0.38 + 0.255 + 0.18 + 0.095 = 0.91
assert!(quality >= 0.80); // Well above threshold
```

---

## Integration with Ω Function

### Automatic Quality Calculation

```rust
use miyabi_agent_swml::OmegaFunction;

let omega = OmegaFunction::new().await?;
let result = omega.execute(intent, world).await?;

// Quality automatically calculated in θ₆ phase
println!("Q = {:.4}", result.quality());
println!("Components:");
println!("  Test pass rate: {:.2}", result.metrics.test_pass_rate);
println!("  Code quality: {:.2}", result.metrics.code_quality);
println!("  Correctness: {:.2}", result.metrics.correctness);
println!("  Style: {:.2}", result.metrics.style_compliance);
```

---

## Quality Thresholds

| Quality Range | Interpretation | Action |
|---------------|----------------|--------|
| Q ≥ 0.90 | Excellent | Accept immediately |
| 0.85 ≤ Q < 0.90 | Good | Accept, minor improvements welcome |
| 0.80 ≤ Q < 0.85 | Acceptable | Accept, suggest improvements |
| Q < 0.80 | Below threshold | Reject, iterate |

---

## Further Reading

- [SWML_CONVERGENCE.md](SWML_CONVERGENCE.md) - Convergence tracking
- [../context/omega-phases.md](../context/omega-phases.md) - θ₆ implementation
- [/miyabi_def/SWML_PAPER.pdf](/miyabi_def/SWML_PAPER.pdf) - Section 6 (Quality Metrics)

---

**Last Updated**: 2025-11-01
**Maintained by**: Miyabi Team
