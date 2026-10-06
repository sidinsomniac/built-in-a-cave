# Debounce and throttle

- **Debounce**: run once after calls stop for `wait` ms; each call restarts the wait; the last call's arguments win.
- **Throttle**: at most once per `wait` ms; leading call runs immediately; the latest call during the window runs when it ends (trailing).
- Keep `this` and arguments: return a `function`, call `fn.apply(this, args)`.
- Each wrapper owns its own timer.
- Test with fake timers: `const clock = useFakeTimers(); clock.tick(100)`.
