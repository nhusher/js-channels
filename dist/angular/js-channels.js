angular.module('channels', []);
angular.module("channels").service("asyncBuffers", function () {
  var ES6__EXPORTS = {};

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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

  ES6__EXPORTS.DroppingBuffer = DroppingBuffer;
  ES6__EXPORTS.SlidingBuffer = SlidingBuffer;
  ES6__EXPORTS.FixedBuffer = FixedBuffer;
  ES6__EXPORTS.RingBuffer = RingBuffer;
  return ES6__EXPORTS;
});
angular.module("channels").service("asyncChannels", function (asyncBuffers, asyncDispatch, asyncPromise) {
  var ES6__EXPORTS = {};

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var FixedBuffer = asyncBuffers.FixedBuffer;
  var RingBuffer = asyncBuffers.RingBuffer;
  var Dispatch = asyncDispatch.Dispatch;
  var Promise = asyncPromise.Promise;

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

  ES6__EXPORTS.Channel = Channel;
  ES6__EXPORTS.Transactor = Transactor;
  return ES6__EXPORTS;
});
angular.module("channels").service("asyncDispatch", function () {
  var ES6__EXPORTS = {};

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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

  ES6__EXPORTS.Dispatch = Dispatch;
  return ES6__EXPORTS;
});
angular.module("channels").service("asyncMult", function (asyncPromise) {
  var ES6__EXPORTS = {};

  var _toArray = function (arr) { return Array.isArray(arr) ? arr : Array.from(arr); };

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Promise = asyncPromise.Promise;

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

  ES6__EXPORTS.Mult = Mult;
  return ES6__EXPORTS;
});
angular.module("channels").service("asyncUtils", function (asyncChannels) {
  var ES6__EXPORTS = {};

  var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Channel = asyncChannels.Channel;
  var Transactor = asyncChannels.Transactor;

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

  // Enforces order resolution on resulting channel
  // This might need to be the default behavior, though that requires more thought

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

  ES6__EXPORTS.alts = alts;
  ES6__EXPORTS.timeout = timeout;
  ES6__EXPORTS.order = order;
  ES6__EXPORTS.map = map;
  ES6__EXPORTS.filter = filter;
  ES6__EXPORTS.partitionBy = partitionBy;
  ES6__EXPORTS.partition = partition;
  return ES6__EXPORTS;
});
angular.module("channels").service("asyncPromise", function ($q) {
  var ES6__EXPORTS = {};

  var Promise = function (r) {
    return $q(r);
  };

  Promise.all = $q.all;
  Promise.reject = $q.reject;

  Promise.race = function (proms) {
    var doFulfill, doReject, prom;

    prom = $q(function (fulfill, reject) {
      doFulfill = fulfill;
      doReject = reject;
    });

    proms.forEach(function (p) {
      return p.then(doFulfill, doReject);
    });

    return prom;
  };

  Promise.resolve = function (val) {
    return $q.when(val);
  };

  ES6__EXPORTS.Promise = Promise;
  return ES6__EXPORTS;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYnVmZmVycy5qcyIsImNoYW5uZWxzLmpzIiwiZGlzcGF0Y2guanMiLCJtdWx0LmpzIiwidXRpbHMuanMiLCJwcm9taXNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O0FDSUEsV0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUNyRCxTQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDakMsVUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO0tBQ3pDO0dBQ0Y7Ozs7TUFJSyxVQUFVO0FBQ0gsYUFEUCxVQUFVLENBQ0YsQ0FBQyxFQUFFOzRCQURYLFVBQVU7O0FBRVosVUFBSSxJQUFJLEdBQUcsQUFBQyxPQUFPLENBQUMsS0FBSyxRQUFRLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hELFVBQUksQ0FBQyxLQUFLLEdBQUssQ0FBQyxDQUFDO0FBQ2pCLFVBQUksQ0FBQyxLQUFLLEdBQUssQ0FBQyxDQUFDO0FBQ2pCLFVBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLFVBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDaEM7O2lCQVBHLFVBQVU7QUFTZCxTQUFHO2VBQUEsZUFBRztBQUNKLGNBQUksTUFBTSxZQUFBLENBQUM7QUFDWCxjQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7O0FBRWQsa0JBQU0sR0FBRyxBQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksR0FBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElB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QixjQUFRLEdBQUcsTUFBTSxDQUFDO0tBQ25CLENBQUMsQ0FBQzs7QUFFSCxTQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQzthQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQztLQUFBLENBQUMsQ0FBQzs7QUFFaEQsV0FBTyxJQUFJLENBQUM7R0FDYixDQUFDOztBQUVGLFNBQU8sQ0FBQyxPQUFPLEdBQUcsVUFBQSxHQUFHLEVBQUk7QUFDdkIsV0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQ3JCLENBQUMiLCJmaWxlIjoianMtY2hhbm5lbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgnY2hhbm5lbHMnLCBbXSk7IiwiXG4vL1xuLy8gVE9ETzogdGhpcyBpc24ndCBpZGlvbWF0aWNhbGx5IGphdmFzY3JpcHQgKGNvdWxkIHByb2JhYmx5IHVzZSBzbGljZS9zcGxpY2UgdG8gZ29vZCBlZmZlY3QpXG4vL1xuZnVuY3Rpb24gYWNvcHkoc3JjLCBzcmNTdGFydCwgZGVzdCwgZGVzdFN0YXJ0LCBsZW5ndGgpIHtcbiAgZm9yKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgZGVzdFtpICsgZGVzdFN0YXJ0XSA9IHNyY1tpICsgc3JjU3RhcnRdO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFJpbmdCdWZmZXIge1xuICBjb25zdHJ1Y3RvcihzKSB7XG4gICAgbGV0IHNpemUgPSAodHlwZW9mIHMgPT09ICdudW1iZXInKSA/IE1hdGgubWF4KDEsIHMpIDogMTtcbiAgICB0aGlzLl90YWlsICAgPSAwO1xuICAgIHRoaXMuX2hlYWQgICA9IDA7XG4gICAgdGhpcy5fbGVuZ3RoID0gMDtcbiAgICB0aGlzLl92YWx1ZXMgPSBuZXcgQXJyYXkoc2l6ZSk7XG4gIH1cblxuICBwb3AoKSB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZih0aGlzLmxlbmd0aCkge1xuICAgICAgLy8gR2V0IHRoZSBpdGVtIG91dCBvZiB0aGUgc2V0IG9mIHZhbHVlc1xuICAgICAgcmVzdWx0ID0gKHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSAhPT0gbnVsbCkgPyB0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gOiBudWxsO1xuXG4gICAgICAvLyBSZW1vdmUgdGhlIGl0ZW0gZnJvbSB0aGUgc2V0IG9mIHZhbHVlcywgdXBkYXRlIGluZGljaWVzXG4gICAgICB0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gPSBudWxsO1xuICAgICAgdGhpcy5fdGFpbCA9ICh0aGlzLl90YWlsICsgMSkgJSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuICAgICAgdGhpcy5fbGVuZ3RoIC09IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICB1bnNoaWZ0KHZhbCkge1xuICAgIHRoaXMuX3ZhbHVlc1t0aGlzLl9oZWFkXSA9IHZhbDtcbiAgICB0aGlzLl9oZWFkID0gKHRoaXMuX2hlYWQgKyAxKSAlIHRoaXMuX3ZhbHVlcy5sZW5ndGg7XG4gICAgdGhpcy5fbGVuZ3RoICs9IDE7XG4gIH1cblxuICByZXNpemluZ1Vuc2hpZnQodmFsKSB7XG4gICAgaWYodGhpcy5sZW5ndGggKyAxID09PSB0aGlzLl92YWx1ZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgIH1cbiAgICB0aGlzLnVuc2hpZnQodmFsKTtcbiAgfVxuXG4gIHJlc2l6ZSgpIHtcbiAgICBsZXQgbmV3QXJyeSA9IG5ldyBBcnJheSh0aGlzLl92YWx1ZXMubGVuZ3RoICogMik7XG5cbiAgICBpZih0aGlzLl90YWlsIDwgdGhpcy5faGVhZCkge1xuICAgICAgYWNvcHkodGhpcy5fdmFsdWVzLCB0aGlzLl90YWlsLCBuZXdBcnJ5LCAwLCB0aGlzLl9oZWFkKTtcblxuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gdGhpcy5sZW5ndGg7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuXG4gICAgfSBlbHNlIGlmKHRoaXMuX2hlYWQgPCB0aGlzLl90YWlsKSB7XG4gICAgICBhY29weSh0aGlzLl92YWx1ZXMsIDAsIG5ld0FycnksIHRoaXMuX3ZhbHVlcy5sZW5ndGggLSB0aGlzLl90YWlsLCB0aGlzLl9oZWFkKTtcblxuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gdGhpcy5sZW5ndGg7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IDA7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuICAgIH1cbiAgfVxuXG4gIGNsZWFudXAoa2VlcCkge1xuICAgIGZvcihsZXQgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgbGV0IGl0ZW0gPSB0aGlzLnBvcCgpO1xuXG4gICAgICBpZihrZWVwKGl0ZW0pKSB7XG4gICAgICAgIHVuc2hpZnQoaXRlbSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIEZpeGVkQnVmZmVyIHtcbiAgY29uc3RydWN0b3Iobikge1xuICAgIHRoaXMuX2J1ZiA9IG5ldyBSaW5nQnVmZmVyKG4pO1xuICAgIHRoaXMuX3NpemUgPSBuO1xuICB9XG5cbiAgcmVtb3ZlKCkge1xuICAgIHJldHVybiB0aGlzLl9idWYucG9wKCk7XG4gIH1cblxuICBhZGQodikge1xuICAgIHRoaXMuX2J1Zi5yZXNpemluZ1Vuc2hpZnQodik7XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9idWYubGVuZ3RoO1xuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5sZW5ndGggPT09IHRoaXMuX3NpemU7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgRHJvcHBpbmdCdWZmZXIgZXh0ZW5kcyBGaXhlZEJ1ZmZlciB7XG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5fYnVmLmxlbmd0aCA8IHRoaXMuX3NpemUpIHtcbiAgICAgIHRoaXMuX2J1Zi51bnNoaWZ0KHYpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBmdWxsKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBTbGlkaW5nQnVmZmVyIGV4dGVuZHMgRml4ZWRCdWZmZXIge1xuICBhZGQodikge1xuICAgIGlmKHRoaXMuX2J1Zi5sZW5ndGggPT09IHRoaXMuX3NpemUpIHtcbiAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgfVxuICAgIHRoaXMuX2J1Zi51bnNoaWZ0KHYpO1xuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCB7IERyb3BwaW5nQnVmZmVyLCBTbGlkaW5nQnVmZmVyLCBGaXhlZEJ1ZmZlciwgUmluZ0J1ZmZlciB9OyIsIlxuaW1wb3J0IHsgRml4ZWRCdWZmZXIsIFJpbmdCdWZmZXIgfSBmcm9tIFwiLi9idWZmZXJzLmpzXCI7XG5pbXBvcnQgeyBEaXNwYXRjaCB9IGZyb20gXCIuL2Rpc3BhdGNoLmpzXCI7XG5pbXBvcnQgeyBQcm9taXNlIH0gZnJvbSBcIi4vcHJvbWlzZS5qc1wiO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBUcmFuc2FjdG9yIHtcbiAgY29uc3RydWN0b3Iob2ZmZXIpIHtcbiAgICB0aGlzLm9mZmVyZWQgPSBvZmZlcjtcbiAgICB0aGlzLnJlY2VpdmVkID0gbnVsbDtcbiAgICB0aGlzLnJlc29sdmVkID0gZmFsc2U7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG4gIH1cblxuICBjb21taXQoKSB7XG4gICAgcmV0dXJuICh2YWwpID0+IHtcbiAgICAgIGlmKHRoaXMucmVzb2x2ZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHJpZWQgdG8gcmVzb2x2ZSB0cmFuc2FjdG9yIHR3aWNlIVwiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVjZWl2ZWQgPSB2YWw7XG4gICAgICB0aGlzLnJlc29sdmVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLmZvckVhY2goYyA9PiBjKHZhbCkpO1xuXG4gICAgICByZXR1cm4gdGhpcy5vZmZlcmVkO1xuICAgIH1cbiAgfVxuXG4gIGRlcmVmKGNhbGxiYWNrKSB7XG4gICAgaWYodGhpcy5yZXNvbHZlZCkge1xuICAgICAgY2FsbGJhY2sodGhpcy5yZWNlaXZlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgfVxufVxuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmxldCBkaXNwYXRjaCA9IG5ldyBEaXNwYXRjaCgpO1xuXG5sZXQgYXR0ZW1wdCA9IGZ1bmN0aW9uKGZuLCBleGgpIHsgdHJ5IHsgcmV0dXJuIGZuKCkgfSBjYXRjaChlKSB7IHJldHVybiBleGgoZSk7IH0gfVxubGV0IHBhc3N0aHJvdWdoID0gZnVuY3Rpb24obmV4dCkge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IG5leHQodmFsdWUpIDogbmV4dCgpO1xuICB9XG59O1xubGV0IGRlZmF1bHRFeEhhbmRsZXIgPSBmdW5jdGlvbihlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IHJldHVybiBmYWxzZTsgfVxubGV0IHJlZHVjZWQgPSB7IHJlZHVjZWQ6IHRydWUgfTtcblxuY2xhc3MgQ2hhbm5lbCB7XG4gIGNvbnN0cnVjdG9yKHNpemVPckJ1ZiwgeGZvcm0sIGV4Y2VwdGlvbkhhbmRsZXIpIHtcbiAgICBsZXQgZG9BZGQgPSB2YWwgPT4ge1xuICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyB0aGlzLl9idWZmZXIuYWRkKHZhbCkgOiB0aGlzLl9idWZmZXI7XG4gICAgfVxuXG4gICAgdGhpcy5fYnVmZmVyICAgID0gKHNpemVPckJ1ZiBpbnN0YW5jZW9mIEZpeGVkQnVmZmVyKSA/IHNpemVPckJ1ZiA6IG5ldyBGaXhlZEJ1ZmZlcihzaXplT3JCdWYgfHwgMCk7XG4gICAgdGhpcy5fdGFrZXJzICAgID0gbmV3IFJpbmdCdWZmZXIoMzIpO1xuICAgIHRoaXMuX3B1dHRlcnMgICA9IG5ldyBSaW5nQnVmZmVyKDMyKTtcbiAgICB0aGlzLl94Zm9ybWVyICAgPSB4Zm9ybSA/IHhmb3JtKGRvQWRkKSA6IHBhc3N0aHJvdWdoKGRvQWRkKTtcbiAgICB0aGlzLl9leEhhbmRsZXIgPSBleGNlcHRpb25IYW5kbGVyIHx8IGRlZmF1bHRFeEhhbmRsZXI7XG5cbiAgICB0aGlzLl9pc09wZW4gPSB0cnVlO1xuICB9XG5cbiAgX2luc2VydCgpIHtcbiAgICByZXR1cm4gYXR0ZW1wdCgoKSA9PiB0aGlzLl94Zm9ybWVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHRoaXMuX2V4SGFuZGxlcik7XG4gIH1cblxuICBhYm9ydCgpIHtcbiAgICB3aGlsZSh0aGlzLl9wdXR0ZXJzLmxlbmd0aCkge1xuICAgICAgbGV0IHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG5cbiAgICAgIGlmKHB1dHRlci5hY3RpdmUpIHtcbiAgICAgICAgbGV0IHB1dHRlckNiID0gcHV0dGVyLmNvbW1pdCgpO1xuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gcHV0dGVyQ2IodHJ1ZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9wdXR0ZXJzLmNsZWFudXAoKCkgPT4gZmFsc2UpO1xuICB9XG5cbiAgZmlsbCh2YWwsIHR4ID0gbmV3IFRyYW5zYWN0b3IodmFsKSkge1xuICAgIGlmKHZhbCA9PT0gbnVsbCkgeyB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcHV0IG51bGwgdG8gYSBjaGFubmVsLlwiKTsgfVxuICAgIGlmKCEodHggaW5zdGFuY2VvZiBUcmFuc2FjdG9yKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgVHJhbnNhY3RvciB0byBiZSBwYXNzZWQgdG8gZmlsbFwiKTsgfVxuICAgIGlmKCF0eC5hY3RpdmUpIHsgcmV0dXJuIHR4OyB9XG5cbiAgICBpZighdGhpcy5vcGVuKSB7XG4gICAgICAvLyBFaXRoZXIgc29tZWJvZHkgaGFzIHJlc29sdmVkIHRoZSBoYW5kbGVyIGFscmVhZHkgKHRoYXQgd2FzIGZhc3QpIG9yIHRoZSBjaGFubmVsIGlzIGNsb3NlZC5cbiAgICAgIC8vIGNvcmUuYXN5bmMgcmV0dXJucyBhIGJvb2xlYW4gb2Ygd2hldGhlciBvciBub3Qgc29tZXRoaW5nICpjb3VsZCogZ2V0IHB1dCB0byB0aGUgY2hhbm5lbFxuICAgICAgLy8gd2UnbGwgZG8gdGhlIHNhbWUgI2NhcmdvY3VsdFxuICAgICAgdHguY29tbWl0KCkoZmFsc2UpO1xuICAgIH1cblxuICAgIGlmKCF0aGlzLl9idWZmZXIuZnVsbCkge1xuICAgICAgLy8gVGhlIGNoYW5uZWwgaGFzIHNvbWUgZnJlZSBzcGFjZS4gU3RpY2sgaXQgaW4gdGhlIGJ1ZmZlciBhbmQgdGhlbiBkcmFpbiBhbnkgd2FpdGluZyB0YWtlcy5cbiAgICAgIHR4LmNvbW1pdCgpKHRydWUpO1xuICAgICAgbGV0IGRvbmUgPSBhdHRlbXB0KCgpID0+IHRoaXMuX2luc2VydCh2YWwpID09PSByZWR1Y2VkLCB0aGlzLl9leEhhbmRsZXIpO1xuXG4gICAgICB3aGlsZSh0aGlzLl90YWtlcnMubGVuZ3RoICYmIHRoaXMuX2J1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHRha2VyVHggPSB0aGlzLl90YWtlcnMucG9wKCk7XG5cbiAgICAgICAgaWYodGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgICBsZXQgdmFsID0gdGhpcy5fYnVmZmVyLnJlbW92ZSgpO1xuICAgICAgICAgIGxldCB0YWtlckNiID0gdGFrZXJUeC5jb21taXQoKTtcblxuICAgICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0YWtlckNiKHZhbCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKGRvbmUpIHsgdGhpcy5hYm9ydCgpOyB9XG5cbiAgICAgIHJldHVybiB0eDtcbiAgICB9IGVsc2UgaWYodGhpcy5fdGFrZXJzLmxlbmd0aCkge1xuICAgICAgLy8gVGhlIGJ1ZmZlciBpcyBmdWxsIGJ1dCB0aGVyZSBhcmUgd2FpdGluZyB0YWtlcnMgKGUuZy4gdGhlIGJ1ZmZlciBpcyBzaXplIHplcm8pXG5cbiAgICAgIGxldCB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICB3aGlsZSh0aGlzLl90YWtlcnMubGVuZ3RoICYmICF0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZih0YWtlclR4ICYmIHRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgIHR4LmNvbW1pdCgpKHRydWUpO1xuICAgICAgICBsZXQgdGFrZXJDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VyQ2IodmFsKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wdXR0ZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3B1dHRlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHg7XG4gIH1cblxuICBwdXQodmFsLCB0cmFuc2FjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5maWxsKHZhbCwgdHJhbnNhY3RvcikuZGVyZWYocmVzb2x2ZSk7XG4gICAgfSk7XG4gIH1cblxuICBkcmFpbih0eCA9IG5ldyBUcmFuc2FjdG9yKCkpIHtcbiAgICBpZighKHR4IGluc3RhbmNlb2YgVHJhbnNhY3RvcikpIHsgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0aW5nIFRyYW5zYWN0b3IgdG8gYmUgcGFzc2VkIHRvIGRyYWluXCIpOyB9XG4gICAgaWYoIXR4LmFjdGl2ZSkgeyByZXR1cm4gdHg7IH1cblxuICAgIGlmKHRoaXMuX2J1ZmZlci5sZW5ndGgpIHtcbiAgICAgIGxldCBidWZWYWwgPSB0aGlzLl9idWZmZXIucmVtb3ZlKCk7XG5cbiAgICAgIHdoaWxlKCF0aGlzLl9idWZmZXIuZnVsbCAmJiB0aGlzLl9wdXR0ZXJzLmxlbmd0aCkge1xuICAgICAgICBsZXQgcHV0dGVyID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcblxuICAgICAgICBpZihwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHB1dFR4ID0gcHV0dGVyLmNvbW1pdCgpLFxuICAgICAgICAgICAgICB2YWwgPSBwdXR0ZXIub2ZmZXJlZDsgLy8gS2luZGEgYnJlYWtpbmcgdGhlIHJ1bGVzIGhlcmVcblxuICAgICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiBwdXRUeCgpKTtcbiAgICAgICAgICBsZXQgZG9uZSA9IGF0dGVtcHQoKCkgPT4gdGhpcy5faW5zZXJ0KHZhbCkgPT09IHJlZHVjZWQsIHRoaXMuX2V4SGFuZGxlcik7XG5cbiAgICAgICAgICBpZihkb25lID09PSByZWR1Y2VkKSB7IHRoaXMuYWJvcnQoKTsgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHR4LmNvbW1pdCgpKGJ1ZlZhbCk7XG4gICAgfSBlbHNlIGlmKHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICBsZXQgcHV0dGVyID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fcHV0dGVycy5sZW5ndGggJiYgIXB1dHRlci5hY3RpdmUpIHtcbiAgICAgICAgcHV0dGVyID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYocHV0dGVyICYmIHB1dHRlci5hY3RpdmUpIHtcbiAgICAgICAgbGV0IHR4Q2IgPSB0eC5jb21taXQoKSxcbiAgICAgICAgICAgIHB1dFR4ID0gcHV0dGVyLmNvbW1pdCgpLFxuICAgICAgICAgICAgdmFsID0gcHV0dGVyLm9mZmVyZWQ7XG5cbiAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHB1dFR4KCkpO1xuICAgICAgICB0eENiKHZhbCk7XG4gICAgICB9IGVsc2UgaWYoIXRoaXMub3Blbikge1xuICAgICAgICBhdHRlbXB0KCgpID0+IHRoaXMuX2luc2VydCgpLCB0aGlzLl9leEhhbmRsZXIpO1xuXG4gICAgICAgIGlmKHRoaXMuX2J1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICB0eENiKHRoaXMuX2J1ZmZlci5yZW1vdmUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHhDYihudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fdGFrZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Rha2Vycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgIH1cblxuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHRha2UodHJhbnNhY3Rvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMuZHJhaW4odHJhbnNhY3RvcikuZGVyZWYocmVzb2x2ZSk7XG4gICAgfSk7XG4gIH1cblxuICB0aGVuKGZuLCBlcnIpIHtcbiAgICByZXR1cm4gdGhpcy50YWtlKCkudGhlbihmbiwgZXJyKTtcbiAgfVxuXG4gIGNsb3NlKCkge1xuICAgIGlmKHRoaXMub3Blbikge1xuICAgICAgdGhpcy5faXNPcGVuID0gZmFsc2U7XG5cbiAgICAgIGlmKHRoaXMuX3B1dHRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGF0dGVtcHQoKCkgPT4gdGhpcy5faW5zZXJ0KCksIHRoaXMuX2V4SGFuZGxlcik7XG4gICAgICB9XG5cbiAgICAgIHdoaWxlICh0aGlzLl90YWtlcnMubGVuZ3RoKSB7XG4gICAgICAgIGxldCB0YWtlciA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgICBpZih0YWtlci5hY3RpdmUpIHtcbiAgICAgICAgICBsZXQgdmFsID0gdGhpcy5fYnVmZmVyLmxlbmd0aCA/IHRoaXMuX2J1ZmZlci5yZW1vdmUoKSA6IG51bGwsXG4gICAgICAgICAgICAgIHRha2VyQ2IgPSB0YWtlci5jb21taXQoKTtcblxuICAgICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0YWtlckNiKHZhbCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW50byhvdGhlckNoYW4sIHNob3VsZENsb3NlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gaW50byh2YWwpIHtcbiAgICAgIGlmKHZhbCA9PT0gbmlsICYmIHNob3VsZENsb3NlKSB7XG4gICAgICAgIG91dC5jbG9zZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0LnB1dCh2YWwpLnRoZW4ob3BlbiA9PiB7XG4gICAgICAgICAgaWYoIW9wZW4gJiYgc2hvdWxkQ2xvc2UpIHtcbiAgICAgICAgICAgIHNlbGYuY2xvc2UoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi50YWtlKCkudGhlbihtYXBwZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy50YWtlKCkudGhlbihpbnRvKTtcblxuICAgIHJldHVybiBvdGhlckNoYW47XG4gIH1cblxuICBnZXQgb3BlbigpIHtcbiAgICByZXR1cm4gdGhpcy5faXNPcGVuO1xuICB9XG59XG5cbkNoYW5uZWwucmVkdWNlZCA9IHJlZHVjZWQ7XG5cbmV4cG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfTsiLCJsZXQgZGVmYXVsdEFzeW5jaHJvbml6ZXIgPSAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJykgPyBmdW5jdGlvbihmbikge1xuICByZXR1cm4gc2V0SW1tZWRpYXRlKGZuKTtcbn0gOiBmdW5jdGlvbihmbikge1xuICByZXR1cm4gc2V0VGltZW91dChmbik7XG59O1xuXG5jbGFzcyBEaXNwYXRjaCB7XG4gIGNvbnN0cnVjdG9yKGFzeW5jaHJvbml6ZXIpIHtcbiAgICB0aGlzLl9hc3luY2hyb25pemVyID0gYXN5bmNocm9uaXplciB8fCBkZWZhdWx0QXN5bmNocm9uaXplcjtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICB9XG5cbiAgcnVuKGZuKSB7XG4gICAgdGhpcy5fcXVldWUucHVzaChmbik7XG5cbiAgICB0aGlzLl9hc3luY2hyb25pemVyKCgpID0+IHtcbiAgICAgIHdoaWxlKHRoaXMuX3F1ZXVlLmxlbmd0aCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiUVVFVUVcIiwgdGhpcy5fcXVldWVbMF0pO1xuICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuXG5leHBvcnQgeyBEaXNwYXRjaCB9OyIsImltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5cbmZ1bmN0aW9uIGRpc3RyaWJ1dGUodGFwcywgdmFsKSB7XG4gIGlmKCF0YXBzLmxlbmd0aCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgWyB0YXAsIC4uLnJlc3QgXSA9IHRhcHM7XG5cbiAgICByZXR1cm4gdGFwLnB1dCh2YWwpLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGRpc3RyaWJ1dGUocmVzdCwgdmFsKTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBNdWx0IHtcblxuICBjb25zdHJ1Y3RvcihjaCkge1xuICAgIHRoaXMuX3RhcHMgPSBbXTtcbiAgICB0aGlzLl9mcmVlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICBjaC50YWtlKCkudGhlbihmdW5jdGlvbiBkcmFpbkxvb3Aodikge1xuICAgICAgaWYodiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBjbGVhbnVwXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gTG9ja3MgdGhlIGxpc3Qgb2YgdGFwcyB1bnRpbCB0aGUgZGlzdHJpYnV0aW9uIGlzIGNvbXBsZXRlXG4gICAgICBsZXQgZG9GcmVlLCBmcmVlID0gbmV3IFByb21pc2UociA9PiBkb0ZyZWUgPSByKTtcblxuICAgICAgdGhpcy5fZnJlZSA9IGZyZWU7XG5cbiAgICAgIGRpc3RyaWJ1dGUodGFwcywgdikudGhlbigoKSA9PiB7XG4gICAgICAgIGRvRnJlZSgpO1xuICAgICAgICBjaC50YWtlKCkudGhlbihkcmFpbkxvb3ApO1xuICAgICAgfSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHRhcChjaCwgY2xvc2UpIHtcbiAgICBpZih0aGlzLl90YXBzLnNvbWUodCA9PiB0LmNoID09PSBjaCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGFkZCB0aGUgc2FtZSBjaGFubmVsIHRvIGEgbXVsdCB0d2ljZVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZnJlZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RhcHMucHVzaCh7IGNsb3NlOiBjbG9zZSwgY2g6IGNoIH0pO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0pO1xuICB9XG5cbiAgdW50YXAoY2gpIHtcbiAgICByZXR1cm4gdGhpcy5fZnJlZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RhcHMgPSB0aGlzLl90YXBzLmZpbHRlcih0YXAgPT4ge1xuICAgICAgICByZXR1cm4gdGFwLmNoICE9PSBjaDtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0pO1xuICB9XG5cbn1cblxuZXhwb3J0IHsgTXVsdCB9OyIsImltcG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfSBmcm9tIFwiLi9jaGFubmVscy5qc1wiO1xuXG5cbmNsYXNzIEFsdHNUcmFuc2FjdG9yIGV4dGVuZHMgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyLCBjb21taXRDYikge1xuICAgIHN1cGVyKG9mZmVyKTtcbiAgICB0aGlzLmNvbW1pdENiID0gY29tbWl0Q2I7XG4gIH1cbiAgY29tbWl0KCkge1xuICAgIHRoaXMuY29tbWl0Q2IoKTtcbiAgICByZXR1cm4gc3VwZXIuY29tbWl0KCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWx0cyhyYWNlKSB7XG4gIGxldCB0cmFuc2FjdG9ycyA9IFtdO1xuICBsZXQgb3V0Q2ggPSBuZXcgQ2hhbm5lbCgpO1xuXG4gIGxldCBkZWFjdGl2YXRlID0gKCkgPT4geyB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSkgfVxuXG4gIHJhY2UubWFwKGNtZCA9PiB7XG5cbiAgICBpZihBcnJheS5pc0FycmF5KGNtZCkpIHtcbiAgICAgIGxldCB0eCA9IG5ldyBBbHRzVHJhbnNhY3Rvcih2YWwsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBsZXQgWyBjaCwgdmFsIF0gPSBjbWQ7XG4gICAgICBjaC5wdXQodmFsLCB0eCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgb3V0Q2gucHV0KFsgdmFsLCBjaCBdKTtcbiAgICAgIH0pO1xuXG4gICAgICB0cmFuc2FjdG9ycy5wdXNoKHR4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHR4ID0gbmV3IEFsdHNUcmFuc2FjdG9yKHRydWUsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG5cbiAgICAgIGNtZC50YWtlKHR4KS50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBvdXRDaC5wdXQoWyB2YWwsIGNtZCBdKTtcbiAgICAgIH0pO1xuXG4gICAgICB0cmFuc2FjdG9ycy5wdXNoKHR4KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvdXRDaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVvdXQobXMpIHtcbiAgdmFyIGNoID0gbmV3IENoYW5uZWwoKTtcbiAgc2V0VGltZW91dCgoKSA9PiB7IGNoLmNsb3NlKCk7IH0sIG1zKTtcbiAgcmV0dXJuIGNoO1xufVxuXG4vLyBFbmZvcmNlcyBvcmRlciByZXNvbHV0aW9uIG9uIHJlc3VsdGluZyBjaGFubmVsXG4vLyBUaGlzIG1pZ2h0IG5lZWQgdG8gYmUgdGhlIGRlZmF1bHQgYmVoYXZpb3IsIHRob3VnaCB0aGF0IHJlcXVpcmVzIG1vcmUgdGhvdWdodFxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyKGluY2gsIHNpemVPckJ1Zikge1xuICB2YXIgb3V0Y2ggPSBuZXcgQ2hhbm5lbChzaXplT3JCdWYpO1xuXG4gIGZ1bmN0aW9uIGRyYWluKCkge1xuICAgIGluY2gudGFrZSgpLnRoZW4odmFsID0+IHtcbiAgICAgIGlmKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICBvdXRjaC5jbG9zZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0Y2gucHV0KHZhbCkudGhlbihkcmFpbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZHJhaW4oKTtcblxuICByZXR1cm4gb3V0Y2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5leHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odmFsKSB7XG4gICAgICBpZihhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXh0KGZuKHZhbCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlcihmbikge1xuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGZuKHZhbCkpIHtcbiAgICAgICAgICByZXR1cm4gbmV4dCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFydGl0aW9uQnkoZm4pIHtcbiAgbGV0IGxhc3QgPSBudWxsLFxuICAgICAgYWNjdW11bGF0b3IgPSBbXTtcblxuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHByZWRpY2F0ZVJlc3VsdCA9IGZuKHZhbCk7XG4gICAgICAgIGlmKGxhc3QgIT09IG51bGwgJiYgcHJlZGljYXRlUmVzdWx0ICE9PSBsYXN0KSB7XG4gICAgICAgICAgbGV0IHRtcCA9IGFjY3VtdWxhdG9yO1xuXG4gICAgICAgICAgYWNjdW11bGF0b3IgPSBbIHZhbCBdO1xuICAgICAgICAgIGxhc3QgPSBwcmVkaWNhdGVSZXN1bHQ7XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCh0bXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxhc3QgPSBwcmVkaWNhdGVSZXN1bHQ7XG4gICAgICAgICAgYWNjdW11bGF0b3IucHVzaCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dChhY2N1bXVsYXRvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aXRpb24obnVtKSB7XG4gIGxldCBjID0gMCxcbiAgICAgIGEgPSBbXTtcblxuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgYS5wdXNoKHZhbCk7XG4gICAgICAgIGMgKz0gMTtcblxuICAgICAgICBpZihjICUgbnVtID09PSAwKSB7XG4gICAgICAgICAgbGV0IHRtcCA9IGE7XG5cbiAgICAgICAgICBhID0gW107XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCh0bXApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dChhKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0iLCJcbmltcG9ydCAqIGFzICRxIGZyb20gXCIkcVwiO1xuXG52YXIgUHJvbWlzZSA9IHIgPT4ge1xuICByZXR1cm4gJHEocik7XG59O1xuXG5Qcm9taXNlLmFsbCA9ICRxLmFsbDtcblByb21pc2UucmVqZWN0ID0gJHEucmVqZWN0O1xuXG5Qcm9taXNlLnJhY2UgPSBwcm9tcyA9PiB7XG4gIHZhciBkb0Z1bGZpbGwsIGRvUmVqZWN0LCBwcm9tO1xuXG4gIHByb20gPSAkcSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG4gICAgZG9GdWxmaWxsID0gZnVsZmlsbDtcbiAgICBkb1JlamVjdCA9IHJlamVjdDtcbiAgfSk7XG5cbiAgcHJvbXMuZm9yRWFjaChwID0+IHAudGhlbihkb0Z1bGZpbGwsIGRvUmVqZWN0KSk7XG5cbiAgcmV0dXJuIHByb207XG59O1xuXG5Qcm9taXNlLnJlc29sdmUgPSB2YWwgPT4ge1xuICByZXR1cm4gJHEud2hlbih2YWwpO1xufTtcblxuZXhwb3J0IHsgUHJvbWlzZSB9OyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==