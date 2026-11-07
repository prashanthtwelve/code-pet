const test = require('node:test');
const assert = require('node:assert/strict');
const { DEMO_STEPS, runDemo } = require('../scripts/demo');

test('demo sends the recording sequence with pauses and leaves the pet asleep', async () => {
  const sent = [];
  const waits = [];
  const logs = [];
  await runDemo({
    send: async (type) => {
      sent.push(type);
      return { ok: true };
    },
    wait: async (milliseconds) => waits.push(milliseconds),
    log: (message) => logs.push(message),
  });

  assert.deepEqual(sent, ['commit', 'test_fail', 'test_pass', 'sleep']);
  assert.deepEqual(waits, DEMO_STEPS.map(({ pauseMs }) => pauseMs));
  assert.match(logs.at(-1), /pet is asleep/);
});

test('demo stops with a useful message if Code Pet is not running', async () => {
  await assert.rejects(
    runDemo({ send: async () => undefined, wait: async () => {} }),
    /Start it with `npm start`/,
  );
});
