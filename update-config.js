module.exports = {
    // GitHub repository information
    repository: {
        owner: 'Fnykis',
        name: 'tvajlajt',
        branch: 'main' // Default branch to pull from
    },
    
    // Update settings
    update: {
        checkDelay: 2000, // Delay in milliseconds before checking for updates after server start
        autoCheck: true,   // Whether to automatically check for updates on server start
        promptUser: true   // Whether to prompt user before updating
    },
    
    // Backup settings
    backup: {
        enabled: true,     // Whether to create backups before updating
        directory: './backups', // Directory to store backups
        maxBackups: 5     // Maximum number of backups to keep
    }
};
