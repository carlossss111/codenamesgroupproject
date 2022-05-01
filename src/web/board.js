RED_IMAGE = "url('../rsc/images/redteam.jpg')";
BLUE_IMAGE = "url('../rsc/images/blueteam.jpg')";
NEUTRAL_IMAGE = "url('../rsc/images/neutral.jpg')";
BOMB_IMAGE = "url('../rsc/images/bomb.jpg')";

DEBUG_SKIP_VALIDATION = false;
STRESS_TEST = false;


/**
 * Sets the timer maximum, runs it every second and handles
 * when the timer has ran out.
 */
class Timer {
    maxTime = null; // length of timer
    timeLeft; // time left in the turn
    timerVar; // for setInterval() calls

    /**
     * Set the timer length
     * @param {int} mTime the timer length
     */
    setMaxTime(mTime) {
        if (mTime) this.maxTime = mTime;
        else if (mTime != null)
            console.log("Warning: setMaxTime() has tried to use a falsy parameter (e.g undefined)");
    }

    /**
     * When the timer runs out
     */
    runOut = () => {
        clearInterval(this.timerVar);
        this.maxTime = null;
        if (choice != 2) {
            if (board.turn.team == "blue") finishGame("Red Team");
            else if (board.turn.team == "red") finishGame("Blue Team");
            board.turn = {"team": null, "role": null};
            updateTurnState();
        }
    }

    /**
     * Runs every second
     */
    tick = () => {
        //print the time left
        this.timeLeft--;
        document.getElementById("timerBar").style.width = 100*this.timeLeft/this.maxTime + '%';
        document.getElementById("timerBar").style.opacity = 1-this.timeLeft/this.maxTime + '';
        //run the "runOut()" method if the timer has ran out
        if (this.timeLeft < 0) 
            this.runOut();
    }

    /**
     * Restart the timer
     */
    reset = () => {
        if (this.maxTime == null) return;
        clearInterval(this.timerVar);
        this.timeLeft = this.maxTime;
        console.log(this);
        this.timerVar = setInterval(this.tick, 1000); //sets tick() to run every second
    }
}


/**
 * Card class for each card in the Boardstate class. This keeps track of the colour, 
 * word and status of each card and this is where the card is revealed with revealCard().
 */
class Card {    
    colour; // colour of the card
    word; // word on the card
    isRevealed; // whether the card is picked
    imageURL; // image link if the card
    div; // html div element

    /**
     * Called when a new card is created.
     * The new card is added to the board and attributes assigned. 
     * @param {string} colour the colour of the card
     * @param {string} word the word on the card
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

    /**
     * Update text on the card
     */
    updateText() {
        this.div.innerHTML = `<p>${this.word}</p>`;
    }
    
    /**
     * Reset card to unrevealed
     */
    coverCard() {
        this.isRevealed = false;
        this.div.style.transform = 'rotateY(0deg)';
        this.div.innerHTML = `<p>${this.word}</p>`;
        this.div.style.backgroundImage = '';
    }

    /**
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

    /**
     * On click, reveal the card and send that to the server
     * IMPORTANT NOTE: revealCard() call has been moved from here to board.update().receiveBoardState
     */
    cardListener() {
        var board = BoardState.getInstance();
        if (!board.validateClick(this)) return;
        board.sendBoardState(this);
    }
}


/**
 * BoardState class holds the state of the board at any given time while also holding the score
 * and the players turn. Done so every client has the correct copy of the board at the right time
 */
class BoardState extends Observer {
    static boardInstance; // instance of board itself
    cards = []; // list of cards
    room; // room id
    clueWord; // clue given by last spymaster
    numOfGuesses; // target number given by last spymaster
    redScore; // score in red team
    blueScore; // score in blue team
    timer; // timer instance
    totalHintsLeft; // hint left in one game
    ai = { // AI configuration
        "blueSm" : true,
        "blueSpy" : true,
        "redSm" : true,
        "redSpy" : true
    };
    player = { // player team/role
        "team": null,
        "role": null
    };
    turn = { // team/role of current turn
        "team": null,
        "role": null
    };

