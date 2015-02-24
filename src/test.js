
import { Channel, SlidingBuffer, DroppingBuffer, alts, timeout } from "./index.js";

(() => {
  /*
  Put three values on a channel -- 1, 2, 3 -- and then remove them.
   */

  var channel = new Channel(new SlidingBuffer(3));

  channel.put(1);
  channel.put(2);
  channel.put(3);

  channel.take().then((v) => console.log(v));
  channel.take().then((v) => console.log(v));
  channel.take().then((v) => console.log(v));

})();

(() => {
  /*
  Put a value onto three different channels at different times and use Promise.all to wait on the three values,
  because channels behave in promise-like ways (with some notable exceptions).

  When the three channels produce a value, pull again from the first channel.
   */

  var chan1 = new Channel(),
      chan2 = new Channel(),
      chan3 = new Channel();

  setTimeout(function() { chan1.put("Hello!");               }, 350);
  setTimeout(function() { chan2.put("How are you?");         }, 100);
  setTimeout(function() { chan3.put("Very good.");           }, 500);
  setTimeout(function() { chan1.put("Thank you very much."); }, 400);

  Promise.all([ chan1, chan2, chan3 ]).then(([ _1, _2, _3 ]) => {
    console.log(_1, _2, _3);

    return chan1.take();

  }).then(v => console.log(v) );

})();

(() => {
  /*
  You can put a promise chain on a channel, and it will automatically unwrap the promise.
   */

  var channel = new Channel();

  function wait(num) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve();
      }, num);
    });
  }

  channel.put(wait(1000).then(() => "Intense!"));
  channel.take().then((v) => console.log(v));

})();

(() => {
  /*


   */
  var channel = new Channel();

  function consumer(v) {
    if(v === null) { return; }
    console.log("Channel value:", v);
    channel.take().then(consumer);
  }

  function producer() {
    channel.put(Math.random() * 1000).then(() => {
      setTimeout(producer, Math.random() * 1000);
    });
  }

  channel.take().then(consumer);

  producer();

})();

(() => {

  var channel = new Channel();

  alts([ channel, timeout(1000) ]).take().then(([chan, val]) => { console.log(val) });

  setTimeout(() => { channel.put("Hello from the children of planet earth!"); }, Math.random() * 2000);

})();
