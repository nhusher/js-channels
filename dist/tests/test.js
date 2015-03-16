(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

//
// TODO: this isn't idiomatically javascript (could probably use slice/splice to good effect)
//
function acopy(src, srcStart, dest, destStart, length) {
  for (var i = 0; i < length; i += 1) {
    dest[i + destStart] = src[i + srcStart];
  }
}

// --------------------------------------------------------------------------

var RingBuffer = (function () {
  function RingBuffer(s) {
    _classCallCheck(this, RingBuffer);

    var size = typeof s === "number" ? Math.max(1, s) : 1;
    this._tail = 0;
    this._head = 0;
    this._length = 0;
    this._values = new Array(size);
  }

  _createClass(RingBuffer, {
    pop: {
      value: function pop() {
        var result = undefined;
        if (this.length) {
          // Get the item out of the set of values
          result = this._values[this._tail] !== null ? this._values[this._tail] : null;

          // Remove the item from the set of values, update indicies
          this._values[this._tail] = null;
          this._tail = (this._tail + 1) % this._values.length;
          this._length -= 1;
        } else {
          result = null;
        }
        return result;
      }
    },
    unshift: {
      value: function unshift(val) {
        this._values[this._head] = val;
        this._head = (this._head + 1) % this._values.length;
        this._length += 1;
      }
    },
    resizingUnshift: {
      value: function resizingUnshift(val) {
        if (this.length + 1 === this._values.length) {
          this.resize();
        }
        this.unshift(val);
      }
    },
    resize: {
      value: function resize() {
        var newArry = new Array(this._values.length * 2);

        if (this._tail < this._head) {
          acopy(this._values, this._tail, newArry, 0, this._head);

          this._tail = 0;
          this._head = this.length;
          this._values = newArry;
        } else if (this._head < this._tail) {
          acopy(this._values, 0, newArry, this._values.length - this._tail, this._head);

          this._tail = 0;
          this._head = this.length;
          this._values = newArry;
        } else {
          this._tail = 0;
          this._head = 0;
          this._values = newArry;
        }
      }
    },
    length: {
      get: function () {
        return this._length;
      }
    }
  });

  return RingBuffer;
})();

// --------------------------------------------------------------------------

var FixedBuffer = (function () {
  function FixedBuffer(n) {
    _classCallCheck(this, FixedBuffer);

    this._buf = new RingBuffer(n);
    this._size = n;
  }

  _createClass(FixedBuffer, {
    remove: {
      value: function remove() {
        return this._buf.pop();
      }
    },
    add: {
      value: function add(v) {
        this._buf.resizingUnshift(v);
      }
    },
    length: {
      get: function () {
        return this._buf.length;
      }
    },
    full: {
      get: function () {
        return this._buf.length === this._size;
      }
    }
  });

  return FixedBuffer;
})();

// --------------------------------------------------------------------------

var DroppingBuffer = (function (_FixedBuffer) {
  function DroppingBuffer() {
    _classCallCheck(this, DroppingBuffer);

    if (_FixedBuffer != null) {
      _FixedBuffer.apply(this, arguments);
    }
  }

  _inherits(DroppingBuffer, _FixedBuffer);

  _createClass(DroppingBuffer, {
    add: {
      value: function add(v) {
        if (this._buf.length < this._size) {
          this._buf.unshift(v);
        }
      }
    },
    full: {
      get: function () {
        return false;
      }
    }
  });

  return DroppingBuffer;
})(FixedBuffer);

// --------------------------------------------------------------------------

var SlidingBuffer = (function (_FixedBuffer2) {
  function SlidingBuffer() {
    _classCallCheck(this, SlidingBuffer);

    if (_FixedBuffer2 != null) {
      _FixedBuffer2.apply(this, arguments);
    }
  }

  _inherits(SlidingBuffer, _FixedBuffer2);

  _createClass(SlidingBuffer, {
    add: {
      value: function add(v) {
        if (this._buf.length === this._size) {
          this.remove();
        }
        this._buf.unshift(v);
      }
    },
    full: {
      get: function () {
        return false;
      }
    }
  });

  return SlidingBuffer;
})(FixedBuffer);

exports.DroppingBuffer = DroppingBuffer;
exports.SlidingBuffer = SlidingBuffer;
exports.FixedBuffer = FixedBuffer;
exports.RingBuffer = RingBuffer;

},{}],2:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _buffersJs = require("./buffers.js");

var FixedBuffer = _buffersJs.FixedBuffer;
var RingBuffer = _buffersJs.RingBuffer;

var Dispatch = require("./dispatch.js").Dispatch;

var Promise = require("./promise.js").Promise;

// --------------------------------------------------------------------------

var Transactor = (function () {
  function Transactor(offer) {
    _classCallCheck(this, Transactor);

    this.offered = offer;
    this.received = null;
    this.resolved = false;
    this.active = true;
    this.callbacks = [];
  }

  _createClass(Transactor, {
    commit: {
      value: function commit() {
        var _this = this;

        return function (val) {
          if (_this.resolved) {
            throw new Error("Tried to resolve transactor twice!");
          }
          _this.received = val;
          _this.resolved = true;
          _this.callbacks.forEach(function (c) {
            return c(val);
          });

          return _this.offered;
        };
      }
    },
    deref: {
      value: function deref(callback) {
        if (this.resolved) {
          callback(this.received);
        } else {
          this.callbacks.push(callback);
        }
      }
    }
  });

  return Transactor;
})();

// --------------------------------------------------------------------------

var dispatch = new Dispatch();

var Channel = (function () {
  function Channel(sizeOrBuf) {
    _classCallCheck(this, Channel);

    this._buffer = sizeOrBuf instanceof FixedBuffer ? sizeOrBuf : new FixedBuffer(sizeOrBuf || 0);
    this._takers = new RingBuffer(32);
    this._putters = new RingBuffer(32);

    this._isOpen = true;
  }

  _createClass(Channel, {
    fill: {
      value: function fill(val) {
        var _this = this;

        var tx = arguments[1] === undefined ? new Transactor(val) : arguments[1];
        return (function () {
          if (val === null) {
            throw new Error("Cannot put null to a channel.");
          }
          if (!(tx instanceof Transactor)) {
            throw new Error("Expecting Transactor to be passed to fill");
          }
          if (!tx.active) {
            return tx;
          }

          if (!_this.open) {
            // Either somebody has resolved the handler already (that was fast) or the channel is closed.
            // core.async returns a boolean of whether or not something *could* get put to the channel
            // we'll do the same #cargocult
            tx.commit()(false);
          }

          if (!_this._buffer.full) {
            // The channel has some free space. Stick it in the buffer and then drain any waiting takes.

            tx.commit()(true);
            _this._buffer.add(val);

            while (_this._takers.length && _this._buffer.length) {
              var takerTx = _this._takers.pop();

              if (takerTx.active) {
                (function () {
                  var val = _this._buffer.remove();
                  var takerCb = takerTx.commit();

                  dispatch.run(function () {
                    return takerCb(val);
                  });
                })();
              }
            }

            return tx;
          } else if (_this._takers.length) {
            // The buffer is full but there are waiting takers (e.g. the buffer is size zero)

            var takerTx = _this._takers.pop();

            while (_this._takers.length && !takerTx.active) {
              takerTx = _this._takers.pop();
            }

            if (takerTx && takerTx.active) {
              (function () {
                tx.commit()(true);
                var takeCb = takerTx.commit();

                dispatch.run(function () {
                  return takeCb(val);
                });
              })();
            } else {
              _this._putters.resizingUnshift(tx);
            }
          } else {
            _this._putters.resizingUnshift(tx);
          }

          return tx;
        })();
      }
    },
    put: {
      value: function put(val, transactor) {
        var _this = this;

        return new Promise(function (resolve) {
          _this.fill(val, transactor).deref(resolve);
        });
      }
    },
    drain: {
      value: function drain() {
        var _this = this;

        var tx = arguments[0] === undefined ? new Transactor() : arguments[0];

        if (!(tx instanceof Transactor)) {
          throw new Error("Expecting Transactor to be passed to drain");
        }
        if (!tx.active) {
          return tx;
        }

        if (this._buffer.length) {
          var bufVal = this._buffer.remove();

          while (!this._buffer.full && this._putters.length) {
            var putter = this.putters.pop();

            if (putter.active) {
              (function () {
                var putTx = putter.commit();

                dispatch.run(function () {
                  return _this._buffer.add(putTx());
                });
              })();
            }
          }

          tx.commit()(bufVal);
        } else if (this._putters.length) {
          var putterTx = this._putters.pop();

          while (this._putters.length && !putterTx.active) {
            putterTx = this._putters.pop();
          }

          if (putterTx && putterTx.active) {
            (function () {
              var txCb = tx.commit();
              var putterCb = putterTx.commit();

              dispatch.run(function () {
                return txCb(putterCb());
              });
            })();
          } else {
            this._takers.resizingUnshift(tx);
          }
        } else {
          this._takers.resizingUnshift(tx);
        }

        return tx;
      }
    },
    take: {
      value: function take(transactor) {
        var _this = this;

        return new Promise(function (resolve) {
          _this.drain(transactor).deref(resolve);
        });
      }
    },
    then: {
      value: function then(fn, err) {
        return this.take().then(fn, err);
      }
    },
    close: {
      value: function close() {
        this._isOpen = false;

        while (this._takers.length) {
          var taker = this._takers.pop();

          if (taker.active) {
            taker.commit()(null);
          }
        }
      }
    },
    open: {
      get: function () {
        return this._isOpen;
      }
    }
  });

  return Channel;
})();

