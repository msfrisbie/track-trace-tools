// Use this to deal with inexact floating point arithmetic
//
// 0.1 + 0.2 = 0.30000000000000004
//

import _ from "lodash";

// fStrip(0.1 + 0.2) = 0.3
export function fStrip(x: number): number {
  // toPrecision() will not round down 0.00000000000001
  if (Math.abs(x) < 1e-6) {
    return 0;
  }

  return parseFloat(x.toPrecision(12));
}

// Returns a value between 0 and 1 in a normal distribution
function randn_bm(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randn_bm(); // resample between 0 and 1
  return num;
}

export function normalDistribution(total: number, count: number, precision: number): number[] {
  const values: number[] = [];

  const average = parseFloat((total / count).toFixed(8));

  for (let i = 0; i < count; ++i) {
    values.push(average * randn_bm() * 2);
  }

  const offset = total - values.reduce((a, b) => a + b, 0);

  const offsetPer = parseFloat((offset / count).toFixed(8));

  for (let i = 0; i < count; ++i) {
    values[i] = _.round(values[i] + offsetPer, precision);
  }

  return values;
}

export function evenDistribution(total: number, count: number, precision: number): number[] {
  const average = _.round(total / count, precision);

  const values: number[] = Array(count).fill(average);

  const offset = _.round(total - values.reduce((a, b) => a + b, 0), precision);

  values[0] = _.round(values[0] + offset, precision);

  return values;
}

export function evenIntegerDistribution(total: number, count: number): number[] {
  const values: number[] = [];

  const roundedAverage = Math.floor(total / count);

  for (let i = 0; i < count; ++i) {
    if (i < total % count) {
      values.push(roundedAverage + 1);
    } else {
      values.push(roundedAverage);
    }
  }

  return values;
}

export function round(x: number, maxDecimalPlaces: number): number {
  return Math.round((x + Number.EPSILON) * 10 ** maxDecimalPlaces) / 10 ** maxDecimalPlaces;
}
