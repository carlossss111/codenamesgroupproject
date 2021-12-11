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

        if(this.colour = "redTeam")
            this.imageURL = "../../rsc/images/redteam.jpg";

        else if(this.colour = "blueTeam")
            this.imageURL = "../../rsc/images/blueteam.jpg";

        else if(this.colour = "neutral")
            this.imageURL = "../../rsc/images/neutral.jpg";

        else
            this.imageURL = "../../rsc/images/bomb.jpg";
        let cardDiv = document.createElement("div");
        let boardDiv = document.getElementById("board");
        cardDiv.setAttribute("class",`card ${colour}`); 
        cardDiv.innerHTML = "<p>" + word + "</p>";
        cardDiv.style.backgroundImage = "url('../../rsc/images/neutral.jpg')";
        boardDiv.appendChild(cardDiv);
        cardDiv.addEventListener("click",this.revealCard);
    }
    
    revealCard(event)
    {
        let cardDiv = event.target;
        this.isRevealed = true;
        this.colour = "redTeam";
        console.log(cardDiv); 
        cardDiv.style.backgroundImage = "";
    }
}

function click() {
    alert('clicked');
}

class BoardState {

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
        server.sendToServer(
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

        var clue = "placeholder";
        var maxGuesses = 2;

        //send to server
        server.sendToServer(
            {
                "Protocol" : "forwardClue",
                "clue" : clue,
                "numberOfGuesses" : maxGuesses,
                "player" : this.player,
                "turn" : this.turn
            })

    }

    //Updates when receiving server communications
    //(Observer Class Override!)
    update(eventName, args){
        if(eventName == "receiveBoardState"){
            console.log(args);
            /*
            UPDATE CLIENT BOARD STATE HERE!
            */
        }
        else if(eventName == "forwardGuess"){
            console.log(args);
            /*
            UPDATE CLUE WORD AND DISPLAY HERE!
            */
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

var board = new BoardState();
//board.sendBoardState(board.cards[1][3]);

//board.turn = {team : "blue", role : "spymaster"};
//board.player = {team : "blue", role : "spymaster"};
//board.forwardClue();