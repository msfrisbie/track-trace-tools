import "@/test/utils/auto-mock-debug";
import { getFileText } from "@/test/utils/file";
import { extract, ExtractionType } from "./html";

describe("html.ts", () => {
  it("Correctly extracts auth state", () => {
    const txt = getFileText("../../test/fixtures/html", "mi-packages.html");

    const authData = extract(ExtractionType.AUTH_DATA, txt);

    expect(authData).toEqual({
      authData: {
        apiVerificationToken: "Api-Verification-Token",
        identity: "USER_ID",
        license: "LICENSE-NUMBER-0001",
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
