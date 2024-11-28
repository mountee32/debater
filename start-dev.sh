#!/bin/bash

# Exit on any error
set -e

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check for required commands
if ! command_exists node; then
    log "Error: Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    log "Error: npm is not installed"
    exit 1
fi

# Navigate to project root
cd /home/andy/debater

# Install dependencies if needed
log "Installing dependencies..."
npm install

# Make server scripts executable
log "Setting up server scripts..."
chmod +x server/scripts/init-logs.sh

# Initialize logs directory and permissions
log "Initializing logs..."
cd server && npm run init-logs
cd ..

# Ensure environment variables are set
if [ ! -f .env ]; then
    log "Error: .env file not found"
    exit 1
fi

# Check if ENABLE_DIAGNOSTIC_LOGGING is set
if ! grep -q "ENABLE_DIAGNOSTIC_LOGGING=true" .env; then
    log "Warning: ENABLE_DIAGNOSTIC_LOGGING is not enabled in .env"
    log "Adding ENABLE_DIAGNOSTIC_LOGGING=true to .env"
    echo "ENABLE_DIAGNOSTIC_LOGGING=true" >> .env
fi

# Start the application
log "Starting application..."
log "Frontend will be available at http://localhost:5173"
log "Backend will be available at http://localhost:3000"
log "Diagnostic logs will be written to server/logs/diagnostic.log"

# Start the application with diagnostic output
npm run dev | tee -a server/logs/startup.log
