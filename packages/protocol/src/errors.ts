import { z } from "zod";

const errorResponseSchema = z.object({
    statusCode: z.number().int(),
    message: z.string(),
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

export { errorResponseSchema, type ErrorResponse };
