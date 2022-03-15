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
    "name" : "test"
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
    "team" : "red"
}
client_.emit('chat', input, namespace='/')

@client_.on("chat", namespace='/')
def chat_test(data):

    expectedOutput = {
    "Protocol" : "chat",
    "message" : "Test Name: Hello World",
    "team" : "red"
    }

    print("Chat Protocol Test: ", end="")
    assert (data == expectedOutput), tFail("The chat should be in the expected format!"); tPass()

exit(1)