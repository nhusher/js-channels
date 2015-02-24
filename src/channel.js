
import { FixedBuffer, RingBuffer } from "./buffers.js";

// --------------------------------------------------------------------------

class Handler {
  constructor(handleFn) {
    let doResolve;

    this.active = true;
    this.promise = new Promise(function(resolver) {
      doResolve = resolver;
    });

    this.commit = function() {
      this.active = false;
      return function(val) {
        return handleFn(doResolve, val);
      }
    };
  }
}


// --------------------------------------------------------------------------

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

let dispatch = new Dispatch();

// --------------------------------------------------------------------------

class Channel {
  constructor(sizeOrBuf) {
    this._buffer = (sizeOrBuf instanceof FixedBuffer) ? sizeOrBuf : new FixedBuffer(sizeOrBuf || 0);
    this._takers = new RingBuffer(32);
    this._putters = new RingBuffer(32);

    this._isOpen = true;
  }

  put(val, handler) {
    if(val === null) { throw new Error("Cannot put null to a channel."); }

    handler = handler || new Handler((resolve) => {
      resolve(true);
      return val;
    });

    if(!handler.active) {
      // Somebody has resolved the handler already. That was fast.
      // core.async returns a boolean of whether or not something *could* get put to the channel
      // we'll do the same #cargocult
      return Promise.resolve(!this.open);
    }

    if(!this.open) {
      // The channel is closed, return false, because we can't put to it.

      return Promise.resolve(false);
    } else if(!this._buffer.full) {
      // The channel has some free space. Stick it in the buffer and then drain any waiting takes.

      handler.commit()(val);
      this._buffer.add(val);

      while(this._takers.length && this._buffer.length) {
        let taker = this._takers.pop();

        if(taker.active) {
          let val = this._buffer.remove();
          taker = taker.commit();

          dispatch.run(() => taker(val))
        }
      }
    } else if(this._takers.length) {
      // The buffer is full but there are waiting takers (e.g. the buffer is size zero)

      let taker = this._takers.pop();

      while(this._takers.length && !taker.active) {
        taker = this._takers.pop();
      }

      if(taker && taker.active) {
        handler.commit()(val);
        taker = taker.commit();

        dispatch.run(() => taker(val));
      } else {
        this._putters.resizingUnshift(handler);
      }
    } else {
      this._putters.resizingUnshift(handler);
    }

    return handler.promise;
  }

  take(handler) {
    handler = handler || new Handler((resolve, val) => {
      resolve(val);
      return;
    });

    if(!handler.active) {
      return Promise.resolve(undefined); // TODO: this seems like an inappropriate value to resolve to
    }

    if(this._buffer.length) {
      let bufVal = this._buffer.remove();

      while(!this._buffer.full && this._putters.length) {
        let putter = this._putters.pop();

        if(putter.active) {
          putter = putter.commit();

          dispatch.run(() => this._buffer.add(putter()));
        }
      }

      handler.commit()(bufVal);
    } else if(this._putters.length) {
      let putter = this._putters.pop();

      while(this._putters.length && !putter.active) {
        putter = this._putters.pop();
      }

      if(putter && putter.active) {
        let handlerCb = handler.commit();
        putter = putter.commit();

        dispatch.run(() => handlerCb(putter()))
      } else {
        this._takers.resizingUnshift(handler);
      }
    } else {
      this._takers.resizingUnshift(handler);
    }

    return handler.promise;
  }

  then(fn, err) {
    return this.take().then(fn, err);
  }

  close() {
    this._isOpen = false;

    while (this._takers.length) {
      let taker = this._takers.pop();

      if(taker.active) {
        taker.commit()(null);
      }
    }
  }

  get open() {
    return this._isOpen;
  }
}


export { Channel, Handler };