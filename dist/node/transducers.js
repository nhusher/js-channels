"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
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

exports.transducers = _transducers;
//# sourceMappingURL=transducers.js.map