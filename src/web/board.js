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

    cards = [[]];
    clueWord;
    numOfGuesses;
    redScore;
    blueScore;
    timer = null;
    player = {
        'team' : null,
        'role' : null
    };

    constructor()
    {
        this.clueWord = null;
        this.numOfGuesses = null;
        this.redScore = 0;
        this.blueScore = 0; 
        let bombX = Math.floor(Math.random() * 4);
        let bombY = Math.floor(Math.random() * 4);
        for(var i=0;i<5;i++){
            for(var j=0;j<5;j++)
            {
                this.cards.push([]);
                
                if(i == bombX && j == bombY){
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

    validateClick(cardSelected,turn){
        if(cardSelected.isRevealed == true) return false;
        else if(turn.team != boardState.player.team) return false;
        else if(turn.role != boardState.player.role) return false;
        return true;
    }
    
    
    sendBoardState(Boardstate, cardSelected) {
        server.sendToServer("SendBoardState",`Protocol : "SendBoardState"\r\nclue : "${BoardState.clueWord}"\r\n
                            numOfGuesses : "${BoardState.numOfGuesses}"\r\nredScore : "${BoardState.redScore}"\r\n
                            blueScore : "${BoardState.blueScore}"\r\ntimerLength : "${BoardState.timerLength}"\r\n
                            blueScore : "${BoardState.blueScore}"\r\nplayer : "${BoardState.numOfGuesses}"\r\n
                            player : "${BoardState.player}"\r\ncardChosen : "${cardSelected}"\r\n
                            cards : ${BoardState.cards}"`);
        }

    

    sendGameOptions(hasBombCard, numOfAI, aiDifficulty, timerLength){
        // I don't think this should be here
    }

    update(eventName, args){
        if(eventName != "boardState")
            return;
        
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

new BoardState();