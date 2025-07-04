#!/bin/bash

# Simple Mobile Logger Installer
# Installs mobile logging scripts without external dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Function to detect platform
detect_platform() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Function to install universal logger
install_universal_logger() {
    print_info "Installing universal mobile logger..."
    
    # Create installation directory
    mkdir -p ~/.mobile-logger
    
    # Download all loggers from the current directory
    if [[ -f "MobileSide/mobile-logger-web.js" ]]; then
        cp MobileSide/mobile-logger-web.js ~/.mobile-logger/
        print_status "Web logger copied"
    else
        print_warning "Web logger not found in current directory"
    fi
    
    if [[ -f "MobileSide/mobile-logger-ios.sh" ]]; then
        cp MobileSide/mobile-logger-ios.sh ~/.mobile-logger/
        chmod +x ~/.mobile-logger/mobile-logger-ios.sh
        print_status "iOS logger copied"
    else
        print_warning "iOS logger not found in current directory"
    fi
    
    if [[ -f "MobileSide/mobile-logger-android.sh" ]]; then
        cp MobileSide/mobile-logger-android.sh ~/.mobile-logger/
        chmod +x ~/.mobile-logger/mobile-logger-android.sh
        print_status "Android logger copied"
    else
        print_warning "Android logger not found in current directory"
    fi
    
    if [[ -f "MobileSide/index.js" ]]; then
        cp MobileSide/index.js ~/.mobile-logger/mobile-logger-react-native.js
        print_status "React Native logger copied"
    else
        print_warning "React Native logger not found in current directory"
    fi
    
    # Create configuration
    cat > ~/.mobile-logger/config.json << EOF
{
  "deviceId": "universal_$(date +%s)_$(openssl rand -hex 4)",
  "userId": "",
  "serverUrl": "https://script-bioa.vercel.app",
  "logLevel": "info",
  "captureNotifications": true,
  "captureLocation": false,
  "autoStart": true
}
EOF
    
    # Create launcher script
    cat > ~/.mobile-logger/start-logger.sh << 'EOF'
#!/bin/bash

echo "📱 Mobile Logger Launcher"
echo "========================="
echo "1. Web Logger"
echo "2. iOS Logger"
echo "3. Android Logger"
echo "4. React Native Logger"
echo "5. Test Installation"
echo "6. Exit"
echo ""
read -p "Choose an option (1-6): " choice

case $choice in
    1)
        echo "Starting web logger..."
        echo "Include mobile-logger-web.js in your HTML"
        echo "Example:"
        echo "  <script src='~/.mobile-logger/mobile-logger-web.js'></script>"
        echo "  <script>"
        echo "    const logger = new MobileLogger();"
        echo "    logger.start();"
        echo "  </script>"
        ;;
    2)
        echo "Starting iOS logger..."
        if [[ -f "./mobile-logger-ios.sh" ]]; then
            ./mobile-logger-ios.sh start
        else
            echo "iOS logger not found"
        fi
        ;;
    3)
        echo "Starting Android logger..."
        if [[ -f "./mobile-logger-android.sh" ]]; then
            ./mobile-logger-android.sh start
        else
            echo "Android logger not found"
        fi
        ;;
    4)
        echo "React Native logger installed"
        echo "Import mobile-logger-react-native.js in your project"
        echo "Example:"
        echo "  import logger from './mobile-logger-react-native.js';"
        echo "  logger.start();"
        ;;
    5)
        echo "Testing installation..."
        if command -v node &> /dev/null; then
            node ~/.mobile-logger/test-installation.js
        else
            echo "Node.js not found. Please install Node.js to run tests."
        fi
        ;;
    6)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac
EOF
    chmod +x ~/.mobile-logger/start-logger.sh
    
    # Copy test script if available
    if [[ -f "MobileSide/test-installation.js" ]]; then
        cp MobileSide/test-installation.js ~/.mobile-logger/
        print_status "Test script copied"
    fi
    
    print_status "Universal logger installed successfully!"
    print_info "Usage: ~/.mobile-logger/start-logger.sh"
}

# Function to show installation status
show_status() {
    print_header "Mobile Logger Installation Status"
    echo ""
    
    if [[ -d ~/.mobile-logger ]]; then
        print_status "Mobile Logger is installed"
        echo "📁 Installation directory: ~/.mobile-logger"
        
        if [[ -f ~/.mobile-logger/config.json ]]; then
            print_status "Configuration file exists"
        else
            print_warning "Configuration file missing"
        fi
        
        if [[ -f ~/.mobile-logger/mobile-logger-web.js ]]; then
            print_status "Web logger available"
        fi
        
        if [[ -f ~/.mobile-logger/mobile-logger-ios.sh ]]; then
            print_status "iOS logger available"
        fi
        
        if [[ -f ~/.mobile-logger/mobile-logger-android.sh ]]; then
            print_status "Android logger available"
        fi
        
        if [[ -f ~/.mobile-logger/mobile-logger-react-native.js ]]; then
            print_status "React Native logger available"
        fi
        
        if [[ -f ~/.mobile-logger/test-installation.js ]]; then
            print_status "Test script available"
        fi
    else
        print_warning "Mobile Logger is not installed"
    fi
    
    echo ""
    print_info "View logs at: https://script-bioa.vercel.app/mobile-logs"
}

# Function to uninstall
uninstall() {
    print_warning "Uninstalling Mobile Logger..."
    
    if [[ -d ~/.mobile-logger ]]; then
        rm -rf ~/.mobile-logger
        print_status "Mobile Logger uninstalled successfully"
    else
        print_warning "Mobile Logger is not installed"
    fi
}

# Function to test installation
test_installation() {
    print_info "Testing installation..."
    
    if command -v node &> /dev/null; then
        if [[ -f ~/.mobile-logger/test-installation.js ]]; then
            node ~/.mobile-logger/test-installation.js
        else
            print_warning "Test script not found"
        fi
    else
        print_warning "Node.js not found. Please install Node.js to run tests."
    fi
}

# Main function
main() {
    print_header "📱 Mobile Logger Simple Installer"
    echo ""
    
    # Detect platform
    PLATFORM=$(detect_platform)
    print_info "Platform: $PLATFORM"
    echo ""
    
    case "${1:-install}" in
        "install")
            install_universal_logger
            ;;
        "status")
            show_status
            ;;
        "test")
            test_installation
            ;;
        "uninstall")
            uninstall
            ;;
        *)
            echo "Usage: $0 {install|status|test|uninstall}"
            echo ""
            echo "Commands:"
            echo "  install   - Install Mobile Logger (default)"
            echo "  status    - Show installation status"
            echo "  test      - Test installation"
            echo "  uninstall - Uninstall Mobile Logger"
            exit 1
            ;;
    esac
    
    echo ""
    print_status "Operation completed!"
    print_info "View your logs at: https://script-bioa.vercel.app/mobile-logs"
    print_info "For help, see: https://github.com/bilal060/script/blob/main/MobileSide/README.md"
}

# Run main function
main "$@" 