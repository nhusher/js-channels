
import * as $q from "$q";


var Prom = r => {
  return $q(r);
};

Prom.all = $q.all;
Prom.reject = $q.reject;

Prom.race = proms => {
  var doFulfill, doReject, prom;

  prom = $q((fulfill, reject) => {
    doFulfill = fulfill;
    doReject = reject;
  });

  proms.forEach(p => p.then(doFulfill, doReject));

  return prom;
};

Prom.resolve = val => {
  return $q.when(val);
};

export { Prom as Promise };