import { navigationUrl } from "./url";

describe("url.ts", () => {
  // it("Correctly updates and reads the window hash ", () => {
  //   expect(getTrimmedHash()).toEqual("");
  //   expect(readHashValueOrNull("foo")).toEqual(null);
  //   updateHash({ foo: "bar" });
  //   expect(readHashValueOrNull("foo")).toEqual("bar");
  //   expect(getTrimmedHash()).toEqual("foo=bar");
  //   updateHash({ foo: "234", baz: "jake" });
  //   expect(getTrimmedHash()).toEqual("foo=234&baz=jake");
  //   expect(readHashValueOrNull("foo")).toEqual("234");
  // });

  it("Correctly generates a nav url", () => {
    expect(navigationUrl("/foo/bar", { hashValues: { baz: "qux" }, nonce: "12345" })).toEqual(
      "http://localhost/foo/bar?nonce=12345#baz=qux"
    );
  });
});