exports.Channel = Channel;
exports.Transactor = Transactor;

},{"./buffers.js":1,"./dispatch.js":3,"./promise.js":6}],3:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});
var defaultAsynchronizer = typeof setImmediate === "function" ? function (fn) {
  return setImmediate(fn);
} : function (fn) {
  return setTimeout(fn);
};

var Dispatch = (function () {
  function Dispatch(asynchronizer) {
    _classCallCheck(this, Dispatch);

    this._asynchronizer = asynchronizer || defaultAsynchronizer;
    this._queue = [];
  }

  _createClass(Dispatch, {
    run: {
      value: function run(fn) {
        var _this = this;

        this._queue.push(fn);

        this._asynchronizer(function () {
          while (_this._queue.length) {
            _this._queue.shift()();
          }
        });
      }
    }
  });

  return Dispatch;
})();

exports.Dispatch = Dispatch;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _channelJs = require("./channel.js");

var Channel = _channelJs.Channel;
var Transactor = _channelJs.Transactor;

var _buffersJs = require("./buffers.js");

var FixedBuffer = _buffersJs.FixedBuffer;
var DroppingBuffer = _buffersJs.DroppingBuffer;
var SlidingBuffer = _buffersJs.SlidingBuffer;
var RingBuffer = _buffersJs.RingBuffer;

var Mult = require("./mult.js").Mult;

var _utilsJs = require("./utils.js");

var alts = _utilsJs.alts;
var timeout = _utilsJs.timeout;
var pipe = _utilsJs.pipe;
var intoArray = _utilsJs.intoArray;
var order = _utilsJs.order;
exports.Channel = Channel;
exports.Transactor = Transactor;
exports.FixedBuffer = FixedBuffer;
exports.DroppingBuffer = DroppingBuffer;
exports.SlidingBuffer = SlidingBuffer;
exports.RingBuffer = RingBuffer;
exports.Mult = Mult;
exports.alts = alts;
exports.timeout = timeout;
exports.pipe = pipe;
exports.intoArray = intoArray;
exports.order = order;

},{"./buffers.js":1,"./channel.js":2,"./mult.js":5,"./utils.js":7}],5:[function(require,module,exports){
"use strict";

var _toArray = function (arr) { return Array.isArray(arr) ? arr : Array.from(arr); };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Promise = require("./promise.js").Promise;

function distribute(taps, val) {
  if (!taps.length) {
    return Promise.resolve();
  } else {
    var _taps;

    var _ret = (function () {
      _taps = _toArray(taps);
      var tap = _taps[0];

      var rest = _taps.slice(1);

      return {
        v: tap.put(val).then(function () {
          return distribute(rest, val);
        })
      };
    })();

    if (typeof _ret === "object") {
      return _ret.v;
    }
  }
}

var Mult = (function () {
  function Mult(ch) {
    _classCallCheck(this, Mult);

    this._taps = [];
    this._free = Promise.resolve();

    ch.take().then((function drainLoop(v) {
      if (v === null) {
        // cleanup
        return;
      }

      // Locks the list of taps until the distribution is complete
      var doFree = undefined,
          free = new Promise(function (r) {
        return doFree = r;
      });

      this._free = free;

      distribute(taps, v).then(function () {
        doFree();
        ch.take().then(drainLoop);
      });
    }).bind(this));
  }

  _createClass(Mult, {
    tap: {
      value: function tap(ch, close) {
        var _this = this;

        if (this._taps.some(function (t) {
          return t.ch === ch;
        })) {
          throw new Error("Can't add the same channel to a mult twice");
        }

        return this._free.then(function () {
          _this._taps.push({ close: close, ch: ch });
          return ch;
        });
      }
    },
    untap: {
      value: function untap(ch) {
        var _this = this;

        return this._free.then(function () {
          _this._taps = _this._taps.filter(function (tap) {
            return tap.ch !== ch;
          });
          return ch;
        });
      }
    }
  });

  return Mult;
})();

exports.Mult = Mult;

},{"./promise.js":6}],6:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _Promise;

if (typeof window !== "undefined" && window.Promise) {
  _Promise = window.Promise;
} else if (typeof global !== "undefined" && global.Promise) {
  _Promise = global.Promise;
} else {
  throw new Error("Unable to find native promise implementation.");
}

exports.Promise = _Promise;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.alts = alts;
exports.timeout = timeout;
exports.pipe = pipe;
exports.intoArray = intoArray;

// Enforces order resolution on resulting channel
// This might need to be the default behavior, though that requires more thought
exports.order = order;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _channelJs = require("./channel.js");

var Channel = _channelJs.Channel;
var Transactor = _channelJs.Transactor;

var AltsTransactor = (function (_Transactor) {
  function AltsTransactor(offer, commitCb) {
    _classCallCheck(this, AltsTransactor);

    _get(Object.getPrototypeOf(AltsTransactor.prototype), "constructor", this).call(this, offer);
    this.commitCb = commitCb;
  }

  _inherits(AltsTransactor, _Transactor);

  _createClass(AltsTransactor, {
    commit: {
      value: function commit() {
        this.commitCb();
        return _get(Object.getPrototypeOf(AltsTransactor.prototype), "commit", this).call(this);
      }
    }
  });

  return AltsTransactor;
})(Transactor);

function alts(race) {
  var transactors = [];
  var outCh = new Channel();

  var deactivate = function () {
    transactors.forEach(function (h) {
      return h.active = false;
    });
  };

  race.map(function (cmd) {

    if (Array.isArray(cmd)) {
      var _cmd;

      (function () {
        var tx = new AltsTransactor(val, function () {
          transactors.forEach(function (h) {
            return h.active = false;
          });
        });
        _cmd = _slicedToArray(cmd, 2);
        var ch = _cmd[0];
        var val = _cmd[1];

        ch.put(val, tx).then(function () {
          outCh.put([val, ch]);
        });

        transactors.push(tx);
      })();
    } else {
      var tx = new AltsTransactor(true, function () {
        transactors.forEach(function (h) {
          return h.active = false;
        });
      });

      cmd.take(tx).then(function (val) {
        outCh.put([val, cmd]);
      });

      transactors.push(tx);
    }
  });

  return outCh;
}

function timeout(ms) {
  var ch = new Channel();
  setTimeout(function () {
    ch.close();
  }, ms);
  return ch;
}

function pipe(inCh, outCh) {
  var close = arguments[2] === undefined ? true : arguments[2];

  inCh.take().then(function pipe(v) {
    if (v !== null) {
      outCh.put(v).then(function () {
        return inCh.take().then(pipe);
      });
    } else if (close) {
      outCh.close();
    }
  });
}

function intoArray(ch) {
  var ret = [];
  return ch.take().then(function drain(v) {
    if (v === null) {
      return ret;
    } else {
      ret.push(v);
      return ch.take().then(drain);
    }
  });
}

