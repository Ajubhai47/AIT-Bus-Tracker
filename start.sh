#!/bin/bash

echo "=========================================="
echo "    AIT Bus Tracking System Startup"
echo "=========================================="
echo

echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "Node.js found: $(node --version)"

echo
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "=========================================="
echo "Starting AIT Bus Tracking System..."
echo "=========================================="
echo "Server will be available at: http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo

npm run dev