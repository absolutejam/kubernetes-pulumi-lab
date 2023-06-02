import { z } from "zod";

export const TrustManagerConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("trust-manager-system"),
});

export type TrustManagerConfig = z.infer<typeof TrustManagerConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  trustManager: TrustManagerConfig.default({}),
});

export type Config = z.infer<typeof Config>;