    /**
     * Singleton implementation of the BoardState class
     */
    static getInstance() {
        if (this.boardInstance == null) {
            this.boardInstance = new BoardState();
            return this.boardInstance;
        }
        return this.boardInstance;
    }

    /**
     * Called when the game begins and a new board is generated.
     */
    constructor() {
        super();

        //attribute assignments
        this.timer = new Timer();
        this.clueWord = null;
        this.numOfGuesses = null;
        this.redScore = 0;
        this.blueScore = 0;
        this.totalHintsLeft = 3;
        this.cards = new Array(5);
        for (var i = 0; i < this.cards.length; i++) {
            this.cards[i] = new Array(5);
        }
        document.getElementById("totalHints").innerHTML = this.totalHintsLeft;
    }

    /**
     * Returns whether the team and role match
     */
    isPlayersTurn() {
        return (this.player["team"] === this.turn["team"] &&
                this.player["role"] === this.turn["role"]);
    }

    /**
     * @returns true if it is AI's turn, false otherwise
     */
    isAITurn() {
        return (this.turn.team == "blue" && this.turn.role == "spymaster"   && this.ai.blueSm)
            || (this.turn.team == "blue" && this.turn.role == "spy"         && this.ai.blueSpy)
            || (this.turn.team == "red"  && this.turn.role == "spymaster"   && this.ai.redSm)
            || (this.turn.team == "red"  && this.turn.role == "spy"         && this.ai.redSpy)
    }

    /**
     * @returns true if next turn is a spy AI (for input clue recognization), false otherwise
     */
    isAISpy() {
        if (this.turn.team=="blue") return this.ai.blueSpy;
        else return this.ai.redSpy;
    }

    /**
     * @returns true if last turn is a spymaster AI (for difficulty control), false otherwise
     */
    isAISm() {
        if (this.turn.team=="blue") return this.ai.blueSm;
        else return this.ai.redSm;
    }

    /**
     * Validates a click to and returns true/false depending on whether the
     * click is a valid playable move. Should be called by the card object.
     * Server-side validation is still used, but should not need to be relied on in all cases.
     * @param {Card} cardSelected the card user picked
     * @returns true if the click is valid, false otherwise
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

    /**
     * Save board state to browser
     */
    saveToLocal() {
        //send board to server
        console.log('save to local');
        const data = {
            time: current.toLocaleString(),
            nickname: nickname,
            vocabulary: vocabulary,
            difficulty: difficulty,
            timerLength: this.timer.maxTime,
            clue: this.clueWord,
            numberOfGuesses: this.numOfGuesses,
            totalHintsLeft: this.totalHintsLeft,
            redScore: this.redScore,
            blueScore: this.blueScore,
            currentTurn: this.turn,
            player: this.player,
            turn: this.turn,
            ai: this.ai,
            cards: this.cards,
            endTurn: false,
            numOfPeople: 1,
            blueSpy: document.getElementById("blueSpy").innerHTML,
            blueSm: document.getElementById("blueSm").innerHTML,
            redSpy: document.getElementById("redSpy").innerHTML,
            redSm: document.getElementById("redSm").innerHTML,
        };
        console.log(data);
        localStorage.setItem('state', JSON.stringify(data));
    }

