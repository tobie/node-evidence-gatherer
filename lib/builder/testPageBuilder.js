var fs = require('fs'),
    path = require('path'),
    async = require('../helpers/async'),
    fileutils = require('../helpers/fileutils'),
    template = require('../template');

exports.createTestPage = createTestPage;

function createTestPage(file, config) {
  var self = {},
      view,
      relativePath = path.dirname(fileutils.relativePath(config.testsDir, file)),
      basename = path.basename(file),
      canonicalName = basename.replace(config.testFileRegExp, config.canonicalNameReplacement),
      testDir = path.join(config.outputDir, relativePath, canonicalName),
      relativePathToOutputDir = fileutils.relativePath(testDir, config.outputDir),
      fixturesDir = path.join(config.fixturesDir, relativePath);
  
  if (canonicalName === 'fixtures') {
    var msg = '"' + basename + '" cannot be used as the name of a testfile, ';
    msg += 'because "fixtures" is a reserved keyword.';
    throw new Error(msg);
  }
  
  self.build = build;
  function build(callback) {
    async.compose([
      _mkdirOutput,
      _renderTemplates,
    ], function(err) {
      callback(err, self);
    });
  }
  
  function _mkdirOutput(callback) {
    fileutils.mkdirp(testDir, 0777, callback);
  }
  
  function _renderTemplates(callback) {
    async.forEach(config.templates, function(name, i, _, cb) {
      var output = path.join(testDir, name + '.html'),
          input = config.getTemplatePath(name);
      template.renderToFile(input, output, _getView(name), cb);
    }, null, callback);
  }
  
  function _cpTestFile(callback) {
    fileutils.cp(file, path.join(testDir, 'test.js'), callback);
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
      return path.join('/', relativePath, canonicalName, name + '.html');
    });
  }
  
  return self;
}

exports.build = build;

function build(file, config, callback) {
  createTestPage(file, config).build(callback);
}

