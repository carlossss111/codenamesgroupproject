/**
 * Sends chat messages to the python server using the Server class.
 * 
 * Receives chat messages from the python server using the Observer
 * pattern. Messages are displayed below.
 */
 class Chatbox extends Observer{

    /**
    * Adds an event listener to the HTML node with id="chatboxSend" 
    * so that it calls the sendChat function.
    */
    constructor() {
        super();
        document.getElementById("chatboxSend").addEventListener("submit", this.sendChat);      
    }

    /**
    * Sends the chat to the server using the Server Class.
    * Called with event listener in the constructor.
    */
    sendChat() {
        var chatText = document.getElementById("chatText").value;
        var message = nickname + ": " + chatText;
        server.sendToServer("chat", {
            "Protocol" : "chat", 
            "message" : message,
            "room" : board.room,
            "team" : board.player.team
        });
    }

    /**
    * Prints chat messages from the server onto the screen.
    * Called whenever a "chat" message is received from the server.
    * (Observer Class Override!)
    */
    update(eventName, args) {
        if (eventName != "chat") return;

        var chatboxReceive = document.getElementById("chatboxReceive");
        var newMessage = document.createElement("p");

        var team = args['team'];
        if (team == "blue") newMessage.style.color = "#3399ff";
        else if (team == "red") newMessage.style.color = "#ff5050";
        else newMessage.style.color = "black";

        notiVal += 1;
        document.getElementById('noti').innerHTML = notiVal;
        
        newMessage.innerHTML = args['message'];
        chatboxReceive.appendChild(newMessage);
    }
}

//MAIN
var chatbox = new Chatbox();
server.registerObserver(chatbox);