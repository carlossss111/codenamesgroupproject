import time
import sys
import numpy as np
from flask import Flask, session, copy_current_request_context
from flask_socketio import SocketIO, emit, disconnect, join_room, leave_room
from threading import Lock
from src.game.boardGenerator import *
from src.game.predictor import *


async_mode = None
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socket_ = SocketIO(app, async_mode=async_mode, cors_allowed_origins='*')
thread = None
thread_lock = Lock()
room_path = "rsc/data/rooms"
relevant_words_path = "rsc/data/relevant_words"
relevant_vectors_path = "rsc/data/relevant_vectors"
minimum_time_spy_think = 1
minimum_time_spy_pick_a_card = 1
minimum_time_spymaster_think = 2


"""
Join a game room
"""
@socket_.on('joinRoom')
def on_join(data):
    room = data['room']
    name = data['name']
    choice = data['choice']
    is_joined = data['isJoined']

    with open(room_path, "r+") as f:
        rooms = [line.rstrip() for line in f]
        print("Current rooms:", rooms)
        if room in rooms and choice != '2' and not is_joined:
            print("Room exist!")
            emit('roomError', "The room name is taken by others, please try again.")
        elif room not in rooms and choice == '2':
            print("Room not exist!")
            emit('roomError', "The room name doesn't exist, please try again.")
        else:
            if choice != '2' and not is_joined:
                f.write(room + '\n')
            if choice == '2' and not is_joined:
                emit('syncRequest', "request sync", room=room)
            join_room(room)
            protocol = 'sendRoomInfo'
            message_to_send = {
                'Protocol': protocol,
                'message': name + ' has entered room ' + room,
                'name': name
            }
            emit(protocol, message_to_send, room=room)


"""
Quit a game room
"""
@socket_.on('quitRoom')
def on_quit(data):
    room = data['room']
    name = data['name']
    team = data['team']
    choice = data['choice']
    num_of_people = data['numOfPeople'] - 1
    leave_room(room)

    emit('syncPeople', num_of_people, room=room)
    message_to_send = {
        'Protocol': 'chat',
        'message': name + ' has quit room ' + room,
        'team': team,
        'role': "spy"
    }
    emit('chat', message_to_send, room=room)
    
    if choice != '2':
        with open(room_path, "r+") as f:
            rooms = f.readlines()
            f.seek(0)
            for r in rooms:
                if r.rstrip() != room:
                    f.write(r)
            f.truncate()
        message_to_send = {
            'Protocol': 'hostQuit'
        }
        emit('hostQuit', message_to_send, room=room)


"""
Create a initial game board
"""
@socket_.on("createInitialBoardState", namespace='/')
def index(settings):
    print("Initial game board received!")
    game = BoardGenerator("rsc/data/codenames_words", settings["BombCard"])
    board = game.board
    room = settings["room"]
    timer = settings["TimerLength"]

    protocol = 'sendInitialBoardState'
    message_to_send = {
        'Protocol': protocol,
        'board': board,
        'timerLength': timer,
        'vocabulary': get_vocabulary()
    }
    # send to client
    emit(protocol, message_to_send, room=room)


"""
Chat Protocol
Forwards message sent from a client to all other clients.
"""
@socket_.on('chat', namespace='/')
def chat_broadcast(message_received):
    print("Chat Message Received!")
    room = message_received['room']
    # define protocol and message
    protocol = 'chat'
    message_to_send = {
        'Protocol': protocol,
        'message': message_received['message'],
        'team' : message_received['team'],
        'role' : message_received['role']
    }
    # send to client
    emit(protocol, message_to_send, room=room)


"""
forwardClue Protocol
Forwards clue sent from a spymaster client to all other clients.
Changes the turn.
"""
@socket_.on('forwardClue', namespace='/')
def clue_broadcast(message_received):
    print("Clue Received!")

    # reassign values
    turn = message_received['turn']
    next_turn = {"team": turn['team'], "role": "spy"}
    room = message_received['room']

    # define protocol and message
    protocol = 'forwardClue'
    message_to_send = {
        'Protocol': protocol,
        'clue': message_received['clue'],
        'numberOfGuesses': message_received['numberOfGuesses'],
        'turn': next_turn
    }
    # send to client
    emit(protocol, message_to_send, room=room)


