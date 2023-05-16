import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { ArgoCdConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export type ArgoCdOpts = {
  version?: string;
};

export class ArgoCd extends pulumi.ComponentResource {
  public namespace: Namespace;
  public argoCd: kubernetes.helm.v3.Chart;

  constructor(
    { namespace, version, labels }: ArgoCdConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "istio";

    super("k8slab:infra:ArgoCd", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "argocd-namespace",
      {
        metadata: { name: namespace },
      },
      { parent: this }
    );

    this.argoCd = new kubernetes.helm.v3.Chart(
      "argo",
      {
        chart: "argo-cd",
        namespace,
        version,
        repo: "argo",
        fetchOpts: {
          repo: "https://argoproj.github.io/argo-helm",
        },
        // https://github.com/argoproj/argo-helm/blob/main/charts/argo-cd/values.yaml
        values: {
          global: {
            additionalLabels: labels || {},
          },
        },
      },
      { parent: this.namespace, dependsOn: [this.namespace] }
    );
  }
}
