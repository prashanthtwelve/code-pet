const test = require('node:test');
const assert = require('node:assert/strict');
const { createSleepWatcher } = require('../src/main/sleep-watcher');
const { createStateMachine } = require('../src/main/state');

test('15 second idle threshold sleeps on polling; activity wakes for two seconds, then idles', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  let idleSeconds = 0;
  const changes = [];
  const machine = createStateMachine({ onChange: (state) => changes.push(state) });
  const watcher = createSleepWatcher({
    getIdleTime: () => idleSeconds,
    thresholdSeconds: 15,
    onSleep: () => machine.setState('sleep'),
    onWake: () => machine.setState('waking', { temporary: true, duration: 2000 }),
  });

  watcher.start();
  idleSeconds = 14;
  t.mock.timers.tick(10_000);
  assert.equal(machine.getState(), 'idle');

  idleSeconds = 15;
  t.mock.timers.tick(10_000);
  assert.equal(machine.getState(), 'sleep');
  assert.equal(watcher.isAsleep(), true);

  idleSeconds = 0;
  t.mock.timers.tick(10_000);
  assert.equal(machine.getState(), 'waking');
  assert.equal(watcher.isAsleep(), false);
  t.mock.timers.tick(1999);
  assert.equal(machine.getState(), 'waking');
  t.mock.timers.tick(1);
  assert.equal(machine.getState(), 'idle');
  assert.deepEqual(changes, ['sleep', 'waking', 'idle']);

  watcher.stop();
  machine.dispose();
});

test('watcher checks idle time immediately and can be stopped', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let idleSeconds = 300;
  let sleeps = 0;
  const watcher = createSleepWatcher({
    getIdleTime: () => idleSeconds,
    onSleep: () => sleeps++,
  });

  watcher.start();
  assert.equal(sleeps, 1);
  idleSeconds = 0;
  watcher.stop();
  t.mock.timers.tick(10_000);
  assert.equal(sleeps, 1);
});
