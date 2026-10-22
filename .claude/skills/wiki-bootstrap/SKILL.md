---
name: wiki-bootstrap
description: Build or rebuild this project's LLM Wiki from scratch — inspects the repository, detects stack and architecture, and creates the initial wiki/ structure and pages. Use when wiki/index.md does not exist yet, or when explicitly asked to rebuild the wiki. Invoke as /wiki-bootstrap.
---

# wiki-bootstrap

Builds the initial LLM Wiki for this repository. This is normally run once per project (by the `llm-wiki` orchestrating skill on first use), but can be re-run to rebuild.

## Process

1. **Discovery.** Inspect the repository: directory tree, README files, dependency manifests, entry points, routes/controllers/services, data models, migrations, tests, CI config, Dockerfiles, deployment config, documented env vars, API contracts, recent git history, TODO/FIXME markers. Ignore `node_modules/`, `.venv/`, `vendor/`, build output, caches, and other non-architectural bulk.

2. **Determine** (before writing anything): project purpose, application type, primary users, stack, languages, frameworks, entry points, architecture, main modules, internal/external dependencies, critical flows, data model, APIs, integrations, dev/test/build/deploy commands, identifiable decisions, technical debt, risks, and gaps.

3. **Create structure** under the repo root (skip subfolders that have nothing to put in them yet — leave a short README explaining when to use them instead of an empty folder):
   ```
   wiki/{README.md,index.md,overview.md,log.md,health.md}
   wiki/architecture/{system-context,components,data-flow,integrations,deployment}.md
   wiki/{modules,entities,concepts,api,data,operations,security,decisions,sources,analyses,glossary}/
   wiki/templates/{page,source,decision,runbook,analysis}-template.md
   knowledge/{README.md,raw/README.md,raw/{documents,research,meetings,requirements,assets}/}
   scripts/wiki/{check_links,check_references,check_index,changed_files}.py
   ```

4. **Build initial pages** using only real evidence from the repo. At minimum (when enough evidence exists): overview, system-context, components, main modules, data-flow, data model, APIs, auth/authz, integrations, configuration, local dev, testing, build, deployment, security, glossary, and any decisions you can actually identify from the code/history. Use the page frontmatter schema from `wiki/templates/page-template.md`. When there isn't enough evidence for something, create an open question and mark the page `status: needs-review` instead of guessing.

5. **Complete `wiki/index.md`** — one line per page: link, description, status, update date, last verified commit. Keep it under ~200 lines; it's a map, not a mirror of the content.

6. **Complete `wiki/log.md`** with a single `bootstrap` entry describing what was created.

7. **Run the initial audit**: `python3 scripts/wiki/check_links.py && python3 scripts/wiki/check_references.py && python3 scripts/wiki/check_index.py`. Fix what's fixable; write anything unresolved into `wiki/health.md`.

## What this does not do

Does not touch application logic, product tests, or product infrastructure. Does not create the agent, the other five skills, the hook, or the GitHub workflows — that scaffolding is created once by the parent `llm-wiki` skill, not re-created on every bootstrap.
