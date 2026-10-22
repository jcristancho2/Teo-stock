# Teo — Disponibilidad de stock (Extrucol)

App web para que el equipo comercial de Extrucol consulte disponibilidad de
inventario y registre despachos, y para que el admin cargue el Excel diario
y gestione usuarios. React + Vite + TypeScript (frontend) y Firebase (Auth,
Firestore, Cloud Functions, Hosting) (backend). Ver `wiki/overview.md` para
el detalle.

<!-- BEGIN: Project Knowledge Protocol (managed by the llm-wiki skill) -->

## Project Knowledge Protocol

This project maintains an LLM Wiki under `wiki/`, built and kept current by the `llm-wiki` skill family and the `wiki-maintainer` agent. The wiki is a navigation map over the real project — it accelerates understanding, it never replaces verification against source code, tests, migrations, and configuration.

### Before an important task

Read `wiki/index.md` first. Identify related pages, read only those, and verify any critical claim against the actual code before relying on it. Review related decisions (`wiki/decisions/`) and any open contradictions or open questions on the relevant pages. Use the wiki to plan the work. This applies especially to architecture, development, debugging, refactoring, APIs, databases, security, infrastructure, configuration, integration, deployment, and technical-decision tasks.

### During the task

Use the wiki as a map, not an authority — verify anything that may be outdated. Record new stable knowledge as you find it rather than relying on conversation memory alone. Cite relevant paths and symbols when explaining things. Flag contradictions when you see them rather than silently picking a side.

### After substantive changes

Evaluate whether the task changed: behavior, architecture, a public API, the data model, an integration, a dependency, configuration, security, the build, deployment, an operational procedure, a technical decision, or a test that defines a new contract. If so, run `/llm-wiki sync`.

Do **not** trigger a sync for changes that are purely cosmetic, formatting, comments, generated files, internal renames with no external impact, automatic sorting, or lockfile-only changes with no functional effect.

### When answering project questions

Read the index, open the relevant pages, verify critical information against the code, and answer with references. Distinguish facts, decisions, inferences, and gaps explicitly. Consider recording a valuable analysis in `wiki/analyses/` when it combines information from multiple pages or has reusable future value — but don't save trivial or temporary answers.

### Context rule

Never load the entire wiki into context automatically. Load only `wiki/index.md`, the pages directly relevant to the current task, any decisions that bear on it, and the sources needed to verify a specific claim.

<!-- END: Project Knowledge Protocol (managed by the llm-wiki skill) -->
