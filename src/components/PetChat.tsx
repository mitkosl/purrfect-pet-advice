import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type DynamicToolUIPart, type ToolUIPart } from "ai";
import { useState } from "react";
import { toast } from "sonner";

import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import logo from "@/assets/pal-logo.png";

const SUGGESTIONS = [
  "I got a small kitten, 2 months old, but have no idea how to take care of it. Give me advice and medicines I need to give it.",
  "What flea protection is safe for a puppy?",
];

const toolTitles: Record<string, string> = {
  search_products: "Searching Zoomag shop",
  get_product: "Checking product details",
  find_business: "Finding pet shops",
  get_categories: "Browsing categories",
};

export function PetChat({ onClose }: { onClose?: () => void }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => {
      const m = e.message || "";
      if (m.includes("429")) toast.error("Too many requests — please wait a moment.");
      else if (m.includes("402")) toast.error("AI credits are exhausted.");
      else toast.error("Something went wrong. Please try again.");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <img src={logo} alt="Pal" width={40} height={40} className="size-10" />
        <div>
          <p className="font-display text-lg leading-tight">Ask Pal</p>
          <p className="text-xs text-muted-foreground">Pet care advice & products from Zoomag</p>
        </div>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="mt-4 flex flex-col gap-2">
                <img src={logo} alt="" width={64} height={64} className="mx-auto size-16" />
                <p className="font-display text-xl">Hi, I'm Pal!</p>
                <p className="text-sm text-muted-foreground">Tell me about your pet — I'll share care tips and find products.</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border bg-background p-3 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.parts.map((p, i) => {
                    if (p.type === "text")
                      return <MessageResponse key={i}>{p.text}</MessageResponse>;
                    if (isToolUIPart(p)) {
                      const tp = p as ToolUIPart | DynamicToolUIPart;
                      const name = tp.type === "dynamic-tool" ? tp.toolName : tp.type.slice(5);
                      return (
                        <Tool key={i} defaultOpen={false}>
                          {tp.type === "dynamic-tool" ? (
                            <ToolHeader type="dynamic-tool" toolName={tp.toolName} state={tp.state} title={toolTitles[name] ?? name} />
                          ) : (
                            <ToolHeader type={tp.type} state={tp.state} title={toolTitles[name] ?? name} />
                          )}
                          <ToolContent>
                            <ToolInput input={tp.input} />
                            <ToolOutput output={tp.state === "output-available" ? tp.output : undefined} errorText={tp.state === "output-error" ? tp.errorText : undefined} />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer>Pal is thinking...</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-3">
        <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your pet..."
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
