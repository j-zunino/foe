import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { agentQueries } from "@/features/agents/query.ts";
import { projectMutations } from "@/features/projects/mutation.ts";
import { projectQueries } from "@/features/projects/query.ts";

export function App() {
    // NOTE: temp; remove
    const projectsQuery = useQuery(projectQueries.list());
    const agentsQuery = useQuery(agentQueries.list());
    const addProject = projectMutations.useAdd();
    const removeProject = projectMutations.useRemove();
    const [path, setPath] = useState("");
    //

    return (
        <div className="flex min-h-svh p-6">
            <div className="flex max-w-md min-w-0 flex-col gap-6 text-sm leading-loose">
                <section className="flex flex-col gap-3">
                    <h1 className="text-base font-medium">Projects</h1>

                    {projectsQuery.isPending ? <p>Loading...</p> : null}
                    {projectsQuery.data?.length === 0 ? (
                        <p>No projects yet.</p>
                    ) : null}

                    <ul className="flex flex-col gap-1">
                        {projectsQuery.data?.map((project) => (
                            <li
                                key={project.id}
                                className="flex items-center gap-2"
                            >
                                <span>{project.name}</span>
                                <button
                                    type="button"
                                    className="text-muted-foreground"
                                    onClick={() =>
                                        removeProject.mutate(project.id)
                                    }
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>

                    <form
                        className="flex gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            addProject.mutate({ path });
                        }}
                    >
                        <input
                            className="min-w-0 flex-1 border px-2"
                            value={path}
                            onChange={(event) => setPath(event.target.value)}
                            placeholder="/absolute/path"
                        />
                        <button type="submit">Add</button>
                    </form>
                </section>

                <section className="flex flex-col gap-3">
                    <h2 className="text-base font-medium">Agents</h2>

                    {agentsQuery.isPending ? <p>Loading...</p> : null}

                    <ul className="flex flex-col gap-1">
                        {agentsQuery.data?.map((agent) => (
                            <li key={agent.id}>{agent.name}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default App;
