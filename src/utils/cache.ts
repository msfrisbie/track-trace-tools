export class LRU<T> {
  private _elements: T[];

  constructor(elements: T[]) {
    this._elements = elements;
  }

  touch(element: T) {
    if (!this._elements.includes(element)) {
      throw new Error(`Element does not exist: ${element}`);
    }

    this._elements = [element, ...this._elements.filter((x) => x !== element)];
  }

  get elements() {
    return this._elements.slice();
  }

  get elementsReversed() {
    return this._elements.slice().reverse();
  }
}
