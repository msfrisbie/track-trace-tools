import { IUnitOfMeasure } from "@/interfaces";
import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-fetch";
import {
  convertUnits,
  fuzzyUnitOrError,
  fuzzyUnitOrNull,
  fuzzyUnitsMatch,
  fuzzyUnitsMatchOrError,
} from "./units";

const unitsOfMeasure: IUnitOfMeasure[] = [
  {
    Id: 1,
    IsBaseUnit: true,
    QuantityType: "CountBased",
    Name: "Each",
    Abbreviation: "ea",
    FromBaseFactor: 1,
    ToBaseFactor: 1,
    IsArchived: false,
  },
  {
    Id: 11,
    IsBaseUnit: true,
    QuantityType: "VolumeBased",
    Name: "Fluid Ounces",
    Abbreviation: "fl oz",
    FromBaseFactor: 1,
    ToBaseFactor: 1,
    IsArchived: false,
  },
  {
    Id: 12,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Gallons",
    Abbreviation: "gal",
    FromBaseFactor: 0.0078125,
    ToBaseFactor: 128,
    IsArchived: false,
  },
  {
    Id: 4,
    IsBaseUnit: false,
    QuantityType: "WeightBased",
    Name: "Grams",
    Abbreviation: "g",
    FromBaseFactor: 28.349523125,
    ToBaseFactor: 0.035273961949580414,
    IsArchived: false,
  },
  {
    Id: 6,
    IsBaseUnit: false,
    QuantityType: "WeightBased",
    Name: "Kilograms",
    Abbreviation: "kg",
    FromBaseFactor: 0.028349523125,
    ToBaseFactor: 35.27396194958041,
    IsArchived: false,
  },
  {
    Id: 13,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Liters",
    Abbreviation: "l",
    FromBaseFactor: 0.0295735295625,
    ToBaseFactor: 33.814022701842994,
    IsArchived: false,
  },
  {
    Id: 5,
    IsBaseUnit: false,
    QuantityType: "WeightBased",
    Name: "Milligrams",
    Abbreviation: "mg",
    FromBaseFactor: 28349.523125,
    ToBaseFactor: 0.00003527396194958041,
    IsArchived: false,
  },
  {
    Id: 14,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Milliliters",
    Abbreviation: "ml",
    FromBaseFactor: 29.5735295625,
    ToBaseFactor: 0.033814022701843,
    IsArchived: false,
  },
  {
    Id: 2,
    IsBaseUnit: true,
    QuantityType: "WeightBased",
    Name: "Ounces",
    Abbreviation: "oz",
    FromBaseFactor: 1,
    ToBaseFactor: 1,
    IsArchived: false,
  },
  {
    Id: 15,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Pints",
    Abbreviation: "pt",
    FromBaseFactor: 0.0625,
    ToBaseFactor: 16,
    IsArchived: false,
  },
  {
    Id: 3,
    IsBaseUnit: false,
    QuantityType: "WeightBased",
    Name: "Pounds",
    Abbreviation: "lb",
    FromBaseFactor: 0.0625,
    ToBaseFactor: 16,
    IsArchived: false,
  },
  {
    Id: 16,
    IsBaseUnit: false,
    QuantityType: "VolumeBased",
    Name: "Quarts",
    Abbreviation: "qt",
    FromBaseFactor: 0.03125,
    ToBaseFactor: 32,
    IsArchived: false,
  },
];

describe("units.ts", () => {
  it("Correctly converts units", () => {
    const oz = unitsOfMeasure.find((x) => x.Name === "Ounces")!;
    const g = unitsOfMeasure.find((x) => x.Name === "Grams")!;
    const lbs = unitsOfMeasure.find((x) => x.Name === "Pounds")!;

    expect(convertUnits(1, oz, oz)).toEqual(1);
    expect(convertUnits(1, g, g)).toEqual(1);
    expect(convertUnits(1, oz, g)).toEqual(28.349523125);
    expect(convertUnits(1, g, oz)).toEqual(0.035273961949580414);
    expect(convertUnits(1, lbs, g)).toEqual(453.59237);
  });

  it("Correctly fuzzy matches units", async () => {
    expect((await fuzzyUnitOrError("g")).Id).toEqual(4);
    expect(fuzzyUnitOrError("q")).rejects.toEqual(Error("Unit value invalid: q"));
    expect(await fuzzyUnitOrNull("q")).toEqual(null);

    expect(await fuzzyUnitsMatchOrError("Grams", "g")).toEqual(true);
    expect(await fuzzyUnitsMatchOrError("Pounds", "g")).toEqual(false);
    expect(await fuzzyUnitsMatchOrError(4, "g")).toEqual(true);
    expect(await fuzzyUnitsMatchOrError("g", 4)).toEqual(true);
    expect(fuzzyUnitsMatchOrError("foo", "g")).rejects.toEqual(Error(`Unit value invalid: foo`));
    expect(await fuzzyUnitsMatch("foo", "g")).toEqual(false);
    expect(await fuzzyUnitsMatch("", "g")).toEqual(false);
  });
});
