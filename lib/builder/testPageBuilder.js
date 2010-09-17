var fs = require('fs'),
    path = require('path'),
    async = require('../helpers/async'),
    fileutils = require('../helpers/fileutils'),
    template = require('../template');

exports.createTestPage = createTestPage;

function createTestPage(file, config) {
  var self = {}, view, EXT = '.html',
      outputRoot = config.outputDir,
      relativePath = path.dirname(fileutils.relativePath(config.inputDir, file)),
      canonicalName = path.basename(file).replace(config.testFilePattern, config.testFileReplacement),
      outputDir = path.join(outputRoot, relativePath, canonicalName),
      fixturesDir = path.join(outputDir, 'fixtures');
  
  if (canonicalName === 'fixtures') {
    var msg = '"fixtures_test.js" cannot be used as the name of a testfile, ';
    msg += 'because "fixtures" is a reserved keyword.';
    throw new Error(msg);
  }
  
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
    var templatesDir = config.templatesDir,
        templateExt = config.templateExtension;
    async.forEach(config.templates, function(templateName, i, _, cb) {
      var input = path.join(templatesDir, templateName + templateExt);
      var output = path.join(outputDir, templateName + EXT);
      template.renderToFile(input, output, _getView(templateName), cb);
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

