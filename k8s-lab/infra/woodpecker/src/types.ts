import { z } from "zod";
import * as pulumi from "@pulumi/pulumi";

export const WoodpeckerConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("woodpecker"),

  giteaUrl: z
    .string()
    .default(`https://gitea-http.gitea.svc.cluster.local:3000`),
  // https://k8s-lab.local/gitea
});

export type WoodpeckerConfig = z.infer<typeof WoodpeckerConfig>;

export const WoodpeckerSecretsConfigValidated = z.object({
  agent: z.string(),
  giteaClient: z.string(),
  giteaSecret: z.string(),
});

export type WoodpeckerSecretsConfigValidated = z.infer<
  typeof WoodpeckerSecretsConfigValidated
>;

const WoodpeckerSecretsConfig: z.ZodType<
  pulumi.Output<WoodpeckerSecretsConfigValidated>
> = z.any();

export type WoodpeckerSecretsConfig = z.infer<typeof WoodpeckerSecretsConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  woodpecker: WoodpeckerConfig.default({}),
  woodpeckerSecrets: WoodpeckerSecretsConfig,
});

export type Config = z.infer<typeof Config>;
