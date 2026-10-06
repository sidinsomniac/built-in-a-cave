# DNS

- DNS turns names into IP addresses.
- Chain: browser cache → OS cache → recursive resolver → root → TLD → authoritative server.
- Only the **authoritative** server holds the real record.
- **TTL** = seconds an answer may be cached. Long TTL: less load, slow changes. Short TTL: fast changes, more load, bad records spread fast.
- Lookups reaching the authoritative server ≈ number of busy resolvers ÷ TTL.
