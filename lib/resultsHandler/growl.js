var growl = require('growl'),
    path = require('path');
    
var IMG_PATH = path.normalize(path.join(__dirname, '..', '..', 'assets', 'images'));

exports.handleResults = handleResults;
function handleResults(results) {
  var options = {
    image: path.join(IMG_PATH, 'gecko.sm.png'),
    name: 'EvidenceGatherer',
    title: 'Test Results for ' + results.userAgent
  };
  
  if (results.isSuccess()) {
    growl.notify('SUCCESS: ' + results, options);
  } else {
    options.sticky = true;
    growl.notify('FAILURE: ' + results, options);
  }
}