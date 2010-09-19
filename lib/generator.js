var fs = require('fs'),
    path = require('path'),
    template = require('./template'),
    async = require('./helpers/async'),
    fileutils = require('./helpers/fileutils'),
    config = require('./config');

var TEMPLATES_DIR = path.join(__dirname, '..', 'generator_templates'),
    PUBLIC_DIR = path.normalize('public');

exports.generate = generate;
function generate(name, config, callback) {
  createGenerator(name, config).generate(callback);
}

function createGenerator(name, config) {
  var self = {},
      testfile = name + '_test.js',
      testdir = path.normalize(path.dirname(testfile));
  
  self.testfile = testfile;
  
  self.generate = generate;
  function generate(callback) {
    async.runSerial([
      _validate,
      _mkdirTestDir,
      _mkdirTestFile,
      _mkdirMain,
      _mkdirPublic,
      _mkdirFixtures,
      _mkFixtures
    ], callback);
  }

  function _mkdirTestDir(callback) {
    fileutils.mkdirp(testdir, 0777, callback);
  }
  
  function _mkdirTestFile(callback) {
    var input = path.join(TEMPLATES_DIR, 'test.mustache');
    _mkFileFromTemplate(input, testfile, callback);
  } 
  
  function _mkdirMain(callback) {
    fileutils.mkdirp(config.fixturesDir, 0777, callback);
  }
  
  function _mkdirPublic(callback) {
    var dir = path.join(config.fixturesDir, 'public');
    fileutils.mkdirp(dir, 0777, callback);
  }
  
  function _mkdirFixtures(callback) {
    var dir = path.join(config.fixturesDir, testdir);
    fileutils.mkdirp(dir, 0777, callback);
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
  
  function _validate(callback) {
    
    if (name === 'public') {
      var msg = '"public" is a reserved keywords and cannot be used as the name of a testfile.';
      callback(new Error(msg));
      return;
    }
    
    if (name === 'fixtures') {
      var msg = '"fixtures" is a reserved keywords and cannot be used as the name of a testfile.';
      callback(new Error(msg));
      return;
    }
    
    if (testdir === PUBLIC_DIR) {
      var msg = '"public" is a reserved keyword and cannot be used as the name of a test directory.';
      callback(new Error(msg));
      return;
    }
    
    callback();
  }
  
  return self;
}

if (require.main === module) {
  var names = process.argv.slice(2);
  config.createConfig({ inputDir: process.cwd() }, function(err, config) {
    if (err) { throw err; }
    async.forEachInQueue(names, function(name, i, _, cb) {
      exports.generate(name, config, cb);
    }, null, function(err) {
      console.log(err ? err.message : 'Generated test files.');
    });
  });
}