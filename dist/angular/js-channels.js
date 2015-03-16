angular.module('channels', []);
angular.module("channels").service("jschBuffers", function () {
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
angular.module("channels").service("jschChannel", function (jschBuffers, jschDispatch, jschPromise) {
  var ES6__EXPORTS = {};

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var FixedBuffer = jschBuffers.FixedBuffer;
  var RingBuffer = jschBuffers.RingBuffer;
  var Dispatch = jschDispatch.Dispatch;
  var Promise = jschPromise.Promise;

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

  ES6__EXPORTS.Channel = Channel;
  ES6__EXPORTS.Transactor = Transactor;
  return ES6__EXPORTS;
});
angular.module("channels").service("jschDispatch", function () {
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
angular.module("channels").service("jschMult", function (jschPromise) {
  var ES6__EXPORTS = {};

  var _toArray = function (arr) { return Array.isArray(arr) ? arr : Array.from(arr); };

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Promise = jschPromise.Promise;

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
angular.module("channels").service("jschUtils", function (jschChannel) {
  var ES6__EXPORTS = {};

  var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Channel = jschChannel.Channel;
  var Transactor = jschChannel.Transactor;

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
  ES6__EXPORTS.pipe = pipe;
  ES6__EXPORTS.intoArray = intoArray;
  ES6__EXPORTS.order = order;
  return ES6__EXPORTS;
});
angular.module("channels").service("jschPromise", function ($q) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYnVmZmVycy5qcyIsImNoYW5uZWwuanMiLCJkaXNwYXRjaC5qcyIsIm11bHQuanMiLCJ1dGlscy5qcyIsInByb21pc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7QUNJQSxXQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO0FBQ3JELFNBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNqQyxVQUFJLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7S0FDekM7R0FDRjs7OztNQUlLLFVBQVU7QUFDSCxhQURQLFVBQVUsQ0FDRixDQUFDLEVBQUU7NEJBRFgsVUFBVTs7QUFFWixVQUFJLElBQUksR0FBRyxBQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsR0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEQsVUFBSSxDQUFDLEtBQUssR0FBSyxDQUFDLENBQUM7QUFDakIsVUFBSSxDQUFDLEtBQUssR0FBSyxDQUFDLENBQUM7QUFDakIsVUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7QUFDakIsVUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNoQzs7aUJBUEcsVUFBVTtBQVNkLFNBQUc7ZUFBQSxlQUFHO0FBQ0osY0FBSSxNQUFNLFlBQUEsQ0FBQztBQUNYLGNBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRTs7QUFFZCxrQkFBTSxHQUFHLEFBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxHQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFB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RixTQUFPLENBQUMsT0FBTyxHQUFHLFVBQUEsR0FBRyxFQUFJO0FBQ3ZCLFdBQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNyQixDQUFDIiwiZmlsZSI6ImpzLWNoYW5uZWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2NoYW5uZWxzJywgW10pOyIsIlxuLy9cbi8vIFRPRE86IHRoaXMgaXNuJ3QgaWRpb21hdGljYWxseSBqYXZhc2NyaXB0IChjb3VsZCBwcm9iYWJseSB1c2Ugc2xpY2Uvc3BsaWNlIHRvIGdvb2QgZWZmZWN0KVxuLy9cbmZ1bmN0aW9uIGFjb3B5KHNyYywgc3JjU3RhcnQsIGRlc3QsIGRlc3RTdGFydCwgbGVuZ3RoKSB7XG4gIGZvcihsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGRlc3RbaSArIGRlc3RTdGFydF0gPSBzcmNbaSArIHNyY1N0YXJ0XTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBSaW5nQnVmZmVyIHtcbiAgY29uc3RydWN0b3Iocykge1xuICAgIGxldCBzaXplID0gKHR5cGVvZiBzID09PSAnbnVtYmVyJykgPyBNYXRoLm1heCgxLCBzKSA6IDE7XG4gICAgdGhpcy5fdGFpbCAgID0gMDtcbiAgICB0aGlzLl9oZWFkICAgPSAwO1xuICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgdGhpcy5fdmFsdWVzID0gbmV3IEFycmF5KHNpemUpO1xuICB9XG5cbiAgcG9wKCkge1xuICAgIGxldCByZXN1bHQ7XG4gICAgaWYodGhpcy5sZW5ndGgpIHtcbiAgICAgIC8vIEdldCB0aGUgaXRlbSBvdXQgb2YgdGhlIHNldCBvZiB2YWx1ZXNcbiAgICAgIHJlc3VsdCA9ICh0aGlzLl92YWx1ZXNbdGhpcy5fdGFpbF0gIT09IG51bGwpID8gdGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdIDogbnVsbDtcblxuICAgICAgLy8gUmVtb3ZlIHRoZSBpdGVtIGZyb20gdGhlIHNldCBvZiB2YWx1ZXMsIHVwZGF0ZSBpbmRpY2llc1xuICAgICAgdGhpcy5fdmFsdWVzW3RoaXMuX3RhaWxdID0gbnVsbDtcbiAgICAgIHRoaXMuX3RhaWwgPSAodGhpcy5fdGFpbCArIDEpICUgdGhpcy5fdmFsdWVzLmxlbmd0aDtcbiAgICAgIHRoaXMuX2xlbmd0aCAtPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgdW5zaGlmdCh2YWwpIHtcbiAgICB0aGlzLl92YWx1ZXNbdGhpcy5faGVhZF0gPSB2YWw7XG4gICAgdGhpcy5faGVhZCA9ICh0aGlzLl9oZWFkICsgMSkgJSB0aGlzLl92YWx1ZXMubGVuZ3RoO1xuICAgIHRoaXMuX2xlbmd0aCArPSAxO1xuICB9XG5cbiAgcmVzaXppbmdVbnNoaWZ0KHZhbCkge1xuICAgIGlmKHRoaXMubGVuZ3RoICsgMSA9PT0gdGhpcy5fdmFsdWVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICB9XG4gICAgdGhpcy51bnNoaWZ0KHZhbCk7XG4gIH1cblxuICByZXNpemUoKSB7XG4gICAgbGV0IG5ld0FycnkgPSBuZXcgQXJyYXkodGhpcy5fdmFsdWVzLmxlbmd0aCAqIDIpO1xuXG4gICAgaWYodGhpcy5fdGFpbCA8IHRoaXMuX2hlYWQpIHtcbiAgICAgIGFjb3B5KHRoaXMuX3ZhbHVlcywgdGhpcy5fdGFpbCwgbmV3QXJyeSwgMCwgdGhpcy5faGVhZCk7XG5cbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMubGVuZ3RoO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcblxuICAgIH0gZWxzZSBpZih0aGlzLl9oZWFkIDwgdGhpcy5fdGFpbCkge1xuICAgICAgYWNvcHkodGhpcy5fdmFsdWVzLCAwLCBuZXdBcnJ5LCB0aGlzLl92YWx1ZXMubGVuZ3RoIC0gdGhpcy5fdGFpbCwgdGhpcy5faGVhZCk7XG5cbiAgICAgIHRoaXMuX3RhaWwgPSAwO1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMubGVuZ3RoO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90YWlsID0gMDtcbiAgICAgIHRoaXMuX2hlYWQgPSAwO1xuICAgICAgdGhpcy5fdmFsdWVzID0gbmV3QXJyeTtcbiAgICB9XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY2xhc3MgRml4ZWRCdWZmZXIge1xuICBjb25zdHJ1Y3RvcihuKSB7XG4gICAgdGhpcy5fYnVmID0gbmV3IFJpbmdCdWZmZXIobik7XG4gICAgdGhpcy5fc2l6ZSA9IG47XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5wb3AoKTtcbiAgfVxuXG4gIGFkZCh2KSB7XG4gICAgdGhpcy5fYnVmLnJlc2l6aW5nVW5zaGlmdCh2KTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2J1Zi5sZW5ndGg7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBEcm9wcGluZ0J1ZmZlciBleHRlbmRzIEZpeGVkQnVmZmVyIHtcbiAgYWRkKHYpIHtcbiAgICBpZih0aGlzLl9idWYubGVuZ3RoIDwgdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZ1bGwoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFNsaWRpbmdCdWZmZXIgZXh0ZW5kcyBGaXhlZEJ1ZmZlciB7XG4gIGFkZCh2KSB7XG4gICAgaWYodGhpcy5fYnVmLmxlbmd0aCA9PT0gdGhpcy5fc2l6ZSkge1xuICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5fYnVmLnVuc2hpZnQodik7XG4gIH1cblxuICBnZXQgZnVsbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IHsgRHJvcHBpbmdCdWZmZXIsIFNsaWRpbmdCdWZmZXIsIEZpeGVkQnVmZmVyLCBSaW5nQnVmZmVyIH07IiwiXG5pbXBvcnQgeyBGaXhlZEJ1ZmZlciwgUmluZ0J1ZmZlciB9IGZyb20gXCIuL2J1ZmZlcnMuanNcIjtcbmltcG9ydCB7IERpc3BhdGNoIH0gZnJvbSBcIi4vZGlzcGF0Y2guanNcIjtcbmltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNsYXNzIFRyYW5zYWN0b3Ige1xuICBjb25zdHJ1Y3RvcihvZmZlcikge1xuICAgIHRoaXMub2ZmZXJlZCA9IG9mZmVyO1xuICAgIHRoaXMucmVjZWl2ZWQgPSBudWxsO1xuICAgIHRoaXMucmVzb2x2ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcbiAgfVxuXG4gIGNvbW1pdCgpIHtcbiAgICByZXR1cm4gKHZhbCkgPT4ge1xuICAgICAgaWYodGhpcy5yZXNvbHZlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byByZXNvbHZlIHRyYW5zYWN0b3IgdHdpY2UhXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWNlaXZlZCA9IHZhbDtcbiAgICAgIHRoaXMucmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaChjID0+IGModmFsKSk7XG5cbiAgICAgIHJldHVybiB0aGlzLm9mZmVyZWQ7XG4gICAgfVxuICB9XG5cbiAgZGVyZWYoY2FsbGJhY2spIHtcbiAgICBpZih0aGlzLnJlc29sdmVkKSB7XG4gICAgICBjYWxsYmFjayh0aGlzLnJlY2VpdmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9XG59XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubGV0IGRpc3BhdGNoID0gbmV3IERpc3BhdGNoKCk7XG5cbmNsYXNzIENoYW5uZWwge1xuICBjb25zdHJ1Y3RvcihzaXplT3JCdWYpIHtcbiAgICB0aGlzLl9idWZmZXIgPSAoc2l6ZU9yQnVmIGluc3RhbmNlb2YgRml4ZWRCdWZmZXIpID8gc2l6ZU9yQnVmIDogbmV3IEZpeGVkQnVmZmVyKHNpemVPckJ1ZiB8fCAwKTtcbiAgICB0aGlzLl90YWtlcnMgPSBuZXcgUmluZ0J1ZmZlcigzMik7XG4gICAgdGhpcy5fcHV0dGVycyA9IG5ldyBSaW5nQnVmZmVyKDMyKTtcblxuICAgIHRoaXMuX2lzT3BlbiA9IHRydWU7XG4gIH1cblxuICBmaWxsKHZhbCwgdHggPSBuZXcgVHJhbnNhY3Rvcih2YWwpKSB7XG4gICAgaWYodmFsID09PSBudWxsKSB7IHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBwdXQgbnVsbCB0byBhIGNoYW5uZWwuXCIpOyB9XG4gICAgaWYoISh0eCBpbnN0YW5jZW9mIFRyYW5zYWN0b3IpKSB7IHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBUcmFuc2FjdG9yIHRvIGJlIHBhc3NlZCB0byBmaWxsXCIpOyB9XG4gICAgaWYoIXR4LmFjdGl2ZSkgeyByZXR1cm4gdHg7IH1cblxuICAgIGlmKCF0aGlzLm9wZW4pIHtcbiAgICAgIC8vIEVpdGhlciBzb21lYm9keSBoYXMgcmVzb2x2ZWQgdGhlIGhhbmRsZXIgYWxyZWFkeSAodGhhdCB3YXMgZmFzdCkgb3IgdGhlIGNoYW5uZWwgaXMgY2xvc2VkLlxuICAgICAgLy8gY29yZS5hc3luYyByZXR1cm5zIGEgYm9vbGVhbiBvZiB3aGV0aGVyIG9yIG5vdCBzb21ldGhpbmcgKmNvdWxkKiBnZXQgcHV0IHRvIHRoZSBjaGFubmVsXG4gICAgICAvLyB3ZSdsbCBkbyB0aGUgc2FtZSAjY2FyZ29jdWx0XG4gICAgICB0eC5jb21taXQoKShmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYoIXRoaXMuX2J1ZmZlci5mdWxsKSB7XG4gICAgICAvLyBUaGUgY2hhbm5lbCBoYXMgc29tZSBmcmVlIHNwYWNlLiBTdGljayBpdCBpbiB0aGUgYnVmZmVyIGFuZCB0aGVuIGRyYWluIGFueSB3YWl0aW5nIHRha2VzLlxuXG4gICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgIHRoaXMuX2J1ZmZlci5hZGQodmFsKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiB0aGlzLl9idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgIGxldCB0YWtlclR4ID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICAgIGlmKHRha2VyVHguYWN0aXZlKSB7XG4gICAgICAgICAgbGV0IHZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcbiAgICAgICAgICBsZXQgdGFrZXJDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdGFrZXJDYih2YWwpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHg7XG4gICAgfSBlbHNlIGlmKHRoaXMuX3Rha2Vycy5sZW5ndGgpIHtcbiAgICAgIC8vIFRoZSBidWZmZXIgaXMgZnVsbCBidXQgdGhlcmUgYXJlIHdhaXRpbmcgdGFrZXJzIChlLmcuIHRoZSBidWZmZXIgaXMgc2l6ZSB6ZXJvKVxuXG4gICAgICBsZXQgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fdGFrZXJzLmxlbmd0aCAmJiAhdGFrZXJUeC5hY3RpdmUpIHtcbiAgICAgICAgdGFrZXJUeCA9IHRoaXMuX3Rha2Vycy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYodGFrZXJUeCAmJiB0YWtlclR4LmFjdGl2ZSkge1xuICAgICAgICB0eC5jb21taXQoKSh0cnVlKTtcbiAgICAgICAgbGV0IHRha2VDYiA9IHRha2VyVHguY29tbWl0KCk7XG5cbiAgICAgICAgZGlzcGF0Y2gucnVuKCgpID0+IHRha2VDYih2YWwpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3B1dHRlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHV0dGVycy5yZXNpemluZ1Vuc2hpZnQodHgpO1xuICAgIH1cblxuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHB1dCh2YWwsIHRyYW5zYWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICB0aGlzLmZpbGwodmFsLCB0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRyYWluKHR4ID0gbmV3IFRyYW5zYWN0b3IoKSkge1xuICAgIGlmKCEodHggaW5zdGFuY2VvZiBUcmFuc2FjdG9yKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgVHJhbnNhY3RvciB0byBiZSBwYXNzZWQgdG8gZHJhaW5cIik7IH1cbiAgICBpZighdHguYWN0aXZlKSB7IHJldHVybiB0eDsgfVxuXG4gICAgaWYodGhpcy5fYnVmZmVyLmxlbmd0aCkge1xuICAgICAgbGV0IGJ1ZlZhbCA9IHRoaXMuX2J1ZmZlci5yZW1vdmUoKTtcblxuICAgICAgd2hpbGUoIXRoaXMuX2J1ZmZlci5mdWxsICYmIHRoaXMuX3B1dHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGxldCBwdXR0ZXIgPSB0aGlzLnB1dHRlcnMucG9wKCk7XG5cbiAgICAgICAgaWYocHV0dGVyLmFjdGl2ZSkge1xuICAgICAgICAgIGxldCBwdXRUeCA9IHB1dHRlci5jb21taXQoKTtcblxuICAgICAgICAgIGRpc3BhdGNoLnJ1bigoKSA9PiB0aGlzLl9idWZmZXIuYWRkKHB1dFR4KCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eC5jb21taXQoKShidWZWYWwpO1xuICAgIH0gZWxzZSBpZih0aGlzLl9wdXR0ZXJzLmxlbmd0aCkge1xuICAgICAgbGV0IHB1dHRlclR4ID0gdGhpcy5fcHV0dGVycy5wb3AoKTtcblxuICAgICAgd2hpbGUodGhpcy5fcHV0dGVycy5sZW5ndGggJiYgIXB1dHRlclR4LmFjdGl2ZSkge1xuICAgICAgICBwdXR0ZXJUeCA9IHRoaXMuX3B1dHRlcnMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHB1dHRlclR4ICYmIHB1dHRlclR4LmFjdGl2ZSkge1xuICAgICAgICBsZXQgdHhDYiA9IHR4LmNvbW1pdCgpO1xuICAgICAgICBsZXQgcHV0dGVyQ2IgPSBwdXR0ZXJUeC5jb21taXQoKTtcblxuICAgICAgICBkaXNwYXRjaC5ydW4oKCkgPT4gdHhDYihwdXR0ZXJDYigpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl90YWtlcnMucmVzaXppbmdVbnNoaWZ0KHR4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFrZXJzLnJlc2l6aW5nVW5zaGlmdCh0eCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgdGFrZSh0cmFuc2FjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgdGhpcy5kcmFpbih0cmFuc2FjdG9yKS5kZXJlZihyZXNvbHZlKTtcbiAgICB9KTtcbiAgfVxuXG4gIHRoZW4oZm4sIGVycikge1xuICAgIHJldHVybiB0aGlzLnRha2UoKS50aGVuKGZuLCBlcnIpO1xuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgdGhpcy5faXNPcGVuID0gZmFsc2U7XG5cbiAgICB3aGlsZSAodGhpcy5fdGFrZXJzLmxlbmd0aCkge1xuICAgICAgbGV0IHRha2VyID0gdGhpcy5fdGFrZXJzLnBvcCgpO1xuXG4gICAgICBpZih0YWtlci5hY3RpdmUpIHtcbiAgICAgICAgdGFrZXIuY29tbWl0KCkobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IG9wZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzT3BlbjtcbiAgfVxufVxuXG5cbmV4cG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfTsiLCJsZXQgZGVmYXVsdEFzeW5jaHJvbml6ZXIgPSAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJykgPyBmdW5jdGlvbihmbikge1xuICByZXR1cm4gc2V0SW1tZWRpYXRlKGZuKTtcbn0gOiBmdW5jdGlvbihmbikge1xuICByZXR1cm4gc2V0VGltZW91dChmbik7XG59O1xuXG5jbGFzcyBEaXNwYXRjaCB7XG4gIGNvbnN0cnVjdG9yKGFzeW5jaHJvbml6ZXIpIHtcbiAgICB0aGlzLl9hc3luY2hyb25pemVyID0gYXN5bmNocm9uaXplciB8fCBkZWZhdWx0QXN5bmNocm9uaXplcjtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICB9XG5cbiAgcnVuKGZuKSB7XG4gICAgdGhpcy5fcXVldWUucHVzaChmbik7XG5cbiAgICB0aGlzLl9hc3luY2hyb25pemVyKCgpID0+IHtcbiAgICAgIHdoaWxlKHRoaXMuX3F1ZXVlLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuXG5leHBvcnQgeyBEaXNwYXRjaCB9OyIsImltcG9ydCB7IFByb21pc2UgfSBmcm9tIFwiLi9wcm9taXNlLmpzXCI7XG5cbmZ1bmN0aW9uIGRpc3RyaWJ1dGUodGFwcywgdmFsKSB7XG4gIGlmKCF0YXBzLmxlbmd0aCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgWyB0YXAsIC4uLnJlc3QgXSA9IHRhcHM7XG5cbiAgICByZXR1cm4gdGFwLnB1dCh2YWwpLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGRpc3RyaWJ1dGUocmVzdCwgdmFsKTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBNdWx0IHtcblxuICBjb25zdHJ1Y3RvcihjaCkge1xuICAgIHRoaXMuX3RhcHMgPSBbXTtcbiAgICB0aGlzLl9mcmVlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICBjaC50YWtlKCkudGhlbihmdW5jdGlvbiBkcmFpbkxvb3Aodikge1xuICAgICAgaWYodiA9PT0gbnVsbCkge1xuICAgICAgICAvLyBjbGVhbnVwXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gTG9ja3MgdGhlIGxpc3Qgb2YgdGFwcyB1bnRpbCB0aGUgZGlzdHJpYnV0aW9uIGlzIGNvbXBsZXRlXG4gICAgICBsZXQgZG9GcmVlLCBmcmVlID0gbmV3IFByb21pc2UociA9PiBkb0ZyZWUgPSByKTtcblxuICAgICAgdGhpcy5fZnJlZSA9IGZyZWU7XG5cbiAgICAgIGRpc3RyaWJ1dGUodGFwcywgdikudGhlbigoKSA9PiB7XG4gICAgICAgIGRvRnJlZSgpO1xuICAgICAgICBjaC50YWtlKCkudGhlbihkcmFpbkxvb3ApO1xuICAgICAgfSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHRhcChjaCwgY2xvc2UpIHtcbiAgICBpZih0aGlzLl90YXBzLnNvbWUodCA9PiB0LmNoID09PSBjaCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGFkZCB0aGUgc2FtZSBjaGFubmVsIHRvIGEgbXVsdCB0d2ljZVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZnJlZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RhcHMucHVzaCh7IGNsb3NlOiBjbG9zZSwgY2g6IGNoIH0pO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0pO1xuICB9XG5cbiAgdW50YXAoY2gpIHtcbiAgICByZXR1cm4gdGhpcy5fZnJlZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RhcHMgPSB0aGlzLl90YXBzLmZpbHRlcih0YXAgPT4ge1xuICAgICAgICByZXR1cm4gdGFwLmNoICE9PSBjaDtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0pO1xuICB9XG5cbn1cblxuZXhwb3J0IHsgTXVsdCB9OyIsImltcG9ydCB7IENoYW5uZWwsIFRyYW5zYWN0b3IgfSBmcm9tIFwiLi9jaGFubmVsLmpzXCI7XG5cblxuY2xhc3MgQWx0c1RyYW5zYWN0b3IgZXh0ZW5kcyBUcmFuc2FjdG9yIHtcbiAgY29uc3RydWN0b3Iob2ZmZXIsIGNvbW1pdENiKSB7XG4gICAgc3VwZXIob2ZmZXIpO1xuICAgIHRoaXMuY29tbWl0Q2IgPSBjb21taXRDYjtcbiAgfVxuICBjb21taXQoKSB7XG4gICAgdGhpcy5jb21taXRDYigpO1xuICAgIHJldHVybiBzdXBlci5jb21taXQoKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhbHRzKHJhY2UpIHtcbiAgbGV0IHRyYW5zYWN0b3JzID0gW107XG4gIGxldCBvdXRDaCA9IG5ldyBDaGFubmVsKCk7XG5cbiAgbGV0IGRlYWN0aXZhdGUgPSAoKSA9PiB7IHRyYW5zYWN0b3JzLmZvckVhY2goaCA9PiBoLmFjdGl2ZSA9IGZhbHNlKSB9XG5cbiAgcmFjZS5tYXAoY21kID0+IHtcblxuICAgIGlmKEFycmF5LmlzQXJyYXkoY21kKSkge1xuICAgICAgbGV0IHR4ID0gbmV3IEFsdHNUcmFuc2FjdG9yKHZhbCwgKCkgPT4ge1xuICAgICAgICB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSk7XG4gICAgICB9KTtcbiAgICAgIGxldCBbIGNoLCB2YWwgXSA9IGNtZDtcbiAgICAgIGNoLnB1dCh2YWwsIHR4KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBvdXRDaC5wdXQoWyB2YWwsIGNoIF0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRyYW5zYWN0b3JzLnB1c2godHgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgdHggPSBuZXcgQWx0c1RyYW5zYWN0b3IodHJ1ZSwgKCkgPT4ge1xuICAgICAgICB0cmFuc2FjdG9ycy5mb3JFYWNoKGggPT4gaC5hY3RpdmUgPSBmYWxzZSk7XG4gICAgICB9KTtcblxuICAgICAgY21kLnRha2UodHgpLnRoZW4oZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIG91dENoLnB1dChbIHZhbCwgY21kIF0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRyYW5zYWN0b3JzLnB1c2godHgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG91dENoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGltZW91dChtcykge1xuICB2YXIgY2ggPSBuZXcgQ2hhbm5lbCgpO1xuICBzZXRUaW1lb3V0KCgpID0+IHsgY2guY2xvc2UoKTsgfSwgbXMpO1xuICByZXR1cm4gY2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwaXBlKGluQ2gsIG91dENoLCBjbG9zZSA9IHRydWUpIHtcbiAgaW5DaC50YWtlKCkudGhlbihmdW5jdGlvbiBwaXBlKHYpIHtcbiAgICBpZih2ICE9PSBudWxsKSB7XG4gICAgICBvdXRDaC5wdXQodikudGhlbigoKSA9PiBpbkNoLnRha2UoKS50aGVuKHBpcGUpKTtcbiAgICB9IGVsc2UgaWYoY2xvc2UpIHtcbiAgICAgIG91dENoLmNsb3NlKCk7XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludG9BcnJheShjaCkge1xuICB2YXIgcmV0ID0gW107XG4gIHJldHVybiBjaC50YWtlKCkudGhlbihmdW5jdGlvbiBkcmFpbih2KSB7XG4gICAgaWYodiA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0LnB1c2godik7XG4gICAgICByZXR1cm4gY2gudGFrZSgpLnRoZW4oZHJhaW4pO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIEVuZm9yY2VzIG9yZGVyIHJlc29sdXRpb24gb24gcmVzdWx0aW5nIGNoYW5uZWxcbi8vIFRoaXMgbWlnaHQgbmVlZCB0byBiZSB0aGUgZGVmYXVsdCBiZWhhdmlvciwgdGhvdWdoIHRoYXQgcmVxdWlyZXMgbW9yZSB0aG91Z2h0XG5leHBvcnQgZnVuY3Rpb24gb3JkZXIoaW5jaCwgc2l6ZU9yQnVmKSB7XG4gIHZhciBvdXRjaCA9IG5ldyBDaGFubmVsKHNpemVPckJ1Zik7XG5cbiAgZnVuY3Rpb24gZHJhaW4oKSB7XG4gICAgaW5jaC50YWtlKCkudGhlbih2YWwgPT4ge1xuICAgICAgaWYodmFsID09PSBudWxsKSB7XG4gICAgICAgIG91dGNoLmNsb3NlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRjaC5wdXQodmFsKS50aGVuKGRyYWluKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBkcmFpbigpO1xuXG4gIHJldHVybiBvdXRjaDtcbn0iLCJcbmltcG9ydCAqIGFzICRxIGZyb20gXCIkcVwiO1xuXG52YXIgUHJvbWlzZSA9IHIgPT4ge1xuICByZXR1cm4gJHEocik7XG59O1xuXG5Qcm9taXNlLmFsbCA9ICRxLmFsbDtcblByb21pc2UucmVqZWN0ID0gJHEucmVqZWN0O1xuXG5Qcm9taXNlLnJhY2UgPSBwcm9tcyA9PiB7XG4gIHZhciBkb0Z1bGZpbGwsIGRvUmVqZWN0LCBwcm9tO1xuXG4gIHByb20gPSAkcSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG4gICAgZG9GdWxmaWxsID0gZnVsZmlsbDtcbiAgICBkb1JlamVjdCA9IHJlamVjdDtcbiAgfSk7XG5cbiAgcHJvbXMuZm9yRWFjaChwID0+IHAudGhlbihkb0Z1bGZpbGwsIGRvUmVqZWN0KSk7XG5cbiAgcmV0dXJuIHByb207XG59O1xuXG5Qcm9taXNlLnJlc29sdmUgPSB2YWwgPT4ge1xuICByZXR1cm4gJHEud2hlbih2YWwpO1xufTtcblxuZXhwb3J0IHsgUHJvbWlzZSB9OyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==