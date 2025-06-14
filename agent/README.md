# agent

To install dependencies:

```bash
bun install
```

To run:

```bash
bun dev
```

This project was created using `bun init` in bun v1.2.15. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

```bash
bun run build
```

## Serverless Deploy

please install @serverless-devs/s

add .env file to folder

```sh
# ... other env from .env.example
# project id
SERVERLESS_LOG_PROJECT=
```

```sh
pnpm deploy:serverless
```
