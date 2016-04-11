module.exports = function addDialogs(bot) {
    bot.add('/', function (session) {
        session.send('Hello World');
    });
};
