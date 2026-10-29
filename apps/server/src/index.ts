import { buildApp } from "./app.js";
import { DEFAULT_HOST, DEFAULT_PORT } from "./config.js";

const app = buildApp();

await app.listen({ host: DEFAULT_HOST, port: DEFAULT_PORT });
