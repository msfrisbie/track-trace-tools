import { IMetrcTransferType } from '@/interfaces';

export const data: IMetrcTransferType = {
  Id: 111,
  Name: 'Wholesale Manifest',
  TransactionType: 'Wholesale',
  TransactionTypeName: 'Wholesale',
  ForLicensedShipments: true,
  ForExternalIncomingShipments: true,
  ShipperLicenseNumberFieldEnabled: true,
  ShipperLicenseNumberFieldLabel: 'Origin Temp. Lic. No.',
  ShipperLicenseNameFieldEnabled: true,
  ShipperAddressFieldsEnabled: true,
  ForExternalOutgoingShipments: true,
  RecipientLicenseNumberFieldEnabled: true,
  RecipientLicenseNumberFieldLabel: 'Destination Temp. Lic. No.',
  RecipientLicenseNameFieldEnabled: true,
  RecipientAddressFieldsEnabled: true,
  TransporterFieldsEnabled: true,
  RequiresDestinationGrossWeight: false,
  RequiresPackagesGrossWeight: false,
  MinimumWholesalePrice: null,
  MaximumWholesalePrice: null,
  FacilityTypes: [
    {
      FacilityTypeId: 209,
      FacilityTypeName: 'Cannabis - Microbusiness License',
    },
  ],
};
