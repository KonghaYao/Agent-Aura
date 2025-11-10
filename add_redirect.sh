#!/bin/bash

# Script to dynamically add a redirect to netlify.toml
# Usage: ./add_redirect.sh <from> <to> [status] [force]
# Environment Variables:
#   AGENT_AURA_API_URL - API URL for redirects (required if not provided as argument)

set -e

# Check if netlify.toml exists
if [ ! -f "netlify.toml" ]; then
    echo "Error: netlify.toml not found in current directory"
    exit 1
fi

# Default values
FROM="${1:-/api/langgraph/}*"
TO="${2:-$AGENT_AURA_API_URL}${1}:splat"
STATUS="${3:-200}"
FORCE="${4:-true}"

# Validate required parameters
if [ -z "$FROM" ] || [ -z "$TO" ]; then
    echo "Usage: $0 <from> <to> [status] [force]"
    echo "Environment: AGENT_AURA_API_URL - API URL for redirects (required if not provided as argument)"
    echo "Examples:"
    echo "  AGENT_AURA_API_URL='https://prod-api.example.com/:splat' $0 '/api/langgraph/*'"
    echo "  $0 '/api/custom/*' 'https://custom-api.example.com/:splat' 200 true"
    exit 1
fi

# Create the new redirect block
NEW_REDIRECT="
[[redirects]]
from = \"$FROM\"
to = \"$TO\"
status = $STATUS
force = $FORCE
[redirects.headers]
X-From = \"Netlify\""

# Check if the redirect already exists
if grep -q "from = \"$FROM\"" netlify.toml; then
    echo "Redirect from '$FROM' already exists in netlify.toml"
    exit 1
fi

# Add the new redirect to the end of the file
echo "$NEW_REDIRECT" >> netlify.toml

echo "Successfully added redirect:"
echo "  from: $FROM"
echo "  to: $TO"
echo "  status: $STATUS"
echo "  force: $FORCE"