"""
Generate a clue and target number (AI)
"""
@socket_.on("generateClue", namespace='/')
def clue_broadcast_AI(message_received):
    board = list(chain.from_iterable(message_received["board"]["cards"]))
    team = message_received["board"]["turn"]["team"]

    spymaster = SpymasterAI(relevant_words_path=relevant_words_path,
                          relevant_vectors_path=relevant_vectors_path,
                          board=board,
                          turn=team)
    clue, targets = spymaster.run()

    next_turn = {"team": team, "role": "spy"}
    room = message_received['board']['room']
    numGuesses = max(len(targets), 1)

    time.sleep(minimum_time_spymaster_think)
    protocol = 'forwardClue'
    message_to_send = {
        'Protocol' : protocol,
        'clue' : clue,
        'numberOfGuesses' : numGuesses,
        'turn' : next_turn
    }
    emit(protocol, message_to_send, room=room)


"""
Generate a hint (AI)
"""
@socket_.on("hint", namespace='/')
def hint_broadcast_AI(message_received):
    board = list(chain.from_iterable(message_received["board"]["cards"]))
    team = message_received["board"]["turn"]["team"]
    role = message_received["board"]["player"]["role"]

    spymaster = SpymasterAI(relevant_words_path=relevant_words_path,
                          relevant_vectors_path=relevant_vectors_path,
                          board=board,
                          turn=team)
    _, targets = spymaster.run()

    if len(targets) == 0:
        protocol = "hintError"
        message_to_send = "Too few words to give a hint!"
        
    elif role == "spy":
        protocol = "spyHint"
        message_to_send = {
            'Protocol' : protocol,
            'hint' : targets[0],
        }
    else:
        protocol = "spymasterHint"
        message_to_send = {
            'Protocol' : protocol,
            'hint' : targets,
        }
    emit(protocol, message_to_send)


"""
Generate a list of guesses (AI)
"""
@socket_.on('generateGuess', namespace='/')
def guess_broadcast_AI(message_received):
    board = list(chain.from_iterable(message_received["board"]["cards"]))
    clue = message_received["board"]["clueWord"]
    target_num = message_received["board"]["numOfGuesses"]
    turn = message_received["board"]["turn"]
    team = message_received["board"]["turn"]["team"]
    level = message_received["AIDifficulty"]
    room = message_received['board']['room']
    red_score = message_received["board"]["redScore"]
    blue_score = message_received["board"]["blueScore"]

    spy = SpyAI(relevant_vectors_path=relevant_vectors_path,
                    board=board,
                    clue=clue,
                    target_num=target_num,
                    level=level)
    guesses = spy.run()

    if (team == "blue"):
        next_turn = {"team": "red", "role": "spymaster"}
    else:
        next_turn = {"team": "blue", "role": "spymaster"}
    
    protocol = 'receiveBoardState'
    bomb_picked = False
    turn_over = False
    max_guess = len(guesses)
    guess_num = 0
    time.sleep(minimum_time_spy_think)
    
    for card in board:
        if card["word"] in guesses and not turn_over:
            card["isRevealed"] = True
            guess_num += 1

            if card["colour"] == "redTeam":
                red_score += 1
                if team == "blue":
                    turn_over = True
                    turn = next_turn
            elif card["colour"] == "blueTeam":
                blue_score += 1
                if team == "red":
                    turn_over = True
                    turn = next_turn
            elif card["colour"] == "bombCard":
                bomb_picked = True
                turn_over = True
                turn = next_turn
            else:
                turn_over = True
                turn = next_turn

            if guess_num == max_guess:
                turn_over = True
                turn = next_turn

            time.sleep(minimum_time_spy_pick_a_card)
            message_to_send = {
                'Protocol': protocol,
                'clue': clue,
                'numberOfGuesses': target_num,
                'redScore': red_score,
                'blueScore': blue_score,
                'turn': turn,
                'turnOver': turn_over,
                'bombPicked': bomb_picked,
                'cards': np.reshape(board,(5,5)).tolist()
            }
            emit(protocol, message_to_send, room=room)


