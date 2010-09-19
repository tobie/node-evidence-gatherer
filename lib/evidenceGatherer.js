exports.config = require('./config');
exports.createConfig = exports.config.createConfig;
exports.suiteBuilder = require('./builder/suiteBuilder');
exports.testPageBuilder = require('./builder/testPageBuilder');
exports.server = require('./server');
exports.userAgent = require('./userAgent');
exports.runner = require('./runner');
exports.run = exports.runner.run;

if (require.main === module) {
  var path = require('path'), cwd = process.cwd();
  exports.createConfig({
    inputDir: path.join(cwd, 'example', 'test'),
    templatesDir: path.join(cwd, 'templates')
  }, function(err, config) {
    if (err) { throw err; }
    exports.run(config);
  });
}
