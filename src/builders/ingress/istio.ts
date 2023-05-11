import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Namespace } from "@pulumi/kubernetes/core/v1";
import { Deployment } from "@pulumi/kubernetes/apps/v1";
import { NetworkPolicy } from "@pulumi/kubernetes/networking/v1";

import { Gateway } from "../../crds/istio/networking/v1beta1";
import { Certificate } from "../../crds/cert-manager/certmanager/v1";
import { IstioGatewayConfig } from "../../types";

import { networking } from "../../crds/istio/types/input";
type GatewaySpecServersArgs = networking.v1beta1.GatewaySpecServersArgs;

export type IstioGatewayResources = {
  type: "istio";
  /**
   * The namespace that was used, either created or using an existing namespace
   */
  namespace:
    | { kind: "name"; name: string }
    | { kind: "resource"; namespace: Namespace };
  gateway: Gateway;
  istioGateway: kubernetes.helm.v3.Chart;
  labels: Record<string, string>;
  tlsCert: Certificate | undefined;
};

export class IstioGateway
  extends pulumi.ComponentResource
  implements IstioGatewayResources
{
  public type = "istio" as const;
  public namespace:
    | { kind: "name"; name: string }
    | { kind: "resource"; namespace: Namespace };
  public gateway: Gateway;
  public istioGateway: kubernetes.helm.v3.Chart;
  public labels: Record<string, string>;
  public tlsCert: Certificate | undefined;

  constructor(
    { tls, namespace, createNamespace, version, labels }: IstioGatewayConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("k8slab:infra:IstioGateway", "istio-gateway", {}, opts);

    this.labels = labels;

    // Frustratingly, Pulumi's resource getters (eg. `Namespace.get`) don't
    // seem to respect dependency ordering, so if you try to call it and the
    // resource exists, the entire thing blows up.
    if (createNamespace) {
      const namespaceResource = new kubernetes.core.v1.Namespace(
        "istio-gateway-namespace",
        {
          metadata: {
            name: namespace,
            labels,
          },
        },
        { parent: this }
      );

      this.namespace = { kind: "resource", namespace: namespaceResource };
    } else {
      this.namespace = { kind: "name", name: namespace };
    }

    this.istioGateway = new kubernetes.helm.v3.Chart(
      "istio-gateway",
      {
        chart: "gateway",

        // TODO: Should this be a separate namespace, eg. `istio-ingress`?
        namespace,
        version,
        repo: "istio",
        fetchOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {},
      },
      {
        parent:
          this.namespace.kind === "resource" ? this.namespace.namespace : this,
        dependsOn:
          this.namespace.kind === "resource" ? [this.namespace.namespace] : [],
        transformations: [
          /**
           * Don't wait for the deployment to be ready because the first
           * time it is spun-up, it will
           */
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

    var tlsServer: GatewaySpecServersArgs | undefined = undefined;

    if (tls && tls.enabled) {
      this.tlsCert = new Certificate(
        "istio-ingress-tls-cert",
        {
          metadata: {
            name: "istio-ingress-tls-cert",
            namespace,
          },
          spec: {
            secretName: tls.certSecretName,
            commonName: tls.commonName,
            dnsNames: tls.hostnames,
            issuerRef: {
              kind: tls.issuerKind,
              name: tls.issuerName,
              group: "cert-manager.io",
            },
          },
        },
        { parent: this }
      );

      tlsServer = {
        port: {
          number: 443,
          name: "https",
          protocol: "HTTPS",
        },
        tls: {
          mode: "SIMPLE",
          credentialName: tls.certSecretName,
        },
        hosts: tls.hostnames,
      };
    }

    this.gateway = new Gateway(
      "istio-ingress-gateway",
      {
        metadata: {
          name: "istio-ingress-gateway",
          namespace,
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

            ...(tlsServer ? [tlsServer] : []),
          ],
        },
      },
      {
        parent:
          this.namespace.kind === "resource" ? this.namespace.namespace : this,
        dependsOn:
          this.namespace.kind === "resource" ? [this.namespace.namespace] : [],
      }
    );
  }
}

export type IstioIngressNetworkPolicyOpts = {
  name: string;
  istio: IstioGatewayResources;
  targetDeployment: Deployment;
};

export function istioIngressNetworkPolicy({
  name,
  istio,
  targetDeployment,
}: IstioIngressNetworkPolicyOpts): NetworkPolicy {
  const namespace: pulumi.Output<string> = (() => {
    switch (istio.namespace.kind) {
      case "name":
        return pulumi.Output.create(istio.namespace.name);

      case "resource":
        return istio.namespace.namespace.metadata.name;
    }
  })();

  return new kubernetes.networking.v1.NetworkPolicy(
    `${name}-istio-ingress-only`,
    {
      metadata: {
        name,
        namespace: targetDeployment.metadata.namespace,
        labels: targetDeployment.metadata.labels,
      },
      spec: {
        policyTypes: ["Ingress"],
        podSelector: {
          matchLabels: targetDeployment.spec.selector.matchLabels,
        },
        ingress: [
          {
            from: [
              {
                namespaceSelector: {
                  matchLabels: namespace.apply((namespace) => {
                    return {
                      "kubernetes.io/metadata.name": namespace,
                    };
                  }),
                },
              },
              {
                podSelector: {
                  matchLabels: istio.labels,
                },
              },
            ],
          },
        ],
      },
    },
    { parent: targetDeployment }
  );
}
