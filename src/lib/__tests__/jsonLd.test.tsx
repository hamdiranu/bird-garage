import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CARS } from "../fleet";
import { JsonLd, carJsonLd, siteJsonLd } from "../jsonLd";
import { SITE_DESCRIPTION, siteUrl } from "../previews";

const limo = CARS.find((c) => c.id === "limo")!;

describe("siteJsonLd", () => {
  it("names the site and its address, which is how a result is headed", () => {
    expect(siteJsonLd()).toMatchObject({
      "@type": "WebSite",
      name: "Bird Garage",
      url: `${siteUrl.origin}/`,
      description: SITE_DESCRIPTION,
    });
  });
});

describe("carJsonLd", () => {
  it("leads from the garage to the car", () => {
    const { itemListElement } = carJsonLd(limo);
    expect(itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Bird Garage", item: `${siteUrl.origin}/` },
      { "@type": "ListItem", position: 2, name: "Toyota Limo" },
    ]);
  });
});

describe("JsonLd", () => {
  it("writes the data into a linked-data script", () => {
    const { container } = render(<JsonLd data={{ "@type": "WebSite", name: "Bird Garage" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.textContent!)).toEqual({ "@type": "WebSite", name: "Bird Garage" });
  });

  it("escapes a < so no value can close the script early", () => {
    const { container } = render(<JsonLd data={{ name: "</script><script>alert(1)" }} />);
    const script = container.querySelector('script[type="application/ld+json"]')!;
    expect(script.innerHTML).not.toContain("</script>");
    expect(JSON.parse(script.textContent!)).toEqual({ name: "</script><script>alert(1)" });
  });
});
