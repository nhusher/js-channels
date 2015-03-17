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

var Mult = require("./mult.js").Mult;

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
exports.Mult = Mult;
exports.alts = alts;
exports.timeout = timeout;
exports.order = order;
exports.map = map;
exports.filter = filter;
exports.partitionBy = partitionBy;
exports.partition = partition;

},{"./buffers.js":1,"./channels.js":2,"./mult.js":5,"./utils.js":7}],5:[function(require,module,exports){
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

},{"../src/channels/index.js":4}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbmh1c2hlci9Qcm9qZWN0cy9qcy1hc3luYy9zcmMvY2hhbm5lbHMvYnVmZmVycy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9jaGFubmVscy5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9kaXNwYXRjaC5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9pbmRleC5qcyIsIi9Vc2Vycy9uaHVzaGVyL1Byb2plY3RzL2pzLWFzeW5jL3NyYy9jaGFubmVscy9tdWx0LmpzIiwiL1VzZXJzL25odXNoZXIvUHJvamVjdHMvanMtYXN5bmMvc3JjL2NoYW5uZWxzL3Byb21pc2UuanMiLCIvVXNlcnMvbmh1c2hlci9Qcm9qZWN0cy9qcy1hc3luYy9zcmMvY2hhbm5lbHMvdXRpbHMuanMiLCIvVXNlcnMvbmh1c2hlci9Qcm9qZWN0cy9qcy1hc3luYy90ZXN0L3Rlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUNJQSxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO0FBQ3JELE9BQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNqQyxRQUFJLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7R0FDekM7Q0FDRjs7OztJQUlLLFVBQVU7QUFDSCxXQURQLFVBQVUsQ0FDRixDQUFDLEVBQUU7MEJBRFgsVUFBVTs7QUFFWixRQUFJLElBQUksR0FBRyxBQUFD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M0IsTUFBSSxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3BDLE1BQUksQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQzs7QUFFNUIsU0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUNWLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWM7OztRQUFaLEVBQUU7UUFBRSxFQUFFOztBQUN2QixVQUFNLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3RCLFVBQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7R0FDdkIsQ0FBQyxFQUNGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWM7OztRQUFaLEVBQUU7UUFBRSxFQUFFOztBQUN2QixVQUFNLENBQUMsRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDL0IsVUFBTSxDQUFDLEVBQUUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0dBQ3JDLENBQUMsRUFDRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFjOzs7UUFBWixFQUFFO1FBQUUsRUFBRTs7QUFDdkIsVUFBTSxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzdCLFVBQU0sQ0FBQyxFQUFFLEVBQUUseUJBQXlCLENBQUMsQ0FBQztHQUN2QyxDQUFDLENBQ0gsQ0FBQyxDQUFDLElBQUksQ0FBQztXQUFNLElBQUksQ0FBQyxLQUFLLEVBQUU7R0FBQSxDQUFDLENBQUM7Q0FFN0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1NBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztDQUFBLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8vXG4vLyBUT0RPOiB0aGlzIGlzbid0IGlkaW9tYXRpY2FsbHkgamF2YXNjcmlwdCAoY291bGQgcHJvYmFibHkgdXNlIHNsaWNlL3NwbGljZSB0byBnb29kIGVmZmVjdClcbi8vXG5mdW5jdGlvbiBhY29weShzcmMsIHNyY1N0YXJ0LCBkZXN0LCBkZXN0U3RhcnQsIGxlbmd0aCkge1xuICBmb3IobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBkZXN0W2kgKyBkZXN0U3RhcnRdID0gc3JjW2kgKyBzcmNTdGFydF07XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgUmluZ0J1ZmZlciB7XG4gIGNvbnN0cnVjdG9yKHMpIHtcbiAgICBsZXQgc2l6ZSA9ICh0eXBlb2YgcyA9PT0gJ251bWJlcicpID8gTWF0aC5tYXgoMSwgcykgOiAxO1xuICAgIHRoaXMuX3RhaWwgICA9IDA7XG4gICAgdGhpcy5faGVhZCAgID0gMDtcbiAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgIHRoaXMuX3ZhbHVlcyA9IG5ldyBBcnJheShzaXplKTtcbiAgfVxuXG4gIHBvcCgpIHtcbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmKHRoaXMubGVuZ3RoKSB7XG4gICAgICAvLyBHZXQgdGhlIGl0ZW0gb3V0IG9mIHRoZSBzZXQgb2YgdmFsdWVzXG4gICAgICByZXN1bHQgPSAodGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdICE9PSBudWxsKSA/IHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSA6IG51bGw7XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgaXRlbSBmcm9tIHRoZSBzZXQgb2YgdmFsdWVzLCB1cGRhdGUgaW5kaWNpZXNcbiAgICAgIHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSA9IG51bGw7XG4gICAgICB0aGlzLl90YWlsID0gKHRoaXMuX3RhaWwgKyAxKSAlIHRoaXMuX3ZhbHVlcy5sZW5ndGg7XG4gICAgICB0aGlzLl9sZW5ndGggLT0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHVuc2hpZnQodmFsKSB7XG4gICAgdGhpcy5fdmFsdWVzW3RoaXMuX2hlYWRdID0gdmFsO1xuICAgIHRoaXMuX2hlYWQgPSAodGhpcy5faGVhZCArIDEpICUgdGhpcy5fdmFsdWVzLmxlbmd0aDtcbiAgICB0aGlzLl9sZW5ndGggKz0gMTtcbiAgfVxuXG4gIHJlc2l6aW5nVW5zaGlmdCh2YWwpIHtcbiAgICBpZih0aGlzLmxlbmd0aCArIDEgPT09IHRoaXMuX3ZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVzaXplKCk7XG4gICAgfVxuICAgIHRoaXMudW5zaGlmdCh2YWwpO1xuICB9XG5cbiAgcmVzaXplKCkge1xuICAgIGxldCBuZXdBcnJ5ID0gbmV3IEFycmF5KHRoaXMuX3ZhbHVlcy5sZW5ndGggKiAyKTtcblxuICAgIGlmKHRoaXMuX3RhaWwgPCB0aGlzLl9oZWFkKSB7XG4gICAgICBhY29weSh0aGlzLl92YWx1ZXMsIHRoaXMuX3RhaWwsIG5ld0FycnksIDAsIHRoaXMuX2hlYWQpO1xuXG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSB0aGlzLmxlbmd0aDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG5cbiAgICB9IGVsc2UgaWYodGhpcy5faGVhZCA8IHRoaXMuX3RhaWwpIHtcbiAgICAgIGFjb3B5KHRoaXMuX3ZhbHVlcywgMCwgbmV3QXJyeSwgdGhpcy5fdmFsdWVzLmxlbmd0aCAtIHRoaXMuX3RhaWwsIHRoaXMuX2hlYWQpO1xuXG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSB0aGlzLmxlbmd0aDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gMDtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IG5ld0Fycnk7XG4gICAgfVxuICB9XG5cbiAgY2xlYW51cChrZWVwKSB7XG4gICAgZm9yKGxldCBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICBsZXQgaXRlbSA9IHRoaXMucG9wKCk7XG5cbiAgICAgIGlmKGtlZXAoaXRlbSkpIHtcbiAgICAgICAgdW5zaGlmdChpdGVtKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgRml4ZWRCdWZmZXIge1xuICBjb25zdHJ1Y3RvcihuKSB7XG4gICAgdGhpcy5fYnVmID0gbmV3IFJpbmdCdWZmZXIobik7XG4gICAgdGhpcy5fc2l6ZSA9IG47XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5wb3AoKTtcbiAgfVxuXG4gIGFkZCh2KSB7XG4gICAgdGhpcy5fYnVmLnJlc2l6aW5nVW5zaGlmdCh2KTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5sZW5ndGg7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBEcm9wcGluZ0J1ZmZlciBleHRlbmRzIEZpeGVkQnVmZmVyIHtcbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLl9idWYubGVuZ3RoIDwgdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFNsaWRpbmdCdWZmZXIgZXh0ZW5kcyBGaXhlZEJ1ZmZlciB7XG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IHsgRHJvcHBpbmdCdWZmZXIsIFNsaWRpbmdCdWZmZXIsIEZpeGVkQnVmZmVyLCBSaW5nQnVmZmVyIH07IiwiXG5pbXBvcnQgeyBGaXhlZEJ1ZmZlciwgUmluZ0J1ZmZlciB9IGZyb20gXCIuL2J1ZmZlcnMuanNcIjtcbmltcG9ydCB7IERpc3BhdGNoIH0gZnJvbSBcIi4vZGlzcGF0Y2guanNcIjtcbmltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFRyYW5zYWN0b3Ige1xuICBjb25zdHJ1Y3RvcihvZmZlcikge1xuICAgIHRoaXMub2ZmZXJlZCA9IG9mZmVyO1xuICAgIHRoaXMucmVjZWl2ZWQgPSBudWxsO1xuICAgIHRoaXMucmVzb2x2ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcbiAgfVxuXG4gIGNvbW1pdCgpIHtcbiAgICByZXR1cm4gKHZhbCkgPT4ge1xuICAgICAgaWYodGhpcy5yZXNvbHZlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byByZXNvbHZlIHRyYW5zYWN0b3IgdHdpY2UhXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWNlaXZlZCA9IHZhbDtcbiAgICAgIHRoaXMucmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaChjID0+IGModmFsKSk7XG5cbiAgICAgIHJldHVybiB0aGlzLm9mZmVyZWQ7XG4gICAgfVxuICB9XG5cbiAgZGVyZWYoY2FsbGJhY2spIHtcbiAgICBpZih0aGlzLnJlc29sdmVkKSB7XG4gICAgICBjYWxsYmFjayh0aGlzLnJlY2VpdmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9XG59XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubGV0IGRpc3BhdGNoID0gbmV3IERpc3BhdGNoKCk7XG5cbmxldCBhdHRlbXB0ID0gZnVuY3Rpb24oZm4sIGV4aCkgeyB0cnkgeyByZXR1cm4gZm4oKSB9IGNhdGNoKGUpIHsgcmV0dXJuIGV4aChlKTsgfSB9XG5sZXQgcGFzc3Rocm91Z2ggPSBmdW5jdGlvbihuZXh0KSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gbmV4dCh2YWx1ZSkgOiBuZXh0KCk7XG4gIH1cbn07XG5sZXQgZGVmYXVsdEV4SGFuZGxlciA9IGZ1bmN0aW9uKGUpIHsgY29uc29sZS5lcnJvcihlKTsgcmV0dXJuIGZhbHNlOyB9XG5sZXQgcmVkdWNlZCA9IHsgcmVkdWNlZDogdHJ1ZSB9O1xuXG5jbGFzcyBDaGFubmVsIHtcbiAgY29uc3RydWN0b3Ioc2l6ZU9yQnVmLCB4Zm9ybSwgZXhjZXB0aW9uSGFuZGxlcikge1xuICAgIGxldCBkb0FkZCA9IHZhbCA9PiB7XG4gICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMuX2J1ZmZlci5hZGQodmFsKSA6IHRoaXMuX2J1ZmZlcjtcbiAgICB9XG5cbiAgICB0aGlzLl9idWZmZXIgICAgPSAoc2l6ZU9yQnVmIGluc3RhbmNlb2YgRml4ZWRCdWZmZXIpID8gc2l6ZU9yQnVmIDogbmV3IEZpeGVkQnVmZmVyKHNpemVPckJ1ZiB8fCAwKTtcbiAgICB0aGlzLl90YWtlcnMgICAgPSBuZXcgUmluZ0J1ZmZlcigzMik7XG4gICAgdGhpcy5fcHV0dGVycyAgID0gbmV3IFJpbmdCdWZmZXIoMzIpO1xuICAgIHRoaXMuX3hmb3JtZXIgICA9IHhmb3JtID8geGZvcm0oZG9BZGQpIDogcGFzc3Rocm91Z2goZG9BZGQpO1xuICAgIHRoaXMuX2V4SGFuZGxlciA9IGV4Y2VwdGlvbkhhbmRsZXIgfHwgZGVmYXVsdEV4SGFuZGxlcjtcblxuICAgIHRoaXMuX2lzT3BlbiA9IHRydWU7XG4gIH1cblxuICBfaW5zZXJ0KCkge1xuICAgIHJldHVybiBhdHRlbXB0KCgpID0+IHRoaXMuX3hmb3JtZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSwgdGhpcy5fZXhIYW5kbGVyKTtcbiAgfVxuXG4gIGFib3J0KCkge1xuICAgIHdoaWxlKHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICBsZXQgcHV0dGVyID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcblxuICAgICAgaWYocHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICBsZXQgcHV0dGVyQ2IgPSBwdXR0ZXIuY29tbWl0KCk7XG4gICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiBwdXR0ZXJDYih0cnVlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3B1dHRlcnMuY2xlYW51cCgoKSA9PiBmYWxzZSk7XG4gIH1cblxuICBmaWxsKHZhbCwgdHggPSBuZXcgVHJhbnNhY3Rvcih2YWwpKSB7XG4gICAgaWYodmFsID09PSBudWxsKSB7IHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBwdXQgbnVsbCB0byBhIGNoYW5uZWwuXCIpOyB9XG4gICAgaWYoISh0eCBpbnN0YW5jZW9mIFRyYW5zYWN0b3IpKSB7IHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBUcmFuc2FjdG9yIHRvIGJlIHBhc3NlZCB0byBmaWxsXCIpOyB9XG4gICAgaWYoIXR4LmFjdGl2ZSkgeyByZXR1cm4gdHg7IH1cblxuICAgIGlmKCF0aGlzLm9wZW4pIHtcbiAgICAgIC8vIEVpdGhlciBzb21lYm9keSBoYXMgcmVzb2x2ZWQgdGhlIGhhbmRsZXIgYWxyZWFkeSAodGhhdCB3YXMgZmFzdCkgb3IgdGhlIGNoYW5uZWwgaXMgY2xvc2VkLlxuICAgICAgLy8gY29yZS5hc3luYyByZXR1cm5zIGEgYm9vbGVhbiBvZiB3aGV0aGVyIG9yIG5vdCBzb21ldGhpbmcgKmNvdWxkKiBnZXQgcHV0IHRvIHRoZSBjaGFubmVsXG4gICAgICAvLyB3ZSdsbCBkbyB0aGUgc2FtZSAjY2FyZ29jdWx0XG4gICAgICB0eC5jb21taXQoKShmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYoIXRoaXMuX2J1ZmZlci5mdWxsKSB7XG4gICAgICAvLyBUaGUgY2hhbm5lbCBoYXMgc29tZSBmcmVlIHNwYWNlLiBTdGljayBpdCBpbiB0aGUgYnVmZmVyIGFuZCB0aGVuIGRyYWluIGFueSB3YWl0aW5nIHRha2VzLlxuICAgICAgdHguY29tbWl0KCkodHJ1ZSk7XG4gICAgICBsZXQgZG9uZSA9IGF0dGVtcHQoKCkgPT4gdGhpcy5faW5zZXJ0KHZhbCkgPT09IHJlZHVjZWQsIHRoaXMuX2V4SGFuZGxlcik7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3Rha2Vycy5sZW5ndGggJiYgdGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICBsZXQgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgICBpZih0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICAgIGxldCB2YWwgPSB0aGlzLl9idWZmZXIucmVtb3ZlKCk7XG4gICAgICAgICAgbGV0IHRha2VyQ2IgPSB0YWtlclR4LmNvbW1pdCgpO1xuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VyQ2IodmFsKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoZG9uZSkgeyB0aGlzLmFib3J0KCk7IH1cblxuICAgICAgcmV0dXJuIHR4O1xuICAgIH0gZWxzZSBpZih0aGlzLl90YWtlcnMubGVuZ3RoKSB7XG4gICAgICAvLyBUaGUgYnVmZmVyIGlzIGZ1bGwgYnV0IHRoZXJlIGFyZSB3YWl0aW5nIHRha2VycyAoZS5nLiB0aGUgYnVmZmVyIGlzIHNpemUgemVybylcblxuICAgICAgbGV0IHRha2VyVHggPSB0aGlzLl90YWtlcnMucG9wKCk7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3Rha2Vycy5sZW5ndGggJiYgIXRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgIHRha2VyVHggPSB0aGlzLl90YWtlcnMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHRha2VyVHggJiYgdGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgdHguY29tbWl0KCkodHJ1ZSk7XG4gICAgICAgIGxldCB0YWtlckNiID0gdGFrZXJUeC5jb21taXQoKTtcblxuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3B1dHRlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHV0dGVycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgIH1cblxuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHB1dCh2YWwsIHRyYW5zYWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmZpbGwodmFsLCB0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRyYWluKHR4ID0gbmV3IFRyYW5zYWN0b3IoKSkge1xuICAgIGlmKCEodHggaW5zdGFuY2VvZiBUcmFuc2FjdG9yKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgVHJhbnNhY3RvciB0byBiZSBwYXNzZWQgdG8gZHJhaW5cIik7IH1cbiAgICBpZighdHguYWN0aXZlKSB7IHJldHVybiB0eDsgfVxuXG4gICAgaWYodGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgbGV0IGJ1ZlZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcblxuICAgICAgd2hpbGUoIXRoaXMuX2J1ZmZlci5mdWxsICYmIHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHB1dHRlci5hY3RpdmUpIHtcbiAgICAgICAgICBsZXQgcHV0VHggPSBwdXR0ZXIuY29tbWl0KCksXG4gICAgICAgICAgICAgIHZhbCA9IHB1dHRlci5vZmZlcmVkOyAvLyBLaW5kYSBicmVha2luZyB0aGUgcnVsZXMgaGVyZVxuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHB1dFR4KCkpO1xuICAgICAgICAgIGxldCBkb25lID0gYXR0ZW1wdCgoKSA9PiB0aGlzLl9pbnNlcnQodmFsKSA9PT0gcmVkdWNlZCwgdGhpcy5fZXhIYW5kbGVyKTtcblxuICAgICAgICAgIGlmKGRvbmUgPT09IHJlZHVjZWQpIHsgdGhpcy5hYm9ydCgpOyB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdHguY29tbWl0KCkoYnVmVmFsKTtcbiAgICB9IGVsc2UgaWYodGhpcy5fcHV0dGVycy5sZW5ndGgpIHtcbiAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuXG4gICAgICB3aGlsZSh0aGlzLl9wdXR0ZXJzLmxlbmd0aCAmJiAhcHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZihwdXR0ZXIgJiYgcHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICBsZXQgdHhDYiA9IHR4LmNvbW1pdCgpLFxuICAgICAgICAgICAgcHV0VHggPSBwdXR0ZXIuY29tbWl0KCksXG4gICAgICAgICAgICB2YWwgPSBwdXR0ZXIub2ZmZXJlZDtcblxuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gcHV0VHgoKSk7XG4gICAgICAgIHR4Q2IodmFsKTtcbiAgICAgIH0gZWxzZSBpZighdGhpcy5vcGVuKSB7XG4gICAgICAgIGF0dGVtcHQoKCkgPT4gdGhpcy5faW5zZXJ0KCksIHRoaXMuX2V4SGFuZGxlcik7XG5cbiAgICAgICAgaWYodGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgIHR4Q2IodGhpcy5fYnVmZmVyLnJlbW92ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0eENiKG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl90YWtlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFrZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgdGFrZSh0cmFuc2FjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5kcmFpbih0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHRoZW4oZm4sIGVycikge1xuICAgIHJldHVybiB0aGlzLnRha2UoKS50aGVuKGZuLCBlcnIpO1xuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgaWYodGhpcy5vcGVuKSB7XG4gICAgICB0aGlzLl9pc09wZW4gPSBmYWxzZTtcblxuICAgICAgaWYodGhpcy5fcHV0dGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYXR0ZW1wdCgoKSA9PiB0aGlzLl9pbnNlcnQoKSwgdGhpcy5fZXhIYW5kbGVyKTtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKHRoaXMuX3Rha2Vycy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHRha2VyID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHRha2VyLmFjdGl2ZSkge1xuICAgICAgICAgIGxldCB2YWwgPSB0aGlzLl9idWZmZXIubGVuZ3RoID8gdGhpcy5fYnVmZmVyLnJlbW92ZSgpIDogbnVsbCxcbiAgICAgICAgICAgICAgdGFrZXJDYiA9IHRha2VyLmNvbW1pdCgpO1xuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VyQ2IodmFsKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpbnRvKG90aGVyQ2hhbiwgc2hvdWxkQ2xvc2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBpbnRvKHZhbCkge1xuICAgICAgaWYodmFsID09PSBuaWwgJiYgc2hvdWxkQ2xvc2UpIHtcbiAgICAgICAgb3V0LmNsb3NlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQucHV0KHZhbCkudGhlbihvcGVuID0+IHtcbiAgICAgICAgICBpZighb3BlbiAmJiBzaG91bGRDbG9zZSkge1xuICAgICAgICAgICAgc2VsZi5jbG9zZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnRha2UoKS50aGVuKG1hcHBlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRha2UoKS50aGVuKGludG8pO1xuXG4gICAgcmV0dXJuIG90aGVyQ2hhbjtcbiAgfVxuXG4gIGdldCBvcGVuKCkge1xuICAgIHJldHVybiB0aGlzLl9pc09wZW47XG4gIH1cbn1cblxuQ2hhbm5lbC5yZWR1Y2VkID0gcmVkdWNlZDtcblxuZXhwb3J0IHsgQ2hhbm5lbCwgVHJhbnNhY3RvciB9OyIsImxldCBkZWZhdWx0QXN5bmNocm9uaXplciA9ICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSA/IGZ1bmN0aW9uKGZuKSB7XG4gIHJldHVybiBzZXRJbW1lZGlhdGUoZm4pO1xufSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHJldHVybiBzZXRUaW1lb3V0KGZuKTtcbn07XG5cbmNsYXNzIERpc3BhdGNoIHtcbiAgY29uc3RydWN0b3IoYXN5bmNocm9uaXplcikge1xuICAgIHRoaXMuX2FzeW5jaHJvbml6ZXIgPSBhc3luY2hyb25pemVyIHx8IGRlZmF1bHRBc3luY2hyb25pemVyO1xuICAgIHRoaXMuX3F1ZXVlID0gW107XG4gIH1cblxuICBydW4oZm4pIHtcbiAgICB0aGlzLl9xdWV1ZS5wdXNoKGZuKTtcblxuICAgIHRoaXMuX2FzeW5jaHJvbml6ZXIoKCkgPT4ge1xuICAgICAgd2hpbGUodGhpcy5fcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJRVUVVRVwiLCB0aGlzLl9xdWV1ZVswXSk7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnNoaWZ0KCkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5cbmV4cG9ydCB7IERpc3BhdGNoIH07IiwiaW1wb3J0IHsgQ2hhbm5lbCwgVHJhbnNhY3RvciB9IGZyb20gXCIuL2NoYW5uZWxzLmpzXCI7XG5pbXBvcnQgeyBGaXhlZEJ1ZmZlciwgRHJvcHBpbmdCdWZmZXIsIFNsaWRpbmdCdWZmZXIsIFJpbmdCdWZmZXIgfSBmcm9tIFwiLi9idWZmZXJzLmpzXCI7XG5pbXBvcnQgeyBNdWx0IH0gZnJvbSBcIi4vbXVsdC5qc1wiO1xuaW1wb3J0IHsgYWx0cywgdGltZW91dCwgb3JkZXIsIG1hcCwgZmlsdGVyLCBwYXJ0aXRpb25CeSwgcGFydGl0aW9uIH0gZnJvbSBcIi4vdXRpbHMuanNcIjtcblxuZXhwb3J0IHtcbiAgICBDaGFubmVsLFxuICAgIFRyYW5zYWN0b3IsXG4gICAgRml4ZWRCdWZmZXIsXG4gICAgRHJvcHBpbmdCdWZmZXIsXG4gICAgU2xpZGluZ0J1ZmZlcixcbiAgICBSaW5nQnVmZmVyLFxuICAgIE11bHQsXG4gICAgYWx0cyxcbiAgICB0aW1lb3V0LFxuICAgIG9yZGVyLFxuICAgIG1hcCxcbiAgICBmaWx0ZXIsXG4gICAgcGFydGl0aW9uQnksXG4gICAgcGFydGl0aW9uXG59OyIsImltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5cbmZ1bmN0aW9uIGRpc3RyaWJ1dGUodGFwcywgdmFsKSB7XG4gIGlmKCF0YXBzLmxlbmd0aCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgWyB0YXAsIC4uLnJlc3QgXSA9IHRhcHM7XG5cbiAgICByZXR1cm4gdGFwLnB1dCh2YWwpLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGRpc3RyaWJ1dGUocmVzdCwgdmFsKTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBNdWx0IHtcblxuICBjb25zdHJ1Y3RvcihjaCkge1xuICAgIHRoaXMuX3RhcHMgPSBbXTtcbiAgICB0aGlzLl9mcmVlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICBjaC50YWtlKCkudGhlbihmdW5jdGlvbiBkcmFpbkxvb3Aodikge1xuICAgICAgaWYodiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBjbGVhbnVwXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gTG9ja3MgdGhlIGxpc3Qgb2YgdGFwcyB1bnRpbCB0aGUgZGlzdHJpYnV0aW9uIGlzIGNvbXBsZXRlXG4gICAgICBsZXQgZG9GcmVlLCBmcmVlID0gbmV3IFByb21pc2UociA9PiBkb0ZyZWUgPSByKTtcblxuICAgICAgdGhpcy5fZnJlZSA9IGZyZWU7XG5cbiAgICAgIGRpc3RyaWJ1dGUodGFwcywgdikudGhlbigoKSA9PiB7XG4gICAgICAgIGRvRnJlZSgpO1xuICAgICAgICBjaC50YWtlKCkudGhlbihkcmFpbkxvb3ApO1xuICAgICAgfSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHRhcChjaCwgY2xvc2UpIHtcbiAgICBpZih0aGlzLl90YXBzLnNvbWUodCA9PiB0LmNoID09PSBjaCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGFkZCB0aGUgc2FtZSBjaGFubmVsIHRvIGEgbXVsdCB0d2ljZVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZnJlZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RhcHMucHVzaCh7IGNsb3NlOiBjbG9zZSwgY2g6IGNoIH0pO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0pO1xuICB9XG5cbiAgdW50YXAoY2gpIHtcbiAgICByZXR1cm4gdGhpcy5fZnJlZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RhcHMgPSB0aGlzLl90YXBzLmZpbHRlcih0YXAgPT4ge1xuICAgICAgICByZXR1cm4gdGFwLmNoICE9PSBjaDtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0pO1xuICB9XG5cbn1cblxuZXhwb3J0IHsgTXVsdCB9OyIsInZhciBfUHJvbWlzZTtcblxuaWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LlByb21pc2UpIHtcbiAgX1Byb21pc2UgPSB3aW5kb3cuUHJvbWlzZTtcbn0gZWxzZSBpZih0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiBnbG9iYWwuUHJvbWlzZSkge1xuICBfUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlO1xufSBlbHNlIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGZpbmQgbmF0aXZlIHByb21pc2UgaW1wbGVtZW50YXRpb24uXCIpO1xufVxuXG5leHBvcnQgeyBfUHJvbWlzZSBhcyBQcm9taXNlIH07XG4iLCJpbXBvcnQgeyBDaGFubmVsLCBUcmFuc2FjdG9yIH0gZnJvbSBcIi4vY2hhbm5lbHMuanNcIjtcblxuXG5jbGFzcyBBbHRzVHJhbnNhY3RvciBleHRlbmRzIFRyYW5zYWN0b3Ige1xuICBjb25zdHJ1Y3RvcihvZmZlciwgY29tbWl0Q2IpIHtcbiAgICBzdXBlcihvZmZlcik7XG4gICAgdGhpcy5jb21taXRDYiA9IGNvbW1pdENiO1xuICB9XG4gIGNvbW1pdCgpIHtcbiAgICB0aGlzLmNvbW1pdENiKCk7XG4gICAgcmV0dXJuIHN1cGVyLmNvbW1pdCgpO1xuICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFsdHMocmFjZSkge1xuICBsZXQgdHJhbnNhY3RvcnMgPSBbXTtcbiAgbGV0IG91dENoID0gbmV3IENoYW5uZWwoKTtcblxuICBsZXQgZGVhY3RpdmF0ZSA9ICgpID0+IHsgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpIH1cblxuICByYWNlLm1hcChjbWQgPT4ge1xuXG4gICAgaWYoQXJyYXkuaXNBcnJheShjbWQpKSB7XG4gICAgICBsZXQgdHggPSBuZXcgQWx0c1RyYW5zYWN0b3IodmFsLCAoKSA9PiB7XG4gICAgICAgIHRyYW5zYWN0b3JzLmZvckVhY2goaCA9PiBoLmFjdGl2ZSA9IGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgbGV0IFsgY2gsIHZhbCBdID0gY21kO1xuICAgICAgY2gucHV0KHZhbCwgdHgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIG91dENoLnB1dChbIHZhbCwgY2ggXSk7XG4gICAgICB9KTtcblxuICAgICAgdHJhbnNhY3RvcnMucHVzaCh0eCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB0eCA9IG5ldyBBbHRzVHJhbnNhY3Rvcih0cnVlLCAoKSA9PiB7XG4gICAgICAgIHRyYW5zYWN0b3JzLmZvckVhY2goaCA9PiBoLmFjdGl2ZSA9IGZhbHNlKTtcbiAgICAgIH0pO1xuXG4gICAgICBjbWQudGFrZSh0eCkudGhlbihmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgb3V0Q2gucHV0KFsgdmFsLCBjbWQgXSk7XG4gICAgICB9KTtcblxuICAgICAgdHJhbnNhY3RvcnMucHVzaCh0eCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gb3V0Q2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lb3V0KG1zKSB7XG4gIHZhciBjaCA9IG5ldyBDaGFubmVsKCk7XG4gIHNldFRpbWVvdXQoKCkgPT4geyBjaC5jbG9zZSgpOyB9LCBtcyk7XG4gIHJldHVybiBjaDtcbn1cblxuLy8gRW5mb3JjZXMgb3JkZXIgcmVzb2x1dGlvbiBvbiByZXN1bHRpbmcgY2hhbm5lbFxuLy8gVGhpcyBtaWdodCBuZWVkIHRvIGJlIHRoZSBkZWZhdWx0IGJlaGF2aW9yLCB0aG91Z2ggdGhhdCByZXF1aXJlcyBtb3JlIHRob3VnaHRcbmV4cG9ydCBmdW5jdGlvbiBvcmRlcihpbmNoLCBzaXplT3JCdWYpIHtcbiAgdmFyIG91dGNoID0gbmV3IENoYW5uZWwoc2l6ZU9yQnVmKTtcblxuICBmdW5jdGlvbiBkcmFpbigpIHtcbiAgICBpbmNoLnRha2UoKS50aGVuKHZhbCA9PiB7XG4gICAgICBpZih2YWwgPT09IG51bGwpIHtcbiAgICAgICAgb3V0Y2guY2xvc2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dGNoLnB1dCh2YWwpLnRoZW4oZHJhaW4pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGRyYWluKCk7XG5cbiAgcmV0dXJuIG91dGNoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFwKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihuZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgaWYoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbmV4dChmbih2YWwpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXIoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5leHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odmFsKSB7XG4gICAgICBpZihhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGlmIChmbih2YWwpKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpdGlvbkJ5KGZuKSB7XG4gIGxldCBsYXN0ID0gbnVsbCxcbiAgICAgIGFjY3VtdWxhdG9yID0gW107XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG5leHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odmFsKSB7XG4gICAgICBpZihhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGxldCBwcmVkaWNhdGVSZXN1bHQgPSBmbih2YWwpO1xuICAgICAgICBpZihsYXN0ICE9PSBudWxsICYmIHByZWRpY2F0ZVJlc3VsdCAhPT0gbGFzdCkge1xuICAgICAgICAgIGxldCB0bXAgPSBhY2N1bXVsYXRvcjtcblxuICAgICAgICAgIGFjY3VtdWxhdG9yID0gWyB2YWwgXTtcbiAgICAgICAgICBsYXN0ID0gcHJlZGljYXRlUmVzdWx0O1xuXG4gICAgICAgICAgcmV0dXJuIG5leHQodG1wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsYXN0ID0gcHJlZGljYXRlUmVzdWx0O1xuICAgICAgICAgIGFjY3VtdWxhdG9yLnB1c2godmFsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHQoYWNjdW11bGF0b3IpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFydGl0aW9uKG51bSkge1xuICBsZXQgYyA9IDAsXG4gICAgICBhID0gW107XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG5leHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odmFsKSB7XG4gICAgICBpZihhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGEucHVzaCh2YWwpO1xuICAgICAgICBjICs9IDE7XG5cbiAgICAgICAgaWYoYyAlIG51bSA9PT0gMCkge1xuICAgICAgICAgIGxldCB0bXAgPSBhO1xuXG4gICAgICAgICAgYSA9IFtdO1xuXG4gICAgICAgICAgcmV0dXJuIG5leHQodG1wKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHQoYSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59IiwiXG5pbXBvcnQge1xuICAgIENoYW5uZWwsXG4gICAgUmluZ0J1ZmZlcixcbiAgICBGaXhlZEJ1ZmZlcixcbiAgICBTbGlkaW5nQnVmZmVyLFxuICAgIERyb3BwaW5nQnVmZmVyLFxuICAgIGFsdHMsXG4gICAgdGltZW91dCxcbiAgICBvcmRlcixcbiAgICBtYXAsXG4gICAgZmlsdGVyLFxuICAgIHBhcnRpdGlvbkJ5LFxuICAgIHBhcnRpdGlvblxufSBmcm9tIFwiLi4vc3JjL2NoYW5uZWxzL2luZGV4LmpzXCI7XG5cbmZ1bmN0aW9uIGFzc2VydChleHByLCB2YWwsIG1zZyA9IGBFeHBlY3RlZCAke3ZhbH0sIHJlY2VpdmVkICR7ZXhwcn1gKSB7XG4gIGlmKGV4cHIgIT09IHZhbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG5cbiAgLy9jb25zb2xlLmxvZyhcIkFTU0VSVFwiLCBleHByLCB2YWwpO1xufVxuXG5mdW5jdGlvbiBmYWlsVGVzdChtc2cpIHtcbiAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG59XG5cbmZ1bmN0aW9uIGNoYW5uZWxUZXN0KGNoYW5zLCB0ZXN0KSB7XG4gIGxldCBqb2ludCA9IGNoYW5zLm1hcChjID0+IHtcbiAgICBsZXQgcmVzb2x2ZXIsIHByb21pc2UgPSBuZXcgUHJvbWlzZShyID0+IHJlc29sdmVyID0gcik7XG4gICAgbGV0IGNsb3NlID0gYy5jbG9zZTtcblxuICAgIGMuY2xvc2UgPSAoKSA9PiB7XG4gICAgICBjbG9zZS5jYWxsKGMpO1xuICAgICAgcmVzb2x2ZXIoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSk7XG5cbiAgdGVzdC5hcHBseShudWxsLCBjaGFucyk7XG5cbiAgcmV0dXJuIFByb21pc2UuYWxsKGpvaW50KTtcbn1cblxuZnVuY3Rpb24gaG9pc3QoZm4sIC4uLmFyZ3MpIHtcbiAgcmV0dXJuICgpID0+IHtcbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gIH1cbn1cblxuLy8gPT09IEJFR0lOIFRFU1RTID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuLy8gU3luY2hyb25vdXMgdGVzdHM6XG4oKCkgPT4ge1xuICAvKlxuICBUaGUgUmluZ0J1ZmZlciBpcyB0aGUgYmFzaXMgb24gd2hpY2ggYWxsIHRoZSBidWZmZXJzIGFyZSBidWlsdC4gSXQncyBkaWZmaWN1bHQgdG8gdXNlLCBzbyB5b3UgcHJvYmFibHkgd29uJ3QgZXZlclxuICB3YW50IHRvIHVzZSBpdC4gVXNlIHRoZSBoaWdoZXItbGV2ZWwgRml4ZWRCdWZmZXIsIERyb3BwaW5nQnVmZmVyLCBhbmQgU2xpZGluZ0J1ZmZlciBpbnN0ZWFkXG4gICAqL1xuICBsZXQgYnVmID0gbmV3IFJpbmdCdWZmZXIoMCk7XG5cbiAgYnVmLnJlc2l6aW5nVW5zaGlmdCgxMCk7XG4gIGFzc2VydChidWYucG9wKCksIDEwKTtcblxuICBidWYucmVzaXppbmdVbnNoaWZ0KDIwKTtcbiAgYXNzZXJ0KGJ1Zi5wb3AoKSwgMjApO1xuXG4gIGxldCBpID0gMjAwO1xuICB3aGlsZShpIC0tKSB7XG4gICAgYnVmLnJlc2l6aW5nVW5zaGlmdChpKTtcbiAgfVxuICB3aGlsZShidWYubGVuZ3RoKSB7XG4gICAgYXNzZXJ0KGJ1Zi5wb3AoKSwgYnVmLmxlbmd0aCk7XG4gIH1cblxufSkoKTtcblxuKCgpID0+IHtcbiAgbGV0IGJ1ZiA9IG5ldyBGaXhlZEJ1ZmZlcigxKTtcblxuICBidWYuYWRkKDEwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCB0cnVlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcblxuICBidWYuYWRkKDIwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCB0cnVlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMjApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcblxufSkoKTtcblxuKCgpID0+IHtcbiAgbGV0IGJ1ZiA9IG5ldyBTbGlkaW5nQnVmZmVyKDEpO1xuXG4gIGJ1Zi5hZGQoMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMTApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcblxuICBidWYuYWRkKDIwKTtcbiAgYXNzZXJ0KGJ1Zi5mdWxsLCBmYWxzZSk7XG4gIGJ1Zi5hZGQoMzApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYXNzZXJ0KGJ1Zi5yZW1vdmUoKSwgMzApO1xuXG4gIGxldCBpID0gMjAwO1xuICB3aGlsZShpIC0tKSB7XG4gICAgYnVmLmFkZChpKTtcbiAgfVxuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAwKTtcblxuXG59KSgpO1xuXG4oKCkgPT4ge1xuXG4gIGxldCBidWYgPSBuZXcgRHJvcHBpbmdCdWZmZXIoMSk7XG5cbiAgYnVmLmFkZCgxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAxMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuXG4gIGJ1Zi5hZGQoMjApO1xuICBhc3NlcnQoYnVmLmZ1bGwsIGZhbHNlKTtcbiAgYnVmLmFkZCgzMCk7XG4gIGFzc2VydChidWYuZnVsbCwgZmFsc2UpO1xuICBhc3NlcnQoYnVmLnJlbW92ZSgpLCAyMCk7XG5cbiAgbGV0IGkgPSAyMDA7XG4gIHdoaWxlKGkgLS0pIHtcbiAgICBidWYuYWRkKGkpO1xuICB9XG4gIGFzc2VydChidWYucmVtb3ZlKCksIDE5OSk7XG5cbn0pKCk7XG5cbi8vIEFzeW5jaHJvbm91cyB0ZXN0czpcbmNoYW5uZWxUZXN0KFsgbmV3IENoYW5uZWwoMykgXSwgY2hhbm5lbCA9PiB7XG4gIC8qXG4gICBQdXQgdGhyZWUgdmFsdWVzIG9uIGEgY2hhbm5lbCAtLSAxLCAyLCAzIC0tIGFuZCB0aGVuIHJlbW92ZSB0aGVtLlxuICAgKi9cblxuICBjaGFubmVsLnB1dCgxKTtcbiAgY2hhbm5lbC5wdXQoMik7XG4gIGNoYW5uZWwucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAxKSksXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDIpKSxcbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMykpXG5cbiAgXSkudGhlbigoKSA9PiBjaGFubmVsLmNsb3NlKCkpO1xuXG59KS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKG5ldyBTbGlkaW5nQnVmZmVyKDIpKSBdLCAoY2hhbm5lbCkgPT4ge1xuICAvKlxuICAgUHV0IHRocmVlIHZhbHVlcyBvbiBhIGNoYW5uZWwgLS0gMSwgMiwgMywgbm90aWNlIHRoZSBzbGlkaW5nIGJ1ZmZlciBkcm9wcyB0aGUgZmlyc3QgdmFsdWVcbiAgICovXG5cbiAgY2hhbm5lbC5wdXQoMSk7XG4gIGNoYW5uZWwucHV0KDIpO1xuICBjaGFubmVsLnB1dCgzKTtcblxuICBQcm9taXNlLmFsbChbXG5cbiAgICBjaGFubmVsLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMikpLFxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAzKSlcblxuICBdKS50aGVuKCgpID0+IGNoYW5uZWwuY2xvc2UoKSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKG5ldyBEcm9wcGluZ0J1ZmZlcigyKSkgXSwgY2hhbm5lbCA9PiB7XG4gIC8qXG4gICBQdXQgdGhyZWUgdmFsdWVzIG9uIGEgY2hhbm5lbCAtLSAxLCAyLCAzLCBub3RpY2UgdGhlIGRyb3BwaW5nIGJ1ZmZlciBpZ25vcmVzIGFkZGl0aW9uYWwgcHV0c1xuICAgKi9cblxuICBjaGFubmVsLnB1dCgxKTtcbiAgY2hhbm5lbC5wdXQoMik7XG4gIGNoYW5uZWwucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAxKSksXG4gICAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDIpKVxuXG4gIF0pLnRoZW4oKCkgPT4gY2hhbm5lbC5jbG9zZSgpKTtcblxuICBjaGFubmVsLmNsb3NlKCk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCkgXSwgKGNoYW4xLCBjaGFuMiwgY2hhbjMpID0+IHtcblxuICAvKlxuICBQdXQgYSB2YWx1ZSBvbnRvIHRocmVlIGRpZmZlcmVudCBjaGFubmVscyBhdCBkaWZmZXJlbnQgdGltZXMgYW5kIHVzZSBQcm9taXNlLmFsbCB0byB3YWl0IG9uIHRoZSB0aHJlZSB2YWx1ZXMsXG4gIGJlY2F1c2UgY2hhbm5lbHMgYmVoYXZlIGluIHByb21pc2UtbGlrZSB3YXlzICh3aXRoIHNvbWUgbm90YWJsZSBleGNlcHRpb25zKS5cblxuICBXaGVuIHRoZSB0aHJlZSBjaGFubmVscyBwcm9kdWNlIGEgdmFsdWUsIHB1bGwgYWdhaW4gZnJvbSB0aGUgZmlyc3QgY2hhbm5lbC5cbiAgICovXG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjEucHV0KFwiSGVsbG8hXCIpOyAgICAgICAgICAgICAgIH0sIDM1KTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjIucHV0KFwiSG93IGFyZSB5b3U/XCIpOyAgICAgICAgIH0sIDEwKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjMucHV0KFwiVmVyeSBnb29kLlwiKTsgICAgICAgICAgIH0sIDUwKTtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2hhbjEucHV0KFwiVGhhbmsgeW91IHZlcnkgbXVjaC5cIik7IH0sIDQwKTtcblxuICBQcm9taXNlLmFsbChbIGNoYW4xLCBjaGFuMiwgY2hhbjMgXSkudGhlbigoWyBfMSwgXzIsIF8zIF0pID0+IHtcbiAgICBhc3NlcnQoXzEsIFwiSGVsbG8hXCIpO1xuICAgIGFzc2VydChfMiwgXCJIb3cgYXJlIHlvdT9cIik7XG4gICAgYXNzZXJ0KF8zLCBcIlZlcnkgZ29vZC5cIik7XG5cbiAgICByZXR1cm4gY2hhbjEudGFrZSgpO1xuXG4gIH0pLnRoZW4odiA9PiB7XG4gICAgYXNzZXJ0KHYsIFwiVGhhbmsgeW91IHZlcnkgbXVjaC5cIik7XG5cbiAgICBjaGFuMS5jbG9zZSgpO1xuICAgIGNoYW4yLmNsb3NlKCk7XG4gICAgY2hhbjMuY2xvc2UoKTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCkgXSwgKGNoYW5uZWwpID0+IHtcbiAgLypcbiAgWW91IGNhbiBwdXQgYSBwcm9taXNlIGNoYWluIG9uIGEgY2hhbm5lbCwgYW5kIGl0IHdpbGwgYXV0b21hdGljYWxseSB1bndyYXAgdGhlIHByb21pc2UuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHdhaXQobnVtKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0sIG51bSk7XG4gICAgfSk7XG4gIH1cblxuICBjaGFubmVsLnB1dCh3YWl0KDEwMCkudGhlbigoKSA9PiAxMDApKTtcbiAgY2hhbm5lbC50YWtlKCkudGhlbigodikgPT4ge1xuICAgIGFzc2VydCh2LCAxMDApO1xuICAgIGNoYW5uZWwuY2xvc2UoKTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXSwgKCkgPT4ge1xuICAvKlxuICBCdXQgc29tZXRpbWVzIHlvdSBkb24ndCB3YW50IHRvIHVud3JhcCBwcm9taXNlcywgc28geW91J2xsIG5lZWQgdG8gdXNlIHRoZSBjYWxsYmFjayBhcGk6XG4gICAqL1xuICAvLyBUT0RPXG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCksIG5ldyBDaGFubmVsKCkgXSwgKGNoYW4xLCBjaGFuMiwgY2hhbjMpID0+IHtcbiAgLypcbiAgU29tZXRpbWVzIHlvdSB3YW50IHRvIGNvbXBsZXRlIG9ubHkgb25lIG9mIG1hbnkgb3BlcmF0aW9ucyBvbiBhIHNldCBvZiBjaGFubmVsc1xuICAgKi9cblxuICBsZXQgYWx0czEgPSBhbHRzKFsgY2hhbjEsIGNoYW4yIF0pLnRha2UoKS50aGVuKChbdmFsLCBjaGFuXSkgPT4ge1xuICAgIGFzc2VydChjaGFuLCBjaGFuMik7XG4gICAgYXNzZXJ0KHZhbCwgMTAwKTtcblxuICB9KTtcblxuICBsZXQgYWx0czIgPSBhbHRzKFsgY2hhbjEsIGNoYW4yIF0pLnRha2UoKS50aGVuKChbIHZhbCwgY2hhbiBdKSA9PiB7XG4gICAgYXNzZXJ0KGNoYW4sIGNoYW4xKTtcbiAgICBhc3NlcnQodmFsLCAyMDApO1xuICB9KTtcblxuICAvLyBZb3UgY2FuIFwicHV0XCIgdG8gYSBjaGFubmVsIGluIGFuIGFsdHMgYnkgcGFzc2luZyBhbiBhcnJheVxuICBsZXQgYWx0czMgPSBhbHRzKFsgY2hhbjEsIGNoYW4yLCBbIGNoYW4zLCAzMDAgXSBdKS50YWtlKCkudGhlbigoWyB2YWwsIGNoYW4gXSkgPT4ge1xuICAgIGFzc2VydChjaGFuLCBjaGFuMyk7XG4gICAgYXNzZXJ0KHZhbCwgMzAwKTtcbiAgfSk7XG5cbiAgY2hhbjMudGFrZSgpO1xuICBjaGFuMi5wdXQoMTAwKTtcbiAgY2hhbjEucHV0KDIwMCk7XG5cbiAgUHJvbWlzZS5hbGwoWyBhbHRzMSwgYWx0czIsIGFsdHMzIF0pLnRoZW4oKCkgPT4ge1xuICAgIGNoYW4xLmNsb3NlKCk7XG4gICAgY2hhbjIuY2xvc2UoKTtcbiAgICBjaGFuMy5jbG9zZSgpO1xuICB9KTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuICAvKlxuICAgSXQncyBlYXN5IHRvIG9yZGVyIGEgY2hhbm5lbCBieSBpdHMgYWRkZWQgZGF0ZSB1c2luZyB0aGUgYG9yZGVyYCBmdW5jdGlvbiwgd2hpY2ggdGFrZXMgYSBjaGFubmVsIGFuZCByZXR1cm5zXG4gICBhIHN0cmljdGx5IG9yZGVyZWQgdmVyc2lvbiBvZiBpdHMgYXN5bmNocm9ub3VzIHZhbHVlcyAoYXNzdW1lcyB0aG9zZSB2YWx1ZXMgYXJlIHByb21pc2VzKVxuXG4gICBUaGlzIGlzIHVzZWZ1bCBmb3IgdGFraW5nIGEgY2hhbm5lbCBvZiBQcm9taXNlPEh0dHBSZXF1ZXN0PFZhbHVlPj4gYW5kIHRyYW5zbGF0aW5nIGl0IHRvIFByb21pc2U8VmFsdWU+XG4gICAqL1xuXG4gIHZhciBvcmRlcmVkID0gb3JkZXIoY2hhbm5lbCk7XG5cbiAgY2hhbm5lbC5wdXQodGltZW91dCgyMDApLnRoZW4oKCkgPT4gMjAwKSk7XG4gIGNoYW5uZWwucHV0KHRpbWVvdXQoMTAwKS50aGVuKCgpID0+IDEwMCkpO1xuXG4gIC8vIChOb3RlIHlvdSBjYW4gcHV0IHRoZSBzYW1lIGNoYW5uZWwgaW50byBhIFByb21pc2UuYWxsIG1hbnkgdGltZXMpXG4gIFByb21pc2UuYWxsKFsgb3JkZXJlZCwgb3JkZXJlZCBdKS50aGVuKChbIGZpcnN0LCBzZWNvbmQgXSkgPT4ge1xuICAgIGFzc2VydChmaXJzdCwgMjAwKTtcbiAgICBhc3NlcnQoc2Vjb25kLCAxMDApO1xuICAgIGNoYW5uZWwuY2xvc2UoKTtcbiAgfSk7XG5cblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFsgbmV3IENoYW5uZWwoKSBdLCAoY2hhbm5lbCkgPT4ge1xuXG4gIGNoYW5uZWwucHV0KG5ldyBQcm9taXNlKCgpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgfSkpO1xuXG4gIGNoYW5uZWwucHV0KDEwMCk7XG5cbiAgbGV0IGZhaWx1cmUgPSBjaGFubmVsLnRha2UoKS50aGVuKHYgPT4gZmFpbFRlc3QoXCJTaG91bGQgaGF2ZSBldmFsdWF0ZWQgdG8gYW4gZXJyb3JcIiksIGUgPT4ge30pO1xuICBsZXQgc3VjY2VzcyA9IGNoYW5uZWwudGFrZSgpLnRoZW4odiA9PiBhc3NlcnQodiwgMTAwKSk7XG5cbiAgUHJvbWlzZS5hbGwoWyBmYWlsdXJlLCBzdWNjZXNzXSkudGhlbigoKSA9PiBjaGFubmVsLmNsb3NlKCkpO1xuXG59KSkudGhlbihob2lzdChjaGFubmVsVGVzdCwgWyBuZXcgQ2hhbm5lbCgpIF0sIChjaGFubmVsKSA9PiB7XG5cbiAgY2hhbm5lbC5wdXQoMTAwKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgIGNoYW5uZWwudGFrZSgpLnRoZW4oZnVuY3Rpb24odikge1xuICAgICAgYXNzZXJ0KHYsIDIwMCk7XG4gICAgICBjaGFubmVsLmNsb3NlKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIFRoZSBhYm92ZSBjb2RlIHdpbGwgZGVhZGxvY2sgaWYgdGhlIG5leHQgYmxvY2sgaXNuJ3QgdGhlcmUsIGJlY2F1c2UgdGhlIHB1dCBpcyBoYWx0ZWQgb24gYSB6ZXJvLWxlbmd0aCBidWZcblxuICB0aW1lb3V0KDEwMCkudGhlbihmdW5jdGlvbigpIHtcbiAgICBjaGFubmVsLnRha2UoKS50aGVuKGZ1bmN0aW9uKHYpIHtcbiAgICAgIGFzc2VydCh2LCAxMDApO1xuICAgICAgY2hhbm5lbC5wdXQoMjAwKTtcbiAgICB9KTtcbiAgfSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXG4gIG5ldyBDaGFubmVsKDEsIG1hcCh2ID0+IHYgKiAyKSlcbl0sIChkb3VibGVyKSA9PiB7XG5cbiAgLy8gVmFsdWVzIHB1dCBvbiB0aGUgY2hhbm5lbCBhcmUgZG91YmxlZFxuICBkb3VibGVyLnB1dCgxKTtcbiAgZG91Ymxlci5wdXQoMik7XG4gIGRvdWJsZXIucHV0KDMpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGRvdWJsZXIudGFrZSgpLnRoZW4oKHYpID0+IGFzc2VydCh2LCAyKSksXG4gICAgZG91Ymxlci50YWtlKCkudGhlbigodikgPT4gYXNzZXJ0KHYsIDQpKSxcbiAgICBkb3VibGVyLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgNikpXG5cbiAgXSkudGhlbigoKSA9PiBkb3VibGVyLmNsb3NlKCkpO1xuXG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXG4gIG5ldyBDaGFubmVsKDEsIGZpbHRlcih2ID0+IHYgJSAyID09PSAwKSlcbl0sIChldmVucykgPT4ge1xuXG4gIC8vIFZhbHVlcyBwdXQgb24gdGhlIGNoYW5uZWwgYXJlIGRvdWJsZWRcbiAgZXZlbnMucHV0KDEpO1xuICBldmVucy5wdXQoMik7XG4gIGV2ZW5zLnB1dCgzKTtcbiAgZXZlbnMucHV0KDQpO1xuXG4gIFByb21pc2UuYWxsKFtcblxuICAgIGV2ZW5zLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgMikpLFxuICAgIGV2ZW5zLnRha2UoKS50aGVuKCh2KSA9PiBhc3NlcnQodiwgNCkpXG5cbiAgXSkudGhlbigoKSA9PiBldmVucy5jbG9zZSgpKTtcblxufSkpLnRoZW4oaG9pc3QoY2hhbm5lbFRlc3QsIFtcbiAgbmV3IENoYW5uZWwoMSwgcGFydGl0aW9uKDIpKVxuXSwgKGdyb3VwcykgPT4ge1xuXG4gIC8vIFZhbHVlcyBwdXQgb24gdGhlIGNoYW5uZWwgYXJlIGRvdWJsZWRcbiAgZ3JvdXBzLnB1dCgxKTtcbiAgZ3JvdXBzLnB1dCgyKTtcbiAgZ3JvdXBzLnB1dCgzKTtcbiAgZ3JvdXBzLnB1dCg0KTtcblxuICBQcm9taXNlLmFsbChbXG4gICAgZ3JvdXBzLnRha2UoKS50aGVuKChbXzEsIF8yXSkgPT4ge1xuICAgICAgYXNzZXJ0KF8xLCAxKTtcbiAgICAgIGFzc2VydChfMiwgMik7XG4gICAgfSksXG4gICAgZ3JvdXBzLnRha2UoKS50aGVuKChbXzMsIF80XSkgPT4ge1xuICAgICAgYXNzZXJ0KF8zLCAzKTtcbiAgICAgIGFzc2VydChfNCwgNCk7XG4gICAgfSlcbiAgXSkudGhlbigoKSA9PiBncm91cHMuY2xvc2UoKSk7XG5cbn0pKS50aGVuKGhvaXN0KGNoYW5uZWxUZXN0LCBbXG4gIG5ldyBDaGFubmVsKDEwLCBwYXJ0aXRpb25CeSh2ID0+IHtcbiAgICBsZXQgbm9ybWFsaXplZCA9IHYucmVwbGFjZSgvXFxXKy9nLCAnJykudG9Mb3dlckNhc2UoKTtcblxuICAgIHJldHVybiBub3JtYWxpemVkID09PSBub3JtYWxpemVkLnNwbGl0KCcnKS5yZXZlcnNlKCkuam9pbignJyk7XG4gIH0pKVxuXSwgKHZhbHMpID0+IHtcblxuICAvLyBWYWx1ZXMgcHV0IG9uIHRoZSBjaGFubmVsIGFyZSBkb3VibGVkXG4gIHZhbHMucHV0KFwidGFjb2NhdFwiKTtcbiAgdmFscy5wdXQoXCJyYWNlY2FyXCIpO1xuICB2YWxzLnB1dChcIm5vdCBhIHBhbGluZHJvbWVcIik7XG4gIHZhbHMucHV0KFwiYWxzbyBub3QgYSBwYWxpbmRyb21lXCIpO1xuICB2YWxzLnB1dChcIk1hZGFtIEknbSBBZGFtXCIpO1xuICB2YWxzLnB1dChcIkFoLCBzYXRhbiBzZWVzIG5hdGFzaGEhXCIpO1xuICB2YWxzLnB1dChcIm9uZSBsYXN0IHRyeS4uLlwiKTtcblxuICBQcm9taXNlLmFsbChbXG4gICAgdmFscy50YWtlKCkudGhlbigoW18xLCBfMl0pID0+IHtcbiAgICAgIGFzc2VydChfMSwgXCJ0YWNvY2F0XCIpO1xuICAgICAgYXNzZXJ0KF8yLCBcInJhY2VjYXJcIik7XG4gICAgfSksXG4gICAgdmFscy50YWtlKCkudGhlbigoW18xLCBfMl0pID0+IHtcbiAgICAgIGFzc2VydChfMSwgXCJub3QgYSBwYWxpbmRyb21lXCIpO1xuICAgICAgYXNzZXJ0KF8yLCBcImFsc28gbm90IGEgcGFsaW5kcm9tZVwiKTtcbiAgICB9KSxcbiAgICB2YWxzLnRha2UoKS50aGVuKChbXzEsIF8yXSkgPT4ge1xuICAgICAgYXNzZXJ0KF8xLCBcIk1hZGFtIEknbSBBZGFtXCIpO1xuICAgICAgYXNzZXJ0KF8yLCBcIkFoLCBzYXRhbiBzZWVzIG5hdGFzaGEhXCIpO1xuICAgIH0pXG4gIF0pLnRoZW4oKCkgPT4gdmFscy5jbG9zZSgpKTtcblxufSkpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coXCJUZXN0cyBjb21wbGV0ZS5cIikpO1xuIl19
