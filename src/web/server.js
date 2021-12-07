const IP_ADDRESS = "localhost";
const SERVER_PORT = "3000";

var socket;

class Server{
    //list of observers waiting for server updates
    observers;

    constructor(){
        //connect and disconnect listeners
        this.connectedToServer();
        this.disconnectedFromServer();

        //receieve listener and update observers
        this.receiveFromServer();
    }

    //send data to server
    sendToServer(eventName, data){
        socket.emit(eventName, data);
    }

    //receive data from server and update oberservers
    receiveFromServer(){
        socket.onAny((eventName, ...args) => {
            this.observers.forEach(element => {
                element.update(eventName, args);
            });
        });
    }

    //connection setup and listener
    connectedToServer(){
        //connect to the socket
        socket = io(`http://${IP_ADDRESS}:${SERVER_PORT}`);

        //wait for acknowledgement
        socket.on("connect", msg => { 
            // do connect things //
        });    
    }

    //disconnection listener
    disconnectedFromServer(){
        socket.on("disconnect", msg => {  
            // do disconnect things //
        });
    }

    //observer pattern, add to list
    registerObserver(newObserver){
        this.observers.push(newObserver);
    }
}

//This class should be treated as abstract.
class Observer{
    //called whenever the server receives something
    update(eventName, args){
        console.log("Abstract update() called!");
    }
}

const server = new Server();