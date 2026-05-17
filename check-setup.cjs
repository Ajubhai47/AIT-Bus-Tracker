const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 AIT Bus Tracking System - Configuration Check\n');

// Check Node.js version
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js: ${nodeVersion}`);
} catch (error) {
  console.log('❌ Node.js: Not found or not in PATH');
  process.exit(1);
}

// Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm: v${npmVersion}`);
} catch (error) {
  console.log('❌ npm: Not found');
  process.exit(1);
}

// Check if package.json exists
if (fs.existsSync('package.json')) {
  console.log('✅ package.json: Found');
} else {
  console.log('❌ package.json: Not found');
  process.exit(1);
}

// Check if node_modules exists
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules: Dependencies installed');
} else {
  console.log('⚠️  node_modules: Dependencies not installed - run "npm install"');
}

// Check environment file
if (fs.existsSync('.env')) {
  console.log('✅ .env: Environment file found');
} else {
  console.log('⚠️  .env: Environment file not found (using defaults)');
}

// Check server files
const serverFiles = ['server/index.ts', 'server/routes.ts', 'server/mongo.ts'];
let allServerFilesExist = true;

serverFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: Found`);
  } else {
    console.log(`❌ ${file}: Missing`);
    allServerFilesExist = false;
  }
});

// Check client files
const clientFiles = ['client/src/App.tsx', 'client/index.html'];
let allClientFilesExist = true;

clientFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: Found`);
  } else {
    console.log(`❌ ${file}: Missing`);
    allClientFilesExist = false;
  }
});

console.log('\n📋 Summary:');
if (allServerFilesExist && allClientFilesExist) {
  console.log('🎉 All required files found! You can start the application.');
  console.log('\n🚀 To start:');
  console.log('   Windows: Double-click start.bat');
  console.log('   Mac/Linux: ./start.sh');
  console.log('   Manual: npm run dev');
  console.log('\n🌐 Then open: http://localhost:5000');
} else {
  console.log('⚠️  Some files are missing. Please check the installation.');
}

console.log('\n💡 Need help? Check README.md for detailed instructions.');