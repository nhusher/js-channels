"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.alts = alts;
exports.timeout = timeout;
exports.pipelineAsync = pipelineAsync;

// Enforces order resolution on resulting channel
// This might need to be the default behavior, though that requires more thought
exports.order = order;
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
//# sourceMappingURL=utils.js.map