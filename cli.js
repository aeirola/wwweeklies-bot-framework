#!/usr/bin/env node
var botbuilder = require('botbuilder');

var bot = new botbuilder.TextBot();
require('./bot.js')(bot);

bot.listenStdin();
