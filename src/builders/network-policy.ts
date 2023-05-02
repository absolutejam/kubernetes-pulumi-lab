import * as kubernetes from "@pulumi/kubernetes";
import { Namespace } from "@pulumi/kubernetes/core/v1";
import { NetworkPolicy } from "@pulumi/kubernetes/networking/v1";

import { config } from "../config";
const { traefik } = config;

type BuildTraefikNetworkPolicyOpts = {
  name: string;
  labels: Record<string, string>;
  namespace: Namespace;
};

export function buildTraefikNetworkPolicy({
  name,
  labels,
  namespace,
}: BuildTraefikNetworkPolicyOpts): NetworkPolicy {
  return new kubernetes.networking.v1.NetworkPolicy(
    `${name}-traefik-ingress-only`,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
        labels,
      },
      spec: {
        policyTypes: ["Ingress"],
        podSelector: { matchLabels: labels },
        ingress: [
          {
            from: [
              {
                namespaceSelector: {
                  matchLabels: {
                    "kubernetes.io/metadata.name": traefik.namespace,
                  },
                },
              },
              { podSelector: { matchLabels: traefik.labels } },
            ],
          },
        ],
      },
    },
    { parent: namespace }
  );
}
