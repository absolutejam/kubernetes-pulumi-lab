import { z } from "zod";

export const GiteaConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("gitea"),

  adminCredentials: z
    .object({
      username: z.string().default("gitea-admin"),
      password: z.string().default("waffle123!"),
    })
    .default({}),

  postgresConfig: z
    .object({
      password: z.string().default("waffle123!"),
      postgresPassword: z.string().default("waffle123!"),
    })
    .default({}),
});

export type GiteaConfig = z.infer<typeof GiteaConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  gitea: GiteaConfig.default({}),
});

export type Config = z.infer<typeof Config>;
