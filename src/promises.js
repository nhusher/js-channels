
var _Promise = {};
if(typeof Promise !== 'undefined') {
  _Promise = Promise;
} else if(typeof window !== 'undefined' && typeof window.angular !== 'undefined') {
  // Begrudgingly use Angular's promise implementation
} else if(typeof require !== 'undefined') {
  _Promise = require('bluebird');
  //export { Promise };
  //var Promise = {};
  //export { Promise };
}

export { _Promise }