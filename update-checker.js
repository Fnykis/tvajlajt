const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const axios = require('axios');
const readline = require('readline');

class UpdateChecker {
    constructor() {
        this.git = simpleGit();
        this.currentVersion = require('./package.json').version;
        this.config = require('./update-config');
        this.repoUrl = `https://api.github.com/repos/${this.config.repository.owner}/${this.config.repository.name}/releases/latest`;
        this.updateInProgress = false;
    }

    async checkForUpdates() {
        try {
            console.log('🔍 UPDATE: Checking for updates...');
            console.log('📦 UPDATE: Current version:', this.currentVersion);

            // Get the latest release from GitHub
            const response = await axios.get(this.repoUrl, {
                headers: {
                    'User-Agent': 'Tvajlajt-Update-Checker'
                }
            });

            const latestVersion = response.data.tag_name.replace('v', '');
            console.log('📦 UPDATE: Latest available version:', latestVersion);

            if (this.isNewerVersion(latestVersion, this.currentVersion)) {
                console.log('⚠️ UPDATE: New version available!');
                
                // Check if we're in a Git repository
                const isRepo = await this.git.checkIsRepo();
                if (isRepo) {
                    console.log('✅ UPDATE: Git repository detected - auto-update available');
                    await this.promptForUpdate(latestVersion);
                } else {
                    console.log('⚠️ UPDATE: Not a Git repository - manual update required');
                    await this.promptForManualUpdate(latestVersion);
                }
            } else {
                console.log('✅ UPDATE: You have the latest version');
            }
        } catch (error) {
            console.error('❌ UPDATE: Error checking for updates:', error.message);
        }
    }

