import { IHarvestHistoryData, IPackageHistoryData } from "@/interfaces";
import {
  extractAdjustmentReasonNoteSetsFromHistory,
  extractChildPackageLabelsFromHistory,
  extractChildPackageTagQuantityPairsFromHistory,
  extractChildPackageTagQuantityUnitSetsFromHistory,
  extractHarvestChildPackageLabelsFromHistory,
  extractInitialPackageLocationNameFromHistoryOrNull,
  extractInitialPackageQuantityAndUnitFromHistoryOrError,
  extractParentPackageLabelsFromHistory,
  extractParentPackageTagQuantityUnitItemSetsFromHistory,
  extractTestSamplePackageLabelsFromHistory,
} from "./history";

const RESTORED_HARVEST_PACKAGE_HISTORY: IPackageHistoryData[] = [
  {
    Descriptions: [
      "Packaged 2,392.5 Grams of Triple OG Flower from another Package",
      "- Took 2,392.5 Grams of 3OG Flower from Package 1A4000000000000000020370",
      "- Package Type: Product",
      "- Location: Staging Room",
      "- Location Type: Default Location Type",
    ],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-21",
    RecordedDateTime: "2023-01-21T22:17:39.3268744Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ['Moved to location "Packaging"', "- Location Type: Default Location Type"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-23",
    RecordedDateTime: "2023-01-23T12:22:51.3347129Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Package adjusted by -9.9 Grams", "- Reason: Waste", "- Note: (hidden)"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T13:56:00.6710076Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 72.3 Grams for Package 1A4000000000000000023329"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T13:56:40.2292967Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: [
      "Package adjusted by 49.2 Grams",
      "- Reason: Moisture Weight Change",
      "- Note: (hidden)",
    ],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T13:57:13.3867315Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: [
      'Moved to location "Finished Product Vault"',
      "- Location Type: Default Location Type",
    ],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T13:57:24.6714269Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000023330"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T14:05:10.6440029Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000023331"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T14:05:10.7940904Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000023332"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T14:05:10.9790889Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000023333"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T14:05:11.1240864Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000023334"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T14:05:11.2841627Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000023335"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T14:05:11.4291677Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000023336"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T14:05:11.5641622Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000023337"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-01-30",
    RecordedDateTime: "2023-01-30T14:05:11.7292287Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000025401"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-03",
    RecordedDateTime: "2023-02-04T02:57:08.788085Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000025402"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-03",
    RecordedDateTime: "2023-02-04T02:57:09.2021841Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000025403"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-03",
    RecordedDateTime: "2023-02-04T02:57:09.3121834Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000025404"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-03",
    RecordedDateTime: "2023-02-04T02:57:09.4571838Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000025405"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-03",
    RecordedDateTime: "2023-02-04T02:57:09.5921829Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000025406"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-03",
    RecordedDateTime: "2023-02-04T02:57:09.7075971Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Restored 112 Grams from Package 1A4000000000000000025401"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-06",
    RecordedDateTime: "2023-02-06T21:23:30.3570074Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Restored 112 Grams from Package 1A4000000000000000025402"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-06",
    RecordedDateTime: "2023-02-06T21:23:39.81004Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Restored 112 Grams from Package 1A4000000000000000025403"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-06",
    RecordedDateTime: "2023-02-06T21:23:48.3123946Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Restored 112 Grams from Package 1A4000000000000000025404"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-06",
    RecordedDateTime: "2023-02-06T21:23:57.7855214Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Restored 112 Grams from Package 1A4000000000000000025405"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-06",
    RecordedDateTime: "2023-02-06T21:24:05.8526368Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Restored 112 Grams from Package 1A4000000000000000025406"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-06",
    RecordedDateTime: "2023-02-06T21:24:18.8020563Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Restored 112 Grams from Package 1A4000000000000000023331"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-10",
    RecordedDateTime: "2023-02-11T02:59:10.8270955Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 101.5 Grams for Package 1A4000000000000000025773"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-10",
    RecordedDateTime: "2023-02-11T03:49:07.6981439Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 908 Grams for Package 1A4000000000000000026109"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-15",
    RecordedDateTime: "2023-02-15T21:08:41.880981Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 112 Grams for Package 1A4000000000000000026108"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-02-15",
    RecordedDateTime: "2023-02-15T21:24:31.6103347Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 454 Grams for Package 1A40C0300003DB9000005282"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-03-14",
    RecordedDateTime: "2023-03-14T20:00:03.4867699Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Package finished"],
    UserName: "Foo Bar (AGT000●●●)",
    ActualDate: "2023-03-14",
    RecordedDateTime: "2023-03-14T20:00:04.2298337Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
];

