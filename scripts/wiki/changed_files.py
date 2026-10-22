#!/usr/bin/env python3
"""
changed_files.py — lists and classifies files changed in a Git range (or
working tree), for use by wiki-sync and the local hook.

Usage:
    python3 scripts/wiki/changed_files.py                 # uncommitted changes
    python3 scripts/wiki/changed_files.py HEAD~1..HEAD     # a commit range
    python3 scripts/wiki/changed_files.py --json           # JSON output
    python3 scripts/wiki/changed_files.py HEAD~3..HEAD --json

Classifies each changed file into:
  - wiki_infra:   wiki/**, .claude/**, scripts/wiki/**, .github/workflows/wiki-*.yml
  - generated:    lockfiles, build output, dist/, node_modules/, coverage/, .venv/, __pycache__/
  - substantive:  everything else (source, tests, config, migrations, schemas, docs)

This classification is a heuristic starting point for wiki-sync and the
hook to decide whether a change is substantive — it does not replace
reading the actual diff.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

WIKI_INFRA_PREFIXES = ("wiki/", ".claude/", "scripts/wiki/")
WIKI_INFRA_WORKFLOW_RE = (".github/workflows/wiki-check.yml", ".github/workflows/wiki-sync.yml")

GENERATED_MARKERS = (
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock",
    "Cargo.lock", "Gemfile.lock", "composer.lock",
)
GENERATED_DIR_MARKERS = (
    "node_modules/", "dist/", "build/", "coverage/", ".venv/", "venv/",
    "__pycache__/", ".next/", "target/", ".cache/",
)


def run_git(args: list[str]) -> str:
    result = subprocess.run(["git", *args], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"changed_files.py: git error: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return result.stdout


def get_changed_files(git_range: str | None) -> list[str]:
    if git_range:
        out = run_git(["diff", "--name-only", git_range])
    else:
        # Uncommitted changes: staged + unstaged + untracked
        staged = run_git(["diff", "--name-only", "--cached"])
        unstaged = run_git(["diff", "--name-only"])
        untracked = run_git(["ls-files", "--others", "--exclude-standard"])
        out = "\n".join([staged, unstaged, untracked])
    return sorted({line.strip() for line in out.splitlines() if line.strip()})


def classify(path: str) -> str:
    if path in WIKI_INFRA_WORKFLOW_RE:
        return "wiki_infra"
    if any(path.startswith(prefix) for prefix in WIKI_INFRA_PREFIXES):
        return "wiki_infra"
    if any(marker in path for marker in GENERATED_DIR_MARKERS):
        return "generated"
    if Path(path).name in GENERATED_MARKERS:
        return "generated"
    return "substantive"


def main():
    args = sys.argv[1:]
    as_json = "--json" in args
    args = [a for a in args if a != "--json"]
    git_range = args[0] if args else None

    files = get_changed_files(git_range)
    classified = {"wiki_infra": [], "generated": [], "substantive": []}
    for f in files:
        classified[classify(f)].append(f)

    if as_json:
        print(json.dumps(classified, indent=2))
        return

    print(f"changed_files.py: {len(files)} file(s) changed"
          + (f" in {git_range}" if git_range else " (working tree)"))
    for category in ("substantive", "wiki_infra", "generated"):
        items = classified[category]
        print(f"\n{category} ({len(items)}):")
        for f in items:
            print(f"  - {f}")


if __name__ == "__main__":
    main()
