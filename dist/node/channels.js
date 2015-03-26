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
//# sourceMappingURL=channels.js.map