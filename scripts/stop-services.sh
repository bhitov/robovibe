#!/bin/bash

# RoboVibe Services Stop Script
# This script stops all RoboVibe services gracefully

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="/home/ubuntu/turbo-template/logs"

echo -e "${RED}Stopping RoboVibe Services...${NC}"

# Function to stop a service by PID file
stop_service() {
    local name=$1
    local pid_file="$LOG_DIR/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
            kill $pid
            rm -f "$pid_file"
            echo -e "${GREEN}$name stopped${NC}"
        else
            echo -e "${YELLOW}$name was not running (stale PID file)${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}No PID file found for $name${NC}"
    fi
}

# Stop services using PID files
stop_service "api-server"
stop_service "web-server"

# Also kill any remaining processes
echo -e "${YELLOW}Cleaning up any remaining processes...${NC}"

# Kill API server processes
pkill -f "tsx watch src/index.ts" 2>/dev/null || true

# Kill web server processes
pkill -f "vite" 2>/dev/null || true

# Kill any remaining pnpm dev processes
pkill -f "pnpm.*dev" 2>/dev/null || true

echo ""
echo -e "${GREEN}All services stopped!${NC}"
echo ""

# Ask about nginx
read -p "Do you want to stop Nginx as well? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo systemctl stop nginx
    echo -e "${GREEN}Nginx stopped${NC}"
else
    echo -e "${YELLOW}Nginx is still running${NC}"
fi