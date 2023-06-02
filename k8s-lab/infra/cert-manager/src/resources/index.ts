import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { CertManagerConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export class CertManager extends pulumi.ComponentResource {
  public namespace: Namespace;
  public certManager: kubernetes.helm.v3.Chart;

  constructor(
    { namespace, version }: CertManagerConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "cert-manager";

    super("k8slab:infra:CertManager", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "cert-manager-namespace",
      {
        metadata: {
          name: namespace,
        },
      },
      { parent: this }
    );

    this.certManager = new kubernetes.helm.v3.Chart(
      "cert-manager",
      {
        chart: "cert-manager",
        namespace,
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
