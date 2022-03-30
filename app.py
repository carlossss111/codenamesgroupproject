import numpy as np
from flask import Flask, session, copy_current_request_context, request
from flask_socketio import SocketIO, emit, disconnect, join_room, leave_room
from threading import Lock
from src.game.generateBoard import *
from src.game.predictor import *

async_mode = None
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socket_ = SocketIO(app, async_mode=async_mode, cors_allowed_origins='*') #todo: remove CORS policy when hosted on uni server
thread = None
thread_lock = Lock()
room_path = "rsc/data/rooms"

"""
Join a game room
"""
@socket_.on('joinRoom')
def on_join(data):
    room = data['room']
    name = data['name']
    choice = data['choice']
    isJoined = data['isJoined']

    with open(room_path, "r+") as f:
        rooms = [line.rstrip() for line in f]
        print(rooms)
        if room in rooms and choice != '2' and not isJoined:
            print("Room exist!")
            emit('roomError', "The room name is taken by others, please try again.")
        elif room not in rooms and choice == '2':
            print("Room not exist!")
            emit('roomError', "The room name doesn't exist, please try again.")
        else:
            if choice != '2' and not isJoined:
                f.write(room + '\n')
            if choice == '2' and not isJoined:
                emit('syncRequest', "request sync", room=room)
            join_room(room)
            protocol = 'sendRoomInfo'
            messageToSend = {
                'Protocol': protocol,
                'message': name + ' has entered room ' + room,
                'name': name
            }
            emit(protocol, messageToSend, room=room)


"""
Quit a game room
"""
@socket_.on('quitRoom')
def on_quit(data):
    room = data['room']
    name = data['name']
    team = data['team']
    choice = data['choice']
    numOfPeople = data['numOfPeople'] - 1
    leave_room(room)

    emit('syncPeople', numOfPeople, room=room)
    messageToSend = {
        'Protocol': 'chat',
        'message': name + ' has quit room ' + room,
        'team': team,
        'role': "spy"
    }
    emit('chat', messageToSend, room=room)
    
    if choice != '2':
        with open(room_path, "r+") as f:
            rooms = f.readlines()
            f.seek(0)
            for r in rooms:
                if r.rstrip() != room:
                    f.write(r)
            f.truncate()
        messageToSend = {
            'Protocol': 'hostQuit'
        }
        emit('hostQuit', messageToSend, room=room)


"""
create a initial game board
"""
@socket_.on("createInitialBoardState", namespace='/')
def index(settings):
    print("Initial game board received!")
    game = generateBoard("rsc/data/codenames_words", settings["BombCard"])
    board = game.board
    room = settings["room"]
    timer = settings["TimerLength"]

    protocol = 'sendInitialBoardState'
    messageToSend = {
        'Protocol': protocol, \
        'board': board, \
        'timerLength': timer, \
        'vocabulary': getVocabulary()
    }
    # send to client
    emit(protocol, messageToSend, room=room)


"""
Chat Protocol
Forwards message sent from a client to all other clients.
"""
@socket_.on('chat', namespace='/')
def chat_broadcast_message(messageReceived):
    print("Chat Message Received!")
    room = messageReceived['room']
    # define protocol and message
    protocol = 'chat'
    messageToSend = {
        'Protocol': protocol,
        'message': messageReceived['message'],
        'team' : messageReceived['team'],
        'role' : messageReceived['role']
    }
    # send to client
    emit(protocol, messageToSend, room=room)


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
    room = messageReceived['room']

    # define protocol and message
    protocol = 'forwardClue'
    messageToSend = {
        'Protocol': protocol, \
        'clue': messageReceived['clue'], \
        'numberOfGuesses': messageReceived['numberOfGuesses'], \
        'turn': nextTurn \
    }
    # send to client
    emit(protocol, messageToSend, room=room)


