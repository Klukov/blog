# blog
My first software engineering blog

## Structure

```
resources/          <- source of truth for post text (never touched by the site)
  00N/
    raw-00N.md         notes / context used to draft the post (not published)
    blog-00N.md        the actual post content in Markdown

docs/                <- the published static site (plain HTML, CSS, vanilla JS, no build step)
  index.html           home page, lists all posts
  style.css             single shared stylesheet for the whole site
  header-footer.js      single shared header/footer, used identically on every page
  script.js              renders the post list on the home page
  data/posts.js           list of posts shown on the home page (title, link, description)
  assets/                logo.png, icon.svg
  posts/
    post-00N.html          the published HTML version of resources/00N/blog-00N.md
```

The site is 100% static: open `docs/index.html` directly in a browser, or host the `docs/` folder
on any static hosting. There is no server and no build command.

## Adding a new post

1. **Draft the Markdown** — `resources/00N/raw-00N.md` → `resources/00N/blog-00N.md`.
   See [`.github/prompts/blog-post.prompt.md`](.github/prompts/blog-post.prompt.md).
2. **Publish it as HTML** — `resources/00N/blog-00N.md` → `docs/posts/post-00N.html` + an entry in
   `docs/data/posts.js`.
   See [`.github/prompts/html-post.prompt.md`](.github/prompts/html-post.prompt.md).

The exact steps, HTML template, and site architecture rules live in those two prompt files - they
are the single source of truth for "how", so they're not repeated here.

