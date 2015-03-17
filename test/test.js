
import {
    Channel,
    RingBuffer,
    FixedBuffer,
    SlidingBuffer,
    DroppingBuffer,
    alts,
    timeout,
    order,
    map,
    filter,
    partitionBy,
    partition
} from "../src/channels/index.js";

function assert(expr, val, msg = `Expected ${val}, received ${expr}`) {
  if(expr !== val) {
    throw new Error(msg);
  }

  //console.log("ASSERT", expr, val);
}

function failTest(msg) {
  throw new Error(msg);
}

function channelTest(chans, test) {
  let joint = chans.map(c => {
    let resolver, promise = new Promise(r => resolver = r);
    let close = c.close;

    c.close = () => {
      close.call(c);
      resolver();
    }

    return promise;
  });

  test.apply(null, chans);

  return Promise.all(joint);
}

function hoist(fn, ...args) {
  return () => {
    return fn.apply(null, args);
  }
}

// === BEGIN TESTS ==========================================================

// Synchronous tests:
(() => {
  /*
  The RingBuffer is the basis on which all the buffers are built. It's difficult to use, so you probably won't ever
  want to use it. Use the higher-level FixedBuffer, DroppingBuffer, and SlidingBuffer instead
   */
  let buf = new RingBuffer(0);

  buf.resizingUnshift(10);
  assert(buf.pop(), 10);

  buf.resizingUnshift(20);
  assert(buf.pop(), 20);

  let i = 200;
  while(i --) {
    buf.resizingUnshift(i);
  }
  while(buf.length) {
    assert(buf.pop(), buf.length);
  }

})();

(() => {
  let buf = new FixedBuffer(1);

  buf.add(10);
  assert(buf.full, true);
  assert(buf.remove(), 10);
  assert(buf.full, false);

  buf.add(20);
  assert(buf.full, true);
  assert(buf.remove(), 20);
  assert(buf.full, false);

})();

(() => {
  let buf = new SlidingBuffer(1);

  buf.add(10);
  assert(buf.full, false);
  assert(buf.remove(), 10);
  assert(buf.full, false);

  buf.add(20);
  assert(buf.full, false);
  buf.add(30);
  assert(buf.full, false);
  assert(buf.remove(), 30);

  let i = 200;
  while(i --) {
    buf.add(i);
  }
  assert(buf.remove(), 0);


})();

(() => {

  let buf = new DroppingBuffer(1);

  buf.add(10);
  assert(buf.full, false);
  assert(buf.remove(), 10);
  assert(buf.full, false);

  buf.add(20);
  assert(buf.full, false);
  buf.add(30);
  assert(buf.full, false);
  assert(buf.remove(), 20);

  let i = 200;
  while(i --) {
    buf.add(i);
  }
  assert(buf.remove(), 199);

})();

