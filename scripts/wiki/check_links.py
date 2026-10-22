#!/usr/bin/env python3
"""
check_links.py — validates relative Markdown links across the wiki/ tree.

Usage:
    python3 scripts/wiki/check_links.py [root]

root defaults to "wiki". Walks every .md file under root, extracts
relative markdown links ([text](path)), ignores web links (http/https/mailto),
and verifies the destination file exists relative to the linking file.

Exit code: 0 if no broken links, 1 otherwise. Prints one line per problem.
"""
import re
import sys
from pathlib import Path

LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
WEB_SCHEMES = ("http://", "https://", "mailto:", "ftp://")


def extract_links(text: str):
    for m in LINK_RE.finditer(text):
        label, target = m.group(1), m.group(2).strip()
        yield label, target


def strip_anchor(path: str) -> str:
    return path.split("#", 1)[0]


def check_file(md_file: Path, root: Path) -> list[str]:
    problems = []
    try:
        text = md_file.read_text(encoding="utf-8")
    except Exception as e:
        return [f"{md_file}: could not read file ({e})"]

    for label, target in extract_links(text):
        if target.startswith(WEB_SCHEMES):
            continue
        if target.startswith("#"):
            # In-page anchor; not verified here.
            continue
        clean_target = strip_anchor(target)
        if not clean_target:
            continue
        resolved = (md_file.parent / clean_target).resolve()
        if not resolved.exists():
            problems.append(
                f"{md_file.relative_to(root.parent)}: broken link '[{label}]({target})' -> {clean_target} not found"
            )
    return problems


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("wiki")
    if not root.exists():
        print(f"check_links.py: root '{root}' does not exist")
        sys.exit(1)

    all_problems = []
    for md_file in sorted(root.rglob("*.md")):
        all_problems.extend(check_file(md_file, root))

    if all_problems:
        print(f"check_links.py: {len(all_problems)} broken link(s) found\n")
        for p in all_problems:
            print(f"  - {p}")
        sys.exit(1)

    print(f"check_links.py: OK — scanned {sum(1 for _ in root.rglob('*.md'))} files, no broken links")
    sys.exit(0)


if __name__ == "__main__":
    main()
