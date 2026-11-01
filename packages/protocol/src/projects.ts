import { z } from "zod";

const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    createdAt: z.string(),
});

const createProjectSchema = projectSchema.pick({ name: true, path: true });

const createdProjectSchema = projectSchema.extend({
    available: z.literal(true),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;
type Project = z.infer<typeof projectSchema>;
type CreatedProject = z.infer<typeof createdProjectSchema>;

export {
    createdProjectSchema,
    createProjectSchema,
    projectSchema,
    type CreatedProject,
    type CreateProjectInput,
    type Project,
};
