# blog
My first software engineering blog

## Structure

```
resources/          <- source of truth for post text (never touched by the site)
  00N/
    raw-00N.md         notes / context used to draft the post (not published)
    blog-00N.md        the actual post content in Markdown

src/                 <- the published static site (plain HTML, CSS, vanilla JS, no build step)
  index.html           home page, lists all posts
  style.css             single shared stylesheet for the whole site
  header-footer.js      single shared header/footer, used identically on every page
  script.js              renders the post list on the home page
  data/posts.js           list of posts shown on the home page (title, link, description)
  assets/                logo.png, icon.svg
  posts/
    post-00N.html          the published HTML version of resources/00N/blog-00N.md
```

The site is 100% static: open `src/index.html` directly in a browser, or host the `src/` folder
on any static hosting (GitHub Pages, Netlify, etc.). There is no server and no build command.

## How to add a new post

### 1. Write the post in Markdown (source of truth)

Create `resources/00N/blog-00N.md` (copy the style of an existing post). This file is what you
actually write and edit going forward - it's never deleted or overwritten by the site.

### 2. Convert it to a published HTML page

Create `src/posts/post-00N.html` by hand, using any existing file in `src/posts/` as a template.
Every post page has the exact same shape:

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

Only the `<article>` content changes between posts - copy the `<head>`/`<site-header>`/`<site-footer>`
boilerplate as-is, including `class="post-page"` on `<body>` (it's what fades the background grid on
article pages; the home page intentionally doesn't have it).

- Escape `<`, `>` and `&` inside `<pre><code>` blocks (e.g. `List<Integer>` → `List&lt;Integer&gt;`).
- For a Mermaid diagram, use `<pre class="mermaid">...</pre>` (raw Mermaid syntax inside) instead of
  a fenced code block, and add these two tags in `<head>` (see `post-005.html` for a real example):
  ```html
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: true, theme: "dark" });</script>
  ```

### 3. Add it to the home page list

Add one entry at the **top** of the array in `src/data/posts.js` (newest post first):

```js
{
  title: "Your Post Title",
  path: "posts/post-00N.html",
  description: "One sentence summary shown on the home page card.",
},
```

That's it - the home page automatically shows the new post, numbered, with the rest.

## Editing the shared look

- **Colors, spacing, typography** for the whole site: edit `src/style.css` only.
- **Header/footer/logo/links** shown on every page: edit the `SITE` object at the top of
  `src/header-footer.js` only. Both files are shared by every page, so one edit updates
  the entire site - no need to touch individual post files.

