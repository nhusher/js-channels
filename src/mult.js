import { _Promise as Promise } from "./promises.js";

function distribute(taps, val) {
  if(!taps.length) {
    return Promise.resolve();
  } else {
    let [ tap, ...rest ] = taps;

    return tap.put(val).then(() => {
      return distribute(rest, val);
    });
  }
}

export class Mult {

  constructor(ch) {
    this._taps = [];
    this._free = Promise.resolve();

    ch.take().then(function drainLoop(v) {
      if(v === null) {
        // cleanup
        return;
      }

      // Locks the list of taps until the distribution is complete
      let doFree, free = new Promise(r => doFree = r);

      this._free = free;

      distribute(taps, v).then(() => {
        doFree();
        ch.take().then(drainLoop);
      });
    }.bind(this));
  }

  tap(ch, close) {
    if(this._taps.some(t => t.ch === ch)) {
      throw new Error("Can't add the same channel to a mult twice");
    }

    return this._free.then(() => {
      this._taps.push({ close: close, ch: ch });
      return ch;
    });
  }

  untap(ch) {
    return this._free.then(() => {
      this._taps = this._taps.filter(tap => {
        return tap.ch !== ch;
      });
      return ch;
    });
  }

}