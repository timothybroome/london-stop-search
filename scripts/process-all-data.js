#!/usr/bin/env node

/**
 * London Stop Search Data Processing Pipeline
 * This script runs all data processing steps in sequence:
 * 1. Download raw data from police.uk API
 * 2. Enrich data with borough information  
 * 3. Normalize data for optimized client-side usage
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    log(`\n${colors.cyan}${description}${colors.reset}`);
    log(`${colors.yellow}${''.padEnd(description.length, '-')}${colors.reset}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`${colors.green}✅ ${description.replace(/^[📥🏘️⚡]\s*/, '')} completed successfully${colors.reset}`);
        resolve();
      } else {
        log(`${colors.red}❌ ${description.replace(/^[📥🏘️⚡]\s*/, '')} failed with exit code ${code}${colors.reset}`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      log(`${colors.red}❌ Error running command: ${error.message}${colors.reset}`);
      reject(error);
    });
  });
}

async function processAllData() {
  try {
    log(`${colors.bright}${colors.magenta}🚀 Starting London Stop Search data processing pipeline...${colors.reset}`);
    log(`${colors.bright}${''.padEnd(50, '=')}${colors.reset}`);

    // Step 1: Download data
    await runCommand('npx', ['ts-node', 'scripts/downloadData.ts'], '📥 Step 1: Downloading raw data from police.uk API...');

    // Step 2: Enrich data
    await runCommand('npx', ['ts-node', 'scripts/enrich-add-borough.ts'], '🏘️  Step 2: Enriching data with borough information...');

    // Step 3: Normalize data
    await runCommand('node', ['scripts/normalize-data.js'], '⚡ Step 3: Normalizing data for optimized performance...');

    // Success summary
    log(`\n${colors.bright}${colors.green}🎉 All data processing steps completed successfully!${colors.reset}`);
    log(`${colors.bright}${''.padEnd(50, '=')}${colors.reset}`);
    log(`\n${colors.cyan}📊 Data pipeline summary:${colors.reset}`);
    log(`  • Raw data downloaded to: ${colors.yellow}./data/${colors.reset}`);
    log(`  • Enriched data saved to: ${colors.yellow}./data-enriched/${colors.reset}`);
    log(`  • Normalized data ready at: ${colors.yellow}./public/data-normalized.json${colors.reset}`);
    log(`\n${colors.bright}${colors.green}🚀 Your London Stop Search dashboard is ready to run!${colors.reset}`);
    log(`   Run ${colors.cyan}'npm run dev'${colors.reset} to start the development server`);

  } catch (error) {
    log(`\n${colors.red}❌ Data processing pipeline failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the pipeline
processAllData();
