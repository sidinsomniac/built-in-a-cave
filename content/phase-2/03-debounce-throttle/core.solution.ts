export function throttle<T extends unknown[]>(fn: (...args: T) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let waiting: { self: unknown; args: T } | null = null;
  const openWindow = () => {
    timer = setTimeout(() => {
      if (waiting) {
        const { self, args } = waiting;
        waiting = null;
        fn.apply(self, args);
        openWindow();
      } else {
        timer = null;
      }
    }, wait);
  };
  return function (this: unknown, ...args: T) {
    if (timer === null) {
      fn.apply(this, args);
      openWindow();
    } else {
      waiting = { self: this, args };
    }
  };
}
