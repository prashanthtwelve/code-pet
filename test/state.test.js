const test = require('node:test');
const assert = require('node:assert/strict');
const { createStateMachine, STATES } = require('../src/main/state');

test('declares all supported states and starts idle', () => {
  const machine = createStateMachine();
  assert.deepEqual(STATES, ['idle', 'happy', 'panic', 'sleep', 'waking']);
  assert.equal(machine.getState(), 'idle');
  machine.dispose();
});

test('successful events show happy, then return to idle after four seconds', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const changes = [];
  const machine = createStateMachine({ onChange: (state) => changes.push(state) });

  assert.equal(machine.dispatch('test_pass'), true);
  assert.equal(machine.getState(), 'happy');
  t.mock.timers.tick(3999);
  assert.equal(machine.getState(), 'happy');
  t.mock.timers.tick(1);
  assert.equal(machine.getState(), 'idle');
  assert.deepEqual(changes, ['happy', 'idle']);
  machine.dispose();
});

test('reaction duration can be configured', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const machine = createStateMachine({ duration: 800 });
  machine.dispatch('test_pass');
  t.mock.timers.tick(799);
  assert.equal(machine.getState(), 'happy');
  t.mock.timers.tick(1);
  assert.equal(machine.getState(), 'idle');
  machine.dispose();
});

test('build_ok and commit map to happy', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const machine = createStateMachine();
  assert.equal(machine.dispatch('build_ok'), true);
  assert.equal(machine.getState(), 'happy');
  assert.equal(machine.dispatch('commit'), true);
  assert.equal(machine.getState(), 'happy');
  machine.dispose();
});

test('test_fail shows panic, and a later event restarts the four second reaction', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const machine = createStateMachine();

  machine.dispatch('test_fail');
  assert.equal(machine.getState(), 'panic');
  t.mock.timers.tick(3000);
  machine.dispatch('commit');
  t.mock.timers.tick(3999);
  assert.equal(machine.getState(), 'happy');
  t.mock.timers.tick(1);
  assert.equal(machine.getState(), 'idle');
  machine.dispose();
});

test('sleep and wake events select their states; unknown states and events are rejected', () => {
  const machine = createStateMachine();
  assert.equal(machine.dispatch('sleep'), true);
  assert.equal(machine.getState(), 'sleep');
  assert.equal(machine.dispatch('wake'), true);
  assert.equal(machine.getState(), 'idle');
  assert.equal(machine.setState('unknown'), false);
  assert.equal(machine.dispatch('unknown'), false);
  machine.dispose();
});
