# TLS and HTTPS: the padlock

On café Wi-Fi, anyone nearby can see unprotected traffic. **TLS** solves two problems at once:

1. **Privacy:** it **encrypts** the connection, so eavesdroppers see only scrambled bytes.
2. **Identity:** it proves the server really is `expo.stark.com`, not an impostor.

**HTTPS** is ordinary HTTP sent inside a TLS connection - the padlock in the address bar.

## Certificates: ID cards for websites

A server proves who it is with a **certificate**: a document saying "this key belongs to
expo.stark.com, valid until 1 March", **signed** by a **certificate authority** (CA).

Your phone can't know every website, but it ships with a short list of **root** authorities it
trusts. Certificates link back to one of them in a **chain**:

```diagram
title: Checking expo.stark.com's certificate chain
steps:
  - The server sends its certificate - "I am expo.stark.com", signed by an intermediate authority.
  - It also sends the intermediate's certificate, signed by a root authority.
  - The phone finds that root in its built-in trusted list.
  - Each signature checks out, the name matches what you typed, and nothing has expired.
  - The padlock appears. If any link fails, the browser shows a warning instead.
```

```checkpoint
q: An attacker on café Wi-Fi presents their own certificate for expo.stark.com, signed by their own home-made authority. What happens?
options: ["The phone accepts it - the name matches", "The phone warns - the chain doesn't lead to a root it trusts", "The phone can't tell"]
answer: 1
why: Anyone can make a certificate. Only one signed (through a chain) by a trusted root is accepted. That's what defeats the "man in the middle".
covers: [the certificate chain, certificates]
```

## Certificates expire

Every certificate has an end date - usually 90 days to a year. After that, browsers refuse it,
even if nothing else changed. Teams automate **renewal**, so a job fetches a fresh certificate
well before the old one expires.

```scene
- who: happy
  line: Certificates expire? Like milk?
- who: jarvis
  line: Like milk, Happy. And someone switched off the reminder to buy more.
```

## The TLS 1.3 handshake

After the TCP handshake (lesson 4), TLS adds its own short conversation. In TLS 1.3 it takes
just **one round trip**:

```diagram
title: TLS 1.3, after the TCP connection is open
steps:
  - The phone says hello - the encryption methods it supports, and its half of a shared secret.
  - The server says hello - its half of the secret, its certificate, and proof it owns the certificate's key.
  - The phone checks the certificate chain.
  - Both sides now hold the same secret key. The phone sends its first request, encrypted.
```

```checkpoint
q: A brand-new HTTPS connection to a far-away server. How many round trips before the request can leave?
options: ["One (TCP only)", "Two (TCP, then TLS 1.3)", "Five"]
answer: 1
why: One for the TCP handshake, one for the TLS 1.3 handshake. Then the request goes, encrypted.
covers: [the TLS handshake, encryption]
```

## Recap
- **TLS** = encryption (privacy) + certificates (identity). **HTTPS** = HTTP inside TLS.
- A **certificate** is signed by an authority; the **chain** must lead to a root the device trusts,
  the **name** must match, and it must **not be expired**.
- TLS 1.3 adds **one round trip** after TCP's handshake.
- Renew certificates automatically - an expired certificate takes a site down as surely as a crash.