"""
Generate a clue and target number (AI)
"""
@socket_.on("generateClue", namespace='/')
def clue_broadcast_message_AI(messageReceived):
    board = list(chain.from_iterable(messageReceived["board"]["cards"]))
    team = messageReceived["board"]["turn"]["team"]

    spymaster = Predictor_sm(relevant_words_path='rsc/data/relevant_words',
                          relevant_vectors_path='rsc/data/relevant_vectors',
                          board=board,
                          turn=team)
    clue, clue_score, targets = spymaster.run()

    nextTurn = {"team": team, "role": "spy"}
    room = messageReceived['board']['room']
    numGuesses = max(len(targets), 1)

    #emit back to the socket
    protocol = 'forwardClue'
    messageToSend = {
        'Protocol' : protocol,
        'clue' : clue,
        'numberOfGuesses' : numGuesses,
        'turn' : nextTurn
    }
    emit(protocol, messageToSend, room=room)

"""
Generate a hint
"""
@socket_.on("hint", namespace='/')
def hint_broadcast(messageReceived):
    board = list(chain.from_iterable(messageReceived["board"]["cards"]))
    team = messageReceived["board"]["turn"]["team"]
    room = messageReceived['board']['room']
    role = messageReceived["board"]["player"]["role"]

    spymaster = Predictor_sm(relevant_words_path='rsc/data/relevant_words',
                          relevant_vectors_path='rsc/data/relevant_vectors',
                          board=board,
                          turn=team)
    clue, _, targets = spymaster.run()

    #it is easier in board.js to split into two different messages...
    if role == "spy":
        protocol = "spyHint"
        messageToSend = {
            'Protocol' : protocol,
            'hint' : targets[0],
        }
    else:
        protocol = "spymasterHint"
        messageToSend = {
            'Protocol' : protocol,
            'hint' : targets,
        }

    emit(protocol, messageToSend, room=room)

"""
Generate a list of guesses (AI)
"""
@socket_.on('generateGuess', namespace='/')
def guess(messageReceived):
    board = list(chain.from_iterable(messageReceived["board"]["cards"]))
    clue = messageReceived["board"]["clueWord"]
    target_num = messageReceived["board"]["numOfGuesses"]
    team = messageReceived["board"]["turn"]["team"]
    level = messageReceived["AIDifficulty"]

    spy = Predictor_spy(relevant_vectors_path='rsc/data/relevant_vectors',
                    board=board,
                    clue=clue,
                    target_num=target_num,
                    level=level)
    guesses = spy.run()

    redScore = messageReceived["board"]["redScore"]
    blueScore = messageReceived["board"]["blueScore"]
    bombPicked = False
    for card in board:
        if card["word"] in guesses:
            card["isRevealed"] = True
            if card["colour"] == "redTeam":
                redScore += 1
            elif card["colour"] == "blueTeam":
                blueScore += 1
            elif card["colour"] == "bombCard":
                bombPicked = True

    if (team == "blue"):
        nextTurn = {"team": "red", "role": "spymaster"}
    else:
        nextTurn = {"team": "blue", "role": "spymaster"}

    room = messageReceived['board']['room']

    protocol = 'receiveBoardState'
    messageToSend = {
        'Protocol': protocol, \
        'clue': clue, \
        'numberOfGuesses': target_num, \
        'redScore': redScore, \
        'blueScore': blueScore, \
        'turn': nextTurn, \
        'turnOver': True, \
        'bombPicked': bombPicked, \
        'cards': np.reshape(board,(5,5)).tolist() \
    }
    emit(protocol, messageToSend, room=room)


