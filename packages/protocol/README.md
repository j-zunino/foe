# @repo/protocol

Shared Zod schemas and their inferred types. This is the single source of truth for what crosses the wire: request bodies, responses, and file formats consumed by more than one entry point.

## Organization

One file per domain, re-exported from `src/index.ts`:

```
src/
├── index.ts      # export { ... } from "./<domain>.js"
├── projects.ts
├── agents.ts
└── errors.ts
```

`src/index.ts` is the package entry (`dist/index.js`), so it re-exports every public name. Use explicit named re-exports; do not use `export *`.

- A schema used by routes, services, or config loaders lives here.
- A schema used by exactly one route may stay inline in that route file.
- Server-only infrastructure (for example the env schema in `apps/server/src/config/env.ts`) stays local.

## Conventions

- **No Fastify imports.** Schemas are plain Zod and can be consumed by the server, config loaders, tests, or a future client.
- **Exports live at the bottom.** Declare schemas and types first, then a single `export { ... }` block at the end of the file. Include inferred types in that block with the `type` modifier (`export { fooSchema, type Foo }`).
- **Name schemas `<thing>Schema`** (`createProjectSchema`, `projectSchema`) and export the derived type with `z.infer` (`CreateProjectInput`, `Project`). Don't hand-write a duplicate interface.
- **Validate rules once.** Request validation is declared in `schema.body`/`schema.querystring`/`schema.params`/`schema.response`; do not repeat the same checks with `safeParse` in the handler. Run `safeParse` only when Fastify is not in the picture (config files, CLI input).
- **Never add Fastify JSON Schema** for a route that has a Zod schema — the Zod schema already produces the validator and the TypeScript type.
- **`.js` import extensions** are required (NodeNext), including inside this package.
- Response schemas must cover every field you intend to send: the serializer drops unknown keys.

## Usage

Server setup (`apps/server/src/lib/fastify.ts`) installs the compilers and type provider once:

```ts
Fastify()
    .setValidatorCompiler(validatorCompiler)
    .setSerializerCompiler(serializerCompiler)
    .withTypeProvider<ZodTypeProvider>();
```

Routes then use `FastifyPluginAsyncZod` and get `request.body` / `request.query` typed from the schema:

```ts
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import {
    createProjectSchema,
    createdProjectSchema,
    errorResponseSchema,
} from "@repo/protocol";

const projectsRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post(
        "/",
        {
            schema: {
                body: createProjectSchema,
                response: {
                    201: createdProjectSchema,
                    400: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            // request.body: CreateProjectInput
            return reply.code(201).send({ ...project, available: true });
        },
    );
};
```

Route plugins are async by signature even when they only register routes; the shared ESLint config disables `require-await` for `**/routes/**/*.ts`.

Schema validation failures are turned into `400 { error }` by the server's error handler. Handler-thrown errors keep Fastify's default handling.

Services take inferred types instead of re-declaring shapes:

```ts
import type { CreateProjectInput } from "@repo/protocol";

function create(db: AppDatabase, input: CreateProjectInput & { name: string }) {
    // ...
}
```

## Reference

- [Zod](https://zod.dev/)
- [Fastify type providers](https://fastify.dev/docs/latest/Reference/Type-Providers/)
- [@fastify/type-provider-zod](https://github.com/fastify/fastify-type-provider-zod)
