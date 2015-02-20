
import { Channel, SlidingBuffer, DroppingBuffer, alts, timeout } from "./index.js";

//var channel = new Channel(new SlidingBuffer(3));
//
//channel.put(1);
//channel.put(2);
//channel.put(3);
//
//channel.take().then((v) => console.log(v));
//channel.take().then((v) => console.log(v));
//channel.take().then((v) => console.log(v));
//
//
//var chan1 = new Channel(),
//    chan2 = new Channel(),
//    chan3 = new Channel();
//
//setTimeout(function() { chan1.put("Hello!");               }, Math.random() * 1000);
//setTimeout(function() { chan2.put("How are you?");         }, Math.random() * 1000);
//setTimeout(function() { chan3.put("Very good.");           }, Math.random() * 1000);
//setTimeout(function() { chan1.put("Thank you very much."); }, Math.random() * 1000 + 1000);
//
//Promise.all([ chan1, chan2, chan3 ]).then(([ _1, _2, _3 ]) => {
//  console.log(_1, _2, _3);
//
//  return chan1.take();
//}).then((v) => {
//  console.log(v);
//});

//var channel = new Channel();
//
//function json(u, t) {
//  return xhr(u, t || 'GET', {
//    Accept: 'application/json',
//  }).then(function(v) {
//    return JSON.parse(v.responseText);
//  }, function(e) {
//    console.error(e);
//    return {};
//  })
//}
//
//function xhr(u, t, headers) {
//  return new Promise(function(r) {
//    var x = new XMLHttpRequest();
//    x.onload = function() { r(x); };
//    x.open(t || 'GET', u, true);
//
//    if(headers) {
//      Object.keys(headers).forEach(function(k) {
//        x.setRequestHeader(k, headers[k]);
//      });
//    }
//
//    x.send();
//  });
//}
//
//function wait(num) {
//  return new Promise(function(resolve) {
//    setTimeout(function() {
//      resolve();
//    }, num);
//  });
//}
//
//channel.put(wait(1000).then(() => "Intense!"));
//channel.take().then((v) => console.log(v));
//
//var channel = new Channel();
//
//channel.take().then(function consumer(v) {
//  if(v === null) { return; }
//
//  console.log("Channel value:", v);
//
//  channel.take().then(consumer);
//});
//
//setTimeout(function producer() {
//  channel.put(Math.random() * 1000).then(() => setTimeout(producer, Math.random() * 1000));
//}, 1000);

//timeout(1000).then(function() {
//  console.log("HEY!");
//});


let channel = new Channel();

alts([ channel, timeout(1000) ]).then(v => console.log(v));

setTimeout(() => { channel.put("Hello from the children of planet earth!"); }, Math.random() * 2000);