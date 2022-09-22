export type UnitOfMeasureName = 'Pounds' | 'Ounces' | 'Grams' | 'Milligrams' | 'Kilograms'

export function normalizeToGrams(quantity: number, unitOfMeasureName: UnitOfMeasureName): number {
    switch (unitOfMeasureName) {
        case 'Grams':
            return quantity;
        case 'Milligrams':
            return quantity / 1000;
        case 'Kilograms':
            return quantity * 1000;
        case 'Ounces':
            return quantity * 28.3495;
        case 'Pounds':
            return quantity * 453.592;
        default:
            throw new Error('Unexpected input!');
    }
}

export function unitOfMeasureNameToAbbreviation(unitOfMeasureName: UnitOfMeasureName | 'Each' | 'Milliliters'): string {
    switch (unitOfMeasureName) {
        case 'Grams':
            return 'g';
        case 'Milligrams':
            return 'mg;'
        case 'Kilograms':
            return 'kg';
        case 'Ounces':
            return 'oz';
        case 'Pounds':
            return 'lb'
        case 'Each':
            return 'ct'
        case 'Milliliters':
            return 'mL'
        default:
            // If it's unexpected, just return the original value
            return unitOfMeasureName;
    }
}