#!/bin/bash

echo "Building Cluadestrate Agent for Linux..."
echo

cd "$(dirname "$0")/.."

echo "Installing dependencies..."
npm install

echo
echo "Compiling TypeScript..."
npm run build

echo
echo "Building Linux x64 executable..."
npx pkg . --target node18-linux-x64 --output dist/bin/cluadestrate-agent-linux-x64

echo
echo "Building Linux ARM64 executable (for Raspberry Pi)..."
npx pkg . --target node18-linux-arm64 --output dist/bin/cluadestrate-agent-linux-arm64

echo
echo "Build complete!"
echo "Outputs:"
echo "  - dist/bin/cluadestrate-agent-linux-x64"
echo "  - dist/bin/cluadestrate-agent-linux-arm64"
echo

# Make executables
chmod +x dist/bin/cluadestrate-agent-linux-*
