# Clients and servers

Every time you open an app or a website, two computers have a short conversation.

- The **client** is the one asking: your browser, or an app on your phone.
- The **server** is the one answering: a computer in a data centre, running a
  program that waits for questions all day long.

A server isn't magic, and it isn't a special kind of machine. It's an ordinary
computer (usually a powerful one, with no screen) that runs a program which
**listens** for messages and **replies** to them.

## Requests and responses

The client sends a **request**: a short message that says what it wants.
The server sends back a **response**: the answer, or an error.

```diagram
title: Opening the Expo schedule
steps:
  - You tap "Schedule" in the Expo app (the client).
  - The app sends a request to the Expo server - "send me today's schedule".
  - The server looks the schedule up in its database.
  - The server sends a response - the schedule, as data.
  - The app draws the schedule on your screen.
```

That's the whole pattern. A page load is a handful of these conversations, one after another.

```checkpoint
q: In the diagram, which computer decides what today's schedule is?
options: ["The phone", "The server (using its database)", "The Wi-Fi router"]
answer: 1
why: The phone only asks and displays. The server owns the data and decides the answer.
covers: [servers, requests and responses]
```

## Where does the data live?

A server program can be restarted at any time - for an update, or because the machine died.
Anything it only held in memory is gone. So servers keep important data in a **database**:
a program that stores data safely on disk and finds it again quickly.

So the usual chain is: **client → server → database**, and the answer flows back the same way.

```scene
- who: happy
  line: So the phone sends a request... and if nothing comes back?
- who: jarvis
  line: Then the request never left, never arrived, or was never answered. Tonight we find out which.
```

## Where should the work happen?

Some work is best done on the **client**: it's instant, and needs no trip across the internet.
Some work **must** happen on the **server**: anything involving secrets, money, or data the
client doesn't have.

| Work | Where | Why |
|---|---|---|
| Sorting the 20 tickets already on screen | client | the data is already there; no need to ask |
| Checking a password | server | a client can be tampered with, and must never hold everyone's passwords |
| Finding Saturday's tickets among 2 million | server | the client doesn't have 2 million tickets |
| Warning "that email looks wrong" while typing | **both** | the client for speed, the server because the client can be bypassed |

```checkpoint
q: A clever user edits the app on their phone so it skips the "is this ticket still available?" check. What protects you?
options: ["Nothing - the app is broken now", "The server checks again before it sells the ticket", "The Wi-Fi router blocks it"]
answer: 1
why: Never trust the client alone. The server must check anything that matters, because the client is under the user's control.
covers: [where the work happens, clients]
```

## Recap
- **Client** asks, **server** answers. A request goes out; a response comes back.
- A server is just a computer running a program that listens.
- Servers keep data in a **database**, so it survives restarts.
- Do instant, harmless work on the client; do anything that matters on the server - sometimes both.
