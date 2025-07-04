#!/bin/bash

# Android Mobile Logger
# Captures notifications and system logs from Android devices
# Requires: ADB (Android Debug Bridge) and device connected

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
CONFIG_DIR="$HOME/.mobile-logger"
CONFIG_FILE="$CONFIG_DIR/config.json"
SERVER_URL="https://script-bioa.vercel.app"
LOG_FILE="$CONFIG_DIR/android-logs.json"
PID_FILE="$CONFIG_DIR/android-logger.pid"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Function to load configuration
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        print_error "Configuration file not found. Please run the installer first."
        exit 1
    fi
    
    DEVICE_ID=$(jq -r '.deviceId' "$CONFIG_FILE")
    USER_ID=$(jq -r '.userId' "$CONFIG_FILE")
    LOG_LEVEL=$(jq -r '.logLevel' "$CONFIG_FILE")
    CAPTURE_NOTIFICATIONS=$(jq -r '.captureNotifications' "$CONFIG_FILE")
    
    print_status "Configuration loaded"
}

# Function to check ADB availability
check_adb() {
    if ! command -v adb &> /dev/null; then
        print_error "ADB (Android Debug Bridge) not found. Please install android-tools."
        exit 1
    fi
    
    print_status "ADB found: $(adb version | head -n1)"
}

# Function to check device connection
check_device() {
    print_info "Checking device connection..."
    
    # Start ADB server
    adb start-server 2>/dev/null || true
    
    # Get connected devices
    DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)
    
    if [[ $DEVICES -eq 0 ]]; then
        print_error "No Android devices connected. Please:"
        echo "  1. Enable USB debugging on your device"
        echo "  2. Connect device via USB"
        echo "  3. Allow USB debugging when prompted"
        exit 1
    fi
    
    DEVICE_ID_ANDROID=$(adb shell settings get secure android_id 2>/dev/null || echo "unknown")
    DEVICE_MODEL=$(adb shell getprop ro.product.model 2>/dev/null || echo "Unknown")
    ANDROID_VERSION=$(adb shell getprop ro.build.version.release 2>/dev/null || echo "Unknown")
    
    print_status "Device connected: $DEVICE_MODEL (Android $ANDROID_VERSION)"
    print_status "Device ID: $DEVICE_ID_ANDROID"
}

# Function to send log to server
send_log() {
    local log_data="$1"
    
    curl -s -X POST "$SERVER_URL/api/notify-mongo" \
        -H "Content-Type: application/json" \
        -d "$log_data" > /dev/null 2>&1 || {
        print_warning "Failed to send log to server"
    }
}

# Function to capture notification
capture_notification() {
    local package_name="$1"
    local title="$2"
    local content="$3"
    local timestamp="$4"
    
    # Get app name from package
    local app_name=$(adb shell pm list packages -f "$package_name" 2>/dev/null | head -n1 | sed 's/.*=//' || echo "$package_name")
    
    # Create log entry
    local log_entry=$(cat << EOF
{
  "app": "$app_name",
  "title": "$title",
  "content": "$content",
  "logLevel": "info",
  "category": "notification",
  "deviceId": "$DEVICE_ID",
  "userId": "$USER_ID",
  "appVersion": "Android $ANDROID_VERSION",
  "osVersion": "Android $ANDROID_VERSION",
  "deviceModel": "$DEVICE_MODEL",
  "screen": "Notification",
  "action": "notification_received",
  "metadata": {
    "packageName": "$package_name",
    "androidDeviceId": "$DEVICE_ID_ANDROID",
    "timestamp": "$timestamp"
  }
}
EOF
)
    
    # Send to server
    send_log "$log_entry"
    
    # Save to local file
    echo "$log_entry" >> "$LOG_FILE"
    
    print_status "Captured notification: [$app_name] $title"
}

# Function to capture system log
capture_system_log() {
    local level="$1"
    local tag="$2"
    local message="$3"
    local timestamp="$4"
    
    # Create log entry
    local log_entry=$(cat << EOF
{
  "app": "Android System",
  "title": "$tag",
  "content": "$message",
  "logLevel": "$level",
  "category": "system",
  "deviceId": "$DEVICE_ID",
  "userId": "$USER_ID",
  "appVersion": "Android $ANDROID_VERSION",
  "osVersion": "Android $ANDROID_VERSION",
  "deviceModel": "$DEVICE_MODEL",
  "screen": "System",
  "action": "system_log",
  "metadata": {
    "tag": "$tag",
    "androidDeviceId": "$DEVICE_ID_ANDROID",
    "timestamp": "$timestamp"
  }
}
EOF
)
    
    # Send to server
    send_log "$log_entry"
    
    # Save to local file
    echo "$log_entry" >> "$LOG_FILE"
    
    print_status "Captured system log: [$level] $tag - $message"
}

