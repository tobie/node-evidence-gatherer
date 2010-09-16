var spawnChildProcess = require('child_process').spawn;

function UserAgent(name, cmd) {
  this.name = name;
  this.cmd = cmd;
}

UserAgent.prototype.visit = visit;
function visit(url, callback) {
  var cp;
  if (process.platform === 'darwin') {
    cp = spawnChildProcess('open', ['-g', '-a', this.cmd, url]);
  } else {
    cp = spawnChildProcess(this.cmd, [url]);
  }
  
  if (callback) { cp.on('exit', callback); }
}

exports.createUserAgent = createUserAgent;
function createUserAgent(name, cmd) {
  return new UserAgent(name, cmd);
}
