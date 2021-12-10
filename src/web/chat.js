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
    constructor(){
        super();

        var chatboxSend = document.getElementById("chatboxSend");
        var chatboxSendText = chatboxSend[0];

        chatboxSend.addEventListener("submit", () => {
            this.sendChat(chatboxSendText.value);
            console.log("Chat Sent");
        });
    }

    /**
    * Sends the chat to the server using the Server Class.
    * Called with event listener in the constructor.
    */
    sendChat(msg){
        server.sendToServer("chat", {Protocol : "chat", message : `${msg}`});
    }

    /**
    * Prints chat messages from the server onto the screen.
    * Called whenever a "chat" message is received from the server.
    * (Observer Class Override!)
    */
    update(eventName, args){
        if(eventName != "chat")
            return;

        var chatboxReceive = document.getElementById("chatboxReceive");
        var newMessage = document.createElement("p");

        newMessage.innerHTML = args;
        chatboxReceive.appendChild(newMessage);
    }
}

//MAIN
var chatbox = new Chatbox();
server.registerObserver(chatbox);