//see https://www.chaijs.com/api/assert/
const assert = chai.assert;

/* Server Tests */
{
    describe("server.sendToServer() formatting", function () {
        var protocol = "testProtocol";
        var data = {"Protocol" : protocol,
                    "Key1" : "Item1",
                    "Key2" : "Item2"}

        var sent = server.sendToServer(protocol, data);

        it("data = { Protocol : 'testProtocol'", function () {
            assert.equal(sent.eventName, "testProtocol");
        });

        it("Key1 : 'Item1'",function () {
            assert.equal(sent.data.Key1, "Item1");
        });

        it("Key2 : 'Item2' }",function () {
            assert.equal(sent.data.Key2, "Item2");
        });
    });

    describe("server.registerObserver() check", function () {
        var server = new Server();

        class TestClass extends Observer{
            name
            constructor(con){
                super();
                this.name = con;
            }
        }

        it("single observer",function () {
            server.registerObserver(new TestClass("object"));
            assert.equal(server.observers[0].name, "object");
        });

        it("multiple observers", function () {
            for(let i = 1; i < 10; i++){
                server.registerObserver(new TestClass("object" + i));
                assert.equal(server.observers[i].name, "object" + i);
            }
        });
    });

}

/* Chat Tests */
{
    describe("chat.update() receiving message", function () {

        var chatbox = new Chatbox();

        var data = {
            "Protocol" : "chat", 
            "message" : "hello",
            "room" : "room1",
            "team" : "blue"
        }

        var eventl = "chat";
        var chatTest = chatbox.update(eventl, data);

        it("update for message", function () {
            assert.equal(eventl,"chat");
        });

        
        it("data = {Protcol : 'chat'}", function () {
            assert.equal(chatTest.eventName,"chat");
        });

        it("Test if message being received", function () {
            assert.equal(chatTest.args.message,"hello");
        });

        it("Test room code", function () {
            assert.equal(chatTest.args.room,"room1");
        });

        it("Test team colour", function () {
            assert.equal(chatTest.args.team,"blue");
        });
    });


    describe("chat.sendChat() sending message", function () {


        var chatTest = chatbox.sendChat();
        

        it("Testing send chat", function () {
            assert.equal(chatTest.chatText, '');
        });

    });

}

/* Board Tests */
{
    describe("Example Test", function () {
        it("Example Test Description", function () {
            assert.equal(true,true);
        });
    });

}

/* Other Tests */
{
    describe("observer.update() interface", function () {
        var observerInterface = new Observer();

        it(".update() Error thrown", function () {
            try{
                observerInterface.update();
                assert.fail("An error should be thrown when the Observer class is used directly instead of being subclassed!\n");
            }
            catch(Error){
                //error is thrown, assertion passes by default
            }
        });
    });

}