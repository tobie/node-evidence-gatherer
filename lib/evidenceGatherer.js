exports.config = require('./config');
exports.createConfig = exports.config.createConfig;
exports.suiteBuilder = require('./builder/suiteBuilder');
exports.testPageBuilder = require('./builder/testPageBuilder');
exports.server = require('./server');
exports.userAgent = require('./userAgent');
exports.runner = require('./runner');
exports.run = exports.runner.run;

if (require.main === module) {
  exports.createConfig(null, function(err, config) {
    if (err) {
      console.log(err);
    } else {
      exports.run(config);
    }
  });
}