    /**
     * Sends the new boardstate and the card chosen to the server.
     * The server should then reply starting from the update() function.
     * @param {Card} cardSelected the chosen card
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
        server.sendToServer("sendBoardState", {
            "Protocol" : "sendBoardState",
            "clue" : this.clueWord,
            "numberOfGuesses" : this.numOfGuesses,
            "redScore" : this.redScore,
            "blueScore" : this.blueScore,
            "player" : this.player,
            "turn" : this.turn,
            "cardChosen" : `${i},${j}`,
            "cards" : this.cards,
            "endTurn" : false,
            "room" : this.room
        });
    }

    /**
     * Forwards the clue (after validation) to the server.
     */
    forwardClue() {
        let clue = document.getElementById("clue").value;
        let maxGuesses = document.getElementById("maxClues").value;

        //check that it is this player's turn and it is the spymaster's turn
        if (!this.isPlayersTurn() || this.turn.role != "spymaster")
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
                    document.getElementById("clue").value = '';
                    return;
                } else if (!vocabulary.includes(clue.toLowerCase()) && this.isAISpy()) {
                    alert("Word not recognized by AI spy. Please try again.");
                    document.getElementById("clue").value = '';
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

    /**
     * An overriding method of the observer class. This receives either the new board state
     * or a new clue and updates the client object to reflect any changes.
     * @param {string} eventName the name of event received from server
     * @param {JSON} incoming the data of event received from server
     */
    update(eventName, incoming) {
        switch (eventName) {
            case "receiveRoomInfo":
                //update number of people and player-name next to their role
                numOfPeople = incoming.numOfPeople;
                document.getElementById("numOfPeople").innerHTML = numOfPeople;
                document.getElementById("blueSpy").innerHTML = incoming.blueSpy;
                document.getElementById("blueSm").innerHTML = incoming.blueSm;
                document.getElementById("redSpy").innerHTML = incoming.redSpy;
                document.getElementById("redSm").innerHTML = incoming.redSm;
                break;

            case "syncRequest":
                //sync a new client to the room
                if (choice != 2) {
                    numOfPeople += 1;
                    syncRoomInfo();
                }
                break;

            case "syncPeople":
                //sync number of people in the room
                numOfPeople = incoming;
                document.getElementById("numOfPeople").innerHTML = numOfPeople;
                break;

            case "sendRoomInfo":
                //resend room info to server
                if (incoming.name == nickname)
                    server.sendToServer("chat", {
                        Protocol : "chat", 
                        message : `${incoming.message}`,
                        room : this.room,
                        team : this.player.team,
                        role : this.player.role
                    });
                break;

            case "roomError":
                //hosting a room that id exists or joining a room that doesn't exist
                alert(incoming);
                window.location.href = "../index.html";
                break;

            case "sendInitialBoardState":
                //receive initial board from server and initialise cards
                let receivedBoard = incoming.board;
                vocabulary = incoming.vocabulary;
                this.timer.setMaxTime(incoming.timerLength);

                //show timer
                if (this.timer.maxTime != null) {
                    document.getElementById("timerBar").style.display = "block";
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
                document.getElementById("welcome").style.display = "none";
                document.getElementById("teamBox").style.display = "none";
                document.querySelector(".clueBox").style.display = "block";
                if (choice != 2) startGame();
                break;

            case "receiveBoardState":
                //assign new board attributes
                this.clueWord = incoming.clue;
                this.numOfGuesses = incoming.numberOfGuesses;
                this.redScore = incoming.redScore;
                this.blueScore = incoming.blueScore;

                //play score win/lose audio
                if (this.turn.team == this.player.team) {
                    if (this.player.team == 'blue') {
                        if (document.getElementById("blueScore").innerText != this.blueScore) addScoreAudio();
                        else loseScoreAudio();
                    }
                    if (this.player.team == 'red') {
                        if (document.getElementById("redScore").innerText != this.redScore) addScoreAudio();
                        else loseScoreAudio();
                    }
                }

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
                    if (choice != 2) {
                        if (this.blueScore == 9) finishGame("Blue Team");
                        else if (this.redScore == 9) finishGame("Red Team");
                        else if (this.turn.team == "blue") finishGame("Red Team");
                        else if (this.turn.team == "red") finishGame("Blue Team");
                        this.turn = {"team": null, "role": null};
                        updateTurnState();
                    }
                    this.timer.maxTime = null;
                    return;
                }

                //continue game
                this.turn = incoming.turn;
                if ( incoming.turnOver && (this.isPlayersTurn() || (choice != 2 && this.isAITurn())) )
                    updateTurnState();
                break;

            case 'restoreState':
                //restore board state
                //card set up
                var bid = document.getElementById('board');
                var child = bid.lastElementChild;
                while (child) {
                    bid.removeChild(child);
                    child = bid.lastElementChild;
                }
                for (let i = 0; i < this.cards.length; i++) {
                    for (let j = 0; j < this.cards[0].length; j++) {
                        let team = incoming.cards[i][j]['colour'];
                        let word = incoming.cards[i][j]['word'];
                        this.cards[i][j] = new Card(team, word);
                        this.cards[i][j].coverCard();
                    }
                }
                //player set up
                nickname = incoming.nickname;
                vocabulary = incoming.vocabulary;
                difficulty = incoming.difficulty;
                this.player = incoming.player;
                this.turn = incoming.turn;
                this.ai = incoming.ai;
                this.totalHintsLeft = incoming.totalHintsLeft;
                this.timer.maxTime = incoming.timerLength;
                clearInterval(this.timer.timerVar);
                if (this.timer.maxTime != null) document.getElementById("timerBar").style.display = "block";
                else document.getElementById("timerBar").style.display = "none";
                if (this.player.role == "spy") enableSpyMode();
                else {
                    document.getElementById("clueButton").style.display = "inline-block";
                    document.getElementById("endTurn").style.display = "none";
                }
                //text set up
                document.getElementById("clue").value = incoming.clue;
                document.getElementById("maxClues").value = incoming.numberOfGuesses;
                document.getElementById("totalHints").innerHTML = incoming.totalHintsLeft;
                document.getElementById("room").innerHTML = "Difficulty: " + difficulty;
                break;
                
            case "forwardClue":
                //receive clue and targetNumber from server and update board attributes
                this.clueWord = incoming.clue;
                this.numOfGuesses = incoming.numberOfGuesses;
                this.turn = incoming.turn;
                
                //print the new clue on screen
                document.getElementById("clue").value = incoming.clue;
                document.getElementById("maxClues").value = incoming.numberOfGuesses;

                if ( this.isPlayersTurn() || (choice != 2 && this.isAITurn()) )
                    updateTurnState();
                break;

            case "spyHint":
                //get hint for spy player
                //find card matching hint
                var found = false;
                var hintCard, falseCard, i, j;
                for (i = 0; i < this.cards.length; i++) {
                    for (j = 0; j < this.cards[i].length; j++) {
                        if (this.cards[i][j].word == incoming.hint) {
                            hintCard = this.cards[i][j].div;
                            found = true; 
                            break;
                        }
                    }
                    if (found) break;
                }
                //pick another valid random card
                while (true) {
                    i = Math.floor(Math.random() * this.cards.length);
                    j = Math.floor(Math.random() * this.cards[i].length);
                    falseCard = this.cards[i][j];
                    
                    //check the fake hint is valid
                    if (falseCard.isRevealed == true
                     || falseCard.div.childNodes[0].getAttribute("class") == "hint"
                     || falseCard.colour == (this.turn.team + "Team"))
                        continue; //retry another card
                    
                    falseCard = falseCard.div;
                    break;
                }
                //style the hints
                hintCard.classList.add("hintCard");
                falseCard.classList.add("hintCard");

                //remove hint after t milliseconds
                setTimeout(function() {
                    hintCard.classList.remove("hintCard");
                    falseCard.classList.remove("hintCard");
                }, 4000);
                break;
            
            case "spymasterHint":
                //get hint for spymaster player
                //show clustered words on the board
                var hintList = incoming.hint;
                for (i = 0; i < this.cards.length; i++) {
                    for (j = 0; j < this.cards[i].length; j++) {
                        if (hintList.includes(this.cards[i][j].word)) {
                            let hintCard = this.cards[i][j].div;
                            hintCard.classList.add("hintCard");
                            setTimeout(function() {
                                hintCard.classList.remove("hintCard");
                            }, 4000)
                        }
                    }
                }
                break;

            case "hintError":
                //not enough words for hint
                alert(incoming);
                break;

            case "changeTurn":
                //change board state to the next turn
                //styling
                document.getElementById("turnAlert").style.display = "none";
                document.getElementById("hintButton").style.display = "none";
                document.getElementById("room").style.display = "inline-block";
                document.getElementById("blueSpy").style.color = "black";
                document.getElementById("blueSm").style.color = "black";
                document.getElementById("redSpy").style.color = "black";
                document.getElementById("redSm").style.color = "black";
                document.getElementById("blueSpy").classList.remove("blink");
                document.getElementById("blueSm").classList.remove("blink");
                document.getElementById("redSpy").classList.remove("blink");
                document.getElementById("redSm").classList.remove("blink");
                document.getElementById("timerBar").style.backgroundColor = "green";
                
                //change the turn and handle AI
                this.turn = incoming.currentTurn;
                console.log(this.turn);
                if (this.turn["team"] == "blue") {
                    if (this.turn["role"] == "spymaster") {
                        document.getElementById("blueSm").style.color = "lightgreen";
                        document.getElementById("blueSm").classList.add("blink");
                        if (choice != 2 && this.ai.blueSm) generateClue();
                    }
                    else {
                        document.getElementById("blueSpy").style.color = "lightgreen";
                        document.getElementById("blueSpy").classList.add("blink");
                        if (choice != 2 && this.ai.blueSpy) generateGuess();
                    }
                } 
                else if (this.turn["team"] == "red"){
                    if (this.turn["role"] == "spymaster") {
                        document.getElementById("redSm").style.color = "lightgreen";
                        document.getElementById("redSm").classList.add("blink");
                        if (choice != 2 && this.ai.redSm) generateClue();
                    }
                    else {
                        document.getElementById("redSpy").style.color = "lightgreen";
                        document.getElementById("redSpy").classList.add("blink");
                        if (choice != 2 && this.ai.redSpy) generateGuess();
                    }
                }

                //reset the timer
                this.timer.reset();

                //alert the player if their turn
                if (this.isPlayersTurn()) {
                    document.getElementById("room").style.display = "none";
                    document.getElementById("turnAlert").style.display = "inline-block";
                    document.getElementById("timerBar").style.backgroundColor = "red";
                    if (choice == 0 && this.totalHintsLeft > 0)
                        document.getElementById("hintButton").style.display = "inline-block";
                    if (this.player.role == "spymaster")
                        document.getElementById("clue").value = '';
                }
                break;

            case "gameOver":
                //display game over board layoyt
                gameOverAudio();
                document.querySelector(".clueBox").style.display = "none";
                document.getElementById("timerBar").style.width = "0";
                document.getElementById("timerBar").style.opacity = "1";
                document.getElementById("gameOver").style.display = "block";
                document.getElementById("winText").innerHTML = incoming.winTeam + " Wins!";
                if (incoming.winTeam == "Blue Team") document.getElementById("winText").style.color = "#3399ff";
                else document.getElementById("winText").style.color = "#ff5050";
                if (choice == 2) document.getElementById("restart").style.display = "none";
                if (choice == 1 && STRESS_TEST) server.sendToServer("restart", {"room": board.room});
                break;

            case "restartGame":
                //receive restart game message and refresh the page to restart game
                if (!params.has("people"))
                    var link = window.location.href + "&people=" + numOfPeople;
                else
                    var link = window.location.href.slice(0, -1) + numOfPeople;
                window.location.replace(link);
                break;

            case "hostQuit":
                //host quits room and force other user to quit
                if (choice == 2) {
                    alert("Host user quits room!");
                    quitRoom();
                }
                break;

            default:
                break;
        }
    }
}


/*------------------------- GAME LOBBY (ROLE SELECTION) ---------------------------*/

/**
 * When user click confirm on the welcome page, go to role selection page
 */
function welcomeConfirm() {
    document.getElementById("welcome").style.display = "none";
    document.getElementById("teamBox").style.display = "block";
    initGameBgAudio();
}

/**
 * Add user to a specific room
 * @param {boolean} isJoined true if the user has already joined the room, false otherwise
 */
function joinRoom(isJoined) {
    server.sendToServer("joinRoom", {
        "Protocol" : "joinRoom",
        "room" : board.room,
        "name" : nickname,
        "choice" : choice,
        "isJoined" : isJoined
    })
}

/**
 * Delete user from a specific room
 */
function quitRoom() {
    server.sendToServer("quitRoom", {
        "Protocal" : "quitRoom",
        "room" : board.room,
        "name" : nickname,
        "team" : board.player.team,
        "choice" : choice,
        "numOfPeople" : numOfPeople
    })
    alert("You have quit room " + board.room);
    window.location.href = "../index.html";
}

/**
 * When user click any button to choose a role, update role board text and send to server
 * to sync other clients
 * @param {string} newRole the new role user choose
 */
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
        "numOfPeople" : numOfPeople,
        "room" : board.room
    })
}

