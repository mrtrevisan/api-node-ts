FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json esbuild.config.js prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN yarn typecheck && yarn build

######################################
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# the Prisma CLI reads the config, schema and SQL migrations at runtime
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

# apply pending migrations, then replace the shell with the API process so it receives SIGTERM
CMD ["sh", "-c", "node --enable-source-maps dist/migrate.js && exec node --enable-source-maps dist/main.js"]
