class Card
{
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
        cardDiv.innerHTML = "<p>" + word + "</p>";
        boardDiv.appendChild(cardDiv);
        cardDiv.addEventListener("click", this.revealCard);
        cardDiv.colour = this.colour;
    }
    

    //Had to pass this.colour as passing the card caused issues with the variables
    //later fix to either pass all elements of the card fix to make the card itself work
    revealCard(event)
    {
        var colour = event.currentTarget.colour;
        let cardDiv = event.target;
        //call validateClick()
        this.isRevealed = true;
        console.log(colour);
    
        if(colour == "redTeam") 
            cardDiv.style.backgroundImage = "url('../../rsc/images/redteam.jpg')";
        else if(colour == "blueTeam") 
            cardDiv.style.backgroundImage = "url('../../rsc/images/blueteam.jpg')";
        else if(colour == "neutral") 
            cardDiv.style.backgroundImage = "url('../../rsc/images/neutral.jpg')";
        else if(colour == "bombCard")
            cardDiv.style.backgroundImage = "url('../../rsc/images/bomb.jpg')";
        //call sendBoardState()
    }
}




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
        let bombX = Math.floor(Math.random() * 4);
        let bombY = Math.floor(Math.random() * 4);
        for(var i = 0; i < 5; i++){
            this.cards.push([]);
            for(var j = 0;j < 5; j++)
            {
                
                if(i == bombX && j == bombY)
                {
                    this.cards[bombX][bombY] = new Card("bombCard","bomb");
                    continue;
                }

                var value = Math.floor(Math.random() * 3);
                if(value < 1) this.cards[i][j] = new Card("neutral","forest");
                else if(value < 2) this.cards[i][j] = new Card("redTeam","forest");
                else this.cards[i][j] = new Card("blueTeam","forest");
                if(this.cards[i][j].colour = "redTeam") this.redScore++;
                else if(this.cards[i][j].colour = "blueTeam") this.blueScore++;
            }
        }
    }

    //return true if it is this client's turn
    isPlayersTurn(){
        return (    this.player["team"] === this.turn["team"] 
            &&      this.player["role"] === this.turn["role"]);
    }

    validateClick(cardSelected,turn){
        if(cardSelected.isRevealed == true) return false;
        else if(turn.team != boardState.player.team) return false;
        else if(turn.role != boardState.player.role) return false;
        return true;
    }
    
    //sends the board state to the server
    sendBoardState(cardSelected) {
        //find index of cardSelected
        var i;
        for (i = 0; i < this.cards.length; i++)
        {
            var j = this.cards[i].indexOf(cardSelected);
            if(j != -1)
                break;
        }
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

    //forwards to the server (and then to the other players)
    forwardClue(){
        //check that it is this player's turn and it is the spymaster's turn
        if(!this.isPlayersTurn || this.turn.role != "spymaster")
            return;

        /*
        DEFINE THE CLUE HERE & VALIDATE HERE!
        */
        else{
            let clue = document.getElementById("clue").value;
            let maxGuesses = document.getElementById("maxClues").value;
            let valid = true;

            for (let i = 0; i < cards.length; i++) {
                if(clue == cards[i]){
                    valid = false;
                    console.log("card cannot be same as word on board");
                    break;
                }
            }

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

    //Updates when receiving server communications
    //(Observer Class Override!)
    update(eventName, args){
        if(eventName == "receiveBoardState"){
            
            var example_cards = [];
            for(var i = 0; i < 5; i++){
                example_cards.push([]);
                for(var j = 0; j < 5; j++){
                    var randomizer1 = Math.floor(Math.random() * 3);//0-2
                    var randomizer2 = Math.floor(Math.random() * 2);//0-1
                    var example_colours = ["redTeam","blueTeam","neutral"];
                    example_cards[i][j] = {"colour" : "", "word" : "placeholder", "isRevealed" : ""};
                    example_cards[i][j].colour = example_colours[randomizer1];
                    randomizer2 ? example_cards[i][j].isRevealed = true : example_cards[i][j].isRevealed = false;
                }
            }
            const example_args = { Protocol: "receiveBoardState", clue: "placeholder", numberOfGuesses: 1, 
                                    redScore: 1, blueScore: 1, timerLength: 100, 
                                    turn: { team: "blue", role: "spymaster" }, cards : example_cards}
            args = example_args;

            clueWord = args.clue;
            numOfGuesses = args.numberOfGuesses;
            redScore = args.redScore;
            blueScore = args.blueScore;
            timer = args.timerLength;
            turn.team = args.turn.team;
            turn.role = args.turn.role;
            for(i=0;i<5;i++)
                for(j=0;j<5;j++)
                    cards[i][j] = args.cards[i][j];
        }
        else if(eventName == "forwardClue"){
            const example_args = { Protocol: "forwardClue", clue: "placeholder", 
                            numberOfGuesses: 2, turn: { team: "blue", role: "spymaster" } }
            args = example_args;

            clueWord = args.clue;
            numOfGuesses = args.numberOfGuesses;
            turn.team = args.turn.team;
            turn.role = args.turn.role;
        }
    }

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

var board = new BoardState();
server.registerObserver(board);

