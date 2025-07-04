#!/bin/bash

# MobileSide Universal Installer
# Detects platform and installs appropriate mobile logging tools
# Run with: curl -sSL https://raw.githubusercontent.com/bilal060/script/main/MobileSide/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SERVER_URL="https://script-bioa.vercel.app"
CONFIG_DIR="$HOME/.mobile-logger"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo -e "${BLUE}📱 MobileSide Universal Installer${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

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

# Function to detect platform
detect_platform() {
    print_info "Detecting platform..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if [[ $(uname -m) == "arm64" ]]; then
            PLATFORM="macos_arm64"
        else
            PLATFORM="macos_x64"
        fi
        print_status "Detected: macOS ($(uname -m))"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v termux-info &> /dev/null; then
            PLATFORM="android_termux"
            print_status "Detected: Android (Termux)"
        else
            PLATFORM="linux"
            print_status "Detected: Linux"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        PLATFORM="windows"
        print_status "Detected: Windows"
    else
        PLATFORM="unknown"
        print_warning "Unknown platform: $OSTYPE"
    fi
}

# Function to create configuration directory
setup_config() {
    print_info "Setting up configuration..."
    
    mkdir -p "$CONFIG_DIR"
    
    # Generate device ID if not exists
    if [[ ! -f "$CONFIG_DIR/device-id" ]]; then
        DEVICE_ID=$(uuidgen 2>/dev/null || echo "device_$(date +%s)_$(whoami)")
        echo "$DEVICE_ID" > "$CONFIG_DIR/device-id"
    else
        DEVICE_ID=$(cat "$CONFIG_DIR/device-id")
    fi
    
    # Create default configuration
    cat > "$CONFIG_FILE" << EOF
{
  "deviceId": "$DEVICE_ID",
  "userId": "",
  "serverUrl": "$SERVER_URL",
  "logLevel": "info",
  "captureNotifications": true,
  "captureLocation": false,
  "autoStart": true,
  "platform": "$PLATFORM",
  "installedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    print_status "Configuration created at $CONFIG_FILE"
}

# Function to install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    case $PLATFORM in
        "macos_arm64"|"macos_x64")
            # Check if Homebrew is installed
            if ! command -v brew &> /dev/null; then
                print_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            
            # Install required packages
            brew install curl jq node python3
            print_status "Dependencies installed via Homebrew"
            ;;
            
        "linux")
            # Detect package manager
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y curl jq nodejs npm python3 python3-pip
            elif command -v yum &> /dev/null; then
                sudo yum install -y curl jq nodejs npm python3 python3-pip
            elif command -v pacman &> /dev/null; then
                sudo pacman -S --noconfirm curl jq nodejs npm python3 python-pip
            else
                print_warning "Unknown package manager. Please install curl, jq, nodejs, and python3 manually."
            fi
            print_status "Dependencies installed"
            ;;
            
        "android_termux")
            pkg update
            pkg install -y curl jq nodejs python
            print_status "Dependencies installed via Termux"
            ;;
            
        "windows")
            print_info "Please install the following manually:"
            echo "  - curl: https://curl.se/windows/"
            echo "  - Node.js: https://nodejs.org/"
            echo "  - Python: https://python.org/"
            echo "  - jq: https://stedolan.github.io/jq/download/"
            ;;
    esac
}

# Function to install platform-specific tools
install_platform_tools() {
    print_info "Installing platform-specific tools..."
    
    case $PLATFORM in
        "macos_arm64"|"macos_x64")
            # Install iOS Simulator tools
            if command -v xcode-select &> /dev/null; then
                xcode-select --install 2>/dev/null || true
                print_status "Xcode command line tools available"
            fi
            
            # Install mobile logger CLI
            npm install -g mobile-logger-cli 2>/dev/null || {
                print_warning "Could not install mobile-logger-cli via npm"
                print_info "Installing local version..."
                mkdir -p "$CONFIG_DIR/bin"
                curl -sSL "$SERVER_URL/MobileSide/mobile-logger-cli.js" -o "$CONFIG_DIR/bin/mobile-logger"
                chmod +x "$CONFIG_DIR/bin/mobile-logger"
            }
            ;;
            
        "android_termux")
            # Install Android tools
            pkg install -y android-tools
            print_status "Android tools installed"
            
            # Create mobile logger script
            mkdir -p "$CONFIG_DIR/bin"
            curl -sSL "$SERVER_URL/MobileSide/mobile-logger-android.sh" -o "$CONFIG_DIR/bin/mobile-logger"
            chmod +x "$CONFIG_DIR/bin/mobile-logger"
            ;;
            
        "linux")
            # Install Android tools for Linux
            if command -v adb &> /dev/null; then
                print_status "Android Debug Bridge (adb) available"
            else
                print_info "Installing Android tools..."
                sudo apt-get install -y android-tools-adb android-tools-fastboot
            fi
            
            # Create mobile logger script
            mkdir -p "$CONFIG_DIR/bin"
            curl -sSL "$SERVER_URL/MobileSide/mobile-logger-linux.sh" -o "$CONFIG_DIR/bin/mobile-logger"
            chmod +x "$CONFIG_DIR/bin/mobile-logger"
            ;;
    esac
}

