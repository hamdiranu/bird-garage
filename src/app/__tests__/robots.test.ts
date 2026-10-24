import { describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/previews";
import robots from "../robots";

describe("robots.txt", () => {
  const { rules, sitemap, host } = robots();
  const rule = Array.isArray(rules) ? rules[0] : rules;

  it("lets every crawler read the whole site", () => {
    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
  });

  it("keeps the thumbnail-capture page out", () => {
    expect(rule.disallow).toBe("/capture/");
  });

  it("names the sitemap and host by their full address", () => {
    expect(sitemap).toBe(`${siteUrl.origin}/sitemap.xml`);
    expect(host).toBe(siteUrl.origin);
  });
});
