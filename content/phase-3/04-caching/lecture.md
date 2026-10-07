# Caching

Most systems read the same data again and again: the same popular links, the same product
pages, the same sensor readings. A **cache** keeps a copy of that data somewhere much faster
than the database, so most reads never travel that far.

## Where caches live

Caches appear at every layer, from closest to the user to closest to the data:

| Where | Example | Saves |
|---|---|---|
| The browser | an image kept on your phone | a trip across the internet |
| A CDN | a copy of a video near your city | a trip across the ocean |
| An app cache | a Redis server next to your services | a trip to the database |
| The database's own memory | recently used rows kept in RAM | a trip to the disk |

This lesson is about the **app cache**: a fast in-memory store your services ask first.

## Cache-aside: check the cache first

```diagram
title: Cache-aside, for one read
steps:
  - The service needs sensor 42's reading. It asks the cache first.
  - Hit - the cache has it. The service answers in well under a millisecond. Done.
  - Miss - the cache doesn't have it. The service reads it from the database instead.
  - The service puts the answer in the cache, so the next read for sensor 42 is a hit.
```

The cache is never the source of truth: the database still holds everything. The cache only
holds **copies**.

```checkpoint
q: The cache is wiped by a restart. Is any data lost for good?
options: ["Yes - everything in the cache is gone", "No - the database still has it all; the cache just refills from misses"]
answer: 1
why: A cache holds copies. Losing them costs speed for a while, not data.
covers: [cache-aside]
```

## Hit rate and the working set

The **hit rate** is the share of reads the cache answers itself. The rest are **misses**,
which still reach the database.

You don't need to cache everything. In most systems, a small slice of the data gets most of
the reads - often **20% of the items get 80% of the reads**. The data people actually read
in a period is the **working set**. A cache big enough to hold the working set gets a high
hit rate.

On the design table, hit rate ≈ cache memory ÷ working set (up to about 97%).

```scene
- who: happy
  line: So the cache is like keeping snacks at my desk instead of walking to the kitchen?
- who: jarvis
  line: Precisely, Happy. Until the snacks go stale.
```

## TTL: how long a copy is trusted

Cached copies can go **stale**: the database changes, but the cache still has the old value.
A **TTL** (time to live) says how many seconds a copy may be used before it's fetched fresh.

| Data | Changes | Sensible TTL |
|---|---|---|
| A list of countries | almost never | hours or a day |
| A popular short link's target | rarely | hours or a day |
| A "trending now" list | every minute | seconds to a minute |
| The last seat in a sale, at the moment of buying | constantly, and must be exact | don't cache it |

Long TTL: more hits, but more stale reads. Short TTL: fresher, but more misses.
**No TTL at all** means a wrong value can be served forever.

```checkpoint
q: A product's price changes about once a week, and showing an old price for a minute is fine. Which TTL?
options: ["0 - never cache it", "About a minute", "Forever"]
answer: 1
why: A minute gives nearly every read a hit while keeping prices close to fresh. Forever would show old prices indefinitely.
covers: [TTL]
```

## Recap
- A **cache** keeps fast copies; the database stays the source of truth.
- **Cache-aside:** ask the cache; on a miss, read the database and fill the cache.
- **Hit rate** depends on holding the **working set**, not everything.
- **TTL** trades freshness for hits. Never cache "must be exact right now" data, and never cache without an expiry.
