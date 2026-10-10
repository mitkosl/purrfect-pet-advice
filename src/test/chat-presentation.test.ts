import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { isChatDebugEnabled, orderedChatParts } from "@/lib/chat-presentation";

const parts: UIMessage["parts"] = [
  {
    type: "dynamic-tool",
    toolName: "search_products",
    toolCallId: "search",
    state: "output-available",
    input: {},
    output: {},
  },
  {
    type: "dynamic-tool",
    toolName: "show_products",
    toolCallId: "products",
    state: "output-available",
    input: {},
    output: { products: [] },
  },
  { type: "text", text: "Kitten care advice." },
];

describe("chat presentation rules", () => {
  it("enables debug only for the explicit true URL value", () => {
    expect(isChatDebugEnabled("true")).toBe(true);
    expect(isChatDebugEnabled(true)).toBe(true);
    for (const value of [undefined, false, "false", "1", "TRUE"]) {
      expect(isChatDebugEnabled(value)).toBe(false);
    }
  });
  it("excludes search activity in normal mode", () => {
    expect(orderedChatParts(parts, false, false)).toEqual([parts[2], parts[1]]);
  });
  it("includes search activity only in debug mode", () => {
    expect(orderedChatParts(parts, true, false)).toEqual([parts[2], parts[0], parts[1]]);
  });
  it("puts the answer before products regardless of tool arrival order", () => {
    expect(orderedChatParts(parts, false, false)[0]).toEqual(parts[2]);
  });
  it("holds products until the answer finishes streaming", () => {
    expect(orderedChatParts(parts, false, true)).toEqual([parts[2]]);
  });
});
