import * as chans from "./index.js";

window.CHANS = {
  Channel: chans.Channel,
  Handler: chans.Handler,
  DroppingBuffer: chans.DroppingBuffer,
  SlidingBuffer: chans.SlidingBuffer,
  RingBuffer: chans.RingBuffer,
  Mult: chans.Mult,
  alts: chans.alts,
  timeout: chans.timeout,
  pipe: chans.pipe,
  intoArray: chans.intoArray
};
