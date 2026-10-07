# Databases: choosing a store

"Which database?" is one of the first questions in any design round. There's no single best
one - each kind is built for a different **shape** of data and a different way of **asking** for it.

## The relational (SQL) database

A **SQL database** (like Postgres or MySQL) stores data in **tables**: rows of records,
columns of fields.

| visitors | | | tickets | | |
|---|---|---|---|---|---|
| **id** | name | email | **id** | visitor_id | exhibit |
| 7 | Peter | peter@... | 501 | 7 | Arc Reactor |
| 8 | Happy | happy@... | 502 | 7 | Mark III |

- The **primary key** (`id`) uniquely identifies each row.
- A **foreign key** (`visitor_id`) points to a row in another table. One visitor, many tickets.
- **Joins** combine tables in one query: "every ticket, with its visitor's name".
- **Transactions** make several changes all-or-nothing: charge the card *and* create the ticket, or neither.

Reach for SQL when data has **relationships**, needs **rich queries**, or must stay **exactly consistent** (money, bookings).

```checkpoint
q: Each exhibit appears in many tours, and each tour has many exhibits. How do you model that in SQL?
options: ["Put a list of tour names in the exhibits table", "A joining table with one row per (tour, exhibit) pair", "Make one giant table of everything"]
answer: 1
why: Many-to-many relationships get their own table of pairs, each pair pointing to both sides with foreign keys.
covers: [keys and relationships, relational databases]
```

## The other homes

| Store | Built for | Example data | Examples |
|---|---|---|---|
| **Key-value store** | fetch one value by its key, at huge scale | short code → long URL; sessions | DynamoDB, Redis |
| **Document store** | flexible records, each its own shape | user profiles with optional fields | MongoDB |
| **Search index** | finding text, with typos, ranked | "arc reac" → Arc Reactor exhibits | Elasticsearch |
| **Object storage** | big files, cheap and durable | photos, videos, backups | S3 |
| **Time-series database** | measurements over time, by time range | sensor readings, metrics | InfluxDB, TimescaleDB |

```scene
- who: pepper
  line: Why not one database for everything? It sounds simpler.
- who: jarvis
  line: Simpler to buy, Ms Potts. Not to run. Each kind is fast at one shape of question.
```

## How to choose

Ask three questions about the data:

1. **How is it read?** By one key? By rich queries and joins? By text search? By time range? As a whole file?
2. **Must it be exactly consistent?** Money and bookings: SQL transactions.
3. **How big, how fast?** Billions of lookups by key: a key-value store spreads across many machines easily.

Big systems use **several stores**, each for what it does best - and keep one of them as the
**source of truth** for each piece of data.

## Recap
- **SQL:** tables, keys, joins, transactions - for related, consistent data.
- **Key-value:** one key → one value, at any scale. **Document:** flexible records.
- **Search index:** text search. **Object storage:** files. **Time-series:** measurements over time.
- Choose by **how the data is read**, **how consistent** it must be, and **how big** it gets.
