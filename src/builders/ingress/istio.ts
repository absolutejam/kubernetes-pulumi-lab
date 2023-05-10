import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Gateway } from "../../crds/istio/networking/v1beta1";
import { IstioConfig } from "../../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export type IstioResources = {
  type: "istio";
  namespace: Namespace;
  gateway: Gateway;
  istioBase: kubernetes.helm.v3.Chart;
  istiod: kubernetes.helm.v3.Chart;
  istioGateway: kubernetes.helm.v3.Chart;
};

export class Istio extends pulumi.ComponentResource implements IstioResources {
  public type = "istio" as const;

  public namespace: Namespace;
  public gateway: Gateway;
  public istioBase: kubernetes.helm.v3.Chart;
  public istiod: kubernetes.helm.v3.Chart;
  public istioGateway: kubernetes.helm.v3.Chart;

  constructor({ namespace, version, labels }: IstioConfig) {
    super("k8slab:infra:Istio", "istio", {}, {});

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

    this.istioGateway = new kubernetes.helm.v3.Chart(
      "istio-gateway",
      {
        chart: "gateway",
        // TODO: Should this be a separate namespace, eg. `istio-ingress`?
        namespace: this.namespace.metadata.name,
        version,
        repo: "istio",
        fetchOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {},
      },
      {
        parent: this.namespace,
        dependsOn: [this.namespace, this.istioBase, this.istiod],
        transformations: [
          ({
            props,
            opts,
          }: pulumi.ResourceTransformationArgs):
            | pulumi.ResourceTransformationResult
            | undefined => {
            if (
              props.kind === "Deployment" &&
              props.metadata?.name === "istio-gateway"
            ) {
              props.metadata.annotations = {
                "pulumi.com/skipAwait": "true",
              };

              return { props, opts };
            }

            return undefined;
          },
        ],
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
  }
}
