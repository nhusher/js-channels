angular.module('channels', []);
angular.module("channels").service("chanBuffers", function () {
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

  ES6__EXPORTS.DroppingBuffer = DroppingBuffer;
  ES6__EXPORTS.SlidingBuffer = SlidingBuffer;
  ES6__EXPORTS.FixedBuffer = FixedBuffer;
  ES6__EXPORTS.RingBuffer = RingBuffer;
  return ES6__EXPORTS;
});
angular.module("channels").service("chanChannels", function (chanBuffers, chanDispatch, chanPromise) {
  var ES6__EXPORTS = {};

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var FixedBuffer = chanBuffers.FixedBuffer;
  var RingBuffer = chanBuffers.RingBuffer;
  var Dispatch = chanDispatch.Dispatch;
  var Promise = chanPromise.Promise;

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
angular.module("channels").service("chanDispatch", function () {
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
angular.module("channels").service("chanUtils", function (chanChannels) {
  var ES6__EXPORTS = {};

  var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Channel = chanChannels.Channel;
  var Transactor = chanChannels.Transactor;

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
angular.module("channels").service("chanPromise", function ($q) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYnVmZmVycy5qcyIsImNoYW5uZWxzLmpzIiwiZGlzcGF0Y2guanMiLCJ1dGlscy5qcyIsInByb21pc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7QUNJQSxXQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO0FBQ3JELFNBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNqQyxVQUFJLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7S0FDekM7R0FDRjs7OztNQUlLLFVBQVU7QUFDSCxhQURQLFVBQVUsQ0FDRixDQUFDLEVBQUU7NEJBRFgsVUFBVTs7QUFFWixVQUFJLElBQUksR0FBRyxBQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsR0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEQsVUFBSSxDQUFDLEtBQUssR0FBSyxDQUFDLENBQUM7QUFDakIsVUFBSSxDQUFDLEtBQUssR0FBSyxDQUFDLENBQUM7QUFDakIsVUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7QUFDakIsVUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNoQzs7aUJBUEcsVUFBVTtBQVNkLFNBQUc7ZUFBQSxlQUFHO0FBQ0osY0FBSSxNQUFNLFlBQUEsQ0FBQztBQUNYLGNBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRTs7QUFFZCxrQkFBTSxHQUFHLEFBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxHQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQzs7O0FBRy9FLGdCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDaEMsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQSxHQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ3BELGdCQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQztXQUNuQixNQUFNO0FBQ0wsa0JBQU0sR0FBRyxJQUFJLENBQUM7V0FDZjtBQUNELGlCQUFPLE1BQU0sQ0FBQztTQUNmOztBQUVELGFBQU87ZUFBQSxpQkFBQyxHQUFHLEVBQUU7QUFDWCxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDL0IsY0FBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFBLEdBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDcEQsY0FBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7U0FDbkI7O0FBRUQscUJBQWU7ZUFBQSx5QkFBQyxHQUFHLEVBQUU7QUFDbkIsY0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUMxQyxnQkFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1dBQ2Y7QUFDRCxjQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ25COztBQUVELFlBQU07ZUFBQSxrQkFBRztBQUNQLGNBQUksT0FBTyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDOztBQUVqRCxjQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUMxQixpQkFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFeEQsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUN6QixnQkFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7V0FFeEIsTUFBTSxJQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNqQyxpQkFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFOUUsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUN6QixnQkFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7V0FFeEIsTUFBTTtBQUNMLGdCQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLGdCQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLGdCQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztXQUN4QjtTQUNGOztBQUVELGFBQU87ZUFBQSxpQkFBQyxJQUFJLEVBQUU7QUFDWixlQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDN0MsZ0JBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFdEIsZ0JBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2IscUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNmO1dBQ0Y7U0FDRjs7QUFFRyxZQUFNO2FBQUEsWUFBRztBQUNYLGlCQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDckI7Ozs7V0ExRUcsVUFBVTs7Ozs7TUErRVYsV0FBVztBQUNKLGFBRFAsV0FBVyxDQUNILENBQUMsRUFBRTs0QkFEWCxXQUFXOztBQUViLFVBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsVUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7S0FDaEI7O2lCQUpHLFdBQVc7QUFNZixZQUFNO2VBQUEsa0JBQUc7QUFDUCxpQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ3hCOztBQUVELFNBQUc7ZUFBQSxhQUFDLENBQUMsRUFBRTtBQUNMLGNBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtBQUNaLGtCQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7V0FDakQ7QUFDRCxjQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM5Qjs7QUFFRyxZQUFNO2FBQUEsWUFBRztBQUNYLGlCQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1NBQ3pCOztBQUVHLFVBQUk7YUFBQSxZQUFHO0FBQ1QsaUJBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQztTQUN4Qzs7OztXQXZCRyxXQUFXOzs7OztNQTRCWCxjQUFjO2FBQWQsY0FBYzs0QkFBZCxjQUFjOzs7Ozs7O2NBQWQsY0FBYzs7aUJBQWQsY0FBYztBQUNsQixTQUFHO2VBQUEsYUFBQyxDQUFDLEVBQUU7QUFDTCxjQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDaEMsZ0JBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1dBQ3RCO1NBQ0Y7O0FBRUcsVUFBSTthQUFBLFlBQUc7QUFDVCxpQkFBTyxLQUFLLENBQUM7U0FDZDs7OztXQVRHLGNBQWM7S0FBUyxXQUFXOzs7O01BY2xDLGFBQWE7YUFBYixhQUFhOzRCQUFiLGFBQWE7Ozs7Ozs7Y0FBYixhQUFhOztpQkFBYixhQUFhO0FBQ2pCLFNBQUc7ZUFBQSxhQUFDLENBQUMsRUFBRTtBQUNMLGNBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNsQyxnQkFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1dBQ2Y7QUFDRCxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN0Qjs7QUFFRyxVQUFJO2FBQUEsWUFBRztBQUNULGlCQUFPLEtBQUssQ0FBQztTQUNkOzs7O1dBVkcsYUFBYTtLQUFTLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUM5SGpDLFVBQVU7QUFDSCxhQURQLFVBQVUsQ0FDRixLQUFLLEVBQUU7NEJBRGYsVUFBVTs7QUFFWixVQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNyQixVQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUNyQixVQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUN0QixVQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixVQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztLQUNyQjs7aUJBUEcsVUFBVTtBQVNkLFlBQU07ZUFBQSxrQkFBRzs7O0FBQ1AsaUJBQU8sVUFBQyxHQUFHLEVBQUs7QUFDZCxnQkFBRyxNQUFLLFFBQVEsRUFBRTtBQUNoQixvQkFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO2FBQ3ZEO0FBQ0Qsa0JBQUssUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUNwQixrQkFBSyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLGtCQUFLLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDO3FCQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7YUFBQSxDQUFDLENBQUM7O0FBRXBDLG1CQUFPLE1BQUssT0FBTyxDQUFDO1dBQ3JCLENBQUE7U0FDRjs7QUFFRCxXQUFLO2VBQUEsZUFBQyxRQUFRLEVBQUU7QUFDZCxjQUFHLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDaEIsb0JBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7V0FDekIsTUFBTTtBQUNMLGdCQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztXQUMvQjtTQUNGOzs7O1dBNUJHLFVBQVU7Ozs7O0FBa0NoQixNQUFJLFFBQVEsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDOztBQUU5QixNQUFJLE9BQU8sR0FBRyxpQkFBUyxFQUFFLEVBQUUsR0FBRyxFQUFFO0FBQUUsUUFBSTtBQUFFLGFBQU8sRUFBRSxFQUFFLENBQUE7S0FBRSxDQUFDLE9BQU0sQ0FBQyxFQUFFO0FBQUUsYUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBRTtHQUFFLENBQUE7QUFDbkYsTUFBSSxXQUFXLEdBQUcscUJBQVMsSUFBSSxFQUFFO0FBQy9CLFdBQU8sVUFBUyxLQUFLLEVBQUU7QUFDckIsYUFBTyxTQUFTLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQztLQUNoRCxDQUFBO0dBQ0YsQ0FBQztBQUNGLE1BQUksZ0JBQWdCLEdBQUcsMEJBQVMsQ0FBQyxFQUFFO0FBQUUsV0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDLE9BQU8sS0FBSyxDQUFDO0dBQUUsQ0FBQTtBQUN0RSxNQUFJLE9BQU8sR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQzs7TUFFMUIsT0FBTztBQUNBLGFBRFAsT0FBTyxDQUNDLFNBQVMsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUU7Ozs7OzRCQUQ1QyxPQUFPOztBQUVULFVBQUksS0FBSyxHQUFHLFVBQUEsR0FBRyxFQUFJO0FBQ2pCLGVBQU8sV0FBVSxNQUFNLEdBQUcsTUFBSyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQUssT0FBTyxDQUFDO09BQ2hFLENBQUE7O0FBRUQsVUFBSSxDQUFDLE9BQU8sR0FBTSxBQUFDLFNBQVMsWUFBWSxXQUFXLEdBQUksU0FBUyxHQUFHLElBQUksV0FBVyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNuRyxVQUFJLENBQUMsT0FBTyxHQUFNLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JDLFVBQUksQ0FBQyxRQUFRLEdBQUssSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckMsVUFBSSxDQUFDLFFBQVEsR0FBSyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM1RCxVQUFJLENBQUMsVUFBVSxHQUFHLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDOztBQUV2RCxVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztLQUNyQjs7aUJBYkcsT0FBTztBQWVYLGFBQU87ZUFBQSxtQkFBRzs7Ozs7QUFDUixpQkFBTyxPQUFPLENBQUM7bUJBQU0sTUFBSyxRQUFRLENBQUMsS0FBSyxtQkFBaUI7V0FBQSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUM3RTs7QUFFRCxXQUFLO2VBQUEsaUJBQUc7QUFDTixpQkFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUMxQixnQkFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFakMsZ0JBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRTs7QUFDaEIsb0JBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUMvQix3QkFBUSxDQUFDLEdBQUcsQ0FBQzt5QkFBTSxRQUFRLENBQUMsSUFBSSxDQUFDO2lCQUFBLENBQUMsQ0FBQzs7YUFDcEM7V0FDRjtBQUNELGNBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO21CQUFNLEtBQUs7V0FBQSxDQUFDLENBQUM7U0FDcEM7O0FBRUQsVUFBSTtlQUFBLGNBQUMsR0FBRzs7O2NBQUUsRUFBRSxnQ0FBRyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUM7OEJBQUU7QUFDbEMsZ0JBQUcsR0FBRyxLQUFLLElBQUksRUFBRTtBQUFFLG9CQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7YUFBRTtBQUN0RSxnQkFBRyxFQUFFLEVBQUUsWUFBWSxVQUFVLENBQUEsQUFBQyxFQUFFO0FBQUUsb0JBQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQzthQUFFO0FBQ2pHLGdCQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtBQUFFLHFCQUFPLEVBQUUsQ0FBQzthQUFFOztBQUU3QixnQkFBRyxDQUFDLE1BQUssSUFBSSxFQUFFOzs7O0FBSWIsZ0JBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNwQjs7QUFFRCxnQkFBRyxDQUFDLE1BQUssT0FBTyxDQUFDLElBQUksRUFBRTs7QUFFckIsZ0JBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsQixrQkFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDO3VCQUFNLE1BQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU87ZUFBQSxFQUFFLE1BQUssVUFBVSxDQUFDLENBQUM7O0FBRXpFLHFCQUFNLE1BQUssT0FBTyxDQUFDLE1BQU0sSUFBSSxNQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDaEQsb0JBQUksT0FBTyxHQUFHLE1BQUssT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDOztBQUVqQyxvQkFBRyxPQUFPLENBQUMsTUFBTSxFQUFFOztBQUNqQix3QkFBSSxHQUFHLEdBQUcsTUFBSyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDaEMsd0JBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQzs7QUFFL0IsNEJBQVEsQ0FBQyxHQUFHLENBQUM7NkJBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztxQkFBQSxDQUFDLENBQUM7O2lCQUNsQztlQUNGOztBQUVELGtCQUFHLElBQUksRUFBRTtBQUFFLHNCQUFLLEtBQUssRUFBRSxDQUFDO2VBQUU7O0FBRTFCLHFCQUFPLEVBQUUsQ0FBQzthQUNYLE1BQU0sSUFBRyxNQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUU7OztBQUc3QixrQkFBSSxPQUFPLEdBQUcsTUFBSyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRWpDLHFCQUFNLE1BQUssT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDNUMsdUJBQU8sR0FBRyxNQUFLLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztlQUM5Qjs7QUFFRCxrQkFBRyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTs7QUFDNUIsb0JBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsQixzQkFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDOztBQUUvQiwwQkFBUSxDQUFDLEdBQUcsQ0FBQzsyQkFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO21CQUFBLENBQUMsQ0FBQzs7ZUFDbEMsTUFBTTtBQUNMLHNCQUFLLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7ZUFDbkM7YUFDRixNQUFNO0FBQ0wsb0JBQUssUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNuQzs7QUFFRCxtQkFBTyxFQUFFLENBQUM7V0FDWDtTQUFBOztBQUVELFNBQUc7ZUFBQSxhQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUU7OztBQUNuQixpQkFBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU8sRUFBSTtBQUM1QixrQkFBSyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztXQUMzQyxDQUFDLENBQUM7U0FDSjs7QUFFRCxXQUFLO2VBQUEsaUJBQXdCOzs7Y0FBdkIsRUFBRSxnQ0FBRyxJQUFJLFVBQVUsRUFBRTs7QUFDekIsY0FBRyxFQUFFLEVBQUUsWUFBWSxVQUFVLENBQUEsQUFBQyxFQUFFO0FBQUUsa0JBQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztXQUFFO0FBQ2xHLGNBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFO0FBQUUsbUJBQU8sRUFBRSxDQUFDO1dBQUU7O0FBRTdCLGNBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDdEIsZ0JBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRW5DLG1CQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDaEQsa0JBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRWpDLGtCQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUU7O0FBQ2hCLHNCQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFO3NCQUN2QixHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQzs7QUFFekIsMEJBQVEsQ0FBQyxHQUFHLENBQUM7MkJBQU0sS0FBSyxFQUFFO21CQUFBLENBQUMsQ0FBQztBQUM1QixzQkFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDOzJCQUFNLE1BQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU87bUJBQUEsRUFBRSxNQUFLLFVBQVUsQ0FBQyxDQUFDOztBQUV6RSxzQkFBRyxJQUFJLEtBQUssT0FBTyxFQUFFO0FBQUUsMEJBQUssS0FBSyxFQUFFLENBQUM7bUJBQUU7O2VBQ3ZDO2FBQ0Y7O0FBRUQsY0FBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1dBQ3JCLE1BQU0sSUFBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUM5QixnQkFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFakMsbUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQzVDLG9CQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUM5Qjs7QUFFRCxnQkFBRyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTs7QUFDMUIsb0JBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUU7b0JBQ2xCLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFO29CQUN2QixHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQzs7QUFFekIsd0JBQVEsQ0FBQyxHQUFHLENBQUM7eUJBQU0sS0FBSyxFQUFFO2lCQUFBLENBQUMsQ0FBQztBQUM1QixvQkFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzthQUNYLE1BQU0sSUFBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDcEIscUJBQU8sQ0FBQzt1QkFBTSxNQUFLLE9BQU8sRUFBRTtlQUFBLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUUvQyxrQkFBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUN0QixvQkFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztlQUM3QixNQUFNO0FBQ0wsb0JBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztlQUNaO2FBQ0YsTUFBTTtBQUNMLGtCQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNsQztXQUNGLE1BQU07QUFDTCxnQkFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7V0FDbEM7O0FBRUQsaUJBQU8sRUFBRSxDQUFDO1NBQ1g7O0FBRUQsVUFBSTtlQUFBLGNBQUMsVUFBVSxFQUFFOzs7QUFDZixpQkFBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU8sRUFBSTtBQUM1QixrQkFBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQ3ZDLENBQUMsQ0FBQztTQUNKOztBQUVELFVBQUk7ZUFBQSxjQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUU7QUFDWixpQkFBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUNsQzs7QUFFRCxXQUFLO2VBQUEsaUJBQUc7OztBQUNOLGNBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtBQUNaLGdCQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzs7QUFFckIsZ0JBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQzdCLHFCQUFPLENBQUM7dUJBQU0sTUFBSyxPQUFPLEVBQUU7ZUFBQSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNoRDs7QUFFRCxtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUMxQixrQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFL0Isa0JBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTs7QUFDZixzQkFBSSxHQUFHLEdBQUcsTUFBSyxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQUssT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUk7c0JBQ3hELE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRTdCLDBCQUFRLENBQUMsR0FBRyxDQUFDOzJCQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7bUJBQUEsQ0FBQyxDQUFDOztlQUNsQzthQUNGO1dBQ0Y7U0FDRjs7QUFFRCxVQUFJO2VBQUEsY0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFO0FBQzNCLGNBQUksSUFBSSxHQUFHLElBQUksQ0FBQzs7QUFFaEIsbUJBQVMsSUFBSSxDQUFDLEdBQUcsRUFBRTtBQUNqQixnQkFBRyxHQUFHLEtBQUssR0FBRyxJQUFJLFdBQVcsRUFBRTtBQUM3QixpQkFBRyxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2IsTUFBTTtBQUNMLGlCQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUksRUFBSTtBQUN4QixvQkFBRyxDQUFDLElBQUksSUFBSSxXQUFXLEVBQUU7QUFDdkIsc0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztpQkFDZCxNQUFNO0FBQ0wsc0JBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQzFCO2VBQ0YsQ0FBQyxDQUFDO2FBQ0o7V0FDRjs7QUFFRCxjQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUV2QixpQkFBTyxTQUFTLENBQUM7U0FDbEI7O0FBRUcsVUFBSTthQUFBLFlBQUc7QUFDVCxpQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3JCOzs7O1dBek1HLE9BQU87OztBQTRNYixTQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7Ozs7Ozs7OztBQ2hRMUIsTUFBSSxvQkFBb0IsR0FBRyxBQUFDLE9BQU8sWUFBWSxLQUFLLFVBQVUsR0FBSSxVQUFTLEVBQUUsRUFBRTtBQUM3RSxXQUFPLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUN6QixHQUFHLFVBQVMsRUFBRSxFQUFFO0FBQ2YsV0FBTyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7R0FDdkIsQ0FBQzs7TUFFSSxRQUFRO0FBQ0QsYUFEUCxRQUFRLENBQ0EsYUFBYSxFQUFFOzRCQUR2QixRQUFROztBQUVWLFVBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxJQUFJLG9CQUFvQixDQUFDO0FBQzVELFVBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0tBQ2xCOztpQkFKRyxRQUFRO0FBTVosU0FBRztlQUFBLGFBQUMsRUFBRSxFQUFFOzs7QUFDTixjQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzs7QUFFckIsY0FBSSxDQUFDLGNBQWMsQ0FBQyxZQUFNO0FBQ3hCLG1CQUFNLE1BQUssTUFBTSxDQUFDLE1BQU0sRUFBRTs7QUFFeEIsb0JBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7YUFDdkI7V0FDRixDQUFDLENBQUM7U0FDSjs7OztXQWZHLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUNIUixjQUFjO0FBQ1AsYUFEUCxjQUFjLENBQ04sS0FBSyxFQUFFLFFBQVEsRUFBRTs0QkFEekIsY0FBYzs7QUFFaEIsaUNBRkUsY0FBYyw2Q0FFVixLQUFLLEVBQUU7QUFDYixVQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztLQUMxQjs7Y0FKRyxjQUFjOztpQkFBZCxjQUFjO0FBS2xCLFlBQU07ZUFBQSxrQkFBRztBQUNQLGNBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNoQiw0Q0FQRSxjQUFjLHdDQU9NO1NBQ3ZCOzs7O1dBUkcsY0FBYztLQUFTLFVBQVU7O0FBWWhDLFdBQVMsSUFBSSxDQUFDLElBQUksRUFBRTtBQUN6QixRQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDckIsUUFBSSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQzs7QUFFMUIsUUFBSSxVQUFVLEdBQUcsWUFBTTtBQUFFLGlCQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQztlQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSztPQUFBLENBQUMsQ0FBQTtLQUFFLENBQUE7O0FBRXJFLFFBQUksQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHLEVBQUk7O0FBRWQsVUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFOzs7O0FBQ3JCLGNBQUksRUFBRSxHQUFHLElBQUksY0FBYyxDQUFDLEdBQUcsRUFBRSxZQUFNO0FBQ3JDLHVCQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQztxQkFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUs7YUFBQSxDQUFDLENBQUM7V0FDNUMsQ0FBQyxDQUFDO2dDQUNlLEdBQUc7Y0FBZixFQUFFO2NBQUUsR0FBRzs7QUFDYixZQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBVztBQUM5QixpQkFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEdBQUcsRUFBRSxFQUFFLENBQUUsQ0FBQyxDQUFDO1dBQ3hCLENBQUMsQ0FBQzs7QUFFSCxxQkFBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzs7T0FDdEIsTUFBTTtBQUNMLFlBQUksRUFBRSxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxZQUFNO0FBQ3RDLHFCQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQzttQkFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUs7V0FBQSxDQUFDLENBQUM7U0FDNUMsQ0FBQyxDQUFDOztBQUVILFdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVMsR0FBRyxFQUFFO0FBQzlCLGVBQUssQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQztTQUN6QixDQUFDLENBQUM7O0FBRUgsbUJBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7T0FDdEI7S0FDRixDQUFDLENBQUM7O0FBRUgsV0FBTyxLQUFLLENBQUM7R0FDZDs7QUFFTSxXQUFTLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDMUIsUUFBSSxFQUFFLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUN2QixjQUFVLENBQUMsWUFBTTtBQUFFLFFBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDdEMsV0FBTyxFQUFFLENBQUM7R0FDWDs7Ozs7QUFJTSxXQUFTLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO0FBQ3JDLFFBQUksS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUVuQyxhQUFTLEtBQUssR0FBRztBQUNmLFVBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHLEVBQUk7QUFDdEIsWUFBRyxHQUFHLEtBQUssSUFBSSxFQUFFO0FBQ2YsZUFBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2YsTUFBTTtBQUNMLGVBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCO09BQ0YsQ0FBQyxDQUFDO0tBQ0o7QUFDRCxTQUFLLEVBQUUsQ0FBQzs7QUFFUixXQUFPLEtBQUssQ0FBQztHQUNkOztBQUVNLFdBQVMsR0FBRyxDQUFDLEVBQUUsRUFBRTtBQUN0QixXQUFPLFVBQVMsSUFBSSxFQUFFO0FBQ3BCLGFBQU8sVUFBUyxHQUFHLEVBQUU7QUFDbkIsWUFBRyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQ25CLGlCQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUN0QixNQUFNO0FBQ0wsaUJBQU8sSUFBSSxFQUFFLENBQUM7U0FDZjtPQUNGLENBQUE7S0FDRixDQUFBO0dBQ0Y7O0FBRU0sV0FBUyxNQUFNLENBQUMsRUFBRSxFQUFFO0FBQ3pCLFdBQU8sVUFBUyxJQUFJLEVBQUU7QUFDcEIsYUFBTyxVQUFTLEdBQUcsRUFBRTtBQUNuQixZQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFDbkIsY0FBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDWCxtQkFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7V0FDbEI7U0FDRixNQUFNO0FBQ0wsaUJBQU8sSUFBSSxFQUFFLENBQUM7U0FDZjtPQUNGLENBQUE7S0FDRixDQUFBO0dBQ0Y7O0FBRU0sV0FBUyxXQUFXLENBQUMsRUFBRSxFQUFFO0FBQzlCLFFBQUksSUFBSSxHQUFHLElBQUk7UUFDWCxXQUFXLEdBQUcsRUFBRSxDQUFDOztBQUVyQixXQUFPLFVBQVMsSUFBSSxFQUFFO0FBQ3BCLGFBQU8sVUFBUyxHQUFHLEVBQUU7QUFDbkIsWUFBRyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQ25CLGNBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5QixjQUFHLElBQUksS0FBSyxJQUFJLElBQUksZUFBZSxLQUFLLElBQUksRUFBRTtBQUM1QyxnQkFBSSxHQUFHLEdBQUcsV0FBVyxDQUFDOztBQUV0Qix1QkFBVyxHQUFHLENBQUUsR0FBRyxDQUFFLENBQUM7QUFDdEIsZ0JBQUksR0FBRyxlQUFlLENBQUM7O0FBRXZCLG1CQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztXQUNsQixNQUFNO0FBQ0wsZ0JBQUksR0FBRyxlQUFlLENBQUM7QUFDdkIsdUJBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7V0FDdkI7U0FDRixNQUFNO0FBQ0wsaUJBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQzFCO09BQ0YsQ0FBQTtLQUNGLENBQUE7R0FDRjs7QUFFTSxXQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUU7QUFDN0IsUUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNMLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRVgsV0FBTyxVQUFTLElBQUksRUFBRTtBQUNwQixhQUFPLFVBQVMsR0FBRyxFQUFFO0FBQ25CLFlBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRTtBQUNuQixXQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1osV0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFUCxjQUFHLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxFQUFFO0FBQ2hCLGdCQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7O0FBRVosYUFBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFUCxtQkFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7V0FDbEI7U0FDRixNQUFNO0FBQ0wsaUJBQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2hCO09BQ0YsQ0FBQTtLQUNGLENBQUE7R0FDRjs7Ozs7Ozs7Ozs7Ozs7QUNqSkQsTUFBSSxPQUFPLEdBQUcsVUFBQSxDQUFDLEVBQUk7QUFDakIsV0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDZCxDQUFDOztBQUVGLFNBQU8sQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQztBQUNyQixTQUFPLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7O0FBRTNCLFNBQU8sQ0FBQyxJQUFJLEdBQUcsVUFBQSxLQUFLLEVBQUk7QUFDdEIsUUFBSSxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQzs7QUFFOUIsUUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDN0IsZUFBUyxHQUFHLE9BQU8sQ0FBQztBQUNwQixjQUFRLEdBQUcsTUFBTSxDQUFDO0tBQ25CLENBQUMsQ0FBQzs7QUFFSCxTQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQzthQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQztLQUFBLENBQUMsQ0FBQzs7QUFFaEQsV0FBTyxJQUFJLENBQUM7R0FDYixDQUFDOztBQUVGLFNBQU8sQ0FBQyxPQUFPLEdBQUcsVUFBQSxHQUFHLEVBQUk7QUFDdkIsV0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQ3JCLENBQUMiLCJmaWxlIjoianMtY2hhbm5lbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgnY2hhbm5lbHMnLCBbXSk7IiwiXG4vL1xuLy8gVE9ETzogdGhpcyBpc24ndCBpZGlvbWF0aWNhbGx5IGphdmFzY3JpcHQgKGNvdWxkIHByb2JhYmx5IHVzZSBzbGljZS9zcGxpY2UgdG8gZ29vZCBlZmZlY3QpXG4vL1xuZnVuY3Rpb24gYWNvcHkoc3JjLCBzcmNTdGFydCwgZGVzdCwgZGVzdFN0YXJ0LCBsZW5ndGgpIHtcbiAgZm9yKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgZGVzdFtpICsgZGVzdFN0YXJ0XSA9IHNyY1tpICsgc3JjU3RhcnRdO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFJpbmdCdWZmZXIge1xuICBjb25zdHJ1Y3RvcihzKSB7XG4gICAgbGV0IHNpemUgPSAodHlwZW9mIHMgPT09ICdudW1iZXInKSA/IE1hdGgubWF4KDEsIHMpIDogMTtcbiAgICB0aGlzLl90YWlsICAgPSAwO1xuICAgIHRoaXMuX2hlYWQgICA9IDA7XG4gICAgdGhpcy5fbGVuZ3RoID0gMDtcbiAgICB0aGlzLl92YWx1ZXMgPSBuZXcgQXJyYXkoc2l6ZSk7XG4gIH1cblxuICBwb3AoKSB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZih0aGlzLmxlbmd0aCkge1xuICAgICAgLy8gR2V0IHRoZSBpdGVtIG91dCBvZiB0aGUgc2V0IG9mIHZhbHVlc1xuICAgICAgcmVzdWx0ID0gKHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSAhPT0gbnVsbCkgPyB0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gOiBudWxsO1xuXG4gICAgICAvLyBSZW1vdmUgdGhlIGl0ZW0gZnJvbSB0aGUgc2V0IG9mIHZhbHVlcywgdXBkYXRlIGluZGljaWVzXG4gICAgICB0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gPSBudWxsO1xuICAgICAgdGhpcy5fdGFpbCA9ICh0aGlzLl90YWlsICsgMSkgJSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuICAgICAgdGhpcy5fbGVuZ3RoIC09IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICB1bnNoaWZ0KHZhbCkge1xuICAgIHRoaXMuX3ZhbHVlc1t0aGlzLl9oZWFkXSA9IHZhbDtcbiAgICB0aGlzLl9oZWFkID0gKHRoaXMuX2hlYWQgKyAxKSAlIHRoaXMuX3ZhbHVlcy5sZW5ndGg7XG4gICAgdGhpcy5fbGVuZ3RoICs9IDE7XG4gIH1cblxuICByZXNpemluZ1Vuc2hpZnQodmFsKSB7XG4gICAgaWYodGhpcy5sZW5ndGggKyAxID09PSB0aGlzLl92YWx1ZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgIH1cbiAgICB0aGlzLnVuc2hpZnQodmFsKTtcbiAgfVxuXG4gIHJlc2l6ZSgpIHtcbiAgICBsZXQgbmV3QXJyeSA9IG5ldyBBcnJheSh0aGlzLl92YWx1ZXMubGVuZ3RoICogMik7XG5cbiAgICBpZih0aGlzLl90YWlsIDwgdGhpcy5faGVhZCkge1xuICAgICAgYWNvcHkodGhpcy5fdmFsdWVzLCB0aGlzLl90YWlsLCBuZXdBcnJ5LCAwLCB0aGlzLl9oZWFkKTtcblxuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gdGhpcy5sZW5ndGg7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuXG4gICAgfSBlbHNlIGlmKHRoaXMuX2hlYWQgPCB0aGlzLl90YWlsKSB7XG4gICAgICBhY29weSh0aGlzLl92YWx1ZXMsIDAsIG5ld0FycnksIHRoaXMuX3ZhbHVlcy5sZW5ndGggLSB0aGlzLl90YWlsLCB0aGlzLl9oZWFkKTtcblxuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gdGhpcy5sZW5ndGg7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IDA7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuICAgIH1cbiAgfVxuXG4gIGNsZWFudXAoa2VlcCkge1xuICAgIGZvcihsZXQgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgbGV0IGl0ZW0gPSB0aGlzLnBvcCgpO1xuXG4gICAgICBpZihrZWVwKGl0ZW0pKSB7XG4gICAgICAgIHVuc2hpZnQoaXRlbSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIEZpeGVkQnVmZmVyIHtcbiAgY29uc3RydWN0b3Iobikge1xuICAgIHRoaXMuX2J1ZiA9IG5ldyBSaW5nQnVmZmVyKG4pO1xuICAgIHRoaXMuX3NpemUgPSBuO1xuICB9XG5cbiAgcmVtb3ZlKCkge1xuICAgIHJldHVybiB0aGlzLl9idWYucG9wKCk7XG4gIH1cblxuICBhZGQodikge1xuICAgIGlmKHRoaXMuZnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGFkZCB0byBhIGZ1bGwgYnVmZmVyLlwiKTtcbiAgICB9XG4gICAgdGhpcy5fYnVmLnJlc2l6aW5nVW5zaGlmdCh2KTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5sZW5ndGg7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBEcm9wcGluZ0J1ZmZlciBleHRlbmRzIEZpeGVkQnVmZmVyIHtcbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLl9idWYubGVuZ3RoIDwgdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFNsaWRpbmdCdWZmZXIgZXh0ZW5kcyBGaXhlZEJ1ZmZlciB7XG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IHsgRHJvcHBpbmdCdWZmZXIsIFNsaWRpbmdCdWZmZXIsIEZpeGVkQnVmZmVyLCBSaW5nQnVmZmVyIH07IiwiXG5pbXBvcnQgeyBGaXhlZEJ1ZmZlciwgUmluZ0J1ZmZlciB9IGZyb20gXCIuL2J1ZmZlcnMuanNcIjtcbmltcG9ydCB7IERpc3BhdGNoIH0gZnJvbSBcIi4vZGlzcGF0Y2guanNcIjtcbmltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFRyYW5zYWN0b3Ige1xuICBjb25zdHJ1Y3RvcihvZmZlcikge1xuICAgIHRoaXMub2ZmZXJlZCA9IG9mZmVyO1xuICAgIHRoaXMucmVjZWl2ZWQgPSBudWxsO1xuICAgIHRoaXMucmVzb2x2ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcbiAgfVxuXG4gIGNvbW1pdCgpIHtcbiAgICByZXR1cm4gKHZhbCkgPT4ge1xuICAgICAgaWYodGhpcy5yZXNvbHZlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byByZXNvbHZlIHRyYW5zYWN0b3IgdHdpY2UhXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWNlaXZlZCA9IHZhbDtcbiAgICAgIHRoaXMucmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaChjID0+IGModmFsKSk7XG5cbiAgICAgIHJldHVybiB0aGlzLm9mZmVyZWQ7XG4gICAgfVxuICB9XG5cbiAgZGVyZWYoY2FsbGJhY2spIHtcbiAgICBpZih0aGlzLnJlc29sdmVkKSB7XG4gICAgICBjYWxsYmFjayh0aGlzLnJlY2VpdmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9XG59XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubGV0IGRpc3BhdGNoID0gbmV3IERpc3BhdGNoKCk7XG5cbmxldCBhdHRlbXB0ID0gZnVuY3Rpb24oZm4sIGV4aCkgeyB0cnkgeyByZXR1cm4gZm4oKSB9IGNhdGNoKGUpIHsgcmV0dXJuIGV4aChlKTsgfSB9XG5sZXQgcGFzc3Rocm91Z2ggPSBmdW5jdGlvbihuZXh0KSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gbmV4dCh2YWx1ZSkgOiBuZXh0KCk7XG4gIH1cbn07XG5sZXQgZGVmYXVsdEV4SGFuZGxlciA9IGZ1bmN0aW9uKGUpIHsgY29uc29sZS5lcnJvcihlKTsgcmV0dXJuIGZhbHNlOyB9XG5sZXQgcmVkdWNlZCA9IHsgcmVkdWNlZDogdHJ1ZSB9O1xuXG5jbGFzcyBDaGFubmVsIHtcbiAgY29uc3RydWN0b3Ioc2l6ZU9yQnVmLCB4Zm9ybSwgZXhjZXB0aW9uSGFuZGxlcikge1xuICAgIGxldCBkb0FkZCA9IHZhbCA9PiB7XG4gICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMuX2J1ZmZlci5hZGQodmFsKSA6IHRoaXMuX2J1ZmZlcjtcbiAgICB9XG5cbiAgICB0aGlzLl9idWZmZXIgICAgPSAoc2l6ZU9yQnVmIGluc3RhbmNlb2YgRml4ZWRCdWZmZXIpID8gc2l6ZU9yQnVmIDogbmV3IEZpeGVkQnVmZmVyKHNpemVPckJ1ZiB8fCAwKTtcbiAgICB0aGlzLl90YWtlcnMgICAgPSBuZXcgUmluZ0J1ZmZlcigzMik7XG4gICAgdGhpcy5fcHV0dGVycyAgID0gbmV3IFJpbmdCdWZmZXIoMzIpO1xuICAgIHRoaXMuX3hmb3JtZXIgICA9IHhmb3JtID8geGZvcm0oZG9BZGQpIDogcGFzc3Rocm91Z2goZG9BZGQpO1xuICAgIHRoaXMuX2V4SGFuZGxlciA9IGV4Y2VwdGlvbkhhbmRsZXIgfHwgZGVmYXVsdEV4SGFuZGxlcjtcblxuICAgIHRoaXMuX2lzT3BlbiA9IHRydWU7XG4gIH1cblxuICBfaW5zZXJ0KCkge1xuICAgIHJldHVybiBhdHRlbXB0KCgpID0+IHRoaXMuX3hmb3JtZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSwgdGhpcy5fZXhIYW5kbGVyKTtcbiAgfVxuXG4gIGFib3J0KCkge1xuICAgIHdoaWxlKHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICBsZXQgcHV0dGVyID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcblxuICAgICAgaWYocHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICBsZXQgcHV0dGVyQ2IgPSBwdXR0ZXIuY29tbWl0KCk7XG4gICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiBwdXR0ZXJDYih0cnVlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3B1dHRlcnMuY2xlYW51cCgoKSA9PiBmYWxzZSk7XG4gIH1cblxuICBmaWxsKHZhbCwgdHggPSBuZXcgVHJhbnNhY3Rvcih2YWwpKSB7XG4gICAgaWYodmFsID09PSBudWxsKSB7IHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBwdXQgbnVsbCB0byBhIGNoYW5uZWwuXCIpOyB9XG4gICAgaWYoISh0eCBpbnN0YW5jZW9mIFRyYW5zYWN0b3IpKSB7IHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBUcmFuc2FjdG9yIHRvIGJlIHBhc3NlZCB0byBmaWxsXCIpOyB9XG4gICAgaWYoIXR4LmFjdGl2ZSkgeyByZXR1cm4gdHg7IH1cblxuICAgIGlmKCF0aGlzLm9wZW4pIHtcbiAgICAgIC8vIEVpdGhlciBzb21lYm9keSBoYXMgcmVzb2x2ZWQgdGhlIGhhbmRsZXIgYWxyZWFkeSAodGhhdCB3YXMgZmFzdCkgb3IgdGhlIGNoYW5uZWwgaXMgY2xvc2VkLlxuICAgICAgLy8gY29yZS5hc3luYyByZXR1cm5zIGEgYm9vbGVhbiBvZiB3aGV0aGVyIG9yIG5vdCBzb21ldGhpbmcgKmNvdWxkKiBnZXQgcHV0IHRvIHRoZSBjaGFubmVsXG4gICAgICAvLyB3ZSdsbCBkbyB0aGUgc2FtZSAjY2FyZ29jdWx0XG4gICAgICB0eC5jb21taXQoKShmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYoIXRoaXMuX2J1ZmZlci5mdWxsKSB7XG4gICAgICAvLyBUaGUgY2hhbm5lbCBoYXMgc29tZSBmcmVlIHNwYWNlLiBTdGljayBpdCBpbiB0aGUgYnVmZmVyIGFuZCB0aGVuIGRyYWluIGFueSB3YWl0aW5nIHRha2VzLlxuICAgICAgdHguY29tbWl0KCkodHJ1ZSk7XG4gICAgICBsZXQgZG9uZSA9IGF0dGVtcHQoKCkgPT4gdGhpcy5faW5zZXJ0KHZhbCkgPT09IHJlZHVjZWQsIHRoaXMuX2V4SGFuZGxlcik7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3Rha2Vycy5sZW5ndGggJiYgdGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICBsZXQgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgICBpZih0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICAgIGxldCB2YWwgPSB0aGlzLl9idWZmZXIucmVtb3ZlKCk7XG4gICAgICAgICAgbGV0IHRha2VyQ2IgPSB0YWtlclR4LmNvbW1pdCgpO1xuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VyQ2IodmFsKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoZG9uZSkgeyB0aGlzLmFib3J0KCk7IH1cblxuICAgICAgcmV0dXJuIHR4O1xuICAgIH0gZWxzZSBpZih0aGlzLl90YWtlcnMubGVuZ3RoKSB7XG4gICAgICAvLyBUaGUgYnVmZmVyIGlzIGZ1bGwgYnV0IHRoZXJlIGFyZSB3YWl0aW5nIHRha2VycyAoZS5nLiB0aGUgYnVmZmVyIGlzIHNpemUgemVybylcblxuICAgICAgbGV0IHRha2VyVHggPSB0aGlzLl90YWtlcnMucG9wKCk7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3Rha2Vycy5sZW5ndGggJiYgIXRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgIHRha2VyVHggPSB0aGlzLl90YWtlcnMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHRha2VyVHggJiYgdGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgdHguY29tbWl0KCkodHJ1ZSk7XG4gICAgICAgIGxldCB0YWtlckNiID0gdGFrZXJUeC5jb21taXQoKTtcblxuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3B1dHRlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHV0dGVycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgIH1cblxuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHB1dCh2YWwsIHRyYW5zYWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmZpbGwodmFsLCB0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRyYWluKHR4ID0gbmV3IFRyYW5zYWN0b3IoKSkge1xuICAgIGlmKCEodHggaW5zdGFuY2VvZiBUcmFuc2FjdG9yKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgVHJhbnNhY3RvciB0byBiZSBwYXNzZWQgdG8gZHJhaW5cIik7IH1cbiAgICBpZighdHguYWN0aXZlKSB7IHJldHVybiB0eDsgfVxuXG4gICAgaWYodGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgbGV0IGJ1ZlZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcblxuICAgICAgd2hpbGUoIXRoaXMuX2J1ZmZlci5mdWxsICYmIHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHB1dHRlci5hY3RpdmUpIHtcbiAgICAgICAgICBsZXQgcHV0VHggPSBwdXR0ZXIuY29tbWl0KCksXG4gICAgICAgICAgICAgIHZhbCA9IHB1dHRlci5vZmZlcmVkOyAvLyBLaW5kYSBicmVha2luZyB0aGUgcnVsZXMgaGVyZVxuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHB1dFR4KCkpO1xuICAgICAgICAgIGxldCBkb25lID0gYXR0ZW1wdCgoKSA9PiB0aGlzLl9pbnNlcnQodmFsKSA9PT0gcmVkdWNlZCwgdGhpcy5fZXhIYW5kbGVyKTtcblxuICAgICAgICAgIGlmKGRvbmUgPT09IHJlZHVjZWQpIHsgdGhpcy5hYm9ydCgpOyB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdHguY29tbWl0KCkoYnVmVmFsKTtcbiAgICB9IGVsc2UgaWYodGhpcy5fcHV0dGVycy5sZW5ndGgpIHtcbiAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuXG4gICAgICB3aGlsZSh0aGlzLl9wdXR0ZXJzLmxlbmd0aCAmJiAhcHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZihwdXR0ZXIgJiYgcHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICBsZXQgdHhDYiA9IHR4LmNvbW1pdCgpLFxuICAgICAgICAgICAgcHV0VHggPSBwdXR0ZXIuY29tbWl0KCksXG4gICAgICAgICAgICB2YWwgPSBwdXR0ZXIub2ZmZXJlZDtcblxuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gcHV0VHgoKSk7XG4gICAgICAgIHR4Q2IodmFsKTtcbiAgICAgIH0gZWxzZSBpZighdGhpcy5vcGVuKSB7XG4gICAgICAgIGF0dGVtcHQoKCkgPT4gdGhpcy5faW5zZXJ0KCksIHRoaXMuX2V4SGFuZGxlcik7XG5cbiAgICAgICAgaWYodGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgIHR4Q2IodGhpcy5fYnVmZmVyLnJlbW92ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0eENiKG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl90YWtlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFrZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgdGFrZSh0cmFuc2FjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5kcmFpbih0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHRoZW4oZm4sIGVycikge1xuICAgIHJldHVybiB0aGlzLnRha2UoKS50aGVuKGZuLCBlcnIpO1xuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgaWYodGhpcy5vcGVuKSB7XG4gICAgICB0aGlzLl9pc09wZW4gPSBmYWxzZTtcblxuICAgICAgaWYodGhpcy5fcHV0dGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYXR0ZW1wdCgoKSA9PiB0aGlzLl9pbnNlcnQoKSwgdGhpcy5fZXhIYW5kbGVyKTtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKHRoaXMuX3Rha2Vycy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHRha2VyID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHRha2VyLmFjdGl2ZSkge1xuICAgICAgICAgIGxldCB2YWwgPSB0aGlzLl9idWZmZXIubGVuZ3RoID8gdGhpcy5fYnVmZmVyLnJlbW92ZSgpIDogbnVsbCxcbiAgICAgICAgICAgICAgdGFrZXJDYiA9IHRha2VyLmNvbW1pdCgpO1xuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VyQ2IodmFsKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpbnRvKG90aGVyQ2hhbiwgc2hvdWxkQ2xvc2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBpbnRvKHZhbCkge1xuICAgICAgaWYodmFsID09PSBuaWwgJiYgc2hvdWxkQ2xvc2UpIHtcbiAgICAgICAgb3V0LmNsb3NlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQucHV0KHZhbCkudGhlbihvcGVuID0+IHtcbiAgICAgICAgICBpZighb3BlbiAmJiBzaG91bGRDbG9zZSkge1xuICAgICAgICAgICAgc2VsZi5jbG9zZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnRha2UoKS50aGVuKG1hcHBlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRha2UoKS50aGVuKGludG8pO1xuXG4gICAgcmV0dXJuIG90aGVyQ2hhbjtcbiAgfVxuXG4gIGdldCBvcGVuKCkge1xuICAgIHJldHVybiB0aGlzLl9pc09wZW47XG4gIH1cbn1cblxuQ2hhbm5lbC5yZWR1Y2VkID0gcmVkdWNlZDtcblxuZXhwb3J0IHsgQ2hhbm5lbCwgVHJhbnNhY3RvciB9OyIsImxldCBkZWZhdWx0QXN5bmNocm9uaXplciA9ICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSA/IGZ1bmN0aW9uKGZuKSB7XG4gIHJldHVybiBzZXRJbW1lZGlhdGUoZm4pO1xufSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHJldHVybiBzZXRUaW1lb3V0KGZuKTtcbn07XG5cbmNsYXNzIERpc3BhdGNoIHtcbiAgY29uc3RydWN0b3IoYXN5bmNocm9uaXplcikge1xuICAgIHRoaXMuX2FzeW5jaHJvbml6ZXIgPSBhc3luY2hyb25pemVyIHx8IGRlZmF1bHRBc3luY2hyb25pemVyO1xuICAgIHRoaXMuX3F1ZXVlID0gW107XG4gIH1cblxuICBydW4oZm4pIHtcbiAgICB0aGlzLl9xdWV1ZS5wdXNoKGZuKTtcblxuICAgIHRoaXMuX2FzeW5jaHJvbml6ZXIoKCkgPT4ge1xuICAgICAgd2hpbGUodGhpcy5fcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJRVUVVRVwiLCB0aGlzLl9xdWV1ZVswXSk7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnNoaWZ0KCkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5cbmV4cG9ydCB7IERpc3BhdGNoIH07IiwiaW1wb3J0IHsgQ2hhbm5lbCwgVHJhbnNhY3RvciB9IGZyb20gXCIuL2NoYW5uZWxzLmpzXCI7XG5cblxuY2xhc3MgQWx0c1RyYW5zYWN0b3IgZXh0ZW5kcyBUcmFuc2FjdG9yIHtcbiAgY29uc3RydWN0b3Iob2ZmZXIsIGNvbW1pdENiKSB7XG4gICAgc3VwZXIob2ZmZXIpO1xuICAgIHRoaXMuY29tbWl0Q2IgPSBjb21taXRDYjtcbiAgfVxuICBjb21taXQoKSB7XG4gICAgdGhpcy5jb21taXRDYigpO1xuICAgIHJldHVybiBzdXBlci5jb21taXQoKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhbHRzKHJhY2UpIHtcbiAgbGV0IHRyYW5zYWN0b3JzID0gW107XG4gIGxldCBvdXRDaCA9IG5ldyBDaGFubmVsKCk7XG5cbiAgbGV0IGRlYWN0aXZhdGUgPSAoKSA9PiB7IHRyYW5zYWN0b3JzLmZvckVhY2goaCA9PiBoLmFjdGl2ZSA9IGZhbHNlKSB9XG5cbiAgcmFjZS5tYXAoY21kID0+IHtcblxuICAgIGlmKEFycmF5LmlzQXJyYXkoY21kKSkge1xuICAgICAgbGV0IHR4ID0gbmV3IEFsdHNUcmFuc2FjdG9yKHZhbCwgKCkgPT4ge1xuICAgICAgICB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSk7XG4gICAgICB9KTtcbiAgICAgIGxldCBbIGNoLCB2YWwgXSA9IGNtZDtcbiAgICAgIGNoLnB1dCh2YWwsIHR4KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBvdXRDaC5wdXQoWyB2YWwsIGNoIF0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRyYW5zYWN0b3JzLnB1c2godHgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgdHggPSBuZXcgQWx0c1RyYW5zYWN0b3IodHJ1ZSwgKCkgPT4ge1xuICAgICAgICB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSk7XG4gICAgICB9KTtcblxuICAgICAgY21kLnRha2UodHgpLnRoZW4oZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIG91dENoLnB1dChbIHZhbCwgY21kIF0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRyYW5zYWN0b3JzLnB1c2godHgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG91dENoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGltZW91dChtcykge1xuICB2YXIgY2ggPSBuZXcgQ2hhbm5lbCgpO1xuICBzZXRUaW1lb3V0KCgpID0+IHsgY2guY2xvc2UoKTsgfSwgbXMpO1xuICByZXR1cm4gY2g7XG59XG5cbi8vIEVuZm9yY2VzIG9yZGVyIHJlc29sdXRpb24gb24gcmVzdWx0aW5nIGNoYW5uZWxcbi8vIFRoaXMgbWlnaHQgbmVlZCB0byBiZSB0aGUgZGVmYXVsdCBiZWhhdmlvciwgdGhvdWdoIHRoYXQgcmVxdWlyZXMgbW9yZSB0aG91Z2h0XG5leHBvcnQgZnVuY3Rpb24gb3JkZXIoaW5jaCwgc2l6ZU9yQnVmKSB7XG4gIHZhciBvdXRjaCA9IG5ldyBDaGFubmVsKHNpemVPckJ1Zik7XG5cbiAgZnVuY3Rpb24gZHJhaW4oKSB7XG4gICAgaW5jaC50YWtlKCkudGhlbih2YWwgPT4ge1xuICAgICAgaWYodmFsID09PSBudWxsKSB7XG4gICAgICAgIG91dGNoLmNsb3NlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRjaC5wdXQodmFsKS50aGVuKGRyYWluKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBkcmFpbigpO1xuXG4gIHJldHVybiBvdXRjaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcChmbikge1xuICByZXR1cm4gZnVuY3Rpb24obmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG5leHQoZm4odmFsKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihuZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgaWYoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBpZiAoZm4odmFsKSkge1xuICAgICAgICAgIHJldHVybiBuZXh0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aXRpb25CeShmbikge1xuICBsZXQgbGFzdCA9IG51bGwsXG4gICAgICBhY2N1bXVsYXRvciA9IFtdO1xuXG4gIHJldHVybiBmdW5jdGlvbihuZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgaWYoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBsZXQgcHJlZGljYXRlUmVzdWx0ID0gZm4odmFsKTtcbiAgICAgICAgaWYobGFzdCAhPT0gbnVsbCAmJiBwcmVkaWNhdGVSZXN1bHQgIT09IGxhc3QpIHtcbiAgICAgICAgICBsZXQgdG1wID0gYWNjdW11bGF0b3I7XG5cbiAgICAgICAgICBhY2N1bXVsYXRvciA9IFsgdmFsIF07XG4gICAgICAgICAgbGFzdCA9IHByZWRpY2F0ZVJlc3VsdDtcblxuICAgICAgICAgIHJldHVybiBuZXh0KHRtcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGFzdCA9IHByZWRpY2F0ZVJlc3VsdDtcbiAgICAgICAgICBhY2N1bXVsYXRvci5wdXNoKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXh0KGFjY3VtdWxhdG9yKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpdGlvbihudW0pIHtcbiAgbGV0IGMgPSAwLFxuICAgICAgYSA9IFtdO1xuXG4gIHJldHVybiBmdW5jdGlvbihuZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgaWYoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBhLnB1c2godmFsKTtcbiAgICAgICAgYyArPSAxO1xuXG4gICAgICAgIGlmKGMgJSBudW0gPT09IDApIHtcbiAgICAgICAgICBsZXQgdG1wID0gYTtcblxuICAgICAgICAgIGEgPSBbXTtcblxuICAgICAgICAgIHJldHVybiBuZXh0KHRtcCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXh0KGEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSIsIlxuaW1wb3J0ICogYXMgJHEgZnJvbSBcIiRxXCI7XG5cbnZhciBQcm9taXNlID0gciA9PiB7XG4gIHJldHVybiAkcShyKTtcbn07XG5cblByb21pc2UuYWxsID0gJHEuYWxsO1xuUHJvbWlzZS5yZWplY3QgPSAkcS5yZWplY3Q7XG5cblByb21pc2UucmFjZSA9IHByb21zID0+IHtcbiAgdmFyIGRvRnVsZmlsbCwgZG9SZWplY3QsIHByb207XG5cbiAgcHJvbSA9ICRxKChmdWxmaWxsLCByZWplY3QpID0+IHtcbiAgICBkb0Z1bGZpbGwgPSBmdWxmaWxsO1xuICAgIGRvUmVqZWN0ID0gcmVqZWN0O1xuICB9KTtcblxuICBwcm9tcy5mb3JFYWNoKHAgPT4gcC50aGVuKGRvRnVsZmlsbCwgZG9SZWplY3QpKTtcblxuICByZXR1cm4gcHJvbTtcbn07XG5cblByb21pc2UucmVzb2x2ZSA9IHZhbCA9PiB7XG4gIHJldHVybiAkcS53aGVuKHZhbCk7XG59O1xuXG5leHBvcnQgeyBQcm9taXNlIH07Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9