/**
 * When new client join the room, sync role choice and number of people
 */
function syncRoomInfo() {
    server.sendToServer("syncRoomInfo", {
        "blueSpy" : document.getElementById("blueSpy").innerHTML,
        "blueSm" : document.getElementById("blueSm").innerHTML,
        "redSpy" : document.getElementById("redSpy").innerHTML,
        "redSm" : document.getElementById("redSm").innerHTML,
        "numOfPeople" : numOfPeople,
        "room" : board.room
    })
}

/**
 * Send updated turn state to server
 */
function updateTurnState() {
    server.sendToServer("updateTurn", {
        "currentTurn" : board.turn,
        "room" : board.room
    })
}


/*----------------------------- GAME FUNCTIONALITIES -----------------------------*/

/**
 * Get AI configuration from the role information pane
 */
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

/**
 * Send request to server to get board initialised
 * @param {boolean} isBombCard whether the bomb card is set
 */
function boardInitialize(isBombCard) {
    document.getElementById("startGame").style.display = "none";

    server.sendToServer("createInitialBoardState", {
        "Protocol" : "createInitialBoardState",
        "TimerLength" : board.timer.maxTime,
        "BombCard" : isBombCard,
        "room" : board.room
    })
}

/**
 * Set board layout for spy
 */
function enableSpyMode() {
    console.log("spy mode enabled");
    for(var i = 0; i < board.cards.length; i++){
        for(var j = 0; j < board.cards[0].length; j++){
            board.cards[i][j].div.setAttribute("class",`card neutral`); 
        }
    }
    document.getElementById("clueButton").style.display = "none";
    document.getElementById("endTurn").style.display = "inline-block";
    document.getElementById("clue").placeholder = "";
    document.getElementById("clue").readOnly = true;
}

