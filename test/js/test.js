/* Server Tests */
{
    describe("sendToServer()", function () {
        it("The data sent should be in the format {Protocol : 'name', key1 : Item1, key2 : Item2}", 
        function () {
            var protocol = "testProtocol";
            var data = {"Protocol" : protocol,
                        "Key1" : "Item1",
                        "Key2" : "Item2"}

            var sent = server.sendToServer(protocol, data);

            expect(sent.eventName).to.be.equal("testProtocol");
            expect(sent.data.Key1).to.be.equal("Item1");
            expect(sent.data.Key2).to.be.equal("Item2");
        });
    });

}

/* Chat Tests */
{
    describe("Example Test", function () {
        it("Example Test Description", function () {
            expect(true).to.be.equal(true);
        });
    });

}

/* Board Tests */
{
    describe("Example Test", function () {
        it("Example Test Description", function () {
            expect(true).to.be.equal(true);
        });
    });

}

/* Other Tests */
{
    describe("Example Test", function () {
        it("Example Test Description", function () {
            expect(true).to.be.equal(true);
        });
    });

}