from flask import Flask, render_template, session, copy_current_request_context
from flask_socketio import SocketIO, emit, disconnect
from threading import Lock


async_mode = None
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socket_ = SocketIO(app, async_mode=async_mode, cors_allowed_origins='*') #todo: remove CORS policy when hosted on uni server
thread = None
thread_lock = Lock()


@app.route('/')
def index():
    return render_template('html/index.html', async_mode=socket_.async_mode)

"""
Chat Protocol
Forwards message sent from a client to all other clients.
"""
@socket_.on('chat', namespace='/')
def chat_broadcast_message(messageReceived):
    print("Chat Message Received!")
    #define protocol and message
    protocol = 'chat'
    messageToSend = {
                        'Protocol' : protocol,\
                        'message' : messageReceived['message']\
                    }
    #send to client
    emit(protocol, messageToSend, broadcast=True)

"""
forwardClue Protocol
Forwards clue sent from a spymaster client to all other clients.
Changes the turn.
"""
@socket_.on('forwardClue', namespace='/')
def clue_broadcast_message(messageReceived):
    print("Clue Received!")

    #####################
    #CALCULATE NEXT TURN#
    #####################
    nextTurn = {"team" : "?", "role" : "?"}
    #####################

    #define protocol and message
    protocol = 'forwardClue'
    messageToSend = {
                        'Protocol' : protocol,\
                        'clue' : messageReceived['clue'],\
                        'numberOfGuesses' : messageReceived['numberOfGuesses'],\
                        'turn' : nextTurn\
                    }
    #send to client
    emit(protocol, messageToSend, broadcast=True)

"""
send/receive BoardState Protocol
"""
@socket_.on('sendBoardState', namespace='/')
def chat_broadcast_message(boardReceived):
    print("Board State Received!")

    ###########################
    #CALCULATE NEW BOARD STATE#
    ###########################
    numOfGuesses = 1
    redScore = 1
    blueScore = 1
    nextTurn = {"team" : "?", "role" : "?"}

    ###########################
    
    #define protocol and message
    protocol = 'receiveBoardState'
    messageToSend = {   
                        'Protocol' : protocol,\
                        'clue' : boardReceived['clue'],\
                        'numberOfGuesses' : numOfGuesses,\
                        'redScore' : redScore,\
                        'blueScore' : blueScore,\
                        'timerLength' : boardReceived['timerLength'],\
                        'turn' : nextTurn,\
                        'cards' : "2d array of cards"\
                    }
    #send to client
    emit(protocol, messageToSend, broadcast=True)




if __name__ == '__main__':
    socket_.run(app, debug=True)