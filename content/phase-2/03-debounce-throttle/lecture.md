# Debounce and throttle

Some events fire far more often than you need: typing, scrolling, resizing,
mouse moves. Two classic tools tame them.

## Debounce: wait for quiet

A **debounced** function only runs once the calls **stop** for a while. Every
new call **restarts** the wait. Only the **last** call's arguments are used.

```diagram
title: debounce(search, 300) while typing "lumos"
steps:
  - Typed "l" at 0 ms - a 300 ms wait starts
  - Typed "lu" at 80 ms - the wait restarts
  - Typed "lum" at 150 ms - restarts again
  - Typed "lumo" at 220 ms - restarts again
  - Typed "lumos" at 290 ms - restarts again
  - Silence. At 590 ms the wait finishes - search("lumos") runs once.
```

Use it for: search-as-you-type, auto-save, resize handlers.

## Throttle: a steady pace

A **throttled** function runs **at most once per interval**, however often it's
called. A good throttle runs the **first** call straight away (leading), and,
if more calls arrived during the interval, runs the **latest** one when the
interval ends (trailing), so the final state is never lost.

```diagram
title: throttle(update, 100), called constantly while scrolling
steps:
  - 0 ms - the first call runs immediately; a 100 ms window starts
  - 30 ms, 60 ms, 90 ms - calls arrive; only the newest is remembered
  - 100 ms - the window ends; the remembered call runs, and a new window starts
  - No more calls - when that window ends, nothing runs
```

Use it for: scroll position, drag tracking, rate-limited API calls.

```checkpoint
q: You want to save a draft 1 second after the user STOPS typing. Which tool?
options: ["Debounce", "Throttle"]
answer: 0
why: You want one call after the burst ends - that's debounce.
```

```checkpoint
q: You want a progress bar to update at most 10 times a second while a file uploads. Which tool?
options: ["Debounce", "Throttle"]
answer: 1
why: A steady maximum rate during continuous events is throttling. A debounce would never fire while the updates kept coming.
```

## Things interviewers check

- **`this` and arguments** are passed through: the wrapped function should behave
  like the original. Return a `function`, not an arrow function, so `this` survives,
  and call the original with `fn.apply(this, args)`.
- **Each wrapper has its own timer.** Two debounced functions must not share one.
- **Timers are testable.** Tests use **fake timers**: time only moves when the test
  calls `clock.tick(ms)`.

```ts
// A timer you can cancel, and how `this` travels:
const timer = setTimeout(() => console.log("later"), 100);
clearTimeout(timer); // never runs

const counter = {
  count: 0,
  bump: function () { this.count += 1; },
};
counter.bump(); // `this` is counter
```