"""
send/receive BoardState Protocol
"""
@socket_.on('sendBoardState', namespace='/')
def boardstate_broadcast_message(boardReceived):
    print("Board State Received!")

    numOfGuesses = int(boardReceived['numberOfGuesses']) - 1
    turn = boardReceived['turn']
    redScore = boardReceived['redScore']
    blueScore = boardReceived['blueScore']
    isTurnOver = False
    bombPicked = False

    if boardReceived['endTurn']:
        colour = 'unknown'
    else:
        cardI = int(boardReceived['cardChosen'].split(',')[0])
        cardJ = int(boardReceived['cardChosen'].split(',')[1])
        cardSelected = boardReceived['cards'][cardI][cardJ]
        cardSelected['isRevealed'] = True
        colour = cardSelected['colour']
        if colour == 'redTeam':
            redScore += 1
        elif colour == 'blueTeam':
            blueScore += 1
        elif colour == 'bombCard':
            bombPicked = True

    if numOfGuesses == 0 or colour[:len(colour)-4] != turn['team']:
        isTurnOver = True
        if turn['team'] == 'blue':
            nextTurn = {"team": "red", "role": "spymaster"}
        else:
            nextTurn = {"team": "blue", "role": "spymaster"}
    else:
        nextTurn = {"team": turn['team'], "role": "spy"}

    room = boardReceived['room']

    # define protocol and message
    protocol = 'receiveBoardState'
    messageToSend = {
        'Protocol': protocol, \
        'clue': boardReceived['clue'], \
        'numberOfGuesses': numOfGuesses, \
        'redScore': redScore, \
        'blueScore': blueScore, \
        'turn': nextTurn, \
        'turnOver': isTurnOver, \
        'bombPicked': bombPicked, \
        'cards': boardReceived['cards'] \
    }
    # send to client
    emit(protocol, messageToSend, room=room)


@socket_.on('chooseRole', namespace='/')
def update_role(roleReceived):
    room = roleReceived['room']
    protocol = 'receiveRoomInfo'
    messageToSend = {
        'Protocol': protocol,
        'blueSpy' : roleReceived["blueSpy"],
        'blueSm' : roleReceived["blueSm"],
        'redSpy' : roleReceived["redSpy"],
        'redSm' : roleReceived["redSm"],
        'numOfPeople' : roleReceived["numOfPeople"]
    }
    emit(protocol, messageToSend, room=room)


@socket_.on('syncRoomInfo', namespace='/')
def sync_role(sync):
    room = sync['room']
    numOfPeople = sync['numOfPeople']
    protocol = 'receiveRoomInfo'
    messageToSend = {
        'Protocol': protocol,
        'blueSpy' : sync["blueSpy"],
        'blueSm' : sync["blueSm"],
        'redSpy' : sync["redSpy"],
        'redSm' : sync["redSm"],
        'numOfPeople' : numOfPeople
    }
    emit(protocol, messageToSend, room=room)


@socket_.on('updateTurn', namespace='/')
def update_turn(turn):
    room = turn['room']
    protocol = 'changeTurn'
    messageToSend = {
        'Protocol': protocol,
        'currentTurn': turn["currentTurn"]
    }
    emit(protocol, messageToSend, room=room)


@socket_.on('endGame', namespace='/')
def game_over(winTeam):
    room = winTeam['room']
    protocol = 'gameOver'
    messageToSend = {
        'Protocol': protocol,
        'winTeam': winTeam['winner']
    }
    emit(protocol, messageToSend, room=room)


@socket_.on('restart', namespace='/')
def restart(message):
    room = message['room']
    protocol = 'restartGame'
    messageToSend = {
        'Protocol': protocol
    }
    emit(protocol, messageToSend, room=room)


@socket_.on('disconnect_request', namespace='/test')
def disconnect_request():
    @copy_current_request_context
    def can_disconnect():
        disconnect()

    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Disconnected!', 'count': session['receive_count']},
         callback=can_disconnect)


@socket_.on('template', namespace='/') #i needed to write this for the python tests because I was having trouble
def template_test(data):
    print("Received: " + data)
    emit("template", data)


def clean_room():
    rooms = open(room_path, "w")
    rooms.close()


clean_room()

if __name__ == '__main__':
    socket_.run(app, debug=True)