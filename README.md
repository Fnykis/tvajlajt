![Tvajlajt](assets/media/tvajlajt.png)

A simple web application for managing Twilight Imperium 4 objectives and scoring. Designed to run locally and provide real-time game management. Players can connect to the session via their mobile device's browser to read objectives and view scoring.

The app is designed to be displayed on a large screen (TV/monitor) while allowing all players on the same WiFi network to access it from their mobile devices. Scoring and flipping cards can be done from any mobile device as long as they are "Superusers". Anyone can be superuser - let's trust each other (never said in a TI game).

## Features

### Objective Management
- **Stage I & II Objectives**: Pre-loaded with vanilla, PoK, Monuments and community-created objectives
- **Custom Objectives**: Add your own objectives following the established format
- **Objective Flipping**: Automatic and manual objective revelation
- **Secret Objectives**: Support for public secret objective cards

### Scoring System
- **Assign player scores**: Pre-loaded with vanilla, PoK, Codex and Discordant Stars factions
- **Real-time VP Calculation**: Automatic victory point tracking
- **No winning score cap**: End the game whenever
- **Winner Calculation**: Automatic determination of game winners

### Game Timer
- **Session Timer**: Track total game duration
- **Pause/Resume**: Pause timer during breaks
- **Auto-save**: Automatic game state preservation

### Network Features
- **Local Network Access**: Accessible from any device on your WiFi
- **Real-time Updates**: Live synchronization across all connected devices
- **Socket.io Integration**: Efficient real-time communication

### Device Support
- **Desktop**: Needed to run server locally
- **Mobile**: Responsive design for player access (although not completely trouble free)
- **Cross-browser**: Should work on all modern browsers

## Installation

### Prerequisites
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/en/)
- **npm** (comes with Node.js)

### Quick Start

#### Option 1: Git Clone (Recommended - Enables Auto-Updates)
1. **Open your terminal** and navigate to a preferred location
2. **Clone the repository**:
   ```bash
   git clone https://github.com/Fnykis/tvajlajt.git
   ```
3. **Navigate** to the project directory:
   ```bash
   cd tvajlajt
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start the server**:
   ```bash
   npm start
   ```
6. **Access the app** in your browser at `http://localhost:3000`

#### Option 2: Manual Download (No Auto-Updates)
1. **Download the ZIP file** from GitHub (click "Code" → "Download ZIP")
2. **Extract** the ZIP file to your desired location
3. **Navigate** to the extracted folder in your terminal/command prompt
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start the server**:
   ```bash
   npm start
   ```
6. **Access the app** at `http://localhost:3000`

> **Note**: Only Git clone installations support automatic updates. Manual downloads will still work for version checking but cannot auto-download updates.

### Network Access
To allow other devices on your network to access the app:
1. Find your computer's local IP address (displayed in the console when starting and in the main menu in the UI)
2. Other devices can access via: `http://[YOUR_IP]:3000`
   - Example: `http://192.168.1.22:3000`

## Adding custom objectives and factions

All objectives and factions are saved in the file database.json. This is where you can add your own data or edit existing data.
Follow the format in existing objectives and factions. You can add new categories (ie. a new expansion). The app will automatically recognise new categories.
**Custom content is preserved during updates but always save a backup of the database file to be sure.**

#### Custom objectives
For objectives, ensure each objective has a unique identifier.
#### Custom factions
To add an icon for the faction. Put it in assets/media/factions and name it the exact way you named it in database.json but without special characters and in lowercase. The file format should be PNG and the size is recommended to be 500 x 300 px. A Photoshop-file is available to make the token look like the pre-loaded factions'.

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
- **File corruption**: Verify `database.json` integrity

### Performance Issues

#### Mobile Responsiveness
- **Small screens**: The app is not yet fully implemented to use with smaller screens but navigating the UI should work fine on mobile

---

If you encounter issues not covered here:
1. Check the console output - both server and web browser have comprehensive logging
2. Verify all dependencies are installed correctly
3. Ensure you're using a supported Node.js version
4. Check the project's issue tracker for known problems
5. Report problems

###### _This app is partially created with the use of AI_
