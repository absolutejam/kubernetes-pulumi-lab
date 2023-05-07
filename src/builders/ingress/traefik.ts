import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Deployment } from "@pulumi/kubernetes/apps/v1";
import { NetworkPolicy } from "@pulumi/kubernetes/networking/v1";

import { TraefikConfig } from "../../types";

export type TraefikResources = {
  type: "traefik";
};

export class Traefik
  extends pulumi.ComponentResource
  implements TraefikResources
{
  public type = "traefik" as const;
  public labels: Record<string, string>;
  public namespace: string;

  constructor({ labels, namespace }: TraefikConfig) {
    super("k8slab:infra:Traefik", "traefik", {}, {});

    this.labels = labels;
    this.namespace = namespace;
  }
}

export type TraefikIngressNetworkPolicyOpts = {
  name: string;
  traefik: Traefik;
  targetDeployment: Deployment;
};

export function traefikIngressNetworkPolicy({
  name,
  traefik,
  targetDeployment,
}: TraefikIngressNetworkPolicyOpts): NetworkPolicy {
  return new kubernetes.networking.v1.NetworkPolicy(
    `${name}-traefik-ingress-only`,
    {
      metadata: {
        name,
        namespace: targetDeployment.metadata.namespace,
        labels: targetDeployment.metadata.labels,
      },
      spec: {
        policyTypes: ["Ingress"],
        podSelector: {
          matchLabels: targetDeployment.spec.selector.matchLabels,
        },
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
              {
                podSelector: {
                  matchLabels: traefik.labels,
                },
              },
            ],
          },
        ],
      },
    },
    { parent: targetDeployment, dependsOn: [traefik] }
  );
}
