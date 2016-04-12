var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var axios = require('axios');

var HELP = '# Help\n' +
  '- `help`\n' +
  '- `next`\n' +
  '- `prev`\n' +
  '- `toc`';

var SLIDES = [];

var ANALYSIS_THRESHOLD = 0.4;

var RESPONSES = {
  HATEFULL_INPUT: [
    'Don\'t talk to me like that.',
    'Watch your language.',
    'I don\'t need to listen to this kind of talk.',
    'I\'m a self-respecting bot, not some YouTube commenter.'
  ]
};

var SLIDES_PATH = path.join(__dirname, 'slides');
fs.readdir(SLIDES_PATH, function(err, files) {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach(function(fileName) {
    var fileData = fs.readFileSync(path.join(SLIDES_PATH, fileName));

    var fileString = fileData.toString();
    var topicName = fileName
        .replace(/^\d+_/, '')
        .replace(/.md$/, '');

    SLIDES.push({
      name: topicName,
      content: fileString
    });
  })
});

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

function sendHelp(session) {
  return session.send(HELP);
}

function sendTopics(session) {
  var toc = _.map(SLIDES, function(slide, index) {
    return (index+1) + '. ' + _.startCase(slide.name);
  });

  return session.send('# Topics\n' + toc.join('\n'));
}

function sendSlide(session, name) {
  var slide = _.find(SLIDES, {name: name});

  if (slide) {
    return session.send(slide.content);
  } else {
    return session.send('No such slide:' + name);
  }
}

function sendNextSlide(session) {
  var slideIndex = _.get(session, 'dialogData.slideIndex', -1);
  slideIndex = Math.min(slideIndex+1, SLIDES.length-1);
  _.set(session, 'dialogData.slideIndex', slideIndex);

  return session.send(SLIDES[slideIndex].content);
}

function sendPreviousSlide(session) {
  var slideIndex = _.get(session, 'dialogData.slideIndex', 1);
  slideIndex = Math.max(slideIndex-1, 0);
  _.set(session, 'dialogData.slideIndex', slideIndex);

  return session.send(SLIDES[slideIndex].content);
}

function sendReply(session) {
  var input = session.message.text;

  switch (input.toLowerCase()) {
    case 'help':
      return sendHelp(session);
    case 'topics':
      return sendTopics(session);
    case 'next':
      return sendNextSlide(session);
    case 'prev':
      return sendPreviousSlide(session);
  }

  if (_.startsWith(input.toLowerCase(), 'slide ')) {
    return sendSlide(session, input.toLowerCase().replace(/^slide /, ''));
  }

  return session.send('What do you mean?');
}

module.exports = function addDialogs(bot) {
  bot.add('/', function (session) {
    preprocess(session).then(function(processed) {
      sendReply(session);
    }).catch(function(e) {
      console.error(e);
    });
  });
};
