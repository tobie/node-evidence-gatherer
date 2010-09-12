var fs = require('fs'),
    path = require('path'),
    async = require('../helpers/async'),
    fn = require('../helpers/fn'),
    fileutils = require('../helpers/fileutils'),
    testPageBuilder = require('./testPageBuilder');

exports.createSuiteBuilder = createSuiteBuilder;

function createSuiteBuilder(config) {
  var self = {}, testFiles, testPageBuilders = [];
  
  self.build = build;
  function build(callback) {
     async.runSerial([
      _rmdirOutput,
      _mkdirOutput,
      _mkdirsOutputStructure,
      _collectTestFiles,
      _buildTestPages,
      function(builders, callback) {
        _setTestBuilders(builders);
        callback(null);
      },
      _createManifest
    ], function(err) { callback(err, self); });
  }
  
  function _rmdirOutput(callback) {
    fileutils.rmrfdir(config.outputDir, callback);
  }
  
  function _mkdirsOutputStructure(callback) {
    fileutils.mkdirs([
      config.testPagesOutputDir,
      config.outputAssetsDir
    ], 0777, function(err) {
      callback(err);
    });
  }
  
  function _mkdirOutput(callback) {
    path.exists(config.outputDir, function(exists) {
      if (exists ) {
        process.nextTick(callback);
      } else {
        fs.mkdir(config.outputDir, 0777, callback);
      }
    });
  }
  
  function _collectTestFiles(callback) {
    fileutils.getFiles(config.inputDir, /_test\.js/, callback);
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
  
  self.build = build;
  return self;
}

exports.build = build;

function build(config, callback) {
  var suite = createSuiteBuilder(config);
  suite.build(function() {
    callback(null, suite);
  });
  return suite;
}
