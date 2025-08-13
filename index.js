var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var os = require('os');

// Game state variables
var pauseCounter = false;
var pauseStartTime = 0;
var currentGameData = null; // Store current game data in memory

// Timer state variables
var gameTimer = null;
var elapsedSeconds = 0;
var lastSaveTime = 0;
var isGameActive = false;

// Global database variables
var jsonDatabase = null;

// Helper function to get current game data
function getCurrentGameData() {
    // Only return current game data if it exists
    // Don't automatically load default data - let the /current-game endpoint handle that
    return currentGameData;
}

// Helper function to save current game data
function saveCurrentGameData() {
    if (currentGameData) {
        // Ensure games directory exists before saving
        const gamesDir = `${__dirname}/games`;
        fs.access(gamesDir, fs.constants.F_OK, function(accessErr) {
            if (accessErr) {
                // Directory doesn't exist, create it
                fs.mkdir(gamesDir, { recursive: true }, function(mkdirErr) {
                    if (mkdirErr) {
                        console.error('❌ FILE: Error creating games directory for save:', mkdirErr);
                        return;
                    }
                    // Directory created, proceed with save
                    proceedWithSave();
                });
            } else {
                // Directory exists, proceed with save
                proceedWithSave();
            }
        });
        
        function proceedWithSave() {
            // Save to the most recent game file if it exists
            fs.readdir(`${__dirname}/games`, function(err, files) {
                if (err) {
                    console.error('❌ FILE: Error reading games directory:', err);
                    return;
                }
                
                var jsonFiles = files.filter(file => file.endsWith('.json'));
                if (jsonFiles.length > 0) {
                    var filesWithStats = [];
                    var processedCount = 0;
                    
                    jsonFiles.forEach(function(filename) {
                        fs.stat(`${__dirname}/games/${filename}`, function(statErr, stats) {
                            if (statErr) {
                                console.error('❌ FILE: Error getting stats for file:', filename, statErr);
                                processedCount++;
                                if (processedCount === jsonFiles.length) {
                                    processFiles();
                                }
                                return;
                            }
                            
                            filesWithStats.push({
                                filename: filename,
                                createdAt: stats.birthtime || stats.mtime
                            });
                            
                            processedCount++;
                            if (processedCount === jsonFiles.length) {
                                processFiles();
                            }
                        });
                    });
                    
                    function processFiles() {
                        // Sort by creation date (newest first)
                        filesWithStats.sort(function(a, b) {
                            return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
                        });
                        
                        var mostRecentFile = filesWithStats[0].filename;
                        fs.writeFile(`${__dirname}/games/${mostRecentFile}`, JSON.stringify(currentGameData), (err) => {
                            if (err) {
                                console.error('❌ FILE: Error saving current game data:', err);
                            } else {
                                console.log('✅ FILE: Updated game file:', mostRecentFile);
                            }
                        });
                    }
                }
            });
        }
    }
}

// Function to start the game timer
function startGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    isGameActive = true;
    lastSaveTime = Date.now();
    
    gameTimer = setInterval(function() {
        if (isGameActive && !pauseCounter && (!currentGameData || !currentGameData[3].gameEnded)) {
            elapsedSeconds++;
            
            // Update current game data
            if (currentGameData) {
                currentGameData[3].elapsedSeconds = elapsedSeconds;
            }
            
            // Save to disk every 60 seconds (not every second)
            var now = Date.now();
            if (now - lastSaveTime >= 60000) { // 60 seconds
                saveCurrentGameData();
                lastSaveTime = now;
                console.log('💾 TIMER: Saved elapsed time:', elapsedSeconds, 'seconds');
            }
        }
    }, 1000); // Update every second
    
    console.log('⏰ TIMER: Game timer started, elapsed time:', elapsedSeconds, 'seconds');
}

// Function to stop the game timer
function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    isGameActive = false;
    console.log('⏰ TIMER: Game timer stopped, final elapsed time:', elapsedSeconds, 'seconds');
}

// Function to pause the game timer
function pauseGameTimer() {
    pauseCounter = true;
    pauseStartTime = Date.now();
    console.log('⏸️ TIMER: Game timer paused at:', elapsedSeconds, 'seconds');
}

// Function to resume the game timer
function resumeGameTimer() {
    if (pauseCounter) {
        var pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
        console.log('▶️ TIMER: Game timer resumed, pause duration:', pauseDuration, 'seconds');
        pauseCounter = false;
    }
}

// Function to set elapsed time (for loading games)
function setElapsedTime(seconds) {
    elapsedSeconds = seconds || 0;
    if (currentGameData) {
        currentGameData[3].elapsedSeconds = elapsedSeconds;
    }
    console.log('⏰ TIMER: Set elapsed time to:', elapsedSeconds, 'seconds');
}

// Function to get current elapsed time
function getElapsedTime() {
    return elapsedSeconds;
}

// Function to get card points from database
function getCardPoint(id) {
    if (!jsonDatabase) {
        console.log('⚠️ CARD: Database not loaded yet, returning default 1 point for card:', id);
        return 1;
    }
    
    // Search through all objective categories dynamically
    if (jsonDatabase[0] && jsonDatabase[0].category === 'objectives') {
        // Iterate through all objective categories (base, community, prophecyofkings, thundersedge, etc.)
        for (var categoryKey in jsonDatabase[0]) {
            if (categoryKey === 'category') continue; // Skip the category field
            
            var category = jsonDatabase[0][categoryKey];
            if (category && typeof category === 'object') {
                // Search stage1 objectives
                if (category.stage1 && Array.isArray(category.stage1)) {
                    for (var cardIndex = 0; cardIndex < category.stage1.length; cardIndex++) {
                        if (category.stage1[cardIndex].id == id) {
                            return category.stage1[cardIndex].points;
                        }
                    }
                }
                
                // Search stage2 objectives
                if (category.stage2 && Array.isArray(category.stage2)) {
                    for (var cardIndex = 0; cardIndex < category.stage2.length; cardIndex++) {
                        if (category.stage2[cardIndex].id == id) {
                            return category.stage2[cardIndex].points;
                        }
                    }
                }
                
                // Search secret objectives
                if (category.secret && Array.isArray(category.secret)) {
                    for (var cardIndex = 0; cardIndex < category.secret.length; cardIndex++) {
                        if (category.secret[cardIndex].id == id) {
                            return category.secret[cardIndex].points;
                        }
                    }
                }
            }
        }
    }
    
    console.log('⚠️ CARD: Could not find points for card ID:', id);
    return 1; // Default to 1 point if card not found
}

