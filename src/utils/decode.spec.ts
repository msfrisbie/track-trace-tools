import { decodeEnum } from "@/utils/decode";

describe("decode.ts", () => {
  it("decode returns correct output evaluations", () => {
    expect(decodeEnum("")).toBe("");
    expect(decodeEnum(" ")).toBe(" ");
    expect(decodeEnum("x_x_x")).toBe("X X X");
  });
});
