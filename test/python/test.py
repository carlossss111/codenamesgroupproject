import socketio

##########
# Setup  #
##########

# Utility Functions
def tPass():
    print("\u001b[32m" + "Pass" + "\u001b[0m")
    
def tFail(text):
    client_.disconnect()
    return "\u001b[31m" + "FAIL, " + "\u001b[0m" + text
    
# Client Creation
client_ = socketio.Client()
client_.connect('http://localhost:5000')

@client_.event
def connect():
    print("Connection Established")

#############
### Tests ###
#############

### Template Test
client_.emit('template', "Hello World!", namespace='/') #message SENT
@client_.on('template', namespace='/')
def template_test(data): #data RECEIVED
    print("Template Test: ", end="")
    assert (data == "Hello World!"), tFail("The server response should be 'Hello World!'"); tPass()

# copy and change the below as needed
""""
client_.emit(PROTOCOL_NAME_ON_SERVER, MESSAGE_TO_SEND, namespace='/')
@client_.on(PROTOCOL_NAME_ON_SERVER, namespace='/')
def template_test(data):
    print(TEST NAME, end="")
    assert (data == EXPECTED OUTPUT), tFail(FAILURE MESSAGE); tPass()
"""

exit(1)