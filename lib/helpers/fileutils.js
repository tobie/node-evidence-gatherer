var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    async = require('./async');

exports.getFiles = getFiles;
function getFiles(dir, condition, callback) {
  var accumulator = [];
  
  function visit(dir, callback) {
    fs.stat(dir, function(e, stat) {
      if (e) { return callback(e); }
      if ((condition && condition.test(dir)) || !condition) {
        accumulator.push(dir);
      }
      
      if (stat.isDirectory()) {
        fs.readdir(dir, function(e, files) {
          if (e) { return callback(e); }
          async.forEach(files, function(file, i, files, cb) {
            visit(path.join(dir, file), cb);
          }, null, callback);
        });
      } else {
        callback();
      }
    });
  }
  
  visit(dir, function(e) {
    callback(e, accumulator);
  });
}

exports.rmrfdir = rmrfdir;
function rmrfdir(dir, callback) {
  fs.stat(dir, function(e, stat) {
    if (e) { return callback(e); }

    if (stat.isDirectory()) {
      fs.readdir(dir, function(e, files) {
        if (e) { return callback(e); }
        async.forEach(files, function(file, i, files, cb) {
          rmrfdir(path.join(dir, file), cb);
        }, null, function() {
          fs.rmdir(dir, callback);
        });
      });
    } else {
      fs.unlink(dir, callback);
    }
  });
}

exports.mkdirs = mkdirs;
function mkdirs(dirs, mode, callback) {
  async.forEach(dirs, function(path, i, files, cb) {
    fs.mkdir(path, mode, cb);
  }, null, callback);
}

exports.mkdirp = mkdirp;
function mkdirp(dir, mode, callback) {
  fs.mkdir(dir, mode, function(err) {
    if (!err || err.errno === process.EISDIR || err.errno === process.EEXIST) {
      callback();
      return;
    }

    var queue = [];
    while(queue[queue.length - 1] !== dir) {
      queue.push(dir);
      dir = path.dirname(dir);
    }
    
    queue.reverse();
    async.forEachInQueue(queue, function(dir, i, dirs, next) {
      fs.mkdir(dir, mode, function(err) {
        if (err && err.errno !== process.EISDIR && err.errno !== process.EEXIST) {
          next(err);
        } else {
          next();
        }
      });
    }, null, callback);
    
  });
}

exports.parseJSONFile = parseJSONFile;
function parseJSONFile(file, callback) {
  fs.readFile(file, 'utf8', function(err, str) {
    if (err) {
      callback(err);
    } else {
      try {
        callback(null, JSON.parse(str));
      } catch(err) {
        callback(err);
      }
    }
  });
}

exports.relativePath = relativePath;
function relativePath(base, dest) {
  base = _pathToArray(base);
  dest = _pathToArray(dest);

  var baseLength = base.length,
      destLength = dest.length,
      length = Math.max(baseLength, destLength),
      result = [],
      diverged = false,
      basename;
  
  if (dest[0] !== base[0]) {
    throw new Error('Cannot compare relative and absolute paths.');
  }
  
  for (var i = 0; i < length; i++) {
    basename = dest[i];
    if (base[i] !== basename || diverged) {
      diverged = true;
      if (i < baseLength) {
        result.unshift('..');
      }
      
      if (i < destLength) {
        result.push(basename);
      }
    }
  }
  return result.length ? path.join.apply(path, result) : '.';
}

function _pathToArray(p) {
  var result = [], dirname;
  p = path.normalize(p);
  while(dirname !== p) {
    result.push(path.basename(p));
    dirname = p;
    p = path.dirname(p);
  }
  return result.reverse();
}

exports.cp = cp;
function cp(src, dest, callback) {
  callback = callback || function() {};
      
  if (path.normalize(src) == path.normalize(dest)) {
    process.nextTick(function() {
      callback(new Error(src + ' is the same file as ' + dest + '.'));
    });
    return;
  }
  
  fs.open(src, 'r', function(err, srcfd) {
    if (err) {
      callback(err);
      return;
    }
    
    fs.fstat(srcfd, function(err, srcstat) {
      if (err) {
        callback(err);
        return;
      }
      
      if (srcstat.isDirectory()) {
        callback(new Error(src + ' is a directory.'));
        return;
      }
      
      fs.open(dest, 'w', function(err, destfd) {
        if (err) {
          callback(err);
          return;
        }
        
        fs.fstat(destfd, function(err, deststat) {
          if (err) {
            callback(err);
            return;
          }
          
          if (deststat.isDirectory()) {
            var destfile = path.join(dest, path.basename(src));
            async.runParallel([
              function(callback) {
                fs.open(destfile, 'w', function(err, destfilefd) {
                  if (err) {
                    callback(err);
                    return;
                  }
                  _sendAndClose(destfilefd, srcfd, srcstat.size, callback);
                });
              },
              function(cb) { fs.close(destfilefd, cb); }
            ], callback);
          } else {
            _sendAndClose(destfd, srcfd, srcstat.size, callback);
          }
        });
        
      });
    });
  });
}

function _sendAndClose(destfd, srcfd, size, callback) {
  fs.sendfile(destfd, srcfd, 0, size, function(err) {
    async.runParallel([
      function(cb) { fs.close(destfd, cb); },
      function(cb) { fs.close(srcfd, cb); }
    ], callback);
  });
}

