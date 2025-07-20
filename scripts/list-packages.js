#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getTurboPackages() {
  try {
    // Use pnpm to list workspaces instead
    const output = execSync('pnpm list --json --recursive --depth=0', { encoding: 'utf8' });
    const data = JSON.parse(output);
    
    // Convert pnpm format to our format
    return data.map(pkg => ({
      name: pkg.name,
      path: pkg.path.replace(process.cwd() + '/', '')
    })).filter(pkg => pkg.name && pkg.name !== 'uber-template'); // Skip root
  } catch (error) {
    console.error('Error listing packages:', error.message);
    return [];
  }
}

function getPackageInfo(packagePath) {
  try {
    const packageJsonPath = path.join(process.cwd(), packagePath, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    return {
      description: packageJson.description || 'No description provided',
      version: packageJson.version || '0.0.0',
      scripts: Object.keys(packageJson.scripts || {}),
      private: packageJson.private || false,
      type: packagePath.startsWith('apps/') ? 'APP' : 'PACKAGE'
    };
  } catch (error) {
    return {
      description: 'Could not read package.json',
      version: 'unknown',
      scripts: [],
      private: true,
      type: 'UNKNOWN'
    };
  }
}

function getPackageDetails(packageName) {
  try {
    const output = execSync(`pnpm turbo ls ${packageName} 2>/dev/null`, { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => !line.includes('turbo 2.5.4'));
    
    const dependsLine = lines.find(line => line.includes('depends on:'));
    const dependencies = dependsLine 
      ? dependsLine.split('depends on:')[1].trim().split(', ').filter(Boolean)
      : [];
    
    const tasksIndex = lines.findIndex(line => line.includes('tasks:'));
    const tasks = tasksIndex !== -1 
      ? lines.slice(tasksIndex + 1)
          .filter(line => line.trim() && line.includes(': '))
          .map(line => {
            const [name, command] = line.trim().split(': ');
            return { name, command };
          })
      : [];
    
    return { dependencies, tasks };
  } catch (error) {
    return { dependencies: [], tasks: [] };
  }
}

function main() {
  console.log('\n🚀 Turborepo Workspace Overview\n');
  
  const packages = getTurboPackages();
  
  if (packages.length === 0) {
    console.log('No packages found.');
    return;
  }
  
  // Group by type
  const apps = packages.filter(pkg => pkg.path.startsWith('apps/'));
  const pkgs = packages.filter(pkg => pkg.path.startsWith('packages/'));
  
  // Display Apps
  if (apps.length > 0) {
    console.log('📱 APPLICATIONS\n');
    apps.forEach(pkg => {
      const info = getPackageInfo(pkg.path);
      const details = getPackageDetails(pkg.name);
      
      console.log(`  ${pkg.name}`);
      console.log(`  └─ 📁 ${pkg.path}`);
      console.log(`  └─ 📝 ${info.description}`);
      console.log(`  └─ 🏷️  v${info.version}`);
      
      if (details.dependencies.length > 0) {
        console.log(`  └─ 📦 Depends on: ${details.dependencies.join(', ')}`);
      }
      
      if (info.scripts.length > 0) {
        console.log(`  └─ ⚡ Scripts: ${info.scripts.slice(0, 5).join(', ')}${info.scripts.length > 5 ? '...' : ''}`);
      }
      
      console.log('');
    });
  }
  
  // Display Packages
  if (pkgs.length > 0) {
    console.log('📦 PACKAGES\n');
    pkgs.forEach(pkg => {
      const info = getPackageInfo(pkg.path);
      const details = getPackageDetails(pkg.name);
      
      console.log(`  ${pkg.name}`);
      console.log(`  └─ 📁 ${pkg.path}`);
      console.log(`  └─ 📝 ${info.description}`);
      console.log(`  └─ 🏷️  v${info.version}`);
      
      if (details.dependencies.length > 0) {
        console.log(`  └─ 📦 Depends on: ${details.dependencies.join(', ')}`);
      }
      
      if (info.scripts.length > 0) {
        console.log(`  └─ ⚡ Scripts: ${info.scripts.slice(0, 5).join(', ')}${info.scripts.length > 5 ? '...' : ''}`);
      }
      
      console.log('');
    });
  }
  
  // Summary
  console.log(`📊 SUMMARY: ${apps.length} apps, ${pkgs.length} packages, ${packages.length} total\n`);
  
  // Quick commands
  console.log('🔧 QUICK COMMANDS:');
  console.log('  pnpm turbo ls                    # Basic package list');
  console.log('  pnpm turbo ls <package-name>     # Package details');
  console.log('  pnpm list --recursive --depth=0  # All dependencies');
  console.log('  node scripts/list-packages.js    # This detailed view');
  console.log('');
}

main();