# Function to create launcher scripts
create_launchers() {
    print_info "Creating launcher scripts..."
    
    # Create main launcher
    cat > "$CONFIG_DIR/launch.sh" << 'EOF'
#!/bin/bash
# Mobile Logger Launcher

CONFIG_DIR="$HOME/.mobile-logger"
CONFIG_FILE="$CONFIG_DIR/config.json"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ Configuration not found. Please run the installer first."
    exit 1
fi

# Load configuration
SERVER_URL=$(jq -r '.serverUrl' "$CONFIG_FILE")
DEVICE_ID=$(jq -r '.deviceId' "$CONFIG_FILE")
LOG_LEVEL=$(jq -r '.logLevel' "$CONFIG_FILE")

echo "🚀 Starting Mobile Logger..."
echo "📱 Device ID: $DEVICE_ID"
echo "🌐 Server: $SERVER_URL"
echo "📊 Log Level: $LOG_LEVEL"
echo ""

# Start the appropriate logger based on platform
if [[ -f "$CONFIG_DIR/bin/mobile-logger" ]]; then
    "$CONFIG_DIR/bin/mobile-logger"
else
    echo "❌ Mobile logger binary not found. Please reinstall."
    exit 1
fi
EOF
    
    chmod +x "$CONFIG_DIR/launch.sh"
    
    # Create status checker
    cat > "$CONFIG_DIR/status.sh" << 'EOF'
#!/bin/bash
# Mobile Logger Status Checker

CONFIG_DIR="$HOME/.mobile-logger"
CONFIG_FILE="$CONFIG_DIR/config.json"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ Not installed"
    exit 1
fi

SERVER_URL=$(jq -r '.serverUrl' "$CONFIG_FILE")
DEVICE_ID=$(jq -r '.deviceId' "$CONFIG_FILE")

echo "📱 Mobile Logger Status"
echo "======================="
echo "✅ Installed: Yes"
echo "📱 Device ID: $DEVICE_ID"
echo "🌐 Server: $SERVER_URL"

# Test connection
if curl -s "$SERVER_URL/api/mongo-test" > /dev/null; then
    echo "🌐 Connection: ✅ Online"
else
    echo "🌐 Connection: ❌ Offline"
fi

echo ""
echo "📊 View logs at: $SERVER_URL/mobile-logs"
EOF
    
    chmod +x "$CONFIG_DIR/status.sh"
    
    print_status "Launcher scripts created"
}

# Function to setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$CONFIG_DIR/bin:"* ]]; then
        echo "export PATH=\"\$PATH:$CONFIG_DIR/bin\"" >> "$HOME/.bashrc"
        echo "export PATH=\"\$PATH:$CONFIG_DIR/bin\"" >> "$HOME/.zshrc" 2>/dev/null || true
        print_status "Added to PATH"
    fi
    
    # Create aliases
    echo "alias mobile-logger='$CONFIG_DIR/launch.sh'" >> "$HOME/.bashrc"
    echo "alias mobile-status='$CONFIG_DIR/status.sh'" >> "$HOME/.bashrc"
    echo "alias mobile-logger='$CONFIG_DIR/launch.sh'" >> "$HOME/.zshrc" 2>/dev/null || true
    echo "alias mobile-status='$CONFIG_DIR/status.sh'" >> "$HOME/.zshrc" 2>/dev/null || true
    
    print_status "Environment configured"
}

# Function to test installation
test_installation() {
    print_info "Testing installation..."
    
    # Test configuration
    if [[ -f "$CONFIG_FILE" ]]; then
        print_status "Configuration file exists"
    else
        print_error "Configuration file missing"
        return 1
    fi
    
    # Test server connection
    if curl -s "$SERVER_URL/api/mongo-test" > /dev/null; then
        print_status "Server connection successful"
    else
        print_warning "Server connection failed"
    fi
    
    # Test launcher
    if [[ -x "$CONFIG_DIR/launch.sh" ]]; then
        print_status "Launcher script is executable"
    else
        print_error "Launcher script not executable"
        return 1
    fi
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}🎉 Installation Complete!${NC}"
    echo ""
    echo -e "${CYAN}📱 Next Steps:${NC}"
    echo "1. Start logging: mobile-logger"
    echo "2. Check status: mobile-status"
    echo "3. View logs: $SERVER_URL/mobile-logs"
    echo ""
    echo -e "${CYAN}🔧 Configuration:${NC}"
    echo "Edit: $CONFIG_FILE"
    echo ""
    echo -e "${CYAN}📚 Documentation:${NC}"
    echo "Read: $CONFIG_DIR/README.md"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo "- Enable notification access on your device"
    echo "- Grant necessary permissions when prompted"
    echo "- Check the web dashboard for real-time logs"
    echo ""
    echo -e "${GREEN}🚀 Ready to capture mobile logs!${NC}"
}

# Main installation process
main() {
    echo -e "${BLUE}Starting MobileSide installation...${NC}"
    echo ""
    
    # Detect platform
    detect_platform
    
    # Setup configuration
    setup_config
    
    # Install dependencies
    install_dependencies
    
    # Install platform-specific tools
    install_platform_tools
    
    # Create launcher scripts
    create_launchers
    
    # Setup environment
    setup_environment
    
    # Test installation
    test_installation
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@" 