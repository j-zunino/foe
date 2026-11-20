import { useQuery } from "@tanstack/react-query";
import { projects } from "@/features/projects";

export function App() {
    // NOTE: temp; remove
    const { data, isPending, isError } = useQuery(projects.query.list());
    if (isPending) return <p>Loading...</p>;
    if (isError) return <p>Something went wrong</p>;
    if (data?.length === 0) return <p>No projects yet.</p>;
    //

    return (
        <div className="flex min-h-svh p-6">
            <div className="flex max-w-md min-w-0 flex-col gap-3 text-sm leading-loose">
                <h1 className="text-base font-medium">Projects</h1>

                <ul className="flex flex-col gap-1">
                    {data?.map((project) => (
                        <li key={project.id}>{project.name}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default App;
