import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { createMCPClient } from "@ai-sdk/mcp";
import { convertToModelMessages, isStepCount, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { normalizeRecommendations } from "@/lib/product-recommendations";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id";

const MCP_URL = "https://storefront.fleetq.net/mcp/";
const MODEL = "openai/gpt-6-astra";

const INSTRUCTIONS = `You are "Pal", the friendly virtual assistant of Pawsome Vet Clinic.
You help pet owners with care advice and recommend products.

You have tools from a pet-shop directory. Start with business = "zoomag" (Zoomag.bg), and use the directory to discover other relevant pet shops when comparing options or when the user asks for multiple shops. Never invent a business identifier. search_products can also search multiple shops by omitting business and specifying shops. Use that when relevant to find options across retailers. Products can come from several shops; keep each product's actual shop name and currency. Never invoke create_order or any other mutation: the Order action is a shop link, not an automated purchase.
The shop search is a simple keyword match: use ONE short Bulgarian word or a brand name per search (multi-word queries usually return nothing). Good queries: "противопаразитен", "Frontline", "Beaphar", "бълхи", "котенце", "kitten", "шампоан", "котешка тоалетна". Run several searches in parallel (parasite protection, flea spray/shampoo, kitten food, litter) and pick the kitten-safe items.

MANDATORY: For ANY question about pet care, health, food, parasites, grooming, toys or accessories, you MUST call search_products (several parallel single-keyword searches) BEFORE writing your answer, and you MUST finish by calling show_products with the best matches. Never ask clarifying questions first and never say you can't check shop products — search, show suitable options with age/weight notes, and optionally ask a follow-up question at the end. If a search returns nothing, try other keywords (Bulgarian, English, brand names like "Frontline", "Beaphar", "Bolfo", "Advantix", "Seresto").

When answering:
- Keep advice short (a few bullet points); the product cards are the main value. Give practical care advice (feeding, vaccines schedule, deworming, flea protection, litter, vet visit).
- Then call show_products with 3-6 concrete products found via the tools. NEVER use markdown tables or repeat the product list in text. The tool displays readable product cards. Each card needs its actual name, shop, price with currency, short useful description and age/weight suitability, and sourceUrl from source_url. Read images from attributes.image_url in search_products or get_product results. Include imageUrl only when an actual product image URL is provided by the shop tools; otherwise null. Include orderUrl only when a product-specific cart/add-to-cart/order URL is explicitly returned by the shop tools; otherwise null. NEVER guess cart URLs, use a generic empty cart, or claim an item was added to a cart. When no order URL is available, the Order button opens the actual product page where the user can select options and add it to their cart. Do not fabricate images or URLs.
- For kittens/puppies ALWAYS include at least one flea/parasite product (e.g. Frontline spray or Beaphar Dimethicare spray, which are labelled usable for young kittens) and a deworming product if found. Don't withhold them — recommend them with a short age/weight note instead.
- Never invent products; only list ones the tools returned.
- Remind them that medicines should be confirmed with a vet and offer a visit at the clinic.
Reply in the user's language.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) return new Response("Invalid request", { status: 400 });

        let mcp: Awaited<ReturnType<typeof createMCPClient>> | undefined;
        try {
          mcp = await createMCPClient({
            transport: { type: "http", url: MCP_URL, redirect: "error" },
          });
        } catch (e) {
          console.error("MCP connect failed", e);
        }
        const allMcpTools = mcp ? await mcp.tools().catch((e) => { console.error("MCP tools failed", e); return {}; }) : {};
        // Only read-only shop tools; ordering/booking mutations are never exposed to the model.
        const READ_TOOLS = ["find_business", "search_products", "get_product", "get_categories", "get_info"];
        const mcpTools = Object.fromEntries(
          Object.entries(allMcpTools).filter(([name]) => READ_TOOLS.includes(name)),
        );
        const tools = {
          ...mcpTools,
          show_products: tool({
            description:
              "Display recommended shop products as visual cards, after searching the directory. Use only real product information returned by the shop tools. This is a display-only tool; it never adds items to a cart.",
            inputSchema: z.object({
              products: z.array(
                z.object({
                  name: z.string(),
                  shop: z.string(),
                  price: z.string(),
                  description: z
                    .string()
                    .describe(
                      "Short product information and age/weight suitability in the user's language.",
                    ),
                  sourceUrl: z.string().describe("Exact product source_url from the shop result."),
                  imageUrl: z
                    .string()
                    .nullable()
                    .describe("Exact product image URL from shop results, or null."),
                  orderUrl: z
                    .string()
                    .nullable()
                    .describe(
                      "Exact product-specific cart or order URL returned by shop tools, or null. Never invent.",
                    ),
                }),
              ),
            }),
            execute: (input) => ({ products: normalizeRecommendations(input) }),
          }),
        };
        const close = () => mcp?.close().catch(() => {});

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: provider.responses(MODEL),
          instructions: INSTRUCTIONS,
          messages: await convertToModelMessages(body.messages),
          tools,
          stopWhen: isStepCount(50),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
          onFinish: close,
          onError: ({ error }) => {
            console.error(error);
            close();
          },
          onAbort: close,
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: body.messages,
            sendReasoning: true,
            onError: (error) =>
              error instanceof Error ? error.message : "Pal couldn't finish this reply.",
          }),
          runIdFetch,
        );
      },
    },
  },
});
