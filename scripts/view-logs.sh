#!/bin/bash

# RoboVibe Log Viewer Script
# This script helps view and tail logs from RoboVibe services

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="/home/ubuntu/turbo-template/logs"

# Function to display menu
show_menu() {
    echo ""
    echo -e "${BLUE}RoboVibe Log Viewer${NC}"
    echo "===================="
    echo "1) View API Server logs"
    echo "2) View Web Server logs"
    echo "3) View Nginx access logs"
    echo "4) View Nginx error logs"
    echo "5) Tail all logs (live)"
    echo "6) Show service status"
    echo "q) Quit"
    echo ""
    echo -n "Select option: "
}

# Function to check if service is running
check_service() {
    local name=$1
    local pid_file="$LOG_DIR/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            echo -e "${GREEN}✓ $name is running (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}✗ $name is not running (stale PID)${NC}"
        fi
    else
        echo -e "${YELLOW}✗ $name is not running${NC}"
    fi
}

# Function to view log file
view_log() {
    local log_file=$1
    local title=$2
    
    if [ -f "$log_file" ]; then
        echo -e "${GREEN}=== $title ===${NC}"
        echo -e "${YELLOW}(Press 'q' to exit, '/' to search)${NC}"
        echo ""
        less +G "$log_file"
    else
        echo -e "${RED}Log file not found: $log_file${NC}"
        sleep 2
    fi
}

# Function to tail all logs
tail_all() {
    echo -e "${GREEN}Tailing all logs... (Press Ctrl+C to stop)${NC}"
    echo ""
    
    # Build command for tail
    local tail_cmd="tail -f"
    local has_logs=false
    
    if [ -f "$LOG_DIR/api-server.log" ]; then
        tail_cmd="$tail_cmd $LOG_DIR/api-server.log"
        has_logs=true
    fi
    
    if [ -f "$LOG_DIR/web-server.log" ]; then
        tail_cmd="$tail_cmd $LOG_DIR/web-server.log"
        has_logs=true
    fi
    
    if [ "$has_logs" = false ]; then
        echo -e "${YELLOW}No log files found. Start services first.${NC}"
        sleep 2
        return
    fi
    
    # Execute tail command
    $tail_cmd 2>/dev/null
}

# Main loop
while true; do
    clear
    show_menu
    read -r choice
    
    case $choice in
        1)
            view_log "$LOG_DIR/api-server.log" "API Server Logs"
            ;;
        2)
            view_log "$LOG_DIR/web-server.log" "Web Server Logs"
            ;;
        3)
            sudo less +G /var/log/nginx/access.log
            ;;
        4)
            sudo less +G /var/log/nginx/error.log
            ;;
        5)
            tail_all
            ;;
        6)
            clear
            echo -e "${BLUE}Service Status${NC}"
            echo "=============="
            check_service "api-server"
            check_service "web-server"
            
            # Check nginx
            if systemctl is-active --quiet nginx; then
                echo -e "${GREEN}✓ Nginx is running${NC}"
            else
                echo -e "${YELLOW}✗ Nginx is not running${NC}"
            fi
            
            # Check ports
            echo ""
            echo -e "${BLUE}Port Status${NC}"
            echo "==========="
            for port in 3001 5613 5614 80 443; do
                if ss -tlnp 2>/dev/null | grep -q ":$port "; then
                    echo -e "${GREEN}✓ Port $port is listening${NC}"
                else
                    echo -e "${YELLOW}✗ Port $port is not listening${NC}"
                fi
            done
            
            echo ""
            echo "Press Enter to continue..."
            read -r
            ;;
        q|Q)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            sleep 1
            ;;
    esac
done