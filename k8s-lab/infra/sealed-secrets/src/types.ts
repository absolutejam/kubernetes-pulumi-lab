import { z } from "zod";

export const SealedSecretsConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("sealed-secrets-system"),
});

export type SealedSecretsConfig = z.infer<typeof SealedSecretsConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  externalSecrets: SealedSecretsConfig.default({}),
});

export type Config = z.infer<typeof Config>;
