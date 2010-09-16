var suiteBuilder = require('./builder/suiteBuilder'),
    server = require('./server'),
    config = require('./config'),
    userAgent = require('./userAgent');

exports.createRunner = createRunner;
function createRunner(config) {
  var self = {};
  
  self.buildSuite = buildSuite;
  function buildSuite(callback) {
    suiteBuilder.build(config, function(err) {
      callback(err, self);
    });
  }
  
  self.createServer = createServer;
  function createServer(callback) {
    server.createServer(config);
    return self;
  }
  
  self.visit = visit;
  function visit() {
    var agents = config.userAgents,
        url = 'http://127.0.0.1:' + config.port;
    
    for (var name in agents) {
      var agent = userAgent.createUserAgent(name, agents[name]); 
      agent.visit(url);
    }
    return self;
  }
  
  return self;
}

exports.run = run;
function run(config) {
  var runner = createRunner(config);
  runner.createServer();
  runner.buildSuite(function(err) {
    if (err) { throw err; }
    runner.visit();
  });
}