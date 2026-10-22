# Wiki

This is the project's LLM Wiki — a persistent, cumulative knowledge layer built and maintained mostly by Claude, following the pattern popularized by Andrej Karpathy.

## How to read it

Start at [index.md](index.md) — the knowledge map. It links to every page in the wiki with a one-line description, status, and (where useful) the last commit each page was verified against.

## Who edits what

- **Humans**: read, review, correct, and version everything here. You can edit any page directly.
- **Claude** (via the `wiki-maintainer` agent and the `llm-wiki` skill family): creates, updates, links, and audits pages. Claude treats source code, tests, migrations, and configuration as the real source of truth — the wiki is a map, not an authority. See [overview.md](overview.md) for the project itself, and `wiki/README.md`'s callout conventions below for how uncertainty is marked.

## Callout conventions

- `> [!INFERENCE]` — a conclusion drawn from evidence, not stated outright anywhere.
- `> [!NEEDS-VERIFICATION]` — not enough evidence yet to confirm a claim.
- `> [!CONTRADICTION]` — documentation and code (or two sources) disagree; both sides are stated.

## Key files

| File | Purpose |
|---|---|
| `index.md` | Knowledge map — read this first |
| `overview.md` | What the project is, who it's for, high-level architecture |
| `log.md` | Append-only chronological record of every wiki operation |
| `health.md` | Audit status — broken links, stale pages, contradictions, coverage gaps |

## Obsidian

This wiki works as a standard Obsidian vault (or subfolder of one): plain Markdown, relative links, YAML frontmatter, tags, and aliases. No plugins required, though Dataview works well with the frontmatter schema used here (see `templates/page-template.md`).
