#!/usr/bin/env python3
"""
check_index.py — verifies wiki/index.md is consistent with the pages that
actually exist on disk.

Usage:
    python3 scripts/wiki/check_index.py [wiki_root]

Checks:
  1. Every page under wiki/ (excluding templates/, README.md, index.md,
     log.md, health.md) is linked from wiki/index.md.
  2. Every relative link inside wiki/index.md points to a file that exists.
  3. No page is linked more than once from the index (duplicate entries).

Exit code: 0 if consistent, 1 otherwise.
"""
import re
import sys
from pathlib import Path

LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
EXCLUDED_NAMES = {"README.md", "index.md", "log.md", "health.md"}
EXCLUDED_DIRS = {"templates"}


def collect_pages(wiki_root: Path) -> set[Path]:
    pages = set()
    for md_file in wiki_root.rglob("*.md"):
        rel = md_file.relative_to(wiki_root)
        if rel.name in EXCLUDED_NAMES:
            continue
        if any(part in EXCLUDED_DIRS for part in rel.parts):
            continue
        pages.add(md_file.resolve())
    return pages


def collect_index_links(index_file: Path, wiki_root: Path) -> list[Path]:
    links = []
    text = index_file.read_text(encoding="utf-8")
    for m in LINK_RE.finditer(text):
        target = m.group(2).strip()
        if target.startswith(("http://", "https://", "#")):
            continue
        clean = target.split("#", 1)[0]
        if not clean:
            continue
        resolved = (index_file.parent / clean).resolve()
        links.append(resolved)
    return links


def main():
    wiki_root = (Path(sys.argv[1]) if len(sys.argv) > 1 else Path("wiki")).resolve()
    index_file = wiki_root / "index.md"

    if not index_file.exists():
        print(f"check_index.py: {index_file} does not exist")
        sys.exit(1)

    pages = collect_pages(wiki_root)
    index_links = collect_index_links(index_file, wiki_root)
    index_links_set = set(index_links)

    problems = []

    missing_from_index = pages - index_links_set
    for p in sorted(missing_from_index):
        problems.append(f"page not referenced in index.md: {p.relative_to(wiki_root.parent)}")

    dangling_in_index = [l for l in index_links if not l.exists()]
    for l in dangling_in_index:
        problems.append(f"index.md links to missing page: {l}")

    seen, dupes = set(), set()
    for l in index_links:
        if l in seen:
            dupes.add(l)
        seen.add(l)
    for d in sorted(dupes):
        problems.append(f"duplicate index entry: {d.relative_to(wiki_root.parent)}")

    if problems:
        print(f"check_index.py: {len(problems)} problem(s)\n")
        for p in problems:
            print(f"  - {p}")
        sys.exit(1)

    print(f"check_index.py: OK — {len(pages)} pages, all indexed and consistent")
    sys.exit(0)


if __name__ == "__main__":
    main()
