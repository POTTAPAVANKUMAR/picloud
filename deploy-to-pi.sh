#!/bin/bash
set -e

PI_HOST="192.168.1.151"
PI_USER="pavankumarpotta"
REMOTE_DIR="~/picloud-portal"

echo "=================================================="
echo "🚀 Deploying PiCloud Management Console to Raspberry Pi"
echo "Host: ${PI_USER}@${PI_HOST}"
echo "=================================================="

# 1. Sync files to Pi
echo "📦 Syncing codebase to Pi..."
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'venv' --exclude '__pycache__' ./ ${PI_USER}@${PI_HOST}:${REMOTE_DIR}

# 2. Build and start containers on the Pi
echo "🐳 Building & launching containers on Raspberry Pi..."
ssh ${PI_USER}@${PI_HOST} "cd ${REMOTE_DIR} && docker compose down 2>/dev/null || true && docker compose up --build -d"

echo "=================================================="
echo "✅ PiCloud Management Console deployed successfully!"
echo "Local Pi Web UI: http://${PI_HOST}:3005"
echo "Backend API:    http://${PI_HOST}:5005"
echo "To expose on Cloudflare Tunnel, map console.pottapk.win -> localhost:3005"
echo "=================================================="
