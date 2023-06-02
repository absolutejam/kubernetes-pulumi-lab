import { z } from "zod";

export const Service = z.object({
  name: z.string(),
  repoPath: z.string(), // eg. infra/gitea.git
  namespace: z.string(),
});

export type Service = z.infer<typeof Service>;

export const ArgoApplicationsConfig = z.object({
  namespace: z.string().default("argocd-system"),

  services: z.array(Service).default([]),
});

export type ArgoApplicationsConfig = z.infer<typeof ArgoApplicationsConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  argoApplications: ArgoApplicationsConfig.default({}),
});

export type Config = z.infer<typeof Config>;
