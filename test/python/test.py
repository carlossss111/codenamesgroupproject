# import parent directories
import os
import sys
import inspect
currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
grandparentdir = os.path.dirname(parentdir)
sys.path.insert(0, grandparentdir) 

#import /app.py and other dependencies from it
from app import app, SocketIO

# unit test imports 
import unittest
import json

# declare the socket connection
async_mode = None #"threading" ?
socket_ = SocketIO(app, async_mode=async_mode, cors_allowed_origins='*')

#test class, test functions must begin with "test" to be run
class test(unittest.TestCase):
    #template
    def testTemplate(self):
        flask_test_client = app.test_client()
        client = socket_.test_client(app, flask_test_client=flask_test_client, namespace='/')
        self.assertTrue(client.is_connected())

    #test that the chat message returns something
    def testChatSuccess(self):

        #create a new client to test the server
        flask_test_client = app.test_client()
        client = socket_.test_client(app, flask_test_client=flask_test_client, namespace='/')
        
        #define the JSON input
        input =  { 
            "Protocol" : "chat",
            "message" : "Cool Name: Hello World!", 
            "room" : "AABBCC11", 
            "team" : "red" }
        input =  json.dumps(input)
        client.emit("chat", input, namespace='/')

        #output that we expect to receive
        expected = { 
            "Protocol": "chat", 
            "message": "Cool Name: Hello World!", 
            "team": "red" }
        expected =  json.dumps(expected)

        #get the actual output
        output = client.get_received(namespace='/')
        
        #tests
        self.assertEqual(output, expected)

if __name__ == '__main__':
    unittest.main()