import { z } from "zod";

export const KubernetesDashboardConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("observability-kubernetes-dashboard"),
});

export type KubernetesDashboardConfig = z.infer<
  typeof KubernetesDashboardConfig
>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  kubernetesDashboard: KubernetesDashboardConfig.default({}),
});

export type Config = z.infer<typeof Config>;
