# DNS: names into numbers

Computers find each other by **IP address**, numbers like `203.0.113.7`. People
remember **names**, like `expo.stark.com`. The **Domain Name System** (DNS) is
the internet's phone book that turns one into the other.

## Who answers a DNS question?

Your browser doesn't know every name. It asks a chain of servers, each knowing
a little more:

```diagram
title: Resolving expo.stark.com (nothing cached yet)
steps:
  - Browser checks its own cache. Nothing.
  - The operating system checks its cache. Nothing.
  - The question goes to a recursive resolver (your ISP, or 1.1.1.1).
  - The resolver asks a root server - "who handles .com?"
  - The root points to the .com TLD servers.
  - The resolver asks .com - "who handles stark.com?"
  - .com points to stark.com's authoritative name servers.
  - The authoritative server answers - "expo.stark.com is 203.0.113.7, keep it for 300 seconds."
  - The resolver caches the answer and returns it. The browser connects.
```

- **Recursive resolver**: does the legwork on your behalf, and **caches** answers.
- **Root, TLD and authoritative servers**: each knows only its own part of the name.
- **Authoritative server**: the only one that knows the real answer for a domain.
  If someone changes the record *there*, everyone eventually gets the new answer.

```checkpoint
q: Which server holds the actual record for expo.stark.com?
options: ["The root server", "The .com TLD server", "stark.com's authoritative server", "Your browser"]
answer: 2
why: Root and TLD servers only point the way. The authoritative server for stark.com holds its records.
covers: [authoritative servers]
```

```checkpoint
q: Why does DNS exist at all?
options: ["Computers find each other by number, but people remember names", "To make websites load faster", "To encrypt traffic"]
answer: 0
why: Machines route by IP address; DNS turns the names people type into those addresses.
covers: [domain names, IP addresses]
```

## TTL: how long an answer is trusted

Every answer comes with a **TTL** (time to live) in seconds. Until it runs out,
resolvers and browsers reuse the cached answer without asking again.

| TTL | Good for | Risk |
|---|---|---|
| Long (hours) | fewer lookups, faster pages, less load | a change takes hours to reach everyone |
| Short (seconds) | fast changes and failovers | many more lookups, and a bad record spreads *instantly* |

```checkpoint
q: A record has a TTL of 300 seconds. A resolver cached it 2 minutes ago. Does the resolver ask again?
options: ["Yes, every request asks the authoritative server", "No - it still has 3 minutes of trust left", "Only if the browser restarts"]
answer: 1
why: The cached answer stays valid until its TTL runs out - 300 seconds after it was fetched.
covers: [TTL, caching]
```

```scene
- who: tony
  line: So a bad record with a TTL of almost zero...
- who: jarvis
  line: ...reaches every resolver on Earth within seconds, sir. Keep that number in mind.
```

## Why this matters in system design

- **Load**: a busy service with a tiny TTL makes every resolver ask constantly.
- **Failover**: DNS-based failover is only as fast as the TTL lets it be.
- **Blast radius**: a bad record with a near-zero TTL reaches everyone within seconds.
