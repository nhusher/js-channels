
import * as $q from "$q";

var Promise = r => {
  return $q(r);
};

Promise.all = $q.all;
Promise.reject = $q.reject;

Promise.race = proms => {
  var doFulfill, doReject, prom;

  prom = $q((fulfill, reject) => {
    doFulfill = fulfill;
    doReject = reject;
  });

  proms.forEach(p => p.then(doFulfill, doReject));

  return prom;
};

Promise.resolve = val => {
  return $q.when(val);
};

export { Promise };