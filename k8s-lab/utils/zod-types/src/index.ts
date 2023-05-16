import { z } from "zod";

/**
 * Reusable Zod types
 */

export const LabelsFromJsonString = z
  .string()
  .optional()
  .transform((json) =>
    z.record(z.string()).parse(json ? JSON.parse(json) : undefined)
  )
  .optional()
  .transform((labels) => labels ?? {});

export const Resources = z
  .object({
    cpu: z.string(),
    memory: z.string(),
  })
  .partial();