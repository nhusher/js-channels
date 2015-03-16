import * as chans from "../node/index.js";

module.exports = {
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
