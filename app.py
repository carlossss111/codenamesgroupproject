import socket
import json
import numpy as np
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
@socket_.on("createInitialBoardState", namespace='/')
def index(settings):
    print("Initial game board received!")
    game = generateBoard("static/data/codenames_words", settings["BombCard"])
    board = game.board

    protocol = 'sendInitialBoardState'
    messageToSend = {
        'Protocol': protocol, \
        'board': board, \
    }

    # send to client
    emit(protocol, messageToSend, broadcast=True)


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
    turn = messageReceived['turn']
    nextTurn = {"team": turn['team'], "role": "spy"}

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
@socket_.on("generateClue", namespace='/')
def clue_broadcast_message_AI(messageReceived):
    board = list(chain.from_iterable(messageReceived["board"]["cards"]))
    turn = messageReceived["board"]["turn"]["team"]

    spymaster = Predictor_sm(relevant_words_path='static/data/relevant_words',
                          relevant_vectors_path='static/data/relevant_vectors',
                          board=board,
                          turn=turn)
    clue, clue_score, targets = spymaster.run()
    # this should be updated in this block
    nextTurn = {"team": "red", "role": "spy"}

    #emit back to the socket
    protocol = 'forwardClue'
    messageToSend = {
        'Protocol' : protocol,
        'clue' : clue,
        'numberOfGuesses' : len(targets),
        'turn' : nextTurn
    }
    emit(protocol, messageToSend, broadcast=True)


"""
Generate a list of guesses
"""
@socket_.on('generateGuess', namespace='/')
def guess(messageReceived):
    """ #this needs integrating
    guesses = jsonify(guesses=spy.run())
    """
    board = list(chain.from_iterable(messageReceived["board"]["cards"]))
    clue = messageReceived["board"]["clueWord"]
    target_num = messageReceived["board"]["numOfGuesses"]

    spy = Predictor_spy(relevant_vectors_path='static/data/relevant_vectors',
                    board=board,
                    clue=clue,
                    target_num=target_num)
    guesses = spy.run()

    for card in board:
        if card["word"] in guesses:
            card["isRevealed"] = True

    # this should be updated in this block
    nextTurn = {"team": "red", "role": "spymaster"}

    protocol = 'receiveBoardState'
    messageToSend = {
        'Protocol': protocol, \
        'clue': clue, \
        'numberOfGuesses': target_num, \
        'redScore': 1, # this should be updated in this block
        'blueScore': 1, # this should be updated in this block
        'timerLength': messageReceived["board"]["timer"], \
        'turn': nextTurn, \
        'cards': np.reshape(board,(5,5)).tolist() \
    }
    emit(protocol, messageToSend, broadcast=True)


"""
send/receive BoardState Protocol
"""
@socket_.on('sendBoardState', namespace='/')
def boardstate_broadcast_message(boardReceived):
    print("Board State Received!")

    # need reassign values
    redScore = 1
    blueScore = 1

    numOfGuesses = int(boardReceived['numberOfGuesses']) - 1

    turn = boardReceived['turn']
    isTurnOver = False

    # TO DO: if pick other team's card, change turn
    if numOfGuesses == 0:
        isTurnOver = True
        if turn['team'] == 'blue':
            nextTurn = {"team": "red", "role": "spymaster"}
        else:
            nextTurn = {"team": "blue", "role": "spymaster"}
    else:
        nextTurn = {"team": turn['team'], "role": "spy"}

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
        'turnOver': isTurnOver, \
        'cards': boardReceived['cards'] \
    }
    # send to client
    emit(protocol, messageToSend, broadcast=True)


@socket_.on('chooseRole', namespace='/')
def update_role(roleReceived):
    protocol = 'receiveRole'
    messageToSend = {
        'Protocal': protocol,
        'blueSpy' : roleReceived["blueSpy"],
        'blueSm' : roleReceived["blueSm"],
        'redSpy' : roleReceived["redSpy"],
        'redSm' : roleReceived["redSm"]
    }
    emit(protocol, messageToSend, broadcast=True)


@socket_.on('syncRole', namespace='/')
def sync_role(sync):
    protocol = ''
    messageToSend = {}
    if sync["type"] == "request":
        protocol = 'syncRequest'
        messageToSend = {
            'Protocal': protocol,
        }
    elif sync["type"] == "sync":
        protocol = 'receiveRole'
        messageToSend = {
            'Protocal': protocol,
            'blueSpy' : sync["blueSpy"],
            'blueSm' : sync["blueSm"],
            'redSpy' : sync["redSpy"],
            'redSm' : sync["redSm"]
        }
    emit(protocol, messageToSend, broadcast=True)

@socket_.on('updateTurn', namespace='/')
def update_turn(turn):
    protocol = 'changeTurn'
    messageToSend = {
        'Protocal': protocol,
        'currentTurn': turn["currentTurn"]
    }
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
