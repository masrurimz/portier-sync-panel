import { z } from 'zod';

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.literal('SUCCESS'),
    message: z.string(),
    data: dataSchema,
  });

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.enum(['missing_parameter', 'invalid_application_id', 'internal_error']),
  message: z.string(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
