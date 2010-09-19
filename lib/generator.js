var fs = require('fs'),
    path = require('path'),
    template = require('./template'),
    async = require('./helpers/async'),
    fileutils = require('./helpers/fileutils'),
    config = require('./config');

var TEMPLATES_DIR = path.join(__dirname, '..', 'generator_templates');

exports.generate = generate;
function generate(name, config, callback) {
  createGenerator(name, config).generate(callback);
}

function createGenerator(name, config) {
  var self = {},
      testfile = name + '_test.js';
  
  self.testfile = testfile;
  
  self.generate = generate;
  function generate(callback) {
    _mkdirTestFile(function(err) {
      if (err) { 
        callback(err);
        return;
      }
      _mkdirFixtures(function() {
        _mkFixtures(callback)
      });
    })
  }
  
  function _mkdirTestFile(callback) {
    var input = path.join(TEMPLATES_DIR, 'test.mustache');
    _mkFileFromTemplate(input, testfile, callback);
  } 
  
  function _mkdirFixtures(callback) {
    fileutils.mkdirp(config.fixturesDir, 0777, callback);
  }
  
  function _mkFixtures(callback) {
    async.forEach(['js', 'css', 'html'], function(ext, i, _, cb) {
      var output = path.join(config.fixturesDir, name + '.' + ext),
          input = path.join(TEMPLATES_DIR, ext + '.mustache');
      _mkFileFromTemplate(input, output, cb);
    }, null, callback);
  }
  
  function _mkFileFromTemplate(input, output, callback) {
    path.exists(output, function(exists) {
      if (exists) {
        callback(new Error('File already exists: "' + output + '"'));
      } else {
        path.exists(input, function(exists) {
          if (exists) {
            template.renderToFile(input, output, self, callback);
          } else {
            fs.writeFile(output, '', callback);
          }
        });
      }
    });
  }
  
  return self;
}

if (require.main === module) {
  var names = process.argv.slice(2);
  
  if (names.indexOf('fixtures') > -1) {
    var msg = '"fixtures" is a reserved keyword and cannot be used as the name of a testfile.';
    throw new Error(msg);
  }
  
  config.createConfig({ inputDir: process.cwd() }, function(err, config) {
    if (err) { throw err; }
    async.forEach(names, function(name, i, _, cb) {
      exports.generate(name, config, cb);
    }, null, function(err) {
      if (err) {
        console.log(err.message);
      } else {
        console.log('Generated test files.');
      }
    });
  });
}