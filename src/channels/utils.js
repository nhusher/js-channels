import { Channel, Transactor } from "./channel.js";


class AltsTransactor extends Transactor {
  constructor(offer, commitCb) {
    super(offer);
    this.commitCb = commitCb;
  }
  commit() {
    this.commitCb();
    return super.commit();
  }
}


export function alts(race) {
  let transactors = [];
  let outCh = new Channel();

  let deactivate = () => { transactors.forEach(h => h.active = false) }

  race.map(cmd => {

    if(Array.isArray(cmd)) {
      let tx = new AltsTransactor(val, () => {
        transactors.forEach(h => h.active = false);
      });
      let [ ch, val ] = cmd;
      ch.put(val, tx).then(function() {
        outCh.put([ val, ch ]);
      });

      transactors.push(tx);
    } else {
      let tx = new AltsTransactor(true, () => {
        transactors.forEach(h => h.active = false);
      });

      cmd.take(tx).then(function(val) {
        outCh.put([ val, cmd ]);
      });

      transactors.push(tx);
    }
  });

  return outCh;
}

export function timeout(ms) {
  var ch = new Channel();
  setTimeout(() => { ch.close(); }, ms);
  return ch;
}

export function pipe(inCh, outCh, close = true) {
  inCh.take().then(function pipe(v) {
    if(v !== null) {
      outCh.put(v).then(() => inCh.take().then(pipe));
    } else if(close) {
      outCh.close();
    }
  });
}

export function intoArray(ch) {
  var ret = [];
  return ch.take().then(function drain(v) {
    if(v === null) {
      return ret;
    } else {
      ret.push(v);
      return ch.take().then(drain);
    }
  });
}

// Enforces order resolution on resulting channel
// This might need to be the default behavior, though that requires more thought
export function order(inch, sizeOrBuf) {
  var outch = new Channel(sizeOrBuf);

  function drain() {
    inch.take().then(val => {
      if(val === null) {
        outch.close();
      } else {
        outch.put(val).then(drain);
      }
    });
  }
  drain();

  return outch;
}