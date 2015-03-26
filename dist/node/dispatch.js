"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.Dispatch = Dispatch;
//# sourceMappingURL=dispatch.js.map