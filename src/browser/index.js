import * as chans from "../channels/index.js";

window.CHANS = {
  Channel: chans.Channel,
  Transactor: chans.Transactor,
  DroppingBuffer: chans.DroppingBuffer,
  SlidingBuffer: chans.SlidingBuffer,
  RingBuffer: chans.RingBuffer,
  Mult: chans.Mult,
  alts: chans.alts,
  timeout: chans.timeout,
  pipe: chans.pipe,
  intoArray: chans.intoArray
};
