import { IMetrcCreateTransferPayload } from "@/interfaces";

export const data: IMetrcCreateTransferPayload[] = [
  {
    ShipmentLicenseType: "Licensed",
    Destinations: [
      {
        ShipmentLicenseType: "Licensed",
        RecipientId: "27",
        PlannedRoute: "adsf",
        TransferTypeId: "1",
        EstimatedDepartureDateTime: "2023-05-23T22:36:48",
        EstimatedArrivalDateTime: "2023-05-23T22:36:48",
        GrossWeight: "",
        GrossUnitOfWeightId: "",
        Transporters: [
          {
            TransporterId: "31",
            PhoneNumberForQuestions: "1231231234",
            TransporterDetails: [
              {
                DriverName: "asdf",
                DriverOccupationalLicenseNumber: "asdf",
                DriverLicenseNumber: "asdf",
                DriverLayoverLeg: "",
                VehicleMake: "asdf",
                VehicleModel: "asdf",
                VehicleLicensePlateNumber: "asdf",
              },
            ],
          },
        ],
        Packages: [{
          Id: "64", WholesalePrice: "", GrossWeight: "", GrossUnitOfWeightId: ""
        }],
      },
    ],
  },
];
