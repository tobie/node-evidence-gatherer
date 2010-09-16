var path = require('path');

var VENDOR_PATH = path.normalize(path.join(__dirname, '..', 'vendor'));

require.paths.unshift(VENDOR_PATH);

exports.config = require('./config');
exports.createConfig = exports.config.createConfig;
exports.suiteBuilder = require('./builder/suiteBuilder');
exports.testPageBuilder = require('./builder/testPageBuilder');
exports.server = require('./server');
exports.userAgent = require('./userAgent');
exports.runner = require('./runner');
exports.run = exports.runner.run;

if (require.main === module) {
  exports.createConfig({
    inputDir: path.join(__dirname, '..', 'example', 'test'),
    templatesDir: path.join(__dirname, '..', 'templates')
  }, function(err, config) {
    if (err) { throw err; }
    exports.run(config);
  });
}
