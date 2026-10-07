# Load balancers

Once a service has several copies, something must decide **which copy answers each request**.
That's the **load balancer**: the front door that spreads requests across the copies.

It lets you add copies when traffic grows, take one out for an update, and survive one dying -
without visitors noticing.

## How does it choose?

| Method | How it works | Good when |
|---|---|---|
| **Round robin** | each copy in turn: A, B, C, A, B, C... | requests are all about the same size |
| **Least connections** | the copy with the fewest requests in progress | some requests take much longer than others |
| **Hashing** | the same user (or key) always goes to the same copy | a copy keeps something per user, like an open connection |

```checkpoint
q: Copies A, B and C have 12, 3 and 7 requests in progress. Using least connections, where does the next request go?
options: ["A", "B", "C"]
answer: 1
why: B has the fewest requests in progress, so it's the least busy right now.
covers: [least connections]
```

## Stateless copies

Load balancing works best when **any copy can answer any request**. If a copy keeps a user's
shopping cart in its own memory, the user's next request may land on a different copy - and
the cart is gone. So services keep that state in a shared store (a database or cache), and
the copies stay **stateless**.

## Health checks: noticing the dead

Every few seconds, the load balancer sends each copy a tiny **health check** request. A copy
that stops answering is taken out of rotation until it recovers.

```scene
- who: peter
  line: How does the balancer know a copy is dead?
- who: jarvis
  line: It asks, Mr Parker. Every few seconds. Unless someone told it not to.
```

Without health checks, the balancer keeps sending a dead copy its full share. With five copies
and one dead, **one request in five fails**.

```checkpoint
q: Four copies, round robin, no health checks. One copy dies. What share of requests fail?
options: ["None", "About a quarter", "All of them"]
answer: 1
why: The dead copy still gets one request in four, and every one of those fails.
covers: [health checks, round robin]
```

## Layer 4 or layer 7?

- A **layer 4 load balancer** only sees connections - addresses and ports. It can't read the
  request, so it can't route by path. It's very fast and simple.
- A **layer 7 load balancer** reads each HTTP request. It can send `/api` to one service and
  `/live` to another, end TLS (lesson 5 of Phase 1), and understand WebSocket upgrades.

Most web apps use layer 7 at the front door. Layer 4 shines for raw speed, or for traffic
that isn't HTTP at all.

## Recap
- A **load balancer** spreads requests across copies; keep copies **stateless**.
- **Round robin** for even requests; **least connections** for uneven ones; **hashing** to keep
  a user on one copy.
- **Health checks** take dead copies out. Without them, a dead copy fails its share of everything.
- **Layer 7** can route by path and end TLS; **layer 4** is faster but sees only connections.
