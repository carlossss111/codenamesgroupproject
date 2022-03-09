RED_IMAGE = "url('../rsc/images/redteam.jpg')";
BLUE_IMAGE = "url('../rsc/images/blueteam.jpg')";
NEUTRAL_IMAGE = "url('../rsc/images/neutral.jpg')";
BOMB_IMAGE = "url('../rsc/images/bomb.jpg')";

DEBUG_SKIP_VALIDATION = false;

//Move sidebar and board left and right
function moveSidebar(event) {
    var width = window.innerWidth;
    var container = document.querySelector(".sidebarContainer");
    var arrow = document.querySelector(".arrow");
    var noti = document.querySelector(".notificationIcon");

    if (!isSidebarOpen) {
        notiVal = 0;
        document.getElementById('noti').innerHTML = notiVal;
        document.getElementById("board").style.transform = "translateX(15%)";
        arrow.style.transform = "rotate(135deg)";
        noti.style.display = "block";
        if (width <= 600) container.style.right = "-90%";
        else container.style.right = "-20%";
        isSidebarOpen = true;
    }
    else {
        document.getElementById("board").style.transform = "translateX(0)";
        arrow.style.transform = "rotate(-45deg)";
        noti.style.display = "none"; 
        event.target.parentNode.parentNode.style.right = "0";
        isSidebarOpen = false;
    }
}

function joinRoom() {
    server.sendToServer("joinRoom", {
        "Protocol" : "joinRoom",
        "room" : board.room,
        "name" : nickname
    })
}

function boardInitialize(isBombCard) {
    document.getElementById("startGame").style.display = "none";

    server.sendToServer("createInitialBoardState", {
        "Protocol" : "createInitialBoardState",
        "TimerLength" : board.timer,
        "BombCard" : isBombCard,
        "room" : board.room
    })
}

// Generate a clue and target number (AI)
function generateClue() {
    server.sendToServer("generateClue", {
        "Protocol" : "generateClue",
        "board" : board,
        "AIDifficulty" : '???'
    })
}

// Generate a list of guesses (AI)
function generateGuess() {
    server.sendToServer("generateGuess", {
        "Protocol" : "generateGuess",
        "board" : board,
        "AIDifficulty" : '???'
    })
}

function chooseRole(newRole) {
    if (!document.getElementById(newRole).innerHTML.includes("(AI)"))
        return;
    if (role != "") 
        document.getElementById(role).innerHTML = tmpName;
    role = newRole;
    tmpName = document.getElementById(role).innerHTML;
    document.getElementById(role).innerHTML = nickname;

    if (newRole == "blueSpy")
        board.player = {"team" : "blue", "role" : "spy"};
    else if (newRole == "blueSm")
        board.player = {"team" : "blue", "role" : "spymaster"};
    else if (newRole == "redSpy")
        board.player = {"team" : "red", "role" : "spy"};
    else if (newRole == "redSm")
        board.player = {"team" : "red", "role" : "spymaster"};

    server.sendToServer("chooseRole", {
        "blueSpy" : document.getElementById("blueSpy").innerHTML,
        "blueSm" : document.getElementById("blueSm").innerHTML,
        "redSpy" : document.getElementById("redSpy").innerHTML,
        "redSm" : document.getElementById("redSm").innerHTML,
        "room" : board.room
    })
}

// When new client join the room, sync role choice
function syncNewClient(type) {
    server.sendToServer("syncRole", {
        "type" : type,
        "blueSpy" : document.getElementById("blueSpy").innerHTML,
        "blueSm" : document.getElementById("blueSm").innerHTML,
        "redSpy" : document.getElementById("redSpy").innerHTML,
        "redSm" : document.getElementById("redSm").innerHTML,
        "room" : board.room
    })
}

function updateTurnState() {
    server.sendToServer("updateTurn", {
        "currentTurn" : board.turn,
        "room" : board.room
    })
}

