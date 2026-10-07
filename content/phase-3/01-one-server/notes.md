# One server, and its limits

- **Utilisation = arriving ÷ capacity.** One design-table service copy ≈ 1,000 requests/s.
- **Queueing:** worst-case wait ≈ 4.5× idle at 50%, 13× at 80%, 28× at 90%, 58× at 95%.
- **Headroom:** run at 70–80% at the peak.
- **Sizing:** peak = average × peak factor; copies = peak ÷ (capacity × headroom), rounded up, plus one spare.
- **Little's law:** in progress = arrival rate × time per request.
