import * as pulumi from "@pulumi/pulumi";

import { VirtualService } from "../../crds/istio/networking/v1beta1";
import { IstioGatewayResources } from "../../resources/cert-manager/ingress";

export type IstioRoutesOpts = {
  namespace: string;
  destinations: Destination[];
  istio: IstioGatewayResources;
};

export type IstioRoutesResources = {
  virtualService: VirtualService;
};

export class IstioRoutes
  extends pulumi.ComponentResource
  implements IstioRoutesResources
{
  public virtualService: VirtualService;

  constructor(
    name: string,
    { namespace, destinations, istio }: IstioRoutesOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("k8slab:infra:IstioRoutes", name, {}, opts);

    this.virtualService = new VirtualService(
      `${name}-virtualservice`,
      {
        metadata: {
          name,
          namespace,
        },
        spec: {
          hosts: ["*"],
          gateways: [istio.gatewayFullName],
          http: destinations.map(
            ({ name, host, strip = true, prefix, port }) => ({
              name: name,
              match: [{ uri: { prefix } }],
              ...(strip ? { rewrite: { uri: "/" } } : {}),
              route: [
                {
                  destination: {
                    host: `${host}.${namespace}.svc.cluster.local`,
                    port: { number: port },
                  },
                },
              ],
            })
          ),
        },
      },
      { parent: this }
    );
  }
}
