#!/data/data/com.termux/files/usr/bin/bash
# Pixel/Termux: One-tap home-screen control via Termux:Widget
# Place a Termux:Widget shortcut to this file on the home screen.

set -euo pipefail

APP_DEFAULT="${APP_DEFAULT:-chrome}"

function open_app() {
    local target="$1"
    case "$target" in
        chrome) am start -n com.android.chrome/com.google.android.apps.chrome.Main ;;
        gmail) am start -n com.google.android.gm/.ConversationListActivityGmail ;;
        settings) am start -a android.settings.SETTINGS ;;
        messages) am start -n com.google.android.apps.messaging/.ui.ConversationListActivity ;;
        drive) am start -n com.google.android.apps.docs/.drive.app.ViewBrowserActivity ;;
        termux) am start -n com.termux/.app.TermuxActivity ;;
        *) echo "Unknown target: $target" && exit 1 ;;
    esac
}

function wifi_toggle() {
    svc wifi "$1"
}

function adb_wifi() {
    local host_ip
    host_ip=$(ip addr show wlan0 | awk '/inet /{print $2}' | cut -d/ -f1 | head -n1)
    if [[ -z "${host_ip}" ]]; then
        echo "No WLAN IP found. Connect to Wi-Fi first." >&2
        exit 1
    fi
    echo "Enabling wireless ADB on ${host_ip}:5555"
    su -c "setprop service.adb.tcp.port 5555 && stop adbd && start adbd"
    echo "Connect from host: adb connect ${host_ip}:5555"
}

case "${1:-open}" in
    open) open_app "${2:-$APP_DEFAULT}" ;;
    wifi-on) wifi_toggle enable ;;
    wifi-off) wifi_toggle disable ;;
    adb-wifi) adb_wifi ;;
    help|-h|--help)
        cat <<'EOF'
Pixel Home Control (Termux:Widget friendly)

Usage:
  ./termux-home-screen-control.sh open [chrome|gmail|settings|messages|drive|termux]
  ./termux-home-screen-control.sh wifi-on
  ./termux-home-screen-control.sh wifi-off
  ./termux-home-screen-control.sh adb-wifi

Tips:
- Create a Termux:Widget shortcut pointing to this script for one-tap control.
- Set APP_DEFAULT env var in the script to change default app.
- Wireless ADB requires root; if unavailable, skip adb-wifi.
EOF
        ;;
    *)
        echo "Unknown command: ${1}" >&2
        exit 1
        ;;
esac
