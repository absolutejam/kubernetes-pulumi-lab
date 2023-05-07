import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Gateway } from "../../crds/istio/networking/v1beta1";
import { IstioConfig } from "../../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export type IstioResources = {
  type: "istio";
  namespace: Namespace;
  gateway: Gateway;
  prometheusAddon: IstioPrometheusAddon;
  istioBase: kubernetes.helm.v3.Release;
  istiod: kubernetes.helm.v3.Release;
  istioGateway: kubernetes.helm.v3.Release;
};

export class Istio extends pulumi.ComponentResource implements IstioResources {
  public type = "istio" as const;

  public namespace: Namespace;
  public gateway: Gateway;
  public prometheusAddon: IstioPrometheusAddon;
  public istioBase: kubernetes.helm.v3.Release;
  public istiod: kubernetes.helm.v3.Release;
  public istioGateway: kubernetes.helm.v3.Release;

  constructor({ namespace, version, labels }: IstioConfig) {
    super("k8slab:infra:Istio", "istio", {}, {});

    this.namespace = new kubernetes.core.v1.Namespace(
      "istio-namespace",
      {
        metadata: { name: namespace },
      },
      { parent: this }
    );

    this.istioBase = new kubernetes.helm.v3.Release(
      "istio-base",
      {
        name: "istio-base",
        description: "istio base",
        chart: "base",
        namespace: this.namespace.metadata.name,
        version,
        repositoryOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {},
      },
      { parent: this.namespace, dependsOn: [this.namespace] }
    );

    this.istiod = new kubernetes.helm.v3.Release(
      "istiod",
      {
        name: "istiod",
        description: "istiod",
        chart: "istiod",
        namespace: this.namespace.metadata.name,
        version,
        repositoryOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {},
      },
      { parent: this.namespace, dependsOn: [this.namespace, this.istioBase] }
    );

    this.istioGateway = new kubernetes.helm.v3.Release(
      "istio-gateway",
      {
        name: "istio-gateway",
        description: "istio-gateway",
        chart: "gateway",
        // TODO: Should this be a separate namespace, eg. `istio-ingress`?
        namespace: this.namespace.metadata.name,
        version,
        repositoryOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {},
      },
      {
        parent: this.namespace,
        dependsOn: [this.namespace, this.istioBase, this.istiod],
      }
    );

    this.gateway = new Gateway(
      "istio-ingress-gateway",
      {
        metadata: {
          name: "istio-ingress-gateway",
          namespace: this.namespace.metadata.name,
        },
        spec: {
          selector: labels,
          servers: [
            {
              hosts: ["*"],
              port: {
                number: 80,
                name: "http",
                protocol: "HTTP",
              },
            },
            // {
            //     port: {
            //         number: 443,
            //         name: "https",
            //         protocol: "HTTPS",
            //     },
            //     hosts: ["*"],
            // },
          ],
        },
      },
      {
        parent: this.namespace,
        dependsOn: [this.istioBase, this.istiod, this.istioGateway],
      }
    );

    this.prometheusAddon = new IstioPrometheusAddon({
      parent: this,
      dependsOn: [this.istioBase, this.istiod],
    });
  }
}

export class IstioPrometheusAddon extends pulumi.ComponentResource {
  public prometheusAddon: kubernetes.yaml.ConfigFile;

  constructor(opts?: pulumi.ComponentResourceOptions) {
    super("k8slab:infra:IstioPrometheusAddon", "istio-prometheus", {}, opts);

    this.prometheusAddon = new kubernetes.yaml.ConfigFile(
      "prometheus-addon",
      {
        file: "https://raw.githubusercontent.com/istio/istio/release-1.17/samples/addons/prometheus.yaml",
      },
      { parent: this }
    );
  }
}
