# Bored Games (boredgamesreviewsite)

The Board Game Review App repository for **DM571 / DM889 – Software Engineering (2026)** at the University of Southern Denmark. Intended for educational / university project use only.

**Working Title:** *Bored Games*  
*Website link pending; project currently in active development.*

---

## Data Source & Attribution

[![Powered by BGG](assets/powered-by-bgg.png)](https://boardgamegeek.com)

Board game data, metadata (titles, descriptions, player counts, playtimes, mechanics, categories, and artwork), and search queries are powered by the **[BoardGameGeek XML API2](https://boardgamegeek.com/wiki/page/BGG_XML_API2)** under a granted non-commercial educational license.

* BoardGameGeek (BGG) is a registered trademark of BoardGameGeek, LLC.
* For more information on BoardGameGeek and their API terms, visit [boardgamegeek.com](https://boardgamegeek.com).

---

## Tech Stack

* **Frontend:** React, React Router, Vite, CSS
* **Backend:** Node.js, Express, Prisma ORM, SQLite (`better-sqlite3`)
* **External Integration:** BoardGameGeek XML API2 (via `fast-xml-parser`)
