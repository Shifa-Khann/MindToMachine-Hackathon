#!/usr/bin/env python3
"""EventMind - the one command.

    python eventmind.py <messages-file>     first run = full plan; later runs = update with new messages
    python eventmind.py reset               delete saved state (start fresh)

The same command is used for the full pack and for every new message (new file, or the same
pack file with messages appended). No flags or hints.
"""
import shutil
import sys

from eventmind import config, runner


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    arg = sys.argv[1]
    if arg == "reset":
        shutil.rmtree(config.OUT, ignore_errors=True)
        print("State cleared. Next run is a full run.")
        return
    if not config.API_KEY and "localhost" not in config.BASE_URL:
        print("Set EVENTMIND_API_KEY in .env (see .env.example).")
        sys.exit(1)
    runner.run(arg)


if __name__ == "__main__":
    main()
