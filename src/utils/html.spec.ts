import "@/test/utils/auto-mock-debug";
import { getFileText } from "@/test/utils/file";
import { extract, ExtractionType } from "./html";

describe("html.ts", () => {
  it("Correctly extracts auth state", () => {
    const MItxt = getFileText("../../test/fixtures/html", "mi-packages.html");

    const MIauthData = extract(ExtractionType.AUTH_DATA, MItxt);

    expect(MIauthData).toEqual({
      authData: {
        apiVerificationToken: "Api-Verification-Token",
        identity: "USER_ID",
        license: "LICENSE-NUMBER-0001",
      },
    });

    const OHtxt = getFileText("../../test/fixtures/html", "oh-packages.html");

    const OHauthData = extract(ExtractionType.AUTH_DATA, OHtxt);

    expect(OHauthData).toEqual({
      authData: {
        apiVerificationToken: "VERIFTOKEN",
        identity: "OH_USER",
        license: "OH_LICENSE",
      },
    });
  });

  it("Correctly extracts repeater data", () => {
    const txt = getFileText("../../test/fixtures/html", "add-items-modal-response.html");

    const result = extract(ExtractionType.REPEATER_DATA, txt);

    expect(Object.keys(result?.repeaterData?.parsedRepeaterData || {})).toEqual([
      "Adding",
      "Items",
      "ItemBrands",
      "ItemCategories",
      "Strains",
      "UnitsOfMeasure",
      "Details",
    ]);
  });
});
