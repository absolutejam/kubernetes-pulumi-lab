import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { ReflectorConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export class Reflector extends pulumi.ComponentResource {
  public namespace: Namespace;
  public reflector: kubernetes.helm.v3.Chart;

  constructor(
    { namespace, version }: ReflectorConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "reflector";

    super("k8slab:infra:Reflector", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "reflector-namespace",
      {
        metadata: {
          name: namespace,
          labels: {
            "istio-injection": "enabled",
          },
        },
      },
      { parent: this }
    );

    this.reflector = new kubernetes.helm.v3.Chart(
      name,
      {
        chart: "reflector",
        namespace,
        version,
        repo: "emberstack",
        fetchOpts: {
          repo: "https://emberstack.github.io/helm-charts",
        },
        // https://docs.gitea.io/en-us/administration/config-cheat-sheet/
        values: {},
      },
      {
        parent: this.namespace,
        dependsOn: [this.namespace],
      }
    );
  }
}
