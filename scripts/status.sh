#!/bin/bash

# RoboVibe Quick Status Check
# Shows the current status of all services

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOG_DIR="/home/ubuntu/turbo-template/logs"

echo -e "${BLUE}RoboVibe Service Status${NC}"
echo "======================="
echo ""

# Check API Server
if pgrep -f "tsx watch src/index.ts" > /dev/null; then
    pid=$(pgrep -f "tsx watch src/index.ts" | head -1)
    echo -e "${GREEN}✓ API Server${NC} (PID: $pid)"
else
    echo -e "${RED}✗ API Server${NC}"
fi

# Check Web Server
if pgrep -f "vite" > /dev/null; then
    pid=$(pgrep -f "vite" | head -1)
    echo -e "${GREEN}✓ Web Server${NC} (PID: $pid)"
else
    echo -e "${RED}✗ Web Server${NC}"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx${NC}"
else
    echo -e "${RED}✗ Nginx${NC}"
fi

echo ""
echo -e "${BLUE}URLs:${NC}"
echo -e "Web: ${GREEN}https://robovibe.raspyaspie.com${NC}"
echo -e "API: ${GREEN}https://api.raspyaspie.com${NC}"

echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo "Start all:  ./scripts/start-services.sh"
echo "Stop all:   ./scripts/stop-services.sh"
echo "View logs:  ./scripts/view-logs.sh"