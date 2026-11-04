import { z } from "zod";

const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    createdAt: z.string(),
});

const projectsSchema = z.array(projectSchema);

const createProjectSchema = projectSchema.pick({ path: true }).extend({
    name: z.string().trim().min(1).optional(),
});

type Project = z.infer<typeof projectSchema>;
type Projects = z.infer<typeof projectsSchema>;
type CreateProjectInput = z.infer<typeof createProjectSchema>;

export {
    createProjectSchema,
    projectSchema,
    projectsSchema,
    type CreateProjectInput,
    type Project,
    type Projects,
};