# Function to monitor notifications
monitor_notifications() {
    print_info "Starting notification monitoring..."
    
    # Clear notification log
    adb shell dumpsys notification --noredact > /dev/null 2>&1 || true
    
    # Monitor notification events
    adb logcat -s NotificationService:V NotificationManagerService:V | while read -r line; do
        if [[ "$line" =~ "NotificationService" ]] || [[ "$line" =~ "NotificationManagerService" ]]; then
            # Extract notification info
            local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
            local package_name=$(echo "$line" | grep -o 'package:[^[:space:]]*' | cut -d: -f2 || echo "unknown")
            local title=$(echo "$line" | grep -o 'title:[^[:space:]]*' | cut -d: -f2 || echo "Notification")
            local content=$(echo "$line" | grep -o 'text:[^[:space:]]*' | cut -d: -f2 || echo "")
            
            if [[ "$package_name" != "unknown" ]]; then
                capture_notification "$package_name" "$title" "$content" "$timestamp"
            fi
        fi
    done
}

# Function to monitor system logs
monitor_system_logs() {
    print_info "Starting system log monitoring..."
    
    # Monitor system logs with different levels
    adb logcat -v time | while read -r line; do
        # Parse logcat output
        if [[ "$line" =~ ^[0-9]{2}-[0-9]{2}[[:space:]][0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}[[:space:]][0-9]+[[:space:]][0-9]+[[:space:]]([A-Z])[[:space:]]([^:]+):[[:space:]](.*)$ ]]; then
            local level="${BASH_REMATCH[1]}"
            local tag="${BASH_REMATCH[2]}"
            local message="${BASH_REMATCH[3]}"
            local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
            
            # Map Android log levels to our levels
            case $level in
                "E") log_level="error" ;;
                "W") log_level="warning" ;;
                "I") log_level="info" ;;
                "D") log_level="debug" ;;
                *) log_level="info" ;;
            esac
            
            # Filter important logs
            if [[ "$tag" =~ ^(ActivityManager|PackageManager|SystemServer|WindowManager|PowerManager|BatteryService|NetworkPolicy|ConnectivityService|WifiService|TelephonyService|LocationManager|CameraService|AudioService|MediaSessionService|InputMethodManager|AccessibilityManager|NotificationService|NotificationManagerService)$ ]]; then
                capture_system_log "$log_level" "$tag" "$message" "$timestamp"
            fi
        fi
    done
}

# Function to capture app launches
monitor_app_launches() {
    print_info "Starting app launch monitoring..."
    
    # Monitor activity manager for app launches
    adb logcat -s ActivityManager:V | while read -r line; do
        if [[ "$line" =~ "START" ]] && [[ "$line" =~ "cmp=" ]]; then
            local timestamp=$(date -u +%Y-%m:%dT%H:%M:%SZ)
            local package_name=$(echo "$line" | grep -o 'cmp=[^[:space:]]*' | cut -d= -f2 | cut -d/ -f1 || echo "unknown")
            local activity_name=$(echo "$line" | grep -o 'cmp=[^[:space:]]*' | cut -d= -f2 | cut -d/ -f2 || echo "MainActivity")
            
            if [[ "$package_name" != "unknown" ]]; then
                local app_name=$(adb shell pm list packages -f "$package_name" 2>/dev/null | head -n1 | sed 's/.*=//' || echo "$package_name")
                
                local log_entry=$(cat << EOF
{
  "app": "$app_name",
  "title": "App Launched",
  "content": "Application $app_name was launched",
  "logLevel": "info",
  "category": "user_action",
  "deviceId": "$DEVICE_ID",
  "userId": "$USER_ID",
  "appVersion": "Android $ANDROID_VERSION",
  "osVersion": "Android $ANDROID_VERSION",
  "deviceModel": "$DEVICE_MODEL",
  "screen": "$activity_name",
  "action": "app_launch",
  "metadata": {
    "packageName": "$package_name",
    "activityName": "$activity_name",
    "androidDeviceId": "$DEVICE_ID_ANDROID",
    "timestamp": "$timestamp"
  }
}
EOF
)
                
                send_log "$log_entry"
                echo "$log_entry" >> "$LOG_FILE"
                print_status "Captured app launch: $app_name"
            fi
        fi
    done
}

