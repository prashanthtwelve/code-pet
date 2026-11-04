const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { installPostCommitHook, hookBlock } = require('../src/cli/pet');

const cliPath = path.resolve(__dirname, '../src/cli/pet.js');

test('pet run preserves the command exit code when no pet server is running', () => {
  const result = spawnSync(process.execPath, [
    cliPath,
    'run', '--',
    'node',
    '-e', 'process.exit(23)',
  ], {
    encoding: 'utf8',
    timeout: 5000,
    env: { ...process.env, CODE_PET_EVENT_PORT: '1' },
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 23);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('pet send succeeds silently when no pet server is running', () => {
  const result = spawnSync(process.execPath, [cliPath, 'send', 'commit'], {
    encoding: 'utf8',
    timeout: 5000,
    env: { ...process.env, CODE_PET_EVENT_PORT: '1' },
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('hook installation preserves existing content and is idempotent', (t) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'code-pet-hook-'));
  t.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));
  const hookPath = path.join(temporaryDirectory, 'post-commit');
  const original = '#!/bin/sh\necho existing-hook\n';
  fs.writeFileSync(hookPath, original);

  installPostCommitHook(hookPath);
  installPostCommitHook(hookPath);

  const installed = fs.readFileSync(hookPath, 'utf8');
  assert.ok(installed.startsWith(original));
  assert.equal(installed.split(hookBlock()).length - 1, 1);
});
