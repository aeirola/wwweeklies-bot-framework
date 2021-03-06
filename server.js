#!/usr/bin/env node
var restify = require('restify');
var botbuilder = require('botbuilder');

// Define arguments
var yargs = require('yargs')
  .options({
    'i': {
      alias: 'id',
      default: 'wwweekliesBotFramework',
      describe: 'Bot connector appId',
      type: 'string'
    },
    's': {
      alias: 'secret',
      demand: true,
      describe: 'Bot connector appSecret',
      type: 'string'
    },
    'p': {
      alias: 'port',
      default: 3978,
      descript: 'TCP port',
      type: 'number'
    }
  })
  .env()
  .help('h')
  .alias('h', 'help')
  .argv;

// Create bot and add dialogs
var bot = new botbuilder.BotConnectorBot({
  appId: yargs.id,
  appSecret: yargs.secret
});
require('./bot.js')(bot);

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());

// Serve certain static files
server.get('/', restify.serveStatic({
  directory: __dirname,
  file: 'index.html'
}));

// Listen on port
server.listen(yargs.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
