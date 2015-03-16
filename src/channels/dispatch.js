let defaultAsynchronizer = (typeof setImmediate === 'function') ? function(fn) {
  return setImmediate(fn);
} : function(fn) {
  return setTimeout(fn);
};

class Dispatch {
  constructor(asynchronizer) {
    this._asynchronizer = asynchronizer || defaultAsynchronizer;
    this._queue = [];
  }

  run(fn) {
    this._queue.push(fn);

    this._asynchronizer(() => {
      while(this._queue.length) {
        this._queue.shift()();
      }
    });
  }
}


export { Dispatch };