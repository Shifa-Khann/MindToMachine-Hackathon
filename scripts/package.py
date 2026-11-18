"""Zip the repo for hand-in. Excludes out/, inbox/, .env, __pycache__ (and .git, dist, virtualenvs).
Standard library only. Usage: python scripts/package.py  ->  dist/eventmind-<date>.zip"""
import datetime
import os
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {"out", "inbox", "__pycache__", ".git", "dist", ".venv", "venv", ".idea", ".vscode"}
SKIP_FILES = {".env", ".DS_Store"}


def main():
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    target = dist / f"eventmind-{datetime.date.today().isoformat()}.zip"
    count = 0
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as z:
        for folder, dirs, files in os.walk(ROOT):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for name in files:
                if name in SKIP_FILES or name.endswith(".pyc"):
                    continue
                path = Path(folder) / name
                z.write(path, Path("eventmind") / path.relative_to(ROOT))
                count += 1
    print(f"Packaged {count} files -> {target.relative_to(ROOT)} (no out/, inbox/, .env, __pycache__)")


if __name__ == "__main__":
    main()