const HARVEST_PACKAGE_HISTORY: IPackageHistoryData[] = [
  {
    Descriptions: [
      "Packaged 4,517 Grams of OG Kush Popcorn from another Package",
      "- Took 4,517 Grams of OG Popcorn from Package 1A4000000000000000020465",
      "- Package Type: Product",
      "- Location: Staging Room",
      "- Location Type: Default Location Type",
    ],
    UserName: "FOO BAR (BAR1●●●)",
    ActualDate: "2023-01-26",
    RecordedDateTime: "2023-01-26T17:39:36.6530204Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ['Moved to location "Packaging"', "- Location Type: Default Location Type"],
    UserName: "FOO BAR (BAR●●●)",
    ActualDate: "2023-01-27",
    RecordedDateTime: "2023-01-27T16:28:31.215767Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Package adjusted by -14.18 Grams", "- Reason: Waste", "- Note: (hidden)"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:52:10.2028172Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 153.88 Grams for Package 1A4000000000000000024269"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:53:43.0750258Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: [
      "Package adjusted by -50.94 Grams",
      "- Reason: Moisture Weight Change",
      "- Note: (hidden)",
    ],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:54:42.5372668Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: [
      'Moved to location "Finished Product Vault"',
      "- Location Type: Default Location Type",
    ],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:54:50.4840128Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024270"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:39.3481842Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024271"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:39.6331846Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024272"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:39.7931799Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024273"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:39.9492186Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024274"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:40.1242214Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024275"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:40.2892163Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024276"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:40.4297711Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024277"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:40.6097677Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024278"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:40.7797673Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024279"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:40.9508152Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024280"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:41.1069128Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024281"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:41.3586094Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024282"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:41.5749149Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024283"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:41.7699126Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024284"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:41.9450652Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024285"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:42.1550613Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024286"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:42.3250633Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024287"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:42.5001512Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024288"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:42.6954832Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024289"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:42.8926749Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024290"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:43.0626694Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024291"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:43.2526701Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024292"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:43.4287644Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024293"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:43.6087591Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024294"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:43.783759Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024295"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:43.9525986Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024296"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:44.1426007Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024297"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:44.3125961Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024298"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:44.4887055Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 140 Grams for Package 1A4000000000000000024299"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-02-18",
    RecordedDateTime: "2023-02-18T20:58:44.6837075Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 98 Grams for Package 1A4000000000000000003023"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-03-01",
    RecordedDateTime: "2023-03-01T22:52:43.2340572Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Package finished"],
    UserName: "FOO BAR(FOO0●●●)",
    ActualDate: "2023-03-01",
    RecordedDateTime: "2023-03-01T22:52:43.5090553Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
];