function order(inch, sizeOrBuf) {
  var outch = new Channel(sizeOrBuf);

  function drain() {
    inch.take().then(function (val) {
      if (val === null) {
        outch.close();
      } else {
        outch.put(val).then(drain);
      }
    });
  }
  drain();

  return outch;
}

},{"./channel.js":2}],8:[function(require,module,exports){
"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _srcChannelsIndexJs = require("../src/channels/index.js");

var Channel = _srcChannelsIndexJs.Channel;
var RingBuffer = _srcChannelsIndexJs.RingBuffer;
var FixedBuffer = _srcChannelsIndexJs.FixedBuffer;
var SlidingBuffer = _srcChannelsIndexJs.SlidingBuffer;
var DroppingBuffer = _srcChannelsIndexJs.DroppingBuffer;
var alts = _srcChannelsIndexJs.alts;
var timeout = _srcChannelsIndexJs.timeout;
var order = _srcChannelsIndexJs.order;

function assert(expr, val) {
  var msg = arguments[2] === undefined ? "Expected " + val + ", received " + expr : arguments[2];
  return (function () {
    if (expr !== val) {
      throw new Error(msg);
    }

    //  console.log("ASSERT", expr, val);
  })();
}

function failTest(msg) {
  throw new Error(msg);
}

function channelTest(chans, test) {
  var joint = chans.map(function (c) {
    var resolver = undefined,
        promise = new Promise(function (r) {
      return resolver = r;
    });
    var close = c.close;

    c.close = function () {
      close.call(c);
      resolver();
    };

    return promise;
  });

  test.apply(null, chans);

  return Promise.all(joint);
}

function hoist(fn) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return function () {
    return fn.apply(null, args);
  };
}

// === BEGIN TESTS ==========================================================

// Synchronous tests:
(function () {
  /*
  The RingBuffer is the basis on which all the buffers are built. It's difficult to use, so you probably won't ever
  want to use it. Use the higher-level FixedBuffer, DroppingBuffer, and SlidingBuffer instead
   */
  var buf = new RingBuffer(0);

  buf.resizingUnshift(10);
  assert(buf.pop(), 10);

  buf.resizingUnshift(20);
  assert(buf.pop(), 20);

  var i = 200;
  while (i--) {
    buf.resizingUnshift(i);
  }
  while (buf.length) {
    assert(buf.pop(), buf.length);
  }
})();

(function () {
  var buf = new FixedBuffer(1);

  buf.add(10);
  assert(buf.full, true);
  assert(buf.remove(), 10);
  assert(buf.full, false);

  buf.add(20);
  assert(buf.full, true);
  assert(buf.remove(), 20);
  assert(buf.full, false);
})();

(function () {
  var buf = new SlidingBuffer(1);

  buf.add(10);
  assert(buf.full, false);
  assert(buf.remove(), 10);
  assert(buf.full, false);

  buf.add(20);
  assert(buf.full, false);
  buf.add(30);
  assert(buf.full, false);
  assert(buf.remove(), 30);

  var i = 200;
  while (i--) {
    buf.add(i);
  }
  assert(buf.remove(), 0);
})();

(function () {

  var buf = new DroppingBuffer(1);

  buf.add(10);
  assert(buf.full, false);
  assert(buf.remove(), 10);
  assert(buf.full, false);

  buf.add(20);
  assert(buf.full, false);
  buf.add(30);
  assert(buf.full, false);
  assert(buf.remove(), 20);

  var i = 200;
  while (i--) {
    buf.add(i);
  }
  assert(buf.remove(), 199);
})();

// Asynchronous tests:
channelTest([new Channel(3)], function (channel) {
  /*
   Put three values on a channel -- 1, 2, 3 -- and then remove them.
   */

  channel.put(1);
  channel.put(2);
  channel.put(3);

  Promise.all([channel.take().then(function (v) {
    return assert(v, 1);
  }), channel.take().then(function (v) {
    return assert(v, 2);
  }), channel.take().then(function (v) {
    return assert(v, 3);
  })]).then(function () {
    return channel.close();
  });
}).then(hoist(channelTest, [new Channel(new SlidingBuffer(2))], function (channel) {
  /*
   Put three values on a channel -- 1, 2, 3, notice the sliding buffer drops the first value
   */

  channel.put(1);
  channel.put(2);
  channel.put(3);

  Promise.all([channel.take().then(function (v) {
    return assert(v, 2);
  }), channel.take().then(function (v) {
    return assert(v, 3);
  })]).then(function () {
    return channel.close();
  });
})).then(hoist(channelTest, [new Channel(new DroppingBuffer(2))], function (channel) {
  /*
   Put three values on a channel -- 1, 2, 3, notice the dropping buffer ignores additional puts
   */

  channel.put(1);
  channel.put(2);
  channel.put(3);

  Promise.all([channel.take().then(function (v) {
    return assert(v, 1);
  }), channel.take().then(function (v) {
    return assert(v, 2);
  })]).then(function () {
    return channel.close();
  });

  channel.close();
})).then(hoist(channelTest, [new Channel(), new Channel(), new Channel()], function (chan1, chan2, chan3) {

  /*
  Put a value onto three different channels at different times and use Promise.all to wait on the three values,
  because channels behave in promise-like ways (with some notable exceptions).
   When the three channels produce a value, pull again from the first channel.
   */

  setTimeout(function () {
    chan1.put("Hello!");
  }, 35);
  setTimeout(function () {
    chan2.put("How are you?");
  }, 10);
  setTimeout(function () {
    chan3.put("Very good.");
  }, 50);
  setTimeout(function () {
    chan1.put("Thank you very much.");
  }, 40);

  Promise.all([chan1, chan2, chan3]).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 3);

    var _1 = _ref2[0];
    var _2 = _ref2[1];
    var _3 = _ref2[2];

    assert(_1, "Hello!");
    assert(_2, "How are you?");
    assert(_3, "Very good.");

    return chan1.take();
  }).then(function (v) {
    assert(v, "Thank you very much.");

    chan1.close();
    chan2.close();
    chan3.close();
  });
})).then(hoist(channelTest, [new Channel()], function (channel) {
  /*
  You can put a promise chain on a channel, and it will automatically unwrap the promise.
   */

  function wait(num) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve();
      }, num);
    });
  }

  channel.put(wait(100).then(function () {
    return 100;
  }));
  channel.take().then(function (v) {
    assert(v, 100);
    channel.close();
  });
})).then(hoist(channelTest, [], function () {})).then(hoist(channelTest, [new Channel(), new Channel(), new Channel()], function (chan1, chan2, chan3) {
  /*
  Sometimes you want to complete only one of many operations on a set of channels
   */

  var alts1 = alts([chan1, chan2]).take().then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var val = _ref2[0];
    var chan = _ref2[1];

    assert(chan, chan2);
    assert(val, 100);
  });

  var alts2 = alts([chan1, chan2]).take().then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var val = _ref2[0];
    var chan = _ref2[1];

    assert(chan, chan1);
    assert(val, 200);
  });

  // You can "put" to a channel in an alts by passing an array
  var alts3 = alts([chan1, chan2, [chan3, 300]]).take().then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var val = _ref2[0];
    var chan = _ref2[1];

    assert(chan, chan3);
    assert(val, 300);
  });

  chan3.take();
  chan2.put(100);
  chan1.put(200);

  Promise.all([alts1, alts2, alts3]).then(function () {
    chan1.close();
    chan2.close();
    chan3.close();
  });
})).then(hoist(channelTest, [new Channel()], function (channel) {
  /*
   It's easy to order a channel by its added date using the `order` function, which takes a channel and returns
   a strictly ordered version of its asynchronous values (assumes those values are promises)
    This is useful for taking a channel of Promise<HttpRequest<Value>> and translating it to Promise<Value>
   */

  var ordered = order(channel);

  channel.put(timeout(200).then(function () {
    return 200;
  }));
  channel.put(timeout(100).then(function () {
    return 100;
  }));

  // (Note you can put the same channel into a Promise.all many times)
  Promise.all([ordered, ordered]).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var first = _ref2[0];
    var second = _ref2[1];

    assert(first, 200);
    assert(second, 100);
    channel.close();
  });
})).then(hoist(channelTest, [new Channel()], function (channel) {

  channel.put(new Promise(function () {
    throw new Error();
  }));

  channel.put(100);

  var failure = channel.take().then(function (v) {
    return failTest("Should have evaluated to an error");
  }, function (e) {});
  var success = channel.take().then(function (v) {
    return assert(v, 100);
  });

  Promise.all([failure, success]).then(function () {
    return channel.close();
  });
})).then(function () {
  return console.log("Tests complete.");
});

/*
But sometimes you don't want to unwrap promises, so you'll need to use the callback api:
 */
