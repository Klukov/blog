---
description: 'Publish resources/<id>/blog-<id>.md as docs/posts/post-<id>.html and list it on the home page'
---
# Task

Convert `resources/<id>/blog-<id>.md` into `docs/posts/post-<id>.html` and register it on the home
page. `resources/` is read-only input for this task — never modify it.

## Site architecture (don't change without an explicit request)

- Fully static site in `docs/`: plain HTML, one shared `docs/style.css`, one shared
  `docs/header-footer.js`. No build step, no bundler, no server. Named `docs/` (not `src/`) because
  GitHub Pages requires it for serving from the main branch.
- `<site-header>` and `<site-footer>` are Web Components defined once in `header-footer.js`. Every
  page includes the same `<script defer src="header-footer.js"></script>` (adjust the relative path
  per page depth) and the same two custom tags. Never hand-write header/footer markup into a post.
- All design (colors, spacing, fonts, component styles) lives only in `style.css`. Never add inline
  styles or one-off CSS in a post page.
- Do not add comments to `style.css`, `script.js`, `header-footer.js`, or `data/posts.js`. Comments
  inside quoted code samples in the post content are fine and should be kept as-is — they're part
  of the source being discussed, not infrastructure.
- The home page post list is data-driven from `docs/data/posts.js` (array of
  `{ title, path, description }`) and rendered by `docs/script.js`. Never hardcode post cards into
  `index.html`.

## Post page template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your Post Title — Engineering Blog</title>
  <link rel="icon" type="image/svg+xml" href="../assets/icon.svg">
  <link rel="stylesheet" href="../style.css">
  <script defer src="../header-footer.js"></script>
</head>
<body class="post-page">
  <div class="bg-grid" aria-hidden="true"></div>
  <div class="container">
    <site-header></site-header>

    <main class="post">
      <article>
        <h1>Your Post Title</h1>
        <p>Intro paragraph...</p>

        <h2>A Section</h2>
        <p>More text, <code>inline code</code>, <a href="https://...">links</a>...</p>

        <pre><code class="language-java">// code block
// remember to escape &lt; and &gt; inside code blocks</code></pre>
      </article>
    </main>

    <site-footer></site-footer>
  </div>
</body>
</html>
```

Only the `<article>` content changes between posts. Copy the rest verbatim, including
`class="post-page"` on `<body>` — it confines the animated background grid to the top of the page
and fades it out (see "Background grid rules" below). The home page intentionally doesn't have this
class.

## Markdown → HTML conversion rules

- Escape `<`, `>`, `&` inside `<pre><code>` blocks (e.g. `List<Integer>` → `List&lt;Integer&gt;`).
- Inline code → `<code>`. Fenced code blocks → `<pre><code class="language-xxx">` (the
  `language-xxx` class also drives syntax highlighting, see below).
- If the post has at least one real code block (not just inline `<code>`), add highlight.js so the
  code actually renders with colors instead of a flat block of text (see
  `post-001.html`/`post-002.html`/`post-004.html`/`post-006.html` for real examples). Use the
  **cdnjs** build, not the npm package on jsDelivr — the npm package ships CommonJS source
  (`require`/`module.exports`) that silently fails as a plain `<script src>` in the browser:
  ```html
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/styles/atom-one-dark.min.css">
  ```
  in `<head>`, and right before `</body>` (after all the article content, not in `<head>` -
  `hljs.highlightAll()` only finds code blocks that already exist in the DOM when it runs):
  ```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
  ```
  No extra markup needed - it auto-detects the language from the existing `language-xxx` class.
  Skip this entirely for a post with no code blocks (e.g. `post-003.html`, `post-005.html`).
- For a Mermaid diagram, use `<pre class="mermaid">...</pre>` with raw Mermaid syntax inside (not a
  fenced code block), and add these two tags in `<head>` (see `post-005.html` for a real example):
  ```html
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: true, theme: "dark" });</script>
  ```
- Tables/blockquotes/lists map to their obvious HTML equivalents; `style.css` already styles
  `article table`, `article blockquote`, `article ul/ol`, etc. — don't add new inline styling.
- A "Links" section in the Markdown becomes a `<ul class="post-links">` at the end of the article.

## Background grid rules (don't regress these)

- `.bg-grid` is `position: absolute` (not `fixed`), with `body { position: relative; min-height:
  100%; }`. This makes the overlay span the true full length of the page. Never switch this back to
  `position: fixed` — it made the grid appear to "restart" every viewport-height while scrolling a
  long page. Never use `height: 100%` on `body`/`html` (only `min-height: 100%`) — a hard `height`
  clips the overlay and creates a visible seam partway down a long page.
- Home page (no `post-page` class): grid is animated and **unmasked** across the entire page.
- Post pages (`body.post-page`): grid is animated only in the first `100vh`, then fades out via a
  **linear** mask (`linear-gradient(to bottom, black 0%, black 35%, transparent 100%)`) that reaches
  full transparency exactly at the element's bottom edge, so there's no visible seam. Don't switch
  this to a radial mask with fixed pixel/percent math — it previously caused visible seams.

## Registering the post on the home page

Add one entry at the **top** of the array in `docs/data/posts.js` (array order = display order,
newest first):

```js
{
  title: "Your Post Title",
  path: "posts/post-<id>.html",
  description: "One sentence summary shown on the home page card.",
},
```

The card number shown on the home page is computed in `script.js` from the actual post file order
(`post-001` → `01`, …), not from array position — don't touch that logic when adding a post.

## Success criteria

- `docs/posts/post-<id>.html` renders with the same header/footer/design as every other post — no
  inline styles, no duplicated header/footer markup.
- New entry added to `docs/data/posts.js`, at the top.
- `resources/` untouched.
- No comments added to `style.css` / `script.js` / `header-footer.js` / `data/posts.js`.

