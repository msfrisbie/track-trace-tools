import { convertMatrixIntoKeyValRows } from "./csv";

describe("csv.ts", () => {
  it("Correctly converts a matrix into keyval rows", () => {
    expect(
      convertMatrixIntoKeyValRows({
        headerRowIndex: 1,
        matrix: [["baz"], ["foo", "bar", "baz"], ["1", "2", "3"], ["4", "5", "6"]],
        columns: ["foo", "bar", "baz"],
      })
    ).toEqual([
      {
        Index: 0,
        RealIndex: 1,
        foo: "1",
        bar: "2",
        baz: "3",
      },
      {
        Index: 1,
        RealIndex: 2,
        foo: "4",
        bar: "5",
        baz: "6",
      },
    ]);
  });
});