/**
 * Generate a clue and target number (AI)
 */
function generateClue() {
    server.sendToServer("generateClue", {
        "Protocol" : "generateClue",
        "board" : board,
    })
}

/**
 * Generate a list of guesses (AI)
 */
function generateGuess() {
    let aiLevel = difficulty;
    // if the AI spy is followed by human spymaster or in multiplayer mode, use highest AI level
    if (!board.isAISm() || choice == 1) aiLevel = "Hard";

    server.sendToServer("generateGuess", {
        "Protocol" : "generateGuess",
        "board" : board,
        "AIDifficulty" : aiLevel
    })
}

/**
 * When spy player choose to end their turn early
 */
function endSpyTurn() {
    if (!board.isPlayersTurn()) return;
    
    server.sendToServer("sendBoardState", {
        "Protocol" : "sendBoardState",
        "clue" : board.clueWord,
        "numberOfGuesses" : board.numOfGuesses,
        "redScore" : board.redScore,
        "blueScore" : board.blueScore,
        "player" : board.player,
        "turn" : board.turn,
        "cardChosen" : null,
        "cards" : board.cards,
        "endTurn" : true,
        "room" : board.room
    });
}

/**
 * Called by host user to start game
 */
function startGame() {
    board.turn = {"team" : "blue", "role" : "spymaster"};
    updateTurnState();
}