function enableSpyMode() {
    console.log("spy mode enabled");
    for(var i = 0; i < board.cards.length; i++){
        for(var j = 0; j < board.cards[0].length; j++){
            board.cards[i][j].div.setAttribute("class",`card neutral`); 
        }
    }
    document.getElementById("clueButton").style.display = "none";
    document.getElementById("clue").placeholder = "";
    document.getElementById("clue").readOnly = true;
}

function getAIConfig() {
    if (!document.getElementById("blueSm").innerHTML.includes("(AI)"))
        board.ai.blueSm = false;
    if (!document.getElementById("blueSpy").innerHTML.includes("(AI)"))
        board.ai.blueSpy = false;
    if (!document.getElementById("redSm").innerHTML.includes("(AI)"))
        board.ai.redSm = false;
    if (!document.getElementById("redSpy").innerHTML.includes("(AI)"))
        board.ai.redSpy = false;
}

//Countdown function
function timerCount() {
    var timeLeft = parseInt(document.getElementById("timer").innerHTML, 10);
    timeLeft -= 1;
    document.getElementById("timer").innerHTML = timeLeft;
    if (timeLeft <= 0) {
        clearInterval(timerVar);
        if (choice == 1) {
            if (board.turn.team == "blue") finishGame("Red Team");
            else if (board.turn.team == "red") finishGame("Blue Team");
            board.turn = {"team": null, "role": null};
            updateTurnState();
        }
    }
}

//Functions called only by host user
function startGame() {
    board.turn = {"team" : "blue", "role" : "spymaster"};
    updateTurnState();
}

function finishGame(winTeam) {
    server.sendToServer("endGame", {
        "winner" : winTeam,
        "room" : board.room
    })
}

/*
 * Card class for each card in the Boardstate class. This keeps track of the colour, 
 * word and status of each card and this is where the card is revealed with revealCard().
 */
class Card {    
    colour;
    word;
    isRevealed;
    imageURL;
    div;

    /*
     * Called when a new card is created.
     * The new card is added to the board and attributes assigned. 
     */
    constructor(colour, word) {
        var boardDiv;

        //assign attributes
        this.colour = colour;
        this.word = word;
        this.isRevealed = false;

        //create card
        this.div = document.createElement("div");
        this.div.setAttribute("class", `card ${colour}`);
        this.div.innerHTML = `<p>${word}</p>`;

        //add card to the board
        boardDiv = document.getElementById("board");
        boardDiv.appendChild(this.div);

        //add click listener to card
        this.div.addEventListener("click", this.cardListener.bind(this));
    }

    /*
     * Reveals the card on the board by changing the image and setting isRevealed to true. 
     * This should be called whenever an updated boardstate is received from the server.
     */
    revealCard() {
        //play audio
        playFlipAudio();

        //set attributes and remove text
        this.isRevealed = true;
        this.div.innerHTML = "";
        this.div.style.transform = "rotateY(180deg)";
        setTimeout(() => {
            //apply the background image
            switch (this.colour) {
                case "redTeam":
                    this.div.style.backgroundImage = RED_IMAGE;
                    break;
                case "blueTeam":
                    this.div.style.backgroundImage = BLUE_IMAGE;
                    break;
                case "bombCard":
                    this.div.style.backgroundImage = BOMB_IMAGE;
                    break;
                default:
                    this.div.style.backgroundImage = NEUTRAL_IMAGE;
            }

            this.div.style.backgroundSize = "cover";
        }, 200)
    }

    /*
     * On click, reveal the card and send that to the server
     * IMPORTANT NOTE: revealCard() call has been moved from here to board.update().receiveBoardState
     */
    cardListener() {
        var board = BoardState.getInstance();

        if (!board.validateClick(this))
            return;

        board.sendBoardState(this);
    }
}


/*
BoardState class holds the state of the board at any given time while also holding the score
and the players turn. Done so every client has the correct copy of the board at the right time
*/
class BoardState extends Observer {
    static boardInstance;
    cards = [];
    room;
    clueWord;
    numOfGuesses;
    redScore;
    blueScore;
    timer = null;
    ai = {
        "blueSm" : true,
        "blueSpy" : true,
        "redSm" : true,
        "redSpy" : true
    };
    player = {
        "team": null,
        "role": null
    };
    turn = {
        "team": null,
        "role": null
    };

