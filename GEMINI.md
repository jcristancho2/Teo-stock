<!-- BEGIN: Project Knowledge Protocol (managed by the llm-wiki skill) -->

# Project context for Gemini

This project maintains a living knowledge map under `wiki/`, verified against the real codebase.

## Before a non-trivial task

1. Read `wiki/index.md` first — don't load the whole wiki, only the pages it points you to.
2. Verify any claim you rely on against the actual code, tests, or config. The wiki is a navigation aid; source code is the authority when they disagree.
3. Check `wiki/decisions/` for relevant recorded decisions and the target page's "Contradictions" / "Open questions" sections.

## After a substantive change

If the change affected behavior, architecture, a public API, the data model, an integration, configuration, security, or a technical decision, update the relevant `wiki/**` pages — cite evidence (file paths, symbols, tests), never invent content. Skip this for purely cosmetic or formatting changes.

## Conventions

See `wiki/README.md` for the frontmatter schema and the `[!INFERENCE]` / `[!NEEDS-VERIFICATION]` / `[!CONTRADICTION]` callout conventions used throughout the wiki.

This file mirrors `AGENTS.md` at the repo root, which is the tool-agnostic version of this same instruction.

<!-- END: Project Knowledge Protocol (managed by the llm-wiki skill) -->
