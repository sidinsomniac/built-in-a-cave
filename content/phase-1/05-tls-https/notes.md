# TLS and HTTPS

- **TLS** encrypts the connection and proves the server's identity. **HTTPS** = HTTP over TLS.
- **Certificate:** "this key belongs to this name, until this date", signed by a certificate authority.
- **The browser checks:** the chain leads to a trusted root, the name matches, and it isn't expired. Any failure shows a warning.
- **TLS 1.3:** one round trip after TCP. New HTTPS connection = 2 round trips before the request.
- **Automate renewal.** Expiry is a classic, avoidable outage.
- **TLS termination:** decrypting at the load balancer centralises certificates; re-encrypt inside if the network isn't trusted.