// Asynchronous tests:
channelTest([ new Channel(3) ], channel => {
  /*
   Put three values on a channel -- 1, 2, 3 -- and then remove them.
   */

  channel.put(1);
  channel.put(2);
  channel.put(3);

  Promise.all([

    channel.take().then((v) => assert(v, 1)),
    channel.take().then((v) => assert(v, 2)),
    channel.take().then((v) => assert(v, 3))

  ]).then(() => channel.close());

}).then(hoist(channelTest, [ new Channel(new SlidingBuffer(2)) ], (channel) => {
  /*
   Put three values on a channel -- 1, 2, 3, notice the sliding buffer drops the first value
   */

  channel.put(1);
  channel.put(2);
  channel.put(3);

  Promise.all([

    channel.take().then((v) => assert(v, 2)),
    channel.take().then((v) => assert(v, 3))

  ]).then(() => channel.close());

})).then(hoist(channelTest, [ new Channel(new DroppingBuffer(2)) ], channel => {
  /*
   Put three values on a channel -- 1, 2, 3, notice the dropping buffer ignores additional puts
   */

  channel.put(1);
  channel.put(2);
  channel.put(3);

  Promise.all([

    channel.take().then((v) => assert(v, 1)),
    channel.take().then((v) => assert(v, 2))

  ]).then(() => channel.close());

  channel.close();

})).then(hoist(channelTest, [ new Channel(), new Channel(), new Channel() ], (chan1, chan2, chan3) => {

  /*
  Put a value onto three different channels at different times and use Promise.all to wait on the three values,
  because channels behave in promise-like ways (with some notable exceptions).

  When the three channels produce a value, pull again from the first channel.
   */

  setTimeout(function() { chan1.put("Hello!");               }, 35);
  setTimeout(function() { chan2.put("How are you?");         }, 10);
  setTimeout(function() { chan3.put("Very good.");           }, 50);
  setTimeout(function() { chan1.put("Thank you very much."); }, 40);

  Promise.all([ chan1, chan2, chan3 ]).then(([ _1, _2, _3 ]) => {
    assert(_1, "Hello!");
    assert(_2, "How are you?");
    assert(_3, "Very good.");

    return chan1.take();

  }).then(v => {
    assert(v, "Thank you very much.");

    chan1.close();
    chan2.close();
    chan3.close();
  });

})).then(hoist(channelTest, [ new Channel() ], (channel) => {
  /*
  You can put a promise chain on a channel, and it will automatically unwrap the promise.
   */

  function wait(num) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve();
      }, num);
    });
  }

  channel.put(wait(100).then(() => 100));
  channel.take().then((v) => {
    assert(v, 100);
    channel.close();
  });

})).then(hoist(channelTest, [], () => {
  /*
  But sometimes you don't want to unwrap promises, so you'll need to use the callback api:
   */
  // TODO

})).then(hoist(channelTest, [ new Channel(), new Channel(), new Channel() ], (chan1, chan2, chan3) => {
  /*
  Sometimes you want to complete only one of many operations on a set of channels
   */

  let alts1 = alts([ chan1, chan2 ]).take().then(([val, chan]) => {
    assert(chan, chan2);
    assert(val, 100);

  });

  let alts2 = alts([ chan1, chan2 ]).take().then(([ val, chan ]) => {
    assert(chan, chan1);
    assert(val, 200);
  });

  // You can "put" to a channel in an alts by passing an array
  let alts3 = alts([ chan1, chan2, [ chan3, 300 ] ]).take().then(([ val, chan ]) => {
    assert(chan, chan3);
    assert(val, 300);
  });

  chan3.take();
  chan2.put(100);
  chan1.put(200);

  Promise.all([ alts1, alts2, alts3 ]).then(() => {
    chan1.close();
    chan2.close();
    chan3.close();
  });

})).then(hoist(channelTest, [ new Channel() ], (channel) => {
  /*
   It's easy to order a channel by its added date using the `order` function, which takes a channel and returns
   a strictly ordered version of its asynchronous values (assumes those values are promises)

   This is useful for taking a channel of Promise<HttpRequest<Value>> and translating it to Promise<Value>
   */

  var ordered = order(channel);

  channel.put(timeout(200).then(() => 200));
  channel.put(timeout(100).then(() => 100));

  // (Note you can put the same channel into a Promise.all many times)
  Promise.all([ ordered, ordered ]).then(([ first, second ]) => {
    assert(first, 200);
    assert(second, 100);
    channel.close();
  });


})).then(hoist(channelTest, [ new Channel() ], (channel) => {

  channel.put(new Promise(() => {
    throw new Error();
  }));

  channel.put(100);

  let failure = channel.take().then(v => failTest("Should have evaluated to an error"), e => {});
  let success = channel.take().then(v => assert(v, 100));

  Promise.all([ failure, success]).then(() => channel.close());

})).then(hoist(channelTest, [ new Channel() ], (channel) => {

  channel.put(100).then(function() {
    channel.take().then(function(v) {
      assert(v, 200);
      channel.close();
    });
  });

  // The above code will deadlock if the next block isn't there, because the put is halted on a zero-length buf

  timeout(100).then(function() {
    channel.take().then(function(v) {
      assert(v, 100);
      channel.put(200);
    });
  });

})).then(hoist(channelTest, [ new Channel() ], (channel) => {

  channel.put(100);
  channel.put(200);
  channel.close();

  channel.take().then(v => assert(v, 100));
  channel.take().then(v => assert(v, 200));


})).then(hoist(channelTest, [
  new Channel(1, map(v => v * 2))
], (doubler) => {

  // Values put on the channel are doubled
  doubler.put(1);
  doubler.put(2);
  doubler.put(3);

  Promise.all([

    doubler.take().then((v) => assert(v, 2)),
    doubler.take().then((v) => assert(v, 4)),
    doubler.take().then((v) => assert(v, 6))

  ]).then(() => doubler.close());


})).then(hoist(channelTest, [
  new Channel(1, filter(v => v % 2 === 0))
], (evens) => {

  // Values put on the channel are doubled
  evens.put(1);
  evens.put(2);
  evens.put(3);
  evens.put(4);

  Promise.all([

    evens.take().then((v) => assert(v, 2)),
    evens.take().then((v) => assert(v, 4))

  ]).then(() => evens.close());

})).then(hoist(channelTest, [
  new Channel(1, partition(2))
], (groups) => {

  // Values put on the channel are doubled
  groups.put(1);
  groups.put(2);
  groups.put(3);
  groups.put(4);

  Promise.all([
    groups.take().then(([_1, _2]) => {
      assert(_1, 1);
      assert(_2, 2);
    }),
    groups.take().then(([_3, _4]) => {
      assert(_3, 3);
      assert(_4, 4);
    })
  ]).then(() => groups.close());

})).then(hoist(channelTest, [
  new Channel(10, partitionBy(v => {
    let normalized = v.replace(/\W+/g, '').toLowerCase();

    return normalized === normalized.split('').reverse().join('');
  }))
], (vals) => {

  // Values put on the channel are doubled
  vals.put("tacocat");
  vals.put("racecar");
  vals.put("not a palindrome");
  vals.put("also not a palindrome");
  vals.put("Madam I'm Adam");
  vals.put("Ah, satan sees natasha!");
  vals.put("one last try...");

  Promise.all([
    vals.take().then(([_1, _2]) => {
      assert(_1, "tacocat");
      assert(_2, "racecar");
    }),
    vals.take().then(([_1, _2]) => {
      assert(_1, "not a palindrome");
      assert(_2, "also not a palindrome");
    }),
    vals.take().then(([_1, _2]) => {
      assert(_1, "Madam I'm Adam");
      assert(_2, "Ah, satan sees natasha!");
    })
  ]).then(() => vals.close());

})).then(() => console.log("Tests complete."));
