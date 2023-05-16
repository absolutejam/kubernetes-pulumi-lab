import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { IstioConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export type IstioOpts = {
  version?: string;
};

export class Istio extends pulumi.ComponentResource {
  public namespace: Namespace;
  public istioBase: kubernetes.helm.v3.Chart;
  public istiod: kubernetes.helm.v3.Chart;

  constructor(
    { namespace, version }: IstioConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "istio";

    super("k8slab:infra:Istio", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "istio-namespace",
      {
        metadata: { name: namespace },
      },
      { parent: this }
    );

    this.istioBase = new kubernetes.helm.v3.Chart(
      "istio-base",
      {
        chart: "base",
        namespace,
        version,
        repo: "istio",
        fetchOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {
          meshConfig: {
            enablePrometheusMerge: true,
          },
        },
      },
      { parent: this.namespace, dependsOn: [this.namespace] }
    );

    this.istiod = new kubernetes.helm.v3.Chart(
      "istiod",
      {
        chart: "istiod",
        namespace,
        version,
        repo: "istio",
        fetchOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {
          meshConfig: {
            enablePrometheusMerge: true,
          },
        },
      },
      { parent: this.namespace, dependsOn: [this.namespace, this.istioBase] }
    );
  }
}
