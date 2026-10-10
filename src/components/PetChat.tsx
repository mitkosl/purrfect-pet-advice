import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { normalizeRecommendations } from "@/lib/product-recommendations";
import { orderedChatParts } from "@/lib/chat-presentation";
import logo from "@/assets/pal-logo.png";

const SUGGESTIONS = [
  "I got a small kitten, 2 months old, but have no idea how to take care of it. Give me advice and medicines I need to give it.",
  "What flea protection is safe for a puppy?",
];

export function PetChat({
  debug = false,
  onClose,
  onProductsChange,
}: {
  debug?: boolean;
  onClose?: () => void;
  onProductsChange?: (hasProducts: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => {
      toast.error(e.message || "Pal couldn't finish this reply. Please try again.");
    },
  });
  const busy = status === "submitted" || status === "streaming";
  const hasProducts = messages.some((message) =>
    message.parts.some((part) => {
      if (!isToolUIPart(part) || part.state !== "output-available") return false;
      const name = part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);
      return name === "show_products" && normalizeRecommendations(part.output).length > 0;
    }),
  );

  useEffect(() => {
    onProductsChange?.(hasProducts);
  }, [hasProducts, onProductsChange]);
  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <img src={logo} alt="Pal" width={40} height={40} className="size-10" />
        <div className="flex-1">
          <p className="font-display text-lg leading-tight">Ask Pal</p>
          <p className="text-xs text-muted-foreground">Pet care & finds from pet shops</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close chat"
            className="shrink-0 text-muted-foreground"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="mt-4 flex flex-col gap-2">
                <img src={logo} alt="" width={64} height={64} className="mx-auto size-16" />
                <p className="font-display text-xl">Hi, I'm Pal!</p>
                <p className="text-sm text-muted-foreground">
                  Tell me about your pet — I'll share care tips and find products.
                </p>
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    onClick={() => send(s)}
                    className="h-auto whitespace-normal rounded-lg p-3 text-left text-sm"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message
                key={m.id}
                from={m.role}
                className={m.role === "assistant" ? "max-w-full" : undefined}
              >
                <MessageContent className={m.role === "assistant" ? "w-full" : undefined}>
                  {orderedChatParts(m.parts, debug, busy && m.id === messages.at(-1)?.id).map((p, i) => {
                    if (p.type === "text")
                      return (
                        <MessageResponse
                          key={i}
                          linkSafety={{ enabled: false }}
                          isAnimating={status === "streaming" && m.id === messages.at(-1)?.id}
                        >
                          {p.text}
                        </MessageResponse>
                      );
                    if (isToolUIPart(p)) {
                      const name = p.type === "dynamic-tool" ? p.toolName : p.type.slice(5);
                      if (name === "show_products") {
                        if (p.state !== "output-available") return null;
                        const products = normalizeRecommendations(p.output);
                        return products.length ? (
                          <div key={i} className="flex w-full flex-col gap-3">
                            <p className="text-sm font-semibold">We recommend these for your pet:</p>
                            <ProductRecommendations products={products} />
                          </div>
                        ) : null;
                      }
                      // Search details are available only in URL-enabled debug mode.
                      return (
                        <Tool key={i} defaultOpen={false}>
                          {p.type === "dynamic-tool" ? (
                            <ToolHeader type={p.type} toolName={p.toolName} state={p.state} />
                          ) : (
                            <ToolHeader type={p.type} state={p.state} />
                          )}
                          <ToolContent>
                            <ToolInput input={p.input} />
                            <ToolOutput output={p.output} errorText={p.errorText} />
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
          {busy && <Shimmer>Pal is thinking...</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-3">
        <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            className="min-h-12"
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
