<<<<<<< HEAD
/*
Card class, this is where the card is created using a colour and a word and is given
an action listener to check for when it has been clicked
*/

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

class Card
{
    div;
=======
//Symbolic Constants
RED_IMAGE = "url('../rsc/images/redteam.jpg')";
BLUE_IMAGE = "url('../rsc/images/blueteam.jpg')";
NEUTRAL_IMAGE = "url('../rsc/images/neutral.jpg')";
BOMB_IMAGE = "url('../rsc/images/bomb.jpg')";

GAME_BG_AUDIO = "../rsc/audio/bg.mp3";
GAME_FLIP_AUDIO = "../rsc/audio/flip.mp3";

DEBUG_SKIP_VALIDATION = true;
var bgAudioCtx;
var flipAudioVolume = 1;
/*
 * Card class for each card in the Boardstate class. This keeps track of the colour, 
 * word and status of each card and this is where the card is revealed with revealCard().
 */
class Card {
>>>>>>> WebDev
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

<<<<<<< HEAD
        this.initialize(colour, word);
    }

    initialize(colour, word) {
        let cardDiv = document.createElement("div");
        let boardDiv = document.getElementById("board");
        cardDiv.setAttribute("class",`card ${colour}`); 
        //cardDiv.setAttribute("class",`card neutral`); 
        cardDiv.innerHTML = "<p>" + word + "</p>";
        boardDiv.appendChild(cardDiv);
        //cardDiv.addEventListener("click", this.revealCard);
        cardDiv.colour = colour;
        cardDiv.word = word;
        this.div = cardDiv;
=======
        //create card
        this.div = document.createElement("div");
        this.div.setAttribute("class", `card ${colour}`);
        this.div.innerHTML = `<p>${word}</p>`;

        //add card to the board
        boardDiv = document.getElementById("board");
        boardDiv.appendChild(this.div);

        //add click listener to card
        this.div.addEventListener("click", this.cardListener.bind(this));
>>>>>>> WebDev
    }

