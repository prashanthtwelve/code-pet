function createSleepWatcher({
  getIdleTime,
  thresholdSeconds = 300,
  pollIntervalMs = 10_000,
  onSleep = () => {},
  onWake = () => {},
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
} = {}) {
  if (typeof getIdleTime !== 'function') {
    throw new TypeError('getIdleTime must be a function');
  }

  let asleep = false;
  let pollTimer;

  function check() {
    const idleSeconds = getIdleTime();
    if (idleSeconds >= thresholdSeconds && !asleep) {
      asleep = true;
      onSleep();
    } else if (idleSeconds < thresholdSeconds && asleep) {
      asleep = false;
      onWake();
    }
  }

  return {
    check,
    start() {
      if (pollTimer) return;
      check();
      pollTimer = setIntervalFn(check, pollIntervalMs);
    },
    stop() {
      if (pollTimer) clearIntervalFn(pollTimer);
      pollTimer = undefined;
    },
    isAsleep: () => asleep,
  };
}

module.exports = { createSleepWatcher };
