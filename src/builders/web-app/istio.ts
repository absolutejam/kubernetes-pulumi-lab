import * as pulumi from "@pulumi/pulumi";
import {
  VirtualService,
  DestinationRule,
} from "../../crds/istio/networking/v1beta1";
import { WebAppResources } from "./app";
import { IstioResources } from "../ingress/istio";
import { ObjectMeta } from "../../crds/istio/meta/v1";

export type WebAppIstioResources = {
  type: "istio";
  virtualService: VirtualService;
};

export type WebAppIstioOpts = {
  environment: string;
  istio: IstioResources;
} & Pick<WebAppResources, "namespace" | "deployment" | "service">;

export class WebAppIstio
  extends pulumi.ComponentResource
  implements WebAppIstioResources
{
  public type = "istio" as const;
  public virtualService: VirtualService;

  constructor(
    name: string,
    { environment, namespace, deployment, istio, service }: WebAppIstioOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("k8slab:app:WebAppIstioRoutes", name, {}, opts);

    const labels = service.metadata.labels;

    this.virtualService = new VirtualService(
      `${name}-virtualservice`,
      {
        metadata: {
          name,
          namespace: namespace.metadata.name,
          labels,
        },
        spec: {
          hosts: ["*"],
          gateways: [
            (istio.gateway.metadata as pulumi.Output<ObjectMeta>).apply(
              ({ name, namespace }) => `${namespace}/${name}`
            ),
          ],
          http: [
            {
              name: "web-app-" + environment,
              rewrite: { uri: "/" },
              match: [{ uri: { prefix: "/" + environment } }],
              route: [
                {
                  destination: {
                    host: service.metadata.name,
                    port: { number: 80 },
                  },
                },
              ],
            },
          ],
        },
      },
      { parent: this, dependsOn: [deployment] }
    );

    // const destinationRule = new DestinationRule(
    //     `${name}-test`,
    //     {
    //         metadata: {
    //             name,
    //             namespace: namespace.metadata.name,
    //         },
    //         spec: {
    //             subsets: [

    //             ]
    //         },
    //     },
    //     { parent: namespace }
    // );
  }
}
