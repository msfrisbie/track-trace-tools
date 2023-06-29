import { IPackageHistoryData } from "@/interfaces";
import {
  extractChildPackageLabelsFromHistory,
  extractChildPackageTagQuantityPairsFromHistory,
  extractChildPackageTagQuantityUnitSetsFromHistory,
  extractInitialPackageLocationNameFromHistoryOrNull,
  extractInitialPackageQuantityAndUnitFromHistoryOrError,
  extractParentPackageLabelsFromHistory,
  extractParentPackageTagQuantityUnitItemSetsFromHistory,
  extractTestSamplePackageLabelsFromHistory,
} from "./history";

const BULK_BIOMASS_ACCEPTED_VIA_TRANSFER: IPackageHistoryData[] = [
  {
    Descriptions: [
      "Packaged 1,003 Pounds of SL Biscotti | Untrimmed Flower from another Package",
      "- Took 1,003 Pounds of SL Biscotti | Untrimmed Flower from Package 1A4000000000000000002468",
      "- Package Type: Product",
      "- Location: Building 1",
      "- Location Type: Default Location Type",
    ],
    UserName: "",
    ActualDate: "2023-03-16",
    RecordedDateTime: "2023-03-16T13:55:03.7804777Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: [
      "Package added to Manifest # 0000001234",
      "- From: Sending License LLC (LIC-000001)",
      "- To: Receiving License (LIC-000002)",
      "- License Type: Licensed",
      "- Transfer Type: InfusionTransfer",
    ],
    UserName: "",
    ActualDate: null,
    RecordedDateTime: "2023-03-16T14:00:25.9282851Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: [
      "454,953.147 Grams accepted from Manifest # 0000001234 by Receiving License (LIC-000002)",
      "- Location: Biomass Storage",
      "- Location Type: Default Location Type",
    ],
    UserName: "",
    ActualDate: null,
    RecordedDateTime: "2023-03-16T17:36:41.0584891Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
];

const MULTI_PARENT_BIOMASS_PACKAGE: IPackageHistoryData[] = [
  {
    Descriptions: [
      "Packaged 1,360,777.116 Grams of Bulk Biomass - To be Extracted in Ethanol from 12 different Packages",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000564",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000565",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000567",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000566",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000605",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000623",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000624",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000625",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000621",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000622",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000626",
      "- Took 250 Pounds of Hello Biomass from Package 1A4000000000000000000620",
      "- Package Type: Product",
      "- Location: Biomass Storage",
      "- Location Type: Default Location Type",
      "- Production Batch No: PROD BATCH 009001",
    ],
    UserName: "",
    ActualDate: "2022-09-21",
    RecordedDateTime: "2022-09-21T16:26:04.3514848Z",
    InputSourcesNames: "API",
    ExternalSourceName: "Distru",
  },
  {
    Descriptions: ["Used 172,507 Grams for Package 1A4000000000000000005001"],
    UserName: "",
    ActualDate: "2022-10-07",
    RecordedDateTime: "2022-10-07T14:38:31.9495714Z",
    InputSourcesNames: "API",
    ExternalSourceName: "Distru",
  },
  {
    Descriptions: ["Used 1,154,050.116 Grams for Package 1A4000000000000000005002"],
    UserName: "",
    ActualDate: "2022-10-07",
    RecordedDateTime: "2022-10-07T14:38:34.6899113Z",
    InputSourcesNames: "API",
    ExternalSourceName: "Distru",
  },
  {
    Descriptions: ["Used 34,220 Grams for Package 1A4000000000000000005003"],
    UserName: "",
    ActualDate: "2022-10-07",
    RecordedDateTime: "2022-10-07T14:38:38.3066046Z",
    InputSourcesNames: "API",
    ExternalSourceName: "Distru",
  },
  {
    Descriptions: ["Package finished"],
    UserName: "",
    ActualDate: "2022-10-10",
    RecordedDateTime: "2022-10-10T12:24:06.8822795Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
];

const PACKAGE_WITH_CHILD_SENT_FOR_TESTING: IPackageHistoryData[] = [
  {
    Descriptions: [
      "Packaged 225,849 Each of Gummies - Sour Strawberry Lemonade - 20mg (Indica) from 2 different Packages",
      "- Took 5,555 Each of Gummies - Super Sour Lemon - 20mg from Package 1A4000000000000000216887",
      "- Took 5,180 Grams of THC Distillate - Distilled in VTA from Package 1A4000000000000000216266",
      "- Package Type: Product",
      "- Location: Quarantine Room",
      "- Location Type: Default Location Type",
      "- Production Batch No: PROD BATCH 002",
    ],
    UserName: "",
    ActualDate: "2023-03-31",
    RecordedDateTime: "2023-03-31T10:48:48.2966116Z",
    InputSourcesNames: "API",
    ExternalSourceName: "Distru",
  },
  {
    Descriptions: ["Used 196 Each for Package 1A4000000000000000183917"],
    UserName: "",
    ActualDate: "2023-03-31",
    RecordedDateTime: "2023-03-31T10:53:28.4396841Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 36 Each for Package 1A4000000000000000213863"],
    UserName: "",
    ActualDate: "2023-03-31",
    RecordedDateTime: "2023-03-31T14:56:26.5327983Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: [
      "Related Package's (1A4000000000000000213863) Lab Testing set to SubmittedForTesting",
    ],
    UserName: "",
    ActualDate: "2023-03-31",
    RecordedDateTime: "2023-03-31T14:56:26.5327983Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
];

