//Symbolic Constants
const IP_ADDRESS = "localhost";
const SERVER_PORT = "5000";

//Global Socket
var socket;

/**
 * This class handles connections to the python server.
 * The constructor and the methods called within it set the event listeners.
 * 
 * The sendToServer() method takes the name of the event (so the server can identify which
 * event it is) and the data being sent in a JSON format.
 * For example:
 *      server.sendToServer("chat", {
 *              Protocol : "chat", 
 *              message : `${msg}` });
 * 
 * The receiveFromServer() sends back a string with the response in a similiar format
 * and alerts the update function of every observer using the observer pattern.
 */
class Server {
    //list of observers waiting for server updates
    observers = [];

    //apply event listeners
    constructor(){
        //connect and disconnect listeners
        this.connectedToServer();
        this.disconnectedFromServer();

        //receieve listener and update observers
        this.receiveFromServer();
    }

    /**
     * Send data to server
     * @param {string} eventName the name of data event
     * @param {JSON} data the data of event
     * @returns name of event and its data
     */
    sendToServer(eventName, data){
        console.log("MESSAGE SENT:");
        console.log(data);
        socket.emit(eventName, data);
        return {eventName, data};
    }

    /**
     * Receive data from server and update oberservers
     */
    receiveFromServer(){
        socket.onAny((eventName, args) => {
            console.log("MESSAGE RECEIVED:");
            console.log(args);
            this.observers.forEach(element => {
                element.update(eventName, args);
            });
        });
    }

    /**
     * Connection and listener setup
     */
    connectedToServer(){
        //connect to the socket
        socket = io(`http://${IP_ADDRESS}:${SERVER_PORT}`);
        //wait for acknowledgement
        socket.on("connect", () => { 
            console.log("Connected To Server Successfully");
        });    
    }

    /**
     * Disconnecting listener
     */
    disconnectedFromServer(){
        socket.on("disconnect", () => {  
            console.log("Disconnected from Server");
            alert("Connection from server lost");
        });
    }

    /**
     * Observer pattern, add to list
     * @param {Observer} newObserver the observer to be added to list
     */
    registerObserver(newObserver){
        this.observers.push(newObserver);
    }
}

/**
 * **Abstract Class**
 *
 * The update method is called by the Server class as part of the observer
 * pattern whenever there is a message from the server. It's content
 * should change depending on the type of Observer.
 */
class Observer {
    update(eventName, args){
        throw new Error("The update method has been called in the Observer Superclass!");
    }
}

const server = new Server();