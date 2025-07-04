#!/bin/bash

# iOS Mobile Logger
# Captures notifications and system logs from iOS devices
# Requires: Xcode command line tools and device connected

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
LOG_FILE="$CONFIG_DIR/ios-logs.json"
PID_FILE="$CONFIG_DIR/ios-logger.pid"

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

# Function to check Xcode tools
check_xcode_tools() {
    if ! command -v xcrun &> /dev/null; then
        print_error "Xcode command line tools not found. Please install Xcode."
        exit 1
    fi
    
    print_status "Xcode tools found: $(xcrun --version | head -n1)"
}

# Function to check device connection
check_device() {
    print_info "Checking iOS device connection..."
    
    # Get connected devices
    DEVICES=$(xcrun devicectl list devices | grep -c "iPhone\|iPad" || echo "0")
    
    if [[ $DEVICES -eq 0 ]]; then
        print_error "No iOS devices connected. Please:"
        echo "  1. Connect your iPhone/iPad via USB"
        echo "  2. Trust this computer on your device"
        echo "  3. Enable developer mode if prompted"
        exit 1
    fi
    
    # Get device info
    DEVICE_INFO=$(xcrun devicectl list devices | grep "iPhone\|iPad" | head -n1)
    DEVICE_NAME=$(echo "$DEVICE_INFO" | awk '{print $1}')
    DEVICE_ID_IOS=$(echo "$DEVICE_INFO" | awk '{print $2}')
    IOS_VERSION=$(xcrun devicectl list devices | grep "$DEVICE_NAME" | grep -o "iOS [0-9.]*" || echo "Unknown")
    
    print_status "Device connected: $DEVICE_NAME"
    print_status "Device ID: $DEVICE_ID_IOS"
    print_status "iOS Version: $IOS_VERSION"
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
    local app_name="$1"
    local title="$2"
    local content="$3"
    local timestamp="$4"
    
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
  "appVersion": "iOS $IOS_VERSION",
  "osVersion": "iOS $IOS_VERSION",
  "deviceModel": "$DEVICE_NAME",
  "screen": "Notification",
  "action": "notification_received",
  "metadata": {
    "iosDeviceId": "$DEVICE_ID_IOS",
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
    local subsystem="$2"
    local message="$3"
    local timestamp="$4"
    
    # Create log entry
    local log_entry=$(cat << EOF
{
  "app": "iOS System",
  "title": "$subsystem",
  "content": "$message",
  "logLevel": "$level",
  "category": "system",
  "deviceId": "$DEVICE_ID",
  "userId": "$USER_ID",
  "appVersion": "iOS $IOS_VERSION",
  "osVersion": "iOS $IOS_VERSION",
  "deviceModel": "$DEVICE_NAME",
  "screen": "System",
  "action": "system_log",
  "metadata": {
    "subsystem": "$subsystem",
    "iosDeviceId": "$DEVICE_ID_IOS",
    "timestamp": "$timestamp"
  }
}
EOF
)
    
    # Send to server
    send_log "$log_entry"
    
    # Save to local file
    echo "$log_entry" >> "$LOG_FILE"
    
    print_status "Captured system log: [$level] $subsystem - $message"
}

# Function to monitor notifications
monitor_notifications() {
    print_info "Starting notification monitoring..."
    
    # Use Console.app to monitor notifications
    log stream --predicate 'category == "notification"' --device "$DEVICE_ID_IOS" | while read -r line; do
        # Parse notification log
        if [[ "$line" =~ "notification" ]]; then
            local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
            local app_name=$(echo "$line" | grep -o 'process:[^[:space:]]*' | cut -d: -f2 || echo "Unknown App")
            local title=$(echo "$line" | grep -o 'title:[^[:space:]]*' | cut -d: -f2 || echo "Notification")
            local content=$(echo "$line" | grep -o 'body:[^[:space:]]*' | cut -d: -f2 || echo "")
            
            capture_notification "$app_name" "$title" "$content" "$timestamp"
        fi
    done
}

# Function to monitor system logs
monitor_system_logs() {
    print_info "Starting system log monitoring..."
    
    # Monitor system logs
    log stream --predicate 'category == "system"' --device "$DEVICE_ID_IOS" | while read -r line; do
        # Parse system log
        if [[ "$line" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}[[:space:]][0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}[[:space:]]([A-Z])[[:space:]]([^:]+):[[:space:]](.*)$ ]]; then
            local level="${BASH_REMATCH[1]}"
            local subsystem="${BASH_REMATCH[2]}"
            local message="${BASH_REMATCH[3]}"
            local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
            
            # Map iOS log levels to our levels
            case $level in
                "E") log_level="error" ;;
                "W") log_level="warning" ;;
                "I") log_level="info" ;;
                "D") log_level="debug" ;;
                *) log_level="info" ;;
            esac
            
            # Filter important subsystems
            if [[ "$subsystem" =~ ^(SpringBoard|UIKit|CoreLocation|NetworkExtension|AVFoundation|CoreMotion|HealthKit|HomeKit|ARKit|CoreML|Vision|Speech|MediaPlayer|StoreKit|CloudKit|UserNotifications|BackgroundTasks|AppStore|Safari|Mail|Messages|Phone|FaceTime|Camera|Photos|Settings|General|Accessibility|Privacy|Security|Power|Battery|Thermal|Performance|Memory|Storage|Network|WiFi|Cellular|Bluetooth|Audio|Video|Camera|Microphone|Speaker|Vibration|Haptic|Display|Touch|Keyboard|Siri|Spotlight|ControlCenter|NotificationCenter|Dock|HomeIndicator|StatusBar|LockScreen|Passcode|FaceID|TouchID|Wallet|ApplePay|CarPlay|AirPlay|AirDrop|Handoff|Continuity|FamilySharing|iCloud|iTunes|AppStore|TestFlight|Developer|Debug|Profiling|Instruments|Xcode|Simulator|DeviceManagement|MDM|Configuration|Provisioning|Signing|Entitlements|Capabilities|Permissions|Privacy|Security|Encryption|Keychain|Certificates|Profiles|Policies|Restrictions|Compliance|Audit|Logging|Monitoring|Analytics|Crash|Exception|Error|Warning|Info|Debug|Trace|Verbose)$ ]]; then
                capture_system_log "$log_level" "$subsystem" "$message" "$timestamp"
            fi
        fi
    done
}