const INACTIVE_HARVEST_HISTORY: IHarvestHistoryData[] = [
  {
    Descriptions: [
      'Harvest "FOO84 BAR1B BAZHVF1 07.27.23" created in location "FOOBAR"',
      "- Location Type: Default Location Type",
    ],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:26.6007211Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,933.5 Grams from Plant 1A4000000000000000111831"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:26.6007211Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 4,010 Grams from Plant 1A4000000000000000111832"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:26.7957065Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 2,381 Grams from Plant 1A4000000000000000111833"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:26.9207078Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,857.5 Grams from Plant 1A4000000000000000111834"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.0116529Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,861 Grams from Plant 1A4000000000000000111835"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.1033805Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,887 Grams from Plant 1A4000000000000000111836"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.2135119Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 4,031 Grams from Plant 1A4000000000000000111838"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.3033845Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,977.5 Grams from Plant 1A4000000000000000111839"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.3933835Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 4,001.5 Grams from Plant 1A4000000000000000111840"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.5033862Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 2,561.5 Grams from Plant 1A4000000000000000111842"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.6133868Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,201 Grams from Plant 1A4000000000000000111850"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.7186806Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,913.5 Grams from Plant 1A4000000000000000111852"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.8286957Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 2,939 Grams from Plant 1A4000000000000000111855"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:27.9236963Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,739 Grams from Plant 1A4000000000000000111861"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:28.0320791Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,933 Grams from Plant 1A4000000000000000111862"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:28.1370797Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,296.5 Grams from Plant 1A4000000000000000111864"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:28.2370806Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,764.5 Grams from Plant 1A4000000000000000111600"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:28.3430381Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,800 Grams from Plant 1A4000000000000000017788"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:28.4630376Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,960.5 Grams from Plant 1A4000000000000000017789"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:28.5689403Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,740 Grams from Plant 1A4000000000000000017790"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:28.6539412Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Harvested 3,269 Grams from Plant 1A4000000000000000017791"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T12:51:28.7498685Z",
    InputSourcesNames: "API",
    ExternalSourceName: "MediTracker",
  },
  {
    Descriptions: ["Removed 4,860 Grams of waste"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-07-27",
    RecordedDateTime: "2023-07-28T13:04:19.2562984Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Removed 2,310 Grams of waste"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-05",
    RecordedDateTime: "2023-08-05T20:39:11.7250086Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Removed 312 Grams of waste"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-05",
    RecordedDateTime: "2023-08-05T20:40:46.066794Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Removed 74 Grams of waste"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-06",
    RecordedDateTime: "2023-08-06T21:51:11.1627502Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Removed 10 Grams of waste"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-05",
    RecordedDateTime: "2023-08-06T21:52:05.4450142Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: [
      "Used 12,680 Grams for Package (1A4000000000000000111336) of Unprocessed Flower - Heavy Fog #1",
    ],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-07",
    RecordedDateTime: "2023-08-07T12:43:55.4281569Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Removed 30 Grams of waste"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-06",
    RecordedDateTime: "2023-08-09T21:51:46.8601343Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Removed 26 Grams of waste"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-09",
    RecordedDateTime: "2023-08-09T21:53:09.435027Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Removed 2,280 Grams of waste"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-06",
    RecordedDateTime: "2023-08-09T21:55:15.4451286Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Used 400 Grams for Package (1A4000000000000000111800) of Floor Nugs"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-20",
    RecordedDateTime: "2023-08-20T14:58:44.6370967Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
  {
    Descriptions: ["Harvest Batch has been finished"],
    UserName: "Foo Bar (FOO123●●●)",
    ActualDate: "2023-08-24",
    RecordedDateTime: "2023-08-24T16:34:30.2629478Z",
    InputSourcesNames: "User",
    ExternalSourceName: "",
  },
];

const BULK_BIOMASS_ACCEPTED_VIA_TRANSFER: IPackageHistoryData[] = [
  {
    Descriptions: [
      "Packaged 1,003 Pounds of SL Biscotti | Untrimmed Flower from another Package",
      "- Took 1,003 Pounds of SL Biscotti | Untrimmed Flower from Package 1A4000000000000000011168",
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
      "1A4000000000000000011168",
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
    ).toEqual([["1A4000000000000000011168", 1003, "Pounds", "SL Biscotti | Untrimmed Flower"]]);
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

  it("Correctly extracts harvest packages", () => {
    expect(extractHarvestChildPackageLabelsFromHistory(INACTIVE_HARVEST_HISTORY)).toEqual([
      "1A4000000000000000111336",
      "1A4000000000000000111800",
    ]);

    expect(extractAdjustmentReasonNoteSetsFromHistory(HARVEST_PACKAGE_HISTORY)).toEqual([
      {
        note: "(hidden)",
        quantity: -14.18,
        reason: "Waste",
        unitOfMeasure: "Grams",
      },
      {
        note: "(hidden)",
        quantity: -50.94,
        reason: "Moisture Weight Change",
        unitOfMeasure: "Grams",
      },
    ]);
  });

  it("Correctly extracts child package quantities with negative restores", () => {
    expect(
      extractChildPackageTagQuantityUnitSetsFromHistory(RESTORED_HARVEST_PACKAGE_HISTORY)
    ).toEqual([
      ["1A4000000000000000023329", 72.3, "Grams"],
      ["1A4000000000000000023330", 112, "Grams"],
      ["1A4000000000000000023331", 112, "Grams"],
      ["1A4000000000000000023332", 112, "Grams"],
      ["1A4000000000000000023333", 112, "Grams"],
      ["1A4000000000000000023334", 112, "Grams"],
      ["1A4000000000000000023335", 112, "Grams"],
      ["1A4000000000000000023336", 112, "Grams"],
      ["1A4000000000000000023337", 112, "Grams"],
      ["1A4000000000000000025401", 112, "Grams"],
      ["1A4000000000000000025402", 112, "Grams"],
      ["1A4000000000000000025403", 112, "Grams"],
      ["1A4000000000000000025404", 112, "Grams"],
      ["1A4000000000000000025405", 112, "Grams"],
      ["1A4000000000000000025406", 112, "Grams"],
      ["1A4000000000000000025401", -112, "Grams"],
      ["1A4000000000000000025402", -112, "Grams"],
      ["1A4000000000000000025403", -112, "Grams"],
      ["1A4000000000000000025404", -112, "Grams"],
      ["1A4000000000000000025405", -112, "Grams"],
      ["1A4000000000000000025406", -112, "Grams"],
      ["1A4000000000000000023331", -112, "Grams"],
      ["1A4000000000000000025773", 101.5, "Grams"],
      ["1A4000000000000000026109", 908, "Grams"],
      ["1A4000000000000000026108", 112, "Grams"],
      ["1A40C0300003DB9000005282", 454, "Grams"],
    ]);
  });
});
