#!/usr/bin/env node
var botbuilder = require('botbuilder');

// Create text bot
var bot = new botbuilder.TextBot();

// Bind our dialogs
require('./bot.js')(bot);

// Start command interface
bot.listenStdin();
