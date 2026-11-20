import { projectApi } from "./api";
import { projectKeys } from "./keys";
import { projectQueries } from "./query";

export const projects = {
    keys: projectKeys,
    api: projectApi,
    query: projectQueries,
};
