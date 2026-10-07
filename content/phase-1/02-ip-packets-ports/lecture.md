# The plumbing: IP addresses, packets and ports

A request doesn't teleport from your phone to a server. It travels across
dozens of machines. Three ideas explain how.

## IP addresses: where to deliver

Every machine on the internet has an **IP address**, a number like `203.0.113.7`.
It works like a street address: it says where data should be delivered.

Names like `expo.stark.com` are for people. The network itself only understands
addresses. (Turning one into the other is DNS - lesson 3.)

## Packets: data in small envelopes

Big messages are cut into small pieces called **packets**, each about 1,500 bytes.
Every packet carries a "from" address, a "to" address, and its piece of the message.

Why cut them up? Small envelopes are easier to pass along, and if one is lost,
only that one needs sending again - not the whole message.

## Routing: hop by hop

Nobody knows the whole route. Each **router** looks at a packet's "to" address and
passes it one step closer, like a parcel moving between sorting offices.

```diagram
title: One packet's journey from a phone to the Expo server
steps:
  - The phone puts a piece of the request in a packet addressed to 203.0.113.7.
  - The home Wi-Fi router passes it to the internet provider.
  - The provider's routers pass it towards the right part of the internet.
  - More routers, hop by hop - usually 10 to 20 hops in total.
  - The packet reaches the network where 203.0.113.7 lives, and that machine accepts it.
```

```checkpoint
q: A router in the middle of the journey receives a packet. What does it look at to decide where to send it?
options: ["The packet's 'to' address", "What's inside the packet", "Which website the user typed"]
answer: 0
why: Routers only need the destination address. They don't read the contents.
covers: [routing, IP addresses]
```

```scene
- who: tony
  line: So every packet carries a "to" address. Whose address are ours carrying?
- who: jarvis
  line: Not ours, sir. That's what we're about to prove.
```

Packets can **arrive out of order** (they may take different routes), and some
**get lost** (a busy router drops them). The next layer up - TCP, lesson 4 -
puts them back in order and asks for missing ones again.

## Ports: which program on the machine

One server runs many programs: a web server, a database, maybe a mail server.
The address gets a packet to the **machine**; the **port** gets it to the right **program**.

| Port | Usually used by |
|---|---|
| 443 | HTTPS (secure web) |
| 80 | HTTP (plain web) |
| 5432 | Postgres (a database) |

Think of an apartment building: the IP address is the street address, the port is the flat number.

## localhost: talking to yourself

Every machine calls itself **localhost**, address `127.0.0.1`. A request to localhost
never leaves your computer - which is why `localhost:5173` reaches the dev server
running on your own laptop.

```checkpoint
q: Your laptop runs a web app on port 3000 and a database on port 5432. How does a packet for the database avoid ending up in the web app?
options: ["Different IP addresses", "Different ports", "The database answers faster"]
answer: 1
why: Same machine, same address - the port number picks the program.
covers: [ports, localhost]
```

## Recap
- **IP address:** where to deliver. **Packet:** a small envelope with "from", "to" and a piece of data.
- **Routers** pass packets hop by hop, looking only at the destination address.
- Packets can arrive **out of order**, or **get lost** - a higher layer fixes that.
- **Port:** which program on the machine. **localhost:** this machine.
