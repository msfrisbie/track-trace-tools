import {
  CustomTransformer,
  PRODUCT_UNIT_WEIGHT_REGEX
} from "@/store/page-overlay/modules/reports/consts";
import { IFieldData } from "@/store/page-overlay/modules/reports/interfaces";
import "@/test/utils/auto-mock-chrome";
import "@/test/utils/auto-mock-fetch";
import "@/test/utils/auto-mock-store";
import { applyCustomTransformer } from "./reports-shared";

describe("reports-spec.ts", () => {
  it("Correctly extracts values", () => {
    const INPUT_OUTPUT_PAIRS = [
      {
        input: "Cookies - OGK - Single Preroll 1.0g",
        output: ["1.0", "g"],
      },
      {
        input: "foo 0.5mg bar",
        output: ["0.5", "mg"],
      },
      {
        input: "foo .5g bar",
        output: [".5", "g"],
      },
      {
        input: "foo 5mg bar",
        output: ["5", "mg"],
      },
      {
        input: "foo 1.0g bar",
        output: ["1.0", "g"],
      },
      {
        input: "foo 1.0 g bar",
        output: ["1.0", "g"],
      },
      {
        input: "foo 0.5 mg bar",
        output: ["0.5", "mg"],
      },
    ];

    for (const { input, output } of INPUT_OUTPUT_PAIRS) {
      const match = input.match(PRODUCT_UNIT_WEIGHT_REGEX);

      expect(match![1]).toEqual(output[0]);
      expect(match![2]).toEqual(output[1]);
    }
  });

  it("Correctly applies custom transformers", () => {
    const INPUT_OUTPUT_PAIRS = [
      {
        input: "Cookies - OGK - Single Preroll 1.0g",
        output: ["1", "g"],
      },
      {
        input: "foo 0.5mg bar",
        output: ["0.5", "mg"],
      },
      {
        input: "foo .5g bar",
        output: ["0.5", "g"],
      },
      {
        input: "foo 5mg bar",
        output: ["5", "mg"],
      },
      {
        input: "foo 1.0g bar",
        output: ["1", "g"],
      },
      {
        input: "foo 1.0 g bar",
        output: ["1", "g"],
      },
      {
        input: "foo 0.5 mg bar",
        output: ["0.5", "mg"],
      },
    ];

    for (const { input, output } of INPUT_OUTPUT_PAIRS) {
      const row = {
        Package: {
          ProductName: input,
        },
      };

      const weightField: IFieldData = {
        value: "UnitWeight",
        readableName: "Unit Weight",
        required: false,
        initiallyChecked: true,
        customTransformer: CustomTransformer.TRANSFER_PACKAGE_UNIT_WEIGHT,
      };

      const unitField: IFieldData = {
        value: "UnitWeightUOM",
        readableName: "Unit Weight UOM",
        required: false,
        initiallyChecked: true,
        customTransformer: CustomTransformer.TRANSFER_PACKAGE_UNIT_WEIGHT_UOM,
      };

      expect(applyCustomTransformer(weightField, row)).toEqual(output[0]);
      expect(applyCustomTransformer(unitField, row)).toEqual(output[1]);
    }
  });
});
