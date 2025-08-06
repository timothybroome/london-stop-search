#!/bin/bash

# London Stop Search Data Processing Pipeline
# This script runs all data processing steps in sequence:
# 1. Download raw data from police.uk API
# 2. Enrich data with borough information
# 3. Normalize data for optimized client-side usage

set -e  # Exit on any error

echo "🚀 Starting London Stop Search data processing pipeline..."
echo "=================================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root directory
cd "$PROJECT_ROOT"

echo ""
echo "📥 Step 1: Downloading raw data from police.uk API..."
echo "---------------------------------------------------"
npx ts-node scripts/downloadData.ts

if [ $? -eq 0 ]; then
    echo "✅ Data download completed successfully"
else
    echo "❌ Data download failed"
    exit 1
fi

echo ""
echo "🏘️  Step 2: Enriching data with borough information..."
echo "----------------------------------------------------"
npx ts-node scripts/enrich-add-borough.ts

if [ $? -eq 0 ]; then
    echo "✅ Data enrichment completed successfully"
else
    echo "❌ Data enrichment failed"
    exit 1
fi

echo ""
echo "⚡ Step 3: Normalizing data for optimized performance..."
echo "-----------------------------------------------------"
node scripts/normalize-data.js

if [ $? -eq 0 ]; then
    echo "✅ Data normalization completed successfully"
else
    echo "❌ Data normalization failed"
    exit 1
fi

echo ""
echo "🎉 All data processing steps completed successfully!"
echo "=================================================="
echo ""
echo "📊 Data pipeline summary:"
echo "  • Raw data downloaded to: ./data/"
echo "  • Enriched data saved to: ./data-enriched/"
echo "  • Normalized data ready at: ./public/data-normalized.json"
echo ""
echo "🚀 Your London Stop Search dashboard is ready to run!"
echo "   Run 'npm run dev' to start the development server"
