import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-fetch";
import { getAllocatedSampleFromPackageHistoryEntryOrNull } from "./employee";

describe("employee.ts", () => {
  it("Correctly extracts allocation from history entry", () => {
    const ignoredHistoryEntry = {
      Descriptions: ["Package flagged as Trade Sample."],
      UserName: "Bob Smith (012345●●●)",
      ActualDate: null,
      RecordedDateTime: "2021-12-23T17:33:31.5121902Z",
      InputSourcesNames: "User",
      ExternalSourceName: "",
    };

    const sampleHistoryEntryEach = {
      Descriptions: [
        "Package adjusted by -1 Each",
        "- Reason: Trade Sample",
        "- Note: Justin Fields 0123456789",
      ],
      UserName: "Foo Bar (0123456●●●)",
      ActualDate: "2022-02-16",
      RecordedDateTime: "2022-02-16T15:55:53.4091907Z",
      InputSourcesNames: "User",
      ExternalSourceName: "",
    };

    const sampleHistoryEntryGrams = {
      Descriptions: [
        "Package adjusted by -3.5 Grams",
        "- Reason: Trade Sample",
        "- Note: Justin Fields 0123456789",
      ],
      UserName: "Foo Bar (0123456●●●)",
      ActualDate: "2022-02-16",
      RecordedDateTime: "2022-02-16T15:55:53.4091907Z",
      InputSourcesNames: "User",
      ExternalSourceName: "",
    };

    expect(
      getAllocatedSampleFromPackageHistoryEntryOrNull(
        "1A4F00000000000000001234",
        ignoredHistoryEntry
      )
    ).toEqual(null);
    expect(
      getAllocatedSampleFromPackageHistoryEntryOrNull(
        "1A4F00000000000000001234",
        sampleHistoryEntryEach
      )
    ).toEqual({
      packageLabel: "1A4F00000000000000001234",
      employeeLicenseNumber: "0123456789",
      employeeName: "Justin Fields",
      isodate: "2022-02-16",
      quantity: 1,
      unitOfMeasureName: "Each",
    });
    expect(
      getAllocatedSampleFromPackageHistoryEntryOrNull(
        "1A4F00000000000000001234",
        sampleHistoryEntryGrams
      )
    ).toEqual({
      packageLabel: "1A4F00000000000000001234",
      employeeLicenseNumber: "0123456789",
      employeeName: "Justin Fields",
      isodate: "2022-02-16",
      quantity: 3.5,
      unitOfMeasureName: "Grams",
    });
  });
});