/**
 * Called by host user to end game
 * @param {string} winTeam the team that wins
 */
function finishGame(winTeam) {
    server.sendToServer("endGame", {
        "winner" : winTeam,
        "room" : board.room
    })
}

/**
 * Request a hint in single player mode, there are
 * 3 hints per game, 1 per turn
 */
function getHint() {
    //check if hint is valid
    var hintText = document.getElementById("hintText");
    document.getElementById("hintButton").style.display = "none";

    let tempText = hintText.innerHTML;
    if (board.player.role == "spy") {
        hintText.innerHTML = "Only one hint is correct!";
    } else {
        hintText.innerHTML = "Clue can be made from these words!";
    }

    //-1 to total hints
    board.totalHintsLeft--;

    setTimeout(function() {
        hintText.innerHTML = tempText;
        document.getElementById("totalHints").innerHTML = board.totalHintsLeft;
    }, 4000);

    //send for a hint
    server.sendToServer("hint", {
        "Protocol" : "hint",
        "board" : board
    })
}

/**
 * Move sidebar and board left and right
 */
function moveSidebar() {
    var container = document.querySelector(".sidebarContainer");
    var arrow = document.querySelector(".arrow");
    var noti = document.querySelector(".notificationIcon");

    if (isSidebarOpen) {
        notiVal = 0;
        document.getElementById('sidebarMenu').style.opacity = "0";
        document.getElementById('noti').innerHTML = notiVal;
        document.getElementById("board").style.transform = "translateX(15%)";
        arrow.style.transform = "rotate(135deg)";
        noti.style.display = "block";
        container.style.width = "0";
        isSidebarOpen = false;
    }
    else {
        document.getElementById('sidebarMenu').style.opacity = "1";
        document.getElementById("board").style.transform = "translateX(0)";
        arrow.style.transform = "rotate(-45deg)";
        noti.style.display = "none"; 
        container.style.width = "20em";
        isSidebarOpen = true;
    }
}


