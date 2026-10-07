# Queues and workers

- **Asynchronous:** answer now, do slow side work later (emails, analytics, thumbnails).
- **Service → queue → workers → their own store.** A slow dependency only delays the background work.
- **Backlog** grows by arriving − handled each second. Design-table worker ≈ 2,000 messages/s.
- **Size** for the peak (no backlog) or the average (backlog drains after bursts).
- **Backpressure:** slow or refuse new work instead of growing a backlog forever.
- **Queue (SQS):** one consumer, then deleted. **Log (Kafka):** many readers, retained, replayable.