// Function to end the game
function endGame() {
    if (currentGameData) {
        currentGameData[3].gameEnded = true;
        currentGameData[3].finalElapsedTime = elapsedSeconds; // Save exact elapsed time
        stopGameTimer();
        saveCurrentGameData();
        console.log('🏁 GAME: Game ended successfully at', elapsedSeconds, 'seconds');
        
        // Calculate winner(s)
        var winners = calculateWinners();
        io.emit('gameEnded', { winners: winners, finalTime: elapsedSeconds });
    }
}

// Function to calculate winners
function calculateWinners() {
    if (!currentGameData || !currentGameData[2] || !currentGameData[2].players) {
        return [];
    }
    
    var players = currentGameData[2].players;
    var maxScore = -1;
    var winners = [];
    
    // Calculate total score for each player
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.faction && player.player) { // Only count active players
            var totalScore = 0;
            
            // Add VP from player object
            totalScore += (player.vp_custodian === true ? 1 : 0); // Custodian point (boolean)
            totalScore += (player.vp_imperial || 0);     // Imperial points
            totalScore += (player.vp_secrets || 0);      // Secret objectives
            totalScore += (player.vp_riders || 0);       // Riders
            totalScore += (player.vp_other || 0);        // Other VP
            
            // Add objective card points - use actual points value from database
            if (currentGameData[0] && currentGameData[0].cards) {
                for (var j = 0; j < currentGameData[0].cards.length; j++) {
                    var card = currentGameData[0].cards[j];
                    if (card.id && card.scores && card.scores[i] && card.scores[i].scored) {
                        var cardPoints = getCardPoint(card.id);
                        totalScore += cardPoints;
                        console.log('🏁 SCORE: Player', player.player, 'scored card', card.id, 'for', cardPoints, 'points');
                    }
                }
            }
            if (currentGameData[1] && currentGameData[1].cards) {
                for (var j = 0; j < currentGameData[1].cards.length; j++) {
                    var card = currentGameData[1].cards[j];
                    if (card.id && card.scores && card.scores[i] && card.scores[i].scored) {
                        var cardPoints = getCardPoint(card.id);
                        totalScore += cardPoints;
                        console.log('🏁 SCORE: Player', player.player, 'scored card', card.id, 'for', cardPoints, 'points');
                    }
                }
            }
            
            console.log('🏁 SCORE: Player', player.player, 'total score:', totalScore, 
                       '(custodian:', (player.vp_custodian === true ? 1 : 0),
                       'imperial:', (player.vp_imperial || 0),
                       'secrets:', (player.vp_secrets || 0),
                       'riders:', (player.vp_riders || 0),
                       'other:', (player.vp_other || 0),
                       'cards: +', (totalScore - (player.vp_custodian === true ? 1 : 0) - (player.vp_imperial || 0) - (player.vp_secrets || 0) - (player.vp_riders || 0) - (player.vp_other || 0)), ')');
            
            if (totalScore > maxScore) {
                maxScore = totalScore;
                winners = [{
                    name: player.player,
                    faction: player.faction,
                    color: player.color,
                    score: totalScore
                }];
            } else if (totalScore === maxScore) {
                winners.push({
                    name: player.player,
                    faction: player.faction,
                    color: player.color,
                    score: totalScore
                });
            }
        }
    }
    
    return winners;
}



// Function to restore timer state on server startup
function restoreTimerState() {
    // On server restart, don't automatically restore any games
    // This allows users to choose whether to start a new game or load an existing one
    console.log('📁 SERVER: Server restarted - no games automatically restored');
    console.log('📁 SERVER: Users must manually start a new game or load an existing game');
    
    // Reset game state to ensure no active game
    currentGameData = null;
    isGameActive = false;
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    elapsedSeconds = 0;
    pauseCounter = false;
    pauseStartTime = 0;
}

console.log('🚀 SERVER: Starting Tvajlajt server...');
console.log('📂 SERVER: Setting up routes and middleware...');

// Serve static files (CSS, JS, images, etc.)
app.use('/assets', express.static(__dirname + '/assets'));
console.log('📁 SERVER: Static file serving configured for /assets');

// Serve JSON data files
app.get('/database.json', function(req, res){
	console.log('📊 REQUEST: Serving database.json');
	res.sendFile(__dirname + '/database.json');
});

app.get('/current-game', function(req, res){
	console.log('📊 REQUEST: Serving current game data');
	if (currentGameData) {
		res.json(currentGameData);
	} else {
		// If no current game, serve default data
		fs.readFile(`${__dirname}/data_default.json`, 'utf8', function (err, data) {
			if (err) {
				console.error('❌ FILE: Error reading data_default.json:', err);
				res.status(500).json({ error: 'No current game and default data unavailable' });
				return;
			}
			try {
				var defaultData = JSON.parse(data);
				res.json(defaultData);
			} catch (parseErr) {
				console.error('❌ JSON: Error parsing data_default.json:', parseErr);
				res.status(500).json({ error: 'Invalid default data format' });
			}
		});
	}
});

// Route to get current elapsed time (for timer display)
app.get('/timer', function(req, res){

	res.json({
		elapsedSeconds: getElapsedTime(),
		isPaused: pauseCounter,
		isGameActive: isGameActive
	});
});

