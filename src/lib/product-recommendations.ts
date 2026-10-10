export interface ProductRecommendation {
  name: string;
  shop: string;
  price: string;
  description: string;
  sourceUrl: string;
  imageUrl: string | null;
  orderUrl: string | null;
}

export function safeShopUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function normalizeRecommendations(value: unknown): ProductRecommendation[] {
  if (
    !value ||
    typeof value !== "object" ||
    !("products" in value) ||
    !Array.isArray(value.products)
  )
    return [];
  return value.products
    .flatMap((item: unknown) => {
      if (!item || typeof item !== "object") return [];
      const p = item as Record<string, unknown>;
      const sourceUrl = typeof p["sourceUrl"] === "string" ? safeShopUrl(p["sourceUrl"]) : null;
      if (
        !sourceUrl ||
        typeof p["name"] !== "string" ||
        typeof p["shop"] !== "string" ||
        typeof p["price"] !== "string" ||
        typeof p["description"] !== "string"
      )
        return [];
      return [
        {
          name: p["name"],
          shop: p["shop"],
          price: p["price"],
          description: p["description"],
          sourceUrl,
          imageUrl: typeof p["imageUrl"] === "string" ? safeShopUrl(p["imageUrl"]) : null,
          orderUrl: typeof p["orderUrl"] === "string" ? safeShopUrl(p["orderUrl"]) : null,
        },
      ];
    })
    .slice(0, 8);
}
