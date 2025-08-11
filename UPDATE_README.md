# Tvajlajt Update System

This document explains how the automatic update system works in Tvajlajt.

## Overview

The update system automatically checks for newer versions of the application after the server starts and allows users to download and install updates directly from the terminal.

## How It Works

### Git Repository Installation (Auto-Updates Enabled)
1. **Automatic Check**: After the server starts, the system waits 2 seconds then checks GitHub for the latest release
2. **Version Comparison**: Compares the current version with the latest available version
3. **User Prompt**: If a newer version is available, shows a warning message and asks for confirmation
4. **Backup Creation**: Creates a backup of the current installation before updating
5. **Update Process**: Downloads the latest code from the repository and installs dependencies
6. **Server Restart**: Prompts the user to manually restart the server

### Manual Download Installation (Version Check Only)
1. **Automatic Check**: After the server starts, the system waits 2 seconds then checks GitHub for the latest release
2. **Version Comparison**: Compares the current version with the latest available version
3. **Update Notification**: If a newer version is available, shows update information and manual update instructions
4. **Manual Process**: User must manually download and install updates from GitHub

## Configuration

The update system can be configured in `update-config.js`:

```javascript
module.exports = {
    repository: {
        owner: 'Fnykis',        // GitHub username
        name: 'tvajlajt',       // Repository name
        branch: 'main'          // Default branch
    },
    update: {
        checkDelay: 2000,       // Delay before checking (milliseconds)
        autoCheck: true,        // Auto-check on startup
        promptUser: true        // Ask user before updating
    },
    backup: {
        enabled: true,          // Create backups before updating
        directory: './backups', // Backup storage location
        maxBackups: 5          // Maximum backups to keep
    }
};
```

## Prerequisites

- **For Auto-Updates**: The application must be running from a Git repository
- **For Version Checking**: Any installation (Git or manual download) can check for updates
- The repository must have an `origin` remote pointing to GitHub (for auto-updates)
- GitHub releases must be tagged with version numbers (e.g., v1.2.0)

## Update Process

### Git Repository Installation (Auto-Updates)
When an update is available:

1. **Warning Display**: Shows current and latest versions
2. **Backup Warning**: Reminds user to backup customizations
3. **User Confirmation**: Asks for confirmation (y/N)
4. **Backup Creation**: Creates timestamped backup archive
5. **Git Operations**: Fetches and resets to latest version
6. **Dependency Installation**: Runs `npm install`
7. **Completion**: Informs user to restart server

### Manual Download Installation (Version Check Only)
When an update is available:

1. **Update Notification**: Shows current and latest versions
2. **Installation Type Warning**: Informs user that auto-update is not available
3. **Manual Instructions**: Provides step-by-step manual update process
4. **Backup Reminder**: Reminds user to backup customizations before manual update
5. **Continue Option**: Allows user to continue with current version

## Backup System

- **Location**: `./backups/` directory
- **Format**: Compressed tar.gz archives
- **Contents**: All files except `node_modules`, `.git`, and backup directory
- **Cleanup**: Automatically removes old backups (keeps 5 most recent)

## Manual Update

To manually check for updates:

```javascript
const UpdateChecker = require('./update-checker');
const updateChecker = new UpdateChecker();
await updateChecker.checkForUpdates();
```

## Troubleshooting

### Common Issues

1. **"Not a git repository"**: Ensure the app is running from a Git repository
2. **"No origin remote found"**: Check that the repository has a GitHub remote
3. **Permission errors**: Ensure the process has write permissions to the directory
4. **Network errors**: Check internet connection and GitHub API access

### Recovery

If an update fails:
1. Check the backup directory for recent backups
2. Extract the backup and restore files
3. Restart the server

## Security Notes

- The system only pulls from the configured GitHub repository
- Updates are applied using Git's secure protocols
- Backups are created before any changes are made
- User confirmation is required before updating

## Dependencies

The update system requires these npm packages:
- `simple-git`: Git operations
- `axios`: HTTP requests to GitHub API

Install with: `npm install simple-git axios`
