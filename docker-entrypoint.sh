#!/bin/sh
set -e

# Replace environment variables in env-config.js
# This allows runtime configuration in Kubernetes
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: '${VITE_API_URL:-http://localhost:8080}',
  VITE_WS_URL: '${VITE_WS_URL:-ws://localhost:8080}'
};
EOF

echo "Environment configuration injected:"
cat /usr/share/nginx/html/env-config.js

# Start nginx
exec "$@"
