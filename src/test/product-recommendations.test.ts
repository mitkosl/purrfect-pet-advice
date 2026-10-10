import { describe, expect, it } from "vitest";
import { normalizeRecommendations, safeShopUrl } from "@/lib/product-recommendations";

describe("product ordering destinations", () => {
  it("retains a supplied HTTPS cart URL", () => {
    const [product] = normalizeRecommendations({
      products: [
        {
          name: "Flea comb",
          shop: "Pet shop",
          price: "€5",
          description: "Comb",
          sourceUrl: "https://shop.example/comb",
          imageUrl: null,
          orderUrl: "https://shop.example/cart?product=comb",
        },
      ],
    });
    expect(product?.orderUrl).toBe("https://shop.example/cart?product=comb");
  });
  it("does not invent a cart URL when none is supplied", () => {
    const [product] = normalizeRecommendations({
      products: [
        {
          name: "Flea comb",
          shop: "Pet shop",
          price: "€5",
          description: "Comb",
          sourceUrl: "https://shop.example/comb",
          imageUrl: null,
          orderUrl: null,
        },
      ],
    });
    expect(product?.orderUrl).toBeNull();
    expect(product?.sourceUrl).toBe("https://shop.example/comb");
  });
  it("supports products from different shops", () => {
    const products = normalizeRecommendations({
      products: ["Zoomag", "Other shop"].map((shop) => ({
        name: "Comb",
        shop,
        price: "€5",
        description: "Comb",
        sourceUrl: `https://shop.example/${encodeURIComponent(shop)}`,
        imageUrl: null,
        orderUrl: null,
      })),
    });
    expect(products.map((p) => p.shop)).toEqual(["Zoomag", "Other shop"]);
  });
  it("rejects unsafe clickable URLs", () => {
    expect(safeShopUrl("javascript:alert(1)")).toBeNull();
    expect(safeShopUrl("https://user:password@shop.example")).toBeNull();
  });
});
