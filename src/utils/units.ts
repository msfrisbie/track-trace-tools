import { IUnitOfMeasure } from "@/interfaces";
import { dynamicConstsManager } from "@/modules/dynamic-consts-manager.module";

export type UnitOfMeasureName =
  | "Pounds"
  | "Ounces"
  | "Grams"
  | "Milligrams"
  | "Kilograms"
  | "Each"
  | "Milliliters"
  | "Liters"
  | "Fluid Ounces"
  | "Gallons"
  | "Milliliters"
  | "Pints"
  | "Quarts"
  | "Units";
export type UnitOfMeasureAbbreviation =
  | "lb"
  | "oz"
  | "g"
  | "mg"
  | "kg"
  | "ml"
  | "l"
  | "fl oz"
  | "pt"
  | "qt"
  | "gal"
  | "ea"
  | "units";

export function normalizeToGrams(quantity: number, unitOfMeasureName: UnitOfMeasureName): number {
  switch (unitOfMeasureName) {
    case "Grams":
      return quantity;
    case "Milligrams":
      return quantity / 1000;
    case "Kilograms":
      return quantity * 1000;
    case "Ounces":
      return quantity * 28.3495;
    case "Pounds":
      return quantity * 453.592;
    default:
      throw new Error("Unexpected input!");
  }
}

export function unitOfMeasureNameToAbbreviation(
  unitOfMeasureName: UnitOfMeasureName
): UnitOfMeasureAbbreviation {
  switch (unitOfMeasureName) {
    case "Grams":
      return "g";
    case "Milligrams":
      return "mg";
    case "Kilograms":
    case "Ounces":
      return "oz";
    case "Pounds":
      return "lb";
    case "Each":
      return "ea";
    case "Milliliters":
      return "ml";
    case "Units":
      return "ea";
    default:
      // If it's unexpected, just return the original value
      return "units";
  }
}
export function unitOfMeasureAbbreviationToName(
  unitOfMeasureAbbreviation: UnitOfMeasureAbbreviation
): UnitOfMeasureName {
  switch (unitOfMeasureAbbreviation) {
    case "g":
      return "Grams";
    case "mg":
      return "Milligrams";
    case "kg":
      return "Kilograms";
    case "oz":
      return "Ounces";
    case "lb":
      return "Pounds";
    case "ml":
      return "Milliliters";
    default:
      // If it's unexpected, just return the original value
      return "Units";
  }
}

export function convertUnits(
  quantity: number,
  fromUnitOfMeasure: IUnitOfMeasure,
  toUnitOfMeasure: IUnitOfMeasure
): number {
  return quantity * fromUnitOfMeasure.ToBaseFactor * toUnitOfMeasure.FromBaseFactor;
}

export async function fuzzyUnitsMatchOrError(
  a: { name?: string; id?: number; abbreviation?: string },
  b: { name?: string; id?: number; abbreviation?: string }
): Promise<boolean> {
  const unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

  let unitA: IUnitOfMeasure | null = null;
  let unitB: IUnitOfMeasure | null = null;

  if (a.name !== undefined) {
    unitA =
      unitsOfMeasure.find((x) => x.Name.toLocaleLowerCase() === a.name!.toLocaleLowerCase()) ??
      null;
  } else if (a.id !== undefined) {
    unitA = unitsOfMeasure.find((x) => x.Id === a.id) ?? null;
  } else if (a.abbreviation !== undefined) {
    unitA =
      unitsOfMeasure.find(
        (x) => x.Abbreviation.toLocaleLowerCase() === a.abbreviation!.toLocaleLowerCase()
      ) ?? null;
  }

  if (unitA === null) {
    throw new Error(`Unit A value invalid: ${JSON.stringify(a)}`);
  }

  if (b.name !== undefined) {
    unitB =
      unitsOfMeasure.find((x) => x.Name.toLocaleLowerCase() === b.name!.toLocaleLowerCase()) ??
      null;
  } else if (b.id !== undefined) {
    unitB = unitsOfMeasure.find((x) => x.Id === b.id) ?? null;
  } else if (b.abbreviation !== undefined) {
    unitB =
      unitsOfMeasure.find(
        (x) => x.Abbreviation.toLocaleLowerCase() === b.abbreviation!.toLocaleLowerCase()
      ) ?? null;
  }

  if (unitB === null) {
    throw new Error(`Unit B value invalid: ${JSON.stringify(b)}`);
  }

  return unitA.Id === unitB.Id;
}
