## API Node Typescript

Typescript/Node API for CRUD backend.

Uses esbuild to copile Typescript source code into one Javascript bundled file.

### Dependencies
1. Node 22
2. Yarn (optional)
3. Docker (optional) 

### How to Use

Using docker:
1. Create ```local.env``` file at /etc/config/
```
cp ./etc/config/.env_example ./etc/config/local.env 
```

2. Set environment variables;

3. Run:
```
docker compose up --build 
```

Without docker:

1. Create ```.env``` file at root directory;

2. Set env vars;

3. Run:
```
yarn install
yarn build
yarn serve
```
### File Structure

```
.
+-- doc
|   +--             //Swagger autogen and documentation file
+-- etc
|   +-- config
|       +--         //.env files
+-- src
|   +-- Controllers
|   |   +--         //endpoint controller files    
|   +-- Middlewares
|   |   +--         //middlewares files
|   +-- Library
|   |   +--         //business rules and util files
|   |
|   +-- server.ts   //main driver code
+-- dist *
|   +--             //build output
+-- node_modules *
|   +--             //node packages
|
+--                 //Project, build and configuration files
```

### Generate Automatic Documentation

Run:
```
yarn doc-gen
```