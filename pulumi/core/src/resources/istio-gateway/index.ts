import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Namespace } from "@pulumi/kubernetes/core/v1";
import { Deployment } from "@pulumi/kubernetes/apps/v1";
import { NetworkPolicy } from "@pulumi/kubernetes/networking/v1";

import { ObjectMeta } from "../../crds/istio/meta/v1";
import { Gateway } from "../../crds/istio/networking/v1beta1";
import { Certificate } from "../../crds/cert-manager/certmanager/v1";
import { IstioGatewayConfig } from "../../types";

import { networking } from "../../crds/istio/types/input";
type GatewaySpecServersArgs = networking.v1beta1.GatewaySpecServersArgs;

export class IstioGateway extends pulumi.ComponentResource {
  constructor(
    { tls, namespace: ns, version, labels }: IstioGatewayConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "istio-gateway";

    super("k8slab:infra:IstioGateway", name, {}, opts);

    // Frustratingly, Pulumi's resource getters (eg. `Namespace.get`) don't
    // seem to respect dependency ordering, so if you try to call it and the
    // resource exists, the entire thing blows up.
    const namespace = new kubernetes.core.v1.Namespace(
      "istio-gateway-namespace",
      {
        metadata: {
          name: ns,
          labels,
        },
      },
      { parent: this }
    );

    const istioGateway = new kubernetes.helm.v3.Chart(
      "istio-gateway",
      {
        chart: "gateway",
        namespace: ns,
        version,
        repo: "istio",
        fetchOpts: {
          repo: "https://istio-release.storage.googleapis.com/charts",
        },
        values: {},
      },
      {
        parent: namespace,
      }
    );

    var tlsServer: GatewaySpecServersArgs | undefined = undefined;

    if (tls && tls.enabled) {
      const tlsCert = new Certificate(
        "istio-ingress-tls-cert",
        {
          metadata: {
            name: "istio-ingress-tls-cert",
            namespace: ns,
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
          namespace: ns,
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
        parent: namespace,
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
