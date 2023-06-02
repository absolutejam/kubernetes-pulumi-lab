import { z } from "zod";

export const ReflectorConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("reflector-system"),
});

export type ReflectorConfig = z.infer<typeof ReflectorConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  reflector: ReflectorConfig.default({}),
});

export type Config = z.infer<typeof Config>;
