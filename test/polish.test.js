const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DEFAULT_CONFIG, loadConfig, saveConfig } = require('../src/main/config');
const { scanPets } = require('../src/main/pet-catalog');
const { dragPosition, isPointOverPet, restorePosition } = require('../src/main/window-position');
const { getUserDataDirectory } = require('../src/main/user-data-path');
const { createGhostTrayPng } = require('../src/main/tray-icon');
const { createMicroAnimationScheduler } = require('../src/renderer/micro-animation');

test('configuration saves and reloads settings while invalid values fall back to defaults', (t) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'code-pet-config-'));
  t.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));
  const configPath = path.join(temporaryDirectory, 'nested', 'config.json');
  const saved = saveConfig(configPath, {
    idleThresholdSeconds: 15,
    port: 4900,
    petName: 'Mochi',
    selectedPet: 'User:mochi',
    reactionDurationMs: 800,
    position: { x: -50, y: 100 },
  });
  assert.deepEqual(loadConfig(configPath), saved);

  const invalidPath = path.join(temporaryDirectory, 'invalid.json');
  fs.writeFileSync(invalidPath, JSON.stringify({ idleThresholdSeconds: 0, port: 70000, reactionDurationMs: -1 }));
  assert.deepEqual(loadConfig(invalidPath), DEFAULT_CONFIG);
});

test('saved position restores within a work area and dragging tracks pointer delta', () => {
  const workArea = { x: -1920, y: 40, width: 1920, height: 1040 };
  assert.deepEqual(restorePosition(null, workArea), { x: -200, y: 880 });
  assert.deepEqual(restorePosition({ x: -3000, y: 2000 }, workArea), { x: -1920, y: 880 });
  assert.deepEqual(dragPosition({ position: { x: 300, y: 400 }, pointer: { x: 10, y: 20 } }, { x: 25, y: 16 }), {
    x: 315,
    y: 396,
  });
});

test('click-through hit testing only includes the centered pet area', () => {
  const bounds = { x: 100, y: 200, width: 200, height: 200 };
  assert.equal(isPointOverPet({ x: 200, y: 300 }, bounds), true);
  assert.equal(isPointOverPet({ x: 105, y: 205 }, bounds), false);
});

test('pet catalog discovers built-in and user pets from their idle PNG or SVG', (t) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'code-pet-catalog-'));
  t.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));
  const builtIn = path.join(temporaryDirectory, 'assets');
  const user = path.join(temporaryDirectory, 'user-pets');
  fs.mkdirSync(path.join(builtIn, 'ghost'), { recursive: true });
  fs.mkdirSync(path.join(user, 'mochi'), { recursive: true });
  fs.mkdirSync(path.join(user, 'incomplete'), { recursive: true });
  fs.writeFileSync(path.join(builtIn, 'ghost', 'idle.svg'), '<svg/>');
  fs.writeFileSync(path.join(user, 'mochi', 'idle.png'), 'png');
  fs.writeFileSync(path.join(user, 'incomplete', 'happy.svg'), '<svg/>');

  assert.deepEqual(scanPets([
    { directory: builtIn, source: 'Built-in' },
    { directory: user, source: 'User' },
  ]).map(({ key }) => key), ['Built-in:ghost', 'User:mochi']);
});

test('idle micro-animations recur at randomized 20 to 40 second intervals', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const values = [0, 0.9, 0.999, 0];
  const animations = [];
  const scheduler = createMicroAnimationScheduler({
    random: () => (values.length ? values.shift() : 0),
    onAnimation: (animation) => animations.push(animation),
  });

  scheduler.start();
  t.mock.timers.tick(19_999);
  assert.deepEqual(animations, []);
  t.mock.timers.tick(1);
  assert.deepEqual(animations, ['hop']);
  t.mock.timers.tick(39_999);
  assert.deepEqual(animations, ['hop', 'blink']);
  scheduler.stop();
});

test('user data directory honors an explicit override', () => {
  assert.equal(getUserDataDirectory({
    platform: 'linux',
    env: { CODE_PET_USER_DATA_DIR: path.join(os.tmpdir(), 'pet-data') },
    home: '/unused',
  }), path.join(os.tmpdir(), 'pet-data'));
});

test('tray icon generator returns a PNG image', () => {
  const png = createGhostTrayPng();
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});
