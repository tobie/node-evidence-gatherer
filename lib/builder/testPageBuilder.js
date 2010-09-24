var fs = require('fs'),
    path = require('path'),
    async = require('../helpers/async'),
    fileutils = require('../helpers/fileutils'),
    template = require('../template');

exports.createTestPage = createTestPage;
function createTestPage(file, config) {
  var self = {},
      view,
      jsDependencies = [],
      cssDependencies = [],
      htmlDependencies = [],
      relativePath = path.dirname(fileutils.relativePath(config.testsDir, file)),
      basename = path.basename(file),
      name = basename.replace(config.testFileRegExp, config.testNameReplacement),
      testDir = path.join(config.outputDir, relativePath, name),
      relativePathToOutputDir = fileutils.relativePath(testDir, config.outputDir),
      fixturesDir = path.join(config.fixturesDir, relativePath, name);

  if (name === 'fixtures') {
    var msg = '"' + basename + '" cannot be used as the name of a testfile, ';
    msg += 'because "fixtures" is a reserved keyword.';
    throw new Error(msg);
  }
  
  self.jsDependencies = jsDependencies;
  self.cssDependencies = cssDependencies;
  self.htmlDependencies = htmlDependencies;
  self.name = name;
  self.fixturesDir = fixturesDir;
  
  self.build = build;
  function build(callback) {
    jsDependencies.length = 0;
    cssDependencies.length = 0;
    htmlDependencies.length = 0;
    jsDependencies.push(path.join(relativePathToOutputDir, 'evidence.js'))
    async.runSerial([
      _mkdirOutput,
      _handleFixtures,
      _cpTestFile,
      _renderTemplates,
      //_cpFiles
    ], function(err) {
      callback(err, self);
    });
  }
  
  function _mkdirOutput(callback) {
    fileutils.mkdirp(testDir, 0777, callback);
  }
  
  function _handleFixtures(callback) {
    async.forEach(['js', 'css', 'html'], function(type, i, _, cb) {
      var filename = 'fixtures.' + type,
          src = path.join(fixturesDir, filename),
          dest = path.join(testDir, filename);
      
      path.exists(src, function(exists) {
        if (!exists) {
          cb(null);
          return;
        }
        
        if (type === 'html') {
          fs.readFile(src, 'utf8', function(err, str) {
            if (err) {
              cb(err);
            } else {
              htmlDependencies.push(str);
              cb(null);
            }
          });
        } else {
          self[type + 'Dependencies'].push(filename);
          fileutils.cp(src, dest, cb);
        }
      });
    }, null, callback);
  }
  
  function _renderTemplates(callback) {
    async.forEach(config.templates, function(name, i, _, cb) {
      var output = path.join(testDir, name + '.html'),
          input = config.getTemplatePath(name);
      template.renderToFile(input, output, _getView(name), cb);
    }, null, callback);
  }
  
  function _cpTestFile(callback) {
    var filename = 'test.js';
    jsDependencies.push(filename);
    fileutils.cp(file, path.join(testDir, filename), callback);
  }
  
  function _getView(templateName) {
    view = view || createView(self);
    var currentView = Object.create(view);
    currentView.title += templateName;
    return currentView;
  }

  self.getPages = getPages;
  function getPages() {
    return config.templates.map(function(templateName) {
      return path.join('/', relativePath, name, templateName + '.html');
    });
  }
  
  return self;
}

exports.build = build;
function build(file, config, callback) {
  createTestPage(file, config).build(callback);
}

function createView(testCase) {
  return {
    title: 'test: ' + testCase.name + ' | template: ',
    js: testCase.jsDependencies.map(_toScriptTag).join('\n'),
    css: testCase.cssDependencies.map(_toLinkTag).join('\n'),
    html: testCase.htmlDependencies.join('\n')
  };
}

function _toScriptTag(filename) {
  return '<script src="' + filename + '"></script>';
}

function _toLinkTag(filename) {
  return '<link rel="stylesheet" href="' + filename + '">';
}

