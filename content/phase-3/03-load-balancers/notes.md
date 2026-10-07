# Load balancers

- Spread requests across **stateless** copies; keep per-user state in a shared store.
- **Round robin:** even requests. **Least connections:** uneven requests. **Hashing:** pin a user or key to a copy.
- **Health checks** remove dead copies. Without them, a dead copy fails its 1/N share.
- **Layer 4:** connections only, fast, no path routing. **Layer 7:** reads HTTP, routes by path, ends TLS, handles WebSocket upgrades.
- Size for losing a copy: (copies − 1) must still carry the peak with headroom.
