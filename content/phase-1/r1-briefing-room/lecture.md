# Briefing Room I: the timeline

Pepper wants the whole story of one tap, start to finish. Here's everything from lessons 1 to 5
in one place. Then three exercises put it together.

```diagram
title: From a tap to the first byte of the page
steps:
  - The visitor taps the Expo app (the client).
  - DNS turns expo.stark.com into an IP address - from a cache if it's fresh, otherwise via the resolver.
  - The request is cut into packets, addressed to that IP and to port 443.
  - Routers pass the packets hop by hop to the server.
  - TCP's three-way handshake opens a connection (one round trip).
  - TLS checks the certificate chain and sets up encryption (one more round trip).
  - The encrypted request reaches the server, which may ask its database.
  - The response comes back - the first byte arrives (one more round trip, plus the server's time).
```

## What breaks where

| If this breaks... | ...the visitor sees |
|---|---|
| DNS points to the wrong address | someone else's server, or nothing |
| Packets to port 443 are blocked | the app spins, then times out |
| No program is listening on the port | "connection refused", straight away |
| The certificate is expired or for the wrong name | a browser warning |
| The server's database is down | an error response from the server |

```scene
- who: pepper
  line: So every layer can fail on its own - and tonight, three of them did.
- who: jarvis
  line: Three changes, ma'am. Each survivable alone. Together, they took the Expo off the planet.
```
