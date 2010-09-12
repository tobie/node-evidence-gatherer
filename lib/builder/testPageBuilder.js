var fs = require('fs'),
    path = require('path'),
    async = require('../helpers/async'),
    fileutils = require('../helpers/fileutils'),
    template = require('./template');

exports.createTestPage = createTestPage;

function createTestPage(file, config) {
  var self = {}, view, EXT = '.html',
      outputRoot = config.testPagesOutputDir,
      relativePath = path.dirname(fileutils.relativePath(config.inputDir, file)),
      canonicalName = path.basename(file, '.js').replace(/_test$/, ''),
      outputDir = path.join(outputRoot, relativePath, canonicalName),
      fixturesDir = path.join(outputDir, 'fixtures');
  
  if (canonicalName === 'fixtures') {
    var msg = '"fixtures_test.js" cannot be used as the name of a testfile, ';
    msg += 'because "fixtures" is a reserved keyword.';
    throw new Error(msg);
  }
  
  template.templateRoot = config.templatesDir;
  
  self.build = build;
  function build(callback) {
    async.runSerial([
      _mkdirOutput,
      _mkdirFixtures,
      _renderTemplates,
      _cpTestFile
    ], function(err) {
      callback(err, self);
    });
  }
  
  function _mkdirOutput(callback) {
    fileutils.mkdirp(outputDir, 0777, callback);
  }
  
  function _mkdirFixtures(callback) {
    fileutils.mkdirp(fixturesDir, 0777, callback);
  }
  
  function _renderTemplates(callback) {
    async.forEach(config.templates, function(t, i, _, cb) {
      var output = path.join(outputDir, t + EXT);
      template.render(t, output, _getView(t), cb);
    }, null, callback);
  }
  
  function _cpTestFile(callback) {
    fileutils.cp(file, path.join(outputDir, 'test.js'), callback);
  }
  
  function _getView(templateName) {
    // lazy loading.
    view = view ||  {
      html: 'foo bar',
      title: 'test: ' + canonicalName + ' | template: '
    };
    var currentView = Object.create(view);
    currentView.title += templateName;
    return currentView;
  }

  self.getPages = getPages;
  function getPages() {
    return config.templates.map(function(name) {
      return path.join('/', relativePath, canonicalName, name + EXT);
    });
  }
  
  return self;
}

exports.build = build;

function build(file, config, callback) {
  createTestPage(file, config).build(callback);
}

