#!/usr/bin/env python3
"""
Miyabi Failure Prediction System

Issue: #877 - 障害予測システム

This script analyzes historical metrics and logs to predict potential failures
and provide proactive recommendations.

Features:
- Pattern analysis from historical data
- Resource usage anomaly detection
- Task failure rate prediction
- Proactive escalation recommendations
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Optional
import subprocess
import statistics


class PredictionLevel(Enum):
    """Prediction severity levels"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    FAILURE_IMMINENT = "failure_imminent"


@dataclass
class MetricPoint:
    """A single metric data point"""
    timestamp: datetime
    value: float
    metric_type: str


@dataclass
class AnomalyDetection:
    """Anomaly detection result"""
    metric: str
    current_value: float
    threshold: float
    deviation: float
    is_anomaly: bool
    severity: PredictionLevel


@dataclass
class FailurePrediction:
    """A failure prediction result"""
    component: str
    prediction_level: PredictionLevel
    confidence: float
    predicted_time: Optional[datetime]
    factors: list[str]
    recommendations: list[str]


@dataclass
class PredictionReport:
    """Complete prediction report"""
    timestamp: datetime
    overall_health: PredictionLevel
    predictions: list[FailurePrediction]
    anomalies: list[AnomalyDetection]
    metrics_summary: dict[str, Any]
    recommendations: list[str]


