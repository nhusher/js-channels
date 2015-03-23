
import { FixedBuffer, RingBuffer } from "./buffers.js";
import { Dispatch } from "./dispatch.js";
import { Promise } from "./promise.js";
import { transducers } from "./transducers.js";

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
    };
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

class Channel {
  constructor(sizeOrBuf, xform) {
    if(!transducers && xform) {
      console.info("Using a transducer requires transducers-js <https://github.com/cognitect-labs/transducers-js>");
    }
    if(!sizeOrBuf && xform && transducers) {
      console.info("Transducers will be ignored for unbuffered channels.");
    }

    // Adds value to the buffer:
    // doAdd() => Buffer
    // doAdd(val) => Buffer
    let doAdd = (buf, val) => buf.add(val);

    this._buffer    = (sizeOrBuf instanceof FixedBuffer) ? sizeOrBuf : new FixedBuffer(sizeOrBuf || 0);
    this._takers    = new RingBuffer(32);
    this._putters   = new RingBuffer(32);
    this._xformer   = xform && transducers ? xform(transducers.wrap(doAdd)) : doAdd;

    this._isOpen = true;
  }

  _insert(val) {
    if(transducers) {
      if(val) {
        return this._xformer.step(this._buffer, val);
      } else {
        return this._xformer.result(this._buffer);
      }
    } else if(val) {
      this._xformer(this._buffer, val);
    }
    return false;
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

      let done = transducers ? transducers.reduced(this._insert(val)) : this._insert(val);

      while(this._takers.length && this._buffer.length) {
        let takerTx = this._takers.pop();

        if(takerTx.active) {
          let v = this._buffer.remove();
          let takerCb = takerTx.commit();

          dispatch.run(() => takerCb(v));
        }
      }
      if(done) {
        this.close();
      }

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
          this._insert(val);
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
        this._insert();

        let txCb = tx.commit();

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
        this._insert();
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

  get open() {
    return this._isOpen;
  }
}

export { Channel, Transactor };