# Function to capture app launches
monitor_app_launches() {
    print_info "Starting app launch monitoring..."
    
    # Monitor app launches
    log stream --predicate 'category == "app" AND messageType == "activity"' --device "$DEVICE_ID_IOS" | while read -r line; do
        if [[ "$line" =~ "launch" ]] || [[ "$line" =~ "start" ]]; then
            local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
            local app_name=$(echo "$line" | grep -o 'process:[^[:space:]]*' | cut -d: -f2 || echo "Unknown App")
            local activity=$(echo "$line" | grep -o 'activity:[^[:space:]]*' | cut -d: -f2 || echo "launch")
            
            local log_entry=$(cat << EOF
{
  "app": "$app_name",
  "title": "App Launched",
  "content": "Application $app_name was launched",
  "logLevel": "info",
  "category": "user_action",
  "deviceId": "$DEVICE_ID",
  "userId": "$USER_ID",
  "appVersion": "iOS $IOS_VERSION",
  "osVersion": "iOS $IOS_VERSION",
  "deviceModel": "$DEVICE_NAME",
  "screen": "$activity",
  "action": "app_launch",
  "metadata": {
    "appName": "$app_name",
    "activity": "$activity",
    "iosDeviceId": "$DEVICE_ID_IOS",
    "timestamp": "$timestamp"
  }
}
EOF
)
            
            send_log "$log_entry"
            echo "$log_entry" >> "$LOG_FILE"
            print_status "Captured app launch: $app_name"
        fi
    done
}

# Function to capture device info
capture_device_info() {
    print_info "Capturing device information..."
    
    # Get device info using system_profiler
    local battery_info=$(system_profiler SPBluetoothDataType 2>/dev/null | grep -i "battery" | head -n1 || echo "unknown")
    local network_info=$(system_profiler SPNetworkDataType 2>/dev/null | grep -i "wi-fi" | head -n1 || echo "unknown")
    local storage_info=$(system_profiler SPStorageDataType 2>/dev/null | grep -i "capacity" | head -n1 || echo "unknown")
    
    local log_entry=$(cat << EOF
{
  "app": "iOS System",
  "title": "Device Status",
  "content": "Battery: $battery_info, Network: $network_info, Storage: $storage_info",
  "logLevel": "info",
  "category": "system",
  "deviceId": "$DEVICE_ID",
  "userId": "$USER_ID",
  "appVersion": "iOS $IOS_VERSION",
  "osVersion": "iOS $IOS_VERSION",
  "deviceModel": "$DEVICE_NAME",
  "screen": "System",
  "action": "device_status",
  "metadata": {
    "batteryInfo": "$battery_info",
    "networkInfo": "$network_info",
    "storageInfo": "$storage_info",
    "iosDeviceId": "$DEVICE_ID_IOS",
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
    print_info "Starting iOS mobile logger..."
    echo "📱 Device: $DEVICE_NAME"
    echo "🍎 iOS: $IOS_VERSION"
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
    print_info "Stopping iOS mobile logger..."
    
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
    
    print_status "iOS mobile logger stopped"
}

# Function to show status
show_status() {
    echo "📱 iOS Mobile Logger Status"
    echo "==========================="
    echo "✅ Configuration: $(jq -r '.deviceId' "$CONFIG_FILE")"
    echo "📱 Device: $DEVICE_NAME"
    echo "🍎 iOS: $IOS_VERSION"
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
            check_xcode_tools
            check_device
            start_monitoring
            ;;
        "stop")
            stop_monitoring
            ;;
        "status")
            load_config
            check_xcode_tools
            check_device
            show_status
            ;;
        "restart")
            stop_monitoring
            sleep 2
            load_config
            check_xcode_tools
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