## API Node Typescript

Typescript (Node) API for web applications.

Uses esbuild to copile Typescript source code into one Javascript bundled file.

### Dependencies
1. Docker 

### How to Use

1. Create ```local.env``` file at /etc/config/
```
cp ./etc/config/.env_example ./etc/config/local.env 
```

2. Set environment variables;

3. Run:
```
docker compose up --build 
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