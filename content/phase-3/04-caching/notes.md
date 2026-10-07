# Caching

- **Layers:** browser → CDN → app cache (for example Redis) → the database's own memory.
- **Cache-aside:** read the cache; on a miss, read the database and write the cache.
- **Hit rate** depends on the working set: often 20% of items get 80% of reads.
- **TTL:** long means more hits and more staleness; short means fresher and more misses; none is a bug.
- Don't cache values that must be exact right now (the last seat, a balance right after paying).
- Part 2 covers invalidation, write-through, stampedes and hot keys.
