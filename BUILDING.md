# Building Code Pet

Install dependencies once with `npm install`, then build on the operating system you want to package:

```sh
npm run build:win
npm run build:mac
npm run build:linux
```

The commands create an NSIS installer for Windows, a DMG for macOS, or an AppImage for Linux. Build on the matching host OS; electron-builder does not reliably produce every platform's package from one host. Artifacts are written to `dist/`. On this Windows x64 machine, the expected installer is `dist/Code Pet-1.0.0-win-x64.exe`; the unpacked application is in `dist/win-unpacked/`.

The application icon is the placeholder `build/icon.svg`. Replace it with final artwork when available.

The `assets/pets` directory is included in the app bundle. User-installed pets are kept outside the install directory so updates do not overwrite them:

- Windows: `%APPDATA%\code-pet\pets\<pet-name>\`
- macOS: `~/Library/Application Support/code-pet/pets/<pet-name>/`
- Linux: `$XDG_CONFIG_HOME/code-pet/pets/<pet-name>/` or `~/.config/code-pet/pets/<pet-name>/`

Each pet folder should contain at least `idle.svg` or `idle.png`; for best results, provide `idle`, `happy`, `panic`, and `sleep` sprites. If both PNG and SVG versions exist, the renderer loads PNG first and falls back to SVG.

Runtime settings are stored in `config.json` in the same user data directory. Edit `idleThresholdSeconds`, `port`, `petName`, or `reactionDurationMs` there, then restart Code Pet. No build command publishes or uploads artifacts.
