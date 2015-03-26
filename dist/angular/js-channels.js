/*global angular:true */
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

  ES6__EXPORTS.DroppingBuffer = DroppingBuffer;
  ES6__EXPORTS.SlidingBuffer = SlidingBuffer;
  ES6__EXPORTS.FixedBuffer = FixedBuffer;
  ES6__EXPORTS.RingBuffer = RingBuffer;
  return ES6__EXPORTS;
});
angular.module("channels").service("chanChannels", function (chanBuffers, chanDispatch, chanPromise, chanTransducers) {
  var ES6__EXPORTS = {};

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var FixedBuffer = chanBuffers.FixedBuffer;
  var RingBuffer = chanBuffers.RingBuffer;
  var Dispatch = chanDispatch.Dispatch;
  var Promise = chanPromise.Promise;
  var transducers = chanTransducers.transducers;

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

  ES6__EXPORTS.Channel = Channel;
  ES6__EXPORTS.Transactor = Transactor;
  return ES6__EXPORTS;
});
angular.module("channels").service("chanDispatch", function () {
  var ES6__EXPORTS = {};

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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

  ES6__EXPORTS.Dispatch = Dispatch;
  return ES6__EXPORTS;
});
angular.module("channels").service("chanTransducers", function () {
  var ES6__EXPORTS = {};
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

  ES6__EXPORTS.transducers = _transducers;
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

  ES6__EXPORTS.alts = alts;
  ES6__EXPORTS.timeout = timeout;
  ES6__EXPORTS.pipelineAsync = pipelineAsync;
  ES6__EXPORTS.order = order;
  return ES6__EXPORTS;
});
angular.module("channels").service("chanPromise", function ($q) {
  var ES6__EXPORTS = {};

  var Prom = function (r) {
    return $q(r);
  };

  Prom.all = $q.all;
  Prom.reject = $q.reject;

  Prom.race = function (proms) {
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

  Prom.resolve = function (val) {
    return $q.when(val);
  };

  ES6__EXPORTS.Promise = Prom;
  return ES6__EXPORTS;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYnVmZmVycy5qcyIsImNoYW5uZWxzLmpzIiwiZGlzcGF0Y2guanMiLCJ0cmFuc2R1Y2Vycy5qcyIsInV0aWxzLmpzIiwicHJvbWlzZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBOzs7Ozs7Ozs7Ozs7O0FDR0EsV0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUNyRCxTQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDakMsVUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO0tBQ3pDO0dBQ0Y7Ozs7TUFJSyxVQUFVO0FBQ0gsYUFEUCxVQUFVLENBQ0YsQ0FBQyxFQUFFOzRCQURYLFVBQVU7O0FBRVosVUFBSSxJQUFJLEdBQUcsQUFBQyxPQUFPLENBQUMsS0FBSyxRQUFRLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hELFVBQUksQ0FBQyxLQUFLLEdBQUssQ0FBQyxDQUFDO0FBQ2pCLFVBQUksQ0FBQyxLQUFLLEdBQUssQ0FBQyxDQUFDO0FBQ2pCLFVBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLFVBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDaEM7O2lCQVBHLFVBQVU7QUFTZCxTQUFHO2VBQUEsZUFBRztBQUNKLGNBQUksTUFBTSxZQUFBLENBQUM7QUFDWCxjQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7O0FBRWQsa0JBQU0sR0FBRyxBQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksR0FBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7OztBQUcvRSxnQkFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2hDLGdCQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUEsR0FBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNwRCxnQkFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7V0FDbkIsTUFBTTtBQUNMLGtCQUFNLEdBQUcsSUFBSSxDQUFDO1dBQ2Y7QUFDRCxpQkFBTyxNQUFNLENBQUM7U0FDZjs7QUFFRCxhQUFPO2VBQUEsaUJBQUMsR0FBRyxFQUFFO0FBQ1gsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQy9CLGNBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQSxHQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ3BELGNBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDO1NBQ25COztBQUVELHFCQUFlO2VBQUEseUJBQUMsR0FBRyxFQUFFO0FBQ25CLGNBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDMUMsZ0JBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztXQUNmO0FBQ0QsY0FBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNuQjs7QUFFRCxZQUFNO2VBQUEsa0JBQUc7QUFDUCxjQUFJLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQzs7QUFFakQsY0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDMUIsaUJBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRXhELGdCQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLGdCQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDekIsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1dBRXhCLE1BQU0sSUFBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDakMsaUJBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRTlFLGdCQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLGdCQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDekIsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1dBRXhCLE1BQU07QUFDTCxnQkFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixnQkFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixnQkFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7V0FDeEI7U0FDRjs7QUFFRCxhQUFPO2VBQUEsaUJBQUMsSUFBSSxFQUFFO0FBQ1osZUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzdDLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRXRCLGdCQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNiLGtCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3BCO1dBQ0Y7U0FDRjs7QUFFRyxZQUFNO2FBQUEsWUFBRztBQUNYLGlCQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDckI7Ozs7V0ExRUcsVUFBVTs7Ozs7TUErRVYsV0FBVztBQUNKLGFBRFAsV0FBVyxDQUNILENBQUMsRUFBRTs0QkFEWCxXQUFXOztBQUViLFVBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsVUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7S0FDaEI7O2lCQUpHLFdBQVc7QUFNZixZQUFNO2VBQUEsa0JBQUc7QUFDUCxpQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ3hCOztBQUVELFNBQUc7ZUFBQSxhQUFDLENBQUMsRUFBRTtBQUNMLGNBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtBQUNaLGtCQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7V0FDakQ7QUFDRCxjQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFN0IsaUJBQU8sSUFBSSxDQUFDO1NBQ2I7O0FBRUcsWUFBTTthQUFBLFlBQUc7QUFDWCxpQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztTQUN6Qjs7QUFFRyxVQUFJO2FBQUEsWUFBRztBQUNULGlCQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDeEM7Ozs7V0F6QkcsV0FBVzs7Ozs7TUE4QlgsY0FBYzthQUFkLGNBQWM7NEJBQWQsY0FBYzs7Ozs7OztjQUFkLGNBQWM7O2lCQUFkLGNBQWM7QUFDbEIsU0FBRztlQUFBLGFBQUMsQ0FBQyxFQUFFO0FBQ0wsY0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ2hDLGdCQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztXQUN0Qjs7QUFFRCxpQkFBTyxJQUFJLENBQUM7U0FDYjs7QUFFRyxVQUFJO2FBQUEsWUFBRztBQUNULGlCQUFPLEtBQUssQ0FBQztTQUNkOzs7O1dBWEcsY0FBYztLQUFTLFdBQVc7Ozs7TUFnQmxDLGFBQWE7YUFBYixhQUFhOzRCQUFiLGFBQWE7Ozs7Ozs7Y0FBYixhQUFhOztpQkFBYixhQUFhO0FBQ2pCLFNBQUc7ZUFBQSxhQUFDLENBQUMsRUFBRTtBQUNMLGNBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNsQyxnQkFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1dBQ2Y7QUFDRCxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFckIsaUJBQU8sSUFBSSxDQUFDO1NBQ2I7O0FBRUcsVUFBSTthQUFBLFlBQUc7QUFDVCxpQkFBTyxLQUFLLENBQUM7U0FDZDs7OztXQVpHLGFBQWE7S0FBUyxXQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQ2pJakMsVUFBVTtBQUNILGFBRFAsVUFBVSxDQUNGLEtBQUssRUFBRTs0QkFEZixVQUFVOztBQUVaLFVBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFVBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFVBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFVBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0tBQ3JCOztpQkFQRyxVQUFVO0FBU2QsWUFBTTtlQUFBLGtCQUFHOzs7QUFDUCxpQkFBTyxVQUFDLEdBQUcsRUFBSztBQUNkLGdCQUFHLE1BQUssUUFBUSxFQUFFO0FBQ2hCLG9CQUFNLElBQUksS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7YUFDdkQ7QUFDRCxrQkFBSyxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ3BCLGtCQUFLLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckIsa0JBQUssU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7cUJBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQzthQUFBLENBQUMsQ0FBQzs7QUFFcEMsbUJBQU8sTUFBSyxPQUFPLENBQUM7V0FDckIsQ0FBQztTQUNIOztBQUVELFdBQUs7ZUFBQSxlQUFDLFFBQVEsRUFBRTtBQUNkLGNBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNoQixvQkFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztXQUN6QixNQUFNO0FBQ0wsZ0JBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1dBQy9CO1NBQ0Y7Ozs7V0E1QkcsVUFBVTs7Ozs7QUFrQ2hCLE1BQUksUUFBUSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7O01BRXhCLE9BQU87QUFDQSxhQURQLE9BQU8sQ0FDQyxTQUFTLEVBQUUsS0FBSyxFQUFFOzRCQUQxQixPQUFPOztBQUVULFVBQUcsQ0FBQyxXQUFXLElBQUksS0FBSyxFQUFFO0FBQ3hCLGVBQU8sQ0FBQyxJQUFJLENBQUMsK0ZBQStGLENBQUMsQ0FBQztPQUMvRztBQUNELFVBQUcsQ0FBQyxTQUFTLElBQUksS0FBSyxJQUFJLFdBQVcsRUFBRTtBQUNyQyxlQUFPLENBQUMsSUFBSSxDQUFDLHNEQUFzRCxDQUFDLENBQUM7T0FDdEU7Ozs7O0FBS0QsVUFBSSxLQUFLLEdBQUcsVUFBQyxHQUFHLEVBQUUsR0FBRztlQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO09BQUEsQ0FBQzs7QUFFdkMsVUFBSSxDQUFDLE9BQU8sR0FBTSxBQUFDLFNBQVMsWUFBWSxXQUFXLEdBQUksU0FBUyxHQUFHLElBQUksV0FBVyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNuRyxVQUFJLENBQUMsT0FBTyxHQUFNLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JDLFVBQUksQ0FBQyxRQUFRLEdBQUssSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckMsVUFBSSxDQUFDLFFBQVEsR0FBSyxLQUFLLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDOztBQUVoRixVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztLQUNyQjs7aUJBcEJHLE9BQU87QUFzQlgsYUFBTztlQUFBLGlCQUFDLEdBQUcsRUFBRTtBQUNYLGNBQUcsV0FBVyxFQUFFO0FBQ2QsZ0JBQUcsR0FBRyxFQUFFO0FBQ04scUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQzthQUM5QyxNQUFNO0FBQ0wscUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQzNDO1dBQ0YsTUFBTSxJQUFHLEdBQUcsRUFBRTtBQUNiLGdCQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7V0FDbEM7QUFDRCxpQkFBTyxLQUFLLENBQUM7U0FDZDs7QUFFRCxVQUFJO2VBQUEsY0FBQyxHQUFHOzs7Y0FBRSxFQUFFLGdDQUFHLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQzs4QkFBRTtBQUNsQyxnQkFBRyxHQUFHLEtBQUssSUFBSSxFQUFFO0FBQUUsb0JBQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQzthQUFFO0FBQ3RFLGdCQUFHLEVBQUUsRUFBRSxZQUFZLFVBQVUsQ0FBQSxBQUFDLEVBQUU7QUFBRSxvQkFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO2FBQUU7QUFDakcsZ0JBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFO0FBQUUscUJBQU8sRUFBRSxDQUFDO2FBQUU7O0FBRTdCLGdCQUFHLENBQUMsTUFBSyxJQUFJLEVBQUU7Ozs7QUFJYixnQkFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3BCOztBQUVELGdCQUFHLENBQUMsTUFBSyxPQUFPLENBQUMsSUFBSSxFQUFFOztBQUVyQixnQkFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVsQixrQkFBSSxJQUFJLEdBQUcsV0FBVyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBSyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFcEYscUJBQU0sTUFBSyxPQUFPLENBQUMsTUFBTSxJQUFJLE1BQUssT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUNoRCxvQkFBSSxPQUFPLEdBQUcsTUFBSyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRWpDLG9CQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUU7O0FBQ2pCLHdCQUFJLENBQUMsR0FBRyxNQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUM5Qix3QkFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDOztBQUUvQiw0QkFBUSxDQUFDLEdBQUcsQ0FBQzs2QkFBTSxPQUFPLENBQUMsQ0FBQyxDQUFDO3FCQUFBLENBQUMsQ0FBQzs7aUJBQ2hDO2VBQ0Y7QUFDRCxrQkFBRyxJQUFJLEVBQUU7QUFDUCxzQkFBSyxLQUFLLEVBQUUsQ0FBQztlQUNkOztBQUVELHFCQUFPLEVBQUUsQ0FBQzthQUNYLE1BQU0sSUFBRyxNQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUU7OztBQUc3QixrQkFBSSxPQUFPLEdBQUcsTUFBSyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRWpDLHFCQUFNLE1BQUssT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDNUMsdUJBQU8sR0FBRyxNQUFLLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztlQUM5Qjs7QUFFRCxrQkFBRyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTs7QUFDNUIsb0JBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsQixzQkFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDOztBQUUvQiwwQkFBUSxDQUFDLEdBQUcsQ0FBQzsyQkFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO21CQUFBLENBQUMsQ0FBQzs7ZUFDbEMsTUFBTTtBQUNMLHNCQUFLLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7ZUFDbkM7YUFDRixNQUFNO0FBQ0wsb0JBQUssUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNuQzs7QUFFRCxtQkFBTyxFQUFFLENBQUM7V0FDWDtTQUFBOztBQUVELFNBQUc7ZUFBQSxhQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUU7OztBQUNuQixpQkFBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU8sRUFBSTtBQUM1QixrQkFBSyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztXQUMzQyxDQUFDLENBQUM7U0FDSjs7QUFFRCxXQUFLO2VBQUEsaUJBQXdCOzs7Y0FBdkIsRUFBRSxnQ0FBRyxJQUFJLFVBQVUsRUFBRTs7QUFDekIsY0FBRyxFQUFFLEVBQUUsWUFBWSxVQUFVLENBQUEsQUFBQyxFQUFFO0FBQUUsa0JBQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztXQUFFO0FBQ2xHLGNBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFO0FBQUUsbUJBQU8sRUFBRSxDQUFDO1dBQUU7O0FBRTdCLGNBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDdEIsZ0JBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRW5DLG1CQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDaEQsa0JBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRWpDLGtCQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUU7O0FBQ2hCLHNCQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFO3NCQUN2QixHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQzs7QUFFekIsMEJBQVEsQ0FBQyxHQUFHLENBQUM7MkJBQU0sS0FBSyxFQUFFO21CQUFBLENBQUMsQ0FBQztBQUM1Qix3QkFBSyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7O2VBQ25CO2FBQ0Y7O0FBRUQsY0FBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1dBQ3JCLE1BQU0sSUFBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUM5QixnQkFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFakMsbUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQzVDLG9CQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUM5Qjs7QUFFRCxnQkFBRyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTs7QUFDMUIsb0JBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUU7b0JBQ2xCLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFO29CQUN2QixHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQzs7QUFFekIsd0JBQVEsQ0FBQyxHQUFHLENBQUM7eUJBQU0sS0FBSyxFQUFFO2lCQUFBLENBQUMsQ0FBQztBQUM1QixvQkFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzthQUNYLE1BQU0sSUFBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDcEIsa0JBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFZixrQkFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDOztBQUV2QixrQkFBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUN0QixvQkFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztlQUM3QixNQUFNO0FBQ0wsb0JBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztlQUNaO2FBQ0YsTUFBTTtBQUNMLGtCQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNsQztXQUNGLE1BQU07QUFDTCxnQkFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7V0FDbEM7O0FBRUQsaUJBQU8sRUFBRSxDQUFDO1NBQ1g7O0FBRUQsVUFBSTtlQUFBLGNBQUMsVUFBVSxFQUFFOzs7QUFDZixpQkFBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU8sRUFBSTtBQUM1QixrQkFBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQ3ZDLENBQUMsQ0FBQztTQUNKOztBQUVELFVBQUk7ZUFBQSxjQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUU7QUFDWixpQkFBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUNsQzs7QUFFRCxXQUFLO2VBQUEsaUJBQUc7OztBQUNOLGNBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtBQUNaLGdCQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzs7QUFFckIsZ0JBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQzdCLGtCQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDaEI7O0FBRUQsbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDMUIsa0JBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRS9CLGtCQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7O0FBQ2Ysc0JBQUksR0FBRyxHQUFHLE1BQUssT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJO3NCQUN4RCxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDOztBQUU3QiwwQkFBUSxDQUFDLEdBQUcsQ0FBQzsyQkFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO21CQUFBLENBQUMsQ0FBQzs7ZUFDbEM7YUFDRjtXQUNGO1NBQ0Y7O0FBRUcsVUFBSTthQUFBLFlBQUc7QUFDVCxpQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3JCOzs7O1dBekxHLE9BQU87Ozs7Ozs7Ozs7Ozs7OztBQzFDYixNQUFJLG9CQUFvQixHQUFHLEFBQUMsT0FBTyxZQUFZLEtBQUssVUFBVSxHQUFJLFVBQVMsRUFBRSxFQUFFO0FBQzdFLFdBQU8sWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0dBQ3pCLEdBQUcsVUFBUyxFQUFFLEVBQUU7QUFDZixXQUFPLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUN2QixDQUFDOztNQUVJLFFBQVE7QUFDRCxhQURQLFFBQVEsQ0FDQSxhQUFhLEVBQUU7NEJBRHZCLFFBQVE7O0FBRVYsVUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLElBQUksb0JBQW9CLENBQUM7QUFDNUQsVUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7S0FDbEI7O2lCQUpHLFFBQVE7QUFNWixTQUFHO2VBQUEsYUFBQyxFQUFFLEVBQUU7OztBQUNOLGNBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDOztBQUVyQixjQUFJLENBQUMsY0FBYyxDQUFDLFlBQU07QUFDeEIsbUJBQU0sTUFBSyxNQUFNLENBQUMsTUFBTSxFQUFFOztBQUV4QixvQkFBSyxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQzthQUN2QjtXQUNGLENBQUMsQ0FBQztTQUNKOzs7O1dBZkcsUUFBUTs7Ozs7Ozs7QUNSZCxNQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7OztBQUd6QixNQUFHLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO0FBQ3RELGdCQUFZLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztHQUNuQyxNQUFNLElBQUcsT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO0FBQ3ZDLFFBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQztBQUNoQixRQUFJO0FBQ0Ysa0JBQVksR0FBRyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNwQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUU7R0FDZjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01DUEssY0FBYztBQUNQLGFBRFAsY0FBYyxDQUNOLEtBQUssRUFBRSxRQUFRLEVBQUU7NEJBRHpCLGNBQWM7O0FBRWhCLGlDQUZFLGNBQWMsNkNBRVYsS0FBSyxFQUFFO0FBQ2IsVUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7S0FDMUI7O2NBSkcsY0FBYzs7aUJBQWQsY0FBYztBQUtsQixZQUFNO2VBQUEsa0JBQUc7QUFDUCxjQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsNENBUEUsY0FBYyx3Q0FPTTtTQUN2Qjs7OztXQVJHLGNBQWM7S0FBUyxVQUFVOztBQVloQyxXQUFTLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDekIsUUFBSSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQzs7QUFFMUIsUUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLEdBQUcsRUFBSTtBQUNoQyxVQUFJLEVBQUUsWUFBQSxDQUFDOztBQUVQLFVBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTs7OztnQ0FDSCxHQUFHO2NBQWYsRUFBRTtjQUFFLEdBQUc7O0FBRWIsWUFBRSxHQUFHLElBQUksY0FBYyxDQUFDLEdBQUcsRUFBRSxZQUFNO0FBQ2pDLHVCQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQztxQkFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUs7YUFBQSxDQUFDLENBQUM7V0FDNUMsQ0FBQyxDQUFDOztBQUVILFlBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFXO0FBQ2hDLGlCQUFLLENBQUMsSUFBSSxDQUFDLENBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBRSxDQUFDLENBQUMsS0FBSyxDQUFDO3FCQUFNLEtBQUssQ0FBQyxLQUFLLEVBQUU7YUFBQSxDQUFDLENBQUM7V0FDcEQsQ0FBQyxDQUFDOztPQUVKLE1BQU07O0FBRUwsVUFBRSxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxZQUFNO0FBQ2xDLHFCQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQzttQkFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUs7V0FBQSxDQUFDLENBQUM7U0FDNUMsQ0FBQyxDQUFDOztBQUVILFdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVMsR0FBRyxFQUFFO0FBQ2hDLGVBQUssQ0FBQyxJQUFJLENBQUMsQ0FBRSxHQUFHLEVBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7bUJBQU0sS0FBSyxDQUFDLEtBQUssRUFBRTtXQUFBLENBQUMsQ0FBQztTQUNyRCxDQUFDLENBQUM7T0FDSjs7QUFFRCxhQUFPLEVBQUUsQ0FBQztLQUNYLENBQUMsQ0FBQzs7QUFFSCxXQUFPLEtBQUssQ0FBQztHQUNkOztBQUVNLFdBQVMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUMxQixRQUFJLEVBQUUsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQ3ZCLGNBQVUsQ0FBQyxZQUFNO0FBQUUsUUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN0QyxXQUFPLEVBQUUsQ0FBQztHQUNYOztBQUVNLFdBQVMsYUFBYSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFpQztRQUEvQixxQkFBcUIsZ0NBQUcsS0FBSzs7QUFDakYsYUFBUyxJQUFJLENBQUMsR0FBRyxFQUFFO0FBQ2pCLFVBQUcsR0FBRyxLQUFLLElBQUksRUFBRTtBQUNmLGVBQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVMsU0FBUyxFQUFFO0FBQ3ZELGVBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVMsTUFBTSxFQUFFO0FBQ3pDLGdCQUFHLE1BQU0sRUFBRTtBQUNULGtCQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3hCO1dBQ0YsQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO09BQ0osTUFBTSxJQUFHLHFCQUFxQixFQUFFO0FBQy9CLGFBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztPQUNmO0tBQ0Y7O0FBRUQsUUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUN4Qjs7Ozs7QUFJTSxXQUFTLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO0FBQ3JDLFFBQUksS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUVuQyxhQUFTLEtBQUssR0FBRztBQUNmLFVBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHLEVBQUk7QUFDdEIsWUFBRyxHQUFHLEtBQUssSUFBSSxFQUFFO0FBQ2YsZUFBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2YsTUFBTTtBQUNMLGVBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCO09BQ0YsQ0FBQyxDQUFDO0tBQ0o7QUFDRCxTQUFLLEVBQUUsQ0FBQzs7QUFFUixXQUFPLEtBQUssQ0FBQztHQUNkOzs7Ozs7Ozs7OztBQ3RGRCxNQUFJLElBQUksR0FBRyxVQUFBLENBQUMsRUFBSTtBQUNkLFdBQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0dBQ2QsQ0FBQzs7QUFFRixNQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7QUFDbEIsTUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDOztBQUV4QixNQUFJLENBQUMsSUFBSSxHQUFHLFVBQUEsS0FBSyxFQUFJO0FBQ25CLFFBQUksU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUM7O0FBRTlCLFFBQUksR0FBRyxFQUFFLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQzdCLGVBQVMsR0FBRyxPQUFPLENBQUM7QUFDcEIsY0FBUSxHQUFHLE1BQU0sQ0FBQztLQUNuQixDQUFDLENBQUM7O0FBRUgsU0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7YUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUM7S0FBQSxDQUFDLENBQUM7O0FBRWhELFdBQU8sSUFBSSxDQUFDO0dBQ2IsQ0FBQzs7QUFFRixNQUFJLENBQUMsT0FBTyxHQUFHLFVBQUEsR0FBRyxFQUFJO0FBQ3BCLFdBQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNyQixDQUFDIiwiZmlsZSI6ImpzLWNoYW5uZWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypnbG9iYWwgYW5ndWxhcjp0cnVlICovXG5hbmd1bGFyLm1vZHVsZSgnY2hhbm5lbHMnLCBbXSk7IiwiXG4vL1xuLy8gVE9ETzogdGhpcyBpc24ndCBpZGlvbWF0aWNhbGx5IGphdmFzY3JpcHQgKGNvdWxkIHByb2JhYmx5IHVzZSBzbGljZS9zcGxpY2UgdG8gZ29vZCBlZmZlY3QpXG4vL1xuZnVuY3Rpb24gYWNvcHkoc3JjLCBzcmNTdGFydCwgZGVzdCwgZGVzdFN0YXJ0LCBsZW5ndGgpIHtcbiAgZm9yKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgZGVzdFtpICsgZGVzdFN0YXJ0XSA9IHNyY1tpICsgc3JjU3RhcnRdO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFJpbmdCdWZmZXIge1xuICBjb25zdHJ1Y3RvcihzKSB7XG4gICAgbGV0IHNpemUgPSAodHlwZW9mIHMgPT09ICdudW1iZXInKSA/IE1hdGgubWF4KDEsIHMpIDogMTtcbiAgICB0aGlzLl90YWlsICAgPSAwO1xuICAgIHRoaXMuX2hlYWQgICA9IDA7XG4gICAgdGhpcy5fbGVuZ3RoID0gMDtcbiAgICB0aGlzLl92YWx1ZXMgPSBuZXcgQXJyYXkoc2l6ZSk7XG4gIH1cblxuICBwb3AoKSB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZih0aGlzLmxlbmd0aCkge1xuICAgICAgLy8gR2V0IHRoZSBpdGVtIG91dCBvZiB0aGUgc2V0IG9mIHZhbHVlc1xuICAgICAgcmVzdWx0ID0gKHRoaXMuX3ZhbHVlc1t0aGlzLl90YWlsXSAhPT0gbnVsbCkgPyB0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gOiBudWxsO1xuXG4gICAgICAvLyBSZW1vdmUgdGhlIGl0ZW0gZnJvbSB0aGUgc2V0IG9mIHZhbHVlcywgdXBkYXRlIGluZGljaWVzXG4gICAgICB0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gPSBudWxsO1xuICAgICAgdGhpcy5fdGFpbCA9ICh0aGlzLl90YWlsICsgMSkgJSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuICAgICAgdGhpcy5fbGVuZ3RoIC09IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICB1bnNoaWZ0KHZhbCkge1xuICAgIHRoaXMuX3ZhbHVlc1t0aGlzLl9oZWFkXSA9IHZhbDtcbiAgICB0aGlzLl9oZWFkID0gKHRoaXMuX2hlYWQgKyAxKSAlIHRoaXMuX3ZhbHVlcy5sZW5ndGg7XG4gICAgdGhpcy5fbGVuZ3RoICs9IDE7XG4gIH1cblxuICByZXNpemluZ1Vuc2hpZnQodmFsKSB7XG4gICAgaWYodGhpcy5sZW5ndGggKyAxID09PSB0aGlzLl92YWx1ZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgIH1cbiAgICB0aGlzLnVuc2hpZnQodmFsKTtcbiAgfVxuXG4gIHJlc2l6ZSgpIHtcbiAgICBsZXQgbmV3QXJyeSA9IG5ldyBBcnJheSh0aGlzLl92YWx1ZXMubGVuZ3RoICogMik7XG5cbiAgICBpZih0aGlzLl90YWlsIDwgdGhpcy5faGVhZCkge1xuICAgICAgYWNvcHkodGhpcy5fdmFsdWVzLCB0aGlzLl90YWlsLCBuZXdBcnJ5LCAwLCB0aGlzLl9oZWFkKTtcblxuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gdGhpcy5sZW5ndGg7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuXG4gICAgfSBlbHNlIGlmKHRoaXMuX2hlYWQgPCB0aGlzLl90YWlsKSB7XG4gICAgICBhY29weSh0aGlzLl92YWx1ZXMsIDAsIG5ld0FycnksIHRoaXMuX3ZhbHVlcy5sZW5ndGggLSB0aGlzLl90YWlsLCB0aGlzLl9oZWFkKTtcblxuICAgICAgdGhpcy5fdGFpbCA9IDA7XG4gICAgICB0aGlzLl9oZWFkID0gdGhpcy5sZW5ndGg7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IDA7XG4gICAgICB0aGlzLl92YWx1ZXMgPSBuZXdBcnJ5O1xuICAgIH1cbiAgfVxuXG4gIGNsZWFudXAoa2VlcCkge1xuICAgIGZvcihsZXQgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgbGV0IGl0ZW0gPSB0aGlzLnBvcCgpO1xuXG4gICAgICBpZihrZWVwKGl0ZW0pKSB7XG4gICAgICAgIHRoaXMudW5zaGlmdChpdGVtKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgRml4ZWRCdWZmZXIge1xuICBjb25zdHJ1Y3RvcihuKSB7XG4gICAgdGhpcy5fYnVmID0gbmV3IFJpbmdCdWZmZXIobik7XG4gICAgdGhpcy5fc2l6ZSA9IG47XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5wb3AoKTtcbiAgfVxuXG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5mdWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgYWRkIHRvIGEgZnVsbCBidWZmZXIuXCIpO1xuICAgIH1cbiAgICB0aGlzLl9idWYucmVzaXppbmdVbnNoaWZ0KHYpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9idWYubGVuZ3RoO1xuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5sZW5ndGggPT09IHRoaXMuX3NpemU7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgRHJvcHBpbmdCdWZmZXIgZXh0ZW5kcyBGaXhlZEJ1ZmZlciB7XG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5fYnVmLmxlbmd0aCA8IHRoaXMuX3NpemUpIHtcbiAgICAgIHRoaXMuX2J1Zi51bnNoaWZ0KHYpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFNsaWRpbmdCdWZmZXIgZXh0ZW5kcyBGaXhlZEJ1ZmZlciB7XG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldCBmdWxsKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgeyBEcm9wcGluZ0J1ZmZlciwgU2xpZGluZ0J1ZmZlciwgRml4ZWRCdWZmZXIsIFJpbmdCdWZmZXIgfTsiLCJcbmltcG9ydCB7IEZpeGVkQnVmZmVyLCBSaW5nQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVycy5qc1wiO1xuaW1wb3J0IHsgRGlzcGF0Y2ggfSBmcm9tIFwiLi9kaXNwYXRjaC5qc1wiO1xuaW1wb3J0IHsgUHJvbWlzZSB9IGZyb20gXCIuL3Byb21pc2UuanNcIjtcbmltcG9ydCB7IHRyYW5zZHVjZXJzIH0gZnJvbSBcIi4vdHJhbnNkdWNlcnMuanNcIjtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyKSB7XG4gICAgdGhpcy5vZmZlcmVkID0gb2ZmZXI7XG4gICAgdGhpcy5yZWNlaXZlZCA9IG51bGw7XG4gICAgdGhpcy5yZXNvbHZlZCA9IGZhbHNlO1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IFtdO1xuICB9XG5cbiAgY29tbWl0KCkge1xuICAgIHJldHVybiAodmFsKSA9PiB7XG4gICAgICBpZih0aGlzLnJlc29sdmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHJlc29sdmUgdHJhbnNhY3RvciB0d2ljZSFcIik7XG4gICAgICB9XG4gICAgICB0aGlzLnJlY2VpdmVkID0gdmFsO1xuICAgICAgdGhpcy5yZXNvbHZlZCA9IHRydWU7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5mb3JFYWNoKGMgPT4gYyh2YWwpKTtcblxuICAgICAgcmV0dXJuIHRoaXMub2ZmZXJlZDtcbiAgICB9O1xuICB9XG5cbiAgZGVyZWYoY2FsbGJhY2spIHtcbiAgICBpZih0aGlzLnJlc29sdmVkKSB7XG4gICAgICBjYWxsYmFjayh0aGlzLnJlY2VpdmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9XG59XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubGV0IGRpc3BhdGNoID0gbmV3IERpc3BhdGNoKCk7XG5cbmNsYXNzIENoYW5uZWwge1xuICBjb25zdHJ1Y3RvcihzaXplT3JCdWYsIHhmb3JtKSB7XG4gICAgaWYoIXRyYW5zZHVjZXJzICYmIHhmb3JtKSB7XG4gICAgICBjb25zb2xlLmluZm8oXCJVc2luZyBhIHRyYW5zZHVjZXIgcmVxdWlyZXMgdHJhbnNkdWNlcnMtanMgPGh0dHBzOi8vZ2l0aHViLmNvbS9jb2duaXRlY3QtbGFicy90cmFuc2R1Y2Vycy1qcz5cIik7XG4gICAgfVxuICAgIGlmKCFzaXplT3JCdWYgJiYgeGZvcm0gJiYgdHJhbnNkdWNlcnMpIHtcbiAgICAgIGNvbnNvbGUuaW5mbyhcIlRyYW5zZHVjZXJzIHdpbGwgYmUgaWdub3JlZCBmb3IgdW5idWZmZXJlZCBjaGFubmVscy5cIik7XG4gICAgfVxuXG4gICAgLy8gQWRkcyB2YWx1ZSB0byB0aGUgYnVmZmVyOlxuICAgIC8vIGRvQWRkKCkgPT4gQnVmZmVyXG4gICAgLy8gZG9BZGQodmFsKSA9PiBCdWZmZXJcbiAgICBsZXQgZG9BZGQgPSAoYnVmLCB2YWwpID0+IGJ1Zi5hZGQodmFsKTtcblxuICAgIHRoaXMuX2J1ZmZlciAgICA9IChzaXplT3JCdWYgaW5zdGFuY2VvZiBGaXhlZEJ1ZmZlcikgPyBzaXplT3JCdWYgOiBuZXcgRml4ZWRCdWZmZXIoc2l6ZU9yQnVmIHx8IDApO1xuICAgIHRoaXMuX3Rha2VycyAgICA9IG5ldyBSaW5nQnVmZmVyKDMyKTtcbiAgICB0aGlzLl9wdXR0ZXJzICAgPSBuZXcgUmluZ0J1ZmZlcigzMik7XG4gICAgdGhpcy5feGZvcm1lciAgID0geGZvcm0gJiYgdHJhbnNkdWNlcnMgPyB4Zm9ybSh0cmFuc2R1Y2Vycy53cmFwKGRvQWRkKSkgOiBkb0FkZDtcblxuICAgIHRoaXMuX2lzT3BlbiA9IHRydWU7XG4gIH1cblxuICBfaW5zZXJ0KHZhbCkge1xuICAgIGlmKHRyYW5zZHVjZXJzKSB7XG4gICAgICBpZih2YWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3hmb3JtZXIuc3RlcCh0aGlzLl9idWZmZXIsIHZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5feGZvcm1lci5yZXN1bHQodGhpcy5fYnVmZmVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYodmFsKSB7XG4gICAgICB0aGlzLl94Zm9ybWVyKHRoaXMuX2J1ZmZlciwgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZmlsbCh2YWwsIHR4ID0gbmV3IFRyYW5zYWN0b3IodmFsKSkge1xuICAgIGlmKHZhbCA9PT0gbnVsbCkgeyB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcHV0IG51bGwgdG8gYSBjaGFubmVsLlwiKTsgfVxuICAgIGlmKCEodHggaW5zdGFuY2VvZiBUcmFuc2FjdG9yKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgVHJhbnNhY3RvciB0byBiZSBwYXNzZWQgdG8gZmlsbFwiKTsgfVxuICAgIGlmKCF0eC5hY3RpdmUpIHsgcmV0dXJuIHR4OyB9XG5cbiAgICBpZighdGhpcy5vcGVuKSB7XG4gICAgICAvLyBFaXRoZXIgc29tZWJvZHkgaGFzIHJlc29sdmVkIHRoZSBoYW5kbGVyIGFscmVhZHkgKHRoYXQgd2FzIGZhc3QpIG9yIHRoZSBjaGFubmVsIGlzIGNsb3NlZC5cbiAgICAgIC8vIGNvcmUuYXN5bmMgcmV0dXJucyBhIGJvb2xlYW4gb2Ygd2hldGhlciBvciBub3Qgc29tZXRoaW5nICpjb3VsZCogZ2V0IHB1dCB0byB0aGUgY2hhbm5lbFxuICAgICAgLy8gd2UnbGwgZG8gdGhlIHNhbWUgI2NhcmdvY3VsdFxuICAgICAgdHguY29tbWl0KCkoZmFsc2UpO1xuICAgIH1cblxuICAgIGlmKCF0aGlzLl9idWZmZXIuZnVsbCkge1xuICAgICAgLy8gVGhlIGNoYW5uZWwgaGFzIHNvbWUgZnJlZSBzcGFjZS4gU3RpY2sgaXQgaW4gdGhlIGJ1ZmZlciBhbmQgdGhlbiBkcmFpbiBhbnkgd2FpdGluZyB0YWtlcy5cbiAgICAgIHR4LmNvbW1pdCgpKHRydWUpO1xuXG4gICAgICBsZXQgZG9uZSA9IHRyYW5zZHVjZXJzID8gdHJhbnNkdWNlcnMucmVkdWNlZCh0aGlzLl9pbnNlcnQodmFsKSkgOiB0aGlzLl9pbnNlcnQodmFsKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiB0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgIGxldCB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHYgPSB0aGlzLl9idWZmZXIucmVtb3ZlKCk7XG4gICAgICAgICAgbGV0IHRha2VyQ2IgPSB0YWtlclR4LmNvbW1pdCgpO1xuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VyQ2IodikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZihkb25lKSB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHR4O1xuICAgIH0gZWxzZSBpZih0aGlzLl90YWtlcnMubGVuZ3RoKSB7XG4gICAgICAvLyBUaGUgYnVmZmVyIGlzIGZ1bGwgYnV0IHRoZXJlIGFyZSB3YWl0aW5nIHRha2VycyAoZS5nLiB0aGUgYnVmZmVyIGlzIHNpemUgemVybylcblxuICAgICAgbGV0IHRha2VyVHggPSB0aGlzLl90YWtlcnMucG9wKCk7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3Rha2Vycy5sZW5ndGggJiYgIXRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgIHRha2VyVHggPSB0aGlzLl90YWtlcnMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHRha2VyVHggJiYgdGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgdHguY29tbWl0KCkodHJ1ZSk7XG4gICAgICAgIGxldCB0YWtlckNiID0gdGFrZXJUeC5jb21taXQoKTtcblxuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3B1dHRlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHV0dGVycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgIH1cblxuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHB1dCh2YWwsIHRyYW5zYWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmZpbGwodmFsLCB0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRyYWluKHR4ID0gbmV3IFRyYW5zYWN0b3IoKSkge1xuICAgIGlmKCEodHggaW5zdGFuY2VvZiBUcmFuc2FjdG9yKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgVHJhbnNhY3RvciB0byBiZSBwYXNzZWQgdG8gZHJhaW5cIik7IH1cbiAgICBpZighdHguYWN0aXZlKSB7IHJldHVybiB0eDsgfVxuXG4gICAgaWYodGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgbGV0IGJ1ZlZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcblxuICAgICAgd2hpbGUoIXRoaXMuX2J1ZmZlci5mdWxsICYmIHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLl9wdXR0ZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHB1dHRlci5hY3RpdmUpIHtcbiAgICAgICAgICBsZXQgcHV0VHggPSBwdXR0ZXIuY29tbWl0KCksXG4gICAgICAgICAgICAgIHZhbCA9IHB1dHRlci5vZmZlcmVkOyAvLyBLaW5kYSBicmVha2luZyB0aGUgcnVsZXMgaGVyZVxuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHB1dFR4KCkpO1xuICAgICAgICAgIHRoaXMuX2luc2VydCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHR4LmNvbW1pdCgpKGJ1ZlZhbCk7XG4gICAgfSBlbHNlIGlmKHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICBsZXQgcHV0dGVyID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fcHV0dGVycy5sZW5ndGggJiYgIXB1dHRlci5hY3RpdmUpIHtcbiAgICAgICAgcHV0dGVyID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYocHV0dGVyICYmIHB1dHRlci5hY3RpdmUpIHtcbiAgICAgICAgbGV0IHR4Q2IgPSB0eC5jb21taXQoKSxcbiAgICAgICAgICAgIHB1dFR4ID0gcHV0dGVyLmNvbW1pdCgpLFxuICAgICAgICAgICAgdmFsID0gcHV0dGVyLm9mZmVyZWQ7XG5cbiAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHB1dFR4KCkpO1xuICAgICAgICB0eENiKHZhbCk7XG4gICAgICB9IGVsc2UgaWYoIXRoaXMub3Blbikge1xuICAgICAgICB0aGlzLl9pbnNlcnQoKTtcblxuICAgICAgICBsZXQgdHhDYiA9IHR4LmNvbW1pdCgpO1xuXG4gICAgICAgIGlmKHRoaXMuX2J1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICB0eENiKHRoaXMuX2J1ZmZlci5yZW1vdmUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHhDYihudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fdGFrZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Rha2Vycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgIH1cblxuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHRha2UodHJhbnNhY3Rvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMuZHJhaW4odHJhbnNhY3RvcikuZGVyZWYocmVzb2x2ZSk7XG4gICAgfSk7XG4gIH1cblxuICB0aGVuKGZuLCBlcnIpIHtcbiAgICByZXR1cm4gdGhpcy50YWtlKCkudGhlbihmbiwgZXJyKTtcbiAgfVxuXG4gIGNsb3NlKCkge1xuICAgIGlmKHRoaXMub3Blbikge1xuICAgICAgdGhpcy5faXNPcGVuID0gZmFsc2U7XG5cbiAgICAgIGlmKHRoaXMuX3B1dHRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMuX2luc2VydCgpO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAodGhpcy5fdGFrZXJzLmxlbmd0aCkge1xuICAgICAgICBsZXQgdGFrZXIgPSB0aGlzLl90YWtlcnMucG9wKCk7XG5cbiAgICAgICAgaWYodGFrZXIuYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHZhbCA9IHRoaXMuX2J1ZmZlci5sZW5ndGggPyB0aGlzLl9idWZmZXIucmVtb3ZlKCkgOiBudWxsLFxuICAgICAgICAgICAgICB0YWtlckNiID0gdGFrZXIuY29tbWl0KCk7XG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldCBvcGVuKCkge1xuICAgIHJldHVybiB0aGlzLl9pc09wZW47XG4gIH1cbn1cblxuZXhwb3J0IHsgQ2hhbm5lbCwgVHJhbnNhY3RvciB9OyIsIlxuLyogZ2xvYmFsIHNldEltbWVkaWF0ZTp0cnVlICovXG5sZXQgZGVmYXVsdEFzeW5jaHJvbml6ZXIgPSAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJykgPyBmdW5jdGlvbihmbikge1xuICByZXR1cm4gc2V0SW1tZWRpYXRlKGZuKTtcbn0gOiBmdW5jdGlvbihmbikge1xuICByZXR1cm4gc2V0VGltZW91dChmbik7XG59O1xuXG5jbGFzcyBEaXNwYXRjaCB7XG4gIGNvbnN0cnVjdG9yKGFzeW5jaHJvbml6ZXIpIHtcbiAgICB0aGlzLl9hc3luY2hyb25pemVyID0gYXN5bmNocm9uaXplciB8fCBkZWZhdWx0QXN5bmNocm9uaXplcjtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICB9XG5cbiAgcnVuKGZuKSB7XG4gICAgdGhpcy5fcXVldWUucHVzaChmbik7XG5cbiAgICB0aGlzLl9hc3luY2hyb25pemVyKCgpID0+IHtcbiAgICAgIHdoaWxlKHRoaXMuX3F1ZXVlLmxlbmd0aCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiUVVFVUVcIiwgdGhpcy5fcXVldWVbMF0pO1xuICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuXG5leHBvcnQgeyBEaXNwYXRjaCB9OyIsInZhciBfdHJhbnNkdWNlcnMgPSBmYWxzZTtcblxuLyogZ2xvYmFsIHJlcXVpcmU6dHJ1ZSAqL1xuaWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnRyYW5zZHVjZXJzKSB7XG4gIF90cmFuc2R1Y2VycyA9IHdpbmRvdy50cmFuc2R1Y2Vycztcbn0gZWxzZSBpZih0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICBsZXQgciA9IHJlcXVpcmU7IC8vIFRyaWNrIGJyb3dzZXJpZnlcbiAgdHJ5IHtcbiAgICBfdHJhbnNkdWNlcnMgPSByKCd0cmFuc2R1Y2Vycy1qcycpO1xuICB9IGNhdGNoIChlKSB7fVxufVxuXG5leHBvcnQgeyBfdHJhbnNkdWNlcnMgYXMgdHJhbnNkdWNlcnMgfTtcbiIsImltcG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfSBmcm9tIFwiLi9jaGFubmVscy5qc1wiO1xuXG5cbmNsYXNzIEFsdHNUcmFuc2FjdG9yIGV4dGVuZHMgVHJhbnNhY3RvciB7XG4gIGNvbnN0cnVjdG9yKG9mZmVyLCBjb21taXRDYikge1xuICAgIHN1cGVyKG9mZmVyKTtcbiAgICB0aGlzLmNvbW1pdENiID0gY29tbWl0Q2I7XG4gIH1cbiAgY29tbWl0KCkge1xuICAgIHRoaXMuY29tbWl0Q2IoKTtcbiAgICByZXR1cm4gc3VwZXIuY29tbWl0KCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWx0cyhyYWNlKSB7XG4gIGxldCBvdXRDaCA9IG5ldyBDaGFubmVsKCk7XG5cbiAgbGV0IHRyYW5zYWN0b3JzID0gcmFjZS5tYXAoY21kID0+IHtcbiAgICBsZXQgdHg7XG5cbiAgICBpZihBcnJheS5pc0FycmF5KGNtZCkpIHtcbiAgICAgIGxldCBbIGNoLCB2YWwgXSA9IGNtZDtcblxuICAgICAgdHggPSBuZXcgQWx0c1RyYW5zYWN0b3IodmFsLCAoKSA9PiB7XG4gICAgICAgIHRyYW5zYWN0b3JzLmZvckVhY2goaCA9PiBoLmFjdGl2ZSA9IGZhbHNlKTtcbiAgICAgIH0pO1xuXG4gICAgICBjaC5maWxsKHZhbCwgdHgpLmRlcmVmKGZ1bmN0aW9uKCkge1xuICAgICAgICBvdXRDaC5maWxsKFsgdmFsLCBjaCBdKS5kZXJlZigoKSA9PiBvdXRDaC5jbG9zZSgpKTtcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgdHggPSBuZXcgQWx0c1RyYW5zYWN0b3IodHJ1ZSwgKCkgPT4ge1xuICAgICAgICB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSk7XG4gICAgICB9KTtcblxuICAgICAgY21kLmRyYWluKHR4KS5kZXJlZihmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgb3V0Q2guZmlsbChbIHZhbCwgY21kIF0pLmRlcmVmKCgpID0+IG91dENoLmNsb3NlKCkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9KTtcblxuICByZXR1cm4gb3V0Q2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lb3V0KG1zKSB7XG4gIHZhciBjaCA9IG5ldyBDaGFubmVsKCk7XG4gIHNldFRpbWVvdXQoKCkgPT4geyBjaC5jbG9zZSgpOyB9LCBtcyk7XG4gIHJldHVybiBjaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBpcGVsaW5lQXN5bmMoaW5jaCwgY29udmVydGVyLCBvdXRjaCwgc2hvdWxkQ2xvc2VEb3duc3RyZWFtID0gZmFsc2UpIHtcbiAgZnVuY3Rpb24gdGFrZSh2YWwpIHtcbiAgICBpZih2YWwgIT09IG51bGwpIHtcbiAgICAgIFByb21pc2UucmVzb2x2ZShjb252ZXJ0ZXIodmFsKSkudGhlbihmdW5jdGlvbihjb252ZXJ0ZWQpIHtcbiAgICAgICAgb3V0Y2gucHV0KGNvbnZlcnRlZCkudGhlbihmdW5jdGlvbihkaWRQdXQpIHtcbiAgICAgICAgICBpZihkaWRQdXQpIHtcbiAgICAgICAgICAgIGluY2gudGFrZSgpLnRoZW4odGFrZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZihzaG91bGRDbG9zZURvd25zdHJlYW0pIHtcbiAgICAgIG91dGNoLmNsb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgaW5jaC50YWtlKCkudGhlbih0YWtlKTtcbn1cblxuLy8gRW5mb3JjZXMgb3JkZXIgcmVzb2x1dGlvbiBvbiByZXN1bHRpbmcgY2hhbm5lbFxuLy8gVGhpcyBtaWdodCBuZWVkIHRvIGJlIHRoZSBkZWZhdWx0IGJlaGF2aW9yLCB0aG91Z2ggdGhhdCByZXF1aXJlcyBtb3JlIHRob3VnaHRcbmV4cG9ydCBmdW5jdGlvbiBvcmRlcihpbmNoLCBzaXplT3JCdWYpIHtcbiAgdmFyIG91dGNoID0gbmV3IENoYW5uZWwoc2l6ZU9yQnVmKTtcblxuICBmdW5jdGlvbiBkcmFpbigpIHtcbiAgICBpbmNoLnRha2UoKS50aGVuKHZhbCA9PiB7XG4gICAgICBpZih2YWwgPT09IG51bGwpIHtcbiAgICAgICAgb3V0Y2guY2xvc2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dGNoLnB1dCh2YWwpLnRoZW4oZHJhaW4pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGRyYWluKCk7XG5cbiAgcmV0dXJuIG91dGNoO1xufVxuIiwiXG5pbXBvcnQgKiBhcyAkcSBmcm9tIFwiJHFcIjtcblxuXG52YXIgUHJvbSA9IHIgPT4ge1xuICByZXR1cm4gJHEocik7XG59O1xuXG5Qcm9tLmFsbCA9ICRxLmFsbDtcblByb20ucmVqZWN0ID0gJHEucmVqZWN0O1xuXG5Qcm9tLnJhY2UgPSBwcm9tcyA9PiB7XG4gIHZhciBkb0Z1bGZpbGwsIGRvUmVqZWN0LCBwcm9tO1xuXG4gIHByb20gPSAkcSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG4gICAgZG9GdWxmaWxsID0gZnVsZmlsbDtcbiAgICBkb1JlamVjdCA9IHJlamVjdDtcbiAgfSk7XG5cbiAgcHJvbXMuZm9yRWFjaChwID0+IHAudGhlbihkb0Z1bGZpbGwsIGRvUmVqZWN0KSk7XG5cbiAgcmV0dXJuIHByb207XG59O1xuXG5Qcm9tLnJlc29sdmUgPSB2YWwgPT4ge1xuICByZXR1cm4gJHEud2hlbih2YWwpO1xufTtcblxuZXhwb3J0IHsgUHJvbSBhcyBQcm9taXNlIH07Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9