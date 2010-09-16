var express = require('express'),
    uaParser = require('ua-parser');

exports.createServer = createServer;
function createServer(config) {
  var server = express.createServer(
    express.bodyDecoder(),
    express.staticProvider(config.outputDir)
  );
  
  var resultsHandler = config.resultsHandler;
  server.post('/results', function(req, res) {
    res.redirect('back');
    resultsHandler(_createResults(req));
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