(function exposeMicroAnimation(root) {
  function createMicroAnimationScheduler({
    onAnimation,
    isEnabled = () => true,
    random = Math.random,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
  }) {
    let timer;
    let running = false;

    function scheduleNext() {
      const delay = 20_000 + Math.floor(random() * 20_001);
      timer = setTimeoutFn(() => {
        timer = undefined;
        if (isEnabled()) onAnimation(random() < 0.5 ? 'blink' : 'hop');
        if (running) scheduleNext();
      }, delay);
    }

    return {
      start() {
        if (running) return;
        running = true;
        scheduleNext();
      },
      stop() {
        running = false;
        if (timer) clearTimeoutFn(timer);
        timer = undefined;
      },
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createMicroAnimationScheduler };
  }
  root.petMicroAnimation = { createMicroAnimationScheduler };
})(typeof window === 'undefined' ? globalThis : window);
