import { z } from "zod";

const errorResponseSchema = z.object({
    error: z.string(),
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

export { errorResponseSchema, type ErrorResponse };
