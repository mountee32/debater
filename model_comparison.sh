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

# Function to store result in array
declare -A debate_results
declare -A scoring_results
declare -A hint_results

# Function to make API request
make_api_request() {
    local model=$1
    local messages=$2
    local operation=$3
    
    echo "Testing $operation for $model..."
    
    response=$(curl -s 'https://openrouter.ai/api/v1/chat/completions' \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENROUTER_API_KEY" \
      -H "HTTP-Referer: http://localhost:5173" \
      -H "X-Title: Model Comparison Test" \
      -d "{
        \"model\": \"$model\",
        \"messages\": $messages,
        \"temperature\": 0.7,
        \"max_tokens\": 500
      }")
    
    # Extract content
    content=$(extract_content "$response")
    
    # Store result in appropriate array
    case "$operation" in
        "debate_message")
            debate_results["$model"]="$content"
            ;;
        "message_scoring")
            # Extract just the number if it's a scoring response
            if [[ "$content" =~ ^[[:space:]]*([0-9]+)[[:space:]]*$ ]]; then
                scoring_results["$model"]="${BASH_REMATCH[1]}"
            else
                scoring_results["$model"]="N/A (invalid format)"
            fi
            ;;
        "hint_generation")
            hint_results["$model"]="$content"
            ;;
    esac
}

# Test each model
for model in "${MODELS[@]}"; do
    # Test debate message
    debate_messages='[
        {"role": "system", "content": "You are Logical Larry, debating against the topic. Keep responses under 3 sentences."},
        {"role": "user", "content": "The topic is: \"Jesus Christ'\''s resurrection is a historical fact that cannot be denied\". Start with a quick opening argument against the topic."}
    ]'
    make_api_request "$model" "$debate_messages" "debate_message"
    sleep 2

    # Test message scoring
    scoring_messages='[
        {"role": "system", "content": "You are scoring a debate. Current scores - Assistant: 50%, User: 50%. Return ONLY a number between 0-100 representing the new score. No other text."},
        {"role": "assistant", "content": "I disagree. The resurrection of Jesus Christ is a matter of faith, not historical fact, and its validity is disputed by scholars and historians."}
    ]'
    make_api_request "$model" "$scoring_messages" "message_scoring"
    sleep 2

    # Test hint generation
    hint_messages='[
        {"role": "system", "content": "You are an assistant providing hints for a debate. The topic is \"Jesus Christ'\''s resurrection is a historical fact that cannot be denied\". Provide a hint for the position \"for\"."},
        {"role": "user", "content": "Provide a helpful hint for debating the position \"for\" on this topic."}
    ]'
    make_api_request "$model" "$hint_messages" "hint_generation"
    sleep 2
done

# Create output file
{
    echo "Model Comparison Results"
    echo "======================="
    echo "Date: $TIMESTAMP"
    echo
    echo "Models Tested:"
    for model in "${MODELS[@]}"; do
        echo "- ${model##*/}"
    done
    echo
    
    # Print Debate Messages section
    echo "1. Debate Messages"
    echo "-----------------"
    for model in "${MODELS[@]}"; do
        echo "${model##*/}:"
        echo "${debate_results[$model]}"
        echo
    done
    
    # Print Message Scoring section
    echo "2. Message Scoring (0-100)"
    echo "-------------------------"
    # Find longest model name for padding
    max_len=0
    for model in "${MODELS[@]}"; do
        len=${#model}
        [[ $len -gt $max_len ]] && max_len=$len
    done
    max_len=$((max_len - 4))  # Subtract 4 to account for removing prefix
    
    # Print scores with aligned columns
    for model in "${MODELS[@]}"; do
        printf "%-${max_len}s: %s\n" "${model##*/}" "${scoring_results[$model]}"
    done
    echo
    
    # Print Hint Generation section
    echo "3. Hint Generation"
    echo "-----------------"
    for model in "${MODELS[@]}"; do
        echo "${model##*/}:"
        echo "${hint_results[$model]}"
        echo
    done
    
} > "$OUTPUT_FILE"

echo "Testing complete. Results saved to $OUTPUT_FILE"