describe("history.ts", () => {
  it("Correctly extracts parent labels from history", () => {
    expect(extractParentPackageLabelsFromHistory(BULK_BIOMASS_ACCEPTED_VIA_TRANSFER)).toEqual([
      "1A4000000000000000002468",
    ]);
    expect(extractParentPackageLabelsFromHistory(MULTI_PARENT_BIOMASS_PACKAGE)).toEqual([
      "1A4000000000000000000564",
      "1A4000000000000000000565",
      "1A4000000000000000000567",
      "1A4000000000000000000566",
      "1A4000000000000000000605",
      "1A4000000000000000000623",
      "1A4000000000000000000624",
      "1A4000000000000000000625",
      "1A4000000000000000000621",
      "1A4000000000000000000622",
      "1A4000000000000000000626",
      "1A4000000000000000000620",
    ]);
    expect(extractParentPackageLabelsFromHistory(PACKAGE_WITH_CHILD_SENT_FOR_TESTING)).toEqual([
      "1A4000000000000000216887",
      "1A4000000000000000216266",
    ]);
  });

  it("Correctly extracts child labels from history", () => {
    expect(extractChildPackageLabelsFromHistory(BULK_BIOMASS_ACCEPTED_VIA_TRANSFER)).toEqual([]);
    expect(extractChildPackageLabelsFromHistory(MULTI_PARENT_BIOMASS_PACKAGE)).toEqual([
      "1A4000000000000000005001",
      "1A4000000000000000005002",
      "1A4000000000000000005003",
    ]);
    expect(extractChildPackageLabelsFromHistory(PACKAGE_WITH_CHILD_SENT_FOR_TESTING)).toEqual([
      "1A4000000000000000183917",
      "1A4000000000000000213863",
    ]);
  });

  it("Correctly extracts test sample labels from history", () => {
    expect(extractTestSamplePackageLabelsFromHistory(BULK_BIOMASS_ACCEPTED_VIA_TRANSFER)).toEqual(
      []
    );
    expect(extractTestSamplePackageLabelsFromHistory(MULTI_PARENT_BIOMASS_PACKAGE)).toEqual([]);
    expect(extractTestSamplePackageLabelsFromHistory(PACKAGE_WITH_CHILD_SENT_FOR_TESTING)).toEqual([
      "1A4000000000000000213863",
    ]);
  });

  it("Correctly extracts tag-quantity pairs and sets from history", () => {
    expect(
      extractChildPackageTagQuantityPairsFromHistory(BULK_BIOMASS_ACCEPTED_VIA_TRANSFER)
    ).toEqual([]);
    expect(extractChildPackageTagQuantityPairsFromHistory(MULTI_PARENT_BIOMASS_PACKAGE)).toEqual([
      ["1A4000000000000000005001", 172507],
      ["1A4000000000000000005002", 1154050.116],
      ["1A4000000000000000005003", 34220],
    ]);
    expect(
      extractChildPackageTagQuantityPairsFromHistory(PACKAGE_WITH_CHILD_SENT_FOR_TESTING)
    ).toEqual([
      ["1A4000000000000000183917", 196],
      ["1A4000000000000000213863", 36],
    ]);

    expect(
      extractParentPackageTagQuantityUnitItemSetsFromHistory(BULK_BIOMASS_ACCEPTED_VIA_TRANSFER)
    ).toEqual([["1A4000000000000000002468", 1003, "Pounds", "SL Biscotti | Untrimmed Flower"]]);
    expect(
      extractParentPackageTagQuantityUnitItemSetsFromHistory(MULTI_PARENT_BIOMASS_PACKAGE)
    ).toEqual([
      ["1A4000000000000000000564", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000565", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000567", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000566", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000605", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000623", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000624", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000625", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000621", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000622", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000626", 250, "Pounds", "Hello Biomass"],
      ["1A4000000000000000000620", 250, "Pounds", "Hello Biomass"],
    ]);
    expect(
      extractParentPackageTagQuantityUnitItemSetsFromHistory(PACKAGE_WITH_CHILD_SENT_FOR_TESTING)
    ).toEqual([
      ["1A4000000000000000216887", 5555, "Each", "Gummies - Super Sour Lemon - 20mg"],
      ["1A4000000000000000216266", 5180, "Grams", "THC Distillate - Distilled in VTA"],
    ]);

    expect(
      extractChildPackageTagQuantityUnitSetsFromHistory(BULK_BIOMASS_ACCEPTED_VIA_TRANSFER)
    ).toEqual([]);
    expect(extractChildPackageTagQuantityUnitSetsFromHistory(MULTI_PARENT_BIOMASS_PACKAGE)).toEqual(
      [
        ["1A4000000000000000005001", 172507, "Grams"],
        ["1A4000000000000000005002", 1154050.116, "Grams"],
        ["1A4000000000000000005003", 34220, "Grams"],
      ]
    );
    expect(
      extractChildPackageTagQuantityUnitSetsFromHistory(PACKAGE_WITH_CHILD_SENT_FOR_TESTING)
    ).toEqual([
      ["1A4000000000000000183917", 196, "Each"],
      ["1A4000000000000000213863", 36, "Each"],
    ]);
  });

  it("Correctly extracts initial quantity", () => {
    expect(
      extractInitialPackageQuantityAndUnitFromHistoryOrError(BULK_BIOMASS_ACCEPTED_VIA_TRANSFER)
    ).toEqual([1003, "Pounds"]);
    expect(
      extractInitialPackageQuantityAndUnitFromHistoryOrError(MULTI_PARENT_BIOMASS_PACKAGE)
    ).toEqual([1360777.116, "Grams"]);
    expect(
      extractInitialPackageQuantityAndUnitFromHistoryOrError(PACKAGE_WITH_CHILD_SENT_FOR_TESTING)
    ).toEqual([225849, "Each"]);
  });

  it("Correctly extracts the initial location name", () => {
    expect(
      extractInitialPackageLocationNameFromHistoryOrNull(BULK_BIOMASS_ACCEPTED_VIA_TRANSFER)
    ).toEqual("Building 1");
    expect(
      extractInitialPackageLocationNameFromHistoryOrNull(MULTI_PARENT_BIOMASS_PACKAGE)
    ).toEqual("Biomass Storage");
    expect(
      extractInitialPackageLocationNameFromHistoryOrNull(PACKAGE_WITH_CHILD_SENT_FOR_TESTING)
    ).toEqual("Quarantine Room");
  });
});
