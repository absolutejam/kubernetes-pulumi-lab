import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { IstioConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

import { ProxyConfig } from "@k8s-lab/crds.istio/networking/v1beta1";

export type IstioOpts = {
  version?: string;
};

export class Istio extends pulumi.ComponentResource {
  public namespace: Namespace;
  public istioBase: kubernetes.helm.v3.Chart;
  public istiod: kubernetes.helm.v3.Chart;
  public proxyConfig: ProxyConfig;

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
        values: {},
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
          sidecarInjectorWebhook: {
            // auto inject into all namespaces unless disabled with label
            enableNamespacesByDefault: false,
          },
          meshConfig: {
            enablePrometheusMerge: true,
          },
        },
      },
      { parent: this.namespace, dependsOn: [this.namespace, this.istioBase] }
    );

    this.proxyConfig = new ProxyConfig(
      "mesh-proxy-config",
      {
        metadata: {
          name: "mesh-proxy-config",
          namespace,
        },
        spec: {
          environmentVariables: {
            ISTIO_META_DNS_CAPTURE: "true",
            ISTIO_META_DNS_AUTO_ALLOCATE: "true",
          },
        },
      },
      { parent: this.namespace }
    );
  }
}
