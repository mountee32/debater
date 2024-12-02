#!/bin/bash

# Define log directory relative to script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$SCRIPT_DIR/../logs"

# Create logs directory if it doesn't exist
echo "Creating logs directory at: $LOG_DIR"
mkdir -p "$LOG_DIR"

# Set permissions
echo "Setting permissions on logs directory"
chmod 755 "$LOG_DIR"

# Create diagnostic log file if it doesn't exist
DIAG_LOG="$LOG_DIR/diagnostic.log"
if [ ! -f "$DIAG_LOG" ]; then
    echo "Creating diagnostic log file"
    touch "$DIAG_LOG"
    chmod 644 "$DIAG_LOG"
fi

echo "Log initialization complete"
ls -la "$LOG_DIR"
