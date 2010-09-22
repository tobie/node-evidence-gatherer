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
      basename = path.basename(name, '.js'),
      dirname = path.dirname(name),
      testDir = path.join(config.testsDir, dirname),
      filename = basename.replace(/(.*)/, config.testFileReplacement),
      testfile = path.join(testDir, filename),
      testFixturesDir = path.join(config.fixturesDir, dirname, basename);
      
  self.name = name;
  self.relativePath = path.join(dirname, filename);
  
  self.generate = generate;
  function generate(callback) {
    async.runSerial([
      _validate,
      _mkdirStructure,
      _mkdirTestDir,
      _writeTest,
      _mkdirTestFixturesDir,
      _writeTestFixtures
    ], callback);
  }
  
  function _mkdirStructure(callback) {
    async.runParallel([
      function(c) { fileutils.mkdirp(config.testsDir, 0777, c); },
      function(c) { fileutils.mkdirp(config.templatesDir, 0777, c); },
      function(c) { fileutils.mkdirp(config.fixturesDir, 0777, c); },
      _writeConfig
    ], callback);
  }
  
  function _writeConfig(callback) {
    var output = path.join(config.rootDir, 'evidence_gatherer.json');
    path.exists(output, function(exists) {
      if (!exists) {
        fs.writeFile(output, JSON.stringify(config, null, 4), callback);
      } else {
        callback();
      }
    });
  }
  
  function _mkdirTestDir(callback) {
    fileutils.mkdirp(testDir, 0777, callback);
  }
  
  function _mkdirTestFixturesDir(callback) {
    fileutils.mkdirp(testFixturesDir, 0777, callback);
  }
  
  function _writeTest(callback) {
    var input = path.join(TEMPLATES_DIR, 'test.mustache');
    _writeFromTemplate(input, testfile, callback);
  } 

  function _writeTestFixtures(callback) {
    async.forEach(config.fixtureContentTypes, function(ext, i, _, cb) {
      var output = path.join(testFixturesDir, 'fixture.' + ext),
          input = path.join(TEMPLATES_DIR, ext + '.mustache');
      _writeFromTemplate(input, output, cb);
    }, null, callback);
  }
  
  function _writeFromTemplate(input, output, callback) {
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
    path.exists(testfile, function(exists) {
      if (exists) {
        callback(new Error('Test "' + name + '" already exists.'));
        return;
      }
      callback();
    });
  }
  
  return self;
}

if (require.main === module) {
  var names = process.argv.slice(2);
  config.createConfig({}, function(err, config) {
    if (err) { throw err; }
    async.forEachInQueue(names, function(name, i, _, cb) {
      exports.generate(name, config, cb);
    }, null, function(err) {
      console.log(err ? err.message : 'Generated test files.');
    });
  });
}