app.get('/data_default.json', function(req, res){
	console.log('📊 REQUEST: Serving data_default.json');
	res.sendFile(__dirname + '/data_default.json');
});

// New route to list saved games
app.get('/games', function(req, res){
	console.log('📁 REQUEST: Listing saved games');
	
	// Ensure games directory exists before reading
	const gamesDir = `${__dirname}/games`;
	fs.access(gamesDir, fs.constants.F_OK, function(accessErr) {
		if (accessErr) {
			// Directory doesn't exist, create it and return empty list
			console.log('📁 SERVER: Games directory not found, creating...');
			fs.mkdir(gamesDir, { recursive: true }, function(mkdirErr) {
				if (mkdirErr) {
					console.error('❌ FILE: Error creating games directory:', mkdirErr);
					console.log('📁 SERVER: Returning empty games list due to directory creation failure');
					res.json([]);
				} else {
					console.log('✅ FILE: Games directory created successfully');
					res.json([]); // Return empty list for new directory
				}
			});
			return;
		}
		
		// Directory exists, proceed with reading games
		fs.readdir(`${__dirname}/games`, function(err, files) {
			if (err) {
				console.error('❌ FILE: Error reading games directory:', err);
				res.json([]);
				return;
			}
			
			// Filter for JSON files only
			var jsonFiles = files.filter(file => file.endsWith('.json'));
			console.log('📁 SERVER: Found', jsonFiles.length, 'saved games');
			
			var gamesList = [];
			var processedCount = 0;
			
			if (jsonFiles.length === 0) {
				res.json([]);
				return;
			}
			
			jsonFiles.forEach(function(filename) {
				// Get file stats for creation date
				fs.stat(`${__dirname}/games/${filename}`, function(statErr, stats) {
					if (statErr) {
						console.error('❌ FILE: Error getting stats for file:', filename, statErr);
						processedCount++;
						if (processedCount === jsonFiles.length) {
							res.json(gamesList);
						}
						return;
					}
					
					fs.readFile(`${__dirname}/games/${filename}`, 'utf8', function(err, data) {
						if (err) {
							console.error('❌ FILE: Error reading game file:', filename, err);
							processedCount++;
							if (processedCount === jsonFiles.length) {
								res.json(gamesList);
							}
							return;
						}
						
						try {
							var gameData = JSON.parse(data);
							
							// Extract date from filename (YYYY_MM_DD_XXXX.json)
							var dateMatch = filename.match(/^(\d{4})_(\d{2})_(\d{2})_(\d{4})\.json$/);
							var formattedDate = '';
							var players = [];
							
							if (dateMatch) {
								formattedDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
							}
							
							// Extract player names
							if (gameData[2] && gameData[2].players) {
								gameData[2].players.forEach(function(player) {
									if (player.player && player.faction) {
										players.push(player.player);
									}
								});
							}
							
							gamesList.push({
								filename: filename,
								date: formattedDate,
								players: players,
								playerCount: players.length,
								createdAt: stats.birthtime || stats.mtime // Use birthtime if available, otherwise mtime
							});
							
						} catch (parseErr) {
							console.error('❌ PARSE: Error parsing game file:', filename, parseErr);
						}
						
						processedCount++;
						if (processedCount === jsonFiles.length) {
							// Sort by creation date (newest first)
							gamesList.sort(function(a, b) {
								return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
							});
							res.json(gamesList);
						}
					});
				});
			});
		});
	});
});

// Route to load a specific game
app.get('/games/:filename', function(req, res){
	var filename = req.params.filename;
	console.log('📁 REQUEST: Loading game:', filename);
	
	// Validate filename format
	if (!filename.match(/^\d{4}_\d{2}_\d{2}_\d{4}\.json$/)) {
		res.status(400).json({ error: 'Invalid filename format' });
		return;
	}
	
	// Ensure games directory exists before reading
	const gamesDir = `${__dirname}/games`;
	fs.access(gamesDir, fs.constants.F_OK, function(accessErr) {
		if (accessErr) {
			// Directory doesn't exist, create it and return error
			console.log('📁 SERVER: Games directory not found, creating...');
			fs.mkdir(gamesDir, { recursive: true }, function(mkdirErr) {
				if (mkdirErr) {
					console.error('❌ FILE: Error creating games directory:', mkdirErr);
					res.status(500).json({ error: 'Games directory unavailable' });
				} else {
					console.log('✅ FILE: Games directory created successfully');
					res.status(404).json({ error: 'Game file not found' });
				}
			});
			return;
		}
		
		// Directory exists, proceed with reading
		fs.readFile(`${__dirname}/games/${filename}`, 'utf8', function(err, data) {
			if (err) {
				console.error('❌ FILE: Error reading game file:', filename, err);
				res.status(404).json({ error: 'Game file not found' });
				return;
			}
			
			try {
				var gameData = JSON.parse(data);
				res.json(gameData);
			} catch (parseErr) {
				console.error('❌ PARSE: Error parsing game file:', filename, parseErr);
				res.status(500).json({ error: 'Invalid game file format' });
			}
		});
	});
});

// Main application route
app.get('/', function(req, res){
	console.log('🏠 REQUEST: Serving main page (index.html)');
	res.sendFile(__dirname + '/index.html');
});

// Send utility page route
app.get('/send.html', function(req, res){
	console.log('📤 REQUEST: Serving send.html utility page');
	res.sendFile(__dirname + '/send.html');
});

// Test page route
app.get('/test_cards.html', function(req, res){
	console.log('🧪 REQUEST: Serving test_cards.html test page');
	res.sendFile(__dirname + '/test_cards.html');
});

// Network status page route
app.get('/network_status.html', function(req, res){
	console.log('🌐 REQUEST: Serving network_status.html page');
	res.sendFile(__dirname + '/network_status.html');
});

// Handle favicon requests to prevent 404 errors
app.get('/favicon.ico', function(req, res) {
	res.status(204).end();
});

