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
        let newDiv = document.createElement("div");
        const currentDiv = document.getElementById("board");
        newDiv.setAttribute("class",`card ${colour}`); 
        newDiv.innerHTML = "<p>" + word + "</p>";
        newDiv.style.backgroundImage = "url('../../rsc/images/neutral.jpg')";
        currentDiv.appendChild(newDiv);
        //document.getElementsByClassName("card").style.backgroundImage = "url('../../rsc/images/neutral.jpg')";
    

    }
    
    revealCard()
    {
        this.isRevealed = true;
        this.colour = "redTeam";
    }
}

function click() {
    alert('clicked');
}

class boardState {

    cards = [1,2,3,4,5][1,2,3,4,5];
    clueWord;
    numOfGuesses;
    redScore;
    blueScore;
    timer = null;
    player = {
        'team' : null,
        'role' : null
    };

    constructor(cards)
    {
        this.clueWord = null;
        this.numOfGuesses = null;
        this.redScore = 0;
        this.blueScore = 0; 
        for(i=0;i<5;i++)
            for(j=0;j<5;j++)
            {
                value = Math.floor(Math.random() * 3);
                if(value < 2) this.cards[i][j] = new Card("neutral","forest");
                else if(value == 2) this.cards[i][j] = new Card("redTeam","forest");
                else this.cards[i][j] = new Card("blueTeam","forest");
                if(cards[i][j].colour = "redTeam") this.redScore++;
                else if(cards[i][j].colour = "blueTeam") this.blueScore++;
            }
        x = Math.floor(Math.random() * 4);
        y = Math.floor(Math.random() * 4);
        this.cards[x][y] = new Card("bombCard","bomb");
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
