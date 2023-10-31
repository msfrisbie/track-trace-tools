import { pageManager } from "./page-manager.module";

export function noScrollEventFactory(eventName = "click"): Event {
  const e = new Event(eventName);
  e.preventDefault();
  return e;
}

export function atLeastOneIsTruthy(...elements: any[]) {
  return elements.reduce((a, b) => !!a || !!b);
}
