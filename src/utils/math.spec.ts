import { evenDistribution, fStrip } from "./math";

describe("math.ts", () => {
  it("fStrip correctly rounds 0.1 + 0.2", () => {
    expect(fStrip(0.1 + 0.2)).toEqual(0.3);
  });

  it("fStrip handles relatively large and small numbers correctly", () => {
    expect(fStrip(0.000001 + 0.000002)).toEqual(0.000003);
    expect(fStrip(1000000.0 + 2000000.0)).toEqual(3000000.0);
    expect(fStrip(1000000.00001 + 2000000.00002)).toEqual(3000000.00003);
  });

  it("fStrip handles zero comparison correctly", () => {
    expect(fStrip(0.000001)).toBeGreaterThan(0);
    expect(fStrip(0.0000001)).toEqual(0);
    expect(fStrip(0.00000000000000001)).toEqual(0);

    expect(fStrip(-0.000001)).toBeLessThan(0);
    expect(fStrip(-0.0000001)).toEqual(0);
    expect(fStrip(-0.00000000000000001)).toEqual(0);
  });

  it("evenDistribution allocates values correctly", () => {
    expect(evenDistribution(100, 5)).toEqual([20, 20, 20, 20, 20]);
    expect(evenDistribution(3, 5)).toEqual([1, 1, 1, 0, 0]);
    expect(evenDistribution(0, 5)).toEqual([0, 0, 0, 0, 0]);
    expect(evenDistribution(100, 1)).toEqual([100]);
    expect(evenDistribution(99, 2)).toEqual([50, 49]);
    expect(evenDistribution(101, 2)).toEqual([51, 50]);
    expect(evenDistribution(99, 4)).toEqual([25, 25, 25, 24]);
    expect(evenDistribution(101, 4)).toEqual([26, 25, 25, 25]);
    expect(evenDistribution(102, 4)).toEqual([26, 26, 25, 25]);
  });
});
