# API NODE - Myurl

## Product

URL shortener: creates short codes for URLs, redirects them and counts the clicks. Each user manages only their own links.

## Concepts

- Layered architecture (`routes` → `controllers` → `services` → `repositories`)
- Stateless authentication with JWT
- Password hashing (scrypt, constant-time comparison)
- Structured logging (pino) and request correlation (`X-Request-Id`)
- Database connection managed with ORM `Prisma`
- Schema migrations (Prisma Migrate)
- Bundling with esbuild, type-checking with `tsc`
- Code linting and formatting with `ESLint` and `Prettier`
- API contract with OpenAPI / Swagger UI

## Running

Requires Docker and the [stack-containers](https://github.com/mrtrevisan/stack-containers) `core` and `infra/local-mysql` services running.

1. Create the env file:
```bash
cp ./etc/config/.env_example ./etc/config/local.env
```

2. Set the environment variables. `JWT_SECRET_KEY` and the `DB_*` variables are required. `DB_SHADOW_NAME` is only needed to create new migrations. Generate `JWT_SECRET_KEY` with:
```bash
openssl rand -hex 32
```

3. Create the databases (as MySQL root; e.g. in phpMyAdmin or `docker exec -it local-mysql mysql -uroot -p`). Tables are created by the migrations:
```sql
CREATE DATABASE myurl;
CREATE DATABASE myurl_shadow; -- only for `yarn migrate:dev`
GRANT ALL PRIVILEGES ON myurl.* TO '<DB_USER>'@'%';
GRANT ALL PRIVILEGES ON myurl_shadow.* TO '<DB_USER>'@'%';
```

4. Run (the container applies the migrations before starting the API):
```bash
docker compose up -d --build
```

The API answers at `https://myurl.cloud.local` and the docs at `https://myurl.cloud.local/docs`.

## Endpoints

| Method | Path | Auth |
|---|---|---|
| POST | `/auth/register` `{email, password}` | public |
| POST | `/auth/login` `{email, password}` → `{token}` | public |
| POST | `/links` `{url}` → `{code, url}` | Bearer |
| GET | `/links/:code` → `{code, url, createdAt, clicks}` | Bearer |
| GET | `/:code` → `302` redirect, records a click | public |
