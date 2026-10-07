export function createSearch(show: (results: string[]) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest = 0;
  return (query: string) => {
    clearTimeout(timer);
    const q = query.trim();
    if (!q) {
      latest++;
      show([]);
      return;
    }
    timer = setTimeout(async () => {
      const id = ++latest;
      const res = await fetch(`/search?q=${encodeURIComponent(q)}`);
      const body = (await res.json()) as { results: string[] };
      if (id === latest) show(body.results);
    }, 200);
  };
}
