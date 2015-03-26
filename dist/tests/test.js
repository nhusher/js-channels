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
    cleanup: {
      value: function cleanup(keep) {
        for (var i = 0, l = this.length; i < l; i += 1) {
          var item = this.pop();

          if (keep(item)) {
            this.unshift(item);
          }
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
        if (this.full) {
          throw new Error("Cannot add to a full buffer.");
        }
        this._buf.resizingUnshift(v);

        return this;
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

        return this;
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

        return this;
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

var transducers = require("./transducers.js").transducers;

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
  function Channel(sizeOrBuf, xform) {
    _classCallCheck(this, Channel);

    if (!transducers && xform) {
      console.info("Using a transducer requires transducers-js <https://github.com/cognitect-labs/transducers-js>");
    }
    if (!sizeOrBuf && xform && transducers) {
      console.info("Transducers will be ignored for unbuffered channels.");
    }

    // Adds value to the buffer:
    // doAdd() => Buffer
    // doAdd(val) => Buffer
    var doAdd = function (buf, val) {
      return buf.add(val);
    };

    this._buffer = sizeOrBuf instanceof FixedBuffer ? sizeOrBuf : new FixedBuffer(sizeOrBuf || 0);
    this._takers = new RingBuffer(32);
    this._putters = new RingBuffer(32);
    this._xformer = xform && transducers ? xform(transducers.wrap(doAdd)) : doAdd;

    this._isOpen = true;
  }

  _createClass(Channel, {
    _insert: {
      value: function _insert(val) {
        if (transducers) {
          if (val) {
            return this._xformer.step(this._buffer, val);
          } else {
            return this._xformer.result(this._buffer);
          }
        } else if (val) {
          this._xformer(this._buffer, val);
        }
        return false;
      }
    },
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

            var done = transducers ? transducers.reduced(_this._insert(val)) : _this._insert(val);

            while (_this._takers.length && _this._buffer.length) {
              var takerTx = _this._takers.pop();

              if (takerTx.active) {
                (function () {
                  var v = _this._buffer.remove();
                  var takerCb = takerTx.commit();

                  dispatch.run(function () {
                    return takerCb(v);
                  });
                })();
              }
            }
            if (done) {
              _this.close();
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
                var takerCb = takerTx.commit();

                dispatch.run(function () {
                  return takerCb(val);
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
            var putter = this._putters.pop();

            if (putter.active) {
              (function () {
                var putTx = putter.commit(),
                    val = putter.offered; // Kinda breaking the rules here

                dispatch.run(function () {
                  return putTx();
                });
                _this._insert(val);
              })();
            }
          }

          tx.commit()(bufVal);
        } else if (this._putters.length) {
          var putter = this._putters.pop();

          while (this._putters.length && !putter.active) {
            putter = this._putters.pop();
          }

          if (putter && putter.active) {
            (function () {
              var txCb = tx.commit(),
                  putTx = putter.commit(),
                  val = putter.offered;

              dispatch.run(function () {
                return putTx();
              });
              txCb(val);
            })();
          } else if (!this.open) {
            this._insert();

            var txCb = tx.commit();

            if (this._buffer.length) {
              txCb(this._buffer.remove());
            } else {
              txCb(null);
            }
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
        var _this = this;

        if (this.open) {
          this._isOpen = false;

          if (this._putters.length === 0) {
            this._insert();
          }

          while (this._takers.length) {
            var taker = this._takers.pop();

            if (taker.active) {
              (function () {
                var val = _this._buffer.length ? _this._buffer.remove() : null,
                    takerCb = taker.commit();

                dispatch.run(function () {
                  return takerCb(val);
                });
              })();
            }
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

},{"./buffers.js":1,"./dispatch.js":3,"./promise.js":5,"./transducers.js":6}],3:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

/* global setImmediate:true */
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
            //console.log("QUEUE", this._queue[0]);
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

var _channelsJs = require("./channels.js");

var Channel = _channelsJs.Channel;
var Transactor = _channelsJs.Transactor;

var _buffersJs = require("./buffers.js");

var FixedBuffer = _buffersJs.FixedBuffer;
var DroppingBuffer = _buffersJs.DroppingBuffer;
var SlidingBuffer = _buffersJs.SlidingBuffer;
var RingBuffer = _buffersJs.RingBuffer;

var _utilsJs = require("./utils.js");

var alts = _utilsJs.alts;
var timeout = _utilsJs.timeout;
var order = _utilsJs.order;
var map = _utilsJs.map;
var filter = _utilsJs.filter;
var partitionBy = _utilsJs.partitionBy;
var partition = _utilsJs.partition;
exports.Channel = Channel;
exports.Transactor = Transactor;
exports.FixedBuffer = FixedBuffer;
exports.DroppingBuffer = DroppingBuffer;
exports.SlidingBuffer = SlidingBuffer;
exports.RingBuffer = RingBuffer;
exports.alts = alts;
exports.timeout = timeout;
exports.order = order;
exports.map = map;
exports.filter = filter;
exports.partitionBy = partitionBy;
exports.partition = partition;

},{"./buffers.js":1,"./channels.js":2,"./utils.js":7}],5:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _Promise;

/* global global:true */
if (typeof window !== "undefined" && window.Promise) {
  _Promise = window.Promise;
} else if (typeof global !== "undefined" && global.Promise) {
  _Promise = global.Promise;
} else {
  throw new Error("Unable to find native promise implementation.");
}

exports.Promise = _Promise;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],6:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _transducers = false;

/* global require:true */
if (typeof window !== "undefined" && window.transducers) {
  _transducers = window.transducers;
} else if (typeof global !== "undefined") {
  var r = require; // Trick browserify
  try {
    _transducers = r("transducers-js");
  } catch (e) {}
}

exports.transducers = _transducers;

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
exports.pipelineAsync = pipelineAsync;

// Enforces order resolution on resulting channel
// This might need to be the default behavior, though that requires more thought
exports.order = order;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _channelsJs = require("./channels.js");

var Channel = _channelsJs.Channel;
var Transactor = _channelsJs.Transactor;

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
  var outCh = new Channel();

  var transactors = race.map(function (cmd) {
    var tx = undefined;

    if (Array.isArray(cmd)) {
      var _cmd;

      (function () {
        _cmd = _slicedToArray(cmd, 2);
        var ch = _cmd[0];
        var val = _cmd[1];

        tx = new AltsTransactor(val, function () {
          transactors.forEach(function (h) {
            return h.active = false;
          });
        });

        ch.fill(val, tx).deref(function () {
          outCh.fill([val, ch]).deref(function () {
            return outCh.close();
          });
        });
      })();
    } else {

      tx = new AltsTransactor(true, function () {
        transactors.forEach(function (h) {
          return h.active = false;
        });
      });

      cmd.drain(tx).deref(function (val) {
        outCh.fill([val, cmd]).deref(function () {
          return outCh.close();
        });
      });
    }

    return tx;
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

function pipelineAsync(inch, converter, outch) {
  var shouldCloseDownstream = arguments[3] === undefined ? false : arguments[3];

  function take(val) {
    if (val !== null) {
      Promise.resolve(converter(val)).then(function (converted) {
        outch.put(converted).then(function (didPut) {
          if (didPut) {
            inch.take().then(take);
          }
        });
      });
    } else if (shouldCloseDownstream) {
      outch.close();
    }
  }

  inch.take().then(take);
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

},{"./channels.js":2}],8:[function(require,module,exports){
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
var map = _srcChannelsIndexJs.map;
var filter = _srcChannelsIndexJs.filter;
var partitionBy = _srcChannelsIndexJs.partitionBy;
var partition = _srcChannelsIndexJs.partition;

// Nick's ad-hoc testing tools:

function assert(expr, val) {
  var msg = arguments[2] === undefined ? "Expected " + val + ", received " + expr : arguments[2];
  return (function () {
    if (expr !== val) {
      throw new Error(msg);
    }
  })();
}

function failTest(msg) {
  throw new Error(msg);
}

// Pass in some channels and the test will finish when all the channels are closed
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
  /*
  A FixedBuffer holds a fixed number of items and no more. It will throw an exception if you attempt to add values to
  it when it is full. A buffer is a FIFO construct.
   */
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
  /*
  The SlidingBuffer
   */
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

  var failure = channel.take().then(function () {
    return failTest("Should have evaluated to an error");
  }, function () {});
  var success = channel.take().then(function (v) {
    return assert(v, 100);
  });

  Promise.all([failure, success]).then(function () {
    return channel.close();
  });
})).then(hoist(channelTest, [new Channel()], function (channel) {

  channel.put(100).then(function () {
    channel.take().then(function (v) {
      assert(v, 200);
      channel.close();
    });
  });

  // The above code will deadlock if the next block isn't there, because the put is halted on a zero-length buf

  timeout(100).then(function () {
    channel.take().then(function (v) {
      assert(v, 100);
      channel.put(200);
    });
  });
})).then(hoist(channelTest, [new Channel()], function (channel) {

  channel.put(100);
  channel.put(200);
  channel.close();

  channel.take().then(function (v) {
    return assert(v, 100);
  });
  channel.take().then(function (v) {
    return assert(v, 200);
  });
})).then(function () {
  return console.log("Tests complete.");
});

/*
But sometimes you don't want to unwrap promises, so you'll need to use the callback api:
 */
// TODO

},{"../src/channels/index.js":4}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbmh1c2hlci9Qcm9qZWN0cy9qcy1hc3luYy9zcmMvY2hhbm5lbHMvYnVmZmVycy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9jaGFubmVscy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9kaXNwYXRjaC5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9pbmRleC5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9wcm9taXNlLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvc3JjL2NoYW5uZWxzL3RyYW5zZHVjZXJzLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvc3JjL2NoYW5uZWxzL3V0aWxzLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvdGVzdC90ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FDSUEsU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUNyRCxPQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDakMsUUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO0dBQ3pDO0NBQ0Y7Ozs7SUFJSyxVQUFVO0FBQ0gsV0FEUCxVQUFVLENBQ0YsQ0FBQyxFQUFFOzBCQURYLFVBQVU7O0FBRVosUUFBSSxJQUFJLEdB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IGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8vXG4vLyBUT0RPOiB0aGlzIGlzbid0IGlkaW9tYXRpY2FsbHkgamF2YXNjcmlwdCAoY291bGQgcHJvYmFibHkgdXNlIHNsaWNlL3NwbGljZSB0byBnb29kIGVmZmVjdClcbi8vXG5mdW5jdGlvbiBhY29weShzcmMsIHNyY1N0YXJ0LCBkZXN0LCBkZXN0U3RhcnQsIGxlbmd0aCkge1xuICBmb3IobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBkZXN0W2kgKyBkZXN0U3RhcnRdID0gc3JjW2kgKyBzcmNTdGFydF07XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgUmluZ0J1ZmZlciB7XG4gIGNvbnN0cnVjdG9yKHMpIHtcbiAgICBsZXQgc2l6ZSA9ICh0eXBlb2YgcyA9PT0gJ251bWJlcicpID8gTWF0aC5tYXgoMSwgcykgOiAxO1xuICAgIHRoaXMuX3RhaWwgICA9IDA7XG4gICAgdGhpcy5faGVhZCAgID0gMDtcbiAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgIHRoaXMuX3ZhbHVlcyA9IG5ldyBBcnJheShzaXplKTtcbiAgfVxuXG4gIHBvcCgpIHtcbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmKHRoaXMubGVuZ3RoKSB7XG4gICAgICAvLyBHZXQgdGhlIGl0ZW0gb3V0IG9mIHRoZSBzZXQgb2YgdmFsdWVzXG4gICAgICByZXN1bHQgPSAodGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdICE9PSBudWxsKSA/IHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSA6IG51bGw7XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgaXRlbSBmcm9tIHRoZSBzZXQgb2YgdmFsdWVzLCB1cGRhdGUgaW5kaWNpZXNcbiAgICAgIHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSA9IG51bGw7XG4gICAgICB0aGlzLl90YWlsID0gKHRoaXMuX3RhaWwgKyAxKSAlIHRoaXMuX3ZhbHVlcy5sZW5ndGg7XG4gICAgICB0aGlzLl9sZW5ndGggLT0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHVuc2hpZnQodmFsKSB7XG4gICAgdGhpcy5fdmFsdWVzW3RoaXMuX2hlYWRdID0gdmFsO1xuICAgIHRoaXMuX2hlYWQgPSAodGhpcy5faGVhZCArIDEpICUgdGhpcy5fdmFsdWVzLmxlbmd0aDtcbiAgICB0aGlzLl9sZW5ndGggKz0gMTtcbiAgfVxuXG4gIHJlc2l6aW5nVW5zaGlmdCh2YWwpIHtcbiAgICBpZih0aGlzLmxlbmd0aCArIDEgPT09IHRoaXMuX3ZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVzaXplKCk7XG4gICAgfVxuICAgIHRoaXMudW5zaGlmdCh2YWwpO1xuICB9XG5cbiAgcmVzaXplKCkge1xuICAgIGxldCBuZXdBcnJ5ID0gbmV3IEFycmF5KHRoaXMuX3ZhbHVlcy5sZW5ndGggKiAyKTtcblxuICAgIGlmKHRoaXMuX3RhaWwgPCB0aGlzLl9oZWFkKSB7XG4gICAgICBhY29weSh0aGlzLl92YWx1ZXMsIHRoaXMuX3RhaWwsIG5ld0FycnksIDAsIHRoaXMuX2hlYWQpO1xuXG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSB0aGlzLmxlbmd0aDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG5cbiAgICB9IGVsc2UgaWYodGhpcy5faGVhZCA8IHRoaXMuX3RhaWwpIHtcbiAgICAgIGFjb3B5KHRoaXMuX3ZhbHVlcywgMCwgbmV3QXJyeSwgdGhpcy5fdmFsdWVzLmxlbmd0aCAtIHRoaXMuX3RhaWwsIHRoaXMuX2hlYWQpO1xuXG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSB0aGlzLmxlbmd0aDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gMDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG4gICAgfVxuICB9XG5cbiAgY2xlYW51cChrZWVwKSB7XG4gICAgZm9yKGxldCBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICBsZXQgaXRlbSA9IHRoaXMucG9wKCk7XG5cbiAgICAgIGlmKGtlZXAoaXRlbSkpIHtcbiAgICAgICAgdGhpcy51bnNoaWZ0KGl0ZW0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBGaXhlZEJ1ZmZlciB7XG4gIGNvbnN0cnVjdG9yKG4pIHtcbiAgICB0aGlzLl9idWYgPSBuZXcgUmluZ0J1ZmZlcihuKTtcbiAgICB0aGlzLl9zaXplID0gbjtcbiAgfVxuXG4gIHJlbW92ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLnBvcCgpO1xuICB9XG5cbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLmZ1bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBhZGQgdG8gYSBmdWxsIGJ1ZmZlci5cIik7XG4gICAgfVxuICAgIHRoaXMuX2J1Zi5yZXNpemluZ1Vuc2hpZnQodik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5sZW5ndGg7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBEcm9wcGluZ0J1ZmZlciBleHRlbmRzIEZpeGVkQnVmZmVyIHtcbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLl9idWYubGVuZ3RoIDwgdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgU2xpZGluZ0J1ZmZlciBleHRlbmRzIEZpeGVkQnVmZmVyIHtcbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLl9idWYubGVuZ3RoID09PSB0aGlzLl9zaXplKSB7XG4gICAgICB0aGlzLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLl9idWYudW5zaGlmdCh2KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCB7IERyb3BwaW5nQnVmZmVyLCBTbGlkaW5nQnVmZmVyLCBGaXhlZEJ1ZmZlciwgUmluZ0J1ZmZlciB9OyIsIlxuaW1wb3J0IHsgRml4ZWRCdWZmZXIsIFJpbmdCdWZmZXIgfSBmcm9tIFwiLi9idWZmZXJzLmpzXCI7XG5pbXBvcnQgeyBEaXNwYXRjaCB9IGZyb20gXCIuL2Rpc3BhdGNoLmpzXCI7XG5pbXBvcnQgeyBQcm9taXNlIH0gZnJvbSBcIi4vcHJvbWlzZS5qc1wiO1xuaW1wb3J0IHsgdHJhbnNkdWNlcnMgfSBmcm9tIFwiLi90cmFuc2R1Y2Vycy5qc1wiO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBUcmFuc2FjdG9yIHtcbiAgY29uc3RydWN0b3Iob2ZmZXIpIHtcbiAgICB0aGlzLm9mZmVyZWQgPSBvZmZlcjtcbiAgICB0aGlzLnJlY2VpdmVkID0gbnVsbDtcbiAgICB0aGlzLnJlc29sdmVkID0gZmFsc2U7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG4gIH1cblxuICBjb21taXQoKSB7XG4gICAgcmV0dXJuICh2YWwpID0+IHtcbiAgICAgIGlmKHRoaXMucmVzb2x2ZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHJpZWQgdG8gcmVzb2x2ZSB0cmFuc2FjdG9yIHR3aWNlIVwiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVjZWl2ZWQgPSB2YWw7XG4gICAgICB0aGlzLnJlc29sdmVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLmZvckVhY2goYyA9PiBjKHZhbCkpO1xuXG4gICAgICByZXR1cm4gdGhpcy5vZmZlcmVkO1xuICAgIH07XG4gIH1cblxuICBkZXJlZihjYWxsYmFjaykge1xuICAgIGlmKHRoaXMucmVzb2x2ZWQpIHtcbiAgICAgIGNhbGxiYWNrKHRoaXMucmVjZWl2ZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5sZXQgZGlzcGF0Y2ggPSBuZXcgRGlzcGF0Y2goKTtcblxuY2xhc3MgQ2hhbm5lbCB7XG4gIGNvbnN0cnVjdG9yKHNpemVPckJ1ZiwgeGZvcm0pIHtcbiAgICBpZighdHJhbnNkdWNlcnMgJiYgeGZvcm0pIHtcbiAgICAgIGNvbnNvbGUuaW5mbyhcIlVzaW5nIGEgdHJhbnNkdWNlciByZXF1aXJlcyB0cmFuc2R1Y2Vycy1qcyA8aHR0cHM6Ly9naXRodWIuY29tL2NvZ25pdGVjdC1sYWJzL3RyYW5zZHVjZXJzLWpzPlwiKTtcbiAgICB9XG4gICAgaWYoIXNpemVPckJ1ZiAmJiB4Zm9ybSAmJiB0cmFuc2R1Y2Vycykge1xuICAgICAgY29uc29sZS5pbmZvKFwiVHJhbnNkdWNlcnMgd2lsbCBiZSBpZ25vcmVkIGZvciB1bmJ1ZmZlcmVkIGNoYW5uZWxzLlwiKTtcbiAgICB9XG5cbiAgICAvLyBBZGRzIHZhbHVlIHRvIHRoZSBidWZmZXI6XG4gICAgLy8gZG9BZGQoKSA9PiBCdWZmZXJcbiAgICAvLyBkb0FkZCh2YWwpID0+IEJ1ZmZlclxuICAgIGxldCBkb0FkZCA9IChidWYsIHZhbCkgPT4gYnVmLmFkZCh2YWwpO1xuXG4gICAgdGhpcy5fYnVmZmVyICAgID0gKHNpemVPckJ1ZiBpbnN0YW5jZW9mIEZpeGVkQnVmZmVyKSA/IHNpemVPckJ1ZiA6IG5ldyBGaXhlZEJ1ZmZlcihzaXplT3JCdWYgfHwgMCk7XG4gICAgdGhpcy5fdGFrZXJzICAgID0gbmV3IFJpbmdCdWZmZXIoMzIpO1xuICAgIHRoaXMuX3B1dHRlcnMgICA9IG5ldyBSaW5nQnVmZmVyKDMyKTtcbiAgICB0aGlzLl94Zm9ybWVyICAgPSB4Zm9ybSAmJiB0cmFuc2R1Y2VycyA/IHhmb3JtKHRyYW5zZHVjZXJzLndyYXAoZG9BZGQpKSA6IGRvQWRkO1xuXG4gICAgdGhpcy5faXNPcGVuID0gdHJ1ZTtcbiAgfVxuXG4gIF9pbnNlcnQodmFsKSB7XG4gICAgaWYodHJhbnNkdWNlcnMpIHtcbiAgICAgIGlmKHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5feGZvcm1lci5zdGVwKHRoaXMuX2J1ZmZlciwgdmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl94Zm9ybWVyLnJlc3VsdCh0aGlzLl9idWZmZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZih2YWwpIHtcbiAgICAgIHRoaXMuX3hmb3JtZXIodGhpcy5fYnVmZmVyLCB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmaWxsKHZhbCwgdHggPSBuZXcgVHJhbnNhY3Rvcih2YWwpKSB7XG4gICAgaWYodmFsID09PSBudWxsKSB7IHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBwdXQgbnVsbCB0byBhIGNoYW5uZWwuXCIpOyB9XG4gICAgaWYoISh0eCBpbnN0YW5jZW9mIFRyYW5zYWN0b3IpKSB7IHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBUcmFuc2FjdG9yIHRvIGJlIHBhc3NlZCB0byBmaWxsXCIpOyB9XG4gICAgaWYoIXR4LmFjdGl2ZSkgeyByZXR1cm4gdHg7IH1cblxuICAgIGlmKCF0aGlzLm9wZW4pIHtcbiAgICAgIC8vIEVpdGhlciBzb21lYm9keSBoYXMgcmVzb2x2ZWQgdGhlIGhhbmRsZXIgYWxyZWFkeSAodGhhdCB3YXMgZmFzdCkgb3IgdGhlIGNoYW5uZWwgaXMgY2xvc2VkLlxuICAgICAgLy8gY29yZS5hc3luYyByZXR1cm5zIGEgYm9vbGVhbiBvZiB3aGV0aGVyIG9yIG5vdCBzb21ldGhpbmcgKmNvdWxkKiBnZXQgcHV0IHRvIHRoZSBjaGFubmVsXG4gICAgICAvLyB3ZSdsbCBkbyB0aGUgc2FtZSAjY2FyZ29jdWx0XG4gICAgICB0eC5jb21taXQoKShmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYoIXRoaXMuX2J1ZmZlci5mdWxsKSB7XG4gICAgICAvLyBUaGUgY2hhbm5lbCBoYXMgc29tZSBmcmVlIHNwYWNlLiBTdGljayBpdCBpbiB0aGUgYnVmZmVyIGFuZCB0aGVuIGRyYWluIGFueSB3YWl0aW5nIHRha2VzLlxuICAgICAgdHguY29tbWl0KCkodHJ1ZSk7XG5cbiAgICAgIGxldCBkb25lID0gdHJhbnNkdWNlcnMgPyB0cmFuc2R1Y2Vycy5yZWR1Y2VkKHRoaXMuX2luc2VydCh2YWwpKSA6IHRoaXMuX2luc2VydCh2YWwpO1xuXG4gICAgICB3aGlsZSh0aGlzLl90YWtlcnMubGVuZ3RoICYmIHRoaXMuX2J1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHRha2VyVHggPSB0aGlzLl90YWtlcnMucG9wKCk7XG5cbiAgICAgICAgaWYodGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgICBsZXQgdiA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcbiAgICAgICAgICBsZXQgdGFrZXJDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKGRvbmUpIHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHg7XG4gICAgfSBlbHNlIGlmKHRoaXMuX3Rha2Vycy5sZW5ndGgpIHtcbiAgICAgIC8vIFRoZSBidWZmZXIgaXMgZnVsbCBidXQgdGhlcmUgYXJlIHdhaXRpbmcgdGFrZXJzIChlLmcuIHRoZSBidWZmZXIgaXMgc2l6ZSB6ZXJvKVxuXG4gICAgICBsZXQgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiAhdGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYodGFrZXJUeCAmJiB0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgICAgbGV0IHRha2VyQ2IgPSB0YWtlclR4LmNvbW1pdCgpO1xuXG4gICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0YWtlckNiKHZhbCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcHV0dGVycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9wdXR0ZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgcHV0KHZhbCwgdHJhbnNhY3Rvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMuZmlsbCh2YWwsIHRyYW5zYWN0b3IpLmRlcmVmKHJlc29sdmUpO1xuICAgIH0pO1xuICB9XG5cbiAgZHJhaW4odHggPSBuZXcgVHJhbnNhY3RvcigpKSB7XG4gICAgaWYoISh0eCBpbnN0YW5jZW9mIFRyYW5zYWN0b3IpKSB7IHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBUcmFuc2FjdG9yIHRvIGJlIHBhc3NlZCB0byBkcmFpblwiKTsgfVxuICAgIGlmKCF0eC5hY3RpdmUpIHsgcmV0dXJuIHR4OyB9XG5cbiAgICBpZih0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICBsZXQgYnVmVmFsID0gdGhpcy5fYnVmZmVyLnJlbW92ZSgpO1xuXG4gICAgICB3aGlsZSghdGhpcy5fYnVmZmVyLmZ1bGwgJiYgdGhpcy5fcHV0dGVycy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG5cbiAgICAgICAgaWYocHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICAgIGxldCBwdXRUeCA9IHB1dHRlci5jb21taXQoKSxcbiAgICAgICAgICAgICAgdmFsID0gcHV0dGVyLm9mZmVyZWQ7IC8vIEtpbmRhIGJyZWFraW5nIHRoZSBydWxlcyBoZXJlXG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gcHV0VHgoKSk7XG4gICAgICAgICAgdGhpcy5faW5zZXJ0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdHguY29tbWl0KCkoYnVmVmFsKTtcbiAgICB9IGVsc2UgaWYodGhpcy5fcHV0dGVycy5sZW5ndGgpIHtcbiAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuXG4gICAgICB3aGlsZSh0aGlzLl9wdXR0ZXJzLmxlbmd0aCAmJiAhcHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZihwdXR0ZXIgJiYgcHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICBsZXQgdHhDYiA9IHR4LmNvbW1pdCgpLFxuICAgICAgICAgICAgcHV0VHggPSBwdXR0ZXIuY29tbWl0KCksXG4gICAgICAgICAgICB2YWwgPSBwdXR0ZXIub2ZmZXJlZDtcblxuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gcHV0VHgoKSk7XG4gICAgICAgIHR4Q2IodmFsKTtcbiAgICAgIH0gZWxzZSBpZighdGhpcy5vcGVuKSB7XG4gICAgICAgIHRoaXMuX2luc2VydCgpO1xuXG4gICAgICAgIGxldCB0eENiID0gdHguY29tbWl0KCk7XG5cbiAgICAgICAgaWYodGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgIHR4Q2IodGhpcy5fYnVmZmVyLnJlbW92ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0eENiKG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl90YWtlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFrZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgdGFrZSh0cmFuc2FjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5kcmFpbih0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHRoZW4oZm4sIGVycikge1xuICAgIHJldHVybiB0aGlzLnRha2UoKS50aGVuKGZuLCBlcnIpO1xuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgaWYodGhpcy5vcGVuKSB7XG4gICAgICB0aGlzLl9pc09wZW4gPSBmYWxzZTtcblxuICAgICAgaWYodGhpcy5fcHV0dGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5faW5zZXJ0KCk7XG4gICAgICB9XG5cbiAgICAgIHdoaWxlICh0aGlzLl90YWtlcnMubGVuZ3RoKSB7XG4gICAgICAgIGxldCB0YWtlciA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgICBpZih0YWtlci5hY3RpdmUpIHtcbiAgICAgICAgICBsZXQgdmFsID0gdGhpcy5fYnVmZmVyLmxlbmd0aCA/IHRoaXMuX2J1ZmZlci5yZW1vdmUoKSA6IG51bGwsXG4gICAgICAgICAgICAgIHRha2VyQ2IgPSB0YWtlci5jb21taXQoKTtcblxuICAgICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0YWtlckNiKHZhbCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IG9wZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzT3BlbjtcbiAgfVxufVxuXG5leHBvcnQgeyBDaGFubmVsLCBUcmFuc2FjdG9yIH07IiwiXG4vKiBnbG9iYWwgc2V0SW1tZWRpYXRlOnRydWUgKi9cbmxldCBkZWZhdWx0QXN5bmNocm9uaXplciA9ICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSA/IGZ1bmN0aW9uKGZuKSB7XG4gIHJldHVybiBzZXRJbW1lZGlhdGUoZm4pO1xufSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHJldHVybiBzZXRUaW1lb3V0KGZuKTtcbn07XG5cbmNsYXNzIERpc3BhdGNoIHtcbiAgY29uc3RydWN0b3IoYXN5bmNocm9uaXplcikge1xuICAgIHRoaXMuX2FzeW5jaHJvbml6ZXIgPSBhc3luY2hyb25pemVyIHx8IGRlZmF1bHRBc3luY2hyb25pemVyO1xuICAgIHRoaXMuX3F1ZXVlID0gW107XG4gIH1cblxuICBydW4oZm4pIHtcbiAgICB0aGlzLl9xdWV1ZS5wdXNoKGZuKTtcblxuICAgIHRoaXMuX2FzeW5jaHJvbml6ZXIoKCkgPT4ge1xuICAgICAgd2hpbGUodGhpcy5fcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJRVUVVRVwiLCB0aGlzLl9xdWV1ZVswXSk7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnNoaWZ0KCkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5cbmV4cG9ydCB7IERpc3BhdGNoIH07IiwiaW1wb3J0IHsgQ2hhbm5lbCwgVHJhbnNhY3RvciB9IGZyb20gXCIuL2NoYW5uZWxzLmpzXCI7XG5pbXBvcnQgeyBGaXhlZEJ1ZmZlciwgRHJvcHBpbmdCdWZmZXIsIFNsaWRpbmdCdWZmZXIsIFJpbmdCdWZmZXIgfSBmcm9tIFwiLi9idWZmZXJzLmpzXCI7XG5pbXBvcnQgeyBhbHRzLCB0aW1lb3V0LCBvcmRlciwgbWFwLCBmaWx0ZXIsIHBhcnRpdGlvbkJ5LCBwYXJ0aXRpb24gfSBmcm9tIFwiLi91dGlscy5qc1wiO1xuXG5leHBvcnQge1xuICAgIENoYW5uZWwsXG4gICAgVHJhbnNhY3RvcixcbiAgICBGaXhlZEJ1ZmZlcixcbiAgICBEcm9wcGluZ0J1ZmZlcixcbiAgICBTbGlkaW5nQnVmZmVyLFxuICAgIFJpbmdCdWZmZXIsXG4gICAgYWx0cyxcbiAgICB0aW1lb3V0LFxuICAgIG9yZGVyLFxuICAgIG1hcCxcbiAgICBmaWx0ZXIsXG4gICAgcGFydGl0aW9uQnksXG4gICAgcGFydGl0aW9uXG59OyIsInZhciBfUHJvbWlzZTtcblxuLyogZ2xvYmFsIGdsb2JhbDp0cnVlICovXG5pZih0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuUHJvbWlzZSkge1xuICBfUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlO1xufSBlbHNlIGlmKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbC5Qcm9taXNlKSB7XG4gIF9Qcm9taXNlID0gZ2xvYmFsLlByb21pc2U7XG59IGVsc2Uge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gZmluZCBuYXRpdmUgcHJvbWlzZSBpbXBsZW1lbnRhdGlvbi5cIik7XG59XG5cbmV4cG9ydCB7IF9Qcm9taXNlIGFzIFByb21pc2UgfTtcbiIsInZhciBfdHJhbnNkdWNlcnMgPSBmYWxzZTtcblxuLyogZ2xvYmFsIHJlcXVpcmU6dHJ1ZSAqL1xuaWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnRyYW5zZHVjZXJzKSB7XG4gIF90cmFuc2R1Y2VycyA9IHdpbmRvdy50cmFuc2R1Y2Vycztcbn0gZWxzZSBpZih0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICBsZXQgciA9IHJlcXVpcmU7IC8vIFRyaWNrIGJyb3dzZXJpZnlcbiAgdHJ5IHtcbiAgICBfdHJhbnNkdWNlcnMgPSByKCd0cmFuc2R1Y2Vycy1qcycpO1xuICB9IGNhdGNoIChlKSB7fVxufVxuXG5leHBvcnQgeyBfdHJhbnNkdWNlcnMgYXMgdHJhbnNkdWNlcnMgfTtcbiIsImltcG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfSBmcm9tIFwiLi9jaGFubmVscy5qc1wiO1xuXG5cbmNsYXNzIEFsdHNUcmFuc2FjdG9yIGV4dGVuZHMgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyLCBjb21taXRDYikge1xuICAgIHN1cGVyKG9mZmVyKTtcbiAgICB0aGlzLmNvbW1pdENiID0gY29tbWl0Q2I7XG4gIH1cbiAgY29tbWl0KCkge1xuICAgIHRoaXMuY29tbWl0Q2IoKTtcbiAgICByZXR1cm4gc3VwZXIuY29tbWl0KCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWx0cyhyYWNlKSB7XG4gIGxldCBvdXRDaCA9IG5ldyBDaGFubmVsKCk7XG5cbiAgbGV0IHRyYW5zYWN0b3JzID0gcmFjZS5tYXAoY21kID0+IHtcbiAgICBsZXQgdHg7XG5cbiAgICBpZihBcnJheS5pc0FycmF5KGNtZCkpIHtcbiAgICAgIGxldCBbIGNoLCB2YWwgXSA9IGNtZDtcblxuICAgICAgdHggPSBuZXcgQWx0c1RyYW5zYWN0b3IodmFsLCAoKSA9PiB7XG4gICAgICAgIHRyYW5zYWN0b3JzLmZvckVhY2goaCA9PiBoLmFjdGl2ZSA9IGZhbHNlKTtcbiAgICAgIH0pO1xuXG4gICAgICBjaC5maWxsKHZhbCwgdHgpLmRlcmVmKGZ1bmN0aW9uKCkge1xuICAgICAgICBvdXRDaC5maWxsKFsgdmFsLCBjaCBdKS5kZXJlZigoKSA9PiBvdXRDaC5jbG9zZSgpKTtcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgdHggPSBuZXcgQWx0c1RyYW5zYWN0b3IodHJ1ZSwgKCkgPT4ge1xuICAgICAgICB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSk7XG4gICAgICB9KTtcblxuICAgICAgY21kLmRyYWluKHR4KS5kZXJlZihmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgb3V0Q2guZmlsbChbIHZhbCwgY21kIF0pLmRlcmVmKCgpID0+IG91dENoLmNsb3NlKCkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9KTtcblxuICByZXR1cm4gb3V0Q2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lb3V0KG1zKSB7XG4gIHZhciBjaCA9IG5ldyBDaGFubmVsKCk7XG4gIHNldFRpbWVvdXQoKCkgPT4geyBjaC5jbG9zZSgpOyB9LCBtcyk7XG4gIHJldHVybiBjaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBpcGVsaW5lQXN5bmMoaW5jaCwgY29udmVydGVyLCBvdXRjaCwgc2hvdWxkQ2xvc2VEb3duc3RyZWFtID0gZmFsc2UpIHtcbiAgZnVuY3Rpb24gdGFrZSh2YWwpIHtcbiAgICBpZih2YWwgIT09IG51bGwpIHtcbiAgICAgIFByb21pc2UucmVzb2x2ZShjb252ZXJ0ZXIodmFsKSkudGhlbihmdW5jdGlvbihjb252ZXJ0ZWQpIHtcbiAgICAgICAgb3V0Y2gucHV0KGNvbnZlcnRlZCkudGhlbihmdW5jdGlvbihkaWRQdXQpIHtcbiAgICAgICAgICBpZihkaWRQdXQpIHtcbiAgICAgICAgICAgIGluY2gudGFrZSgpLnRoZW4odGFrZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZihzaG91bGRDbG9zZURvd25zdHJlYW0pIHtcbiAgICAgIG91dGNoLmNsb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgaW5jaC50YWtlKCkudGhlbih0YWtlKTtcbn1cblxuLy8gRW5mb3JjZXMgb3JkZXIgcmVzb2x1dGlvbiBvbiByZXN1bHRpbmcgY2hhbm5lbFxuLy8gVGhpcyBtaWdodCBuZWVkIHRvIGJlIHRoZSBkZWZhdWx0IGJlaGF2aW9yLCB0aG91Z2ggdGhhdCByZXF1aXJlcyBtb3JlIHRob3VnaHRcbmV4cG9ydCBmdW5jdGlvbiBvcmRlcihpbmNoLCBzaXplT3JCdWYpIHtcbiAgdmFyIG91dGNoID0gbmV3IENoYW5uZWwoc2l6ZU9yQnVmKTtcblxuICBmdW5jdGlvbiBkcmFpbigpIHtcbiAgICBpbmNoLnRha2UoKS50aGVuKHZhbCA9PiB7XG4gICAgICBpZih2YWwgPT09IG51bGwpIHtcbiAgICAgICAgb3V0Y2guY2xvc2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dGNoLnB1dCh2YWwpLnRoZW4oZHJhaW4pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGRyYWluKCk7XG5cbiAgcmV0dXJuIG91dGNoO1xufVxuIiwiXG5pbXBvcnQge1xuICAgIENoYW5uZWwsXG4gICAgUmluZ0J1ZmZlcixcbiAgICBGaXhlZEJ1ZmZlcixcbiAgICBTbGlkaW5nQnVmZmVyLFxuICAgIERyb3BwaW5nQnVmZmVyLFxuICAgIGFsdHMsXG4gICAgdGltZW91dCxcbiAgICBvcmRlcixcbiAgICBtYXAsXG4gICAgZmlsdGVyLFxuICAgIHBhcnRpdGlvbkJ5LFxuICAgIHBhcnRpdGlvblxufSBmcm9tIFwiLi4vc3JjL2NoYW5uZWxzL2luZGV4LmpzXCI7XG5cbi8vIE5pY2sncyBhZC1ob2MgdGVzdGluZyB0b29sczpcblxuZnVuY3Rpb24gYXNzZXJ0KGV4cHIsIHZhbCwgbXNnID0gYEV4cGVjdGVkICR7dmFsfSwgcmVjZWl2ZWQgJHtleHByfWApIHtcbiAgaWYoZXhwciAhPT0gdmFsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmFpbFRlc3QobXNnKSB7XG4gIHRocm93IG5ldyBFcnJvcihtc2cpO1xufVxuXG4vLyBQYXNzIGluIHNvbWUgY2hhbm5lbHMgYW5kIHRoZSB0ZXN0IHdpbGwgZmluaXNoIHdoZW4gYWxsIHRoZSBjaGFubmVscyBhcmUgY2xvc2VkXG5mdW5jdGlvbiBjaGFubmVsVGVzdChjaGFucywgdGVzdCkge1xuICBsZXQgam9pbnQgPSBjaGFucy5tYXAoYyA9PiB7XG4gICAgbGV0IHJlc29sdmVyLCBwcm9taXNlID0gbmV3IFByb21pc2UociA9PiByZXNvbHZlciA9IHIpO1xuICAgIHZhciBjbG9zZSA9IGMuY2xvc2U7XG5cbiAgICBjLmNsb3NlID0gKCkgPT4ge1xuICAgICAgY2xvc2UuY2FsbChjKTtcbiAgICAgIHJlc29sdmVyKCk7XG4gICAgfTtcblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9KTtcblxuICB0ZXN0LmFwcGx5KG51bGwsIGNoYW5zKTtcblxuICByZXR1cm4gUHJvbWlzZS5hbGwoam9pbnQpO1xufVxuXG5mdW5jdGlvbiBob2lzdChmbiwgLi4uYXJncykge1xuICByZXR1cm4gKCkgPT4ge1xuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgfTtcbn1cblxuLy8gPT09IEJFR0lOIFRFU1RTID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuLy8gU3luY2hyb25vdXMgdGVzdHM6XG4oKCkgPT4ge1xuICAvKlxuICBUaGUgUmluZ0J1ZmZlciBpcyB0aGUgYmFzaXMgb24gd2hpY2ggYWxsIHRoZSBidWZmZXJzIGFyZSBidWlsdC4gSXQncyBkaWZmaWN1bHQgdG8gdXNlLCBzbyB5b3UgcHJvYmFibHkgd29uJ3QgZXZlclxuICB3YW50IHRvIHVzZSBpdC4gVXNlIHRoZSBoaWdoZXItbGV2ZWwgRml4ZWRCdWZmZXIsIERyb3BwaW5nQnVmZmVyLCBhbmQgU2xpZGluZ0J1ZmZlciBpbnN0ZWFkXG4gICAqL1xuICBsZXQgYnVmID0gbmV3IFJpbmdCdWZmZXIoMCk7XG5cbiAgYnVmLnJlc2l6aW5nVW5zaGlmdCgxMCk7XG4gIGFzc2VydChidWYucG9wKCksIDEwKTtcblxuICBidWYucmVzaXppbmdVbnNoaWZ0KDIwKTtcbiAgYXNzZXJ0KGJ1Zi5wb3AoKSwgMjApO1xuXG4gIGxldCBpID0gMjAwO1xuICB3aGlsZShpIC0tKSB7XG4gICAgYnVmLnJlc2l6aW5nVW5zaGlmdChpKTtcbiAgfVxuICB3aGlsZShidWYubGVuZ3RoKSB7XG4gICAgYXNzZXJ0KGJ1Zi5wb3AoKSwgYnVmLmxlbmd0aCk7XG4gIH1cblxufSkoKTtcblxuKCgpID0+IHtcbiAgLypcbiAgQSBGaXhlZEJ1ZmZlciBob2xkcyBhIGZpeGVkIG51bWJlciBvZiBpdGVtcyBhbmQgbm8gbW9yZS4gSXQgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgeW91IGF0dGVtcHQgdG8gYWRkIHZhbHVlcyB0b1xuICBpdCB3aGVuIGl0IGlzIGZ1bGwuIEEgYnVmZmVyIGlzIGEgRklGTyBjb25zdHJ1Y3QuXG4gICAqL1xuICBsZXQgYnVmID0gbmV3IEZpeGVkQnVmZmVyKDEpO1xuXG4gIGJ1Zi5hZGQoMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIHRydWUpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG4gIGJ1Zi5hZGQoMjApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIHRydWUpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAyMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG59KSgpO1xuXG4oKCkgPT4ge1xuICAvKlxuICBUaGUgU2xpZGluZ0J1ZmZlclxuICAgKi9cbiAgbGV0IGJ1ZiA9IG5ldyBTbGlkaW5nQnVmZmVyKDEpO1xuXG4gIGJ1Zi5hZGQoMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcblxuICBidWYuYWRkKDIwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG4gIGJ1Zi5hZGQoMzApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMzApO1xuXG4gIGxldCBpID0gMjAwO1xuICB3aGlsZShpIC0tKSB7XG4gICAgYnVmLmFkZChpKTtcbiAgfVxuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAwKTtcblxuXG59KSgpO1xuXG4oKCkgPT4ge1xuXG4gIGxldCBidWYgPSBuZXcgRHJvcHBpbmdCdWZmZXIoMSk7XG5cbiAgYnVmLmFkZCgxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG4gIGJ1Zi5hZGQoMjApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYnVmLmFkZCgzMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAyMCk7XG5cbiAgbGV0IGkgPSAyMDA7XG4gIHdoaWxlKGkgLS0pIHtcbiAgICBidWYuYWRkKGkpO1xuICB9XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDE5OSk7XG5cbn0pKCk7XG5cbi8vIEFzeW5jaHJvbm91cyB0ZXN0czpcbmNoYW5uZWxUZXN0KFsgbmV3IENoYW5uZWwoMykgXSwgY2hhbm5lbCA9PiB7XG4gIC8qXG4gICBQdXQgdGhyZWUgdmFsdWVzIG9uIGEgY2hhbm5lbCAtLSAxLCAyLCAzIC0tIGFuZCB0aGVuIHJlbW92ZSB0aGVtLlxuICAgKi9cblxuICBjaGFubmVsLnB1dCgxKTtcbiAgY2hhbm5lbC5wdXQoMik7XG4gIGNoYW5uZWwucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAxKSksXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDIpKSxcbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMykpXG5cbiAgXSkudGhlbigoKSA9PiBjaGFubmVsLmNsb3NlKCkpO1xuXG59KS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKG5ldyBTbGlkaW5nQnVmZmVyKDIpKSBdLCAoY2hhbm5lbCkgPT4ge1xuICAvKlxuICAgUHV0IHRocmVlIHZhbHVlcyBvbiBhIGNoYW5uZWwgLS0gMSwgMiwgMywgbm90aWNlIHRoZSBzbGlkaW5nIGJ1ZmZlciBkcm9wcyB0aGUgZmlyc3QgdmFsdWVcbiAgICovXG5cbiAgY2hhbm5lbC5wdXQoMSk7XG4gIGNoYW5uZWwucHV0KDIpO1xuICBjaGFubmVsLnB1dCgzKTtcblxuICBQcm9taXNlLmFsbChbXG5cbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMikpLFxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAzKSlcblxuICBdKS50aGVuKCgpID0+IGNoYW5uZWwuY2xvc2UoKSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKG5ldyBEcm9wcGluZ0J1ZmZlcigyKSkgXSwgY2hhbm5lbCA9PiB7XG4gIC8qXG4gICBQdXQgdGhyZWUgdmFsdWVzIG9uIGEgY2hhbm5lbCAtLSAxLCAyLCAzLCBub3RpY2UgdGhlIGRyb3BwaW5nIGJ1ZmZlciBpZ25vcmVzIGFkZGl0aW9uYWwgcHV0c1xuICAgKi9cblxuICBjaGFubmVsLnB1dCgxKTtcbiAgY2hhbm5lbC5wdXQoMik7XG4gIGNoYW5uZWwucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAxKSksXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDIpKVxuXG4gIF0pLnRoZW4oKCkgPT4gY2hhbm5lbC5jbG9zZSgpKTtcblxuICBjaGFubmVsLmNsb3NlKCk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCkgXSwgKGNoYW4xLCBjaGFuMiwgY2hhbjMpID0+IHtcblxuICAvKlxuICBQdXQgYSB2YWx1ZSBvbnRvIHRocmVlIGRpZmZlcmVudCBjaGFubmVscyBhdCBkaWZmZXJlbnQgdGltZXMgYW5kIHVzZSBQcm9taXNlLmFsbCB0byB3YWl0IG9uIHRoZSB0aHJlZSB2YWx1ZXMsXG4gIGJlY2F1c2UgY2hhbm5lbHMgYmVoYXZlIGluIHByb21pc2UtbGlrZSB3YXlzICh3aXRoIHNvbWUgbm90YWJsZSBleGNlcHRpb25zKS5cblxuICBXaGVuIHRoZSB0aHJlZSBjaGFubmVscyBwcm9kdWNlIGEgdmFsdWUsIHB1bGwgYWdhaW4gZnJvbSB0aGUgZmlyc3QgY2hhbm5lbC5cbiAgICovXG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjEucHV0KFwiSGVsbG8hXCIpOyAgICAgICAgICAgICAgIH0sIDM1KTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjIucHV0KFwiSG93IGFyZSB5b3U/XCIpOyAgICAgICAgIH0sIDEwKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjMucHV0KFwiVmVyeSBnb29kLlwiKTsgICAgICAgICAgIH0sIDUwKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjEucHV0KFwiVGhhbmsgeW91IHZlcnkgbXVjaC5cIik7IH0sIDQwKTtcblxuICBQcm9taXNlLmFsbChbIGNoYW4xLCBjaGFuMiwgY2hhbjMgXSkudGhlbigoWyBfMSwgXzIsIF8zIF0pID0+IHtcbiAgICBhc3NlcnQoXzEsIFwiSGVsbG8hXCIpO1xuICAgIGFzc2VydChfMiwgXCJIb3cgYXJlIHlvdT9cIik7XG4gICAgYXNzZXJ0KF8zLCBcIlZlcnkgZ29vZC5cIik7XG5cbiAgICByZXR1cm4gY2hhbjEudGFrZSgpO1xuXG4gIH0pLnRoZW4odiA9PiB7XG4gICAgYXNzZXJ0KHYsIFwiVGhhbmsgeW91IHZlcnkgbXVjaC5cIik7XG5cbiAgICBjaGFuMS5jbG9zZSgpO1xuICAgIGNoYW4yLmNsb3NlKCk7XG4gICAgY2hhbjMuY2xvc2UoKTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCkgXSwgKGNoYW5uZWwpID0+IHtcbiAgLypcbiAgWW91IGNhbiBwdXQgYSBwcm9taXNlIGNoYWluIG9uIGEgY2hhbm5lbCwgYW5kIGl0IHdpbGwgYXV0b21hdGljYWxseSB1bndyYXAgdGhlIHByb21pc2UuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHdhaXQobnVtKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0sIG51bSk7XG4gICAgfSk7XG4gIH1cblxuICBjaGFubmVsLnB1dCh3YWl0KDEwMCkudGhlbigoKSA9PiAxMDApKTtcbiAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4ge1xuICAgIGFzc2VydCh2LCAxMDApO1xuICAgIGNoYW5uZWwuY2xvc2UoKTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXSwgKCkgPT4ge1xuICAvKlxuICBCdXQgc29tZXRpbWVzIHlvdSBkb24ndCB3YW50IHRvIHVud3JhcCBwcm9taXNlcywgc28geW91J2xsIG5lZWQgdG8gdXNlIHRoZSBjYWxsYmFjayBhcGk6XG4gICAqL1xuICAvLyBUT0RPXG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCkgXSwgKGNoYW4xLCBjaGFuMiwgY2hhbjMpID0+IHtcbiAgLypcbiAgU29tZXRpbWVzIHlvdSB3YW50IHRvIGNvbXBsZXRlIG9ubHkgb25lIG9mIG1hbnkgb3BlcmF0aW9ucyBvbiBhIHNldCBvZiBjaGFubmVsc1xuICAgKi9cblxuICBsZXQgYWx0czEgPSBhbHRzKFsgY2hhbjEsIGNoYW4yIF0pLnRha2UoKS50aGVuKChbdmFsLCBjaGFuXSkgPT4ge1xuICAgIGFzc2VydChjaGFuLCBjaGFuMik7XG4gICAgYXNzZXJ0KHZhbCwgMTAwKTtcblxuICB9KTtcblxuICBsZXQgYWx0czIgPSBhbHRzKFsgY2hhbjEsIGNoYW4yIF0pLnRha2UoKS50aGVuKChbIHZhbCwgY2hhbiBdKSA9PiB7XG4gICAgYXNzZXJ0KGNoYW4sIGNoYW4xKTtcbiAgICBhc3NlcnQodmFsLCAyMDApO1xuICB9KTtcblxuICAvLyBZb3UgY2FuIFwicHV0XCIgdG8gYSBjaGFubmVsIGluIGFuIGFsdHMgYnkgcGFzc2luZyBhbiBhcnJheVxuICBsZXQgYWx0czMgPSBhbHRzKFsgY2hhbjEsIGNoYW4yLCBbIGNoYW4zLCAzMDAgXSBdKS50YWtlKCkudGhlbigoWyB2YWwsIGNoYW4gXSkgPT4ge1xuICAgIGFzc2VydChjaGFuLCBjaGFuMyk7XG4gICAgYXNzZXJ0KHZhbCwgMzAwKTtcbiAgfSk7XG5cbiAgY2hhbjMudGFrZSgpO1xuICBjaGFuMi5wdXQoMTAwKTtcbiAgY2hhbjEucHV0KDIwMCk7XG5cbiAgUHJvbWlzZS5hbGwoWyBhbHRzMSwgYWx0czIsIGFsdHMzIF0pLnRoZW4oKCkgPT4ge1xuICAgIGNoYW4xLmNsb3NlKCk7XG4gICAgY2hhbjIuY2xvc2UoKTtcbiAgICBjaGFuMy5jbG9zZSgpO1xuICB9KTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuICAvKlxuICAgSXQncyBlYXN5IHRvIG9yZGVyIGEgY2hhbm5lbCBieSBpdHMgYWRkZWQgZGF0ZSB1c2luZyB0aGUgYG9yZGVyYCBmdW5jdGlvbiwgd2hpY2ggdGFrZXMgYSBjaGFubmVsIGFuZCByZXR1cm5zXG4gICBhIHN0cmljdGx5IG9yZGVyZWQgdmVyc2lvbiBvZiBpdHMgYXN5bmNocm9ub3VzIHZhbHVlcyAoYXNzdW1lcyB0aG9zZSB2YWx1ZXMgYXJlIHByb21pc2VzKVxuXG4gICBUaGlzIGlzIHVzZWZ1bCBmb3IgdGFraW5nIGEgY2hhbm5lbCBvZiBQcm9taXNlPEh0dHBSZXF1ZXN0PFZhbHVlPj4gYW5kIHRyYW5zbGF0aW5nIGl0IHRvIFByb21pc2U8VmFsdWU+XG4gICAqL1xuXG4gIHZhciBvcmRlcmVkID0gb3JkZXIoY2hhbm5lbCk7XG5cbiAgY2hhbm5lbC5wdXQodGltZW91dCgyMDApLnRoZW4oKCkgPT4gMjAwKSk7XG4gIGNoYW5uZWwucHV0KHRpbWVvdXQoMTAwKS50aGVuKCgpID0+IDEwMCkpO1xuXG4gIC8vIChOb3RlIHlvdSBjYW4gcHV0IHRoZSBzYW1lIGNoYW5uZWwgaW50byBhIFByb21pc2UuYWxsIG1hbnkgdGltZXMpXG4gIFByb21pc2UuYWxsKFsgb3JkZXJlZCwgb3JkZXJlZCBdKS50aGVuKChbIGZpcnN0LCBzZWNvbmQgXSkgPT4ge1xuICAgIGFzc2VydChmaXJzdCwgMjAwKTtcbiAgICBhc3NlcnQoc2Vjb25kLCAxMDApO1xuICAgIGNoYW5uZWwuY2xvc2UoKTtcbiAgfSk7XG5cblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuXG4gIGNoYW5uZWwucHV0KG5ldyBQcm9taXNlKCgpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgfSkpO1xuXG4gIGNoYW5uZWwucHV0KDEwMCk7XG5cbiAgbGV0IGZhaWx1cmUgPSBjaGFubmVsLnRha2UoKS50aGVuKCgpID0+IGZhaWxUZXN0KFwiU2hvdWxkIGhhdmUgZXZhbHVhdGVkIHRvIGFuIGVycm9yXCIpLCAoKSA9PiB7fSk7XG4gIGxldCBzdWNjZXNzID0gY2hhbm5lbC50YWtlKCkudGhlbih2ID0+IGFzc2VydCh2LCAxMDApKTtcblxuICBQcm9taXNlLmFsbChbIGZhaWx1cmUsIHN1Y2Nlc3NdKS50aGVuKCgpID0+IGNoYW5uZWwuY2xvc2UoKSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCkgXSwgKGNoYW5uZWwpID0+IHtcblxuICBjaGFubmVsLnB1dCgxMDApLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgY2hhbm5lbC50YWtlKCkudGhlbihmdW5jdGlvbih2KSB7XG4gICAgICBhc3NlcnQodiwgMjAwKTtcbiAgICAgIGNoYW5uZWwuY2xvc2UoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gVGhlIGFib3ZlIGNvZGUgd2lsbCBkZWFkbG9jayBpZiB0aGUgbmV4dCBibG9jayBpc24ndCB0aGVyZSwgYmVjYXVzZSB0aGUgcHV0IGlzIGhhbHRlZCBvbiBhIHplcm8tbGVuZ3RoIGJ1ZlxuXG4gIHRpbWVvdXQoMTAwKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oZnVuY3Rpb24odikge1xuICAgICAgYXNzZXJ0KHYsIDEwMCk7XG4gICAgICBjaGFubmVsLnB1dCgyMDApO1xuICAgIH0pO1xuICB9KTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuXG4gIGNoYW5uZWwucHV0KDEwMCk7XG4gIGNoYW5uZWwucHV0KDIwMCk7XG4gIGNoYW5uZWwuY2xvc2UoKTtcblxuICBjaGFubmVsLnRha2UoKS50aGVuKHYgPT4gYXNzZXJ0KHYsIDEwMCkpO1xuICBjaGFubmVsLnRha2UoKS50aGVuKHYgPT4gYXNzZXJ0KHYsIDIwMCkpO1xuXG5cbn0pKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKFwiVGVzdHMgY29tcGxldGUuXCIpKTtcbiJdfQ==
