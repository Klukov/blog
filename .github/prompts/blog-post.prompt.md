---
description: 'Draft resources/<id>/blog-<id>.md from resources/<id>/raw-<id>.md'
---
# Task

Write the content of `resources/<id>/blog-<id>.md` based on `resources/<id>/raw-<id>.md`.

## Inputs

- `resources/<id>/raw-<id>.md` — the author's raw notes / business context for this post. This is
  background to understand *why* something was built, not a script to translate literally. Don't
  quote sensitive business specifics unless the author has explicitly confirmed the exact framing
  in chat.
- Existing `resources/*/blog-*.md` files — the style reference (structure, tone, heading pattern,
  how code and links are presented).

## Requirements

- Output language: English, regardless of the language of the raw notes or the chat.
- Title: a single `#` heading, specific and technical, not clickbait.
- Intro: one short paragraph. This is the only place allowed to carry business/storytelling
  context.
- Body: short sentences, no filler. Get to the point. Prefer concrete technical explanation over
  generic statements.
- If the post discusses a real library/class from one of the author's GitHub repos, fetch the
  actual current source before writing about it (e.g. `curl` against the raw GitHub URL, or the
  GitHub API) — never invent or reconstruct code from memory.
- Use a Mermaid diagram or a table only if it adds information beyond the surrounding prose (a
  decision flow, a trade-off comparison). Skip it otherwise.
- End with a "Links" section listing the real repository/file links relevant to the post, if any.
- No "Takeaway" / "Conclusion" section unless explicitly requested.
- Never modify `raw-<id>.md`.

## Process

1. Read `raw-<id>.md` and 2-3 existing `blog-*.md` files for style calibration.
2. If the post references external source code, fetch it first for accuracy.
3. Draft `blog-<id>.md` directly.
4. Ask the author for confirmation only if a business-context detail in the raw notes is ambiguous
   or sensitive enough that getting it wrong would misrepresent their employer. Otherwise, write it
   and let them correct it.

## Success criteria

- Reads like the other posts in `resources/` — same tone, same structure, no filler.
- Doesn't contradict any correction the author has already made earlier in the conversation.
- Any quoted code is verified against the real source, not reconstructed from memory.

