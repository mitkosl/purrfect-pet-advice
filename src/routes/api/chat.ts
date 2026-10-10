import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { createMCPClient } from "@ai-sdk/mcp";
import { convertToModelMessages, isStepCount, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id";

const MCP_URL = "https://storefront.fleetq.net/mcp/";
const MODEL = "openai/gpt-6-astra";

const INSTRUCTIONS = `You are "Pal", the friendly virtual assistant of Pawsome Vet Clinic.
You help pet owners with care advice and recommend products.

You have tools from a pet-shop directory. For product recommendations ALWAYS search the shop with business = "zoomag" (Zoomag.bg).
Product catalogs are in Bulgarian, so search with Bulgarian keywords too (e.g. "котенце", "противопаразитни котки", "пипета котки", "обезпаразитяване котка", "храна за котенца", "нашийник против бълхи"). Run several focused searches when useful (e.g. dewormers, flea/tick treatment, flea collars, kitten food).

When answering:
- Give clear, practical care advice first (feeding, vaccines schedule, deworming, flea protection, litter, vet visit).
- Then recommend 3-6 concrete products found via the tools, each with name, price, and a markdown link to its source_url. Note age/weight suitability (many flea products are NOT safe for kittens under 8-10 weeks — mention this).
- Never invent products; only list ones the tools returned.
- Remind them that medicines should be confirmed with a vet and offer a visit at the clinic.
Reply in the user's language.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) return new Response("Invalid request", { status: 400 });

        let mcp: Awaited<ReturnType<typeof createMCPClient>> | undefined;
        try {
          mcp = await createMCPClient({ transport: { type: "http", url: MCP_URL, redirect: "error" } });
        } catch (e) {
          console.error("MCP connect failed", e);
        }
        const tools = mcp ? await mcp.tools().catch(() => ({})) : {};
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
          stopWhen: isStepCount(10),
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
          result.toUIMessageStreamResponse({ originalMessages: body.messages, sendReasoning: true }),
          runIdFetch,
        );
      },
    },
  },
});
