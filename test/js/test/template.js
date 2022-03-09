//testing framework import
const assert = require("chai").assert;

//function imports
const { sayHello } = require("../template.js");

//Tests
describe("check" /* name */, function(){
    it("Check should return hello" /* description of test */, function(){
        assert.equal(sayHello() /* function to test */, "hello" /* desired output */);
    });
});

//then use:
//`npm run test`