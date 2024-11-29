#!/bin/bash

# Configuration - Edit models here
MODELS=(
    "anthropic/claude-3-sonnet"
    "gryphe/mythomax-l2-13b"
    "google/gemini-flash-1.5"
    "openai/gpt-4o-mini"
)

# Load API key from .env
OPENROUTER_API_KEY=$(grep OPENROUTER_API_KEY .env | cut -d '=' -f2)

# Output file
OUTPUT_FILE="model_comparison_results.txt"

# Test timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to extract content from JSON response
extract_content() {
    local response="$1"
    echo "$response" | perl -0777 -ne 'print $1 if /"content":"(.*?)","refusal"/s' | \
    perl -pe 's/\\n/\n/g' | \
    perl -pe 's/\\\\/\\/g' | \
    perl -pe 's/\\"/"/g' | \
    sed 's/^[[:space:]]*//g'
}

# Function to log API response
log_response() {
    local model=$1
    local operation=$2
    local response=$3
    local logfile="api_logs/${operation}.log"
    
    # Create log entry with token usage
    echo "=== $operation: $model ===" >> "$logfile"
    echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")" >> "$logfile"
    echo "Response: $response" >> "$logfile"
    
    # Extract and log token usage
    local usage=$(echo "$response" | grep -o '"usage":{[^}]*}' | sed 's/"usage"://' | tr -d '{}' | sed 's/"//g')
    echo "Token Usage: $usage" >> "$logfile"
    echo "----------------------------------------" >> "$logfile"
}

# Function to test debate message generation
test_debate_message() {
    local model=$1
    echo "Testing debate message for $model..."
    
    response=$(curl -s 'https://openrouter.ai/api/v1/chat/completions' \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENROUTER_API_KEY" \
      -H "HTTP-Referer: http://localhost:5173" \
      -H "X-Title: Model Comparison Test" \
      -d '{
        "model": "'"$model"'",
        "messages": [
          {
            "role": "system",
            "content": "You are Logical Larry, debating against the topic. Keep responses under 3 sentences."
          },
          {
            "role": "user",
            "content": "The topic is: \"Jesus Christ'\''s resurrection is a historical fact that cannot be denied\". Start with a quick opening argument against the topic."
          }
        ],
        "temperature": 0.7,
        "max_tokens": 500
      }')
    
    # Log the response
    mkdir -p api_logs
    log_response "$model" "debate_message" "$response"
    
    echo -e "\n=== Debate Message Test: $model ===" >> "$OUTPUT_FILE"
    echo "Timestamp: $TIMESTAMP" >> "$OUTPUT_FILE"
    echo -e "\nResponse:" >> "$OUTPUT_FILE"
    content=$(extract_content "$response")
    echo -e "$content" >> "$OUTPUT_FILE"
    echo -e "\nToken Usage:" >> "$OUTPUT_FILE"
    echo "$response" | grep -o '"usage":{[^}]*}' | sed 's/"usage"://' | tr -d '{}' | sed 's/"//g' | tr ',' '\n' | sed 's/^/  /' >> "$OUTPUT_FILE"
    echo -e "\n----------------------------------------\n" >> "$OUTPUT_FILE"
}

# Function to test message scoring
test_message_scoring() {
    local model=$1
    echo "Testing message scoring for $model..."
    
    response=$(curl -s 'https://openrouter.ai/api/v1/chat/completions' \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENROUTER_API_KEY" \
      -H "HTTP-Referer: http://localhost:5173" \
      -H "X-Title: Model Comparison Test" \
      -d '{
        "model": "'"$model"'",
        "messages": [
          {
            "role": "system",
            "content": "You are scoring a debate. Current scores - Assistant: 50%, User: 50%. Return ONLY a number between 0-100 representing the new score. No other text."
          },
          {
            "role": "assistant",
            "content": "I disagree. The resurrection of Jesus Christ is a matter of faith, not historical fact, and its validity is disputed by scholars and historians."
          }
        ],
        "temperature": 0.7,
        "max_tokens": 500
      }')
    
    # Log the response
    log_response "$model" "message_scoring" "$response"
    
    echo -e "\n=== Message Scoring Test: $model ===" >> "$OUTPUT_FILE"
    echo "Timestamp: $TIMESTAMP" >> "$OUTPUT_FILE"
    echo -e "\nResponse:" >> "$OUTPUT_FILE"
    content=$(extract_content "$response")
    echo -e "$content" >> "$OUTPUT_FILE"
    echo -e "\nToken Usage:" >> "$OUTPUT_FILE"
    echo "$response" | grep -o '"usage":{[^}]*}' | sed 's/"usage"://' | tr -d '{}' | sed 's/"//g' | tr ',' '\n' | sed 's/^/  /' >> "$OUTPUT_FILE"
    echo -e "\n----------------------------------------\n" >> "$OUTPUT_FILE"
}

# Function to test hint generation
test_hint_generation() {
    local model=$1
    echo "Testing hint generation for $model..."
    
    response=$(curl -s 'https://openrouter.ai/api/v1/chat/completions' \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENROUTER_API_KEY" \
      -H "HTTP-Referer: http://localhost:5173" \
      -H "X-Title: Model Comparison Test" \
      -d '{
        "model": "'"$model"'",
        "messages": [
          {
            "role": "system",
            "content": "You are an assistant providing hints for a debate. The topic is \"Jesus Christ'\''s resurrection is a historical fact that cannot be denied\". Provide a hint for the position \"for\"."
          },
          {
            "role": "user",
            "content": "Provide a helpful hint for debating the position \"for\" on this topic."
          }
        ],
        "temperature": 0.7,
        "max_tokens": 500
      }')
    
    # Log the response
    log_response "$model" "hint_generation" "$response"
    
    echo -e "\n=== Hint Generation Test: $model ===" >> "$OUTPUT_FILE"
    echo "Timestamp: $TIMESTAMP" >> "$OUTPUT_FILE"
    echo -e "\nResponse:" >> "$OUTPUT_FILE"
    content=$(extract_content "$response")
    echo -e "$content" >> "$OUTPUT_FILE"
    echo -e "\nToken Usage:" >> "$OUTPUT_FILE"
    echo "$response" | grep -o '"usage":{[^}]*}' | sed 's/"usage"://' | tr -d '{}' | sed 's/"//g' | tr ',' '\n' | sed 's/^/  /' >> "$OUTPUT_FILE"
    echo -e "\n----------------------------------------\n" >> "$OUTPUT_FILE"
}

# Create header in output file
cat > "$OUTPUT_FILE" << EOL
LLM Model Comparison Results - Operation Type Testing
=================================================
Date: $TIMESTAMP

This test compares different models across three types of operations:
1. Debate Message Generation
2. Message Scoring
3. Hint Generation

Models being tested:
$(printf '%s\n' "${MODELS[@]}" | sed 's/^/- /')

----------------------------------------

EOL

# Test each model for each operation type
for model in "${MODELS[@]}"; do
    test_debate_message "$model"
    sleep 2
    test_message_scoring "$model"
    sleep 2
    test_hint_generation "$model"
    sleep 2
done

echo "Testing complete. Results saved to $OUTPUT_FILE and logs saved to api_logs/"
