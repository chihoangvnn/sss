#!/usr/bin/env node
/**
 * Helper script to setup different domain configurations
 * Usage: node scripts/setup-domain.js [replit|custom|development]
 */

const fs = require('fs');
const path = require('path');

const configurations = {
  development: {
    file: '.env.local.example',
    description: 'Development configuration (localhost)'
  },
  replit: {
    file: '.env.replit',
    description: 'Replit backend configuration (.replit.dev domain)'
  },
  custom: {
    file: '.env.custom',
    description: 'Custom domain configuration'
  }
};

function setupDomain(configType) {
  if (!configurations[configType]) {
    console.error(`❌ Invalid configuration type: ${configType}`);
    console.log('Available configurations:');
    Object.entries(configurations).forEach(([key, config]) => {
      console.log(`  - ${key}: ${config.description}`);
    });
    process.exit(1);
  }

  const sourceFile = configurations[configType].file;
  const targetFile = '.env.local';
  
  const sourcePath = path.join(__dirname, '..', sourceFile);
  const targetPath = path.join(__dirname, '..', targetFile);

  try {
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source configuration file not found: ${sourceFile}`);
      process.exit(1);
    }

    // Backup existing .env.local if it exists
    if (fs.existsSync(targetPath)) {
      const backupPath = `${targetPath}.backup.${Date.now()}`;
      fs.copyFileSync(targetPath, backupPath);
      console.log(`📁 Backed up existing .env.local to ${path.basename(backupPath)}`);
    }

    // Copy new configuration
    fs.copyFileSync(sourcePath, targetPath);
    
    console.log(`✅ Successfully configured for: ${configurations[configType].description}`);
    console.log(`📄 Configuration copied from: ${sourceFile}`);
    console.log(`📄 Active configuration: .env.local`);
    
    if (configType === 'custom') {
      console.log('\n⚠️  IMPORTANT: Update the domain URLs in .env.local with your actual custom domain!');
    }

    console.log('\n🚀 Next steps:');
    console.log('1. Review the configuration in .env.local');
    console.log('2. Update any placeholder values');
    console.log('3. Run npm run dev to test the configuration');
    
  } catch (error) {
    console.error(`❌ Error setting up configuration:`, error.message);
    process.exit(1);
  }
}

// Command line interface
const configType = process.argv[2];

if (!configType) {
  console.log('🔧 Domain Configuration Setup Tool');
  console.log('\nUsage: node scripts/setup-domain.js [configuration]');
  console.log('\nAvailable configurations:');
  Object.entries(configurations).forEach(([key, config]) => {
    console.log(`  ${key}: ${config.description}`);
  });
  console.log('\nExample: node scripts/setup-domain.js replit');
  process.exit(0);
}

setupDomain(configType);