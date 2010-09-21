var path = require('path'),
    express = require('express'),
    uaParser = require('ua-parser');

exports.createServer = createServer;
function createServer(config) {
  var server = express.createServer(
    express.bodyDecoder(),
    express.staticProvider(config.outputDir)
  );
  server.set('views', path.join(__dirname, '..', 'views'));
  server.register('.mustache', require('./template'));
  
  var resultsHandler = config.resultsHandler;
  server.post('/results', function(req, res) {
    var results = _createResults(req);
    res.render('results.mustache', { locals: results });
    resultsHandler(results);
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