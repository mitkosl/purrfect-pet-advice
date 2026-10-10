<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Chat assistant streams from src/routes/api/chat.ts and loads tools from the storefront MCP server per request; why: keeps API key and MCP access server-side.
- Product recommendations use a display-only show_products tool and a shared validated card model; why: separates readable product cards from hidden MCP activity and prevents invented cart destinations.
- Background tool and reasoning parts remain in the conversation transport but are not rendered; why: preserves follow-up context while showing only advice, recommendations, and a thinking indicator.
- The MCP transport gets an explicit bound fetch wrapper; why: Cloudflare Workers throw "Illegal invocation" when fetch is called as a method of another object.
