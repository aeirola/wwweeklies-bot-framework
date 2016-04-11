var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var yargs = require('yargs');

var HELP = '# Help\n' +
  '- `help`\n' +
  '- `next`\n' +
  '- `prev`\n' +
  '- `toc`';

var SLIDES = [];

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

module.exports = function addDialogs(bot) {
  bot.add('/', function (session) {
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
  });
};
