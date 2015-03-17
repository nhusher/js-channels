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
            unshift(item);
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

var attempt = function attempt(fn, exh) {
  try {
    return fn();
  } catch (e) {
    return exh(e);
  }
};
var passthrough = function passthrough(next) {
  return function (value) {
    return arguments.length ? next(value) : next();
  };
};
var defaultExHandler = function defaultExHandler(e) {
  console.error(e);return false;
};
var reduced = { reduced: true };

var Channel = (function () {
  function Channel(sizeOrBuf, xform, exceptionHandler) {
    var _this = this;

    var _arguments = arguments;

    _classCallCheck(this, Channel);

    var doAdd = function (val) {
      return _arguments.length ? _this._buffer.add(val) : _this._buffer;
    };

    this._buffer = sizeOrBuf instanceof FixedBuffer ? sizeOrBuf : new FixedBuffer(sizeOrBuf || 0);
    this._takers = new RingBuffer(32);
    this._putters = new RingBuffer(32);
    this._xformer = xform ? xform(doAdd) : passthrough(doAdd);
    this._exHandler = exceptionHandler || defaultExHandler;

    this._isOpen = true;
  }

  _createClass(Channel, {
    _insert: {
      value: function _insert() {
        var _this = this;

        var _arguments = arguments;

        return attempt(function () {
          return _this._xformer.apply(_this, _arguments);
        }, this._exHandler);
      }
    },
    abort: {
      value: function abort() {
        while (this._putters.length) {
          var putter = this._putters.pop();

          if (putter.active) {
            (function () {
              var putterCb = putter.commit();
              dispatch.run(function () {
                return putterCb(true);
              });
            })();
          }
        }
        this._putters.cleanup(function () {
          return false;
        });
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
            var done = attempt(function () {
              return _this._insert(val) === reduced;
            }, _this._exHandler);

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

            if (done) {
              _this.abort();
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
                var done = attempt(function () {
                  return _this._insert(val) === reduced;
                }, _this._exHandler);

                if (done === reduced) {
                  _this.abort();
                }
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
            attempt(function () {
              return _this._insert();
            }, this._exHandler);

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
            attempt(function () {
              return _this._insert();
            }, this._exHandler);
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
    into: {
      value: function into(otherChan, shouldClose) {
        var self = this;

        function into(val) {
          if (val === nil && shouldClose) {
            out.close();
          } else {
            out.put(val).then(function (open) {
              if (!open && shouldClose) {
                self.close();
              } else {
                self.take().then(mapper);
              }
            });
          }
        }

        this.take().then(into);

        return otherChan;
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

Channel.reduced = reduced;

exports.Channel = Channel;
exports.Transactor = Transactor;

},{"./buffers.js":1,"./dispatch.js":3,"./promise.js":5}],3:[function(require,module,exports){
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

},{"./buffers.js":1,"./channels.js":2,"./utils.js":6}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.alts = alts;
exports.timeout = timeout;

// Enforces order resolution on resulting channel
// This might need to be the default behavior, though that requires more thought
exports.order = order;
exports.map = map;
exports.filter = filter;
exports.partitionBy = partitionBy;
exports.partition = partition;
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

function map(fn) {
  return function (next) {
    return function (val) {
      if (arguments.length) {
        return next(fn(val));
      } else {
        return next();
      }
    };
  };
}

function filter(fn) {
  return function (next) {
    return function (val) {
      if (arguments.length) {
        if (fn(val)) {
          return next(val);
        }
      } else {
        return next();
      }
    };
  };
}

function partitionBy(fn) {
  var last = null,
      accumulator = [];

  return function (next) {
    return function (val) {
      if (arguments.length) {
        var predicateResult = fn(val);
        if (last !== null && predicateResult !== last) {
          var tmp = accumulator;

          accumulator = [val];
          last = predicateResult;

          return next(tmp);
        } else {
          last = predicateResult;
          accumulator.push(val);
        }
      } else {
        return next(accumulator);
      }
    };
  };
}

function partition(num) {
  var c = 0,
      a = [];

  return function (next) {
    return function (val) {
      if (arguments.length) {
        a.push(val);
        c += 1;

        if (c % num === 0) {
          var tmp = a;

          a = [];

          return next(tmp);
        }
      } else {
        return next(a);
      }
    };
  };
}

},{"./channels.js":2}],7:[function(require,module,exports){
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

  var failure = channel.take().then(function (v) {
    return failTest("Should have evaluated to an error");
  }, function (e) {});
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
})).then(hoist(channelTest, [new Channel(1, map(function (v) {
  return v * 2;
}))], function (doubler) {

  // Values put on the channel are doubled
  doubler.put(1);
  doubler.put(2);
  doubler.put(3);

  Promise.all([doubler.take().then(function (v) {
    return assert(v, 2);
  }), doubler.take().then(function (v) {
    return assert(v, 4);
  }), doubler.take().then(function (v) {
    return assert(v, 6);
  })]).then(function () {
    return doubler.close();
  });
})).then(hoist(channelTest, [new Channel(1, filter(function (v) {
  return v % 2 === 0;
}))], function (evens) {

  // Values put on the channel are doubled
  evens.put(1);
  evens.put(2);
  evens.put(3);
  evens.put(4);

  Promise.all([evens.take().then(function (v) {
    return assert(v, 2);
  }), evens.take().then(function (v) {
    return assert(v, 4);
  })]).then(function () {
    return evens.close();
  });
})).then(hoist(channelTest, [new Channel(1, partition(2))], function (groups) {

  // Values put on the channel are doubled
  groups.put(1);
  groups.put(2);
  groups.put(3);
  groups.put(4);

  Promise.all([groups.take().then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var _1 = _ref2[0];
    var _2 = _ref2[1];

    assert(_1, 1);
    assert(_2, 2);
  }), groups.take().then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var _3 = _ref2[0];
    var _4 = _ref2[1];

    assert(_3, 3);
    assert(_4, 4);
  })]).then(function () {
    return groups.close();
  });
})).then(hoist(channelTest, [new Channel(10, partitionBy(function (v) {
  var normalized = v.replace(/\W+/g, "").toLowerCase();

  return normalized === normalized.split("").reverse().join("");
}))], function (vals) {

  // Values put on the channel are doubled
  vals.put("tacocat");
  vals.put("racecar");
  vals.put("not a palindrome");
  vals.put("also not a palindrome");
  vals.put("Madam I'm Adam");
  vals.put("Ah, satan sees natasha!");
  vals.put("one last try...");

  Promise.all([vals.take().then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var _1 = _ref2[0];
    var _2 = _ref2[1];

    assert(_1, "tacocat");
    assert(_2, "racecar");
  }), vals.take().then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var _1 = _ref2[0];
    var _2 = _ref2[1];

    assert(_1, "not a palindrome");
    assert(_2, "also not a palindrome");
  }), vals.take().then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var _1 = _ref2[0];
    var _2 = _ref2[1];

    assert(_1, "Madam I'm Adam");
    assert(_2, "Ah, satan sees natasha!");
  })]).then(function () {
    return vals.close();
  });
})).then(function () {
  return console.log("Tests complete.");
});

/*
But sometimes you don't want to unwrap promises, so you'll need to use the callback api:
 */
