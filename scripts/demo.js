const { sendEvent } = require('../src/cli/pet');

const DEMO_STEPS = Object.freeze([
  { type: 'commit', pauseMs: 2200 },
  { type: 'test_fail', pauseMs: 2200 },
  // Let the default four-second reaction return to idle before showing sleep.
  { type: 'test_pass', pauseMs: 5000 },
  // Trigger sleep explicitly so the demo is short and predictable while recording.
  { type: 'sleep', pauseMs: 6000 },
]);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runDemo({ send = sendEvent, wait = delay, log = console.log } = {}) {
  for (const { type, pauseMs } of DEMO_STEPS) {
    const response = await send(type);
    if (!response) {
      throw new Error('Code Pet is not responding. Start it with `npm start`, then run `npm run demo`.');
    }
    if (!response.ok) {
      throw new Error(`Code Pet rejected the ${type} demo event (HTTP ${response.status}).`);
    }
    log(`Sent ${type}; pausing ${pauseMs / 1000}s for recording.`);
    await wait(pauseMs);
  }
  log('Demo complete. The pet is asleep; send `wake` or wait for activity to wake it.');
}

if (require.main === module) {
  runDemo().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { DEMO_STEPS, runDemo };
