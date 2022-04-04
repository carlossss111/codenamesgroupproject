import socketio

##########
# Setup  #
##########

# Utility Functions
f = open("test.log", "w")
f.close()
def tPass():
    print("\u001b[32m" + "Pass" + "\u001b[0m")
    f = open("test.log", "a") #every time there is a pass that should be recorded for runTests.sh
    f.write("PASS\n")
    f.close()
    
def tFail(text):
    client_.disconnect()
    return "\u001b[31m" + "FAIL, " + "\u001b[0m" + text
    
# Client Creation
client_ = socketio.Client()
client_.connect('http://localhost:5000')

@client_.event
def connect():
    print("Connection Established")

# Room Connection
roomDict = {
    "Protocol" : "joinRoom",
    "room" : "AABBCC",
    "name" : "test",
    "choice" : 0, # singleplayer
    "isJoined" : 1, 
}
room = roomDict['room']
client_.emit("joinRoom", roomDict, namespace='/')

#############
### Tests ###
#############

### Template Test ###
client_.emit('template', "Hello World!", namespace='/') #message SENT
@client_.on('template', namespace='/')
def template_test(data): #data RECEIVED
    print("Template Test: ", end="")
    assert (data == "Hello World!"), tFail("The server response should be 'Hello World!'"); tPass()

### Chat Test ###
input = {
    "Protocol" : "chat",
    "message" : "Test Name: Hello World",
    "room" : room,
    "team" : "red",
    "role" : "spy"
}
client_.emit('chat', input, namespace='/')

@client_.on("chat", namespace='/')
def chat_test(data):

    expectedOutput = {
    "Protocol" : "chat",
    "message" : "Test Name: Hello World",
    "team" : "red",
    "role" : "spy"
    }

    print("Chat Protocol Test: ", end="")
    assert (data == expectedOutput), tFail("The chat should be in the expected format!"); tPass()

### Forward Clue Test ###
#get input
input = {
    "Protocol" : "forwardClue",
    "clue" : "testClue",
    "numberOfGuesses" : 5,
    "player" : "testPlayer",
    "turn" : {"team" : "red", "role" : "spymaster"},
    "room" : room
}
client_.emit("forwardClue",input,namespace='/')

@client_.on("forwardClue", namespace='/')
def forwardClue_test(data):
    print("Forward-clue word test: ", end="")
    assert (data["clue"] == "testClue"), tFail("The clue has changed"); tPass()
    print("Forward-clue number test: ", end="")
    assert (data["numberOfGuesses"] == 5), tFail("The number of guesses has changed"); tPass()
    print("Forward-clue turn change test: ", end="")
    assert (data["turn"] == {"team" : "red", "role" : "spy"}), tFail("The turn should have changed"); tPass()

exit(1)