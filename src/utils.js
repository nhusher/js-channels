import { Channel, Handler } from "./channel.js";
import { _Promise as Promise } from "./promises.js";

export function alts(race) {
  let handlers = [];
  let outCh = new Channel();

  race.map(function(cmd) {
    if(Array.isArray(cmd)) {
      let [ ch, val ] = cmd;
      let handler = new Handler((resolve, val) => {
        resolve([ ch, true ]);
        handlers.forEach(h => h.commit());
        return val;
      });

      handlers.push(handler);
      ch.put(val, handler);
    } else {
      let handler = new Handler((resolve, val) => {
        resolve([ cmd, val ]);
        handlers.forEach(h => h.commit());
      });

      handlers.push(handler);
      cmd.take(handler);
    }
  });

  outCh.put(Promise.race(handlers.map((h) => h.promise)));

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