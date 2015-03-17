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

function assert(expr, val) {
  var msg = arguments[2] === undefined ? "Expected " + val + ", received " + expr : arguments[2];
  return (function () {
    if (expr !== val) {
      throw new Error(msg);
    }

    //console.log("ASSERT", expr, val);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbmh1c2hlci9Qcm9qZWN0cy9qcy1hc3luYy9zcmMvY2hhbm5lbHMvYnVmZmVycy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9jaGFubmVscy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9kaXNwYXRjaC5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9pbmRleC5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9wcm9taXNlLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvc3JjL2NoYW5uZWxzL3V0aWxzLmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvdGVzdC90ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FDSUEsU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUNyRCxPQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDakMsUUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO0dBQ3pDO0NBQ0Y7Ozs7SUFJSyxVQUFVO0FBQ0gsV0FEUCxVQUFVLENBQ0YsQ0FBQyxFQUFFOzBCQURYLFVBQVU7O0FBRVosUUFBSSxJQUFJLEdBQUcsQUFBQyxPQUFPLENBQUMsS0FBSyxRQUFRLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hELFFBQUksQ0FBQyxLQUFLLEdBQUssQ0FBQyxDQUFDO0FBQ2pCLFFBQUksQ0FBQyxLQUFLLEdBQUssQ0FBQyxDQUFDO0FBQ2pCLFFBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDaEM7O2VBUEcsVUFBVTtBQVNkLE9BQUc7YUFBQSxlQUFHO0FBQ0osWUFBSSxNQUFNLFlBQUEsQ0FBQztBQUNYLFlBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRTs7QUFFZCxnQkFBTSxHQUFHLEFBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxHQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQzs7O0FBRy9FLGNBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNoQyxjQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUEsR0FBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNwRCxjQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQztTQUNuQixNQUFNO0FBQ0wsZ0JBQU0sR0FBRyxJQUFJLENBQUM7U0FDZjtBQUNELGVBQU8sTUFBTSxDQUFDO09BQ2Y7O0FBRUQsV0FBTzthQUFBLGlCQUFDLEdBQUcsRUFBRTtBQUNYLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUMvQixZQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUEsR0FBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNwRCxZQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQztPQUNuQjs7QUFFRCxtQkFBZTthQUFBLHlCQUFDLEdBQUcsRUFBRTtBQUNuQixZQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQzFDLGNBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO0FBQ0QsWUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUNuQjs7QUFFRCxVQUFNO2FBQUEsa0JBQUc7QUFDUCxZQUFJLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQzs7QUFFakQsWUFBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDMUIsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFeEQsY0FBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixjQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDekIsY0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7U0FFeEIsTUFBTSxJQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNqQyxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUU5RSxjQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLGNBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUN6QixjQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztTQUV4QixNQUFNO0FBQ0wsY0FBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixjQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLGNBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1NBQ3hCO09BQ0Y7O0FBRUQsV0FBTzthQUFBLGlCQUFDLElBQUksRUFBRTtBQUNaLGFBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QyxjQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRXRCLGNBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2IsbUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUNmO1NBQ0Y7T0FDRjs7QUFFRyxVQUFNO1dBQUEsWUFBRztBQUNYLGVBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztPQUNyQjs7OztTQTFFRyxVQUFVOzs7OztJQStFVixXQUFXO0FBQ0osV0FEUCxXQUFXLENBQ0gsQ0FBQyxFQUFFOzBCQURYLFdBQVc7O0FBRWIsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QixRQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztHQUNoQjs7ZUFKRyxXQUFXO0FBTWYsVUFBTTthQUFBLGtCQUFHO0FBQ1AsZUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO09BQ3hCOztBQUVELE9BQUc7YUFBQSxhQUFDLENBQUMsRUFBRTtBQUNMLFlBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQzlCOztBQUVHLFVBQU07V0FBQSxZQUFHO0FBQ1gsZUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztPQUN6Qjs7QUFFRyxRQUFJO1dBQUEsWUFBRztBQUNULGVBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQztPQUN4Qzs7OztTQXBCRyxXQUFXOzs7OztJQXlCWCxjQUFjO1dBQWQsY0FBYzswQkFBZCxjQUFjOzs7Ozs7O1lBQWQsY0FBYzs7ZUFBZCxjQUFjO0FBQ2xCLE9BQUc7YUFBQSxhQUFDLENBQUMsRUFBRTtBQUNMLFlBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNoQyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN0QjtPQUNGOztBQUVHLFFBQUk7V0FBQSxZQUFHO0FBQ1QsZUFBTyxLQUFLLENBQUM7T0FDZDs7OztTQVRHLGNBQWM7R0FBUyxXQUFXOzs7O0lBY2xDLGFBQWE7V0FBYixhQUFhOzBCQUFiLGFBQWE7Ozs7Ozs7WUFBYixhQUFhOztlQUFiLGFBQWE7QUFDakIsT0FBRzthQUFBLGFBQUMsQ0FBQyxFQUFFO0FBQ0wsWUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ2xDLGNBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO0FBQ0QsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDdEI7O0FBRUcsUUFBSTtXQUFBLFlBQUc7QUFDVCxlQUFPLEtBQUssQ0FBQztPQUNkOzs7O1NBVkcsYUFBYTtHQUFTLFdBQVc7O1FBYTlCLGNBQWMsR0FBZCxjQUFjO1FBQUUsYUFBYSxHQUFiLGFBQWE7UUFBRSxXQUFXLEdBQVgsV0FBVztRQUFFLFVBQVUsR0FBVixVQUFVOzs7Ozs7Ozs7Ozs7O3lCQzlJdkIsY0FBYzs7SUFBN0MsV0FBVyxjQUFYLFdBQVc7SUFBRSxVQUFVLGNBQVYsVUFBVTs7SUFDdkIsUUFBUSxXQUFRLGVBQWUsRUFBL0IsUUFBUTs7SUFDUixPQUFPLFdBQVEsY0FBYyxFQUE3QixPQUFPOzs7O0lBSVYsVUFBVTtBQUNILFdBRFAsVUFBVSxDQUNGLEtBQUssRUFBRTswQkFEZixVQUFVOztBQUVaLFFBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFFBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFFBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0dBQ3JCOztlQVBHLFVBQVU7QUFTZCxVQUFNO2FBQUEsa0JBQUc7OztBQUNQLGVBQU8sVUFBQyxHQUFHLEVBQUs7QUFDZCxjQUFHLE1BQUssUUFBUSxFQUFFO0FBQ2hCLGtCQUFNLElBQUksS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7V0FDdkQ7QUFDRCxnQkFBSyxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ3BCLGdCQUFLLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckIsZ0JBQUssU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7bUJBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQztXQUFBLENBQUMsQ0FBQzs7QUFFcEMsaUJBQU8sTUFBSyxPQUFPLENBQUM7U0FDckIsQ0FBQTtPQUNGOztBQUVELFNBQUs7YUFBQSxlQUFDLFFBQVEsRUFBRTtBQUNkLFlBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNoQixrQkFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6QixNQUFNO0FBQ0wsY0FBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDL0I7T0FDRjs7OztTQTVCRyxVQUFVOzs7OztBQWtDaEIsSUFBSSxRQUFRLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQzs7QUFFOUIsSUFBSSxPQUFPLEdBQUcsaUJBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRTtBQUFFLE1BQUk7QUFBRSxXQUFPLEVBQUUsRUFBRSxDQUFBO0dBQUUsQ0FBQyxPQUFNLENBQUMsRUFBRTtBQUFFLFdBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0dBQUU7Q0FBRSxDQUFBO0FBQ25GLElBQUksV0FBVyxHQUFHLHFCQUFTLElBQUksRUFBRTtBQUMvQixTQUFPLFVBQVMsS0FBSyxFQUFFO0FBQ3JCLFdBQU8sU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUM7R0FDaEQsQ0FBQTtDQUNGLENBQUM7QUFDRixJQUFJLGdCQUFnQixHQUFHLDBCQUFTLENBQUMsRUFBRTtBQUFFLFNBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQUFBQyxPQUFPLEtBQUssQ0FBQztDQUFFLENBQUE7QUFDdEUsSUFBSSxPQUFPLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7O0lBRTFCLE9BQU87QUFDQSxXQURQLE9BQU8sQ0FDQyxTQUFTLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFOzs7OzswQkFENUMsT0FBTzs7QUFFVCxRQUFJLEtBQUssR0FBRyxVQUFBLEdBQUcsRUFBSTtBQUNqQixhQUFPLFdBQVUsTUFBTSxHQUFHLE1BQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFLLE9BQU8sQ0FBQztLQUNoRSxDQUFBOztBQUVELFFBQUksQ0FBQyxPQUFPLEdBQU0sQUFBQyxTQUFTLFlBQVksV0FBVyxHQUFJLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbkcsUUFBSSxDQUFDLE9BQU8sR0FBTSxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyQyxRQUFJLENBQUMsUUFBUSxHQUFLLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JDLFFBQUksQ0FBQyxRQUFRLEdBQUssS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUQsUUFBSSxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQzs7QUFFdkQsUUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7R0FDckI7O2VBYkcsT0FBTztBQWVYLFdBQU87YUFBQSxtQkFBRzs7Ozs7QUFDUixlQUFPLE9BQU8sQ0FBQztpQkFBTSxNQUFLLFFBQVEsQ0FBQyxLQUFLLG1CQUFpQjtTQUFBLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO09BQzdFOztBQUVELFNBQUs7YUFBQSxpQkFBRztBQUNOLGVBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDMUIsY0FBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFakMsY0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFOztBQUNoQixrQkFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQy9CLHNCQUFRLENBQUMsR0FBRyxDQUFDO3VCQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUM7ZUFBQSxDQUFDLENBQUM7O1dBQ3BDO1NBQ0Y7QUFDRCxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztpQkFBTSxLQUFLO1NBQUEsQ0FBQyxDQUFDO09BQ3BDOztBQUVELFFBQUk7YUFBQSxjQUFDLEdBQUc7OztZQUFFLEVBQUUsZ0NBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDOzRCQUFFO0FBQ2xDLGNBQUcsR0FBRyxLQUFLLElBQUksRUFBRTtBQUFFLGtCQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7V0FBRTtBQUN0RSxjQUFHLEVBQUUsRUFBRSxZQUFZLFVBQVUsQ0FBQSxBQUFDLEVBQUU7QUFBRSxrQkFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1dBQUU7QUFDakcsY0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUU7QUFBRSxtQkFBTyxFQUFFLENBQUM7V0FBRTs7QUFFN0IsY0FBRyxDQUFDLE1BQUssSUFBSSxFQUFFOzs7O0FBSWIsY0FBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQ3BCOztBQUVELGNBQUcsQ0FBQyxNQUFLLE9BQU8sQ0FBQyxJQUFJLEVBQUU7O0FBRXJCLGNBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsQixnQkFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDO3FCQUFNLE1BQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU87YUFBQSxFQUFFLE1BQUssVUFBVSxDQUFDLENBQUM7O0FBRXpFLG1CQUFNLE1BQUssT0FBTyxDQUFDLE1BQU0sSUFBSSxNQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDaEQsa0JBQUksT0FBTyxHQUFHLE1BQUssT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDOztBQUVqQyxrQkFBRyxPQUFPLENBQUMsTUFBTSxFQUFFOztBQUNqQixzQkFBSSxHQUFHLEdBQUcsTUFBSyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDaEMsc0JBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQzs7QUFFL0IsMEJBQVEsQ0FBQyxHQUFHLENBQUM7MkJBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQzttQkFBQSxDQUFDLENBQUM7O2VBQ2xDO2FBQ0Y7O0FBRUQsZ0JBQUcsSUFBSSxFQUFFO0FBQUUsb0JBQUssS0FBSyxFQUFFLENBQUM7YUFBRTs7QUFFMUIsbUJBQU8sRUFBRSxDQUFDO1dBQ1gsTUFBTSxJQUFHLE1BQUssT0FBTyxDQUFDLE1BQU0sRUFBRTs7O0FBRzdCLGdCQUFJLE9BQU8sR0FBRyxNQUFLLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFakMsbUJBQU0sTUFBSyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUM1QyxxQkFBTyxHQUFHLE1BQUssT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQzlCOztBQUVELGdCQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFOztBQUM1QixrQkFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xCLG9CQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRS9CLHdCQUFRLENBQUMsR0FBRyxDQUFDO3lCQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7aUJBQUEsQ0FBQyxDQUFDOzthQUNsQyxNQUFNO0FBQ0wsb0JBQUssUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNuQztXQUNGLE1BQU07QUFDTCxrQkFBSyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1dBQ25DOztBQUVELGlCQUFPLEVBQUUsQ0FBQztTQUNYO09BQUE7O0FBRUQsT0FBRzthQUFBLGFBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRTs7O0FBQ25CLGVBQU8sSUFBSSxPQUFPLENBQUMsVUFBQSxPQUFPLEVBQUk7QUFDNUIsZ0JBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDM0MsQ0FBQyxDQUFDO09BQ0o7O0FBRUQsU0FBSzthQUFBLGlCQUF3Qjs7O1lBQXZCLEVBQUUsZ0NBQUcsSUFBSSxVQUFVLEVBQUU7O0FBQ3pCLFlBQUcsRUFBRSxFQUFFLFlBQVksVUFBVSxDQUFBLEFBQUMsRUFBRTtBQUFFLGdCQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7U0FBRTtBQUNsRyxZQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtBQUFFLGlCQUFPLEVBQUUsQ0FBQztTQUFFOztBQUU3QixZQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ3RCLGNBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRW5DLGlCQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDaEQsZ0JBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRWpDLGdCQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUU7O0FBQ2hCLG9CQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFO29CQUN2QixHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQzs7QUFFekIsd0JBQVEsQ0FBQyxHQUFHLENBQUM7eUJBQU0sS0FBSyxFQUFFO2lCQUFBLENBQUMsQ0FBQztBQUM1QixvQkFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDO3lCQUFNLE1BQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU87aUJBQUEsRUFBRSxNQUFLLFVBQVUsQ0FBQyxDQUFDOztBQUV6RSxvQkFBRyxJQUFJLEtBQUssT0FBTyxFQUFFO0FBQUUsd0JBQUssS0FBSyxFQUFFLENBQUM7aUJBQUU7O2FBQ3ZDO1dBQ0Y7O0FBRUQsWUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3JCLE1BQU0sSUFBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUM5QixjQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDOztBQUVqQyxpQkFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDNUMsa0JBQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO1dBQzlCOztBQUVELGNBQUcsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7O0FBQzFCLGtCQUFJLElBQUksR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFO2tCQUNsQixLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRTtrQkFDdkIsR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7O0FBRXpCLHNCQUFRLENBQUMsR0FBRyxDQUFDO3VCQUFNLEtBQUssRUFBRTtlQUFBLENBQUMsQ0FBQztBQUM1QixrQkFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztXQUNYLE1BQU0sSUFBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDcEIsbUJBQU8sQ0FBQztxQkFBTSxNQUFLLE9BQU8sRUFBRTthQUFBLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUUvQyxnQkFBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUN0QixrQkFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQzthQUM3QixNQUFNO0FBQ0wsa0JBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNaO1dBQ0YsTUFBTTtBQUNMLGdCQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztXQUNsQztTQUNGLE1BQU07QUFDTCxjQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNsQzs7QUFFRCxlQUFPLEVBQUUsQ0FBQztPQUNYOztBQUVELFFBQUk7YUFBQSxjQUFDLFVBQVUsRUFBRTs7O0FBQ2YsZUFBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU8sRUFBSTtBQUM1QixnQkFBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3ZDLENBQUMsQ0FBQztPQUNKOztBQUVELFFBQUk7YUFBQSxjQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUU7QUFDWixlQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO09BQ2xDOztBQUVELFNBQUs7YUFBQSxpQkFBRzs7O0FBQ04sWUFBRyxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1osY0FBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7O0FBRXJCLGNBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQzdCLG1CQUFPLENBQUM7cUJBQU0sTUFBSyxPQUFPLEVBQUU7YUFBQSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztXQUNoRDs7QUFFRCxpQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUMxQixnQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFL0IsZ0JBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTs7QUFDZixvQkFBSSxHQUFHLEdBQUcsTUFBSyxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQUssT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUk7b0JBQ3hELE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRTdCLHdCQUFRLENBQUMsR0FBRyxDQUFDO3lCQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7aUJBQUEsQ0FBQyxDQUFDOzthQUNsQztXQUNGO1NBQ0Y7T0FDRjs7QUFFRCxRQUFJO2FBQUEsY0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFO0FBQzNCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQzs7QUFFaEIsaUJBQVMsSUFBSSxDQUFDLEdBQUcsRUFBRTtBQUNqQixjQUFHLEdBQUcsS0FBSyxHQUFHLElBQUksV0FBVyxFQUFFO0FBQzdCLGVBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztXQUNiLE1BQU07QUFDTCxlQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUksRUFBSTtBQUN4QixrQkFBRyxDQUFDLElBQUksSUFBSSxXQUFXLEVBQUU7QUFDdkIsb0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztlQUNkLE1BQU07QUFDTCxvQkFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztlQUMxQjthQUNGLENBQUMsQ0FBQztXQUNKO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFdkIsZUFBTyxTQUFTLENBQUM7T0FDbEI7O0FBRUcsUUFBSTtXQUFBLFlBQUc7QUFDVCxlQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7T0FDckI7Ozs7U0F6TUcsT0FBTzs7O0FBNE1iLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDOztRQUVqQixPQUFPLEdBQVAsT0FBTztRQUFFLFVBQVUsR0FBVixVQUFVOzs7Ozs7Ozs7Ozs7QUNsUTVCLElBQUksb0JBQW9CLEdBQUcsQUFBQyxPQUFPLFlBQVksS0FBSyxVQUFVLEdBQUksVUFBUyxFQUFFLEVBQUU7QUFDN0UsU0FBTyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDekIsR0FBRyxVQUFTLEVBQUUsRUFBRTtBQUNmLFNBQU8sVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQ3ZCLENBQUM7O0lBRUksUUFBUTtBQUNELFdBRFAsUUFBUSxDQUNBLGFBQWEsRUFBRTswQkFEdkIsUUFBUTs7QUFFVixRQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsSUFBSSxvQkFBb0IsQ0FBQztBQUM1RCxRQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztHQUNsQjs7ZUFKRyxRQUFRO0FBTVosT0FBRzthQUFBLGFBQUMsRUFBRSxFQUFFOzs7QUFDTixZQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzs7QUFFckIsWUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFNO0FBQ3hCLGlCQUFNLE1BQUssTUFBTSxDQUFDLE1BQU0sRUFBRTs7QUFFeEIsa0JBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7V0FDdkI7U0FDRixDQUFDLENBQUM7T0FDSjs7OztTQWZHLFFBQVE7OztRQW1CTCxRQUFRLEdBQVIsUUFBUTs7Ozs7Ozs7OzBCQ3pCbUIsZUFBZTs7SUFBMUMsT0FBTyxlQUFQLE9BQU87SUFBRSxVQUFVLGVBQVYsVUFBVTs7eUJBQzJDLGNBQWM7O0lBQTVFLFdBQVcsY0FBWCxXQUFXO0lBQUUsY0FBYyxjQUFkLGNBQWM7SUFBRSxhQUFhLGNBQWIsYUFBYTtJQUFFLFVBQVUsY0FBVixVQUFVOzt1QkFDVyxZQUFZOztJQUE3RSxJQUFJLFlBQUosSUFBSTtJQUFFLE9BQU8sWUFBUCxPQUFPO0lBQUUsS0FBSyxZQUFMLEtBQUs7SUFBRSxHQUFHLFlBQUgsR0FBRztJQUFFLE1BQU0sWUFBTixNQUFNO0lBQUUsV0FBVyxZQUFYLFdBQVc7SUFBRSxTQUFTLFlBQVQsU0FBUztRQUc5RCxPQUFPLEdBQVAsT0FBTztRQUNQLFVBQVUsR0FBVixVQUFVO1FBQ1YsV0FBVyxHQUFYLFdBQVc7UUFDWCxjQUFjLEdBQWQsY0FBYztRQUNkLGFBQWEsR0FBYixhQUFhO1FBQ2IsVUFBVSxHQUFWLFVBQVU7UUFDVixJQUFJLEdBQUosSUFBSTtRQUNKLE9BQU8sR0FBUCxPQUFPO1FBQ1AsS0FBSyxHQUFMLEtBQUs7UUFDTCxHQUFHLEdBQUgsR0FBRztRQUNILE1BQU0sR0FBTixNQUFNO1FBQ04sV0FBVyxHQUFYLFdBQVc7UUFDWCxTQUFTLEdBQVQsU0FBUzs7Ozs7Ozs7O0FDakJiLElBQUksUUFBUSxDQUFDOztBQUViLElBQUcsT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7QUFDbEQsVUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7Q0FDM0IsTUFBTSxJQUFHLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFO0FBQ3pELFVBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0NBQzNCLE1BQU07QUFDTCxRQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7Q0FDbEU7O1FBRW9CLE9BQU8sR0FBbkIsUUFBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7UUNLRCxJQUFJLEdBQUosSUFBSTtRQWtDSixPQUFPLEdBQVAsT0FBTzs7OztRQVFQLEtBQUssR0FBTCxLQUFLO1FBaUJMLEdBQUcsR0FBSCxHQUFHO1FBWUgsTUFBTSxHQUFOLE1BQU07UUFjTixXQUFXLEdBQVgsV0FBVztRQTBCWCxTQUFTLEdBQVQsU0FBUzs7Ozs7MEJBOUhXLGVBQWU7O0lBQTFDLE9BQU8sZUFBUCxPQUFPO0lBQUUsVUFBVSxlQUFWLFVBQVU7O0lBR3RCLGNBQWM7QUFDUCxXQURQLGNBQWMsQ0FDTixLQUFLLEVBQUUsUUFBUSxFQUFFOzBCQUR6QixjQUFjOztBQUVoQiwrQkFGRSxjQUFjLDZDQUVWLEtBQUssRUFBRTtBQUNiLFFBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0dBQzFCOztZQUpHLGNBQWM7O2VBQWQsY0FBYztBQUtsQixVQUFNO2FBQUEsa0JBQUc7QUFDUCxZQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsMENBUEUsY0FBYyx3Q0FPTTtPQUN2Qjs7OztTQVJHLGNBQWM7R0FBUyxVQUFVOztBQVloQyxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDekIsTUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLE1BQUksS0FBSyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7O0FBRTFCLE1BQUksVUFBVSxHQUFHLFlBQU07QUFBRSxlQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQzthQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSztLQUFBLENBQUMsQ0FBQTtHQUFFLENBQUE7O0FBRXJFLE1BQUksQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHLEVBQUk7O0FBRWQsUUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFOzs7O0FBQ3JCLFlBQUksRUFBRSxHQUFHLElBQUksY0FBYyxDQUFDLEdBQUcsRUFBRSxZQUFNO0FBQ3JDLHFCQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQzttQkFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUs7V0FBQSxDQUFDLENBQUM7U0FDNUMsQ0FBQyxDQUFDOzhCQUNlLEdBQUc7WUFBZixFQUFFO1lBQUUsR0FBRzs7QUFDYixVQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBVztBQUM5QixlQUFLLENBQUMsR0FBRyxDQUFDLENBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBRSxDQUFDLENBQUM7U0FDeEIsQ0FBQyxDQUFDOztBQUVILG1CQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDOztLQUN0QixNQUFNO0FBQ0wsVUFBSSxFQUFFLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFLFlBQU07QUFDdEMsbUJBQVcsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDO2lCQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSztTQUFBLENBQUMsQ0FBQztPQUM1QyxDQUFDLENBQUM7O0FBRUgsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBUyxHQUFHLEVBQUU7QUFDOUIsYUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEdBQUcsRUFBRSxHQUFHLENBQUUsQ0FBQyxDQUFDO09BQ3pCLENBQUMsQ0FBQzs7QUFFSCxpQkFBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUN0QjtHQUNGLENBQUMsQ0FBQzs7QUFFSCxTQUFPLEtBQUssQ0FBQztDQUNkOztBQUVNLFNBQVMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUMxQixNQUFJLEVBQUUsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQ3ZCLFlBQVUsQ0FBQyxZQUFNO0FBQUUsTUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO0dBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN0QyxTQUFPLEVBQUUsQ0FBQztDQUNYOztBQUlNLFNBQVMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7QUFDckMsTUFBSSxLQUFLLEdBQUcsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRW5DLFdBQVMsS0FBSyxHQUFHO0FBQ2YsUUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFBLEdBQUcsRUFBSTtBQUN0QixVQUFHLEdBQUcsS0FBSyxJQUFJLEVBQUU7QUFDZixhQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7T0FDZixNQUFNO0FBQ0wsYUFBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDNUI7S0FDRixDQUFDLENBQUM7R0FDSjtBQUNELE9BQUssRUFBRSxDQUFDOztBQUVSLFNBQU8sS0FBSyxDQUFDO0NBQ2Q7O0FBRU0sU0FBUyxHQUFHLENBQUMsRUFBRSxFQUFFO0FBQ3RCLFNBQU8sVUFBUyxJQUFJLEVBQUU7QUFDcEIsV0FBTyxVQUFTLEdBQUcsRUFBRTtBQUNuQixVQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFDbkIsZUFBTyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7T0FDdEIsTUFBTTtBQUNMLGVBQU8sSUFBSSxFQUFFLENBQUM7T0FDZjtLQUNGLENBQUE7R0FDRixDQUFBO0NBQ0Y7O0FBRU0sU0FBUyxNQUFNLENBQUMsRUFBRSxFQUFFO0FBQ3pCLFNBQU8sVUFBUyxJQUFJLEVBQUU7QUFDcEIsV0FBTyxVQUFTLEdBQUcsRUFBRTtBQUNuQixVQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFDbkIsWUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDWCxpQkFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbEI7T0FDRixNQUFNO0FBQ0wsZUFBTyxJQUFJLEVBQUUsQ0FBQztPQUNmO0tBQ0YsQ0FBQTtHQUNGLENBQUE7Q0FDRjs7QUFFTSxTQUFTLFdBQVcsQ0FBQyxFQUFFLEVBQUU7QUFDOUIsTUFBSSxJQUFJLEdBQUcsSUFBSTtNQUNYLFdBQVcsR0FBRyxFQUFFLENBQUM7O0FBRXJCLFNBQU8sVUFBUyxJQUFJLEVBQUU7QUFDcEIsV0FBTyxVQUFTLEdBQUcsRUFBRTtBQUNuQixVQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFDbkIsWUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlCLFlBQUcsSUFBSSxLQUFLLElBQUksSUFBSSxlQUFlLEtBQUssSUFBSSxFQUFFO0FBQzVDLGNBQUksR0FBRyxHQUFHLFdBQVcsQ0FBQzs7QUFFdEIscUJBQVcsR0FBRyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQ3RCLGNBQUksR0FBRyxlQUFlLENBQUM7O0FBRXZCLGlCQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNsQixNQUFNO0FBQ0wsY0FBSSxHQUFHLGVBQWUsQ0FBQztBQUN2QixxQkFBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN2QjtPQUNGLE1BQU07QUFDTCxlQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztPQUMxQjtLQUNGLENBQUE7R0FDRixDQUFBO0NBQ0Y7O0FBRU0sU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFO0FBQzdCLE1BQUksQ0FBQyxHQUFHLENBQUM7TUFDTCxDQUFDLEdBQUcsRUFBRSxDQUFDOztBQUVYLFNBQU8sVUFBUyxJQUFJLEVBQUU7QUFDcEIsV0FBTyxVQUFTLEdBQUcsRUFBRTtBQUNuQixVQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFDbkIsU0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLFNBQUMsSUFBSSxDQUFDLENBQUM7O0FBRVAsWUFBRyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsRUFBRTtBQUNoQixjQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7O0FBRVosV0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFUCxpQkFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbEI7T0FDRixNQUFNO0FBQ0wsZUFBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDaEI7S0FDRixDQUFBO0dBQ0YsQ0FBQTtDQUNGOzs7Ozs7O2tDQ3RJTSwwQkFBMEI7O0lBWjdCLE9BQU8sdUJBQVAsT0FBTztJQUNQLFVBQVUsdUJBQVYsVUFBVTtJQUNWLFdBQVcsdUJBQVgsV0FBVztJQUNYLGFBQWEsdUJBQWIsYUFBYTtJQUNiLGNBQWMsdUJBQWQsY0FBYztJQUNkLElBQUksdUJBQUosSUFBSTtJQUNKLE9BQU8sdUJBQVAsT0FBTztJQUNQLEtBQUssdUJBQUwsS0FBSztJQUNMLEdBQUcsdUJBQUgsR0FBRztJQUNILE1BQU0sdUJBQU4sTUFBTTtJQUNOLFdBQVcsdUJBQVgsV0FBVztJQUNYLFNBQVMsdUJBQVQsU0FBUzs7QUFHYixTQUFTLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRztNQUFFLEdBQUcsOENBQWUsR0FBRyxtQkFBYyxJQUFJO3NCQUFJO0FBQ3BFLFFBQUcsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUNmLFlBQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDdEI7OztBQUFBLEdBR0Y7Q0FBQTs7QUFFRCxTQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUU7QUFDckIsUUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUN0Qjs7QUFFRCxTQUFTLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO0FBQ2hDLE1BQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLEVBQUk7QUFDekIsUUFBSSxRQUFRLFlBQUE7UUFBRSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsVUFBQSxDQUFDO2FBQUksUUFBUSxHQUFHLENBQUM7S0FBQSxDQUFDLENBQUM7QUFDdkQsUUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQzs7QUFFcEIsS0FBQyxDQUFDLEtBQUssR0FBRyxZQUFNO0FBQ2QsV0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNkLGNBQVEsRUFBRSxDQUFDO0tBQ1osQ0FBQTs7QUFFRCxXQUFPLE9BQU8sQ0FBQztHQUNoQixDQUFDLENBQUM7O0FBRUgsTUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7O0FBRXhCLFNBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUMzQjs7QUFFRCxTQUFTLEtBQUssQ0FBQyxFQUFFLEVBQVc7b0NBQU4sSUFBSTtBQUFKLFFBQUk7OztBQUN4QixTQUFPLFlBQU07QUFDWCxXQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQzdCLENBQUE7Q0FDRjs7Ozs7QUFLRCxDQUFDLFlBQU07Ozs7O0FBS0wsTUFBSSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTVCLEtBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDeEIsUUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzs7QUFFdEIsS0FBRyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN4QixRQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDOztBQUV0QixNQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDWixTQUFNLENBQUMsRUFBRyxFQUFFO0FBQ1YsT0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUN4QjtBQUNELFNBQU0sR0FBRyxDQUFDLE1BQU0sRUFBRTtBQUNoQixVQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUMvQjtDQUVGLENBQUEsRUFBRyxDQUFDOztBQUVMLENBQUMsWUFBTTtBQUNMLE1BQUksR0FBRyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUU3QixLQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ1osUUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdkIsUUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN6QixRQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQzs7QUFFeEIsS0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNaLFFBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLFFBQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDekIsUUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Q0FFekIsQ0FBQSxFQUFHLENBQUM7O0FBRUwsQ0FBQyxZQUFNO0FBQ0wsTUFBSSxHQUFHLEdBQUcsSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRS9CLEtBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDWixRQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN4QixRQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3pCLFFBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDOztBQUV4QixLQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ1osUUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDeEIsS0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNaLFFBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3hCLFFBQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7O0FBRXpCLE1BQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNaLFNBQU0sQ0FBQyxFQUFHLEVBQUU7QUFDVixPQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0dBQ1o7QUFDRCxRQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBR3pCLENBQUEsRUFBRyxDQUFDOztBQUVMLENBQUMsWUFBTTs7QUFFTCxNQUFJLEdBQUcsR0FBRyxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFaEMsS0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNaLFFBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3hCLFFBQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDekIsUUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7O0FBRXhCLEtBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDWixRQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN4QixLQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ1osUUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDeEIsUUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzs7QUFFekIsTUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ1osU0FBTSxDQUFDLEVBQUcsRUFBRTtBQUNWLE9BQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDWjtBQUNELFFBQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7Q0FFM0IsQ0FBQSxFQUFHLENBQUM7OztBQUdMLFdBQVcsQ0FBQyxDQUFFLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFFLEVBQUUsVUFBQSxPQUFPLEVBQUk7Ozs7O0FBS3pDLFNBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZixTQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2YsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFZixTQUFPLENBQUMsR0FBRyxDQUFDLENBRVYsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUM7V0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUFBLENBQUMsRUFDeEMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUM7V0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUFBLENBQUMsRUFDeEMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUM7V0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FFekMsQ0FBQyxDQUFDLElBQUksQ0FBQztXQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUU7R0FBQSxDQUFDLENBQUM7Q0FFaEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUUsSUFBSSxPQUFPLENBQUMsSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxFQUFFLFVBQUMsT0FBTyxFQUFLOzs7OztBQUs3RSxTQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2YsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNmLFNBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRWYsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUVWLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDO1dBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7R0FBQSxDQUFDLEVBQ3hDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDO1dBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7R0FBQSxDQUFDLENBRXpDLENBQUMsQ0FBQyxJQUFJLENBQUM7V0FBTSxPQUFPLENBQUMsS0FBSyxFQUFFO0dBQUEsQ0FBQyxDQUFDO0NBRWhDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUUsSUFBSSxPQUFPLENBQUMsSUFBSSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxFQUFFLFVBQUEsT0FBTyxFQUFJOzs7OztBQUs3RSxTQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2YsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNmLFNBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRWYsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUVWLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDO1dBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7R0FBQSxDQUFDLEVBQ3hDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDO1dBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7R0FBQSxDQUFDLENBRXpDLENBQUMsQ0FBQyxJQUFJLENBQUM7V0FBTSxPQUFPLENBQUMsS0FBSyxFQUFFO0dBQUEsQ0FBQyxDQUFDOztBQUUvQixTQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Q0FFakIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBRSxJQUFJLE9BQU8sRUFBRSxFQUFFLElBQUksT0FBTyxFQUFFLEVBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBRSxFQUFFLFVBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUs7Ozs7Ozs7O0FBU3BHLFlBQVUsQ0FBQyxZQUFXO0FBQUUsU0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztHQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLFlBQVUsQ0FBQyxZQUFXO0FBQUUsU0FBSyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztHQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDbEUsWUFBVSxDQUFDLFlBQVc7QUFBRSxTQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0dBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNsRSxZQUFVLENBQUMsWUFBVztBQUFFLFNBQUssQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztHQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7O0FBRWxFLFNBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFvQjs7O1FBQWpCLEVBQUU7UUFBRSxFQUFFO1FBQUUsRUFBRTs7QUFDckQsVUFBTSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNyQixVQUFNLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQzNCLFVBQU0sQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7O0FBRXpCLFdBQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0dBRXJCLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDLEVBQUk7QUFDWCxVQUFNLENBQUMsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7O0FBRWxDLFNBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNkLFNBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNkLFNBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztHQUNmLENBQUMsQ0FBQztDQUVKLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBRSxFQUFFLFVBQUMsT0FBTyxFQUFLOzs7OztBQUsxRCxXQUFTLElBQUksQ0FBQyxHQUFHLEVBQUU7QUFDakIsV0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFTLE9BQU8sRUFBRTtBQUNuQyxnQkFBVSxDQUFDLFlBQVc7QUFDcEIsZUFBTyxFQUFFLENBQUM7T0FDWCxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ1QsQ0FBQyxDQUFDO0dBQ0o7O0FBRUQsU0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1dBQU0sR0FBRztHQUFBLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLFNBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUs7QUFDekIsVUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNmLFdBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztHQUNqQixDQUFDLENBQUM7Q0FFSixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFLEVBQUUsWUFBTSxFQU1yQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFFLElBQUksT0FBTyxFQUFFLEVBQUUsSUFBSSxPQUFPLEVBQUUsRUFBRSxJQUFJLE9BQU8sRUFBRSxDQUFFLEVBQUUsVUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBSzs7Ozs7QUFLcEcsTUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFpQjs7O1FBQWYsR0FBRztRQUFFLElBQUk7O0FBQ3hELFVBQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDcEIsVUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztHQUVsQixDQUFDLENBQUM7O0FBRUgsTUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFtQjs7O1FBQWhCLEdBQUc7UUFBRSxJQUFJOztBQUN6RCxVQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3BCLFVBQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDbEIsQ0FBQyxDQUFDOzs7QUFHSCxNQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBRSxDQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQW1COzs7UUFBaEIsR0FBRztRQUFFLElBQUk7O0FBQ3pFLFVBQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDcEIsVUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztHQUNsQixDQUFDLENBQUM7O0FBRUgsT0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2IsT0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmLE9BQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRWYsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUM5QyxTQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDZCxTQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDZCxTQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7R0FDZixDQUFDLENBQUM7Q0FFSixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFFLElBQUksT0FBTyxFQUFFLENBQUUsRUFBRSxVQUFDLE9BQU8sRUFBSzs7Ozs7OztBQVExRCxNQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRTdCLFNBQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztXQUFNLEdBQUc7R0FBQSxDQUFDLENBQUMsQ0FBQztBQUMxQyxTQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7V0FBTSxHQUFHO0dBQUEsQ0FBQyxDQUFDLENBQUM7OztBQUcxQyxTQUFPLENBQUMsR0FBRyxDQUFDLENBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUF1Qjs7O1FBQXBCLEtBQUs7UUFBRSxNQUFNOztBQUNyRCxVQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLFVBQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDcEIsV0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0dBQ2pCLENBQUMsQ0FBQztDQUdKLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBRSxFQUFFLFVBQUMsT0FBTyxFQUFLOztBQUUxRCxTQUFPLENBQUMsR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLFlBQU07QUFDNUIsVUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO0dBQ25CLENBQUMsQ0FBQyxDQUFDOztBQUVKLFNBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRWpCLE1BQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDO1dBQUksUUFBUSxDQUFDLG1DQUFtQyxDQUFDO0dBQUEsRUFBRSxVQUFBLENBQUMsRUFBSSxFQUFFLENBQUMsQ0FBQztBQUMvRixNQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUEsQ0FBQztXQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO0dBQUEsQ0FBQyxDQUFDOztBQUV2RCxTQUFPLENBQUMsR0FBRyxDQUFDLENBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1dBQU0sT0FBTyxDQUFDLEtBQUssRUFBRTtHQUFBLENBQUMsQ0FBQztDQUU5RCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFFLElBQUksT0FBTyxFQUFFLENBQUUsRUFBRSxVQUFDLE9BQU8sRUFBSzs7QUFFMUQsU0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBVztBQUMvQixXQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVMsQ0FBQyxFQUFFO0FBQzlCLFlBQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDZixhQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDakIsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOzs7O0FBSUgsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFXO0FBQzNCLFdBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBUyxDQUFDLEVBQUU7QUFDOUIsWUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNmLGFBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDbEIsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBRUosQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBRSxJQUFJLE9BQU8sRUFBRSxDQUFFLEVBQUUsVUFBQyxPQUFPLEVBQUs7O0FBRTFELFNBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakIsU0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQixTQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRWhCLFNBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDO1dBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUM7R0FBQSxDQUFDLENBQUM7QUFDekMsU0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUM7V0FBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztHQUFBLENBQUMsQ0FBQztDQUcxQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUMxQixJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQUEsQ0FBQztTQUFJLENBQUMsR0FBRyxDQUFDO0NBQUEsQ0FBQyxDQUFDLENBQ2hDLEVBQUUsVUFBQyxPQUFPLEVBQUs7OztBQUdkLFNBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZixTQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2YsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFZixTQUFPLENBQUMsR0FBRyxDQUFDLENBRVYsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUM7V0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUFBLENBQUMsRUFDeEMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUM7V0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUFBLENBQUMsRUFDeEMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUM7V0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FFekMsQ0FBQyxDQUFDLElBQUksQ0FBQztXQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUU7R0FBQSxDQUFDLENBQUM7Q0FHaEMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FDMUIsSUFBSSxPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFBLENBQUM7U0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7Q0FBQSxDQUFDLENBQUMsQ0FDekMsRUFBRSxVQUFDLEtBQUssRUFBSzs7O0FBR1osT0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNiLE9BQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDYixPQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2IsT0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFYixTQUFPLENBQUMsR0FBRyxDQUFDLENBRVYsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUM7V0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUFBLENB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QixVQUFNLENBQUMsRUFBRSxFQUFFLHVCQUF1QixDQUFDLENBQUM7R0FDckMsQ0FBQyxFQUNGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWM7OztRQUFaLEVBQUU7UUFBRSxFQUFFOztBQUN2QixVQUFNLENBQUMsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDN0IsVUFBTSxDQUFDLEVBQUUsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0dBQ3ZDLENBQUMsQ0FDSCxDQUFDLENBQUMsSUFBSSxDQUFDO1dBQU0sSUFBSSxDQUFDLEtBQUssRUFBRTtHQUFBLENBQUMsQ0FBQztDQUU3QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FBTSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0NBQUEsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLy9cbi8vIFRPRE86IHRoaXMgaXNuJ3QgaWRpb21hdGljYWxseSBqYXZhc2NyaXB0IChjb3VsZCBwcm9iYWJseSB1c2Ugc2xpY2Uvc3BsaWNlIHRvIGdvb2QgZWZmZWN0KVxuLy9cbmZ1bmN0aW9uIGFjb3B5KHNyYywgc3JjU3RhcnQsIGRlc3QsIGRlc3RTdGFydCwgbGVuZ3RoKSB7XG4gIGZvcihsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGRlc3RbaSArIGRlc3RTdGFydF0gPSBzcmNbaSArIHNyY1N0YXJ0XTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBSaW5nQnVmZmVyIHtcbiAgY29uc3RydWN0b3Iocykge1xuICAgIGxldCBzaXplID0gKHR5cGVvZiBzID09PSAnbnVtYmVyJykgPyBNYXRoLm1heCgxLCBzKSA6IDE7XG4gICAgdGhpcy5fdGFpbCAgID0gMDtcbiAgICB0aGlzLl9oZWFkICAgPSAwO1xuICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgdGhpcy5fdmFsdWVzID0gbmV3IEFycmF5KHNpemUpO1xuICB9XG5cbiAgcG9wKCkge1xuICAgIGxldCByZXN1bHQ7XG4gICAgaWYodGhpcy5sZW5ndGgpIHtcbiAgICAgIC8vIEdldCB0aGUgaXRlbSBvdXQgb2YgdGhlIHNldCBvZiB2YWx1ZXNcbiAgICAgIHJlc3VsdCA9ICh0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gIT09IG51bGwpID8gdGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdIDogbnVsbDtcblxuICAgICAgLy8gUmVtb3ZlIHRoZSBpdGVtIGZyb20gdGhlIHNldCBvZiB2YWx1ZXMsIHVwZGF0ZSBpbmRpY2llc1xuICAgICAgdGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdID0gbnVsbDtcbiAgICAgIHRoaXMuX3RhaWwgPSAodGhpcy5fdGFpbCArIDEpICUgdGhpcy5fdmFsdWVzLmxlbmd0aDtcbiAgICAgIHRoaXMuX2xlbmd0aCAtPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgdW5zaGlmdCh2YWwpIHtcbiAgICB0aGlzLl92YWx1ZXNbdGhpcy5faGVhZF0gPSB2YWw7XG4gICAgdGhpcy5faGVhZCA9ICh0aGlzLl9oZWFkICsgMSkgJSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuICAgIHRoaXMuX2xlbmd0aCArPSAxO1xuICB9XG5cbiAgcmVzaXppbmdVbnNoaWZ0KHZhbCkge1xuICAgIGlmKHRoaXMubGVuZ3RoICsgMSA9PT0gdGhpcy5fdmFsdWVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICB9XG4gICAgdGhpcy51bnNoaWZ0KHZhbCk7XG4gIH1cblxuICByZXNpemUoKSB7XG4gICAgbGV0IG5ld0FycnkgPSBuZXcgQXJyYXkodGhpcy5fdmFsdWVzLmxlbmd0aCAqIDIpO1xuXG4gICAgaWYodGhpcy5fdGFpbCA8IHRoaXMuX2hlYWQpIHtcbiAgICAgIGFjb3B5KHRoaXMuX3ZhbHVlcywgdGhpcy5fdGFpbCwgbmV3QXJyeSwgMCwgdGhpcy5faGVhZCk7XG5cbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMubGVuZ3RoO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcblxuICAgIH0gZWxzZSBpZih0aGlzLl9oZWFkIDwgdGhpcy5fdGFpbCkge1xuICAgICAgYWNvcHkodGhpcy5fdmFsdWVzLCAwLCBuZXdBcnJ5LCB0aGlzLl92YWx1ZXMubGVuZ3RoIC0gdGhpcy5fdGFpbCwgdGhpcy5faGVhZCk7XG5cbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMubGVuZ3RoO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSAwO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcbiAgICB9XG4gIH1cblxuICBjbGVhbnVwKGtlZXApIHtcbiAgICBmb3IobGV0IGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgIGxldCBpdGVtID0gdGhpcy5wb3AoKTtcblxuICAgICAgaWYoa2VlcChpdGVtKSkge1xuICAgICAgICB1bnNoaWZ0KGl0ZW0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBGaXhlZEJ1ZmZlciB7XG4gIGNvbnN0cnVjdG9yKG4pIHtcbiAgICB0aGlzLl9idWYgPSBuZXcgUmluZ0J1ZmZlcihuKTtcbiAgICB0aGlzLl9zaXplID0gbjtcbiAgfVxuXG4gIHJlbW92ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLnBvcCgpO1xuICB9XG5cbiAgYWRkKHYpIHtcbiAgICB0aGlzLl9idWYucmVzaXppbmdVbnNoaWZ0KHYpO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLmxlbmd0aDtcbiAgfVxuXG4gIGdldCBmdWxsKCkge1xuICAgIHJldHVybiB0aGlzLl9idWYubGVuZ3RoID09PSB0aGlzLl9zaXplO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIERyb3BwaW5nQnVmZmVyIGV4dGVuZHMgRml4ZWRCdWZmZXIge1xuICBhZGQodikge1xuICAgIGlmKHRoaXMuX2J1Zi5sZW5ndGggPCB0aGlzLl9zaXplKSB7XG4gICAgICB0aGlzLl9idWYudW5zaGlmdCh2KTtcbiAgICB9XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgU2xpZGluZ0J1ZmZlciBleHRlbmRzIEZpeGVkQnVmZmVyIHtcbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLl9idWYubGVuZ3RoID09PSB0aGlzLl9zaXplKSB7XG4gICAgICB0aGlzLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLl9idWYudW5zaGlmdCh2KTtcbiAgfVxuXG4gIGdldCBmdWxsKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgeyBEcm9wcGluZ0J1ZmZlciwgU2xpZGluZ0J1ZmZlciwgRml4ZWRCdWZmZXIsIFJpbmdCdWZmZXIgfTsiLCJcbmltcG9ydCB7IEZpeGVkQnVmZmVyLCBSaW5nQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVycy5qc1wiO1xuaW1wb3J0IHsgRGlzcGF0Y2ggfSBmcm9tIFwiLi9kaXNwYXRjaC5qc1wiO1xuaW1wb3J0IHsgUHJvbWlzZSB9IGZyb20gXCIuL3Byb21pc2UuanNcIjtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyKSB7XG4gICAgdGhpcy5vZmZlcmVkID0gb2ZmZXI7XG4gICAgdGhpcy5yZWNlaXZlZCA9IG51bGw7XG4gICAgdGhpcy5yZXNvbHZlZCA9IGZhbHNlO1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IFtdO1xuICB9XG5cbiAgY29tbWl0KCkge1xuICAgIHJldHVybiAodmFsKSA9PiB7XG4gICAgICBpZih0aGlzLnJlc29sdmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHJlc29sdmUgdHJhbnNhY3RvciB0d2ljZSFcIik7XG4gICAgICB9XG4gICAgICB0aGlzLnJlY2VpdmVkID0gdmFsO1xuICAgICAgdGhpcy5yZXNvbHZlZCA9IHRydWU7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5mb3JFYWNoKGMgPT4gYyh2YWwpKTtcblxuICAgICAgcmV0dXJuIHRoaXMub2ZmZXJlZDtcbiAgICB9XG4gIH1cblxuICBkZXJlZihjYWxsYmFjaykge1xuICAgIGlmKHRoaXMucmVzb2x2ZWQpIHtcbiAgICAgIGNhbGxiYWNrKHRoaXMucmVjZWl2ZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5sZXQgZGlzcGF0Y2ggPSBuZXcgRGlzcGF0Y2goKTtcblxubGV0IGF0dGVtcHQgPSBmdW5jdGlvbihmbiwgZXhoKSB7IHRyeSB7IHJldHVybiBmbigpIH0gY2F0Y2goZSkgeyByZXR1cm4gZXhoKGUpOyB9IH1cbmxldCBwYXNzdGhyb3VnaCA9IGZ1bmN0aW9uKG5leHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyBuZXh0KHZhbHVlKSA6IG5leHQoKTtcbiAgfVxufTtcbmxldCBkZWZhdWx0RXhIYW5kbGVyID0gZnVuY3Rpb24oZSkgeyBjb25zb2xlLmVycm9yKGUpOyByZXR1cm4gZmFsc2U7IH1cbmxldCByZWR1Y2VkID0geyByZWR1Y2VkOiB0cnVlIH07XG5cbmNsYXNzIENoYW5uZWwge1xuICBjb25zdHJ1Y3RvcihzaXplT3JCdWYsIHhmb3JtLCBleGNlcHRpb25IYW5kbGVyKSB7XG4gICAgbGV0IGRvQWRkID0gdmFsID0+IHtcbiAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gdGhpcy5fYnVmZmVyLmFkZCh2YWwpIDogdGhpcy5fYnVmZmVyO1xuICAgIH1cblxuICAgIHRoaXMuX2J1ZmZlciAgICA9IChzaXplT3JCdWYgaW5zdGFuY2VvZiBGaXhlZEJ1ZmZlcikgPyBzaXplT3JCdWYgOiBuZXcgRml4ZWRCdWZmZXIoc2l6ZU9yQnVmIHx8IDApO1xuICAgIHRoaXMuX3Rha2VycyAgICA9IG5ldyBSaW5nQnVmZmVyKDMyKTtcbiAgICB0aGlzLl9wdXR0ZXJzICAgPSBuZXcgUmluZ0J1ZmZlcigzMik7XG4gICAgdGhpcy5feGZvcm1lciAgID0geGZvcm0gPyB4Zm9ybShkb0FkZCkgOiBwYXNzdGhyb3VnaChkb0FkZCk7XG4gICAgdGhpcy5fZXhIYW5kbGVyID0gZXhjZXB0aW9uSGFuZGxlciB8fCBkZWZhdWx0RXhIYW5kbGVyO1xuXG4gICAgdGhpcy5faXNPcGVuID0gdHJ1ZTtcbiAgfVxuXG4gIF9pbnNlcnQoKSB7XG4gICAgcmV0dXJuIGF0dGVtcHQoKCkgPT4gdGhpcy5feGZvcm1lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCB0aGlzLl9leEhhbmRsZXIpO1xuICB9XG5cbiAgYWJvcnQoKSB7XG4gICAgd2hpbGUodGhpcy5fcHV0dGVycy5sZW5ndGgpIHtcbiAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuXG4gICAgICBpZihwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgIGxldCBwdXR0ZXJDYiA9IHB1dHRlci5jb21taXQoKTtcbiAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHB1dHRlckNiKHRydWUpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fcHV0dGVycy5jbGVhbnVwKCgpID0+IGZhbHNlKTtcbiAgfVxuXG4gIGZpbGwodmFsLCB0eCA9IG5ldyBUcmFuc2FjdG9yKHZhbCkpIHtcbiAgICBpZih2YWwgPT09IG51bGwpIHsgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHB1dCBudWxsIHRvIGEgY2hhbm5lbC5cIik7IH1cbiAgICBpZighKHR4IGluc3RhbmNlb2YgVHJhbnNhY3RvcikpIHsgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0aW5nIFRyYW5zYWN0b3IgdG8gYmUgcGFzc2VkIHRvIGZpbGxcIik7IH1cbiAgICBpZighdHguYWN0aXZlKSB7IHJldHVybiB0eDsgfVxuXG4gICAgaWYoIXRoaXMub3Blbikge1xuICAgICAgLy8gRWl0aGVyIHNvbWVib2R5IGhhcyByZXNvbHZlZCB0aGUgaGFuZGxlciBhbHJlYWR5ICh0aGF0IHdhcyBmYXN0KSBvciB0aGUgY2hhbm5lbCBpcyBjbG9zZWQuXG4gICAgICAvLyBjb3JlLmFzeW5jIHJldHVybnMgYSBib29sZWFuIG9mIHdoZXRoZXIgb3Igbm90IHNvbWV0aGluZyAqY291bGQqIGdldCBwdXQgdG8gdGhlIGNoYW5uZWxcbiAgICAgIC8vIHdlJ2xsIGRvIHRoZSBzYW1lICNjYXJnb2N1bHRcbiAgICAgIHR4LmNvbW1pdCgpKGZhbHNlKTtcbiAgICB9XG5cbiAgICBpZighdGhpcy5fYnVmZmVyLmZ1bGwpIHtcbiAgICAgIC8vIFRoZSBjaGFubmVsIGhhcyBzb21lIGZyZWUgc3BhY2UuIFN0aWNrIGl0IGluIHRoZSBidWZmZXIgYW5kIHRoZW4gZHJhaW4gYW55IHdhaXRpbmcgdGFrZXMuXG4gICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgIGxldCBkb25lID0gYXR0ZW1wdCgoKSA9PiB0aGlzLl9pbnNlcnQodmFsKSA9PT0gcmVkdWNlZCwgdGhpcy5fZXhIYW5kbGVyKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiB0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgIGxldCB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcbiAgICAgICAgICBsZXQgdGFrZXJDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihkb25lKSB7IHRoaXMuYWJvcnQoKTsgfVxuXG4gICAgICByZXR1cm4gdHg7XG4gICAgfSBlbHNlIGlmKHRoaXMuX3Rha2Vycy5sZW5ndGgpIHtcbiAgICAgIC8vIFRoZSBidWZmZXIgaXMgZnVsbCBidXQgdGhlcmUgYXJlIHdhaXRpbmcgdGFrZXJzIChlLmcuIHRoZSBidWZmZXIgaXMgc2l6ZSB6ZXJvKVxuXG4gICAgICBsZXQgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiAhdGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYodGFrZXJUeCAmJiB0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgICAgbGV0IHRha2VyQ2IgPSB0YWtlclR4LmNvbW1pdCgpO1xuXG4gICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0YWtlckNiKHZhbCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcHV0dGVycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9wdXR0ZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgcHV0KHZhbCwgdHJhbnNhY3Rvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMuZmlsbCh2YWwsIHRyYW5zYWN0b3IpLmRlcmVmKHJlc29sdmUpO1xuICAgIH0pO1xuICB9XG5cbiAgZHJhaW4odHggPSBuZXcgVHJhbnNhY3RvcigpKSB7XG4gICAgaWYoISh0eCBpbnN0YW5jZW9mIFRyYW5zYWN0b3IpKSB7IHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBUcmFuc2FjdG9yIHRvIGJlIHBhc3NlZCB0byBkcmFpblwiKTsgfVxuICAgIGlmKCF0eC5hY3RpdmUpIHsgcmV0dXJuIHR4OyB9XG5cbiAgICBpZih0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICBsZXQgYnVmVmFsID0gdGhpcy5fYnVmZmVyLnJlbW92ZSgpO1xuXG4gICAgICB3aGlsZSghdGhpcy5fYnVmZmVyLmZ1bGwgJiYgdGhpcy5fcHV0dGVycy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG5cbiAgICAgICAgaWYocHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICAgIGxldCBwdXRUeCA9IHB1dHRlci5jb21taXQoKSxcbiAgICAgICAgICAgICAgdmFsID0gcHV0dGVyLm9mZmVyZWQ7IC8vIEtpbmRhIGJyZWFraW5nIHRoZSBydWxlcyBoZXJlXG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gcHV0VHgoKSk7XG4gICAgICAgICAgbGV0IGRvbmUgPSBhdHRlbXB0KCgpID0+IHRoaXMuX2luc2VydCh2YWwpID09PSByZWR1Y2VkLCB0aGlzLl9leEhhbmRsZXIpO1xuXG4gICAgICAgICAgaWYoZG9uZSA9PT0gcmVkdWNlZCkgeyB0aGlzLmFib3J0KCk7IH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eC5jb21taXQoKShidWZWYWwpO1xuICAgIH0gZWxzZSBpZih0aGlzLl9wdXR0ZXJzLmxlbmd0aCkge1xuICAgICAgbGV0IHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3B1dHRlcnMubGVuZ3RoICYmICFwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgIHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHB1dHRlciAmJiBwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgIGxldCB0eENiID0gdHguY29tbWl0KCksXG4gICAgICAgICAgICBwdXRUeCA9IHB1dHRlci5jb21taXQoKSxcbiAgICAgICAgICAgIHZhbCA9IHB1dHRlci5vZmZlcmVkO1xuXG4gICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiBwdXRUeCgpKTtcbiAgICAgICAgdHhDYih2YWwpO1xuICAgICAgfSBlbHNlIGlmKCF0aGlzLm9wZW4pIHtcbiAgICAgICAgYXR0ZW1wdCgoKSA9PiB0aGlzLl9pbnNlcnQoKSwgdGhpcy5fZXhIYW5kbGVyKTtcblxuICAgICAgICBpZih0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgdHhDYih0aGlzLl9idWZmZXIucmVtb3ZlKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR4Q2IobnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Rha2Vycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90YWtlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHg7XG4gIH1cblxuICB0YWtlKHRyYW5zYWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmRyYWluKHRyYW5zYWN0b3IpLmRlcmVmKHJlc29sdmUpO1xuICAgIH0pO1xuICB9XG5cbiAgdGhlbihmbiwgZXJyKSB7XG4gICAgcmV0dXJuIHRoaXMudGFrZSgpLnRoZW4oZm4sIGVycik7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICBpZih0aGlzLm9wZW4pIHtcbiAgICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xuXG4gICAgICBpZih0aGlzLl9wdXR0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBhdHRlbXB0KCgpID0+IHRoaXMuX2luc2VydCgpLCB0aGlzLl9leEhhbmRsZXIpO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAodGhpcy5fdGFrZXJzLmxlbmd0aCkge1xuICAgICAgICBsZXQgdGFrZXIgPSB0aGlzLl90YWtlcnMucG9wKCk7XG5cbiAgICAgICAgaWYodGFrZXIuYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHZhbCA9IHRoaXMuX2J1ZmZlci5sZW5ndGggPyB0aGlzLl9idWZmZXIucmVtb3ZlKCkgOiBudWxsLFxuICAgICAgICAgICAgICB0YWtlckNiID0gdGFrZXIuY29tbWl0KCk7XG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGludG8ob3RoZXJDaGFuLCBzaG91bGRDbG9zZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGludG8odmFsKSB7XG4gICAgICBpZih2YWwgPT09IG5pbCAmJiBzaG91bGRDbG9zZSkge1xuICAgICAgICBvdXQuY2xvc2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dC5wdXQodmFsKS50aGVuKG9wZW4gPT4ge1xuICAgICAgICAgIGlmKCFvcGVuICYmIHNob3VsZENsb3NlKSB7XG4gICAgICAgICAgICBzZWxmLmNsb3NlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYudGFrZSgpLnRoZW4obWFwcGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudGFrZSgpLnRoZW4oaW50byk7XG5cbiAgICByZXR1cm4gb3RoZXJDaGFuO1xuICB9XG5cbiAgZ2V0IG9wZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzT3BlbjtcbiAgfVxufVxuXG5DaGFubmVsLnJlZHVjZWQgPSByZWR1Y2VkO1xuXG5leHBvcnQgeyBDaGFubmVsLCBUcmFuc2FjdG9yIH07IiwibGV0IGRlZmF1bHRBc3luY2hyb25pemVyID0gKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicpID8gZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIHNldEltbWVkaWF0ZShmbik7XG59IDogZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIHNldFRpbWVvdXQoZm4pO1xufTtcblxuY2xhc3MgRGlzcGF0Y2gge1xuICBjb25zdHJ1Y3Rvcihhc3luY2hyb25pemVyKSB7XG4gICAgdGhpcy5fYXN5bmNocm9uaXplciA9IGFzeW5jaHJvbml6ZXIgfHwgZGVmYXVsdEFzeW5jaHJvbml6ZXI7XG4gICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgfVxuXG4gIHJ1bihmbikge1xuICAgIHRoaXMuX3F1ZXVlLnB1c2goZm4pO1xuXG4gICAgdGhpcy5fYXN5bmNocm9uaXplcigoKSA9PiB7XG4gICAgICB3aGlsZSh0aGlzLl9xdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIlFVRVVFXCIsIHRoaXMuX3F1ZXVlWzBdKTtcbiAgICAgICAgdGhpcy5fcXVldWUuc2hpZnQoKSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cblxuZXhwb3J0IHsgRGlzcGF0Y2ggfTsiLCJpbXBvcnQgeyBDaGFubmVsLCBUcmFuc2FjdG9yIH0gZnJvbSBcIi4vY2hhbm5lbHMuanNcIjtcbmltcG9ydCB7IEZpeGVkQnVmZmVyLCBEcm9wcGluZ0J1ZmZlciwgU2xpZGluZ0J1ZmZlciwgUmluZ0J1ZmZlciB9IGZyb20gXCIuL2J1ZmZlcnMuanNcIjtcbmltcG9ydCB7IGFsdHMsIHRpbWVvdXQsIG9yZGVyLCBtYXAsIGZpbHRlciwgcGFydGl0aW9uQnksIHBhcnRpdGlvbiB9IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5cbmV4cG9ydCB7XG4gICAgQ2hhbm5lbCxcbiAgICBUcmFuc2FjdG9yLFxuICAgIEZpeGVkQnVmZmVyLFxuICAgIERyb3BwaW5nQnVmZmVyLFxuICAgIFNsaWRpbmdCdWZmZXIsXG4gICAgUmluZ0J1ZmZlcixcbiAgICBhbHRzLFxuICAgIHRpbWVvdXQsXG4gICAgb3JkZXIsXG4gICAgbWFwLFxuICAgIGZpbHRlcixcbiAgICBwYXJ0aXRpb25CeSxcbiAgICBwYXJ0aXRpb25cbn07IiwidmFyIF9Qcm9taXNlO1xuXG5pZih0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuUHJvbWlzZSkge1xuICBfUHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlO1xufSBlbHNlIGlmKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbC5Qcm9taXNlKSB7XG4gIF9Qcm9taXNlID0gZ2xvYmFsLlByb21pc2U7XG59IGVsc2Uge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gZmluZCBuYXRpdmUgcHJvbWlzZSBpbXBsZW1lbnRhdGlvbi5cIik7XG59XG5cbmV4cG9ydCB7IF9Qcm9taXNlIGFzIFByb21pc2UgfTtcbiIsImltcG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfSBmcm9tIFwiLi9jaGFubmVscy5qc1wiO1xuXG5cbmNsYXNzIEFsdHNUcmFuc2FjdG9yIGV4dGVuZHMgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyLCBjb21taXRDYikge1xuICAgIHN1cGVyKG9mZmVyKTtcbiAgICB0aGlzLmNvbW1pdENiID0gY29tbWl0Q2I7XG4gIH1cbiAgY29tbWl0KCkge1xuICAgIHRoaXMuY29tbWl0Q2IoKTtcbiAgICByZXR1cm4gc3VwZXIuY29tbWl0KCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWx0cyhyYWNlKSB7XG4gIGxldCB0cmFuc2FjdG9ycyA9IFtdO1xuICBsZXQgb3V0Q2ggPSBuZXcgQ2hhbm5lbCgpO1xuXG4gIGxldCBkZWFjdGl2YXRlID0gKCkgPT4geyB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSkgfVxuXG4gIHJhY2UubWFwKGNtZCA9PiB7XG5cbiAgICBpZihBcnJheS5pc0FycmF5KGNtZCkpIHtcbiAgICAgIGxldCB0eCA9IG5ldyBBbHRzVHJhbnNhY3Rvcih2YWwsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBsZXQgWyBjaCwgdmFsIF0gPSBjbWQ7XG4gICAgICBjaC5wdXQodmFsLCB0eCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgb3V0Q2gucHV0KFsgdmFsLCBjaCBdKTtcbiAgICAgIH0pO1xuXG4gICAgICB0cmFuc2FjdG9ycy5wdXNoKHR4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHR4ID0gbmV3IEFsdHNUcmFuc2FjdG9yKHRydWUsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG5cbiAgICAgIGNtZC50YWtlKHR4KS50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBvdXRDaC5wdXQoWyB2YWwsIGNtZCBdKTtcbiAgICAgIH0pO1xuXG4gICAgICB0cmFuc2FjdG9ycy5wdXNoKHR4KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvdXRDaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVvdXQobXMpIHtcbiAgdmFyIGNoID0gbmV3IENoYW5uZWwoKTtcbiAgc2V0VGltZW91dCgoKSA9PiB7IGNoLmNsb3NlKCk7IH0sIG1zKTtcbiAgcmV0dXJuIGNoO1xufVxuXG4vLyBFbmZvcmNlcyBvcmRlciByZXNvbHV0aW9uIG9uIHJlc3VsdGluZyBjaGFubmVsXG4vLyBUaGlzIG1pZ2h0IG5lZWQgdG8gYmUgdGhlIGRlZmF1bHQgYmVoYXZpb3IsIHRob3VnaCB0aGF0IHJlcXVpcmVzIG1vcmUgdGhvdWdodFxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyKGluY2gsIHNpemVPckJ1Zikge1xuICB2YXIgb3V0Y2ggPSBuZXcgQ2hhbm5lbChzaXplT3JCdWYpO1xuXG4gIGZ1bmN0aW9uIGRyYWluKCkge1xuICAgIGluY2gudGFrZSgpLnRoZW4odmFsID0+IHtcbiAgICAgIGlmKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICBvdXRjaC5jbG9zZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0Y2gucHV0KHZhbCkudGhlbihkcmFpbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZHJhaW4oKTtcblxuICByZXR1cm4gb3V0Y2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5leHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odmFsKSB7XG4gICAgICBpZihhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXh0KGZuKHZhbCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlcihmbikge1xuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGZuKHZhbCkpIHtcbiAgICAgICAgICByZXR1cm4gbmV4dCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFydGl0aW9uQnkoZm4pIHtcbiAgbGV0IGxhc3QgPSBudWxsLFxuICAgICAgYWNjdW11bGF0b3IgPSBbXTtcblxuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHByZWRpY2F0ZVJlc3VsdCA9IGZuKHZhbCk7XG4gICAgICAgIGlmKGxhc3QgIT09IG51bGwgJiYgcHJlZGljYXRlUmVzdWx0ICE9PSBsYXN0KSB7XG4gICAgICAgICAgbGV0IHRtcCA9IGFjY3VtdWxhdG9yO1xuXG4gICAgICAgICAgYWNjdW11bGF0b3IgPSBbIHZhbCBdO1xuICAgICAgICAgIGxhc3QgPSBwcmVkaWNhdGVSZXN1bHQ7XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCh0bXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxhc3QgPSBwcmVkaWNhdGVSZXN1bHQ7XG4gICAgICAgICAgYWNjdW11bGF0b3IucHVzaCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dChhY2N1bXVsYXRvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aXRpb24obnVtKSB7XG4gIGxldCBjID0gMCxcbiAgICAgIGEgPSBbXTtcblxuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgYS5wdXNoKHZhbCk7XG4gICAgICAgIGMgKz0gMTtcblxuICAgICAgICBpZihjICUgbnVtID09PSAwKSB7XG4gICAgICAgICAgbGV0IHRtcCA9IGE7XG5cbiAgICAgICAgICBhID0gW107XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCh0bXApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dChhKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0iLCJcbmltcG9ydCB7XG4gICAgQ2hhbm5lbCxcbiAgICBSaW5nQnVmZmVyLFxuICAgIEZpeGVkQnVmZmVyLFxuICAgIFNsaWRpbmdCdWZmZXIsXG4gICAgRHJvcHBpbmdCdWZmZXIsXG4gICAgYWx0cyxcbiAgICB0aW1lb3V0LFxuICAgIG9yZGVyLFxuICAgIG1hcCxcbiAgICBmaWx0ZXIsXG4gICAgcGFydGl0aW9uQnksXG4gICAgcGFydGl0aW9uXG59IGZyb20gXCIuLi9zcmMvY2hhbm5lbHMvaW5kZXguanNcIjtcblxuZnVuY3Rpb24gYXNzZXJ0KGV4cHIsIHZhbCwgbXNnID0gYEV4cGVjdGVkICR7dmFsfSwgcmVjZWl2ZWQgJHtleHByfWApIHtcbiAgaWYoZXhwciAhPT0gdmFsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gIH1cblxuICAvL2NvbnNvbGUubG9nKFwiQVNTRVJUXCIsIGV4cHIsIHZhbCk7XG59XG5cbmZ1bmN0aW9uIGZhaWxUZXN0KG1zZykge1xuICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbn1cblxuZnVuY3Rpb24gY2hhbm5lbFRlc3QoY2hhbnMsIHRlc3QpIHtcbiAgbGV0IGpvaW50ID0gY2hhbnMubWFwKGMgPT4ge1xuICAgIGxldCByZXNvbHZlciwgcHJvbWlzZSA9IG5ldyBQcm9taXNlKHIgPT4gcmVzb2x2ZXIgPSByKTtcbiAgICBsZXQgY2xvc2UgPSBjLmNsb3NlO1xuXG4gICAgYy5jbG9zZSA9ICgpID0+IHtcbiAgICAgIGNsb3NlLmNhbGwoYyk7XG4gICAgICByZXNvbHZlcigpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9KTtcblxuICB0ZXN0LmFwcGx5KG51bGwsIGNoYW5zKTtcblxuICByZXR1cm4gUHJvbWlzZS5hbGwoam9pbnQpO1xufVxuXG5mdW5jdGlvbiBob2lzdChmbiwgLi4uYXJncykge1xuICByZXR1cm4gKCkgPT4ge1xuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgfVxufVxuXG4vLyA9PT0gQkVHSU4gVEVTVFMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vLyBTeW5jaHJvbm91cyB0ZXN0czpcbigoKSA9PiB7XG4gIC8qXG4gIFRoZSBSaW5nQnVmZmVyIGlzIHRoZSBiYXNpcyBvbiB3aGljaCBhbGwgdGhlIGJ1ZmZlcnMgYXJlIGJ1aWx0LiBJdCdzIGRpZmZpY3VsdCB0byB1c2UsIHNvIHlvdSBwcm9iYWJseSB3b24ndCBldmVyXG4gIHdhbnQgdG8gdXNlIGl0LiBVc2UgdGhlIGhpZ2hlci1sZXZlbCBGaXhlZEJ1ZmZlciwgRHJvcHBpbmdCdWZmZXIsIGFuZCBTbGlkaW5nQnVmZmVyIGluc3RlYWRcbiAgICovXG4gIGxldCBidWYgPSBuZXcgUmluZ0J1ZmZlcigwKTtcblxuICBidWYucmVzaXppbmdVbnNoaWZ0KDEwKTtcbiAgYXNzZXJ0KGJ1Zi5wb3AoKSwgMTApO1xuXG4gIGJ1Zi5yZXNpemluZ1Vuc2hpZnQoMjApO1xuICBhc3NlcnQoYnVmLnBvcCgpLCAyMCk7XG5cbiAgbGV0IGkgPSAyMDA7XG4gIHdoaWxlKGkgLS0pIHtcbiAgICBidWYucmVzaXppbmdVbnNoaWZ0KGkpO1xuICB9XG4gIHdoaWxlKGJ1Zi5sZW5ndGgpIHtcbiAgICBhc3NlcnQoYnVmLnBvcCgpLCBidWYubGVuZ3RoKTtcbiAgfVxuXG59KSgpO1xuXG4oKCkgPT4ge1xuICBsZXQgYnVmID0gbmV3IEZpeGVkQnVmZmVyKDEpO1xuXG4gIGJ1Zi5hZGQoMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIHRydWUpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG4gIGJ1Zi5hZGQoMjApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIHRydWUpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAyMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG59KSgpO1xuXG4oKCkgPT4ge1xuICBsZXQgYnVmID0gbmV3IFNsaWRpbmdCdWZmZXIoMSk7XG5cbiAgYnVmLmFkZCgxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG4gIGJ1Zi5hZGQoMjApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYnVmLmFkZCgzMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAzMCk7XG5cbiAgbGV0IGkgPSAyMDA7XG4gIHdoaWxlKGkgLS0pIHtcbiAgICBidWYuYWRkKGkpO1xuICB9XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDApO1xuXG5cbn0pKCk7XG5cbigoKSA9PiB7XG5cbiAgbGV0IGJ1ZiA9IG5ldyBEcm9wcGluZ0J1ZmZlcigxKTtcblxuICBidWYuYWRkKDEwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDEwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG5cbiAgYnVmLmFkZCgyMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBidWYuYWRkKDMwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDIwKTtcblxuICBsZXQgaSA9IDIwMDtcbiAgd2hpbGUoaSAtLSkge1xuICAgIGJ1Zi5hZGQoaSk7XG4gIH1cbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMTk5KTtcblxufSkoKTtcblxuLy8gQXN5bmNocm9ub3VzIHRlc3RzOlxuY2hhbm5lbFRlc3QoWyBuZXcgQ2hhbm5lbCgzKSBdLCBjaGFubmVsID0+IHtcbiAgLypcbiAgIFB1dCB0aHJlZSB2YWx1ZXMgb24gYSBjaGFubmVsIC0tIDEsIDIsIDMgLS0gYW5kIHRoZW4gcmVtb3ZlIHRoZW0uXG4gICAqL1xuXG4gIGNoYW5uZWwucHV0KDEpO1xuICBjaGFubmVsLnB1dCgyKTtcbiAgY2hhbm5lbC5wdXQoMyk7XG5cbiAgUHJvbWlzZS5hbGwoW1xuXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDEpKSxcbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMikpLFxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAzKSlcblxuICBdKS50aGVuKCgpID0+IGNoYW5uZWwuY2xvc2UoKSk7XG5cbn0pLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwobmV3IFNsaWRpbmdCdWZmZXIoMikpIF0sIChjaGFubmVsKSA9PiB7XG4gIC8qXG4gICBQdXQgdGhyZWUgdmFsdWVzIG9uIGEgY2hhbm5lbCAtLSAxLCAyLCAzLCBub3RpY2UgdGhlIHNsaWRpbmcgYnVmZmVyIGRyb3BzIHRoZSBmaXJzdCB2YWx1ZVxuICAgKi9cblxuICBjaGFubmVsLnB1dCgxKTtcbiAgY2hhbm5lbC5wdXQoMik7XG4gIGNoYW5uZWwucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAyKSksXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDMpKVxuXG4gIF0pLnRoZW4oKCkgPT4gY2hhbm5lbC5jbG9zZSgpKTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwobmV3IERyb3BwaW5nQnVmZmVyKDIpKSBdLCBjaGFubmVsID0+IHtcbiAgLypcbiAgIFB1dCB0aHJlZSB2YWx1ZXMgb24gYSBjaGFubmVsIC0tIDEsIDIsIDMsIG5vdGljZSB0aGUgZHJvcHBpbmcgYnVmZmVyIGlnbm9yZXMgYWRkaXRpb25hbCBwdXRzXG4gICAqL1xuXG4gIGNoYW5uZWwucHV0KDEpO1xuICBjaGFubmVsLnB1dCgyKTtcbiAgY2hhbm5lbC5wdXQoMyk7XG5cbiAgUHJvbWlzZS5hbGwoW1xuXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDEpKSxcbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMikpXG5cbiAgXSkudGhlbigoKSA9PiBjaGFubmVsLmNsb3NlKCkpO1xuXG4gIGNoYW5uZWwuY2xvc2UoKTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSwgbmV3IENoYW5uZWwoKSwgbmV3IENoYW5uZWwoKSBdLCAoY2hhbjEsIGNoYW4yLCBjaGFuMykgPT4ge1xuXG4gIC8qXG4gIFB1dCBhIHZhbHVlIG9udG8gdGhyZWUgZGlmZmVyZW50IGNoYW5uZWxzIGF0IGRpZmZlcmVudCB0aW1lcyBhbmQgdXNlIFByb21pc2UuYWxsIHRvIHdhaXQgb24gdGhlIHRocmVlIHZhbHVlcyxcbiAgYmVjYXVzZSBjaGFubmVscyBiZWhhdmUgaW4gcHJvbWlzZS1saWtlIHdheXMgKHdpdGggc29tZSBub3RhYmxlIGV4Y2VwdGlvbnMpLlxuXG4gIFdoZW4gdGhlIHRocmVlIGNoYW5uZWxzIHByb2R1Y2UgYSB2YWx1ZSwgcHVsbCBhZ2FpbiBmcm9tIHRoZSBmaXJzdCBjaGFubmVsLlxuICAgKi9cblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjaGFuMS5wdXQoXCJIZWxsbyFcIik7ICAgICAgICAgICAgICAgfSwgMzUpO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjaGFuMi5wdXQoXCJIb3cgYXJlIHlvdT9cIik7ICAgICAgICAgfSwgMTApO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjaGFuMy5wdXQoXCJWZXJ5IGdvb2QuXCIpOyAgICAgICAgICAgfSwgNTApO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjaGFuMS5wdXQoXCJUaGFuayB5b3UgdmVyeSBtdWNoLlwiKTsgfSwgNDApO1xuXG4gIFByb21pc2UuYWxsKFsgY2hhbjEsIGNoYW4yLCBjaGFuMyBdKS50aGVuKChbIF8xLCBfMiwgXzMgXSkgPT4ge1xuICAgIGFzc2VydChfMSwgXCJIZWxsbyFcIik7XG4gICAgYXNzZXJ0KF8yLCBcIkhvdyBhcmUgeW91P1wiKTtcbiAgICBhc3NlcnQoXzMsIFwiVmVyeSBnb29kLlwiKTtcblxuICAgIHJldHVybiBjaGFuMS50YWtlKCk7XG5cbiAgfSkudGhlbih2ID0+IHtcbiAgICBhc3NlcnQodiwgXCJUaGFuayB5b3UgdmVyeSBtdWNoLlwiKTtcblxuICAgIGNoYW4xLmNsb3NlKCk7XG4gICAgY2hhbjIuY2xvc2UoKTtcbiAgICBjaGFuMy5jbG9zZSgpO1xuICB9KTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuICAvKlxuICBZb3UgY2FuIHB1dCBhIHByb21pc2UgY2hhaW4gb24gYSBjaGFubmVsLCBhbmQgaXQgd2lsbCBhdXRvbWF0aWNhbGx5IHVud3JhcCB0aGUgcHJvbWlzZS5cbiAgICovXG5cbiAgZnVuY3Rpb24gd2FpdChudW0pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSwgbnVtKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNoYW5uZWwucHV0KHdhaXQoMTAwKS50aGVuKCgpID0+IDEwMCkpO1xuICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiB7XG4gICAgYXNzZXJ0KHYsIDEwMCk7XG4gICAgY2hhbm5lbC5jbG9zZSgpO1xuICB9KTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFtdLCAoKSA9PiB7XG4gIC8qXG4gIEJ1dCBzb21ldGltZXMgeW91IGRvbid0IHdhbnQgdG8gdW53cmFwIHByb21pc2VzLCBzbyB5b3UnbGwgbmVlZCB0byB1c2UgdGhlIGNhbGxiYWNrIGFwaTpcbiAgICovXG4gIC8vIFRPRE9cblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSwgbmV3IENoYW5uZWwoKSwgbmV3IENoYW5uZWwoKSBdLCAoY2hhbjEsIGNoYW4yLCBjaGFuMykgPT4ge1xuICAvKlxuICBTb21ldGltZXMgeW91IHdhbnQgdG8gY29tcGxldGUgb25seSBvbmUgb2YgbWFueSBvcGVyYXRpb25zIG9uIGEgc2V0IG9mIGNoYW5uZWxzXG4gICAqL1xuXG4gIGxldCBhbHRzMSA9IGFsdHMoWyBjaGFuMSwgY2hhbjIgXSkudGFrZSgpLnRoZW4oKFt2YWwsIGNoYW5dKSA9PiB7XG4gICAgYXNzZXJ0KGNoYW4sIGNoYW4yKTtcbiAgICBhc3NlcnQodmFsLCAxMDApO1xuXG4gIH0pO1xuXG4gIGxldCBhbHRzMiA9IGFsdHMoWyBjaGFuMSwgY2hhbjIgXSkudGFrZSgpLnRoZW4oKFsgdmFsLCBjaGFuIF0pID0+IHtcbiAgICBhc3NlcnQoY2hhbiwgY2hhbjEpO1xuICAgIGFzc2VydCh2YWwsIDIwMCk7XG4gIH0pO1xuXG4gIC8vIFlvdSBjYW4gXCJwdXRcIiB0byBhIGNoYW5uZWwgaW4gYW4gYWx0cyBieSBwYXNzaW5nIGFuIGFycmF5XG4gIGxldCBhbHRzMyA9IGFsdHMoWyBjaGFuMSwgY2hhbjIsIFsgY2hhbjMsIDMwMCBdIF0pLnRha2UoKS50aGVuKChbIHZhbCwgY2hhbiBdKSA9PiB7XG4gICAgYXNzZXJ0KGNoYW4sIGNoYW4zKTtcbiAgICBhc3NlcnQodmFsLCAzMDApO1xuICB9KTtcblxuICBjaGFuMy50YWtlKCk7XG4gIGNoYW4yLnB1dCgxMDApO1xuICBjaGFuMS5wdXQoMjAwKTtcblxuICBQcm9taXNlLmFsbChbIGFsdHMxLCBhbHRzMiwgYWx0czMgXSkudGhlbigoKSA9PiB7XG4gICAgY2hhbjEuY2xvc2UoKTtcbiAgICBjaGFuMi5jbG9zZSgpO1xuICAgIGNoYW4zLmNsb3NlKCk7XG4gIH0pO1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbCgpIF0sIChjaGFubmVsKSA9PiB7XG4gIC8qXG4gICBJdCdzIGVhc3kgdG8gb3JkZXIgYSBjaGFubmVsIGJ5IGl0cyBhZGRlZCBkYXRlIHVzaW5nIHRoZSBgb3JkZXJgIGZ1bmN0aW9uLCB3aGljaCB0YWtlcyBhIGNoYW5uZWwgYW5kIHJldHVybnNcbiAgIGEgc3RyaWN0bHkgb3JkZXJlZCB2ZXJzaW9uIG9mIGl0cyBhc3luY2hyb25vdXMgdmFsdWVzIChhc3N1bWVzIHRob3NlIHZhbHVlcyBhcmUgcHJvbWlzZXMpXG5cbiAgIFRoaXMgaXMgdXNlZnVsIGZvciB0YWtpbmcgYSBjaGFubmVsIG9mIFByb21pc2U8SHR0cFJlcXVlc3Q8VmFsdWU+PiBhbmQgdHJhbnNsYXRpbmcgaXQgdG8gUHJvbWlzZTxWYWx1ZT5cbiAgICovXG5cbiAgdmFyIG9yZGVyZWQgPSBvcmRlcihjaGFubmVsKTtcblxuICBjaGFubmVsLnB1dCh0aW1lb3V0KDIwMCkudGhlbigoKSA9PiAyMDApKTtcbiAgY2hhbm5lbC5wdXQodGltZW91dCgxMDApLnRoZW4oKCkgPT4gMTAwKSk7XG5cbiAgLy8gKE5vdGUgeW91IGNhbiBwdXQgdGhlIHNhbWUgY2hhbm5lbCBpbnRvIGEgUHJvbWlzZS5hbGwgbWFueSB0aW1lcylcbiAgUHJvbWlzZS5hbGwoWyBvcmRlcmVkLCBvcmRlcmVkIF0pLnRoZW4oKFsgZmlyc3QsIHNlY29uZCBdKSA9PiB7XG4gICAgYXNzZXJ0KGZpcnN0LCAyMDApO1xuICAgIGFzc2VydChzZWNvbmQsIDEwMCk7XG4gICAgY2hhbm5lbC5jbG9zZSgpO1xuICB9KTtcblxuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbCgpIF0sIChjaGFubmVsKSA9PiB7XG5cbiAgY2hhbm5lbC5wdXQobmV3IFByb21pc2UoKCkgPT4ge1xuICAgIHRocm93IG5ldyBFcnJvcigpO1xuICB9KSk7XG5cbiAgY2hhbm5lbC5wdXQoMTAwKTtcblxuICBsZXQgZmFpbHVyZSA9IGNoYW5uZWwudGFrZSgpLnRoZW4odiA9PiBmYWlsVGVzdChcIlNob3VsZCBoYXZlIGV2YWx1YXRlZCB0byBhbiBlcnJvclwiKSwgZSA9PiB7fSk7XG4gIGxldCBzdWNjZXNzID0gY2hhbm5lbC50YWtlKCkudGhlbih2ID0+IGFzc2VydCh2LCAxMDApKTtcblxuICBQcm9taXNlLmFsbChbIGZhaWx1cmUsIHN1Y2Nlc3NdKS50aGVuKCgpID0+IGNoYW5uZWwuY2xvc2UoKSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCkgXSwgKGNoYW5uZWwpID0+IHtcblxuICBjaGFubmVsLnB1dCgxMDApLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgY2hhbm5lbC50YWtlKCkudGhlbihmdW5jdGlvbih2KSB7XG4gICAgICBhc3NlcnQodiwgMjAwKTtcbiAgICAgIGNoYW5uZWwuY2xvc2UoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gVGhlIGFib3ZlIGNvZGUgd2lsbCBkZWFkbG9jayBpZiB0aGUgbmV4dCBibG9jayBpc24ndCB0aGVyZSwgYmVjYXVzZSB0aGUgcHV0IGlzIGhhbHRlZCBvbiBhIHplcm8tbGVuZ3RoIGJ1ZlxuXG4gIHRpbWVvdXQoMTAwKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oZnVuY3Rpb24odikge1xuICAgICAgYXNzZXJ0KHYsIDEwMCk7XG4gICAgICBjaGFubmVsLnB1dCgyMDApO1xuICAgIH0pO1xuICB9KTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuXG4gIGNoYW5uZWwucHV0KDEwMCk7XG4gIGNoYW5uZWwucHV0KDIwMCk7XG4gIGNoYW5uZWwuY2xvc2UoKTtcblxuICBjaGFubmVsLnRha2UoKS50aGVuKHYgPT4gYXNzZXJ0KHYsIDEwMCkpO1xuICBjaGFubmVsLnRha2UoKS50aGVuKHYgPT4gYXNzZXJ0KHYsIDIwMCkpO1xuXG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXG4gIG5ldyBDaGFubmVsKDEsIG1hcCh2ID0+IHYgKiAyKSlcbl0sIChkb3VibGVyKSA9PiB7XG5cbiAgLy8gVmFsdWVzIHB1dCBvbiB0aGUgY2hhbm5lbCBhcmUgZG91YmxlZFxuICBkb3VibGVyLnB1dCgxKTtcbiAgZG91Ymxlci5wdXQoMik7XG4gIGRvdWJsZXIucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGRvdWJsZXIudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAyKSksXG4gICAgZG91Ymxlci50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDQpKSxcbiAgICBkb3VibGVyLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgNikpXG5cbiAgXSkudGhlbigoKSA9PiBkb3VibGVyLmNsb3NlKCkpO1xuXG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXG4gIG5ldyBDaGFubmVsKDEsIGZpbHRlcih2ID0+IHYgJSAyID09PSAwKSlcbl0sIChldmVucykgPT4ge1xuXG4gIC8vIFZhbHVlcyBwdXQgb24gdGhlIGNoYW5uZWwgYXJlIGRvdWJsZWRcbiAgZXZlbnMucHV0KDEpO1xuICBldmVucy5wdXQoMik7XG4gIGV2ZW5zLnB1dCgzKTtcbiAgZXZlbnMucHV0KDQpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGV2ZW5zLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMikpLFxuICAgIGV2ZW5zLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgNCkpXG5cbiAgXSkudGhlbigoKSA9PiBldmVucy5jbG9zZSgpKTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFtcbiAgbmV3IENoYW5uZWwoMSwgcGFydGl0aW9uKDIpKVxuXSwgKGdyb3VwcykgPT4ge1xuXG4gIC8vIFZhbHVlcyBwdXQgb24gdGhlIGNoYW5uZWwgYXJlIGRvdWJsZWRcbiAgZ3JvdXBzLnB1dCgxKTtcbiAgZ3JvdXBzLnB1dCgyKTtcbiAgZ3JvdXBzLnB1dCgzKTtcbiAgZ3JvdXBzLnB1dCg0KTtcblxuICBQcm9taXNlLmFsbChbXG4gICAgZ3JvdXBzLnRha2UoKS50aGVuKChbXzEsIF8yXSkgPT4ge1xuICAgICAgYXNzZXJ0KF8xLCAxKTtcbiAgICAgIGFzc2VydChfMiwgMik7XG4gICAgfSksXG4gICAgZ3JvdXBzLnRha2UoKS50aGVuKChbXzMsIF80XSkgPT4ge1xuICAgICAgYXNzZXJ0KF8zLCAzKTtcbiAgICAgIGFzc2VydChfNCwgNCk7XG4gICAgfSlcbiAgXSkudGhlbigoKSA9PiBncm91cHMuY2xvc2UoKSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXG4gIG5ldyBDaGFubmVsKDEwLCBwYXJ0aXRpb25CeSh2ID0+IHtcbiAgICBsZXQgbm9ybWFsaXplZCA9IHYucmVwbGFjZSgvXFxXKy9nLCAnJykudG9Mb3dlckNhc2UoKTtcblxuICAgIHJldHVybiBub3JtYWxpemVkID09PSBub3JtYWxpemVkLnNwbGl0KCcnKS5yZXZlcnNlKCkuam9pbignJyk7XG4gIH0pKVxuXSwgKHZhbHMpID0+IHtcblxuICAvLyBWYWx1ZXMgcHV0IG9uIHRoZSBjaGFubmVsIGFyZSBkb3VibGVkXG4gIHZhbHMucHV0KFwidGFjb2NhdFwiKTtcbiAgdmFscy5wdXQoXCJyYWNlY2FyXCIpO1xuICB2YWxzLnB1dChcIm5vdCBhIHBhbGluZHJvbWVcIik7XG4gIHZhbHMucHV0KFwiYWxzbyBub3QgYSBwYWxpbmRyb21lXCIpO1xuICB2YWxzLnB1dChcIk1hZGFtIEknbSBBZGFtXCIpO1xuICB2YWxzLnB1dChcIkFoLCBzYXRhbiBzZWVzIG5hdGFzaGEhXCIpO1xuICB2YWxzLnB1dChcIm9uZSBsYXN0IHRyeS4uLlwiKTtcblxuICBQcm9taXNlLmFsbChbXG4gICAgdmFscy50YWtlKCkudGhlbigoW18xLCBfMl0pID0+IHtcbiAgICAgIGFzc2VydChfMSwgXCJ0YWNvY2F0XCIpO1xuICAgICAgYXNzZXJ0KF8yLCBcInJhY2VjYXJcIik7XG4gICAgfSksXG4gICAgdmFscy50YWtlKCkudGhlbigoW18xLCBfMl0pID0+IHtcbiAgICAgIGFzc2VydChfMSwgXCJub3QgYSBwYWxpbmRyb21lXCIpO1xuICAgICAgYXNzZXJ0KF8yLCBcImFsc28gbm90IGEgcGFsaW5kcm9tZVwiKTtcbiAgICB9KSxcbiAgICB2YWxzLnRha2UoKS50aGVuKChbXzEsIF8yXSkgPT4ge1xuICAgICAgYXNzZXJ0KF8xLCBcIk1hZGFtIEknbSBBZGFtXCIpO1xuICAgICAgYXNzZXJ0KF8yLCBcIkFoLCBzYXRhbiBzZWVzIG5hdGFzaGEhXCIpO1xuICAgIH0pXG4gIF0pLnRoZW4oKCkgPT4gdmFscy5jbG9zZSgpKTtcblxufSkpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coXCJUZXN0cyBjb21wbGV0ZS5cIikpO1xuIl19
