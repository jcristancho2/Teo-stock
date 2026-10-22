---
name: wiki-file-analysis
description: Analyzes a specific file or directory in the codebase — explains its purpose, relates it to existing wiki modules, detects its dependencies, flags risks — and integrates stable findings into the wiki. Use when the user wants a deep-dive on a particular part of the codebase. Invoke as /wiki-file-analysis <path>.
---

# wiki-file-analysis

Deep-dives on a specific file or directory and folds durable findings into the wiki.

## Usage

```
/wiki-file-analysis src/auth/
/wiki-file-analysis src/payments/stripe-adapter.ts
```

## Process

1. Read the target file(s) directly — don't rely on an existing wiki page's description of them.
2. Explain: purpose, responsibilities, how it works, main flow, error handling, inputs/outputs, dependencies (internal and external), configuration it reads.
3. Relate it to existing wiki pages — which module/concept/entity page already covers this area, if any.
4. Identify risks and technical debt visible in the code itself (not speculation) — e.g., missing error handling, tight coupling, TODO/FIXME markers, outdated dependencies.
5. If the findings are stable and evidence-backed, integrate them: update the relevant `wiki/modules/` or `wiki/concepts/` page, or create one if none exists and the area is substantial enough to warrant it.
6. Append an `analysis` entry to `wiki/log.md` if the wiki was changed.

## What stays in the response, not the wiki

One-off observations with no lasting value, or anything you couldn't verify directly from the file, stay in your answer to the user rather than being written into the wiki.
