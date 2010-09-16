exports.handleResults = handleResults;
function handleResults(r) {
  var args = [];
  args.push(r.isSuccess() ? '✔' : '✘');
  args.push(_displayTime(new Date));
  args.push('-');
  args.push(r.userAgent + ':');
  args.push(r);
  console.log(args.join(' '));
}

function _pad(n) {
  return (n > 9 ? '' : '0') + n;
}
      
function _displayTime(t) {
  return [t.getHours(), t.getMinutes(), t.getSeconds()].map(_pad).join(':');
}