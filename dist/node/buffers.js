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
//# sourceMappingURL=buffers.js.map