// TODO

},{"../src/channels/index.js":4}]},{},[7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbmh1c2hlci9Qcm9qZWN0cy9qcy1hc3luYy9zcmMvY2hhbm5lbHMvYnVmZmVycy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9jaGFubmVscy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9kaXNwYXRjaC5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9pbmRleC5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9wcm9taXNlLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvc3JjL2NoYW5uZWxzL3V0aWxzLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvdGVzdC90ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FDSUEsU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUNyRCxPQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDakMsUUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO0dBQ3pDO0NBQ0Y7Ozs7SUFJSyxVQUFVO0FBQ0gsV0FEUCxVQUFVLENBQ0YsQ0FBQyxFQUFFOzBCQURYLFVBQVU7O0FBRVosUUFBSSxJQUFJLEdBQUcsQUFBQyxPQUFPLENBQUMsS0FBSyxRQUFRLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUs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LENBQUMsZ0JBQWM7OztRQUFaLEVBQUU7UUFBRSxFQUFFOztBQUN2QixVQUFNLENBQUMsRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDL0IsVUFBTSxDQUFDLEVBQUUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0dBQ3JDLENBQUMsRUFDRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFjOzs7UUFBWixFQUFFO1FBQUUsRUFBRTs7QUFDdkIsVUFBTSxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzdCLFVBQU0sQ0FBQyxFQUFFLEVBQUUseUJBQXlCLENBQUMsQ0FBQztHQUN2QyxDQUFDLENBQ0gsQ0FBQyxDQUFDLElBQUksQ0FBQztXQUFNLElBQUksQ0FBQyxLQUFLLEVBQUU7R0FBQSxDQUFDLENBQUM7Q0FFN0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1NBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztDQUFBLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8vXG4vLyBUT0RPOiB0aGlzIGlzbid0IGlkaW9tYXRpY2FsbHkgamF2YXNjcmlwdCAoY291bGQgcHJvYmFibHkgdXNlIHNsaWNlL3NwbGljZSB0byBnb29kIGVmZmVjdClcbi8vXG5mdW5jdGlvbiBhY29weShzcmMsIHNyY1N0YXJ0LCBkZXN0LCBkZXN0U3RhcnQsIGxlbmd0aCkge1xuICBmb3IobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBkZXN0W2kgKyBkZXN0U3RhcnRdID0gc3JjW2kgKyBzcmNTdGFydF07XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgUmluZ0J1ZmZlciB7XG4gIGNvbnN0cnVjdG9yKHMpIHtcbiAgICBsZXQgc2l6ZSA9ICh0eXBlb2YgcyA9PT0gJ251bWJlcicpID8gTWF0aC5tYXgoMSwgcykgOiAxO1xuICAgIHRoaXMuX3RhaWwgICA9IDA7XG4gICAgdGhpcy5faGVhZCAgID0gMDtcbiAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgIHRoaXMuX3ZhbHVlcyA9IG5ldyBBcnJheShzaXplKTtcbiAgfVxuXG4gIHBvcCgpIHtcbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmKHRoaXMubGVuZ3RoKSB7XG4gICAgICAvLyBHZXQgdGhlIGl0ZW0gb3V0IG9mIHRoZSBzZXQgb2YgdmFsdWVzXG4gICAgICByZXN1bHQgPSAodGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdICE9PSBudWxsKSA/IHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSA6IG51bGw7XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgaXRlbSBmcm9tIHRoZSBzZXQgb2YgdmFsdWVzLCB1cGRhdGUgaW5kaWNpZXNcbiAgICAgIHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSA9IG51bGw7XG4gICAgICB0aGlzLl90YWlsID0gKHRoaXMuX3RhaWwgKyAxKSAlIHRoaXMuX3ZhbHVlcy5sZW5ndGg7XG4gICAgICB0aGlzLl9sZW5ndGggLT0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHVuc2hpZnQodmFsKSB7XG4gICAgdGhpcy5fdmFsdWVzW3RoaXMuX2hlYWRdID0gdmFsO1xuICAgIHRoaXMuX2hlYWQgPSAodGhpcy5faGVhZCArIDEpICUgdGhpcy5fdmFsdWVzLmxlbmd0aDtcbiAgICB0aGlzLl9sZW5ndGggKz0gMTtcbiAgfVxuXG4gIHJlc2l6aW5nVW5zaGlmdCh2YWwpIHtcbiAgICBpZih0aGlzLmxlbmd0aCArIDEgPT09IHRoaXMuX3ZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVzaXplKCk7XG4gICAgfVxuICAgIHRoaXMudW5zaGlmdCh2YWwpO1xuICB9XG5cbiAgcmVzaXplKCkge1xuICAgIGxldCBuZXdBcnJ5ID0gbmV3IEFycmF5KHRoaXMuX3ZhbHVlcy5sZW5ndGggKiAyKTtcblxuICAgIGlmKHRoaXMuX3RhaWwgPCB0aGlzLl9oZWFkKSB7XG4gICAgICBhY29weSh0aGlzLl92YWx1ZXMsIHRoaXMuX3RhaWwsIG5ld0FycnksIDAsIHRoaXMuX2hlYWQpO1xuXG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSB0aGlzLmxlbmd0aDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG5cbiAgICB9IGVsc2UgaWYodGhpcy5faGVhZCA8IHRoaXMuX3RhaWwpIHtcbiAgICAgIGFjb3B5KHRoaXMuX3ZhbHVlcywgMCwgbmV3QXJyeSwgdGhpcy5fdmFsdWVzLmxlbmd0aCAtIHRoaXMuX3RhaWwsIHRoaXMuX2hlYWQpO1xuXG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSB0aGlzLmxlbmd0aDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gMDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG4gICAgfVxuICB9XG5cbiAgY2xlYW51cChrZWVwKSB7XG4gICAgZm9yKGxldCBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICBsZXQgaXRlbSA9IHRoaXMucG9wKCk7XG5cbiAgICAgIGlmKGtlZXAoaXRlbSkpIHtcbiAgICAgICAgdW5zaGlmdChpdGVtKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgRml4ZWRCdWZmZXIge1xuICBjb25zdHJ1Y3RvcihuKSB7XG4gICAgdGhpcy5fYnVmID0gbmV3IFJpbmdCdWZmZXIobik7XG4gICAgdGhpcy5fc2l6ZSA9IG47XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5wb3AoKTtcbiAgfVxuXG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5mdWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgYWRkIHRvIGEgZnVsbCBidWZmZXIuXCIpO1xuICAgIH1cbiAgICB0aGlzLl9idWYucmVzaXppbmdVbnNoaWZ0KHYpO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLmxlbmd0aDtcbiAgfVxuXG4gIGdldCBmdWxsKCkge1xuICAgIHJldHVybiB0aGlzLl9idWYubGVuZ3RoID09PSB0aGlzLl9zaXplO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIERyb3BwaW5nQnVmZmVyIGV4dGVuZHMgRml4ZWRCdWZmZXIge1xuICBhZGQodikge1xuICAgIGlmKHRoaXMuX2J1Zi5sZW5ndGggPCB0aGlzLl9zaXplKSB7XG4gICAgICB0aGlzLl9idWYudW5zaGlmdCh2KTtcbiAgICB9XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgU2xpZGluZ0J1ZmZlciBleHRlbmRzIEZpeGVkQnVmZmVyIHtcbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLl9idWYubGVuZ3RoID09PSB0aGlzLl9zaXplKSB7XG4gICAgICB0aGlzLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLl9idWYudW5zaGlmdCh2KTtcbiAgfVxuXG4gIGdldCBmdWxsKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgeyBEcm9wcGluZ0J1ZmZlciwgU2xpZGluZ0J1ZmZlciwgRml4ZWRCdWZmZXIsIFJpbmdCdWZmZXIgfTsiLCJcbmltcG9ydCB7IEZpeGVkQnVmZmVyLCBSaW5nQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVycy5qc1wiO1xuaW1wb3J0IHsgRGlzcGF0Y2ggfSBmcm9tIFwiLi9kaXNwYXRjaC5qc1wiO1xuaW1wb3J0IHsgUHJvbWlzZSB9IGZyb20gXCIuL3Byb21pc2UuanNcIjtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyKSB7XG4gICAgdGhpcy5vZmZlcmVkID0gb2ZmZXI7XG4gICAgdGhpcy5yZWNlaXZlZCA9IG51bGw7XG4gICAgdGhpcy5yZXNvbHZlZCA9IGZhbHNlO1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IFtdO1xuICB9XG5cbiAgY29tbWl0KCkge1xuICAgIHJldHVybiAodmFsKSA9PiB7XG4gICAgICBpZih0aGlzLnJlc29sdmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHJlc29sdmUgdHJhbnNhY3RvciB0d2ljZSFcIik7XG4gICAgICB9XG4gICAgICB0aGlzLnJlY2VpdmVkID0gdmFsO1xuICAgICAgdGhpcy5yZXNvbHZlZCA9IHRydWU7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5mb3JFYWNoKGMgPT4gYyh2YWwpKTtcblxuICAgICAgcmV0dXJuIHRoaXMub2ZmZXJlZDtcbiAgICB9XG4gIH1cblxuICBkZXJlZihjYWxsYmFjaykge1xuICAgIGlmKHRoaXMucmVzb2x2ZWQpIHtcbiAgICAgIGNhbGxiYWNrKHRoaXMucmVjZWl2ZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5sZXQgZGlzcGF0Y2ggPSBuZXcgRGlzcGF0Y2goKTtcblxubGV0IGF0dGVtcHQgPSBmdW5jdGlvbihmbiwgZXhoKSB7IHRyeSB7IHJldHVybiBmbigpIH0gY2F0Y2goZSkgeyByZXR1cm4gZXhoKGUpOyB9IH1cbmxldCBwYXNzdGhyb3VnaCA9IGZ1bmN0aW9uKG5leHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyBuZXh0KHZhbHVlKSA6IG5leHQoKTtcbiAgfVxufTtcbmxldCBkZWZhdWx0RXhIYW5kbGVyID0gZnVuY3Rpb24oZSkgeyBjb25zb2xlLmVycm9yKGUpOyByZXR1cm4gZmFsc2U7IH1cbmxldCByZWR1Y2VkID0geyByZWR1Y2VkOiB0cnVlIH07XG5cbmNsYXNzIENoYW5uZWwge1xuICBjb25zdHJ1Y3RvcihzaXplT3JCdWYsIHhmb3JtLCBleGNlcHRpb25IYW5kbGVyKSB7XG4gICAgbGV0IGRvQWRkID0gdmFsID0+IHtcbiAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gdGhpcy5fYnVmZmVyLmFkZCh2YWwpIDogdGhpcy5fYnVmZmVyO1xuICAgIH1cblxuICAgIHRoaXMuX2J1ZmZlciAgICA9IChzaXplT3JCdWYgaW5zdGFuY2VvZiBGaXhlZEJ1ZmZlcikgPyBzaXplT3JCdWYgOiBuZXcgRml4ZWRCdWZmZXIoc2l6ZU9yQnVmIHx8IDApO1xuICAgIHRoaXMuX3Rha2VycyAgICA9IG5ldyBSaW5nQnVmZmVyKDMyKTtcbiAgICB0aGlzLl9wdXR0ZXJzICAgPSBuZXcgUmluZ0J1ZmZlcigzMik7XG4gICAgdGhpcy5feGZvcm1lciAgID0geGZvcm0gPyB4Zm9ybShkb0FkZCkgOiBwYXNzdGhyb3VnaChkb0FkZCk7XG4gICAgdGhpcy5fZXhIYW5kbGVyID0gZXhjZXB0aW9uSGFuZGxlciB8fCBkZWZhdWx0RXhIYW5kbGVyO1xuXG4gICAgdGhpcy5faXNPcGVuID0gdHJ1ZTtcbiAgfVxuXG4gIF9pbnNlcnQoKSB7XG4gICAgcmV0dXJuIGF0dGVtcHQoKCkgPT4gdGhpcy5feGZvcm1lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCB0aGlzLl9leEhhbmRsZXIpO1xuICB9XG5cbiAgYWJvcnQoKSB7XG4gICAgd2hpbGUodGhpcy5fcHV0dGVycy5sZW5ndGgpIHtcbiAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuXG4gICAgICBpZihwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgIGxldCBwdXR0ZXJDYiA9IHB1dHRlci5jb21taXQoKTtcbiAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHB1dHRlckNiKHRydWUpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fcHV0dGVycy5jbGVhbnVwKCgpID0+IGZhbHNlKTtcbiAgfVxuXG4gIGZpbGwodmFsLCB0eCA9IG5ldyBUcmFuc2FjdG9yKHZhbCkpIHtcbiAgICBpZih2YWwgPT09IG51bGwpIHsgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHB1dCBudWxsIHRvIGEgY2hhbm5lbC5cIik7IH1cbiAgICBpZighKHR4IGluc3RhbmNlb2YgVHJhbnNhY3RvcikpIHsgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0aW5nIFRyYW5zYWN0b3IgdG8gYmUgcGFzc2VkIHRvIGZpbGxcIik7IH1cbiAgICBpZighdHguYWN0aXZlKSB7IHJldHVybiB0eDsgfVxuXG4gICAgaWYoIXRoaXMub3Blbikge1xuICAgICAgLy8gRWl0aGVyIHNvbWVib2R5IGhhcyByZXNvbHZlZCB0aGUgaGFuZGxlciBhbHJlYWR5ICh0aGF0IHdhcyBmYXN0KSBvciB0aGUgY2hhbm5lbCBpcyBjbG9zZWQuXG4gICAgICAvLyBjb3JlLmFzeW5jIHJldHVybnMgYSBib29sZWFuIG9mIHdoZXRoZXIgb3Igbm90IHNvbWV0aGluZyAqY291bGQqIGdldCBwdXQgdG8gdGhlIGNoYW5uZWxcbiAgICAgIC8vIHdlJ2xsIGRvIHRoZSBzYW1lICNjYXJnb2N1bHRcbiAgICAgIHR4LmNvbW1pdCgpKGZhbHNlKTtcbiAgICB9XG5cbiAgICBpZighdGhpcy5fYnVmZmVyLmZ1bGwpIHtcbiAgICAgIC8vIFRoZSBjaGFubmVsIGhhcyBzb21lIGZyZWUgc3BhY2UuIFN0aWNrIGl0IGluIHRoZSBidWZmZXIgYW5kIHRoZW4gZHJhaW4gYW55IHdhaXRpbmcgdGFrZXMuXG4gICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgIGxldCBkb25lID0gYXR0ZW1wdCgoKSA9PiB0aGlzLl9pbnNlcnQodmFsKSA9PT0gcmVkdWNlZCwgdGhpcy5fZXhIYW5kbGVyKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiB0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgIGxldCB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcbiAgICAgICAgICBsZXQgdGFrZXJDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihkb25lKSB7IHRoaXMuYWJvcnQoKTsgfVxuXG4gICAgICByZXR1cm4gdHg7XG4gICAgfSBlbHNlIGlmKHRoaXMuX3Rha2Vycy5sZW5ndGgpIHtcbiAgICAgIC8vIFRoZSBidWZmZXIgaXMgZnVsbCBidXQgdGhlcmUgYXJlIHdhaXRpbmcgdGFrZXJzIChlLmcuIHRoZSBidWZmZXIgaXMgc2l6ZSB6ZXJvKVxuXG4gICAgICBsZXQgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiAhdGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYodGFrZXJUeCAmJiB0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgICAgbGV0IHRha2VyQ2IgPSB0YWtlclR4LmNvbW1pdCgpO1xuXG4gICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0YWtlckNiKHZhbCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcHV0dGVycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9wdXR0ZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgcHV0KHZhbCwgdHJhbnNhY3Rvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMuZmlsbCh2YWwsIHRyYW5zYWN0b3IpLmRlcmVmKHJlc29sdmUpO1xuICAgIH0pO1xuICB9XG5cbiAgZHJhaW4odHggPSBuZXcgVHJhbnNhY3RvcigpKSB7XG4gICAgaWYoISh0eCBpbnN0YW5jZW9mIFRyYW5zYWN0b3IpKSB7IHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBUcmFuc2FjdG9yIHRvIGJlIHBhc3NlZCB0byBkcmFpblwiKTsgfVxuICAgIGlmKCF0eC5hY3RpdmUpIHsgcmV0dXJuIHR4OyB9XG5cbiAgICBpZih0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICBsZXQgYnVmVmFsID0gdGhpcy5fYnVmZmVyLnJlbW92ZSgpO1xuXG4gICAgICB3aGlsZSghdGhpcy5fYnVmZmVyLmZ1bGwgJiYgdGhpcy5fcHV0dGVycy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG5cbiAgICAgICAgaWYocHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICAgIGxldCBwdXRUeCA9IHB1dHRlci5jb21taXQoKSxcbiAgICAgICAgICAgICAgdmFsID0gcHV0dGVyLm9mZmVyZWQ7IC8vIEtpbmRhIGJyZWFraW5nIHRoZSBydWxlcyBoZXJlXG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gcHV0VHgoKSk7XG4gICAgICAgICAgbGV0IGRvbmUgPSBhdHRlbXB0KCgpID0+IHRoaXMuX2luc2VydCh2YWwpID09PSByZWR1Y2VkLCB0aGlzLl9leEhhbmRsZXIpO1xuXG4gICAgICAgICAgaWYoZG9uZSA9PT0gcmVkdWNlZCkgeyB0aGlzLmFib3J0KCk7IH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eC5jb21taXQoKShidWZWYWwpO1xuICAgIH0gZWxzZSBpZih0aGlzLl9wdXR0ZXJzLmxlbmd0aCkge1xuICAgICAgbGV0IHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3B1dHRlcnMubGVuZ3RoICYmICFwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgIHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHB1dHRlciAmJiBwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgIGxldCB0eENiID0gdHguY29tbWl0KCksXG4gICAgICAgICAgICBwdXRUeCA9IHB1dHRlci5jb21taXQoKSxcbiAgICAgICAgICAgIHZhbCA9IHB1dHRlci5vZmZlcmVkO1xuXG4gICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiBwdXRUeCgpKTtcbiAgICAgICAgdHhDYih2YWwpO1xuICAgICAgfSBlbHNlIGlmKCF0aGlzLm9wZW4pIHtcbiAgICAgICAgYXR0ZW1wdCgoKSA9PiB0aGlzLl9pbnNlcnQoKSwgdGhpcy5fZXhIYW5kbGVyKTtcblxuICAgICAgICBpZih0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgdHhDYih0aGlzLl9idWZmZXIucmVtb3ZlKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR4Q2IobnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Rha2Vycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90YWtlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHg7XG4gIH1cblxuICB0YWtlKHRyYW5zYWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmRyYWluKHRyYW5zYWN0b3IpLmRlcmVmKHJlc29sdmUpO1xuICAgIH0pO1xuICB9XG5cbiAgdGhlbihmbiwgZXJyKSB7XG4gICAgcmV0dXJuIHRoaXMudGFrZSgpLnRoZW4oZm4sIGVycik7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICBpZih0aGlzLm9wZW4pIHtcbiAgICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xuXG4gICAgICBpZih0aGlzLl9wdXR0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBhdHRlbXB0KCgpID0+IHRoaXMuX2luc2VydCgpLCB0aGlzLl9leEhhbmRsZXIpO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAodGhpcy5fdGFrZXJzLmxlbmd0aCkge1xuICAgICAgICBsZXQgdGFrZXIgPSB0aGlzLl90YWtlcnMucG9wKCk7XG5cbiAgICAgICAgaWYodGFrZXIuYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHZhbCA9IHRoaXMuX2J1ZmZlci5sZW5ndGggPyB0aGlzLl9idWZmZXIucmVtb3ZlKCkgOiBudWxsLFxuICAgICAgICAgICAgICB0YWtlckNiID0gdGFrZXIuY29tbWl0KCk7XG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGludG8ob3RoZXJDaGFuLCBzaG91bGRDbG9zZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGludG8odmFsKSB7XG4gICAgICBpZih2YWwgPT09IG5pbCAmJiBzaG91bGRDbG9zZSkge1xuICAgICAgICBvdXQuY2xvc2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dC5wdXQodmFsKS50aGVuKG9wZW4gPT4ge1xuICAgICAgICAgIGlmKCFvcGVuICYmIHNob3VsZENsb3NlKSB7XG4gICAgICAgICAgICBzZWxmLmNsb3NlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYudGFrZSgpLnRoZW4obWFwcGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudGFrZSgpLnRoZW4oaW50byk7XG5cbiAgICByZXR1cm4gb3RoZXJDaGFuO1xuICB9XG5cbiAgZ2V0IG9wZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzT3BlbjtcbiAgfVxufVxuXG5DaGFubmVsLnJlZHVjZWQgPSByZWR1Y2VkO1xuXG5leHBvcnQgeyBDaGFubmVsLCBUcmFuc2FjdG9yIH07IiwibGV0IGRlZmF1bHRBc3luY2hyb25pemVyID0gKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicpID8gZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIHNldEltbWVkaWF0ZShmbik7XG59IDogZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIHNldFRpbWVvdXQoZm4pO1xufTtcblxuY2xhc3MgRGlzcGF0Y2gge1xuICBjb25zdHJ1Y3Rvcihhc3luY2hyb25pemVyKSB7XG4gICAgdGhpcy5fYXN5bmNocm9uaXplciA9IGFzeW5jaHJvbml6ZXIgfHwgZGVmYXVsdEFzeW5jaHJvbml6ZXI7XG4gICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgfVxuXG4gIHJ1bihmbikge1xuICAgIHRoaXMuX3F1ZXVlLnB1c2goZm4pO1xuXG4gICAgdGhpcy5fYXN5bmNocm9uaXplcigoKSA9PiB7XG4gICAgICB3aGlsZSh0aGlzLl9xdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIlFVRVVFXCIsIHRoaXMuX3F1ZXVlWzBdKTtcbiAgICAgICAgdGhpcy5fcXVldWUuc2hpZnQoKSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cblxuZXhwb3J0IHsgRGlzcGF0Y2ggfTsiLCJpbXBvcnQgeyBDaGFubmVsLCBUcmFuc2FjdG9yIH0gZnJvbSBcIi4vY2hhbm5lbHMuanNcIjtcbmltcG9ydCB7IEZpeGVkQnVmZmVyLCBEcm9wcGluZ0J1ZmZlciwgU2xpZGluZ0J1ZmZlciwgUmluZ0J1ZmZlciB9IGZyb20gXCIuL2J1ZmZlcnMuanNcIjtcbmltcG9ydCB7IGFsdHMsIHRpbWVvdXQsIG9yZGVyLCBtYXAsIGZpbHRlciwgcGFydGl0aW9uQnksIHBhcnRpdGlvbiB9IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5cbmV4cG9ydCB7XG4gICAgQ2hhbm5lbCxcbiAgICBUcmFuc2FjdG9yLFxuICAgIEZpeGVkQnVmZmVyLFxuICAgIERyb3BwaW5nQnVmZmVyLFxuICAgIFNsaWRpbmdCdWZmZXIsXG4gICAgUmluZ0J1ZmZlcixcbiAgICBhbHRzLFxuICAgIHRpbWVvdXQsXG4gICAgb3JkZXIsXG4gICAgbWFwLFxuICAgIGZpbHRlcixcbiAgICBwYXJ0aXRpb25CeSxcbiAgICBwYXJ0aXRpb25cbn07IiwidmFyIF9Qcm9taXNlO1xuXG5pZih0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuUHJvbWlzZSkge1xuICBfUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlO1xufSBlbHNlIGlmKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbC5Qcm9taXNlKSB7XG4gIF9Qcm9taXNlID0gZ2xvYmFsLlByb21pc2U7XG59IGVsc2Uge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gZmluZCBuYXRpdmUgcHJvbWlzZSBpbXBsZW1lbnRhdGlvbi5cIik7XG59XG5cbmV4cG9ydCB7IF9Qcm9taXNlIGFzIFByb21pc2UgfTtcbiIsImltcG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfSBmcm9tIFwiLi9jaGFubmVscy5qc1wiO1xuXG5cbmNsYXNzIEFsdHNUcmFuc2FjdG9yIGV4dGVuZHMgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyLCBjb21taXRDYikge1xuICAgIHN1cGVyKG9mZmVyKTtcbiAgICB0aGlzLmNvbW1pdENiID0gY29tbWl0Q2I7XG4gIH1cbiAgY29tbWl0KCkge1xuICAgIHRoaXMuY29tbWl0Q2IoKTtcbiAgICByZXR1cm4gc3VwZXIuY29tbWl0KCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWx0cyhyYWNlKSB7XG4gIGxldCB0cmFuc2FjdG9ycyA9IFtdO1xuICBsZXQgb3V0Q2ggPSBuZXcgQ2hhbm5lbCgpO1xuXG4gIGxldCBkZWFjdGl2YXRlID0gKCkgPT4geyB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSkgfVxuXG4gIHJhY2UubWFwKGNtZCA9PiB7XG5cbiAgICBpZihBcnJheS5pc0FycmF5KGNtZCkpIHtcbiAgICAgIGxldCB0eCA9IG5ldyBBbHRzVHJhbnNhY3Rvcih2YWwsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBsZXQgWyBjaCwgdmFsIF0gPSBjbWQ7XG4gICAgICBjaC5wdXQodmFsLCB0eCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgb3V0Q2gucHV0KFsgdmFsLCBjaCBdKTtcbiAgICAgIH0pO1xuXG4gICAgICB0cmFuc2FjdG9ycy5wdXNoKHR4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHR4ID0gbmV3IEFsdHNUcmFuc2FjdG9yKHRydWUsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG5cbiAgICAgIGNtZC50YWtlKHR4KS50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBvdXRDaC5wdXQoWyB2YWwsIGNtZCBdKTtcbiAgICAgIH0pO1xuXG4gICAgICB0cmFuc2FjdG9ycy5wdXNoKHR4KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvdXRDaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVvdXQobXMpIHtcbiAgdmFyIGNoID0gbmV3IENoYW5uZWwoKTtcbiAgc2V0VGltZW91dCgoKSA9PiB7IGNoLmNsb3NlKCk7IH0sIG1zKTtcbiAgcmV0dXJuIGNoO1xufVxuXG4vLyBFbmZvcmNlcyBvcmRlciByZXNvbHV0aW9uIG9uIHJlc3VsdGluZyBjaGFubmVsXG4vLyBUaGlzIG1pZ2h0IG5lZWQgdG8gYmUgdGhlIGRlZmF1bHQgYmVoYXZpb3IsIHRob3VnaCB0aGF0IHJlcXVpcmVzIG1vcmUgdGhvdWdodFxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyKGluY2gsIHNpemVPckJ1Zikge1xuICB2YXIgb3V0Y2ggPSBuZXcgQ2hhbm5lbChzaXplT3JCdWYpO1xuXG4gIGZ1bmN0aW9uIGRyYWluKCkge1xuICAgIGluY2gudGFrZSgpLnRoZW4odmFsID0+IHtcbiAgICAgIGlmKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICBvdXRjaC5jbG9zZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0Y2gucHV0KHZhbCkudGhlbihkcmFpbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZHJhaW4oKTtcblxuICByZXR1cm4gb3V0Y2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5leHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odmFsKSB7XG4gICAgICBpZihhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXh0KGZuKHZhbCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlcihmbikge1xuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGZuKHZhbCkpIHtcbiAgICAgICAgICByZXR1cm4gbmV4dCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFydGl0aW9uQnkoZm4pIHtcbiAgbGV0IGxhc3QgPSBudWxsLFxuICAgICAgYWNjdW11bGF0b3IgPSBbXTtcblxuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHByZWRpY2F0ZVJlc3VsdCA9IGZuKHZhbCk7XG4gICAgICAgIGlmKGxhc3QgIT09IG51bGwgJiYgcHJlZGljYXRlUmVzdWx0ICE9PSBsYXN0KSB7XG4gICAgICAgICAgbGV0IHRtcCA9IGFjY3VtdWxhdG9yO1xuXG4gICAgICAgICAgYWNjdW11bGF0b3IgPSBbIHZhbCBdO1xuICAgICAgICAgIGxhc3QgPSBwcmVkaWNhdGVSZXN1bHQ7XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCh0bXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxhc3QgPSBwcmVkaWNhdGVSZXN1bHQ7XG4gICAgICAgICAgYWNjdW11bGF0b3IucHVzaCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dChhY2N1bXVsYXRvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aXRpb24obnVtKSB7XG4gIGxldCBjID0gMCxcbiAgICAgIGEgPSBbXTtcblxuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgYS5wdXNoKHZhbCk7XG4gICAgICAgIGMgKz0gMTtcblxuICAgICAgICBpZihjICUgbnVtID09PSAwKSB7XG4gICAgICAgICAgbGV0IHRtcCA9IGE7XG5cbiAgICAgICAgICBhID0gW107XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCh0bXApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dChhKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0iLCJcbmltcG9ydCB7XG4gICAgQ2hhbm5lbCxcbiAgICBSaW5nQnVmZmVyLFxuICAgIEZpeGVkQnVmZmVyLFxuICAgIFNsaWRpbmdCdWZmZXIsXG4gICAgRHJvcHBpbmdCdWZmZXIsXG4gICAgYWx0cyxcbiAgICB0aW1lb3V0LFxuICAgIG9yZGVyLFxuICAgIG1hcCxcbiAgICBmaWx0ZXIsXG4gICAgcGFydGl0aW9uQnksXG4gICAgcGFydGl0aW9uXG59IGZyb20gXCIuLi9zcmMvY2hhbm5lbHMvaW5kZXguanNcIjtcblxuLy8gTmljaydzIGFkLWhvYyB0ZXN0aW5nIHRvb2xzOlxuXG5mdW5jdGlvbiBhc3NlcnQoZXhwciwgdmFsLCBtc2cgPSBgRXhwZWN0ZWQgJHt2YWx9LCByZWNlaXZlZCAke2V4cHJ9YCkge1xuICBpZihleHByICE9PSB2YWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWlsVGVzdChtc2cpIHtcbiAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG59XG5cbi8vIFBhc3MgaW4gc29tZSBjaGFubmVscyBhbmQgdGhlIHRlc3Qgd2lsbCBmaW5pc2ggd2hlbiBhbGwgdGhlIGNoYW5uZWxzIGFyZSBjbG9zZWRcbmZ1bmN0aW9uIGNoYW5uZWxUZXN0KGNoYW5zLCB0ZXN0KSB7XG4gIGxldCBqb2ludCA9IGNoYW5zLm1hcChjID0+IHtcbiAgICBsZXQgcmVzb2x2ZXIsIHByb21pc2UgPSBuZXcgUHJvbWlzZShyID0+IHJlc29sdmVyID0gcik7XG4gICAgbGV0IGNsb3NlID0gYy5jbG9zZTtcblxuICAgIGMuY2xvc2UgPSAoKSA9PiB7XG4gICAgICBjbG9zZS5jYWxsKGMpO1xuICAgICAgcmVzb2x2ZXIoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSk7XG5cbiAgdGVzdC5hcHBseShudWxsLCBjaGFucyk7XG5cbiAgcmV0dXJuIFByb21pc2UuYWxsKGpvaW50KTtcbn1cblxuZnVuY3Rpb24gaG9pc3QoZm4sIC4uLmFyZ3MpIHtcbiAgcmV0dXJuICgpID0+IHtcbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gIH1cbn1cblxuLy8gPT09IEJFR0lOIFRFU1RTID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuLy8gU3luY2hyb25vdXMgdGVzdHM6XG4oKCkgPT4ge1xuICAvKlxuICBUaGUgUmluZ0J1ZmZlciBpcyB0aGUgYmFzaXMgb24gd2hpY2ggYWxsIHRoZSBidWZmZXJzIGFyZSBidWlsdC4gSXQncyBkaWZmaWN1bHQgdG8gdXNlLCBzbyB5b3UgcHJvYmFibHkgd29uJ3QgZXZlclxuICB3YW50IHRvIHVzZSBpdC4gVXNlIHRoZSBoaWdoZXItbGV2ZWwgRml4ZWRCdWZmZXIsIERyb3BwaW5nQnVmZmVyLCBhbmQgU2xpZGluZ0J1ZmZlciBpbnN0ZWFkXG4gICAqL1xuICBsZXQgYnVmID0gbmV3IFJpbmdCdWZmZXIoMCk7XG5cbiAgYnVmLnJlc2l6aW5nVW5zaGlmdCgxMCk7XG4gIGFzc2VydChidWYucG9wKCksIDEwKTtcblxuICBidWYucmVzaXppbmdVbnNoaWZ0KDIwKTtcbiAgYXNzZXJ0KGJ1Zi5wb3AoKSwgMjApO1xuXG4gIGxldCBpID0gMjAwO1xuICB3aGlsZShpIC0tKSB7XG4gICAgYnVmLnJlc2l6aW5nVW5zaGlmdChpKTtcbiAgfVxuICB3aGlsZShidWYubGVuZ3RoKSB7XG4gICAgYXNzZXJ0KGJ1Zi5wb3AoKSwgYnVmLmxlbmd0aCk7XG4gIH1cblxufSkoKTtcblxuKCgpID0+IHtcbiAgLypcbiAgQSBGaXhlZEJ1ZmZlciBob2xkcyBhIGZpeGVkIG51bWJlciBvZiBpdGVtcyBhbmQgbm8gbW9yZS4gSXQgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgeW91IGF0dGVtcHQgdG8gYWRkIHZhbHVlcyB0b1xuICBpdCB3aGVuIGl0IGlzIGZ1bGwuIEEgYnVmZmVyIGlzIGEgRklGTyBjb25zdHJ1Y3QuXG4gICAqL1xuICBsZXQgYnVmID0gbmV3IEZpeGVkQnVmZmVyKDEpO1xuXG4gIGJ1Zi5hZGQoMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIHRydWUpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG4gIGJ1Zi5hZGQoMjApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIHRydWUpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAyMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG59KSgpO1xuXG4oKCkgPT4ge1xuICAvKlxuICBUaGUgU2xpZGluZ0J1ZmZlclxuICAgKi9cbiAgbGV0IGJ1ZiA9IG5ldyBTbGlkaW5nQnVmZmVyKDEpO1xuXG4gIGJ1Zi5hZGQoMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcblxuICBidWYuYWRkKDIwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG4gIGJ1Zi5hZGQoMzApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMzApO1xuXG4gIGxldCBpID0gMjAwO1xuICB3aGlsZShpIC0tKSB7XG4gICAgYnVmLmFkZChpKTtcbiAgfVxuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAwKTtcblxuXG59KSgpO1xuXG4oKCkgPT4ge1xuXG4gIGxldCBidWYgPSBuZXcgRHJvcHBpbmdCdWZmZXIoMSk7XG5cbiAgYnVmLmFkZCgxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG4gIGJ1Zi5hZGQoMjApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYnVmLmFkZCgzMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAyMCk7XG5cbiAgbGV0IGkgPSAyMDA7XG4gIHdoaWxlKGkgLS0pIHtcbiAgICBidWYuYWRkKGkpO1xuICB9XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDE5OSk7XG5cbn0pKCk7XG5cbi8vIEFzeW5jaHJvbm91cyB0ZXN0czpcbmNoYW5uZWxUZXN0KFsgbmV3IENoYW5uZWwoMykgXSwgY2hhbm5lbCA9PiB7XG4gIC8qXG4gICBQdXQgdGhyZWUgdmFsdWVzIG9uIGEgY2hhbm5lbCAtLSAxLCAyLCAzIC0tIGFuZCB0aGVuIHJlbW92ZSB0aGVtLlxuICAgKi9cblxuICBjaGFubmVsLnB1dCgxKTtcbiAgY2hhbm5lbC5wdXQoMik7XG4gIGNoYW5uZWwucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAxKSksXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDIpKSxcbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMykpXG5cbiAgXSkudGhlbigoKSA9PiBjaGFubmVsLmNsb3NlKCkpO1xuXG59KS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKG5ldyBTbGlkaW5nQnVmZmVyKDIpKSBdLCAoY2hhbm5lbCkgPT4ge1xuICAvKlxuICAgUHV0IHRocmVlIHZhbHVlcyBvbiBhIGNoYW5uZWwgLS0gMSwgMiwgMywgbm90aWNlIHRoZSBzbGlkaW5nIGJ1ZmZlciBkcm9wcyB0aGUgZmlyc3QgdmFsdWVcbiAgICovXG5cbiAgY2hhbm5lbC5wdXQoMSk7XG4gIGNoYW5uZWwucHV0KDIpO1xuICBjaGFubmVsLnB1dCgzKTtcblxuICBQcm9taXNlLmFsbChbXG5cbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMikpLFxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAzKSlcblxuICBdKS50aGVuKCgpID0+IGNoYW5uZWwuY2xvc2UoKSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKG5ldyBEcm9wcGluZ0J1ZmZlcigyKSkgXSwgY2hhbm5lbCA9PiB7XG4gIC8qXG4gICBQdXQgdGhyZWUgdmFsdWVzIG9uIGEgY2hhbm5lbCAtLSAxLCAyLCAzLCBub3RpY2UgdGhlIGRyb3BwaW5nIGJ1ZmZlciBpZ25vcmVzIGFkZGl0aW9uYWwgcHV0c1xuICAgKi9cblxuICBjaGFubmVsLnB1dCgxKTtcbiAgY2hhbm5lbC5wdXQoMik7XG4gIGNoYW5uZWwucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAxKSksXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDIpKVxuXG4gIF0pLnRoZW4oKCkgPT4gY2hhbm5lbC5jbG9zZSgpKTtcblxuICBjaGFubmVsLmNsb3NlKCk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCkgXSwgKGNoYW4xLCBjaGFuMiwgY2hhbjMpID0+IHtcblxuICAvKlxuICBQdXQgYSB2YWx1ZSBvbnRvIHRocmVlIGRpZmZlcmVudCBjaGFubmVscyBhdCBkaWZmZXJlbnQgdGltZXMgYW5kIHVzZSBQcm9taXNlLmFsbCB0byB3YWl0IG9uIHRoZSB0aHJlZSB2YWx1ZXMsXG4gIGJlY2F1c2UgY2hhbm5lbHMgYmVoYXZlIGluIHByb21pc2UtbGlrZSB3YXlzICh3aXRoIHNvbWUgbm90YWJsZSBleGNlcHRpb25zKS5cblxuICBXaGVuIHRoZSB0aHJlZSBjaGFubmVscyBwcm9kdWNlIGEgdmFsdWUsIHB1bGwgYWdhaW4gZnJvbSB0aGUgZmlyc3QgY2hhbm5lbC5cbiAgICovXG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjEucHV0KFwiSGVsbG8hXCIpOyAgICAgICAgICAgICAgIH0sIDM1KTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjIucHV0KFwiSG93IGFyZSB5b3U/XCIpOyAgICAgICAgIH0sIDEwKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjMucHV0KFwiVmVyeSBnb29kLlwiKTsgICAgICAgICAgIH0sIDUwKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjEucHV0KFwiVGhhbmsgeW91IHZlcnkgbXVjaC5cIik7IH0sIDQwKTtcblxuICBQcm9taXNlLmFsbChbIGNoYW4xLCBjaGFuMiwgY2hhbjMgXSkudGhlbigoWyBfMSwgXzIsIF8zIF0pID0+IHtcbiAgICBhc3NlcnQoXzEsIFwiSGVsbG8hXCIpO1xuICAgIGFzc2VydChfMiwgXCJIb3cgYXJlIHlvdT9cIik7XG4gICAgYXNzZXJ0KF8zLCBcIlZlcnkgZ29vZC5cIik7XG5cbiAgICByZXR1cm4gY2hhbjEudGFrZSgpO1xuXG4gIH0pLnRoZW4odiA9PiB7XG4gICAgYXNzZXJ0KHYsIFwiVGhhbmsgeW91IHZlcnkgbXVjaC5cIik7XG5cbiAgICBjaGFuMS5jbG9zZSgpO1xuICAgIGNoYW4yLmNsb3NlKCk7XG4gICAgY2hhbjMuY2xvc2UoKTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCkgXSwgKGNoYW5uZWwpID0+IHtcbiAgLypcbiAgWW91IGNhbiBwdXQgYSBwcm9taXNlIGNoYWluIG9uIGEgY2hhbm5lbCwgYW5kIGl0IHdpbGwgYXV0b21hdGljYWxseSB1bndyYXAgdGhlIHByb21pc2UuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHdhaXQobnVtKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0sIG51bSk7XG4gICAgfSk7XG4gIH1cblxuICBjaGFubmVsLnB1dCh3YWl0KDEwMCkudGhlbigoKSA9PiAxMDApKTtcbiAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4ge1xuICAgIGFzc2VydCh2LCAxMDApO1xuICAgIGNoYW5uZWwuY2xvc2UoKTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXSwgKCkgPT4ge1xuICAvKlxuICBCdXQgc29tZXRpbWVzIHlvdSBkb24ndCB3YW50IHRvIHVud3JhcCBwcm9taXNlcywgc28geW91J2xsIG5lZWQgdG8gdXNlIHRoZSBjYWxsYmFjayBhcGk6XG4gICAqL1xuICAvLyBUT0RPXG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCkgXSwgKGNoYW4xLCBjaGFuMiwgY2hhbjMpID0+IHtcbiAgLypcbiAgU29tZXRpbWVzIHlvdSB3YW50IHRvIGNvbXBsZXRlIG9ubHkgb25lIG9mIG1hbnkgb3BlcmF0aW9ucyBvbiBhIHNldCBvZiBjaGFubmVsc1xuICAgKi9cblxuICBsZXQgYWx0czEgPSBhbHRzKFsgY2hhbjEsIGNoYW4yIF0pLnRha2UoKS50aGVuKChbdmFsLCBjaGFuXSkgPT4ge1xuICAgIGFzc2VydChjaGFuLCBjaGFuMik7XG4gICAgYXNzZXJ0KHZhbCwgMTAwKTtcblxuICB9KTtcblxuICBsZXQgYWx0czIgPSBhbHRzKFsgY2hhbjEsIGNoYW4yIF0pLnRha2UoKS50aGVuKChbIHZhbCwgY2hhbiBdKSA9PiB7XG4gICAgYXNzZXJ0KGNoYW4sIGNoYW4xKTtcbiAgICBhc3NlcnQodmFsLCAyMDApO1xuICB9KTtcblxuICAvLyBZb3UgY2FuIFwicHV0XCIgdG8gYSBjaGFubmVsIGluIGFuIGFsdHMgYnkgcGFzc2luZyBhbiBhcnJheVxuICBsZXQgYWx0czMgPSBhbHRzKFsgY2hhbjEsIGNoYW4yLCBbIGNoYW4zLCAzMDAgXSBdKS50YWtlKCkudGhlbigoWyB2YWwsIGNoYW4gXSkgPT4ge1xuICAgIGFzc2VydChjaGFuLCBjaGFuMyk7XG4gICAgYXNzZXJ0KHZhbCwgMzAwKTtcbiAgfSk7XG5cbiAgY2hhbjMudGFrZSgpO1xuICBjaGFuMi5wdXQoMTAwKTtcbiAgY2hhbjEucHV0KDIwMCk7XG5cbiAgUHJvbWlzZS5hbGwoWyBhbHRzMSwgYWx0czIsIGFsdHMzIF0pLnRoZW4oKCkgPT4ge1xuICAgIGNoYW4xLmNsb3NlKCk7XG4gICAgY2hhbjIuY2xvc2UoKTtcbiAgICBjaGFuMy5jbG9zZSgpO1xuICB9KTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuICAvKlxuICAgSXQncyBlYXN5IHRvIG9yZGVyIGEgY2hhbm5lbCBieSBpdHMgYWRkZWQgZGF0ZSB1c2luZyB0aGUgYG9yZGVyYCBmdW5jdGlvbiwgd2hpY2ggdGFrZXMgYSBjaGFubmVsIGFuZCByZXR1cm5zXG4gICBhIHN0cmljdGx5IG9yZGVyZWQgdmVyc2lvbiBvZiBpdHMgYXN5bmNocm9ub3VzIHZhbHVlcyAoYXNzdW1lcyB0aG9zZSB2YWx1ZXMgYXJlIHByb21pc2VzKVxuXG4gICBUaGlzIGlzIHVzZWZ1bCBmb3IgdGFraW5nIGEgY2hhbm5lbCBvZiBQcm9taXNlPEh0dHBSZXF1ZXN0PFZhbHVlPj4gYW5kIHRyYW5zbGF0aW5nIGl0IHRvIFByb21pc2U8VmFsdWU+XG4gICAqL1xuXG4gIHZhciBvcmRlcmVkID0gb3JkZXIoY2hhbm5lbCk7XG5cbiAgY2hhbm5lbC5wdXQodGltZW91dCgyMDApLnRoZW4oKCkgPT4gMjAwKSk7XG4gIGNoYW5uZWwucHV0KHRpbWVvdXQoMTAwKS50aGVuKCgpID0+IDEwMCkpO1xuXG4gIC8vIChOb3RlIHlvdSBjYW4gcHV0IHRoZSBzYW1lIGNoYW5uZWwgaW50byBhIFByb21pc2UuYWxsIG1hbnkgdGltZXMpXG4gIFByb21pc2UuYWxsKFsgb3JkZXJlZCwgb3JkZXJlZCBdKS50aGVuKChbIGZpcnN0LCBzZWNvbmQgXSkgPT4ge1xuICAgIGFzc2VydChmaXJzdCwgMjAwKTtcbiAgICBhc3NlcnQoc2Vjb25kLCAxMDApO1xuICAgIGNoYW5uZWwuY2xvc2UoKTtcbiAgfSk7XG5cblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuXG4gIGNoYW5uZWwucHV0KG5ldyBQcm9taXNlKCgpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgfSkpO1xuXG4gIGNoYW5uZWwucHV0KDEwMCk7XG5cbiAgbGV0IGZhaWx1cmUgPSBjaGFubmVsLnRha2UoKS50aGVuKHYgPT4gZmFpbFRlc3QoXCJTaG91bGQgaGF2ZSBldmFsdWF0ZWQgdG8gYW4gZXJyb3JcIiksIGUgPT4ge30pO1xuICBsZXQgc3VjY2VzcyA9IGNoYW5uZWwudGFrZSgpLnRoZW4odiA9PiBhc3NlcnQodiwgMTAwKSk7XG5cbiAgUHJvbWlzZS5hbGwoWyBmYWlsdXJlLCBzdWNjZXNzXSkudGhlbigoKSA9PiBjaGFubmVsLmNsb3NlKCkpO1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbCgpIF0sIChjaGFubmVsKSA9PiB7XG5cbiAgY2hhbm5lbC5wdXQoMTAwKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oZnVuY3Rpb24odikge1xuICAgICAgYXNzZXJ0KHYsIDIwMCk7XG4gICAgICBjaGFubmVsLmNsb3NlKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIFRoZSBhYm92ZSBjb2RlIHdpbGwgZGVhZGxvY2sgaWYgdGhlIG5leHQgYmxvY2sgaXNuJ3QgdGhlcmUsIGJlY2F1c2UgdGhlIHB1dCBpcyBoYWx0ZWQgb24gYSB6ZXJvLWxlbmd0aCBidWZcblxuICB0aW1lb3V0KDEwMCkudGhlbihmdW5jdGlvbigpIHtcbiAgICBjaGFubmVsLnRha2UoKS50aGVuKGZ1bmN0aW9uKHYpIHtcbiAgICAgIGFzc2VydCh2LCAxMDApO1xuICAgICAgY2hhbm5lbC5wdXQoMjAwKTtcbiAgICB9KTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCkgXSwgKGNoYW5uZWwpID0+IHtcblxuICBjaGFubmVsLnB1dCgxMDApO1xuICBjaGFubmVsLnB1dCgyMDApO1xuICBjaGFubmVsLmNsb3NlKCk7XG5cbiAgY2hhbm5lbC50YWtlKCkudGhlbih2ID0+IGFzc2VydCh2LCAxMDApKTtcbiAgY2hhbm5lbC50YWtlKCkudGhlbih2ID0+IGFzc2VydCh2LCAyMDApKTtcblxuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgW1xuICBuZXcgQ2hhbm5lbCgxLCBtYXAodiA9PiB2ICogMikpXG5dLCAoZG91YmxlcikgPT4ge1xuXG4gIC8vIFZhbHVlcyBwdXQgb24gdGhlIGNoYW5uZWwgYXJlIGRvdWJsZWRcbiAgZG91Ymxlci5wdXQoMSk7XG4gIGRvdWJsZXIucHV0KDIpO1xuICBkb3VibGVyLnB1dCgzKTtcblxuICBQcm9taXNlLmFsbChbXG5cbiAgICBkb3VibGVyLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMikpLFxuICAgIGRvdWJsZXIudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCA0KSksXG4gICAgZG91Ymxlci50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDYpKVxuXG4gIF0pLnRoZW4oKCkgPT4gZG91Ymxlci5jbG9zZSgpKTtcblxuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgW1xuICBuZXcgQ2hhbm5lbCgxLCBmaWx0ZXIodiA9PiB2ICUgMiA9PT0gMCkpXG5dLCAoZXZlbnMpID0+IHtcblxuICAvLyBWYWx1ZXMgcHV0IG9uIHRoZSBjaGFubmVsIGFyZSBkb3VibGVkXG4gIGV2ZW5zLnB1dCgxKTtcbiAgZXZlbnMucHV0KDIpO1xuICBldmVucy5wdXQoMyk7XG4gIGV2ZW5zLnB1dCg0KTtcblxuICBQcm9taXNlLmFsbChbXG5cbiAgICBldmVucy50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDIpKSxcbiAgICBldmVucy50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDQpKVxuXG4gIF0pLnRoZW4oKCkgPT4gZXZlbnMuY2xvc2UoKSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXG4gIG5ldyBDaGFubmVsKDEsIHBhcnRpdGlvbigyKSlcbl0sIChncm91cHMpID0+IHtcblxuICAvLyBWYWx1ZXMgcHV0IG9uIHRoZSBjaGFubmVsIGFyZSBkb3VibGVkXG4gIGdyb3Vwcy5wdXQoMSk7XG4gIGdyb3Vwcy5wdXQoMik7XG4gIGdyb3Vwcy5wdXQoMyk7XG4gIGdyb3Vwcy5wdXQoNCk7XG5cbiAgUHJvbWlzZS5hbGwoW1xuICAgIGdyb3Vwcy50YWtlKCkudGhlbigoW18xLCBfMl0pID0+IHtcbiAgICAgIGFzc2VydChfMSwgMSk7XG4gICAgICBhc3NlcnQoXzIsIDIpO1xuICAgIH0pLFxuICAgIGdyb3Vwcy50YWtlKCkudGhlbigoW18zLCBfNF0pID0+IHtcbiAgICAgIGFzc2VydChfMywgMyk7XG4gICAgICBhc3NlcnQoXzQsIDQpO1xuICAgIH0pXG4gIF0pLnRoZW4oKCkgPT4gZ3JvdXBzLmNsb3NlKCkpO1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgW1xuICBuZXcgQ2hhbm5lbCgxMCwgcGFydGl0aW9uQnkodiA9PiB7XG4gICAgbGV0IG5vcm1hbGl6ZWQgPSB2LnJlcGxhY2UoL1xcVysvZywgJycpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplZCA9PT0gbm9ybWFsaXplZC5zcGxpdCgnJykucmV2ZXJzZSgpLmpvaW4oJycpO1xuICB9KSlcbl0sICh2YWxzKSA9PiB7XG5cbiAgLy8gVmFsdWVzIHB1dCBvbiB0aGUgY2hhbm5lbCBhcmUgZG91YmxlZFxuICB2YWxzLnB1dChcInRhY29jYXRcIik7XG4gIHZhbHMucHV0KFwicmFjZWNhclwiKTtcbiAgdmFscy5wdXQoXCJub3QgYSBwYWxpbmRyb21lXCIpO1xuICB2YWxzLnB1dChcImFsc28gbm90IGEgcGFsaW5kcm9tZVwiKTtcbiAgdmFscy5wdXQoXCJNYWRhbSBJJ20gQWRhbVwiKTtcbiAgdmFscy5wdXQoXCJBaCwgc2F0YW4gc2VlcyBuYXRhc2hhIVwiKTtcbiAgdmFscy5wdXQoXCJvbmUgbGFzdCB0cnkuLi5cIik7XG5cbiAgUHJvbWlzZS5hbGwoW1xuICAgIHZhbHMudGFrZSgpLnRoZW4oKFtfMSwgXzJdKSA9PiB7XG4gICAgICBhc3NlcnQoXzEsIFwidGFjb2NhdFwiKTtcbiAgICAgIGFzc2VydChfMiwgXCJyYWNlY2FyXCIpO1xuICAgIH0pLFxuICAgIHZhbHMudGFrZSgpLnRoZW4oKFtfMSwgXzJdKSA9PiB7XG4gICAgICBhc3NlcnQoXzEsIFwibm90IGEgcGFsaW5kcm9tZVwiKTtcbiAgICAgIGFzc2VydChfMiwgXCJhbHNvIG5vdCBhIHBhbGluZHJvbWVcIik7XG4gICAgfSksXG4gICAgdmFscy50YWtlKCkudGhlbigoW18xLCBfMl0pID0+IHtcbiAgICAgIGFzc2VydChfMSwgXCJNYWRhbSBJJ20gQWRhbVwiKTtcbiAgICAgIGFzc2VydChfMiwgXCJBaCwgc2F0YW4gc2VlcyBuYXRhc2hhIVwiKTtcbiAgICB9KVxuICBdKS50aGVuKCgpID0+IHZhbHMuY2xvc2UoKSk7XG5cbn0pKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKFwiVGVzdHMgY29tcGxldGUuXCIpKTtcbiJdfQ==
