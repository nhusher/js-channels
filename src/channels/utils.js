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
  let outCh = new Channel();

  let transactors = race.map(cmd => {
    let tx;

    if(Array.isArray(cmd)) {
      let [ ch, val ] = cmd;

      tx = new AltsTransactor(val, () => {
        transactors.forEach(h => h.active = false);
      });

      ch.fill(val, tx).deref(function() {
        outCh.fill([ val, ch ]).deref(() => outCh.close());
      });

    } else {

      tx = new AltsTransactor(true, () => {
        transactors.forEach(h => h.active = false);
      });

      cmd.drain(tx).deref(function(val) {
        outCh.fill([ val, cmd ]).deref(() => outCh.close());
      });
    }

    return tx;
  });

  return outCh;
}

export function timeout(ms) {
  var ch = new Channel();
  setTimeout(() => { ch.close(); }, ms);
  return ch;
}

export function pipelineAsync(inch, converter, outch, shouldCloseDownstream = false) {
  function take(val) {
    if(val !== null) {
      Promise.resolve(converter(val)).then(function(converted) {
        outch.put(converted).then(function(didPut) {
          if(didPut) {
            inch.take().then(take);
          }
        });
      });
    } else if(shouldCloseDownstream) {
      outch.close();
    }
  }

  inch.take().then(take);
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
