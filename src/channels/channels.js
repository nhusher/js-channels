
import { FixedBuffer, RingBuffer } from "./buffers.js";
import { Dispatch } from "./dispatch.js";
import { Promise } from "./promise.js";

// --------------------------------------------------------------------------

class Transactor {
  constructor(offer) {
    this.offered = offer;
    this.received = null;
    this.resolved = false;
    this.active = true;
    this.callbacks = [];
  }

  commit() {
    return (val) => {
      if(this.resolved) {
        throw new Error("Tried to resolve transactor twice!");
      }
      this.received = val;
      this.resolved = true;
      this.callbacks.forEach(c => c(val));

      return this.offered;
    }
  }

  deref(callback) {
    if(this.resolved) {
      callback(this.received);
    } else {
      this.callbacks.push(callback);
    }
  }
}


// --------------------------------------------------------------------------

let dispatch = new Dispatch();

let attempt = function(fn, exh) { try { return fn() } catch(e) { return exh(e); } }
let passthrough = function(next) {
  return function(value) {
    return arguments.length ? next(value) : next();
  }
};
let defaultExHandler = function(e) { console.error(e); return false; }
let reduced = { reduced: true };

class Channel {
  constructor(sizeOrBuf, xform, exceptionHandler) {
    let doAdd = val => {
      return arguments.length ? this._buffer.add(val) : this._buffer;
    }

    this._buffer    = (sizeOrBuf instanceof FixedBuffer) ? sizeOrBuf : new FixedBuffer(sizeOrBuf || 0);
    this._takers    = new RingBuffer(32);
    this._putters   = new RingBuffer(32);
    this._xformer   = xform ? xform(doAdd) : passthrough(doAdd);
    this._exHandler = exceptionHandler || defaultExHandler;

    this._isOpen = true;
  }

  _insert() {
    return attempt(() => this._xformer.apply(this, arguments), this._exHandler);
  }

  abort() {
    while(this._putters.length) {
      let putter = this._putters.pop();

      if(putter.active) {
        let putterCb = putter.commit();
        dispatch.run(() => putterCb(true));
      }
    }
    this._putters.cleanup(() => false);
  }

  fill(val, tx = new Transactor(val)) {
    if(val === null) { throw new Error("Cannot put null to a channel."); }
    if(!(tx instanceof Transactor)) { throw new Error("Expecting Transactor to be passed to fill"); }
    if(!tx.active) { return tx; }

    if(!this.open) {
      // Either somebody has resolved the handler already (that was fast) or the channel is closed.
      // core.async returns a boolean of whether or not something *could* get put to the channel
      // we'll do the same #cargocult
      tx.commit()(false);
    }

    if(!this._buffer.full) {
      // The channel has some free space. Stick it in the buffer and then drain any waiting takes.
      tx.commit()(true);
      let done = attempt(() => this._insert(val) === reduced, this._exHandler);

      while(this._takers.length && this._buffer.length) {
        let takerTx = this._takers.pop();

        if(takerTx.active) {
          let val = this._buffer.remove();
          let takerCb = takerTx.commit();

          dispatch.run(() => takerCb(val));
        }
      }

      if(done) { this.abort(); }

      return tx;
    } else if(this._takers.length) {
      // The buffer is full but there are waiting takers (e.g. the buffer is size zero)

      let takerTx = this._takers.pop();

      while(this._takers.length && !takerTx.active) {
        takerTx = this._takers.pop();
      }

      if(takerTx && takerTx.active) {
        tx.commit()(true);
        let takerCb = takerTx.commit();

        dispatch.run(() => takerCb(val));
      } else {
        this._putters.resizingUnshift(tx);
      }
    } else {
      this._putters.resizingUnshift(tx);
    }

    return tx;
  }

  put(val, transactor) {
    return new Promise(resolve => {
      this.fill(val, transactor).deref(resolve);
    });
  }

  drain(tx = new Transactor()) {
    if(!(tx instanceof Transactor)) { throw new Error("Expecting Transactor to be passed to drain"); }
    if(!tx.active) { return tx; }

    if(this._buffer.length) {
      let bufVal = this._buffer.remove();

      while(!this._buffer.full && this._putters.length) {
        let putter = this._putters.pop();

        if(putter.active) {
          let putTx = putter.commit(),
              val = putter.offered; // Kinda breaking the rules here

          dispatch.run(() => putTx());
          let done = attempt(() => this._insert(val) === reduced, this._exHandler);

          if(done === reduced) { this.abort(); }
        }
      }

      tx.commit()(bufVal);
    } else if(this._putters.length) {
      let putter = this._putters.pop();

      while(this._putters.length && !putter.active) {
        putter = this._putters.pop();
      }

      if(putter && putter.active) {
        let txCb = tx.commit(),
            putTx = putter.commit(),
            val = putter.offered;

        dispatch.run(() => putTx());
        txCb(val);
      } else if(!this.open) {
        attempt(() => this._insert(), this._exHandler);

        if(this._buffer.length) {
          txCb(this._buffer.remove());
        } else {
          txCb(null);
        }
      } else {
        this._takers.resizingUnshift(tx);
      }
    } else {
      this._takers.resizingUnshift(tx);
    }

    return tx;
  }

  take(transactor) {
    return new Promise(resolve => {
      this.drain(transactor).deref(resolve);
    });
  }

  then(fn, err) {
    return this.take().then(fn, err);
  }

  close() {
    if(this.open) {
      this._isOpen = false;

      if(this._putters.length === 0) {
        attempt(() => this._insert(), this._exHandler);
      }

      while (this._takers.length) {
        let taker = this._takers.pop();

        if(taker.active) {
          let val = this._buffer.length ? this._buffer.remove() : null,
              takerCb = taker.commit();

          dispatch.run(() => takerCb(val));
        }
      }
    }
  }

  into(otherChan, shouldClose) {
    var self = this;

    function into(val) {
      if(val === nil && shouldClose) {
        out.close();
      } else {
        out.put(val).then(open => {
          if(!open && shouldClose) {
            self.close();
          } else {
            self.take().then(mapper);
          }
        });
      }
    }

    this.take().then(into);

    return otherChan;
  }

  get open() {
    return this._isOpen;
  }
}

Channel.reduced = reduced;

export { Channel, Transactor };