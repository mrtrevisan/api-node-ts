## API Node Typescript

Typescript (Node 24) URL shortener with a flat layered structure: creates short codes for URLs,
redirects them and counts the clicks, persisted in MySQL. Users register and log in to get a JWT;
each user manages only their own links.

Uses esbuild to bundle the Typescript source into one Javascript file; `tsc` is only used for type-checking.

### Part of stack-containers

This API is a git submodule (`apis/api-node-ts`) of [stack-containers](https://github.com/mrtrevisan/stack-containers), a local container stack for practicing distributed systems concepts. The stack provides what this API relies on:

- **Traefik** (`core/`): routes `https://myurl.cloud.local` to the container, with local TLS;
- **MySQL** (`infra/local-mysql/`): the database, reachable as `mysql` on the `traefik-proxy` network;
- the external Docker networks `traefik-proxy` and `internal`.

Follow the stack README to start `core` and `infra/local-mysql` before running this API.

### Dependencies
1. Docker
2. The [stack-containers](https://github.com/mrtrevisan/stack-containers) `core` and `infra/local-mysql` services running (see above)

### How to Use

1. Create the env file:
```
cp ./etc/config/.env_example ./etc/config/local.env
```

2. Set the environment variables. `JWT_SECRET_KEY` and the `DB_*` variables are required. `DB_SHADOW_NAME` is only needed to create new migrations.

3. Create the databases (as MySQL root; e.g. in phpMyAdmin or `docker exec -it local-mysql mysql -uroot -p`). Tables are created by the migrations, so the databases start empty:
```sql
CREATE DATABASE myurl;
CREATE DATABASE myurl_shadow; -- only for `yarn migrate:dev`
GRANT ALL PRIVILEGES ON myurl.* TO '<DB_USER>'@'%';
GRANT ALL PRIVILEGES ON myurl_shadow.* TO '<DB_USER>'@'%';
```

4. Run:
```
docker compose up --build
```

Without Docker: `yarn install && yarn start:local`.

### Endpoints

| Method | Path | Auth | Response |
|---|---|---|---|
| POST | `/auth/register` with `{ "email", "password" }` | public | `201 { "id", "email" }`; `409` if the email exists |
| POST | `/auth/login` with `{ "email", "password" }` | public | `{ "token" }`, a JWT valid for 1 hour |
| POST | `/links` with `{ "url": "https://..." }` | `Authorization: Bearer <token>` | `201 { "code": "aB3x_9Z", "url": "..." }` |
| GET | `/links/:code` | `Authorization: Bearer <token>` | `{ "code", "url", "createdAt", "clicks" }`; `404` for other users' links |
| GET | `/:code` | public | `302` redirect to the URL; records a click |

Passwords (8+ characters) are stored as scrypt hashes with a random salt. The token is signed with `JWT_SECRET_KEY` (HS256) and its `sub` is the user id.

Interactive docs (Swagger UI) at `/docs`, e.g. https://myurl.cloud.local/docs. The OpenAPI spec is written by hand in `src/docs/openapi.ts`; keep it in sync with `src/routes.ts`.

Errors are returned as `{ "message": string, "code": number }`.

### Architecture

Flat layers, each one calling the next: `routes` → `controllers` → `services` → `repositories` → MySQL (through [Prisma ORM](https://www.prisma.io/docs/orm)).

```
src
+-- main.ts             // starts the server and handles graceful shutdown
+-- app.ts              // Express app: helmet, request logging, body parsers, routes, error handling
+-- routes.ts           // maps paths to controllers
+-- controllers         // HTTP in/out: reads the request, calls a service, writes the response
+-- services            // business rules (today they only delegate to repositories)
+-- repositories        // database queries with the Prisma Client
+-- middlewares         // authentication (JWT), request logging and error handling
+-- docs/openapi.ts     // OpenAPI spec served by Swagger UI at /docs
+-- database
|   +-- db.ts           // shared Prisma Client (MariaDB driver adapter, compatible with MySQL)
|   +-- migrate.ts      // migration runner (deploy | status)
+-- generated/prisma    // Prisma Client generated from the schema (not versioned)
+-- infra
    +-- config.ts       // environment loading and validation
    +-- logger.ts       // pino logger (JSON) and fatal error handlers
prisma
+-- schema.prisma       // data models
+-- migrations          // one folder per migration with its migration.sql
prisma.config.ts        // Prisma CLI config: schema/migrations paths and the URL built from DB_*
```

### Logging

Every log line is JSON on stdout ([pino](https://getpino.io)), ready to be collected by Docker / Loki / ELK:

- one line per HTTP request ([pino-http](https://github.com/pinojs/pino-http)) with `req.id`, method, url, status and `responseTime`; `info` for 2xx/3xx, `warn` for 4xx, `error` for 5xx (with the serialized `err`);
- the request id comes from the `X-Request-Id` header (or is generated) and is returned in the response, so requests can be correlated across services;
- startup, shutdown, migrations and fatal errors (`uncaughtException` / `unhandledRejection`) use the same logger;
- the `Authorization` and `Cookie` headers are redacted.

Variables: `LOG_LEVEL` (default `info`) and `SERVICE_NAME` (default `myurl`). For human-readable output locally: `yarn start:local | npx pino-pretty`.

### Migrations

Uses [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate). `prisma/schema.prisma` is the source of truth: migrations are plain SQL files generated from changes to it, and applied migrations are tracked in the `_prisma_migrations` table. Unlike Knex/Phinx there are no `down` migrations; to revert, write a new migration.

The container runs `dist/migrate.js` (`prisma migrate deploy`) before starting the API; if a migration fails, the API does not start. The runner retries the connection while MySQL is starting and relays the Prisma CLI output as JSON log lines.

To add a migration:
1. Change `prisma/schema.prisma`;
2. Run `yarn migrate:dev --name <name>`: it creates `prisma/migrations/<timestamp>_<name>/migration.sql`, applies it and regenerates the client. It needs a reachable database and an empty shadow database (`DB_SHADOW_NAME`, with privileges for `DB_USER`) to detect drift.

Run manually: `yarn migrate:local [deploy|status]`, or inside the container `docker exec local-myurl node dist/migrate.js status`.

### Scripts

| Script | Description |
|---|---|
| `yarn generate` | generates the Prisma Client into `src/generated/prisma` |
| `yarn build` | generates the client and bundles `src/main.ts` and `src/database/migrate.ts` into `dist/` |
| `yarn typecheck` | generates the client and type-checks with `tsc --noEmit` |
| `yarn serve` | runs `dist/main.js` (env from the process) |
| `yarn migrate` | runs `dist/migrate.js` (env from the process) |
| `yarn start:local` | builds and runs with `etc/config/local.env` |
| `yarn migrate:local` | builds and runs migrations with `etc/config/local.env` |
| `yarn migrate:dev` | creates and applies a new migration from the schema (`prisma migrate dev`) |
