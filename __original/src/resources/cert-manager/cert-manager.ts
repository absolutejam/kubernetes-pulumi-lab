import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Namespace } from "@pulumi/kubernetes/core/v1";
import { Chart } from "@pulumi/kubernetes/helm/v3";

export type CertManagerOpts = {
  namespace: string;
  version?: string;
};

export class CertManager extends pulumi.ComponentResource {
  public namespace: Namespace;
  public chart: Chart;

  constructor(
    { namespace, version }: CertManagerOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "cert-manager";

    super("k8slab:infra:CertManager", name, {}, opts);

    const labels = {
      "app.kubernetes.io/tier": "infra",
      "app.kubernetes.io/name": name,
      "app.kubernetes.io/part-of": name,
      "app.kubernetes.io/managed-by": "pulumi",
    };

    this.namespace = new kubernetes.core.v1.Namespace(
      "cert-manager-namespace",
      {
        metadata: {
          name: namespace,
          labels,
        },
      },
      { parent: this }
    );

    this.chart = new kubernetes.helm.v3.Chart(
      "cert-manager",
      {
        chart: "cert-manager",
        namespace: this.namespace.metadata.name,
        repo: "jetstack",
        version,
        fetchOpts: {
          repo: "https://charts.jetstack.io",
        },
        values: {
          installCRDs: true,
          replicas: 2,

          /**
           * Disabled due to depending on Helm hooks
           */
          startupapicheck: {
            enabled: false,
          },
        },
      },
      { parent: this.namespace }
    );
  }
}
