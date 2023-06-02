import { z } from "zod";

export const KubePrometheusStackConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("observability"),
});

export type KubePrometheusStackConfig = z.infer<
  typeof KubePrometheusStackConfig
>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  kubePrometheusStack: KubePrometheusStackConfig.default({}),
});

export type Config = z.infer<typeof Config>;
