var _transducers = false;

/* global require:true */
if(typeof window !== 'undefined' && window.transducers) {
  _transducers = window.transducers;
} else if(typeof global !== 'undefined') {
  let r = require; // Trick browserify
  try {
    _transducers = r('transducers-js');
  } catch (e) {}
}

export { _transducers as transducers };
