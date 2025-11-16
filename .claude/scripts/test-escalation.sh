#!/usr/bin/env bash
set -euo pipefail

echo "🚨 Testing escalation notification..."

LEVEL="${1:-P1}"
MESSAGE="${2:-Test escalation from script}"

echo "Level: ${LEVEL}"
echo "Message: ${MESSAGE}"

# Simulate escalation notification
echo ""
echo "📧 Sending to: ${LARK_ESCALATION_EMAIL:-NOT_SET}"
echo "🔔 Notification sent (simulated)"
echo ""
echo "✅ Escalation test complete!"
echo ""
echo "In production, this would:"
echo "  1. Send Lark message to escalation email"
echo "  2. Create GitHub issue with 'escalation' label"
echo "  3. Trigger Maestro alert"
