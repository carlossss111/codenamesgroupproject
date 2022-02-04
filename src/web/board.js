//Symbolic Constants
RED_IMAGE = "url('../rsc/images/redteam.jpg')";
BLUE_IMAGE = "url('../rsc/images/blueteam.jpg')";
NEUTRAL_IMAGE = "url('../rsc/images/neutral.jpg')";
BOMB_IMAGE = "url('../rsc/images/bomb.jpg')";

DEBUG_SKIP_VALIDATION = true;

/*
* Card class for each card in the Boardstate class. This keeps track of the colour, 
* word and status of each card and this is where the card is revealed with revealCard().
*/
class Card
{
    colour;
    word;
    isRevealed;
    imageURL;
    div;

    /*
    * Called when a new card is created.
    * The new card is added to the board and attributes assigned. 
    */
    constructor(colour, word)
    {
        var boardDiv;

        //assign attributes
        this.colour = colour;
        this.word = word;
        this.isRevealed = false;

        //create card
        this.div = document.createElement("div");
        this.div.setAttribute("class",`card ${colour}`);
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
    revealCard()
    {
        //set attributes and remove text
        this.isRevealed = true;
        this.div.innerHTML = "";
    
        //apply the background image
        switch(this.colour)
        {
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
    }

    /*
    * On click, reveal the card and send that to the server
    */
    cardListener()
    {
        if(!board.validateClick(this)) //TODO: replace with board.getInstance singleton method for robustness
            return;
        this.revealCard(); //TODO: remove this and replace it with the card being revealed when the server sends something back
        board.sendBoardState(this); //TODO: replace with board.getInstance singleton method for robustness
    }
}

var demoSet = [[
    new Card("blueTeam","water"), new Card("redTeam","bulb"), new Card("neutral","crown"),
    new Card("neutral","frog"), new Card("neutral","crystal")],[
    new Card("redTeam","trunk"), new Card("redTeam","slip"), new Card("bombCard","boom"), 
    new Card("blueTeam","bolt"), new Card("redTeam","boxer")],[
    new Card("blueTeam","coach"), new Card("redTeam","fan"), new Card("neutral","skyscraper"), 
    new Card("redTeam","gold"), new Card("blueTeam","snowman")],[
    new Card("neutral","america"), new Card("blueTeam","pizza"), new Card("neutral","park"),
    new Card("blueTeam","flat"), new Card("blueTeam","carrot")],[
    new Card("blueTeam","whistle"), new Card("neutral","hide"), new Card("neutral","ball"), 
    new Card("blueTeam","bond"), new Card("neutral","tower")]
]

/*
BoardState class holds the state of the board at any given time while also holding the score
and the players turn. Done so every client has the correct copy of the board at the right time
*/
class BoardState extends Observer
{
    cards = [];
    clueWord;
    numOfGuesses;
    redScore;
    blueScore;
    timer = null;
    player = {
        "team" : null,
        "role" : null
    };
    turn = {
        "team" : null,
        "role" : null
    }

    /*
    * Called when the game begins and a new board is generated.
    * TODO: the new board needs to be sent to the server at the start.
    */
    constructor()
    {
        super();

        //attribute assignments
        this.clueWord = null;
        this.numOfGuesses = null;
        this.redScore = 0;
        this.blueScore = 0; 
        this.cards = demoSet; //TODO: replace with a randomly generated set (server side?)
    }

    /*
    * Returns whether the team and role match
    */
    isPlayersTurn()
    {
        return (    this.player["team"] === this.turn["team"] 
            &&      this.player["role"] === this.turn["role"]);
    }

    /*
    * Validates a click to and returns true/false depending on whether the
    * click is a valid playable move. Should be called by the card object.
    * Server-side validation is still used, but should not need to be relied on in all cases.
    */
    validateClick(cardSelected)
    {
        //debug functionality
        if(DEBUG_SKIP_VALIDATION)
            return true;

        //check card is not already revealed
        if(cardSelected.isRevealed)
            return false;

        //check it is this team's turn
        if(this.turn.team != this.player.team)
            return false;
        if(this.turn.role != this.player.role)
            return false;

        //check it is the spy's turn
        if(this.turn != "spymaster")
            return false;

        return true;
    }

    /*
    * Sends the new boardstate and the card chosen to the server.
    * The server should then reply starting from the update() function.
    */
    sendBoardState(cardSelected) 
    {
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
        
        //send board including the chosen card position to server
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
            "cards" : this.cards
        });
    }

