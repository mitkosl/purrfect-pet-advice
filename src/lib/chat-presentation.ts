import { isToolUIPart, type UIMessage } from "ai";

export function isChatDebugEnabled(value: unknown): boolean {
  return value === true || value === "true";
}

export function orderedChatParts(
  parts: UIMessage["parts"],
  debug: boolean,
  pending: boolean,
): UIMessage["parts"] {
  const text = parts.filter((part) => part.type === "text");
  const tools = parts.filter(isToolUIPart);
  const products = tools.filter(
    (part) =>
      (part.type === "dynamic-tool" ? part.toolName : part.type.slice(5)) === "show_products",
  );
  const searches = debug ? tools.filter((part) => !products.includes(part)) : [];
  return [...text, ...searches, ...(pending ? [] : products)];
}
