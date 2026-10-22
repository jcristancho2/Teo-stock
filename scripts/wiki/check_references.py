#!/usr/bin/env python3
"""
check_references.py — validates `code_references` and `sources` listed in
wiki page frontmatter against the actual repository.

Usage:
    python3 scripts/wiki/check_references.py [wiki_root] [repo_root]

For each page, reads YAML frontmatter fields `code_references` and `sources`
(simple list items, e.g. "src/auth/auth-service.ts#AuthService"), strips the
"#Symbol" suffix, and checks that the base path exists under repo_root.

Symbols after '#' are NOT verified (would require per-language parsing) —
missing symbols are reported as warnings, not failures. Missing base paths
are failures (non-zero exit). URLs (http/https) are ignored.
"""
import re
import sys
from pathlib import Path

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
LIST_FIELD_RE = re.compile(r"^([a-zA-Z_]+):\s*$", re.MULTILINE)


def parse_frontmatter(text: str) -> dict:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    block = m.group(1)
    fields = {}
    current_key = None
    for line in block.splitlines():
        key_match = re.match(r"^([a-zA-Z_]+):\s*(.*)$", line)
        if key_match and not line.startswith(" ") and not line.startswith("-"):
            key, inline_val = key_match.groups()
            current_key = key
            fields[current_key] = [] if inline_val == "" else inline_val
            continue
        item_match = re.match(r"^\s*-\s*(.+)$", line)
        if item_match and current_key and isinstance(fields.get(current_key), list):
            fields[current_key].append(item_match.group(1).strip())
    return fields


def check_page(md_file: Path, repo_root: Path) -> tuple[list[str], list[str]]:
    failures, warnings = [], []
    try:
        text = md_file.read_text(encoding="utf-8")
    except Exception as e:
        return [f"{md_file}: could not read file ({e})"], []

    fields = parse_frontmatter(text)
    for field_name in ("code_references", "sources"):
        entries = fields.get(field_name, [])
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if entry.startswith(("http://", "https://")):
                continue
            path_part = entry.split("#", 1)[0].strip()
            if not path_part:
                continue
            target = (repo_root / path_part).resolve()
            if not target.exists():
                failures.append(f"{md_file}: {field_name} '{entry}' -> path '{path_part}' not found in repo")
            elif "#" in entry:
                warnings.append(f"{md_file}: {field_name} '{entry}' -> symbol not verified (path exists)")
    return failures, warnings


def main():
    wiki_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("wiki")
    repo_root = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(".")

    if not wiki_root.exists():
        print(f"check_references.py: wiki root '{wiki_root}' does not exist")
        sys.exit(1)

    all_failures, all_warnings = [], []
    for md_file in sorted(wiki_root.rglob("*.md")):
        f, w = check_page(md_file, repo_root)
        all_failures.extend(f)
        all_warnings.extend(w)

    if all_warnings:
        print(f"check_references.py: {len(all_warnings)} warning(s) (unverified symbols)\n")
        for w in all_warnings:
            print(f"  ~ {w}")
        print()

    if all_failures:
        print(f"check_references.py: {len(all_failures)} broken reference(s)\n")
        for f in all_failures:
            print(f"  - {f}")
        sys.exit(1)

    print("check_references.py: OK — all referenced paths exist")
    sys.exit(0)


if __name__ == "__main__":
    main()