    /*
    
    Makes sure clue is not already one on the board and then forwards the clue to the 
    server(and then to the other players) 
    */
    forwardClue(){
        //check that it is this player's turn and it is the spymaster's turn
        if(!this.isPlayersTurn || this.turn.role != "spymaster"){
            return;
        }
        //checks if clue is on the board if it is then break and not send to server
        else{
            let clue = document.getElementById("clue").value;
            let maxGuesses = document.getElementById("maxClues").value;
            let valid = true;

            for (let i = 0; i < this.cards.length; i++) {
                for (let j = 0; j < this.cards[0].length; j++){
                    if(clue == this.cards[i][j].word){
                        valid = false;
                        console.log("card cannot be same as word on board");
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
                    "turn" : this.turn
                })
            }
        }
    }

    /*
    Receives information from the server ad will update when necessary for all clients
    */
    update(eventName, args){
        if(eventName == "receiveBoardState"){
            this.clueWord = args.clue;
            this.numOfGuesses = args.numberOfGuesses;
            this.redScore = args.redScore;
            this.blueScore = args.blueScore;
            this.timer = args.timerLength;
            this.turn = args.turn;
            for(var i=0;i<5;i++){
                for(var j=0;j<5;j++){
                    if(args.cards[i][j].isRevealed)
                        this.cards[i][j].revealCard();
                    this.cards[i][j].colour = args.cards[i][j].colour;
                    this.cards[i][j].word = args.cards[i][j].word; 
                }
            }
        }
        else if(eventName == "forwardClue"){
            document.getElementById("clue").value = args.clue;
            document.getElementById("maxClues").value = args.numberOfGuesses;
            let currentDiv = document.getElementById("board");
            currentDiv.turn = args.turn;
        }
    }

    /*
    When game is finished this is what happens after, 
    temporary implementation 
    */
    finishGame(hasWon)
    {
        if(hasWon)
        {
            let newDiv = document.createElement("div");
            const currentDiv = document.getElementById("board");
            newDiv.innerHTML = "<p>" + 'YOU WON' + "</p>";
            newDiv.style.width = 1000;
            newDiv.style.height = 500;
            newDiv.style.colour = "green";
            currentDiv.appendChild(newDiv);
        }
        else return; 
    }
}

//randomizes the board (not cards) for debug purposes
function DEBUG_boardRandomizer(board){
    board.clueWord = "word";
    board.numOfGuesses = Math.floor(Math.random() * 5); //0-4
    board.redScore = Math.floor(Math.random() * 11); //0-10
    board.blueScore = Math.floor(Math.random() * 11); //0-10
    board.timer = 100;
    Math.floor(Math.random() * 2) ? board.player.team = "red" : board.player.team = "blue" ;
    Math.floor(Math.random() * 2) ? board.player.role = "spy" : board.player.role = "spymaster" ;
    Math.floor(Math.random() * 2) ? board.turn.team = "red"   : board.turn.team = "blue" ;
    Math.floor(Math.random() * 2) ? board.turn.role = "spy"   : board.turn.role = "spymaster" ;
}

//TEST FUNCTIONALITY
var board = new BoardState();
server.registerObserver(board);
board.turn = {"team" : "red", "role" : "spymaster"};
board.player = {"team" : "red", "role" : "spymaster"};

document.getElementById("joinSpy").addEventListener("click", () =>{
    console.log("spy mode enabled");
    board.turn.role = "spy";
    board.player.role = "spy";
    for(var i = 0; i < board.cards.length; i++){
        for(var j = 0; j < board.cards[0].length; j++){
            board.cards[i][j].div.setAttribute("class",`card neutral`); 
        }
    }

    document.getElementById("clueButton").style.display = "none";
    document.getElementById("clue").placeholder = "";
})
