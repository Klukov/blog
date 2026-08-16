# Copilot Instructions for this repository

This repo is Piotr Klukowski's personal engineering blog: short, technical write-ups about real
production bugs, concurrency issues, and the fixes/libraries that came out of them.

## Repository structure

- `resources/00N/raw-00N.md` — raw notes / business context used to draft a post. Author-written
  source material. **Never edit, rewrite, "clean up" or translate these files.**
- `resources/00N/blog-00N.md` — the actual blog post content in Markdown. This is the **source of
  truth for post text**.
- `docs/` — the published static site (plain HTML, CSS, vanilla JS, zero build step, zero server).
  Named `docs/` (not `src/`) because GitHub Pages requires it for serving from the main branch.
- `.github/prompts/blog-post.prompt.md` — procedure for turning a `raw-00N.md` into a `blog-00N.md`.
- `.github/prompts/html-post.prompt.md` — procedure for turning a finished `blog-00N.md` into a
  published HTML page, including the full site architecture reference.

Procedural/technical details (exact HTML template, escaping rules, how to register a post, CSS
architecture) live **only** in the two prompt files above — not duplicated in this file or in
`README.md`. If you're about to write or publish a post, read the relevant prompt file first.

## Writing style for blog posts (`blog-00N.md`)

- Written in English, regardless of the language of the raw notes or the chat.
- **No filler, no corporate padding.** Short sentences. Get to the point.
- The intro paragraph is the only place allowed to carry extra business/storytelling context —
  everything after that stays tight and technical.
- No "Takeaway" / "Conclusion" section unless explicitly requested — it tends to be filler.
- Match the structure/tone of the existing posts in `resources/*/blog-*.md` (headings, code blocks,
  a "Links" section at the end pointing to real GitHub source).
- Never invent numbers, metrics, business details, or code that wasn't given or verified. If a post
  references a real GitHub repo/class, fetch the actual current source first (e.g. via `curl`
  against the raw GitHub URL or the GitHub API) — never reconstruct code from memory.
- Don't take the raw notes literally / translate them word for word — they explain *why* something
  was built, not a script to reproduce. Reinterpret into a coherent narrative.
- Business context is sensitive: don't add or infer specifics (industry, company type, exact
  numbers) beyond what's been explicitly confirmed in chat. If corrected on a business-context
  detail, that correction is authoritative — don't reintroduce the old framing later in the post or
  in future posts about the same system.
- Use a Mermaid diagram or a table only if it adds information beyond the surrounding prose (e.g. a
  decision flow, a trade-off comparison). Skip it otherwise — it's not decoration.

## The published site (`docs/`)

- Fully static: plain HTML files, one shared `style.css`, one shared `header-footer.js`. No build
  step, no bundler, no server.
- `<site-header>` / `<site-footer>` are Web Components defined once in `header-footer.js` and
  reused identically on every page. Never hand-copy header/footer markup into a post page.
- All design tokens (colors, spacing, fonts, component styles) live only in `style.css`. Never add
  inline styles or repeat color values in an individual page.
- Do not add explanatory comments to the site's own infrastructure code (`style.css`, `script.js`,
  `header-footer.js`, `data/posts.js`). Comments inside blog post code samples (quoted from real
  repositories) are content, not infrastructure — keep those as-is.
- `resources/` is never modified as a side effect of publishing to `docs/`. The flow is one-way:
  `resources/*/blog-*.md` → `docs/posts/*.html`.

## Known pitfalls (don't reintroduce these bugs)

- The background grid overlay (`.bg-grid`) must be `position: absolute`, not `fixed`, with
  `body { position: relative; min-height: 100%; }` (not `height: 100%`). `fixed` made the pattern
  visually "restart" every viewport-height while scrolling a long page; a hard `height` on `body`
  clipped the overlay and created a visible seam partway down long pages.
- Fading the grid to transparent must use a **linear** gradient mask that reaches 0% opacity exactly
  at the element's own edge (e.g. `linear-gradient(to bottom, black 0%, black 35%, transparent
  100%)`). A radial mask with fixed px/percent math previously caused a visible seam.
- The home page shows the grid animated and unmasked across the whole page. Post pages
  (`body.post-page`) show it animated only in the first `100vh`, then faded out — this is
  intentional (readability of long article text), not a bug to "fix" back to full coverage.
- The post number shown on the home page card grid is computed from the actual post file order
  (`post-001` → `01`, …), not from its position in the (newest-first) display array in
  `data/posts.js`.
- `get_errors` on this project routinely reports harmless false positives: unknown custom element
  tags (`site-header`/`site-footer`), "missed locally stored library" for the Mermaid CDN
  `<script>`, and `font-family does not have generic default` for properties using `var()`. These
  are not real problems — don't spend time chasing them.

## Communication style

- Chat happens in Polish; blog post content is written in English.
- Be direct and concise. Don't restate unchanged context from earlier in the conversation.
- For architecture/design decisions with lasting consequences (site structure, visual design
  system): propose the plan first and wait for confirmation before implementing.
- For concrete, scoped tasks (fix a bug, edit a post, add a link): just do the work.
- If something can't be verified (e.g. no browsing/fetch tool available), say so plainly instead of
  guessing or fabricating.

