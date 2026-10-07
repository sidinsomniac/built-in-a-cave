# TCP and UDP

- **TCP:** numbered, acknowledged, resent when lost, delivered in order. Web pages, APIs, files, email.
- **Three-way handshake:** SYN → SYN-ACK → ACK, one round trip before the first request.
- **UDP:** fire-and-forget. Video and voice calls, games, DNS.
- **Round trip times:** under 1 ms inside a data centre, about 75 ms London–New York, about 280 ms London–Sydney.
- Every new TCP connection costs a round trip, so **reuse connections**.