"""
Player pick a card, send BoardState to all clients
"""
@socket_.on('sendBoardState', namespace='/')
def guess_broadcast(board_received):
    print("Board State Received!")

    num_of_guesses = int(board_received['numberOfGuesses']) - 1
    turn = board_received['turn']
    red_score = board_received['redScore']
    blue_score = board_received['blueScore']
    is_turn_over = False
    bomb_picked = False

    if board_received['endTurn']:
        colour = 'unknown'
    else:
        cardI = int(board_received['cardChosen'].split(',')[0])
        cardJ = int(board_received['cardChosen'].split(',')[1])
        card_selected = board_received['cards'][cardI][cardJ]
        card_selected['isRevealed'] = True
        colour = card_selected['colour']
        if colour == 'redTeam':
            red_score += 1
        elif colour == 'blueTeam':
            blue_score += 1
        elif colour == 'bombCard':
            bomb_picked = True

    if num_of_guesses == 0 or colour[:len(colour)-4] != turn['team']:
        is_turn_over = True
        if turn['team'] == 'blue':
            next_turn = {"team": "red", "role": "spymaster"}
        else:
            next_turn = {"team": "blue", "role": "spymaster"}
    else:
        next_turn = {"team": turn['team'], "role": "spy"}

    room = board_received['room']

    # define protocol and message
    protocol = 'receiveBoardState'
    message_to_send = {
        'Protocol': protocol,
        'clue': board_received['clue'],
        'numberOfGuesses': num_of_guesses,
        'redScore': red_score,
        'blueScore': blue_score,
        'turn': next_turn,
        'turnOver': is_turn_over,
        'bombPicked': bomb_picked,
        'cards': board_received['cards']
    }
    # send to client
    emit(protocol, message_to_send, room=room)


"""
Player choose a role, send role configuration to all clients
"""
@socket_.on('chooseRole', namespace='/')
def update_role(role_received):
    room = role_received['room']
    protocol = 'receiveRoomInfo'
    message_to_send = {
        'Protocol': protocol,
        'blueSpy' : role_received["blueSpy"],
        'blueSm' : role_received["blueSm"],
        'redSpy' : role_received["redSpy"],
        'redSm' : role_received["redSm"],
        'numOfPeople' : role_received["numOfPeople"]
    }
    emit(protocol, message_to_send, room=room)


"""
New player join a room, update room and role information
"""
@socket_.on('syncRoomInfo', namespace='/')
def sync_role(sync):
    room = sync['room']
    num_of_people = sync['numOfPeople']
    protocol = 'receiveRoomInfo'
    message_to_send = {
        'Protocol': protocol,
        'blueSpy' : sync["blueSpy"],
        'blueSm' : sync["blueSm"],
        'redSpy' : sync["redSpy"],
        'redSm' : sync["redSm"],
        'numOfPeople' : num_of_people
    }
    emit(protocol, message_to_send, room=room)


"""
Update new turn to all clients
"""
@socket_.on('updateTurn', namespace='/')
def update_turn(turn):
    room = turn['room']
    protocol = 'changeTurn'
    message_to_send = {
        'Protocol': protocol,
        'currentTurn': turn["currentTurn"]
    }
    emit(protocol, message_to_send, room=room)


"""
Send game over state to all clients
"""
@socket_.on('endGame', namespace='/')
def game_over(win_team):
    room = win_team['room']
    protocol = 'gameOver'
    message_to_send = {
        'Protocol': protocol,
        'winTeam': win_team['winner']
    }
    emit(protocol, message_to_send, room=room)


"""
Send restart game message to all clients
"""
@socket_.on('restart', namespace='/')
def restart_game(message):
    room = message['room']
    protocol = 'restartGame'
    message_to_send = {
        'Protocol': protocol
    }
    emit(protocol, message_to_send, room=room)


"""
Disconnect user from the server
"""
@socket_.on('disconnect_request', namespace='/test')
def disconnect_server():
    @copy_current_request_context
    def can_disconnect():
        disconnect()

    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Disconnected!', 'count': session['receive_count']},
         callback=can_disconnect)


"""
For python tests
"""
@socket_.on('template', namespace='/')
def template_test(data):
    print("Received: " + data)
    emit("template", data)


"""
Clean file storing current room id
"""
def clean_room():
    rooms = open(room_path, "w")
    rooms.close()


"""
Starts the server (by default on port 5000)
"""
if __name__ == '__main__':
    clean_room()
    serv_port = 5000
    if (len(sys.argv) > 1): serv_port = sys.argv[1]
    socket_.run(app, debug=True, port=serv_port)