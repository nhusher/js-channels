
//
// TODO: this isn't idiomatically javascript (could probably use slice/splice to good effect)
//
function acopy(src, srcStart, dest, destStart, length) {
  for(let i = 0; i < length; i += 1) {
    dest[i + destStart] = src[i + srcStart];
  }
}

// --------------------------------------------------------------------------

class RingBuffer {
  constructor(s) {
    let size = (typeof s === 'number') ? Math.max(1, s) : 1;
    this._tail   = 0;
    this._head   = 0;
    this._length = 0;
    this._values = new Array(size);
  }

  pop() {
    let result;
    if(this.length) {
      // Get the item out of the set of values
      result = this._values[this._tail] || null;

      // Remove the item from the set of values, update indicies
      this._values[this._tail] = null;
      this._tail = (this._tail + 1) % this._values.length;
      this._length -= 1;
    } else {
      result = null;
    }
    return result;
  }

  unshift(val) {
    this._values[this._head] = val;
    this._head = (this._head + 1) % this._values.length;
    this._length += 1;
  }

  resizingUnshift(val) {
    if(this.length + 1 == this._values.length) {
      this.resize();
    }
    this.unshift(val);
  }

  resize() {
    let newArry = new Array(this._values.length * 2);

    if(this._tail < this._head) {
      acopy(this._values, this._tail, newArry, 0, head);

      this._tail = 0;
      this._head = this.length;
      this._values = newArry;

    } else if(this._head < this._tail) {
      acopy(this._values, 0, newArry, this._values.length - this._tail, head);

      this._tail = 0;
      this._head = this.length;
      this._values = newArry;

    } else {
      this._tail = 0;
      this._head = 0;
      this._values = newArry;
    }
  }

  get length() {
    return this._length;
  }
}

// --------------------------------------------------------------------------

class FixedBuffer {
  constructor(n) {
    this._buf = new RingBuffer(n);
    this._size = n;
  }

  remove() {
    return this._buf.pop();
  }

  add(v) {
    this._buf.resizingUnshift(v);
  }

  get length() {
    return this._buf.length;
  }

  get full() {
    return this._buf.length === this._size;
  }
}

// --------------------------------------------------------------------------

class DroppingBuffer extends FixedBuffer {
  add(v) {
    if(this._buf.length < this._size) {
      this._buf.unshift(v);
    }
  }

  get full() {
    return false;
  }
}

// --------------------------------------------------------------------------

class SlidingBuffer extends FixedBuffer {
  add(v) {
    if(this._buf.length === this._size) {
      this.remove();
    }
    this._buf.unshift(v);
  }

  get full() {
    return false;
  }
}

export { DroppingBuffer, SlidingBuffer, FixedBuffer, RingBuffer };