    isNewerVersion(latest, current) {
        const latestParts = latest.split('.').map(Number);
        const currentParts = current.split('.').map(Number);
        
        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;
            
            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }
        return false;
    }

    async promptForUpdate(latestVersion) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n⚠️  UPDATE: New version available!');
        console.log('📦 UPDATE: Current version:', this.currentVersion);
        console.log('📦 UPDATE: Latest version:', latestVersion);
        console.log('\n⚠️  WARNING: This will replace all current files!');
        console.log('💾 UPDATE: Please backup any customizations before proceeding!');
        console.log('\n❓ UPDATE: Do you want to download and install the update? (y/N)');

        return new Promise((resolve) => {
            rl.question('', async (answer) => {
                rl.close();
                
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    console.log('✅ UPDATE: User confirmed update, proceeding...');
                    await this.performUpdate();
                } else {
                    console.log('❌ UPDATE: Update cancelled by user');
                }
                resolve();
            });
        });
    }

    async promptForManualUpdate(latestVersion) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n⚠️  UPDATE: New version available!');
        console.log('📦 UPDATE: Current version:', this.currentVersion);
        console.log('📦 UPDATE: Latest version:', latestVersion);
        console.log('\n⚠️  WARNING: This installation is not a Git repository');
        console.log('📥 UPDATE: Auto-update is not available');
        console.log('\n💡 UPDATE: To update manually:');
        console.log('   1. Visit: https://github.com/Fnykis/tvajlajt/releases');
        console.log('   2. Download the latest release ZIP file');
        console.log('   3. Extract and replace your current files');
        console.log('   4. Run "npm install" to update dependencies');
        console.log('   5. Restart the server');
        console.log('\n💾 UPDATE: Remember to backup your customizations first!');
        console.log('\n❓ UPDATE: Press Enter to continue...');

        return new Promise((resolve) => {
            rl.question('', (answer) => {
                rl.close();
                console.log('✅ UPDATE: Continuing with current version');
                resolve();
            });
        });
    }

    async performUpdate() {
        if (this.updateInProgress) {
            console.log('⚠️ UPDATE: Update already in progress');
            return;
        }

        this.updateInProgress = true;
        console.log('🚀 UPDATE: Starting update process...');

        try {
            // Create backup if enabled
            if (this.config.backup.enabled) {
                await this.createBackup();
            }

            // Check if we're in a git repository
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                console.log('❌ UPDATE: Not a git repository, cannot update');
                this.updateInProgress = false;
                return;
            }

            // Get current remote origin
            const remotes = await this.git.getRemotes();
            const originRemote = remotes.find(remote => remote.name === 'origin');
            
            if (!originRemote) {
                console.log('❌ UPDATE: No origin remote found');
                this.updateInProgress = false;
                return;
            }

            console.log('📥 UPDATE: Fetching latest changes...');
            await this.git.fetch('origin');

            // Get current branch
            const currentBranch = await this.git.branch();
            console.log('🌿 UPDATE: Current branch:', currentBranch.current);

            // Reset to origin/main (or master)
            const defaultBranch = await this.getDefaultBranch();
            console.log('🔄 UPDATE: Resetting to origin/', defaultBranch);

            await this.git.reset(['--hard', `origin/${defaultBranch}`]);
            console.log('✅ UPDATE: Repository updated successfully');

            // Install dependencies
            console.log('📦 UPDATE: Installing dependencies...');
            const { exec } = require('child_process');
            
            exec('npm install', { cwd: __dirname }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ UPDATE: Error installing dependencies:', error);
                } else {
                    console.log('✅ UPDATE: Dependencies installed successfully');
                }
                
                console.log('\n🎉 UPDATE: Update completed successfully!');
                console.log('⚠️  UPDATE: Please restart the server to apply changes');
                console.log('🔄 UPDATE: Use Ctrl+C to stop the server, then run "npm start" again');
                
                this.updateInProgress = false;
            });

        } catch (error) {
            console.error('❌ UPDATE: Error during update:', error.message);
            this.updateInProgress = false;
        }
    }

    async getDefaultBranch() {
        try {
            // Try to get the default branch from origin
            const result = await this.git.remote(['show', 'origin']);
            const match = result.match(/HEAD branch: (.+)/);
            return match ? match[1] : 'main';
        } catch (error) {
            console.log('⚠️ UPDATE: Could not determine default branch, using "main"');
            return 'main';
        }
    }

    async createBackup() {
        try {
            const backupDir = this.config.backup.directory;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `backup-${timestamp}`;
            const backupPath = path.join(backupDir, backupName);

            // Create backup directory if it doesn't exist
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            console.log('💾 UPDATE: Creating backup...');
            
            // Create a tar.gz backup of the current directory (excluding node_modules and .git)
            const { exec } = require('child_process');
            const tarCommand = `tar --exclude='node_modules' --exclude='.git' --exclude='${backupDir}' -czf "${backupPath}.tar.gz" .`;
            
            exec(tarCommand, { cwd: __dirname }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ UPDATE: Error creating backup:', error);
                } else {
                    console.log('✅ UPDATE: Backup created successfully:', `${backupName}.tar.gz`);
                    
                    // Clean up old backups if we have too many
                    this.cleanupOldBackups();
                }
            });

        } catch (error) {
            console.error('❌ UPDATE: Error during backup creation:', error.message);
        }
    }

    cleanupOldBackups() {
        try {
            const backupDir = this.config.backup.directory;
            if (!fs.existsSync(backupDir)) return;

            const files = fs.readdirSync(backupDir)
                .filter(file => file.endsWith('.tar.gz'))
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    stats: fs.statSync(path.join(backupDir, file))
                }))
                .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

            // Remove old backups if we have more than the maximum
            if (files.length > this.config.backup.maxBackups) {
                const filesToRemove = files.slice(this.config.backup.maxBackups);
                filesToRemove.forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log('🗑️ UPDATE: Removed old backup:', file.name);
                });
            }
        } catch (error) {
            console.error('❌ UPDATE: Error cleaning up old backups:', error.message);
        }
    }
}

module.exports = UpdateChecker;
