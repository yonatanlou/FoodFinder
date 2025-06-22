#!/bin/bash

# FoodFinder Quick Start Script
# This script helps you set up and run the FoodFinder application locally

echo "🚀 FoodFinder Quick Start"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed ($(node --version))"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is installed ($(npm --version))"

# Check if configuration files exist
if [ ! -f "js/firebase-config.js" ]; then
    echo "⚠️  Firebase configuration not found."
    echo "📝 Please copy config-template.js to js/firebase-config.js and update with your credentials."
    echo "   cp config-template.js js/firebase-config.js"
    echo ""
    echo "🔧 Required setup:"
    echo "   1. Get Google Maps API key from: https://console.cloud.google.com/"
    echo "   2. Create Firebase project at: https://console.firebase.google.com/"
    echo "   3. Update js/firebase-config.js with your credentials"
    echo "   4. Update index.html with your Google Maps API key"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

# Install dependencies (if any)
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌐 Starting FoodFinder server..."
echo "📍 Server will be available at: http://localhost:8000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the server
node server.js 