    /*
     * Singleton implementation of the BoardState class
     */
    static getInstance() {
        if (this.boardInstance == null) {
            this.boardInstance = new BoardState();
            return this.boardInstance;
        }
        return this.boardInstance;
    }

    /*
     * **DO NOT CREATE WITH new(), USE getInstance()**
     *
     * Called when the game begins and a new board is generated.
     */
    constructor() {
        super();

        //attribute assignments
        this.clueWord = null;
        this.numOfGuesses = null;
        this.redScore = 0;
        this.blueScore = 0;
        this.cards = new Array(5);
        for (var i = 0; i < this.cards.length; i++) {
            this.cards[i] = new Array(5);
        }
    }

    /*
     * Returns whether the team and role match
     */
    isPlayersTurn() {
        return (this.player["team"] === this.turn["team"] &&
                this.player["role"] === this.turn["role"]);
    }

    //return true if it is AI's turn
    isAITurn() {
        return (this.turn.team == "blue" && this.turn.role == "spymaster"   && this.ai.blueSm)
            || (this.turn.team == "blue" && this.turn.role == "spy"         && this.ai.blueSpy)
            || (this.turn.team == "red"  && this.turn.role == "spymaster"   && this.ai.redSm)
            || (this.turn.team == "red"  && this.turn.role == "spy"         && this.ai.redSpy)
    }

    //return true if next turn is a spy AI (for input clue recognization)
    isAISpy() {
        if (this.turn.team=="blue") return this.ai.blueSpy;
        else return this.ai.redSpy;
    }

    /*
     * Validates a click to and returns true/false depending on whether the
     * click is a valid playable move. Should be called by the card object.
     * Server-side validation is still used, but should not need to be relied on in all cases.
     */
    validateClick(cardSelected) {
        //debug functionality
        if (DEBUG_SKIP_VALIDATION)
            return true;

        //check card is not already revealed
        if (cardSelected.isRevealed)
            return false;

        //check it is a spy's turn
        if (!this.isPlayersTurn() || this.player.role == "spymaster") 
            return false;

        return true;
    }

    /*
     * Sends the new boardstate and the card chosen to the server.
     * The server should then reply starting from the update() function.
     */
    sendBoardState(cardSelected) {
        var i, j, found = false;
        
        //find and store indexes of the selected card
        for (i = 0; i < this.cards.length; i++) {
            for (j = 0; j < this.cards[i].length; j++) {
                if(this.cards[i][j].div == cardSelected.div) {
                    found = true;
                    break;
                }
            }
            if (found) break;
        }

        //check the card has been found in the array (critical error if not)
        if (!found)
            throw new Error("The card selected cannot not been found in the card array");

        //send board to server
        server.sendToServer("sendBoardState",
        {
            "Protocol" : "sendBoardState",
            "clue" : this.clueWord,
            "numberOfGuesses" : this.numOfGuesses,
            "redScore" : this.redScore,
            "blueScore" : this.blueScore,
            "timerLength" : this.timer,
            "player" : this.player,
            "turn" : this.turn,
            "cardChosen" : `${i},${j}`,
            "cards" : this.cards,
            "room" : this.room
        });
    }

    /*
    * Forwards the clue (after validation) to the server.
    */
    forwardClue() {
        let clue = document.getElementById("clue").value;
        let maxGuesses = document.getElementById("maxClues").value;

        //check that it is this player's turn and it is the spymaster's turn
        if (!this.isPlayersTurn || this.turn.role != "spymaster")
            return;

        /*
        * check that both
        *   - the clue should not match cards shown on the board
        *   - the clue should fit the AI vocabulary (if simulating AI player)
        */
        for (let i = 0; i < this.cards.length; i++) {
            for (let j = 0; j < this.cards[0].length; j++) {
                if (clue.toLowerCase() == this.cards[i][j].word) {
                    alert("Clue cannot be the same as board words!");
                    return;
                } else if (!vocabulary.includes(clue.toLowerCase()) && this.isAISpy()) {
                    alert("Word not recognized by AI spy. Please try again.");
                    return;
                }
            }
        }

        //send to server
        server.sendToServer("forwardClue",
        {
            "Protocol" : "forwardClue",
            "clue" : clue,
            "numberOfGuesses" : maxGuesses,
            "player" : this.player,
            "turn" : this.turn,
            "room" : this.room
        })
    }

