import { describe, expect, it } from "vitest";
import { PAWSEY_ACACIA_ENDPOINT, resolveAcaciaUrl } from "../acacia";

describe("acacia", () => {
  it("resolves s3 URLs against the Pawsey Acacia endpoint", () => {
    expect(resolveAcaciaUrl("s3://gm-tas/gm_tas.pq")).toBe(
      `${PAWSEY_ACACIA_ENDPOINT}/gm-tas/gm_tas.pq`,
    );
  });

  it("leaves non-s3 URLs untouched", () => {
    expect(resolveAcaciaUrl("https://example.test/gm_tas.pq")).toBe(
      "https://example.test/gm_tas.pq",
    );
  });

  it("avoids duplicate slashes when a custom endpoint has a trailing slash", () => {
    expect(
      resolveAcaciaUrl("s3://gm-tas/gm_tas.pq", "https://example.test/"),
    ).toBe("https://example.test/gm-tas/gm_tas.pq");
  });
});
