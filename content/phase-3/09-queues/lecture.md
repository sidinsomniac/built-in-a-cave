# Queues and workers

Some work doesn't need to happen while the user waits: sending an email, recording a click,
resizing a photo. Doing it **inside** the request makes the user wait for it - and if that work
is slow or broken, the whole request is too.

## Do it later: the queue

A **queue** is a waiting line for work. Instead of doing the slow work, the service drops a
small message on the queue - "send alert 42 to Rhodey" - and answers the user immediately.
**Workers** take messages off the queue and do the work in the background. This is
**asynchronous** work: done later, not while anyone waits.

```diagram
title: Sending an alert, the asynchronous way
steps:
  - A sensor runs hot. The panel's request reaches the grid service.
  - The service drops an "alert" message on the queue - this takes about a millisecond.
  - The service answers the panel straight away. The panel never waits for email.
  - A worker picks up the message and calls the email provider - slow, but nobody's waiting.
  - If the email provider is down, the message waits on the queue and is tried again later.
```

```checkpoint
q: The email provider goes down for ten minutes. With a queue, what happens to the control panels?
options: ["They freeze for ten minutes", "Nothing - they keep working; alerts wait on the queue and go out when it's back"]
answer: 1
why: The queue separates the panels from the email provider. A slow or broken provider only delays the alerts.
covers: [asynchronous work, queues and workers]
```

```scene
- who: rhodey
  line: So the panel used to wait on an email server in another country?
- who: jarvis
  line: It did, Colonel. Until now.
```

## The backlog, and how many workers

If messages arrive faster than workers handle them, the extra ones pile up: the **backlog**.

> backlog grows each second by: arriving − handled

On the design table, each worker handles about **2,000 messages a second**.

A queue is a **shock absorber**: during a short burst the backlog grows, and afterwards the
workers drain it. So there are two ways to size workers:
- **for the peak**, if every message must be handled at once (no backlog ever);
- **for the average**, if a backlog during bursts is fine, as long as it drains in time.

If the backlog grows **forever**, the workers can never catch up. Then you need more workers,
faster work, or **backpressure**: slowing down or refusing new work, rather than letting the
queue fill until it breaks.

```checkpoint
q: 5,000 messages arrive each second and 2 workers each handle 2,000. What happens to the backlog?
options: ["It stays at zero", "It grows by 1,000 messages every second", "It shrinks"]
answer: 1
why: 5,000 arrive, 4,000 are handled - 1,000 more wait every second, until you add a worker or the burst ends.
covers: [backlog, sizing workers]
```

## Queues and logs

There are two families of message systems:

| | A **queue** (like SQS) | A **log** (like Kafka) |
|---|---|---|
| A message is read by | one worker, then deleted | every interested reader, each at its own pace |
| Replay old messages? | no - once handled, it's gone | yes - messages are kept for days |
| Running it | very simple, often fully managed | more powerful, more to operate |

Use a queue for "do this job once". Use a log when several systems need the same events,
or you might need to replay them.

## Recap
- Move slow, non-essential work **off the request path**: service → queue → workers.
- **Backlog** grows by (arriving − handled) each second. Size workers for the peak, or for the
  average if the backlog drains in time.
- If the backlog grows forever: more workers, or **backpressure**.
- **Queue:** each message handled once. **Log:** many readers, kept for replay.
