import { IMetrcCreateTransferPayload } from '@/interfaces';

export const data: IMetrcCreateTransferPayload[] = [
  {
    ShipmentLicenseType: 'Licensed',
    Destinations: [
      {
        ShipmentLicenseType: 'Licensed',
        RecipientId: '23702',
        PlannedRoute: 'asdf',
        TransferTypeId: '17',
        EstimatedDepartureDateTime: '2023-05-23T21:22:35',
        EstimatedArrivalDateTime: '2023-05-23T21:22:35',
        GrossWeight: '123.45',
        GrossUnitOfWeightId: '4',
        Transporters: [
          {
            TransporterId: '122104',
            PhoneNumberForQuestions: '1231231234',
            TransporterDetails: [
              {
                DriverName: 'asdf',
                DriverOccupationalLicenseNumber: 'asdf',
                DriverLicenseNumber: 'asdf',
                DriverLayoverLeg: '',
                VehicleMake: 'asdf',
                VehicleModel: 'asdf',
                VehicleLicensePlateNumber: 'asdf',
              },
            ],
          },
        ],
        Packages: [
          {
            Id: '2107182',
            WholesalePrice: '',
            GrossWeight: '',
            GrossUnitOfWeightId: '',
          },
        ],
      },
    ],
  },
];
