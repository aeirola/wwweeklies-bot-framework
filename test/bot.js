var chai = require('chai');
var expect = chai.expect;

var botbuilder = require('botbuilder');
var bot = new botbuilder.TextBot();
require('../bot.js')(bot);

describe('bot', function() {
  it('should reply to messages', function(done) {
    bot.processMessage({
      text: 'hi'
    },
    function(err, response) {
      expect(err).to.not.exist;
      expect(response.text).to.be.a.string;
      expect(response.text).to.contain('Hello');
      done();
    });
  });
});
