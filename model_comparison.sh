#!/bin/bash

# Load API key from .env
OPENROUTER_API_KEY=$(grep OPENROUTER_API_KEY .env | cut -d '=' -f2)

# Output file
OUTPUT_FILE="model_comparison_results.txt"

# Test timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Common prompts
SYSTEM_PROMPT="You are a helpful AI assistant that provides clear, accurate, and concise responses."
USER_PROMPT="Explain the concept of quantum entanglement in simple terms that a high school student could understand."

# Function to extract content from JSON response
extract_content() {
    local response="$1"
    # Use perl for better JSON content extraction
    echo "$response" | perl -0777 -ne 'print $1 if /"content":"(.*?)","refusal"/s' | \
    perl -pe 's/\\n/\n/g' | \
    perl -pe 's/\\\\/\\/g' | \
    perl -pe 's/\\"/"/g' | \
    sed 's/^[[:space:]]*//g'
}

# Function to make API request and save response
test_model() {
    local model=$1
    echo "Testing $model..."
    
    # Make API request
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
            "content": "'"$SYSTEM_PROMPT"'"
          },
          {
            "role": "user",
            "content": "'"$USER_PROMPT"'"
          }
        ]
      }')
    
    # Extract the content
    content=$(extract_content "$response")
    
    # Write to output file
    echo -e "\n=== Model: $model ===" >> "$OUTPUT_FILE"
    echo "Timestamp: $TIMESTAMP" >> "$OUTPUT_FILE"
    echo -e "\nResponse:" >> "$OUTPUT_FILE"
    if [[ -n "$content" ]]; then
        echo -e "$content" >> "$OUTPUT_FILE"
    else
        echo "Error: Could not extract response content. Raw response:" >> "$OUTPUT_FILE"
        echo "$response" >> "$OUTPUT_FILE"
    fi
    
    # Extract and format token usage
    usage=$(echo "$response" | grep -o '"usage":{[^}]*}' | sed 's/"usage"://' | tr -d '{}' | sed 's/"//g' | tr ',' '\n')
    echo -e "\nToken Usage:" >> "$OUTPUT_FILE"
    if [[ -n "$usage" ]]; then
        echo "$usage" | sed 's/^/  /' >> "$OUTPUT_FILE"
    else
        echo "  No token usage information available" >> "$OUTPUT_FILE"
    fi
    
    echo -e "\n----------------------------------------\n" >> "$OUTPUT_FILE"
}

# Create header in output file
cat > "$OUTPUT_FILE" << EOL
LLM Model Comparison Results
===========================
Date: $TIMESTAMP

System Prompt: $SYSTEM_PROMPT
User Prompt: $USER_PROMPT

----------------------------------------

EOL

# Test each model
models=(
    "anthropic/claude-3-sonnet"
    "gryphe/mythomax-l2-13b"
    "google/gemini-flash-1.5"
)

for model in "${models[@]}"; do
    test_model "$model"
    # Add a small delay between requests
    sleep 2
done

echo "Testing complete. Results saved to $OUTPUT_FILE"
