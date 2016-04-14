var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var axios = require('axios');
var botbuilder = require('botbuilder');

// LUIS
var model = 'https://api.projectoxford.ai/luis/v1/application' +
            '?id=f83b1f99-8f67-40c3-8301-a671d9111ecd'+
            '&subscription-key=1e72765f59f54b9eb2f3745a1f80866e';
var dialog = new botbuilder.LuisDialog(model);

/**
  Constants
**/
var ANALYSIS_THRESHOLD = 0.25;
var SLIDE_PART_DELAY = 3000;

var HELP_SLIDE = '# Help\n' +
  'Available commands:\n' +
  '\n' +
  '- *hi*: Introduction.\n' +
  '- *help*: This command.\n' +
  '- *next*: Advance to next topic.\n' +
  '- *prev*: Go to previous topic.\n' +
  '- *topics*: Show a list of topics available.';

var SLIDES = [];
var SLIDE_NAMES = {
  'start': 'intro',
  'beginning': 'intro',
  'introduction': 'intro',
  'history': 'background',
  'chat bots': 'bots',
  'idea': 'promise',
  'vale': 'promise',
  'technology': 'tech',
  'details': 'tech',
  'feeling': 'impressions',
  'feelings': 'impressions',
  'thought': 'impressions',
  'thoughts': 'impressions',
  'about yourself': 'about'
};

var RESPONSES = {
  HATEFULL_INPUT: [
    'Don\'t talk to me like that.',
    'Watch your language.',
    'I don\'t need to listen to this kind of talk.',
    'I\'m a self-respecting bot, not some YouTube commenter.'
  ],
  UNKOWN_INPUT: [
    'I\'m sorry, I didn\'t understand you.',
    'Say what?',
    'I have no idea what that means.',
    'I don\'t even...'
  ]
};

var SLIDES_PATH = path.join(__dirname, 'slides');
fs.readdir(SLIDES_PATH, function(err, files) {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach(function(fileName, index) {
    var fileData = fs.readFileSync(path.join(SLIDES_PATH, fileName));

    var fileString = fileData.toString();
    var topicName = fileName
        .replace(/^\d+_/, '')
        .replace(/.md$/, '');

    SLIDES.push({
      name: topicName,
      index: index,
      content: fileString
    });
  })
});


/**
  Input preprocessing
**/
function preprocess(session) {
  var inputText = session.message.text;
  console.log('Preprocessing input:', inputText);

  return axios({
    method: 'POST',
    url: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
    headers: {
      'Ocp-Apim-Subscription-Key': '6e4beeafe284496191c9f55dc7417ee2'
    },
    data: {
      documents: [{
        id: "input",
        text: inputText
      }]
    }
  }).catch(function(err) {
    console.error('Linguistic analysis failed:', err);

    return {
      score: null,
      text: inputText
    };
  }).then(function(response) {
    var score = _.get(response, 'data.documents[0].score', 0.5);
    console.log('Text analysis complete:', score);

    if (score < ANALYSIS_THRESHOLD) {
      session.send(_.sample(RESPONSES.HATEFULL_INPUT));
      throw new Error('Hatefull speech error (' + score +  ')');
      return;
    }

    return {
      score: score,
      text: inputText
    };
  });
}


/**
  Response handling
**/
function sendContent(session, slide) {
  _.forEach(slide.split(/\n-{3,}\n/g), function(part, i) {
    _.delay(function() {
      session.send(part);
    }, i*SLIDE_PART_DELAY);
  })
}

function sendHelp(session) {
  return sendContent(session, HELP_SLIDE);
}

function sendTopics(session) {
  var toc = _.map(SLIDES, function(slide, index) {
    var line = (index+1) + '. ' + _.startCase(slide.name);
    if (index === _.get(session, 'dialogData.slideIndex', 0)) {
      line += ' **<--**';
    }
    return line;
  });

  return sendContent(session, '# Topics\n' + toc.join('\n'));
}

function sendSlide(session, name) {
  name = _.get(SLIDE_NAMES, name, name);
  var slide = _.find(SLIDES, {name: name});

  if (slide) {
    _.set(session, 'dialogData.slideIndex', slide.index);
    return sendContent(session, slide.content);
  } else {
    return sendContent(session, 'No such slide: ' + name);
  }
}

function sendNextSlide(session) {
  var slideIndex = _.get(session, 'dialogData.slideIndex', -1);
  slideIndex = Math.min(slideIndex+1, SLIDES.length-1);
  _.set(session, 'dialogData.slideIndex', slideIndex);

  return sendContent(session, SLIDES[slideIndex].content);
}

function sendPreviousSlide(session) {
  var slideIndex = _.get(session, 'dialogData.slideIndex', 1);
  slideIndex = Math.max(slideIndex-1, 0);
  _.set(session, 'dialogData.slideIndex', slideIndex);

  return sendContent(session, SLIDES[slideIndex].content);
}


/**
  Input handling
**/
function sendReply(session) {
  var input = session.message.text;

  // Add handlers for basic commands
  switch (input.toLowerCase().replace(/\W/, '')) {
    case 'hi':
    case 'hello':
      return sendSlide(session, 'intro');
    case 'h':
    case 'help':
      return sendHelp(session);
    case 't':
    case 'toc':
    case 'topics':
      return sendTopics(session);
    case 'n':
    case 'next':
      return sendNextSlide(session);
    case 'p':
    case 'prev':
      return sendPreviousSlide(session);
  }

  if (_.startsWith(input.toLowerCase(), 'slide ')) {
    return sendSlide(session, input.toLowerCase().replace(/^slide /, ''));
  }

  // No base command found, start LUIS dialog
  return dialog.begin(session);
}

// Add handlers for LUIS intents
dialog.on('Hello', function(session) {
  return sendSlide(session, 'intro');
});

dialog.on('Help', function(session) {
  return sendHelp(session);
});

dialog.on('Topics', function(session) {
  return sendTopics(session);
});

dialog.on('Next Slide', function(session) {
  return sendNextSlide(session);
});

dialog.on('Previous Slide', function(session) {
  return sendPreviousSlide(session);
});

dialog.on('Go to slide', function(session, results) {
  var slideNameEntity = _.get(_.find(_.get(results, 'entities', []), {type: 'Slide name'}), 'entity');
  return sendSlide(session, slideNameEntity);
});

dialog.onDefault(function(session) {
  session.send(_.sample(RESPONSES.UNKOWN_INPUT));
});


/**
  Bind bot dialgs
**/
module.exports = function addDialogs(bot) {
  bot.add('/', function (session) {
    preprocess(session).then(function(processed) {
      sendReply(session);
    }).catch(function(e) {
      console.error(e);
    });
  });
};
