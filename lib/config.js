var fs = require('fs'),
    path = require('path'),
    fileutils = require('./helpers/fileutils');
    
function createConfig(options) {
  
  var self = {}, _o = {}, _keys, props = {
    templates: {
      get: function() {
        _o.templates = _o.templates || ['html5', 'html401strict'];
        return _o.templates;
      }
    },
    
    templatesDir: {
      get: function() {
        _o.templatesDir = _o.templatesDir || path.join(_o.inputDir, 'templates');
        return _o.templatesDir;
      }
    },
    
    templateExtension: {
      get: function() {
        _o.templateExtension = _o.templateExtension || '.mustache';
        return _o.templateExtension;
      }
    },
    
    userAgents: {
      get: function() {
        _o.userAgents = _o.userAgents || {};
        return _o.userAgents;
      }
    },
    
    port: {
      get: function() {
        _o.port = _o.port || 4001;
        return _o.port;
      }
    },
    
    root: {
      get: function() {
        return _o.root;
      }
    },
    
    inputDir: {
      get: function() {
        _o.inputDir = _o.inputDir || __dirname;
        return _o.inputDir;
      }
    },
    
    outputDir: {
      get: function() {
        _o.outputDir = _o.outputDir || path.join(_o.inputDir, 'output');
        return _o.outputDir;
      }
    },
    
    testPagesOutputDir: {
      get: function() {
        _o.testPagesOutputDir = _o.testPagesOutputDir || path.join(self.outputDir, 'test_pages');
        return _o.testPagesOutputDir;
      }
    },
    
    outputAssetsDir: {
      get: function() {
        _o.outputAssetsDir = _o.outputAssetsDir || path.join(self.outputDir, 'assets');
        return _o.outputAssetsDir;
      }
    },
    
    manifest: {
      get: function() {
        _o.manifest = _o.manifest || path.join(self.outputDir, 'manifest.js');
        return _o.manifest;
      }
    },
    
    resultsHandler: {
      get: function() {
        _o.resultsHandler = _o.resultsHandler || require('./resultsHandler/console').handleResults;
        return _o.resultsHandler;
      },
      
      set: function(handler) {
        
        var initValue = handler;
        
        if (typeof handler === 'function') {
          _o.resultsHandler = handler
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
          throw new Error('Invalid result handler "' + initValue + '".')
        }
      }
    }
  };
  
  function merge(options) {
    options = options || {};
    for (var option in options) {
      if (_keys.indexOf(option) < 0) {
        throw new Error('Unknown option: ' + option);
      }
      
      var desc = Object.getOwnPropertyDescriptor(self, option);
      if (typeof desc.set === 'function') {
        self[option] = options[option];
      } else {
        _o[option] = options[option];
      }
    }
  }
  
  _keys = Object.keys(props);
  Object.defineProperties(self, props);
  self.merge = merge;
  merge(options);
  return self;
}

function optionsFromDir(dir, callback) {
  optionsFromFile(path.join(dir, 'evidence_gatherer.json'), callback);
}

function optionsFromEnv(callback) {
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
  var config = createConfig(options);
  optionsFromEnv(function(err, options) {
    if (err) {
      callback(err);
      return;
    }
    config.merge(options);
    optionsFromDir(config.inputDir, function(err, options) {
      if (err) {
        callback(err);
        return;
      }
      config.merge(options);
      callback(null, config);
    });
  });
};
