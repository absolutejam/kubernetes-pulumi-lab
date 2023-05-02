import { z } from "zod";

const Resources = z
  .object({
    cpu: z.string(),
    memory: z.string(),
  })
  .partial();

export const WebAppConfig = z.object({
  replicas: z.number(),
  image: z.string(),
  resources: z
    .object({
      requests: Resources.optional(),
      limits: Resources.optional(),
    })
    .optional(),
  nodeSelector: z.record(z.string()).optional(),
});

export type WebAppConfig = z.infer<typeof WebAppConfig>;

export const TraefikConfig = z.object({
  namespace: z.string(),
  labels: z.record(z.string()),
});

export type TraefikConfig = z.infer<typeof TraefikConfig>;

export const Config = z.object({
  cluster: z.string(),
  instance: z.string(),
  environments: z.array(z.string()),

  traefik: TraefikConfig,
  webAppConfig: WebAppConfig,
});

export type Config = z.infer<typeof Config>;
