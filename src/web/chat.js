class Chatbox extends Observer{
    messagebox;

    //constructor assigns properties and adds eventlistener to chatbox
    constructor(){
        super();
        this.messagebox = document.getElementById("chatmessages");
        var newMsgBox = document.getElementById("sendmessage");
        newMsgBox.addEventListener("submit", () => {
            this.sendChat();
            console.log("chat sent");
        });
    }

    //send message
    sendChat(message){
        server.sendToServer("chat",`Protocol : "chat"\r\nmessage : "${message}""`);
    }

    //update message when server receives message
    update(eventName, args){
        if(eventName != "chat")
            return;

        var newMessage = document.createElement("p");
        newMessage.innerHTML = "test";
        this.messagebox.appendChild(newMessage);
    }
}

var chatbox = new Chatbox();