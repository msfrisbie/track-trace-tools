import { METRC_INDUSTRY_LICENSE_PATH_REGEX } from "@/consts";
import { zip } from "lodash-es";

describe("analytics-manager.module.ts", () => {
  it("correctly extracts license and path", () => {
    const matchUrls = [
      "/industry/MP281425/admin/items",
      "/industry/PAAA-41QG-7VJW/packages",
      "/industry/C11-0000061-LIC/packages",
      "/industry/402R-00115/sales/receipts",
      "/industry/C11-0000216-LIC/transfers/licensed",
      "/industry/060-10108279225/packages",
      "/industry/C11-0000511-LIC/transfers/licensed/templates",
      "/industry/CDPH-10004665/admin/tagorders",
    ];

    const nonMatchUrls = ["/reports/monthlysales"];

    const matchData = [
      ["MP281425", "/admin/items"],
      ["PAAA-41QG-7VJW", "/packages"],
      ["C11-0000061-LIC", "/packages"],
      ["402R-00115", "/sales/receipts"],
      ["C11-0000216-LIC", "/transfers/licensed"],
      ["060-10108279225", "/packages"],
      ["C11-0000511-LIC", "/transfers/licensed/templates"],
      ["CDPH-10004665", "/admin/tagorders"],
    ];

    for (const [url, data] of zip(matchUrls, matchData) as [string, string[]][]) {
      const match = url.match(METRC_INDUSTRY_LICENSE_PATH_REGEX);

      if (!match) {
        throw new Error("match is null");
      }

      expect(match[1]).toEqual(data[0]);
      expect(match[2]).toEqual(data[1]);
    }

    for (const url of nonMatchUrls) {
      expect(url.match(METRC_INDUSTRY_LICENSE_PATH_REGEX)).toBeNull();
    }
  });
});
