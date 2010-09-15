var express = require('express'),
    uaParser = require('ua-parser');

exports.createServer = createServer;
function createServer(config) {
  var server = express.createServer(
    express.bodyDecoder(),
    express.staticProvider(config.outputDir)
  );
  var resultHandler = config.resultHandler || _defaultResultHandler;
  server.post('/results', function(req, res) {
    res.redirect('back');
    resultHandler(_createResults(req));
  });

  server.listen(config.port);
}

function _createResults(req) {
  var self = JSON.parse(req.body.results);
  
  self.isSuccess = isSuccess;
  function isSuccess() {
    return self.failureCount == 0 && self.errorCount == 0;
  }
  
  self.toString = toString;
  function toString() {
    var str = '';
    str += self.testCount + ' tests, ';
    str += self.assertionCount + ' assertions, ';
    str += self.skipCount + ' skips, ';
    str += self.failureCount + ' failures, ';
    str += self.errorCount + ' errors. ';
    return str;
  }
  
  self.userAgent = uaParser.parse(req.headers['user-agent']);
  return self;
}

function _defaultResultHandler(r) {
  var args = [];
  args.push(r.isSuccess() ? '✔' : '✘');
  args.push(_displayTime(new Date));
  args.push('-');
  args.push(r.userAgent + ':');
  args.push(r);
  console.log(args.join(' '));
}


function _pad(n) {
  return (n > 9 ? '' : '0') + n;
}
      
function _displayTime(t) {
  return [t.getHours(), t.getMinutes(), t.getSeconds()].map(_pad).join(':');
}