// TODO

},{"../src/channels/index.js":4}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbmh1c2hlci9Qcm9qZWN0cy9qcy1hc3luYy9zcmMvY2hhbm5lbHMvYnVmZmVycy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9jaGFubmVsLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvc3JjL2NoYW5uZWxzL2Rpc3BhdGNoLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvc3JjL2NoYW5uZWxzL2luZGV4LmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvc3JjL2NoYW5uZWxzL211bHQuanMiLCIvVXNlcnMvbmh1c2hlci9Qcm9qZWN0cy9qcy1hc3luYy9zcmMvY2hhbm5lbHMvcHJvbWlzZS5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy91dGlscy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3Rlc3QvdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQ0lBLFNBQVMsS0FBSyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7QUFDckQsT0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2pDLFFBQUksQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztHQUN6QztDQUNGOzs7O0lBSUssVUFBVTtBQUNILFdBRFAsVUFBVSxDQUNGLENBQUMsRUFBRTswQkFEWCxVQUFVOztBQUVaLFFBQUksSUFBSSxHQUFHLEFBQUMs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SSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUEsQ0FBQztXQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO0dBQUEsQ0FBQyxDQUFDOztBQUV2RCxTQUFPLENBQUMsR0FBRyxDQUFDLENBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1dBQU0sT0FBTyxDQUFDLEtBQUssRUFBRTtHQUFBLENBQUMsQ0FBQztDQUU5RCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FBTSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0NBQUEsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLy9cbi8vIFRPRE86IHRoaXMgaXNuJ3QgaWRpb21hdGljYWxseSBqYXZhc2NyaXB0IChjb3VsZCBwcm9iYWJseSB1c2Ugc2xpY2Uvc3BsaWNlIHRvIGdvb2QgZWZmZWN0KVxuLy9cbmZ1bmN0aW9uIGFjb3B5KHNyYywgc3JjU3RhcnQsIGRlc3QsIGRlc3RTdGFydCwgbGVuZ3RoKSB7XG4gIGZvcihsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGRlc3RbaSArIGRlc3RTdGFydF0gPSBzcmNbaSArIHNyY1N0YXJ0XTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBSaW5nQnVmZmVyIHtcbiAgY29uc3RydWN0b3Iocykge1xuICAgIGxldCBzaXplID0gKHR5cGVvZiBzID09PSAnbnVtYmVyJykgPyBNYXRoLm1heCgxLCBzKSA6IDE7XG4gICAgdGhpcy5fdGFpbCAgID0gMDtcbiAgICB0aGlzLl9oZWFkICAgPSAwO1xuICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgdGhpcy5fdmFsdWVzID0gbmV3IEFycmF5KHNpemUpO1xuICB9XG5cbiAgcG9wKCkge1xuICAgIGxldCByZXN1bHQ7XG4gICAgaWYodGhpcy5sZW5ndGgpIHtcbiAgICAgIC8vIEdldCB0aGUgaXRlbSBvdXQgb2YgdGhlIHNldCBvZiB2YWx1ZXNcbiAgICAgIHJlc3VsdCA9ICh0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gIT09IG51bGwpID8gdGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdIDogbnVsbDtcblxuICAgICAgLy8gUmVtb3ZlIHRoZSBpdGVtIGZyb20gdGhlIHNldCBvZiB2YWx1ZXMsIHVwZGF0ZSBpbmRpY2llc1xuICAgICAgdGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdID0gbnVsbDtcbiAgICAgIHRoaXMuX3RhaWwgPSAodGhpcy5fdGFpbCArIDEpICUgdGhpcy5fdmFsdWVzLmxlbmd0aDtcbiAgICAgIHRoaXMuX2xlbmd0aCAtPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgdW5zaGlmdCh2YWwpIHtcbiAgICB0aGlzLl92YWx1ZXNbdGhpcy5faGVhZF0gPSB2YWw7XG4gICAgdGhpcy5faGVhZCA9ICh0aGlzLl9oZWFkICsgMSkgJSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuICAgIHRoaXMuX2xlbmd0aCArPSAxO1xuICB9XG5cbiAgcmVzaXppbmdVbnNoaWZ0KHZhbCkge1xuICAgIGlmKHRoaXMubGVuZ3RoICsgMSA9PT0gdGhpcy5fdmFsdWVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICB9XG4gICAgdGhpcy51bnNoaWZ0KHZhbCk7XG4gIH1cblxuICByZXNpemUoKSB7XG4gICAgbGV0IG5ld0FycnkgPSBuZXcgQXJyYXkodGhpcy5fdmFsdWVzLmxlbmd0aCAqIDIpO1xuXG4gICAgaWYodGhpcy5fdGFpbCA8IHRoaXMuX2hlYWQpIHtcbiAgICAgIGFjb3B5KHRoaXMuX3ZhbHVlcywgdGhpcy5fdGFpbCwgbmV3QXJyeSwgMCwgdGhpcy5faGVhZCk7XG5cbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMubGVuZ3RoO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcblxuICAgIH0gZWxzZSBpZih0aGlzLl9oZWFkIDwgdGhpcy5fdGFpbCkge1xuICAgICAgYWNvcHkodGhpcy5fdmFsdWVzLCAwLCBuZXdBcnJ5LCB0aGlzLl92YWx1ZXMubGVuZ3RoIC0gdGhpcy5fdGFpbCwgdGhpcy5faGVhZCk7XG5cbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMubGVuZ3RoO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSAwO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcbiAgICB9XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgRml4ZWRCdWZmZXIge1xuICBjb25zdHJ1Y3RvcihuKSB7XG4gICAgdGhpcy5fYnVmID0gbmV3IFJpbmdCdWZmZXIobik7XG4gICAgdGhpcy5fc2l6ZSA9IG47XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5wb3AoKTtcbiAgfVxuXG4gIGFkZCh2KSB7XG4gICAgdGhpcy5fYnVmLnJlc2l6aW5nVW5zaGlmdCh2KTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5sZW5ndGg7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBEcm9wcGluZ0J1ZmZlciBleHRlbmRzIEZpeGVkQnVmZmVyIHtcbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLl9idWYubGVuZ3RoIDwgdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFNsaWRpbmdCdWZmZXIgZXh0ZW5kcyBGaXhlZEJ1ZmZlciB7XG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IHsgRHJvcHBpbmdCdWZmZXIsIFNsaWRpbmdCdWZmZXIsIEZpeGVkQnVmZmVyLCBSaW5nQnVmZmVyIH07IiwiXG5pbXBvcnQgeyBGaXhlZEJ1ZmZlciwgUmluZ0J1ZmZlciB9IGZyb20gXCIuL2J1ZmZlcnMuanNcIjtcbmltcG9ydCB7IERpc3BhdGNoIH0gZnJvbSBcIi4vZGlzcGF0Y2guanNcIjtcbmltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFRyYW5zYWN0b3Ige1xuICBjb25zdHJ1Y3RvcihvZmZlcikge1xuICAgIHRoaXMub2ZmZXJlZCA9IG9mZmVyO1xuICAgIHRoaXMucmVjZWl2ZWQgPSBudWxsO1xuICAgIHRoaXMucmVzb2x2ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcbiAgfVxuXG4gIGNvbW1pdCgpIHtcbiAgICByZXR1cm4gKHZhbCkgPT4ge1xuICAgICAgaWYodGhpcy5yZXNvbHZlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byByZXNvbHZlIHRyYW5zYWN0b3IgdHdpY2UhXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWNlaXZlZCA9IHZhbDtcbiAgICAgIHRoaXMucmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaChjID0+IGModmFsKSk7XG5cbiAgICAgIHJldHVybiB0aGlzLm9mZmVyZWQ7XG4gICAgfVxuICB9XG5cbiAgZGVyZWYoY2FsbGJhY2spIHtcbiAgICBpZih0aGlzLnJlc29sdmVkKSB7XG4gICAgICBjYWxsYmFjayh0aGlzLnJlY2VpdmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9XG59XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubGV0IGRpc3BhdGNoID0gbmV3IERpc3BhdGNoKCk7XG5cbmNsYXNzIENoYW5uZWwge1xuICBjb25zdHJ1Y3RvcihzaXplT3JCdWYpIHtcbiAgICB0aGlzLl9idWZmZXIgPSAoc2l6ZU9yQnVmIGluc3RhbmNlb2YgRml4ZWRCdWZmZXIpID8gc2l6ZU9yQnVmIDogbmV3IEZpeGVkQnVmZmVyKHNpemVPckJ1ZiB8fCAwKTtcbiAgICB0aGlzLl90YWtlcnMgPSBuZXcgUmluZ0J1ZmZlcigzMik7XG4gICAgdGhpcy5fcHV0dGVycyA9IG5ldyBSaW5nQnVmZmVyKDMyKTtcblxuICAgIHRoaXMuX2lzT3BlbiA9IHRydWU7XG4gIH1cblxuICBmaWxsKHZhbCwgdHggPSBuZXcgVHJhbnNhY3Rvcih2YWwpKSB7XG4gICAgaWYodmFsID09PSBudWxsKSB7IHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBwdXQgbnVsbCB0byBhIGNoYW5uZWwuXCIpOyB9XG4gICAgaWYoISh0eCBpbnN0YW5jZW9mIFRyYW5zYWN0b3IpKSB7IHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBUcmFuc2FjdG9yIHRvIGJlIHBhc3NlZCB0byBmaWxsXCIpOyB9XG4gICAgaWYoIXR4LmFjdGl2ZSkgeyByZXR1cm4gdHg7IH1cblxuICAgIGlmKCF0aGlzLm9wZW4pIHtcbiAgICAgIC8vIEVpdGhlciBzb21lYm9keSBoYXMgcmVzb2x2ZWQgdGhlIGhhbmRsZXIgYWxyZWFkeSAodGhhdCB3YXMgZmFzdCkgb3IgdGhlIGNoYW5uZWwgaXMgY2xvc2VkLlxuICAgICAgLy8gY29yZS5hc3luYyByZXR1cm5zIGEgYm9vbGVhbiBvZiB3aGV0aGVyIG9yIG5vdCBzb21ldGhpbmcgKmNvdWxkKiBnZXQgcHV0IHRvIHRoZSBjaGFubmVsXG4gICAgICAvLyB3ZSdsbCBkbyB0aGUgc2FtZSAjY2FyZ29jdWx0XG4gICAgICB0eC5jb21taXQoKShmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYoIXRoaXMuX2J1ZmZlci5mdWxsKSB7XG4gICAgICAvLyBUaGUgY2hhbm5lbCBoYXMgc29tZSBmcmVlIHNwYWNlLiBTdGljayBpdCBpbiB0aGUgYnVmZmVyIGFuZCB0aGVuIGRyYWluIGFueSB3YWl0aW5nIHRha2VzLlxuXG4gICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgIHRoaXMuX2J1ZmZlci5hZGQodmFsKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiB0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgIGxldCB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcbiAgICAgICAgICBsZXQgdGFrZXJDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHg7XG4gICAgfSBlbHNlIGlmKHRoaXMuX3Rha2Vycy5sZW5ndGgpIHtcbiAgICAgIC8vIFRoZSBidWZmZXIgaXMgZnVsbCBidXQgdGhlcmUgYXJlIHdhaXRpbmcgdGFrZXJzIChlLmcuIHRoZSBidWZmZXIgaXMgc2l6ZSB6ZXJvKVxuXG4gICAgICBsZXQgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiAhdGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYodGFrZXJUeCAmJiB0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgICAgbGV0IHRha2VDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VDYih2YWwpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3B1dHRlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHV0dGVycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgIH1cblxuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHB1dCh2YWwsIHRyYW5zYWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmZpbGwodmFsLCB0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRyYWluKHR4ID0gbmV3IFRyYW5zYWN0b3IoKSkge1xuICAgIGlmKCEodHggaW5zdGFuY2VvZiBUcmFuc2FjdG9yKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgVHJhbnNhY3RvciB0byBiZSBwYXNzZWQgdG8gZHJhaW5cIik7IH1cbiAgICBpZighdHguYWN0aXZlKSB7IHJldHVybiB0eDsgfVxuXG4gICAgaWYodGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgbGV0IGJ1ZlZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcblxuICAgICAgd2hpbGUoIXRoaXMuX2J1ZmZlci5mdWxsICYmIHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLnB1dHRlcnMucG9wKCk7XG5cbiAgICAgICAgaWYocHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICAgIGxldCBwdXRUeCA9IHB1dHRlci5jb21taXQoKTtcblxuICAgICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0aGlzLl9idWZmZXIuYWRkKHB1dFR4KCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eC5jb21taXQoKShidWZWYWwpO1xuICAgIH0gZWxzZSBpZih0aGlzLl9wdXR0ZXJzLmxlbmd0aCkge1xuICAgICAgbGV0IHB1dHRlclR4ID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fcHV0dGVycy5sZW5ndGggJiYgIXB1dHRlclR4LmFjdGl2ZSkge1xuICAgICAgICBwdXR0ZXJUeCA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHB1dHRlclR4ICYmIHB1dHRlclR4LmFjdGl2ZSkge1xuICAgICAgICBsZXQgdHhDYiA9IHR4LmNvbW1pdCgpO1xuICAgICAgICBsZXQgcHV0dGVyQ2IgPSBwdXR0ZXJUeC5jb21taXQoKTtcblxuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdHhDYihwdXR0ZXJDYigpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl90YWtlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFrZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgdGFrZSh0cmFuc2FjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5kcmFpbih0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHRoZW4oZm4sIGVycikge1xuICAgIHJldHVybiB0aGlzLnRha2UoKS50aGVuKGZuLCBlcnIpO1xuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgdGhpcy5faXNPcGVuID0gZmFsc2U7XG5cbiAgICB3aGlsZSAodGhpcy5fdGFrZXJzLmxlbmd0aCkge1xuICAgICAgbGV0IHRha2VyID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICBpZih0YWtlci5hY3RpdmUpIHtcbiAgICAgICAgdGFrZXIuY29tbWl0KCkobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IG9wZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzT3BlbjtcbiAgfVxufVxuXG5cbmV4cG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfTsiLCJsZXQgZGVmYXVsdEFzeW5jaHJvbml6ZXIgPSAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJykgPyBmdW5jdGlvbihmbikge1xuICByZXR1cm4gc2V0SW1tZWRpYXRlKGZuKTtcbn0gOiBmdW5jdGlvbihmbikge1xuICByZXR1cm4gc2V0VGltZW91dChmbik7XG59O1xuXG5jbGFzcyBEaXNwYXRjaCB7XG4gIGNvbnN0cnVjdG9yKGFzeW5jaHJvbml6ZXIpIHtcbiAgICB0aGlzLl9hc3luY2hyb25pemVyID0gYXN5bmNocm9uaXplciB8fCBkZWZhdWx0QXN5bmNocm9uaXplcjtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICB9XG5cbiAgcnVuKGZuKSB7XG4gICAgdGhpcy5fcXVldWUucHVzaChmbik7XG5cbiAgICB0aGlzLl9hc3luY2hyb25pemVyKCgpID0+IHtcbiAgICAgIHdoaWxlKHRoaXMuX3F1ZXVlLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuXG5leHBvcnQgeyBEaXNwYXRjaCB9OyIsImltcG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfSBmcm9tIFwiLi9jaGFubmVsLmpzXCI7XG5pbXBvcnQgeyBGaXhlZEJ1ZmZlciwgRHJvcHBpbmdCdWZmZXIsIFNsaWRpbmdCdWZmZXIsIFJpbmdCdWZmZXIgfSBmcm9tIFwiLi9idWZmZXJzLmpzXCI7XG5pbXBvcnQgeyBNdWx0IH0gZnJvbSBcIi4vbXVsdC5qc1wiO1xuaW1wb3J0IHsgYWx0cywgdGltZW91dCwgcGlwZSwgaW50b0FycmF5LCBvcmRlciB9IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5cbmV4cG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IsIEZpeGVkQnVmZmVyLCBEcm9wcGluZ0J1ZmZlciwgU2xpZGluZ0J1ZmZlciwgUmluZ0J1ZmZlciwgTXVsdCwgYWx0cywgdGltZW91dCwgcGlwZSwgaW50b0FycmF5LCBvcmRlciB9OyIsImltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5cbmZ1bmN0aW9uIGRpc3RyaWJ1dGUodGFwcywgdmFsKSB7XG4gIGlmKCF0YXBzLmxlbmd0aCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgWyB0YXAsIC4uLnJlc3QgXSA9IHRhcHM7XG5cbiAgICByZXR1cm4gdGFwLnB1dCh2YWwpLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGRpc3RyaWJ1dGUocmVzdCwgdmFsKTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBNdWx0IHtcblxuICBjb25zdHJ1Y3RvcihjaCkge1xuICAgIHRoaXMuX3RhcHMgPSBbXTtcbiAgICB0aGlzLl9mcmVlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICBjaC50YWtlKCkudGhlbihmdW5jdGlvbiBkcmFpbkxvb3Aodikge1xuICAgICAgaWYodiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBjbGVhbnVwXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gTG9ja3MgdGhlIGxpc3Qgb2YgdGFwcyB1bnRpbCB0aGUgZGlzdHJpYnV0aW9uIGlzIGNvbXBsZXRlXG4gICAgICBsZXQgZG9GcmVlLCBmcmVlID0gbmV3IFByb21pc2UociA9PiBkb0ZyZWUgPSByKTtcblxuICAgICAgdGhpcy5fZnJlZSA9IGZyZWU7XG5cbiAgICAgIGRpc3RyaWJ1dGUodGFwcywgdikudGhlbigoKSA9PiB7XG4gICAgICAgIGRvRnJlZSgpO1xuICAgICAgICBjaC50YWtlKCkudGhlbihkcmFpbkxvb3ApO1xuICAgICAgfSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHRhcChjaCwgY2xvc2UpIHtcbiAgICBpZih0aGlzLl90YXBzLnNvbWUodCA9PiB0LmNoID09PSBjaCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGFkZCB0aGUgc2FtZSBjaGFubmVsIHRvIGEgbXVsdCB0d2ljZVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZnJlZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RhcHMucHVzaCh7IGNsb3NlOiBjbG9zZSwgY2g6IGNoIH0pO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0pO1xuICB9XG5cbiAgdW50YXAoY2gpIHtcbiAgICByZXR1cm4gdGhpcy5fZnJlZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RhcHMgPSB0aGlzLl90YXBzLmZpbHRlcih0YXAgPT4ge1xuICAgICAgICByZXR1cm4gdGFwLmNoICE9PSBjaDtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0pO1xuICB9XG5cbn1cblxuZXhwb3J0IHsgTXVsdCB9OyIsInZhciBfUHJvbWlzZTtcblxuaWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LlByb21pc2UpIHtcbiAgX1Byb21pc2UgPSB3aW5kb3cuUHJvbWlzZTtcbn0gZWxzZSBpZih0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiBnbG9iYWwuUHJvbWlzZSkge1xuICBfUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlO1xufSBlbHNlIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGZpbmQgbmF0aXZlIHByb21pc2UgaW1wbGVtZW50YXRpb24uXCIpO1xufVxuXG5leHBvcnQgeyBfUHJvbWlzZSBhcyBQcm9taXNlIH07XG4iLCJpbXBvcnQgeyBDaGFubmVsLCBUcmFuc2FjdG9yIH0gZnJvbSBcIi4vY2hhbm5lbC5qc1wiO1xuXG5cbmNsYXNzIEFsdHNUcmFuc2FjdG9yIGV4dGVuZHMgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyLCBjb21taXRDYikge1xuICAgIHN1cGVyKG9mZmVyKTtcbiAgICB0aGlzLmNvbW1pdENiID0gY29tbWl0Q2I7XG4gIH1cbiAgY29tbWl0KCkge1xuICAgIHRoaXMuY29tbWl0Q2IoKTtcbiAgICByZXR1cm4gc3VwZXIuY29tbWl0KCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWx0cyhyYWNlKSB7XG4gIGxldCB0cmFuc2FjdG9ycyA9IFtdO1xuICBsZXQgb3V0Q2ggPSBuZXcgQ2hhbm5lbCgpO1xuXG4gIGxldCBkZWFjdGl2YXRlID0gKCkgPT4geyB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSkgfVxuXG4gIHJhY2UubWFwKGNtZCA9PiB7XG5cbiAgICBpZihBcnJheS5pc0FycmF5KGNtZCkpIHtcbiAgICAgIGxldCB0eCA9IG5ldyBBbHRzVHJhbnNhY3Rvcih2YWwsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBsZXQgWyBjaCwgdmFsIF0gPSBjbWQ7XG4gICAgICBjaC5wdXQodmFsLCB0eCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgb3V0Q2gucHV0KFsgdmFsLCBjaCBdKTtcbiAgICAgIH0pO1xuXG4gICAgICB0cmFuc2FjdG9ycy5wdXNoKHR4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHR4ID0gbmV3IEFsdHNUcmFuc2FjdG9yKHRydWUsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG5cbiAgICAgIGNtZC50YWtlKHR4KS50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBvdXRDaC5wdXQoWyB2YWwsIGNtZCBdKTtcbiAgICAgIH0pO1xuXG4gICAgICB0cmFuc2FjdG9ycy5wdXNoKHR4KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvdXRDaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVvdXQobXMpIHtcbiAgdmFyIGNoID0gbmV3IENoYW5uZWwoKTtcbiAgc2V0VGltZW91dCgoKSA9PiB7IGNoLmNsb3NlKCk7IH0sIG1zKTtcbiAgcmV0dXJuIGNoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGlwZShpbkNoLCBvdXRDaCwgY2xvc2UgPSB0cnVlKSB7XG4gIGluQ2gudGFrZSgpLnRoZW4oZnVuY3Rpb24gcGlwZSh2KSB7XG4gICAgaWYodiAhPT0gbnVsbCkge1xuICAgICAgb3V0Q2gucHV0KHYpLnRoZW4oKCkgPT4gaW5DaC50YWtlKCkudGhlbihwaXBlKSk7XG4gICAgfSBlbHNlIGlmKGNsb3NlKSB7XG4gICAgICBvdXRDaC5jbG9zZSgpO1xuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRvQXJyYXkoY2gpIHtcbiAgdmFyIHJldCA9IFtdO1xuICByZXR1cm4gY2gudGFrZSgpLnRoZW4oZnVuY3Rpb24gZHJhaW4odikge1xuICAgIGlmKHYgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiByZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldC5wdXNoKHYpO1xuICAgICAgcmV0dXJuIGNoLnRha2UoKS50aGVuKGRyYWluKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBFbmZvcmNlcyBvcmRlciByZXNvbHV0aW9uIG9uIHJlc3VsdGluZyBjaGFubmVsXG4vLyBUaGlzIG1pZ2h0IG5lZWQgdG8gYmUgdGhlIGRlZmF1bHQgYmVoYXZpb3IsIHRob3VnaCB0aGF0IHJlcXVpcmVzIG1vcmUgdGhvdWdodFxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyKGluY2gsIHNpemVPckJ1Zikge1xuICB2YXIgb3V0Y2ggPSBuZXcgQ2hhbm5lbChzaXplT3JCdWYpO1xuXG4gIGZ1bmN0aW9uIGRyYWluKCkge1xuICAgIGluY2gudGFrZSgpLnRoZW4odmFsID0+IHtcbiAgICAgIGlmKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICBvdXRjaC5jbG9zZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0Y2gucHV0KHZhbCkudGhlbihkcmFpbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZHJhaW4oKTtcblxuICByZXR1cm4gb3V0Y2g7XG59IiwiXG5pbXBvcnQgeyBDaGFubmVsLCBSaW5nQnVmZmVyLCBGaXhlZEJ1ZmZlciwgU2xpZGluZ0J1ZmZlciwgRHJvcHBpbmdCdWZmZXIsIGFsdHMsIHRpbWVvdXQsIG9yZGVyIH0gZnJvbSBcIi4uL3NyYy9jaGFubmVscy9pbmRleC5qc1wiO1xuXG5mdW5jdGlvbiBhc3NlcnQoZXhwciwgdmFsLCBtc2cgPSBgRXhwZWN0ZWQgJHt2YWx9LCByZWNlaXZlZCAke2V4cHJ9YCkge1xuICBpZihleHByICE9PSB2YWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgfVxuXG4vLyAgY29uc29sZS5sb2coXCJBU1NFUlRcIiwgZXhwciwgdmFsKTtcbn1cblxuZnVuY3Rpb24gZmFpbFRlc3QobXNnKSB7XG4gIHRocm93IG5ldyBFcnJvcihtc2cpO1xufVxuXG5mdW5jdGlvbiBjaGFubmVsVGVzdChjaGFucywgdGVzdCkge1xuICBsZXQgam9pbnQgPSBjaGFucy5tYXAoYyA9PiB7XG4gICAgbGV0IHJlc29sdmVyLCBwcm9taXNlID0gbmV3IFByb21pc2UociA9PiByZXNvbHZlciA9IHIpO1xuICAgIGxldCBjbG9zZSA9IGMuY2xvc2U7XG5cbiAgICBjLmNsb3NlID0gKCkgPT4ge1xuICAgICAgY2xvc2UuY2FsbChjKTtcbiAgICAgIHJlc29sdmVyKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH0pO1xuXG4gIHRlc3QuYXBwbHkobnVsbCwgY2hhbnMpO1xuXG4gIHJldHVybiBQcm9taXNlLmFsbChqb2ludCk7XG59XG5cbmZ1bmN0aW9uIGhvaXN0KGZuLCAuLi5hcmdzKSB7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICB9XG59XG5cbi8vID09PSBCRUdJTiBURVNUUyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbi8vIFN5bmNocm9ub3VzIHRlc3RzOlxuKCgpID0+IHtcbiAgLypcbiAgVGhlIFJpbmdCdWZmZXIgaXMgdGhlIGJhc2lzIG9uIHdoaWNoIGFsbCB0aGUgYnVmZmVycyBhcmUgYnVpbHQuIEl0J3MgZGlmZmljdWx0IHRvIHVzZSwgc28geW91IHByb2JhYmx5IHdvbid0IGV2ZXJcbiAgd2FudCB0byB1c2UgaXQuIFVzZSB0aGUgaGlnaGVyLWxldmVsIEZpeGVkQnVmZmVyLCBEcm9wcGluZ0J1ZmZlciwgYW5kIFNsaWRpbmdCdWZmZXIgaW5zdGVhZFxuICAgKi9cbiAgbGV0IGJ1ZiA9IG5ldyBSaW5nQnVmZmVyKDApO1xuXG4gIGJ1Zi5yZXNpemluZ1Vuc2hpZnQoMTApO1xuICBhc3NlcnQoYnVmLnBvcCgpLCAxMCk7XG5cbiAgYnVmLnJlc2l6aW5nVW5zaGlmdCgyMCk7XG4gIGFzc2VydChidWYucG9wKCksIDIwKTtcblxuICBsZXQgaSA9IDIwMDtcbiAgd2hpbGUoaSAtLSkge1xuICAgIGJ1Zi5yZXNpemluZ1Vuc2hpZnQoaSk7XG4gIH1cbiAgd2hpbGUoYnVmLmxlbmd0aCkge1xuICAgIGFzc2VydChidWYucG9wKCksIGJ1Zi5sZW5ndGgpO1xuICB9XG5cbn0pKCk7XG5cbigoKSA9PiB7XG4gIGxldCBidWYgPSBuZXcgRml4ZWRCdWZmZXIoMSk7XG5cbiAgYnVmLmFkZCgxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgdHJ1ZSk7XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDEwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG5cbiAgYnVmLmFkZCgyMCk7XG4gIGFzc2VydChidWYuZnVsbCwgdHJ1ZSk7XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDIwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG5cbn0pKCk7XG5cbigoKSA9PiB7XG4gIGxldCBidWYgPSBuZXcgU2xpZGluZ0J1ZmZlcigxKTtcblxuICBidWYuYWRkKDEwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDEwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG5cbiAgYnVmLmFkZCgyMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBidWYuYWRkKDMwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDMwKTtcblxuICBsZXQgaSA9IDIwMDtcbiAgd2hpbGUoaSAtLSkge1xuICAgIGJ1Zi5hZGQoaSk7XG4gIH1cbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMCk7XG5cblxufSkoKTtcblxuKCgpID0+IHtcblxuICBsZXQgYnVmID0gbmV3IERyb3BwaW5nQnVmZmVyKDEpO1xuXG4gIGJ1Zi5hZGQoMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcblxuICBidWYuYWRkKDIwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG4gIGJ1Zi5hZGQoMzApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMjApO1xuXG4gIGxldCBpID0gMjAwO1xuICB3aGlsZShpIC0tKSB7XG4gICAgYnVmLmFkZChpKTtcbiAgfVxuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAxOTkpO1xuXG59KSgpO1xuXG4vLyBBc3luY2hyb25vdXMgdGVzdHM6XG5jaGFubmVsVGVzdChbIG5ldyBDaGFubmVsKDMpIF0sIGNoYW5uZWwgPT4ge1xuICAvKlxuICAgUHV0IHRocmVlIHZhbHVlcyBvbiBhIGNoYW5uZWwgLS0gMSwgMiwgMyAtLSBhbmQgdGhlbiByZW1vdmUgdGhlbS5cbiAgICovXG5cbiAgY2hhbm5lbC5wdXQoMSk7XG4gIGNoYW5uZWwucHV0KDIpO1xuICBjaGFubmVsLnB1dCgzKTtcblxuICBQcm9taXNlLmFsbChbXG5cbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMSkpLFxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAyKSksXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDMpKVxuXG4gIF0pLnRoZW4oKCkgPT4gY2hhbm5lbC5jbG9zZSgpKTtcblxufSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbChuZXcgU2xpZGluZ0J1ZmZlcigyKSkgXSwgKGNoYW5uZWwpID0+IHtcbiAgLypcbiAgIFB1dCB0aHJlZSB2YWx1ZXMgb24gYSBjaGFubmVsIC0tIDEsIDIsIDMsIG5vdGljZSB0aGUgc2xpZGluZyBidWZmZXIgZHJvcHMgdGhlIGZpcnN0IHZhbHVlXG4gICAqL1xuXG4gIGNoYW5uZWwucHV0KDEpO1xuICBjaGFubmVsLnB1dCgyKTtcbiAgY2hhbm5lbC5wdXQoMyk7XG5cbiAgUHJvbWlzZS5hbGwoW1xuXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDIpKSxcbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMykpXG5cbiAgXSkudGhlbigoKSA9PiBjaGFubmVsLmNsb3NlKCkpO1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbChuZXcgRHJvcHBpbmdCdWZmZXIoMikpIF0sIGNoYW5uZWwgPT4ge1xuICAvKlxuICAgUHV0IHRocmVlIHZhbHVlcyBvbiBhIGNoYW5uZWwgLS0gMSwgMiwgMywgbm90aWNlIHRoZSBkcm9wcGluZyBidWZmZXIgaWdub3JlcyBhZGRpdGlvbmFsIHB1dHNcbiAgICovXG5cbiAgY2hhbm5lbC5wdXQoMSk7XG4gIGNoYW5uZWwucHV0KDIpO1xuICBjaGFubmVsLnB1dCgzKTtcblxuICBQcm9taXNlLmFsbChbXG5cbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMSkpLFxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAyKSlcblxuICBdKS50aGVuKCgpID0+IGNoYW5uZWwuY2xvc2UoKSk7XG5cbiAgY2hhbm5lbC5jbG9zZSgpO1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbCgpLCBuZXcgQ2hhbm5lbCgpLCBuZXcgQ2hhbm5lbCgpIF0sIChjaGFuMSwgY2hhbjIsIGNoYW4zKSA9PiB7XG5cbiAgLypcbiAgUHV0IGEgdmFsdWUgb250byB0aHJlZSBkaWZmZXJlbnQgY2hhbm5lbHMgYXQgZGlmZmVyZW50IHRpbWVzIGFuZCB1c2UgUHJvbWlzZS5hbGwgdG8gd2FpdCBvbiB0aGUgdGhyZWUgdmFsdWVzLFxuICBiZWNhdXNlIGNoYW5uZWxzIGJlaGF2ZSBpbiBwcm9taXNlLWxpa2Ugd2F5cyAod2l0aCBzb21lIG5vdGFibGUgZXhjZXB0aW9ucykuXG5cbiAgV2hlbiB0aGUgdGhyZWUgY2hhbm5lbHMgcHJvZHVjZSBhIHZhbHVlLCBwdWxsIGFnYWluIGZyb20gdGhlIGZpcnN0IGNoYW5uZWwuXG4gICAqL1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNoYW4xLnB1dChcIkhlbGxvIVwiKTsgICAgICAgICAgICAgICB9LCAzNSk7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNoYW4yLnB1dChcIkhvdyBhcmUgeW91P1wiKTsgICAgICAgICB9LCAxMCk7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNoYW4zLnB1dChcIlZlcnkgZ29vZC5cIik7ICAgICAgICAgICB9LCA1MCk7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNoYW4xLnB1dChcIlRoYW5rIHlvdSB2ZXJ5IG11Y2guXCIpOyB9LCA0MCk7XG5cbiAgUHJvbWlzZS5hbGwoWyBjaGFuMSwgY2hhbjIsIGNoYW4zIF0pLnRoZW4oKFsgXzEsIF8yLCBfMyBdKSA9PiB7XG4gICAgYXNzZXJ0KF8xLCBcIkhlbGxvIVwiKTtcbiAgICBhc3NlcnQoXzIsIFwiSG93IGFyZSB5b3U/XCIpO1xuICAgIGFzc2VydChfMywgXCJWZXJ5IGdvb2QuXCIpO1xuXG4gICAgcmV0dXJuIGNoYW4xLnRha2UoKTtcblxuICB9KS50aGVuKHYgPT4ge1xuICAgIGFzc2VydCh2LCBcIlRoYW5rIHlvdSB2ZXJ5IG11Y2guXCIpO1xuXG4gICAgY2hhbjEuY2xvc2UoKTtcbiAgICBjaGFuMi5jbG9zZSgpO1xuICAgIGNoYW4zLmNsb3NlKCk7XG4gIH0pO1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbCgpIF0sIChjaGFubmVsKSA9PiB7XG4gIC8qXG4gIFlvdSBjYW4gcHV0IGEgcHJvbWlzZSBjaGFpbiBvbiBhIGNoYW5uZWwsIGFuZCBpdCB3aWxsIGF1dG9tYXRpY2FsbHkgdW53cmFwIHRoZSBwcm9taXNlLlxuICAgKi9cblxuICBmdW5jdGlvbiB3YWl0KG51bSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9LCBudW0pO1xuICAgIH0pO1xuICB9XG5cbiAgY2hhbm5lbC5wdXQod2FpdCgxMDApLnRoZW4oKCkgPT4gMTAwKSk7XG4gIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IHtcbiAgICBhc3NlcnQodiwgMTAwKTtcbiAgICBjaGFubmVsLmNsb3NlKCk7XG4gIH0pO1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgW10sICgpID0+IHtcbiAgLypcbiAgQnV0IHNvbWV0aW1lcyB5b3UgZG9uJ3Qgd2FudCB0byB1bndyYXAgcHJvbWlzZXMsIHNvIHlvdSdsbCBuZWVkIHRvIHVzZSB0aGUgY2FsbGJhY2sgYXBpOlxuICAgKi9cbiAgLy8gVE9ET1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbCgpLCBuZXcgQ2hhbm5lbCgpLCBuZXcgQ2hhbm5lbCgpIF0sIChjaGFuMSwgY2hhbjIsIGNoYW4zKSA9PiB7XG4gIC8qXG4gIFNvbWV0aW1lcyB5b3Ugd2FudCB0byBjb21wbGV0ZSBvbmx5IG9uZSBvZiBtYW55IG9wZXJhdGlvbnMgb24gYSBzZXQgb2YgY2hhbm5lbHNcbiAgICovXG5cbiAgbGV0IGFsdHMxID0gYWx0cyhbIGNoYW4xLCBjaGFuMiBdKS50YWtlKCkudGhlbigoW3ZhbCwgY2hhbl0pID0+IHtcbiAgICBhc3NlcnQoY2hhbiwgY2hhbjIpO1xuICAgIGFzc2VydCh2YWwsIDEwMCk7XG5cbiAgfSk7XG5cbiAgbGV0IGFsdHMyID0gYWx0cyhbIGNoYW4xLCBjaGFuMiBdKS50YWtlKCkudGhlbigoWyB2YWwsIGNoYW4gXSkgPT4ge1xuICAgIGFzc2VydChjaGFuLCBjaGFuMSk7XG4gICAgYXNzZXJ0KHZhbCwgMjAwKTtcbiAgfSk7XG5cbiAgLy8gWW91IGNhbiBcInB1dFwiIHRvIGEgY2hhbm5lbCBpbiBhbiBhbHRzIGJ5IHBhc3NpbmcgYW4gYXJyYXlcbiAgbGV0IGFsdHMzID0gYWx0cyhbIGNoYW4xLCBjaGFuMiwgWyBjaGFuMywgMzAwIF0gXSkudGFrZSgpLnRoZW4oKFsgdmFsLCBjaGFuIF0pID0+IHtcbiAgICBhc3NlcnQoY2hhbiwgY2hhbjMpO1xuICAgIGFzc2VydCh2YWwsIDMwMCk7XG4gIH0pO1xuXG4gIGNoYW4zLnRha2UoKTtcbiAgY2hhbjIucHV0KDEwMCk7XG4gIGNoYW4xLnB1dCgyMDApO1xuXG4gIFByb21pc2UuYWxsKFsgYWx0czEsIGFsdHMyLCBhbHRzMyBdKS50aGVuKCgpID0+IHtcbiAgICBjaGFuMS5jbG9zZSgpO1xuICAgIGNoYW4yLmNsb3NlKCk7XG4gICAgY2hhbjMuY2xvc2UoKTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCkgXSwgKGNoYW5uZWwpID0+IHtcbiAgLypcbiAgIEl0J3MgZWFzeSB0byBvcmRlciBhIGNoYW5uZWwgYnkgaXRzIGFkZGVkIGRhdGUgdXNpbmcgdGhlIGBvcmRlcmAgZnVuY3Rpb24sIHdoaWNoIHRha2VzIGEgY2hhbm5lbCBhbmQgcmV0dXJuc1xuICAgYSBzdHJpY3RseSBvcmRlcmVkIHZlcnNpb24gb2YgaXRzIGFzeW5jaHJvbm91cyB2YWx1ZXMgKGFzc3VtZXMgdGhvc2UgdmFsdWVzIGFyZSBwcm9taXNlcylcblxuICAgVGhpcyBpcyB1c2VmdWwgZm9yIHRha2luZyBhIGNoYW5uZWwgb2YgUHJvbWlzZTxIdHRwUmVxdWVzdDxWYWx1ZT4+IGFuZCB0cmFuc2xhdGluZyBpdCB0byBQcm9taXNlPFZhbHVlPlxuICAgKi9cblxuICB2YXIgb3JkZXJlZCA9IG9yZGVyKGNoYW5uZWwpO1xuXG4gIGNoYW5uZWwucHV0KHRpbWVvdXQoMjAwKS50aGVuKCgpID0+IDIwMCkpO1xuICBjaGFubmVsLnB1dCh0aW1lb3V0KDEwMCkudGhlbigoKSA9PiAxMDApKTtcblxuICAvLyAoTm90ZSB5b3UgY2FuIHB1dCB0aGUgc2FtZSBjaGFubmVsIGludG8gYSBQcm9taXNlLmFsbCBtYW55IHRpbWVzKVxuICBQcm9taXNlLmFsbChbIG9yZGVyZWQsIG9yZGVyZWQgXSkudGhlbigoWyBmaXJzdCwgc2Vjb25kIF0pID0+IHtcbiAgICBhc3NlcnQoZmlyc3QsIDIwMCk7XG4gICAgYXNzZXJ0KHNlY29uZCwgMTAwKTtcbiAgICBjaGFubmVsLmNsb3NlKCk7XG4gIH0pO1xuXG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCkgXSwgKGNoYW5uZWwpID0+IHtcblxuICBjaGFubmVsLnB1dChuZXcgUHJvbWlzZSgoKSA9PiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gIH0pKTtcblxuICBjaGFubmVsLnB1dCgxMDApO1xuXG4gIGxldCBmYWlsdXJlID0gY2hhbm5lbC50YWtlKCkudGhlbih2ID0+IGZhaWxUZXN0KFwiU2hvdWxkIGhhdmUgZXZhbHVhdGVkIHRvIGFuIGVycm9yXCIpLCBlID0+IHt9KTtcbiAgbGV0IHN1Y2Nlc3MgPSBjaGFubmVsLnRha2UoKS50aGVuKHYgPT4gYXNzZXJ0KHYsIDEwMCkpO1xuXG4gIFByb21pc2UuYWxsKFsgZmFpbHVyZSwgc3VjY2Vzc10pLnRoZW4oKCkgPT4gY2hhbm5lbC5jbG9zZSgpKTtcblxufSkpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coXCJUZXN0cyBjb21wbGV0ZS5cIikpO1xuIl19
