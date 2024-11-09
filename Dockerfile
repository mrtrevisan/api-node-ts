FROM node:22-alpine AS installer
# Create app directory
WORKDIR /app
# Install app dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN yarn

###################################
FROM node:22-alpine AS builder
WORKDIR /app

COPY --chown=node:node --from=installer /app/node_modules ./node_modules

#Copy project files
COPY package*.json ./
COPY yarn.lock ./

#Copy build files
COPY tsconfig.json ./
COPY esbuild.config.js ./

#Copy source directory
COPY --chown=node:node src ./src

RUN yarn build

######################################
FROM node:22-alpine

RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

USER node

WORKDIR /app

COPY package*.json ./

COPY --chown=node:node --from=installer /app/node_modules ./node_modules

COPY --chown=node:node --from=builder /app/dist dist 

# Copy doc files
COPY --chown=node:node doc ./doc

ENTRYPOINT ["yarn", "server"]