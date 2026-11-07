# Code Pet

> **Demo GIF placeholder:** Record the app with `npm run demo` and replace this note with the resulting GIF.

Code Pet is a tiny desktop companion that reacts to your tests, builds, commits, and idle time.

## Quick start

```sh
npm install
npm start
```

The pet stays in a small floating window. Its local event server listens only on `127.0.0.1`. Keep Code Pet running while sending events.

To preview the reactions for a recording, start Code Pet in one terminal and run this in another:

```sh
npm run demo
```

The demo sends `commit`, `test_fail`, `test_pass`, and `sleep` in order, with pauses between them. The final sleep is triggered explicitly so recording does not require waiting for the normal idle threshold. It ends with the pet asleep; send a `wake` event or resume normal activity to wake it.

## Events

Send events to `POST http://127.0.0.1:4747/event` with a JSON body such as `{"type":"test_pass"}`. Bodies over 1 KB and unknown event types are rejected.

| Event type | Pet reaction |
| --- | --- |
| `test_pass` | Happy, then idle after the reaction duration |
| `build_ok` | Happy, then idle |
| `commit` | Happy, then idle |
| `test_fail` | Panic, then idle |
| `sleep` | Sleep until another state or activity changes it |
| `wake` | Return to idle |

Happy and panic reactions last four seconds by default. The duration can be changed in the config file.

## CLI

Install the local `pet` command with `npm link`, or call the CLI file directly with Node:

```sh
npm link
pet send test_pass
pet run -- npm test
pet run -- npm run build
pet install-hooks
```

`pet send <type>` sends one event. `pet run -- <cmd> [args...]` runs a command with inherited terminal input/output, sends `test_pass` for exit code 0 or `test_fail` for a nonzero exit code, and returns the command's exit code. `pet install-hooks` adds a post-commit hook that sends `commit` without disrupting the commit if Code Pet is unavailable. All CLI commands continue to work when Code Pet is not running; in that case event delivery is silently skipped.

Without `npm link`, replace `pet` in the examples with `node src/cli/pet.js`, for example:

```sh
node src/cli/pet.js send commit
node src/cli/pet.js run -- npm test
node src/cli/pet.js install-hooks
```

The hook runs `node src/cli/pet.js` from the repository root. Keep that repository available at commit time, or adjust the hook if you move the project.

## Custom pets

Put each pet in its own folder, such as `mochi/`, with an `idle` sprite and optionally the other states:

```text
mochi/
  idle.svg       # or idle.png; required
  happy.svg      # or happy.png
  panic.svg      # or panic.png
  sleep.svg      # or sleep.png
```

Use square, transparent sprites. A consistent **256 × 256 px** canvas is recommended; PNGs are scaled to the same on-screen size as SVGs. Include at least `idle.png` or `idle.svg` for the pet to appear. If both formats exist for a state, PNG is loaded first and SVG is used as a fallback.

Built-in pets are bundled from `assets/pets/`. Add your own pet folder under the user data directory:

| OS | User pets directory |
| --- | --- |
| Windows | `%APPDATA%\code-pet\pets\<pet-name>\` |
| macOS | `~/Library/Application Support/code-pet/pets/<pet-name>/` |
| Linux | `$XDG_CONFIG_HOME/code-pet/pets/<pet-name>/` or `~/.config/code-pet/pets/<pet-name>/` |

Restart Code Pet after adding a folder, then choose it from the tray icon's **Choose Pet** menu.

## Configuration

Settings live in `config.json` in the same user data directory shown above. The app creates the file with defaults on first launch; restart Code Pet after editing it.

| Key | Default | Description |
| --- | --- | --- |
| `idleThresholdSeconds` | `300` | Seconds without input before sleep |
| `port` | `4747` | Local HTTP event server port (`1`–`65535`) |
| `petName` | `Ghost` | Display name shown with the pet |
| `reactionDurationMs` | `4000` | Duration of happy and panic reactions |
| `selectedPet` | `Built-in:ghost` | Selected pet; normally managed by the tray menu |
| `position` | `null` | Saved window coordinates; managed when the pet is moved |

For a one-off CLI port override, set `CODE_PET_EVENT_PORT`. For a one-off idle threshold override, set `CODE_PET_IDLE_THRESHOLD_SECONDS` before launching Code Pet.

## Troubleshooting

- **The pet window does not appear:** Run `npm start` from the project directory and check the terminal for startup errors. The window is frameless and transparent, so look near the bottom-right of the display.
- **Events do nothing:** Keep Code Pet running, confirm the configured port, and send to `127.0.0.1`. Use `npm run fire-event -- test_pass` to try one event.
- **The CLI appears to do nothing:** That is expected when the pet is not running; CLI event delivery is optional and silent. Start Code Pet to see reactions.
- **A custom pet is missing:** Check that its folder is directly inside the user `pets` directory, it contains an `idle.svg` or `idle.png`, and you restarted the app before checking the tray menu.
- **Click-through or dragging behaves differently:** Linux skips Electron's click-through mode; the window can behave differently there. On other platforms, drag from the pet itself.
- **You need an installer:** Follow [BUILDING.md](BUILDING.md). Build on the matching operating system; build commands create local files under `dist/` and do not publish them.

## Development

```sh
npm test
npm run build
```

The state, event server, CLI, sleep watcher, and configuration logic are testable with Node's built-in test runner without launching Electron.
