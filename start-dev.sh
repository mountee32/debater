#!/bin/bash

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid
    fi
}

echo "🔄 Cleaning up existing processes..."
# Kill any processes on the required ports
kill_port 3000  # Backend port
kill_port 5173  # Default Vite port
kill_port 5174  # Potential Vite fallback
kill_port 5175  # Potential Vite fallback
kill_port 5176  # Potential Vite fallback

echo "🧹 Clearing old logs..."
# Clear log files
> server/logs/startup.log
> server/logs/diagnostic.log

echo "🚀 Starting development servers..."
# Start the development servers
npm run dev

# Note: The actual npm run dev command uses concurrently to start both frontend and backend
