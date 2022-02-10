import socket
import json
from flask import Flask, render_template, session, copy_current_request_context, request, jsonify
from flask_socketio import SocketIO, emit, disconnect
from threading import Lock
from src.game.generateBoard import *
from src.game.predictor import *

async_mode = None
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socket_ = SocketIO(app, async_mode=async_mode, cors_allowed_origins='*') #todo: remove CORS policy when hosted on uni server
thread = None
thread_lock = Lock()


"""
create a initial game board
"""
#@app.route('/', methods=["POST", "GET"])
@socket_.on("createInitialBoardState", namespace='/')
def index(settings):
    game = Boardgen("static/data/codenames_words")
    board = game.board
    word_dict = game.word_dict
    board.insert(0, {"difficulty": "easy", "dict": word_dict})
    
    protocol = 'createInitialBoardState'
    messageToSend = {
        'Protocol': protocol, \
        'clue': "???", \
        'numberOfGuesses': "???", \
        'turn': "???" \
        }

    # send to client
    emit(protocol, messageToSend, broadcast=True)
    #return render_template('html/page.html', board=board)


"""
Continuously update the info for the board
""" #I think this is done is sendBoardState()
@app.route("/update", methods=["POST"])
def update():
    board = json.loads(request.data)
    return render_template('html/page.html', board=board)


"""
Generate a list of guesses
"""
#@app.route("/guess", methods=["POST"])
@socket_.on('guess', namespace='/')
def guess(messageReceived):
    """ #this needs integrating
    board = json.loads(request.data)
    spy = Predictor_spy(board=board[1:],
                    clue=board[0]["clue"],
                    target_num=board[0]["target_num"],
                    relevant_vectors_path='static/data/relevant_vectors')
    guesses = jsonify(guesses=spy.run())
    """
    protocol = "" #not sure which this is?
    messageToSend = "" #new board state? or something else?
    emit(protocol, messageToSend, broadcast=True)
    #return guesses


"""
Chat Protocol
Forwards message sent from a client to all other clients.
"""


@socket_.on('chat', namespace='/')
def chat_broadcast_message(messageReceived):
    print("Chat Message Received!")
    # define protocol and message
    protocol = 'chat'
    messageToSend = {
        'Protocol': protocol, \
        'message': messageReceived['message'] \
        }
    # send to client
    emit(protocol, messageToSend, broadcast=True)


"""
forwardClue Protocol
Forwards clue sent from a spymaster client to all other clients.
Changes the turn.
"""

@socket_.on('forwardClue', namespace='/')
def clue_broadcast_message(messageReceived):
    print("Clue Received!")

    # reassign values
    nextTurn = {"team": "red", "role": "spymaster"}

    # define protocol and message
    protocol = 'forwardClue'
    messageToSend = {
        'Protocol': protocol, \
        'clue': messageReceived['clue'], \
        'numberOfGuesses': messageReceived['numberOfGuesses'], \
        'turn': nextTurn \
        }
    # send to client
    emit(protocol, messageToSend, broadcast=True)

"""
Generate a clue and target number (AI)
"""
#@app.route("/clue", methods=["POST"])
@socket_.on("generateClueAI", namespace='/')
def clue_broadcast_message_AI(messageReceived):
    """" #sorry i commented this out temporarily because I can't make it run
    board = json.loads(request.data)

    spymaster = Predictor_sm(relevant_words_path='static/data/relevant_words',
                          relevant_vectors_path='static/data/relevant_vectors',
                          board=board[1:],
                          turn=board[0]["turn"],
                          threshold=0.45)
    _clue, clue_score, targets = spymaster.run()
    clue_details = jsonify(clue=_clue, targets=targets)
    """
    #emit back to the socket
    protocol = 'forwardClue'
    messageToSend = {
        'Protocol' : protocol,
        'clue' : "???",
        'numberOfGuesses' : 999999,
        'turn' : "???"
    }
    emit(protocol, messageToSend, broadcast=True)
    #return clue_details


"""
send/receive BoardState Protocol
"""

@socket_.on('sendBoardState', namespace='/')
def boardstate_broadcast_message(boardReceived):
    print("Board State Received!")

    # reassign values
    numOfGuesses = boardReceived['numberOfGuesses']
    redScore = 1
    blueScore = 1
    nextTurn = {"team": "red", "role": "spymaster"}

    # define protocol and message
    protocol = 'receiveBoardState'
    messageToSend = {
        'Protocol': protocol, \
        'clue': boardReceived['clue'], \
        'numberOfGuesses': numOfGuesses, \
        'redScore': redScore, \
        'blueScore': blueScore, \
        'timerLength': boardReceived['timerLength'], \
        'turn': nextTurn, \
        'cards': boardReceived['cards'] \
        }
    # send to client
    emit(protocol, messageToSend, broadcast=True)

@socket_.on('disconnect_request', namespace='/test')
def disconnect_request():
    @copy_current_request_context
    def can_disconnect():
        disconnect()

    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Disconnected!', 'count': session['receive_count']},
         callback=can_disconnect)


if __name__ == '__main__':
    socket_.run(app, debug=True)
