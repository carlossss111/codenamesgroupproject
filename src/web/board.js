class Card
{
    colour;
    word; 
    isRevealed; 
    imageURL;
    
    constructor(colour, word)
    {
        console.log("test");
        this.colour = colour;
        this.word = word;
        this.isRevealed = false;
        if(this.colour = "red") this.imageURL = "../../rsc/images/redteam.jpg";
        else if(this.colour = "blue") this.imageURL = "../../rsc/images/blueteam.jpg";
        else if(this.colour = "neutral") this.imageURL = "../../rsc/images/neutral.jpg";
        else this.imageURL = "../../rsc/images/bomb.jpg";
        let newDiv = document.createElement("div");
        const currentDiv = document.getElementById("board");
        currentDiv.setAttribute("class","card neutral");
        currentDiv.appendChild(newDiv);

    }

    revealCard(card)
    {
        card.isRevealed = true;
    }
}