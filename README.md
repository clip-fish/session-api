# Clip Fish Session API

Express + Socket.IO service for storing session metadata (devices & messages) with MongoDB persistence and broadcasting real‑time updates.

---

## Features

- **REST endpoints** for creating/deleting sessions, listing & upserting devices, and posting messages
- **WebSocket** (Socket.IO) support for real‑time device/message broadcasts
- **MongoDB** back‑end for durable session storage
- **TypeScript** codebase with full typings

---

## Prerequisites

- **Node.js** 18+ & **npm**
- **MongoDB** instance (local, Docker, or remote Atlas)

---

## Environment Variables

| Name          | Default                                 | Description                                          |
|---------------|-----------------------------------------|------------------------------------------------------|
| `MONGO_URI`   | `mongodb://localhost:27017/session-api` | MongoDB connection string                            |
| `PORT`        | `2000`                                  | HTTP & WebSocket listen port                         |
| `HOST`        | `0.0.0.0`                               | Host to bind                                         |
| `CORS_ORIGIN` | `*`                                     | Allowed CORS origin (e.g. `https://app.example.com`) |

You can override these in your shell, in a `.env` file, or via Docker Compose.

---

## Quickstart

### Local development

```bash
git clone https://github.com/clip-fish/session-api.git
cd session-api
npm install

# if you have Mongo running locally:
export MONGO_URI="mongodb://localhost:27017/session-api"
npm run dev
```

Your API will be up on **http://localhost:2000**.

---

### Production build

```bash
npm run build     # compiles TS → ./dist
npm start         # runs node dist/index.js
```

---

### Docker Compose

A `docker-compose.yml` is included. From the repo root:

```bash
docker compose up --build
```

This will launch:

- **mongo** – MongoDB (data in a named volume)
- **api** – this service, listening on port 2000

---

## Scripts

| Command         | Description                                       |
|-----------------|---------------------------------------------------|
| `npm run dev`   | Start TS compiler with hot‑reload (`ts-node-dev`) |
| `npm run build` | Transpile TypeScript to JavaScript (`tsc`)        |
| `npm start`     | Run the compiled server (`node dist/index.js`)    |
| `npm test`      | (no tests yet)                                    |

---

## API Endpoints

```text
POST   /session                      → create/ensure session
DELETE /session/:sessionId          → delete a session
POST   /session/:sessionId/device   → upsert a device
GET    /session/:sessionId/devices  → list devices
POST   /session/:sessionId/message  → add a message
GET    /session/:sessionId/messages → list messages
```

All payloads and responses use JSON. WebSocket events are:

- `deviceUpdates` – emits array of devices
- `messageUpdates` – emits array of messages

---

## License

MIT © Clip Fish
