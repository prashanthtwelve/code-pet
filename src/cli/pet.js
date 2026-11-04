#!/usr/bin/env node

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const HOOK_START = '# >>> code-pet post-commit >>>';
const HOOK_END = '# <<< code-pet post-commit <<<';

async function sendEvent(type) {
  const configuredPort = Number(process.env.CODE_PET_EVENT_PORT);
  const port = Number.isInteger(configuredPort) && configuredPort >= 1 && configuredPort <= 65535
    ? configuredPort
    : 4747;
  try {
    await fetch(`http://127.0.0.1:${port}/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type }),
      signal: AbortSignal.timeout(500),
    });
  } catch {
    // The pet is optional: event delivery must not affect CLI commands.
  }
}

function hookBlock() {
  return `${HOOK_START}\nnode src/cli/pet.js send commit >/dev/null 2>&1 || true\n${HOOK_END}`;
}

function installPostCommitHook(hookPath) {
  fs.mkdirSync(path.dirname(hookPath), { recursive: true });
  const existing = fs.existsSync(hookPath) ? fs.readFileSync(hookPath, 'utf8') : '#!/bin/sh\n';
  const block = hookBlock();
  const markerStart = existing.indexOf(HOOK_START);
  let updated;

  if (markerStart >= 0) {
    const markerEnd = existing.indexOf(HOOK_END, markerStart);
    if (markerEnd >= 0) {
      updated = `${existing.slice(0, markerStart)}${block}${existing.slice(markerEnd + HOOK_END.length)}`;
    } else {
      updated = `${existing}${existing.endsWith('\n') ? '' : '\n'}${block}\n`;
    }
  } else {
    updated = `${existing}${existing.endsWith('\n') ? '' : '\n'}${block}\n`;
  }

  fs.writeFileSync(hookPath, updated, { mode: 0o755 });
  try {
    fs.chmodSync(hookPath, 0o755);
  } catch {
    // Windows does not use POSIX executable bits for local hooks.
  }
}

function findPostCommitHook() {
  const hookPath = execFileSync('git', ['rev-parse', '--git-path', 'hooks/post-commit'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();
  return path.resolve(process.cwd(), hookPath);
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const commandName = path.basename(command).toLowerCase();
    const windowsCommandShim = process.platform === 'win32'
      && (/\.(cmd|bat)$/i.test(command) || ['npm', 'npx', 'yarn', 'pnpm'].includes(commandName));
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: windowsCommandShim,
    });
    let spawnFailed = false;
    child.on('error', () => {
      spawnFailed = true;
    });
    child.on('close', async (code) => {
      const exitCode = spawnFailed ? (code ?? 127) : (code ?? 1);
      await sendEvent(exitCode === 0 ? 'test_pass' : 'test_fail');
      resolve(exitCode);
    });
  });
}

async function main(args) {
  const [command, ...rest] = args;
  if (command === 'send' && rest.length === 1) {
    await sendEvent(rest[0]);
    return 0;
  }
  if (command === 'run' && rest[0] === '--' && rest[1]) {
    return runCommand(rest[1], rest.slice(2));
  }
  if (command === 'install-hooks' && rest.length === 0) {
    installPostCommitHook(findPostCommitHook());
    return 0;
  }

  console.error('Usage: pet send <type> | pet run -- <cmd> [args...] | pet install-hooks');
  return 2;
}

if (require.main === module) {
  main(process.argv.slice(2))
    .then((exitCode) => { process.exitCode = exitCode; })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = { main, runCommand, sendEvent, installPostCommitHook, hookBlock };
