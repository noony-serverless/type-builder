#!/bin/bash

echo "🚀 Starting UltraFastBuilder Dashboard..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Build the builder library
echo "📦 Building UltraFastBuilder library..."
cd packages/builder
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build the library"
    exit 1
fi

echo "✅ Library built successfully"
echo ""

# Start the dashboard server
echo "🌐 Starting dashboard server..."
cd ../clinic-tests
npm run serve
