var mu = require('mustache'),
    fs = require('fs');
    
exports.render = render;
function render(template, options) {
  return mu.to_html(template, options.locals);
}

exports.renderToFile = renderToFile;
function renderToFile(input, output, view, callback) {
  fs.readFile(input, 'utf8', function(err, template) {
    if (err) {
      callback(err);
      return;
    }
    var str;
    try {
      str = mu.to_html(template, view);
    } catch(err) {
      callback(err);
      return;
    }
    fs.writeFile(output, str, callback);
  });
};