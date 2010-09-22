var fs = require('fs'),
    path = require('path'),
    fileutils = require('./helpers/fileutils');
    
var JSON_EXPORTS = ["port", "outputDir", "testsDir", "fixturesDir",
                    "templatesDir", "templateExtension", "testFilePattern",
                    "canonicalNameReplacement", "testFileReplacement",
                    "fixtureContentTypes", "resultsHandler"];

var DEFAULT_TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

var DEFAULTS = {
  port: 4001,
  rootDir: process.cwd(),
  outputDir: './output',
  testsDir: './tests',
  fixturesDir: './fixtures',
  templatesDir: null,
  templates: ['html5'],
  templateExtension: '.mustache',
  testFilePattern: '(.*?)_test\\.js$',
  canonicalNameReplacement: '$1',
  testFileReplacement: '$1_test.js',
  fixtureContentTypes: ['html', 'css', 'js'],
  resultsHandler: 'console'
};

function createConfig(options) {
  // All paths are stored as relative paths except rootDir which
  // is stored as a full path (defaults to current working dir).
  // Querying config props always returns a full path.
  
  var self = {}, _o = {}, _keys, props;
  
  function _proxy(key) {
    return {
      get: function() {
        return _o[key];
      },
      
      set: function(value) {
        return _o[key] = value;
      }
    };
  }
  
  function _fullPathGetter(key) {
    return function() {
      var p = _o[key];
      return p ? path.join(self.rootDir, p) : null;
    };
  }
  
  function _relPathSetter(key) {
    return function(p) {
      if (!p) { return p; }
      return _o[key] = fileutils.isAbsolute(p) ? fileutils.relativePath(self.rootDir, p) : p;
    };
  }
  
  props = {
    userAgents: _proxy('userAgents'),
    port: _proxy('port'),
    
    rootDir: {
      get: function() {
        return _o.rootDir;
      },
      
      set: function(p) {
        _o.rootDir = fileutils.expandPath(p);
      }
    },
    
    testsDir: {
      get: _fullPathGetter('testsDir'),
      set: _relPathSetter('testsDir')
    },
    
    fixturesDir: {
      get: _fullPathGetter('fixturesDir'),
      set: _relPathSetter('fixturesDir')
    },
    
    templatesDir: {
      get: function() {
        var dir = _o.templatesDir;
        return dir ? path.join(self.rootDir, dir) : DEFAULT_TEMPLATES_DIR;
      },
      set: _relPathSetter('templatesDir')
    },
    
    outputDir: {
      get: _fullPathGetter('outputDir'),
      set: _relPathSetter('outputDir')
    },
    
    outputAssetsDir: {
      get: function() {
        return path.join(self.outputDir, 'assets');
      }
    },
    
    manifest: {
      get: function() {
        return path.join(self.outputDir, 'manifest.js');
      }
    },
    
    fixtureContentTypes: _proxy('fixtureContentTypes'),
    testFilePattern: _proxy('testFilePattern'),
    canonicalNameReplacement: _proxy('canonicalNameReplacement'),
    testFileReplacement: _proxy('testFileReplacement'),
    testFileRegExp: {
      get: function() {
        _o.testFileRegExp = _o.testFileRegExp || new RegExp(self.testFilePattern);
        return _o.testFileRegExp;
      }
    },
    
    templateExtension: _proxy('templateExtension'),
    templates: {
      get: function() {
        return _o.templates;
      },
      
      set: function(templates) {
        if (!templates) { return templates; }
        if (Object.prototype.toString.call(templates) !== '[object Array]') {
          templates = [templates];
        }
        var ext = self.templateExtension;
        return _o.templates = templates.map(function(t) {
          return path.extname(t) === ext ? t.replace(ext, '') : t;
        });
      }
    },
    
    resultsHandler: {
      get: function() {
        return _o.resultsHandler;
      },
      
      set: function(handler) {
        
        var initValue = handler;
        
        if (typeof handler === 'function') {
          _o.resultsHandler = handler;
          return;
        }
        
        // If it's a string, then it must be a reference to a module.
        // Require the module's exports.
        if (typeof handler === 'string') {
          try {
            // First, try loading the module from the resultHandler directory.
            handler = require('./resultsHandler/' + initValue);
          } catch(e) {
            try {
              // Might be an absolute path.
              handler = require(initValue);
            } catch (e) {
              throw new Error('Cannot find module "' + initValue + '".');
            }
          }
        }
        
        // If it's an object, it must have a handleResults method.
        if (typeof handler === 'object') {
          if (typeof handler.handleResults === 'function') {
            _o.resultsHandler = function() {
              return handler.handleResults.apply(handler, arguments);
            };
          } else {
            throw new Error('Cannot find "handleResults" method in "' + initValue + '".');
          }
        } else {
          throw new Error('Invalid result handler "' + initValue + '".');
        }
      }
    }
  };
  
  self.handleResults = handleResults;
  function handleResults(options) {
  }
  
  self.getTemplatePath = getTemplatePath;
  function getTemplatePath(template) {
    return path.join(self.templatesDir, template + self.templateExtension);
  }
  
  self.merge = merge;
  function merge(options) {
    options = options || {};
    for (var option in options) {
      if (_keys.indexOf(option) < 0) {
        throw new Error('Unknown option: ' + option);
      }
      
      self[option] = options[option];
    }
  }
  
  self.toJSON = toJSON;
  function toJSON() {
    return JSON_EXPORTS.reduce(function(output, prop) {
      output[prop] =  _o[prop];
      return output;
    }, {});
  }
  
  _keys = Object.keys(props);
  Object.defineProperties(self, props);
  merge(DEFAULTS);
  merge(options);
  return self;
}

function optionsFromDir(dir, callback) {
  optionsFromFile(path.join(dir, 'evidence_gatherer.json'), callback);
}

function optionsFromUser(callback) {
  var f = path.join(process.env['HOME'], '.evidence_gatherer', 'options.json');
  optionsFromFile(f, callback);
}

function optionsFromFile(f, callback) {
  path.exists(f, function(exist) {
    if (exist) {
      fileutils.parseJSONFile(f, callback);
    } else {
      callback(null, {});
    }
  });
}

exports.createConfig = function (options, callback) {
  var config = createConfig();
  optionsFromUser(function(err, userOptions) {
    if (err) {
      callback(err);
      return;
    }

    config.merge(userOptions);
    optionsFromDir(config.rootDir, function(err, dirOptions) {
      if (err) {
        callback(err);
        return;
      }
      config.merge(dirOptions);
      config.merge(options);
      callback(null, config);
    });
  });
};
