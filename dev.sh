#!/bin/bash
set -e

echo "=================================================="
echo "🚀 Starting PiCloud Management Console (Dev Mode)"
echo "Target Pi: 192.168.1.151 (pottapk.win)"
echo "=================================================="

# Start backend in background
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

echo "Starting Backend API on http://localhost:5005..."
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 5005 --reload &
BACKEND_PID=$!

# Trap ctrl-c to kill backend
trap "kill $BACKEND_PID" EXIT

# Start frontend
cd ../frontend
echo "Starting Next.js Frontend on http://localhost:3000..."
npm run dev
