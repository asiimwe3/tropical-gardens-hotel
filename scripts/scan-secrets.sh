#!/usr/bin/env bash
# scripts/scan-secrets.sh
# A small repository scan helper to find obvious accidental secrets.
# Run locally: bash scripts/scan-secrets.sh

set -e
echo "Scanning for possible secrets in the repo (simple heuristics)..."

# Patterns to look for (not exhaustive)
PATTERNS=("PESAPAL" "PESAPAL_CONSUMER" "SECRET" "PRIVATE" "KEY=" "SERVE_ROLE" "service_role" "sb_" "supabase" "api_key" "API_KEY" "PASSWORD" "JWT_SECRET")

for p in "${PATTERNS[@]}"; do
  echo "\n--- Searching for pattern: $p ---"
  git grep -n -i -- "${p}" || true
done

echo "\nScan complete. This script uses simple text patterns — use a secret scanning tool for comprehensive checks."
