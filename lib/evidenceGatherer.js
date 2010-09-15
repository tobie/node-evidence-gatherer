var path = require('path'),
    fs = require('fs'),
    fileutils = require('./helpers/fileutils');

var VENDOR_PATH = path.normalize(path.join(__dirname, '..', 'vendor'));

require.paths.unshift(VENDOR_PATH);

exports.config = require('./config');
exports.suiteBuilder = require('./builder/suiteBuilder');
exports.testPageBuilder = require('./builder/testPageBuilder');
exports.server = require('./server');
exports.createServer = exports.server.createServer;

