/*
Card class, this is where the card is created using a colour and a word and is given
an action listener to check for when it has been clicked

*/
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

        let cardDiv = document.createElement("div");
        let boardDiv = document.getElementById("board");
        cardDiv.setAttribute("class",`card ${colour}`); 
        //cardDiv.setAttribute("class",`card neutral`); 
        cardDiv.innerHTML = "<p>" + word + "</p>";
        boardDiv.appendChild(cardDiv);
        //cardDiv.addEventListener("click", this.revealCard);
        cardDiv.colour = this.colour;
        cardDiv.word = this.word;
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
class BoardState extends Observer{
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

    constructor()
    {
        super();
        this.clueWord = null;
        this.numOfGuesses = null;
        this.redScore = 0;
        this.blueScore = 0; 
        //let bombX = Math.floor(Math.random() * 4);
        //let bombY = Math.floor(Math.random() * 4);
        this.cards = demoSet;
        for(var i = 0; i < 5; i++){
            //this.cards.push([]);
            for(var j = 0; j < 5; j++)
            {
                //randomizer temporarily removed for the demo

                //add event listener
                this.cards[i][j].div.addEventListener("click", this.cardListener.bind(this));
            }
        }
    }

    cardListener(event){
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
    sendBoardState(cardSelected) {
        //find index of cardSelected
        var i;
        var j = -1;

        for (i = 0; i < this.cards.length; i++)
        {  
            var alpha = this.cards[i];
            for (var k = 0; k < alpha.length; k++)
            {
                if(alpha[k].word == cardSelected.word)
                {
                    j = 1;
                }
            }
        }

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
            "cards" : this.cards
            });
        
        if(j == -1)
            throw new Error("Card selected not found!")
        
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
