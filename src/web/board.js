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
        //"TimerLength" : 30, This can be set in other ways
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
    colour;
    word; 
    isRevealed; 
    imageURL;   

    constructor(colour, word)
    {
        this.colour = colour;
        this.word = word;
        this.isRevealed = false;

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
    }

    /*
    revealCard is used to reveal the caard on the screen to the clients when the card is clicked
    Will call other functions such as validateClick to make sure the click is done only by the
    correct client and not anyone.

    Had to pass this.colour as passing the card caused issues with the variables
    later fix to either pass all elements of the card fix to make the card itself work
    */
    revealCard()
    {
        var colour = this.colour;
        let cardDiv = this.div;
        this.isRevealed = true;
        this.div.innerHTML = "";
    
        cardDiv.style.backgroundSize = "cover";
        if(colour == "redTeam") 
            cardDiv.style.backgroundImage = "url('../rsc/images/redteam.jpg')";
        else if(colour == "blueTeam") 
            cardDiv.style.backgroundImage = "url('../rsc/images/blueteam.jpg')";
        else if(colour == "neutral") 
            cardDiv.style.backgroundImage = "url('../rsc/images/neutral.jpg')";
        else if(colour == "bombCard")
            cardDiv.style.backgroundImage = "url('../rsc/images/bomb.jpg')";
    }
}


/*
BoardState class holds the state of the board at any given time while also holding the score
and the players turn. Done so every client has the correct copy of the board at the right time
*/
class BoardState extends Observer {
    room;
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
        "team" : null,
        "role" : null
    };
    turn = {
        "team" : null,
        "role" : null
    };

    constructor()
    {
        super();
        this.clueWord = null;
        this.numOfGuesses = null;
        this.redScore = 0;
        this.blueScore = 0; 
        //let bombX = Math.floor(Math.random() * 4);
        //let bombY = Math.floor(Math.random() * 4);
        this.cards = new Array(5);
        for (var i = 0; i < this.cards.length; i++) {
            this.cards[i] = new Array(5);
        }
    }

    cardListener(event){
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
    isPlayersTurn(){
        return (    this.player["team"] === this.turn["team"] 
            &&      this.player["role"] === this.turn["role"]);
    }

    //return true if it is AI's turn
    isAITurn(){
        return (this.turn.team=="blue" && this.turn.role=="spymaster" && this.ai.blueSm)
            || (this.turn.team=="blue" && this.turn.role=="spy" && this.ai.blueSpy)
            || (this.turn.team=="red" && this.turn.role=="spymaster" && this.ai.redSm)
            || (this.turn.team=="red" && this.turn.role=="spy" && this.ai.redSpy)
    }

    /*
    used to see whether the player who clicked the card is the player who is supposed
    to be taking there turn right now. if not then it will not do anything to the board
    If it is the correct player then the board will update.
    */
    validateClick(cardSelected,turn){
        if(cardSelected.isRevealed == true) return false;
        else if(turn.team != this.player.team) return false;
        else if(turn.role != this.player.role) return false;
        return true;
    }

    /*
    sends the board state to the server, done when the player has clicked a card
    on the board and made sure it is the correct player.
    */
    sendBoardState(cardSelected){
        var i, j, found = false;
        
        //find and store indexes of the selected card
        for(i = 0; i < this.cards.length; i++){
            for(j = 0; j < this.cards[i].length; j++){
                if(this.cards[i][j].div == cardSelected.div){
                    found = true;
                    break;
                }
            }
            if(found)
                break;
        }

        //check the card has been found in the array (critical error if not)
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
        });
    }

    /*
    
    Makes sure clue is not already one on the board and then forwards the clue to the 
    server(and then to the other players) 
    */
    forwardClue(){
        //check that it is this player's turn and it is the spymaster's turn
        if (!this.isPlayersTurn()) return;
        //checks if clue is on the board if it is then break and not send to server
        else {
            let clue = document.getElementById("clue").value;
            let maxGuesses = document.getElementById("maxClues").value;
            let valid = true;

            for (let i = 0; i < this.cards.length; i++) {
                for (let j = 0; j < this.cards[0].length; j++){
                    if(clue.toLowerCase() == this.cards[i][j].word){
                        valid = false;
                        alert("Clue cannot be the same as board words!");
                        break;
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
    update(eventName, args){
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
                if (board.player.role == "spy") enableSpyMode();
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
                if (this.isPlayersTurn())
                    alert("It's your turn!");
                break;

            case "sendRoomInfo":
                if (args.name == nickname)
                    server.sendToServer("chat", {Protocol : "chat", message : `${args.message}`});
                break;

            case "gameOver":
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

var board = new BoardState();
server.registerObserver(board);

var role = "";
var isBombCard;

if (choice == 1) {
    board.room = prompt("Enter name of your hosted room:", "Great Hall");
    isBombCard = prompt("Do you want Bomb Card in the board? (y/n)", 'y');
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
document.getElementById("room").innerHTML = "Room: " + board.room;
joinRoom()

document.getElementById("joinBlueSpy").onclick = function() {chooseRole("blueSpy");};
document.getElementById("joinBlueSm").onclick = function() {chooseRole("blueSm");};
document.getElementById("joinRedSpy").onclick = function() {chooseRole("redSpy");};
document.getElementById("joinRedSm").onclick = function() {chooseRole("redSm");};

document.getElementById("startGame").onclick = function() {boardInitialize(isBombCard);};
