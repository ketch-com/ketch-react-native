#!/usr/bin/env python3
"""Switch example/package.json between local file: dependency and npm registry release."""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

PACKAGE_NAME = "@ketch-com/ketch-react-native"
LOCAL_SPEC = "file:../package"
LOCAL_RE = re.compile(
    rf'"{re.escape(PACKAGE_NAME)}":\s*"file:\.\./package"'
)
REMOTE_RE = re.compile(
    rf'"{re.escape(PACKAGE_NAME)}":\s*"[\^~]?\d+\.\d+\.\d+(?:-[\w.]+)?"'
)


def latest_npm_version() -> str:
    proc = subprocess.run(
        ["npm", "view", PACKAGE_NAME, "version"],
        check=False,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise SystemExit(
            f"npm view failed ({proc.returncode}) for {PACKAGE_NAME!r}:\n{proc.stderr.strip()}"
        )
    version = proc.stdout.strip()
    if not version:
        raise SystemExit(f"No version returned for {PACKAGE_NAME!r}")
    return version


def remote_version() -> tuple[str, str]:
    pinned = os.environ.get("KETCH_RN_VERSION", "").strip()
    if pinned:
        return pinned, f"exactVersion={pinned!r}"
    version = latest_npm_version()
    return version, f"{version!r} (latest on npm)"


def target_spec(mode: str) -> tuple[str, str]:
    if mode == "local":
        return LOCAL_SPEC, "local file:../package"
    version, summary = remote_version()
    return version, f"npm ({summary})"


def replace_dependency_text(content: str, new_spec: str) -> str:
    replacement = f'"{PACKAGE_NAME}": "{new_spec}"'
    if LOCAL_RE.search(content):
        return LOCAL_RE.sub(replacement, content, count=1)
    if REMOTE_RE.search(content):
        return REMOTE_RE.sub(replacement, content, count=1)
    raise SystemExit(
        f"No {PACKAGE_NAME} dependency found in package.json "
        '(expected "file:../package" or a semver version).'
    )


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(
            "Usage: configure-sample-package.py <local|remote> <path-to-package.json>"
        )

    mode = sys.argv[1]
    package_path = Path(sys.argv[2])

    if mode not in ("local", "remote"):
        raise SystemExit("mode must be local or remote")
    if not package_path.is_file():
        raise SystemExit(f"Missing package.json: {package_path}")

    new_spec, summary = target_spec(mode)
    original = package_path.read_text(encoding="utf-8")
    updated = replace_dependency_text(original, new_spec)

    if updated != original:
        package_path.write_text(updated, encoding="utf-8")
        print(f"Updated {package_path} to use {summary}.")
    else:
        print(f"No changes needed for {package_path} ({mode}).")


if __name__ == "__main__":
    main()
