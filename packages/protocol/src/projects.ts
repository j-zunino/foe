import { z } from "zod";

const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    createdAt: z.string(),
});

const projectsSchema = z.array(projectSchema);

const createProjectSchema = projectSchema.pick({ name: true, path: true });

const createdProjectSchema = projectSchema.extend({
    available: z.literal(true),
});

type Project = z.infer<typeof projectSchema>;
type Projects = z.infer<typeof projectsSchema>;
type CreateProjectInput = z.infer<typeof createProjectSchema>;
type CreatedProject = z.infer<typeof createdProjectSchema>;

export {
    createdProjectSchema,
    createProjectSchema,
    projectSchema,
    projectsSchema,
    type CreatedProject,
    type CreateProjectInput,
    type Project,
    type Projects,
};
