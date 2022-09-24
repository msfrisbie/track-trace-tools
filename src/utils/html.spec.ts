import { mockDebugUtils } from "@/test/utils/mocks";

mockDebugUtils();

import { extract, ExtractionType } from "./html";

const fs = require("fs");
const path = require("path");

describe("html.ts", () => {
  it("Correctly extracts auth state", () => {
    const file = path.join(__dirname, "../raw/html/mi", "packages.html");
    const fdr = fs.readFileSync(file, "utf8", function (err: any, data: any) {
      return data;
    });

    const authData = extract(ExtractionType.AUTH_DATA, fdr);

    expect(authData).toEqual({ authData: {
      apiVerificationToken: "Api-Verification-Token",
      identity: "USER_ID",
      license: "LICENSE-NUMBER-0001"
    } });
  });
});
