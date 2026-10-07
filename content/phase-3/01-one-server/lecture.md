# One server, and its limits

Every system design starts with one question: **how much can one machine take?**

## Capacity and utilisation

A server's **capacity** is how many requests a second it can finish. On the design table, one
copy of a service handles about **1,000 requests a second**.

**Utilisation** is how much of that capacity is being used:

> utilisation = requests arriving per second ÷ capacity

800 requests a second on a 1,000-capacity server is **80% busy**. 1,200 is **120%** - more
work arrives than can be done, and the excess fails or waits forever.

```checkpoint
q: A copy handles 1,000 requests a second. 600 arrive each second. How busy is it?
options: ["6%", "60%", "600%"]
answer: 1
why: 600 ÷ 1,000 = 0.6 - sixty percent busy.
covers: [utilisation, capacity]
```

## Why "nearly full" is already slow

You might expect a server at 90% to be just a little slower than one at 50%. It isn't.
Requests arrive unevenly - a few at once, then a gap - and when the server is busy, new
ones **queue**. The busier it is, the longer the queue, and the queue grows **much** faster
than the load.

Think of a supermarket checkout. At half capacity, you rarely wait. At 95%, one small burst
of shoppers creates a queue that takes ages to clear.

On the design table, a request's worst-case wait grows like this:

| How busy | Worst-case time, compared with an idle server |
|---|---|
| 50% | about 4.5× |
| 80% | about 13× |
| 90% | about 28× |
| 95% | about 58× |

```scene
- who: killian
  line: Run it at 100%. You're paying for the whole machine.
- who: jarvis
  line: At 100%, the queue never empties, Mr Killian. Every request waits behind every other one.
```

So engineers keep **headroom**: they plan for servers to run at about **70-80%** at the
busiest moment, never near 100%.

## Plan for the peak, not the average

Traffic isn't flat. Evenings, launches and viral moments bring **peaks** - often 2-3× the
average. A system sized for the average falls over at the peak.

The sizing recipe:

1. Find the **peak** requests per second (average × peak factor).
2. Divide by what one copy can safely do (capacity × your headroom target, for example 80%).
3. Round **up** - and add **one spare**, so losing a copy at the worst moment doesn't hurt.

```checkpoint
q: The average is 2,000 requests a second and the evening peak is 3× that. Each copy safely does 800. How many copies, before the spare?
options: ["3", "7", "8"]
answer: 2
why: Peak = 6,000. 6,000 ÷ 800 = 7.5, rounded up to 8 - then add a spare for 9.
covers: [peak traffic, headroom]
```

## A useful shortcut: how many at once?

If 1,000 requests arrive each second and each takes 50 ms (0.05 s), then at any moment about
1,000 × 0.05 = **50 requests are in progress**. (This is **Little's law**: in progress = arrival
rate × time each one takes.) If a server can only hold 20 at once, it's already in trouble.

## Recap
- **Capacity:** what one copy can finish per second. **Utilisation:** arriving ÷ capacity.
- Latency doesn't grow evenly - it **explodes** as utilisation nears 100%.
- Keep **headroom**: aim for 70-80% busy at the peak.
- Size for the **peak**, round up, and add **one spare**.
