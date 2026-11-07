# Contributing

Thanks for helping improve Code Pet. Keep changes focused, describe what a user will notice, and preserve the ability to test core behavior without launching Electron.

## Before opening a change

```sh
npm install
npm test
npm run build
```

For UI changes, also run `npm start` locally and describe what you checked by eye. Do not commit generated packages from `dist/`.

## Good first issues

- Add another built-in pet theme with `idle`, `happy`, `panic`, and `sleep` sprites.
- Improve event examples or add a small integration test for an event type.
- Add tests for CLI behavior on another shell or platform.
- Improve tray menu labels, keyboard accessibility, or the README troubleshooting steps.
- Add a small optional reaction animation that can be tested independently of Electron.
- Improve packaging notes or verify a build target on its matching operating system.

## Contribution notes

- Use Node's built-in `node:test` for logic that can be tested without starting Electron.
- Keep event delivery local to `127.0.0.1` and preserve the CLI's behavior when Code Pet is not running.
- Update the README when changing events, configuration, custom pet formats, or user-facing commands.
- Do not publish installers or upload artifacts as part of a code change.
