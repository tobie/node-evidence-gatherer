var mu = require('mu'),
    fs = require('fs'),
    options = {};
    
exports.render = function(input, output, context, callback) {
  mu.render(input, context, options, function (err, stream) {
    if (err) {
      callback(err);
      return;
    }

    var buffer = '';

    stream.addListener('data', function (chunk) {
      buffer += chunk;
    });

    stream.addListener('end', function () {
      fs.writeFile(output, buffer, callback);
    });
  });
}

Object.defineProperties(exports, {
  templateExtension: {
    get: function() {
      return mu.templateExtension;
    },
    
    set: function(value) {
      return mu.templateExtension = value;
    }
  },
  
  templateRoot: {
    get: function() {
      return mu.templateRoot;
    },
    
    set: function(value) {
      return mu.templateRoot = value;
    }
  }
});

exports.templateExtension = 'mustache';
