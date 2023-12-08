import { cellIdentifierFromCoordinates, convertMatrixIntoKeyValRows } from "./csv";

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

  it("Correctly converts csv coordinates into a readable cell", () => {
    expect(cellIdentifierFromCoordinates({ rowIndex: 0, columnIndex: 0 })).toEqual("A1");
    expect(cellIdentifierFromCoordinates({ rowIndex: 1, columnIndex: 0 })).toEqual("A2");
    expect(cellIdentifierFromCoordinates({ rowIndex: 0, columnIndex: 1 })).toEqual("B1");
    expect(cellIdentifierFromCoordinates({ rowIndex: 1, columnIndex: 1 })).toEqual("B2");
    expect(cellIdentifierFromCoordinates({ rowIndex: 2, columnIndex: 2 })).toEqual("C3");
    expect(cellIdentifierFromCoordinates({ rowIndex: 27, columnIndex: 0 })).toEqual("A28");
    expect(cellIdentifierFromCoordinates({ rowIndex: 0, columnIndex: 27 })).toEqual("AB1");
    expect(cellIdentifierFromCoordinates({ rowIndex: 27, columnIndex: 27 })).toEqual("AB28");
  });
});
