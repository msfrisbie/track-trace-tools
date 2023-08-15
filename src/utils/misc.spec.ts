import { IPackageData } from "@/interfaces";
import "@/test/utils/auto-mock-debug";
import { allocateImmaturePlantCounts } from "./misc";

function buildMockPackage(Quantity: number, QuantityTypeName = "CountBased"): IPackageData {
  const pkg = {
    Quantity,
    Item: { UnitOfMeasureId: 1, QuantityTypeName },
  };

  // @ts-ignore
  return pkg as IPackageData;
}

describe("misc.ts", () => {
  it("Correctly allocates plant counts to a single small package", () => {
    const mockPackages: IPackageData[] = [90].map((qty) => buildMockPackage(qty));

    expect(allocateImmaturePlantCounts(3, mockPackages)).toEqual([
      {
        count: 3,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 90,
        },
        quantity: 3,
        unitOfMeasureId: 1,
      },
    ]);

    expect(allocateImmaturePlantCounts(90, mockPackages)).toEqual([
      {
        count: 90,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 90,
        },
        quantity: 90,
        unitOfMeasureId: 1,
      },
    ]);

    expect(() => allocateImmaturePlantCounts(110, mockPackages)).toThrowError();
  });

  it("Correctly allocates plant counts to a single large package", () => {
    const mockPackages: IPackageData[] = [900].map((qty) => buildMockPackage(qty));

    expect(allocateImmaturePlantCounts(3, mockPackages)).toEqual([
      {
        count: 3,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 900,
        },
        quantity: 3,
        unitOfMeasureId: 1,
      },
    ]);

    expect(allocateImmaturePlantCounts(202, mockPackages)).toEqual([
      {
        count: 100,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 900,
        },
        quantity: 100,
        unitOfMeasureId: 1,
      },
      {
        count: 100,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 900,
        },
        quantity: 100,
        unitOfMeasureId: 1,
      },
      {
        count: 2,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 900,
        },
        quantity: 2,
        unitOfMeasureId: 1,
      },
    ]);

    expect(() => allocateImmaturePlantCounts(1000, mockPackages)).toThrowError();
  });

  it("Correctly allocates plant counts to multiple packages", () => {
    const mockPackages: IPackageData[] = [50, 100, 150].map((qty) => buildMockPackage(qty));

    expect(allocateImmaturePlantCounts(3, mockPackages)).toEqual([
      {
        count: 3,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 50,
        },
        quantity: 3,
        unitOfMeasureId: 1,
      },
    ]);

    expect(allocateImmaturePlantCounts(200, mockPackages)).toEqual([
      {
        count: 50,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 50,
        },
        quantity: 50,
        unitOfMeasureId: 1,
      },
      {
        count: 100,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 100,
        },
        quantity: 100,
        unitOfMeasureId: 1,
      },
      {
        count: 50,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 150,
        },
        quantity: 50,
        unitOfMeasureId: 1,
      },
    ]);

    expect(allocateImmaturePlantCounts(300, mockPackages)).toEqual([
      {
        count: 50,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 50,
        },
        quantity: 50,
        unitOfMeasureId: 1,
      },
      {
        count: 100,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 100,
        },
        quantity: 100,
        unitOfMeasureId: 1,
      },
      {
        count: 100,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 150,
        },
        quantity: 100,
        unitOfMeasureId: 1,
      },
      {
        count: 50,
        pkg: {
          Item: {
            QuantityTypeName: "CountBased",
            UnitOfMeasureId: 1,
          },
          Quantity: 150,
        },
        quantity: 50,
        unitOfMeasureId: 1,
      },
    ]);

    expect(() => allocateImmaturePlantCounts(301, mockPackages)).toThrowError();
  });

  it("Correctly allocates weight-based plant counts to a single package", () => {
    const mockPackages: IPackageData[] = [50, 100, 150].map((qty) =>
      buildMockPackage(qty, "WeightBased")
    );

    expect(() => allocateImmaturePlantCounts(3, mockPackages)).toThrowError();

    expect(() => allocateImmaturePlantCounts(90, mockPackages)).toThrowError();

    expect(() => allocateImmaturePlantCounts(110, mockPackages)).toThrowError();
  });
});
