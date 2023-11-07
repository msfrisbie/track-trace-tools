import { IMetrcCreateTransferPayload } from '@/interfaces';

export const data: IMetrcCreateTransferPayload[] = [
  {
    ShipmentLicenseType: 'Licensed',
    Destinations: [
      {
        ShipmentLicenseType: 'Licensed',
        RecipientId: '23702',
        PlannedRoute: 'route',
        TransferTypeId: '4',
        EstimatedDepartureDateTime: '2023-05-23T21:06:48',
        EstimatedArrivalDateTime: '2023-05-23T21:06:48',
        GrossWeight: '123.45',
        GrossUnitOfWeightId: '4',
        Transporters: [
          {
            TransporterId: '122104',
            PhoneNumberForQuestions: '1231231234',
            EstimatedArrivalDateTime: '2023-05-23T21:06:48',
            IsLayover: 'true',
            EstimatedDepartureDateTime: '2023-05-24T21:06:48',
            TransporterDetails: [
              {
                DriverName: 'asdf',
                DriverOccupationalLicenseNumber: 'asdf',
                DriverLicenseNumber: 'asdf',
                DriverLayoverLeg: 'FromAndToLayover',
                VehicleMake: 'asdf',
                VehicleModel: 'asdf',
                VehicleLicensePlateNumber: 'asdf'
              }
            ]
          }
        ],
        Packages: [
          {
            Id: '3431538',
            WholesalePrice: '7',
            GrossWeight: '',
            GrossUnitOfWeightId: ''
          }
        ]
      }
    ]
  }
];
