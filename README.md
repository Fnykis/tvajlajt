# Tvajlajt
## Twilight Imperium 4 objectives and scoring overview

This is a web app designed to run on localhost and give the user control and overview over objectives and VP for the games. When I say "designed" I mean "amateurly designed", I'm no pro at neither frontend nor backend.
The idea is to have a big screen that shows the current score and the objectives. Also to let everyone on the wifi to be able to access the site on their phones. Only the Superuser (can be anyone or everyone) can change objectives and scores. The bigger screen can act as a passive display with the auto-refresh function.

In the files there are some community created objectives. Add new ones or remove the ones you don't like. Follow the style of the other objectives but the ID _has_ to be unique.

The server is not tested on other operating systems than MacOS. This readme will focus on how to run it on a Mac.

## How to use
* Install _nodejs_ (https://nodejs.org/en/)
* Put the directory _tvajlajt_ in _/Library/WebServer/Documents/_
* Run the file _startserver.command_ in the Terminal
* Go to _http://localhost/tvajlajt_