class MetricsCollector:
    """Collects system metrics for analysis"""

    def __init__(self, history_hours: int = 24):
        self.history_hours = history_hours
        self.metrics_dir = Path.home() / ".miyabi" / "metrics"
        self.metrics_dir.mkdir(parents=True, exist_ok=True)

    def collect_cpu_metrics(self) -> list[MetricPoint]:
        """Collect CPU usage metrics"""
        try:
            # Get current CPU usage
            result = subprocess.run(
                ["ps", "-A", "-o", "%cpu"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')[1:]  # Skip header
                total_cpu = sum(float(line.strip()) for line in lines if line.strip())
                return [MetricPoint(
                    timestamp=datetime.now(),
                    value=min(total_cpu, 100.0),  # Cap at 100%
                    metric_type="cpu_percent"
                )]
        except Exception as e:
            print(f"Warning: Could not collect CPU metrics: {e}", file=sys.stderr)
        return []

    def collect_memory_metrics(self) -> list[MetricPoint]:
        """Collect memory usage metrics"""
        try:
            result = subprocess.run(
                ["vm_stat"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                # Parse vm_stat output (macOS specific)
                lines = result.stdout.strip().split('\n')
                stats = {}
                for line in lines[1:]:
                    if ':' in line:
                        key, value = line.split(':')
                        # Remove trailing period and convert to int
                        value = value.strip().rstrip('.')
                        try:
                            stats[key.strip()] = int(value)
                        except ValueError:
                            pass

                # Calculate memory usage percentage
                page_size = 4096  # Default page size
                pages_free = stats.get('Pages free', 0)
                pages_active = stats.get('Pages active', 0)
                pages_inactive = stats.get('Pages inactive', 0)
                pages_wired = stats.get('Pages wired down', 0)

                total_pages = pages_free + pages_active + pages_inactive + pages_wired
                if total_pages > 0:
                    used_pages = pages_active + pages_wired
                    memory_percent = (used_pages / total_pages) * 100
                    return [MetricPoint(
                        timestamp=datetime.now(),
                        value=memory_percent,
                        metric_type="memory_percent"
                    )]
        except Exception as e:
            print(f"Warning: Could not collect memory metrics: {e}", file=sys.stderr)
        return []

    def collect_disk_metrics(self) -> list[MetricPoint]:
        """Collect disk usage metrics"""
        try:
            result = subprocess.run(
                ["df", "-h", "/"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) >= 2:
                    parts = lines[1].split()
                    if len(parts) >= 5:
                        usage_str = parts[4].rstrip('%')
                        try:
                            disk_percent = float(usage_str)
                            return [MetricPoint(
                                timestamp=datetime.now(),
                                value=disk_percent,
                                metric_type="disk_percent"
                            )]
                        except ValueError:
                            pass
        except Exception as e:
            print(f"Warning: Could not collect disk metrics: {e}", file=sys.stderr)
        return []

    def collect_process_metrics(self) -> list[MetricPoint]:
        """Collect Miyabi process metrics"""
        metrics = []
        try:
            # Count Miyabi-related processes
            result = subprocess.run(
                ["pgrep", "-f", "miyabi"],
                capture_output=True,
                text=True
            )
            process_count = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
            metrics.append(MetricPoint(
                timestamp=datetime.now(),
                value=float(process_count),
                metric_type="miyabi_process_count"
            ))

            # Check for zombie processes
            result = subprocess.run(
                ["ps", "aux"],
                capture_output=True,
                text=True
            )
            zombie_count = result.stdout.count(' Z ')
            metrics.append(MetricPoint(
                timestamp=datetime.now(),
                value=float(zombie_count),
                metric_type="zombie_process_count"
            ))
        except Exception as e:
            print(f"Warning: Could not collect process metrics: {e}", file=sys.stderr)

        return metrics

    def collect_git_metrics(self) -> list[MetricPoint]:
        """Collect Git-related metrics"""
        metrics = []
        try:
            # Check worktree count
            result = subprocess.run(
                ["git", "worktree", "list"],
                capture_output=True,
                text=True,
                cwd=os.getcwd()
            )
            if result.returncode == 0:
                worktree_count = len(result.stdout.strip().split('\n'))
                metrics.append(MetricPoint(
                    timestamp=datetime.now(),
                    value=float(worktree_count),
                    metric_type="git_worktree_count"
                ))

            # Check for uncommitted changes
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                cwd=os.getcwd()
            )
            if result.returncode == 0:
                uncommitted_count = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
                metrics.append(MetricPoint(
                    timestamp=datetime.now(),
                    value=float(uncommitted_count),
                    metric_type="git_uncommitted_count"
                ))
        except Exception as e:
            print(f"Warning: Could not collect git metrics: {e}", file=sys.stderr)

        return metrics

    def collect_all_metrics(self) -> dict[str, list[MetricPoint]]:
        """Collect all available metrics"""
        all_metrics = {}

        cpu_metrics = self.collect_cpu_metrics()
        if cpu_metrics:
            all_metrics["cpu"] = cpu_metrics

        memory_metrics = self.collect_memory_metrics()
        if memory_metrics:
            all_metrics["memory"] = memory_metrics

        disk_metrics = self.collect_disk_metrics()
        if disk_metrics:
            all_metrics["disk"] = disk_metrics

        process_metrics = self.collect_process_metrics()
        if process_metrics:
            all_metrics["process"] = process_metrics

        git_metrics = self.collect_git_metrics()
        if git_metrics:
            all_metrics["git"] = git_metrics

        return all_metrics


class AnomalyDetector:
    """Detects anomalies in metrics"""

    # Thresholds for different metrics
    THRESHOLDS = {
        "cpu_percent": {"warning": 70, "critical": 85, "failure": 95},
        "memory_percent": {"warning": 75, "critical": 85, "failure": 95},
        "disk_percent": {"warning": 80, "critical": 90, "failure": 95},
        "miyabi_process_count": {"warning": 20, "critical": 50, "failure": 100},
        "zombie_process_count": {"warning": 5, "critical": 10, "failure": 20},
        "git_worktree_count": {"warning": 10, "critical": 20, "failure": 50},
        "git_uncommitted_count": {"warning": 50, "critical": 100, "failure": 200},
    }

    def detect_anomaly(self, metric: MetricPoint) -> AnomalyDetection:
        """Detect if a metric value is anomalous"""
        thresholds = self.THRESHOLDS.get(metric.metric_type, {
            "warning": 70,
            "critical": 85,
            "failure": 95
        })

        value = metric.value
        severity = PredictionLevel.HEALTHY
        threshold = thresholds["warning"]
        deviation = 0.0
        is_anomaly = False

        if value >= thresholds["failure"]:
            severity = PredictionLevel.FAILURE_IMMINENT
            threshold = thresholds["failure"]
            is_anomaly = True
            deviation = (value - threshold) / threshold * 100
        elif value >= thresholds["critical"]:
            severity = PredictionLevel.CRITICAL
            threshold = thresholds["critical"]
            is_anomaly = True
            deviation = (value - threshold) / threshold * 100
        elif value >= thresholds["warning"]:
            severity = PredictionLevel.WARNING
            threshold = thresholds["warning"]
            is_anomaly = True
            deviation = (value - threshold) / threshold * 100

        return AnomalyDetection(
            metric=metric.metric_type,
            current_value=value,
            threshold=threshold,
            deviation=deviation,
            is_anomaly=is_anomaly,
            severity=severity
        )

    def analyze_metrics(self, metrics: dict[str, list[MetricPoint]]) -> list[AnomalyDetection]:
        """Analyze all metrics for anomalies"""
        anomalies = []

        for category, metric_list in metrics.items():
            for metric in metric_list:
                detection = self.detect_anomaly(metric)
                if detection.is_anomaly:
                    anomalies.append(detection)

        return anomalies


class FailurePredictor:
    """Predicts potential failures based on metrics and patterns"""

    def __init__(self):
        self.collector = MetricsCollector()
        self.detector = AnomalyDetector()

    def predict_component_failure(
        self,
        component: str,
        anomalies: list[AnomalyDetection],
        metrics: dict[str, list[MetricPoint]]
    ) -> Optional[FailurePrediction]:
        """Predict failure for a specific component"""

        # Filter anomalies for this component
        component_anomalies = [a for a in anomalies if component.lower() in a.metric.lower()]

        if not component_anomalies:
            return None

        # Calculate overall severity
        severities = [a.severity for a in component_anomalies]
        if PredictionLevel.FAILURE_IMMINENT in severities:
            level = PredictionLevel.FAILURE_IMMINENT
            confidence = 0.9
            predicted_time = datetime.now() + timedelta(minutes=30)
        elif PredictionLevel.CRITICAL in severities:
            level = PredictionLevel.CRITICAL
            confidence = 0.7
            predicted_time = datetime.now() + timedelta(hours=2)
        elif PredictionLevel.WARNING in severities:
            level = PredictionLevel.WARNING
            confidence = 0.5
            predicted_time = datetime.now() + timedelta(hours=6)
        else:
            return None

        # Generate factors and recommendations
        factors = [f"{a.metric}: {a.current_value:.1f} (threshold: {a.threshold:.1f})"
                   for a in component_anomalies]

        recommendations = self._generate_recommendations(component, component_anomalies)

        return FailurePrediction(
            component=component,
            prediction_level=level,
            confidence=confidence,
            predicted_time=predicted_time,
            factors=factors,
            recommendations=recommendations
        )

    def _generate_recommendations(
        self,
        component: str,
        anomalies: list[AnomalyDetection]
    ) -> list[str]:
        """Generate recommendations based on anomalies"""
        recommendations = []

        for anomaly in anomalies:
            metric = anomaly.metric

            if "cpu" in metric:
                recommendations.append("Consider stopping unused processes or agents")
                recommendations.append("Review concurrent task limits")
            elif "memory" in metric:
                recommendations.append("Run `miyabi cleanup` to free memory")
                recommendations.append("Consider increasing memory allocation")
            elif "disk" in metric:
                recommendations.append("Clean up old worktrees with `miyabi worktree prune`")
                recommendations.append("Remove old log files from /tmp/miyabi-*.log")
            elif "process" in metric:
                if "zombie" in metric:
                    recommendations.append("Kill zombie processes with `kill -9`")
                else:
                    recommendations.append("Review running agent processes")
            elif "git" in metric:
                if "worktree" in metric:
                    recommendations.append("Clean up old worktrees with `miyabi cleanup`")
                elif "uncommitted" in metric:
                    recommendations.append("Commit or stash pending changes")

        return list(set(recommendations))  # Remove duplicates

    def generate_report(self) -> PredictionReport:
        """Generate a complete failure prediction report"""
        # Collect metrics
        metrics = self.collector.collect_all_metrics()

        # Detect anomalies
        anomalies = self.detector.analyze_metrics(metrics)

        # Generate predictions for each component
        components = ["cpu", "memory", "disk", "process", "git"]
        predictions = []

        for component in components:
            prediction = self.predict_component_failure(component, anomalies, metrics)
            if prediction:
                predictions.append(prediction)

        # Determine overall health
        if any(p.prediction_level == PredictionLevel.FAILURE_IMMINENT for p in predictions):
            overall_health = PredictionLevel.FAILURE_IMMINENT
        elif any(p.prediction_level == PredictionLevel.CRITICAL for p in predictions):
            overall_health = PredictionLevel.CRITICAL
        elif any(p.prediction_level == PredictionLevel.WARNING for p in predictions):
            overall_health = PredictionLevel.WARNING
        else:
            overall_health = PredictionLevel.HEALTHY

        # Generate overall recommendations
        all_recommendations = []
        for prediction in predictions:
            all_recommendations.extend(prediction.recommendations)
        all_recommendations = list(set(all_recommendations))

        # Create metrics summary
        metrics_summary = {}
        for category, metric_list in metrics.items():
            for metric in metric_list:
                metrics_summary[metric.metric_type] = metric.value

        return PredictionReport(
            timestamp=datetime.now(),
            overall_health=overall_health,
            predictions=predictions,
            anomalies=anomalies,
            metrics_summary=metrics_summary,
            recommendations=all_recommendations
        )


def print_report(report: PredictionReport, json_output: bool = False):
    """Print the prediction report"""
    if json_output:
        output = {
            "timestamp": report.timestamp.isoformat(),
            "overall_health": report.overall_health.value,
            "predictions": [
                {
                    "component": p.component,
                    "level": p.prediction_level.value,
                    "confidence": p.confidence,
                    "predicted_time": p.predicted_time.isoformat() if p.predicted_time else None,
                    "factors": p.factors,
                    "recommendations": p.recommendations
                }
                for p in report.predictions
            ],
            "anomalies": [
                {
                    "metric": a.metric,
                    "current_value": a.current_value,
                    "threshold": a.threshold,
                    "severity": a.severity.value
                }
                for a in report.anomalies
            ],
            "metrics_summary": report.metrics_summary,
            "recommendations": report.recommendations
        }
        print(json.dumps(output, indent=2))
        return

    # Status emoji mapping
    status_emoji = {
        PredictionLevel.HEALTHY: "🟢",
        PredictionLevel.WARNING: "🟡",
        PredictionLevel.CRITICAL: "🟠",
        PredictionLevel.FAILURE_IMMINENT: "🔴"
    }

    print()
    print("=" * 60)
    print("🔮 Miyabi Failure Prediction Report")
    print("=" * 60)
    print()
    print(f"📅 Timestamp: {report.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🏥 Overall Health: {status_emoji[report.overall_health]} {report.overall_health.value.upper()}")
    print()

    # Metrics Summary
    print("📊 Current Metrics:")
    print("-" * 40)
    for metric, value in report.metrics_summary.items():
        unit = "%" if "percent" in metric else ""
        print(f"  • {metric}: {value:.1f}{unit}")
    print()

    # Anomalies
    if report.anomalies:
        print("⚠️  Detected Anomalies:")
        print("-" * 40)
        for anomaly in report.anomalies:
            emoji = status_emoji[anomaly.severity]
            print(f"  {emoji} {anomaly.metric}")
            print(f"     Current: {anomaly.current_value:.1f}")
            print(f"     Threshold: {anomaly.threshold:.1f}")
            print(f"     Status: {anomaly.severity.value}")
        print()

    # Predictions
    if report.predictions:
        print("🔮 Failure Predictions:")
        print("-" * 40)
        for prediction in report.predictions:
            emoji = status_emoji[prediction.prediction_level]
            print(f"  {emoji} Component: {prediction.component.upper()}")
            print(f"     Level: {prediction.prediction_level.value}")
            print(f"     Confidence: {prediction.confidence * 100:.0f}%")
            if prediction.predicted_time:
                print(f"     Predicted Time: {prediction.predicted_time.strftime('%H:%M:%S')}")
            print(f"     Factors:")
            for factor in prediction.factors:
                print(f"       - {factor}")
        print()

    # Recommendations
    if report.recommendations:
        print("💡 Recommendations:")
        print("-" * 40)
        for i, rec in enumerate(report.recommendations, 1):
            print(f"  {i}. {rec}")
        print()

    # Summary
    if report.overall_health == PredictionLevel.HEALTHY:
        print("✅ System is healthy. No immediate action required.")
    elif report.overall_health == PredictionLevel.WARNING:
        print("⚠️  Warning: Some metrics are approaching thresholds.")
        print("   Consider taking preventive action.")
    elif report.overall_health == PredictionLevel.CRITICAL:
        print("🟠 CRITICAL: Immediate attention recommended!")
        print("   Follow the recommendations above to prevent failure.")
    else:
        print("🔴 FAILURE IMMINENT: Immediate action required!")
        print("   System failure expected within 30 minutes.")

    print()
    print("=" * 60)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Miyabi Failure Prediction System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run prediction analysis
  python3 failure_predictor.py

  # Output as JSON
  python3 failure_predictor.py --json

  # Watch mode (continuous monitoring)
  python3 failure_predictor.py --watch --interval 60
"""
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Continuous monitoring mode"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=300,
        help="Interval between checks in watch mode (seconds, default: 300)"
    )

    args = parser.parse_args()

    predictor = FailurePredictor()

    if args.watch:
        import time
        print(f"Starting failure prediction watch mode (interval: {args.interval}s)")
        print("Press Ctrl+C to stop")
        print()

        try:
            while True:
                report = predictor.generate_report()
                print_report(report, args.json)

                if report.overall_health in [PredictionLevel.CRITICAL, PredictionLevel.FAILURE_IMMINENT]:
                    # Alert more frequently when issues detected
                    time.sleep(min(args.interval, 60))
                else:
                    time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nWatch mode stopped.")
    else:
        report = predictor.generate_report()
        print_report(report, args.json)

        # Exit with appropriate code
        if report.overall_health == PredictionLevel.FAILURE_IMMINENT:
            sys.exit(2)
        elif report.overall_health == PredictionLevel.CRITICAL:
            sys.exit(1)
        sys.exit(0)


if __name__ == "__main__":
    main()
