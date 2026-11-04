const STATES = Object.freeze(['idle', 'happy', 'panic', 'sleep']);
const EVENT_STATES = Object.freeze({
  test_pass: 'happy',
  build_ok: 'happy',
  commit: 'happy',
  test_fail: 'panic',
  sleep: 'sleep',
  wake: 'idle',
});

function createStateMachine({ duration = 4000, onChange = () => {} } = {}) {
  let state = 'idle';
  let timer;

  function clearReactionTimer() {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }

  function setState(nextState, { temporary = nextState === 'happy' || nextState === 'panic' } = {}) {
    if (!STATES.includes(nextState)) return false;

    clearReactionTimer();
    if (state !== nextState) {
      state = nextState;
      onChange(state);
    }

    if (temporary) {
      timer = setTimeout(() => {
        timer = undefined;
        if (state !== 'idle') {
          state = 'idle';
          onChange(state);
        }
      }, duration);
    }
    return true;
  }

  return {
    getState: () => state,
    setState,
    dispatch(type) {
      const nextState = EVENT_STATES[type];
      return nextState ? setState(nextState) : false;
    },
    dispose: clearReactionTimer,
  };
}

module.exports = { STATES, EVENT_STATES, createStateMachine };
