#!/bin/bash
# Connect to Pixel via Wireless ADB
# Usage: ./scripts/connect-pixel-adb.sh [pairing-code]

set -e

PIXEL_IP="${PIXEL_IP:-192.168.3.9}"
PIXEL_PORT="${PIXEL_PORT:-43215}"
PAIRING_PORT="${PAIRING_PORT:-45678}"

echo "🔌 Connecting to Pixel via Wireless ADB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if pairing is needed (first time)
if [ $# -eq 1 ]; then
    PAIRING_CODE=$1
    echo "📱 Pairing with code: $PAIRING_CODE"
    adb pair ${PIXEL_IP}:${PAIRING_PORT} $PAIRING_CODE
    echo "✅ Pairing successful"
fi

# Connect to device
echo "🔗 Connecting to ${PIXEL_IP}:${PIXEL_PORT}..."
adb connect ${PIXEL_IP}:${PIXEL_PORT}

# Verify connection
if adb devices | grep -q "${PIXEL_IP}:${PIXEL_PORT}"; then
    echo "✅ Connected to Pixel successfully"

    # Display device info
    echo ""
    echo "📊 Device Information:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Model: $(adb shell getprop ro.product.model)"
    echo "Android: $(adb shell getprop ro.build.version.release)"
    echo "Battery: $(adb shell dumpsys battery | grep level | awk '{print $2}')%"
    echo "IP: $PIXEL_IP"
    echo ""

    # Check if Termux is installed
    if adb shell pm list packages | grep -q "com.termux"; then
        echo "✅ Termux installed"
    else
        echo "⚠️  Termux not found"
    fi

    # Check if Lark is installed
    if adb shell pm list packages | grep -q "com.ss.android.lark"; then
        echo "✅ Lark installed"
    else
        echo "⚠️  Lark not found"
    fi

else
    echo "❌ Failed to connect to Pixel"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check Pixel is on same network"
    echo "2. Verify IP address: $PIXEL_IP"
    echo "3. Enable 'Wireless Debugging' on Pixel"
    echo "4. Run with pairing code if first time:"
    echo "   ./scripts/connect-pixel-adb.sh 123456"
    exit 1
fi
