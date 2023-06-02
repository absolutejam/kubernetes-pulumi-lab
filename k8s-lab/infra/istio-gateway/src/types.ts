import { z } from "zod";
import { LabelsFromJsonString } from "@k8s-lab/utils.zod-types";

export const IstioGatewayConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("istio-gateway"),
  tls: z
    .object({
      enabled: z.boolean().default(true),
      commonName: z.string().default("k8s-lab.local"),
      issuerKind: z
        .union([z.literal("ClusterIssuer"), z.literal("Issuer")])
        .default("ClusterIssuer"),
      issuerName: z.string().default("self-signed-ca"),
      certSecretName: z.string().default("k8s-lab.local"),
      hostnames: z.array(z.string()).default(["k8s-lab.local"]),
    })
    .optional()
    .default({}),

  selector: LabelsFromJsonString.default(`{ "istio": "gateway" }`),
});

export type IstioGatewayConfig = z.infer<typeof IstioGatewayConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  istioGateway: IstioGatewayConfig.default({}),
});

export type Config = z.infer<typeof Config>;
