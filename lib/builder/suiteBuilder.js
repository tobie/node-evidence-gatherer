var fs = require('fs'),
    path = require('path'),
    async = require('../helpers/async'),
    fileutils = require('../helpers/fileutils'),
    testPageBuilder = require('./testPageBuilder');
    
var ASSETS_PATH = path.normalize(path.join(__dirname, '..', '..', 'assets'));

exports.createSuiteBuilder = createSuiteBuilder;
function createSuiteBuilder(config) {
  var self = {}, testFiles, testPageBuilders = [];
  
  self.build = build;
  function build(callback) {
     async.compose([
      _rmdirOutput,
      _mkdirOutput,
      _mkdirsOutputStructure,
      _collectTestFiles,
      _buildTestPages,
      function(builders, callback) {
        _setTestBuilders(builders);
        callback(null);
      },
      _createManifest,
      _cpIndex,
      _cpAssets
    ], function(err) { callback(err, self); });
  }
  
  function _rmdirOutput(callback) {
    var dir = config.outputDir;
    path.exists(dir, function(exists) {
      exists ? fileutils.rmrfdir(dir, callback) : callback();
    });
  }
  
  function _mkdirsOutputStructure(callback) {
    fs.mkdir(config.outputAssetsDir, 0777, callback);
  }
  
  function _mkdirOutput(callback) {
    var dir = config.outputDir;
    path.exists(dir, function(exists) {
      exists ? callback() : fs.mkdir(dir, 0777, callback);
    });
  }
  
  function _collectTestFiles(callback) {
    fileutils.getFiles(config.testsDir, config.testFileRegExp, callback);
  }
  
  function _buildTestPages(files, callback) {
    async.map(files, function(file, i, files, callback) {
      testPageBuilder.build(file, config, callback);
    }, null, callback);
  }
  
  function _getTestBuilders() {
    return testPageBuilders;
  }
  
  function _setTestBuilders(builders) {
    testPageBuilders.length = 0;
    testPageBuilders.push.apply(testPageBuilders, builders);
  }
  
  function _createManifest(callback) {
    var files = [];
    _getTestBuilders().forEach(function(builder) {
      files.push.apply(files, builder.getPages());
    });
    fs.writeFile(config.manifest, JSON.stringify(files), 'utf8', callback);
  }
  
  function _cpIndex(callback) {
    var src = path.join(ASSETS_PATH, 'index.html');
    var dest = path.join(config.outputDir, 'index.html');
    fileutils.cp(src, dest, callback);
  }
  
  function _cpAssets(callback) {
    var src = path.join(ASSETS_PATH, 'evidence.js');
    var dest = path.join(config.outputDir, 'evidence.js');
    fileutils.cp(src, dest, callback);
  }
  
  self.build = build;
  return self;
}

exports.build = build;

function build(config, callback) {
  var suite = createSuiteBuilder(config);
  suite.build(function(err) {
    callback(err, suite);
  });
  return suite;
}
