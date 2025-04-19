export function shipperWholesalePriceToDollarString(shipperWholesalePrice: number | null): string {
    if (shipperWholesalePrice === null) {
        return '';
    }

    return `$${shipperWholesalePrice.toFixed(2)}`;
}