    /*
     * An overriding method of the observer class. This receives either the new board state
     * or a new clue and updates the client object to reflect any changes.
     */
    update(eventName, incoming) {
        switch (eventName) {
            case "receiveBoardState":
                //assign new board attributes
                this.clueWord = incoming.clue;
                this.numOfGuesses = incoming.numberOfGuesses;
                this.redScore = incoming.redScore;
                this.blueScore = incoming.blueScore;
                this.timer = incoming.timerLength;

                //display new scores
                document.getElementById("redScore").innerText = this.redScore;
                document.getElementById("blueScore").innerText = this.blueScore;

                //reveal new cards locally
                for (let i = 0; i < incoming.cards.length; i++) {
                    for (var j = 0; j < incoming.cards[i].length; j++) {
                        if(incoming.cards[i][j].isRevealed)
                            this.cards[i][j].revealCard();
                    }
                }

                //check if game is over
                if (this.blueScore == 9 || this.redScore == 9 || incoming.bombPicked) {
                    if (choice == 1) {
                        if (this.blueScore == 9) finishGame("Blue Team");
                        else if (this.redScore == 9) finishGame("Red Team");
                        else if (this.turn.team == "blue") finishGame("Red Team");
                        else if (this.turn.team == "red") finishGame("Blue Team");
                        this.turn = {"team": null, "role": null};
                        updateTurnState();
                    }
                    return;
                }

                //continue game
                this.turn = incoming.turn;
                if ((incoming.turnOver && this.isPlayersTurn()) || (choice == 1 && this.isAITurn()) )
                    updateTurnState();
                break;

            case "forwardClue":
                //assign new clue and turn to the client board object
                this.clueWord = incoming.clue;
                this.numOfGuesses = incoming.numberOfGuesses;
                this.turn = incoming.turn;
                if ( this.isPlayersTurn() || (choice == 1 && this.isAITurn()) )
                    updateTurnState();

                //print the new clue on screen
                document.getElementById("clue").value = incoming.clue;
                document.getElementById("maxClues").value = incoming.numberOfGuesses;
                break;

            case "sendInitialBoardState":
                let receivedBoard = incoming.board;
                vocabulary = incoming.vocabulary;
                this.timer = incoming.timerLength;

                //timer setup
                if (this.timer != null) {
                    document.getElementById("timeLeft").style.display = "inline";
                    document.getElementById("timer").innerHTML = this.timer;
                }

                //card set up
                for (let i = 0; i < this.cards.length; i++) {
                    for (let j = 0; j < this.cards[0].length; j++){
                        let team = receivedBoard[i*this.cards.length+j]["type"];
                        let word = receivedBoard[i*this.cards.length+j]["name"];
                        this.cards[i][j] = new Card(team, word);
                    }
                }

                //AI configuration
                getAIConfig();
                console.log(this.ai);

                //configure roles and start game
                if (this.player.role == "spy") enableSpyMode();
                document.getElementById("teamBox").style.display = "none";
                if (choice == 1) startGame();
                break;

            case "receiveRole":
                //displays the player-name next to their role
                document.getElementById("blueSpy").innerHTML = incoming.blueSpy;
                document.getElementById("blueSm").innerHTML = incoming.blueSm;
                document.getElementById("redSpy").innerHTML = incoming.redSpy;
                document.getElementById("redSm").innerHTML = incoming.redSm;
                break;

            case "syncRequest":
                //sync a new client to the room
                if (choice == 1) syncNewClient('sync');
                break;

            case "changeTurn":
                //styling
                document.getElementById("turnAlert").style.display = "none";
                document.getElementById("room").style.display = "block";
                document.getElementById("blueSpy").style.fontSize = "1em";
                document.getElementById("blueSm").style.fontSize = "1em";
                document.getElementById("redSpy").style.fontSize = "1em";
                document.getElementById("redSm").style.fontSize = "1em";
                
                //change the turn and handle AI
                this.turn = incoming.currentTurn;
                console.log(this.turn);
                if (this.turn["team"] == "blue") {
                    if (this.turn["role"] == "spymaster") {
                        document.getElementById("blueSm").style.fontSize = "1.5em";
                        if (choice == 1 && this.ai.blueSm) generateClue();
                    }
                    else {
                        document.getElementById("blueSpy").style.fontSize = "1.5em";
                        if (choice == 1 && this.ai.blueSpy) generateGuess();
                    }
                } 
                else if (this.turn["team"] == "red"){
                    if (this.turn["role"] == "spymaster") {
                        document.getElementById("redSm").style.fontSize = "1.5em";
                        if (choice == 1 && this.ai.redSm) generateClue();
                    }
                    else {
                        document.getElementById("redSpy").style.fontSize = "1.5em";
                        if (choice == 1 && this.ai.redSpy) generateGuess();
                    }
                }

                //reinitialise the timer
                if (this.timer != null) {
                    clearInterval(timerVar);
                    document.getElementById("timer").innerHTML = this.timer;
                    timerVar = setInterval(timerCount, 1000);
                }

                //alert the player if their turn
                if (this.isPlayersTurn()) {
                    document.getElementById("room").style.display = "none";
                    document.getElementById("turnAlert").style.display = "block";
                }
                break;

            case "sendRoomInfo":
                //resend the room info
                if (incoming.name == nickname)
                    server.sendToServer("chat", {
                        Protocol : "chat", 
                        message : `${incoming.message}`,
                        room : this.room,
                        team : this.player.team
                    });
                break;

            case "gameOver":
                //display winning text
                document.getElementById("timeLeft").style.display = "none";
                alert(incoming.winTeam + " Wins!");
                break;

            default:
                break;
        }
    }
}

