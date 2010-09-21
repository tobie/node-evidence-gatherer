var slice = Array.prototype.slice;

exports.forEach = forEach;
function forEach(array, iterator, context, callback) {
  if (!array.length) {
    process.nextTick(function() {
      callback(null, array);
    });
    return;
  }

  process.nextTick(function() {
    var counter = 0, notified = false;
    
    function wrapper(err) {
      counter--;
      if (!notified && (err || counter === 0)) {
        notified = true;
        callback(err);
      }
    }
    
    array.forEach(function(e, i, array) {
      counter++;
      iterator.call(context, e, i, array, wrapper);
    });
  });
}

exports.forEachInQueue = forEachInQueue;
function forEachInQueue(array, iterator, context, callback) {
  process.nextTick(function() {
    var i = -1, length = array.length, notified = false;
    
    function next(err) {
      i++;
      if (!notified && (err || i === length)) {
        notified = true;
        callback(err);
      } else {
        iterator.call(context, array[i], i, array, next);
      }
    }
    
    next();
  });
}

exports.map = map;
function map(array, iterator, context, callback) {
  var results = [];
  
  if (!array.length) {
    process.nextTick(function() {
      callback(null, results);
    });
    return;
  }
  
  process.nextTick(function() {
    var counter = 0, notified = false;
    
    array.forEach(function(e, i, array) {
      counter++;
      iterator.call(context, e, i, array, function(err, result) {
        results[i] = result;
        counter--;
        if (!notified && (err || counter === 0)) {
          notified = true;
          callback(err, results);
        }
      });
    });
  });
}

exports.runParallel = runParallel;
function runParallel(tasks, callback) {
  if (!tasks.length) {
    process.nextTick(callback);
    return;
  }

  process.nextTick(function() {
    var counter = 0, notified = false;

    function wrapper(err) {
      counter--;
      if (!notified && (err || counter === 0)) {
        notified = true;
        callback(err);
      }
    }
    
    tasks.forEach(function(task) {
      counter++;
      task(wrapper);
    });
  });
}

exports.runSerial = runSerial;
function runSerial(tasks, callback) {
  var i = -1, length = tasks.length;
  
  function next(err) {
    i++;
    if (err || i === length) {
      callback(err);
    } else {
      tasks[i](next);
    }
  }
  
  process.nextTick(next);
}

exports.compose = compose;
function compose(tasks, callback) {
  var i = -1, length = tasks.length;
  
  function next(err) {
    i++;
    if (err || i === length) {
      callback.apply(null, arguments);
    } else {
      var args = slice.call(arguments, 1);
      args.push(next);
      tasks[i].apply(null, args);
    }
  }
  
  process.nextTick(next);
}