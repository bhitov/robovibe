#!/bin/bash

# RoboVibe Services Startup Script
# This script starts all necessary services for the RoboVibe application

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="/home/ubuntu/turbo-template/logs"
mkdir -p "$LOG_DIR"

echo -e "${GREEN}Starting RoboVibe Services...${NC}"

# Check for voice-only mode
VOICE_MODE=""
if [ "$1" = "--voice-only" ] || [ "$1" = "-v" ]; then
    VOICE_MODE="VITE_VOICE_ONLY=true "
    echo -e "${YELLOW}Voice-only mode enabled${NC}"
fi

# Change to project directory
cd /home/ubuntu/turbo-template

# Function to check if a port is in use
check_port() {
    local port=$1
    if ss -tlnp | grep -q ":$port "; then
        echo -e "${YELLOW}Warning: Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to start a service
start_service() {
    local name=$1
    local command=$2
    local log_file="$LOG_DIR/${name}.log"
    
    echo -e "${GREEN}Starting $name...${NC}"
    
    # Start the service in the background and redirect output to log file
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!
    
    # Save PID for later
    echo $pid > "$LOG_DIR/${name}.pid"
    
    echo -e "${GREEN}$name started with PID: $pid${NC}"
    echo -e "${GREEN}Logs: $log_file${NC}"
}

# Check if services are already running
if pgrep -f "tsx watch src/index.ts" > /dev/null; then
    echo -e "${YELLOW}API server is already running${NC}"
else
    if check_port 3001; then
        start_service "api-server" "pnpm --filter @repo/api dev"
    else
        echo -e "${RED}Cannot start API server - port 3001 is in use${NC}"
    fi
fi

if pgrep -f "vite" > /dev/null; then
    echo -e "${YELLOW}Web server is already running${NC}"
else
    start_service "web-server" "${VOICE_MODE}pnpm --filter @repo/web dev"
fi

# Give services time to start
sleep 3

# Check nginx status
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}Nginx is running${NC}"
else
    echo -e "${YELLOW}Starting Nginx...${NC}"
    sudo systemctl start nginx
fi

echo ""
echo -e "${GREEN}All services started!${NC}"
if [ -n "$VOICE_MODE" ]; then
    echo -e "${YELLOW}Running in VOICE-ONLY mode${NC}"
fi
echo ""
echo "Access points:"
echo -e "${GREEN}Web App: https://robovibe.raspyaspie.com${NC}"
echo -e "${GREEN}API: https://api.raspyaspie.com${NC}"
echo ""
echo "To view logs, run: ./scripts/view-logs.sh"
echo "To stop services, run: ./scripts/stop-services.sh"