// Handle other favicon requests
app.get('/assets/media/favicon/*', function(req, res) {
	res.status(204).end();
});

io.on('connection', function(socket){
	console.log('🔌 SOCKET: New client connected, socket ID:', socket.id);

	// Handle interface refresh requests
	socket.on('interface_refresh', function(data) {
		console.log('📡 SOCKET: Interface refresh requested by client:', socket.id);
		// Broadcast to all other clients (except sender)
		socket.broadcast.emit('interface_refresh', data);
		console.log('📡 SOCKET: Interface refresh broadcasted to other clients');
	});

	socket.on('update', function(dataToProcess){
		console.log('📡 SOCKET: Received update event, data:', dataToProcess);
        
        // Check if game is ended
        if (currentGameData && currentGameData[3].gameEnded) {
            console.log('❌ CARD: Cannot assign cards - game is ended');
            return;
        }
        
        // Extract device ID if present (for bigletter tracking)
        var deviceId = null;
        if (dataToProcess.length >= 4) {
            deviceId = dataToProcess[3];
            console.log('📱 SOCKET: Card flipped by device:', deviceId);
        }
        
        // Broadcast to all clients with device ID
        io.emit('update', dataToProcess);
		console.log('📡 SOCKET: Broadcasted update to all clients');

        var cardStageIndex, cardIndex, cardId;
        console.log('🔍 SOCKET: Processing update data...');
        try {
            cardStageIndex = parseInt(dataToProcess[0].substring(5, dataToProcess[0].indexOf("_"))) - 1;
            cardIndex = parseInt(dataToProcess[0].substring(dataToProcess[0].indexOf("_") + 1, dataToProcess[0].length));
            cardId = dataToProcess[1];
            console.log('✅ SOCKET: Parsed data - cardStageIndex:', cardStageIndex, 'cardIndex:', cardIndex, 'cardId:', cardId);
        } catch(e) {
            console.error("❌ SOCKET: Failed to parse update data!");
            console.error("📄 SOCKET: Raw data:", dataToProcess);
            console.error("🐛 SOCKET: Error:", e.message);
            console.error("📊 SOCKET: cardStageIndex:", (cardStageIndex || 'undefined'), "cardId:", (cardId || 'undefined'));
            return;
        }

        var jsonData = getCurrentGameData();
        if (!jsonData) {
            console.error('❌ CARD: No current game data available');
            return;
        }
        console.log('✅ CARD: Using current game data from memory');

        if (dataToProcess[2] == "new") {
            console.log('🔍 CARD: Looking for empty card slot in stage', cardStageIndex + 1);
            for (var i = 0; i < jsonData[cardStageIndex].cards.length; i++) {
                if (jsonData[cardStageIndex].cards[i].id == null) { 
                    cardIndex = i; 
                    console.log('✅ CARD: Found empty slot at index', i);
                    break; 
                }
            }
        }
        
        console.log('💾 CARD: Setting card', cardId, 'at stage', cardStageIndex + 1, 'index', cardIndex);
        jsonData[cardStageIndex].cards[cardIndex].id = cardId;
        currentGameData = jsonData;

        console.log('✅ CARD: Card update successful - saved to memory');
        saveCurrentGameData();
    });
    
	socket.on('token', function(dataToProcess){
        console.log('🎯 SOCKET: Received token event, data:', dataToProcess);
        
        // Check if game is paused
        if (pauseCounter) {
            console.log('❌ TOKEN: Cannot score points - game is paused');
            return;
        }
        
        // Check if game is ended
        if (currentGameData && currentGameData[3] && currentGameData[3].gameEnded) {
            console.log('❌ TOKEN: Cannot score points - game is ended');
            return;
        }
        
        io.emit('token', dataToProcess);

        var stageIndex = parseInt(dataToProcess[0]);
        var cardIndex = parseInt(dataToProcess[1]);
        var playerIndex = parseInt(dataToProcess[2]);

        var jsonData = getCurrentGameData();
        if (!jsonData) {
            console.error('❌ TOKEN: No current game data available');
            return;
        }
        
        jsonData[stageIndex].cards[cardIndex].scores[playerIndex].scored = !jsonData[stageIndex].cards[cardIndex].scores[playerIndex].scored;
        currentGameData = jsonData;

        console.log('Scoring for ' + jsonData[2].players[playerIndex].faction + ' updated successfully');
        saveCurrentGameData();
    });
    
    socket.on('adjustRemove', function(dataToProcess){
        console.log('📡 SOCKET: Received adjustRemove event, data:', dataToProcess);
        io.emit('adjustRemove', dataToProcess);

        var jsonData = getCurrentGameData();
        if (!jsonData) {
            console.error('❌ ADJUST: No current game data available');
            return;
        }
        
        jsonData[dataToProcess[1] - 1].cards.splice(parseInt(dataToProcess[3]), 1);
        currentGameData = jsonData;

        console.log('Removed card number ' + (parseInt(dataToProcess[3])+1));
        saveCurrentGameData();
    });
    
    socket.on('adjustHide', function(dataToProcess){
        console.log('📡 SOCKET: Received adjustHide event, data:', dataToProcess);
        io.emit('adjustHide', dataToProcess);

        var jsonData = getCurrentGameData();
        if (!jsonData) {
            console.error('❌ ADJUST: No current game data available');
            return;
        }

        jsonData[dataToProcess[1] - 1].cards[parseInt(dataToProcess[3])] = {
            "id": null,
            "scores":[{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false}]
        };
        
        var cards = jsonData[dataToProcess[1] - 1].cards;
        var firstNull = undefined;
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].id == null && firstNull == undefined) { // Find the first null
                firstNull = i;
            }
        }

        array_move(cards, firstNull, cards.length-1);

        function array_move(arr, old_index, new_index) {
            if (new_index >= arr.length) {
                var k = new_index - arr.length + 1;
                while (k--) {
                    arr.push(undefined);
                }
            }
            arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
            return arr; // for testing
        };

        currentGameData = jsonData;
        console.log('Hid card number ' + (parseInt(dataToProcess[3])+1));
        saveCurrentGameData();
    });
    
	socket.on('addCard', function(dataToProcess){
        io.emit('addCard', dataToProcess);

        var stageIndex = parseInt(dataToProcess) - 1;

        var jsonData = getCurrentGameData();
        if (!jsonData) {
            console.error('❌ ADDCARD: No current game data available');
            return;
        }
        
        jsonData[stageIndex].cards.push({
            "id": null,
            "scores":[{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false}]
        });

        currentGameData = jsonData;
        console.log('Added one card for stage ' + (stageIndex + 1));
        saveCurrentGameData();
    });
    
	socket.on('editscore', function(dataToProcess){
        console.log('📊 SOCKET: Received editscore event, data:', dataToProcess);
        
        // Check if game is paused
        if (pauseCounter) {
            console.log('❌ EDITSCORE: Cannot change scores - game is paused');
            return;
        }
        
        // Check if game is ended
        if (currentGameData && currentGameData[3] && currentGameData[3].gameEnded) {
            console.log('❌ EDITSCORE: Cannot change scores - game is ended');
            return;
        }
        
        io.emit('editscore', dataToProcess);

        var jsonData;
        fs.readFile(`${__dirname}/data.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);

            fs.readFile(`${__dirname}/database.json`, 'utf8', function (err, database) {
                if (err) throw err;
                jsonDatabase = JSON.parse(database);

                var playerScores = [0, 0, 0, 0, 0, 0, 0, 0];
                for (var i = 0; i < dataToProcess.length; i++) {
                    if (isNaN(parseInt(dataToProcess[i]))) continue;
                    for (var j = 0; j < jsonData[0].cards.length; j++) {
                        if (jsonData[0].cards[j].id != null) {
                            if (jsonData[0].cards[j].scores[i].scored) playerScores[i] = playerScores[i] + getCardPoint(jsonData[0].cards[j].id);
                        }
                    }
                    for (var j = 0; j < jsonData[1].cards.length; j++) {
                        if (jsonData[1].cards[j].id != null) {
                            if (jsonData[1].cards[j].scores[i].scored) playerScores[i] = playerScores[i] + getCardPoint(jsonData[1].cards[j].id);
                        }
                    }
                    playerScores[i] = parseInt(dataToProcess[i]) - playerScores[i];
                    
                    jsonData[2].players[i].vp_other = playerScores[i];
                    
                }

                fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                    if (err) throw err;
                    console.log('Updated scores');
                });


            });
        });
    });

	socket.on('changeVP', function(dataToProcess){
        console.log('📊 SOCKET: Received changeVP event, data:', dataToProcess);
        
        // Check if game is paused
        if (pauseCounter) {
            console.log('❌ CHANGEVP: Cannot change VP - game is paused');
            return;
        }
        
        // Check if game is ended
        if (currentGameData && currentGameData[3] && currentGameData[3].gameEnded) {
            console.log('❌ CHANGEVP: Cannot change VP - game is ended');
            return;
        }
        
        io.emit('changeVP', dataToProcess);

        var jsonData = getCurrentGameData();
        if (!jsonData) {
            console.error('❌ CHANGEVP: No current game data available');
            return;
        }

        var playerIndex = parseInt(dataToProcess[0]);
        var category = dataToProcess[1];

        if (category == "custodian") {
            for (var i = 0; i < jsonData[2].players.length; i++) {
                jsonData[2].players[i].vp_custodian = 0;
                if (i == playerIndex) jsonData[2].players[i].vp_custodian = 1;
            }
        } else {
            var adjustment = dataToProcess[2];
            switch (category) {
                case "imperial": 
                    if (adjustment == "up") {
                        jsonData[2].players[playerIndex].vp_imperial = jsonData[2].players[playerIndex].vp_imperial + 1;
                    } else {
                        jsonData[2].players[playerIndex].vp_imperial = jsonData[2].players[playerIndex].vp_imperial - 1;
                        if (jsonData[2].players[playerIndex].vp_imperial < 0) jsonData[2].players[playerIndex].vp_imperial = 0;
                    }
                    break;
                case "secrets": 
                    if (adjustment == "up") {
                        jsonData[2].players[playerIndex].vp_secrets = jsonData[2].players[playerIndex].vp_secrets + 1;
                    } else {
                        jsonData[2].players[playerIndex].vp_secrets = jsonData[2].players[playerIndex].vp_secrets - 1;
                        if (jsonData[2].players[playerIndex].vp_secrets < 0) jsonData[2].players[playerIndex].vp_secrets = 0;
                    }
                    break;
                case "riders": 
                    if (adjustment == "up") {
                        jsonData[2].players[playerIndex].vp_riders = jsonData[2].players[playerIndex].vp_riders + 1;
                    } else {
                        jsonData[2].players[playerIndex].vp_riders = jsonData[2].players[playerIndex].vp_riders - 1;
                        if (jsonData[2].players[playerIndex].vp_riders < 0) jsonData[2].players[playerIndex].vp_riders = 0;
                    }
                    break;
                case "other": 
                    if (adjustment == "up") {
                        jsonData[2].players[playerIndex].vp_other = jsonData[2].players[playerIndex].vp_other + 1;
                    } else {
                        jsonData[2].players[playerIndex].vp_other = jsonData[2].players[playerIndex].vp_other - 1;
                        // if (jsonData[2].players[playerIndex].vp_other < 0) jsonData[2].players[playerIndex].vp_other = 0;
                    }
                    break;
            }
        }

        currentGameData = jsonData;
        console.log('Updated scores');
        saveCurrentGameData();
    });
    
	socket.on('newgame', function(dataToProcess){
        console.log('🎮 SOCKET: Received newgame event, data:', dataToProcess);
        io.emit('newgame', dataToProcess);

        var jsonData;
        console.log('📖 FILE: Reading data_default.json for new game setup...');
        fs.readFile(`${__dirname}/data_default.json`, 'utf8', function (err, data) {
            if (err) {
                console.error('❌ FILE: Error reading data_default.json for new game:', err);
                throw err;
            }
            console.log('✅ FILE: Successfully read data_default.json for new game');
            jsonData = JSON.parse(data);

            // Create players
            console.log('👥 GAME: Creating players, received:', dataToProcess[1].length, 'players');
            for (var i = 0; i < jsonData[2].players.length; i++) {
                if (i < dataToProcess[1].length) {
                    var player = dataToProcess[1][i];
                    jsonData[2].players[i] = {
                        "faction": player.faction,
                        "color": player.color,
                        "player": player.name,
                        "secrets": [],
                        "vp_custodian": false,
                        "vp_imperial": 0,
                        "vp_secrets": 0,
                        "vp_riders": 0,
                        "vp_other": 0
                    };
                    console.log('👤 GAME: Created player', i + 1, ':', player.name, '-', player.faction);
                } else {
                    jsonData[2].players[i] = {
                        "faction": null,
                        "color": null,
                        "player": null,
                        "secrets": null,
                        "vp_custodian": false,
                        "vp_imperial": 0,
                        "vp_secrets": 0,
                        "vp_riders": 0,
                        "vp_other": 0
                    };
                }
            }

            // Create cards
            console.log('🎯 GAME: Setting up', dataToProcess[0], 'cards for each stage');
            jsonData[0].cards = [];
            jsonData[1].cards = [];
            for (var i = 0; i < parseInt(dataToProcess[0]); i++) {
                jsonData[0].cards.push({
                    "id": null,
                    "scores":[{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false}]
                })
                jsonData[1].cards.push({
                    "id": null,
                    "scores":[{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false}]
                })
            }
            console.log('✅ GAME: Created', jsonData[0].cards.length, 'stage 1 cards and', jsonData[1].cards.length, 'stage 2 cards');
            
				// Settings - handle dynamic objective categories
				var objectiveCategories = dataToProcess[2] || {};
				jsonData[3].objectiveCategories = objectiveCategories;
            
				// Legacy support for backward compatibility
				jsonData[3].communitycards = objectiveCategories.community || false;
				jsonData[3].prophecyOfKings = objectiveCategories.prophecyofkings || false;
				jsonData[3].thundersEdge = objectiveCategories.thundersedge || false;
            
				console.log('⚙️ GAME: Objective categories:', objectiveCategories);
            
            // Set game start time
            jsonData[3].timeStart = Date.now();
            jsonData[3].timePause = 0;
            console.log('⏰ GAME: Game start time set to:', new Date(jsonData[3].timeStart).toLocaleString());
            
            // Handle flipped objectives
            var flippedObjectives = parseInt(dataToProcess[3]) || 3;
            console.log('🎯 GAME: Flipped objectives setting:', flippedObjectives);
            
            // Auto-flip the specified number of objectives
            if (flippedObjectives > 0) {
                console.log('🔄 GAME: Auto-flipping', flippedObjectives, 'objectives...');
                
                // Load objectives to get random cards
                fs.readFile(`${__dirname}/database.json`, 'utf8', function (err, database) {
                    if (err) {
                        console.error('❌ FILE: Error reading database.json for auto-flip:', err);
                        return;
                    }
                    
                    var jsonDatabase = JSON.parse(database);
                    var stage1Objectives = [];
                    var stage2Objectives = [];
                    
                    // Load objectives from all categories dynamically
                    if (jsonDatabase[0] && jsonDatabase[0].category === 'objectives') {
                        // Iterate through all objective categories
                        for (var categoryKey in jsonDatabase[0]) {
                            if (categoryKey === 'category') continue; // Skip the category field
                            
                            var category = jsonDatabase[0][categoryKey];
                            if (category && typeof category === 'object') {
                                // Check if this category is enabled based on the objectiveCategories object
                                var categoryEnabled = categoryKey === 'base' || objectiveCategories[categoryKey] || false;
                                
                                if (categoryEnabled) {
                                    // Add stage1 objectives
                                    if (category.stage1 && Array.isArray(category.stage1)) {
                                        stage1Objectives = stage1Objectives.concat(category.stage1);
                                    }
                                    
                                    // Add stage2 objectives
                                    if (category.stage2 && Array.isArray(category.stage2)) {
                                        stage2Objectives = stage2Objectives.concat(category.stage2);
                                    }
                                }
                            }
                        }
                    }
                    
                    autoFlipObjectives(jsonData, flippedObjectives, stage1Objectives, stage2Objectives);
                });
            } else {
                // No auto-flip, just save the data
                saveNewGameData(jsonData);
            }
            
            function autoFlipObjectives(jsonData, count, stage1Objectives, stage2Objectives) {
                var flipped = 0;
                var usedObjectives = []; // Track used objectives
                
                // Flip stage 1 objectives first
                for (var i = 0; i < jsonData[0].cards.length && flipped < count; i++) {
                    var availableObjectives = stage1Objectives.filter(function(obj) {
                        return !usedObjectives.includes(obj.id);
                    });
                    
                    if (availableObjectives.length === 0) {
                        console.log('⚠️ GAME: No more available stage 1 objectives');
                        break;
                    }
                    
                    var randomIndex = Math.floor(Math.random() * availableObjectives.length);
                    var selectedObjective = availableObjectives[randomIndex];
                    
                    jsonData[0].cards[i].id = selectedObjective.id;
                    usedObjectives.push(selectedObjective.id);
                    console.log('🎯 GAME: Auto-flipped stage 1 card', i + 1, 'to:', selectedObjective.name);
                    flipped++;
                }
                
                // If we need more, flip stage 2 objectives
                for (var i = 0; i < jsonData[1].cards.length && flipped < count; i++) {
                    var availableObjectives = stage2Objectives.filter(function(obj) {
                        return !usedObjectives.includes(obj.id);
                    });
                    
                    if (availableObjectives.length === 0) {
                        console.log('⚠️ GAME: No more available stage 2 objectives');
                        break;
                    }
                    
                    var randomIndex = Math.floor(Math.random() * availableObjectives.length);
                    var selectedObjective = availableObjectives[randomIndex];
                    
                    jsonData[1].cards[i].id = selectedObjective.id;
                    usedObjectives.push(selectedObjective.id);
                    console.log('🎯 GAME: Auto-flipped stage 2 card', i + 1, 'to:', selectedObjective.name);
                    flipped++;
                }
                
                saveNewGameData(jsonData);
            }
            
            function saveNewGameData(jsonData) {
                // Generate filename with current date and random 4 digits
                var now = new Date();
                var dateStr = now.getFullYear() + '_' + 
                             String(now.getMonth() + 1).padStart(2, '0') + '_' + 
                             String(now.getDate()).padStart(2, '0');
                var randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                var filename = `${dateStr}_${randomDigits}.json`;
                
                // Ensure games directory exists before writing
                const gamesDir = `${__dirname}/games`;
                fs.access(gamesDir, fs.constants.F_OK, function(accessErr) {
                    if (accessErr) {
                        // Directory doesn't exist, create it
                        console.log('📁 SERVER: Games directory not found, creating...');
                        fs.mkdir(gamesDir, { recursive: true }, function(mkdirErr) {
                            if (mkdirErr) {
                                console.error('❌ FILE: Error creating games directory for new game:', mkdirErr);
                                return;
                            }
                            // Directory created, proceed with save
                            proceedWithSave();
                        });
                    } else {
                        // Directory exists, proceed with save
                        proceedWithSave();
                    }
                });
                
                function proceedWithSave() {
                    console.log('💾 FILE: Writing new game data to games/' + filename);
                    fs.writeFile(`${__dirname}/games/${filename}`, JSON.stringify(jsonData), (err) => {  
                        if (err) {
                            console.error('❌ FILE: Error writing new game data to games/' + filename, err);
                            throw err;
                        }
                        console.log('✅ GAME: New game started successfully! Data saved to games/' + filename);
                        console.log('🎉 GAME: Game ready with', dataToProcess[1].length, 'players and', dataToProcess[0], 'cards per stage');
                        
                        // Store in memory as current game
                        currentGameData = jsonData;
                        console.log('✅ MEMORY: Updated current game data in memory');
                        
                        // Start the game timer
                        setElapsedTime(0); // Reset timer for new game
                        startGameTimer();
                        
                        // Notify all clients to reload the page
                        io.emit('newGameStarted', {});
                    });
                }
            }

            // Timer is now handled by the new timer system
            console.log('⏰ SERVER: New timer system ready');

        });
    });

	socket.on('pauseCounter', function(dataToProcess){
        console.log('⏸️ SOCKET: Received pauseCounter event:', dataToProcess);
        
        if (dataToProcess === true) {
            // Pause the game timer
            pauseGameTimer();
            console.log('⏸️ SOCKET: Game paused at:', getElapsedTime(), 'seconds');
            
            // Notify all clients that game is paused
            io.emit('gamePaused', { timestamp: Date.now() });
        } else {
            // Resume the game timer
            resumeGameTimer();
            console.log('▶️ SOCKET: Game resumed at:', getElapsedTime(), 'seconds');
            
            // Notify all clients that game is resumed
            io.emit('gameResumed', { timestamp: Date.now() });
        }
    });
    
	socket.on('reset', function(dataToProcess){
        console.log('🔄 SOCKET: Received reset event');
        io.emit('reset', dataToProcess);

        // Stop the game timer
        stopGameTimer();
        setElapsedTime(0);

        // Reset current game data to default
        try {
            var defaultData = fs.readFileSync(`${__dirname}/data_default.json`, 'utf8');
            currentGameData = JSON.parse(defaultData);
            console.log('Reset successful');
        } catch (err) {
            console.error('❌ RESET: Error resetting game data:', err);
        }
    });
    
    socket.on('loadgame', function(filename){
        console.log('📁 SOCKET: Received loadgame event for:', filename);
        
        // Validate filename format
        if (!filename.match(/^\d{4}_\d{2}_\d{2}_\d{4}\.json$/)) {
            console.error('❌ SOCKET: Invalid filename format:', filename);
            return;
        }
        
        // Ensure games directory exists before loading
        const gamesDir = `${__dirname}/games`;
        fs.access(gamesDir, fs.constants.F_OK, function(accessErr) {
            if (accessErr) {
                // Directory doesn't exist, create it
                console.log('📁 SOCKET: Games directory not found, creating...');
                fs.mkdir(gamesDir, { recursive: true }, function(mkdirErr) {
                    if (mkdirErr) {
                        console.error('❌ FILE: Error creating games directory for load:', mkdirErr);
                        return;
                    }
                    // Directory created, proceed with load
                    proceedWithLoad();
                });
            } else {
                // Directory exists, proceed with load
                proceedWithLoad();
            }
        });
        
        function proceedWithLoad() {
            fs.readFile(`${__dirname}/games/${filename}`, 'utf8', function(err, data) {
                if (err) {
                    console.error('❌ FILE: Error reading game file:', filename, err);
                    return;
                }
                
                try {
                    var gameData = JSON.parse(data);
                    
                    // Store in memory as current game
                    currentGameData = gameData;
                    console.log('✅ SOCKET: Game loaded successfully:', filename);
                    
                    // Restore timer state from loaded game
                    var savedElapsedTime = gameData[3].elapsedSeconds || 0;
                    setElapsedTime(savedElapsedTime);
                    
                    // Check if game is ended
                    if (gameData[3].gameEnded) {
                        console.log('🏁 GAME: Loaded game is already ended');
                        stopGameTimer();
                    } else {
                        startGameTimer(); // Resume timer
                        console.log('⏰ TIMER: Restored timer with', savedElapsedTime, 'seconds');
                    }
                    
                    // Notify all clients to refresh
                    io.emit('gameLoaded', { filename: filename });
                    
                } catch (parseErr) {
                    console.error('❌ PARSE: Error parsing game file:', filename, parseErr);
                }
            });
        }
    });
    
    socket.on('endgame', function(dataToProcess){
        console.log('🏁 SOCKET: Received endgame event');
        
        // Only superusers can end the game
        if (!dataToProcess.superuser) {
            console.log('❌ SOCKET: Non-superuser attempted to end game');
            return;
        }
        
        endGame();
    });
    
    socket.on('deletegame', function(filename){
        console.log('🗑️ SOCKET: Received deletegame event for file:', filename);
        
        // Validate filename format (YYYY_MM_DD_XXXX.json)
        if (!filename || !filename.match(/^\d{4}_\d{2}_\d{2}_\d{4}\.json$/)) {
            console.error('❌ SOCKET: Invalid filename format for deletion:', filename);
            return;
        }
        
        var filePath = `${__dirname}/games/${filename}`;
        
        // Check if file exists before attempting to delete
        fs.access(filePath, fs.constants.F_OK, function(err) {
            if (err) {
                console.error('❌ FILE: Game file not found for deletion:', filename);
                return;
            }
            
            // Delete the file
            fs.unlink(filePath, function(err) {
                if (err) {
                    console.error('❌ FILE: Error deleting game file:', filename, err);
                    return;
                }
                
                console.log('✅ FILE: Successfully deleted game file:', filename);
                
                // Notify all clients that the game was deleted
                io.emit('gameDeleted', { filename: filename, success: true });
            });
        });
    });

});

// Add error handling for all socket events
io.on('connection', function(socket) {
    console.log('🔌 SOCKET: Client connected from', socket.handshake.address);
    
    // Send server IP to the newly connected client
    if (serverIP) {
        socket.emit('serverIP', { ip: serverIP });
        console.log('🌐 SOCKET: Sent server IP to client:', serverIP);
    }
    
    socket.on('disconnect', function(reason) {
        console.log('❌ SOCKET: Client disconnected:', socket.id, 'Reason:', reason);
    });
    
    socket.on('error', function(error) {
        console.error('❌ SOCKET: Socket error:', error);
    });
});

// Load databases at server startup
console.log('📚 SERVER: Loading databases...');
fs.readFile(`${__dirname}/database.json`, 'utf8', function(err, database) {
    if (err) {
        console.error('❌ FILE: Error loading database:', err);
        return;
    }
    
    try {
        jsonDatabase = JSON.parse(database);
        console.log('✅ FILE: Database loaded successfully');
        
        // Ensure games directory exists before starting server
        ensureGamesDirectory();
        
    } catch (parseErr) {
        console.error('❌ PARSE: Error parsing database:', parseErr);
        return;
    }
});

// Function to ensure games directory exists
function ensureGamesDirectory() {
    const gamesDir = `${__dirname}/games`;
    
    // Check if games directory exists
    fs.access(gamesDir, fs.constants.F_OK, function(err) {
        if (err) {
            // Directory doesn't exist, create it
            console.log('📁 SERVER: Games directory not found, creating...');
            fs.mkdir(gamesDir, { recursive: true }, function(mkdirErr) {
                if (mkdirErr) {
                    console.error('❌ FILE: Error creating games directory:', mkdirErr);
                    console.log('⚠️  SERVER: Continuing without games directory - some features may not work');
                } else {
                    console.log('✅ FILE: Games directory created successfully');
                }
                
                // Start server regardless of directory creation result
                startServer();
            });
        } else {
            // Directory exists, check if it's accessible
            console.log('✅ FILE: Games directory found and accessible');
            startServer();
        }
    });
}

// Global variable to store server IP
var serverIP = null;

function startServer() {
http.listen(3000, '0.0.0.0', function(){
	// Get the host's IP address for network access
	function getLocalIPAddress() {
		const interfaces = os.networkInterfaces();
		for (const name of Object.keys(interfaces)) {
			for (const interface of interfaces[name]) {
				// Skip internal and non-IPv4 addresses
				if (interface.family === 'IPv4' && !interface.internal) {
					return interface.address;
				}
			}
		}
		return 'localhost';
	}
	
	const hostIP = getLocalIPAddress();
	serverIP = hostIP + ':3000'; // Store server IP for clients
	
	console.log('\n🎉 SERVER: Successfully started!');
	console.log('🌐 SERVER: Listening on http://0.0.0.0:3000');
	console.log('🖥️  SERVER: Access from host: http://localhost:3000');
	console.log('📱 SERVER: Access from network: http://' + hostIP + ':3000');
	console.log('🛑 SERVER: To stop the server use Ctrl+C');
	console.log('\n📋 SERVER: Available routes:');
	console.log('  - GET /                    -> index.html (main app)');
	console.log('  - GET /send.html           -> send.html (utility)');
	console.log('  - GET /test_cards.html     -> test_cards.html (testing)');
	console.log('  - GET /network_status.html -> network_status.html (network info)');
	console.log('  - GET /current-game        -> current game data');
	console.log('  - GET /timer               -> current timer data');
	console.log('  - GET /database.json       -> card database');
	console.log('  - GET /assets/*            -> static files');
	console.log('\n📡 SOCKET: WebSocket server ready for connections');
	console.log('\n🔍 LOG: Event logging started...\n');
	
	// Restore timer state from most recent game on server startup
	restoreTimerState();
	
	// Check for updates after server is fully started
	setTimeout(async () => {
		try {
			const UpdateChecker = require('./update-checker');
			const updateChecker = new UpdateChecker();
			await updateChecker.checkForUpdates();
		} catch (error) {
			console.error('❌ UPDATE: Error initializing update checker:', error.message);
		}
	}, require('./update-config').update.checkDelay); // Use configured delay
});
}