import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { SealedSecretsConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export type SealedSecretsOpts = {
  version?: string;
};

export class SealedSecrets extends pulumi.ComponentResource {
  public namespace: Namespace;
  public argoCd: kubernetes.helm.v3.Chart;

  constructor(
    { namespace, version }: SealedSecretsConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "sealed-secrets";

    super("k8slab:infra:SealedSecrets", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "sealed-secrets-namespace",
      {
        metadata: { name: namespace },
      },
      { parent: this }
    );

    this.argoCd = new kubernetes.helm.v3.Chart(
      "sealed-secrets",
      {
        chart: "sealed-secrets",
        namespace,
        version,
        repo: "sealed-secrets",
        fetchOpts: {
          repo: "https://bitnami-labs.github.io/sealed-secrets",
        },
        // https://github.com/bitnami-labs/sealed-secrets/blob/main/helm/sealed-secrets/values.yaml
        values: {},
      },
      { parent: this.namespace, dependsOn: [this.namespace] }
    );
  }
}
