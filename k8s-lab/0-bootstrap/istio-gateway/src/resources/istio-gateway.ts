import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Namespace } from "@pulumi/kubernetes/core/v1";

import { IstioGatewayConfig } from "../types";

import { Certificate } from "@k8s-lab/crds.cert-manager/certmanager/v1";
import { networking } from "@k8s-lab/crds.istio/types/input";
import { Gateway } from "@k8s-lab/crds.istio/networking/v1beta1";

type GatewaySpecServersArgs = networking.v1beta1.GatewaySpecServersArgs;

export class IstioGateway extends pulumi.ComponentResource {
  public namespace: kubernetes.core.v1.Namespace;

  constructor(
    { tls, namespace, version, selector }: IstioGatewayConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "istio-gateway";

    super("k8slab:infra:IstioGateway", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "istio-gateway-namespace",
      {
        metadata: {
          name: namespace,
        },
      },
      { parent: this }
    );

    const istioGateway = new kubernetes.helm.v3.Chart(
      "istio-gateway",
      {
        chart: "gateway",
        namespace,
        version,
        repo: "istio",
        fetchOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {},
      },
      {
        parent: this,
      }
    );

    var tlsServer: GatewaySpecServersArgs | undefined = undefined;

    if (tls && tls.enabled) {
      const tlsCert = new Certificate(
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

    const gateway = new Gateway(
      "istio-ingress-gateway",
      {
        metadata: {
          name,
          namespace,
        },
        spec: {
          selector,
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
        parent: this.namespace,
      }
    );
  }
}

// export type IstioIngressNetworkPolicyOpts = {
//   name: string;
//   istio: IstioGatewayResources;
//   targetDeployment: Deployment;
// };

// export function istioIngressNetworkPolicy({
//   name,
//   istio,
//   targetDeployment,
// }: IstioIngressNetworkPolicyOpts): NetworkPolicy {
//   return new kubernetes.networking.v1.NetworkPolicy(
//     `${name}-istio-ingress-only`,
//     {
//       metadata: {
//         name,
//         namespace: targetDeployment.metadata.namespace,
//         labels: targetDeployment.metadata.labels,
//       },
//       spec: {
//         policyTypes: ["Ingress"],
//         podSelector: {
//           matchLabels: targetDeployment.spec.selector.matchLabels,
//         },
//         ingress: [
//           {
//             from: [
//               {
//                 namespaceSelector: {
//                   matchLabels: istio.namespace.metadata.name.apply(
//                     (namespace) => {
//                       return {
//                         "kubernetes.io/metadata.name": namespace,
//                       };
//                     }
//                   ),
//                 },
//               },
//               {
//                 podSelector: {
//                   matchLabels: istio.labels,
//                 },
//               },
//             ],
//           },
//         ],
//       },
//     },
//     { parent: targetDeployment }
//   );
// }
