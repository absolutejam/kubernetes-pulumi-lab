import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { TrustManagerConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export class TrustManager extends pulumi.ComponentResource {
  public namespace: Namespace;
  public trustManager: kubernetes.helm.v3.Chart;

  constructor(
    { namespace, version }: TrustManagerConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "trust-manager";

    super("k8slab:infra:TrustManager", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "trust-manager-namespace",
      {
        metadata: {
          name: namespace,
        },
      },
      { parent: this }
    );

    this.trustManager = new kubernetes.helm.v3.Chart(
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
      { parent: this, dependsOn: [this.namespace] }
    );
  }
}
