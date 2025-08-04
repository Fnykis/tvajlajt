#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Tvajlajt server...');
console.log('Server will be available at: http://localhost:3000');
console.log('To stop the server, press Ctrl+C\n');

// Start the server
const serverProcess = spawn('node', [path.join(__dirname, 'index.js')], {
    stdio: 'inherit'
});

// Handle server process exit
serverProcess.on('close', (code) => {
    console.log(`\nServer stopped with exit code ${code}`);
});

// Handle interrupt signal (Ctrl+C)
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});