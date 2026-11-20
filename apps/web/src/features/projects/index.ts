import { projectApi } from "./api";
import { projectKeys } from "./keys";
import { projectMutations } from "./mutation";
import { projectQueries } from "./query";

export const projects = {
    keys: projectKeys,
    api: projectApi,
    query: projectQueries,
    mutation: projectMutations,
};
