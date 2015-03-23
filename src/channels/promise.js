var _Promise;

/* global global:true */
if(typeof window !== 'undefined' && window.Promise) {
  _Promise = window.Promise;
} else if(typeof global !== 'undefined' && global.Promise) {
  _Promise = global.Promise;
} else {
  throw new Error("Unable to find native promise implementation.");
}

export { _Promise as Promise };
