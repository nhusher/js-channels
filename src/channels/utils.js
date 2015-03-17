import { Channel, Transactor } from "./channels.js";


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

export function map(fn) {
  return function(next) {
    return function(val) {
      if(arguments.length) {
        return next(fn(val));
      } else {
        return next();
      }
    }
  }
}

export function filter(fn) {
  return function(next) {
    return function(val) {
      if(arguments.length) {
        if (fn(val)) {
          return next(val);
        }
      } else {
        return next();
      }
    }
  }
}

export function partitionBy(fn) {
  let last = null,
      accumulator = [];

  return function(next) {
    return function(val) {
      if(arguments.length) {
        let predicateResult = fn(val);
        if(last !== null && predicateResult !== last) {
          let tmp = accumulator;

          accumulator = [ val ];
          last = predicateResult;

          return next(tmp);
        } else {
          last = predicateResult;
          accumulator.push(val);
        }
      } else {
        return next(accumulator);
      }
    }
  }
}

export function partition(num) {
  let c = 0,
      a = [];

  return function(next) {
    return function(val) {
      if(arguments.length) {
        a.push(val);
        c += 1;

        if(c % num === 0) {
          let tmp = a;

          a = [];

          return next(tmp);
        }
      } else {
        return next(a);
      }
    }
  }
}