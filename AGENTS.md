# Code Pet
Desktop pet that reacts to developer events. Default pet: sleepy ghost holding a coffee mug.

## Stack and rules
- Electron + plain JavaScript, no frameworks, Node LTS, minimal dependencies.
- Pet window: transparent, frameless, always-on-top, ~200x200, bottom-right, hidden from taskbar, click-through except on the pet (guard for Linux).
- Local HTTP server on 127.0.0.1:4747 only. POST /event with JSON {type}. Validate type, cap body size.
- Event types: test_pass, test_fail, build_ok, commit.
- States: idle, happy, panic, sleep. Reactions last ~4s, then return to idle. Sleep after 5 min of system idle (configurable), wake on activity.
- Sprites: assets/pets/ghost/{idle,happy,panic,sleep}.(png|svg), one key pose per state, animated with CSS (idle=float, happy=bounce+sparkles, panic=shake, sleep=breathe+drifting z). Pet folders must be swappable.
- CLI `pet`: `pet run -- <cmd>` (pass through output and exit code, send test_pass/test_fail), `pet send <type>`, `pet install-hooks` (post-commit hook).
- Must work on Windows, macOS, Linux.

## Working rules
- Small steps. Commit after each phase with a clear message.
- Add a test or script for every feature, run it, and fix failures before moving on.
- The pet must never block a git commit or a command. Hooks fail silently.
- If something can't be verified here (like the GUI), say so.
