# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-19

### 🔒 Security
- **CRITICAL**: Fixed 16 security vulnerabilities in dependencies
- **HIGH**: Updated Socket.IO from v2.3.0 to v4.8.1 (addresses multiple CVEs)
- **HIGH**: Added XSS protection with HTML escaping function
- **MEDIUM**: Removed vulnerable dependencies (`fs`, `http` packages)

### 🐛 Bug Fixes
- **CRITICAL**: Fixed infinite loop bug in card update handler (line 29)
  - Changed `for (var i = 0; jsonData[cardStageIndex].cards.length; i++)` 
  - To `for (var i = 0; i < jsonData[cardStageIndex].cards.length; i++)`
- **CRITICAL**: Fixed array index mismatch in score calculation (lines 158-162)
  - Stage 2 cards loop now uses correct array length instead of Stage 1 length
  - Prevents array out-of-bounds errors when stages have different card counts
- **MEDIUM**: Fixed error handling where variables could be undefined in catch blocks
  - Variables now properly declared before try-catch
  - Added meaningful error messages with actual error details

### ✨ Features
- **NEW**: Cross-platform compatibility (Windows, macOS, Linux)
- **NEW**: Enhanced startup script (`start.js`) with proper process management
- **NEW**: HTML escaping utility function to prevent XSS attacks
- **NEW**: Proper npm scripts for development and production

### 🔧 Improvements
- **Dependencies**: Cleaned up package.json by removing unnecessary packages
- **Security**: Applied HTML escaping to critical innerHTML usage
- **Documentation**: Updated README with cross-platform installation instructions
- **Project Structure**: Added proper npm scripts and startup commands

### 🏗️ Infrastructure
- **Scripts**: Added `npm start` and `npm run dev` commands
- **Compatibility**: Maintained backward compatibility with existing macOS setup
- **Error Handling**: Improved error logging with actual error messages
- **Process Management**: Added graceful shutdown handling in startup script

### 📋 Technical Details

#### Security Vulnerabilities Fixed:
- `xmlhttprequest-ssl` - Critical code injection vulnerability
- `path-to-regexp` - High severity ReDoS vulnerability  
- `qs` - High severity prototype pollution
- `send` - XSS template injection vulnerability
- `ws` - DoS and ReDoS vulnerabilities
- `debug` - Regular expression DoS
- `parseuri` - ReDoS vulnerability
- `cookie` - Out of bounds character acceptance

#### Breaking Changes:
- Socket.IO upgraded from v2 to v4 (may require client-side updates)
- Server now runs on port 3000 by default (was configurable via Apache)

#### Migration Guide:
- For existing users: Run `npm install` to update dependencies
- Use `npm start` or `npm run dev` instead of `startserver.command`
- Update client URLs from `http://localhost/tvajlajt` to `http://localhost:3000`

### 🔍 Testing
- All syntax checks pass
- Zero npm security vulnerabilities reported
- Cross-platform startup verified
- Error handling edge cases tested

---

## [1.0.0] - Previous Release
- Initial release with basic Twilight Imperium 4 objectives tracking
- macOS-specific installation and setup
- Basic Socket.IO real-time updates
- Objective card management and scoring system