/*---------------------------- BOARD STATE SAVE/RESTORE -----------------------------*/

/**
 * Save game state to local storage in one's turn
 */
function saveState() {
    if (document.getElementById('teamBox').style.display != 'none' || 
        document.getElementById('welcome').style.display != 'none') {
        alert('Please start game first!');
        return;
    }
    if (!board.isPlayersTurn()) {
        alert('Please save game in your turn!');
        return;
    }
    console.log('find local data');
    const data = JSON.parse(localStorage.getItem('state'));
    if (data) {
        let savedTime = data.time;
        if (!confirm('Last save: ' + savedTime + '\nDo you want to save again?\nLast saved state will be lost.'))
            return;
    }
    console.log('save state');
    board.saveToLocal();
    alert('State saved!');
}

/**
 * Restore game state from local storage in one's turn or before game starts
 */
function restoreState() {
    console.log('find local data');
    const data = JSON.parse(localStorage.getItem('state'));
    if (!board.isPlayersTurn()) {
        alert('Please restore game in your turn or before game starts!');
        return;
    }
    if (data) {
        let savedTime = data.time;
        if (!confirm('Last save: ' + savedTime + '\nDo you want to restore?\nAll current state will be lost.'))
            return;
        console.log(data);
        board.update('receiveRoomInfo', data);
        board.update('restoreState', data);
        board.update('receiveBoardState', data);
        board.update('changeTurn', data);
        document.getElementById("setBox").style.display = "none";
    } else {
        alert('No saved state!');
        return;
    }
    if (document.getElementById('teamBox').style.display != 'none' || 
        document.getElementById('welcome').style.display != 'none') {
        document.getElementById("welcome").style.display = "none";
        document.getElementById("teamBox").style.display = "none";
        document.querySelector(".clueBox").style.display = "block";
        initGameBgAudio();
    }
}


/*------------------------------- FONT SETTINGS -------------------------------*/

document.getElementById("font").onchange = function () {
    let val = this.value;
    document.getElementById("fontVal").innerText = val;
    var words = document.querySelectorAll(".card p");
    for (let i = 0; i < words.length; i++) {
        if (val <= 20) words[i].style.fontSize = "0.5em";
        else if (val <= 40) words[i].style.fontSize = "0.75em";
        else if (val <= 60) words[i].style.fontSize = "1em";
        else if (val <= 80) words[i].style.fontSize = "1.25em";
        else words[i].style.fontSize = "1.5em";
    }
}


/*--------------------------- COLOUR SCHEMES FOR DISABILITY ----------------------------*/

const indicator = document.querySelector('.barIndicator');
const items = document.querySelectorAll('.navItem');

/**
 * Handle the position of bar indicator when user made a choice
 * @param {EventTarget} el 
 */
function handleIndicator(el) {
    indicator.style.width = `${el.offsetWidth}px`;
    indicator.style.left = `${el.offsetLeft}px`;
    indicator.style.backgroundColor = "red";
}

items.forEach((item, index) => {
    item.addEventListener('click', (e) => {handleIndicator(e.target)});
});

/**
 * Set board colour to fit deuteranopia
 */
function deuteranopiafunction() {
    var cols = document.getElementsByClassName('blueTeam');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#3399ff";
    }

    var cols = document.getElementsByClassName('redTeam');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#A27800";
    }

    var cols = document.getElementsByClassName('neutral');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#D9B08C";
    }
}

/**
 * Set board colour to fit tritanopia
 */
