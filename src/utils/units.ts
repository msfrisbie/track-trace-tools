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

export async function fuzzyUnitOrError(a: string | number): Promise<IUnitOfMeasure> {
  const unitsOfMeasure = await dynamicConstsManager.unitsOfMeasure();

  let unitA: IUnitOfMeasure | null = null;

  unitA =
    unitsOfMeasure.find((x) => x.Name.toLocaleLowerCase() === a.toString().toLocaleLowerCase()) ??
    null;

  if (!unitA) {
    unitA = unitsOfMeasure.find((x) => x.Id.toString() === a.toString()) ?? null;
  }

  if (!unitA) {
    unitA =
      unitsOfMeasure.find(
        (x) => x.Abbreviation.toLocaleLowerCase() === a.toString().toLocaleLowerCase()
      ) ?? null;
  }

  if (unitA === null) {
    throw new Error(`Unit value invalid: ${a}`);
  }

  return unitA;
}

export async function fuzzyUnitOrNull(a: string | number): Promise<IUnitOfMeasure | null> {
  try {
    return await fuzzyUnitOrError(a);
  } catch {
    return null;
  }
}

export async function fuzzyUnitsMatchOrError(
  a: string | number,
  b: string | number
): Promise<boolean> {
  let unitA: IUnitOfMeasure = await fuzzyUnitOrError(a);
  let unitB: IUnitOfMeasure = await fuzzyUnitOrError(b);

  return unitA.Id === unitB.Id;
}

export async function fuzzyUnitsMatch(a: string | number, b: string | number): Promise<boolean> {
  try {
    return await fuzzyUnitsMatchOrError(a, b);
  } catch {
    return false;
  }
}