# Function to capture device info
capture_device_info() {
    print_info "Capturing device information..."
    
    local battery_level=$(adb shell dumpsys battery | grep level | awk '{print $2}' || echo "unknown")
    local battery_status=$(adb shell dumpsys battery | grep status | awk '{print $2}' || echo "unknown")
    local network_type=$(adb shell dumpsys connectivity | grep "Active network" | head -n1 | grep -o "type:[^[:space:]]*" | cut -d: -f2 || echo "unknown")
    local wifi_ssid=$(adb shell dumpsys wifi | grep "mWifiInfo" | head -n1 | grep -o "SSID:[^[:space:]]*" | cut -d: -f2 || echo "unknown")
    
    local log_entry=$(cat << EOF
{
  "app": "Android System",
  "title": "Device Status",
  "content": "Battery: $battery_level%, Network: $network_type, WiFi: $wifi_ssid",
  "logLevel": "info",
  "category": "system",
  "deviceId": "$DEVICE_ID",
  "userId": "$USER_ID",
  "appVersion": "Android $ANDROID_VERSION",
  "osVersion": "Android $ANDROID_VERSION",
  "deviceModel": "$DEVICE_MODEL",
  "screen": "System",
  "action": "device_status",
  "metadata": {
    "batteryLevel": "$battery_level",
    "batteryStatus": "$battery_status",
    "networkType": "$network_type",
    "wifiSSID": "$wifi_ssid",
    "androidDeviceId": "$DEVICE_ID_ANDROID",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
)
    
    send_log "$log_entry"
    echo "$log_entry" >> "$LOG_FILE"
    print_status "Captured device status"
}

# Function to start monitoring
start_monitoring() {
    print_info "Starting Android mobile logger..."
    echo "📱 Device: $DEVICE_MODEL"
    echo "🤖 Android: $ANDROID_VERSION"
    echo "🆔 Device ID: $DEVICE_ID"
    echo "🌐 Server: $SERVER_URL"
    echo ""
    
    # Create log file if not exists
    touch "$LOG_FILE"
    
    # Save PID
    echo $$ > "$PID_FILE"
    
    # Capture initial device info
    capture_device_info
    
    # Start monitoring in background
    if [[ "$CAPTURE_NOTIFICATIONS" == "true" ]]; then
        monitor_notifications &
        NOTIFICATION_PID=$!
    fi
    
    monitor_system_logs &
    SYSTEM_PID=$!
    
    monitor_app_launches &
    APP_PID=$!
    
    print_status "Monitoring started. Press Ctrl+C to stop."
    
    # Wait for background processes
    wait
}

# Function to stop monitoring
stop_monitoring() {
    print_info "Stopping Android mobile logger..."
    
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            print_status "Stopped logger process"
        fi
        rm -f "$PID_FILE"
    fi
    
    # Kill background processes
    if [[ -n "$NOTIFICATION_PID" ]]; then
        kill "$NOTIFICATION_PID" 2>/dev/null || true
    fi
    
    if [[ -n "$SYSTEM_PID" ]]; then
        kill "$SYSTEM_PID" 2>/dev/null || true
    fi
    
    if [[ -n "$APP_PID" ]]; then
        kill "$APP_PID" 2>/dev/null || true
    fi
    
    print_status "Android mobile logger stopped"
}

# Function to show status
show_status() {
    echo "📱 Android Mobile Logger Status"
    echo "==============================="
    echo "✅ Configuration: $(jq -r '.deviceId' "$CONFIG_FILE")"
    echo "📱 Device: $DEVICE_MODEL"
    echo "🤖 Android: $ANDROID_VERSION"
    echo "🌐 Server: $SERVER_URL"
    
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🟢 Status: Running (PID: $pid)"
        else
            echo "🔴 Status: Not running"
        fi
    else
        echo "🔴 Status: Not running"
    fi
    
    echo ""
    echo "📊 View logs at: $SERVER_URL/mobile-logs"
    echo "📁 Local logs: $LOG_FILE"
}

# Main function
main() {
    case "${1:-start}" in
        "start")
            load_config
            check_adb
            check_device
            start_monitoring
            ;;
        "stop")
            stop_monitoring
            ;;
        "status")
            load_config
            check_adb
            check_device
            show_status
            ;;
        "restart")
            stop_monitoring
            sleep 2
            load_config
            check_adb
            check_device
            start_monitoring
            ;;
        *)
            echo "Usage: $0 {start|stop|status|restart}"
            echo ""
            echo "Commands:"
            echo "  start   - Start monitoring (default)"
            echo "  stop    - Stop monitoring"
            echo "  status  - Show status"
            echo "  restart - Restart monitoring"
            exit 1
            ;;
    esac
}

# Handle Ctrl+C
trap stop_monitoring INT TERM

# Run main function
main "$@" 