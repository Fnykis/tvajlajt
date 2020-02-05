var app = require('express')();
var fs = require('fs');
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/send.html');
});

io.on('connection', function(socket){

	socket.on('update', function(dataToProcess){
        io.emit('update', dataToProcess);

        try {
            var cardStageIndex = parseInt(dataToProcess[0].substring(5, dataToProcess[0].indexOf("_"))) - 1;
            var cardIndex = parseInt(dataToProcess[0].substring(dataToProcess[0].indexOf("_") + 1, dataToProcess[0].length));
            var cardId = dataToProcess[1];
        } catch(e) {
            console.log("Failed to fetch data.\ncardStageIndex: " + cardStageIndex + "\ncardId: " + cardId);
            return;
        }

        var jsonData;
        fs.readFile(`${__dirname}/data.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);

            if (dataToProcess[2] == "new") for (var i = 0; jsonData[cardStageIndex].cards.length; i++) if (jsonData[cardStageIndex].cards[i].id == null) { cardIndex = i; break; }
            jsonData[cardStageIndex].cards[cardIndex].id = cardId;

            fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                if (err) throw err;
                console.log('Card update successful');
            });
        });
    });
    
	socket.on('token', function(dataToProcess){
        io.emit('token', dataToProcess);

        var stageIndex = parseInt(dataToProcess[0]);
        var cardIndex = parseInt(dataToProcess[1]);
        var playerIndex = parseInt(dataToProcess[2]);

        var jsonData;
        fs.readFile(`${__dirname}/data.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);
            jsonData[stageIndex].cards[cardIndex].scores[playerIndex].scored = !jsonData[stageIndex].cards[cardIndex].scores[playerIndex].scored;

            fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                if (err) throw err;
                console.log('Scoring for ' + jsonData[2].players[playerIndex].faction + ' updated successfully');
            });
        });
    });
    
    socket.on('adjustRemove', function(dataToProcess){
        io.emit('adjustRemove', dataToProcess);

        var jsonData;
        fs.readFile(`${__dirname}/data.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);
            
            jsonData[dataToProcess[1] - 1].cards.splice(parseInt(dataToProcess[3]), 1);

            fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                if (err) throw err;
                console.log('Removed card number ' + (parseInt(dataToProcess[3])+1));
            });
        });
    });
    
    socket.on('adjustHide', function(dataToProcess){
        io.emit('adjustHide', dataToProcess);

        var jsonData;
        fs.readFile(`${__dirname}/data.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);

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

            fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                if (err) throw err;
                console.log('Hid card number ' + (parseInt(dataToProcess[3])+1));
            });
        });
    });
    
	socket.on('addCard', function(dataToProcess){
        io.emit('addCard', dataToProcess);

        var stageIndex = parseInt(dataToProcess) - 1;

        var jsonData;
        fs.readFile(`${__dirname}/data.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);
            jsonData[stageIndex].cards.push({
                "id": null,
                "scores":[{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false},{"scored": false}]
            });

            fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                if (err) throw err;
                console.log('Added one card for stage ' + (stageIndex + 1));
            });
        });
    });
    
	socket.on('editscore', function(dataToProcess){
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
                    for (var j = 0; j < jsonData[0].cards.length; j++) {
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

                function getCardPoint(id) {
                    for (var cardIndex = 0; cardIndex < jsonDatabase[0].stage1.length; cardIndex++) {
                        if (jsonDatabase[0].stage1[cardIndex].id == id) {
                            return jsonDatabase[0].stage1[cardIndex].points;
                        }
                    }
                    for (var cardIndex = 0; cardIndex < jsonDatabase[0].stage2.length; cardIndex++) {
                        if (jsonDatabase[0].stage2[cardIndex].id == id) {
                            return jsonDatabase[0].stage2[cardIndex].points;
                        }
                    }
                    return null;
                }
            });
        });
    });

	socket.on('changeVP', function(dataToProcess){
        io.emit('changeVP', dataToProcess);

        var jsonData;
        fs.readFile(`${__dirname}/data.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);

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

            fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                if (err) throw err;
                console.log('Updated scores');
            });
        });
    });
    
	socket.on('newgame', function(dataToProcess){
        io.emit('newgame', dataToProcess);

        var jsonData;
        fs.readFile(`${__dirname}/data.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);

            // Create players
            for (var i = 0; i < jsonData[2].players.length; i++) {
                if (i < dataToProcess[1].length) {
                    jsonData[2].players[i] = {
                        "faction": dataToProcess[1][i].faction,
                        "color": dataToProcess[1][i].color,
                        "player": dataToProcess[1][i].name,
                        "secrets": [],
                        "vp_custodian": false,
                        "vp_imperial": 0,
                        "vp_secrets": 0,
                        "vp_riders": 0,
                        "vp_other": 0
                    };
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
            
            // Settings
            if (dataToProcess[2]) {
                jsonData[3].communitycards = dataToProcess[2];
            } else {
                jsonData[3].communitycards = false;
            }

            fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                if (err) throw err;
                console.log('Starting a new game');
            });
        });
    });

	socket.on('reset', function(dataToProcess){
        io.emit('reset', dataToProcess);

        var jsonData;
        fs.readFile(`${__dirname}/data_default.json`, 'utf8', function (err, data) {
            if (err) throw err;
            jsonData = JSON.parse(data);

            fs.writeFile(`${__dirname}/data.json`, JSON.stringify(jsonData), (err) => {  
                if (err) throw err;
                console.log('Reset successful');
            });
        });
    });
    
});

http.listen(3000, function(){
	console.log('\nListening on localhost:3000');
	console.log('To stop the server use ctrl+C\n\nLog:');
});