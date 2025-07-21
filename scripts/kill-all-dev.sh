#!/bin/bash

# Kill all development processes comprehensively

echo "Stopping all development processes..."

# Check if PM2 is managing any processes
if command -v pm2 &> /dev/null; then
    echo "Checking PM2 processes..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
fi

# Kill turbo daemon first
echo "Stopping turbo daemon..."
pkill -f "turbo.*daemon" 2>/dev/null || true

# Kill all pnpm dev processes
echo "Stopping pnpm processes..."
pkill -f "pnpm.*dev" 2>/dev/null || true
pkill -f "pnpm run" 2>/dev/null || true

# Kill turbo processes
echo "Stopping turbo processes..."
pkill -f "turbo run" 2>/dev/null || true

# Kill tsx watch processes
echo "Stopping tsx watch..."
pkill -f "tsx watch" 2>/dev/null || true

# Kill vite processes
echo "Stopping vite..."
pkill -f vite 2>/dev/null || true

# Kill any remaining node processes in the project directory
echo "Stopping remaining node processes..."
pkill -f "node.*turbo-template" 2>/dev/null || true

# Kill esbuild service workers
echo "Stopping esbuild services..."
pkill -f "esbuild.*service" 2>/dev/null || true

# Give processes time to exit gracefully
sleep 2

# Force kill any stubborn processes
echo "Force killing any remaining processes..."
pkill -9 -f "turbo.*daemon" 2>/dev/null || true
pkill -9 -f "pnpm.*dev" 2>/dev/null || true
pkill -9 -f "tsx watch" 2>/dev/null || true
pkill -9 -f vite 2>/dev/null || true

echo "All development processes stopped."

# Show any remaining processes
remaining=$(ps aux | grep -E "turbo|pnpm|tsx|vite|esbuild" | grep -v grep | grep -v kill-all-dev)
if [ -n "$remaining" ]; then
    echo ""
    echo "Warning: Some processes may still be running:"
    echo "$remaining"
else
    echo "No development processes remaining."
fi