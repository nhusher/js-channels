
import { FixedBuffer, RingBuffer } from "./buffers.js";
import { Dispatch } from "./dispatch.js";

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

class Channel {
  constructor(sizeOrBuf) {
    this._buffer = (sizeOrBuf instanceof FixedBuffer) ? sizeOrBuf : new FixedBuffer(sizeOrBuf || 0);
    this._takers = new RingBuffer(32);
    this._putters = new RingBuffer(32);

    this._isOpen = true;
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
      this._buffer.add(val);

      while(this._takers.length && this._buffer.length) {
        let takerTx = this._takers.pop();

        if(takerTx.active) {
          let val = this._buffer.remove();
          let takerCb = takerTx.commit();

          dispatch.run(() => takerCb(val));
        }
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
        let takeCb = takerTx.commit();

        dispatch.run(() => takeCb(val));
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
        let putter = this.putters.pop();

        if(putter.active) {
          let putTx = putter.commit();

          dispatch.run(() => this._buffer.add(putTx()));
        }
      }

      tx.commit()(bufVal);
    } else if(this._putters.length) {
      let putterTx = this._putters.pop();

      while(this._putters.length && !putterTx.active) {
        putterTx = this._putters.pop();
      }

      if(putterTx && putterTx.active) {
        let txCb = tx.commit();
        let putterCb = putterTx.commit();

        dispatch.run(() => txCb(putterCb()));
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


export { Channel, Transactor };