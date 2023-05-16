import { z } from "zod";

const LabelsFromJsonString = z
  .string()
  .optional()
  .transform((json) =>
    z.record(z.string()).parse(json ? JSON.parse(json) : undefined)
  )
  .optional()
  .transform((labels) => labels ?? {});

const Resources = z
  .object({
    cpu: z.string(),
    memory: z.string(),
  })
  .partial();

export const WebAppConfig = z.object({
  replicas: z.number().default(2),
  image: z.string().default("nginx"),
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
  labels: LabelsFromJsonString,
});

export type TraefikConfig = z.infer<typeof TraefikConfig>;

export const IstioConfig = z.object({
  version: z.string().optional(),
  install: z.boolean().default(true),
  namespace: z.string().default("istio-system"),
  labels: LabelsFromJsonString,
});

export type IstioConfig = z.infer<typeof IstioConfig>;

export const IstioGatewayConfig = z.object({
  type: z.literal("istio"),
  version: z.string().optional(),
  install: z.boolean().default(true),
  namespace: z.string().default("istio-gateway"),
  tls: z
    .object({
      enabled: z.boolean().default(false),
      commonName: z.string().default("localhost"),
      issuerKind: z
        .union([z.literal("ClusterIssuer"), z.literal("Issuer")])
        .default("ClusterIssuer"),
      issuerName: z.string(),
      certSecretName: z.string().default("ingress-cert"),
      hostnames: z.array(z.string()).default(["localhost"]),
    })
    .optional(),
  labels: LabelsFromJsonString,
});

export type IstioGatewayConfig = z.infer<typeof IstioGatewayConfig>;

export const IngressConfig = z.discriminatedUnion("type", [
  TraefikConfig,
  IstioGatewayConfig,
]);

export type IngressConfig = z.infer<typeof IngressConfig>;

export const KubernetesDashboardConfig = z.object({
  enabled: z.boolean().default(true),
  namespace: z.string().default("observability-kubernetes-dashboard"),
});

export type KubernetesDashboard = z.infer<typeof KubernetesDashboardConfig>;

export const PrometheusStackConfig = z.object({
  namespace: z.string().default("observability-prometheus"),
  version: z.string().optional(),
});

export type PrometheusStackConfig = z.infer<typeof PrometheusStackConfig>;

export const CertManagerConfig = z.object({
  namespace: z.string().default("cert-manager"),
  version: z.string().optional(),
});

export type CertManagerConfig = z.infer<typeof CertManagerConfig>;

export const SelfSignedIssuerConfig = z.object({
  namespace: z.string().default("cert-manager"),
  commonName: z.string().default("self-signed-root-ca"),
  secretName: z.string().default("root-seecret"),
});

export type SelfSignedIssuerConfig = z.infer<typeof SelfSignedIssuerConfig>;

export const KialiConfig = z.object({
  operator: z
    .object({
      namespace: z.string().default("kiali-operator"),
      version: z.string().optional(),
    })
    .default({}),
  instance: z
    .object({
      namespace: z.string().default("observability-kiali"),
    })
    .default({}),
});

export type KialiConfig = z.infer<typeof KialiConfig>;

export const Config = z.object({
  cluster: z.string().optional(),
  instance: z.string(),
  environments: z.array(z.string()),

  istio: IstioConfig.default({}),
  ingress: IngressConfig.default({ type: "istio" }),
  certManager: CertManagerConfig.default({}),
  webApp: WebAppConfig.default({}),
  kubernetesDashboard: KubernetesDashboardConfig.default({}),
  prometheusStackConfig: PrometheusStackConfig.default({}),
  kiali: KialiConfig.default({}),
});

export type Config = z.infer<typeof Config>;
