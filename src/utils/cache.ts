export class LRU<T> {
  elements: T[];

  constructor(elements: T[]) {
    this.elements = elements;
  }

  touch(element: T) {
    if (!this.elements.includes(element)) {
      throw new Error("Element does not exist");
    }

    this.elements = [element, ...this.elements.filter((x) => x !== element)];
  }
}
