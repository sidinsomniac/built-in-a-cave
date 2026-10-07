# TCP and UDP: handshakes

Packets can get lost or arrive out of order (lesson 2). Something has to decide what to do
about that. There are two common choices, and they make opposite trade-offs.

## TCP: reliable and in order

**TCP** gives programs a reliable, ordered stream of data:
- every packet is numbered, so the receiver can put them back in order;
- the receiver says what it got, so the sender can **resend** anything lost.

Most web traffic, email and file downloads use TCP: a web page with a missing chunk is useless.

Before any data flows, the two sides agree to talk. That's the **three-way handshake**:

```diagram
title: Opening a TCP connection
steps:
  - The phone sends SYN - "I'd like to talk."
  - The server replies SYN-ACK - "Got it. I'd like to talk too."
  - The phone sends ACK - "Great. We're connected."
  - Only now can the phone send its request.
```

```checkpoint
q: Why can't the phone send its request together with its very first SYN message?
options: ["TCP needs both sides to agree first, so the connection is set up before data flows", "The server is asleep", "Packets can't carry data"]
answer: 0
why: The handshake sets up the numbering both sides will use to keep data in order and spot losses.
covers: [the three-way handshake, TCP]
```

## Round trips: the cost of a conversation

A **round trip** is a message there and a reply back. Its time depends mostly on **distance**:
light in fibre needs time to cross the planet.

| Between | Round trip, roughly |
|---|---|
| Two machines in one data centre | under 1 ms |
| London and New York | 75 ms |
| London and Sydney | 280 ms |

The handshake costs **one round trip** before your request can even leave. That's why
reusing an open connection (instead of opening a new one per request) matters so much.

```scene
- who: tony
  line: So each new connection costs a full round trip before anything useful happens?
- who: jarvis
  line: Before a single byte of the app, sir. And we haven't even started the encryption.
```

## UDP: fast, with no promises

**UDP** just sends packets. No handshake, no numbering, no resending.
That sounds worse - until late data is useless anyway:

- a **video call**: a lost frame from half a second ago isn't worth waiting for; show the next one;
- an **online game**: only the player's *latest* position matters;
- a **DNS lookup**: one tiny question and answer; if it's lost, just ask again.

```checkpoint
q: In a video call, a packet carrying 20 ms of sound is lost. What's better?
options: ["Pause the call until it's resent", "Skip it and play the next sound"]
answer: 1
why: By the time it was resent, the moment has passed. A tiny glitch beats a frozen call - that's why calls use UDP.
covers: [UDP, reliability and ordering]
```

## Recap
- **TCP:** reliable and ordered; resends losses; opens with a **three-way handshake** (one round trip).
- **UDP:** no handshake, no guarantees, very low delay - for when late data is worthless.
- **Round trips** cost time set by distance. Fewer round trips = faster first load; reuse connections.
