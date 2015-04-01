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
angular.module("channels").service("chanChannels", ["chanBuffers", "chanDispatch", "chanPromise", "chanTransducers", function (chanBuffers, chanDispatch, chanPromise, chanTransducers) {
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
}]);
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
angular.module("channels").service("chanUtils", ["chanChannels", function (chanChannels) {
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
}]);
angular.module("channels").service("chanPromise", ["$q", function ($q) {
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
}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYnVmZmVycy5qcyIsImNoYW5uZWxzLmpzIiwiZGlzcGF0Y2guanMiLCJ0cmFuc2R1Y2Vycy5qcyIsInV0aWxzLmpzIiwicHJvbWlzZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLFFBQVEsT0FBTyxZQUFZLElBQUk7QUNEL0IsUUFBUSxPQUFPLFlBQVksUUFBUSxlQUFlLFlBQVk7RUFDNUQsSUFBSSxlQUFlOztFQUVuQixJQUFJLFlBQVksVUFBVSxVQUFVLFlBQVksRUFBRSxJQUFJLE9BQU8sZUFBZSxjQUFjLGVBQWUsTUFBTSxFQUFFLE1BQU0sSUFBSSxVQUFVLDZEQUE2RCxPQUFPLGVBQWUsU0FBUyxZQUFZLE9BQU8sT0FBTyxjQUFjLFdBQVcsV0FBVyxFQUFFLGFBQWEsRUFBRSxPQUFPLFVBQVUsWUFBWSxPQUFPLFVBQVUsTUFBTSxjQUFjLFdBQVcsSUFBSSxZQUFZLFNBQVMsWUFBWTs7RUFFbGEsSUFBSSxlQUFlLENBQUMsWUFBWSxFQUFFLFNBQVMsaUJBQWlCLFFBQVEsT0FBTyxFQUFFLEtBQUssSUFBSSxPQUFPLE9BQU8sRUFBRSxJQUFJLE9BQU8sTUFBTSxNQUFNLEtBQUssZUFBZSxNQUFNLElBQUksS0FBSyxPQUFPLEtBQUssV0FBVyxRQUFRLE9BQU8saUJBQWlCLFFBQVEsVUFBVSxPQUFPLFVBQVUsYUFBYSxZQUFZLGFBQWEsRUFBRSxJQUFJLFlBQVksaUJBQWlCLFlBQVksV0FBVyxhQUFhLElBQUksYUFBYSxpQkFBaUIsYUFBYSxjQUFjLE9BQU87O0VBRTNhLElBQUksa0JBQWtCLFVBQVUsVUFBVSxhQUFhLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixjQUFjLEVBQUUsTUFBTSxJQUFJLFVBQVU7Ozs7O0VBSHpILFNBQVMsTUFBTSxLQUFLLFVBQVUsTUFBTSxXQUFXLFFBQVE7SUFDckQsS0FBSSxJQUFJLElBQUksR0FBRyxJQUFJLFFBQVEsS0FBSyxHQUFHO01BQ2pDLEtBQUssSUFBSSxhQUFhLElBQUksSUFBSTs7Ozs7O0VBY2hDLElBUkksYUFBVSxDQUFBLFlBQUE7SUFDSCxTQURQLFdBQ1EsR0FBRztNQVNYLGdCQUFnQixNQVZoQjs7TUFFRixJQUFJLE9BQU8sT0FBUSxNQUFNLFdBQVksS0FBSyxJQUFJLEdBQUcsS0FBSztNQUN0RCxLQUFLLFFBQVU7TUFDZixLQUFLLFFBQVU7TUFDZixLQUFLLFVBQVU7TUFDZixLQUFLLFVBQVUsSUFBSSxNQUFNOzs7SUFhekIsYUFuQkUsWUFBVTtNQVNkLEtBQUc7UUFZRyxPQVpILFNBQUEsTUFBRztVQUNKLElBQUksU0FBTTtVQUNWLElBQUcsS0FBSyxRQUFROztZQUVkLFNBQVMsS0FBTSxRQUFRLEtBQUssV0FBVyxPQUFRLEtBQUssUUFBUSxLQUFLLFNBQVM7OztZQUcxRSxLQUFLLFFBQVEsS0FBSyxTQUFTO1lBQzNCLEtBQUssUUFBUSxDQUFDLEtBQUssUUFBUSxLQUFLLEtBQUssUUFBUTtZQUM3QyxLQUFLLFdBQVc7aUJBQ1g7WUFDTCxTQUFTOztVQUVYLE9BQU87OztNQUdULFNBQU87UUFhRCxPQWJDLFNBQUEsUUFBQyxLQUFLO1VBQ1gsS0FBSyxRQUFRLEtBQUssU0FBUztVQUMzQixLQUFLLFFBQVEsQ0FBQyxLQUFLLFFBQVEsS0FBSyxLQUFLLFFBQVE7VUFDN0MsS0FBSyxXQUFXOzs7TUFHbEIsaUJBQWU7UUFjVCxPQWRTLFNBQUEsZ0JBQUMsS0FBSztVQUNuQixJQUFHLEtBQUssU0FBUyxNQUFNLEtBQUssUUFBUSxRQUFRO1lBQzFDLEtBQUs7O1VBRVAsS0FBSyxRQUFROzs7TUFHZixRQUFNO1FBZUEsT0FmQSxTQUFBLFNBQUc7VUFDUCxJQUFJLFVBQVUsSUFBSSxNQUFNLEtBQUssUUFBUSxTQUFTOztVQUU5QyxJQUFHLEtBQUssUUFBUSxLQUFLLE9BQU87WUFDMUIsTUFBTSxLQUFLLFNBQVMsS0FBSyxPQUFPLFNBQVMsR0FBRyxLQUFLOztZQUVqRCxLQUFLLFFBQVE7WUFDYixLQUFLLFFBQVEsS0FBSztZQUNsQixLQUFLLFVBQVU7aUJBRVYsSUFBRyxLQUFLLFFBQVEsS0FBSyxPQUFPO1lBQ2pDLE1BQU0sS0FBSyxTQUFTLEdBQUcsU0FBUyxLQUFLLFFBQVEsU0FBUyxLQUFLLE9BQU8sS0FBSzs7WUFFdkUsS0FBSyxRQUFRO1lBQ2IsS0FBSyxRQUFRLEtBQUs7WUFDbEIsS0FBSyxVQUFVO2lCQUVWO1lBQ0wsS0FBSyxRQUFRO1lBQ2IsS0FBSyxRQUFRO1lBQ2IsS0FBSyxVQUFVOzs7O01BSW5CLFNBQU87UUFjRCxPQWRDLFNBQUEsUUFBQyxNQUFNO1VBQ1osS0FBSSxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxHQUFHO1lBQzdDLElBQUksT0FBTyxLQUFLOztZQUVoQixJQUFHLEtBQUssT0FBTztjQUNiLEtBQUssUUFBUTs7Ozs7TUFLZixRQUFNO1FBZUosS0FmSSxZQUFHO1VBQ1gsT0FBTyxLQUFLOzs7OztJQW9CWixPQTdGRTs7Ozs7RUFrR0osSUFuQkksY0FBVyxDQUFBLFlBQUE7SUFDSixTQURQLFlBQ1EsR0FBRztNQW9CWCxnQkFBZ0IsTUFyQmhCOztNQUVGLEtBQUssT0FBTyxJQUFJLFdBQVc7TUFDM0IsS0FBSyxRQUFROzs7SUF3QmIsYUEzQkUsYUFBVztNQU1mLFFBQU07UUF1QkEsT0F2QkEsU0FBQSxTQUFHO1VBQ1AsT0FBTyxLQUFLLEtBQUs7OztNQUduQixLQUFHO1FBd0JHLE9BeEJILFNBQUEsSUFBQyxHQUFHO1VBQ0wsSUFBRyxLQUFLLE1BQU07WUFDWixNQUFNLElBQUksTUFBTTs7VUFFbEIsS0FBSyxLQUFLLGdCQUFnQjs7VUFFMUIsT0FBTzs7O01BR0wsUUFBTTtRQXlCSixLQXpCSSxZQUFHO1VBQ1gsT0FBTyxLQUFLLEtBQUs7OztNQUdmLE1BQUk7UUEwQkYsS0ExQkUsWUFBRztVQUNULE9BQU8sS0FBSyxLQUFLLFdBQVcsS0FBSzs7Ozs7SUErQmpDLE9BdkRFOzs7OztFQTRESixJQTlCSSxpQkFBYyxDQUFBLFVBQUEsY0FBQTtJQStCaEIsU0EvQkUsaUJBQWM7TUFnQ2QsZ0JBQWdCLE1BaENoQjs7TUFrQ0EsSUFBSSxnQkFBZ0IsTUFBTTtRQUN4QixhQUFhLE1BQU0sTUFBTTs7OztJQUk3QixVQXZDRSxnQkFBYzs7SUF5Q2hCLGFBekNFLGdCQUFjO01BQ2xCLEtBQUc7UUEwQ0csT0ExQ0gsU0FBQSxJQUFDLEdBQUc7VUFDTCxJQUFHLEtBQUssS0FBSyxTQUFTLEtBQUssT0FBTztZQUNoQyxLQUFLLEtBQUssUUFBUTs7O1VBR3BCLE9BQU87OztNQUdMLE1BQUk7UUEyQ0YsS0EzQ0UsWUFBRztVQUNULE9BQU87Ozs7O0lBZ0RQLE9BMURFO0tBQXVCOzs7O0VBK0QzQixJQS9DSSxnQkFBYSxDQUFBLFVBQUEsZUFBQTtJQWdEZixTQWhERSxnQkFBYTtNQWlEYixnQkFBZ0IsTUFqRGhCOztNQW1EQSxJQUFJLGlCQUFpQixNQUFNO1FBQ3pCLGNBQWMsTUFBTSxNQUFNOzs7O0lBSTlCLFVBeERFLGVBQWE7O0lBMERmLGFBMURFLGVBQWE7TUFDakIsS0FBRztRQTJERyxPQTNESCxTQUFBLElBQUMsR0FBRztVQUNMLElBQUcsS0FBSyxLQUFLLFdBQVcsS0FBSyxPQUFPO1lBQ2xDLEtBQUs7O1VBRVAsS0FBSyxLQUFLLFFBQVE7O1VBRWxCLE9BQU87OztNQUdMLE1BQUk7UUE0REYsS0E1REUsWUFBRztVQUNULE9BQU87Ozs7O0lBaUVQLE9BNUVFO0tBQXNCOztFQStFMUIsYUFBYSxpQkFBaUI7RUFDOUIsYUFBYSxnQkFBZ0I7RUFDN0IsYUFBYSxjQUFjO0VBQzNCLGFBQWEsYUFBYTtFQUMxQixPQUFPO0dBQ047QUM3TkgsUUFBUSxPQUFPLFlBQVksUUFBUSxrRkFBZ0IsVUFBVSxhQUFhLGNBQWMsYUFBYSxpQkFBaUI7RUFDcEgsSUFBSSxlQUFlOztFQUVuQixJQUFJLGVBQWUsQ0FBQyxZQUFZLEVBQUUsU0FBUyxpQkFBaUIsUUFBUSxPQUFPLEVBQUUsS0FBSyxJQUFJLE9BQU8sT0FBTyxFQUFFLElBQUksT0FBTyxNQUFNLE1BQU0sS0FBSyxlQUFlLE1BQU0sSUFBSSxLQUFLLE9BQU8sS0FBSyxXQUFXLFFBQVEsT0FBTyxpQkFBaUIsUUFBUSxVQUFVLE9BQU8sVUFBVSxhQUFhLFlBQVksYUFBYSxFQUFFLElBQUksWUFBWSxpQkFBaUIsWUFBWSxXQUFXLGFBQWEsSUFBSSxhQUFhLGlCQUFpQixhQUFhLGNBQWMsT0FBTzs7RUFFM2EsSUFBSSxrQkFBa0IsVUFBVSxVQUFVLGFBQWEsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLGNBQWMsRUFBRSxNQUFNLElBQUksVUFBVTs7RUFFdkgsSUFBSSxjQUFjLFlBQVk7RUFDOUIsSUFBSSxhQUFhLFlBQVk7RUFDN0IsSUFBSSxXQUFXLGFBQWE7RUFDNUIsSUFBSSxVQUFVLFlBQVk7RUFDMUIsSUFBSSxjQUFjLGdCQUFnQjs7OztFQUlsQyxJQVBJLGFBQVUsQ0FBQSxZQUFBO0lBQ0gsU0FEUCxXQUNRLE9BQU87TUFRZixnQkFBZ0IsTUFUaEI7O01BRUYsS0FBSyxVQUFVO01BQ2YsS0FBSyxXQUFXO01BQ2hCLEtBQUssV0FBVztNQUNoQixLQUFLLFNBQVM7TUFDZCxLQUFLLFlBQVk7OztJQVlqQixhQWxCRSxZQUFVO01BU2QsUUFBTTtRQVdBLE9BWEEsU0FBQSxTQUFHO1VBWUQsSUFBSSxRQUFROztVQVhsQixPQUFPLFVBQUMsS0FBUTtZQUNkLElBQUcsTUFBSyxVQUFVO2NBQ2hCLE1BQU0sSUFBSSxNQUFNOztZQUVsQixNQUFLLFdBQVc7WUFDaEIsTUFBSyxXQUFXO1lBQ2hCLE1BQUssVUFBVSxRQUFRLFVBQUEsR0FBQztjQWNoQixPQWRvQixFQUFFOzs7WUFFOUIsT0FBTyxNQUFLOzs7O01BSWhCLE9BQUs7UUFnQkMsT0FoQkQsU0FBQSxNQUFDLFVBQVU7VUFDZCxJQUFHLEtBQUssVUFBVTtZQUNoQixTQUFTLEtBQUs7aUJBQ1Q7WUFDTCxLQUFLLFVBQVUsS0FBSzs7Ozs7O0lBc0J0QixPQWhERTs7Ozs7RUFrQ04sSUFBSSxXQUFXLElBQUk7O0VBcUJqQixJQW5CSSxVQUFPLENBQUEsWUFBQTtJQUNBLFNBRFAsUUFDUSxXQUFXLE9BQU87TUFvQjFCLGdCQUFnQixNQXJCaEI7O01BRUYsSUFBRyxDQUFDLGVBQWUsT0FBTztRQUN4QixRQUFRLEtBQUs7O01BRWYsSUFBRyxDQUFDLGFBQWEsU0FBUyxhQUFhO1FBQ3JDLFFBQVEsS0FBSzs7Ozs7O01BTWYsSUFBSSxRQUFRLFVBQUMsS0FBSyxLQUFHO1FBc0JqQixPQXRCc0IsSUFBSSxJQUFJOzs7TUFFbEMsS0FBSyxVQUFjLHFCQUFxQixjQUFlLFlBQVksSUFBSSxZQUFZLGFBQWE7TUFDaEcsS0FBSyxVQUFhLElBQUksV0FBVztNQUNqQyxLQUFLLFdBQWEsSUFBSSxXQUFXO01BQ2pDLEtBQUssV0FBYSxTQUFTLGNBQWMsTUFBTSxZQUFZLEtBQUssVUFBVTs7TUFFMUUsS0FBSyxVQUFVOzs7SUEwQmYsYUE3Q0UsU0FBTztNQXNCWCxTQUFPO1FBeUJELE9BekJDLFNBQUEsUUFBQyxLQUFLO1VBQ1gsSUFBRyxhQUFhO1lBQ2QsSUFBRyxLQUFLO2NBQ04sT0FBTyxLQUFLLFNBQVMsS0FBSyxLQUFLLFNBQVM7bUJBQ25DO2NBQ0wsT0FBTyxLQUFLLFNBQVMsT0FBTyxLQUFLOztpQkFFOUIsSUFBRyxLQUFLO1lBQ2IsS0FBSyxTQUFTLEtBQUssU0FBUzs7VUFFOUIsT0FBTzs7O01BR1QsTUFBSTtRQTBCRSxPQTFCRixTQUFBLEtBQUMsS0FBRztVQTJCQSxJQUFJLFFBQVE7O1VBRVosSUE3QkUsS0FBRSxVQUFBLE9BQUEsWUFBRyxJQUFJLFdBQVcsT0FBSSxVQUFBO1VBOEIxQixPQUFPLENBQUMsWUE5Qm9CO1lBQ2xDLElBQUcsUUFBUSxNQUFNO2NBQUUsTUFBTSxJQUFJLE1BQU07O1lBQ25DLElBQUcsRUFBRSxjQUFjLGFBQWE7Y0FBRSxNQUFNLElBQUksTUFBTTs7WUFDbEQsSUFBRyxDQUFDLEdBQUcsUUFBUTtjQUFFLE9BQU87OztZQUV4QixJQUFHLENBQUMsTUFBSyxNQUFNOzs7O2NBSWIsR0FBRyxTQUFTOzs7WUFHZCxJQUFHLENBQUMsTUFBSyxRQUFRLE1BQU07O2NBRXJCLEdBQUcsU0FBUzs7Y0FFWixJQUFJLE9BQU8sY0FBYyxZQUFZLFFBQVEsTUFBSyxRQUFRLFFBQVEsTUFBSyxRQUFROztjQUUvRSxPQUFNLE1BQUssUUFBUSxVQUFVLE1BQUssUUFBUSxRQUFRO2dCQUNoRCxJQUFJLFVBQVUsTUFBSyxRQUFROztnQkFFM0IsSUFBRyxRQUFRLFFBQVE7a0JBcUNULENBQUMsWUFBWTtvQkFwQ3JCLElBQUksSUFBSSxNQUFLLFFBQVE7b0JBQ3JCLElBQUksVUFBVSxRQUFROztvQkFFdEIsU0FBUyxJQUFJLFlBQUE7c0JBc0NELE9BdENPLFFBQVE7Ozs7O2NBRy9CLElBQUcsTUFBTTtnQkFDUCxNQUFLOzs7Y0FHUCxPQUFPO21CQUNGLElBQUcsTUFBSyxRQUFRLFFBQVE7OztjQUc3QixJQUFJLFVBQVUsTUFBSyxRQUFROztjQUUzQixPQUFNLE1BQUssUUFBUSxVQUFVLENBQUMsUUFBUSxRQUFRO2dCQUM1QyxVQUFVLE1BQUssUUFBUTs7O2NBR3pCLElBQUcsV0FBVyxRQUFRLFFBQVE7Z0JBeUNwQixDQUFDLFlBQVk7a0JBeENyQixHQUFHLFNBQVM7a0JBQ1osSUFBSSxVQUFVLFFBQVE7O2tCQUV0QixTQUFTLElBQUksWUFBQTtvQkEwQ0QsT0ExQ08sUUFBUTs7O3FCQUN0QjtnQkFDTCxNQUFLLFNBQVMsZ0JBQWdCOzttQkFFM0I7Y0FDTCxNQUFLLFNBQVMsZ0JBQWdCOzs7WUFHaEMsT0FBTzs7OztNQUdULEtBQUc7UUE4Q0csT0E5Q0gsU0FBQSxJQUFDLEtBQUssWUFBWTtVQStDYixJQUFJLFFBQVE7O1VBOUNsQixPQUFPLElBQUksUUFBUSxVQUFBLFNBQVc7WUFDNUIsTUFBSyxLQUFLLEtBQUssWUFBWSxNQUFNOzs7O01BSXJDLE9BQUs7UUFpREMsT0FqREQsU0FBQSxRQUF3QjtVQWtEckIsSUFBSSxRQUFROztVQUVaLElBcERGLEtBQUUsVUFBQSxPQUFBLFlBQUcsSUFBSSxlQUFZLFVBQUE7O1VBQ3pCLElBQUcsRUFBRSxjQUFjLGFBQWE7WUFBRSxNQUFNLElBQUksTUFBTTs7VUFDbEQsSUFBRyxDQUFDLEdBQUcsUUFBUTtZQUFFLE9BQU87OztVQUV4QixJQUFHLEtBQUssUUFBUSxRQUFRO1lBQ3RCLElBQUksU0FBUyxLQUFLLFFBQVE7O1lBRTFCLE9BQU0sQ0FBQyxLQUFLLFFBQVEsUUFBUSxLQUFLLFNBQVMsUUFBUTtjQUNoRCxJQUFJLFNBQVMsS0FBSyxTQUFTOztjQUUzQixJQUFHLE9BQU8sUUFBUTtnQkEwRFYsQ0FBQyxZQUFZO2tCQXpEbkIsSUFBSSxRQUFRLE9BQU87c0JBQ2YsTUFBTSxPQUFPOztrQkFFakIsU0FBUyxJQUFJLFlBQUE7b0JBMkRILE9BM0RTOztrQkFDbkIsTUFBSyxRQUFROzs7OztZQUlqQixHQUFHLFNBQVM7aUJBQ1AsSUFBRyxLQUFLLFNBQVMsUUFBUTtZQUM5QixJQUFJLFNBQVMsS0FBSyxTQUFTOztZQUUzQixPQUFNLEtBQUssU0FBUyxVQUFVLENBQUMsT0FBTyxRQUFRO2NBQzVDLFNBQVMsS0FBSyxTQUFTOzs7WUFHekIsSUFBRyxVQUFVLE9BQU8sUUFBUTtjQThEcEIsQ0FBQyxZQUFZO2dCQTdEbkIsSUFBSSxPQUFPLEdBQUc7b0JBQ1YsUUFBUSxPQUFPO29CQUNmLE1BQU0sT0FBTzs7Z0JBRWpCLFNBQVMsSUFBSSxZQUFBO2tCQStESCxPQS9EUzs7Z0JBQ25CLEtBQUs7O21CQUNBLElBQUcsQ0FBQyxLQUFLLE1BQU07Y0FDcEIsS0FBSzs7Y0FFTCxJQUFJLE9BQU8sR0FBRzs7Y0FFZCxJQUFHLEtBQUssUUFBUSxRQUFRO2dCQUN0QixLQUFLLEtBQUssUUFBUTtxQkFDYjtnQkFDTCxLQUFLOzttQkFFRjtjQUNMLEtBQUssUUFBUSxnQkFBZ0I7O2lCQUUxQjtZQUNMLEtBQUssUUFBUSxnQkFBZ0I7OztVQUcvQixPQUFPOzs7TUFHVCxNQUFJO1FBa0VFLE9BbEVGLFNBQUEsS0FBQyxZQUFZO1VBbUVULElBQUksUUFBUTs7VUFsRWxCLE9BQU8sSUFBSSxRQUFRLFVBQUEsU0FBVztZQUM1QixNQUFLLE1BQU0sWUFBWSxNQUFNOzs7O01BSWpDLE1BQUk7UUFxRUUsT0FyRUYsU0FBQSxLQUFDLElBQUksS0FBSztVQUNaLE9BQU8sS0FBSyxPQUFPLEtBQUssSUFBSTs7O01BRzlCLE9BQUs7UUFzRUMsT0F0RUQsU0FBQSxRQUFHO1VBdUVBLElBQUksUUFBUTs7VUF0RWxCLElBQUcsS0FBSyxNQUFNO1lBQ1osS0FBSyxVQUFVOztZQUVmLElBQUcsS0FBSyxTQUFTLFdBQVcsR0FBRztjQUM3QixLQUFLOzs7WUFHUCxPQUFPLEtBQUssUUFBUSxRQUFRO2NBQzFCLElBQUksUUFBUSxLQUFLLFFBQVE7O2NBRXpCLElBQUcsTUFBTSxRQUFRO2dCQXlFVCxDQUFDLFlBQVk7a0JBeEVuQixJQUFJLE1BQU0sTUFBSyxRQUFRLFNBQVMsTUFBSyxRQUFRLFdBQVc7c0JBQ3BELFVBQVUsTUFBTTs7a0JBRXBCLFNBQVMsSUFBSSxZQUFBO29CQTBFSCxPQTFFUyxRQUFROzs7Ozs7OztNQU0vQixNQUFJO1FBNkVGLEtBN0VFLFlBQUc7VUFDVCxPQUFPLEtBQUs7Ozs7O0lBa0ZaLE9BMVFFOzs7RUE2UUosYUFBYSxVQUFVO0VBQ3ZCLGFBQWEsYUFBYTtFQUMxQixPQUFPO0lBQ047QUM1VEgsUUFBUSxPQUFPLFlBQVksUUFBUSxnQkFBZ0IsWUFBWTtFQUM3RCxJQUFJLGVBQWU7O0VBRW5CLElBQUksZUFBZSxDQUFDLFlBQVksRUFBRSxTQUFTLGlCQUFpQixRQUFRLE9BQU8sRUFBRSxLQUFLLElBQUksT0FBTyxPQUFPLEVBQUUsSUFBSSxPQUFPLE1BQU0sTUFBTSxLQUFLLGVBQWUsTUFBTSxJQUFJLEtBQUssT0FBTyxLQUFLLFdBQVcsUUFBUSxPQUFPLGlCQUFpQixRQUFRLFVBQVUsT0FBTyxVQUFVLGFBQWEsWUFBWSxhQUFhLEVBQUUsSUFBSSxZQUFZLGlCQUFpQixZQUFZLFdBQVcsYUFBYSxJQUFJLGFBQWEsaUJBQWlCLGFBQWEsY0FBYyxPQUFPOztFQUUzYSxJQUFJLGtCQUFrQixVQUFVLFVBQVUsYUFBYSxFQUFFLElBQUksRUFBRSxvQkFBb0IsY0FBYyxFQUFFLE1BQU0sSUFBSSxVQUFVOzs7RUFIekgsSUFBSSx1QkFBdUIsT0FBUSxpQkFBaUIsYUFBYyxVQUFTLElBQUk7SUFDN0UsT0FBTyxhQUFhO01BQ2xCLFVBQVMsSUFBSTtJQUNmLE9BQU8sV0FBVzs7O0VBU2xCLElBTkksV0FBUSxDQUFBLFlBQUE7SUFDRCxTQURQLFNBQ1EsZUFBZTtNQU92QixnQkFBZ0IsTUFSaEI7O01BRUYsS0FBSyxpQkFBaUIsaUJBQWlCO01BQ3ZDLEtBQUssU0FBUzs7O0lBV2QsYUFkRSxVQUFRO01BTVosS0FBRztRQVVHLE9BVkgsU0FBQSxJQUFDLElBQUk7VUFXQSxJQUFJLFFBQVE7O1VBVmxCLEtBQUssT0FBTyxLQUFLOztVQUVqQixLQUFLLGVBQWUsWUFBTTtZQUN4QixPQUFNLE1BQUssT0FBTyxRQUFROztjQUV4QixNQUFLLE9BQU87Ozs7Ozs7SUFtQmhCLE9BL0JFOzs7RUFrQ0osYUFBYSxXQUFXO0VBQ3hCLE9BQU87R0FDTjtBQzVDSCxRQUFRLE9BQU8sWUFBWSxRQUFRLG1CQUFtQixZQUFZO0VBQ2hFLElBQUksZUFBZTtFQURyQixJQUFJLGVBQWU7OztFQUduQixJQUFHLE9BQU8sV0FBVyxlQUFlLE9BQU8sYUFBYTtJQUN0RCxlQUFlLE9BQU87U0FDakIsSUFBRyxPQUFPLFdBQVcsYUFBYTtJQUN2QyxJQUFJLElBQUk7SUFDUixJQUFJO01BQ0YsZUFBZSxFQUFFO01BQ2pCLE9BQU8sR0FBRzs7O0VBS1osYUFBYSxjQUFjO0VBQzNCLE9BQU87R0FDTjtBQ2hCSCxRQUFRLE9BQU8sWUFBWSxRQUFRLDhCQUFhLFVBQVUsY0FBYztFQUN0RSxJQUFJLGVBQWU7O0VBRW5CLElBQUksaUJBQWlCLFVBQVUsS0FBSyxHQUFHLEVBQUUsSUFBSSxNQUFNLFFBQVEsTUFBTSxFQUFFLE9BQU8sWUFBWSxJQUFJLE9BQU8sWUFBWSxPQUFPLE1BQU0sRUFBRSxJQUFJLE9BQU8sSUFBSSxLQUFLLElBQUksWUFBWSxJQUFJLE9BQU8sYUFBYSxPQUFPLENBQUMsQ0FBQyxRQUFRLFVBQVUsUUFBUSxPQUFPLEVBQUUsS0FBSyxLQUFLLE1BQU0sUUFBUSxJQUFJLEtBQUssS0FBSyxXQUFXLEdBQUcsU0FBUyxPQUFPLGFBQWEsRUFBRSxNQUFNLElBQUksVUFBVTs7RUFFM1UsSUFBSSxlQUFlLENBQUMsWUFBWSxFQUFFLFNBQVMsaUJBQWlCLFFBQVEsT0FBTyxFQUFFLEtBQUssSUFBSSxPQUFPLE9BQU8sRUFBRSxJQUFJLE9BQU8sTUFBTSxNQUFNLEtBQUssZUFBZSxNQUFNLElBQUksS0FBSyxPQUFPLEtBQUssV0FBVyxRQUFRLE9BQU8saUJBQWlCLFFBQVEsVUFBVSxPQUFPLFVBQVUsYUFBYSxZQUFZLGFBQWEsRUFBRSxJQUFJLFlBQVksaUJBQWlCLFlBQVksV0FBVyxhQUFhLElBQUksYUFBYSxpQkFBaUIsYUFBYSxjQUFjLE9BQU87O0VBRTNhLElBQUksT0FBTyxTQUFTLElBQUksUUFBUSxVQUFVLFVBQVUsRUFBRSxJQUFJLE9BQU8sT0FBTyx5QkFBeUIsUUFBUSxXQUFXLElBQUksU0FBUyxXQUFXLEVBQUUsSUFBSSxTQUFTLE9BQU8sZUFBZSxTQUFTLElBQUksV0FBVyxNQUFNLEVBQUUsT0FBTyxrQkFBa0IsRUFBRSxPQUFPLElBQUksUUFBUSxVQUFVLG9CQUFvQixJQUFJLFdBQVcsUUFBUSxLQUFLLFVBQVUsRUFBRSxPQUFPLEtBQUssY0FBYyxFQUFFLElBQUksU0FBUyxLQUFLLEtBQUssSUFBSSxXQUFXLFdBQVcsRUFBRSxPQUFPLGFBQWEsT0FBTyxPQUFPLEtBQUs7O0VBRTNiLElBQUksWUFBWSxVQUFVLFVBQVUsWUFBWSxFQUFFLElBQUksT0FBTyxlQUFlLGNBQWMsZUFBZSxNQUFNLEVBQUUsTUFBTSxJQUFJLFVBQVUsNkRBQTZELE9BQU8sZUFBZSxTQUFTLFlBQVksT0FBTyxPQUFPLGNBQWMsV0FBVyxXQUFXLEVBQUUsYUFBYSxFQUFFLE9BQU8sVUFBVSxZQUFZLE9BQU8sVUFBVSxNQUFNLGNBQWMsV0FBVyxJQUFJLFlBQVksU0FBUyxZQUFZOztFQUVsYSxJQUFJLGtCQUFrQixVQUFVLFVBQVUsYUFBYSxFQUFFLElBQUksRUFBRSxvQkFBb0IsY0FBYyxFQUFFLE1BQU0sSUFBSSxVQUFVOztFQUV2SCxJQUFJLFVBQVUsYUFBYTtFQUMzQixJQUFJLGFBQWEsYUFBYTs7RUFFOUIsSUFiSSxpQkFBYyxDQUFBLFVBQUEsYUFBQTtJQUNQLFNBRFAsZUFDUSxPQUFPLFVBQVU7TUFjekIsZ0JBQWdCLE1BZmhCOztNQUVGLEtBQUEsT0FBQSxlQUZFLGVBQWMsWUFBQSxlQUFBLE1BQUEsS0FBQSxNQUVWO01BQ04sS0FBSyxXQUFXOzs7SUFrQmhCLFVBckJFLGdCQUFjOztJQXVCaEIsYUF2QkUsZ0JBQWM7TUFLbEIsUUFBTTtRQW9CQSxPQXBCQSxTQUFBLFNBQUc7VUFDUCxLQUFLO1VBQ0wsT0FBQSxLQUFBLE9BQUEsZUFQRSxlQUFjLFlBQUEsVUFBQSxNQUFBLEtBQUE7Ozs7O0lBZ0NoQixPQWhDRTtLQUF1Qjs7RUFZdEIsU0FBUyxLQUFLLE1BQU07SUFDekIsSUFBSSxRQUFRLElBQUk7O0lBRWhCLElBQUksY0FBYyxLQUFLLElBQUksVUFBQSxLQUFPO01BQ2hDLElBQUksS0FBRTs7TUFFTixJQUFHLE1BQU0sUUFBUSxNQUFNO1FBd0JuQixJQUFJOztRQUVKLENBQUMsWUFBWTtVQUNYLE9BQU8sZUExQk8sS0FBRztVQTJCakIsSUEzQkUsS0FBRSxLQUFBO1VBNEJKLElBNUJNLE1BQUcsS0FBQTs7VUFFYixLQUFLLElBQUksZUFBZSxLQUFLLFlBQU07WUFDakMsWUFBWSxRQUFRLFVBQUEsR0FBQztjQTZCZixPQTdCbUIsRUFBRSxTQUFTOzs7O1VBR3RDLEdBQUcsS0FBSyxLQUFLLElBQUksTUFBTSxZQUFXO1lBQ2hDLE1BQU0sS0FBSyxDQUFFLEtBQUssS0FBTSxNQUFNLFlBQUE7Y0ErQnhCLE9BL0I4QixNQUFNOzs7O2FBR3ZDOztRQUVMLEtBQUssSUFBSSxlQUFlLE1BQU0sWUFBTTtVQUNsQyxZQUFZLFFBQVEsVUFBQSxHQUFDO1lBaUNqQixPQWpDcUIsRUFBRSxTQUFTOzs7O1FBR3RDLElBQUksTUFBTSxJQUFJLE1BQU0sVUFBUyxLQUFLO1VBQ2hDLE1BQU0sS0FBSyxDQUFFLEtBQUssTUFBTyxNQUFNLFlBQUE7WUFtQzNCLE9BbkNpQyxNQUFNOzs7OztNQUkvQyxPQUFPOzs7SUFHVCxPQUFPOzs7RUFHRixTQUFTLFFBQVEsSUFBSTtJQUMxQixJQUFJLEtBQUssSUFBSTtJQUNiLFdBQVcsWUFBTTtNQUFFLEdBQUc7T0FBWTtJQUNsQyxPQUFPOzs7RUFHRixTQUFTLGNBQWMsTUFBTSxXQUFXLE9BQXNDO0lBdUNqRixJQXZDa0Qsd0JBQXFCLFVBQUEsT0FBQSxZQUFHLFFBQUssVUFBQTs7SUFDakYsU0FBUyxLQUFLLEtBQUs7TUFDakIsSUFBRyxRQUFRLE1BQU07UUFDZixRQUFRLFFBQVEsVUFBVSxNQUFNLEtBQUssVUFBUyxXQUFXO1VBQ3ZELE1BQU0sSUFBSSxXQUFXLEtBQUssVUFBUyxRQUFRO1lBQ3pDLElBQUcsUUFBUTtjQUNULEtBQUssT0FBTyxLQUFLOzs7O2FBSWxCLElBQUcsdUJBQXVCO1FBQy9CLE1BQU07Ozs7SUFJVixLQUFLLE9BQU8sS0FBSzs7Ozs7O0VBS1osU0FBUyxNQUFNLE1BQU0sV0FBVztJQUNyQyxJQUFJLFFBQVEsSUFBSSxRQUFROztJQUV4QixTQUFTLFFBQVE7TUFDZixLQUFLLE9BQU8sS0FBSyxVQUFBLEtBQU87UUFDdEIsSUFBRyxRQUFRLE1BQU07VUFDZixNQUFNO2VBQ0Q7VUFDTCxNQUFNLElBQUksS0FBSyxLQUFLOzs7O0lBSTFCOztJQUVBLE9BQU87OztFQTRDUCxhQUFhLE9BQU87RUFDcEIsYUFBYSxVQUFVO0VBQ3ZCLGFBQWEsZ0JBQWdCO0VBQzdCLGFBQWEsUUFBUTtFQUNyQixPQUFPO0lBQ047QUMxSUgsUUFBUSxPQUFPLFlBQVksUUFBUSxzQkFBZSxVQUFVLElBQUk7RUFDOUQsSUFBSSxlQUFlOztFQUdyQixJQUFJLE9BQU8sVUFBQSxHQUFLO0lBQ2QsT0FBTyxHQUFHOzs7RUFHWixLQUFLLE1BQU0sR0FBRztFQUNkLEtBQUssU0FBUyxHQUFHOztFQUVqQixLQUFLLE9BQU8sVUFBQSxPQUFTO0lBQ25CLElBQUksV0FBVyxVQUFVOztJQUV6QixPQUFPLEdBQUcsVUFBQyxTQUFTLFFBQVc7TUFDN0IsWUFBWTtNQUNaLFdBQVc7OztJQUdiLE1BQU0sUUFBUSxVQUFBLEdBQUM7TUFBWCxPQUFlLEVBQUUsS0FBSyxXQUFXOzs7SUFFckMsT0FBTzs7O0VBR1QsS0FBSyxVQUFVLFVBQUEsS0FBTztJQUNwQixPQUFPLEdBQUcsS0FBSzs7O0VBSWYsYUFBYSxVQUFVO0VBQ3ZCLE9BQU87SUFDTiIsImZpbGUiOiJqcy1jaGFubmVscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFsIGFuZ3VsYXI6dHJ1ZSAqL1xuYW5ndWxhci5tb2R1bGUoJ2NoYW5uZWxzJywgW10pOyIsIlxuLy9cbi8vIFRPRE86IHRoaXMgaXNuJ3QgaWRpb21hdGljYWxseSBqYXZhc2NyaXB0IChjb3VsZCBwcm9iYWJseSB1c2Ugc2xpY2Uvc3BsaWNlIHRvIGdvb2QgZWZmZWN0KVxuLy9cbmZ1bmN0aW9uIGFjb3B5KHNyYywgc3JjU3RhcnQsIGRlc3QsIGRlc3RTdGFydCwgbGVuZ3RoKSB7XG4gIGZvcihsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGRlc3RbaSArIGRlc3RTdGFydF0gPSBzcmNbaSArIHNyY1N0YXJ0XTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBSaW5nQnVmZmVyIHtcbiAgY29uc3RydWN0b3Iocykge1xuICAgIGxldCBzaXplID0gKHR5cGVvZiBzID09PSAnbnVtYmVyJykgPyBNYXRoLm1heCgxLCBzKSA6IDE7XG4gICAgdGhpcy5fdGFpbCAgID0gMDtcbiAgICB0aGlzLl9oZWFkICAgPSAwO1xuICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgdGhpcy5fdmFsdWVzID0gbmV3IEFycmF5KHNpemUpO1xuICB9XG5cbiAgcG9wKCkge1xuICAgIGxldCByZXN1bHQ7XG4gICAgaWYodGhpcy5sZW5ndGgpIHtcbiAgICAgIC8vIEdldCB0aGUgaXRlbSBvdXQgb2YgdGhlIHNldCBvZiB2YWx1ZXNcbiAgICAgIHJlc3VsdCA9ICh0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gIT09IG51bGwpID8gdGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdIDogbnVsbDtcblxuICAgICAgLy8gUmVtb3ZlIHRoZSBpdGVtIGZyb20gdGhlIHNldCBvZiB2YWx1ZXMsIHVwZGF0ZSBpbmRpY2llc1xuICAgICAgdGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdID0gbnVsbDtcbiAgICAgIHRoaXMuX3RhaWwgPSAodGhpcy5fdGFpbCArIDEpICUgdGhpcy5fdmFsdWVzLmxlbmd0aDtcbiAgICAgIHRoaXMuX2xlbmd0aCAtPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgdW5zaGlmdCh2YWwpIHtcbiAgICB0aGlzLl92YWx1ZXNbdGhpcy5faGVhZF0gPSB2YWw7XG4gICAgdGhpcy5faGVhZCA9ICh0aGlzLl9oZWFkICsgMSkgJSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuICAgIHRoaXMuX2xlbmd0aCArPSAxO1xuICB9XG5cbiAgcmVzaXppbmdVbnNoaWZ0KHZhbCkge1xuICAgIGlmKHRoaXMubGVuZ3RoICsgMSA9PT0gdGhpcy5fdmFsdWVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICB9XG4gICAgdGhpcy51bnNoaWZ0KHZhbCk7XG4gIH1cblxuICByZXNpemUoKSB7XG4gICAgbGV0IG5ld0FycnkgPSBuZXcgQXJyYXkodGhpcy5fdmFsdWVzLmxlbmd0aCAqIDIpO1xuXG4gICAgaWYodGhpcy5fdGFpbCA8IHRoaXMuX2hlYWQpIHtcbiAgICAgIGFjb3B5KHRoaXMuX3ZhbHVlcywgdGhpcy5fdGFpbCwgbmV3QXJyeSwgMCwgdGhpcy5faGVhZCk7XG5cbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMubGVuZ3RoO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcblxuICAgIH0gZWxzZSBpZih0aGlzLl9oZWFkIDwgdGhpcy5fdGFpbCkge1xuICAgICAgYWNvcHkodGhpcy5fdmFsdWVzLCAwLCBuZXdBcnJ5LCB0aGlzLl92YWx1ZXMubGVuZ3RoIC0gdGhpcy5fdGFpbCwgdGhpcy5faGVhZCk7XG5cbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMubGVuZ3RoO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSAwO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcbiAgICB9XG4gIH1cblxuICBjbGVhbnVwKGtlZXApIHtcbiAgICBmb3IobGV0IGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgIGxldCBpdGVtID0gdGhpcy5wb3AoKTtcblxuICAgICAgaWYoa2VlcChpdGVtKSkge1xuICAgICAgICB0aGlzLnVuc2hpZnQoaXRlbSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIEZpeGVkQnVmZmVyIHtcbiAgY29uc3RydWN0b3Iobikge1xuICAgIHRoaXMuX2J1ZiA9IG5ldyBSaW5nQnVmZmVyKG4pO1xuICAgIHRoaXMuX3NpemUgPSBuO1xuICB9XG5cbiAgcmVtb3ZlKCkge1xuICAgIHJldHVybiB0aGlzLl9idWYucG9wKCk7XG4gIH1cblxuICBhZGQodikge1xuICAgIGlmKHRoaXMuZnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGFkZCB0byBhIGZ1bGwgYnVmZmVyLlwiKTtcbiAgICB9XG4gICAgdGhpcy5fYnVmLnJlc2l6aW5nVW5zaGlmdCh2KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLmxlbmd0aDtcbiAgfVxuXG4gIGdldCBmdWxsKCkge1xuICAgIHJldHVybiB0aGlzLl9idWYubGVuZ3RoID09PSB0aGlzLl9zaXplO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIERyb3BwaW5nQnVmZmVyIGV4dGVuZHMgRml4ZWRCdWZmZXIge1xuICBhZGQodikge1xuICAgIGlmKHRoaXMuX2J1Zi5sZW5ndGggPCB0aGlzLl9zaXplKSB7XG4gICAgICB0aGlzLl9idWYudW5zaGlmdCh2KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldCBmdWxsKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBTbGlkaW5nQnVmZmVyIGV4dGVuZHMgRml4ZWRCdWZmZXIge1xuICBhZGQodikge1xuICAgIGlmKHRoaXMuX2J1Zi5sZW5ndGggPT09IHRoaXMuX3NpemUpIHtcbiAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgfVxuICAgIHRoaXMuX2J1Zi51bnNoaWZ0KHYpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IHsgRHJvcHBpbmdCdWZmZXIsIFNsaWRpbmdCdWZmZXIsIEZpeGVkQnVmZmVyLCBSaW5nQnVmZmVyIH07IiwiXG5pbXBvcnQgeyBGaXhlZEJ1ZmZlciwgUmluZ0J1ZmZlciB9IGZyb20gXCIuL2J1ZmZlcnMuanNcIjtcbmltcG9ydCB7IERpc3BhdGNoIH0gZnJvbSBcIi4vZGlzcGF0Y2guanNcIjtcbmltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5pbXBvcnQgeyB0cmFuc2R1Y2VycyB9IGZyb20gXCIuL3RyYW5zZHVjZXJzLmpzXCI7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFRyYW5zYWN0b3Ige1xuICBjb25zdHJ1Y3RvcihvZmZlcikge1xuICAgIHRoaXMub2ZmZXJlZCA9IG9mZmVyO1xuICAgIHRoaXMucmVjZWl2ZWQgPSBudWxsO1xuICAgIHRoaXMucmVzb2x2ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcbiAgfVxuXG4gIGNvbW1pdCgpIHtcbiAgICByZXR1cm4gKHZhbCkgPT4ge1xuICAgICAgaWYodGhpcy5yZXNvbHZlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byByZXNvbHZlIHRyYW5zYWN0b3IgdHdpY2UhXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWNlaXZlZCA9IHZhbDtcbiAgICAgIHRoaXMucmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaChjID0+IGModmFsKSk7XG5cbiAgICAgIHJldHVybiB0aGlzLm9mZmVyZWQ7XG4gICAgfTtcbiAgfVxuXG4gIGRlcmVmKGNhbGxiYWNrKSB7XG4gICAgaWYodGhpcy5yZXNvbHZlZCkge1xuICAgICAgY2FsbGJhY2sodGhpcy5yZWNlaXZlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgfVxufVxuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmxldCBkaXNwYXRjaCA9IG5ldyBEaXNwYXRjaCgpO1xuXG5jbGFzcyBDaGFubmVsIHtcbiAgY29uc3RydWN0b3Ioc2l6ZU9yQnVmLCB4Zm9ybSkge1xuICAgIGlmKCF0cmFuc2R1Y2VycyAmJiB4Zm9ybSkge1xuICAgICAgY29uc29sZS5pbmZvKFwiVXNpbmcgYSB0cmFuc2R1Y2VyIHJlcXVpcmVzIHRyYW5zZHVjZXJzLWpzIDxodHRwczovL2dpdGh1Yi5jb20vY29nbml0ZWN0LWxhYnMvdHJhbnNkdWNlcnMtanM+XCIpO1xuICAgIH1cbiAgICBpZighc2l6ZU9yQnVmICYmIHhmb3JtICYmIHRyYW5zZHVjZXJzKSB7XG4gICAgICBjb25zb2xlLmluZm8oXCJUcmFuc2R1Y2VycyB3aWxsIGJlIGlnbm9yZWQgZm9yIHVuYnVmZmVyZWQgY2hhbm5lbHMuXCIpO1xuICAgIH1cblxuICAgIC8vIEFkZHMgdmFsdWUgdG8gdGhlIGJ1ZmZlcjpcbiAgICAvLyBkb0FkZCgpID0+IEJ1ZmZlclxuICAgIC8vIGRvQWRkKHZhbCkgPT4gQnVmZmVyXG4gICAgbGV0IGRvQWRkID0gKGJ1ZiwgdmFsKSA9PiBidWYuYWRkKHZhbCk7XG5cbiAgICB0aGlzLl9idWZmZXIgICAgPSAoc2l6ZU9yQnVmIGluc3RhbmNlb2YgRml4ZWRCdWZmZXIpID8gc2l6ZU9yQnVmIDogbmV3IEZpeGVkQnVmZmVyKHNpemVPckJ1ZiB8fCAwKTtcbiAgICB0aGlzLl90YWtlcnMgICAgPSBuZXcgUmluZ0J1ZmZlcigzMik7XG4gICAgdGhpcy5fcHV0dGVycyAgID0gbmV3IFJpbmdCdWZmZXIoMzIpO1xuICAgIHRoaXMuX3hmb3JtZXIgICA9IHhmb3JtICYmIHRyYW5zZHVjZXJzID8geGZvcm0odHJhbnNkdWNlcnMud3JhcChkb0FkZCkpIDogZG9BZGQ7XG5cbiAgICB0aGlzLl9pc09wZW4gPSB0cnVlO1xuICB9XG5cbiAgX2luc2VydCh2YWwpIHtcbiAgICBpZih0cmFuc2R1Y2Vycykge1xuICAgICAgaWYodmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl94Zm9ybWVyLnN0ZXAodGhpcy5fYnVmZmVyLCB2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3hmb3JtZXIucmVzdWx0KHRoaXMuX2J1ZmZlcik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKHZhbCkge1xuICAgICAgdGhpcy5feGZvcm1lcih0aGlzLl9idWZmZXIsIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZpbGwodmFsLCB0eCA9IG5ldyBUcmFuc2FjdG9yKHZhbCkpIHtcbiAgICBpZih2YWwgPT09IG51bGwpIHsgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHB1dCBudWxsIHRvIGEgY2hhbm5lbC5cIik7IH1cbiAgICBpZighKHR4IGluc3RhbmNlb2YgVHJhbnNhY3RvcikpIHsgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0aW5nIFRyYW5zYWN0b3IgdG8gYmUgcGFzc2VkIHRvIGZpbGxcIik7IH1cbiAgICBpZighdHguYWN0aXZlKSB7IHJldHVybiB0eDsgfVxuXG4gICAgaWYoIXRoaXMub3Blbikge1xuICAgICAgLy8gRWl0aGVyIHNvbWVib2R5IGhhcyByZXNvbHZlZCB0aGUgaGFuZGxlciBhbHJlYWR5ICh0aGF0IHdhcyBmYXN0KSBvciB0aGUgY2hhbm5lbCBpcyBjbG9zZWQuXG4gICAgICAvLyBjb3JlLmFzeW5jIHJldHVybnMgYSBib29sZWFuIG9mIHdoZXRoZXIgb3Igbm90IHNvbWV0aGluZyAqY291bGQqIGdldCBwdXQgdG8gdGhlIGNoYW5uZWxcbiAgICAgIC8vIHdlJ2xsIGRvIHRoZSBzYW1lICNjYXJnb2N1bHRcbiAgICAgIHR4LmNvbW1pdCgpKGZhbHNlKTtcbiAgICB9XG5cbiAgICBpZighdGhpcy5fYnVmZmVyLmZ1bGwpIHtcbiAgICAgIC8vIFRoZSBjaGFubmVsIGhhcyBzb21lIGZyZWUgc3BhY2UuIFN0aWNrIGl0IGluIHRoZSBidWZmZXIgYW5kIHRoZW4gZHJhaW4gYW55IHdhaXRpbmcgdGFrZXMuXG4gICAgICB0eC5jb21taXQoKSh0cnVlKTtcblxuICAgICAgbGV0IGRvbmUgPSB0cmFuc2R1Y2VycyA/IHRyYW5zZHVjZXJzLnJlZHVjZWQodGhpcy5faW5zZXJ0KHZhbCkpIDogdGhpcy5faW5zZXJ0KHZhbCk7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3Rha2Vycy5sZW5ndGggJiYgdGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICBsZXQgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgICBpZih0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICAgIGxldCB2ID0gdGhpcy5fYnVmZmVyLnJlbW92ZSgpO1xuICAgICAgICAgIGxldCB0YWtlckNiID0gdGFrZXJUeC5jb21taXQoKTtcblxuICAgICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0YWtlckNiKHYpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYoZG9uZSkge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0eDtcbiAgICB9IGVsc2UgaWYodGhpcy5fdGFrZXJzLmxlbmd0aCkge1xuICAgICAgLy8gVGhlIGJ1ZmZlciBpcyBmdWxsIGJ1dCB0aGVyZSBhcmUgd2FpdGluZyB0YWtlcnMgKGUuZy4gdGhlIGJ1ZmZlciBpcyBzaXplIHplcm8pXG5cbiAgICAgIGxldCB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICB3aGlsZSh0aGlzLl90YWtlcnMubGVuZ3RoICYmICF0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBpZih0YWtlclR4ICYmIHRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgIHR4LmNvbW1pdCgpKHRydWUpO1xuICAgICAgICBsZXQgdGFrZXJDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VyQ2IodmFsKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wdXR0ZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3B1dHRlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHg7XG4gIH1cblxuICBwdXQodmFsLCB0cmFuc2FjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5maWxsKHZhbCwgdHJhbnNhY3RvcikuZGVyZWYocmVzb2x2ZSk7XG4gICAgfSk7XG4gIH1cblxuICBkcmFpbih0eCA9IG5ldyBUcmFuc2FjdG9yKCkpIHtcbiAgICBpZighKHR4IGluc3RhbmNlb2YgVHJhbnNhY3RvcikpIHsgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0aW5nIFRyYW5zYWN0b3IgdG8gYmUgcGFzc2VkIHRvIGRyYWluXCIpOyB9XG4gICAgaWYoIXR4LmFjdGl2ZSkgeyByZXR1cm4gdHg7IH1cblxuICAgIGlmKHRoaXMuX2J1ZmZlci5sZW5ndGgpIHtcbiAgICAgIGxldCBidWZWYWwgPSB0aGlzLl9idWZmZXIucmVtb3ZlKCk7XG5cbiAgICAgIHdoaWxlKCF0aGlzLl9idWZmZXIuZnVsbCAmJiB0aGlzLl9wdXR0ZXJzLmxlbmd0aCkge1xuICAgICAgICBsZXQgcHV0dGVyID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcblxuICAgICAgICBpZihwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHB1dFR4ID0gcHV0dGVyLmNvbW1pdCgpLFxuICAgICAgICAgICAgICB2YWwgPSBwdXR0ZXIub2ZmZXJlZDsgLy8gS2luZGEgYnJlYWtpbmcgdGhlIHJ1bGVzIGhlcmVcblxuICAgICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiBwdXRUeCgpKTtcbiAgICAgICAgICB0aGlzLl9pbnNlcnQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eC5jb21taXQoKShidWZWYWwpO1xuICAgIH0gZWxzZSBpZih0aGlzLl9wdXR0ZXJzLmxlbmd0aCkge1xuICAgICAgbGV0IHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG5cbiAgICAgIHdoaWxlKHRoaXMuX3B1dHRlcnMubGVuZ3RoICYmICFwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgIHB1dHRlciA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHB1dHRlciAmJiBwdXR0ZXIuYWN0aXZlKSB7XG4gICAgICAgIGxldCB0eENiID0gdHguY29tbWl0KCksXG4gICAgICAgICAgICBwdXRUeCA9IHB1dHRlci5jb21taXQoKSxcbiAgICAgICAgICAgIHZhbCA9IHB1dHRlci5vZmZlcmVkO1xuXG4gICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiBwdXRUeCgpKTtcbiAgICAgICAgdHhDYih2YWwpO1xuICAgICAgfSBlbHNlIGlmKCF0aGlzLm9wZW4pIHtcbiAgICAgICAgdGhpcy5faW5zZXJ0KCk7XG5cbiAgICAgICAgbGV0IHR4Q2IgPSB0eC5jb21taXQoKTtcblxuICAgICAgICBpZih0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgdHhDYih0aGlzLl9idWZmZXIucmVtb3ZlKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR4Q2IobnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Rha2Vycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90YWtlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHg7XG4gIH1cblxuICB0YWtlKHRyYW5zYWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmRyYWluKHRyYW5zYWN0b3IpLmRlcmVmKHJlc29sdmUpO1xuICAgIH0pO1xuICB9XG5cbiAgdGhlbihmbiwgZXJyKSB7XG4gICAgcmV0dXJuIHRoaXMudGFrZSgpLnRoZW4oZm4sIGVycik7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICBpZih0aGlzLm9wZW4pIHtcbiAgICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xuXG4gICAgICBpZih0aGlzLl9wdXR0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLl9pbnNlcnQoKTtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKHRoaXMuX3Rha2Vycy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHRha2VyID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHRha2VyLmFjdGl2ZSkge1xuICAgICAgICAgIGxldCB2YWwgPSB0aGlzLl9idWZmZXIubGVuZ3RoID8gdGhpcy5fYnVmZmVyLnJlbW92ZSgpIDogbnVsbCxcbiAgICAgICAgICAgICAgdGFrZXJDYiA9IHRha2VyLmNvbW1pdCgpO1xuXG4gICAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VyQ2IodmFsKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQgb3BlbigpIHtcbiAgICByZXR1cm4gdGhpcy5faXNPcGVuO1xuICB9XG59XG5cbmV4cG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfTsiLCJcbi8qIGdsb2JhbCBzZXRJbW1lZGlhdGU6dHJ1ZSAqL1xubGV0IGRlZmF1bHRBc3luY2hyb25pemVyID0gKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicpID8gZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIHNldEltbWVkaWF0ZShmbik7XG59IDogZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIHNldFRpbWVvdXQoZm4pO1xufTtcblxuY2xhc3MgRGlzcGF0Y2gge1xuICBjb25zdHJ1Y3Rvcihhc3luY2hyb25pemVyKSB7XG4gICAgdGhpcy5fYXN5bmNocm9uaXplciA9IGFzeW5jaHJvbml6ZXIgfHwgZGVmYXVsdEFzeW5jaHJvbml6ZXI7XG4gICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgfVxuXG4gIHJ1bihmbikge1xuICAgIHRoaXMuX3F1ZXVlLnB1c2goZm4pO1xuXG4gICAgdGhpcy5fYXN5bmNocm9uaXplcigoKSA9PiB7XG4gICAgICB3aGlsZSh0aGlzLl9xdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIlFVRVVFXCIsIHRoaXMuX3F1ZXVlWzBdKTtcbiAgICAgICAgdGhpcy5fcXVldWUuc2hpZnQoKSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cblxuZXhwb3J0IHsgRGlzcGF0Y2ggfTsiLCJ2YXIgX3RyYW5zZHVjZXJzID0gZmFsc2U7XG5cbi8qIGdsb2JhbCByZXF1aXJlOnRydWUgKi9cbmlmKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy50cmFuc2R1Y2Vycykge1xuICBfdHJhbnNkdWNlcnMgPSB3aW5kb3cudHJhbnNkdWNlcnM7XG59IGVsc2UgaWYodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbGV0IHIgPSByZXF1aXJlOyAvLyBUcmljayBicm93c2VyaWZ5XG4gIHRyeSB7XG4gICAgX3RyYW5zZHVjZXJzID0gcigndHJhbnNkdWNlcnMtanMnKTtcbiAgfSBjYXRjaCAoZSkge31cbn1cblxuZXhwb3J0IHsgX3RyYW5zZHVjZXJzIGFzIHRyYW5zZHVjZXJzIH07XG4iLCJpbXBvcnQgeyBDaGFubmVsLCBUcmFuc2FjdG9yIH0gZnJvbSBcIi4vY2hhbm5lbHMuanNcIjtcblxuXG5jbGFzcyBBbHRzVHJhbnNhY3RvciBleHRlbmRzIFRyYW5zYWN0b3Ige1xuICBjb25zdHJ1Y3RvcihvZmZlciwgY29tbWl0Q2IpIHtcbiAgICBzdXBlcihvZmZlcik7XG4gICAgdGhpcy5jb21taXRDYiA9IGNvbW1pdENiO1xuICB9XG4gIGNvbW1pdCgpIHtcbiAgICB0aGlzLmNvbW1pdENiKCk7XG4gICAgcmV0dXJuIHN1cGVyLmNvbW1pdCgpO1xuICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFsdHMocmFjZSkge1xuICBsZXQgb3V0Q2ggPSBuZXcgQ2hhbm5lbCgpO1xuXG4gIGxldCB0cmFuc2FjdG9ycyA9IHJhY2UubWFwKGNtZCA9PiB7XG4gICAgbGV0IHR4O1xuXG4gICAgaWYoQXJyYXkuaXNBcnJheShjbWQpKSB7XG4gICAgICBsZXQgWyBjaCwgdmFsIF0gPSBjbWQ7XG5cbiAgICAgIHR4ID0gbmV3IEFsdHNUcmFuc2FjdG9yKHZhbCwgKCkgPT4ge1xuICAgICAgICB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSk7XG4gICAgICB9KTtcblxuICAgICAgY2guZmlsbCh2YWwsIHR4KS5kZXJlZihmdW5jdGlvbigpIHtcbiAgICAgICAgb3V0Q2guZmlsbChbIHZhbCwgY2ggXSkuZGVyZWYoKCkgPT4gb3V0Q2guY2xvc2UoKSk7XG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHR4ID0gbmV3IEFsdHNUcmFuc2FjdG9yKHRydWUsICgpID0+IHtcbiAgICAgICAgdHJhbnNhY3RvcnMuZm9yRWFjaChoID0+IGguYWN0aXZlID0gZmFsc2UpO1xuICAgICAgfSk7XG5cbiAgICAgIGNtZC5kcmFpbih0eCkuZGVyZWYoZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIG91dENoLmZpbGwoWyB2YWwsIGNtZCBdKS5kZXJlZigoKSA9PiBvdXRDaC5jbG9zZSgpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0eDtcbiAgfSk7XG5cbiAgcmV0dXJuIG91dENoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGltZW91dChtcykge1xuICB2YXIgY2ggPSBuZXcgQ2hhbm5lbCgpO1xuICBzZXRUaW1lb3V0KCgpID0+IHsgY2guY2xvc2UoKTsgfSwgbXMpO1xuICByZXR1cm4gY2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwaXBlbGluZUFzeW5jKGluY2gsIGNvbnZlcnRlciwgb3V0Y2gsIHNob3VsZENsb3NlRG93bnN0cmVhbSA9IGZhbHNlKSB7XG4gIGZ1bmN0aW9uIHRha2UodmFsKSB7XG4gICAgaWYodmFsICE9PSBudWxsKSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUoY29udmVydGVyKHZhbCkpLnRoZW4oZnVuY3Rpb24oY29udmVydGVkKSB7XG4gICAgICAgIG91dGNoLnB1dChjb252ZXJ0ZWQpLnRoZW4oZnVuY3Rpb24oZGlkUHV0KSB7XG4gICAgICAgICAgaWYoZGlkUHV0KSB7XG4gICAgICAgICAgICBpbmNoLnRha2UoKS50aGVuKHRha2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYoc2hvdWxkQ2xvc2VEb3duc3RyZWFtKSB7XG4gICAgICBvdXRjaC5jbG9zZSgpO1xuICAgIH1cbiAgfVxuXG4gIGluY2gudGFrZSgpLnRoZW4odGFrZSk7XG59XG5cbi8vIEVuZm9yY2VzIG9yZGVyIHJlc29sdXRpb24gb24gcmVzdWx0aW5nIGNoYW5uZWxcbi8vIFRoaXMgbWlnaHQgbmVlZCB0byBiZSB0aGUgZGVmYXVsdCBiZWhhdmlvciwgdGhvdWdoIHRoYXQgcmVxdWlyZXMgbW9yZSB0aG91Z2h0XG5leHBvcnQgZnVuY3Rpb24gb3JkZXIoaW5jaCwgc2l6ZU9yQnVmKSB7XG4gIHZhciBvdXRjaCA9IG5ldyBDaGFubmVsKHNpemVPckJ1Zik7XG5cbiAgZnVuY3Rpb24gZHJhaW4oKSB7XG4gICAgaW5jaC50YWtlKCkudGhlbih2YWwgPT4ge1xuICAgICAgaWYodmFsID09PSBudWxsKSB7XG4gICAgICAgIG91dGNoLmNsb3NlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRjaC5wdXQodmFsKS50aGVuKGRyYWluKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBkcmFpbigpO1xuXG4gIHJldHVybiBvdXRjaDtcbn1cbiIsIlxuaW1wb3J0ICogYXMgJHEgZnJvbSBcIiRxXCI7XG5cblxudmFyIFByb20gPSByID0+IHtcbiAgcmV0dXJuICRxKHIpO1xufTtcblxuUHJvbS5hbGwgPSAkcS5hbGw7XG5Qcm9tLnJlamVjdCA9ICRxLnJlamVjdDtcblxuUHJvbS5yYWNlID0gcHJvbXMgPT4ge1xuICB2YXIgZG9GdWxmaWxsLCBkb1JlamVjdCwgcHJvbTtcblxuICBwcm9tID0gJHEoKGZ1bGZpbGwsIHJlamVjdCkgPT4ge1xuICAgIGRvRnVsZmlsbCA9IGZ1bGZpbGw7XG4gICAgZG9SZWplY3QgPSByZWplY3Q7XG4gIH0pO1xuXG4gIHByb21zLmZvckVhY2gocCA9PiBwLnRoZW4oZG9GdWxmaWxsLCBkb1JlamVjdCkpO1xuXG4gIHJldHVybiBwcm9tO1xufTtcblxuUHJvbS5yZXNvbHZlID0gdmFsID0+IHtcbiAgcmV0dXJuICRxLndoZW4odmFsKTtcbn07XG5cbmV4cG9ydCB7IFByb20gYXMgUHJvbWlzZSB9OyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==