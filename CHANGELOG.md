# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2025-08-16

- Added support for Monuments and Discordant Stars
- Maximum players changed to 10 instead of 8
- Player name is now optional (shows faction instead)

## [1.2.1] - 2025-08-13

- Added automatic games directory creation for improved reliability

## [1.2.0] - 2025-08-11

### Added
- **Auto-Update System**
  - Automatic version checking after server startup
  - Interactive update prompts with user confirmation
  - Git-based automatic updates for repository installations
  - Version checking for manual download installations
  - Automatic backup creation before updates
  - Dependency management during updates

- **Factions**
  - All Prophecy of Kings factions implemented
  - Codex faction The Council Keleres implemented

### Changed
- Updated graphics for all tokens and cards

### Technical
- Added `simple-git` dependency for Git operations
- Added `axios` dependency for GitHub API integration
- Implemented dual-mode update system (Git auto-update vs. manual instructions)
- Enhanced server startup with update checking capabilities

## [1.1.0] - 2025-08-10

### Added
- **Prophecy of Kings Expansion Support**
  - New faction icons and assets for Prophecy of Kings factions
  - Enhanced card management system for expansion content
  - Support for additional objective types and scoring mechanics

### Changed
- **Major UI/UX Overhaul**
  - Complete redesign of the user interface
  - Improved card layout and visual presentation
  - Enhanced button designs and interactive elements
  - Better responsive design for various screen sizes

- **Core System Improvements**
  - Restructured game data management
  - Enhanced scoring and objective tracking
  - Improved card addition and editing functionality
  - Better game state persistence

### Technical
- Upgraded to Express.js 4.17.1
- Upgraded to Socket.IO 4.8.1
- Improved server architecture and performance
- Enhanced real-time communication capabilities

### Assets
- Added comprehensive faction icon set
- New button designs and UI elements
- Enhanced card backgrounds and visual elements
- Improved media organization and structure

---

## [1.0.0] - 2020-02-05

### Added
- **Initial Release**
  - Basic web application for public objectives tracking
  - Core scoring and objective management functionality
  - Card management system for base game content
  - Real-time updates using Socket.IO
  - Express.js backend server
  - Basic UI with essential game management features

### Features
- Objective card tracking and management
- Score calculation and VP tracking
- Game state management and persistence
- Basic faction support for core game
- Responsive web interface
- Card addition, editing, and deletion capabilities

---

## Unreleased

### Planned
- Additional expansion support
- Enhanced analytics and statistics
- User accounts and game history
- Mobile app version
- Advanced game customization options