// Game starts here
var board = BoardState.getInstance();
server.registerObserver(board);
console.log(server.observers);

var link = parent.document.URL;
var choice = link.charAt(link.indexOf('#')+1);
board.room = link.substring(link.indexOf('!')+1, link.indexOf('@'));
var nickname = link.substring(link.indexOf('@')+1, link.indexOf('$')).replace('_', ' ');

var tmpName = "";
var timerVar;
var role = "";
var vocabulary;
var notiVal = 0;
var isSidebarOpen = true;

if (choice == 1) {
    var isBombCard = link.substring(link.indexOf('$')+1, link.indexOf('&'));
    let timer = link.substring(link.indexOf('&')+1);
    if (isBombCard == 'y') isBombCard = true;
    else isBombCard = false;
    if (timer != 'n') board.timer = timer;
    alert("Welcome to Codenames, " + nickname + "!\nWhen all players joined, press START to initialize board.");
} else {
    alert("Welcome to Codenames, " + nickname + "!\nPlease wait for the host to start game.");
    document.getElementById("startGame").style.display = "none";
    syncNewClient('request');
}

document.getElementById("turnAlert").style.display = "none";
document.getElementById("timeLeft").style.display = "none";
document.getElementById("room").innerHTML = "Room: " + board.room;
joinRoom()

document.getElementById("joinBlueSpy").onclick = function() {chooseRole("blueSpy");};
document.getElementById("joinBlueSm").onclick = function() {chooseRole("blueSm");};
document.getElementById("joinRedSpy").onclick = function() {chooseRole("redSpy");};
document.getElementById("joinRedSm").onclick = function() {chooseRole("redSm");};
document.getElementById("startGame").onclick = function() {boardInitialize(isBombCard);};

document.getElementById("openSidebarMenu").addEventListener("click", moveSidebar);
