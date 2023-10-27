// import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-store";
import {
  getDatesInRange,
  getIsoDateFromOffset,
  interleavedDatetimesAreValid,
  interleaveGroupedTransferDatetimes,
  isCustodiedDatetimeOrError,
  isoDatetimeToLocalDate,
} from "./date";

const invalidDatetimes_AAD = {
  arrivalDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-05T06:00:00.000Z"],
  departureDatetimes: ["2023-04-05T12:00:00.000Z"],
};

const invalidDatetimes_DAAD = {
  arrivalDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-05T06:00:00.000Z"],
  departureDatetimes: ["2023-04-04T12:00:00.000Z", "2023-04-05T12:00:00.000Z"],
};

const invalidDatetimes_ADAAD = {
  arrivalDatetimes: [
    "2023-04-03T00:00:00.000Z",
    "2023-04-05T00:00:00.000Z",
    "2023-04-05T06:00:00.000Z",
  ],
  departureDatetimes: ["2023-04-04T12:00:00.000Z", "2023-04-05T12:00:00.000Z"],
};

describe("date.ts", () => {
  it("Correctly calculates date offset", () => {
    expect(getIsoDateFromOffset(3, "2023-04-02T17:58:25.496Z")).toEqual("2023-04-05T17:58:25.496Z");
    expect(getIsoDateFromOffset(-3, "2023-04-02T17:58:25.496Z")).toEqual(
      "2023-03-30T17:58:25.496Z"
    );

    expect(getIsoDateFromOffset(3, "2023-04-02")).toEqual("2023-04-05T00:00:00.000Z");
    expect(getIsoDateFromOffset(-3, "2023-04-02")).toEqual("2023-03-30T00:00:00.000Z");
  });

  it("Correctly generates date ranges", () => {
    expect(() => getDatesInRange("2023-03-27", "2023-03-26")).toThrowError();

    expect(getDatesInRange("2023-03-26", "2023-03-26")).toEqual(["2023-03-26"]);
    expect(getDatesInRange("2023-03-26", "2023-04-02")).toEqual([
      "2023-03-26",
      "2023-03-27",
      "2023-03-28",
      "2023-03-29",
      "2023-03-30",
      "2023-03-31",
      "2023-04-01",
      "2023-04-02",
    ]);
  });

  it("Converts iso datetimes", () => {
    if (new Date().getTimezoneOffset() === 300) {
      expect(isoDatetimeToLocalDate("2023-04-05T00:00:00.000Z")).toEqual("2023-04-04"); // Indicates correct conversion
    }

    expect(isoDatetimeToLocalDate("2023-04-05T06:00:00.000Z")).toEqual("2023-04-05");
    expect(isoDatetimeToLocalDate("2023-04-05T12:00:00.000Z")).toEqual("2023-04-05");
    expect(isoDatetimeToLocalDate("2023-04-05T18:00:00.000Z")).toEqual("2023-04-05");
    expect(isoDatetimeToLocalDate("2023-04-06T00:00:00.000Z")).toEqual("2023-04-05"); // Indicates correct conversion

    expect(isoDatetimeToLocalDate("2023-04-04")).toEqual("2023-04-04"); // Indicates fallback
  });

  it("Interleaves datetimes", () => {
    expect(
      interleaveGroupedTransferDatetimes({
        arrivalDatetimes: [],
        departureDatetimes: [],
      })
    ).toEqual([]);

    expect(
      interleaveGroupedTransferDatetimes({
        arrivalDatetimes: ["2023-04-05T06:00:00.000Z"],
        departureDatetimes: [],
      })
    ).toEqual([
      {
        group: "ARRIVAL",
        datetime: "2023-04-05T06:00:00.000Z",
      },
    ]);

    expect(
      interleaveGroupedTransferDatetimes({
        arrivalDatetimes: [],
        departureDatetimes: ["2023-04-05T06:00:00.000Z"],
      })
    ).toEqual([
      {
        group: "DEPARTURE",
        datetime: "2023-04-05T06:00:00.000Z",
      },
    ]);

    expect(
      interleaveGroupedTransferDatetimes({
        arrivalDatetimes: ["2023-04-05T00:00:00.000Z"],
        departureDatetimes: ["2023-04-05T06:00:00.000Z"],
      })
    ).toEqual([
      {
        group: "ARRIVAL",
        datetime: "2023-04-05T00:00:00.000Z",
      },
      {
        group: "DEPARTURE",
        datetime: "2023-04-05T06:00:00.000Z",
      },
    ]);

    expect(
      interleaveGroupedTransferDatetimes({
        arrivalDatetimes: ["2023-04-05T00:00:00.000Z"],
        departureDatetimes: ["2023-04-05T06:00:00.000Z"],
      })
    ).toEqual([
      {
        group: "ARRIVAL",
        datetime: "2023-04-05T00:00:00.000Z",
      },
      {
        group: "DEPARTURE",
        datetime: "2023-04-05T06:00:00.000Z",
      },
    ]);

    expect(
      interleaveGroupedTransferDatetimes({
        arrivalDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-05T12:00:00.000Z"],
        departureDatetimes: ["2023-04-05T06:00:00.000Z"],
      })
    ).toEqual([
      {
        group: "ARRIVAL",
        datetime: "2023-04-05T00:00:00.000Z",
      },
      {
        group: "DEPARTURE",
        datetime: "2023-04-05T06:00:00.000Z",
      },
      {
        group: "ARRIVAL",
        datetime: "2023-04-05T12:00:00.000Z",
      },
    ]);

    expect(interleaveGroupedTransferDatetimes(invalidDatetimes_AAD)).toEqual([
      {
        group: "ARRIVAL",
        datetime: "2023-04-05T00:00:00.000Z",
      },
      {
        group: "ARRIVAL",
        datetime: "2023-04-05T06:00:00.000Z",
      },
      {
        group: "DEPARTURE",
        datetime: "2023-04-05T12:00:00.000Z",
      },
    ]);
  });

  it("Validates interleaved datetimes", () => {
    expect(
      interleavedDatetimesAreValid({
        arrivalDatetimes: [],
        departureDatetimes: [],
      }).valid
    ).toEqual(true);

    expect(
      interleavedDatetimesAreValid({
        arrivalDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-05T12:00:00.000Z"],
        departureDatetimes: ["2023-04-05T06:00:00.000Z"],
      }).valid
    ).toEqual(true);

    expect(
      interleavedDatetimesAreValid({
        arrivalDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-05T12:00:00.000Z"],
        departureDatetimes: [],
      }).valid
    ).toEqual(false);

    expect(
      interleavedDatetimesAreValid({
        arrivalDatetimes: [],
        departureDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-05T12:00:00.000Z"],
      }).valid
    ).toEqual(false);

    expect(interleavedDatetimesAreValid(invalidDatetimes_AAD).valid).toEqual(false);
    expect(interleavedDatetimesAreValid(invalidDatetimes_DAAD).valid).toEqual(false);
    expect(interleavedDatetimesAreValid(invalidDatetimes_ADAAD).valid).toEqual(false);
  });

  it("Correctly evaluates custody", () => {
    // Invalid dates

    expect(() =>
      isCustodiedDatetimeOrError({
        arrivalDatetimes: [],
        departureDatetimes: ["2023-04-04T00:00:00.000Z", "2023-04-06T00:00:00.000Z"],
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toThrowError();

    expect(
      isCustodiedDatetimeOrError({
        arrivalDatetimes: [],
        departureDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-06T00:00:00.000Z"],
        targetDatetime: "2023-04-04T00:00:00.000Z",
      })
    ).toEqual(true);

    expect(
      isCustodiedDatetimeOrError({
        arrivalDatetimes: [],
        departureDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-06T00:00:00.000Z"],
        targetDatetime: "2023-04-07T00:00:00.000Z",
      })
    ).toEqual(false);

    expect(() =>
      isCustodiedDatetimeOrError({
        arrivalDatetimes: ["2023-04-04T00:00:00.000Z", "2023-04-06T00:00:00.000Z"],
        departureDatetimes: ["2023-04-03T00:00:00.000Z", "2023-04-08T00:00:00.000Z"],
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toThrowError();

    expect(
      isCustodiedDatetimeOrError({
        arrivalDatetimes: ["2023-04-04T00:00:00.000Z", "2023-04-06T00:00:00.000Z"],
        departureDatetimes: ["2023-04-03T00:00:00.000Z", "2023-04-08T00:00:00.000Z"],
        targetDatetime: "2023-04-02T00:00:00.000Z",
      })
    ).toEqual(true);

    // Valid dates

    expect(
      isCustodiedDatetimeOrError({
        arrivalDatetimes: [],
        departureDatetimes: [],
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toEqual(true);

    expect(
      isCustodiedDatetimeOrError({
        arrivalDatetimes: ["2023-04-04T00:00:00.000Z"],
        departureDatetimes: [],
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toEqual(true);

    expect(
      isCustodiedDatetimeOrError({
        arrivalDatetimes: ["2023-04-06T00:00:00.000Z"],
        departureDatetimes: [],
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toEqual(false);

    expect(
      isCustodiedDatetimeOrError({
        arrivalDatetimes: [],
        departureDatetimes: ["2023-04-06T00:00:00.000Z"],
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toEqual(true);

    expect(
      isCustodiedDatetimeOrError({
        arrivalDatetimes: [],
        departureDatetimes: ["2023-04-04T00:00:00.000Z"],
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toEqual(false);

    const twoDate = {
      arrivalDatetimes: ["2023-04-04T00:00:00.000Z"],
      departureDatetimes: ["2023-04-06T00:00:00.000Z"],
    };

    expect(
      isCustodiedDatetimeOrError({
        ...twoDate,
        targetDatetime: "2023-04-03T00:00:00.000Z",
      })
    ).toEqual(false);

    expect(
      isCustodiedDatetimeOrError({
        ...twoDate,
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toEqual(true);

    expect(
      isCustodiedDatetimeOrError({
        ...twoDate,
        targetDatetime: "2023-04-07T00:00:00.000Z",
      })
    ).toEqual(false);

    const threeDate = {
      arrivalDatetimes: ["2023-04-04T00:00:00.000Z", "2023-04-08T00:00:00.000Z"],
      departureDatetimes: ["2023-04-06T00:00:00.000Z"],
    };

    expect(
      isCustodiedDatetimeOrError({
        ...threeDate,
        targetDatetime: "2023-04-03T00:00:00.000Z",
      })
    ).toEqual(false);

    expect(
      isCustodiedDatetimeOrError({
        ...threeDate,
        targetDatetime: "2023-04-05T00:00:00.000Z",
      })
    ).toEqual(true);

    expect(
      isCustodiedDatetimeOrError({
        ...threeDate,
        targetDatetime: "2023-04-07T00:00:00.000Z",
      })
    ).toEqual(false);

    expect(
      isCustodiedDatetimeOrError({
        ...threeDate,
        targetDatetime: "2023-04-09T00:00:00.000Z",
      })
    ).toEqual(true);

    const fourDate = {
      arrivalDatetimes: ["2023-04-05T00:00:00.000Z", "2023-04-09T00:00:00.000Z"],
      departureDatetimes: ["2023-04-03T00:00:00.000Z", "2023-04-07T00:00:00.000Z"],
    };

    expect(
      isCustodiedDatetimeOrError({
        ...fourDate,
        targetDatetime: "2023-04-02T00:00:00.000Z",
      })
    ).toEqual(true);

    expect(
      isCustodiedDatetimeOrError({
        ...fourDate,
        targetDatetime: "2023-04-04T00:00:00.000Z",
      })
    ).toEqual(false);

    expect(
      isCustodiedDatetimeOrError({
        ...fourDate,
        targetDatetime: "2023-04-06T00:00:00.000Z",
      })
    ).toEqual(true);

    expect(
      isCustodiedDatetimeOrError({
        ...fourDate,
        targetDatetime: "2023-04-08T00:00:00.000Z",
      })
    ).toEqual(false);

    expect(
      isCustodiedDatetimeOrError({
        ...fourDate,
        targetDatetime: "2023-04-10T00:00:00.000Z",
      })
    ).toEqual(true);
  });
});
