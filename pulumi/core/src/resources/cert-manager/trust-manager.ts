import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Chart } from "@pulumi/kubernetes/helm/v3";

export type TrustManagerOpts = {
  namespace: string;
  version?: string;
};

export class TrustManager extends pulumi.ComponentResource {
  public chart: Chart;

  constructor(
    { namespace, version }: TrustManagerOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "trust-manager";

    super("k8slab:infra:TrustManager", name, {}, opts);

    const labels = {
      "app.kubernetes.io/tier": "infra",
      "app.kubernetes.io/name": name,
      "app.kubernetes.io/part-of": name,
      "app.kubernetes.io/managed-by": "pulumi",
    };

    this.chart = new kubernetes.helm.v3.Chart(
      "trust-manager",
      {
        chart: "trust-manager",
        namespace,
        repo: "jetstack",
        version,
        fetchOpts: {
          repo: "https://charts.jetstack.io",
        },
        values: {},
      },
      { parent: this }
    );
  }
}