    /*
     * Reveals the card on the board by changing the image and setting isRevealed to true. 
     * This should be called whenever an updated boardstate is received from the server.
     */
    revealCard() {
        if (!this.isRevealed) {
            playFlipVoice()
        }

        //set attributes and remove text
        this.isRevealed = true;
        this.div.innerHTML = "";
        // console.log(this.div)
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
     */
    cardListener() {
        var board = BoardState.getInstance();

        if (!board.validateClick(this))
            return;
        this.revealCard(); //TODO: remove this and replace it with the card being revealed when the server sends something back

        board.sendBoardState(this);
    }
}

<<<<<<< HEAD
=======
var demoSet = [
    [
        new Card("blueTeam", "water"), new Card("redTeam", "bulb"), new Card("neutral", "crown"),
        new Card("neutral", "frog"), new Card("neutral", "crystal")
    ],
    [
        new Card("redTeam", "trunk"), new Card("redTeam", "slip"), new Card("bombCard", "boom"),
        new Card("blueTeam", "bolt"), new Card("redTeam", "boxer")
    ],
    [
        new Card("blueTeam", "coach"), new Card("redTeam", "fan"), new Card("neutral", "skyscraper"),
        new Card("redTeam", "gold"), new Card("blueTeam", "snowman")
    ],
    [
        new Card("neutral", "america"), new Card("blueTeam", "pizza"), new Card("neutral", "park"),
        new Card("blueTeam", "flat"), new Card("blueTeam", "carrot")
    ],
    [
        new Card("blueTeam", "whistle"), new Card("neutral", "hide"), new Card("neutral", "ball"),
        new Card("blueTeam", "bond"), new Card("neutral", "tower")
    ]
]
>>>>>>> WebDev

/*
BoardState class holds the state of the board at any given time while also holding the score
and the players turn. Done so every client has the correct copy of the board at the right time
*/
class BoardState extends Observer {
<<<<<<< HEAD
    room;
=======
    static boardInstance;

>>>>>>> WebDev
    cards = [];
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
<<<<<<< HEAD
        "team" : null,
        "role" : null
    };
=======
        "team": null,
        "role": null
    }

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
>>>>>>> WebDev

    /*
     * **DO NOT CREATE WITH new(), USE getInstance()**
     *
     * Called when the game begins and a new board is generated.
     * TODO: the new board needs to be sent to the server at the start.
     */
    constructor() {
        super();

        //attribute assignments
        this.clueWord = null;
        this.numOfGuesses = null;
        this.redScore = 0;
<<<<<<< HEAD
        this.blueScore = 0; 
        //let bombX = Math.floor(Math.random() * 4);
        //let bombY = Math.floor(Math.random() * 4);
        this.cards = new Array(5);
        for (var i = 0; i < this.cards.length; i++) {
            this.cards[i] = new Array(5);
        }
    }

    cardListener(event) {
        if (!this.isPlayersTurn() || this.player.role == "spymaster") return;
        var card = null;
        for(var i = 0; i < this.cards.length; i++){
            for(var j = 0; j < this.cards[0].length; j++){
                if(event.target == this.cards[i][j].div){
                    card = this.cards[i][j];
                    break;
                }
            }
        }
        card.revealCard();
        this.sendBoardState(card);
    }

    //return true if it is this client's turn
    isPlayersTurn() {
        return (    this.player["team"] === this.turn["team"] 
            &&      this.player["role"] === this.turn["role"]);
=======
        this.blueScore = 0;
        this.cards = demoSet; //TODO: replace with a randomly generated set (server side?)
    }

    /*
     * Returns whether the team and role match
     */
    isPlayersTurn() {
        return (this.player["team"] === this.turn["team"] &&
            this.player["role"] === this.turn["role"]);
>>>>>>> WebDev
    }

    //return true if it is AI's turn
    isAITurn() {
        return (this.turn.team=="blue" && this.turn.role=="spymaster" && this.ai.blueSm)
            || (this.turn.team=="blue" && this.turn.role=="spy" && this.ai.blueSpy)
            || (this.turn.team=="red" && this.turn.role=="spymaster" && this.ai.redSm)
            || (this.turn.team=="red" && this.turn.role=="spy" && this.ai.redSpy)
    }

    //return true if next turn is a spy AI (for input clue recognization)
    isAISpy() {
        if (this.turn.team=="blue") return this.ai.blueSpy;
        else return this.ai.redSpy;
    }

    /*
<<<<<<< HEAD
    used to see whether the player who clicked the card is the player who is supposed
    to be taking there turn right now. if not then it will not do anything to the board
    If it is the correct player then the board will update.
    */
    validateClick(cardSelected,turn) {
        if(cardSelected.isRevealed == true) return false;
        else if(turn.team != this.player.team) return false;
        else if(turn.role != this.player.role) return false;
=======
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

        //check it is this team's turn
        if (this.turn.team != this.player.team)
            return false;
        if (this.turn.role != this.player.role)
            return false;

        //check it is the spy's turn
        if (this.turn != "spymaster")
            return false;

>>>>>>> WebDev
        return true;
    }

    /*
     * Sends the new boardstate and the card chosen to the server.
     * The server should then reply starting from the update() function.
     */
    sendBoardState(cardSelected) {
        var i, j, found = false;
<<<<<<< HEAD
        
        //find and store indexes of the selected card
        for(i = 0; i < this.cards.length; i++){
            for(j = 0; j < this.cards[i].length; j++){
                if(this.cards[i][j].div == cardSelected.div){
=======

        //find and store indexes of the selected card
        for (i = 0; i < this.cards.length; i++) {
            for (j = 0; j < this.cards[i].length; j++) {
                if (this.cards[i][j].div == cardSelected.div) {
>>>>>>> WebDev
                    found = true;
                    break;
                }
            }
<<<<<<< HEAD
            if(found)
=======
            if (found)
>>>>>>> WebDev
                break;
        }

        //check the card has been found in the array (critical error if not)
<<<<<<< HEAD
        if(!found)
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
=======
        if (!found)
            throw new Error("The card selected cannot not been found in the card array");

        //send board including the chosen card position to server
        server.sendToServer("sendBoardState", {
            "Protocol": "sendBoardState",
            "clue": this.clueWord,
            "numberOfGuesses": this.numOfGuesses,
            "redScore": this.redScore,
            "blueScore": this.blueScore,
            "timerLength": this.timer,
            "player": this.player,
            "turn": this.turn,
            "cardChosen": `${i},${j}`,
            "cards": this.cards
>>>>>>> WebDev
        });
    }

    /*
<<<<<<< HEAD
    Makes sure clue is not already one on the board and then forwards the clue to the 
    server(and then to the other players) 
    */
    forwardClue() {
        //check that it is this player's turn and it is the spymaster's turn
        if (!this.isPlayersTurn()) return;
        //checks if clue is on the board if it is then break and not send to server
        else {
            let clue = document.getElementById("clue").value;
            let maxGuesses = document.getElementById("maxClues").value;
            let valid = true;

            for (let i = 0; i < this.cards.length; i++) {
                for (let j = 0; j < this.cards[0].length; j++) {
                    if (clue.toLowerCase() == this.cards[i][j].word) {
                        valid = false;
                        alert("Clue cannot be the same as board words!");
                        break;
                    } else if (!vocabulary.includes(clue.toLowerCase()) && this.isAISpy()) {
                        valid = false;
                        alert("Word not recognized by AI spy. Please try again.");
                        return;
                    }
                }
            }
            //if clue is valid then send to the server
            if (valid)
            {
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
        }
    }

    /*
    Receives information from the server ad will update when necessary for all clients
    */
    update(eventName, args) {
        switch (eventName) {
            case "receiveBoardState":
                this.clueWord = args.clue;
                this.numOfGuesses = args.numberOfGuesses;
                this.redScore = args.redScore;
                document.getElementById("redScore").innerText = this.redScore;
                this.blueScore = args.blueScore;
                document.getElementById("blueScore").innerText = this.blueScore;
                this.timer = args.timerLength;
                for(var i=0; i<5; i++){
                    for(var j=0; j<5; j++){
                        if(args.cards[i][j].isRevealed)
                            this.cards[i][j].revealCard();
                    }
                }
                //Check if game is over
                if (this.blueScore == 9 || this.redScore == 9 || args.bombPicked) {
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
                //Continue game
                this.turn = args.turn;
                if ( (args.turnOver && this.isPlayersTurn()) || (choice == 1 && this.isAITurn()) )
                    updateTurnState();
                break;

            case "forwardClue":
                this.clueWord = args.clue;
                this.numOfGuesses = args.numberOfGuesses;
                document.getElementById("clue").value = args.clue;
                document.getElementById("maxClues").value = args.numberOfGuesses;
                //let currentDiv = document.getElementById("board");
                //currentDiv.turn = args.turn;
                this.turn = args.turn;
                if ( this.isPlayersTurn() || (choice == 1 && this.isAITurn()) )
                    updateTurnState();
                break;

            case "sendInitialBoardState":
                let receivedBoard = args.board;
                vocabulary = args.vocabulary;
                this.timer = args.timerLength;
                if (this.timer != null) {
                    document.getElementById("timeLeft").style.display = "inline";
                    document.getElementById("timer").innerHTML = this.timer;
                }
                for (let i = 0; i < this.cards.length; i++) {
                    for (let j = 0; j < this.cards[0].length; j++){
                        let team = receivedBoard[i*this.cards.length+j]["type"];
                        let word = receivedBoard[i*this.cards.length+j]["name"];
                        this.cards[i][j] = new Card(team, word);
                        this.cards[i][j].div.addEventListener("click", this.cardListener.bind(this));
                    }
                }
                getAIConfig();
                console.log(this.ai);
                if (this.player.role == "spy") enableSpyMode();
                document.getElementById("joinBlueSpy").style.display = "none";
                document.getElementById("joinBlueSm").style.display = "none";
                document.getElementById("joinRedSpy").style.display = "none";
                document.getElementById("joinRedSm").style.display = "none";
                if (choice == 1) startGame();
                break;

            case "receiveRole":
                document.getElementById("blueSpy").innerHTML = args.blueSpy;
                document.getElementById("blueSm").innerHTML = args.blueSm;
                document.getElementById("redSpy").innerHTML = args.redSpy;
                document.getElementById("redSm").innerHTML = args.redSm;
                break;

            case "syncRequest":
                if (choice == 1) syncNewClient('sync');
                break;

            case "changeTurn":
                document.getElementById("turnAlert").style.display = "none";
                if (this.timer != null) clearInterval(timerVar);
                this.turn = args.currentTurn;
                document.getElementById("blueSpy").style.fontSize = "1em";
                document.getElementById("blueSm").style.fontSize = "1em";
                document.getElementById("redSpy").style.fontSize = "1em";
                document.getElementById("redSm").style.fontSize = "1em";
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
                } else if (this.turn["team"] == "red"){
                    if (this.turn["role"] == "spymaster") {
                        document.getElementById("redSm").style.fontSize = "1.5em";
                        if (choice == 1 && this.ai.redSm) generateClue();
                    }
                    else {
                        document.getElementById("redSpy").style.fontSize = "1.5em";
                        if (choice == 1 && this.ai.redSpy) generateGuess();
                    }
                }
                if (this.timer != null) {
                    document.getElementById("timer").innerHTML = this.timer;
                    timerVar = setInterval(timerCount, 1000);
                }
                if (this.isPlayersTurn())
                    document.getElementById("turnAlert").style.display = "block";
                break;

            case "sendRoomInfo":
                if (args.name == nickname)
                    server.sendToServer("chat", {Protocol : "chat", message : `${args.message}`});
                break;

            case "gameOver":
                document.getElementById("timeLeft").style.display = "none";
                alert(args.winTeam + " Wins!");
                break;

            default:
                break;
        }
    }
}

// Game starts here
var choice = prompt("Host a game (1) or join a game (2)?");

var nickname = prompt("Enter your nickname:", "Cool Guy");
var tmpName = "";
var timerVar;

var board = new BoardState();
server.registerObserver(board);

var role = "";
var isBombCard;
var vocabulary;

if (choice == 1) {
    board.room = prompt("Enter name of your hosted room:", "Great Hall");
    isBombCard = prompt("Do you want Bomb Card in the board? (y/n)", 'y');
    if (prompt("Do you want timer for one turn? (y/n)", 'y') == 'y')
        board.timer = prompt("Enter timer length for one turn", '30');
    alert("When all players joined, press START to initialize board.");
    if (isBombCard == 'y') isBombCard = true;
    else isBombCard = false;
}
else {
    board.room = prompt("Enter name of the room to join:", "Great Hall");
    alert("Please wait for the host to start game.");
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
=======
     * Forwards the clue (after validation) to the server.
     */
    forwardClue() {
        //get the clue and number of guesses from the page
        var clue = document.getElementById("clue").value;
        var maxGuesses = document.getElementById("maxClues").value;

        //check that a clue can be forwarded
        if (!this.isPlayersTurn || this.turn.role != "spymaster")
            return;

        //check that the clue is not the same as one already in the board
        this.cards.forEach(row => {
            row.forEach(card => {
                if (clue == card.word) {
                    console.log("The clue given cannot be the same as a word on the board.");
                    return;
                }
            })
        });

        //send the clue to the server
        server.sendToServer("forwardClue", {
            "Protocol": "forwardClue",
            "clue": clue,
            "numberOfGuesses": maxGuesses,
            "player": this.player,
            "turn": this.turn
        })
    }

    /*
     * An overriding method of the observer class. This receives either the new board state
     * or a new clue and updates the client object to reflect any changes.
     */
    update(eventName, incoming) {
        if (eventName == "receiveBoardState") {
            //assign new clue, score, turn and timer length to the client board object
            this.clueWord = incoming.clue;
            this.numOfGuesses = incoming.numberOfGuesses;
            this.redScore = incoming.redScore;
            this.blueScore = incoming.blueScore;
            this.timer = incoming.timerLength;
            this.turn = incoming.turn;

            //reveal new cards locally
            for (let i = 0; i < incoming.cards.length; i++) {
                for (var j = 0; j < incoming.cards[i].length; j++) {
                    if (incoming.cards[i][j].isRevealed)
                        this.cards[i][j].revealCard();
                    this.cards[i][j].colour = incoming.cards[i][j].colour;
                    this.cards[i][j].word = incoming.cards[i][j].word;
                }
            }
        } else if (eventName == "forwardClue") {
            //assign new clue and turn to the client board object
            this.clueWord = incoming.clue;
            this.numOfGuesses = incoming.numberOfGuesses;
            this.turn = incoming.turn;

            //print the new clue on screen
            document.getElementById("clue").value = this.clue;
            document.getElementById("maxClues").value = this.numberOfGuesses;
        }
    }

    /*
     * Temporary implementation for when the game is finished
     */
    finishGame(hasWon) {
        if (hasWon) {
            let newDiv = document.createElement("div");
            const currentDiv = document.getElementById("board");
            newDiv.innerHTML = "<p>" + 'YOU WON' + "</p>";
            newDiv.style.width = 1000;
            newDiv.style.height = 500;
            newDiv.style.colour = "green";
            currentDiv.appendChild(newDiv);
        } else return;
    }
}

//randomizes the board (not cards) for debug purposes
function DEBUG_boardRandomizer(board) {
    board.clueWord = "word";
    board.numOfGuesses = Math.floor(Math.random() * 5); //0-4
    board.redScore = Math.floor(Math.random() * 11); //0-10
    board.blueScore = Math.floor(Math.random() * 11); //0-10
    board.timer = 100;
    Math.floor(Math.random() * 2) ? board.player.team = "red" : board.player.team = "blue";
    Math.floor(Math.random() * 2) ? board.player.role = "spy" : board.player.role = "spymaster";
    Math.floor(Math.random() * 2) ? board.turn.team = "red" : board.turn.team = "blue";
    Math.floor(Math.random() * 2) ? board.turn.role = "spy" : board.turn.role = "spymaster";
}

//TEST FUNCTIONALITY
var board = BoardState.getInstance();
server.registerObserver(board);
board.turn = {
    "team": "red",
    "role": "spymaster"
};
board.player = {
    "team": "red",
    "role": "spymaster"
};

document.getElementById("joinSpy").addEventListener("click", () => {
    console.log("spy mode enabled");
    board.turn.role = "spy";
    board.player.role = "spy";
    for (var i = 0; i < board.cards.length; i++) {
        for (var j = 0; j < board.cards[0].length; j++) {
            board.cards[i][j].div.setAttribute("class", `card neutral`);
        }
    }

    document.getElementById("clueButton").style.display = "none";
    document.getElementById("clue").readOnly = true;
    document.getElementById("clue").placeholder = "";
    document.getElementById("maxClues").disabled = true;
})




//Moves board left and right to accomodate for the sidepanel
function MoveBoard() {
    if (document.getElementById("openSidebarMenu").checked == true) {
        document.getElementById("board").style.transform = "translateX(0)";
    } else if (document.getElementById("openSidebarMenu").checked == false) {
        document.getElementById("board").style.transform = "translateX(15%)";

    }

}

function initGameBgAudio() {
    bgAudioCtx = new Audio(GAME_BG_AUDIO);
    // loop play
    bgAudioCtx.onended = function () {
        bgAudioCtx.play();
    }
    bgAudioCtx.play();
}
initGameBgAudio();

function playFlipVoice() {
    var flipAudioCtx = new Audio(GAME_FLIP_AUDIO);
    flipAudioCtx.volume = flipAudioVolume;
    flipAudioCtx.play();
}
document.getElementById("effectAudio").onchange = function () {
    let val = this.value;
    document.getElementById("effectAudioVal").innerText = val;
    flipAudioVolume = val / 100;
}

document.getElementById("music").onchange = function () {
    let val = this.value;
    document.getElementById("musicVal").innerText = val;
    bgAudioCtx.volume = val / 100;
}

document.getElementById("back").onclick = function () {
    document.getElementById("setBox").style.display = "none";
}
document.getElementById("set").onclick = function () {
    document.getElementById("setBox").style.display = "block";
}
>>>>>>> WebDev
