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
  type: z.literal("traefik"),
  install: z.boolean().default(false),
  namespace: z.string(),
  labels: z
    .string()
    .transform((json) => z.record(z.string()).parse(JSON.parse(json))),
});

export type TraefikConfig = z.infer<typeof TraefikConfig>;

export const IstioConfig = z.object({
  type: z.literal("istio"),
  version: z.string().optional(),
  install: z.boolean().default(false),
  namespace: z.string().default("istio-system"),
  labels: z
    .string()
    .transform((json) => z.record(z.string()).parse(JSON.parse(json))),
});

export type IstioConfig = z.infer<typeof IstioConfig>;

export const IngressConfig = z.discriminatedUnion("type", [
  TraefikConfig,
  IstioConfig,
]);

export type IngressConfig = z.infer<typeof IngressConfig>;

export const KubernetesDashboardConfig = z.object({
  enabled: z.boolean().default(true),
  namespace: z.string().default("kubernetes-dashboard"),
});

export type KubernetesDashboard = z.infer<typeof KubernetesDashboardConfig>;

export const PrometheusStackConfig = z.object({
  namespace: z.string().default("observability"),
  version: z.string().optional(),
});

export type PrometheusStackConfig = z.infer<typeof PrometheusStackConfig>;

export const Config = z.object({
  cluster: z.string(),
  instance: z.string(),
  environments: z.array(z.string()),

  ingress: IngressConfig,
  webApp: WebAppConfig,
  kubernetesDashboard: KubernetesDashboardConfig.default({}),
  prometheusStackConfig: PrometheusStackConfig.default({}),
});

export type Config = z.infer<typeof Config>;
