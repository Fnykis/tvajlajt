# Tvajlajt

A comprehensive web application for managing Twilight Imperium 4 objectives, scoring, and game state. Designed to run locally and provide real-time game management for board game sessions.

## Introduction

Tvajlajt is a web-based companion app for Twilight Imperium 4 that transforms your gaming experience by providing:

- **Real-time objective tracking** for Stage I and Stage II objectives
- **Live scoring system** with automatic VP calculations
- **Multi-device support** allowing players to view game state on phones while displaying on a main screen
- **Game timer functionality** with pause/resume capabilities
- **Cross-platform compatibility** running on Windows, macOS, and Linux

The app is designed to be displayed on a large screen (TV/monitor) while allowing all players on the same WiFi network to access it from their mobile devices. Only designated "Superusers" can modify objectives and scores, ensuring game integrity.

## Features

### 🎯 Objective Management
- **Stage I & II Objectives**: Pre-loaded with community-created objectives
- **Custom Objectives**: Add your own objectives following the established format
- **Objective Flipping**: Automatic and manual objective revelation
- **Secret Objectives**: Support for hidden objective cards

### 📊 Scoring System
- **Real-time VP Calculation**: Automatic victory point tracking
- **Faction Support**: All 17 base game factions included
- **Score History**: Track VP changes throughout the game
- **Winner Calculation**: Automatic determination of game winners

### ⏱️ Game Timer
- **Session Timer**: Track total game duration
- **Pause/Resume**: Pause timer during breaks
- **Auto-save**: Automatic game state preservation

### 🌐 Network Features
- **Local Network Access**: Accessible from any device on your WiFi
- **Real-time Updates**: Live synchronization across all connected devices
- **Socket.io Integration**: Efficient real-time communication

### 📱 Device Support
- **Desktop**: Full-featured interface for game masters
- **Mobile**: Responsive design for player access
- **Cross-browser**: Works on modern browsers

## Installation

### Prerequisites
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/en/)
- **npm** (comes with Node.js)

### Quick Start
1. **Clone or download** this repository
2. **Navigate** to the project directory in your terminal/command prompt
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the server**:
   ```bash
   npm start
   ```
5. **Access the app** at `http://localhost:3000`

### Alternative Startup
For enhanced startup with additional logging:
```bash
npm run dev
```

### Network Access
To allow other devices on your network to access the app:
1. Find your computer's local IP address (displayed in the console when starting)
2. Other devices can access via: `http://[YOUR_IP]:3000`
   - Example: `http://192.168.1.22:3000`

## Troubleshooting

### Common Issues

#### Server Won't Start
- **Port 3000 already in use**: 
  - Change the port in `index.js` (line ~1285)
  - Or kill the process using port 3000: `lsof -ti:3000 | xargs kill -9`

#### Can't Access from Other Devices
- **Firewall blocking**: Ensure your firewall allows connections on port 3000
- **Wrong IP address**: Verify the IP address shown in the console
- **Network restrictions**: Check if your router blocks local network communication

#### Objectives Not Loading
- **Corrupted data files**: Check `data_default.json` for valid JSON format
- **Missing files**: Ensure all required files are present in the project directory

#### Game State Not Saving
- **Permissions issue**: Ensure the `games/` directory is writable
- **Disk space**: Check available disk space
- **File corruption**: Verify `database.json` integrity

### Performance Issues

#### Slow Loading
- **Large game files**: Games with many objectives may load slower
- **Network congestion**: Reduce the number of connected devices
- **Browser cache**: Clear browser cache and refresh

#### Mobile Responsiveness
- **Small screens**: The app is designed for larger displays but works on mobile
- **Touch interactions**: Some features may require desktop for optimal use

### Data Management

#### Backup and Restore
- **Automatic backups**: Game states are automatically saved in the `games/` directory
- **Manual backup**: Copy `database.json` before major changes
- **Restore**: Replace `database.json` with a backup file

#### Custom Objectives
- **Adding objectives**: Follow the format in existing objectives
- **Unique IDs**: Ensure each objective has a unique identifier
- **Validation**: Test new objectives before using in live games

### Getting Help

If you encounter issues not covered here:
1. Check the console output for error messages
2. Verify all dependencies are installed correctly
3. Ensure you're using a supported Node.js version
4. Check the project's issue tracker for known problems

## System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **Node.js**: Version 14.0.0 or higher
- **Memory**: Minimum 512MB RAM
- **Storage**: 100MB free space
- **Network**: Local WiFi network for multi-device access

## License

This project is licensed under the ISC License.

---

*Tvajlajt - Making Twilight Imperium 4 more manageable, one objective at a time.*
