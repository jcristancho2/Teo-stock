---
name: wiki-query
description: Answers a question about this project using the wiki as a navigation layer — reads the index, opens relevant pages, verifies critical claims against the actual code, and cites sources. Use for "how does X work", "why was Y built this way", or any project-understanding question once wiki/index.md exists. Invoke as /wiki-query <question>.
---

# wiki-query

Answers questions about the project using the wiki to navigate, and the actual codebase to verify.

## Usage

```
/wiki-query How does authentication work?
/wiki-query Why do we have two payment providers?
```

## Process

1. Read `wiki/index.md` first — never load the whole wiki.
2. Open the pages that look relevant to the question.
3. Verify any claim that matters to the answer against the actual code/tests/config — the wiki is a map, not ground truth.
4. Answer with explicit citations (file paths, symbols, page links).
5. Distinguish clearly in the answer: facts (verified against code), decisions (recorded in `wiki/decisions/`), inferences (`> [!INFERENCE]`-worthy conclusions), and gaps (things the wiki and code don't currently answer).

## Turning the answer into knowledge

Before finishing, ask internally:
- Does a suitable page already exist for this answer?
- Should an existing page be updated with what was just found?
- Is this worth a new page under `wiki/analyses/`?
- Should a decision be recorded under `wiki/decisions/`?
- Should the glossary gain an entry?

Only persist the answer if it has reusable future value — combines info from multiple pages, resolves a contradiction, documents a non-obvious flow, or is likely to be asked again. Don't save trivial or one-off answers. If you do persist it, use `wiki/templates/analysis-template.md`, update `wiki/index.md`, and append a `query` entry to `wiki/log.md`.
