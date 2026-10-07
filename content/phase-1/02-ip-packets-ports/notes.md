# IP, packets and ports

- **IP address** = where; **port** = which program there (443 HTTPS, 80 HTTP, 5432 Postgres).
- Messages travel as **packets** of about 1,500 bytes (about 1,460 bytes of data each).
- **Routers** forward packets hop by hop by destination address only.
- Packets can be **lost** or arrive **out of order**; TCP (lesson 4) repairs both.
- **localhost** (127.0.0.1) is the machine itself; requests to it never leave.
