## API Node Typescript

Typescript (Node 24) API skeleton with a flat layered structure. It intentionally does nothing yet:
a single authenticated endpoint lists the rows of the `examples` table.

Uses esbuild to bundle the Typescript source into one Javascript file; `tsc` is only used for type-checking.

### Dependencies
1. Docker

### How to Use

1. Create the env file:
```
cp ./etc/config/.env_example ./etc/config/local.env
```

2. Set the environment variables. `JWT_SECRET_KEY` and the `DB_*` variables are required. The database must exist and `DB_USER` needs privileges on it; tables are created by the migrations.

3. Run:
```
docker compose up --build
```

Without Docker: `yarn install && yarn start:local`.

### Endpoints

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/prefix/examples` | `Authorization: Bearer <jwt>` | `{ "items": [{ "id": 1, "name": "..." }] }` |

Errors are returned as `{ "message": string, "code": number }`.

### Architecture

Flat layers, each one calling the next: `routes` → `controllers` → `services` → `repositories` → MySQL.

```
src
+-- main.ts             // starts the server and handles graceful shutdown
+-- app.ts              // Express app: helmet, morgan, body parsers, routes, error handling
+-- routes.ts           // maps paths to controllers
+-- controllers         // HTTP in/out: reads the request, calls a service, writes the response
+-- services            // business rules (today they only delegate to repositories)
+-- repositories        // SQL queries
+-- middlewares         // authentication (JWT), request logging and error handling
+-- database
|   +-- db.ts           // shared MySQL pool
|   +-- migrate.ts      // migration runner (latest | rollback | status)
|   +-- migrations      // Knex migrations + index.ts registering them
+-- infra
    +-- config.ts       // environment loading and validation
    +-- logger.ts       // pino logger (JSON) and fatal error handlers
```

### Logging

Every log line is JSON on stdout ([pino](https://getpino.io)), ready to be collected by Docker / Loki / ELK:

- one line per HTTP request ([pino-http](https://github.com/pinojs/pino-http)) with `req.id`, method, url, status and `responseTime`; `info` for 2xx/3xx, `warn` for 4xx, `error` for 5xx (with the serialized `err`);
- the request id comes from the `X-Request-Id` header (or is generated) and is returned in the response, so requests can be correlated across services;
- startup, shutdown, migrations and fatal errors (`uncaughtException` / `unhandledRejection`) use the same logger;
- the `Authorization` and `Cookie` headers are redacted.

Variables: `LOG_LEVEL` (default `info`) and `SERVICE_NAME` (default `api-node`). For human-readable output locally: `yarn start:local | npx pino-pretty`.

### Migrations

Uses [Knex](https://knexjs.org/guide/migrations.html) migrations (similar to Phinx): each file exports `up` and `down`, and applied migrations are tracked in the `knex_migrations` table.

The container runs `dist/migrate.js` (pending migrations) before starting the API; if a migration fails, the API does not start. The runner retries the connection while MySQL is starting.

To add a migration:
1. Create `src/database/migrations/<YYYYMMDDHHMMSS>_<name>.ts` exporting `up(knex)` and `down(knex)`;
2. Register it in `src/database/migrations/index.ts` (migrations are bundled, so they are not discovered from the filesystem).

Run manually: `yarn migrate:local [latest|rollback|status]`, or inside the container `docker exec api-node node dist/migrate.js status`.

### Scripts

| Script | Description |
|---|---|
| `yarn build` | bundles `src/main.ts` into `dist/` |
| `yarn typecheck` | type-checks with `tsc --noEmit` |
| `yarn serve` | runs `dist/main.js` (env from the process) |
| `yarn migrate` | runs `dist/migrate.js` (env from the process) |
| `yarn start:local` | builds and runs with `etc/config/local.env` |
| `yarn migrate:local` | builds and runs migrations with `etc/config/local.env` |