function tritanopiafunction() {
    var cols = document.getElementsByClassName('blueTeam');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#00A5B1";
    }

    var cols = document.getElementsByClassName('neutral');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#D7ACB9";
    }
}

/**
 * Set board colour to fit protanopia
 */
function protanopiafunction() {
    var cols = document.getElementsByClassName('blueTeam');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#6792FA";
    }

    var cols = document.getElementsByClassName('redTeam');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#998E65";
    }

    var cols = document.getElementsByClassName('neutral');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#C4B78D";
    }
}

/**
 * Set board colour to normal
 */
function normalColours() {
    var cols = document.getElementsByClassName('blueTeam');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#3399ff";
    }

    var cols = document.getElementsByClassName('redTeam');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "#ff5050";
    }

    var cols = document.getElementsByClassName('neutral');
    for(i = 0; i < cols.length; i++) {
        cols[i].style.backgroundColor = "tan";
    }
}


/*------------------------------ GAME SETUP -------------------------------*/

var current = new Date();
var board = BoardState.getInstance();
server.registerObserver(board);
console.log(server.observers);

// Parse attributes from query string in URL
const params = new URLSearchParams(window.location.search)
var choice = params.get("choice");
board.room = params.get("room");
document.getElementById("room").innerHTML = "Room: " + board.room;
var nickname = params.get("nickname").replace('_', ' ');

var vocabulary;
var tmpName = "";
var role = "";
var notiVal = 0;
var numOfPeople = 1;
var isSidebarOpen = false;

// Adjust layout according to different game mode
if (choice != 2) {
    var isBombCard = params.get("isBomb");
    let timer = params.get("timer");
    var difficulty = params.get("difficulty");
    console.log(difficulty);
    if (isBombCard == 'y') isBombCard = true;
    else isBombCard = false;
    if (timer != 'n') board.timer.setMaxTime(timer);
    var welcomeText = "When all players joined, press START to initialize board";
    if (choice == 0) {
        welcomeText = "Please choose your team and role";
        document.getElementById("room").innerHTML = "Difficulty: " + difficulty;
        document.querySelector(".sidebarContainer").style.display = "none";
        document.getElementById("people").style.display = "none";
        document.getElementById("numOfPeople").style.display = "none";
        document.getElementById("localStorage").style.display = "block";
    }
} else {
    var welcomeText = "Please wait for the host to start game";
    document.getElementById("startGame").style.display = "none";
}
if (choice != 0) {
    document.getElementById("hintText").style.display = "none";
    document.getElementById("hintButton").style.display = "none";
}

if (params.has("people")) {
    joinRoom(true);
    numOfPeople = parseInt(params.get("people"), 10);
    document.getElementById("numOfPeople").innerHTML = numOfPeople;
} else {
    joinRoom(false);
}

document.getElementById("welcomeName").innerHTML = nickname;
document.getElementById("welcomeText").innerHTML = welcomeText;
document.getElementById("teamBox").style.display = "none";
document.getElementById("turnAlert").style.display = "none";
document.getElementById("endTurn").style.display = "none";
document.querySelector(".clueBox").style.display = "none";

document.getElementById("joinBlueSpy").onclick = function() {chooseRole("blueSpy");};
document.getElementById("joinBlueSm").onclick = function() {chooseRole("blueSm");};
document.getElementById("joinRedSpy").onclick = function() {chooseRole("redSpy");};
document.getElementById("joinRedSm").onclick = function() {chooseRole("redSm");};
document.getElementById("startGame").onclick = function() {boardInitialize(isBombCard);};
document.getElementById("openSidebarMenu").onclick = function() {moveSidebar();};
document.getElementById("welcomeConfirm").onclick = function() {welcomeConfirm();};
document.getElementById("clueButton").onclick = function() {board.forwardClue();};
document.getElementById("endTurn").onclick = function() {endSpyTurn();};
document.getElementById("hintButton").onclick = function() {getHint();};
document.getElementById("quitRoom").onclick = function() {quitRoom();};
document.getElementById("restart").onclick = function() {server.sendToServer("restart", {"room": board.room});};

// Stress test mode
if (board.room.includes("STRESSTEST")) STRESS_TEST = true;
if (choice == 1 && STRESS_TEST) boardInitialize(isBombCard);