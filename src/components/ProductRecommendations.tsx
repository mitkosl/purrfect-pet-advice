import { useState } from "react";
import { ArrowUpRight, HeartHandshake, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductRecommendation } from "@/lib/product-recommendations";

function ProductImage({ product }: { product: ProductRecommendation }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background">
      {product.imageUrl && !failed ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="size-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <ShoppingBag className="size-7 text-muted-foreground" />
      )}
    </div>
  );
}

export function ProductRecommendations({ products }: { products: ProductRecommendation[] }) {
  return (
    <div className="not-prose grid w-full min-w-0 gap-3">
      {products.map((product) => (
        <article
          key={`${product.shop}-${product.sourceUrl}`}
          className="flex min-w-0 gap-3 rounded-lg border bg-background p-4"
        >
          <ProductImage product={product} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              {product.shop}
            </p>
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-words text-sm font-bold leading-snug hover:text-primary"
            >
              {product.name}
            </a>
            <p className="mt-2 break-words text-xs leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            {product.reason && (
              <p className="mt-2 flex items-start gap-1.5 break-words rounded-md bg-primary/10 p-2 text-xs leading-relaxed text-foreground">
                <HeartHandshake className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold">Why it suits your pet: </span>
                  {product.reason}
                </span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-base font-bold">{product.price}</span>
              <Button asChild size="sm">
                <a
                  href={product.orderUrl ?? product.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={
                    product.orderUrl
                      ? `Order from ${product.shop}`
                      : `Open ${product.shop} to choose options and add to cart`
                  }
                >
                  <ShoppingBag /> Order <ArrowUpRight />
                </a>
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
