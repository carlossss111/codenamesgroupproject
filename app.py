import socket

from flask import Flask, render_template, session, copy_current_request_context, json, request, jsonify
from flask_socketio import SocketIO, emit, disconnect
from threading import Lock
from src.game.AImove import AImove
from src.game.generateBoard import generateBoard
from src.game.prediction import Predictor

async_mode = None
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socket_ = SocketIO(app, async_mode=async_mode, cors_allowed_origins='*') #todo: remove CORS policy when hosted on uni server
thread = None
thread_lock = Lock()

"""
create a initial game board
"""


@app.route('/', methods=["POST", "GET"])
def index():
    board = generateBoard("gameDev/static/data/words_data").board
    board.insert(0, {"difficulty": "medium", "invalid_guesses": []})
    return render_template('pages/game.html', board=board)


"""
Continuously update the info for the board
"""


@app.route("/update", methods=["POST"])
def update():
    board = json.loads(request.data)
    return render_template('pages/game.html', board=board)


"""
generate the move of the AI
"""


@app.route("/computer_turn", methods=["POST"])
def computer_turn():
    board = json.loads(request.data)
    sequence = AImove(board).generate_computer_sequence()
    json_sequence = jsonify(sequence=sequence)
    return json_sequence


"""
generate the clues
"""


@app.route("/clue", methods=["POST"])
def clue():
    board = json.loads(request.data)
    predictor = Predictor(relevant_words_path='gameDev/static/data/train_word_data',
                          relevant_vectors_path='gameDev/static/data/vectors',
                          board=board[1:],
                          invalid_guesses=set(board[0]['invalid_guesses']),
                          threshold=0.45)
    _clue, clue_score, targets = predictor.run()
    clue_details = jsonify(clue=_clue, targets=targets)
    return clue_details



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
send/receive BoardState Protocol
"""


@socket_.on('sendBoardState', namespace='/')
def chat_broadcast_message(boardReceived):
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


# test stuff


@socket_.on('my_event', namespace='/test')
def test_message(message):
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': message['data'], 'count': session['receive_count']})


@socket_.on('my_broadcast_event', namespace='/test')
def test_broadcast_message(message):
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': message['data'], 'count': session['receive_count']},
         broadcast=True)


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
    app.run(host='127.0.0.1', port=8080, debug=True)
