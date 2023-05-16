import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { IstioConfig } from "../../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export type IstioOpts = {
  version?: string;
};

export type IstioResources = {
  namespace: Namespace;
  istioBase: kubernetes.helm.v3.Chart;
  istiod: kubernetes.helm.v3.Chart;
};

export class Istio extends pulumi.ComponentResource implements IstioResources {
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
        namespace: this.namespace.metadata.name,
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
        namespace: this.namespace.metadata.name,
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
