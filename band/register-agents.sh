#!/usr/bin/env bash
# ============================================================
# register-agents.sh
# Registers the three dental agents on Band.ai platform.
# You need a Band.ai Human API key to run this.
# Provides instructions for setting up Featherless as the LLM.
# ============================================================

set -euo pipefail

BAND_API="https://app.band.ai/api/v1/me/agents/register"

echo "============================================"
echo "  Band.ai Dental Agent Registration Script"
echo "============================================"
echo ""

if [ -z "${BAND_API_KEY:-}" ]; then
  echo "Error: BAND_API_KEY environment variable is not set."
  echo ""
  echo "Usage:"
  echo "  BAND_API_KEY=your_key_here ./register-agents.sh"
  echo ""
  echo "Get your API key from: https://band.ai/settings"
  exit 1
fi

AGENTS_DIR="$(dirname "$0")/agents"

for file in "$AGENTS_DIR"/*.json; do
  name=$(jq -r '.name' "$file")
  description=$(jq -r '.description' "$file")

  echo "Registering $name..."

  RESPONSE=$(curl -s -X POST "$BAND_API" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $BAND_API_KEY" \
    -d "{
      \"agent\": {
        \"name\": \"$name\",
        \"description\": \"$description\"
      }
    }")

  AGENT_ID=$(echo "$RESPONSE" | jq -r '.data.agent.id // empty')
  AGENT_KEY=$(echo "$RESPONSE" | jq -r '.data.credentials.api_key // empty')

  if [ -n "$AGENT_ID" ] && [ -n "$AGENT_KEY" ]; then
    echo "  ✓ Registered: $name"
    echo "    Agent ID:   $AGENT_ID"
    echo "    Agent Key:  $AGENT_KEY"
    echo ""
    echo "    Add to .env:"
    echo "    VITE_${name^^}_UUID=$AGENT_ID"
    echo ""
    echo "    ⚠️  The agent API key is only shown once. Store it securely!"
    echo ""
  else
    echo "  ✗ Failed to register $name"
    echo "    Response: $RESPONSE"
    echo ""
  fi
done

echo "============================================"
echo "  Registration complete."
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Add the agent UUIDs to your .env file"
echo "  2. Deploy the agent runner service (see agent-runner/)"
echo "  3. Set VITE_BAND_API_KEY in .env for telemetry"
echo "  4. Set VITE_FEATHERLESS_API_KEY in .env for LLM calls"
echo ""
